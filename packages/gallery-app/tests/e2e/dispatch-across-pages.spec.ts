// SPDX-License-Identifier: MIT
//
// Two Printers pages open on one project's plan: only one of them runs the
// queue. An upload asked for in either page reaches the printer exactly once,
// both pages see it land, and when the running page closes the other takes
// over.

import { test, expect } from '@playwright/test';
import { fsSrcUrl } from './helpers';
import { fakeMoonraker } from './fixtures/fake-moonraker.ts';

const PRINT_STORAGE_URL = fsSrcUrl('packages/gallery-app/src/print/print-storage.ts');
const PLATE_STORE_URL = fsSrcUrl('packages/gallery-app/src/print/plate-store.ts');
const ADDRESS = 'http://printer.test:7125';

test('two pages on one queue run each upload once, and hand over on close', async ({ context }) => {
  await context.route('**/__devstore', (route) => route.abort());
  const printer = await fakeMoonraker(context, { address: ADDRESS, name: 'Left' });
  const uploads = () => printer.requests.filter((r) => r === 'POST /server/files/upload').length;
  const starts = () => printer.scripts.filter((s) => s.startsWith('SDCARD_PRINT_FILE'));
  const a = await context.newPage();
  await a.goto('gallery/');

  const projectId = await a.evaluate(async ({ storeUrl, presetsUrl, address }) => {
    const store = await import(storeUrl);
    const presets = await import(presetsUrl);
    await presets.savePreset({ kind: 'printer', name: 'Left', raw: { print_host: address }, parents: [], address });
    const project = await store.createProject('Two pages');
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

  // A opens the queue first, so A holds the lock.
  const queueOf = (page: typeof a) => page.locator('.printers-card[data-printer="Left"] .pq');
  await a.goto(`printers/?project=${projectId}`);
  await expect(queueOf(a).locator('.pq-job')).toHaveCount(2);
  const b = await context.newPage();
  await b.goto(`printers/?project=${projectId}`);
  const rowB = queueOf(b);
  await expect(rowB.locator('.pq-job')).toHaveCount(2);

  // Asked for in B, which only writes the queue; A runs it and both see it land.
  await b.locator('.pq-focus').getByRole('button', { name: 'Upload all (2)' }).click();
  for (const page of [a, b]) {
    await expect(queueOf(page).locator('.pq-phase.is-uploaded')).toHaveCount(2);
  }
  expect(uploads()).toBe(2);
  expect(printer.fileNames()).toEqual(['00-tiles.gcode', '01-pegs.gcode']);

  // With A gone, B takes the lock and runs the start itself.
  await a.close();
  await expect(rowB.locator('.pq-checks')).toContainText('00-tiles.gcode on the printer');
  b.once('dialog', (d) => d.accept());
  await rowB.getByRole('button', { name: 'Print #00' }).click();
  await expect(rowB.locator('.pq-job[data-file="00-tiles.gcode"] .pq-phase')).toContainText('Printing');
  expect(starts()).toEqual(['SDCARD_PRINT_FILE FILENAME="00-tiles.gcode"']);
  expect(uploads()).toBe(2);
});
