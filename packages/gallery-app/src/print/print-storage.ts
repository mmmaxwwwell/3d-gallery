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

/** Where a preset's `raw` came from. Kept so the editor can say what a value
 *  started as and who put it there. Absent on records saved before provenance
 *  was tracked. */
export type PresetSource =
  /** A single `.orca_*` / `.json` file picked in the Import tab. */
  | { kind: 'orca-file'; fileName: string; importedAt: number }
  /** A preset found while walking a picked OrcaSlicer config folder. */
  | { kind: 'orca-config'; path: string; importedAt: number }
  /** Copied in by the orca-bridge (MCP / CLI) from the local Orca install. */
  | { kind: 'orca-preset'; presetName: string; chain: string[] }
  | { kind: 'manual' };

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
  /** Edits made in the gallery, layered over `raw`. `raw` itself is never
   *  edited, so it stays the file as imported and every override can say what
   *  it replaced. Values keep Orca's on-disk shape (strings, string arrays).
   *  Absent or empty: the preset is exactly as imported. */
  overrides?: OrcaJson;
  source?: PresetSource;
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
    overrides: preset.overrides && Object.keys(preset.overrides).length ? preset.overrides : undefined,
    source: preset.source,
    address: preset.address,
    compatiblePrinters: preset.compatiblePrinters,
    updatedAt: Date.now(),
  };
  await db.put(PRESETS_STORE, record);
  return record;
}

/**
 * Save a freshly imported (or synced) preset without losing the gallery edits
 * already made to it. Re-importing refreshes `raw` and the parent chain — the
 * file may have changed in Orca — but overrides are the user's own work and
 * outlive any number of re-imports. Pass `overrides` to replace them instead.
 */
export async function importPreset(
  preset: Omit<PrintPreset, 'id' | 'updatedAt'>,
): Promise<PrintPreset> {
  const existing = await getPreset(`${preset.kind}:${preset.name}`);
  return savePreset({ ...preset, overrides: preset.overrides ?? existing?.overrides });
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
