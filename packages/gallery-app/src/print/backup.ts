// SPDX-License-Identifier: MIT
// Everything the print UI keeps in this browser, as one JSON file: every
// `3dg:print:*` IndexedDB database and localStorage key. Storage is per origin,
// so this is how presets, projects, slices and the operator's logs move to
// another browser (a phone reaching the dev server over the tailnet) or
// survive a cleared one.
import { openDB } from 'idb';
import { listPresets } from './print-storage.js';
import { listProjects } from './plate-store.js';
import { listPrints } from './operator-store.js';

export const BACKUP_FORMAT = '3d-gallery-backup';
export const BACKUP_VERSION = 1;

const PREFIX = '3dg:print:';
/** Per-browser choices that shouldn't follow the data to another browser. */
const LOCAL_ONLY = new Set(['3dg:print:server-store']);

export type Encoded =
  | null
  | boolean
  | number
  | string
  | Encoded[]
  | { [k: string]: Encoded };

export interface BackupStore {
  /** Only stores with out-of-line keys need them; the rest carry theirs in the value. */
  keys?: Encoded[];
  values: Encoded[];
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: number;
  origin: string;
  databases: Record<string, Record<string, BackupStore>>;
  localStorage: Record<string, string>;
}

export interface ImportSummary {
  records: number;
  keys: number;
  /** Stores in the file that this build doesn't have, so nothing was written to them. */
  skipped: string[];
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** Structured-clone values that JSON can't hold are tagged `{ $t, … }`. */
export async function encodeValue(v: unknown): Promise<Encoded> {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') return v;
  if (v instanceof Date) return { $t: 'date', v: v.getTime() };
  if (v instanceof Blob) return { $t: 'blob', type: v.type, data: toBase64(new Uint8Array(await v.arrayBuffer())) };
  if (v instanceof ArrayBuffer) return { $t: 'buffer', data: toBase64(new Uint8Array(v)) };
  if (ArrayBuffer.isView(v)) return { $t: 'bytes', data: toBase64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
  if (Array.isArray(v)) return Promise.all(v.map(encodeValue));
  const out: Record<string, Encoded> = {};
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    if (x !== undefined) out[k] = await encodeValue(x);
  }
  return out;
}

export function decodeValue(v: Encoded): unknown {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(decodeValue);
  switch (v['$t']) {
    case 'date': return new Date(v['v'] as number);
    case 'blob': return new Blob([fromBase64(v['data'] as string)], { type: v['type'] as string });
    case 'buffer': return fromBase64(v['data'] as string).buffer;
    case 'bytes': return fromBase64(v['data'] as string);
  }
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) out[k] = decodeValue(x);
  return out;
}

/** Runs each store's own upgrade, so a backup holds, and lands in, this build's schema. */
async function openStores(): Promise<void> {
  await Promise.all([listPresets(), listProjects(), listPrints('')]);
}

async function printDatabases(): Promise<string[]> {
  const all = await indexedDB.databases();
  return all.map((d) => d.name ?? '').filter((n) => n.startsWith(PREFIX));
}

export async function exportBackup(): Promise<BackupFile> {
  await openStores();
  const databases: BackupFile['databases'] = {};
  for (const name of await printDatabases()) {
    const db = await openDB(name);
    const stores: Record<string, BackupStore> = {};
    for (const storeName of db.objectStoreNames) {
      const tx = db.transaction(storeName);
      const [keys, values] = await Promise.all([tx.store.getAllKeys(), tx.store.getAll()]);
      stores[storeName] = {
        ...(tx.store.keyPath === null ? { keys: await Promise.all(keys.map(encodeValue)) } : {}),
        values: await Promise.all(values.map(encodeValue)),
      };
    }
    db.close();
    databases[name] = stores;
  }
  const local: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX) && !LOCAL_ONLY.has(k)) local[k] = localStorage.getItem(k) ?? '';
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    origin: location.origin,
    databases,
    localStorage: local,
  };
}

export function parseBackup(text: string): BackupFile {
  const file = JSON.parse(text) as Partial<BackupFile>;
  if (file.format !== BACKUP_FORMAT) throw new Error('Not a 3d-gallery backup file.');
  if (typeof file.version !== 'number' || file.version > BACKUP_VERSION) {
    throw new Error(`This backup is format version ${String(file.version)}; this app reads up to ${BACKUP_VERSION}.`);
  }
  return file as BackupFile;
}

/**
 * Merges a backup into this browser: records with the same key are replaced,
 * everything else here is kept. Reload afterwards so every open page rereads.
 */
export async function importBackup(file: BackupFile): Promise<ImportSummary> {
  await openStores();
  const summary: ImportSummary = { records: 0, keys: 0, skipped: [] };
  for (const [name, stores] of Object.entries(file.databases)) {
    if (!name.startsWith(PREFIX)) continue;
    const db = await openDB(name);
    for (const [storeName, data] of Object.entries(stores)) {
      if (!db.objectStoreNames.contains(storeName)) {
        summary.skipped.push(`${name}/${storeName}`);
        continue;
      }
      const tx = db.transaction(storeName, 'readwrite');
      const outOfLine = tx.store.keyPath === null;
      await Promise.all(data.values.map((v, i) => {
        const value = decodeValue(v);
        return outOfLine ? tx.store.put(value, decodeValue(data.keys![i]) as IDBValidKey) : tx.store.put(value);
      }));
      await tx.done;
      summary.records += data.values.length;
    }
    db.close();
  }
  for (const [k, v] of Object.entries(file.localStorage)) {
    if (!k.startsWith(PREFIX) || LOCAL_ONLY.has(k)) continue;
    localStorage.setItem(k, v);
    summary.keys++;
  }
  return summary;
}

export function backupFilename(at: number): string {
  return `3d-gallery-backup-${new Date(at).toISOString().slice(0, 10)}.json`;
}
