// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import {
  parsePrintableArea,
  gcodeXYBounds,
  translateGcodeXY,
  postProcessGcode,
} from '../src/gcode-post.js';

describe('parsePrintableArea', () => {
  it('parses a centered bed (Flashforge Adventurer 5M)', () => {
    expect(parsePrintableArea('-110x-110;110x-110;110x110;-110x110')).toEqual({
      minX: -110, maxX: 110, minY: -110, maxY: 110,
    });
  });

  it('parses a corner-origin bed (Ender 3-style)', () => {
    expect(parsePrintableArea('0x0;235x0;235x235;0x235')).toEqual({
      minX: 0, maxX: 235, minY: 0, maxY: 235,
    });
  });

  it('parses a non-rectangular polygon (arbitrary bed shape)', () => {
    // Cuts a corner off — bounding box stays the same as the axis-aligned bed
    // but the caller can decide whether to warn on non-rect beds.
    const bounds = parsePrintableArea('0x0;200x0;200x150;150x200;0x200');
    expect(bounds).toEqual({ minX: 0, maxX: 200, minY: 0, maxY: 200 });
  });

  it('returns null on garbage input', () => {
    expect(parsePrintableArea(undefined)).toBeNull();
    expect(parsePrintableArea('')).toBeNull();
    expect(parsePrintableArea(null)).toBeNull();
    expect(parsePrintableArea('nope;garbage')).toBeNull();
  });

  it('ignores trailing empty segments from a trailing semicolon', () => {
    expect(parsePrintableArea('0x0;100x0;100x100;0x100;')).toEqual({
      minX: 0, maxX: 100, minY: 0, maxY: 100,
    });
  });
});

describe('gcodeXYBounds', () => {
  it('finds bounds across G0 and G1 with mixed coords', () => {
    const gcode = [
      'G28',
      'G1 Z0.2 F600',       // no XY
      'G1 X10 Y10 F1200',
      'G0 X50 Y30',
      'G1 X-5 Y100 E5',
      'M104 S220',           // not a move
    ].join('\n');
    expect(gcodeXYBounds(gcode)).toEqual({ minX: -5, maxX: 50, minY: 10, maxY: 100 });
  });

  it('returns null for gcode with no XY moves', () => {
    expect(gcodeXYBounds('G28\nM104 S200\nM140 S60')).toBeNull();
  });

  it('ignores commented-out coordinates', () => {
    const gcode = [
      'G1 X10 Y10   ; move to start',
      '; G1 X999 Y999',       // commented, ignored
      'G1 X20 Y20',
    ].join('\n');
    expect(gcodeXYBounds(gcode)).toEqual({ minX: 10, maxX: 20, minY: 10, maxY: 20 });
  });

  it('handles negative and decimal coords', () => {
    const gcode = 'G1 X-14.998 Y-14.998\nG1 X14.998 Y14.998';
    expect(gcodeXYBounds(gcode)).toEqual({ minX: -14.998, maxX: 14.998, minY: -14.998, maxY: 14.998 });
  });
});

describe('translateGcodeXY', () => {
  it('shifts every G0/G1 X/Y by the offset', () => {
    const input = [
      'G28',
      'G1 X10 Y10 F1200',
      'G0 X50 Y30',
      'G1 X20.5 Y-5.25 E2',
    ].join('\n');
    const shifted = translateGcodeXY(input, -100, -100);
    expect(shifted).toBe([
      'G28',
      'G1 X-90 Y-90 F1200',
      'G0 X-50 Y-70',
      'G1 X-79.5 Y-105.25 E2',
    ].join('\n'));
  });

  it('is a no-op for zero offset', () => {
    const input = 'G1 X10 Y10 F1200';
    expect(translateGcodeXY(input, 0, 0)).toBe(input);
  });

  it('preserves Z, E, F and comments', () => {
    const input = 'G1 X10 Y10 Z0.2 E0.5 F1200 ; first move';
    const shifted = translateGcodeXY(input, 5, -5);
    expect(shifted).toBe('G1 X15 Y5 Z0.2 E0.5 F1200 ; first move');
  });

  it('does not touch non-move commands', () => {
    const input = 'M104 S220\nM140 S60\nSET_PRESSURE_ADVANCE ADVANCE=0.04';
    expect(translateGcodeXY(input, 10, 10)).toBe(input);
  });

  it('handles mid-line X/Y-like substrings correctly', () => {
    // Common Klipper macro args contain X=/Y= without a G-code prefix — we must not touch those.
    const input = 'START_PRINT EXTRUDER_TEMP=220 BED_TEMP=60\nG1 X10 Y10';
    const shifted = translateGcodeXY(input, 5, 5);
    expect(shifted).toContain('START_PRINT EXTRUDER_TEMP=220 BED_TEMP=60');
    expect(shifted).toContain('G1 X15 Y15');
  });
});

