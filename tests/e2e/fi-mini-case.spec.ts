import { test } from "@playwright/test";
import { loadModel, fillParams, clickGenerate, assertGenerateSucceeds } from "./helpers";

// fi-mini-case customizable parts. `base` is single-material STL and
// still runs the customizer path (the qr_code_text param is unused
// there but the pipeline is exercised).
const PARTS = [
  { module: "assembled", label: "assembly 3MF" },
  { module: "cap",       label: "cap 3MF" },
  { module: "base",      label: "base STL" },
] as const;

test.describe("fi-mini-case / customizer", () => {
  for (const part of PARTS) {
    test(`${part.label}: default QR text`, async ({ page }) => {
      await loadModel(page, "fi-mini-case", { part: part.module });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });

    test(`${part.label}: empty QR text (no QR)`, async ({ page }) => {
      await loadModel(page, "fi-mini-case", { part: part.module });
      await fillParams(page, { qr_code_text: "" });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });

    test(`${part.label}: short phone number`, async ({ page }) => {
      await loadModel(page, "fi-mini-case", { part: part.module });
      await fillParams(page, { qr_code_text: "555-1234" });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });

    test(`${part.label}: multi-line contact info`, async ({ page }) => {
      await loadModel(page, "fi-mini-case", { part: part.module });
      await fillParams(page, {
        qr_code_text: "Rex the Retriever\n123 Main St\n555-0100\nvet: 555-0111",
      });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });
  }
});
