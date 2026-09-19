// SPDX-License-Identifier: MIT
// Plate space geometry.
//
// `resolvePlate` hands back one recentred mesh per copy. This module turns
// those into *instances*: a copy plus the pose the plate stores for it, plus
// the measurements everything downstream needs — the footprint the fit oracle
// gates printers on, the placement the canvases draw, and the baked bytes the
// slicer gets.
//
// The pose is measured, never guessed. A part tipped 30 degrees onto a corner
// has a footprint no bounding-box expansion predicts correctly, and a fit
// verdict built on a guess would promise a bed the part does not fit.

import type { PlateFootprint } from '@3d-gallery/print-toolkit';
import { extractColorMeshes } from '@3d-gallery/viewer/merge-3mf';
import {
  IDENTITY_QUAT,
  isIdentityPose,
  meshBbox,
  meshBboxPosed,
  recenterMeshXY,
  transformMesh,
  type Bbox3,
  type MeshPose,
} from './mesh-bounds.js';
import {
  DEFAULT_SCALE,
  instanceId,
  type Plate,
  type PlateTransform,
} from './plate-store.js';
import type { ResolvedPlateObject } from './plate-resolve.js';

export interface PlateInstance {
  /** `<itemId>:<copy>` — the key the plate stores a transform under. */
  id: string;
  itemId: string;
  copy: number;
  label: string;
  format: 'stl' | '3mf';
  /** Recentred artifact bytes. Shared by every copy of the same item. */
  data: ArrayBuffer;
  /** Extents with no pose applied. */
  baseBbox: Bbox3;
  /** Extents under `transform`'s rotation and scale, about the mesh origin. */
  posedBbox: Bbox3;
  transform: PlateTransform;
  /** Filament colours the object needs. 1 for a single-colour part. */
  colorCount: number;
}

export function poseOf(transform: PlateTransform): MeshPose {
  return { rot: transform.rot, scale: transform.scale };
}

function defaultTransform(): PlateTransform {
  return { x: 0, y: 0, rot: IDENTITY_QUAT, scale: { ...DEFAULT_SCALE } };
}

/**
 * Posed bboxes, across calls.
 *
 * Measuring means walking every vertex, and `buildInstances` re-runs on every
 * edit — including a plain move, which changes no pose at all. Keying on
 * (artifact, pose) makes a move free and makes copies that share an
 * orientation measure once between them.
 */
const POSE_CACHE_LIMIT = 512;
const posedCache = new Map<string, Bbox3 | null>();

function cachedPosedBbox(
  cacheKey: string,
  data: ArrayBuffer,
  format: 'stl' | '3mf',
  pose: MeshPose,
  fallback: Bbox3,
): Bbox3 {
  if (isIdentityPose(pose)) return fallback;
  const hit = posedCache.get(cacheKey);
  if (hit !== undefined) return hit ?? fallback;
  const measured = meshBboxPosed(data, format, pose);
  if (posedCache.size >= POSE_CACHE_LIMIT) {
    const oldest = posedCache.keys().next().value;
    if (oldest !== undefined) posedCache.delete(oldest);
  }
  posedCache.set(cacheKey, measured);
  return measured ?? fallback;
}

/** Distinct filament colours in a mesh. Single-colour formats are always 1.
 *  Cached across calls: counting means unzipping and parsing the 3MF, and
 *  `buildInstances` re-runs on every edit to the plate. */
const colorCache = new Map<string, number>();

function countColors(cacheKey: string, data: ArrayBuffer, format: 'stl' | '3mf'): number {
  if (format !== '3mf') return 1;
  const hit = colorCache.get(cacheKey);
  if (hit !== undefined) return hit;
  let count = 1;
  try {
    count = Math.max(1, new Set(extractColorMeshes(data).map((m) => m.colorHex)).size);
  } catch { /* unreadable palette — treat as single colour */ }
  if (colorCache.size >= POSE_CACHE_LIMIT) {
    const oldest = colorCache.keys().next().value;
    if (oldest !== undefined) colorCache.delete(oldest);
  }
  colorCache.set(cacheKey, count);
  return count;
}

/** Pair every resolved copy with its stored transform, and measure it. */
export function buildInstances(plate: Plate, resolved: ResolvedPlateObject[]): PlateInstance[] {
  const keyOf = new Map<string, string>();
  for (const item of plate.items) keyOf.set(item.id, item.key);

  return resolved.map((obj) => {
    const id = instanceId(obj.itemId, obj.copy);
    const transform = plate.transforms?.[id] ?? defaultTransform();
    const artifactKey = keyOf.get(obj.itemId) ?? obj.itemId;
    const pose = poseOf(transform);

    const posed = cachedPosedBbox(
      `${artifactKey}|${JSON.stringify(pose)}`, obj.data, obj.format, pose, obj.bbox,
    );

    const colorCount = countColors(artifactKey, obj.data, obj.format);

    return {
      id,
      itemId: obj.itemId,
      copy: obj.copy,
      label: obj.label,
      format: obj.format,
      data: obj.data,
      baseBbox: obj.bbox,
      posedBbox: posed,
      transform,
      colorCount,
    };
  });
}

export function bboxSize(bbox: Bbox3): { w: number; d: number; h: number } {
  return {
    w: bbox.maxX - bbox.minX,
    d: bbox.maxY - bbox.minY,
    h: bbox.maxZ - bbox.minZ,
  };
}

/**
 * Translation applied to the posed mesh so the instance sits where the plate
 * says: footprint centred on (x, y), and resting on the bed.
 */
export function placementOffset(inst: PlateInstance): { dx: number; dy: number; dz: number } {
  const { posedBbox: b, transform } = inst;
  return {
    dx: transform.x - (b.minX + b.maxX) / 2,
    dy: transform.y - (b.minY + b.maxY) / 2,
    dz: -b.minZ,
  };
}