describe('postProcessGcode', () => {
  const FLASHFORGE_AREA = '-110x-110;110x-110;110x110;-110x110';

  it('substitutes Orca temperature placeholders when present', () => {
    const raw = 'START_PRINT EXTRUDER_TEMP=[nozzle_temperature_initial_layer] BED_TEMP=[bed_temperature_initial_layer_single]\nG28';
    const r = postProcessGcode(raw, { nozzleTemp: '220', bedTemp: '60', preheat: false, centerOnBed: false });
    expect(r.placeholdersResolved).toBe(true);
    expect(r.gcode).toContain('START_PRINT EXTRUDER_TEMP=220 BED_TEMP=60');
    expect(r.gcode).not.toContain('[bed_temperature_initial_layer_single]');
  });

  it('leaves gcode untouched when no placeholders and no preheat', () => {
    const raw = 'G28\nG1 X10 Y10';
    const r = postProcessGcode(raw, { preheat: false, centerOnBed: false });
    expect(r.gcode).toBe(raw);
    expect(r.placeholdersResolved).toBe(false);
    expect(r.translated).toBe(false);
  });

  it('prepends async M140/M104 preheat by default when temps are known', () => {
    const raw = 'START_PRINT\nG28';
    const r = postProcessGcode(raw, { nozzleTemp: '220', bedTemp: '60', centerOnBed: false });
    expect(r.gcode.split('\n').slice(0, 5).join('\n')).toContain('M140 S60');
    expect(r.gcode).toContain('M104 S220');
    // We deliberately do NOT emit M190/M109 waits — let START_PRINT handle
    // sequencing so the printer doesn't sit cold for 5 minutes.
    expect(r.gcode).not.toContain('M190');
    expect(r.gcode).not.toContain('M109');
  });

  it('does not translate a print that already fits in bed bounds', () => {
    // Toolpath at ±15 (like the XYZ test cube) already sits inside ±110.
    const raw = 'G1 X-15 Y-15\nG1 X15 Y15';
    const r = postProcessGcode(raw, { printableArea: FLASHFORGE_AREA, preheat: false });
    expect(r.translated).toBe(false);
    expect(r.translation).toEqual({ dx: 0, dy: 0 });
    expect(r.outOfBounds).toBe(false);
  });

  it('auto-centers a corner-origin toolpath on a center-origin bed', () => {
    // Slicer emitted coords in 95..125 (as if bed were 0..220 corner-origin and
    // the cube was placed at the center). The Flashforge is actually -110..110
    // centered, so 125 is 15mm past the physical edge → out of range.
    const raw = 'G1 X95 Y95\nG1 X125 Y125';
    const r = postProcessGcode(raw, { printableArea: FLASHFORGE_AREA, preheat: false });
    expect(r.translated).toBe(true);
    expect(r.translation.dx).toBeCloseTo(-110);
    expect(r.translation.dy).toBeCloseTo(-110);
    expect(r.gcode).toContain('X-15');
    expect(r.gcode).toContain('X15');
    expect(r.outOfBounds).toBe(false);
    // Bounds line reports the final (post-translation) numbers.
    expect(r.finalGcodeBounds).toEqual({ minX: -15, maxX: 15, minY: -15, maxY: 15 });
  });

  it('reports outOfBounds when translation cannot save the print', () => {
    // Print that's larger than the bed itself (300mm span on a 220mm bed).
    const raw = 'G1 X0 Y0\nG1 X300 Y300';
    const r = postProcessGcode(raw, { printableArea: FLASHFORGE_AREA, preheat: false });
    // Centering moves the print's bbox center to (0, 0) but the print itself
    // is 300mm so it still spills off both sides of a 220mm bed.
    expect(r.outOfBounds).toBe(true);
  });

  it('reports bedBounds correctly even when centerOnBed is off', () => {
    const raw = 'G1 X0 Y0';
    const r = postProcessGcode(raw, { printableArea: FLASHFORGE_AREA, preheat: false, centerOnBed: false });
    expect(r.bedBounds).toEqual({ minX: -110, maxX: 110, minY: -110, maxY: 110 });
    expect(r.translated).toBe(false);
  });

  it('overrides BED_TEMP / EXTRUDER_TEMP in Klipper macro invocations', () => {
    // WASM slicer resolved `[bed_temperature_initial_layer_single]` to 60
    // (cool-plate default) even though we want 85 (hot plate). The
    // macroTempsOverride pass rewrites the START_PRINT line to the correct
    // values regardless of what the slicer put there.
    const raw = 'START_PRINT EXTRUDER_TEMP=200 BED_TEMP=60';
    const r = postProcessGcode(raw, { nozzleTemp: '255', bedTemp: '85', preheat: false, centerOnBed: false });
    expect(r.gcode).toBe('START_PRINT EXTRUDER_TEMP=255 BED_TEMP=85');
    expect(r.macroTempsOverridden).toBe(true);
  });

  it('leaves gcode untouched when overrideMacroTemps is off', () => {
    const raw = 'START_PRINT EXTRUDER_TEMP=200 BED_TEMP=60';
    const r = postProcessGcode(raw, {
      nozzleTemp: '255', bedTemp: '85',
      preheat: false, centerOnBed: false, overrideMacroTemps: false,
    });
    expect(r.gcode).toBe(raw);
    expect(r.macroTempsOverridden).toBe(false);
  });

  it('macro override handles decimal and negative values', () => {
    const raw = 'CUSTOM_MACRO BED_TEMP=-5 EXTRUDER_TEMP=25.5';
    const r = postProcessGcode(raw, { nozzleTemp: '255', bedTemp: '85', preheat: false, centerOnBed: false });
    expect(r.gcode).toBe('CUSTOM_MACRO BED_TEMP=85 EXTRUDER_TEMP=255');
  });

  it('resolves placeholders even inside START_PRINT macro args (regression)', () => {
    // The real failure mode we hit: the WASM slicer didn't substitute
    // `[bed_temperature_initial_layer_single]` into the START_PRINT call, so
    // Klipper's macro received a literal string arg. Post-process must fix.
    const raw = 'START_PRINT EXTRUDER_TEMP=[nozzle_temperature_initial_layer] BED_TEMP=[bed_temperature_initial_layer_single]';
    const r = postProcessGcode(raw, { nozzleTemp: '220', bedTemp: '60', preheat: false, centerOnBed: false });
    expect(r.gcode).toBe('START_PRINT EXTRUDER_TEMP=220 BED_TEMP=60');
    expect(r.placeholdersResolved).toBe(true);
  });

  it('does full pipeline: substitute, translate, prepend preheat', () => {
    const raw = [
      'START_PRINT EXTRUDER_TEMP=[nozzle_temperature_initial_layer] BED_TEMP=[bed_temperature_initial_layer_single]',
      'G28',
      'G1 X95 Y95',      // corner-origin coords that need shifting
      'G1 X125 Y125',
    ].join('\n');
    const r = postProcessGcode(raw, {
      printableArea: FLASHFORGE_AREA,
      nozzleTemp: '220',
      bedTemp: '60',
      // preheat & centerOnBed default to true
    });
    expect(r.placeholdersResolved).toBe(true);
    expect(r.translated).toBe(true);
    expect(r.outOfBounds).toBe(false);
    const head = r.gcode.split('\n').slice(0, 6).join('\n');
    expect(head).toContain('M140 S60');
    expect(head).toContain('M104 S220');
    expect(r.gcode).toContain('START_PRINT EXTRUDER_TEMP=220 BED_TEMP=60');
    expect(r.gcode).toContain('X-15');
    expect(r.gcode).toContain('X15');
  });
});
