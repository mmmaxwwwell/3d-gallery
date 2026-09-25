// SPDX-License-Identifier: MIT
//
// The plate editor, end to end: put two copies of a part on a plate, open it,
// and check the 3D-first shell — canvas owning the stage, options behind rail
// buttons, the plate size readout in the HUD, the Delete key taking a copy off
// the plate, and the URL naming which plate is open. Uses a real printer preset
// so the bed, the exclusion zones and the fit verdict are production's.
//
// The default Desktop Chrome viewport is above the split breakpoint, so the
// first test is the one-screen layout. A second test narrows the viewport to
// cover the separate-screen flow a phone gets.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import { fsSrcUrl } from './helpers';

const PRINT_STORAGE_URL = fsSrcUrl('packages/gallery-app/src/print/print-storage.ts');

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PRINTER = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'flashforge-adventurer-5m-klipper-left.json'), 'utf8'),
) as { name: string; raw: Record<string, unknown>; parents: Array<{ name: string; raw: Record<string, unknown> }> };

/** Seed a printer preset straight into the store the print UI reads. */
async function seedPrinter(page: Page, preset: typeof PRINTER): Promise<void> {
  await page.evaluate(async ({ p, storeUrl }) => {
    const store = await import(storeUrl);
    await store.savePreset({ kind: 'printer', name: p.name, raw: p.raw, parents: p.parents });
  }, { p: preset, storeUrl: PRINT_STORAGE_URL });
}

/** Cards are addressed by their title, not by any text they happen to hold:
 *  "Printer" also appears inside Slice presets and Advanced. */
function card(page: Page, title: string) {
  return page.locator('.pd-card').filter({
    has: page.locator('.pd-card-title', { hasText: new RegExp(`^${title}$`) }),
  });
}

async function addFirstPartToPlate(page: Page): Promise<void> {
  await page.waitForFunction(() => document.querySelectorAll('#model-list .model-item').length > 0);
  await page.locator('#model-list .model-item').first().click();
  const printBtn = page.locator('#print-btn');
  await expect(printBtn).toBeEnabled({ timeout: 60_000 });
  await printBtn.click();
  await expect(page.locator('#plate-added')).toBeVisible({ timeout: 30_000 });
}

