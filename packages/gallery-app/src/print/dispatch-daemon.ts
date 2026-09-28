// SPDX-License-Identifier: MIT
// Runs a project's dispatch: works through its queue of uploads and starts,
// and keeps probing its printers. One per project, living at module scope so
// uploads carry on when the screen is closed. The queue and log persist in
// localStorage, so a reload picks up where it left off.
//
// Every open page that shows the queue has a daemon, but only the one holding
// the project's dispatch lock runs uploads and starts. The others read and
// show the queue, write the operator's commands into it, and probe printers;
// the holder hears the write over the change bus and runs the command.

import {
  fetchJobHistory,
  fetchKlippyState,
  fetchPrintStatus,
  fileExists,
  listWebcams,
  startPrint,
  uploadGcode,
  type Webcam,
} from '@3d-gallery/print-toolkit';
import { listPresets, onPresetsChange, type PrintPreset } from './print-storage.js';
import { getPlate, getSlicedGcode, newId, plateSignature } from './plate-store.js';
import { recordPrint } from './operator-store.js';
import { onStoreChange, publishChange } from './change-bus.js';
import { holdLock } from './dispatch-lock.js';
import {
  belt,
  cancelTask,
  emptyDispatch,
  enqueue,
  jobKey,
  latestTask,
  log,
  needsUpload,
  nextJob,
  outcomeFromHistory,
  outcomeFromStatus,
  patchTask,
  printerIds,
  resumeAfterReload,
  retryTask,
  runnable,
  sendPlan,
  setOutcome,
  type Dispatch,
  type DispatchJob,
  type DispatchTask,
  type JobOutcome,
  type PrinterLive,
} from './dispatch-model.js';

const POLL_MS = 10_000;

const PREFIX = '3dg:print:dispatch:';

function storageKey(projectId: string): string {
  return PREFIX + projectId;
}

/** Every project with a queue stored. The Printers page shows them all at once. */
export function dispatchProjectIds(): string[] {
  try {
    const ids: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) ids.push(key.slice(PREFIX.length));
    }
    return ids;
  } catch {
    return [];
  }
}

/** The queue as stored, or null when storage can't be read. */
function readDispatch(projectId: string): Dispatch | null {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    return raw ? { ...emptyDispatch(projectId), ...(JSON.parse(raw) as Dispatch) } : emptyDispatch(projectId);
  } catch {
    return null;
  }
}

export function loadDispatch(projectId: string): Dispatch {
  // Unreadable or blocked storage: start empty rather than refuse to open.
  return readDispatch(projectId) ?? emptyDispatch(projectId);
}

/** False when the store is full or blocked: persistence is lost, not the running queue. */
function saveDispatch(d: Dispatch): boolean {
  try {
    localStorage.setItem(storageKey(d.projectId), JSON.stringify(d));
  } catch {
    return false;
  }
  publishChange('dispatch', d.projectId);
  return true;
}

/** Called with the project id whenever its queue is written, in this tab or another. */
export function onDispatchChange(fn: (projectId: string) => void): () => void {
  return onStoreChange('dispatch', (projectId) => fn(projectId));
}

