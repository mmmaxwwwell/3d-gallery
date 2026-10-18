// SPDX-License-Identifier: MIT
//
// The X1C the whole way, in the browser: the built-in Bambu presets from
// Settings, a two-colour print plate loaded as a project, the planner slicing
// it for the X1C with the real slicer WASM (one AMS slot per colour), Send to
// printers, and the Printers page uploading the .gcode.3mf and starting it on
// the AMS trays loaded with those colours. The printer is the simulator's
// Bambu flavour; nothing leaves the browser.

import { test, expect } from '@playwright/test';
import { loadModel, slicerWasmServed } from './helpers';
import { fakeMoonraker } from './fixtures/fake-moonraker';

const ADDRESS = 'http://x1c.test:7125';

test('a two-colour plate slices for the X1C and starts on its AMS', async ({ page }) => {
  test.setTimeout(300_000);
  await page.route('**/__devstore', (route) => route.abort());
  const printer = await fakeMoonraker(page.context(), {
    address: ADDRESS,
    name: 'X1C',
    bambu: {
      trays: [
        // Not the model's #000000: the slice asks for the black that's loaded.
        { slot: 0, type: 'PLA', color: '#161616', name: 'Bambu PLA Basic', remain: 90 },
        { slot: 1, type: 'PLA', color: '#FFFFFF', name: 'Bambu PLA Basic', remain: 70 },
      ],
    },
  });

  await loadModel(page, 'qr-leash-tag', { part: 'plate' });
  test.skip(!(await slicerWasmServed(page)), 'libslic3r.wasm not served — populate packages/print-toolkit/assets first.');
  // A one-minute bedtime at 03:00, so the operator never blocks the plan.
  await page.evaluate(() => localStorage.setItem('3dg:print:planner', JSON.stringify({ bedtime: '03:00', wake: '03:01' })));

  await page.goto('settings/');
  await page.getByRole('button', { name: 'Add the X1 Carbon presets' }).click();
  await expect(page.locator('.print-settings-notice').filter({ hasText: 'Imported' })).toHaveText('Imported 4 presets.');
  await page.getByRole('button', { name: /^Printers/ }).click();
  const x1c = page.locator('.print-settings-item').filter({ hasText: 'Bambu Lab X1 Carbon 0.4 nozzle' });
  await x1c.getByPlaceholder('printer.local:7125').fill(ADDRESS);
  await x1c.getByRole('button', { name: 'Save' }).click();
  await expect(x1c.getByRole('button', { name: 'Save' })).toBeDisabled();

  await loadModel(page, 'qr-leash-tag', { part: 'plate' });
  const actions = page.locator('#project-actions');
  await actions.getByRole('button', { name: 'Load project' }).click();
  await actions.getByRole('link', { name: 'Open project' }).click();
  await expect(page).toHaveURL(/\/project\/\?id=/);

  const planner = page.locator('.planner');
  await expect(planner.locator('.planner-printer')).toContainText('AMS: PLA #161616, PLA #FFFFFF');
  await expect(planner.locator('.planner-checks')).toContainText('1/1 plates sliced for their printer', { timeout: 240_000 });
  await expect(planner.locator('.planner-plate .planner-slice-status')).toHaveText('Sliced for Bambu Lab X1 Carbon 0.4 nozzle');
  await planner.getByRole('button', { name: 'Send to printers' }).click();
  await expect(page).toHaveURL(/\/printers\/\?project=/);

  const row = page.locator('.printers-card[data-printer="Bambu Lab X1 Carbon 0.4 nozzle"] .pq');
  await expect(row.locator('.pq-checks')).toContainText('1: AMS 1 · 1 Bambu PLA Basic · 2: AMS 1 · 2 Bambu PLA Basic');
  await page.locator('.pq-focus').getByRole('button', { name: 'Upload all (1)' }).click();
  await expect(row.locator('.pq-job .pq-phase.is-uploaded')).toHaveCount(1);
  const [file] = printer.fileNames();
  expect(file).toMatch(/^00-.+\.gcode\.3mf$/);

  page.once('dialog', (d) => d.accept());
  await row.getByRole('button', { name: 'Print #00' }).click();
  await expect(row.locator('.pq-job .pq-phase')).toContainText('Printing');
  expect(printer.bambuStarts).toHaveLength(1);
  const start = printer.bambuStarts[0];
  expect(start.filename).toBe(file);
  expect(start.amsMapping).toEqual([0, 1]);
  expect(start.filaments).toEqual([{ id: 1, type: 'PLA', color: '#161616' }, { id: 2, type: 'PLA', color: '#FFFFFF' }]);
  // Bambu's own start G-code, and the tool changes through the AMS.
  expect(start.plateGcode).toContain(';===== machine: X1');
  expect(start.plateGcode).toMatch(/^M620 S0A/m);
  expect(start.plateGcode).toMatch(/^M620 S1A/m);
  expect(start.plateGcode).toMatch(/^T0$/m);
  expect(start.plateGcode).toMatch(/^T1$/m);
});
