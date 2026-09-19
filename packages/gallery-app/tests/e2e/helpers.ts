import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page } from "@playwright/test";

const REPO_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "..", "..", "..");

/**
 * Vite's `@fs` URL for a repo source file, so a spec can pull a production
 * module into the page. The path is absolute and machine-specific, so a spec
 * must never spell one out: a literal that works on the machine that wrote it
 * 404s on a CI runner.
 */
export function fsSrcUrl(repoRelative: string): string {
  return `/3d-gallery/@fs${resolve(REPO_ROOT, repoRelative)}`;
}

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

/**
 * The download href as it stood before the click, per page. Every successful
 * generate mints a fresh object URL, so a changed href is an unambiguous
 * "this render finished" — it can't be satisfied by a previous one.
 */
const generateBaseline = new WeakMap<Page, string>();

/** Click the customizer's Generate button. */
export async function clickGenerate(page: Page) {
  const btn = page.locator(".customizer-panel button.btn-primary");
  await expect(btn).toBeEnabled();
  generateBaseline.set(page, (await page.locator("#download-link").getAttribute("href")) ?? "");
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
  const before = generateBaseline.get(page) ?? "";

  // Wait on the OUTCOME, not on the loading overlay having been seen: a warm
  // artifact cache can satisfy the render before any poll observes the
  // spinner, which made every cached render look like a failure.
  await expect
    .poll(
      async () => {
        if (await error.isVisible()) return "error";
        const href = await download.getAttribute("href");
        return href?.startsWith("blob:") && href !== before ? "done" : "pending";
      },
      {
        timeout: timeoutMs,
        message: "Generate should finish and mint a fresh blob: download href",
      },
    )
    .not.toBe("pending");

  if (await error.isVisible()) {
    const msg = (await error.textContent())?.trim() ?? "(no error text)";
    throw new Error(`Customizer error surfaced in #viewer-error: ${msg}`);
  }

  await expect(loading).toBeHidden({ timeout: timeoutMs });

  // Prompt should be gone once render succeeded — if it's still up we
  // rendered but the UI never took us out of prompt-only state.
  await expect(prompt).toBeHidden();

  await expect(badge, "customized-badge should show after successful Generate").toBeVisible();
  await expect(download).toBeVisible();
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

/**
 * Assert the current URL's query string contains only `model`, `part`,
 * and the given `allowedParams` — nothing else. Useful for catching
 * stale params from another model leaking into the URL after edits.
 */
export function assertUrlParamsOnly(page: Page, allowedParams: string[]) {
  const url = new URL(page.url());
  const allowed = new Set(["model", "part", ...allowedParams]);
  const extras: string[] = [];
  for (const key of url.searchParams.keys()) {
    if (!allowed.has(key)) extras.push(key);
  }
  expect(
    extras,
    `URL contains params not declared by this model: ${extras.join(", ")}\nfull URL: ${url.search}`,
  ).toEqual([]);
}

/**
 * A miss on the content-addressed artifact store 404s by design — the client
 * probes `/a/<key>.<ext>` and falls back. The browser logs every 404 as a
 * console error, so match on the resource URL (which `text()` omits but
 * `location()` carries) rather than treating the whole class as a failure.
 */
const ARTIFACT_PROBE = /\/a\/[0-9a-f]+\.(stl|3mf)$/;

/** Capture browser console + page errors to fail with useful context. */
export function watchForBrowserErrors(page: Page): { flush: () => string[] } {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    if (ARTIFACT_PROBE.test(msg.location()?.url ?? "")) return;
    errors.push(`[console.error] ${msg.text()}`);
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
