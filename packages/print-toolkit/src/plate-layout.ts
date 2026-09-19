// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Authored plate layout.
 *
 * A plate is arranged once, by hand, in *plate space* — an origin-centred
 * coordinate system with no printer in it. What that arrangement occupies is
 * the plate's size, and the plate's size is what decides which printers can
 * be sent the job: a 240 mm wide plate cannot go to a 220 mm bed no matter how
 * it is shuffled, because shuffling it is not on offer. The layout is the
 * user's, not the packer's.
 *
 * Placing the plate on a given bed is therefore a rigid-body move: translate
 * the whole arrangement, never the parts within it. `placePlateOnBed` finds
 * that translation, preferring dead centre and sliding off it only to clear a
 * keepout.
 *
 * Pure — no DOM, no fetch.
 */

import type { PrinterBed, FitStatus } from './plate-fit.js';
import type { Rect2 } from './plate-slicer.js';

/** Tolerance for "touches the edge" comparisons, mm. */
const GEOM_EPSILON = 1e-6;

/** Offset search step when centring is blocked by a keepout, mm. */
const SEARCH_STEP = 2;

/**
 * One object as it sits on the plate. Half-extents are the *final* footprint —
 * the caller has already applied rotation and scale, because only the caller
 * can measure the real rotated hull.
 */
export interface PlateFootprint {
  id: string;
  name: string;
  /** Footprint centre in plate space, mm. */
  x: number;
  y: number;
  /** Half-extents of the axis-aligned footprint, mm. */
  halfW: number;
  halfD: number;
  /** Height above the bed, mm. */
  height: number;
  /** Distinct filament colours this object needs. Absent = single colour. */
  colorCount?: number;
}

export interface PlateBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** Overall extents of the arrangement, mm. This is "the size of the plate". */
  width: number;
  depth: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface PlatePlacement {
  dx: number;
  dy: number;
}

export interface PlateLayoutOptions {
  /** Margin kept clear inside the bed edge, mm. Default 0 — an authored
   *  layout is taken at its word. */
  edgeSpacing?: number;
  /** Margin kept clear around keepouts, mm. Default 0. */
  keepoutSpacing?: number;
}

