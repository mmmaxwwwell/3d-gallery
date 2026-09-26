// SPDX-License-Identifier: MIT
// Persistence for projects and build plates.
//
// A project is a folder: it groups the plates for one job. A plate is a
// named, printer-agnostic collection of parts belonging to exactly one
// project. Print setup (printer, filament, process) is deliberately NOT
// stored here — it stays global, in localStorage, shared by every plate.
//
// A plate owns its arrangement. The user lays parts out once, in plate space
// (origin-centred, Z up, mm), and that layout is the plate: its overall size is
// what decides which printers the job can be sent to. Putting it on a given bed
// is a rigid translation of the whole arrangement, never a re-pack of it.
//
// An item is a render request, not a mesh: slug + target + params address an
// artifact, and the bytes live in the artifact client's own content-addressed
// cache. Nothing here holds geometry.

import { openDB, type IDBPDatabase } from 'idb';
import type { RecommendedProfile, ScadValue } from '@3d-gallery/model-core';
import { IDENTITY_QUAT, type Quat } from './mesh-bounds.js';
import type { SupportStyle } from './process-templates.js';

/**
 * A fresh id for a project, plate or item.
 *
 * `crypto.randomUUID` is secure-context-only, so a gallery reached over plain
 * HTTP on a LAN or tailscale IP does not have it — and every create path here
 * would throw. `getRandomValues` carries no such restriction. Unlike an
 * artifact key, these ids are local and private to this browser: nothing
 * compares them against a value produced anywhere else, so the fallback only
 * has to be unique, not identical to what another client would generate.
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const DB_NAME = '3dg:print:plates';
// v2: items became render requests and the `meshes` store went away. v1 rows
// pointed at mesh blobs by a key scheme that no longer exists and carried a
// `file` where a `target` is now needed, so they are dropped rather than
// migrated — the feature never shipped.
// v3: plates gained an owning project.
// v4: the plate owns one arrangement instead of a pinned layout per printer.
// The old per-printer positions are dropped — they were bed coordinates for a
// specific machine, which plate space has no way to mean.
// v5: sliced G-code is kept per plate and printer, so a project can be sliced
// once and sent later.
const DB_VERSION = 5;
const PLATES_STORE = 'plates';
const PROJECTS_STORE = 'projects';
const GCODE_STORE = 'gcode';
const MESHES_STORE = 'meshes';
const LS_ACTIVE_PLATE = '3dg:print:active-plate';
const LS_ACTIVE_PROJECT = '3dg:print:active-project';
const ADOPTED_PROJECT_NAME = 'My prints';

export interface PlateItem {
  /** Stable per-item id (see `newId`). */
  id: string;
  slug: string;
  /** Manifest target (file base name), e.g. 'piece' for piece.stl. */
  target: string;
  format: 'stl' | '3mf';
  /** Display label, e.g. 'Tray piece (0,1)'. */
  label: string;
  /** Model title, for grouping in the UI. */
  modelTitle: string;
  /** Raw customizer values. Canonicalized at key time, never pre-reduced. */
  params?: Record<string, ScadValue>;
  /** Artifact key, cached for display and dedupe. Recomputed on resolve. */
  key: string;
  qty: number;
}

/** Per-axis scale factor. 1 = the artifact at its authored size. */
export interface PlateScale { x: number; y: number; z: number }

/**
 * Where one copy sits on the plate, in plate space (origin-centred, Z up, mm).
 *
 * `rot` is a full orientation, not a turntable angle: the editor can stand a
 * part on any face. A slice job only carries a Z rotation, so the orientation
 * is baked into the mesh bytes on the way to the slicer.
 */
export interface PlateTransform {
  /** Footprint centre in plate space. */
  x: number;
  y: number;
  /** Orientation as a unit quaternion (Three.js component order). */
  rot: Quat;
  scale: PlateScale;
}

export const DEFAULT_SCALE: PlateScale = { x: 1, y: 1, z: 1 };

export const DEFAULT_TRANSFORM: PlateTransform = {
  x: 0, y: 0, rot: IDENTITY_QUAT, scale: DEFAULT_SCALE,
};

