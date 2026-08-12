import { test, expect } from "@playwright/test";
import { loadModel, fillParams, clickGenerate, assertGenerateSucceeds } from "./helpers";

// qr-sign exposes exactly one customizer param: qr_url_text. Plate
// size, corner radius, and layer height are fixed model constants
// (see lib/qr-sign-lib.scad). Coverage below focuses on the URL
// input space — that's the whole user-facing surface.

test.describe("qr-sign / customizer", () => {
  test("exposes exactly one customizer param (qr_url_text)", async ({ page }) => {
    await loadModel(page, "qr-sign", { part: "assembled" });
    const fields = page.locator(".param-field .param-name");
    await expect(fields).toHaveCount(1);
    await expect(fields.first()).toHaveText("qr_url_text");
  });

  test("smoke: default URL renders", async ({ page }) => {
    await loadModel(page, "qr-sign", { part: "assembled" });
    await clickGenerate(page);
    await assertGenerateSucceeds(page);
  });

  test("short URL", async ({ page }) => {
    await loadModel(page, "qr-sign", { part: "assembled" });
    await fillParams(page, { qr_url_text: "https://x.com" });
    await clickGenerate(page);
    await assertGenerateSucceeds(page);
  });

  test("long URL packs into smaller modules", async ({ page }) => {
    await loadModel(page, "qr-sign", { part: "assembled" });
    await fillParams(page, {
      qr_url_text: "https://example.com/very/deep/path/with?many=params&and=values#fragment",
    });
    await clickGenerate(page);
    await assertGenerateSucceeds(page);
  });

  test("plain text (not a URL)", async ({ page }) => {
    await loadModel(page, "qr-sign", { part: "assembled" });
    await fillParams(page, { qr_url_text: "Hello world" });
    await clickGenerate(page);
    await assertGenerateSucceeds(page);
  });

  // @matrix — a handful of URL shapes to exercise the QR encoder
  const urls = [
    "https://a.co",
    "https://github.com/anthropics/claude-code",
    "https://en.wikipedia.org/wiki/QR_code#Encoding",
    "mailto:me@example.com",
    "tel:+15551234567",
    "WIFI:S:MyNetwork;T:WPA;P:pass123;;",
  ];
  for (const url of urls) {
    test(`@matrix url=${url}`, async ({ page }) => {
      await loadModel(page, "qr-sign", { part: "assembled" });
      await fillParams(page, { qr_url_text: url });
      await clickGenerate(page);
      await assertGenerateSucceeds(page);
    });
  }
});