export function hasDispatch(projectId: string): boolean {
  return loadDispatch(projectId).jobs.length > 0;
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export interface DaemonSnapshot {
  dispatch: Dispatch;
  /** Whether this page holds the lock and runs the queue's uploads and starts. */
  runner: boolean;
  live: Record<string, PrinterLive>;
  cams: Record<string, Webcam[]>;
  printers: Map<string, PrintPreset>;
}

export class DispatchDaemon {
  private snap: DaemonSnapshot;
  private readonly listeners = new Set<() => void>();
  private readonly running = new Set<string>();
  private timer: number | null = null;
  /** The last write didn't stick, so this page's copy is newer than the store's. */
  private unsaved = false;

  constructor(projectId: string, printers: PrintPreset[]) {
    this.snap = {
      dispatch: loadDispatch(projectId),
      runner: false,
      live: {},
      cams: {},
      printers: new Map(printers.map((p) => [p.id, p])),
    };
    onStoreChange('dispatch', (id, fromOtherTab) => {
      if (id === projectId && fromOtherTab) this.reload();
    });
    holdLock(`3dg:dispatch:${projectId}`, (held) => {
      this.snap = { ...this.snap, runner: held };
      // Whatever the last holder had running died with it.
      if (held) this.update((d, now) => this.resume(d, now));
      else this.emit();
    });
  }

  get snapshot(): DaemonSnapshot {
    return this.snap;
  }

  setPrinters(printers: PrintPreset[]): void {
    this.snap = { ...this.snap, printers: new Map(printers.map((p) => [p.id, p])) };
    this.emit();
  }

  /** Probing runs while someone is watching; the queue runs regardless. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    if (this.timer === null) {
      void this.poll();
      this.timer = window.setInterval(() => void this.poll(), POLL_MS);
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.timer !== null) {
        window.clearInterval(this.timer);
        this.timer = null;
      }
    };
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  /** The queue as stored: another page may have written it since this one last looked. */
  private current(): Dispatch {
    if (this.unsaved) return this.snap.dispatch;
    const stored = readDispatch(this.snap.dispatch.projectId);
    if (stored && JSON.stringify(stored) !== JSON.stringify(this.snap.dispatch)) {
      this.snap = { ...this.snap, dispatch: stored };
    }
    return this.snap.dispatch;
  }

  private reload(): void {
    const before = this.snap.dispatch;
    if (this.current() === before) return;
    this.emit();
    this.pump();
  }

  private update(fn: (d: Dispatch, now: number) => Dispatch): void {
    const cur = this.current();
    const next = fn(cur, Date.now());
    if (next === cur) return;
    this.snap = { ...this.snap, dispatch: next };
    this.unsaved = !saveDispatch(next);
    this.emit();
    this.pump();
  }

  /** `resumeAfterReload`, sparing what this page itself still has running. */
  private resume(d: Dispatch, now: number): Dispatch {
    const resumed = resumeAfterReload(d, now);
    if (resumed === d || this.running.size === 0) return resumed;
    return { ...resumed, tasks: resumed.tasks.map((t, i) => (this.running.has(t.id) ? d.tasks[i] : t)) };
  }

  private printerName(id: string): string {
    return this.snap.printers.get(id)?.name ?? id;
  }

  // ── Operator actions ───────────────────────────────────

  send(jobs: DispatchJob[]): void {
    this.update((d, now) => sendPlan(d, jobs, now));
  }

  uploadAll(): void {
    this.update((d, now) => needsUpload(d).reduce((acc, job) => enqueue(acc, 'upload', job, newId(), now), d));
  }

  upload(job: DispatchJob): void {
    this.update((d, now) => enqueue(d, 'upload', job, newId(), now));
  }

  /** Start the printer's next job. The screen has already asked about the bed. */
  print(printerId: string): void {
    const job = nextJob(this.current(), printerId);
    if (job) this.update((d, now) => enqueue(d, 'start', job, newId(), now));
  }

  retry(taskId: string): void {
    this.update((d, now) => retryTask(d, taskId, now));
  }

  retryAllFailed(): void {
    this.update((d, now) => d.tasks.filter((t) => t.state === 'failed').reduce((acc, t) => retryTask(acc, t.id, now), d));
  }

  cancel(taskId: string): void {
    this.update((d, now) => cancelTask(d, taskId, now));
  }

  /** Take a job off its belt (`skipped`), or put a finished one back. */
  setOutcome(job: DispatchJob, outcome: JobOutcome | undefined): void {
    this.update((d, now) => {
      const next = setOutcome(d, job, outcome, now);
      return log(next, {
        at: now, level: 'info', printerId: job.printerId,
        text: outcome ? `${job.file}: marked ${outcome}.` : `${job.file}: back on the belt.`,
      });
    });
  }

  // ── Queue ──────────────────────────────────────────────

  private pump(): void {
    if (!this.snap.runner) return;
    for (const task of runnable(this.current())) {
      if (this.running.has(task.id)) continue;
      this.running.add(task.id);
      void this.run(task);
    }
  }

  private async run(task: DispatchTask): Promise<void> {
    const name = this.printerName(task.printerId);
    this.update((d, now) => patchTask(d, task.id, { state: 'running', attempts: task.attempts + 1 }, now));
    try {
      const printer = this.snap.printers.get(task.printerId);
      if (!printer?.address) throw new Error(`${name} has no Moonraker address`);
      if (task.kind === 'upload') await this.doUpload(task, printer.address);
      else await this.doStart(task, printer.address);
      // The operator's record of what went where; losing it mustn't fail the command.
      recordPrint({
        projectId: this.snap.dispatch.projectId, plateId: task.plateId, printerId: task.printerId,
        file: task.file, at: Date.now(), kind: task.kind, source: 'dispatch',
      }).catch(() => {});
      this.update((d, now) => log(patchTask(d, task.id, { state: 'done' }, now), {
        at: now, level: 'info', printerId: task.printerId,
        text: task.kind === 'upload' ? `Uploaded ${task.file}.` : `Started ${task.file}.`,
      }));
    } catch (err) {
      this.update((d, now) => log(patchTask(d, task.id, { state: 'failed', error: message(err) }, now), {
        at: now, level: 'error', printerId: task.printerId,
        text: `${task.kind === 'upload' ? 'Upload' : 'Start'} of ${task.file} failed: ${message(err)}`,
      }));
    } finally {
      this.running.delete(task.id);
      this.pump();
      void this.probe(task.printerId);
    }
  }

  /** Sends exactly the slice the plan was made with; anything else is a new plan. */
  private async doUpload(task: DispatchTask, address: string): Promise<void> {
    const [slice, plate] = await Promise.all([getSlicedGcode(task.plateId, task.printerId), getPlate(task.plateId)]);
    if (!plate) throw new Error('The plate has been deleted');
    if (!slice) throw new Error('No slice kept for this printer — slice it in the planner and send again');
    if (slice.slicedAt !== task.slicedAt) throw new Error('Re-sliced since the plan was sent — send again from the planner');
    if (slice.signature !== plateSignature(plate)) throw new Error('The plate changed since it was sliced — re-slice it in the planner');
    await uploadGcode(address, task.file, new TextEncoder().encode(slice.gcode));
  }

  /** Checks again right before starting: the screen's probe may be ten seconds old. */
  private async doStart(task: DispatchTask, address: string): Promise<void> {
    const klippy = await fetchKlippyState(address);
    if (klippy.state !== 'ready') throw new Error(`Klipper is ${klippy.state}${klippy.message ? `: ${klippy.message}` : ''}`);
    const status = await fetchPrintStatus(address);
    if (status.state === 'printing' || status.state === 'paused') throw new Error(`Still ${status.state} ${status.filename}`);
    if (!(await fileExists(address, task.file))) throw new Error(`${task.file} isn't on the printer — upload it first`);
    await startPrint(address, task.file);
  }

  // ── Probing ────────────────────────────────────────────

  private async poll(): Promise<void> {
    await Promise.all(printerIds(this.snap.dispatch).map((id) => this.probe(id)));
  }

  private setLive(printerId: string, live: PrinterLive): void {
    this.snap = { ...this.snap, live: { ...this.snap.live, [printerId]: live } };
    this.emit();
  }

  /** Readiness, camera, and how any started job on this printer ended. */
  async probe(printerId: string): Promise<void> {
    const address = this.snap.printers.get(printerId)?.address;
    if (!address) return;
    const checkedAt = Date.now();
    try {
      const klippy = await fetchKlippyState(address);
      if (!this.snap.cams[printerId]) {
        const cams = await listWebcams(address).catch(() => []);
        this.snap = { ...this.snap, cams: { ...this.snap.cams, [printerId]: cams } };
      }
      if (klippy.state !== 'ready') {
        this.setLive(printerId, { checkedAt, klippy });
        return;
      }
      const status = await fetchPrintStatus(address);
      const next = nextJob(this.snap.dispatch, printerId);
      const nextOnPrinter = next ? await fileExists(address, next.file).catch(() => undefined) : undefined;
      this.setLive(printerId, { checkedAt, klippy, status, nextOnPrinter });
      // One page records outcomes, so two can't log the same finish.
      if (this.snap.runner) await this.settle(printerId, address, status);
    } catch (err) {
      this.setLive(printerId, { checkedAt, error: message(err) });
    }
  }

  /** Record how started jobs ended. History is the record; without it, the live state. */
  private async settle(printerId: string, address: string, status: Awaited<ReturnType<typeof fetchPrintStatus>>): Promise<void> {
    const d = this.snap.dispatch;
    const started = belt(d, printerId)
      .map((job) => ({ job, start: latestTask(d, job, 'start') }))
      .filter((s): s is { job: DispatchJob; start: DispatchTask } => s.start?.state === 'done');
    if (started.length === 0) return;
    const since = Math.min(...started.map((s) => s.start.updatedAt));
    const history = await fetchJobHistory(address, since - 10 * 60_000).catch(() => null);
    for (const { job, start } of started) {
      const outcome = history ? outcomeFromHistory(job.file, start.updatedAt, history) : outcomeFromStatus(job.file, status);
      if (!outcome) continue;
      const key = jobKey(job);
      this.update((cur, now) => {
        const live = cur.jobs.find((j) => jobKey(j) === key);
        if (!live || live.outcome) return cur;
        return log(setOutcome(cur, live, outcome, now), {
          at: now, level: outcome === 'printed' ? 'info' : 'error', printerId,
          text: `${this.printerName(printerId)}: ${job.file} ${outcome === 'printed' ? 'finished' : `ended ${outcome}`}.`,
        });
      });
    }
  }
}

const daemons = new Map<string, Promise<DispatchDaemon>>();

/** The project's daemon, made on first use, with the printer presets as they are now. */
export async function getDaemon(projectId: string): Promise<DispatchDaemon> {
  let pending = daemons.get(projectId);
  if (!pending) {
    pending = listPresets('printer').then((printers) => {
      const daemon = new DispatchDaemon(projectId, printers);
      // An address edited in Settings, in this page or another, reaches the queue.
      onPresetsChange((kind) => {
        if (kind === 'printer') void listPresets('printer').then((p) => daemon.setPrinters(p));
      });
      return daemon;
    });
    daemons.set(projectId, pending);
    return pending;
  }
  const daemon = await pending;
  daemon.setPrinters(await listPresets('printer'));
  return daemon;
}
