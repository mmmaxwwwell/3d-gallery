// SPDX-License-Identifier: MIT
//
// A printer card's controls on a phone, against the Moonraker simulator: each
// group's buttons send the script they should, a tap on a hold-to-confirm
// button sends nothing, emergency stop shuts Klipper down and firmware restart
// brings it back, and a disabled control says why.

import { test, expect, type Page } from '@playwright/test';
import { fsSrcUrl } from './helpers';
import { fakeMoonraker, type MoonrakerSim } from './fixtures/fake-moonraker.ts';

const HARNESS_URL = fsSrcUrl('packages/gallery-app/tests/e2e/fixtures/printer-controls-harness.ts');

test.use({ viewport: { width: 360, height: 780 } });

let port = 7200;

/** A fresh sim at its own address (the toolkit caches each address's object list) with the controls mounted over it. */
async function setup(page: Page, prepare?: (sim: MoonrakerSim) => void) {
  const address = `http://controls-${port++}.test:7125`;
  const sim = await fakeMoonraker(page, { address, name: 'Left' });
  prepare?.(sim);
  const mount = async () => {
    await page.goto('printers/');
    await page.evaluate(async ({ url, address }) => {
      const { mountControls } = await import(url);
      const root = document.createElement('div');
      root.id = 'controls-under-test';
      document.body.prepend(root);
      mountControls(root, { id: 'printer:Left', name: 'Left', address });
    }, { url: HARNESS_URL, address });
  };
  // On a cold dev server Vite optimizes the harness's dependencies on first
  // import and reloads the page under it; the second mount finds them ready.
  await mount().catch(async (err: Error) => {
    if (!/context was destroyed/.test(err.message)) throw err;
    await mount();
  });
  const card = page.locator('#controls-under-test .pc');
  await expect(card.locator('[data-control="emergencyStop"]')).toBeEnabled();
  return { sim, card };
}

/** The scripts sent since `from`, so a test reads only what its own clicks sent. */
const sentSince = (sim: MoonrakerSim, from: number) => sim.scripts.slice(from);

async function hold(page: Page, target: ReturnType<Page['locator']>) {
  await target.scrollIntoViewIfNeeded();
  await target.hover();
  await page.mouse.down();
  await page.waitForTimeout(1300);
  await page.mouse.up();
}

test('idle: Heat, Filament and Machine send their scripts, and cold extrusion says why', async ({ page }) => {
  const { sim, card } = await setup(page);
  const heat = card.locator('[data-group="heat"]');
  const filament = card.locator('[data-group="filament"]');
  const machine = card.locator('[data-group="machine"]');
  const print = card.locator('[data-group="print"]');

  // A phone opens only what readies the next print.
  await expect(heat).toHaveAttribute('open', '');
  await expect(filament).toHaveAttribute('open', '');
  await expect(machine).not.toHaveAttribute('open', '');
  await expect(print).not.toHaveAttribute('open', '');
  await expect(print.locator('.pc-group-head')).toContainText('Only while printing');

  // Disabled controls say why: the nozzle is cold.
  await expect(filament.locator('[data-control="extrude"]')).toBeDisabled();
  await expect(filament.locator('.pc-group-head')).toContainText(/Nozzle is \d+ °C — heat it to 170 °C first/);

  let from = sim.scripts.length;
  await heat.getByRole('button', { name: 'Nozzle 230 °C' }).click();
  await heat.getByRole('button', { name: 'Bed 60 °C' }).click();
  await heat.getByRole('button', { name: 'Bed off' }).click();
  await expect.poll(() => sentSince(sim, from)).toEqual(['M104 S230', 'M140 S60', 'M140 S0']);

  from = sim.scripts.length;
  await filament.getByRole('button', { name: 'Load', exact: true }).click();
  await expect.poll(() => sentSince(sim, from)).toEqual(['M109 S230\nLOAD_FILAMENT']);
  // Hot now, so the extruder moves.
  await expect(filament.locator('[data-control="extrude"]')).toBeEnabled();
  from = sim.scripts.length;
  await filament.getByRole('button', { name: 'Extrude 10 mm' }).click();
  await expect.poll(() => sentSince(sim, from)).toEqual(['_CLIENT_EXTRUDE LENGTH=10']);
  await filament.getByRole('button', { name: 'Retract 10 mm' }).click();
  const loadTemp = filament.getByRole('spinbutton');
  await loadTemp.fill('235');
  await filament.getByRole('button', { name: 'Unload' }).click();
  await filament.getByRole('button', { name: 'Purge' }).click();
  await expect.poll(() => sentSince(sim, from)).toEqual([
    '_CLIENT_EXTRUDE LENGTH=10', '_CLIENT_RETRACT LENGTH=10', 'M109 S235\nUNLOAD_FILAMENT', 'PURGE_FILAMENT',
  ]);

  await machine.locator('.pc-group-head').click();
  await expect(machine.locator('[data-control="park"]')).toBeDisabled();
  await expect(machine.locator('[data-control="park"]')).toHaveAttribute('title', 'Home first');
  await expect(machine.locator('.pc-group-head')).toContainText('Home first');
  from = sim.scripts.length;
  await machine.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(machine.locator('[data-control="park"]')).toBeEnabled();
  await machine.getByRole('button', { name: 'Park', exact: true }).click();
  await machine.getByRole('button', { name: 'Clean nozzle' }).click();
  await machine.getByRole('button', { name: 'Motors off' }).click();
  await machine.getByRole('button', { name: 'Light on' }).click();
  await machine.getByRole('button', { name: 'Restart camera' }).click();
  await machine.getByLabel('Cold pull material').selectOption('PLA');
  await machine.getByRole('button', { name: 'Start cold pull' }).click();
  await expect.poll(() => sentSince(sim, from)).toEqual([
    'G28', '_TOOLHEAD_PARK_PAUSE_CANCEL', 'CLEAR_NOZZLE', 'M84', 'LED_ON', 'CAMERA_RESTART',
    '_COLDPULL_LOAD_MATERIAL TEMP=220 COLD=100',
  ]);

  // Mesh and save wants a hold: a tap sends nothing.
  const mesh = machine.locator('[data-control="meshAndSave"]');
  from = sim.scripts.length;
  await mesh.click();
  await page.waitForTimeout(1500);
  expect(sentSince(sim, from)).toEqual([]);
  await hold(page, mesh);
  await expect.poll(() => sentSince(sim, from)).toEqual(['AUTO_FULL_BED_LEVEL\nNEW_SAVE_CONFIG']);
});

