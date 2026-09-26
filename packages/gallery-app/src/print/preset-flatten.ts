// SPDX-License-Identifier: MIT
// Given a stored preset (raw + inheritance chain), produce the flat
// `Record<string, string>` dict the WASM slicer expects, or the merged
// JSON blob that Orca can re-import as a self-contained preset.

import type { OrcaJson, OrcaValue, PrintPreset } from './print-storage.js';

/** Merge inheritance chain into a single JSON object. Root parent first,
 *  then the preset's own file, then gallery edits — each layer wins over the
 *  ones before it. Drops the `inherits` marker since it's meaningless once
 *  resolved. */
export function mergeInheritance(preset: PrintPreset): OrcaJson {
  const merged: OrcaJson = {};
  for (let i = preset.parents.length - 1; i >= 0; i--) {
    Object.assign(merged, preset.parents[i].raw);
  }
  Object.assign(merged, preset.raw, preset.overrides);
  delete merged['inherits'];
  return merged;
}

/** Convert one Orca JSON value to the string form the CLI/WASM slicer's
 *  config loader expects. Arrays are joined with `;` (Orca's config-file
 *  separator for string-list options); nested objects fall back to JSON. */
function stringifyValue(value: OrcaValue): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map((v) => stringifyValue(v) ?? '').join(';');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Merge inheritance and produce the flat string dict for the slicer. */
export function flattenPresetForSlicer(preset: PrintPreset): Record<string, string> {
  const merged = mergeInheritance(preset);
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(merged)) {
    const s = stringifyValue(value);
    if (s !== null) out[key] = s;
  }
  return out;
}

/** Serialize the user's own fields for export: the imported file with the
 *  gallery's edits applied — what Orca would have saved had the edits been
 *  made there. Round-trip: reopen in Orca as long as the referenced parent
 *  exists in the user's Orca install. */
export function exportRawJson(preset: PrintPreset): string {
  return JSON.stringify({ ...preset.raw, ...preset.overrides }, null, 2);
}

/** Serialize the merged (inheritance-resolved) JSON — self-contained,
 *  doesn't depend on the parent preset existing anywhere. Bigger file but
 *  portable. */
export function exportMergedJson(preset: PrintPreset): string {
  return JSON.stringify(mergeInheritance(preset), null, 2);
}

/** Suggested filename for a downloaded preset. */
export function exportFilename(preset: PrintPreset, variant: 'raw' | 'merged'): string {
  const safe = preset.name.replace(/[^A-Za-z0-9._-]+/g, '_');
  const ext =
    preset.kind === 'printer' ? 'orca_printer' :
    preset.kind === 'filament' ? 'orca_filament' :
    'orca_process';
  const suffix = variant === 'merged' ? '.merged' : '';
  return `${safe}${suffix}.${ext}`;
}
