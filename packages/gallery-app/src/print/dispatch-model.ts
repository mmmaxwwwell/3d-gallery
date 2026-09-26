// SPDX-License-Identifier: MIT
// A sent plan, as a queue of commands to the printers: which plate goes to
// which printer in what order, every upload and start asked for, and what
// came of each. No I/O — the dispatch daemon runs it, the screen draws it,
// and a test can drive it.

import type { HistoryJob, KlippyState, PrintStatus } from '@3d-gallery/print-toolkit';

/** One plate on one printer's conveyor. */
export interface DispatchJob {
  plateId: string;
  plateName: string;
  printerId: string;
  /** Name on the printer: `NN-<plate>.gcode`. */
  file: string;
  /** The plan's start order across the fleet; the NN in `file`. */
  order: number;
  /** Material family, for the loaded-filament check. */
  material: string;
  /** What goes on the spool holder: "TPU 64D · black". */
  filament: string;
  seconds: number;
  /** `slicedAt` of the kept slice this job sends. A re-slice is a new job. */
  slicedAt: number;
  /** How its print ended. `skipped` is the operator taking it off the belt. */
  outcome?: { state: JobOutcome; at: number };
}

export type JobOutcome = 'printed' | 'cancelled' | 'error' | 'skipped';

export type TaskKind = 'upload' | 'start';
export type TaskState = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

/** A command to a printer: upload a job's file, or start printing it. */
export interface DispatchTask {
  id: string;
  kind: TaskKind;
  plateId: string;
  printerId: string;
  file: string;
  slicedAt: number;
  state: TaskState;
  attempts: number;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

export interface LogEntry {
  at: number;
  level: 'info' | 'error';
  printerId?: string;
  text: string;
}

export interface Dispatch {
  projectId: string;
  sentAt: number;
  jobs: DispatchJob[];
  tasks: DispatchTask[];
  log: LogEntry[];
}

const LOG_LIMIT = 300;
/** Settled tasks kept for the queue's history; open ones are never dropped. */
const SETTLED_LIMIT = 200;
/** Allowance for the printer's clock running behind the browser's. */
const CLOCK_SKEW_MS = 5 * 60_000;

export function emptyDispatch(projectId: string): Dispatch {
  return { projectId, sentAt: 0, jobs: [], tasks: [], log: [] };
}

export function jobKey(job: Pick<DispatchJob, 'plateId' | 'printerId' | 'file' | 'slicedAt'>): string {
  return `${job.plateId}|${job.printerId}|${job.file}|${job.slicedAt}`;
}

function isOpen(task: DispatchTask): boolean {
  return task.state === 'queued' || task.state === 'running';
}

export function log(d: Dispatch, entry: LogEntry): Dispatch {
  return { ...d, log: [...d.log, entry].slice(-LOG_LIMIT) };
}

function prune(tasks: DispatchTask[]): DispatchTask[] {
  const settled = tasks.filter((t) => t.state === 'done' || t.state === 'cancelled');
  if (settled.length <= SETTLED_LIMIT) return tasks;
  const drop = new Set(settled.slice(0, settled.length - SETTLED_LIMIT).map((t) => t.id));
  return tasks.filter((t) => !drop.has(t.id));
}

/**
 * Put a new plan on the belts. Tasks and outcomes carry over for any job that
 * is the same file of the same slice on the same printer; queued commands for
 * anything else are cancelled, since they'd send a plan that no longer stands.
 */
export function sendPlan(prev: Dispatch, jobs: DispatchJob[], now: number): Dispatch {
  const before = new Map(prev.jobs.map((j) => [jobKey(j), j]));
  const keys = new Set(jobs.map(jobKey));
  const printers = new Set(jobs.map((j) => j.printerId));
  let d: Dispatch = {
    ...prev,
    sentAt: now,
    jobs: jobs.map((j) => ({ ...j, outcome: before.get(jobKey(j))?.outcome })),
    tasks: prev.tasks.map((t) => (t.state === 'queued' && !keys.has(jobKey(t))
      ? { ...t, state: 'cancelled' as const, updatedAt: now, error: 'Replaced by a newer plan' }
      : t)),
  };
  d = log(d, { at: now, level: 'info', text: `Plan sent: ${jobs.length} plate${jobs.length === 1 ? '' : 's'} on ${printers.size} printer${printers.size === 1 ? '' : 's'}.` });
  return d;
}

/** The latest `kind` command for `job`, if any was ever asked for. */
export function latestTask(d: Dispatch, job: DispatchJob, kind: TaskKind): DispatchTask | undefined {
  const key = jobKey(job);
  let latest: DispatchTask | undefined;
  for (const t of d.tasks) if (t.kind === kind && jobKey(t) === key && (!latest || t.createdAt >= latest.createdAt)) latest = t;
  return latest;
}

export type JobPhase =
  | 'waiting'    // not uploaded, nothing asked
  | 'uploading'  // upload queued or running
  | 'uploaded'
  | 'starting'   // start queued or running
  | 'printing'   // started; the printer hasn't said how it ended yet
  | 'failed'     // the latest upload or start failed
  | 'finished';  // `outcome` says how

export function jobPhase(d: Dispatch, job: DispatchJob): JobPhase {
  if (job.outcome) return 'finished';
  const start = latestTask(d, job, 'start');
  if (start?.state === 'done') return 'printing';
  if (start && isOpen(start)) return 'starting';
  const upload = latestTask(d, job, 'upload');
  if (start?.state === 'failed' && upload?.state === 'done') return 'failed';
  if (!upload || upload.state === 'cancelled') return 'waiting';
  if (isOpen(upload)) return 'uploading';
  return upload.state === 'done' ? 'uploaded' : 'failed';
}

/** A printer's belt: its unfinished jobs in plan order. */
export function belt(d: Dispatch, printerId: string): DispatchJob[] {
  return d.jobs.filter((j) => j.printerId === printerId && !j.outcome).sort((a, b) => a.order - b.order);
}

/** The job the printer's Print button would start: the first one not already going. */
export function nextJob(d: Dispatch, printerId: string): DispatchJob | undefined {
  return belt(d, printerId).find((j) => {
    const phase = jobPhase(d, j);
    return phase !== 'printing' && phase !== 'starting';
  });
}

export function printerIds(d: Dispatch): string[] {
  const first = new Map<string, number>();
  for (const j of d.jobs) first.set(j.printerId, Math.min(first.get(j.printerId) ?? Infinity, j.order));
  return [...first.keys()].sort((a, b) => first.get(a)! - first.get(b)!);
}

// ── Commands ─────────────────────────────────────────────

/** Ask for `kind` on `job`. A command already queued or running isn't asked twice. */
export function enqueue(d: Dispatch, kind: TaskKind, job: DispatchJob, id: string, now: number): Dispatch {
  const latest = latestTask(d, job, kind);
  if (latest && isOpen(latest)) return d;
  const task: DispatchTask = {
    id, kind, plateId: job.plateId, printerId: job.printerId, file: job.file, slicedAt: job.slicedAt,
    state: 'queued', attempts: 0, createdAt: now, updatedAt: now,
  };
  return { ...d, tasks: prune([...d.tasks, task]) };
}

/** Jobs Upload all would queue: on a belt, and never uploaded or last failed. */
export function needsUpload(d: Dispatch): DispatchJob[] {
  return d.jobs.filter((j) => {
    if (j.outcome) return false;
    const upload = latestTask(d, j, 'upload');
    return !upload || upload.state === 'failed' || upload.state === 'cancelled';
  });
}

export function patchTask(d: Dispatch, id: string, patch: Partial<DispatchTask>, now: number): Dispatch {
  return { ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now } : t)) };
}

