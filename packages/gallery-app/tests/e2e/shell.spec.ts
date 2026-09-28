// SPDX-License-Identifier: MIT
//
// The multi-page shell: every view is its own page with the view switcher on
// it, the switcher is a bottom bar on a phone and a rail on a wide screen, a
// tab reopens the URL its view was left at, and pre-split links still land.

import { test, expect, type Page } from '@playwright/test';
import { fsSrcUrl, loadModel } from './helpers';

const BADGES_URL = fsSrcUrl('packages/gallery-app/src/shell/badges.ts');
const PLATE_STORE_URL = fsSrcUrl('packages/gallery-app/src/print/plate-store.ts');

const PHONE = { width: 360, height: 740 };
const DESKTOP = { width: 1280, height: 800 };

const PAGES = [
  { path: '', view: 'home' },
  { path: 'gallery/', view: 'models' },
  { path: 'project/', view: 'project' },
  { path: 'printers/', view: 'printers' },
  { path: 'operator/', view: 'operator' },
  { path: 'settings/', view: 'settings' },
] as const;

function tab(page: Page, label: string) {
  return page.locator('.shell-nav').getByRole('link', { name: label, exact: true });
}

/** The first published model, opened by its link, so the gallery's URL carries it. */
async function openFirstModel(page: Page): Promise<string> {
  await page.goto('gallery/');
  const slug = await page.locator('#model-list .model-item:not(.dev-only)').first().getAttribute('data-slug');
  await loadModel(page, slug!);
  return page.url();
}

for (const { path, view } of PAGES) {
  test(`${view} page loads with the view switcher`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(path);
    await expect(page.locator('.shell-nav')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-shell-view', view);
    if (view !== 'settings') {
      await expect(page.locator(`.shell-tab[data-view="${view}"]`)).toHaveAttribute('aria-current', 'page');
    }
    await expect(page.locator('.shell-tab')).toHaveCount(5);
    expect(errors).toEqual([]);
  });
}

test('Home renders the guide, a card per view and the way to Settings', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('.home-guide h2', { hasText: 'The five views' })).toBeVisible();
  await expect(page.locator('.home-card-link')).toHaveText([
    /Models/, /Project/, /Printers/, /Operator/, /Settings/,
  ]);
  await expect(page.locator('.home-card-text').first()).not.toBeEmpty();
  // Plain HTTP here, so the HTTPS explanation stays out of the way.
  await expect(page.locator('.home-banner')).toHaveCount(0);
  await page.locator('.home-card-link', { hasText: 'Settings' }).click();
  await expect(page).toHaveURL(/\/3d-gallery\/settings\/$/);
});

test('on a phone the switcher is a bottom bar that changes views', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('');
  const bar = await page.locator('.shell-nav').boundingBox();
  expect(bar!.y + bar!.height).toBeCloseTo(PHONE.height, 0);
  expect(bar!.width).toBe(PHONE.width);
  for (const box of await page.locator('.shell-tab').evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect),
  )) {
    expect(box.height).toBeGreaterThanOrEqual(48);
  }
  // No sideways scroll at 360 px.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(PHONE.width);

  await tab(page, 'Printers').click();
  await expect(page).toHaveURL(/\/3d-gallery\/printers\/$/);
  await tab(page, 'Models').click();
  await expect(page).toHaveURL(/\/3d-gallery\/gallery\//);
  await expect(page.locator('#model-title')).toBeVisible();
});

test('on a phone the bar leaves the gallery drawer footer uncovered', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await openFirstModel(page);
  await page.locator('#sidebar-toggle').click();
  const footer = await page.locator('#plates-btn').boundingBox();
  const bar = await page.locator('.shell-nav').boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(bar!.y);
});

test('on a wide screen the switcher is a left rail beside the gallery', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await openFirstModel(page);
  const rail = await page.locator('.shell-nav').boundingBox();
  expect(rail!.x).toBe(0);
  expect(rail!.height).toBe(DESKTOP.height);
  const app = await page.locator('#app').boundingBox();
  expect(app!.x).toBeGreaterThanOrEqual(rail!.width);
  await expect(page.locator('.shell-settings')).toBeVisible();

  await tab(page, 'Operator').click();
  await expect(page).toHaveURL(/\/3d-gallery\/operator\/$/);
  await tab(page, 'Home').click();
  await expect(page).toHaveURL(/\/3d-gallery\/$/);
});

test('a tab reopens the URL its view was left at', async ({ page }) => {
  const modelUrl = await openFirstModel(page);
  await tab(page, 'Home').click();
  await expect(page).toHaveURL(/\/3d-gallery\/$/);
  await expect(tab(page, 'Models')).toHaveAttribute('href', new URL(modelUrl).pathname + new URL(modelUrl).search);

  // A real project: the planner answers an unknown id with the open project.
  const projectId: string = await page.evaluate(async (url) => (await (await import(url)).createProject('Tabs')).id, PLATE_STORE_URL);
  await page.goto(`project/?id=${projectId}`);
  await expect(page.locator('.planner-project-name')).toHaveValue('Tabs');
  await tab(page, 'Printers').click();
  await expect(page).toHaveURL(/\/printers\/$/);
  await tab(page, 'Project').click();
  await expect(page).toHaveURL(new RegExp(`/project/\\?id=${projectId}$`));

  await tab(page, 'Models').click();
  await expect(page).toHaveURL(modelUrl);
});

test('a badge set on one page shows on the bar in another', async ({ context, page }) => {
  await page.goto('printers/');
  const other = await context.newPage();
  await other.goto('');
  await other.evaluate(async (url) => {
    const badges = await import(url);
    badges.setBadge('printers', '2');
  }, BADGES_URL);
  await expect(other.locator('.shell-tab[data-view="printers"] .shell-badge')).toHaveText('2');
  await expect(page.locator('.shell-tab[data-view="printers"] .shell-badge')).toHaveText('2');
  await other.evaluate(async (url) => (await import(url)).setBadge('printers', null), BADGES_URL);
  await expect(page.locator('.shell-tab[data-view="printers"] .shell-badge')).toHaveCount(0);
});

test.describe('pre-split links', () => {
  test('a model link on / forwards to the gallery with its query', async ({ page }) => {
    const modelUrl = new URL(await openFirstModel(page));
    await page.goto(modelUrl.search);
    await expect(page).toHaveURL(`${modelUrl.origin}/3d-gallery/gallery/${modelUrl.search}`);
    await expect(page.locator('#model-title')).not.toHaveText('Select a model');
    // Replaced, not pushed: Back skips the old URL rather than bouncing off it.
    await page.goBack();
    await expect(page).toHaveURL(modelUrl.href);
  });

  test('a panel link on / forwards to the page that owns it', async ({ page }) => {
    await page.goto('?settings=1');
    await expect(page).toHaveURL(/\/3d-gallery\/settings\/$/);
    await expect(page.locator('.print-settings-tab').first()).toBeVisible();
  });
});
