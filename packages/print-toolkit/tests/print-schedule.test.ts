// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import {
  dailyBlocks,
  nextAvailable,
  planSchedule,
  simulate,
  type ScheduleJob,
  type SchedulePrinter,
} from '../src/print-schedule.js';

const H = 3600;
const MS = 1000;
const NOW = Date.UTC(2026, 8, 24, 9, 0); // any fixed instant

const job = (id: string, hours: number, material = 'PETG', printers?: string[]): ScheduleJob =>
  ({ id, label: id, seconds: hours * H, material, printers });
const printer = (id: string, freeInHours = 0, material?: string): SchedulePrinter =>
  ({ id, name: id, freeAt: NOW + freeInHours * H * MS, material });
const base = { now: NOW, changeoverSec: 0, materialSwapSec: 0, unavailable: [] };

describe('nextAvailable', () => {
  it('walks out of overlapping and abutting blocks', () => {
    const blocks = [{ start: 10, end: 20 }, { start: 20, end: 30 }, { start: 25, end: 40 }];
    expect(nextAvailable(5, blocks)).toBe(5);
    expect(nextAvailable(12, blocks)).toBe(40);
    expect(nextAvailable(40, blocks)).toBe(40);
  });
});

describe('dailyBlocks', () => {
  it('crosses midnight when bedtime is after wake', () => {
    const from = new Date(2026, 8, 24, 12, 0).getTime();
    const [first] = dailyBlocks('23:00', '07:00', from, 2);
    expect(new Date(first.start).getHours()).toBe(23);
    expect(new Date(first.end).getHours()).toBe(7);
    expect(first.end - first.start).toBe(8 * H * MS);
  });

  it('keeps last night\'s block when it is still running', () => {
    const from = new Date(2026, 8, 24, 3, 0).getTime();
    const blocks = dailyBlocks('23:00', '07:00', from, 1);
    expect(blocks[0].start).toBeLessThan(from);
    expect(nextAvailable(from, blocks)).toBe(new Date(2026, 8, 24, 7, 0).getTime());
  });
});

describe('simulate', () => {
  it('starts every idle printer at the first visit and returns as each frees', () => {
    const plan = simulate([job('a', 3), job('b', 1), job('c', 2)], [printer('L'), printer('R')], base, 0);
    expect(plan.visits).toHaveLength(2);
    expect(plan.visits[0].starts.map((s) => s.jobId)).toEqual(['a', 'b']);
    // R frees at +1h and takes c.
    expect(plan.jobs.find((j) => j.jobId === 'c')).toMatchObject({ printerId: 'R', start: NOW + H * MS });
    expect(plan.finish).toBe(NOW + 3 * H * MS);
  });

  it('waits out an operator block before starting the next job', () => {
    const block = { start: NOW + 0.25 * H * MS, end: NOW + 9 * H * MS };
    const plan = simulate([job('a', 0.5), job('b', 1)], [printer('L')], { ...base, unavailable: [block] }, 0);
    expect(plan.jobs[1].start).toBe(block.end);
  });

  it('charges changeover and material swaps to the operator, printer by printer', () => {
    const plan = simulate(
      [job('a', 1, 'TPU'), job('b', 1, 'PETG')],
      [printer('L', 0, 'PETG'), printer('R', 0, 'PETG')],
      { ...base, changeoverSec: 300, materialSwapSec: 600 },
      0,
    );
    // L prefers the job in its loaded material; R has to swap to TPU.
    const byJob = Object.fromEntries(plan.jobs.map((j) => [j.jobId, j]));
    expect(byJob.b).toMatchObject({ printerId: 'L', start: NOW + 300 * MS });
    expect(byJob.a).toMatchObject({ printerId: 'R', swapFrom: 'PETG', start: NOW + (300 + 300 + 600) * MS });
  });

  it('waits for a busy printer and leaves jobs no printer may take unassigned', () => {
    const plan = simulate([job('a', 1, 'PETG', ['R']), job('x', 1, 'PETG', ['gone'])], [printer('L'), printer('R', 2)], base, 0);
    expect(plan.unassigned).toEqual(['x']);
    expect(plan.jobs).toEqual([expect.objectContaining({ jobId: 'a', printerId: 'R', start: NOW + 2 * H * MS })]);
  });

  it('holds TPU until everything else has started, then batches it on at most two printers', () => {
    const plan = simulate(
      [job('t1', 1, 'TPU'), job('t2', 1, 'TPU'), job('t3', 1, 'TPU'), job('a', 3), job('b', 2), job('c', 1)],
      [printer('L'), printer('R', 0, 'TPU'), printer('C')],
      { ...base, lastMaterials: ['TPU'] },
      0,
    );
    const byJob = Object.fromEntries(plan.jobs.map((j) => [j.jobId, j]));
    const lastOrdinaryStart = Math.max(byJob.a.start, byJob.b.start, byJob.c.start);
    for (const id of ['t1', 't2', 't3']) expect(byJob[id].start).toBeGreaterThanOrEqual(lastOrdinaryStart);
    // R had TPU loaded but prints PETG first instead of sitting on the TPU all day.
    expect(plan.jobs.find((j) => j.printerId === 'R' && j.start === NOW)).toMatchObject({ swapFrom: 'TPU' });
    expect(new Set(['t1', 't2', 't3'].map((id) => byJob[id].printerId)).size).toBeLessThanOrEqual(2);
  });

  it('opens the TPU batch within the visit that starts the last ordinary job', () => {
    const plan = simulate([job('a', 1), job('t', 1, 'TPU')], [printer('L'), printer('R')], { ...base, lastMaterials: ['TPU'] }, 0);
    expect(plan.visits).toHaveLength(1);
    expect(plan.visits[0].starts.map((s) => s.jobId)).toEqual(['a', 't']);
  });

  it('gathers printers finishing close together into one visit', () => {
    const jobs = [job('a', 1), job('b', 1.25), job('c', 1), job('d', 1)];
    const each = simulate(jobs, [printer('L'), printer('R')], base, 0);
    const gathered = simulate(jobs, [printer('L'), printer('R')], base, 30 * 60);
    expect(each.visits).toHaveLength(3);
    expect(gathered.visits).toHaveLength(2);
  });
});

