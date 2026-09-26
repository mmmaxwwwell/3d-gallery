// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import type { Schedule } from '@3d-gallery/print-toolkit';
import {
  collisions,
  freshSlices,
  gcodeName,
  isReady,
  plateGrams,
  plateNumbers,
  plateSeconds,
  readiness,
  type Estimates,
} from '../../src/print/planner-model.js';
import { plateSignature, type Plate, type SlicedGcode } from '../../src/print/plate-store.js';

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
});
