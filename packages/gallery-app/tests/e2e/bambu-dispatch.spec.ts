// SPDX-License-Identifier: MIT
//
// A plan sent to a Bambu X1C behind bambu-klipper-proxy, against the
// simulator's Bambu flavour: the queue checks the AMS can feed the plate,
// uploads the kept slice packaged as a .gcode.3mf, and starts it with the
// trays the gallery picked. The card shows the AMS and only the controls the
// proxy carries out.

import { test, expect } from '@playwright/test';
import { fsSrcUrl } from './helpers';
import { fakeMoonraker } from './fixtures/fake-moonraker';

const PRINT_STORAGE_URL = fsSrcUrl('packages/gallery-app/src/print/print-storage.ts');
const PLATE_STORE_URL = fsSrcUrl('packages/gallery-app/src/print/plate-store.ts');
const ADDRESS = 'http://x1c.test:7125';
const GCODE = '; HEADER_BLOCK_START\n; total layer number: 27\n; HEADER_BLOCK_END\n;===== machine: X1\nM620 S1A\nT1\nM621 S1A\n';

test('a Bambu plate uploads as a .gcode.3mf and starts on the trays that feed it', async ({ page }) => {
  await page.route('**/__devstore', (route) => route.abort());
  const printer = await fakeMoonraker(page, {
    address: ADDRESS,
    name: 'X1C',
    bambu: {
      trays: [
        { slot: 0, type: 'PLA Basic', color: '#000000', name: 'Bambu PLA Basic', remain: 80 },
        { slot: 1, type: '', color: '#000000', name: '', remain: -1 },
        { slot: 5, type: 'PLA', color: '#F0F0F0', name: 'PLA Matte', remain: 40 },
      ],
    },
  });
  await page.goto('gallery/');

  const projectId = await page.evaluate(async ({ storeUrl, presetsUrl, address, gcode }) => {
    const store = await import(storeUrl);
    const presets = await import(presetsUrl);
    await presets.savePreset({
      kind: 'printer', name: 'X1C', raw: { printer_model: 'Bambu Lab X1 Carbon', print_host: address }, parents: [], address,
    });
    const project = await store.createProject('AMS test');
    const plate = await store.createPlate('Tag', project.id);
    const filaments = [
      { slot: 1, type: 'PLA', color: '#000000', trayInfoIdx: 'GFA00', usedGrams: 2.72 },
      { slot: 2, type: 'PLA', color: '#FFFFFF', trayInfoIdx: 'GFA00', usedGrams: 0.99 },
    ];
    const slice = await store.putSlicedGcode({
      plateId: plate.id, printerId: 'printer:X1C', filamentId: 'f', signature: store.plateSignature(plate),
      setup: 'x', gcode, seconds: 1930, grams: 3.71, slicedAt: 1000,
      bambu: { printerModelId: 'BL-P001', nozzleDiameter: 0.4, filaments, predictionSec: 1930, weightGrams: 3.71 },
    });
    const jobs = [{
      plateId: plate.id, plateName: 'Tag', printerId: 'printer:X1C', file: '00-tag.gcode.3mf',
      order: 0, material: 'PLA', filament: 'PLA', seconds: 1930, slicedAt: slice.slicedAt,
      ams: filaments.map(({ slot, type, color }) => ({ slot, type, color })),
    }];
    localStorage.setItem(`3dg:print:dispatch:${project.id}`, JSON.stringify({
      projectId: project.id, sentAt: Date.now(), jobs, tasks: [], log: [],
    }));
    return project.id as string;
  }, { storeUrl: PLATE_STORE_URL, presetsUrl: PRINT_STORAGE_URL, address: ADDRESS, gcode: GCODE });

  await page.goto(`printers/?project=${projectId}`);
  const card = page.locator('.printers-card[data-printer="X1C"]');
  const row = card.locator('.pq');
  await expect(row.locator('.pq-job')).toHaveCount(1);
  await expect(row.locator('.pq-checks')).toContainText('1: AMS 1 · 1 Bambu PLA Basic · 2: AMS 2 · 2 PLA Matte (nearest colour)');
  await expect(card.locator('.printers-ams li')).toHaveCount(3);
  await expect(card.getByRole('button', { name: 'Emergency stop' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Firmware restart' })).toHaveCount(0);

  await page.locator('.pq-focus').getByRole('button', { name: 'Upload all (1)' }).click();
  await expect(row.locator('.pq-job .pq-phase.is-uploaded')).toHaveCount(1);
  expect(printer.fileNames()).toEqual(['00-tag.gcode.3mf']);
  await expect(row.locator('.pq-checks')).toContainText('00-tag.gcode.3mf on the printer');

  page.once('dialog', (d) => d.accept());
  await row.getByRole('button', { name: 'Print #00' }).click();
  await expect(row.locator('.pq-job[data-file="00-tag.gcode.3mf"] .pq-phase')).toContainText('Printing');
  expect(printer.state).toBe('printing');
  expect(printer.bambuStarts).toHaveLength(1);
  const start = printer.bambuStarts[0];
  expect(start.amsMapping).toEqual([0, 5]);
  expect(start.explicit).toBe(true);
  expect(start.plateGcode).toBe(GCODE);
  expect(start.filaments).toEqual([{ id: 1, type: 'PLA', color: '#000000' }, { id: 2, type: 'PLA', color: '#FFFFFF' }]);
});
