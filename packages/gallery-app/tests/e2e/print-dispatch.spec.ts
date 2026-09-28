// SPDX-License-Identifier: MIT
//
// The Printers page's queue against the Moonraker simulator: a sent plan's
// plates upload in the background, the printer passes its readiness checks,
// Print starts the head of its belt, and the belt moves on once the printer
// says it's done. An old `?dispatch=` link lands on the same page.

import { test, expect } from '@playwright/test';
import { fsSrcUrl } from './helpers';
import { fakeMoonraker } from './fixtures/fake-moonraker';

const PRINT_STORAGE_URL = fsSrcUrl('packages/gallery-app/src/print/print-storage.ts');
const PLATE_STORE_URL = fsSrcUrl('packages/gallery-app/src/print/plate-store.ts');
const ADDRESS = 'http://printer.test:7125';

test('a sent plan uploads, starts on Print, and the belt moves on', async ({ page }) => {
  await page.route('**/__devstore', (route) => route.abort());
  const printer = await fakeMoonraker(page, { address: ADDRESS, name: 'Left' });
  printer.faults.failUploads = 1;
  await page.goto('gallery/');

  const projectId = await page.evaluate(async ({ storeUrl, presetsUrl, address }) => {
    const store = await import(storeUrl);
    const presets = await import(presetsUrl);
    await presets.savePreset({ kind: 'printer', name: 'Left', raw: { print_host: address }, parents: [], address });
    const project = await store.createProject('Dispatch test');
    const jobs = [];
    for (const [i, name] of ['Tiles', 'Pegs'].entries()) {
      const plate = await store.createPlate(name, project.id);
      const slice = await store.putSlicedGcode({
        plateId: plate.id, printerId: 'printer:Left', filamentId: 'f', signature: store.plateSignature(plate),
        setup: 'x', gcode: `; ${name}\nG28\n`, seconds: 3600, grams: 10, slicedAt: 1000 + i,
      });
      jobs.push({
        plateId: plate.id, plateName: name, printerId: 'printer:Left', file: `0${i}-${name.toLowerCase()}.gcode`,
        order: i, material: 'PETG', filament: 'PETG', seconds: 3600, slicedAt: slice.slicedAt,
      });
    }
    localStorage.setItem(`3dg:print:dispatch:${project.id}`, JSON.stringify({
      projectId: project.id, sentAt: Date.now(), jobs, tasks: [], log: [],
    }));
    return project.id as string;
  }, { storeUrl: PLATE_STORE_URL, presetsUrl: PRINT_STORAGE_URL, address: ADDRESS });

  // The old per-project screen's link forwards to the Printers page, focused on the plan.
  await page.goto(`gallery/?dispatch=${projectId}`);
  await expect(page).toHaveURL(new RegExp(`/printers/\\?project=${projectId}$`));
  const focus = page.locator('.pq-focus');
  await expect(focus.locator('.pq-focus-name')).toHaveText('Dispatch test');
  const row = page.locator('.printers-card[data-printer="Left"] .pq');
  await expect(row.locator('.pq-project.is-focus')).toHaveCount(1);
  await expect(row.locator('.pq-job')).toHaveCount(2);
  await expect(row.locator('.pq-checks')).toContainText('Klipper ready');
  await expect(row.getByRole('button', { name: 'Print #00' })).toBeDisabled();

  // The first upload fails; the queue says why and retries it.
  await focus.getByRole('button', { name: 'Upload all (2)' }).click();
  await page.getByRole('button', { name: /^Queue \(/ }).click();
  const sheet = page.locator('.pq-sheet');
  await expect(sheet.locator('.pq-tasks .is-failed')).toContainText('500');
  await sheet.getByRole('button', { name: 'Retry failed (1)' }).click();
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(row.locator('.pq-job .pq-phase.is-uploaded')).toHaveCount(2);
  expect(printer.fileNames()).toEqual(['00-tiles.gcode', '01-pegs.gcode']);

  await expect(row.locator('.pq-checks')).toContainText('00-tiles.gcode on the printer');
  page.once('dialog', (d) => d.accept());
  await row.getByRole('button', { name: 'Print #00' }).click();
  await expect(row.locator('.pq-job[data-file="00-tiles.gcode"] .pq-phase')).toContainText('Printing');
  expect(printer.state).toBe('printing');
  expect(printer.filename).toBe('00-tiles.gcode');
  // Busy printer: the next plate waits.
  await expect(row.getByRole('button', { name: 'Print #01' })).toBeDisabled();

  printer.finish();
  await row.getByRole('button', { name: 'Check Left again' }).click();
  await expect(row.locator('.pq-job')).toHaveCount(1);
  await expect(row.locator('.pq-finished')).toContainText('1 off the queue');
  await expect(row.getByRole('button', { name: 'Print #01' })).toBeEnabled();

  await page.getByRole('button', { name: /^Queue \(/ }).click();
  await sheet.getByRole('tab', { name: /Log/ }).click();
  await expect(sheet.locator('.pq-log')).toContainText('00-tiles.gcode finished');
});
