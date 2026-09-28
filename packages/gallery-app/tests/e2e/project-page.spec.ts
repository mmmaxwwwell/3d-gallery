// SPDX-License-Identifier: MIT
//
// The Project page on its own: old panel links over the gallery land on it,
// a plate link finds its project, and it reaches Settings and Printers by
// link — Settings handing back to the planner when it closes.

import { test, expect, type Page } from '@playwright/test';
import { fsSrcUrl } from './helpers';

const PLATE_STORE_URL = fsSrcUrl('packages/gallery-app/src/print/plate-store.ts');

/** A saved project with one empty plate. */
async function seedProject(page: Page): Promise<{ projectId: string; plateId: string }> {
  return page.evaluate(async (storeUrl) => {
    const store = await import(storeUrl);
    const project = await store.createProject('Shelf brackets');
    const plate = await store.createPlate('Plate 1', project.id);
    return { projectId: project.id as string, plateId: plate.id as string };
  }, PLATE_STORE_URL);
}

test.beforeEach(async ({ page }) => {
  await page.route('**/__devstore', (route) => route.abort());
});

test('old panel links land on the Project page', async ({ page }) => {
  await page.goto('gallery/');
  const { projectId, plateId } = await seedProject(page);

  await page.goto(`gallery/?project=${projectId}`);
  await expect(page).toHaveURL(new RegExp(`/3d-gallery/project/\\?id=${projectId}$`));
  await expect(page.locator('.planner-plate')).toHaveCount(1);

  // Old links named a plate without its project; the page looks it up.
  await page.goto(`?plate=${plateId}`);
  await expect(page).toHaveURL(new RegExp(`/3d-gallery/project/\\?id=${projectId}&plate=${plateId}$`));
  await expect(page.locator('.print-modal')).toBeVisible();

  await page.goto('gallery/?projects=1');
  await expect(page).toHaveURL(/\/3d-gallery\/project\/$/);
  await expect(page.locator('.project-row')).toHaveCount(1);
  // Closing the shelf shows the open project.
  await page.locator('.print-modal-close').click();
  await expect(page).toHaveURL(new RegExp(`/project/\\?id=${projectId}$`));
});

test('the planner reaches Settings and Printers by link, and Settings comes back', async ({ page }) => {
  await page.goto('gallery/');
  const { projectId, plateId } = await seedProject(page);
  // A plan already sent, so the planner offers the way to its printers.
  await page.evaluate(({ projectId: id, plateId: plate }) => {
    const job = {
      plateId: plate, plateName: 'Plate 1', printerId: 'printer:Left', file: '00-plate-1.gcode',
      order: 0, material: 'PETG', filament: 'PETG', seconds: 3600, slicedAt: 1,
    };
    localStorage.setItem(`3dg:print:dispatch:${id}`, JSON.stringify({
      projectId: id, sentAt: Date.now(), jobs: [job], tasks: [], log: [],
    }));
  }, { projectId, plateId });

  await page.goto(`project/?id=${projectId}`);
  const planner = page.locator('.planner');
  await expect(planner.locator('.planner-plate')).toHaveCount(1);

  await planner.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page).toHaveURL(/\/3d-gallery\/settings\/$/);
  await expect(page.locator('.print-settings-tab').first()).toBeVisible();
  await page.locator('.print-modal-close').click();
  await expect(page).toHaveURL(new RegExp(`/project/\\?id=${projectId}$`));

  await planner.getByRole('button', { name: 'Printers', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/3d-gallery/printers/\\?project=${projectId}$`));
});
