// SPDX-License-Identifier: MIT
// The plan as the project view last drew it, kept per project so the screens
// that don't recompute it — the printers' stats and the operator's runbook —
// read the same plan the operator is looking at, and follow it as it changes.
// No Preact.

import type { ScheduleObjective } from '@3d-gallery/print-toolkit';

export interface PlanJob {
  plateId: string;
  plateName: string;
  printerId: string;
  /** The plate number: the order it starts in. */
  order: number;
  /** Moonraker file name (`gcodeName`). */
  file: string;
  start: number;
  end: number;
  /** Index into `visits`. */
  visit: number;
  /** Family the printer changes from at this job, when it changes. */
  swapFrom?: string;
  /** Material family (PETG, TPU…). */
  material: string;
  /** What the plate asks for, as written: "TPU 64D". */
  materialName: string;
  color?: string;
  grams?: number;
  /** Whether `grams`/the times are the slicer's own figures or CI estimates. */
  sliced: boolean;
}

export interface PlanVisit {
  /** When the operator arrives. */
  at: number;
  /** When the last job of the visit starts. */
  until: number;
  /** Plate ids started, in walk order. */
  starts: string[];
}

export interface PlanSnapshot {
  projectId: string;
  projectName: string;
  savedAt: number;
  objective: ScheduleObjective;
  changeoverMin: number;
  swapMin: number;
  printers: Array<{ id: string; name: string }>;
  jobs: PlanJob[];
  visits: PlanVisit[];
  /** When the last print ends, and when it can be collected. */
  finish: number;
  collect: number;
}

const PREFIX = '3dg:print:plan:';
const key = (projectId: string) => PREFIX + projectId;
const listeners = new Set<(projectId: string) => void>();

export function loadPlanSnapshot(projectId: string): PlanSnapshot | null {
  try {
    const raw = localStorage.getItem(key(projectId));
    return raw ? (JSON.parse(raw) as PlanSnapshot) : null;
  } catch { return null; }
}

/** The project whose plan was kept last, if any was. */
export function latestPlanProject(): string | null {
  let best: PlanSnapshot | null = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const name = localStorage.key(i);
      if (!name?.startsWith(PREFIX)) continue;
      const plan = loadPlanSnapshot(name.slice(PREFIX.length));
      if (plan && (!best || plan.savedAt > best.savedAt)) best = plan;
    }
  } catch { /* no storage, no plans */ }
  return best?.projectId ?? null;
}

/** Keep `snapshot` unless it says the same as the one kept (bar `savedAt`). */
export function savePlanSnapshot(snapshot: PlanSnapshot): void {
  const { savedAt: _, ...next } = snapshot;
  const kept = loadPlanSnapshot(snapshot.projectId);
  if (kept) {
    const { savedAt: __, ...prev } = kept;
    if (JSON.stringify(prev) === JSON.stringify(next)) return;
  }
  try {
    localStorage.setItem(key(snapshot.projectId), JSON.stringify(snapshot));
  } catch { /* private mode — the other screens go without */ }
  for (const fn of listeners) fn(snapshot.projectId);
}

/** Called with the project id whenever a plan is kept in this tab, or in another. */
export function onPlanSnapshot(fn: (projectId: string) => void): () => void {
  listeners.add(fn);
  const storage = (e: StorageEvent) => {
    if (e.key?.startsWith(PREFIX)) fn(e.key.slice(PREFIX.length));
  };
  window.addEventListener('storage', storage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', storage);
  };
}
