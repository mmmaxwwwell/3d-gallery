// SPDX-License-Identifier: MIT
//
// Human-readable readouts of what a printer or filament preset actually says.
//
// The plate editor picks presets by name, which tells you nothing about the
// hardware or the plastic — whether the nozzle can take an abrasive, how fast
// the filament can be pushed, what the bed will actually be heated to for the
// plate you have installed. These are the fields worth seeing before slicing,
// pulled from the same flattened config the slicer is handed, so a readout
// here and the g-code cannot disagree.
//
// Every row is omitted when its field is absent: presets vary by vendor, and a
// column of em-dashes reads as broken rather than as "not specified".

export interface SpecRow {
  label: string;
  value: string;
}

/** Orca array-shaped fields are `;`-joined after flattening; take extruder 1. */
export function firstValue(field: string | undefined): string | undefined {
  if (!field) return undefined;
  const first = field.split(';')[0]?.trim();
  return first || undefined;
}

/** `nil`, `undefine` and `0` are Orca's ways of saying "not specified". */
function spec(field: string | undefined): string | undefined {
  const v = firstValue(field);
  if (!v || v === 'nil' || v === 'undefine' || v === 'default') return undefined;
  return v;
}

function numeric(field: string | undefined): number | undefined {
  const v = spec(field);
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const NOZZLE_TYPES: Record<string, string> = {
  brass: 'brass',
  hardened_steel: 'hardened steel',
  stainless_steel: 'stainless steel',
  tungsten_carbide: 'tungsten carbide',
};

function push(rows: SpecRow[], label: string, value: string | undefined): void {
  if (value !== undefined) rows.push({ label, value });
}

/** "0.4 mm · stainless steel" — the two facts that decide what you can print. */
export function nozzleSpec(flat: Record<string, string>): string | undefined {
  const diameter = spec(flat['nozzle_diameter']);
  const type = spec(flat['nozzle_type']);
  const name = type ? NOZZLE_TYPES[type] ?? type.replace(/_/g, ' ') : undefined;
  if (!diameter) return name;
  return name ? `${diameter} mm · ${name}` : `${diameter} mm`;
}

/**
 * How many filaments the machine can hold.
 *
 * Orca has no single field for it: a multi-material printer lists one default
 * profile per slot, while a plain one lists none at all and simply has as many
 * filaments as extruders.
 */
export function filamentSlotCount(flat: Record<string, string>): number | undefined {
  for (const field of ['default_filament_profile', 'filament_settings_id', 'extruder_colour']) {
    const raw = flat[field];
    if (raw) {
      const n = raw.split(';').filter((v) => v.trim()).length;
      if (n > 0) return n;
    }
  }
  return undefined;
}

/**
 * @param bedTempKey the `*_plate_temp` field for the build plate the user says
 *   is installed — the one the slice config pins, so the one worth showing.
 */
export function filamentSpecs(flat: Record<string, string>, bedTempKey: string): SpecRow[] {
  const rows: SpecRow[] = [];

  const type = spec(flat['filament_type']);
  const vendor = spec(flat['filament_vendor']);
  push(rows, 'Type', type && (vendor && vendor !== 'Generic' ? `${type} · ${vendor}` : type));

  const volumetric = numeric(flat['filament_max_volumetric_speed']);
  push(rows, 'Max flow', volumetric ? `${volumetric} mm³/s` : undefined);

  const nozzle = spec(flat['nozzle_temperature']);
  const nozzleFirst = spec(flat['nozzle_temperature_initial_layer']);
  push(
    rows,
    'Nozzle temp',
    nozzle && `${nozzle} °C${nozzleFirst && nozzleFirst !== nozzle ? ` · first layer ${nozzleFirst} °C` : ''}`,
  );

  const lo = spec(flat['nozzle_temperature_range_low']);
  const hi = spec(flat['nozzle_temperature_range_high']);
  push(rows, 'Nozzle range', lo && hi ? `${lo}–${hi} °C` : undefined);

  const bed = spec(flat[bedTempKey]);
  const bedFirst = spec(flat[`${bedTempKey}_initial_layer`]);
  push(
    rows,
    'Bed temp',
    bed && `${bed} °C${bedFirst && bedFirst !== bed ? ` · first layer ${bedFirst} °C` : ''}`,
  );

  const diameter = spec(flat['filament_diameter']);
  push(rows, 'Diameter', diameter ? `${diameter} mm` : undefined);

  const flow = numeric(flat['filament_flow_ratio']);
  push(rows, 'Flow ratio', flow ? String(flow) : undefined);

  const fanMin = numeric(flat['fan_min_speed']);
  const fanMax = numeric(flat['fan_max_speed']);
  push(rows, 'Part fan', fanMax !== undefined ? `${fanMin ?? 0}–${fanMax} %` : undefined);

  // Orca grades abrasion as a minimum nozzle hardness. Anything above brass
  // territory is the difference between a working nozzle and a ruined one.
  const hrc = numeric(flat['required_nozzle_HRC']);
  push(rows, 'Needs nozzle HRC', hrc ? `≥ ${hrc}` : undefined);

  return rows;
}

/** Orca's per-feature speeds, in the order they matter to surface quality. */
const SPEED_FIELDS: Array<[string, string]> = [
  ['initial_layer_speed', 'First layer'],
  ['outer_wall_speed', 'Outer wall'],
  ['inner_wall_speed', 'Inner wall'],
  ['sparse_infill_speed', 'Sparse infill'],
  ['internal_solid_infill_speed', 'Solid infill'],
  ['top_surface_speed', 'Top surface'],
  ['bridge_speed', 'Bridge'],
  ['gap_infill_speed', 'Gap fill'],
  ['travel_speed', 'Travel'],
];

/**
 * Per-feature speeds in the config that will be sliced.
 *
 * Usually empty: these are process-preset fields, and the editor imports
 * printer and filament presets only, so the slicer falls back to its own
 * defaults. Showing an empty list honestly is the point — it says where the
 * numbers are coming from.
 */
export function speedSpecs(config: Record<string, string>): SpecRow[] {
  const rows: SpecRow[] = [];
  for (const [field, label] of SPEED_FIELDS) {
    const v = numeric(config[field]);
    push(rows, label, v !== undefined ? `${v} mm/s` : undefined);
  }
  return rows;
}

/** The process, as the numbers that decide how the part comes out. */
export function processSpecs(
  proc: {
    wallLoops: string;
    topShells: string;
    bottomShells: string;
    infillDensity: string;
    infillPattern: string;
    supportStyle: string;
    brim: boolean;
    skirt: boolean;
    adaptiveLayerHeight: boolean;
  },
  layerHeight: string,
): SpecRow[] {
  return [
    {
      label: 'Layer height',
      value: proc.adaptiveLayerHeight ? `${layerHeight} mm · adaptive` : `${layerHeight} mm`,
    },
    { label: 'Walls', value: proc.wallLoops },
    { label: 'Top / bottom', value: `${proc.topShells} / ${proc.bottomShells} layers` },
    { label: 'Infill', value: `${proc.infillDensity}% ${proc.infillPattern}` },
    {
      label: 'Supports',
      value: proc.supportStyle === 'none' ? 'off'
        : proc.supportStyle === 'tree' ? 'tree (auto)' : 'normal (auto)',
    },
    { label: 'Brim', value: proc.brim ? 'on · 5 mm outer' : 'off' },
    { label: 'Skirt', value: proc.skirt ? 'on · 1 loop' : 'off' },
  ];
}
