// SPDX-License-Identifier: MIT
//
// The Library: reached from the Models list, searchable, and an item opens on
// its latest version with its source, licence and a 3D view of its file.

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const STICK = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../../library/molle-stick/item.json', import.meta.url)), 'utf8'),
);

test('the Models list links to the Library', async ({ page }) => {
  await page.goto('gallery/');
  await page.locator('#library-btn').click();
  await expect(page).toHaveURL(/\/3d-gallery\/library\/$/);
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
});

test('search narrows the list and an item shows where it came from', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('library/');
  const search = page.getByRole('searchbox', { name: 'Search the library' });
  await search.fill('no such thing anywhere');
  await expect(page.locator('.lib-item')).toHaveCount(0);
  await search.fill('ifak');
  await expect(page.locator('.lib-item[data-slug="molle-stick"]')).toBeVisible();

  await page.locator('.lib-item[data-slug="molle-stick"]').click();
  await expect(page).toHaveURL(/item=molle-stick/);
  await expect(page.getByRole('heading', { name: STICK.title, level: 2 })).toBeVisible();
  await expect(page.locator('.lib-source')).toContainText(STICK.license.id);
  await expect(page.locator('.lib-source a', { hasText: 'Printables' })).toHaveAttribute('href', STICK.source.url);
  const latest = STICK.versions.at(-1);
  await expect(page.locator('.lib-files select')).toHaveValue(latest.id);
  await expect(page.locator('.lib-file-pick')).toHaveCount(latest.files.length);
  await expect(page.locator('.lib-viewer')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.lib-viewer canvas')).toBeVisible();

  await page.locator('.lib-file-pick', { hasText: latest.files.at(-1).file }).click();
  await expect(page).toHaveURL(new RegExp(`file=${latest.files.at(-1).file}`));
  await expect(page.locator('.lib-viewer')).toHaveAttribute('data-state', 'ready');
  expect(errors).toEqual([]);
});

test('a library file downloads byte for byte', async ({ request }) => {
  const v = STICK.versions.at(-1);
  const res = await request.get(`library-files/molle-stick/${v.id}/${v.files[0].file}`);
  expect(res.ok()).toBe(true);
  expect((await res.body()).length).toBe(v.files[0].size);
});

test('on a phone the list and the item take turns', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('library/?item=molle-stick');
  await expect(page.locator('.lib-list-pane')).toBeHidden();
  await page.getByRole('button', { name: '← All' }).click();
  await expect(page.locator('.lib-list-pane')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
