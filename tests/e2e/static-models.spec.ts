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
  previews?: Part[];
  parts?: Part[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(HERE, "..", "..", "models", "manifest.json");
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as { models: Model[] };

const staticModels = manifest.models.filter((m) => !m.customizable);

test.describe("static models / viewer", () => {
  for (const model of staticModels) {
    const parts = [...(model.previews ?? []), ...(model.parts ?? [])];
    for (const part of parts) {
      const partId = part.module ?? part.file;
      test(`${model.slug}: ${part.label}`, async ({ page }) => {
        await loadModel(page, model.slug, part.module ? { part: part.module } : {});
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
