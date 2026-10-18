// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The slice config for a Bambu printer with an AMS: Bambu's machine preset
 * and one filament preset per slot, as libslic3r's flat config.
 *
 * Separate from bambu.ts because it reads Orca's option table (~100 kB) to
 * serialise each value the way libslic3r parses it; import it lazily.
 *
 * Pure: no DOM, no fetch.
 */

import { ORCA_SCHEMA } from './orca-schema.generated.js';
import { bedTemperatureProblem } from './bed-type.js';

type OrcaValue = null | boolean | number | string | OrcaValue[] | { [k: string]: OrcaValue };
export type OrcaPresetJson = { [k: string]: OrcaValue };

// ── Orca config serialisation ────────────────────────────

// Every vector but strings: libslic3r splits these on ',' and reads enums unquoted.
const COMMA_VECTORS = new Set(['floats', 'ints', 'percents', 'floatsOrPercents', 'bools', 'points', 'enums']);

/** Orca's escape_strings_cstyle: `;`-separated, quoted when a value needs it. */
function escapeStrings(values: string[]): string {
  return values.map((s) => {
    const quote = (values.length === 1 && s === '') || /[ \t\\"\r\n;]/.test(s);
    if (!quote) return s;
    return `"${s.replace(/[\\"]/g, (c) => `\\${c}`).replace(/\r/g, '\\r').replace(/\n/g, '\\n')}"`;
  }).join(';');
}

function cell(value: OrcaValue): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * One preset value as the string libslic3r's `set_deserialize` reads: numeric
 * and point vectors comma-separated, string vectors escaped and `;`-separated,
 * scalars as they are. A key the schema doesn't know is read as numbers when
 * every element is one, else as strings.
 */
export function orcaConfigValue(key: string, value: OrcaValue): string | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return typeof value === 'object' ? JSON.stringify(value) : String(value);
  const cells = value.map(cell);
  const type = ORCA_SCHEMA.options[key]?.type;
  const numeric = type ? COMMA_VECTORS.has(type) : cells.every((c) => /^-?[\d.]+(%|x-?[\d.]+)?$/.test(c));
  return numeric ? cells.join(',') : escapeStrings(cells);
}

/** A merged preset as the slicer's flat config. */
export function orcaConfigFromJson(json: OrcaPresetJson): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(json)) {
    const s = orcaConfigValue(key, value);
    if (s !== null) out[key] = s;
  }
  return out;
}

// ── Multi-filament slice config ──────────────────────────

const FILAMENT_KEYS = new Set(ORCA_SCHEMA.kinds.filament.keys);
/** Orca's default purge between two filaments, mm³, for a matrix the profile doesn't size. */
const DEFAULT_FLUSH_MM3 = 280;

export interface BambuSliceInput {
  /** The printer preset, inheritance merged. */
  printer: OrcaPresetJson;
  /** One merged filament preset per slot, slot 1 first. */
  filaments: OrcaPresetJson[];
  /** `#RRGGBB` per slot. */
  colors: string[];
  /** The plate on the bed, as libslic3r names it (`curr_bed_type`): "Textured PEI Plate", … */
  bedType: string;
}

function asCells(value: OrcaValue | undefined): string[] | null {
  if (value === undefined || value === null) return null;
  return Array.isArray(value) ? value.map(cell) : [cell(value)];
}

/**
 * The machine + filament part of a slice for a Bambu printer with an AMS: the
 * printer preset as it stands, and every filament setting as one value per
 * slot. Process settings go over the top of this, as for any printer.
 */
export function bambuSliceConfig(input: BambuSliceInput): Record<string, string> {
  const { printer, filaments, colors, bedType } = input;
  if (filaments.length === 0) throw new Error('A slice needs at least one filament.');
  if (colors.length !== filaments.length) throw new Error('One colour per filament slot.');
  const cold = bedTemperatureProblem(bedType, filaments.map((f, i) => ({
    name: String(f['name'] ?? `Filament ${i + 1}`),
    config: orcaConfigFromJson(f),
  })));
  if (cold) throw new Error(cold);
  const config = orcaConfigFromJson(printer);

  const keys = new Set<string>();
  for (const f of filaments) for (const k of Object.keys(f)) if (FILAMENT_KEYS.has(k)) keys.add(k);
  for (const key of keys) {
    const perSlot = filaments.map((f) => asCells(f[key]));
    const fallback = perSlot.find((c) => c !== null);
    if (!fallback) continue;
    // A preset that leaves a key out gets the first slot's value for it, so
    // every vector is exactly one element per slot.
    const joined = orcaConfigValue(key, perSlot.flatMap((c) => (c ?? fallback).slice(0, 1)));
    if (joined !== null) config[key] = joined;
  }
  config['filament_colour'] = escapeStrings(colors.map((c) => c.toUpperCase()));
  config['curr_bed_type'] = bedType;

  const n = filaments.length;
  config['flush_volumes_matrix'] = Array.from({ length: n * n }, (_, i) =>
    (Math.floor(i / n) === i % n ? 0 : DEFAULT_FLUSH_MM3)).join(',');
  config['flush_volumes_vector'] = Array(n * 2).fill('140').join(',');

  // Bambu's layer G-code relies on the firmware for extruder bookkeeping, and
  // libslic3r skips its "reset E each layer" check only for printers the GUI
  // marks as Bambu — which the WASM build can't. G92 E0 before each layer is
  // a no-op for Bambu's relative extrusion and satisfies the check.
  const before = config['before_layer_change_gcode'] ?? '';
  if (!/^\s*G92 E0\b/m.test(before) && !/^\s*G92 E0\b/m.test(config['layer_change_gcode'] ?? '')) {
    config['before_layer_change_gcode'] = before ? `${before}\nG92 E0` : 'G92 E0';
  }
  return config;
}
