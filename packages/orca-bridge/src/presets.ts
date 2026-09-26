// SPDX-License-Identifier: MIT
// Preset enumeration and inheritance resolution against an Orca install.
//
// Orca stores a preset as a sparse JSON of just the fields the author
// overrode, plus an `inherits` pointer. The interesting question for
// reconciliation is never "what are this preset's 600 values" but "which
// values did a human actually choose" — so resolution reports both the
// merged result and the override set that produced it.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';
import type { OrcaPaths } from './paths.ts';

export type PresetKind = 'printer' | 'filament' | 'process';
export type PresetScope = 'user' | 'system';

/** Orca's on-disk dir name per kind. */
const DIR_BY_KIND: Record<PresetKind, string> = {
  printer: 'machine',
  filament: 'filament',
  process: 'process',
};

export interface PresetRef {
  kind: PresetKind;
  name: string;
  path: string;
  scope: PresetScope;
  /** Vendor dir for system presets (`system/<Vendor>/…`). */
  vendor?: string;
  /** Orca profile id for user presets (`user/<id>/…`). */
  profile?: string;
  modifiedAt: string;
}

export type PresetJson = Record<string, unknown>;

export type DiffKind = 'added' | 'changed' | 'removed';

export interface FieldDiff {
  key: string;
  kind: DiffKind;
  /** Inherited/base value. Undefined when the field is newly added. */
  from?: unknown;
  /** This preset's value. Undefined when the field was removed. */
  to?: unknown;
}

export interface ResolvedPreset {
  ref: PresetRef;
  /** The file's own keys, verbatim. */
  raw: PresetJson;
  /** Inheritance chain, immediate parent first, root last. */
  chain: PresetRef[];
  /** Chain merged root-first with descendants winning; `inherits` dropped. */
  merged: PresetJson;
  /** What `raw` actually changes relative to the inherited base. */
  overrides: FieldDiff[];
  /** Named parents that could not be found on disk. */
  missingParents: string[];
  /** Each chain entry's JSON, verbatim — immediate parent first, like `chain`. */
  parentRaws: PresetJson[];
}

/** Bookkeeping keys that say nothing about how a thing prints. Excluded from
 *  override reporting and field scoring so they can't inflate a match. */
export const METADATA_KEYS = new Set([
  'name', 'from', 'inherits', 'instantiation', 'version', 'type',
  'setting_id', 'printer_settings_id', 'filament_settings_id', 'print_settings_id',
  'filament_id', 'is_custom_defined', 'renamed_from',
]);

function readJson(path: string): PresetJson | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as PresetJson)
      : null;
  } catch {
    return null;
  }
}

function walkJson(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const entry of entries) {
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walkJson(full, out);
    else if (entry.toLowerCase().endsWith('.json')) out.push(full);
  }
  return out;
}

function nameOf(json: PresetJson, path: string): string {
  const n = json['name'];
  if (typeof n === 'string' && n.trim()) return n.trim();
  return basename(path).replace(/\.json$/i, '');
}

function mtime(path: string): string {
  try { return statSync(path).mtime.toISOString(); } catch { return ''; }
}

/** Vendor bundles list other presets rather than being one. */
function isVendorBundle(json: PresetJson): boolean {
  return (
    Array.isArray(json['machine_list']) ||
    Array.isArray(json['filament_list']) ||
    Array.isArray(json['process_list']) ||
    Array.isArray(json['machine_model_list'])
  );
}

function scanKind(paths: OrcaPaths, kind: PresetKind): PresetRef[] {
  const dirName = DIR_BY_KIND[kind];
  const refs: PresetRef[] = [];

  for (const userDir of paths.userDirs) {
    for (const file of walkJson(join(userDir, dirName))) {
      const json = readJson(file);
      if (!json || isVendorBundle(json)) continue;
      refs.push({
        kind,
        name: nameOf(json, file),
        path: file,
        scope: 'user',
        profile: basename(userDir),
        modifiedAt: mtime(file),
      });
    }
  }

  // system/<Vendor>/<dirName>/**.json
  let vendors: string[];
  try { vendors = readdirSync(paths.systemDir); } catch { vendors = []; }
  for (const vendor of vendors) {
    const kindDir = join(paths.systemDir, vendor, dirName);
    for (const file of walkJson(kindDir)) {
      const json = readJson(file);
      if (!json || isVendorBundle(json)) continue;
      refs.push({
        kind,
        name: nameOf(json, file),
        path: file,
        scope: 'system',
        vendor,
        modifiedAt: mtime(file),
      });
    }
  }
  return refs;
}

export interface PresetIndex {
  refs: PresetRef[];
  /** `kind\0name` → ref. User presets shadow system ones of the same name. */
  byName: Map<string, PresetRef>;
}

