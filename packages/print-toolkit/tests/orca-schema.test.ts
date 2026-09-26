// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import {
  describeValue,
  fromCells,
  normalizeCell,
  toCells,
  validateCell,
  validateCells,
  type OrcaOptionDef,
} from '../src/orca-schema.js';
import { ORCA_SCHEMA } from '../src/orca-schema.generated.js';
// @ts-expect-error — plain .mjs script, no types
import { parseDefault, parseEnumMaps, statements, stringValue } from '../scripts/gen-orca-schema.mjs';

describe('generated schema', () => {
  const { options, kinds } = ORCA_SCHEMA;

  it('types the fields the gallery already reads', () => {
    expect(options['nozzle_diameter']).toMatchObject({ type: 'floats', sidetext: 'mm' });
    expect(options['printable_area']).toMatchObject({ type: 'points' });
    expect(options['gcode_flavor'].type).toBe('enum');
    expect(options['gcode_flavor'].enumValues).toContain('klipper');
    expect(options['nozzle_temperature']).toMatchObject({ type: 'ints', min: 0 });
    expect(options['filament_type']).toMatchObject({ type: 'strings', guiType: 'f_enum_open' });
  });

  it('turns C++ defaults into the values Orca writes to a preset file', () => {
    expect(options['nozzle_diameter'].default).toEqual(['0.4']);
    expect(options['gcode_flavor'].default).toBe('marlin');
    expect(options['printable_area'].default).toEqual(['0x0', '200x0', '200x200', '0x200']);
    expect(options['machine_max_speed_x'].default).toEqual(['500', '200']);
  });

  it('makes the filament retraction overrides nullable copies of the printer fields', () => {
    const own = options['retraction_length'];
    const filament = options['filament_retraction_length'];
    expect(filament.type).toBe(own.type);
    expect(filament.nullable).toBe(true);
    expect(filament.tooltip).toBe(own.tooltip);
  });

  it('gives every key of a kind a definition and a place in the layout, exactly once', () => {
    for (const kind of [kinds.printer, kinds.filament]) {
      const placed = kind.layout.flatMap((p) => p.groups.flatMap((g) => g.keys));
      expect(new Set(placed).size).toBe(placed.length);
      for (const key of placed) expect(options[key], key).toBeDefined();
      const missing = kind.keys.filter((k) => options[k] && !placed.includes(k));
      expect(missing).toEqual([]);
    }
  });

  it("follows Orca's page order for the printer", () => {
    const titles = kinds.printer.layout.map((p) => p.title);
    expect(titles.slice(0, 2)).toEqual(['Basic information', 'Machine G-code']);
    expect(titles).toContain('Motion ability');
    expect(titles).toContain('Connection');
  });
});

describe('generator parsing', () => {
  it('keeps "//" inside a string instead of treating it as a comment', () => {
    const [st] = statements('def->tooltip = L("see https://example.com/x"); // real comment\n');
    expect(stringValue(st)).toBe('see https://example.com/x');
  });

  it('joins adjacent literals and decodes escapes', () => {
    expect(stringValue('L("a " "b\\n" u8"\\u2103")')).toBe('a b\n℃');
  });

  it('reads scalar, vector, percent and enum defaults', () => {
    const enums = parseEnumMaps('static t_config_enum_values s_keys_map_Fl {\n    { "klipper", gcfKlipper },\n};\n');
    expect(parseDefault('new ConfigOptionFloat(0.4)')).toBe('0.4');
    expect(parseDefault('new ConfigOptionBools{ false, true }')).toEqual(['0', '1']);
    expect(parseDefault('new ConfigOptionPercent(15)')).toBe('15%');
    expect(parseDefault('new ConfigOptionFloatOrPercent(50, true)')).toBe('50%');
    expect(parseDefault('new ConfigOptionEnum<Fl>(gcfKlipper)', undefined, enums)).toBe('klipper');
    expect(parseDefault('new ConfigOptionPoints{ Vec2d(0, 0), Vec2d(220, 0) }')).toEqual(['0x0', '220x0']);
  });

  it('leaves out a default built from a named constant rather than guessing', () => {
    expect(parseDefault('new ConfigOptionInt(max_temp)')).toBeUndefined();
  });
});

describe('cells', () => {
  const floats: OrcaOptionDef = { type: 'floats', min: 0, max: 10 };

  it('round-trips vectors and scalars in Orca\'s shapes', () => {
    expect(toCells(['0.4', '0.6'], 'floats')).toEqual(['0.4', '0.6']);
    expect(fromCells(['0.4', '0.6'], 'floats')).toEqual(['0.4', '0.6']);
    expect(toCells('klipper', 'enum')).toEqual(['klipper']);
    expect(fromCells(['klipper'], 'enum')).toBe('klipper');
  });

  it('coerces a scalar where a vector belongs, as a hand-edited file may have', () => {
    expect(toCells('0.4', 'floats')).toEqual(['0.4']);
    expect(toCells(true, 'bool')).toEqual(['1']);
  });

  it('checks type and bounds', () => {
    expect(validateCell('0.4', floats)).toBeNull();
    expect(validateCell('abc', floats)).toMatch(/number/);
    expect(validateCell('11', floats)).toMatch(/at most 10/);
    expect(validateCell('1.5', { type: 'ints' })).toMatch(/whole/);
    expect(validateCell('2', { type: 'bool' })).toMatch(/on or off/);
    expect(validateCell('nope', { type: 'enum', enumValues: ['a', 'b'] })).toMatch(/one of/);
    expect(validateCell('50%', { type: 'floatOrPercent', max: 10 })).toBeNull();
    expect(validateCell('0x0', { type: 'points' })).toBeNull();
  });

  it('accepts "nil" only on nullable options', () => {
    expect(validateCell('nil', { ...floats, nullable: true })).toBeNull();
    expect(validateCell('nil', floats)).not.toBeNull();
  });

  it('names the slot of the first bad cell', () => {
    expect(validateCells(['1', 'x'], floats)).toMatch(/^#2:/);
  });

  it('stores percents with their sign however they were typed', () => {
    expect(normalizeCell('15', { type: 'percent' })).toBe('15%');
    expect(normalizeCell('15%', { type: 'percent' })).toBe('15%');
  });

  it('describes values the way the UI shows them', () => {
    expect(describeValue('1', { type: 'bool' })).toBe('on');
    expect(describeValue('klipper', { type: 'enum', enumValues: ['klipper'], enumLabels: ['Klipper'] })).toBe('Klipper');
    expect(describeValue(['nil'], { type: 'floats', nullable: true })).toBe("printer's");
    expect(describeValue(undefined, floats)).toBe('—');
  });
});
