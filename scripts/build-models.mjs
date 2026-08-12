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

import { readFileSync, readdirSync, mkdirSync, cpSync, rmSync, existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { buildMulticolor3mf } from "./build-multicolor-3mf.mjs";

const execFileAsync = promisify(execFile);

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

async function buildPart({ slug, dir, buildDir, part }) {
  const format = part.format;
  const baseName = part.file.replace(/\.\w+$/, "");
  const scadPath = findScadSource(dir, baseName);
  if (!scadPath) {
    console.warn(`  [skip] ${slug}/${part.file} — no .scad source found for "${baseName}"`);
    return;
  }

  const out = join(buildDir, part.file);
  if (format === "3mf") {
    console.log(`  [3mf ] ${scadPath} → build/${part.file}`);
    await buildMulticolor3mf({ scadPath, outPath: out });
  } else {
    console.log(`  [stl ] ${scadPath} → build/${part.file}`);
    await execFileAsync("openscad", ["-o", out, scadPath]);
  }
}

async function buildModel(model) {
  const slug = model.slug;
  const dir = join(MODELS_DIR, slug);
  const buildDir = join(dir, "build");
  mkdirSync(buildDir, { recursive: true });

  const allParts = [
    ...(model.previews ?? []),
    ...(model.parts ?? []),
  ];

  // Build all parts in parallel
  await Promise.all(allParts.map(part => buildPart({ slug, dir, buildDir, part })));

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

async function main() {
  const manifest = loadManifest();
  if (!manifest.models || manifest.models.length === 0) {
    console.log("No models found in manifest.");
    return;
  }
  // Copy manifest.json into public/models/ so the viewer can fetch it. (Always
  // refreshed even for a single-model build, since it's the viewer's index.)
  mkdirSync(PUBLIC_MODELS_DIR, { recursive: true });
  cpSync(join(MODELS_DIR, "manifest.json"), join(PUBLIC_MODELS_DIR, "manifest.json"));

  // Optional slug filter: any CLI args (or the MODEL env var) restrict the
  // build to just those models, so working on one project doesn't rebuild the
  // whole app. `node build-models.mjs ryobi-drill-holder` builds only that one.
  const requested = [
    ...process.argv.slice(2),
    ...(process.env.MODEL ? [process.env.MODEL] : []),
  ];
  let models = manifest.models;
  if (requested.length > 0) {
    const known = new Set(manifest.models.map(m => m.slug));
    const unknown = requested.filter(s => !known.has(s));
    if (unknown.length > 0) {
      console.error(`Unknown model slug(s): ${unknown.join(", ")}`);
      console.error(`Available: ${manifest.models.map(m => m.slug).join(", ")}`);
      process.exitCode = 1;
      return;
    }
    const wanted = new Set(requested);
    models = manifest.models.filter(m => wanted.has(m.slug));
    console.log(`Building ${models.length} model(s): ${requested.join(", ")}`);
  }

  // Build the selected models in parallel
  await Promise.all(models.map(model => {
    console.log(`Building ${model.slug}…`);
    return buildModel(model);
  }));
  console.log("Done.");
}

main();
