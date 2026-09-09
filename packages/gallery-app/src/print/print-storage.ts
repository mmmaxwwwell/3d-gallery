// SPDX-License-Identifier: MIT
// Gallery-app-local IndexedDB namespace for print presets. Kept out of the
// toolkit's `BrowserStorageAdapter` (which is scoped to SCAD files) so this
// package can evolve its preset schema without touching the shared toolkit.
//
// DB name is prefixed `3dg:print:` to match the plan's request for
// namespacing and to make it obvious in devtools what's what.

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = '3dg:print:presets';
const DB_VERSION = 1;
const PRESETS_STORE = 'presets';

export type PresetKind = 'printer' | 'filament' | 'process';

export interface PrintPreset {
  /** Stable identifier: `${kind}:${name}`. */
  id: string;
  kind: PresetKind;
  name: string;
  /** Raw parsed config dict from the imported preset file. */
  config: Record<string, string>;
  /** Optional address for printer presets — Moonraker host:port or URL. */
  address?: string;
  updatedAt: number;
}

function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
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

export async function savePreset(preset: Omit<PrintPreset, 'id' | 'updatedAt'> & { id?: string }): Promise<PrintPreset> {
  const db = await getDb();
  const id = preset.id ?? `${preset.kind}:${preset.name}`;
  const record: PrintPreset = {
    id,
    kind: preset.kind,
    name: preset.name,
    config: preset.config,
    address: preset.address,
    updatedAt: Date.now(),
  };
  await db.put(PRESETS_STORE, record);
  return record;
}

export async function deletePreset(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(PRESETS_STORE, id);
}

export async function getPreset(id: string): Promise<PrintPreset | undefined> {
  const db = await getDb();
  return db.get(PRESETS_STORE, id);
}
