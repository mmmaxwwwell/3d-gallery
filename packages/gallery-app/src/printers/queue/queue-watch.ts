// SPDX-License-Identifier: MIT
// Which sent plans the Printers page follows, and everything each one's view
// needs beside its queue: the project's name, the plan snapshot, the
// operator's print records and the plates' pictures. Every plan with work
// left gets its dispatch daemon, so with this page open the queues run here.
// A plan that turns up later (sent from Project in another tab) joins on the
// store's change event.

import { dispatchProjectIds, getDaemon, loadDispatch, onDispatchChange, type DaemonSnapshot, type DispatchDaemon } from '../../print/dispatch-daemon.js';
import { getProject, onProjectChange } from '../../print/plate-store.js';
import { loadPlanSnapshot, onPlanSnapshot, type PlanSnapshot } from '../../print/plan-snapshot.js';
import { listPrints, onOperatorChange, type PrintRecord } from '../../print/operator-store.js';
import { refreshPrintReports } from '../../print/print-report.js';
import { loadPlannerSettings, onPlannerSettingsChange } from '../../print/fleet-plan.js';
import { isActive } from './queue-model.js';

export interface QueueEntry {
  projectId: string;
  /** The project's name; its id until the store answers, or if it's gone. */
  name: string;
  daemon: DispatchDaemon;
  snap: DaemonSnapshot;
  plan: PlanSnapshot | null;
  prints: PrintRecord[];
  thumbs: Record<string, string | null>;
}

type Watched = Omit<QueueEntry, 'snap'> & { unsubscribe: () => void };

export class QueueWatch {
  private readonly watched = new Map<string, Watched>();
  private readonly pending = new Set<string>();
  private readonly offs: (() => void)[] = [];
  private stopped = false;
  private loadedNow: Record<string, string> = loadPlannerSettings().loaded;

  constructor(private readonly focusId: string | null, private readonly onChange: () => void) {
    this.offs.push(
      onDispatchChange((id) => this.consider(id)),
      onPlanSnapshot((id) => this.patch(id, { plan: loadPlanSnapshot(id) })),
      onOperatorChange((id) => this.loadPrints(id)),
      onProjectChange((id) => this.loadName(id)),
      onPlannerSettingsChange(() => {
        this.loadedNow = loadPlannerSettings().loaded;
        this.onChange();
      }),
    );
    for (const id of dispatchProjectIds()) this.consider(id);
    if (focusId) this.consider(focusId);
  }

  /** Followed plans, oldest sent first. */
  entries(): QueueEntry[] {
    return [...this.watched.values()]
      .map(({ unsubscribe: _, ...w }) => ({ ...w, snap: w.daemon.snapshot }))
      .sort((a, b) => a.snap.dispatch.sentAt - b.snap.dispatch.sentAt);
  }

  /** Material the operator says is on each printer, by printer id. */
  get loaded(): Record<string, string> {
    return this.loadedNow;
  }

  stop(): void {
    this.stopped = true;
    for (const off of this.offs) off();
    for (const w of this.watched.values()) w.unsubscribe();
    this.watched.clear();
  }

  private consider(id: string): void {
    if (this.stopped || this.watched.has(id) || this.pending.has(id)) return;
    if (id !== this.focusId && !isActive(loadDispatch(id))) return;
    this.pending.add(id);
    void getDaemon(id).then((daemon) => {
      this.pending.delete(id);
      if (this.stopped) return;
      this.watched.set(id, {
        projectId: id,
        name: id,
        daemon,
        plan: loadPlanSnapshot(id),
        prints: [],
        thumbs: {},
        unsubscribe: daemon.subscribe(() => this.onChange()),
      });
      this.onChange();
      this.loadName(id);
      this.loadPrints(id);
      void refreshPrintReports(id).catch(() => {});
      void this.loadThumbs(id);
    });
  }

  private patch(id: string, patch: Partial<Watched>): void {
    const w = this.watched.get(id);
    if (!w || this.stopped) return;
    this.watched.set(id, { ...w, ...patch });
    this.onChange();
  }

  private loadName(id: string): void {
    if (!this.watched.has(id)) return;
    void getProject(id).then((p) => this.patch(id, { name: p?.name ?? id })).catch(() => {});
  }

  private loadPrints(id: string): void {
    if (!this.watched.has(id)) return;
    void listPrints(id).then((prints) => this.patch(id, { prints })).catch(() => {});
  }

  /** Drawing a plate needs Three.js and the model files, so it loads apart from the page. */
  private async loadThumbs(id: string): Promise<void> {
    try {
      const { plateThumbs } = await import('./thumbs.js');
      await plateThumbs(id, (plateId, thumb) => {
        const w = this.watched.get(id);
        if (w) this.patch(id, { thumbs: { ...w.thumbs, [plateId]: thumb } });
      });
    } catch {
      // No pictures: the queue reads fine without them.
    }
  }
}
