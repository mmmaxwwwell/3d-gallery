// SPDX-License-Identifier: MIT
//
// The Operator page: the runbook on its own page. A deep link opens a
// project's runbook, it counts down to the next trip (and so does its tab),
// what the operator ticks survives a reload, and a bare or old link still
// finds a runbook.

import { test, expect, type Page } from '@playwright/test';

const MIN = 60_000;
const T0 = Date.UTC(2026, 8, 28, 17, 0);
const PROJECT = 'op-e2e';

function job(plateId: string, order: number, start: number, visit: number) {
  return {
    plateId,
    plateName: `Plate ${plateId}`,
    printerId: 'L',
    order,
    file: `${String(order).padStart(2, '0')}-plate-${plateId}.gcode`,
    start,
    end: start + 120 * MIN,
    visit,
    material: 'PETG',
    materialName: 'PETG',
    color: 'black',
    grams: 40,
    sliced: true,
  };
}

/** One printer, two trips: the first 45 minutes from T0. */
const PLAN = {
  projectId: PROJECT,
  projectName: 'Operator e2e',
  savedAt: T0,
  objective: 'visits',
  changeoverMin: 5,
  swapMin: 15,
  printers: [{ id: 'L', name: 'Left' }],
  jobs: [job('a', 0, T0 + 50 * MIN, 0), job('b', 1, T0 + 175 * MIN, 1)],
  visits: [
    { at: T0 + 45 * MIN, until: T0 + 50 * MIN, starts: ['a'] },
    { at: T0 + 170 * MIN, until: T0 + 175 * MIN, starts: ['b'] },
  ],
  finish: T0 + 295 * MIN,
  collect: T0 + 295 * MIN,
};

async function seedPlan(page: Page): Promise<void> {
  await page.addInitScript(([key, plan]) => {
    localStorage.setItem(key, plan);
  }, [`3dg:print:plan:${PROJECT}`, JSON.stringify(PLAN)] as const);
}

const badge = (page: Page) => page.locator('.shell-tab[data-view="operator"] .shell-badge');

test('a deep link opens the runbook and counts down to the next trip', async ({ page }) => {
  await page.clock.setFixedTime(T0);
  await seedPlan(page);
  await page.goto(`operator/?id=${PROJECT}`);

  await expect(page.locator('.op-bar-title')).toHaveText('Operator e2e');
  await expect(page.locator('.op-hero-label')).toHaveText('Session 1 in');
  await expect(page.locator('.op-hero-big')).toHaveText('45:00');
  await expect(page.locator('.op-session')).toHaveCount(2);
  await expect(badge(page)).toHaveText('45m');

  await page.clock.setFixedTime(T0 + MIN);
  await expect(page.locator('.op-hero-big')).toHaveText('44:00');
  await expect(badge(page)).toHaveText('44m');

  await page.clock.setFixedTime(T0 + 46 * MIN);
  await expect(page.locator('.op-hero-big')).toHaveText('Now');
  await expect(badge(page)).toHaveText('Now');
});

test('a ticked step is still ticked after a reload', async ({ page }) => {
  await page.clock.setFixedTime(T0);
  await seedPlan(page);
  await page.goto(`operator/?id=${PROJECT}`);

  await page.locator('.op-session').first().click();
  await page.getByRole('button', { name: 'Start session' }).click();
  await expect(page.locator('.op-stop-printer')).toHaveText('Left');
  const bed = page.getByRole('checkbox', { name: /Fresh, clean bed/ });
  await bed.check();
  await expect(page.locator('.op-step.is-done')).toHaveCount(1);

  await page.reload();
  await page.locator('.op-session').first().click();
  await page.getByRole('button', { name: /Continue · 0\/1 stops done/ }).click();
  await expect(page.getByRole('checkbox', { name: /Fresh, clean bed/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /Start the print/ })).not.toBeChecked();
});

test('a bare or old link finds the runbook that has a plan', async ({ page }) => {
  await page.clock.setFixedTime(T0);
  await seedPlan(page);

  await page.goto('operator/');
  await expect(page).toHaveURL(new RegExp(`/3d-gallery/operator/\\?id=${PROJECT}$`));
  await expect(page.locator('.op-bar-title')).toHaveText('Operator e2e');

  await page.goto(`?operator=${PROJECT}`);
  await expect(page).toHaveURL(new RegExp(`/3d-gallery/operator/\\?id=${PROJECT}$`));
  await page.goto(`gallery/?operator=${PROJECT}`);
  await expect(page).toHaveURL(new RegExp(`/3d-gallery/operator/\\?id=${PROJECT}$`));
  await expect(page.locator('.op-hero-big')).toHaveText('45:00');
});

test('with no plan anywhere, the runbook points at Project', async ({ page }) => {
  await page.goto('operator/');
  await expect(page.locator('.op-hero-sub')).toContainText('No plan yet');
  await expect(page.getByRole('link', { name: 'Open Project' })).toHaveAttribute('href', '/3d-gallery/project/');
  await expect(badge(page)).toHaveCount(0);
});
