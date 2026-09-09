import { test } from "@playwright/test";
import { loadModel, fillParams, clickGenerate, assertGenerateSucceeds, assertUrlParamsOnly, watchForBrowserErrors, attachConsoleDiagnostics } from "./helpers";

const COLLAR_TAG_PARAMS = [
  "shape", "tag_text", "font_style", "text_style",
  "text_size_mm", "text_offset_x", "text_offset_y",
  "size_mult", "thickness", "emboss_height", "ring_od", "ring_id",
];

test.beforeEach(({ page }) => {
  attachConsoleDiagnostics(page);
});

const SHAPES = ["circle", "hexagon", "bean"] as const;
const FONTS = ["Sans Bold", "Sans", "Serif Bold", "Serif", "Mono Bold", "Mono"] as const;
const PARTS = [
  { module: "multicolor", label: "multicolor 3MF" },
  { module: "single",     label: "single-color STL" },
] as const;

test.describe("collar-tag / customizer", () => {
  // ── smoke: one per shape and one per font at defaults, per part ────────
  for (const part of PARTS) {
    for (const shape of SHAPES) {
      test(`${part.label}: shape=${shape} defaults`, async ({ page }) => {
        const errs = watchForBrowserErrors(page);
        await loadModel(page, "collar-tag", { part: part.module });
        await fillParams(page, { shape, tag_text: "REX" });
        await clickGenerate(page);
        await assertGenerateSucceeds(page);
        if (errs.flush().length) throw new Error("browser errors:\n" + errs.flush().join("\n"));
      });
    }

    for (const font of FONTS) {
      test(`${part.label}: font=${font}`, async ({ page }) => {
        await loadModel(page, "collar-tag", { part: part.module });
        await fillParams(page, { font_style: font, tag_text: "REX" });
        await clickGenerate(page);
        await assertGenerateSucceeds(page);
      });
    }

    test(`${part.label}: numeric edge — small size + thin body`, async ({ page }) => {
      await loadModel(page, "collar-tag", { part: part.module });
      await fillParams(page, { size_mult: 0.6, thickness: 1.5, emboss_height: 0.3, ring_od: 7, ring_id: 3 });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });

    test(`${part.label}: numeric edge — large size + thick body`, async ({ page }) => {
      await loadModel(page, "collar-tag", { part: part.module });
      await fillParams(page, { size_mult: 1.8, thickness: 4, emboss_height: 1.2, ring_od: 14, ring_id: 7 });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });

    test(`${part.label}: long text clips into border`, async ({ page }) => {
      await loadModel(page, "collar-tag", { part: part.module });
      await fillParams(page, { tag_text: "Chocolate" });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });

    test(`${part.label}: single-char text`, async ({ page }) => {
      await loadModel(page, "collar-tag", { part: part.module });
      await fillParams(page, { tag_text: "R" });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });

    for (const shape of SHAPES) {
      test(`${part.label}: arc text on ${shape}`, async ({ page }) => {
        await loadModel(page, "collar-tag", { part: part.module });
        await fillParams(page, { shape, text_style: "arc", tag_text: "BEANS" });
        await clickGenerate(page);
        await assertGenerateSucceeds(page);
      });
    }

    test(`${part.label}: explicit font size overrides auto`, async ({ page }) => {
      await loadModel(page, "collar-tag", { part: part.module });
      await fillParams(page, { tag_text: "REX", text_size_mm: 12 });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });

    test(`${part.label}: text_offset_x nudges text right`, async ({ page }) => {
      await loadModel(page, "collar-tag", { part: part.module });
      await fillParams(page, { tag_text: "REX", text_offset_x: 4 });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });

    test(`${part.label}: text_offset_y nudges text up`, async ({ page }) => {
      await loadModel(page, "collar-tag", { part: part.module });
      await fillParams(page, { tag_text: "REX", text_offset_y: 2 });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });
  }
});

// ── URL purity: only collar-tag's own params should surface in the URL ──
test.describe("collar-tag / URL purity", () => {
  for (const part of PARTS) {
    test(`${part.label}: editing tag_text does not add foreign params`, async ({ page }) => {
      await loadModel(page, "collar-tag", { part: part.module });
      await fillParams(page, { tag_text: "jelly" });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
      assertUrlParamsOnly(page, COLLAR_TAG_PARAMS);
    });

    test(`${part.label}: stale param from URL is stripped, not re-emitted`, async ({ page }) => {
      // Simulate arriving via a bookmark that carries qr_url_text (a param
      // that belongs to qr-sign, not collar-tag). The customizer should
      // ignore it, and the first edit must not carry it back into the URL.
      await loadModel(page, "collar-tag", {
        part: part.module,
        initial: { qr_url_text: "https://leaked.example.com" },
      });
      await fillParams(page, { tag_text: "REX" });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
      assertUrlParamsOnly(page, COLLAR_TAG_PARAMS);
    });

  }

  // Sidebar-switch flow tested once against the default part (multicolor).
  // Exercises the real user path: land on qr-sign, edit qr_url_text, then
  // click collar-tag in the sidebar. The stale qr_url_text must not leak.
  test("switching from qr-sign via sidebar drops qr_url_text", async ({ page }) => {
    await loadModel(page, "qr-sign", { part: "assembled" });
    await fillParams(page, { qr_url_text: "https://from-qr-sign.example.com" });
    await page.locator(`.model-item[data-slug="collar-tag"]`).click();
    await fillParams(page, { tag_text: "jelly" });
    await clickGenerate(page);
    await assertGenerateSucceeds(page);
    assertUrlParamsOnly(page, COLLAR_TAG_PARAMS);
  });
});

// ── @matrix: full shape × font sweep on both parts (36 combos × 2 parts) ──
test.describe("collar-tag / @matrix", () => {
  for (const part of PARTS) {
    for (const shape of SHAPES) {
      for (const font of FONTS) {
        test(`@matrix ${part.label}: shape=${shape} font=${font}`, async ({ page }) => {
          await loadModel(page, "collar-tag", { part: part.module });
          await fillParams(page, { shape, font_style: font, tag_text: "MAX" });
          await clickGenerate(page);
          await assertGenerateSucceeds(page);
        });
      }
    }
  }
});
