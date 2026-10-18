// SPDX-License-Identifier: MIT
//
// An agent prints a part through the dev server's MCP endpoint, the way the
// person would: find the model, add the part to the project, make the plate
// black PCTG, let it slice, send the plan, upload, and start it. It talks
// only to /__mcp; the page it drives is this test's tab, and the printer is
// the Moonraker simulator.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { fsSrcUrl, slicerWasmServed } from './helpers';
import { fakeMoonraker } from './fixtures/fake-moonraker';

const PRINT_STORAGE_URL = fsSrcUrl('packages/gallery-app/src/print/print-storage.ts');
const ADDRESS = 'http://printer.test:7125';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const FIX = (n: string) => JSON.parse(readFileSync(join(HERE, 'fixtures', n), 'utf8'));
const PRINTER = FIX('flashforge-adventurer-5m-klipper-left.json');
const PETG = FIX('kingroon-petg-ffadm5.json');

/** The person's imported presets: one printer on the simulator, and a PETG and a black PCTG filament. */
async function seedPresets(page: Page): Promise<void> {
  const pctg = {
    ...PETG,
    name: 'Test PCTG Black',
    raw: { ...PETG.raw, filament_settings_id: ['Test PCTG Black'], filament_type: ['PCTG'], filament_colour: ['#000000'] },
  };
  await page.evaluate(async ({ printer, filaments, storeUrl, address }) => {
    const store = await import(storeUrl);
    await store.savePreset({ kind: 'printer', name: 'Left', raw: { ...printer.raw, print_host: address }, parents: printer.parents, address });
    for (const f of filaments) await store.savePreset({ kind: 'filament', name: f.name, raw: f.raw, parents: f.parents });
  }, { printer: PRINTER, filaments: [PETG, pctg], storeUrl: PRINT_STORAGE_URL, address: ADDRESS });
}

interface ToolResult {
  content: Array<{ type: string; text?: string; data?: string }>;
  structuredContent?: any;
  isError?: boolean;
}

function mcp(request: APIRequestContext) {
  let id = 0;
  return async (name: string, args: Record<string, unknown> = {}): Promise<ToolResult> => {
    const res = await request.post('__mcp', {
      data: { jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name, arguments: args } },
      timeout: 600_000,
    });
    expect(res.ok()).toBe(true);
    return (await res.json()).result as ToolResult;
  };
}

const text = (r: ToolResult) => r.content.map((c) => c.text ?? '').join('\n');

