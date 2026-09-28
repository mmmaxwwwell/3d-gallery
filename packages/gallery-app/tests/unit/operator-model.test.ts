// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import type { PlanJob, PlanSnapshot } from '../../src/print/plan-snapshot.js';
import {
  countdown,
  filamentSwap,
  sessionStates,
  sessions,
  stopHeadline,
  stopSteps,
  stopTools,
  tripBadge,
  upcoming,
} from '../../src/print/operator-model.js';

const MIN = 60_000;
const T0 = Date.UTC(2026, 8, 26, 19, 0);

function job(plateId: string, printerId: string, order: number, start: number, visit: number, extra: Partial<PlanJob> = {}): PlanJob {
  return {
    plateId,
    plateName: `Plate ${plateId}`,
    printerId,
    order,
    file: `${String(order).padStart(2, '0')}-plate-${plateId}.gcode`,
    start,
    end: start + 60 * MIN,
    visit,
    material: 'PETG',
    materialName: 'PETG',
    color: 'black',
    grams: 50,
    sliced: true,
    ...extra,
  };
}

/** Two printers; trip 1 starts a on L and b on R, trip 2 starts c on L in TPU. */
function plan(): PlanSnapshot {
  const jobs = [
    job('a', 'L', 0, T0 + 5 * MIN, 0),
    job('b', 'R', 1, T0 + 10 * MIN, 0, { grams: 30, sliced: false }),
    job('c', 'L', 2, T0 + 70 * MIN, 1, { material: 'TPU', materialName: 'TPU 64D', swapFrom: 'PETG' }),
  ];
  return {
    projectId: 'p',
    projectName: 'Project',
    savedAt: 0,
    objective: 'visits',
    changeoverMin: 5,
    swapMin: 15,
    printers: [{ id: 'L', name: 'Left' }, { id: 'R', name: 'Right' }],
    jobs,
    visits: [
      { at: T0, until: T0 + 10 * MIN, starts: ['a', 'b'] },
      { at: T0 + 65 * MIN, until: T0 + 85 * MIN, starts: ['c'] },
    ],
    finish: T0 + 130 * MIN,
    collect: T0 + 130 * MIN,
  };
}

describe('sessions', () => {
  it('makes a session per trip and a stop per printer, keyed by what they start', () => {
    const list = sessions(plan());
    expect(list.map((s) => s.key)).toEqual(['a', 'c']);
    expect(list[0].stops.map((s) => [s.index, s.key, s.printerName])).toEqual([[1, 'p|a|L', 'Left'], [2, 'p|b|R', 'Right']]);
  });

  it('keeps keys when a re-plan renumbers the trips', () => {
    const p = plan();
    const shifted = { ...p, visits: [{ at: T0 - 60 * MIN, until: T0 - 55 * MIN, starts: [] }, ...p.visits] };
    expect(sessions(shifted).map((s) => [s.index, s.key])).toEqual([[1, 'a'], [2, 'c']]);
  });

  it('links each stop to the print before it on the same printer, and prices the swap', () => {
    const [first, second] = sessions(plan());
    expect(first.stops[0].previous).toBeUndefined();
    const stop = second.stops[0];
    expect(stop.previous?.plateId).toBe('a');
    expect(stop.swap).toEqual({ from: 'PETG · black', to: 'TPU 64D · black' });
    expect(stop.estMin).toBe(20);
    expect(second.changes).toBe(1);
    expect(first.estMin).toBe(10);
  });

  it('totals the filament going on, marking estimated grams', () => {
    const [first] = sessions(plan());
    expect(first.filaments).toEqual([{ label: 'PETG · black', grams: 80, prints: 2, approx: true }]);
  });
});

describe('filamentSwap', () => {
  it('sees a colour change as a change, even in the same family', () => {
    const prev = job('a', 'L', 0, T0, 0);
    expect(filamentSwap(job('b', 'L', 1, T0, 1, { color: 'red' }), prev)).toEqual({ from: 'PETG · black', to: 'PETG · red' });
    expect(filamentSwap(job('b', 'L', 1, T0, 1), prev)).toBeUndefined();
  });

  it('takes the plan\'s swap from the loaded filament on a printer\'s first print', () => {
    expect(filamentSwap(job('b', 'L', 0, T0, 0, { swapFrom: 'PLA' }), undefined)).toEqual({ from: 'PLA', to: 'PETG · black' });
  });
});