export function indexPresets(paths: OrcaPaths, kinds?: PresetKind[]): PresetIndex {
  const wanted = kinds?.length ? kinds : (['printer', 'filament', 'process'] as PresetKind[]);
  const refs = wanted.flatMap((k) => scanKind(paths, k));
  const byName = new Map<string, PresetRef>();
  for (const ref of refs) {
    const key = `${ref.kind}\0${ref.name}`;
    const existing = byName.get(key);
    // A user preset of the same name is the one Orca shows.
    if (!existing || (ref.scope === 'user' && existing.scope === 'system')) byName.set(key, ref);
  }
  return { refs, byName };
}

/** Stable JSON compare — Orca values are arrays, numbers, strings, nested
 *  objects. Key order never carries meaning. */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  return stableString(a) === stableString(b);
}

function stableString(v: unknown): string {
  if (v === null || v === undefined) return String(v);
  if (Array.isArray(v)) return `[${v.map(stableString).join(',')}]`;
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>).sort(([x], [y]) =>
      x < y ? -1 : x > y ? 1 : 0,
    );
    return `{${entries.map(([k, val]) => `${k}:${stableString(val)}`).join(',')}}`;
  }
  return JSON.stringify(v) ?? String(v);
}

/** Field-level diff of `to` against `from`. Metadata keys are skipped. */
export function diffFields(
  from: PresetJson,
  to: PresetJson,
  opts: { includeMetadata?: boolean } = {},
): FieldDiff[] {
  const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
  const diffs: FieldDiff[] = [];
  for (const key of [...keys].sort()) {
    if (!opts.includeMetadata && METADATA_KEYS.has(key)) continue;
    const inFrom = key in from;
    const inTo = key in to;
    if (inFrom && inTo) {
      if (!sameValue(from[key], to[key])) {
        diffs.push({ key, kind: 'changed', from: from[key], to: to[key] });
      }
    } else if (inTo) {
      diffs.push({ key, kind: 'added', to: to[key] });
    } else {
      diffs.push({ key, kind: 'removed', from: from[key] });
    }
  }
  return diffs;
}

/** Merge a chain root-first so descendants win. Mirrors what the gallery's
 *  `mergeInheritance` does for stored presets. */
function mergeChain(layers: PresetJson[]): PresetJson {
  const merged: PresetJson = {};
  for (let i = layers.length - 1; i >= 0; i--) Object.assign(merged, layers[i]);
  delete merged['inherits'];
  return merged;
}

const MAX_CHAIN = 12;

export function resolvePreset(
  paths: OrcaPaths,
  ref: PresetRef,
  index?: PresetIndex,
): ResolvedPreset {
  const idx = index ?? indexPresets(paths, [ref.kind]);
  const raw = readJson(ref.path) ?? {};
  const chain: PresetRef[] = [];
  const layers: PresetJson[] = [raw];
  const missingParents: string[] = [];
  const seen = new Set<string>([ref.name]);

  let cursor = raw;
  while (chain.length < MAX_CHAIN) {
    const parentName = cursor['inherits'];
    if (typeof parentName !== 'string' || !parentName.trim()) break;
    if (seen.has(parentName)) {
      missingParents.push(`${parentName} (inheritance cycle)`);
      break;
    }
    seen.add(parentName);
    const parentRef = idx.byName.get(`${ref.kind}\0${parentName}`);
    if (!parentRef) {
      missingParents.push(parentName);
      break;
    }
    const parentJson = readJson(parentRef.path);
    if (!parentJson) {
      missingParents.push(parentName);
      break;
    }
    chain.push(parentRef);
    layers.push(parentJson);
    cursor = parentJson;
  }

  const inheritedBase = mergeChain(layers.slice(1));
  return {
    ref,
    raw,
    chain,
    merged: mergeChain(layers),
    // Only keys this file declares count as overrides. A key it omits is
    // inherited, not removed — Orca has no way to negate an inherited field,
    // so `removed` diffs here would just be the rest of the parent restated.
    overrides: diffFields(inheritedBase, raw).filter((d) => d.kind !== 'removed'),
    missingParents,
    parentRaws: layers.slice(1),
  };
}

/** Look up by kind + name, preferring the user copy. */
export function findPreset(
  paths: OrcaPaths,
  kind: PresetKind,
  name: string,
  index?: PresetIndex,
): PresetRef | null {
  const idx = index ?? indexPresets(paths, [kind]);
  return idx.byName.get(`${kind}\0${name}`) ?? null;
}

/** Path relative to the config root — friendlier in tool output. */
export function relPath(paths: OrcaPaths, path: string): string {
  const rel = relative(paths.root, path);
  return rel.startsWith(`..${sep}`) ? path : rel;
}
