// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The plate fit oracle.
 *
 * A plate is authored without a printer, so "does this plate fit printer P?"
 * is answered operationally: run the same arranger the slice path runs and
 * see if everything lands. The badge can therefore never disagree with what
 * actually gets sliced.
 *
 * Pure — no DOM, no fetch.
 */

import type { BuildPlateObject, PrimeTowerConfig } from './build-plate.js';
import type { MeshBounds, Rect2 } from './plate-slicer.js';
import { arrangeObjects, computeMeshBoundingBox } from './plate-slicer.js';
import { parsePrintableArea } from './gcode-post.js';
import { excludeAreaBboxes, isDegenerateExcludeArea } from './bed-exclude.js';

/** Tolerance for "touches the edge" comparisons, mm. */
const GEOM_EPSILON = 1e-6;

/** Matches `arrangeObjects`' own default, so both paths size an unparseable
 *  mesh identically. */
const FALLBACK_SIZE = 30;

export interface PrinterBed {
  /** Printable area rectangle in slicer coordinates. */
  bed: Rect2;
  /** bed_exclude_area bboxes, already sanitized. */
  keepouts: Rect2[];
  /** printable_height, mm. */
  maxHeight: number;
  /** Number of extruders the machine has. >= 1. */
  extruderCount: number;
}

/** First finite number in an OrcaSlicer array-shaped field. `buildOrcaConfig`
 *  joins numeric arrays with `,`; the preset flattener joins with `;`. */
function firstNumber(field: string | undefined): number | null {
  if (!field) return null;
  for (const token of field.split(/[;,]/)) {
    const n = parseFloat(token);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** OrcaSlicer sizes every per-extruder array by the machine's extruder count,
 *  and `nozzle_diameter` is the one entry every printer preset carries. */
function countExtruders(config: Record<string, string>): number {
  const field = config['nozzle_diameter'];
  if (!field) return 1;
  let count = 0;
  for (const token of field.split(/[;,]/)) {
    if (Number.isFinite(parseFloat(token))) count++;
  }
  return Math.max(1, count);
}

/**
 * Derive a PrinterBed from a flattened OrcaSlicer printer config
 * (the `Record<string,string>` produced by flattening a printer preset).
 * Uses parsePrintableArea + excludeAreaBboxes + isDegenerateExcludeArea
 * from this package. Degenerate `["0x0"]` exclusions are dropped.
 * Returns null when `printable_area` is missing or unparseable.
 */
export function printerBedFromConfig(
  config: Record<string, string>,
  opts?: { ignoreExclusions?: boolean },
): PrinterBed | null {
  const bounds = parsePrintableArea(config['printable_area']);
  if (!bounds) return null;

  const excludeField = config['bed_exclude_area'];
  const keepouts = opts?.ignoreExclusions || isDegenerateExcludeArea(excludeField)
    ? []
    : excludeAreaBboxes(excludeField);

  // An unknown printable_height must not block a plate that would otherwise
  // print; the machine, not this oracle, is the authority on Z.
  const maxHeight = firstNumber(config['printable_height']) ?? Infinity;

  return {
    bed: { minX: bounds.minX, minY: bounds.minY, maxX: bounds.maxX, maxY: bounds.maxY },
    keepouts: keepouts.map((k) => ({ minX: k.minX, minY: k.minY, maxX: k.maxX, maxY: k.maxY })),
    maxHeight,
    extruderCount: countExtruders(config),
  };
}

export type FitStatus = 'fits' | 'warn' | 'blocked';

export interface PlateFitResult {
  status: FitStatus;
  /** Human-readable, one per problem. Empty when status === 'fits'. */
  reasons: string[];
  /** ids of objects that could not be placed. */
  unplacedIds: string[];
  /** Derived layout, keyed by object id. Only for objects that were placed. */
  layout: Record<string, { x: number; y: number; rot: number }>;
}

export interface PlateFitOptions {
  spacing?: number;
  primeTower?: PrimeTowerConfig;
  /** Pinned manual positions, keyed by object id. When every object has an
   *  entry, arrange is skipped and the pinned layout is validated instead. */
  pinned?: Record<string, { x: number; y: number; rot: number }>;
}

function mm(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/** Half-extents of a footprint: the scaled bbox expanded by its Z rotation. */
function footprint(
  bounds: MeshBounds | null,
  rotation: number,
): { halfW: number; halfD: number } {
  if (!bounds) return { halfW: FALLBACK_SIZE / 2, halfD: FALLBACK_SIZE / 2 };
  const rad = (rotation % 180) * Math.PI / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    halfW: (bounds.width * cos + bounds.depth * sin) / 2,
    halfD: (bounds.width * sin + bounds.depth * cos) / 2,
  };
}

interface Footprint {
  id: string;
  x: number;
  y: number;
  halfW: number;
  halfD: number;
}

function overlaps(a: Footprint, b: Footprint): boolean {
  return Math.abs(a.x - b.x) < a.halfW + b.halfW - GEOM_EPSILON
      && Math.abs(a.y - b.y) < a.halfD + b.halfD - GEOM_EPSILON;
}

function rectFootprint(rect: Rect2): Footprint {
  return {
    id: '',
    x: (rect.minX + rect.maxX) / 2,
    y: (rect.minY + rect.maxY) / 2,
    halfW: Math.abs(rect.maxX - rect.minX) / 2,
    halfD: Math.abs(rect.maxY - rect.minY) / 2,
  };
}

interface Measured {
  obj: BuildPlateObject;
  bounds: MeshBounds | null;
}

interface Placement {
  layout: Record<string, { x: number; y: number; rot: number }>;
  unplacedIds: string[];
}

/** Manual placements are trusted for clearance — only a real geometric
 *  violation (off the bed, into a keepout, into another object) rejects one. */
function validatePinned(
  measured: Measured[],
  pinned: Record<string, { x: number; y: number; rot: number }>,
  printer: PrinterBed,
): Placement {
  const rects = measured.map(({ obj, bounds }) => {
    const at = pinned[obj.id];
    const { halfW, halfD } = footprint(bounds, at.rot);
    return { id: obj.id, x: at.x, y: at.y, halfW, halfD };
  });
  const keepouts = printer.keepouts.map(rectFootprint);
  const bad = new Set<string>();

  for (const rect of rects) {
    const offBed = rect.x - rect.halfW < printer.bed.minX - GEOM_EPSILON
      || rect.x + rect.halfW > printer.bed.maxX + GEOM_EPSILON
      || rect.y - rect.halfD < printer.bed.minY - GEOM_EPSILON
      || rect.y + rect.halfD > printer.bed.maxY + GEOM_EPSILON;
    if (offBed || keepouts.some((k) => overlaps(rect, k))) bad.add(rect.id);
  }
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (overlaps(rects[i], rects[j])) {
        bad.add(rects[i].id);
        bad.add(rects[j].id);
      }
    }
  }

  const layout: Placement['layout'] = {};
  for (const { obj } of measured) {
    if (bad.has(obj.id)) continue;
    const at = pinned[obj.id];
    layout[obj.id] = { x: at.x, y: at.y, rot: at.rot };
  }
  return { layout, unplacedIds: measured.map((m) => m.obj.id).filter((id) => bad.has(id)) };
}

