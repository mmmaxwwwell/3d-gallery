// Local pre-push "would CI pass?" gate.
//
// Mirrors the two GitHub Actions workflows (deploy.yml + e2e.yml). All
// steps run under `nix develop --command` so they use the same pinned
// toolchain CI does — no drift between local pass and CI fail.
//
// On success, writes .git/preflight-ok containing `git rev-parse HEAD`.
// The pre-push hook (.githooks/pre-push) reads that file: if it matches
// the SHA being pushed, the checks are skipped as already-verified.

import { spawnSync, execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const STEPS = [
  ["build:models", ["npm", "run", "build:models"]],
  ["test:build",   ["npm", "run", "test:build"]],
  ["vite build",   ["npx", "vite", "build"]],
  ["test:e2e",     ["npm", "run", "test:e2e"]],
];

const started = Date.now();

for (const [label, argv] of STEPS) {
  const stepStart = Date.now();
  process.stdout.write(`\n\x1b[1m▸ preflight: ${label}\x1b[0m\n`);
  const r = spawnSync("nix", ["develop", "--command", ...argv], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`\n\x1b[31m✗ preflight failed at "${label}" (exit ${r.status})\x1b[0m`);
    process.exit(1);
  }
  console.log(`\x1b[2m  ${label} ok (${((Date.now() - stepStart) / 1000).toFixed(1)}s)\x1b[0m`);
}

const sha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const gitDir = execSync("git rev-parse --git-dir", { encoding: "utf8" }).trim();
writeFileSync(resolve(gitDir, "preflight-ok"), sha + "\n");

const elapsed = ((Date.now() - started) / 1000).toFixed(1);
console.log(`\n\x1b[32m✓ preflight passed for ${sha} (${elapsed}s)\x1b[0m`);
console.log(`  wrote ${gitDir}/preflight-ok — next \`git push\` to main will skip the checks.`);