describe('stops', () => {
  it('logs and clears only a bed that has printed', () => {
    const [first, second] = sessions(plan());
    expect(stopSteps(first.stops[0])).toEqual(['bed', 'filament', 'start', 'firstLayer']);
    expect(stopSteps(first.stops[0], true)).toEqual(['log', 'clear', 'bed', 'filament', 'start', 'firstLayer']);
    expect(stopSteps(second.stops[0])[0]).toBe('log');
  });

  it('asks for a cutter only on a swap, and a scraper only on a bed to clear', () => {
    const [first, second] = sessions(plan());
    expect(stopTools(first.stops[0])).toEqual(['spools']);
    expect(stopTools(second.stops[0])).toEqual(expect.arrayContaining(['scraper', 'cutter', 'bins', 'phone']));
    expect(first.tools).not.toContain('cutter');
    expect(second.tools).toContain('cutter');
  });

  it('says what the stop is in a few words', () => {
    const [first, second] = sessions(plan());
    expect(stopHeadline(first.stops[0])).toBe('Start #00');
    expect(stopHeadline(second.stops[0])).toBe('Clear bed · swap to TPU 64D · black · start #02');
  });
});

describe('session states', () => {
  it('counts down to the first session not done', () => {
    const list = sessions(plan());
    const logs: Record<string, { startedAt?: number; endedAt?: number }> = { a: { startedAt: T0, endedAt: T0 + 12 * MIN } };
    expect(sessionStates(list, (k) => logs[k], T0 + 20 * MIN)).toEqual(['done', 'next']);
    expect(sessionStates(list, (k) => logs[k], T0 + 66 * MIN)).toEqual(['done', 'due']);
    expect(upcoming(list, (k) => logs[k])?.key).toBe('c');
    logs.c = { startedAt: T0, endedAt: T0 + 1 };
    expect(upcoming(list, (k) => logs[k])).toBeUndefined();
  });

  it('formats the countdown', () => {
    expect(countdown(0)).toBe('0:00');
    expect(countdown(4 * MIN + 9_000)).toBe('4:09');
    expect(countdown(65 * MIN + 9_000)).toBe('1:05:09');
    expect(countdown(-90_000)).toBe('1:30');
  });
});

describe('trip badge', () => {
  const none = () => undefined;

  it('counts down to the next trip in tab-sized text', () => {
    const list = sessions(plan());
    expect(tripBadge(list, none, T0 - 45 * MIN)).toBe('45m');
    expect(tripBadge(list, none, T0 - 30_000)).toBe('1m');
    expect(tripBadge(list, none, T0 - 60 * MIN)).toBe('1h00');
    expect(tripBadge(list, none, T0 - 125 * MIN - 20_000)).toBe('2h06');
    expect(tripBadge(list, none, T0 - 50 * 60 * MIN)).toBe('2d');
  });

  it('says Now once a trip is due or under way', () => {
    const list = sessions(plan());
    expect(tripBadge(list, none, T0)).toBe('Now');
    const started: Record<string, { startedAt?: number }> = { a: { startedAt: T0 - 5 * MIN } };
    expect(tripBadge(list, (k) => started[k], T0 - 10 * MIN)).toBe('Now');
  });

  it('moves to the next trip once one ends, and clears when none is left', () => {
    const list = sessions(plan());
    const logs: Record<string, { startedAt?: number; endedAt?: number }> = { a: { startedAt: T0, endedAt: T0 + 12 * MIN } };
    expect(tripBadge(list, (k) => logs[k], T0 + 20 * MIN)).toBe('45m');
    logs.c = { startedAt: T0 + 65 * MIN, endedAt: T0 + 80 * MIN };
    expect(tripBadge(list, (k) => logs[k], T0 + 90 * MIN)).toBeNull();
    expect(tripBadge([], none, T0)).toBeNull();
  });
});
