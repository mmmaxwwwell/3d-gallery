// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import type { HistoryJob, PrintStatus } from '@3d-gallery/print-toolkit';
import { isFinal, latestStart, needsReport, reportFrom, reportSummary } from '../../src/print/print-report.js';
import type { PrintRecord } from '../../src/print/operator-store.js';

const T = Date.UTC(2026, 8, 26, 12, 0);
const MIN = 60_000;
const FILE = '03-plate.gcode';

const record = (extra: Partial<PrintRecord> = {}): PrintRecord => ({
  id: 'r', projectId: 'p', plateId: 'a', printerId: 'L', file: FILE, at: T, kind: 'start', source: 'dispatch', ...extra,
});
const run = (extra: Partial<HistoryJob> = {}): HistoryJob => ({ filename: FILE, status: 'completed', startTime: T + MIN, ...extra });
const status = (extra: Partial<PrintStatus> = {}): PrintStatus =>
  ({ state: 'standby', filename: '', remainingSec: 0, progress: 0, ...extra });

describe('print report', () => {
  it('takes how the run ended from history, with its time and filament', () => {
    const r = reportFrom(record(), [run({ endTime: T + 300 * MIN, printDurationSec: 17_000, filamentUsedMm: 12_345 })], null, null, T + 400 * MIN);
    expect(r).toMatchObject({ state: 'printed', startedAt: T + MIN, endedAt: T + 300 * MIN, printDurationSec: 17_000, filamentMm: 12_345, errors: [] });
    expect(isFinal(r)).toBe(true);
    expect(reportSummary(r, T + 400 * MIN)).toMatch(/^Finished .* · 4h 43m · 12\.3 m of filament$/);
  });

  it('ignores runs of the same file from before it was started', () => {
    const old = run({ startTime: T - 60 * MIN, status: 'cancelled' });
    expect(reportFrom(record(), [old], null, null, T).state).toBe('not-found');
    expect(reportFrom(record(), [old, run({ status: 'error' })], null, null, T).state).toBe('error');
  });

  it('reads a running print from the live state, progress and time left', () => {
    const r = reportFrom(record(), [run({ status: 'in_progress' })], status({ state: 'printing', filename: FILE, progress: 0.62, remainingSec: 4800 }), null, T);
    expect(r).toMatchObject({ state: 'printing', progress: 0.62, remainingSec: 4800 });
    expect(isFinal(r)).toBe(false);
    expect(reportSummary(r, T)).toBe('Printing · 62% · 1h 20m left');
  });

  it('falls back to the live state when the printer keeps no history', () => {
    expect(reportFrom(record(), null, status({ state: 'complete', filename: FILE }), null, T).state).toBe('printed');
    expect(reportFrom(record(), null, status({ state: 'complete', filename: 'other.gcode' }), null, T).state).toBe('not-found');
  });

  it('keeps console errors logged while the run was going, and only those', () => {
    const console = [
      { message: '!! Earlier trouble', time: T - 30 * MIN, type: 'response' },
      { message: '!! Move out of range: 250.0 10.0 0.3', time: T + 90 * MIN, type: 'response' },
      { message: 'G28', time: T + 91 * MIN, type: 'command' },
      { message: '// probe at 10,10', time: T + 92 * MIN, type: 'response' },
    ];
    const r = reportFrom(record(), [run({ status: 'error', endTime: T + 95 * MIN })], null, console, T + 100 * MIN);
    expect(r.errors).toEqual(['Move out of range: 250.0 10.0 0.3']);
  });

  it('asks again only about starts still unsettled and not just checked', () => {
    const settled = record({ id: 's', report: { state: 'printed', checkedAt: T, errors: [] } });
    const fresh = record({ id: 'f', report: { state: 'printing', checkedAt: T, errors: [] } });
    const stale = record({ id: 'x', report: { state: 'printing', checkedAt: T - MIN, errors: [] } });
    const upload = record({ id: 'u', kind: 'upload' });
    expect(needsReport([settled, fresh, stale, upload, record({ id: 'n' })], T).map((r) => r.id)).toEqual(['x', 'n']);
  });

  it('finds the latest start of a plate on a printer', () => {
    const records = [record({ id: '1', at: T }), record({ id: '2', at: T + MIN }), record({ id: '3', printerId: 'R', at: T + 2 * MIN })];
    expect(latestStart(records, 'a', 'L')?.id).toBe('2');
  });
});
