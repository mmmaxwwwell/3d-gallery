// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import {
  emptyDispatch,
  enqueue,
  log,
  patchTask,
  sendPlan,
  setOutcome,
  type Dispatch,
  type DispatchJob,
} from '../../src/print/dispatch-model.js';
import {
  bedQuestion,
  isActive,
  jobError,
  LOG_LINES,
  mergedLog,
  openTasks,
  plateNumber,
  printerShares,
  unshownPrinters,
} from '../../src/printers/queue/queue-model.js';

function job(plateId: string, printerId: string, order: number): DispatchJob {
  return {
    plateId, plateName: `Plate ${plateId}`, printerId, file: `${String(order).padStart(2, '0')}-${plateId}.gcode`,
    order, material: 'PETG', filament: 'PETG', seconds: 3600, slicedAt: 1,
  };
}

function plan(projectId: string, sentAt: number, jobs: DispatchJob[]): Dispatch {
  return sendPlan(emptyDispatch(projectId), jobs, sentAt);
}

describe('printer queues across plans', () => {
  it('gives each printer every plan\'s plates for it, oldest plan first', () => {
    const newer = plan('new', 200, [job('x', 'L', 0)]);
    const older = plan('old', 100, [job('b', 'L', 1), job('a', 'L', 0), job('r', 'R', 2)]);
    const shares = printerShares([newer, older], 'L');
    expect(shares.map((s) => s.projectId)).toEqual(['old', 'new']);
    expect(shares[0].jobs.map((j) => j.plateId)).toEqual(['a', 'b']);
    expect(printerShares([newer, older], 'C')).toEqual([]);
  });

  it('keeps finished plates apart from the belt', () => {
    let d = plan('p', 1, [job('a', 'L', 0), job('b', 'L', 1)]);
    d = setOutcome(d, d.jobs[0], 'printed', 5);
    const [share] = printerShares([d], 'L');
    expect(share.jobs.map((j) => j.plateId)).toEqual(['b']);
    expect(share.finished.map((j) => j.plateId)).toEqual(['a']);
  });

  it('follows a plan only while it has plates on a belt or commands unsettled', () => {
    let d = plan('p', 1, [job('a', 'L', 0)]);
    expect(isActive(emptyDispatch('p'))).toBe(false);
    expect(isActive(d)).toBe(true);
    d = enqueue(d, 'upload', d.jobs[0], 't1', 2);
    d = setOutcome(d, d.jobs[0], 'skipped', 3);
    expect(isActive(d)).toBe(true);
    d = patchTask(d, 't1', { state: 'failed', error: 'x' }, 4);
    expect(isActive(d)).toBe(true);
    d = patchTask(d, 't1', { state: 'cancelled' }, 5);
    expect(isActive(d)).toBe(false);
  });

  it('names printers some plan queues for that the page does not show', () => {
    const d = plan('p', 1, [job('a', 'L', 0), job('b', 'Gone', 1)]);
    expect(unshownPrinters([d], new Set(['L']))).toEqual(['Gone']);
    expect(unshownPrinters([setOutcome(d, d.jobs[1], 'skipped', 2)], new Set(['L']))).toEqual([]);
  });
});

describe('the Queue sheet', () => {
  it('lists open and failed commands from every plan, newest first', () => {
    let a = plan('a', 1, [job('a', 'L', 0)]);
    let b = plan('b', 1, [job('b', 'L', 0)]);
    a = enqueue(a, 'upload', a.jobs[0], 'ta', 10);
    b = enqueue(b, 'upload', b.jobs[0], 'tb', 20);
    a = patchTask(a, 'ta', { state: 'failed', error: 'HTTP 500' }, 30);
    const tasks = openTasks([a, b]);
    expect(tasks.map((t) => [t.id, t.projectId])).toEqual([['tb', 'b'], ['ta', 'a']]);
    b = patchTask(b, 'tb', { state: 'done' }, 40);
    expect(openTasks([a, b]).map((t) => t.id)).toEqual(['ta']);
  });

  it('merges the logs in time order and keeps the last lines', () => {
    let a = emptyDispatch('a');
    let b = emptyDispatch('b');
    for (let i = 0; i < LOG_LINES; i++) a = log(a, { at: i * 2, level: 'info', text: `a${i}` });
    b = log(b, { at: 1, level: 'error', text: 'b-early' });
    b = log(b, { at: 10_000, level: 'info', text: 'b-late' });
    const lines = mergedLog([a, b]);
    expect(lines).toHaveLength(LOG_LINES);
    expect(lines.at(-1)).toMatchObject({ text: 'b-late', projectId: 'b' });
    expect(lines.some((l) => l.text === 'a0')).toBe(false);
  });
});

describe('a job', () => {
  it('reports a failed start before a failed upload', () => {
    let d = plan('p', 1, [job('a', 'L', 0)]);
    const j = d.jobs[0];
    d = enqueue(d, 'upload', j, 'u', 2);
    d = patchTask(d, 'u', { state: 'failed', error: 'disk full' }, 3);
    expect(jobError(d, j)).toBe('disk full');
    d = patchTask(d, 'u', { state: 'done', error: undefined }, 4);
    d = enqueue(d, 'start', j, 's', 5);
    d = patchTask(d, 's', { state: 'failed', error: 'Klipper is shutdown' }, 6);
    expect(jobError(d, j)).toBe('Klipper is shutdown');
  });

  it('asks about the bed by what the printer last did', () => {
    const status = (state: string) => ({ checkedAt: 0, status: { state, filename: 'x', progress: 1, remainingSec: 0 } });
    expect(bedQuestion(status('complete') as never)).toMatch(/still on the bed/);
    expect(bedQuestion(status('standby') as never)).toBe('Check the bed is clear.');
    expect(bedQuestion(undefined)).toBe('Check the bed is clear.');
    expect(plateNumber({ order: 3 })).toBe('#03');
  });
});
