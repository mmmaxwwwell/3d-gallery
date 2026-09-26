// SPDX-License-Identifier: MIT
// Runs a project's dispatch: works through its queue of uploads and starts,
// and keeps probing its printers. One per project, living at module scope so
// uploads carry on when the screen is closed. The queue and log persist in
// localStorage, so a reload picks up where it left off.

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
import { listPresets, type PrintPreset } from './print-storage.js';
import { getPlate, getSlicedGcode, newId, plateSignature } from './plate-store.js';
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

function storageKey(projectId: string): string {
  return `3dg:print:dispatch:${projectId}`;
}

export function loadDispatch(projectId: string): Dispatch {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (raw) return { ...emptyDispatch(projectId), ...(JSON.parse(raw) as Dispatch) };
  } catch {
    // Unreadable or blocked storage: start empty rather than refuse to open.
  }
  return emptyDispatch(projectId);
}

function saveDispatch(d: Dispatch): void {
  try {
    localStorage.setItem(storageKey(d.projectId), JSON.stringify(d));
  } catch {
    // A full or blocked store loses persistence, not the running queue.
  }
}

export function hasDispatch(projectId: string): boolean {
  return loadDispatch(projectId).jobs.length > 0;
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export interface DaemonSnapshot {
  dispatch: Dispatch;
  live: Record<string, PrinterLive>;
  cams: Record<string, Webcam[]>;
  printers: Map<string, PrintPreset>;
}

export class DispatchDaemon {
  private snap: DaemonSnapshot;
  private readonly listeners = new Set<() => void>();
  private readonly running = new Set<string>();
  private timer: number | null = null;

  constructor(projectId: string, printers: PrintPreset[]) {
    const now = Date.now();
    this.snap = {
      dispatch: resumeAfterReload(loadDispatch(projectId), now),
      live: {},
      cams: {},
      printers: new Map(printers.map((p) => [p.id, p])),
    };
    saveDispatch(this.snap.dispatch);
    this.pump();
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

  private update(fn: (d: Dispatch, now: number) => Dispatch): void {
    const next = fn(this.snap.dispatch, Date.now());
    if (next === this.snap.dispatch) return;
    this.snap = { ...this.snap, dispatch: next };
    saveDispatch(next);
    this.emit();
    this.pump();
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
    const job = nextJob(this.snap.dispatch, printerId);
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
    for (const task of runnable(this.snap.dispatch)) {
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
      await this.settle(printerId, address, status);
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
    pending = listPresets('printer').then((printers) => new DispatchDaemon(projectId, printers));
    daemons.set(projectId, pending);
    return pending;
  }
  const daemon = await pending;
  daemon.setPrinters(await listPresets('printer'));
  return daemon;
}