/** Stable id for one copy of an item. An item with qty 3 has copies 0..2. */
export function instanceId(itemId: string, copy: number): string {
  return `${itemId}:${copy}`;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

/** Per-object slicer overrides. Only settings OrcaSlicer honours at object
 *  scope belong here — skirt is plate-wide, so it stays in the process. */
export interface ObjectOverrides {
  supports?: SupportStyle;
  brim?: boolean;
}

export interface Plate {
  id: string;
  /** Owning project. Every plate has one. */
  projectId: string;
  name: string;
  items: PlateItem[];
  /** instanceId -> where it sits on the plate. A missing entry means the copy
   *  has not been arranged yet; the editor places it on open. */
  transforms?: Record<string, PlateTransform>;
  /** instanceId -> slicer settings for that copy, overriding the process
   *  defaults. Keyed per copy, matching how the slicer addresses objects, so
   *  two copies of one part can be posed and tuned differently. A missing
   *  entry — or a missing field within one — means "whatever the process
   *  says", so an untouched plate adds no per-object config at all. */
  overrides?: Record<string, ObjectOverrides>;
  /** Material family, for a plate made from one of a model's print plates. */
  material?: string;
  /** The model's recommended profile, for a plate made from its print plates. */
  profile?: RecommendedProfile;
  createdAt: number;
  updatedAt: number;
}

/** A plate sliced for one printer, kept until the plate changes. */
export interface SlicedGcode {
  /** `<plateId>|<printerId>` */
  id: string;
  plateId: string;
  printerId: string;
  filamentId: string;
  /** `plateSignature` at slice time; any other value means the G-code is stale. */
  signature: string;
  gcode: string;
  seconds?: number;
  grams?: number;
  slicedAt: number;
}

function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, tx) {
      if (oldVersion < 2) {
        if (db.objectStoreNames.contains(MESHES_STORE)) db.deleteObjectStore(MESHES_STORE);
        if (db.objectStoreNames.contains(PLATES_STORE)) db.deleteObjectStore(PLATES_STORE);
      }
      if (!db.objectStoreNames.contains(PLATES_STORE)) {
        db.createObjectStore(PLATES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(GCODE_STORE)) {
        db.createObjectStore(GCODE_STORE, { keyPath: 'id' }).createIndex('byPlate', 'plateId');
      }
      // Pre-v3 plates have no owning project. Adopt them all into one rather
      // than dropping them — unlike v1, these rows are still readable.
      // Pre-v4 plates carry a per-printer `layout` the plate no longer owns.
      if (oldVersion >= 2 && oldVersion < 4) {
        const plates = tx.objectStore(PLATES_STORE);
        void plates.getAll().then((rows: Array<Plate & { layout?: unknown }>) => {
          if (rows.length === 0) return;
          const now = Date.now();
          const needsProject = oldVersion < 3;
          let projectId = '';
          if (needsProject) {
            const project: Project = {
              id: newId(),
              name: ADOPTED_PROJECT_NAME,
              createdAt: now,
              updatedAt: now,
            };
            projectId = project.id;
            void tx.objectStore(PROJECTS_STORE).put(project);
          }
          for (const row of rows) {
            const { layout: _dropped, ...plate } = row;
            void plates.put(needsProject ? { ...plate, projectId } : plate);
          }
        });
      }
    },
  });
}

function byRecency<T extends { updatedAt: number }>(rows: T[]): T[] {
  return rows.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function listProjects(): Promise<Project[]> {
  const db = await getDb();
  return byRecency(await db.getAll(PROJECTS_STORE));
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDb();
  return db.get(PROJECTS_STORE, id);
}

export async function saveProject(project: Project): Promise<Project> {
  const db = await getDb();
  const record: Project = { ...project, updatedAt: Date.now() };
  await db.put(PROJECTS_STORE, record);
  return record;
}

export async function createProject(name: string): Promise<Project> {
  const db = await getDb();
  const now = Date.now();
  const project: Project = { id: newId(), name, createdAt: now, updatedAt: now };
  await db.put(PROJECTS_STORE, project);
  return project;
}

/** Deleting a project takes its plates with it — a plate has no other home. */
export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([PROJECTS_STORE, PLATES_STORE, GCODE_STORE], 'readwrite');
  const plates: Plate[] = (await tx.objectStore(PLATES_STORE).getAll()).filter((p: Plate) => p.projectId === id);
  const gcodeIndex = tx.objectStore(GCODE_STORE).index('byPlate');
  const gcodeKeys = (await Promise.all(plates.map((p) => gcodeIndex.getAllKeys(p.id)))).flat();
  await Promise.all([
    tx.objectStore(PROJECTS_STORE).delete(id),
    ...plates.map((p) => tx.objectStore(PLATES_STORE).delete(p.id)),
    ...gcodeKeys.map((key) => tx.objectStore(GCODE_STORE).delete(key)),
  ]);
  await tx.done;
}

