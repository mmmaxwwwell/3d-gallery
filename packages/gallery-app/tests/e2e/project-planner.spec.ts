// SPDX-License-Identifier: MIT
//
// A build's print plates, from the assembly to a print plan: "+ New project"
// on the parts list makes one plate per manifest print plate and opens the
// planner, which schedules them across the enabled printers.
//
// Print times come from print-estimates.json. The real file only covers the
// artifacts CI last sliced, so the spec serves one keyed by the plates it just
// made — every plate a known length — and checks the plan, not the slicer.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import { fsSrcUrl, loadModel } from './helpers';

const PRINT_STORAGE_URL = fsSrcUrl('packages/gallery-app/src/print/print-storage.ts');
const PLATE_STORE_URL = fsSrcUrl('packages/gallery-app/src/print/plate-store.ts');

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PRINTER = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'flashforge-adventurer-5m-klipper-left.json'), 'utf8'),
) as { name: string; raw: Record<string, unknown>; parents: Array<{ name: string; raw: Record<string, unknown> }> };

/** Two printers with no Moonraker address, so nothing on the LAN is ever asked. */
async function seedPrinters(page: Page): Promise<void> {
  await page.evaluate(async ({ p, storeUrl }) => {
    const store = await import(storeUrl);
    for (const name of ['Left', 'Right']) {
      await store.savePreset({ kind: 'printer', name, raw: { ...p.raw, print_host: '' }, parents: p.parents });
    }
  }, { p: PRINTER, storeUrl: PRINT_STORAGE_URL });
}

const HOURS = [5, 4, 3, 1];

/** An estimates file giving the project's plates, in order, the lengths in HOURS. */
async function serveEstimates(page: Page, projectId: string): Promise<void> {
  const keys: string[] = await page.evaluate(async ({ storeUrl, id }) => {
    const store = await import(storeUrl);
    const plates = await store.listPlates(id);
    return plates.map((p: { items: Array<{ key: string }> }) => p.items[0].key);
  }, { storeUrl: PLATE_STORE_URL, id: projectId });
  const rates = [{ mmPerS: 3, label: 'TPU' }, { mmPerS: 12, label: 'PETG' }];
  const estimates = Object.fromEntries(keys.map((key, i) => {
    const seconds = (HOURS[i] ?? 1) * 3600;
    return [key, { seconds: { 3: seconds, 12: seconds }, grams: 10, supportGrams: 2, purgeGrams: 1, cost: 0.1 }];
  }));
  // One density throughout, so a plate weighs its 10 g whatever it prints in.
  const settings = {
    rates,
    defaultMaterial: 'PETG',
    filament: { material: 'PETG', density: 1.27, costPerKg: 10 },
    densities: { PETG: 1.27, TPU: 1.27 },
    printer: 'FlashForge Adventurer 5M, 0.4 mm nozzle',
    profile: '0.2 mm layers',
  };
  await page.route('**/models/print-estimates.json', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ settings, estimates }),
  }));
}

test('a build\'s plates become a project the planner schedules', async ({ page }) => {
  // The dev server's opt-in preset store would hand this browser the real
  // fleet, Moonraker addresses and all.
  await page.route('**/__devstore', (route) => route.abort());
  await loadModel(page, 'filament-spool-roller', { build: '1x', part: 'stand_tiles' });
  await seedPrinters(page);
  // A one-minute bedtime at 03:00, so the operator never blocks the plan.
  await page.evaluate(() => localStorage.setItem('3dg:print:planner', JSON.stringify({ bedtime: '03:00', wake: '03:01' })));

  const actions = page.locator('#project-actions');
  await expect(actions).toContainText('4 print plates');
  await expect(actions).toContainText('4 walls, 15% gyroid, no supports, no brim');
  await actions.getByRole('button', { name: '+ New project' }).click();

  await expect(page).toHaveURL(/[?&]project=/);
  const projectId = new URL(page.url()).searchParams.get('project')!;
  const planner = page.locator('.planner');
  await expect(planner.locator('.planner-plate')).toHaveCount(4);
  await expect(planner.locator('.planner-plate .planner-chip')).toContainText(['PETG', 'PETG', 'PETG', 'TPU']);

  await serveEstimates(page, projectId);
  await page.reload();

  // 13h of printing on two printers: the plan puts every plate on a bar.
  await expect(planner.locator('.gantt-bar')).toHaveCount(4);
  await expect(planner.locator('.gantt-row')).toHaveCount(2);
  await expect(planner.locator('.planner-headline')).toContainText('13h 00m');
  await expect(planner.locator('.planner-visit').first()).toContainText('Now');
  // The TPU plate costs a filament swap wherever it lands after PETG.
  await expect(planner.locator('.gantt-bar.is-tpu')).toHaveCount(1);

  // Fewer trips is never more trips.
  const trips = async () => Number(await planner.locator('.planner-headline .planner-big').nth(1).textContent());
  const fastTrips = await trips();
  await planner.getByLabel('Optimize for').selectOption('visits');
  expect(await trips()).toBeLessThanOrEqual(fastTrips);

  // Switching a printer off puts everything on the other.
  await planner.locator('.planner-printer').filter({ hasText: 'Right' }).getByRole('checkbox').uncheck();
  await expect(planner.locator('.gantt-row')).toHaveCount(1);
  await expect(planner.locator('.gantt-bar')).toHaveCount(4);

  // Back closes the planner and leaves the gallery where it was.
  await page.goBack();
  await expect(planner).toHaveCount(0);
  await expect(page).toHaveURL(/model=filament-spool-roller/);
});

test('the parts list sums up what the planner would make of a build\'s plates', async ({ page }) => {
  await page.route('**/__devstore', (route) => route.abort());
  await loadModel(page, 'filament-spool-roller', { build: '1x', part: 'stand_tiles' });
  await seedPrinters(page);
  await page.evaluate(() => localStorage.setItem('3dg:print:planner', JSON.stringify({ bedtime: '03:00', wake: '03:01' })));

  // The plates' artifact keys, by way of a project made from them.
  await page.locator('#project-actions').getByRole('button', { name: '+ New project' }).click();
  await expect(page).toHaveURL(/[?&]project=/);
  await serveEstimates(page, new URL(page.url()).searchParams.get('project')!);
  await loadModel(page, 'filament-spool-roller', { build: '1x', part: 'stand_tiles' });

  const actions = page.locator('#project-actions');
  const times = actions.locator('.estimate-row');
  await expect(times).toHaveCount(3);
  await expect(times.nth(0)).toContainText('All 4 plates, back to back');
  await expect(times.nth(0).locator('.estimate-time')).toHaveText('13h 00m');
  await expect(times.nth(1)).toContainText(/2 printers, lowest wall-clock · \d+ trips?/);
  await expect(times.nth(2)).toContainText(/2 printers, fewest trips · \d+ trips?/);

  // Three PETG plates and one TPU, 10 g each: 2 g of it support, 1 g purge.
  const rows = actions.locator('.filament-summary tbody tr');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0).locator('td')).toHaveText(['PETG', '21 g', '6 g', '3 g', '30 g']);
  await expect(rows.nth(1).locator('td')).toHaveText(['TPU 64D', '7 g', '2 g', '1 g', '10 g']);
  await expect(rows.nth(2).locator('td')).toHaveText(['Total', '28 g', '8 g', '4 g', '40 g']);
});
