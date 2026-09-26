// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What libslic3r says each printer / filament setting is, and how to read and
// check a value of it the way Orca writes it to a preset file.
//
// The data itself is generated from an OrcaSlicer source tree — see
// scripts/gen-orca-schema.mjs. This file is the hand-written half: the types,
// and the rules for turning a preset's JSON value into editable cells and back.
//
// Orca's on-disk shapes, which every helper here preserves:
//   scalar options   → a string: "0.4", "1" / "0" for bools, "15%" for percents
//   vector options   → an array of strings, one per extruder / filament slot
//   nullable vectors → the element "nil" means "not set here, use the printer's"

export type OrcaOptionType =
  | 'float' | 'floats' | 'int' | 'ints' | 'string' | 'strings'
  | 'percent' | 'percents' | 'floatOrPercent' | 'floatsOrPercents'
  | 'point' | 'points' | 'point3' | 'pointsGroups'
  | 'bool' | 'bools' | 'enum' | 'enums' | 'none';

export type OrcaMode = 'simple' | 'advanced' | 'develop';

export interface OrcaOptionDef {
  type: OrcaOptionType;
  label?: string;
  fullLabel?: string;
  category?: string;
  tooltip?: string;
  /** Units, as Orca prints them beside the field ("mm", "°C", "mm/s"). */
  sidetext?: string;
  min?: number;
  max?: number;
  mode?: OrcaMode;
  enumValues?: string[];
  enumLabels?: string[];
  /** The value libslic3r uses when no preset in the chain sets one. */
  default?: string | string[];
  nullable?: boolean;
  multiline?: boolean;
  readonly?: boolean;
  fullWidth?: boolean;
  /** Orca's widget hint: `f_enum_open` is a combo that also takes free text,
   *  `one_string` a vector edited as one comma-separated line, etc. */
  guiType?: string;
}

export interface OrcaLayoutGroup {
  title: string;
  keys: string[];
}

export interface OrcaLayoutPage {
  title: string;
  groups: OrcaLayoutGroup[];
}

export interface OrcaKindSchema {
  /** Every key a preset of this kind owns, per Preset.cpp. */
  keys: string[];
  /** Printer keys that hold one value per extruder. */
  extruderKeys?: string[];
  /** Orca's settings-tab pages, in order, then an "Other" page for the rest. */
  layout: OrcaLayoutPage[];
}

export interface OrcaSchema {
  orcaVersion: string;
  options: Record<string, OrcaOptionDef>;
  kinds: { printer: OrcaKindSchema; filament: OrcaKindSchema };
}

/** Orca's marker for an unset element of a nullable vector. */
export const ORCA_NIL = 'nil';

const VECTOR_TYPES = new Set<OrcaOptionType>([
  'floats', 'ints', 'strings', 'percents', 'floatsOrPercents', 'points', 'bools', 'enums', 'pointsGroups',
]);

export function isVectorType(type: OrcaOptionType): boolean {
  return VECTOR_TYPES.has(type);
}

/** The scalar type each element of a vector option has. */
export function elementType(type: OrcaOptionType): OrcaOptionType {
  switch (type) {
    case 'floats': return 'float';
    case 'ints': return 'int';
    case 'strings': return 'string';
    case 'percents': return 'percent';
    case 'floatsOrPercents': return 'floatOrPercent';
    case 'points': return 'point';
    case 'bools': return 'bool';
    case 'enums': return 'enum';
    default: return type;
  }
}

/**
 * A preset value as a list of editable strings — one per vector element, or a
 * single cell for a scalar. Values that don't have Orca's usual shape (a bare
 * string where a vector belongs, a number from a hand-edited file) are coerced
 * rather than rejected, since they came from a file Orca itself accepted.
 */
export function toCells(value: unknown, type: OrcaOptionType): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    const cells = value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)));
    return isVectorType(type) ? cells : [cells.join(',')];
  }
  if (typeof value === 'object') return [JSON.stringify(value)];
  const s = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
  return [s];
}