/** Every plate, newest first, or just one project's when `projectId` is given. */
export async function listPlates(projectId?: string): Promise<Plate[]> {
  const db = await getDb();
  const all: Plate[] = await db.getAll(PLATES_STORE);
  return byRecency(projectId === undefined ? all : all.filter((p) => p.projectId === projectId));
}

export async function getPlate(id: string): Promise<Plate | undefined> {
  const db = await getDb();
  return db.get(PLATES_STORE, id);
}

/** Every copy the plate's items currently define, in item then copy order. */
export function plateInstanceIds(plate: Plate): string[] {
  const ids: string[] = [];
  for (const item of plate.items) {
    for (let copy = 0; copy < item.qty; copy++) ids.push(instanceId(item.id, copy));
  }
  return ids;
}

/** Transforms for copies that no longer exist would resurrect themselves the
 *  next time qty went back up, in a position the user never chose. */
function pruneTransforms(plate: Plate): Plate {
  if (!plate.transforms) return plate;
  const live = new Set(plateInstanceIds(plate));
  const kept: Record<string, PlateTransform> = {};
  for (const [id, transform] of Object.entries(plate.transforms)) {
    if (live.has(id)) kept[id] = transform;
  }
  return { ...plate, transforms: kept };
}

export async function savePlate(plate: Plate): Promise<Plate> {
  const db = await getDb();
  const record: Plate = { ...pruneTransforms(plate), updatedAt: Date.now() };
  await db.put(PLATES_STORE, record);
  return record;
}

export async function deletePlate(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([PLATES_STORE, GCODE_STORE], 'readwrite');
  const gcodeKeys = await tx.objectStore(GCODE_STORE).index('byPlate').getAllKeys(id);
  await Promise.all([
    tx.objectStore(PLATES_STORE).delete(id),
    ...gcodeKeys.map((key) => tx.objectStore(GCODE_STORE).delete(key)),
  ]);
  await tx.done;
}

/** What a slice depends on. A rename leaves it alone; a move or a qty change does not. */
export function plateSignature(plate: Plate): string {
  return JSON.stringify({
    items: plate.items.map((i) => [i.id, i.key, i.qty]),
    transforms: plate.transforms ?? {},
    overrides: plate.overrides ?? {},
  });
}

export function gcodeId(plateId: string, printerId: string): string {
  return `${plateId}|${printerId}`;
}

export async function putSlicedGcode(entry: Omit<SlicedGcode, 'id'>): Promise<SlicedGcode> {
  const db = await getDb();
  const record: SlicedGcode = { ...entry, id: gcodeId(entry.plateId, entry.printerId) };
  await db.put(GCODE_STORE, record);
  return record;
}

export async function getSlicedGcode(plateId: string, printerId: string): Promise<SlicedGcode | undefined> {
  const db = await getDb();
  return db.get(GCODE_STORE, gcodeId(plateId, printerId));
}

/** Every slice kept for a plate, whichever printer it was for. */
export async function listSlicedGcode(plateId: string): Promise<SlicedGcode[]> {
  const db = await getDb();
  return db.getAllFromIndex(GCODE_STORE, 'byPlate', plateId);
}

/**
 * Make one plate per entry, each already holding its single item at the plate
 * origin. For a model's print plates, which arrive laid out: the plate 3MF is
 * the arrangement, so there is nothing for the editor to place.
 */
