// SPDX-License-Identifier: MIT
// The operator's runbook, worked out from the plan: each trip to the printers
// is a session, each printer touched on it a stop, and each stop a short list
// of steps. No Preact, no storage — the runbook screen draws it and a test
// drives it.
//
// Sessions and stops are keyed by what they start, not by their position in
// the plan, so a re-plan that shuffles trips keeps the operator's notes on
// the stop they were written for.

import type { PlanJob, PlanSnapshot } from './plan-snapshot.js';

export type StepId = 'log' | 'clear' | 'bed' | 'filament' | 'start' | 'firstLayer';

export type ToolId = 'scraper' | 'gloves' | 'glasses' | 'cutter' | 'bins' | 'spareBed' | 'phone' | 'spools';

export const TOOL_TEXT: Record<Exclude<ToolId, 'spools'>, string> = {
  scraper: 'Scraper',
  gloves: 'Gloves',
  glasses: 'Safety glasses',
  cutter: 'Filament cutter',
  bins: 'Parts bins + labels',
  spareBed: 'Spare beds',
  phone: 'Phone, for photos',
};

/** How the last print can have gone. `ok` rules the rest out. */
export const OUTCOMES = [
  ['ok', 'Printed OK'],
  ['stringing', 'Stringing'],
  ['layer-shift', 'Layer shift'],
  ['adhesion', 'Came off the bed'],
  ['warping', 'Warping'],
  ['spaghetti', 'Spaghetti'],
  ['under-extrusion', 'Under-extrusion'],
  ['jam', 'Filament jam'],
  ['power', 'Power failure'],
  ['unknown', 'Unknown'],
] as const;

export type OutcomeFlag = (typeof OUTCOMES)[number][0];

export interface FilamentSwap {
  from: string;
  to: string;
}

export interface Stop {
  /** `projectId|plateId started|printerId`. */
  key: string;
  /** 1-based within its session. */
  index: number;
  printerId: string;
  printerName: string;
  /** The print this stop starts. */
  job: PlanJob;
  /** The print the plan has on this printer just before, whose parts come off. */
  previous?: PlanJob;
  swap?: FilamentSwap;
  /** Operator minutes the plan allows. */
  estMin: number;
}

export interface SessionFilament {
  /** "PETG · black". */
  label: string;
  grams: number;
  prints: number;
  /** Any of the grams a CI estimate rather than a slice. */
  approx: boolean;
}

export interface Session {
  /** The plate id of the first print it starts. */
  key: string;
  /** 1-based, in plan order. */
  index: number;
  at: number;
  stops: Stop[];
  estMin: number;
  filaments: SessionFilament[];
  changes: number;
  tools: ToolId[];
}

/** "PETG · black" — what goes on the spool holder. */
export function filamentLabel(job: Pick<PlanJob, 'materialName' | 'color'>): string {
  return job.color ? `${job.materialName} · ${job.color}` : job.materialName;
}

export function stopKey(projectId: string, job: Pick<PlanJob, 'plateId' | 'printerId'>): string {
  return `${projectId}|${job.plateId}|${job.printerId}`;
}

/** A change when the printer's previous print wanted another filament, or the plan says it swaps. */
export function filamentSwap(job: PlanJob, previous: PlanJob | undefined): FilamentSwap | undefined {
  if (previous && filamentLabel(previous) !== filamentLabel(job)) {
    return { from: filamentLabel(previous), to: filamentLabel(job) };
  }
  if (job.swapFrom) return { from: job.swapFrom, to: filamentLabel(job) };
  return undefined;
}