/** Back from cells to the shape Orca writes: an array for vector options, a
 *  string for scalars. */
export function fromCells(cells: string[], type: OrcaOptionType): string | string[] {
  return isVectorType(type) ? [...cells] : cells[0] ?? '';
}

const NUMBER = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;
const INTEGER = /^[-+]?\d+$/;

function bounds(n: number, def: OrcaOptionDef): string | null {
  if (def.min !== undefined && n < def.min) return `Must be at least ${def.min}.`;
  if (def.max !== undefined && n > def.max) return `Must be at most ${def.max}.`;
  return null;
}

/**
 * Check one cell against its option's type and bounds. Returns an error
 * message, or null when libslic3r would accept the value.
 *
 * Bounds are checked only where Orca's own field would: `max` on a percent is
 * a percent, and a float-or-percent's bounds apply to the absolute form only,
 * because Orca's `max_literal` for the percent form isn't in the schema.
 */
export function validateCell(cell: string, def: OrcaOptionDef): string | null {
  const type = elementType(def.type);
  const v = cell.trim();
  if (def.nullable && v === ORCA_NIL) return null;
  switch (type) {
    case 'int':
      if (!INTEGER.test(v)) return 'Must be a whole number.';
      return bounds(Number(v), def);
    case 'float':
      if (!NUMBER.test(v)) return 'Must be a number.';
      return bounds(Number(v), def);
    case 'percent': {
      const n = v.endsWith('%') ? v.slice(0, -1) : v;
      if (!NUMBER.test(n)) return 'Must be a percentage, like 15%.';
      return bounds(Number(n), def);
    }
    case 'floatOrPercent': {
      if (v.endsWith('%')) return NUMBER.test(v.slice(0, -1)) ? null : 'Must be a number or a percentage.';
      if (!NUMBER.test(v)) return 'Must be a number or a percentage.';
      return bounds(Number(v), def);
    }
    case 'bool':
      return v === '0' || v === '1' ? null : 'Must be on or off.';
    case 'enum':
      return !def.enumValues || def.enumValues.includes(v) ? null : `Must be one of: ${def.enumValues.join(', ')}.`;
    case 'point':
      return /^\s*[-+]?[\d.]+\s*x\s*[-+]?[\d.]+\s*$/i.test(v) ? null : 'Must be a point, like 0x0.';
    default:
      return null;
  }
}

/** First error across every cell of a value, prefixed with the slot it's in
 *  when there's more than one. */
export function validateCells(cells: string[], def: OrcaOptionDef): string | null {
  for (let i = 0; i < cells.length; i++) {
    const err = validateCell(cells[i], def);
    if (err) return cells.length > 1 ? `#${i + 1}: ${err}` : err;
  }
  return null;
}

/** Percent cells are edited as bare numbers and stored with their "%". */
export function normalizeCell(cell: string, def: OrcaOptionDef): string {
  const v = cell.trim();
  if (elementType(def.type) === 'percent' && v !== ORCA_NIL && v !== '' && !v.endsWith('%')) return `${v}%`;
  return v;
}

/** Human form of a value for "was …" lines and change lists: enum labels
 *  instead of keys, on/off for bools, "use printer's" for nil. */
export function describeValue(value: unknown, def: OrcaOptionDef | undefined): string {
  if (value === undefined) return '—';
  if (!def) return typeof value === 'string' ? value : JSON.stringify(value);
  const cells = toCells(value, def.type);
  const type = elementType(def.type);
  const shown = cells.map((c) => {
    if (def.nullable && c === ORCA_NIL) return "printer's";
    if (type === 'bool') return c === '1' ? 'on' : c === '0' ? 'off' : c;
    if (type === 'enum' && def.enumValues && def.enumLabels) {
      const i = def.enumValues.indexOf(c);
      if (i >= 0) return def.enumLabels[i] ?? c;
    }
    return c;
  });
  const joined = shown.join(', ');
  return joined.length > 80 ? `${joined.slice(0, 77)}…` : joined || '(empty)';
}
