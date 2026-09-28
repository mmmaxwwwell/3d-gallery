// SPDX-License-Identifier: MIT
// What the operator did, kept in its own IndexedDB database so it never
// shares an upgrade with the plate store: every print sent or started, each
// stop's timing, checklist and notes, each session's real start and end, and
// the photos taken along the way (raw, for processing later).

import { openDB, type IDBPDatabase } from 'idb';
import type { OutcomeFlag, StepId } from './operator-model.js';
import type { PrintReport } from './print-report.js';
import { newId } from './plate-store.js';

const DB_NAME = '3dg:print:operator';
const DB_VERSION = 1;
const PRINTS = 'prints';
const STOPS = 'stops';
const SESSIONS = 'sessions';
const PHOTOS = 'photos';

/** A print handed to a printer: what, where and when. */
export interface PrintRecord {
  id: string;
  projectId: string;
  plateId: string;
  printerId: string;
  file: string;
  at: number;
  kind: 'upload' | 'start';
  /** Who says so: the dispatch daemon did it, or the operator ticked it off in the runbook. */
  source: 'dispatch' | 'runbook';
  /** What the printer last said about it (starts only). */
  report?: PrintReport;
}

export interface StopLog {
  /** `stopKey`: `projectId|plateId started|printerId`. */
  key: string;
  projectId: string;
  sessionKey: string;
  startedAt?: number;
  stoppedAt?: number;
  checked: Partial<Record<StepId, boolean>>;
  /** How the print coming off went, and the plate it was. */
  outcome?: { plateId: string; flags: OutcomeFlag[]; note: string };
  clearMethod?: 'swap' | 'bin';
  firstLayer?: { ok: boolean; note: string; at: number };
  updatedAt: number;
}

export interface SessionLog {
  /** The plate id of the session's first start. */
  key: string;
  projectId: string;
  startedAt?: number;
  endedAt?: number;
}

export type PhotoKind = 'last-print' | 'bin-parts' | 'bin-label' | 'first-layer';

export interface Photo {
  id: string;
  projectId: string;
  stopKey: string;
  /** The plate in the picture: the print coming off, or the one going down. */
  plateId: string;
  kind: PhotoKind;
  blob: Blob;
  at: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(d) {
      d.createObjectStore(PRINTS, { keyPath: 'id' }).createIndex('byProject', 'projectId');
      d.createObjectStore(STOPS, { keyPath: 'key' }).createIndex('byProject', 'projectId');
      d.createObjectStore(SESSIONS, { keyPath: 'key' }).createIndex('byProject', 'projectId');
      const photos = d.createObjectStore(PHOTOS, { keyPath: 'id' });
      photos.createIndex('byProject', 'projectId');
      photos.createIndex('byStop', 'stopKey');
    },
  });
  return dbPromise;
}

const listeners = new Set<(projectId: string) => void>();

/** Called with the project whenever anything of it is written. */
export function onOperatorChange(fn: (projectId: string) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function changed(projectId: string): void {
  for (const fn of listeners) fn(projectId);
}

export async function recordPrint(record: Omit<PrintRecord, 'id'>): Promise<void> {
  await (await db()).put(PRINTS, { ...record, id: newId() });
  changed(record.projectId);
}

/** Keep what the printer said about a print. */
export async function saveReport(id: string, report: PrintReport): Promise<void> {
  const d = await db();
  const record = await d.get(PRINTS, id) as PrintRecord | undefined;
  if (!record) return;
  await d.put(PRINTS, { ...record, report });
  changed(record.projectId);
}

export async function listPrints(projectId: string): Promise<PrintRecord[]> {
  return (await db()).getAllFromIndex(PRINTS, 'byProject', projectId);
}

export async function listStopLogs(projectId: string): Promise<StopLog[]> {
  return (await db()).getAllFromIndex(STOPS, 'byProject', projectId);
}

export async function listSessionLogs(projectId: string): Promise<SessionLog[]> {
  return (await db()).getAllFromIndex(SESSIONS, 'byProject', projectId);
}

/** Merge `patch` into the stop's log, creating it. */
export async function patchStopLog(
  base: Pick<StopLog, 'key' | 'projectId' | 'sessionKey'>,
  patch: Partial<Omit<StopLog, 'key' | 'projectId'>>,
): Promise<StopLog> {
  const d = await db();
  const prev = (await d.get(STOPS, base.key)) as StopLog | undefined;
  const next: StopLog = {
    checked: {},
    ...prev,
    ...base,
    ...patch,
    ...(patch.checked ? { checked: { ...prev?.checked, ...patch.checked } } : {}),
    updatedAt: Date.now(),
  };
  await d.put(STOPS, next);
  changed(base.projectId);
  return next;
}

export async function patchSessionLog(base: Pick<SessionLog, 'key' | 'projectId'>, patch: Partial<SessionLog>): Promise<void> {
  const d = await db();
  const prev = (await d.get(SESSIONS, base.key)) as SessionLog | undefined;
  await d.put(SESSIONS, { ...prev, ...base, ...patch });
  changed(base.projectId);
}

export async function addPhoto(photo: Omit<Photo, 'id' | 'at'>): Promise<void> {
  await (await db()).put(PHOTOS, { ...photo, id: newId(), at: Date.now() });
  changed(photo.projectId);
}

export async function listPhotos(projectId: string): Promise<Photo[]> {
  return (await db()).getAllFromIndex(PHOTOS, 'byProject', projectId);
}

export async function deletePhoto(photo: Photo): Promise<void> {
  await (await db()).delete(PHOTOS, photo.id);
  changed(photo.projectId);
}
