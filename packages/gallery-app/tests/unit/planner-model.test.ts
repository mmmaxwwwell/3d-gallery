// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import type { Schedule } from '@3d-gallery/print-toolkit';
import {
  collisions,
  expectedSliceMs,
  freshSlices,
  gcodeName,
  isReady,
  plateGrams,
  plateNumbers,
  plateSeconds,
  readiness,
  scheduleJobs,
  sliceFraction,
  type Estimates,
} from '../../src/print/planner-model.js';
import { plateSignature, printedPlate, type Plate, type SlicedGcode } from '../../src/print/plate-store.js';

function plate(id: string, material = 'PETG', key = `k-${id}`): Plate {
  return {
    id,
    projectId: 'p',
    name: `Plate ${id}`,
    items: [{ id: `i-${id}`, slug: 's', target: 't', format: '3mf', label: 'x', modelTitle: 'm', key, qty: 1 }],
    material,
    createdAt: 0,
    updatedAt: 0,
  };
}

function schedule(jobs: Array<[string, string, number, number]>): Schedule {
  return {
    jobs: jobs.map(([jobId, printerId, start, end]) => ({ jobId, printerId, start, end, visit: 0 })),
    visits: [],
    finish: Math.max(...jobs.map((j) => j[3])),
    collect: Math.max(...jobs.map((j) => j[3])),
    unassigned: [],
    gatherSec: 0,
  };
}

const EST: Estimates = {
  settings: {
    rates: [{ mmPerS: 3, label: 'TPU' }, { mmPerS: 12, label: 'PETG' }],
    defaultMaterial: 'PETG',
    filament: { density: 1.25 },
    densities: { PETG: 1.25, TPU: 1.0 },
  },
  estimates: {
    'k-a': { seconds: { 3: 7200, 12: 3600 }, grams: 50 },
    'k-b': { seconds: { 3: 7200, 12: 3600 }, grams: 50 },
  },
};

function slice(p: Plate, printerId: string, setup: string | undefined, extra: Partial<SlicedGcode> = {}): SlicedGcode {
  return {
    id: `${p.id}|${printerId}`, plateId: p.id, printerId, filamentId: 'f',
    signature: plateSignature(p), setup, gcode: '', slicedAt: 0, ...extra,
  };
}

