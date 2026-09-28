// SPDX-License-Identifier: MIT
// Every sent plan's queue, as the Printers page sees it: one printer card
// holds the belts of every project that sent it plates. No I/O, so the
// grouping can be tested without a printer.

import {
  belt,
  latestTask,
  type Dispatch,
  type DispatchJob,
  type DispatchTask,
  type JobPhase,
  type LogEntry,
  type PrinterLive,
} from '../../print/dispatch-model.js';

export const PHASE_TEXT: Record<JobPhase, string> = {
  waiting: 'Not uploaded',
  uploading: 'Uploading…',
  uploaded: 'On the printer',
  starting: 'Starting…',
  printing: 'Printing',
  failed: 'Failed',
  finished: 'Finished',
};

/** Shown in the log, which holds the last this many lines across every plan. */
export const LOG_LINES = 300;

function isOpenOrFailed(t: DispatchTask): boolean {
  return t.state === 'queued' || t.state === 'running' || t.state === 'failed';
}

/**
 * Whether a plan still has something for the page to do or show: a plate on
 * a belt, or a command not yet settled. Finished plans are left out, or every
 * plan ever sent would sit on the cards and keep being probed.
 */
export function isActive(d: Dispatch): boolean {
  return d.jobs.some((j) => !j.outcome) || d.tasks.some(isOpenOrFailed);
}

/** One project's share of one printer. */
export interface PrinterShare {
  projectId: string;
  /** Unfinished, in plan order. */
  jobs: DispatchJob[];
  /** Taken off the belt, printed or by hand, in plan order. */
  finished: DispatchJob[];
}

/**
 * The projects with plates for `printerId`, oldest plan first: an older plan
 * was sent to run first, and its plan order means nothing against a newer one's.
 */
export function printerShares(dispatches: readonly Dispatch[], printerId: string): PrinterShare[] {
  return [...dispatches]
    .sort((a, b) => a.sentAt - b.sentAt)
    .map((d) => ({
      projectId: d.projectId,
      jobs: belt(d, printerId),
      finished: d.jobs.filter((j) => j.printerId === printerId && j.outcome).sort((a, b) => a.order - b.order),
    }))
    .filter((s) => s.jobs.length > 0 || s.finished.length > 0);
}

/** Printers some plan has jobs for, which aren't among `shown`. */
export function unshownPrinters(dispatches: readonly Dispatch[], shown: ReadonlySet<string>): string[] {
  const out = new Set<string>();
  for (const d of dispatches) for (const j of d.jobs) if (!j.outcome && !shown.has(j.printerId)) out.add(j.printerId);
  return [...out];
}

/** Why a failed job failed: its start's error, else its upload's. */
export function jobError(d: Dispatch, job: DispatchJob): string | undefined {
  const start = latestTask(d, job, 'start');
  const upload = latestTask(d, job, 'upload');
  return (start?.state === 'failed' ? start.error : undefined) ?? (upload?.state === 'failed' ? upload.error : undefined);
}

export interface OpenTask extends DispatchTask {
  projectId: string;
}

/** Commands still to run, running, or failed, across every plan — newest first. */
export function openTasks(dispatches: readonly Dispatch[]): OpenTask[] {
  return dispatches
    .flatMap((d) => d.tasks.filter(isOpenOrFailed).map((t) => ({ ...t, projectId: d.projectId })))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export interface ProjectLogEntry extends LogEntry {
  projectId: string;
}

/** Every plan's log in one, oldest first, cut to the last `LOG_LINES`. */
export function mergedLog(dispatches: readonly Dispatch[]): ProjectLogEntry[] {
  return dispatches
    .flatMap((d) => d.log.map((e) => ({ ...e, projectId: d.projectId })))
    .sort((a, b) => a.at - b.at)
    .slice(-LOG_LINES);
}

/** What Print says about the bed, which no probe can see. */
export function bedQuestion(live: PrinterLive | undefined): string {
  const state = live?.status?.state;
  return state === 'complete' || state === 'cancelled' || state === 'error'
    ? 'The last print is probably still on the bed.'
    : 'Check the bed is clear.';
}

export function plateNumber(job: Pick<DispatchJob, 'order'>): string {
  return `#${String(job.order).padStart(2, '0')}`;
}
