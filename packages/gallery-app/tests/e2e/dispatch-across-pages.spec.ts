// SPDX-License-Identifier: MIT
//
// Two pages open on one project's printers screen: only one of them runs the
// queue. An upload asked for in either page reaches the printer exactly once,
// both pages see it land, and when the running page closes the other takes
// over.

import { test, expect, type BrowserContext, type Route } from '@playwright/test';
import { fsSrcUrl } from './helpers';

const PRINT_STORAGE_URL = fsSrcUrl('packages/gallery-app/src/print/print-storage.ts');
const PLATE_STORE_URL = fsSrcUrl('packages/gallery-app/src/print/plate-store.ts');
const ADDRESS = 'http://printer.test:7125';

/** A Moonraker shared by every page in the context, counting what it's sent. */
function fakeMoonraker(context: BrowserContext) {
  const state = { files: new Set<string>(), uploads: [] as string[], starts: [] as string[], printing: '' };
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(body),
  });
  void context.route('http://printer.test*/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path === '/server/info') return json(route, { result: { klippy_state: 'ready' } });
    if (path === '/server/webcams/list') return json(route, { result: { webcams: [] } });
    if (path === '/printer/objects/query') {
      return json(route, { result: { status: {
        print_stats: { state: state.printing ? 'printing' : 'standby', filename: state.printing, print_duration: 60 },
        virtual_sdcard: { progress: 0 },
      } } });
    }
    if (path === '/server/files/metadata') {
      const name = url.searchParams.get('filename')!;
      return state.files.has(name) ? json(route, { result: { filename: name } }) : json(route, { error: 'not found' }, 404);
    }
    if (path === '/server/files/upload') {
      const body = route.request().postDataBuffer()?.toString('latin1') ?? '';
      const name = /filename="([^"]+)"/.exec(body)?.[1] ?? '';
      state.uploads.push(name);
      state.files.add(name);
      return json(route, { result: { item: { path: name } } }, 201);
    }
    if (path === '/printer/print/start') {
      state.printing = url.searchParams.get('filename')!;
      state.starts.push(state.printing);
      return json(route, { result: 'ok' });
    }
    if (path === '/server/history/list') return json(route, { result: { jobs: [] } });
    return json(route, { error: `unmocked ${path}` }, 404);
  });
  return state;
}

test('two pages on one queue run each upload once, and hand over on close', async ({ context }) => {
  await context.route('**/__devstore', (route) => route.abort());
  const moonraker = fakeMoonraker(context);
  const a = await context.newPage();
  await a.goto('./');

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
  await a.goto(`./?dispatch=${projectId}`);
  await expect(a.locator('.dispatch-card[data-printer="Left"] .dispatch-job')).toHaveCount(2);
  const b = await context.newPage();
  await b.goto(`./?dispatch=${projectId}`);
  const rowB = b.locator('.dispatch-card[data-printer="Left"]');
  await expect(rowB.locator('.dispatch-job')).toHaveCount(2);

  // Asked for in B, which only writes the queue; A runs it and both see it land.
  await b.locator('.dispatch').getByRole('button', { name: 'Upload all (2)' }).click();
  for (const page of [a, b]) {
    await expect(page.locator('.dispatch-card[data-printer="Left"] .dispatch-phase.is-uploaded')).toHaveCount(2);
  }
  expect(moonraker.uploads.sort()).toEqual(['00-tiles.gcode', '01-pegs.gcode']);

  // With A gone, B takes the lock and runs the start itself.
  await a.close();
  await expect(rowB.locator('.dispatch-checks')).toContainText('00-tiles.gcode on the printer');
  b.once('dialog', (d) => d.accept());
  await rowB.getByRole('button', { name: 'Print #00' }).click();
  await expect(rowB.locator('.dispatch-job[data-file="00-tiles.gcode"] .dispatch-phase')).toContainText('Printing');
  expect(moonraker.starts).toEqual(['00-tiles.gcode']);
  expect(moonraker.uploads).toHaveLength(2);
});