/** What the fit oracle gates printers on. */
export function toFootprints(instances: PlateInstance[]): PlateFootprint[] {
  return instances.map((inst) => {
    const { w, d, h } = bboxSize(inst.posedBbox);
    return {
      id: inst.id,
      name: inst.label,
      x: inst.transform.x,
      y: inst.transform.y,
      halfW: w / 2,
      halfD: d / 2,
      height: h,
      colorCount: inst.colorCount,
    };
  });
}

export interface ArrangeOptions {
  /** Gap left between parts, mm. */
  spacing?: number;
}

/**
 * Pack the plate into a compact block centred on the plate origin.
 *
 * There is no bed here — a plate is arranged before a printer is chosen — so
 * the packer aims for a roughly square block rather than filling a rectangle.
 * Shelf packing, tallest row first, which is what keeps rows from ratcheting
 * wider than the row above them.
 */
export function arrangeInstances(
  instances: PlateInstance[],
  options: ArrangeOptions = {},
): Record<string, { x: number; y: number }> {
  const spacing = options.spacing ?? 4;
  const boxes = instances.map((inst) => {
    const { w, d } = bboxSize(inst.posedBbox);
    return { id: inst.id, w: w + spacing, d: d + spacing };
  });
  if (boxes.length === 0) return {};

  const totalArea = boxes.reduce((sum, b) => sum + b.w * b.d, 0);
  const widest = Math.max(...boxes.map((b) => b.w));
  const targetWidth = Math.max(widest, Math.sqrt(totalArea) * 1.1);

  const ordered = [...boxes].sort((a, b) => b.d - a.d || b.w - a.w);
  const placed: Record<string, { x: number; y: number }> = {};
  let rowY = 0;
  let rowHeight = 0;
  let cursorX = 0;
  let usedWidth = 0;

  for (const box of ordered) {
    if (cursorX > 0 && cursorX + box.w > targetWidth) {
      rowY += rowHeight;
      rowHeight = 0;
      cursorX = 0;
    }
    placed[box.id] = { x: cursorX + box.w / 2, y: rowY + box.d / 2 };
    cursorX += box.w;
    if (cursorX > usedWidth) usedWidth = cursorX;
    if (box.d > rowHeight) rowHeight = box.d;
  }

  // Re-centre the finished block on the plate origin.
  const usedDepth = rowY + rowHeight;
  const shiftX = -usedWidth / 2;
  const shiftY = -usedDepth / 2;
  for (const id of Object.keys(placed)) {
    placed[id] = { x: placed[id].x + shiftX, y: placed[id].y + shiftY };
  }
  return placed;
}

/** Transforms for every copy, filling in any the plate has not placed yet. */
export function withArrangedGaps(
  plate: Plate,
  instances: PlateInstance[],
): Record<string, PlateTransform> | null {
  const missing = instances.filter((inst) => !plate.transforms?.[inst.id]);
  if (missing.length === 0) return null;

  const next: Record<string, PlateTransform> = { ...(plate.transforms ?? {}) };
  // A plate with nothing placed yet gets one clean arrangement; otherwise the
  // new arrivals are tucked beside what the user already positioned.
  if (missing.length === instances.length) {
    const spots = arrangeInstances(instances);
    for (const inst of instances) {
      next[inst.id] = { ...defaultTransform(), ...spots[inst.id] };
    }
    return next;
  }

  const settled = instances.filter((inst) => plate.transforms?.[inst.id]);
  // Start from the right edge of what is already placed, wherever that is —
  // seeding from 0 would drop new parts on top of a plate laid out to the left.
  let cursor = settled.reduce(
    (max, inst) => Math.max(max, inst.transform.x + bboxSize(inst.posedBbox).w / 2),
    -Infinity,
  );
  if (!Number.isFinite(cursor)) cursor = 0;
  for (const inst of missing) {
    const { w } = bboxSize(inst.posedBbox);
    next[inst.id] = { ...defaultTransform(), x: cursor + w / 2 + 4, y: 0 };
    cursor += w + 4;
  }
  return next;
}

export interface BakedInstance {
  data: ArrayBuffer;
  format: 'stl' | '3mf';
  /** Plate-space position of the baked geometry's footprint centre. */
  x: number;
  y: number;
}

/**
 * Bake an instance's pose into its bytes, recentred and sitting on the bed.
 *
 * The result goes to the slicer with rotZ 0 and scale 1 — the pose is in the
 * geometry now, so there is nothing left for the job to reinterpret.
 * Returns null when the pose cannot be baked (degenerate scale, or a 3MF this
 * module cannot rewrite); callers must refuse to slice rather than send the
 * unposed mesh.
 */
export function bakeInstance(inst: PlateInstance): BakedInstance | null {
  const pose = poseOf(inst.transform);
  const posed = isIdentityPose(pose) ? inst.data : transformMesh(inst.data, inst.format, pose);
  if (!posed) return null;
  const { buffer } = recenterMeshXY(posed, inst.format);
  return { data: buffer, format: inst.format, x: inst.transform.x, y: inst.transform.y };
}

/** Size of the mesh as it would print, for the object list. */
export function instanceSize(inst: PlateInstance): { w: number; d: number; h: number } {
  return bboxSize(inst.posedBbox);
}

/** Unposed size, so the editor can show scale as a percentage of original. */
export function baseSize(inst: PlateInstance): { w: number; d: number; h: number } {
  return bboxSize(inst.baseBbox);
}

/** Re-measure a mesh that arrived without a usable bbox. */
export function measure(data: ArrayBuffer, format: 'stl' | '3mf'): Bbox3 | null {
  return meshBbox(data, format);
}