describe('planSchedule', () => {
  const fleet = [printer('L'), printer('R'), printer('C')];
  const jobs = [job('w1', 7), job('w2', 7), job('t1', 5), job('t2', 5), job('r', 3), job('p', 2, 'TPU'), job('tmp', 1)];

  it('schedules every job exactly once', () => {
    const plan = planSchedule(jobs, fleet, { ...base, objective: 'makespan' });
    expect(plan.jobs.map((j) => j.jobId).sort()).toEqual(jobs.map((j) => j.id).sort());
    for (const p of fleet) {
      const mine = plan.jobs.filter((j) => j.printerId === p.id).sort((a, b) => a.start - b.start);
      for (let i = 1; i < mine.length; i++) expect(mine[i].start).toBeGreaterThanOrEqual(mine[i - 1].end);
    }
  });

  it('finishes no later than longest-first, and is deterministic', () => {
    const longest = simulate([...jobs].sort((a, b) => b.seconds - a.seconds), fleet, base, 0);
    const plan = planSchedule(jobs, fleet, { ...base, objective: 'makespan' });
    expect(plan.finish).toBeLessThanOrEqual(longest.finish);
    // 30h of work on 3 printers can't beat 10h.
    expect(plan.finish).toBeGreaterThanOrEqual(NOW + 10 * H * MS);
    expect(planSchedule(jobs, fleet, { ...base, objective: 'makespan' })).toEqual(plan);
  });

  it('trades finish time for fewer trips when asked', () => {
    const fast = planSchedule(jobs, fleet, { ...base, objective: 'makespan' });
    const few = planSchedule(jobs, fleet, { ...base, objective: 'visits' });
    expect(few.visits.length).toBeLessThanOrEqual(fast.visits.length);
    expect(few.visits.length).toBeLessThanOrEqual(3);
  });

  it('starts the long jobs before bed so they run overnight', () => {
    const now = new Date(2026, 8, 24, 20, 0).getTime();
    const unavailable = dailyBlocks('22:00', '07:00', now, 3);
    const plan = planSchedule(
      [job('short1', 1), job('short2', 1), job('long', 9)],
      [{ id: 'L', name: 'L', freeAt: now }],
      { now, objective: 'makespan', changeoverSec: 0, materialSwapSec: 0, unavailable },
    );
    // The long job goes on before bed and runs through the night; the other
    // short one waits for morning. Long-first would finish at 09:00.
    const long = plan.jobs.find((j) => j.jobId === 'long')!;
    expect(new Date(long.start).getHours()).toBeLessThan(22);
    expect(new Date(plan.finish).getHours()).toBe(8);
  });
});
