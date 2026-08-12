// Content-addressed build cache for openscad artifacts.
//
// Key = SHA-256(
//   scad file path (relative to repo root),
//   output format ("stl" / "3mf"),
//   scad source contents,
//   every locally-includable .scad file's contents (recursive),
//   openscad --version output,
//   OPENSCAD_ARGS,
// )
//
// Value = the built artifact bytes, on disk at .cache/models/<key>.<fmt>.
//
// External library includes (BOSL2/…, qr.scad) live outside the repo
// and don't get hashed — their content is pinned via the Nix flake,
// and any openscad rebuild in Nix moves the --version string, which
// invalidates every entry. In CI the same happens whenever the flake
// lockfile is bumped.
//
// The cache directory is gitignored. Wire it into `actions/cache` in
// CI with a key that hashes models/** + flake.lock so unchanged parts
// short-circuit even on fresh runners.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
export const CACHE_DIR = join(ROOT, ".cache", "models");

let cachedVersion = null;
function openscadVersion() {
  if (cachedVersion) return cachedVersion;
  try {
    cachedVersion = execFileSync("openscad", ["--version"], { encoding: "utf8" }).trim();
  } catch (e) {
    cachedVersion = "openscad-not-found";
  }
  return cachedVersion;
}

/**
 * Walk `include<…>` and `use<…>` refs relative to a scad file, hashing
 * every locally-resolvable dependency (skips absolute lib paths like
 * BOSL2/std.scad — those come from openscad's library path and get
 * pinned via openscad --version instead).
 */
function collectLocalIncludes(scadPath, visited) {
  if (visited.has(scadPath)) return;
  visited.add(scadPath);
  let source;
  try {
    source = readFileSync(scadPath, "utf8");
  } catch {
    return;
  }
  const re = /^\s*(?:include|use)\s*<([^>]+)>/gm;
  let m;
  while ((m = re.exec(source)) !== null) {
    const rel = m[1];
    // BOSL2/... and other library-path includes never contain "/../"
    // and don't resolve relative to the source file. Skip them.
    const abs = resolve(dirname(scadPath), rel);
    if (!existsSync(abs)) continue;
    collectLocalIncludes(abs, visited);
  }
}

function computeKey({ scadPath, format, args }) {
  const visited = new Set();
  collectLocalIncludes(scadPath, visited);

  const h = createHash("sha256");
  h.update(relative(ROOT, scadPath));
  h.update("\0");
  h.update(format);
  h.update("\0");
  h.update(openscadVersion());
  h.update("\0");
  h.update(args.join(" "));
  // Deterministic order for the file set so the same inputs → same key.
  for (const file of [...visited].sort()) {
    h.update("\0");
    h.update(relative(ROOT, file));
    h.update("\0");
    h.update(readFileSync(file));
  }
  return h.digest("hex");
}

/**
 * Return a path to a cached artifact if the current inputs hash to one
 * we already built, otherwise null.
 */
export function lookupCache({ scadPath, format, args }) {
  const key = computeKey({ scadPath, format, args });
  const path = join(CACHE_DIR, `${key}.${format}`);
  return existsSync(path) ? path : null;
}

/**
 * Store the freshly-built artifact under the cache key for these inputs.
 */
export function storeCache({ scadPath, format, args, outPath }) {
  const key = computeKey({ scadPath, format, args });
  mkdirSync(CACHE_DIR, { recursive: true });
  cpSync(outPath, join(CACHE_DIR, `${key}.${format}`));
}
