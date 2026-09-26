// SPDX-License-Identifier: MIT
//
// Editing a printer preset: a change lands as an override over the imported
// file, says what it replaced and where that came from, survives a reload,
// and can be put back.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import { fsSrcUrl } from './helpers';

const PRINT_STORAGE_URL = fsSrcUrl('packages/gallery-app/src/print/print-storage.ts');
const HERE = fileURLToPath(new URL('.', import.meta.url));
const PRINTER = JSON.parse(readFileSync(join(HERE, 'fixtures', 'flashforge-adventurer-5m-klipper-left.json'), 'utf8'));

async function storedPrinter(page: Page) {
  return page.evaluate(async ({ storeUrl, id }) => {
    const store = await import(storeUrl);
    return store.getPreset(id);
  }, { storeUrl: PRINT_STORAGE_URL, id: `printer:${PRINTER.name}` });
}

async function openEditor(page: Page) {
  await page.goto('/?settings=1');
  await page.locator('.print-settings-tab', { hasText: 'Printers' }).click();
  await page.locator('.print-settings-item', { hasText: PRINTER.name }).getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('.print-preset-editor')).toBeVisible();
}

test('a printer edit is an override that remembers what it replaced', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async ({ printer, storeUrl }) => {
    const store = await import(storeUrl);
    await store.savePreset({ kind: 'printer', name: printer.name, raw: printer.raw, parents: printer.parents });
  }, { printer: PRINTER, storeUrl: PRINT_STORAGE_URL });

  await openEditor(page);
  await page.getByPlaceholder('Search settings…').fill('retraction_length');
  const field = page.locator('.print-preset-field', { has: page.locator('label[title*="retraction_length"]') }).first();
  // Inherited, and the badge names the parent it came from.
  await expect(field.locator('.print-preset-field-origin')).toHaveText('Flashforge Adventurer 5M 0.4 Nozzle');

  await field.locator('input').first().fill('abc');
  await expect(field.locator('.print-preset-field-error')).toContainText('number');
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();

  await field.locator('input').first().fill('0.5');
  await expect(field).toHaveClass(/is-edited/);
  await expect(field.locator('.print-preset-field-origin')).toHaveText('was 0.8 · Flashforge Adventurer 5M 0.4 Nozzle');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.print-preset-editor-status')).toHaveText('1 edit saved');

  const saved = await storedPrinter(page);
  expect(saved.overrides).toEqual({ retraction_length: ['0.5'] });
  // The imported file is untouched.
  expect(saved.raw).toEqual(PRINTER.raw);

  await page.reload();
  await openEditor(page);
  await page.locator('.print-preset-editor-page', { hasText: 'Changes' }).click();
  const change = page.locator('.print-preset-editor-changes li');
  await expect(change).toHaveCount(1);
  await expect(change).toContainText('0.8');
  await expect(change).toContainText('0.5');

  await change.getByRole('button', { name: 'Reset' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.print-settings-empty')).toContainText('exactly as imported');
  expect((await storedPrinter(page)).overrides).toBeUndefined();
});
