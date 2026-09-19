// SPDX-License-Identifier: MIT
// IndexedDB storage for Orca-style print presets, but preserving the ORIGINAL
// JSON structure (arrays, types, unknown fields) plus the inheritance chain
// verbatim. Old flat-`Record<string,string>` schema was lossy — no round-trip
// back to Orca, no distinction between "user override" and "inherited", and
// unknown fields we didn't grok at import time were silently reshaped into
// strings.

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = '3dg:print:presets';
// v2: raw + parents schema. On upgrade from v1 we drop the old store — users
// re-import their Orca config once. The old flat dicts weren't recoverable
// into typed JSON without guessing what was originally an array vs a string.
const DB_VERSION = 2;
const PRESETS_STORE = 'presets';

export type PresetKind = 'printer' | 'filament' | 'process';

/** Superset of every value shape that appears in OrcaSlicer preset JSON. */
export type OrcaValue = null | boolean | number | string | OrcaValue[] | { [k: string]: OrcaValue };
export type OrcaJson = { [k: string]: OrcaValue };

export interface OrcaParent {
  /** Name of the parent preset (from its `name` field or filename). */
  name: string;
  /** Raw JSON snapshot of the parent, verbatim. */
  raw: OrcaJson;
}

export interface PrintPreset {
  /** Stable identifier: `${kind}:${name}`. */
  id: string;
  kind: PresetKind;
  name: string;
  /** User's raw JSON as it appeared in the imported file — only the fields
   *  they overrode from the base preset. Round-trip target for export. */
  raw: OrcaJson;
  /** Inheritance chain: immediate parent first, root last. Snapshotted at
   *  import time — parents are never re-fetched from disk. */
  parents: OrcaParent[];
  /** Extracted for the "Send to printer" dropdown (from `print_host`). */
  address?: string;
  /** Extracted for compat filtering. Empty or absent → universal. */
  compatiblePrinters?: string[];
  updatedAt: number;
}

function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // v1 → v2: schema is incompatible (flat dict → raw + parents). Drop
      // the old store; the SettingsPanel surfaces a one-time re-import notice.
      if (oldVersion < 2 && db.objectStoreNames.contains(PRESETS_STORE)) {
        db.deleteObjectStore(PRESETS_STORE);
      }
      if (!db.objectStoreNames.contains(PRESETS_STORE)) {
        const store = db.createObjectStore(PRESETS_STORE, { keyPath: 'id' });
        store.createIndex('byKind', 'kind', { unique: false });
      }
    },
  });
}

export async function listPresets(kind?: PresetKind): Promise<PrintPreset[]> {
  const db = await getDb();
  if (!kind) {
    const all: PrintPreset[] = await db.getAll(PRESETS_STORE);
    return all.sort((a, b) => a.name.localeCompare(b.name));
  }
  const tx = db.transaction(PRESETS_STORE, 'readonly');
  const index = tx.store.index('byKind');
  const rows: PrintPreset[] = await index.getAll(IDBKeyRange.only(kind));
  await tx.done;
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export async function savePreset(
  preset: Omit<PrintPreset, 'id' | 'updatedAt'> & { id?: string },
): Promise<PrintPreset> {
  const db = await getDb();
  const id = preset.id ?? `${preset.kind}:${preset.name}`;
  const record: PrintPreset = {
    id,
    kind: preset.kind,
    name: preset.name,
    raw: preset.raw,
    parents: preset.parents,
    address: preset.address,
    compatiblePrinters: preset.compatiblePrinters,
    updatedAt: Date.now(),
  };
  await db.put(PRESETS_STORE, record);
  return record;
}

export async function deletePresetsByKind(kind: PresetKind): Promise<number> {
  const db = await getDb();
  const tx = db.transaction(PRESETS_STORE, 'readwrite');
  const index = tx.store.index('byKind');
  let deleted = 0;
  let cursor = await index.openCursor(IDBKeyRange.only(kind));
  while (cursor) {
    await cursor.delete();
    deleted++;
    cursor = await cursor.continue();
  }
  await tx.done;
  return deleted;
}

export async function deletePreset(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(PRESETS_STORE, id);
}

export async function getPreset(id: string): Promise<PrintPreset | undefined> {
  const db = await getDb();
  return db.get(PRESETS_STORE, id);
}
