// SPDX-License-Identifier: MIT
// The user's Orca presets as the gallery's folder import would read them:
// each preset's own file plus its inheritance chain, verbatim, so the browser
// can store them exactly as if the person had picked ~/.config/OrcaSlicer in
// Settings → Import. Lets an agent do that import without a file picker.

import { indexPresets, relPath, resolvePreset, type PresetJson, type PresetKind } from './presets.ts';
import type { OrcaPaths } from './paths.ts';

/** Matches gallery-app's `ParsedPreset` (print/orca-import.ts). */
export interface GalleryImportRecord {
  kind: PresetKind;
  name: string;
  raw: PresetJson;
  parents: Array<{ name: string; raw: PresetJson }>;
  compatiblePrinters?: string[];
  address?: string;
  source: { kind: 'orca-config'; path: string; importedAt: number };
}

export interface GalleryImportInput {
  /** Only these kinds. Process presets are never imported: the gallery slices with its own templates. */
  kinds?: Array<'printer' | 'filament'>;
  /** Only presets with these exact names. */
  names?: string[];
}

export interface GalleryImportResult {
  records: GalleryImportRecord[];
  /** Names asked for that aren't user presets in this install. */
  notFound: string[];
  /** Presets whose chain stops at a parent that isn't on disk. */
  warnings: string[];
}

export function galleryImportRecords(paths: OrcaPaths, input: GalleryImportInput = {}): GalleryImportResult {
  const kinds: PresetKind[] = input.kinds?.length ? input.kinds : ['printer', 'filament'];
  const index = indexPresets(paths, kinds);
  const wanted = input.names?.length ? new Set(input.names) : null;
  const warnings: string[] = [];
  // Two Orca user profiles can hold a preset of the same name; the gallery
  // keys presets by kind + name, so only one can land. Keep the newest.
  const byName = new Map<string, (typeof index.refs)[number]>();
  for (const ref of index.refs) {
    if (ref.scope !== 'user' || (wanted && !wanted.has(ref.name))) continue;
    const key = `${ref.kind}\0${ref.name}`;
    const other = byName.get(key);
    if (!other) { byName.set(key, ref); continue; }
    const [keep, drop] = ref.modifiedAt > other.modifiedAt ? [ref, other] : [other, ref];
    byName.set(key, keep);
    warnings.push(`${ref.kind} "${ref.name}" is in two Orca profiles; kept ${relPath(paths, keep.path)}, skipped ${relPath(paths, drop.path)}.`);
  }
  const users = [...byName.values()];
  const now = Date.now();

  const records = users.map((ref): GalleryImportRecord => {
    const resolved = resolvePreset(paths, ref, index);
    for (const missing of resolved.missingParents) warnings.push(`${ref.name}: missing parent preset "${missing}".`);
    const merged = resolved.merged;
    const compatible = merged['compatible_printers'];
    const host = merged['print_host'];
    return {
      kind: ref.kind,
      name: ref.name,
      raw: resolved.raw,
      parents: resolved.chain.map((parent, i) => ({ name: parent.name, raw: resolved.parentRaws[i] ?? {} })),
      ...(Array.isArray(compatible) ? { compatiblePrinters: compatible.map(String).filter(Boolean) } : {}),
      ...(ref.kind === 'printer' && typeof host === 'string' && host.trim() ? { address: host.trim() } : {}),
      source: { kind: 'orca-config', path: relPath(paths, ref.path), importedAt: now },
    };
  });

  const found = new Set(records.map((r) => r.name));
  return {
    records,
    notFound: wanted ? [...wanted].filter((n) => !found.has(n)) : [],
    warnings,
  };
}
