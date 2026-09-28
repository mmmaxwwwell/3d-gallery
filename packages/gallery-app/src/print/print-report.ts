// SPDX-License-Identifier: MIT
// What the printer says about a print the operator started: still going, or
// how it ended, how long it took, the filament it used, and any errors its
// console logged along the way. Asked for whenever a screen that shows
// started prints loads, and kept on the print's record.

import {
  fetchConsole,
  fetchJobHistory,
  fetchPrintStatus,
  type ConsoleLine,
  type HistoryJob,
  type PrintStatus,
} from '@3d-gallery/print-toolkit';
import { listPresets } from './print-storage.js';
import { formatWhen } from './fleet-plan.js';
import { formatDuration } from './planner-model.js';
import { listPrints, saveReport, type PrintRecord } from './operator-store.js';

export type ReportState = 'printing' | 'paused' | 'printed' | 'cancelled' | 'error' | 'not-found';

export interface PrintReport {
  state: ReportState;
  checkedAt: number;
  /** 0–1, while it runs. */
  progress?: number;
  remainingSec?: number;
  /** Printer clock, epoch ms. */
  startedAt?: number;
  endedAt?: number;
  printDurationSec?: number;
  filamentMm?: number;
  /** Console errors (`!!` lines) logged while it ran. */
  errors: string[];
}

/** Allowance for the printer's clock running behind the browser's. */
const CLOCK_SKEW_MS = 5 * 60_000;
/** A final report is never asked for again; a live one is, once this old. */
const STALE_MS = 30_000;

export function isFinal(report: PrintReport | undefined): boolean {
  return !!report && (report.state === 'printed' || report.state === 'cancelled' || report.state === 'error');
}

/**
 * The report for `record` from what the printer returned. History is the
 * record: the first run of the file since it was started. Without history
 * (not enabled, or not listed yet), the live state, if it's this file.
 */
export function reportFrom(
  record: Pick<PrintRecord, 'file' | 'at'>,
  history: HistoryJob[] | null,
  status: PrintStatus | null,
  console: ConsoleLine[] | null,
  now: number,
): PrintReport {
  const run = (history ?? [])
    .filter((h) => h.filename === record.file && h.startTime >= record.at - CLOCK_SKEW_MS)
    .sort((a, b) => a.startTime - b.startTime)[0];
  const live = status && status.filename === record.file ? status : null;
  const from = run?.startTime ?? record.at - CLOCK_SKEW_MS;
  const until = run?.endTime ?? Infinity;
  const errors = (console ?? [])
    .filter((l) => l.type === 'response' && l.message.startsWith('!!') && l.time >= from && l.time <= until + 60_000)
    .map((l) => l.message.replace(/^!!\s*/, ''));

  let state: ReportState;
  if (run && run.status !== 'in_progress') {
    state = run.status === 'completed' ? 'printed' : run.status === 'cancelled' ? 'cancelled' : 'error';
  } else if (live && (live.state === 'printing' || live.state === 'paused')) {
    state = live.state;
  } else if (!run && live) {
    state = live.state === 'complete' ? 'printed' : live.state === 'cancelled' ? 'cancelled' : live.state === 'error' ? 'error' : 'not-found';
  } else {
    state = run ? 'printing' : 'not-found';
  }

  return {
    state,
    checkedAt: now,
    ...(live && (state === 'printing' || state === 'paused') ? { progress: live.progress, remainingSec: live.remainingSec } : {}),
    ...(run ? { startedAt: run.startTime } : {}),
    ...(run?.endTime ? { endedAt: run.endTime } : {}),
    ...(run?.printDurationSec !== undefined ? { printDurationSec: run.printDurationSec } : {}),
    ...(run?.filamentUsedMm !== undefined ? { filamentMm: run.filamentUsedMm } : {}),
    errors,
  };
}

const STATE_TEXT: Record<ReportState, string> = {
  printing: 'Printing',
  paused: 'Paused',
  printed: 'Finished',
  cancelled: 'Cancelled',
  error: 'Stopped with an error',
  'not-found': 'The printer has no record of it',
};

/** One line for the operator: "Finished 3:12 AM · 4h 58m · 12.3 m of filament". */
export function reportSummary(report: PrintReport, now: number): string {
  const parts = [STATE_TEXT[report.state] + (report.endedAt ? ` ${formatWhen(report.endedAt, now)}` : '')];
  if (report.progress !== undefined) parts.push(`${Math.round(report.progress * 100)}%`);
  if (report.remainingSec) parts.push(`${formatDuration(report.remainingSec)} left`);
  if (report.printDurationSec && isFinal(report)) parts.push(formatDuration(report.printDurationSec));
  if (report.filamentMm) parts.push(`${(report.filamentMm / 1000).toFixed(1)} m of filament`);
  return parts.join(' · ');
}

/** The latest start of `plateId` on `printerId`, if one was recorded. */
export function latestStart(records: PrintRecord[], plateId: string, printerId: string): PrintRecord | undefined {
  return records
    .filter((r) => r.kind === 'start' && r.plateId === plateId && r.printerId === printerId)
    .sort((a, b) => b.at - a.at)[0];
}

/** Started prints of `projectId` whose report is missing, stale, or still running. */
export function needsReport(records: PrintRecord[], now: number): PrintRecord[] {
  return records.filter((r) => r.kind === 'start'
    && !isFinal(r.report)
    && (!r.report || now - r.report.checkedAt >= STALE_MS));
}

const inFlight = new Map<string, Promise<void>>();

/**
 * Ask each printer about the project's started prints that need it, and keep
 * the answers. One query set per printer; an unreachable printer is skipped
 * and asked again next time. Concurrent calls for a project share one run.
 */
export function refreshPrintReports(projectId: string): Promise<void> {
  let run = inFlight.get(projectId);
  if (!run) {
    run = doRefresh(projectId).finally(() => inFlight.delete(projectId));
    inFlight.set(projectId, run);
  }
  return run;
}

async function doRefresh(projectId: string): Promise<void> {
  const todo = needsReport(await listPrints(projectId), Date.now());
  if (todo.length === 0) return;
  const printers = new Map((await listPresets('printer')).map((p) => [p.id, p]));
  const byPrinter = new Map<string, PrintRecord[]>();
  for (const r of todo) byPrinter.set(r.printerId, [...(byPrinter.get(r.printerId) ?? []), r]);
  await Promise.all([...byPrinter].map(async ([printerId, records]) => {
    const address = printers.get(printerId)?.address;
    if (!address) return;
    const since = Math.min(...records.map((r) => r.at)) - 10 * 60_000;
    const [history, status, console] = await Promise.all([
      fetchJobHistory(address, since).catch(() => null),
      fetchPrintStatus(address).catch(() => null),
      fetchConsole(address).catch(() => null),
    ]);
    if (!history && !status) return;
    const now = Date.now();
    for (const r of records) await saveReport(r.id, reportFrom(r, history, status, console, now));
  }));
}
