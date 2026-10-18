// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import {
  amsCheck,
  belt,
  canStart,
  cancelTask,
  emptyDispatch,
  enqueue,
  jobPhase,
  needsUpload,
  nextJob,
  outcomeFromHistory,
  patchTask,
  readinessChecks,
  resumeAfterReload,
  retryTask,
  runnable,
  sendPlan,
  type Dispatch,
  type DispatchJob,
  type PrinterLive,
} from '../../src/print/dispatch-model.js';

function job(plateId: string, printerId: string, order: number, slicedAt = 1): DispatchJob {
  return {
    plateId, plateName: `Plate ${plateId}`, printerId, file: `${String(order).padStart(2, '0')}-${plateId}.gcode`,
    order, material: 'PETG', filament: 'PETG', seconds: 3600, slicedAt,
  };
}

const JOBS = [job('a', 'L', 0), job('b', 'R', 1), job('c', 'L', 2)];

function sent(): Dispatch {
  return sendPlan(emptyDispatch('p'), JOBS, 100);
}

let seq = 0;
const id = () => `t${seq++}`;

describe('dispatch queue', () => {
  it('puts each printer\'s jobs on its belt in plan order', () => {
    const d = sent();
    expect(belt(d, 'L').map((j) => j.plateId)).toEqual(['a', 'c']);
    expect(nextJob(d, 'L')?.plateId).toBe('a');
    expect(d.log.at(-1)?.text).toBe('Plan sent: 3 plates on 2 printers.');
  });

  it('uploads one file at a time per printer, printers in parallel', () => {
    let d = sent();
    for (const j of needsUpload(d)) d = enqueue(d, 'upload', j, id(), 200);
    expect(runnable(d).map((t) => t.plateId)).toEqual(['a', 'b']);
    d = patchTask(d, runnable(d)[0].id, { state: 'running' }, 201);
    expect(runnable(d).map((t) => t.plateId)).toEqual(['b']);
  });

  it('runs a start at once, even behind a printer\'s uploads', () => {
    let d = sent();
    d = enqueue(d, 'upload', JOBS[2], id(), 200);
    d = patchTask(d, d.tasks[0].id, { state: 'running' }, 201);
    d = enqueue(d, 'start', JOBS[0], id(), 202);
    expect(runnable(d).map((t) => t.kind)).toEqual(['start']);
  });

  it('never queues the same command twice', () => {
    let d = enqueue(sent(), 'upload', JOBS[0], id(), 200);
    expect(enqueue(d, 'upload', JOBS[0], id(), 201)).toBe(d);
    d = patchTask(d, d.tasks[0].id, { state: 'failed', error: 'boom' }, 202);
    expect(needsUpload(d).map((j) => j.plateId)).toContain('a');
    expect(jobPhase(d, JOBS[0])).toBe('failed');
    d = retryTask(d, d.tasks[0].id, 203);
    expect(jobPhase(d, JOBS[0])).toBe('uploading');
  });

  it('walks a job from upload to printing, and the belt moves on', () => {
    let d = enqueue(sent(), 'upload', JOBS[0], id(), 200);
    d = patchTask(d, d.tasks[0].id, { state: 'done' }, 201);
    expect(jobPhase(d, JOBS[0])).toBe('uploaded');
    d = enqueue(d, 'start', JOBS[0], id(), 202);
    expect(jobPhase(d, JOBS[0])).toBe('starting');
    d = patchTask(d, d.tasks[1].id, { state: 'done' }, 203);
    expect(jobPhase(d, JOBS[0])).toBe('printing');
    expect(nextJob(d, 'L')?.plateId).toBe('c');
  });

  it('after a reload, re-queues uploads but fails starts for the operator to judge', () => {
    let d = enqueue(sent(), 'upload', JOBS[0], id(), 200);
    d = enqueue(d, 'start', JOBS[1], id(), 200);
    d = { ...d, tasks: d.tasks.map((t) => ({ ...t, state: 'running' as const })) };
    d = resumeAfterReload(d, 300);
    expect(d.tasks.map((t) => t.state)).toEqual(['queued', 'failed']);
  });

  it('a new plan cancels queued commands it no longer has, and keeps the rest', () => {
    let d = enqueue(sent(), 'upload', JOBS[0], id(), 200);
    d = enqueue(d, 'upload', JOBS[1], id(), 200);
    d = patchTask(d, d.tasks[0].id, { state: 'done' }, 201);
    // Plate b moved to L; plate a is unchanged.
    d = sendPlan(d, [JOBS[0], job('b', 'L', 1)], 300);
    expect(jobPhase(d, d.jobs[0])).toBe('uploaded');
    expect(d.tasks[1].state).toBe('cancelled');
    expect(jobPhase(d, d.jobs[1])).toBe('waiting');
  });

  it('a re-slice is a new file to send', () => {
    let d = enqueue(sent(), 'upload', JOBS[0], id(), 200);
    d = patchTask(d, d.tasks[0].id, { state: 'done' }, 201);
    d = sendPlan(d, [job('a', 'L', 0, 2)], 300);
    expect(jobPhase(d, d.jobs[0])).toBe('waiting');
  });

  it('cancels queued commands and dismisses failed ones, but not running ones', () => {
    let d = enqueue(sent(), 'upload', JOBS[0], id(), 200);
    const t = d.tasks[0].id;
    expect(cancelTask(patchTask(d, t, { state: 'running' }, 201), t, 202).tasks[0].state).toBe('running');
    d = cancelTask(d, t, 202);
    expect(d.tasks[0].state).toBe('cancelled');
  });
});

