import { expect, type Page } from "@playwright/test";

export type ParamValue = string | number | boolean;

export interface LoadOpts {
  /** Which preview/part to select (matches manifest `module` field). */
  part?: string;
  /** URL-injected initial values (mostly used to preload the customizer). */
  initial?: Record<string, ParamValue>;
}

/**
 * Navigate to a model, optionally with a specific part and URL-preloaded
 * param values. The URL-injected path is `promptOnly`, so the viewer
 * shows the "Press Generate" prompt instead of auto-rendering — that's
 * fine for tests since we always click Generate ourselves.
 */
export async function loadModel(page: Page, slug: string, opts: LoadOpts = {}) {
  const params = new URLSearchParams({ model: slug });
  if (opts.part) params.set("part", opts.part);
  if (opts.initial) for (const [k, v] of Object.entries(opts.initial)) params.set(k, String(v));
  await page.goto(`?${params.toString()}`);
  await expect(page.locator("#model-title")).not.toHaveText("Select a model");
}

/**
 * Fill customizer inputs by matching the visible param name label.
 * Skips silently if a param isn't present — different parts of the
 * same model can expose different param sets.
 */
export async function fillParams(page: Page, params: Record<string, ParamValue>) {
  for (const [name, value] of Object.entries(params)) {
    const field = page.locator(".param-field").filter({
      has: page.locator(".param-name", { hasText: new RegExp(`^${escapeRegex(name)}$`) }),
    });
    if (!(await field.count())) continue;
    const input = field.locator("input, select, textarea").first();
    const tag = (await input.evaluate((el) => el.tagName.toLowerCase())) as string;
    if (tag === "select") {
      await input.selectOption(String(value));
    } else if (tag === "textarea") {
      await input.fill(String(value));
    } else {
      const type = await input.getAttribute("type");
      if (type === "checkbox") {
        const checked = await input.isChecked();
        if (Boolean(value) !== checked) await input.click();
      } else {
        await input.fill(String(value));
      }
    }
  }
}

/** Click the customizer's Generate button. */
export async function clickGenerate(page: Page) {
  const btn = page.locator(".customizer-panel button.btn-primary");
  await expect(btn).toBeEnabled();
  await btn.click();
}

/**
 * Wait for the customizer's Generate cycle to finish, then verify success.
 * If it fails, throws with the visible error text so the test report tells
 * you exactly what the customizer complained about.
 */
export async function assertGenerateSucceeds(page: Page, timeoutMs = 150_000) {
  const loading = page.locator("#viewer-loading");
  const error = page.locator("#viewer-error");
  const download = page.locator("#download-link");
  const badge = page.locator("#customized-badge");
  const prompt = page.locator("#viewer-prompt");

  // Loading overlay should appear right after the click. If it doesn't
  // appear at all within ~5s, the click didn't fire the render path.
  await expect(loading, "loading overlay should appear after clicking Generate").toBeVisible({
    timeout: 5_000,
  });

  // …then hide when generation finishes (success or error).
  await expect(loading).toBeHidden({ timeout: timeoutMs });

  if (await error.isVisible()) {
    const msg = (await error.textContent())?.trim() ?? "(no error text)";
    throw new Error(`Customizer error surfaced in #viewer-error: ${msg}`);
  }

  // Prompt should be gone once render succeeded — if it's still up we
  // rendered but the UI never took us out of prompt-only state.
  await expect(prompt).toBeHidden();

  await expect(badge, "customized-badge should show after successful Generate").toBeVisible();
  await expect(download).toBeVisible();
  const href = await download.getAttribute("href");
  expect(href, "download link should have a blob: href after Generate").toMatch(/^blob:/);
  await expect(page.locator("#viewer-container canvas")).toBeVisible();
}

/**
 * For non-customizable models — just assert the pre-built artifact loaded
 * into the viewer. No customizer, no generate click.
 */
export async function assertStaticPartRenders(page: Page) {
  await expect(page.locator("#viewer-error")).toBeHidden();
  await expect(page.locator("#viewer-loading")).toBeHidden();
  await expect(page.locator("#download-link")).toBeVisible();
  await expect(page.locator("#viewer-container canvas")).toBeVisible();
  const href = await page.locator("#download-link").getAttribute("href");
  // Static parts download from /models/<slug>/<file>, not a blob.
  expect(href).toMatch(/\/models\/.+\.(stl|3mf)$/);
}

/** Capture browser console + page errors to fail with useful context. */
export function watchForBrowserErrors(page: Page): { flush: () => string[] } {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console.error] ${msg.text()}`);
  });
  return { flush: () => errors };
}

/**
 * Attach test-wide diagnostics. Streams every browser console line and
 * page error into the Playwright reporter (so `--reporter=list` shows
 * them next to the failing test) and fails the test on the first
 * pageerror. Call once at the top of a describe or beforeEach.
 */
export function attachConsoleDiagnostics(page: Page): { errors: string[]; logs: string[] } {
  const errors: string[] = [];
  const logs: string[] = [];
  page.on("console", (msg) => {
    const line = `[browser ${msg.type()}] ${msg.text()}`;
    logs.push(line);
    // eslint-disable-next-line no-console
    if (msg.type() === "error" || msg.type() === "warning") console.log(line);
  });
  page.on("pageerror", (e) => {
    const line = `[pageerror] ${e.message}\n${e.stack ?? ""}`;
    errors.push(line);
    // eslint-disable-next-line no-console
    console.log(line);
  });
  return { errors, logs };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
