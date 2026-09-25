// Build-regression test suite. Runs against the already-built
// artifacts under public/models/<slug>/ and asserts each one still
// matches its committed fingerprint baseline.
//
// Run:
//   npm run test:build              — verify against baseline.json
//   npm run test:build:baseline     — capture a fresh baseline (only
//                                     do this when you've intentionally
//                                     changed the model source)
//
// The baseline exists so optimizations to the build pipeline (cache
// layer, manifold engine, CSG-first multicolor) can be validated
// against a known-good pre-optimization output.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { test, describe } from "node:test";
import { equal, ok } from "node:assert/strict";

import { fingerprintStl, fingerprint3mf, compareFingerprint } from "./fingerprint.mjs";
import { buildViews } from "../../packages/model-core/src/index.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const PUBLIC_MODELS_DIR = join(ROOT, "public", "models");
const MANIFEST_PATH = join(PUBLIC_MODELS_DIR, "manifest.json");
const BASELINE_PATH = join(HERE, "baseline.json");

const UPDATE_BASELINE = process.env.TEST_UPDATE_BASELINE === "1";

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const baseline = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, "utf8"))
  : {};
const captured = {};

function fingerprintPart(rel, part) {
  const path = join(PUBLIC_MODELS_DIR, rel);
  ok(existsSync(path), `missing built artifact: ${path}`);
  return part.format === "3mf" ? fingerprint3mf(path) : fingerprintStl(path);
}

for (const model of manifest.models) {
  // A build's copies live under its own directory, since builds share names.
  const entries = buildViews(model).flatMap((view) =>
    [...view.previews, ...view.parts].map((part) => ({
      part,
      rel: [model.slug, view.build?.id, part.file].filter(Boolean).join("/"),
    })));
  describe(`${model.slug}`, () => {
    for (const { part, rel } of entries) {
      test(`${rel.slice(model.slug.length + 1)} (${part.format}) — fingerprint matches baseline`, () => {
        const key = rel;
        const fp = fingerprintPart(rel, part);
        captured[key] = fp;

        if (UPDATE_BASELINE) return; // capture-only mode

        const base = baseline[key];
        ok(base, `no baseline entry for ${key} — run TEST_UPDATE_BASELINE=1 npm run test:build first`);
        const err = compareFingerprint(base, fp);
        equal(err, null, err ?? "");
      });
    }
  });
}

// After every test file finishes, write out the captured fingerprints
// when in baseline-capture mode.
process.on("exit", () => {
  if (UPDATE_BASELINE) {
    const sorted = Object.fromEntries(Object.entries(captured).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(BASELINE_PATH, JSON.stringify(sorted, null, 2) + "\n");
    console.log(`\n✓ Wrote baseline for ${Object.keys(sorted).length} parts → ${BASELINE_PATH}`);
  }
});
