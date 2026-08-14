// Local pre-push "would CI pass?" gate.
//
// Mirrors deploy.yml + e2e.yml: runs build:models, test:build, vite
// build, and test:e2e under `nix develop` — same pinned toolchain CI
// uses, so a green preflight ≈ a green CI.
//
// CRITICAL: preflight tests the COMMIT being pushed, not the working
// tree. It checks out the target SHA into a scratch worktree
// (.git/preflight-wt) and runs everything there. Uncommitted WIP in
// the main tree does not influence the result.
//
// Usage:
//   node scripts/preflight.mjs            # tests HEAD
//   node scripts/preflight.mjs <sha>      # tests <sha> (used by pre-push hook)
//
// On success writes .git/preflight-ok containing the SHA. The pre-push
// hook reads that file: if it matches the SHA being pushed, checks are
// skipped as already-verified.

import { spawnSync, execFileSync } from "node:child_process";
import { writeFileSync, existsSync, symlinkSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const REPO_ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const GIT_DIR = resolve(REPO_ROOT, execFileSync("git", ["rev-parse", "--git-dir"], { encoding: "utf8" }).trim());
const TARGET_SHA = (process.argv[2] || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim()).trim();

// Live outside .git/ and outside the main repo: vite's fs.allow list
// rejects anything under .git/, and putting it inside the repo root
// would confuse the scad watcher.
const WORKTREE = resolve(tmpdir(), `3d-gallery-preflight-${TARGET_SHA.slice(0, 12)}`);

function removeWorktree() {
  try { execFileSync("git", ["worktree", "remove", "-f", WORKTREE], { stdio: "pipe" }); } catch {}
  try { rmSync(WORKTREE, { recursive: true, force: true }); } catch {}
}

removeWorktree(); // clear any stale worktree from a prior aborted run
process.on("exit", removeWorktree);
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { removeWorktree(); process.exit(1); });

console.log(`\x1b[1m▸ preflight: worktree ${WORKTREE} @ ${TARGET_SHA}\x1b[0m`);
execFileSync("git", ["worktree", "add", "-f", "--detach", WORKTREE, TARGET_SHA], { stdio: "inherit" });

// Share heavy caches with the main worktree so preflight is fast on
// re-runs. Both are directories the CI actions cache too.
for (const share of ["node_modules", ".cache"]) {
  const src = resolve(REPO_ROOT, share);
  const dst = resolve(WORKTREE, share);
  if (existsSync(src) && !existsSync(dst)) symlinkSync(src, dst);
}

const STEPS = [
  ["build:models", ["npm", "run", "build:models"]],
  ["test:build",   ["npm", "run", "test:build"]],
  ["vite build",   ["npx", "vite", "build"]],
  ["test:e2e",     ["npm", "run", "test:e2e"]],
];

// CI=1 makes Playwright pick the 2-worker + retries=1 profile from
// playwright.config.ts, matching what actions/runner uses. Without
// this, local runs use 3 workers + retries=0 and see WASM-contention
// flakiness that CI never hits — preflight would false-alarm.
//
// E2E_PORT isolates preflight's dev server from any long-running
// `npm run dev` the user has on 5173.
const env = { ...process.env, CI: "1", E2E_PORT: "5199" };

const started = Date.now();
for (const [label, argv] of STEPS) {
  const stepStart = Date.now();
  process.stdout.write(`\n\x1b[1m▸ preflight: ${label}\x1b[0m\n`);
  const r = spawnSync("nix", ["develop", "--command", ...argv], { stdio: "inherit", cwd: WORKTREE, env });
  if (r.status !== 0) {
    console.error(`\n\x1b[31m✗ preflight failed at "${label}" (exit ${r.status})\x1b[0m`);
    process.exit(1);
  }
  console.log(`\x1b[2m  ${label} ok (${((Date.now() - stepStart) / 1000).toFixed(1)}s)\x1b[0m`);
}

writeFileSync(resolve(GIT_DIR, "preflight-ok"), TARGET_SHA + "\n");

const elapsed = ((Date.now() - started) / 1000).toFixed(1);
console.log(`\n\x1b[32m✓ preflight passed for ${TARGET_SHA} (${elapsed}s)\x1b[0m`);
console.log(`  wrote ${GIT_DIR}/preflight-ok — \`git push\` of this SHA to main will skip the checks.`);