export function retryTask(d: Dispatch, id: string, now: number): Dispatch {
  return patchTask(d, id, { state: 'queued', error: undefined }, now);
}

/** Drop a queued command, or dismiss a failed one. */
export function cancelTask(d: Dispatch, id: string, now: number): Dispatch {
  const task = d.tasks.find((t) => t.id === id);
  return task?.state === 'queued' || task?.state === 'failed' ? patchTask(d, id, { state: 'cancelled' }, now) : d;
}

/**
 * What to run now. Starts go at once: they are one small request, and a
 * printer waiting on the operator shouldn't wait on another file's upload.
 * Uploads go one at a time per printer, oldest first, so a printer's files
 * arrive in the order it prints them and one slow link doesn't hold up the rest.
 */
export function runnable(d: Dispatch): DispatchTask[] {
  const out = d.tasks.filter((t) => t.kind === 'start' && t.state === 'queued');
  const busy = new Set(d.tasks.filter((t) => t.kind === 'upload' && t.state === 'running').map((t) => t.printerId));
  const uploads = d.tasks.filter((t) => t.kind === 'upload' && t.state === 'queued').sort((a, b) => a.createdAt - b.createdAt);
  for (const t of uploads) {
    if (busy.has(t.printerId)) continue;
    busy.add(t.printerId);
    out.push(t);
  }
  return out;
}

/**
 * After a reload nothing is running. An interrupted upload is safe to send
 * again. An interrupted start may or may not have reached the printer, so it
 * fails and the operator decides.
 */