test('desktop shows the plate and its print setup at once, and routes by URL', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('/');
  await seedPrinter(page, PRINTER);
  await page.reload();

  // Two adds of the same part collapse into one item at qty 2 — two objects.
  await addFirstPartToPlate(page);
  await addFirstPartToPlate(page);

  await page.locator('#plates-btn').click();
  await expect(page).toHaveURL(/[?&]plates=1/);
  await page.locator('.plate-row').first().getByRole('button', { name: /open/i }).click();

  // Opening a plate names it in the URL, so the editor is linkable.
  await expect(page).toHaveURL(/[?&]plate=[^&]+/);
  const plateUrl = page.url();

  // The editor only draws once the artifacts have resolved.
  const viewport = page.locator('.plate3d-viewport canvas');
  await expect(viewport).toBeVisible({ timeout: 120_000 });

  // WebGL actually produced pixels, rather than a blank element.
  const painted = await page.evaluate(() => {
    const canvas = document.querySelector('.plate3d-viewport canvas') as HTMLCanvasElement | null;
    return !!canvas && canvas.width > 0 && canvas.height > 0;
  });
  expect(painted).toBe(true);

  // Two columns split the body between them: the canvas takes the larger
  // share on the left, print setup docks on the right, and no options panel
  // is open over either until the user asks for one.
  const bodyBox = await page.locator('.print-modal-body.is-bleed').boundingBox();
  const stageBox = await page.locator('.pd-stage').boundingBox();
  const sideBox = await page.locator('.pd-split-side').boundingBox();
  if (!bodyBox || !stageBox || !sideBox) throw new Error('plate editor did not lay out');
  expect(stageBox.height).toBeGreaterThan(bodyBox.height * 0.5);
  expect(stageBox.width).toBeGreaterThan(sideBox.width);
  expect(stageBox.width + sideBox.width).toBeGreaterThan(bodyBox.width * 0.95);
  await expect(page.locator('.pd-sheet')).toHaveCount(0);
  await expect(page.locator('.pd-printer-pick select')).toHaveValue(/.+/);

  // The plate reports an overall size — the number printer gating runs on.
  const size = page.locator('.pd-plate-size');
  await expect(size).toBeVisible();
  await expect(size).toHaveText(/\d+(\.\d+)? × \d+(\.\d+)? × \d+(\.\d+)? mm/);
  const before = await size.textContent();

  // The list is a tool, beside Arrange. One row per object, each with its own
  // slicer settings and a way to bin it.
  const status = page.locator('.plate3d-status');
  await expect(status).toHaveText(/2 objects/);
  await page.locator('.plate3d-tool', { hasText: '📋' }).click();
  const sheet = page.locator('.pd-sheet');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.pd-object-row')).toHaveCount(2);

  // Overrides are stored per copy, so tuning one leaves the other on default.
  const rows = sheet.locator('.pd-object-row');
  await rows.nth(1).locator('.pd-object-opt').first().selectOption('tree');
  await rows.nth(1).locator('.pd-object-opt').last().selectOption('true');
  await expect(rows.nth(0).locator('.pd-object-opt').first()).toHaveValue('');
  await expect(page.locator('.pd-dirty')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save plate' })).toBeVisible();

  // The trash can takes that object off the plate. Copy indices close up
  // behind it, so the surviving copy keeps the settings it was given.
  await rows.nth(0).locator('.pd-object-remove').click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator('.pd-object-opt').first()).toHaveValue('tree');
  await page.locator('.pd-sheet-close').click();
  await expect(sheet).toHaveCount(0);
  await expect(size).not.toHaveText(before ?? '', { timeout: 15_000 });
  await expect(status).toHaveText(/1 object/, { timeout: 15_000 });
  // The list button carries a dot while any object is tuned.
  await expect(page.locator('.pd-tool-dot')).toBeVisible();

  // Save clears the unsaved marker — and with it the Back guard.
  await page.getByRole('button', { name: 'Save plate' }).click();
  await expect(page.locator('.pd-saved')).toBeVisible({ timeout: 15_000 });

  // Everything about *how* it prints is already beside the plate — no step
  // to take, and so no button offering to take it.
  await expect(page.locator('.pd-setup')).toBeVisible();
  await expect(page.locator('.pd-stage')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Slice →' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Back to plate' })).toHaveCount(0);

  // Checks lead, open by default: whether this can be printed at all decides
  // whether the rest of the screen matters.
  const checksCard = card(page, 'Checks');
  await expect(checksCard).toHaveAttribute('open', '');
  const checks = checksCard.locator('.pd-check');
  // Not `is-pass`: this bed reports a clearance warning, which is a real
  // verdict and not a failure. What matters is that it is not blocked.
  await expect(checks.filter({ hasText: 'Fits the bed' })).toHaveClass(/is-(pass|warn)/);
  await expect(checks.filter({ hasText: 'No overlaps' })).toHaveClass(/is-pass/);
  await expect(checks.filter({ hasText: 'Filament' })).toHaveClass(/is-fail/);
  await expect(checksCard.locator('.pd-card-status')).toHaveClass(/is-fail/);

  // Every other card is closed until asked for, and states itself in its head.
  const printerCard = card(page, 'Printer');
  await expect(printerCard).not.toHaveAttribute('open', '');
  await expect(printerCard.locator('.pd-card-status')).toContainText('Flashforge');
  await expect(printerCard.getByRole('button', { name: 'Edit printer preset' })).toBeVisible();
  await printerCard.locator('summary').click();
  await expect(printerCard.locator('.pd-stat').filter({ hasText: 'EXTRUDERS' })).toBeVisible();
  await expect(printerCard.locator('.pd-stat').filter({ hasText: 'BED (MM)' })).toBeVisible();
  // The installed plate belongs to the printer, not the filament.
  await expect(page.getByRole('combobox', { name: 'Installed plate' })).toBeVisible();

  // Process reads as a panel of numbers, with editing behind a pencil.
  const processCard = card(page, 'Process');
  await processCard.locator('summary').click();
  const stats = processCard.locator('.pd-stat');
  await expect(stats.filter({ hasText: 'WALLS' })).toContainText('3');
  await expect(stats.filter({ hasText: 'TOP / BOTTOM' })).toContainText('3/3');
  await expect(stats.filter({ hasText: 'SUPPORTS' })).toContainText('off');
  await expect(page.locator('.pd-adaptive-pill')).toHaveCount(0);

  await processCard.getByRole('button', { name: 'Edit process' }).click();
  const processModal = page.locator('.pd-sheet');
  await expect(processModal).toBeVisible();
  // Adaptive layer height is the editor's default.
  await expect(processModal.locator('.pd-adaptive-pill')).toHaveAttribute('aria-pressed', 'true');
  // Shell counts are editable, and the summary follows them.
  await processModal.locator('input[type="number"]').nth(1).fill('5');
  await page.locator('.pd-sheet-close').click();
  await expect(stats.filter({ hasText: 'TOP / BOTTOM' })).toContainText('5/3');

  // Adding a filament is offered in the dropdown, even if it only points at
  // the importer for now.
  await card(page, 'Filament').locator('summary').click();
  await page.getByRole('combobox', { name: 'Filament' }).selectOption('__add-filament');
  await expect(page.locator('.pd-sheet')).toContainText(/not built yet/);
  await page.locator('.pd-sheet-close').click();

  // Back closes the editor; the plate URL reopens it.
  await page.goBack();
  await expect(page.locator('.pd-stage')).toHaveCount(0);
  await page.goto(plateUrl);
  await expect(page.locator('.plate3d-viewport canvas')).toBeVisible({ timeout: 120_000 });
});

