// SPDX-License-Identifier: MIT
// The project planner's arithmetic: how long and how heavy each plate is,
// whether a slice is still good, and whether a plan can be sent. No Preact —
// the planner screen reads it, and so can a test.

import { materialFamily } from '@3d-gallery/model-core';
import type { Schedule, ScheduleJob } from '@3d-gallery/print-toolkit';
import { flattenPresetForSlicer } from './preset-flatten.js';
import { plateSignature, type Plate, type SlicedGcode } from './plate-store.js';
import type { SliceSetup } from './plate-slice.js';

// ── CI estimates ─────────────────────────────────────────

/** The slice of `print-estimates.json` the planner reads. */
export interface Estimates {
  settings: {
    rates: { mmPerS: number; label?: string }[];
    defaultMaterial: string;
    /** Grams in an estimate are quoted in this filament's density. */
    filament?: { density: number };
    densities?: Record<string, number>;
  };
  estimates: Record<string, { seconds: Record<string, number>; grams: number }>;
}

export async function loadEstimates(): Promise<Estimates | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}models/print-estimates.json`);
    return res.ok ? ((await res.json()) as Estimates) : null;
  } catch {
    return null;
  }
}

// ── Plates ───────────────────────────────────────────────

export function plateMaterial(plate: Plate): string {
  return materialFamily(plate.material ?? 'PETG');
}

/** What goes on the spool holder: "TPU 64D · black". */
export function plateFilament(plate: Plate): string {
  const material = plate.material ?? 'PETG';
  return plate.color ? `${material} · ${plate.color}` : material;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m}m` : `${h}h ${String(m).padStart(2, '0')}m`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'plate';
}

/** Moonraker file name: the plate's number first, so a printer's file list
 *  reads in print order and matches the number the planner shows. */
export function gcodeName(number: number, plate: Plate): string {
  return `${String(number).padStart(2, '0')}-${slugify(plate.name)}.gcode`;
}

// ── Slices ───────────────────────────────────────────────

/** FNV-1a, for telling setups apart — not for anything adversarial. */
function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Everything besides the plate that a slice depends on. A slice made under a
 * different key is stale — an edited printer preset, another layer height or
 * a changed filament all change the G-code.
 */
export function sliceSetupKey(setup: SliceSetup): string {
  return fnv1a(JSON.stringify([
    setup.printer.id,
    flattenPresetForSlicer(setup.printer),
    setup.filament.id,
    flattenPresetForSlicer(setup.filament),
    setup.proc,
    setup.layerHeight,
    setup.bedSurface,
    setup.preheat,
    setup.centerOnBed,
    setup.clearExclusionZones,
  ]));
}

/**
 * The kept slices of `plate` that still match it: same arrangement, and the
 * setup its printer would get today. `setupKey` is null for a printer the
 * plate can't be sliced for (no filament preset), whose slices are all stale.
 */
export function freshSlices(
  plate: Plate,
  slices: SlicedGcode[] | undefined,
  setupKey: (printerId: string) => string | null,
): SlicedGcode[] {
  const signature = plateSignature(plate);
  return (slices ?? []).filter((s) => s.signature === signature && s.setup !== undefined && s.setup === setupKey(s.printerId));
}

export type Measured = { value: number; source: 'sliced' | 'estimate' };

function estimateRate(est: Estimates, family: string) {
  const rates = est.settings.rates;
  return rates.find((r) => r.label === family)
    ?? rates.find((r) => r.label === materialFamily(est.settings.defaultMaterial));
}

/**
 * How long a plate takes, in seconds: the slicer's own figure for a fresh
 * slice, else the CI estimate at the plate's material rate, summed over its items.
 */
export function plateSeconds(plate: Plate, fresh: SlicedGcode[], est: Estimates | null): Measured | null {
  const sliced = fresh.find((s) => s.seconds);
  if (sliced?.seconds) return { value: sliced.seconds, source: 'sliced' };
  if (!est) return null;
  const rate = estimateRate(est, plateMaterial(plate));
  if (!rate) return null;
  let seconds = 0;
  for (const item of plate.items) {
    const s = est.estimates[item.key]?.seconds[rate.mmPerS];
    if (!s) return null;
    seconds += s * item.qty;
  }
  return seconds > 0 ? { value: seconds, source: 'estimate' } : null;
}

/** Grams of filament, sourced like `plateSeconds`. CI weighs everything in
 *  one filament, so its grams are rescaled to the plate's material density. */
export function plateGrams(plate: Plate, fresh: SlicedGcode[], est: Estimates | null): Measured | null {
  const sliced = fresh.find((s) => s.grams);
  if (sliced?.grams) return { value: sliced.grams, source: 'sliced' };
  if (!est) return null;
  const family = plateMaterial(plate);
  const base = est.settings.filament?.density;
  const density = est.settings.densities?.[family];
  const scale = base && density ? density / base : 1;
  let grams = 0;
  for (const item of plate.items) {
    const g = est.estimates[item.key]?.grams;
    if (g === undefined) return null;
    grams += g * item.qty * scale;
  }
  return { value: grams, source: 'estimate' };
}

// ── Plans ────────────────────────────────────────────────

/** The scheduler's jobs: every plate with a time, on the printers it fits. */
export function scheduleJobs(
  plates: Plate[],
  times: Record<string, Measured | null>,
  fits: Record<string, string[]>,
): ScheduleJob[] {
  return plates
    .filter((p) => times[p.id])
    .map((p) => ({
      id: p.id,
      label: p.name,
      seconds: times[p.id]!.value,
      material: plateMaterial(p),
      printers: fits[p.id],
    }));
}

/** Plate numbers, 0 up, in the order the plan starts them. */
export function plateNumbers(plan: Schedule | null): Map<string, number> {
  const ordered = [...(plan?.jobs ?? [])].sort((a, b) => a.start - b.start || a.printerId.localeCompare(b.printerId));
  return new Map(ordered.map((j, i) => [j.jobId, i]));
}

/** Jobs that overlap another on the same printer. The scheduler should never
 *  make one; this is the check that it didn't before anything is sent. */
export function collisions(plan: Schedule | null): Set<string> {
  const out = new Set<string>();
  const byPrinter = new Map<string, Schedule['jobs']>();
  for (const job of plan?.jobs ?? []) byPrinter.set(job.printerId, [...(byPrinter.get(job.printerId) ?? []), job]);
  for (const jobs of byPrinter.values()) {
    const sorted = [...jobs].sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].end) {
        out.add(sorted[i].jobId);
        out.add(sorted[i - 1].jobId);
      }
    }
  }
  return out;
}

export interface Readiness {
  printers: boolean;
  scheduled: boolean;
  sliced: boolean;
  clear: boolean;
}

/**
 * What stands between the plan and the printers. Every plate must be on the
 * chart, sliced for the printer the chart gives it, with no two jobs on one
 * printer at once.
 */
export function readiness(
  plates: Plate[],
  plan: Schedule | null,
  enabledPrinters: number,
  hasFreshSlice: (plateId: string, printerId: string) => boolean,
): Readiness {
  const jobs = new Map((plan?.jobs ?? []).map((j) => [j.jobId, j]));
  return {
    printers: enabledPrinters > 0,
    scheduled: plates.length > 0 && plates.every((p) => jobs.has(p.id)),
    sliced: plates.length > 0 && plates.every((p) => {
      const job = jobs.get(p.id);
      return !!job && hasFreshSlice(p.id, job.printerId);
    }),
    clear: collisions(plan).size === 0,
  };
}

export function isReady(r: Readiness): boolean {
  return r.printers && r.scheduled && r.sliced && r.clear;
}
