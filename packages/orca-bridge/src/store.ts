// SPDX-License-Identifier: MIT
// Server-side store of gallery preset records.
//
// This is the one writable thing in this package, and it is deliberately not
// the Orca config — Orca stays read-only. What lives here are the gallery's
// *own* records, in exactly the shape `print-storage.ts` persists to IndexedDB,
// so the browser can upsert them verbatim.
//
// It exists because MCP runs in Node and the gallery's printer list lives in
// browser IndexedDB: neither can reach the other. This file is the handoff. It
// is also the seam the eventual SQLite backend replaces — callers only ever see
// `readStore` / `writeStore`.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type PresetKind = 'printer' | 'filament' | 'process';

/** Mirrors the gallery's `PrintPreset` minus `id`, which is derived. `raw` is
 *  the preset file as Orca wrote it and `parents` are snapshots of its chain,
 *  so a record is self-contained — it does not need the parent presets to
 *  exist anywhere — and still says which layer every value came from. */
export interface GalleryPreset {
  kind: PresetKind;
  name: string;
  raw: Record<string, unknown>;
  parents: Array<{ name: string; raw: Record<string, unknown> }>;
  /** Gallery edits over `raw`; see `PrintPreset.overrides` in the browser. */
  overrides?: Record<string, unknown>;
  address?: string;
  compatiblePrinters?: string[];
  /** Where this record came from, for provenance in the UI and in diffs. */
  source:
    | { kind: 'orca-preset'; presetName: string; chain: string[] }
    | { kind: 'orca-file'; fileName: string; importedAt: number }
    | { kind: 'orca-config'; path: string; importedAt: number }
    | { kind: 'manual' };
  /** When this copy was written — the browser's newer-wins sync compares it
   *  against its own record. */
  updatedAt?: number;
}

export interface GalleryStore {
  version: 1;
  presets: GalleryPreset[];
}

/** Built fresh on every call, never shared. A single module-level default
 *  object would be aliased by `readStore`'s miss path and then mutated by
 *  `upsertPreset`'s push, so an empty store would start returning whatever had
 *  been written since the process booted. */
function emptyStore(): GalleryStore {
  return { version: 1, presets: [] };
}

export function storePath(repoRoot: string): string {
  return join(repoRoot, '.cache', 'orca-bridge', 'gallery-presets.json');
}

export function readStore(repoRoot: string): GalleryStore {
  try {
    const parsed: unknown = JSON.parse(readFileSync(storePath(repoRoot), 'utf8'));
    if (!parsed || typeof parsed !== 'object') return emptyStore();
    const store = parsed as Partial<GalleryStore>;
    return { version: 1, presets: Array.isArray(store.presets) ? store.presets : [] };
  } catch {
    return emptyStore();
  }
}

function writeStore(repoRoot: string, store: GalleryStore): void {
  const path = storePath(repoRoot);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`);
}

/** Identity matches the browser's: `${kind}:${name}`. */
export function presetId(preset: Pick<GalleryPreset, 'kind' | 'name'>): string {
  return `${preset.kind}:${preset.name}`;
}

/** Insert or replace by kind+name. Returns whether an existing row was
 *  replaced, so callers can report "created" vs "updated" honestly. */
export function upsertPreset(
  repoRoot: string,
  preset: GalleryPreset,
): { preset: GalleryPreset; replaced: boolean } {
  const store = readStore(repoRoot);
  const id = presetId(preset);
  const index = store.presets.findIndex((p) => presetId(p) === id);
  const replaced = index >= 0;
  if (replaced) store.presets[index] = preset;
  else store.presets.push(preset);
  writeStore(repoRoot, store);
  return { preset, replaced };
}

/** Replace the whole store — the "export my local records to the server"
 *  direction. Deliberately a replace, not a merge: the browser is the source of
 *  truth for that action, and a merge would resurrect records the user deleted
 *  locally. */
export function replaceAll(repoRoot: string, presets: GalleryPreset[]): GalleryStore {
  const store: GalleryStore = { version: 1, presets };
  writeStore(repoRoot, store);
  return store;
}

/** Drop everything. The browser keeps its own copy — this only empties the
 *  server side, which is what "stop using the server" means. */
export function clearStore(repoRoot: string): { removed: number } {
  const removed = readStore(repoRoot).presets.length;
  writeStore(repoRoot, emptyStore());
  return { removed };
}

export function removePreset(repoRoot: string, kind: PresetKind, name: string): boolean {
  const store = readStore(repoRoot);
  const id = `${kind}:${name}`;
  const next = store.presets.filter((p) => presetId(p) !== id);
  if (next.length === store.presets.length) return false;
  writeStore(repoRoot, { ...store, presets: next });
  return true;
}
