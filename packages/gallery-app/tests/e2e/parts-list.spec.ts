import { test, expect, type Page } from "@playwright/test";
import { unzipSync, zipSync, strToU8 } from "fflate";
import { loadModel } from "./helpers";

// The docked parts list stands in for the floating key on desktop: its rows
// carry the key's swatches and drive the same highlight. Hardware can be read
// as totals or by the part each piece goes into, with every printed piece
// named by its instance id.

const SLUG = "under-desk-cord-protector";

test.use({ viewport: { width: 1400, height: 900 } });

/** Give the model instance ids and hardware attribution, which no published model carries yet. */
async function withAttribution(page: Page) {
  await page.route("**/3d-gallery/models/manifest.json", async (route) => {
    const res = await route.fetch();
    const manifest = await res.json();
    const model = manifest.models.find((m: { slug: string }) => m.slug === SLUG);
    const propped = model.previews.find((p: { default?: boolean }) => p.default);
    propped.components.find((c: { part: string }) => c.part === "segment.stl").instances = [
      { id: "S1", where: "left end" },
      { id: "S2", where: "right end" },
    ];
    model.hardware[0].usedBy = [
      { part: "segment.stl", each: 1 },
      { part: "segment-screen.stl", each: 1 },
    ];
    await route.fulfill({ response: res, json: manifest });
  });
}

function printedRow(page: Page, label: string) {
  return page.locator("#printed-list > ul > li").filter({
    has: page.locator(".part-link", { hasText: new RegExp(`^${label}$`) }),
  });
}

test("desktop parts list carries the key's swatches in place of the floating key", async ({ page }) => {
  await loadModel(page, SLUG);
  await expect(page.locator("#viewer-legend .legend-row").first()).toBeAttached();
  await expect(page.locator("#viewer-legend")).toBeHidden();

  const segment = printedRow(page, "Segment");
  await expect(segment.locator(".item-qty")).toHaveText("2×");
  await expect(segment.locator(".legend-swatch")).toHaveCSS("background-color", "rgb(0, 234, 255)");

  await segment.hover();
  await expect(segment).toHaveClass(/legend-active/);
});

test("printed pieces are named, and hardware reads by total or by part", async ({ page }) => {
  await withAttribution(page);
  await loadModel(page, SLUG);

  const segment = printedRow(page, "Segment");
  await expect(segment.locator(".item-ids")).toHaveText("S1 · S2");
  await segment.locator(".item-toggle").click();
  await expect(segment.locator(".item-details li").first()).toHaveText("S1 left end");

  const hardware = page.locator("#hardware-list");
  const screws = hardware.locator("> ul > li").first();
  await screws.locator(".item-toggle").click();
  const details = screws.locator(".item-details");
  await expect(details.locator(".item-detail-heading").first()).toHaveText("2× into Segment");
  await expect(details.locator("li", { hasText: "S2" })).toHaveText("1×S2 right end");

  await hardware.getByRole("tab", { name: "By part" }).click();
  await expect(hardware.getByRole("tab", { name: "By part" })).toHaveAttribute("aria-selected", "true");
  const byPart = hardware.locator("> ul > li").filter({
    has: page.locator(".item-label", { hasText: /^Segment$/ }),
  });
  await expect(byPart.locator(".item-qty").first()).toHaveText("2×");
  await byPart.locator(".item-toggle").click();
  await expect(byPart.locator(".item-details li").first()).toContainText("1 per piece");
});

/**
 * Where the two plain segments of the propped view sit, as the model's preview
 * would echo them. No published preview echoes anchors yet, so the served 3MF
 * gets them added the way the builder writes them.
 */
async function withAnchors(page: Page) {
  const anchors = [
    { id: "S1", at: [66, -77, 80] },
    { id: "S2", at: [66, -377, 80] },
  ];
  await page.route("**/*.3mf", async (route) => {
    const res = await route.fetch();
    const files = unzipSync(new Uint8Array(await res.body()));
    files["Metadata/gallery_instances.json"] = strToU8(JSON.stringify(anchors));
    await route.fulfill({ response: res, body: Buffer.from(zipSync(files)) });
  });
}

/** The leader's end on the mesh, in viewer coordinates. */
function leaderDot(page: Page) {
  return page.locator("#viewer-leader circle").evaluate((c) => ({
    x: Number(c.getAttribute("cx")),
    y: Number(c.getAttribute("cy")),
  }));
}

test("a piece id points at that one piece, and the piece points back at its id", async ({ page }) => {
  await withAttribution(page);
  await withAnchors(page);
  await loadModel(page, SLUG);

  const segment = printedRow(page, "Segment");
  const s1 = segment.locator('.item-id-ref[data-piece="S1"]');
  const s2 = segment.locator('.item-id-ref[data-piece="S2"]');
  await expect(s1).toHaveClass(/piece-live/);

  await s1.hover();
  await expect(s1).toHaveClass(/piece-active/);
  await expect(segment).toHaveClass(/legend-active/);
  const atS1 = await leaderDot(page);
  await s2.hover();
  await expect(s2).toHaveClass(/piece-active/);
  await expect(s1).not.toHaveClass(/piece-active/);
  const atS2 = await leaderDot(page);
  expect(Math.hypot(atS1.x - atS2.x, atS1.y - atS2.y)).toBeGreaterThan(20);

  // Back to the row itself: the part again, no one piece.
  await segment.locator(".part-link").hover();
  await expect(page.locator(".piece-active")).toHaveCount(0);
  await expect(segment).toHaveClass(/legend-active/);

  // From the viewer: pointing at S2 lights its id, not S1's.
  const viewer = await page.locator("#viewer-leader").boundingBox();
  await page.mouse.move(viewer!.x + atS2.x, viewer!.y + atS2.y);
  await expect(s2).toHaveClass(/piece-active/);
  await expect(s1).not.toHaveClass(/piece-active/);
  await expect(segment).toHaveClass(/legend-active/);
});