export function resumeAfterReload(d: Dispatch, now: number): Dispatch {
  let out = d;
  for (const t of d.tasks) {
    if (t.state !== 'running') continue;
    out = t.kind === 'upload'
      ? patchTask(out, t.id, { state: 'queued' }, now)
      : patchTask(out, t.id, { state: 'failed', error: 'Interrupted by a reload — check the printer before retrying' }, now);
  }
  return out;
}

export function setOutcome(d: Dispatch, job: DispatchJob, outcome: JobOutcome | undefined, now: number): Dispatch {
  const key = jobKey(job);
  return {
    ...d,
    jobs: d.jobs.map((j) => (jobKey(j) === key ? { ...j, outcome: outcome ? { state: outcome, at: now } : undefined } : j)),
  };
}

// ── What the printer says ────────────────────────────────

/**
 * How a started job ended, from Moonraker's history: the first print of its
 * file since it was started. Null while it's still going or not yet listed.
 */
export function outcomeFromHistory(file: string, startedAt: number, history: HistoryJob[]): JobOutcome | null {
  const runs = history
    .filter((h) => h.filename === file && h.startTime >= startedAt - CLOCK_SKEW_MS)
    .sort((a, b) => a.startTime - b.startTime);
  const run = runs[0];
  if (!run || run.status === 'in_progress') return null;
  if (run.status === 'completed') return 'printed';
  if (run.status === 'cancelled') return 'cancelled';
  return 'error';
}

/** For a printer without job history: its current file, once it stops. */
export function outcomeFromStatus(file: string, status: PrintStatus): JobOutcome | null {
  if (status.filename !== file) return null;
  if (status.state === 'complete') return 'printed';
  if (status.state === 'cancelled') return 'cancelled';
  if (status.state === 'error') return 'error';
  return null;
}

/** The latest readiness probe of one printer. */
export interface PrinterLive {
  checkedAt: number;
  /** Moonraker couldn't be reached; nothing else is known. */
  error?: string;
  klippy?: KlippyState;
  status?: PrintStatus;
  /** Whether the next job's file is on the printer; undefined when not checked. */
  nextOnPrinter?: boolean;
}

/** `null`: not known, or a warning that doesn't block a start. */
export interface Check {
  id: 'reach' | 'klipper' | 'idle' | 'file' | 'filament';
  ok: boolean | null;
  text: string;
}

function isBusy(status: PrintStatus | undefined): boolean {
  return status?.state === 'printing' || status?.state === 'paused';
}

/**
 * Whether `printer` can start `job` now, check by check. The bed is the one
 * thing no probe can see; the Print button asks the operator about it.
 */
export function readinessChecks(
  live: PrinterLive | undefined,
  job: DispatchJob | undefined,
  loaded: string,
  hasAddress: boolean,
): Check[] {
  if (!hasAddress) return [{ id: 'reach', ok: false, text: 'No Moonraker address — set print_host on the preset' }];
  if (!live) return [{ id: 'reach', ok: null, text: 'Checking…' }];
  if (live.error) return [{ id: 'reach', ok: false, text: `Unreachable: ${live.error}` }];
  const checks: Check[] = [{ id: 'reach', ok: true, text: 'Online' }];
  const klippy = live.klippy?.state;
  checks.push({
    id: 'klipper',
    ok: klippy === 'ready',
    text: klippy === 'ready' ? 'Klipper ready' : `Klipper ${klippy ?? 'unknown'}${live.klippy?.message ? `: ${live.klippy.message}` : ''}`,
  });
  if (klippy !== 'ready') return checks;
  const s = live.status;
  checks.push({
    id: 'idle',
    ok: !!s && !isBusy(s),
    text: !s ? 'State unknown'
      : s.state === 'printing' ? `Printing ${s.filename} (${Math.round(s.progress * 100)}%)`
        : s.state === 'paused' ? `Paused on ${s.filename}`
          : s.state === 'complete' ? `Idle — ${s.filename} finished, clear the bed`
            : `Idle (${s.state})`,
  });
  if (!job) return checks;
  checks.push({
    id: 'file',
    ok: live.nextOnPrinter ?? null,
    text: live.nextOnPrinter === undefined ? `${job.file}: not checked` : live.nextOnPrinter ? `${job.file} on the printer` : `${job.file} not uploaded`,
  });
  checks.push({
    id: 'filament',
    ok: !loaded ? null : loaded === job.material ? true : null,
    text: !loaded ? `Needs ${job.filament} — loaded filament unknown`
      : loaded === job.material ? `${job.material} loaded`
        : `Needs ${job.filament}, ${loaded} loaded — swap first`,
  });
  return checks;
}

/** Filament is advice; everything else must pass. */
export function canStart(checks: Check[]): boolean {
  const blocking = checks.filter((c) => c.id !== 'filament');
  return blocking.length >= 4 && blocking.every((c) => c.ok === true);
}