/**
 * A phone has no room for a 3D stage and a settings column at once, so below
 * the split breakpoint the two stay separate screens reached through the rail.
 */
test('a narrow viewport keeps the plate and print setup on separate screens', async ({ page }) => {
  test.setTimeout(180_000);

  // Filling the plate happens at desktop width: the gallery collapses its
  // model sidebar on a phone, and that is not what this test is about.
  await page.goto('/');
  await seedPrinter(page, PRINTER);
  await page.reload();

  await addFirstPartToPlate(page);
  await page.locator('#plates-btn').click();
  await page.locator('.plate-row').first().getByRole('button', { name: /open/i }).click();
  await expect(page.locator('.plate3d-viewport canvas')).toBeVisible({ timeout: 120_000 });

  // The editor reads the media query live, so narrowing splits the one screen
  // back into two without a reload.
  await page.setViewportSize({ width: 430, height: 900 });
  await expect(page.locator('.pd-split')).toHaveCount(0);
  await expect(page.locator('.pd-setup')).toHaveCount(0);
  await expect(page.locator('.pd-stage')).toBeVisible();

  // The rail is the way across, and back.
  await page.getByRole('button', { name: 'Slice →' }).click();
  await expect(page.locator('.pd-setup')).toBeVisible();
  await expect(page.locator('.pd-stage')).toHaveCount(0);

  await page.getByRole('button', { name: 'Back to plate' }).click();
  await expect(page.locator('.pd-stage')).toBeVisible();
  await expect(page.locator('.pd-setup')).toHaveCount(0);

  // And widening past the breakpoint joins them again.
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('.pd-split')).toBeVisible();
  await expect(page.locator('.pd-setup')).toBeVisible();
  await expect(page.locator('.pd-stage')).toBeVisible();
});

/**
 * The gallery is routinely opened over plain HTTP on a LAN or tailscale IP,
 * where `crypto.randomUUID` — secure-context-only — is simply absent. Every
 * create path in the plate store mints an id, so its absence took out project
 * creation, plate creation and add-to-plate at once, silently: the click
 * handlers are fire-and-forget, so the rejection never reached the user.
 */
test('projects and plates can be created without crypto.randomUUID', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
  });

  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  expect(await page.evaluate(() => typeof (crypto as Crypto).randomUUID)).toBe('undefined');

  // Add-to-plate mints a project, a plate and an item id in one go.
  await addFirstPartToPlate(page);

  // `ensureTargetPlate` makes exactly one project, holding exactly one plate.
  await page.locator('#plates-btn').click();
  await expect(page.locator('.project-row')).toHaveCount(1);
  await expect(page.locator('.plate-row')).toHaveCount(1);

  // And an explicitly created project accepts an explicitly created plate.
  // Creating one also selects it, so waiting for its empty state is what says
  // the panel has finished swapping the plate list over.
  await page.getByRole('button', { name: 'New project' }).click();
  await expect(page.locator('.project-row')).toHaveCount(2);
  await expect(page.locator('.plate-empty')).toHaveText(/No plates in this project/);

  await page.getByRole('button', { name: 'New plate' }).click();
  await expect(page.locator('.plate-row')).toHaveCount(1);

  expect(errors).toEqual([]);
});
