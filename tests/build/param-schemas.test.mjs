// Every models/<slug>/schema.ts must agree with its lib: accept the lib's own
// defaults, and every build and variant the manifest renders at. Schemas are
// strict objects, so passing the defaults also proves the schema names
// exactly the lib's parameters — no more, no fewer.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { test, describe } from "node:test";
import { deepEqual, ok } from "node:assert/strict";

import { parseParams, validateParams } from "../../packages/model-core/src/index.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MODELS_DIR = join(ROOT, "models");
const manifest = JSON.parse(readFileSync(join(MODELS_DIR, "manifest.json"), "utf8"));

const slugs = readdirSync(MODELS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(MODELS_DIR, d.name, "schema.ts")))
  .map((d) => d.name);

function libDefaults(slug) {
  const lib = readFileSync(join(MODELS_DIR, slug, "lib", `${slug}-lib.scad`), "utf8");
  return Object.fromEntries(parseParams(lib).map((p) => [p.name, p.default]));
}

/** Each param set the manifest renders the model at, named for the failure message. */
function renderedParamSets(model) {
  const sets = [];
  const views = model.builds ?? [{ id: null, params: {}, previews: model.previews, parts: model.parts }];
  for (const view of views) {
    const where = view.id ? `build ${view.id}` : "model";
    sets.push([where, view.params ?? {}]);
    for (const entry of [...(view.previews ?? []), ...(view.parts ?? [])]) {
      for (const variant of entry.variants ?? []) {
        sets.push([`${where} · ${entry.file} variant ${variant.id ?? variant.label}`, { ...view.params, ...variant.params }]);
      }
    }
  }
  return sets;
}

for (const slug of slugs) {
  describe(`${slug} input schema`, async () => {
    const { default: schema } = await import(join(MODELS_DIR, slug, "schema.ts"));
    const model = manifest.models.find((m) => m.slug === slug);
    const defaults = libDefaults(slug);

    test("belongs to a model in the manifest", () => {
      ok(model, `models/${slug}/schema.ts has no manifest entry`);
    });

    test("accepts the lib's defaults, naming exactly the lib's parameters", () => {
      deepEqual(validateParams(schema, defaults), []);
    });

    test("accepts every build and variant the manifest renders", () => {
      for (const [where, params] of renderedParamSets(model)) {
        deepEqual(validateParams(schema, { ...defaults, ...params }), [], where);
      }
    });
  });
}

test("filament-spool-roller rejects a 2 mm spool, pinned to spool_diameter", async () => {
  const slug = "filament-spool-roller";
  const { default: schema } = await import(join(MODELS_DIR, slug, "schema.ts"));
  deepEqual(
    validateParams(schema, { ...libDefaults(slug), spool_diameter: 2 }),
    [{ param: "spool_diameter", message: "must be at least 100" }],
  );
});