describe('outcomeFromHistory', () => {
  const started = 1_000_000;
  it('reads the first run of the file since it was started', () => {
    expect(outcomeFromHistory('01-a.gcode', started, [
      { filename: '01-a.gcode', status: 'completed', startTime: started - 86_400_000 },
      { filename: '01-a.gcode', status: 'cancelled', startTime: started + 5000 },
    ])).toBe('cancelled');
  });
  it('waits while it is still printing or not yet listed', () => {
    expect(outcomeFromHistory('01-a.gcode', started, [{ filename: '01-a.gcode', status: 'in_progress', startTime: started }])).toBeNull();
    expect(outcomeFromHistory('01-a.gcode', started, [])).toBeNull();
  });
  it('allows for the printer\'s clock running behind', () => {
    expect(outcomeFromHistory('01-a.gcode', started, [{ filename: '01-a.gcode', status: 'completed', startTime: started - 60_000 }])).toBe('printed');
  });
});

describe('readinessChecks', () => {
  const idle: PrinterLive = {
    checkedAt: 0,
    klippy: { state: 'ready', message: '' },
    status: { state: 'standby', filename: '', remainingSec: 0, progress: 0 },
    nextOnPrinter: true,
  };

  it('passes an idle, ready printer with the file on it', () => {
    expect(canStart(readinessChecks(idle, JOBS[0], 'PETG', true))).toBe(true);
  });

  it('treats a filament mismatch as advice, not a block', () => {
    const checks = readinessChecks(idle, JOBS[0], 'TPU', true);
    expect(checks.find((c) => c.id === 'filament')?.ok).toBeNull();
    expect(canStart(checks)).toBe(true);
  });

  it('blocks on a busy printer, a missing file, Klipper down or no address', () => {
    expect(canStart(readinessChecks({ ...idle, status: { state: 'printing', filename: 'x', remainingSec: 60, progress: 0.5 } }, JOBS[0], '', true))).toBe(false);
    expect(canStart(readinessChecks({ ...idle, nextOnPrinter: false }, JOBS[0], '', true))).toBe(false);
    expect(canStart(readinessChecks({ ...idle, klippy: { state: 'shutdown', message: 'MCU lost' } }, JOBS[0], '', true))).toBe(false);
    expect(canStart(readinessChecks({ checkedAt: 0, error: 'timeout' }, JOBS[0], '', true))).toBe(false);
    expect(canStart(readinessChecks(idle, JOBS[0], '', false))).toBe(false);
  });
});

describe('readinessChecks for a Bambu job', () => {
  const needs = [
    { slot: 1, type: 'PLA', color: '#000000' },
    { slot: 2, type: 'PLA', color: '#FFFFFF' },
  ];
  const bambuJob: DispatchJob = { ...job('q', 'X1C', 0), file: '00-q.gcode.3mf', material: 'PLA', ams: needs };
  const trays = [
    { slot: 0, type: 'PLA', color: '#000000', name: 'PLA Basic', remain: 80 },
    { slot: 4, type: 'PLA', color: '#F0F0F0', name: 'PLA Matte', remain: 50 },
  ];
  const live: PrinterLive = {
    checkedAt: 0,
    klippy: { state: 'ready', message: '' },
    status: { state: 'standby', filename: '', remainingSec: 0, progress: 0 },
    nextOnPrinter: true,
    ams: { trays, external: null },
  };

  it('checks the AMS, not the loaded spool, and says which tray feeds which slot', () => {
    const checks = readinessChecks(live, bambuJob, '', true);
    expect(checks.map((c) => c.id)).toEqual(['reach', 'klipper', 'idle', 'file', 'ams']);
    expect(checks.at(-1)).toEqual({ id: 'ams', ok: true, text: '1: AMS 1 · 1 PLA Basic · 2: AMS 2 · 1 PLA Matte (nearest colour)' });
    expect(canStart(checks)).toBe(true);
  });

  it('blocks when no tray holds a filament the plate needs', () => {
    const check = amsCheck([{ slot: 1, type: 'PETG', color: '#000000' }], live.ams);
    expect(check.ok).toBe(false);
    expect(canStart(readinessChecks({ ...live, ams: { trays: [], external: null } }, bambuJob, '', true))).toBe(false);
    expect(amsCheck(needs, null)).toEqual({ id: 'ams', ok: false, text: 'The printer reports no AMS' });
    expect(canStart(readinessChecks({ ...live, ams: undefined }, bambuJob, '', true))).toBe(false);
  });
});
