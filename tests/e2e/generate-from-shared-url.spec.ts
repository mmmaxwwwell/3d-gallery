import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  loadModel,
  fillParams,
  clickGenerate,
  assertGenerateSucceeds,
  attachConsoleDiagnostics,
} from "./helpers";

/**
 * Reproduces the "open shared link in a new window" flow.
 *
 * The natural user flow is: navigate to a model, edit one param, then
 * copy the URL from the address bar and open it in a new window. The
 * app's onValuesChange serializes every current value (defaults too)
 * into the URL as a string via history.replaceState, so a fresh page
 * load then re-hydrates the customizer with numeric-typed params
 * arriving as URL strings. Historically the initial edit-then-Generate
 * path (same tab) works, but the fresh-load-then-Generate path fails.
 *
 * This spec exercises the real flow using two Playwright pages sharing
 * one browser context, so any regression that only trips on the
 * hydration path is caught. Auto-applies to every customizable model
 * × part, so new customizable models get coverage for free.
 */

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

// Primary text-like param per model — the one users actually change
// when sharing a link. Add an entry here for every new customizable
// model, otherwise its test will be skipped.
const PRIMARY_PARAM: Record<string, { name: string; value: string }> = {
  "collar-tag":   { name: "tag_text",     value: "Jelly" },
  "qr-sign":      { name: "qr_url_text",  value: "https://shared.example.com/hello" },
  "fi-mini-case": { name: "qr_code_text", value: "Rex 555-1234" },
};

const customizable = manifest.models.filter((m) => m.customizable);

test.describe("shared-URL generate (copy-URL, open-in-new-window flow)", () => {
  for (const model of customizable) {
    const seed = PRIMARY_PARAM[model.slug];
    if (!seed) {
      test.skip(`${model.slug}: no PRIMARY_PARAM seed configured`, () => {});
      continue;
    }
    const parts = [...(model.previews ?? []), ...(model.parts ?? [])].filter((p) => p.module);
    for (const part of parts) {
      test(`${model.slug} / ${part.label}: edit → copy URL → open in fresh page → Generate`, async ({ context }) => {
        // First page: normal edit flow. This is what populates the URL
        // via history.replaceState with every current value (including
        // numeric defaults, which get stringified into the URL).
        const editor = await context.newPage();
        attachConsoleDiagnostics(editor);
        await loadModel(editor, model.slug, { part: part.module });
        await fillParams(editor, { [seed.name]: seed.value });
        const sharedUrl = editor.url();
        await editor.close();

        // Sanity: URL must actually carry the seed value, otherwise the
        // test is passing trivially.
        expect(sharedUrl).toContain(`${seed.name}=`);

        // Second page: fresh navigation to the exact URL a user would
        // paste — no prior editing state. Click Generate immediately.
        const opener = await context.newPage();
        attachConsoleDiagnostics(opener);
        await opener.goto(sharedUrl);
        await expect(opener.locator("#model-title")).not.toHaveText("Select a model");
        await clickGenerate(opener);
        await assertGenerateSucceeds(opener);
        await opener.close();
      });
    }
  }
});
