// SPDX-License-Identifier: MIT
//
// The model behind the preset editor: for any field of a stored printer or
// filament preset, what its value is, which layer it came from, and what it
// was before the gallery changed it.
//
// A preset's value is decided by four layers, last one wins:
//
//   slicer default  →  parents (root … immediate)  →  raw (the imported file)  →  overrides
//
// The editor only ever writes the last layer. Everything under it is kept as
// imported, which is what lets it show "was 0.8 from Flashforge Adventurer 5M"
// next to an edited retraction length, and put it back with one click.

import type { OrcaKindSchema, OrcaLayoutPage, OrcaMode, OrcaOptionDef, OrcaSchema } from '@3d-gallery/print-toolkit/orca-schema';
import type { OrcaJson, OrcaValue, PrintPreset } from './print-storage.js';

/** Where a field's value came from. */
export type Origin =
  | { layer: 'override' }
  | { layer: 'file' }
  | { layer: 'parent'; name: string }
  | { layer: 'default' }
  | { layer: 'unset' };

export interface FieldState {
  /** What the slicer will be handed, draft edits included. */
  value: OrcaValue | undefined;
  origin: Origin;
  /** The value with the gallery's override taken away — what it started at. */
  base: OrcaValue | undefined;
  baseOrigin: Origin;
  overridden: boolean;
}

/** Bookkeeping fields that name or identify a preset rather than configure
 *  it. Not editable here: the record's name is its identity. */
export const METADATA_KEYS = new Set([
  'name', 'from', 'inherits', 'instantiation', 'version', 'type', 'setting_id',
  'printer_settings_id', 'filament_settings_id', 'print_settings_id',
  'filament_id', 'is_custom_defined', 'renamed_from', 'base_id',
]);

export function sameValue(a: OrcaValue | undefined, b: OrcaValue | undefined): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** The value a field would have without any gallery edit. */
function baseOf(preset: PrintPreset, key: string, def: OrcaOptionDef | undefined): Pick<FieldState, 'base' | 'baseOrigin'> {
  if (key in preset.raw) return { base: preset.raw[key], baseOrigin: { layer: 'file' } };
  for (const parent of preset.parents) {
    if (key in parent.raw) return { base: parent.raw[key], baseOrigin: { layer: 'parent', name: parent.name } };
  }
  if (def?.default !== undefined) return { base: def.default, baseOrigin: { layer: 'default' } };
  return { base: undefined, baseOrigin: { layer: 'unset' } };
}

export function resolveField(
  preset: PrintPreset,
  overrides: OrcaJson,
  key: string,
  def: OrcaOptionDef | undefined,
): FieldState {
  const { base, baseOrigin } = baseOf(preset, key, def);
  if (key in overrides) {
    return { value: overrides[key], origin: { layer: 'override' }, base, baseOrigin, overridden: true };
  }
  return { value: base, origin: baseOrigin, base, baseOrigin, overridden: false };
}

/**
 * Set a field. Writing back the value it started at drops the override
 * instead of storing a no-op one, so "changed" always means changed.
 */
export function setOverride(
  preset: PrintPreset,
  overrides: OrcaJson,
  key: string,
  value: OrcaValue,
  def: OrcaOptionDef | undefined,
): OrcaJson {
  const next = { ...overrides };
  if (sameValue(value, baseOf(preset, key, def).base)) delete next[key];
  else next[key] = value;
  return next;
}

export function clearOverride(overrides: OrcaJson, key: string): OrcaJson {
  const next = { ...overrides };
  delete next[key];
  return next;
}

export interface Change {
  key: string;
  def: OrcaOptionDef | undefined;
  from: OrcaValue | undefined;
  fromOrigin: Origin;
  to: OrcaValue;
}

export function listChanges(preset: PrintPreset, overrides: OrcaJson, schema: OrcaSchema): Change[] {
  return Object.keys(overrides).sort().map((key) => {
    const def = schema.options[key];
    const { base, baseOrigin } = baseOf(preset, key, def);
    return { key, def, from: base, fromOrigin: baseOrigin, to: overrides[key] };
  });
}

/** Keys the preset carries (in any layer) that the schema doesn't list for its
 *  kind: fields from another Orca version, or a vendor file carrying keys of
 *  another kind. They still reach the slicer, so they stay editable — as text. */
export function unrecognisedKeys(preset: PrintPreset, overrides: OrcaJson, kind: OrcaKindSchema): string[] {
  const own = new Set(kind.keys);
  const seen = new Set<string>();
  for (const layer of [overrides, preset.raw, ...preset.parents.map((p) => p.raw)]) {
    for (const key of Object.keys(layer)) {
      if (!own.has(key) && !METADATA_KEYS.has(key)) seen.add(key);
    }
  }
  return [...seen].sort();
}

const MODE_RANK: Record<OrcaMode, number> = { simple: 0, advanced: 1, develop: 2 };

export interface PageFilter {
  /** Show options up to this Orca mode (Orca's Simple / Advanced / Developer). */
  mode: OrcaMode;
  query: string;
  changedOnly: boolean;
}

/**
 * The layout pages trimmed to what the filter lets through, with empty groups
 * and pages removed. A search matches the key, the label, or the tooltip, and
 * shows matching fields regardless of mode — someone searching for a setting
 * wants to find it.
 */
export function filterLayout(
  pages: OrcaLayoutPage[],
  schema: OrcaSchema,
  filter: PageFilter,
  isChanged: (key: string) => boolean,
): OrcaLayoutPage[] {
  const q = filter.query.trim().toLowerCase();
  const keep = (key: string): boolean => {
    const def = schema.options[key];
    if (filter.changedOnly && !isChanged(key)) return false;
    if (q) {
      return [key, def?.label, def?.fullLabel, def?.tooltip]
        .some((s) => s?.toLowerCase().includes(q));
    }
    // Options Orca leaves unmarked default to its Simple mode.
    return MODE_RANK[def?.mode ?? 'simple'] <= MODE_RANK[filter.mode] || isChanged(key);
  };
  return pages
    .map((p) => ({ ...p, groups: p.groups.map((g) => ({ ...g, keys: g.keys.filter(keep) })).filter((g) => g.keys.length) }))
    .filter((p) => p.groups.length);
}

/** One line on where the preset itself came from. */
export function describeSource(preset: PrintPreset): string {
  const s = preset.source;
  const when = (at: number) => new Date(at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  switch (s?.kind) {
    case 'orca-file': return `Imported from ${s.fileName} on ${when(s.importedAt)}`;
    case 'orca-config': return `Imported from your Orca config (${s.path}) on ${when(s.importedAt)}`;
    case 'orca-preset': return `Copied from Orca preset “${s.presetName}” by the Orca bridge`;
    case 'manual': return 'Added by hand';
    default: return 'Imported before provenance was recorded';
  }
}

/** Short label for an origin, for the badge beside a field. */
export function describeOrigin(origin: Origin): string {
  switch (origin.layer) {
    case 'override': return 'edited';
    case 'file': return 'this preset';
    case 'parent': return origin.name;
    case 'default': return 'Orca default';
    case 'unset': return 'not set';
  }
}
