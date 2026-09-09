// SPDX-License-Identifier: MIT
// Best-effort parser for OrcaSlicer preset bundles. Real Orca `.orca_printer`
// / `.orca_filament` / `.orca_process` files are JSON documents; older
// PrusaSlicer-style presets are INI-style key=value text. We try JSON first,
// fall back to INI. Vendored bundle (.zip) support is intentionally deferred
// until the toolkit exposes a canonical parser — for now we surface an error
// so the user isn't silently importing garbage.

import type { PresetKind } from './print-storage.js';

export interface ParsedPreset {
  kind: PresetKind;
  name: string;
  config: Record<string, string>;
}

const KIND_BY_EXT: Record<string, PresetKind> = {
  '.orca_printer': 'printer',
  '.orca_filament': 'filament',
  '.orca_process': 'process',
  '.ini': 'process', // legacy PrusaSlicer-style — best guess
};

function extOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

function baseNameOf(filename: string): string {
  const noPath = filename.split(/[/\\]/).pop() ?? filename;
  const dot = noPath.lastIndexOf('.');
  return dot > 0 ? noPath.slice(0, dot) : noPath;
}

function parseIniPreset(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';') || line.startsWith('[')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

/** Flatten any JSON-encoded values to the string form OrcaSlicer's config
 *  loader expects. Arrays are joined with `;` since Orca uses that separator
 *  for string list options; nested objects are stringified so nothing gets
 *  silently dropped. */
function flattenJsonPreset(obj: unknown): Record<string, string> {
  if (!obj || typeof obj !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      out[key] = value.map((v) => String(v)).join(';');
    } else if (typeof value === 'object') {
      out[key] = JSON.stringify(value);
    } else {
      out[key] = String(value);
    }
  }
  return out;
}

export function parseOrcaPresetFile(filename: string, text: string): ParsedPreset {
  const ext = extOf(filename);
  const kind = KIND_BY_EXT[ext];
  if (!kind) {
    throw new Error(
      `Unsupported preset file "${filename}". Expected one of: .orca_printer, .orca_filament, .orca_process.`,
    );
  }

  const trimmed = text.trimStart();
  let config: Record<string, string> = {};
  let name = baseNameOf(filename);

  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    config = flattenJsonPreset(parsed);
    // Orca preset JSON usually carries a "name" field; prefer it over the filename.
    if (typeof parsed.name === 'string' && parsed.name.trim()) name = parsed.name.trim();
  } else {
    config = parseIniPreset(text);
    // PrusaSlicer INI style sometimes labels the preset in a `[preset_name]`
    // header; parseIniPreset ignores headers, so fall back to filename.
    if (typeof config['name'] === 'string' && config['name'].trim()) name = config['name'].trim();
  }

  if (Object.keys(config).length === 0) {
    throw new Error(`Preset "${filename}" parsed as empty — file may be a bundle (.zip) or unsupported format.`);
  }

  return { kind, name, config };
}
