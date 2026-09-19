// SPDX-License-Identifier: MIT
//
// Slicing must never look like a hang: an overlay reports progress above the
// dialog, and while the slicer is running there is a Cancel that really stops
// it. Cancelling is the user's own doing, so it must not surface as an error.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import { fsSrcUrl } from './helpers';

const PRINT_STORAGE_URL = fsSrcUrl('packages/gallery-app/src/print/print-storage.ts');

const HERE = fileURLToPath(new URL('.', import.meta.url));
const FIX = (n: string) => JSON.parse(readFileSync(join(HERE, 'fixtures', n), 'utf8'));
const PRINTER = FIX('flashforge-adventurer-5m-klipper-left.json');
const FILAMENT = FIX('kingroon-petg-ffadm5.json');

async function seedPresets(page: Page): Promise<void> {
  await page.evaluate(async ({ printer, filament, storeUrl }) => {
    const store = await import(storeUrl);
    await store.savePreset({ kind: 'printer', name: printer.name, raw: printer.raw, parents: printer.parents });
    await store.savePreset({ kind: 'filament', name: filament.name, raw: filament.raw, parents: filament.parents });
  }, { printer: PRINTER, filament: FILAMENT, storeUrl: PRINT_STORAGE_URL });
}

test('slicing shows a cancellable progress overlay', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('/');
  await seedPresets(page);
  await page.reload();

  // Skip when the slicer WASM isn't served — there is no slice to cancel.
  const wasmOk = await page.evaluate(async () => {
    const res = await fetch('/3d-gallery/wasm/libslic3r.wasm', { method: 'HEAD' });
    return res.ok;
  });
  test.skip(!wasmOk, 'slicer WASM assets not present');

  await page.waitForFunction(() => document.querySelectorAll('#model-list .model-item').length > 0);
  await page.locator('#model-list .model-item').first().click();
  const printBtn = page.locator('#print-btn');
  await expect(printBtn).toBeEnabled({ timeout: 60_000 });
  await printBtn.click();
  await expect(page.locator('#plate-added')).toBeVisible({ timeout: 30_000 });

  await page.locator('#plates-btn').click();
  await page.locator('.plate-row').first().getByRole('button', { name: /open/i }).click();
  await expect(page.locator('.plate3d-viewport canvas')).toBeVisible({ timeout: 120_000 });

  // Slicing is two steps now: the plate screen hands over to print setup,
  // which is where the slicer is actually started.
  await page.getByRole('button', { name: 'Slice →' }).click();
  await expect(page.locator('.pd-setup')).toBeVisible();
  await page.getByRole('button', { name: /^(Save & slice|Slice)$/ }).click();

  // The overlay is the whole point: it must be visible without scrolling.
  const overlay = page.locator('.slice-progress');
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  await expect(overlay.locator('.slice-progress-elapsed')).toContainText(/\d+s/);

  // Cancel must actually end the slice and return to an editable dialog,
  // without reporting a failure the user did not cause.
  await overlay.getByRole('button', { name: /cancel/i }).click();
  await expect(overlay).toBeHidden({ timeout: 30_000 });
  await expect(page.locator('.print-dialog-error')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^(Save & slice|Slice)$/ })).toBeEnabled();
});