function arrangeLayout(
  objects: BuildPlateObject[],
  printer: PrinterBed,
  options: PlateFitOptions,
): Placement {
  const { placed, unplaced } = arrangeObjects(objects, {
    bed: printer.bed,
    keepouts: printer.keepouts,
    spacing: options.spacing,
    primeTower: options.primeTower,
  });
  const layout: Placement['layout'] = {};
  for (const obj of placed) {
    layout[obj.id] = { x: obj.position.x, y: obj.position.y, rot: obj.rotation };
  }
  return { layout, unplacedIds: unplaced.map((o) => o.id) };
}

/**
 * Decide whether `objects` fit `printer`, and produce the layout they would
 * use. `blocked` = cannot print (does not pack, too tall).
 * `warn` = prints, but degraded (more colors than extruders).
 */
export function evaluatePlateFit(
  objects: BuildPlateObject[],
  printer: PrinterBed,
  options?: PlateFitOptions,
): PlateFitResult {
  const opts = options ?? {};
  const reasons: string[] = [];
  let blocked = false;
  let warn = false;

  const measured: Measured[] = objects.map((obj) => ({
    obj,
    bounds: computeMeshBoundingBox(obj.meshData, obj.meshFormat, obj.scale),
  }));

  for (const { obj, bounds } of measured) {
    if (bounds && bounds.height > printer.maxHeight + GEOM_EPSILON) {
      blocked = true;
      reasons.push(
        `${obj.name} is ${mm(bounds.height)} mm tall; `
        + `printer max is ${mm(printer.maxHeight)} mm.`,
      );
    }
    const colors = obj.colorGroups?.length ?? 0;
    if (colors > printer.extruderCount) {
      warn = true;
      const n = printer.extruderCount;
      reasons.push(
        `${obj.name} has ${colors} colors; printer has ${n} extruder${n === 1 ? '' : 's'} — `
        + (n === 1 ? 'it will print in one color.' : `it will print in ${n} colors.`),
      );
    }
  }

  const pinned = opts.pinned;
  const { layout, unplacedIds } =
    pinned && objects.length > 0 && objects.every((o) => !!pinned[o.id])
      ? validatePinned(measured, pinned, printer)
      : arrangeLayout(objects, printer, opts);

  if (unplacedIds.length > 0) {
    blocked = true;
    reasons.push(`${unplacedIds.length} of ${objects.length} objects do not fit on the bed.`);
  }

  return {
    status: blocked ? 'blocked' : warn ? 'warn' : 'fits',
    reasons,
    unplacedIds,
    layout,
  };
}
