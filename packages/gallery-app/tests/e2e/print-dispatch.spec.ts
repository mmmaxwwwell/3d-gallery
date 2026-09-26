// SPDX-License-Identifier: MIT
//
// The printers screen against a fake Moonraker: a sent plan's plates upload
// in the background, the printer passes its readiness checks, Print starts
// the head of its belt, and the belt moves on once the printer says it's done.

import { test, expect, type Page, type Route } from '@playwright/test';
import { fsSrcUrl } from './helpers';

const PRINT_STORAGE_URL = fsSrcUrl('packages/gallery-app/src/print/print-storage.ts');
const PLATE_STORE_URL = fsSrcUrl('packages/gallery-app/src/print/plate-store.ts');
const ADDRESS = 'http://printer.test:7125';

/** A Moonraker that keeps its files, prints on request, and finishes when told. */
function fakeMoonraker(page: Page) {
  const state = {
    files: new Set<string>(),
    printing: '' as string,
    history: [] as Array<{ filename: string; status: string; start_time: number }>,
    failUploads: 0,
  };
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(body),
  });
  void page.route('http://printer.test*/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path === '/server/info') return json(route, { result: { klippy_state: 'ready' } });
    if (path === '/server/webcams/list') return json(route, { result: { webcams: [] } });
    if (path === '/printer/objects/query') {
      return json(route, { result: { status: {
        print_stats: { state: state.printing ? 'printing' : 'standby', filename: state.printing, print_duration: 60 },
        virtual_sdcard: { progress: state.printing ? 0.25 : 0 },
      } } });
    }
    if (path === '/server/files/metadata') {
      const name = url.searchParams.get('filename')!;
      return state.files.has(name) ? json(route, { result: { filename: name } }) : json(route, { error: 'not found' }, 404);
    }
    if (path === '/server/files/upload') {
      if (state.failUploads > 0) {
        state.failUploads--;
        return json(route, { error: 'disk full' }, 500);
      }
      const body = route.request().postDataBuffer()?.toString('latin1') ?? '';
      const name = /filename="([^"]+)"/.exec(body)?.[1];
      if (name) state.files.add(name);
      return json(route, { result: { item: { path: name } } }, 201);
    }
    if (path === '/printer/print/start') {
      state.printing = url.searchParams.get('filename')!;
      state.history.unshift({ filename: state.printing, status: 'in_progress', start_time: Date.now() / 1000 });
      return json(route, { result: 'ok' });
    }
    if (path === '/server/history/list') return json(route, { result: { jobs: state.history } });
    return json(route, { error: `unmocked ${path}` }, 404);
  });
  return {
    state,
    finish() {
      state.history[0].status = 'completed';
      state.printing = '';
    },
  };
}

test('a sent plan uploads, starts on Print, and the belt moves on', async ({ page }) => {
  await page.route('**/__devstore', (route) => route.abort());
  const moonraker = fakeMoonraker(page);
  moonraker.state.failUploads = 1;
  await page.goto('./');

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

  await page.goto(`./?dispatch=${projectId}`);
  const screen = page.locator('.dispatch');
  const row = screen.locator('.dispatch-row[data-printer="Left"]');
  await expect(row.locator('.dispatch-job')).toHaveCount(2);
  await expect(row.locator('.dispatch-checks')).toContainText('Klipper ready');
  await expect(row.getByRole('button', { name: 'Print #00' })).toBeDisabled();

  // The first upload fails; the queue says why and retries it.
  await screen.getByRole('button', { name: 'Upload all (2)' }).click();
  await expect(screen.locator('.dispatch-queue .is-failed')).toContainText('500');
  await screen.getByRole('button', { name: 'Retry failed (1)' }).click();
  await expect(row.locator('.dispatch-job .dispatch-phase.is-uploaded')).toHaveCount(2);
  expect([...moonraker.state.files].sort()).toEqual(['00-tiles.gcode', '01-pegs.gcode']);

  await expect(row.locator('.dispatch-checks')).toContainText('00-tiles.gcode on the printer');
  page.once('dialog', (d) => d.accept());
  await row.getByRole('button', { name: 'Print #00' }).click();
  await expect(row.locator('.dispatch-job[data-file="00-tiles.gcode"] .dispatch-phase')).toContainText('Printing');
  expect(moonraker.state.printing).toBe('00-tiles.gcode');
  // Busy printer: the next plate waits.
  await expect(row.getByRole('button', { name: 'Print #01' })).toBeDisabled();

  moonraker.finish();
  await row.getByRole('button', { name: 'Check Left again' }).click();
  await expect(row.locator('.dispatch-job')).toHaveCount(1);
  await expect(row.locator('.dispatch-finished')).toContainText('1 off the belt');
  await expect(row.getByRole('button', { name: 'Print #01' })).toBeEnabled();

  await screen.getByRole('tab', { name: /Log/ }).click();
  await expect(screen.locator('.dispatch-log')).toContainText('00-tiles.gcode finished');
});
