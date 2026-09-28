// SPDX-License-Identifier: MIT
// What the plan asks of each printer, and of the operator at it: filament by
// spool, hours, stops, touches and swaps — with what the sent jobs say is
// already printed. No Preact; the printers screen draws it.

import type { DispatchJob } from './dispatch-model.js';
import type { PlanJob, PlanSnapshot } from './plan-snapshot.js';

export interface SpoolUse {
  /** "PETG · black", or just "TPU 64D" when the plate names no colour. */
  label: string;
  grams: number;
  /** Some of it is a CI estimate, or a plate on it has no weight at all. */
  approx: boolean;
}

export interface PrinterStats {
  jobs: number;
  printed: number;
  /** Print time, hours. */
  hours: number;
  hoursPrinted: number;
  spools: SpoolUse[];
  /** Trips the operator makes to this printer: each visit that starts a job, plus collecting the last print. */
  stops: number;
  /** Beds cleared: every print comes off once. */
  clears: number;
  starts: number;
  /** clears + starts. */
  touches: number;
  /** Spool changes: a job whose material or colour differs from the one before it on this printer. */
  swaps: number;
}

export function spoolLabel(job: Pick<PlanJob, 'materialName' | 'color'>): string {
  return job.color ? `${job.materialName} · ${job.color}` : job.materialName;
}

function spools(jobs: PlanJob[]): SpoolUse[] {
  const out = new Map<string, SpoolUse>();
  for (const job of jobs) {
    const label = spoolLabel(job);
    const use = out.get(label) ?? { label, grams: 0, approx: false };
    use.grams += job.grams ?? 0;
    use.approx ||= !job.sliced || job.grams === undefined;
    out.set(label, use);
  }
  return [...out.values()].sort((a, b) => b.grams - a.grams);
}

/** The jobs the dispatch has recorded as printed, keyed `plateId|printerId`. */
function printedKeys(sent: DispatchJob[]): Set<string> {
  return new Set(sent.filter((j) => j.outcome?.state === 'printed').map((j) => `${j.plateId}|${j.printerId}`));
}

function statsOf(jobs: PlanJob[], printed: Set<string>): PrinterStats {
  const ordered = [...jobs].sort((a, b) => a.start - b.start);
  const done = ordered.filter((j) => printed.has(`${j.plateId}|${j.printerId}`));
  const hours = (list: PlanJob[]) => list.reduce((t, j) => t + (j.end - j.start), 0) / 3_600_000;
  let swaps = 0;
  ordered.forEach((job, i) => {
    const prev = ordered[i - 1];
    if (prev ? spoolLabel(prev) !== spoolLabel(job) : job.swapFrom !== undefined) swaps++;
  });
  const visits = new Set(ordered.map((j) => j.visit)).size;
  return {
    jobs: ordered.length,
    printed: done.length,
    hours: hours(ordered),
    hoursPrinted: hours(done),
    spools: spools(ordered),
    stops: visits + (ordered.length > 0 ? 1 : 0),
    clears: ordered.length,
    starts: ordered.length,
    touches: ordered.length * 2,
    swaps,
  };
}

/** printerId → its share of the plan. Printers the plan gives nothing still get an (empty) entry. */
export function printerStats(snapshot: PlanSnapshot, sent: DispatchJob[]): Map<string, PrinterStats> {
  const printed = printedKeys(sent);
  const ids = new Set([...snapshot.printers.map((p) => p.id), ...snapshot.jobs.map((j) => j.printerId)]);
  return new Map([...ids].map((id) => [id, statsOf(snapshot.jobs.filter((j) => j.printerId === id), printed)]));
}

/** The whole fleet. Stops are the plan's trips — the operator walks every printer at once — counted as the planner counts them. */
export function fleetStats(snapshot: PlanSnapshot, sent: DispatchJob[]): PrinterStats {
  const all = statsOf(snapshot.jobs, printedKeys(sent));
  const perPrinter = [...printerStats(snapshot, sent).values()];
  return {
    ...all,
    stops: snapshot.visits.length,
    swaps: perPrinter.reduce((t, s) => t + s.swaps, 0),
  };
}
