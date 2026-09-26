// SPDX-License-Identifier: MIT
// Plan a batch of print jobs across a printer fleet run by one operator.
//
// The operator is the constraint that makes this more than bin packing: a
// printer that finishes while everyone is asleep sits idle until morning, and
// every trip to the printers costs the operator. So the plan is a sequence of
// **visits**. At a visit the operator clears every finished bed and starts the
// next job on it; between visits the printers run on their own.
//
// The search is a decoder plus local search. `simulate` turns a job priority
// order and a "gather" allowance (how long the operator may wait for more
// printers to finish, to handle them in one trip) into a concrete plan;
// `planSchedule` searches over orders and allowances for the best one under
// the chosen objective. Fleets are a handful of printers and projects a few
// dozen plates, so thousands of simulations cost milliseconds.
//
// Pure: no DOM, no clock. Times are epoch milliseconds, durations seconds.

export interface ScheduleJob {
  id: string;
  label: string;
  /** Print time, seconds. */
  seconds: number;
  /** Material family (PLA, PETG, TPU…). A printer changing family costs a filament swap. */
  material: string;
  /** Printers this job may go to. Absent means any. */
  printers?: string[];
}

export interface SchedulePrinter {
  id: string;
  name: string;
  /** When the bed can next take a job — now, or when its current print ends. */
  freeAt: number;
  /** Family loaded now. Unknown means the first job's family costs no swap. */
  material?: string;
}

/** A span the operator cannot tend printers. Printers keep running through it. */
export interface OperatorBlock {
  start: number;
  end: number;
}

export type ScheduleObjective = 'makespan' | 'visits';

export interface ScheduleOptions {
  /** The operator is at the printers now. */
  now: number;
  objective: ScheduleObjective;
  /** Operator time per bed: pull the print, wipe, start the next. Seconds. */
  changeoverSec: number;
  /** Extra operator time when a printer changes material family. Seconds. */
  materialSwapSec: number;
  unavailable: OperatorBlock[];
  /**
   * Families printed as one batch after every other job has started (flexibles
   * like TPU): the swap to them is paid once, near the end, instead of tying a
   * printer up with them all day.
   */
  lastMaterials?: string[];
  /** How many printers may take the `lastMaterials` batch. Default 2. */
  lastMaterialPrinters?: number;
  /** Local-search budget. */
  iterations?: number;
  seed?: number;
}

export interface ScheduledJob {
  jobId: string;
  printerId: string;
  start: number;
  end: number;
  /** Index into `visits` of the visit that started it. */
  visit: number;
  /** Filament family the printer changes from, when it changes. */
  swapFrom?: string;
}

export interface Visit {
  /** When the operator arrives. */
  at: number;
  /** When the last job of the visit starts. */
  until: number;
  /** Jobs started at this visit, in the order the operator gets to them. */
  starts: ScheduledJob[];
}

export interface Schedule {
  jobs: ScheduledJob[];
  visits: Visit[];
  /** When the last print ends. */
  finish: number;
  /** When the operator can collect the last print: `finish`, or the end of the block it lands in. */
  collect: number;
  /** Jobs no enabled printer may take. */
  unassigned: string[];
  /** The gather allowance the winning plan used, seconds. */
  gatherSec: number;
}

const MIN = 60;
const HOUR = 3600;
/** Gather allowances tried. Infinity is "wait for every running printer". */
const GATHERS = [0, 15 * MIN, 30 * MIN, HOUR, 2 * HOUR, 4 * HOUR, 8 * HOUR, Infinity];

/** Push `t` out of any block it falls in. Blocks may overlap or abut. */
export function nextAvailable(t: number, blocks: OperatorBlock[]): number {
  let moved = true;
  while (moved) {
    moved = false;
    for (const b of blocks) {
      if (t >= b.start && t < b.end) {
        t = b.end;
        moved = true;
      }
    }
  }
  return t;
}

/**
 * Daily off-hours as blocks, from `from` for `days` days. Clock strings are
 * "HH:MM" local time; a bedtime after the wake time crosses midnight.
 */
export function dailyBlocks(bedtime: string, wake: string, from: number, days: number): OperatorBlock[] {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  if ([bh, bm, wh, wm].some((n) => !Number.isFinite(n))) return [];
  const crosses = bh * 60 + bm >= wh * 60 + wm;
  const out: OperatorBlock[] = [];
  const day0 = new Date(from);
  day0.setHours(0, 0, 0, 0);
  // Start a day early: last night's block may still be running at `from`.
  for (let d = -1; d < days; d++) {
    const start = new Date(day0);
    start.setDate(day0.getDate() + d);
    start.setHours(bh, bm, 0, 0);
    const end = new Date(day0);
    end.setDate(day0.getDate() + d + (crosses ? 1 : 0));
    end.setHours(wh, wm, 0, 0);
    if (end.getTime() > from) out.push({ start: start.getTime(), end: end.getTime() });
  }
  return out;
}

interface PrinterState {
  id: string;
  freeAt: number;
  material?: string;
}

function eligible(job: ScheduleJob, printerId: string): boolean {
  return !job.printers || job.printers.includes(printerId);
}

/**
 * Turn a priority order into a plan. At each visit the operator walks the
 * idle printers; each takes the highest-priority job it may print, preferring
 * one in the material it already has loaded. `lastMaterials` jobs wait until
 * every other job has started, and go to at most `lastMaterialPrinters`
 * printers. The next visit is when the first
 * busy printer with work left finishes — or, with a gather allowance, the last
 * one finishing within that allowance of it — pushed out of any block.
 */
