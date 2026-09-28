// SPDX-License-Identifier: MIT
//
// The Printers page on a phone: every imported printer live, the ones that
// need someone counted on the strip and the tab's badge, a dead printer shown
// as unreachable rather than as an error dump, and the live camera only while
// a card is open.

import { test, expect, type Page } from '@playwright/test';
import { fsSrcUrl } from './helpers';
import { fakeMoonraker, type MoonrakerSim } from './fixtures/fake-moonraker.ts';

const PRINT_STORAGE_URL = fsSrcUrl('packages/gallery-app/src/print/print-storage.ts');
const PHONE = { width: 360, height: 740 };

async function seedPrinters(page: Page, printers: Array<{ name: string; address: string }>): Promise<void> {
  await page.evaluate(async ({ url, printers }) => {
    const presets = await import(url);
    for (const { name, address } of printers) {
      await presets.savePreset({ kind: 'printer', name, raw: { print_host: address }, parents: [], address });
    }
  }, { url: PRINT_STORAGE_URL, printers });
}

/** Left printing, Right idle, Center paused on a filament runout — the fake-printers fleet. */
async function fleet(page: Page, prefix: string): Promise<Record<'Left' | 'Right' | 'Center', { sim: MoonrakerSim; address: string }>> {
  const out = {} as Record<'Left' | 'Right' | 'Center', { sim: MoonrakerSim; address: string }>;
  for (const name of ['Left', 'Right', 'Center'] as const) {
    // A fresh host per test: print-toolkit caches each address's object list.
    const address = `http://${prefix}-${name.toLowerCase()}.test:7125`;
    const sim = await fakeMoonraker(page, { address, name });
    sim.addFile('hex-bit-holder-4.gcode', { estimatedTime: 2400, layers: 90 });
    out[name] = { sim, address };
  }
  out.Left.sim.startPrint('hex-bit-holder-4.gcode');
  out.Left.sim.tick(600);
  out.Center.sim.startPrint('hex-bit-holder-4.gcode');
  out.Center.sim.tick(600);
  out.Center.sim.runout();
  return out;
}

function card(page: Page, name: string) {
  return page.locator(`.printers-card[data-printer="${name}"]`);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.route('**/__devstore', (route) => route.abort());
});

test('with no printers it points at Settings → Import', async ({ page }) => {
  await page.goto('printers/');
  const link = page.locator('.printers-empty').getByRole('link', { name: 'Settings → Import' });
  await expect(link).toHaveAttribute('href', '/3d-gallery/settings/');
});

test('shows the fleet live, counts what needs attention, and badges the tab', async ({ page }) => {
  const printers = await fleet(page, 'live');
  await page.goto('printers/');
  await seedPrinters(page, Object.entries(printers).map(([name, p]) => ({ name, address: p.address })));

  await expect(card(page, 'Left').locator('.printers-chip')).toHaveText('Printing');
  await expect(card(page, 'Right').locator('.printers-chip')).toHaveText('Idle');
  await expect(card(page, 'Center').locator('.printers-chip')).toHaveText('Filament out');
  await expect(page.locator('.printers-strip')).toHaveText(/1 printing\s*1 idle\s*1 needs attention/);
  await expect(page.locator('.shell-tab[data-view="printers"] .shell-badge')).toHaveText('1');

  const left = card(page, 'Left');
  await expect(left.locator('.printers-file')).toContainText('hex-bit-holder-4.gcode');
  await expect(left.locator('.printers-temps')).toContainText('Nozzle');
  await expect(left.locator('.printers-time')).toContainText(/\d+%.*left · done/);
  await expect(left.locator('.printers-thumb')).toBeVisible();
  await expect(card(page, 'Center').locator('.printers-sensor')).toHaveText('Filament: none');
  await expect(card(page, 'Right').locator('.printers-sensor')).toHaveText('Filament: loaded');

  // A printer that stops answering is unreachable, keeps its last reading, and joins the badge.
  printers.Right.sim.faults.unreachable = true;
  await expect(card(page, 'Right').locator('.printers-chip')).toHaveText('Unreachable');
  await expect(page.locator('.shell-tab[data-view="printers"] .shell-badge')).toHaveText('2');
  await expect(card(page, 'Right').locator('.printers-temps')).toBeVisible();

  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(PHONE.width);
});

test('an open card streams the camera and shows the details; closing it stops the stream', async ({ page }) => {
  const printers = await fleet(page, 'open');
  await page.goto('printers/');
  await seedPrinters(page, [{ name: 'Center', address: printers.Center.address }]);

  const center = card(page, 'Center');
  const head = center.locator('.printers-card-head');
  await expect(center.locator('.printers-chip')).toHaveText('Filament out');
  await expect(center.locator('.printers-stream')).toHaveCount(0);

  await head.click();
  await expect(head).toHaveAttribute('aria-expanded', 'true');
  await expect(center.locator('.printers-stream')).toHaveAttribute('src', /action=stream/);
  await expect(center.locator('.printers-thumb')).toHaveCount(0);
  await expect(center.locator('.printers-stats')).toContainText('Uptime');
  await expect(center.locator('.printers-stats')).toContainText('Speed100%');
  await expect(center.locator('.printers-console')).toContainText('runout event detected');

  await head.click();
  await expect(center.locator('.printers-stream')).toHaveCount(0);
  await expect(center.locator('.printers-thumb')).toBeVisible();
});

test('a printer switched off in the planner is not polled', async ({ page }) => {
  const printers = await fleet(page, 'off');
  await page.goto('printers/');
  await page.evaluate(() =>
    localStorage.setItem('3dg:print:planner', JSON.stringify({ enabled: { 'printer:Right': false } })),
  );
  await seedPrinters(page, [
    { name: 'Left', address: printers.Left.address },
    { name: 'Right', address: printers.Right.address },
  ]);
  await page.reload();

  await expect(card(page, 'Left').locator('.printers-chip')).toHaveText('Printing');
  await expect(card(page, 'Right')).toHaveCount(0);
  await expect(page.locator('.printers-off')).toContainText('Right');
  expect(printers.Right.sim.requests).toEqual([]);
});