describe('planner model', () => {
  it('numbers plates from 0 in start order, and names G-code to match', () => {
    const plan = schedule([['b', 'L', 10, 20], ['a', 'R', 0, 5], ['c', 'L', 20, 30]]);
    expect([...plateNumbers(plan)]).toEqual([['a', 0], ['b', 1], ['c', 2]]);
    expect(gcodeName(0, plate('a'))).toBe('00-plate-a.gcode');
  });

  it('flags jobs that overlap on one printer, and only those', () => {
    expect(collisions(schedule([['a', 'L', 0, 10], ['b', 'L', 10, 20], ['c', 'R', 5, 15]])).size).toBe(0);
    expect([...collisions(schedule([['a', 'L', 0, 10], ['b', 'L', 9, 20]]))].sort()).toEqual(['a', 'b']);
  });

  it('takes the slicer’s own time over the CI estimate, and rates CI by material', () => {
    const tpu = plate('a', 'TPU 64D');
    expect(plateSeconds(tpu, [], EST)).toEqual({ value: 7200, source: 'estimate' });
    expect(plateSeconds(tpu, [slice(tpu, 'L', 'x', { seconds: 100 })], EST)).toEqual({ value: 100, source: 'sliced' });
    expect(plateSeconds(plate('z'), [], EST)).toBeNull();
  });

  it('leaves an unticked part out of the print, and stales a slice that had it', () => {
    const both: Plate = { ...plate('a'), items: [...plate('a').items, { ...plate('b').items[0] }] };
    const kept = slice(both, 'L', 'x');
    const without: Plate = { ...both, items: both.items.map((i) => (i.id === 'i-b' ? { ...i, skip: true } : i)) };
    expect(printedPlate(without).items.map((i) => i.id)).toEqual(['i-a']);
    expect(plateSeconds(printedPlate(without), [], EST)).toEqual({ value: 3600, source: 'estimate' });
    expect(freshSlices(without, [kept], () => 'x')).toEqual([]);
    // A skipped part weighs the same as a removed one, so the plate's slice is
    // still good for the plate with that part gone.
    expect(plateSignature(without)).toBe(plateSignature({ ...without, items: [both.items[0]] }));
  });

  it('reweighs CI grams at the plate’s material density', () => {
    expect(plateGrams(plate('a', 'TPU 64D'), [], EST)?.value).toBeCloseTo(40);
    expect(plateGrams(plate('a', 'PETG'), [], EST)?.value).toBeCloseTo(50);
  });

  it('counts a slice fresh only under the setup its printer would get today', () => {
    const p = plate('a');
    const keys = (id: string) => (id === 'L' ? 'now' : null);
    const kept = [slice(p, 'L', 'now'), slice(p, 'L', 'old'), slice(p, 'L', undefined), slice(p, 'R', 'now')];
    expect(freshSlices(p, kept, keys).map((s) => s.setup)).toEqual(['now']);
    const moved = { ...p, transforms: { x: { x: 1, y: 0, rot: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } } } };
    expect(freshSlices(moved, kept, keys)).toEqual([]);
  });

  it('is ready only with every plate scheduled, sliced for its printer, and no overlaps', () => {
    const plates = [plate('a'), plate('b')];
    const plan = schedule([['a', 'L', 0, 10], ['b', 'R', 0, 10]]);
    const slicedOn = new Set(['a|L', 'b|R']);
    const has = (plateId: string, printerId: string) => slicedOn.has(`${plateId}|${printerId}`);
    expect(isReady(readiness(plates, plan, 2, has))).toBe(true);
    expect(readiness(plates, plan, 2, (id, printer) => has(id, printer) && id !== 'b').sliced).toBe(false);
    expect(readiness(plates, schedule([['a', 'L', 0, 10]]), 2, has).scheduled).toBe(false);
    expect(readiness(plates, schedule([['a', 'L', 0, 10], ['b', 'L', 5, 10]]), 2, () => true).clear).toBe(false);
    expect(readiness(plates, plan, 0, has).printers).toBe(false);
  });

  it('prefers the printers a plate is already sliced for', () => {
    const a = plate('a');
    const [job] = scheduleJobs([a], { a: { value: 60, source: 'sliced' } }, {}, { a: [slice(a, 'R', 'now')] });
    expect(job.preferred).toEqual(['R']);
  });

  it('times a slice by its own last run, else the median slicing rate', () => {
    const a = plate('a');
    const b = plate('b');
    const c = plate('c');
    const kept = {
      a: [slice(a, 'L', 'now', { sliceMs: 30_000, seconds: 3600 })],
      b: [slice(b, 'L', 'now', { sliceMs: 10_000, seconds: 3600 })],
    };
    expect(expectedSliceMs('a', 3600, kept)).toBe(30_000);
    // Rates 10/3600 and 30/3600 ms per print-second; the median of two takes the upper.
    expect(expectedSliceMs('c', 7200, kept)).toBeCloseTo(60_000);
    expect(expectedSliceMs(c.id, undefined, {})).toBe(60_000);
  });

  it('runs a slice bar on the clock and never reaches 100% on its own', () => {
    expect(sliceFraction(0, 1000)).toBe(0);
    expect(sliceFraction(500, 1000)).toBeCloseTo(0.45);
    expect(sliceFraction(1000, 1000)).toBeCloseTo(0.9);
    const late = sliceFraction(10_000, 1000);
    expect(late).toBeGreaterThan(0.98);
    expect(late).toBeLessThan(1);
    expect(sliceFraction(3000, 1000)).toBeGreaterThan(sliceFraction(2000, 1000));
  });
});
