// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { fleetStats, printerStats } from '../../src/print/printer-stats.js';
import type { DispatchJob } from '../../src/print/dispatch-model.js';
import type { PlanJob, PlanSnapshot } from '../../src/print/plan-snapshot.js';

const H = 3_600_000;

function job(plateId: string, printerId: string, visit: number, startH: number, hours: number, extra: Partial<PlanJob> = {}): PlanJob {
  return {
    plateId, plateName: plateId, printerId, order: 0, file: `${plateId}.gcode`,
    start: startH * H, end: (startH + hours) * H, visit,
    material: 'PETG', materialName: 'PETG', color: 'black', grams: 100, sliced: true,
    ...extra,
  };
}

function snapshot(jobs: PlanJob[], visits = 3): PlanSnapshot {
  return {
    projectId: 'p', projectName: 'P', savedAt: 0, objective: 'visits', changeoverMin: 5, swapMin: 15,
    printers: [{ id: 'L', name: 'Left' }, { id: 'R', name: 'Right' }, { id: 'C', name: 'Centre' }],
    jobs,
    visits: Array.from({ length: visits }, (_, i) => ({ at: i * H, until: i * H, starts: [] })),
    finish: 0, collect: 0,
  };
}

const sent = (plateId: string, printerId: string, state?: 'printed'): DispatchJob => ({
  plateId, plateName: plateId, printerId, file: `${plateId}.gcode`, order: 0,
  material: 'PETG', filament: 'PETG', seconds: 0, slicedAt: 1,
  ...(state ? { outcome: { state, at: 1 } } : {}),
});

describe('printerStats', () => {
  const plan = snapshot([
    job('a', 'L', 0, 0, 4),
    job('b', 'L', 1, 4, 2, { color: 'white', grams: 50 }),
    job('c', 'L', 2, 6, 1, { material: 'TPU', materialName: 'TPU 64D', color: undefined, grams: 9, sliced: false, swapFrom: 'PETG' }),
    job('d', 'R', 0, 0, 3, { swapFrom: 'PLA' }),
  ]);

  it('adds up filament per spool, hours, stops, touches and swaps', () => {
    const L = printerStats(plan, [])!.get('L')!;
    expect(L.spools).toEqual([
      { label: 'PETG · black', grams: 100, approx: false },
      { label: 'PETG · white', grams: 50, approx: false },
      { label: 'TPU 64D', grams: 9, approx: true },
    ]);
    expect(L.hours).toBe(7);
    // Three visits start a job here, then the last print is collected.
    expect(L.stops).toBe(4);
    expect(L.touches).toBe(6);
    // black → white is a colour change, white → TPU a material change; the first job loads what was there.
    expect(L.swaps).toBe(2);
  });

  it('counts the first job as a swap only when it changes what is loaded', () => {
    expect(printerStats(plan, []).get('R')!.swaps).toBe(1);
  });

  it('gives an idle printer an empty entry', () => {
    expect(printerStats(plan, []).get('C')).toMatchObject({ jobs: 0, stops: 0, hours: 0, spools: [] });
  });

  it('reads what is printed from the dispatch', () => {
    const L = printerStats(plan, [sent('a', 'L', 'printed'), sent('b', 'L'), sent('a', 'R', 'printed')]).get('L')!;
    expect(L).toMatchObject({ printed: 1, hoursPrinted: 4 });
  });
});

describe('fleetStats', () => {
  it('counts the plan\'s trips, not the sum of every printer\'s stops', () => {
    const plan = snapshot([job('a', 'L', 0, 0, 1), job('b', 'R', 0, 0, 1)], 1);
    expect(fleetStats(plan, [])).toMatchObject({ jobs: 2, stops: 1, touches: 4, swaps: 0 });
  });
});