/** The union of every footprint, plus the tallest object. */
export function plateBounds(items: PlateFootprint[]): PlateBounds | null {
  if (items.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, height = 0;
  for (const item of items) {
    if (item.x - item.halfW < minX) minX = item.x - item.halfW;
    if (item.x + item.halfW > maxX) maxX = item.x + item.halfW;
    if (item.y - item.halfD < minY) minY = item.y - item.halfD;
    if (item.y + item.halfD > maxY) maxY = item.y + item.halfD;
    if (item.height > height) height = item.height;
  }
  return {
    minX, minY, maxX, maxY,
    width: maxX - minX,
    depth: maxY - minY,
    height,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function inflate(rect: Rect2, by: number): Rect2 {
  return {
    minX: rect.minX - by, minY: rect.minY - by,
    maxX: rect.maxX + by, maxY: rect.maxY + by,
  };
}

function hitsKeepout(item: PlateFootprint, dx: number, dy: number, keepouts: Rect2[]): boolean {
  const minX = item.x - item.halfW + dx;
  const maxX = item.x + item.halfW + dx;
  const minY = item.y - item.halfD + dy;
  const maxY = item.y + item.halfD + dy;
  return keepouts.some((k) =>
    minX < k.maxX - GEOM_EPSILON && maxX > k.minX + GEOM_EPSILON
    && minY < k.maxY - GEOM_EPSILON && maxY > k.minY + GEOM_EPSILON);
}

/**
 * The rigid translation that lands the authored plate on `printer`'s bed, or
 * null when no translation does. Centring wins when it is legal; otherwise the
 * search walks outward from centre so the plate stays as central as it can.
 */
export function placePlateOnBed(
  items: PlateFootprint[],
  printer: PrinterBed,
  options: PlateLayoutOptions = {},
): PlatePlacement | null {
  const bounds = plateBounds(items);
  if (!bounds) return { dx: 0, dy: 0 };

  const usable = inflate(printer.bed, -(options.edgeSpacing ?? 0));
  const slackX = (usable.maxX - usable.minX) - bounds.width;
  const slackY = (usable.maxY - usable.minY) - bounds.depth;
  if (slackX < -GEOM_EPSILON || slackY < -GEOM_EPSILON) return null;

  const keepouts = printer.keepouts.map((k) => inflate(k, options.keepoutSpacing ?? 0));
  // Offsets that keep the arrangement inside the usable rect.
  const minDx = usable.minX - bounds.minX;
  const maxDx = minDx + slackX;
  const minDy = usable.minY - bounds.minY;
  const maxDy = minDy + slackY;

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const centreDx = clamp((usable.minX + usable.maxX) / 2 - bounds.centerX, minDx, maxDx);
  const centreDy = clamp((usable.minY + usable.maxY) / 2 - bounds.centerY, minDy, maxDy);

  const clear = (dx: number, dy: number) => !items.some((i) => hitsKeepout(i, dx, dy, keepouts));
  if (keepouts.length === 0 || clear(centreDx, centreDy)) return { dx: centreDx, dy: centreDy };

  // Spiral outward from centre in whole steps, then try the extremes — a
  // keepout usually sits in one corner, so the plate only needs to slide away.
  const steps = Math.ceil(Math.max(slackX, slackY) / SEARCH_STEP);
  for (let ring = 1; ring <= steps; ring++) {
    const offs = [ring * SEARCH_STEP, -ring * SEARCH_STEP, 0];
    for (const ox of offs) {
      for (const oy of offs) {
        if (ox === 0 && oy === 0) continue;
        const dx = clamp(centreDx + ox, minDx, maxDx);
        const dy = clamp(centreDy + oy, minDy, maxDy);
        if (clear(dx, dy)) return { dx, dy };
      }
    }
  }
  for (const dx of [minDx, maxDx]) {
    for (const dy of [minDy, maxDy]) {
      if (clear(dx, dy)) return { dx, dy };
    }
  }
  return null;
}

export interface AuthoredFitResult {
  status: FitStatus;
  /** Human-readable, one per problem. Empty when status === 'fits'. */
  reasons: string[];
  /** Objects that the placed plate could not keep on the bed. */
  unplacedIds: string[];
  /** The rigid translation used, or null when the plate does not go on at all. */
  offset: PlatePlacement | null;
  /** Bed-space footprint centre per object, once the offset is applied. */
  layout: Record<string, { x: number; y: number }>;
  /** What the arrangement occupies, in plate space. */
  bounds: PlateBounds | null;
}

function mm(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/**
 * Can this printer be sent this plate? `blocked` means no — the arrangement is
 * bigger than the bed, taller than the machine, or cannot dodge a keepout.
 * `warn` means it prints, but degraded (more colours than extruders).
 */
export function evaluateAuthoredPlateFit(
  items: PlateFootprint[],
  printer: PrinterBed,
  options: PlateLayoutOptions = {},
): AuthoredFitResult {
  const reasons: string[] = [];
  const bounds = plateBounds(items);
  let blocked = false;
  let warn = false;

  for (const item of items) {
    if (item.height > printer.maxHeight + GEOM_EPSILON) {
      blocked = true;
      reasons.push(
        `${item.name} is ${mm(item.height)} mm tall; printer max is ${mm(printer.maxHeight)} mm.`,
      );
    }
    const colors = item.colorCount ?? 0;
    if (colors > printer.extruderCount) {
      warn = true;
      const n = printer.extruderCount;
      reasons.push(
        `${item.name} has ${colors} colors; printer has ${n} extruder${n === 1 ? '' : 's'} — `
        + (n === 1 ? 'it will print in one color.' : `it will print in ${n} colors.`),
      );
    }
  }

  const offset = items.length > 0 ? placePlateOnBed(items, printer, options) : { dx: 0, dy: 0 };
  const layout: AuthoredFitResult['layout'] = {};
  const unplacedIds: string[] = [];

  if (!offset) {
    blocked = true;
    const bedW = printer.bed.maxX - printer.bed.minX;
    const bedD = printer.bed.maxY - printer.bed.minY;
    const usableW = bedW - 2 * (options.edgeSpacing ?? 0);
    const usableD = bedD - 2 * (options.edgeSpacing ?? 0);
    if (bounds && (bounds.width > usableW + GEOM_EPSILON || bounds.depth > usableD + GEOM_EPSILON)) {
      reasons.push(
        `Plate is ${mm(bounds.width)} × ${mm(bounds.depth)} mm; bed is ${mm(bedW)} × ${mm(bedD)} mm.`,
      );
    } else {
      reasons.push('Plate cannot be positioned clear of this bed’s exclusion zones.');
    }
    for (const item of items) unplacedIds.push(item.id);
  } else {
    for (const item of items) {
      layout[item.id] = { x: item.x + offset.dx, y: item.y + offset.dy };
    }
  }

  return {
    status: blocked ? 'blocked' : warn ? 'warn' : 'fits',
    // Copies of one part hit the same wall, and saying so six times reads as
    // six problems.
    reasons: [...new Set(reasons)],
    unplacedIds,
    offset,
    layout,
    bounds,
  };
}

/** Objects that interpenetrate on the plate itself — a plate-authoring
 *  problem, not a printer one, so it is reported separately from fit. */
export function findPlateOverlaps(items: PlateFootprint[]): Array<[string, string]> {
  const hits: Array<[string, string]> = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (Math.abs(a.x - b.x) < a.halfW + b.halfW - GEOM_EPSILON
        && Math.abs(a.y - b.y) < a.halfD + b.halfD - GEOM_EPSILON) {
        hits.push([a.id, b.id]);
      }
    }
  }
  return hits;
}