test('printing: Print group tunes the print, holds cancel, and the machine waits', async ({ page }) => {
  const { sim, card } = await setup(page, (s) => {
    s.addFile('parts.gcode', { estimatedTime: 3600, layers: 80, objects: ['cube', 'peg'] });
    s.startPrint('parts.gcode');
    s.tick(120);
  });
  const print = card.locator('[data-group="print"]');
  const machine = card.locator('[data-group="machine"]');
  const heat = card.locator('[data-group="heat"]');
  await expect(print.getByRole('button', { name: 'Pause', exact: true })).toBeEnabled();
  await expect(print).toHaveAttribute('open', '');
  await expect(heat).not.toHaveAttribute('open', '');

  // Nothing that would ruin the print is on offer, and each says why.
  await expect(machine.locator('.pc-group-head')).toContainText('Not while printing');
  await machine.locator('.pc-group-head').click();
  for (const control of ['home', 'meshAndSave', 'firmwareRestart', 'reboot', 'powerOff']) {
    await expect(machine.locator(`[data-control="${control}"]`)).toBeDisabled();
  }
  await expect(card.locator('[data-control="startPrint"]')).toHaveCount(0);

  let from = sim.scripts.length;
  await print.getByRole('button', { name: 'Z offset +0.01 mm' }).click();
  await print.getByRole('button', { name: 'Z offset -0.05 mm' }).click();
  await print.getByRole('button', { name: 'Speed up' }).click();
  await print.getByRole('button', { name: 'Flow down' }).click();
  await print.getByRole('button', { name: 'Fan up' }).click();
  await print.getByRole('button', { name: 'Pause at next layer' }).click();
  await expect.poll(() => sentSince(sim, from)).toEqual([
    'SET_GCODE_OFFSET Z_ADJUST=0.01 MOVE=1', 'SET_GCODE_OFFSET Z_ADJUST=-0.05 MOVE=1', 'M220 S110', 'M221 S99',
    expect.stringMatching(/^M106 S\d+$/), 'SET_PAUSE_NEXT_LAYER ENABLE=1',
  ]);

  // Cancelling one object is held, like cancelling the print.
  const peg = print.getByRole('button', { name: 'Cancel object PEG' });
  from = sim.scripts.length;
  await peg.click();
  await page.waitForTimeout(1500);
  expect(sentSince(sim, from)).toEqual([]);
  await hold(page, peg);
  await expect.poll(() => sim.excludedObjects).toEqual(['PEG']);
  expect(sentSince(sim, from)).toEqual(['EXCLUDE_OBJECT NAME=PEG']);

  from = sim.scripts.length;
  await print.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(print.getByRole('button', { name: 'Resume' })).toBeEnabled();
  await print.getByRole('button', { name: 'Resume' }).click();
  await expect.poll(() => sentSince(sim, from)).toEqual(['PAUSE', 'RESUME']);

  const cancel = print.getByRole('button', { name: 'Cancel print' });
  from = sim.scripts.length;
  await cancel.click();
  await page.waitForTimeout(1500);
  expect(sentSince(sim, from)).toEqual([]);
  expect(sim.state).toBe('printing');
  await hold(page, cancel);
  await expect.poll(() => sentSince(sim, from)).toEqual(['CANCEL_PRINT']);
});

