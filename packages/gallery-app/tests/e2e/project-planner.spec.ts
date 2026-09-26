// SPDX-License-Identifier: MIT
//
// A build's print plates, from the assembly to a print plan: "Load project"
// on the parts list opens a project with one plate per manifest print plate,
// and the planner schedules them across the enabled printers. And the open
// project itself: there is always one, and it's where "Add to project" lands.
//
// Print times come from print-estimates.json. The real file only covers the
// artifacts CI last sliced, so the spec serves one keyed by the plates it just
// made — every plate a known length — and checks the plan, not the slicer.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Dialog, type Page } from '@playwright/test';
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
  await actions.getByRole('button', { name: 'Load project' }).click();

  await expect(page).toHaveURL(/[?&]project=/);
  const projectId = new URL(page.url()).searchParams.get('project')!;
  const planner = page.locator('.planner');
  await expect(planner.locator('.planner-plate')).toHaveCount(4);
  await expect(planner.locator('.planner-plate .planner-chip').filter({ hasText: 'TPU' })).toHaveCount(1);
  await expect(planner.locator('.planner-plate .planner-chip').filter({ hasText: 'PETG' })).toHaveCount(3);

  await serveEstimates(page, projectId);
  await page.reload();

  // 13h of printing on two printers: the plan puts every plate on a bar.
  await expect(planner.locator('.gantt-bar')).toHaveCount(4);
  await expect(planner.locator('.gantt-row')).toHaveCount(2);
  const summary = planner.locator('.planner-summary');
  await expect(summary.locator('[data-plan="print"] .planner-stat-value')).toHaveText('13h 00m');
  // Three PETG plates and one TPU, 10 g each, all from CI so far.
  await expect(summary.locator('.planner-filament-list li')).toHaveText([/PETG\s*≈30 g/, /TPU 64D\s*≈10 g/, /Total\s*≈40 g/]);
  // The TPU plate costs a filament swap wherever it lands after PETG.
  await expect(planner.locator('.gantt-bar.is-tpu')).toHaveCount(1);

  // Plates are numbered from 0 in the order they start, and read in that order.
  await expect(planner.locator('.planner-plate-num')).toHaveText(['#0', '#1', '#2', '#3']);

  // Fewer trips is never more trips, and one printer takes longest.
  const trips = async (plan: string) =>
    Number((await summary.locator(`[data-plan="${plan}"] .planner-trips`).textContent())!.split(' ')[0]);
  expect(await trips('visits')).toBeLessThanOrEqual(await trips('makespan'));
  await expect(summary.locator('[data-plan="one"] .planner-stat-value')).not.toHaveText('—');

  // Nothing is sliced, so nothing can be sent.
  await expect(planner.getByRole('button', { name: 'Send to printers' })).toBeDisabled();
  await expect(planner.locator('.planner-checks')).toContainText('0/4 plates sliced');

  await planner.getByRole('button', { name: 'Trips' }).click();
  await expect(planner.locator('.planner-visit').first()).toContainText('Now');
  await planner.getByRole('button', { name: 'Chart' }).click();
  await planner.getByLabel('Optimize for').selectOption('visits');
  await expect(planner.locator('.gantt-bar')).toHaveCount(4);

  // Switching a printer off puts everything on the other.
  await planner.locator('.planner-printer').filter({ hasText: 'Right' }).getByRole('checkbox').uncheck();
  await expect(planner.locator('.gantt-row')).toHaveCount(1);
  await expect(planner.locator('.gantt-bar')).toHaveCount(4);
  // One of two on leaves All part-way; ticking it turns both on, unticking both off.
  const all = planner.getByRole('checkbox', { name: /All printers/ });
  await all.check();
  await expect(planner.locator('.gantt-row')).toHaveCount(2);
  await all.uncheck();
  await expect(planner.locator('.gantt-bar')).toHaveCount(0);
  await expect(planner.getByRole('button', { name: 'Send to printers' })).toBeDisabled();
  await all.check();

  // Edit plate opens the editor, and closing it comes back to the planner.
  await planner.locator('.planner-plate').first().getByRole('button', { name: 'Edit plate' }).click();
  await expect(page).toHaveURL(/[?&]plate=/);
  await page.locator('.print-modal-close').click();
  await expect(page).toHaveURL(new RegExp(`[?&]project=${projectId}`));
  await expect(planner.locator('.planner-plate')).toHaveCount(4);

  // Back closes the planner and leaves the gallery where it was.
  await page.goBack();
  await expect(planner).toHaveCount(0);
  await expect(page).toHaveURL(/model=filament-spool-roller/);
});

test('the open project is always there, takes parts, and asks before an unsaved one is replaced', async ({ page }) => {
  await page.route('**/__devstore', (route) => route.abort());
  await loadModel(page, 'filament-spool-roller', { build: '1x', part: 'stand_tiles' });

  // First visit: an empty, unsaved project.
  await page.locator('#plates-btn').click();
  const planner = page.locator('.planner');
  await expect(planner.locator('.planner-unsaved')).toBeVisible();
  await expect(planner.locator('.planner-plate')).toHaveCount(0);

  // Two plates; the second is picked, so Add to project fills it.
  await planner.getByRole('button', { name: 'New plate' }).click();
  await planner.getByRole('button', { name: 'New plate' }).click();
  await expect(planner.locator('.planner-plate')).toHaveCount(2);
  const picked = planner.locator('.planner-plate.is-target');
  await expect(picked).toHaveCount(1);
  const pickedId = await picked.getAttribute('data-plate');
  await page.locator('.print-modal-close').click();

  await loadModel(page, 'filament-spool-roller', { build: '1x', part: 'stand_tiles' });
  const printBtn = page.locator('#print-btn');
  await expect(printBtn).toBeEnabled({ timeout: 60_000 });
  await printBtn.click();
  await expect(page.locator('#plate-added')).toBeVisible({ timeout: 30_000 });
  await page.locator('#plate-added').getByRole('link', { name: 'Open project' }).click();
  await expect(planner.locator(`.planner-plate[data-plate="${pickedId}"]`)).not.toHaveClass(/is-empty/);
  await expect(planner.locator('.planner-plate.is-empty')).toHaveCount(1);
  await page.locator('.print-modal-close').click();

  // Loading a build over unsaved work asks; declining keeps it.
  const actions = page.locator('#project-actions');
  page.once('dialog', (d) => void d.dismiss());
  await actions.getByRole('button', { name: 'Load project' }).click();
  await expect(page).not.toHaveURL(/[?&]project=/);
  await page.locator('#plates-btn').click();
  await expect(planner.locator('.planner-plate')).toHaveCount(2);

  // Saved, it's on the shelf and replacing it asks nothing.
  await planner.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(planner.locator('.planner-unsaved')).toHaveCount(0);
  await page.locator('.print-modal-close').click();
  let asked = false;
  const ask = (d: Dialog) => { asked = true; void d.dismiss(); };
  page.on('dialog', ask);
  await actions.getByRole('button', { name: 'Load project' }).click();
  await expect(planner.locator('.planner-plate')).toHaveCount(4);
  page.off('dialog', ask);
  expect(asked).toBe(false);
  await expect(planner.locator('.planner-unsaved')).toBeVisible();

  // The saved one is still there to go back to, at the price of the unsaved build.
  await planner.getByRole('button', { name: 'Projects…' }).click();
  await expect(page.locator('.project-row')).toHaveCount(1);
  page.once('dialog', (d) => void d.accept());
  await page.locator('.project-row').getByRole('button', { name: 'Open' }).click();
  await expect(planner.locator('.planner-plate')).toHaveCount(2);
});
