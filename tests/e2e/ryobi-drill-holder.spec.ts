import { test } from "@playwright/test";
import { loadModel, fillParams, clickGenerate, assertGenerateSucceeds } from "./helpers";

const PREVIEW_PARTS = [
  { module: "chained",   label: "chained 3× 3MF" },
  { module: "single",    label: "single-plate 3MF" },
  { module: "three_row", label: "three-row bar 3MF" },
] as const;

const STL_PARTS = [
  { module: "plate",          label: "plate STL" },
  { module: "post_half_part", label: "post-half STL" },
  { module: "bowtie_key",     label: "bowtie-key STL" },
] as const;

test.describe("ryobi-drill-holder / customizer", () => {
  for (const part of [...PREVIEW_PARTS, ...STL_PARTS]) {
    test(`${part.label}: default params`, async ({ page }) => {
      await loadModel(page, "ryobi-drill-holder", { part: part.module });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });
  }

  test("chained: wider section (100mm) + deeper plate", async ({ page }) => {
    await loadModel(page, "ryobi-drill-holder", { part: "chained" });
    await fillParams(page, { section_width: 100, post_spacing: 100, plate_depth: 150 });
    await clickGenerate(page);
    await assertGenerateSucceeds(page);
  });

  test("plate: minimal screw count", async ({ page }) => {
    await loadModel(page, "ryobi-drill-holder", { part: "plate" });
    await fillParams(page, { screw_count: 2 });
    await clickGenerate(page);
    await assertGenerateSucceeds(page);
  });

  test("plate: thicker plate + bigger screws", async ({ page }) => {
    await loadModel(page, "ryobi-drill-holder", { part: "plate" });
    await fillParams(page, { plate_thickness: 7, screw_d: 6 });
    await clickGenerate(page);
    await assertGenerateSucceeds(page);
  });

  // @matrix — cross-product of section + depth for each preview module
  for (const module of ["chained", "single", "three_row"] as const) {
    for (const section of [80, 90, 100]) {
      for (const depth of [120, 135, 150]) {
        test(`@matrix ${module}: section=${section} depth=${depth}`, async ({ page }) => {
          await loadModel(page, "ryobi-drill-holder", { part: module });
          await fillParams(page, { section_width: section, post_spacing: section, plate_depth: depth });
          await clickGenerate(page);
          await assertGenerateSucceeds(page);
        });
      }
    }
  }
});
