// Render every model's declared artifacts and lay them out where the site
// expects them.
//
// Rendering and caching live in @3d-gallery/model-forge, so this script and the
// dev server share one pipeline and one content-addressed cache. What stays here
// is the naming convention the rest of the repo depends on:
//
//   models/<slug>/build/<file>    per-model output, used by tests/build/
//   public/models/<slug>/<file>   what Vite serves and the PWA precaches
//   public/models/manifest.json   the runtime manifest — authored entries plus
//                                 source digests, param schemas and keys
//   public/a/<key>.<format>       the same artifacts addressed by key, for
//                                 clients that resolve through the cache
//
// The cache is keyed by source content and parameters, not by file path, so a
// rename or an unrelated edit elsewhere in the repo doesn't invalidate anything.
//
// Usage:  node scripts/build-models.mjs [slug...]     (or MODEL=<slug>)

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createForge, targetOf } from "../packages/model-forge/src/index.ts";
import { embedUrlInFile } from "./embed-source-url.mjs";

// Canonical deployed origin — GitHub Pages URL for this repo. The gallery
// frontend uses the same buildUrl() shape (?model=<slug>&part=<module>), so
// scanning a printed part's embedded URL lands on its page with the right
// model + part preselected.
const SITE_URL = "https://mmmaxwwwell.github.io/3d-gallery/";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MODELS_DIR = join(ROOT, "models");
const PUBLIC_MODELS_DIR = join(ROOT, "public", "models");
const PUBLIC_ARTIFACTS_DIR = join(ROOT, "public", "a");

// The browser resolves artifacts by absolute URL, so the deployed base path has
// to be baked into the manifest. SITE_URL already carries it — deriving it here
// keeps the two from drifting apart.
const ARTIFACT_BASE = new URL("a/", SITE_URL).pathname;

export function loadManifest() {
  return createForge({ root: ROOT }).manifest;
}

function allParts(model) {
  return [...(model.previews ?? []), ...(model.parts ?? [])];
}

/**
 * Render one model and mirror it into build/ and public/.
 *
 * Exported for the dev server, which rebuilds a single slug on save.
 */
export async function buildModel(model, forge = createForge({ root: ROOT })) {
  const buildDir = join(MODELS_DIR, model.slug, "build");
  mkdirSync(buildDir, { recursive: true });

  await Promise.all(allParts(model).map(async (part) => {
    const target = targetOf(part);
    const result = await forge.ensure({ slug: model.slug, target, format: part.format });
    const out = join(buildDir, part.file);
    cpSync(result.path, out);

    // Injected after copying, never into the cache: the permalink depends on the
    // manifest's module name and the site URL, neither of which changes what
    // OpenSCAD produced. Keeping it out of the cached bytes means renaming a
    // module doesn't invalidate the geometry.
    const url = new URL(SITE_URL);
    url.searchParams.set("model", model.slug);
    if (part.module) url.searchParams.set("part", part.module);
    embedUrlInFile(out, part.format, url.toString());

    console.log(`  [${result.status === "hit" ? "cache" : part.format.padEnd(5)}] ${model.slug}/${part.file}`);
  }));

  const publicDir = join(PUBLIC_MODELS_DIR, model.slug);
  rmSync(publicDir, { recursive: true, force: true });
  mkdirSync(publicDir, { recursive: true });
  if (existsSync(buildDir)) {
    for (const f of readdirSync(buildDir)) cpSync(join(buildDir, f), join(publicDir, f));
  }
}

/**
 * Mirror every artifact the manifest declares into `public/a/<key>.<format>`.
 *
 * Copied straight out of the store, without the permalink the named outputs
 * carry: the key addresses what OpenSCAD produced, so the bytes behind it have
 * to match everywhere — including what the dev server's artifact route serves.
 */
async function emitArtifacts(forge, models) {
  const slugs = new Set(models.map((m) => m.slug));
  const requests = forge.declaredRequests().filter((req) => slugs.has(req.slug));

  mkdirSync(PUBLIC_ARTIFACTS_DIR, { recursive: true });

  let bytes = 0;
  await Promise.all(requests.map(async (req) => {
    const result = await forge.ensure(req);
    cpSync(result.path, join(PUBLIC_ARTIFACTS_DIR, `${result.key}.${result.format}`));
    bytes += result.bytes.byteLength;
  }));

  return { count: requests.length, bytes };
}

async function main() {
  // Publishing forge: `devOnly` models are dropped, so they are never rendered,
  // never mirrored into public/, and never named in the manifest the site ships.
  const forge = createForge({ root: ROOT, artifactBase: ARTIFACT_BASE, includeDevOnly: false });
  const manifest = forge.manifest;

  if (manifest.models.length === 0) {
    console.log("No models found in manifest.");
    return;
  }

  mkdirSync(PUBLIC_MODELS_DIR, { recursive: true });

  const requested = [...process.argv.slice(2), ...(process.env.MODEL ? [process.env.MODEL] : [])];
  let models = manifest.models;

  if (requested.length > 0) {
    const known = new Set(manifest.models.map((m) => m.slug));
    const unknown = requested.filter((s) => !known.has(s));
    if (unknown.length > 0) {
      console.error(`Unknown model slug(s): ${unknown.join(", ")}`);
      console.error(`Available: ${manifest.models.map((m) => m.slug).join(", ")}`);
      process.exitCode = 1;
      return;
    }
    models = manifest.models.filter((m) => requested.includes(m.slug));
    console.log(`Building ${models.length} model(s): ${requested.join(", ")}`);
  }

  // A full build owns the whole tree, so stale keys from an earlier source
  // revision go away. A single-slug build leaves the other models' copies alone.
  if (requested.length === 0) {
    rmSync(PUBLIC_ARTIFACTS_DIR, { recursive: true, force: true });
    // Same for a model that has left the manifest — or turned dev-only — since
    // the last build: its copy would otherwise keep being served and precached.
    const published = new Set(manifest.models.map((m) => m.slug));
    for (const entry of readdirSync(PUBLIC_MODELS_DIR, { withFileTypes: true })) {
      if (entry.isDirectory() && !published.has(entry.name)) {
        rmSync(join(PUBLIC_MODELS_DIR, entry.name), { recursive: true, force: true });
      }
    }
  }

  const started = Date.now();
  await Promise.all(models.map((model) => {
    console.log(`Building ${model.slug}…`);
    return buildModel(model, forge);
  }));

  const emitted = await emitArtifacts(forge, models);
  console.log(`Emitted ${emitted.count} content-addressed artifacts to public/a (${emitted.bytes} bytes, ${(emitted.bytes / 1048576).toFixed(1)} MB).`);

  writeFileSync(
    join(PUBLIC_MODELS_DIR, "manifest.json"),
    `${JSON.stringify(await forge.runtimeManifest())}\n`,
  );

  const { count, bytes } = forge.store.stats();
  console.log(`Done in ${Date.now() - started}ms. Cache holds ${count} artifacts (${(bytes / 1048576).toFixed(1)} MB).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