/** Every trip in the plan, as the operator works it. */
export function sessions(plan: PlanSnapshot): Session[] {
  const byPlate = new Map(plan.jobs.map((j) => [j.plateId, j]));
  const names = new Map(plan.printers.map((p) => [p.id, p.name]));
  const previousOf = new Map<string, PlanJob>();
  const byPrinter = new Map<string, PlanJob[]>();
  for (const job of plan.jobs) byPrinter.set(job.printerId, [...(byPrinter.get(job.printerId) ?? []), job]);
  for (const jobs of byPrinter.values()) {
    jobs.sort((a, b) => a.start - b.start);
    for (let i = 1; i < jobs.length; i++) previousOf.set(jobs[i].plateId, jobs[i - 1]);
  }

  return plan.visits
    .filter((v) => v.starts.some((id) => byPlate.has(id)))
    .map((visit, i) => {
      const stops = visit.starts.flatMap((plateId, s) => {
        const job = byPlate.get(plateId);
        if (!job) return [];
        const previous = previousOf.get(plateId);
        const swap = filamentSwap(job, previous);
        return [{
          key: stopKey(plan.projectId, job),
          index: s + 1,
          printerId: job.printerId,
          printerName: names.get(job.printerId) ?? 'Printer',
          job,
          ...(previous ? { previous } : {}),
          ...(swap ? { swap } : {}),
          estMin: plan.changeoverMin + (swap ? plan.swapMin : 0),
        } satisfies Stop];
      }).map((stop, s) => ({ ...stop, index: s + 1 }));

      const filaments = new Map<string, SessionFilament>();
      for (const { job } of stops) {
        const label = filamentLabel(job);
        const f = filaments.get(label) ?? { label, grams: 0, prints: 0, approx: false };
        filaments.set(label, {
          label,
          grams: f.grams + (job.grams ?? 0),
          prints: f.prints + 1,
          approx: f.approx || !job.sliced || job.grams === undefined,
        });
      }

      return {
        key: stops[0].job.plateId,
        index: i + 1,
        at: visit.at,
        stops,
        estMin: stops.reduce((t, s) => t + s.estMin, 0),
        filaments: [...filaments.values()],
        changes: stops.filter((s) => s.swap).length,
        tools: sessionTools(stops),
      };
    });
}

/** What a stop needs to hand. `hadPrint`: something is known to be on the bed. */
export function stopTools(stop: Stop, hadPrint = false): ToolId[] {
  const clears = !!stop.previous || hadPrint;
  const out: ToolId[] = [];
  if (clears) out.push('scraper', 'gloves', 'spareBed', 'bins', 'phone');
  if (stop.swap) out.push('cutter', 'glasses');
  out.push('spools');
  return out;
}

const TOOL_ORDER: ToolId[] = ['scraper', 'gloves', 'glasses', 'cutter', 'spareBed', 'bins', 'phone', 'spools'];

export function sessionTools(stops: Stop[], hadPrint: (printerId: string) => boolean = () => false): ToolId[] {
  const need = new Set(stops.flatMap((s) => stopTools(s, hadPrint(s.printerId))));
  return TOOL_ORDER.filter((t) => need.has(t));
}

/** A stop's steps, in the order they're done. There's no last print to log on a bed nothing is known to have printed on. */
export function stopSteps(stop: Stop, hadPrint = false): StepId[] {
  const clears = !!stop.previous || hadPrint;
  return [
    ...(clears ? ['log', 'clear'] as const : []),
    'bed', 'filament', 'start', 'firstLayer',
  ];
}

/** What the stop is, in a few words: "Clear bed · swap to TPU · start #05". */
export function stopHeadline(stop: Stop, hadPrint = false): string {
  const parts: string[] = [];
  if (stop.previous || hadPrint) parts.push('clear bed');
  if (stop.swap) parts.push(`swap to ${stop.swap.to}`);
  parts.push(`start #${String(stop.job.order).padStart(2, '0')}`);
  const text = parts.join(' · ');
  return text[0].toUpperCase() + text.slice(1);
}

export interface SessionProgress {
  startedAt?: number;
  endedAt?: number;
}

export type SessionState = 'done' | 'active' | 'due' | 'next' | 'later';

/**
 * Where a session stands: done once ended, active once started, due once its
 * time has come, `next` for the first one still ahead, `later` for the rest.
 */
export function sessionStates(
  list: Session[],
  progress: (key: string) => SessionProgress | undefined,
  now: number,
): SessionState[] {
  let sawNext = false;
  return list.map((s) => {
    const p = progress(s.key);
    if (p?.endedAt) return 'done';
    if (p?.startedAt) return 'active';
    if (s.at <= now) return 'due';
    if (!sawNext) { sawNext = true; return 'next'; }
    return 'later';
  });
}

/** The session the countdown counts to: the first not yet done. */
export function upcoming(
  list: Session[],
  progress: (key: string) => SessionProgress | undefined,
): Session | undefined {
  return list.find((s) => !progress(s.key)?.endedAt);
}

/** "1:05:09", "4:09", "0:00" — the countdown. Negative is overdue, shown as its magnitude. */
export function countdown(ms: number): string {
  const total = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

/** "12m", "1h 04m" — an elapsed or estimated operator time. */
export function minutes(ms: number): string {
  const total = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h === 0 ? `${m}m` : `${h}h ${String(m).padStart(2, '0')}m`;
}