export async function createPlatesWithItems(
  projectId: string,
  entries: Array<{ name: string; item: Omit<PlateItem, 'id'>; material?: string; profile?: RecommendedProfile }>,
): Promise<Plate[]> {
  const db = await getDb();
  const tx = db.transaction(PLATES_STORE, 'readwrite');
  const now = Date.now();
  const plates = entries.map((entry, i): Plate => {
    const item: PlateItem = { ...entry.item, id: newId() };
    return {
      id: newId(),
      projectId,
      name: entry.name,
      items: [item],
      transforms: Object.fromEntries(
        Array.from({ length: item.qty }, (_, copy) => [instanceId(item.id, copy), DEFAULT_TRANSFORM]),
      ),
      material: entry.material,
      profile: entry.profile,
      createdAt: now,
      // Oldest first reads top to bottom in plate order, since lists sort newest first.
      updatedAt: now - i,
    };
  });
  await Promise.all(plates.map((p) => tx.store.put(p)));
  await tx.done;
  return plates;
}

export async function createPlate(name: string, projectId: string): Promise<Plate> {
  const db = await getDb();
  const now = Date.now();
  const plate: Plate = {
    id: newId(),
    projectId,
    name,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.put(PLATES_STORE, plate);
  return plate;
}

/** "Plate 3" — the next free ordinal within a project. */
export async function nextPlateName(projectId: string): Promise<string> {
  const plates = await listPlates(projectId);
  return `Plate ${plates.length + 1}`;
}

/** Read-modify-write in one transaction so concurrent edits can't clobber. */
async function mutatePlate(plateId: string, mutate: (plate: Plate) => Plate): Promise<Plate> {
  const db = await getDb();
  const tx = db.transaction(PLATES_STORE, 'readwrite');
  const existing: Plate | undefined = await tx.store.get(plateId);
  if (!existing) {
    await tx.done;
    throw new Error(`Plate not found: ${plateId}`);
  }
  const updated: Plate = { ...mutate(existing), updatedAt: Date.now() };
  await tx.store.put(updated);
  await tx.done;
  return updated;
}

export function addItemToPlate(plateId: string, item: Omit<PlateItem, 'id'>): Promise<Plate> {
  return mutatePlate(plateId, (plate) => {
    const match = plate.items.find(
      (i) => i.slug === item.slug && i.target === item.target && i.key === item.key,
    );
    const items = match
      ? plate.items.map((i) => (i === match ? { ...i, qty: i.qty + item.qty } : i))
      : [...plate.items, { ...item, id: newId() }];
    return { ...plate, items };
  });
}

export function getActivePlateId(): string | null {
  try {
    return localStorage.getItem(LS_ACTIVE_PLATE);
  } catch { return null; }
}

export function setActivePlateId(id: string | null): void {
  try {
    if (id === null) localStorage.removeItem(LS_ACTIVE_PLATE);
    else localStorage.setItem(LS_ACTIVE_PLATE, id);
  } catch { /* private mode / quota — active plate is a convenience only */ }
}

export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(LS_ACTIVE_PROJECT);
  } catch { return null; }
}

export function setActiveProjectId(id: string | null): void {
  try {
    if (id === null) localStorage.removeItem(LS_ACTIVE_PROJECT);
    else localStorage.setItem(LS_ACTIVE_PROJECT, id);
  } catch { /* see setActivePlateId */ }
}

/**
 * Resolve where "Add to plate" should drop a part, creating a project and/or
 * a plate on first use. `fallbackProjectName` names a project only when there
 * is none at all to fall back on.
 */
export async function ensureTargetPlate(
  fallbackProjectName: string,
): Promise<{ project: Project; plate: Plate }> {
  const activeProjectId = getActiveProjectId();
  const project =
    (activeProjectId ? await getProject(activeProjectId) : undefined)
    ?? (await listProjects())[0]
    ?? (await createProject(fallbackProjectName));
  setActiveProjectId(project.id);

  const activePlateId = getActivePlateId();
  const active = activePlateId ? await getPlate(activePlateId) : undefined;
  // An active plate from another project would silently scatter parts across
  // projects, so it only counts when it belongs to the project we resolved.
  const plate =
    (active?.projectId === project.id ? active : undefined)
    ?? (await listPlates(project.id))[0]
    ?? (await createPlate(await nextPlateName(project.id), project.id));
  setActivePlateId(plate.id);

  return { project, plate };
}
