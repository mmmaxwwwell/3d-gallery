#!/usr/bin/env node
// Build STL + 3MF artifacts for every model under models/<slug>/.
//
// The manifest (models/manifest.json) is the source of truth. Each part/preview
// entry has a `format` field ("stl" or "3mf") that determines the build pipeline:
//   - "stl"  → openscad -o <name>.stl <source>.scad
//   - "3mf"  → multicolor 3MF via build-multicolor-3mf.mjs
//
// Source .scad files are located by matching the output filename (minus extension)
// against files in parts/ and previews/ directories.
//
// Output: models/<slug>/build/*.{stl,3mf}
// After building, we copy each model's build/ into public/models/<slug>/ so
// Vite serves them at /3d-gallery/models/<slug>/<file>.

import { readFileSync, readdirSync, statSync, mkdirSync, cpSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { buildMulticolor3mf } from "./build-multicolor-3mf.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const MODELS_DIR = join(ROOT, "models");
const PUBLIC_MODELS_DIR = join(ROOT, "public", "models");

function loadManifest() {
  const raw = readFileSync(join(MODELS_DIR, "manifest.json"), "utf8");
  return JSON.parse(raw);
}

/** Find the .scad source for a given base name in parts/ or previews/. */
function findScadSource(modelDir, baseName) {
  for (const sub of ["parts", "previews"]) {
    const candidate = join(modelDir, sub, `${baseName}.scad`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function buildModel(model) {
  const slug = model.slug;
  const dir = join(MODELS_DIR, slug);
  const buildDir = join(dir, "build");
  mkdirSync(buildDir, { recursive: true });

  const allParts = [
    ...(model.previews ?? []),
    ...(model.parts ?? []),
  ];

  for (const part of allParts) {
    const format = part.format;
    // Derive base name from the output filename (e.g. "cap.3mf" → "cap")
    const baseName = part.file.replace(/\.\w+$/, "");
    const scadPath = findScadSource(dir, baseName);
    if (!scadPath) {
      console.warn(`  [skip] ${slug}/${part.file} — no .scad source found for "${baseName}"`);
      continue;
    }

    const out = join(buildDir, part.file);
    if (format === "3mf") {
      console.log(`  [3mf ] ${scadPath} → build/${part.file}`);
      buildMulticolor3mf({ scadPath, outPath: out });
    } else {
      console.log(`  [stl ] ${scadPath} → build/${part.file}`);
      execFileSync("openscad", ["-o", out, scadPath], { stdio: "inherit" });
    }
  }

  // Mirror into public/ for Vite to serve.
  const publicDir = join(PUBLIC_MODELS_DIR, slug);
  rmSync(publicDir, { recursive: true, force: true });
  mkdirSync(publicDir, { recursive: true });
  if (existsSync(buildDir)) {
    for (const f of readdirSync(buildDir)) {
      cpSync(join(buildDir, f), join(publicDir, f));
    }
  }
}

function main() {
  const manifest = loadManifest();
  if (!manifest.models || manifest.models.length === 0) {
    console.log("No models found in manifest.");
    return;
  }
  // Copy manifest.json into public/models/ so the viewer can fetch it.
  mkdirSync(PUBLIC_MODELS_DIR, { recursive: true });
  cpSync(join(MODELS_DIR, "manifest.json"), join(PUBLIC_MODELS_DIR, "manifest.json"));

  for (const model of manifest.models) {
    console.log(`Building ${model.slug}…`);
    buildModel(model);
  }
  console.log("Done.");
}

main();
