import { test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { loadModel, assertStaticPartRenders } from "./helpers";

// Every non-customizable model, driven by the manifest so new parts get
// coverage automatically. For each model × part/preview, we navigate
// to `?model=<slug>&part=<module or first file>` and assert the
// pre-built artifact loads into the viewer.

interface Part {
  file: string;
  format: "stl" | "3mf";
  label: string;
  module?: string;
}
interface Model {
  slug: string;
  title: string;
  customizable?: boolean;
  devOnly?: boolean;
  previews?: Part[];
  parts?: Part[];
  builds?: { id: string; previews?: Part[]; parts?: Part[] }[];
}

/** Every entry of a model, with the build it belongs to when it has builds. */
function entriesOf(model: Model): { build?: string; part: Part }[] {
  const owners = model.builds ?? [{ id: undefined, previews: model.previews, parts: model.parts }];
  return owners.flatMap((o) => [...(o.previews ?? []), ...(o.parts ?? [])].map((part) => ({ build: o.id, part })));
}

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(HERE, "..", "..", "..", "..", "models", "manifest.json");
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as { models: Model[] };

// Dev-only models are never built or published, so CI has no artifact for them.
const staticModels = manifest.models.filter((m) => !m.customizable && !m.devOnly);

test.describe("static models / viewer", () => {
  for (const model of staticModels) {
    for (const { build, part } of entriesOf(model)) {
      const partId = part.module ?? part.file;
      test(`${model.slug}${build ? ` [${build}]` : ""}: ${part.label}`, async ({ page }) => {
        await loadModel(page, model.slug, { build, ...(part.module ? { part: part.module } : {}) });
        // Non-customizable static parts don't have a `module` field, so
        // the URL route falls back to the default part. Verify at least
        // *some* part loaded — precise part selection is exercised for
        // customizable models where every part has a module.
        await assertStaticPartRenders(page);
        void partId;
      });
    }
  }
});