test('emergency stop shuts Klipper down at once; a held firmware restart brings it back', async ({ page }) => {
  const { sim, card } = await setup(page);
  await card.getByRole('button', { name: 'Emergency stop' }).click();
  await expect.poll(() => sim.klippyState).toBe('shutdown');

  await expect(card.locator('.pc-notice')).toHaveText('Emergency stopped — firmware restart to recover');
  await expect(card.getByRole('button', { name: 'Emergency stop' })).toBeDisabled();
  const heat = card.locator('[data-group="heat"]');
  await expect(heat.getByRole('button', { name: 'Nozzle 230 °C', includeHidden: true })).toBeDisabled();

  // The way back is in Machine, so a phone opens it.
  const machine = card.locator('[data-group="machine"]');
  await expect(machine).toHaveAttribute('open', '');
  const restart = machine.locator('[data-control="firmwareRestart"]');
  await expect(restart).toBeEnabled();
  await expect(machine.locator('[data-control="reboot"]')).toBeEnabled();
  await expect(machine.locator('[data-control="home"]')).toBeDisabled();

  await restart.click();
  await page.waitForTimeout(1500);
  expect(sim.klippyState).toBe('shutdown');
  await hold(page, restart);
  await expect.poll(() => sim.klippyState).toBe('disconnected');
  sim.tick(3);
  await expect.poll(() => sim.klippyState).toBe('ready');
  await expect(card.locator('.pc-notice')).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'Emergency stop' })).toBeEnabled();
});

test('reboot goes through Moonraker while Klipper is shut down', async ({ page }) => {
  const { sim, card } = await setup(page);
  await card.getByRole('button', { name: 'Emergency stop' }).click();
  await expect(card.locator('.pc-notice')).toBeVisible();
  const machine = card.locator('[data-group="machine"]');
  await expect(machine).toHaveAttribute('open', '');
  const from = sim.scripts.length;
  await hold(page, machine.locator('[data-control="reboot"]'));
  await expect.poll(() => sim.requests).toContain('POST /machine/reboot');
  expect(sentSince(sim, from)).toEqual([]);
});

test('start a file: pick it, confirm the bed is clear, then it prints', async ({ page }) => {
  const { sim, card } = await setup(page, (s) => {
    s.addFile('old-bracket.gcode', { estimatedTime: 1800, ageSec: 86400 });
    s.addFile('tile-set.gcode', { estimatedTime: 2 * 3600 + 5 * 60 });
  });
  await card.getByRole('button', { name: 'Print a file…' }).click();
  const picker = page.getByRole('dialog', { name: 'Print a file on Left' });
  const files = picker.locator('.pc-picker-file');
  await expect(files).toHaveCount(2);
  await expect(files.first()).toContainText('tile-set.gcode');
  await expect(files.first().locator('img')).toHaveCount(1);

  await picker.getByLabel('Search files').fill('bracket');
  await expect(files).toHaveCount(1);
  await picker.getByLabel('Search files').fill('');
  await files.filter({ hasText: 'tile-set.gcode' }).click();

  await expect(picker).toContainText('About 2 h 5 min');
  const start = picker.getByRole('button', { name: 'Start print' });
  await expect(start).toBeDisabled();
  await picker.getByLabel('The bed is clear').check();
  await start.click();
  await expect(picker).toHaveCount(0);
  await expect.poll(() => sim.state).toBe('printing');
  expect(sim.scripts).toContain('SDCARD_PRINT_FILE FILENAME="tile-set.gcode"');
});