test('an agent prints a part in black PCTG over MCP', async ({ page, request }) => {
  test.setTimeout(400_000);
  await page.route('**/__devstore', (route) => route.abort());
  const printer = await fakeMoonraker(page, { address: ADDRESS, name: 'Left' });
  const tabId = await nameTab(page);
  await page.goto('gallery/');
  await seedPresets(page);
  // A one-minute bedtime at 03:00, so the operator never blocks the plan.
  await page.evaluate(() => localStorage.setItem('3dg:print:planner', JSON.stringify({ bedtime: '03:00', wake: '03:01' })));
  test.skip(!(await slicerWasmServed(page)), 'slicer WASM assets not present');
  await page.reload();
  const call = mcp(request);

  // The handshake tells the agent how to work the app.
  const init = await request.post('__mcp', { data: { jsonrpc: '2.0', id: 0, method: 'initialize', params: {} } });
  expect((await init.json()).result.instructions).toContain('ui_tabs first');

  // Several workers share this dev server, so the tab is named, not picked.
  await expect.poll(async () => (await call('ui_tabs')).structuredContent.tabs
    .some((t: { tab: string; view: string }) => t.tab === tabId && t.view === 'models'), { timeout: 60_000 }).toBe(true);
  const on = (args: Record<string, unknown> = {}) => ({ tab: tabId, ...args });
  const act = async (action: string, args: Record<string, unknown> = {}, confirm = false) => {
    const r = await call('app_action', on({ action, args, confirm }));
    return r;
  };

  const found = await call('models_list', { find: 'fan mount' });
  expect(text(found)).toContain('fan-mount');

  const opened = await act('models.open', { slug: 'fan-mount', file: 'fan-gasket.stl' });
  expect(opened.isError).toBeFalsy();
  expect(page.url()).toContain('model=fan-mount');

  // The screen outline names the controls the person sees, with refs.
  const screen = await call('ui_screen', on({ find: 'Add to' }));
  expect(text(screen)).toMatch(/button "[^"]*" \[[a-z]{2}\d+\]/);

  const added = await act('models.add_to_project');
  expect(added.isError, text(added)).toBeFalsy();
  const path = (added.structuredContent as { path: string }).path;

  const project = await call('ui_navigate', on({ path: path.replace('/3d-gallery/', '') }));
  expect(text(project)).toContain('[project]');
  await expect(page).toHaveURL(/\/project\/\?id=/);

  let state = (await call('app_state', on())).structuredContent.state;
  expect(state.plates).toHaveLength(1);
  expect(state.plates[0].material).toBe('PETG');

  const set = await act('project.set_plate', { plate: state.plates[0].id, material: 'PCTG', color: '#000000' });
  expect(set.isError, text(set)).toBeFalsy();

  const sliced = await act('project.wait_until_sliced', { timeoutSec: 300 });
  state = sliced.structuredContent;
  expect(state.plates[0]).toMatchObject({ material: 'PCTG', color: '#000000', filament: 'Test PCTG Black', printer: 'Left', sliced: true });
  expect(state.readyToSend).toBe(true);

  const sent = await act('project.send');
  expect(sent.isError, text(sent)).toBeFalsy();
  await expect(page).toHaveURL(/\/printers\//);

  await act('printers.upload_all');
  await expect.poll(() => printer.fileNames().length, { timeout: 30_000 }).toBe(1);
  await expect.poll(async () => {
    const s = (await call('app_state', on())).structuredContent.state;
    return s.printers[0].queue[0]?.canStart;
  }, { timeout: 30_000 }).toBe(true);

  // Starting asks about the bed until the person has answered.
  const asked = await act('printers.start', { printer: 'Left' });
  expect(asked.isError).toBe(true);
  expect(text(asked)).toMatch(/Check the bed is clear\..*confirm: true/s);
  expect(printer.state).not.toBe('printing');

  const started = await act('printers.start', { printer: 'Left' }, true);
  expect(started.isError, text(started)).toBeFalsy();
  await expect.poll(() => printer.state, { timeout: 30_000 }).toBe('printing');
  expect(printer.filename).toMatch(/\.gcode$/);

  // Every printer also shows up in the shared status action.
  const status = await act('printers.status');
  expect(text(status)).toContain('"name": "Left"');
});

test('the ui tools click, fill and answer dialogs on any view', async ({ page, request }) => {
  await page.route('**/__devstore', (route) => route.abort());
  const tab = await nameTab(page);
  await page.goto('settings/');
  const call = mcp(request);
  await expect.poll(async () => (await call('ui_tabs')).structuredContent.tabs
    .some((t: { tab: string }) => t.tab === tab), { timeout: 60_000 }).toBe(true);

  const screen = text(await call('ui_screen', { tab }));
  expect(screen).toContain('[settings]');

  // A view switch through the shell's own nav link reloads the page; the tool follows it.
  const nav = /- link "[^"]*Printers[^"]*" → [^ ]+ \[([a-z]{2}\d+)\]/.exec(screen);
  expect(nav, screen).toBeTruthy();
  const after = await call('ui_click', { tab, ref: nav![1] });
  expect(text(after)).toContain('[printers]');
  expect(text(after)).toContain('The page navigated');
  await expect(page).toHaveURL(/\/printers\/$/);

  // A ref from the old page is gone after the reload, and says so.
  const stale = await call('ui_click', { tab, ref: nav![1] });
  expect(stale.isError).toBe(true);
  expect(text(stale)).toMatch(/is from an earlier page/);

  // A native confirm() would freeze the page; the bridge answers it and reports it.
  await page.evaluate(() => {
    const b = document.createElement('button');
    b.textContent = 'Ask me';
    b.onclick = () => { b.textContent = confirm('Really?') ? 'Yes' : 'No'; };
    document.querySelector('main')!.append(b);
  });
  const ref = /button "Ask me" \[([a-z]{2}\d+)\]/.exec(text(await call('ui_screen', { tab, find: 'Ask me' })))![1];
  const declined = text(await call('ui_click', { tab, ref }));
  expect(declined).toContain('! confirm: "Really?" → answered false');
  expect(declined).toContain('button "No"');
  expect(text(await call('ui_click', { tab, ref, confirm: true }))).toContain('button "Yes"');
});

test('an agent imports preset files, finds duplicates and maps filaments to printers', async ({ page, request }) => {
  await page.route('**/__devstore', (route) => route.abort());
  const tab = await nameTab(page);
  await page.goto('settings/');
  const call = mcp(request);
  await expect.poll(async () => (await call('ui_tabs')).structuredContent.tabs
    .some((t: { tab: string }) => t.tab === tab), { timeout: 60_000 }).toBe(true);
  const act = (action: string, args: Record<string, unknown> = {}, confirm = false) =>
    call('app_action', { tab, action, args, confirm });

  // Exported files, as an agent that read them off disk would pass them: a
  // printer, the same printer again under a "- Copy" name, and two filaments.
  const printer = { ...PRINTER.raw, print_host: ADDRESS };
  const copy = { ...printer, name: `${PRINTER.name} - Copy`, printer_settings_id: `${PRINTER.name} - Copy` };
  const x1cOnly = { ...PETG.raw, name: 'Test PCTG @ X1C', filament_settings_id: ['Test PCTG @ X1C'], filament_type: ['PCTG'], compatible_printers: ['Bambu Lab X1 Carbon 0.4 nozzle'] };
  const imported = await call('presets_import', {
    tab,
    files: [
      { name: `${PRINTER.name}.json`, text: JSON.stringify(printer) },
      { name: `${PRINTER.name} - Copy.json`, text: JSON.stringify(copy) },
      { name: 'Kingroon PETG @ FFADM5.json', text: JSON.stringify(PETG.raw) },
      { name: 'Test PCTG @ X1C.json', text: JSON.stringify(x1cOnly) },
      { name: 'notes.txt', text: 'not a preset' },
    ],
  });
  expect(imported.isError, text(imported)).toBeFalsy();
  expect(imported.structuredContent.added).toHaveLength(4);
  expect(imported.structuredContent.failed).toEqual([expect.stringContaining('notes.txt')]);

  const audit = (await act('presets.audit')).content[0]!.text!;
  const report = JSON.parse(audit);
  expect(report.duplicates.identical).toEqual([{ kind: 'printer', presets: [PRINTER.name, `${PRINTER.name} - Copy`] }]);
  expect(report.duplicates.sharedAddress[0].printers).toHaveLength(2);
  const petg = report.filaments.find((f: { name: string }) => f.name === 'Kingroon PETG @ FFADM5');
  expect(petg.verdict).toMatch(/every printer, but its name says/);
  expect(petg.nameSuggests).toContain(PRINTER.name);
  const pctg = report.filaments.find((f: { name: string }) => f.name === 'Test PCTG @ X1C');
  expect(pctg.verdict).toMatch(/only printers you do not have/);
  expect(pctg.offeredTo).toEqual([]);

  const set = await act('presets.set_compatible', { filament: 'Kingroon PETG @ FFADM5', printers: [PRINTER.name] });
  expect(set.isError, text(set)).toBeFalsy();

  // Deleting asks first, naming exactly what goes.
  const asked = await act('presets.delete', { presets: [`${PRINTER.name} - Copy`] });
  expect(asked.isError).toBe(true);
  expect(text(asked)).toContain(`Delete printer "${PRINTER.name} - Copy"?`);
  const deleted = await act('presets.delete', { presets: [`${PRINTER.name} - Copy`] }, true);
  expect(deleted.isError, text(deleted)).toBeFalsy();

  const after = JSON.parse((await act('presets.audit')).content[0]!.text!);
  expect(after.counts.printers).toBe(1);
  expect(after.duplicates.identical).toEqual([]);
  expect(after.filaments.find((f: { name: string }) => f.name === 'Kingroon PETG @ FFADM5'))
    .toMatchObject({ compatiblePrinters: [PRINTER.name], verdict: 'restricted to the listed printers' });
});

/** Names this page's tab for the bridge, as its sessionStorage would. */
async function nameTab(page: Page): Promise<string> {
  const id = `e2e${Math.random().toString(36).slice(2, 8)}`;
  await page.addInitScript((tab) => sessionStorage.setItem('3dg:agent:tab', tab), id);
  return id;
}
