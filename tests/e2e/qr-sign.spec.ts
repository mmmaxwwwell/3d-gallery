import { test, expect } from "@playwright/test";
import { loadModel, fillParams, clickGenerate, assertGenerateSucceeds, assertUrlParamsOnly } from "./helpers";

const QR_SIGN_PARAMS = ["qr_url_text"];

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

  test("URL purity: editing qr_url_text does not add foreign params", async ({ page }) => {
    await loadModel(page, "qr-sign", { part: "assembled" });
    await fillParams(page, { qr_url_text: "https://ok.example.com" });
    await clickGenerate(page);
    await assertGenerateSucceeds(page);
    assertUrlParamsOnly(page, QR_SIGN_PARAMS);
  });

  test("URL purity: stale foreign param (tag_text) from URL is dropped", async ({ page }) => {
    await loadModel(page, "qr-sign", {
      part: "assembled",
      initial: { tag_text: "leaked-from-collar-tag" },
    });
    await fillParams(page, { qr_url_text: "https://ok.example.com" });
    await clickGenerate(page);
    await assertGenerateSucceeds(page);
    assertUrlParamsOnly(page, QR_SIGN_PARAMS);
  });

  test("URL purity: switching from collar-tag to qr-sign drops tag_text", async ({ page }) => {
    await loadModel(page, "collar-tag", { part: "multicolor" });
    await fillParams(page, { tag_text: "jelly" });
    await page.locator(`.model-item[data-slug="qr-sign"]`).click();
    await fillParams(page, { qr_url_text: "https://after-switch.example.com" });
    await clickGenerate(page);
    await assertGenerateSucceeds(page);
    assertUrlParamsOnly(page, QR_SIGN_PARAMS);
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