export function simulate(
  order: ScheduleJob[],
  printers: SchedulePrinter[],
  opts: Pick<ScheduleOptions, 'now' | 'changeoverSec' | 'materialSwapSec' | 'unavailable' | 'lastMaterials' | 'lastMaterialPrinters'>,
  gatherSec: number,
): Schedule {
  const last = new Set(opts.lastMaterials ?? []);
  const lastLimit = opts.lastMaterialPrinters ?? 2;
  const lastPrinters = new Set<string>();
  const state: PrinterState[] = printers.map((p) => ({ id: p.id, freeAt: p.freeAt, material: p.material }));
  const unassigned = order.filter((j) => !printers.some((p) => eligible(j, p.id))).map((j) => j.id);
  let remaining = order.filter((j) => !unassigned.includes(j.id));
  const jobs: ScheduledJob[] = [];
  const visits: Visit[] = [];
  let t = opts.now;

  const couldTake = (j: ScheduleJob, printerId: string): boolean => {
    if (!eligible(j, printerId)) return false;
    if (!last.has(j.material)) return true;
    // A batch printer the job doesn't fit doesn't count against the limit.
    return lastPrinters.has(printerId)
      || [...lastPrinters].filter((id) => eligible(j, id)).length < lastLimit;
  };
  const mayTake = (j: ScheduleJob, printerId: string): boolean =>
    couldTake(j, printerId) && (!last.has(j.material) || remaining.every((r) => last.has(r.material)));

  while (remaining.length > 0) {
    let clock = t;
    const starts: ScheduledJob[] = [];
    // Starting the last ordinary job opens the batch mid-walk, so walk again
    // until nobody idle takes anything.
    for (let took = true; took;) {
      took = false;
      for (const p of state) {
        if (p.freeAt > t) continue;
        const candidates = remaining.filter((j) => mayTake(j, p.id));
        if (candidates.length === 0) continue;
        const job = candidates.find((j) => !p.material || j.material === p.material) ?? candidates[0];
        const swap = p.material !== undefined && p.material !== job.material;
        clock += (opts.changeoverSec + (swap ? opts.materialSwapSec : 0)) * 1000;
        const scheduled: ScheduledJob = {
          jobId: job.id,
          printerId: p.id,
          start: clock,
          end: clock + job.seconds * 1000,
          visit: visits.length,
          ...(swap ? { swapFrom: p.material } : {}),
        };
        starts.push(scheduled);
        jobs.push(scheduled);
        p.freeAt = scheduled.end;
        p.material = job.material;
        if (last.has(job.material)) lastPrinters.add(p.id);
        remaining = remaining.filter((j) => j !== job);
        took = true;
      }
    }
    if (starts.length > 0) visits.push({ at: t, until: clock, starts });
    if (remaining.length === 0) break;

    // Only a busy printer that can take one of the remaining jobs is worth
    // coming back for; one idle now took nothing and will be looked at again.
    const waits = state
      .filter((p) => p.freeAt > t && remaining.some((j) => couldTake(j, p.id)))
      .map((p) => Math.max(p.freeAt, clock));
    const first = Math.min(...waits);
    const gathered = Math.max(...waits.filter((w) => w <= first + gatherSec * 1000));
    t = nextAvailable(gathered, opts.unavailable);
  }

  const finish = jobs.reduce((m, j) => Math.max(m, j.end), opts.now);
  return {
    jobs,
    visits,
    finish,
    collect: nextAvailable(finish, opts.unavailable),
    unassigned,
    gatherSec,
  };
}

/** Lower is better, compared element by element. */
function score(s: Schedule, objective: ScheduleObjective): number[] {
  return objective === 'makespan'
    ? [s.finish, s.visits.length, s.collect]
    : [s.visits.length, s.collect, s.finish];
}

function better(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}

/** mulberry32 — seeded so the same inputs always give the same plan. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The best plan found for the objective: `makespan` finishes the whole batch
 * soonest, `visits` makes the fewest trips to the printers (then finishes
 * soonest among those).
 */
export function planSchedule(
  jobs: ScheduleJob[],
  printers: SchedulePrinter[],
  options: ScheduleOptions,
): Schedule {
  const random = rng(options.seed ?? 1);
  const longestFirst = [...jobs].sort((a, b) => b.seconds - a.seconds);
  const byMaterial = [...longestFirst].sort((a, b) => a.material.localeCompare(b.material));
  const seeds = [longestFirst, byMaterial, [...longestFirst].reverse(), jobs];

  let best: { order: ScheduleJob[]; gather: number; plan: Schedule; score: number[] } | null = null;
  const consider = (order: ScheduleJob[], gather: number) => {
    const plan = simulate(order, printers, options, gather);
    const s = score(plan, options.objective);
    if (!best || better(s, best.score)) best = { order, gather, plan, score: s };
    return s;
  };

  for (const order of seeds) for (const gather of GATHERS) consider(order, gather);
  if (jobs.length < 2) return best!.plan;

  // Hill-climb from the best seed: move one job elsewhere in the order, or
  // try another gather allowance; keep anything no worse, so plateaus are walked.
  let { order, gather } = best!;
  let current = best!.score;
  const iterations = options.iterations ?? 3000;
  for (let i = 0; i < iterations; i++) {
    let nextOrder = order;
    let nextGather = gather;
    if (random() < 0.15) {
      nextGather = GATHERS[Math.floor(random() * GATHERS.length)];
    } else {
      nextOrder = [...order];
      const [job] = nextOrder.splice(Math.floor(random() * nextOrder.length), 1);
      nextOrder.splice(Math.floor(random() * (nextOrder.length + 1)), 0, job);
    }
    const s = consider(nextOrder, nextGather);
    if (!better(current, s)) {
      order = nextOrder;
      gather = nextGather;
      current = s;
    }
  }
  return best!.plan;
}
