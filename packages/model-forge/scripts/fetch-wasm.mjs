// Download the OpenSCAD-WASM assets the Node fallback engine needs.
//
// They're ~25 MB, versioned with the upstream build rather than with this repo,
// and useless in a checkout that renders natively — so they're fetched on demand
// into a gitignored assets/ directory instead of being committed.
//
// Mirrors the pattern @3d-gallery/print-toolkit uses for libslic3r.
//
//   node scripts/fetch-wasm.mjs [--force]

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.OPENSCAD_WASM_BASE
  ?? "https://mmmaxwwwell.github.io/openscad-web-generator/wasm";

// openscad.js (the browser ES wrapper) is deliberately absent: it resolves its
// siblings with fetch() against import.meta.url, which does not work for file://
// URLs in Node. The engine loads openscad.wasm.js directly instead.
const FILES = [
  "openscad.wasm.js",
  "openscad.wasm",
  "openscad.fonts.js",
  "openscad.mcad.js",
  "openscad.bosl2.js",
  "openscad.qr.js",
];

const ASSETS = join(dirname(dirname(fileURLToPath(import.meta.url))), "assets");
const force = process.argv.includes("--force");

function present(path) {
  try {
    return statSync(path).size > 0;
  } catch {
    return false;
  }
}

async function main() {
  mkdirSync(ASSETS, { recursive: true });

  const missing = FILES.filter((f) => force || !present(join(ASSETS, f)));
  if (missing.length === 0) {
    console.log("[model-forge] OpenSCAD WASM assets already present. Use --force to re-download.");
    return;
  }

  console.log(`[model-forge] fetching ${missing.length} asset(s) from ${BASE}`);

  for (const file of missing) {
    const url = `${BASE}/${file}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    writeFileSync(join(ASSETS, file), bytes);
    console.log(`  ${file.padEnd(22)} ${(bytes.byteLength / 1048576).toFixed(1)} MB`);
  }

  // A manifest of what landed, so a corrupted or partial download is visible
  // rather than surfacing later as an opaque WASM instantiation failure.
  const digests = Object.fromEntries(FILES.map((f) => {
    const bytes = readFileSync(join(ASSETS, f));
    return [f, { bytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") }];
  }));
  writeFileSync(join(ASSETS, "assets.json"), `${JSON.stringify({ base: BASE, files: digests }, null, 2)}\n`);
  console.log("[model-forge] done.");
}

main().catch((err) => {
  console.error(`[model-forge] ${err.message}`);
  process.exitCode = 1;
});
