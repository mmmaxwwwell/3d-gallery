import { test, expect, type Page } from "@playwright/test";
import { loadModel } from "./helpers";

// The parts list's print time sums the build-time estimates of every printed
// piece, matched to parts by artifact key. The estimates file is optional: a
// checkout that never ran the estimator just shows no print time.

const SLUG = "fan-mount";

test.use({ viewport: { width: 1400, height: 900 } });

/** Serve an estimate of 1 h at 3 mm³/s and 15 min at 18 mm³/s for every part of the model. */
async function withEstimates(page: Page, filament?: unknown[]) {
  if (filament) {
    await page.route("**/3d-gallery/models/manifest.json", async (route) => {
      const res = await route.fetch();
      const manifest = await res.json();
      manifest.models.find((m: { slug: string }) => m.slug === SLUG).filament = filament;
      await route.fulfill({ response: res, json: manifest });
    });
  }
  await page.route("**/3d-gallery/models/print-estimates.json", async (route) => {
    const manifest = await (await page.request.get("/3d-gallery/models/manifest.json")).json();
    const model = manifest.models.find((m: { slug: string }) => m.slug === SLUG);
    const estimates = Object.fromEntries(
      model.parts.map((p: { defaultKey: string }) => [
        p.defaultKey,
        { seconds: { 3: 3600, 18: 900 }, grams: 10, cost: 0.1 },
      ]),
    );
    await route.fulfill({
      json: {
        settings: {
          rates: [{ mmPerS: 3, label: "TPU" }, { mmPerS: 18, label: "PLA" }],
          filament: { material: "PLA", density: 1.24, costPerKg: 10 },
          densities: { PLA: 1.24, TPU: 1.24 },
          defaultMaterial: "PLA",
          printer: "Test printer",
          profile: "test profile",
        },
        estimates,
      },
    });
  });
}

test("print time totals every printed piece at each flow rate", async ({ page }) => {
  await withEstimates(page);
  await loadModel(page, SLUG);

  const section = page.locator("#print-time");
  await expect(section).toBeVisible();
  const rows = section.locator("li.estimate-row");
  await expect(rows).toHaveCount(3);
  // No filament named: every piece is assumed to be the default material.
  await expect(rows.nth(0)).toContainText("PLA (assumed)");
  await expect(rows.nth(0).locator(".estimate-time")).toHaveText("1h 00m");
  await expect(rows.nth(1)).toContainText("TPU");
  await expect(rows.nth(1).locator(".estimate-time")).toHaveText("4h 00m");
  await expect(rows.nth(2).locator(".estimate-time")).toHaveText("1h 00m");
  await expect(section).toContainText("40 g PLA · $0.40 at $10/kg");
  await expect(section).toContainText("All 4 printed pieces");
});

test("each piece is timed at the flow of the filament its model names for it", async ({ page }) => {
  const manifest = await (await page.request.get("/3d-gallery/models/manifest.json")).json();
  const [first] = manifest.models.find((m: { slug: string }) => m.slug === SLUG).parts;
  await withEstimates(page, [
    { material: "PLA", color: "any" },
    { material: "TPU 95A", color: "any", parts: [first.file] },
  ]);
  await loadModel(page, SLUG);

  const specified = page.locator("#print-time li.estimate-specified");
  await expect(specified).toContainText("PLA + TPU 95A");
  // Three pieces at 15 min, one at 1 h.
  await expect(specified.locator(".estimate-time")).toHaveText("1h 45m");
  await expect(page.locator("#print-time")).toContainText("(PLA 30 g · TPU 95A 10 g)");
});

test("no estimates file, no print time", async ({ page }) => {
  await page.route("**/3d-gallery/models/print-estimates.json", (route) => route.fulfill({ status: 404 }));
  await loadModel(page, SLUG);
  await expect(page.locator("#printed-list")).toBeVisible();
  await expect(page.locator("#print-time")).toBeHidden();
});
