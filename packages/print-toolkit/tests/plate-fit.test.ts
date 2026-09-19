// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Tests for the plate fit oracle — printer bed derivation from a flattened
 * OrcaSlicer printer config, and the fits/warn/blocked verdict.
 */

import { describe, it, expect } from 'vitest';
import { evaluatePlateFit, printerBedFromConfig } from '../src/plate-fit.js';
import type { PrinterBed } from '../src/plate-fit.js';
import type { BuildPlateObject } from '../src/build-plate.js';

/** Minimal binary STL: one triangle spanning (0,0,0)–(width, depth, height). */
function makeSTLData(width: number, depth: number, height: number): ArrayBuffer {
  const buf = new ArrayBuffer(84 + 50);
  const view = new DataView(buf);
  view.setUint32(80, 1, true);
  const verts = [0, 0, 0, width, depth, 0, 0, 0, height];
  let off = 84 + 12; // skip the 12-byte normal
  for (const v of verts) {
    view.setFloat32(off, v, true);
    off += 4;
  }
  return buf;
}

function makeObject(overrides: Partial<BuildPlateObject> = {}): BuildPlateObject {
  return {
    id: 'obj-1',
    name: 'Test Object',
    type: 'stl',
    meshData: makeSTLData(40, 40, 10),
    meshFormat: 'stl',
    position: { x: 0, y: 0 },
    rotation: 0,
    scale: { x: 1, y: 1, z: 1 },
    ...overrides,
  };
}

const PRINTER: PrinterBed = {
  bed: { minX: 0, minY: 0, maxX: 200, maxY: 200 },
  keepouts: [],
  maxHeight: 200,
  extruderCount: 1,
};

describe('evaluatePlateFit', () => {
  it('reports a plate that fits, with a layout for every object', () => {
    const objects = [
      makeObject({ id: 'a', name: 'a.stl' }),
      makeObject({ id: 'b', name: 'b.stl' }),
    ];
    const result = evaluatePlateFit(objects, PRINTER);

    expect(result.status).toBe('fits');
    expect(result.reasons).toEqual([]);
    expect(result.unplacedIds).toEqual([]);
    expect(Object.keys(result.layout).sort()).toEqual(['a', 'b']);
    for (const { x, y } of Object.values(result.layout)) {
      expect(x - 20).toBeGreaterThanOrEqual(PRINTER.bed.minX);
      expect(x + 20).toBeLessThanOrEqual(PRINTER.bed.maxX);
      expect(y - 20).toBeGreaterThanOrEqual(PRINTER.bed.minY);
      expect(y + 20).toBeLessThanOrEqual(PRINTER.bed.maxY);
    }
  });

  it('returns fits for an empty plate', () => {
    const result = evaluatePlateFit([], PRINTER);
    expect(result).toEqual({ status: 'fits', reasons: [], unplacedIds: [], layout: {} });
  });

  it('blocks an object taller than the printer', () => {
    const objects = [makeObject({ id: 'tall', name: 'tower.stl', meshData: makeSTLData(40, 40, 210) })];
    const result = evaluatePlateFit(objects, PRINTER);

    expect(result.status).toBe('blocked');
    expect(result.reasons).toContain('tower.stl is 210 mm tall; printer max is 200 mm.');
    // Too tall, but it still packs — the layout is unaffected.
    expect(result.unplacedIds).toEqual([]);
    expect(result.layout['tall']).toBeDefined();
  });

  it('blocks a plate that does not pack, and names the unplaced objects', () => {
    const printer: PrinterBed = { ...PRINTER, bed: { minX: 0, minY: 0, maxX: 60, maxY: 60 } };
    const objects = [
      makeObject({ id: 'a', name: 'a.stl' }),
      makeObject({ id: 'b', name: 'b.stl' }),
    ];
    const result = evaluatePlateFit(objects, printer, { spacing: 10 });

    expect(result.status).toBe('blocked');
    expect(result.unplacedIds).toEqual(['b']);
    expect(result.reasons).toContain('1 of 2 objects do not fit on the bed.');
    expect(result.layout['a']).toBeDefined();
    expect(result.layout['b']).toBeUndefined();
  });

  it('counts every unplaced object in the packing reason', () => {
    const printer: PrinterBed = { ...PRINTER, bed: { minX: 0, minY: 0, maxX: 60, maxY: 60 } };
    const objects = ['a', 'b', 'c'].map((id) => makeObject({ id, name: `${id}.stl` }));
    const result = evaluatePlateFit(objects, printer, { spacing: 10 });

    expect(result.unplacedIds).toEqual(['b', 'c']);
    expect(result.reasons).toContain('2 of 3 objects do not fit on the bed.');
  });

  it('warns when an object has more colors than the printer has extruders', () => {
    const objects = [makeObject({
      id: 'multi',
      name: 'assembled.3mf',
      colorGroups: [{ color: '#000' }, { color: '#f00' }, { color: '#0f0' }, { color: '#00f' }],
    })];
    const result = evaluatePlateFit(objects, PRINTER);

    expect(result.status).toBe('warn');
    expect(result.reasons).toEqual([
      'assembled.3mf has 4 colors; printer has 1 extruder — it will print in one color.',
    ]);
    expect(result.unplacedIds).toEqual([]);
    expect(result.layout['multi']).toBeDefined();
  });

  it('does not warn when the printer has an extruder per color', () => {
    const objects = [makeObject({
      id: 'multi',
      colorGroups: [{ color: '#000' }, { color: '#f00' }],
    })];
    expect(evaluatePlateFit(objects, { ...PRINTER, extruderCount: 2 }).status).toBe('fits');
  });

  it('blocked outranks warn', () => {
    const objects = [makeObject({
      id: 'multi',
      name: 'tall.3mf',
      meshData: makeSTLData(40, 40, 210),
      colorGroups: [{ color: '#000' }, { color: '#f00' }],
    })];
    const result = evaluatePlateFit(objects, PRINTER);
    expect(result.status).toBe('blocked');
    expect(result.reasons).toHaveLength(2);
  });

  it('keeps objects out of a keepout', () => {
    const printer: PrinterBed = {
      ...PRINTER,
      keepouts: [{ minX: 0, minY: 0, maxX: 100, maxY: 100 }],
    };
    const result = evaluatePlateFit([makeObject({ id: 'a' })], printer, { spacing: 10 });
    expect(result.status).toBe('fits');
    const { x, y } = result.layout['a'];
    expect(x - 20 >= 100 || y - 20 >= 100).toBe(true);
  });

  describe('pinned layouts', () => {
    it('returns the pinned positions instead of arranging', () => {
      const objects = [
        makeObject({ id: 'a', name: 'a.stl' }),
        makeObject({ id: 'b', name: 'b.stl' }),
      ];
      const pinned = {
        a: { x: 170, y: 170, rot: 90 },
        b: { x: 30, y: 170, rot: 0 },
      };
      const result = evaluatePlateFit(objects, PRINTER, { pinned });

      expect(result.status).toBe('fits');
      expect(result.layout).toEqual(pinned);
      expect(result.unplacedIds).toEqual([]);
    });

    it('blocks a pinned object that hangs off the bed', () => {
      const objects = [makeObject({ id: 'a', name: 'a.stl' })];
      const result = evaluatePlateFit(objects, PRINTER, {
        pinned: { a: { x: 195, y: 100, rot: 0 } },
      });

      expect(result.status).toBe('blocked');
      expect(result.unplacedIds).toEqual(['a']);
      expect(result.reasons).toContain('1 of 1 objects do not fit on the bed.');
      expect(result.layout).toEqual({});
    });

    it('blocks a pinned object sitting in a keepout', () => {
      const printer: PrinterBed = {
        ...PRINTER,
        keepouts: [{ minX: 0, minY: 0, maxX: 60, maxY: 60 }],
      };
      const result = evaluatePlateFit([makeObject({ id: 'a' })], printer, {
        pinned: { a: { x: 70, y: 70, rot: 0 } },
      });

      expect(result.status).toBe('blocked');
      expect(result.unplacedIds).toEqual(['a']);
    });

    it('blocks both objects of an overlapping pinned pair', () => {
      const objects = [makeObject({ id: 'a' }), makeObject({ id: 'b' })];
      const result = evaluatePlateFit(objects, PRINTER, {
        pinned: {
          a: { x: 100, y: 100, rot: 0 },
          b: { x: 120, y: 100, rot: 0 },
        },
      });

      expect(result.status).toBe('blocked');
      expect(result.unplacedIds).toEqual(['a', 'b']);
      expect(result.layout).toEqual({});
    });

    it('accepts touching pinned footprints', () => {
      const objects = [makeObject({ id: 'a' }), makeObject({ id: 'b' })];
      const result = evaluatePlateFit(objects, PRINTER, {
        pinned: {
          a: { x: 60, y: 100, rot: 0 },
          b: { x: 100, y: 100, rot: 0 },
        },
      });
      expect(result.status).toBe('fits');
    });

    it('falls back to arranging when only some objects are pinned', () => {
      const objects = [makeObject({ id: 'a' }), makeObject({ id: 'b' })];
      const result = evaluatePlateFit(objects, PRINTER, {
        pinned: { a: { x: 170, y: 170, rot: 0 } },
      });

      expect(result.status).toBe('fits');
      expect(result.layout['a']).not.toEqual({ x: 170, y: 170, rot: 0 });
    });
  });
});

describe('printerBedFromConfig', () => {
  it('derives a corner-origin bed', () => {
    const bed = printerBedFromConfig({
      printable_area: '0x0;250x0;250x250;0x250',
      printable_height: '250',
      nozzle_diameter: '0.4',
    });

    expect(bed).toEqual({
      bed: { minX: 0, minY: 0, maxX: 250, maxY: 250 },
      keepouts: [],
      maxHeight: 250,
      extruderCount: 1,
    });
  });

  it('derives a center-origin bed', () => {
    const bed = printerBedFromConfig({
      printable_area: '-110x-110;110x-110;110x110;-110x110',
      printable_height: '220',
      nozzle_diameter: '0.4',
    });

    expect(bed).toEqual({
      bed: { minX: -110, minY: -110, maxX: 110, maxY: 110 },
      keepouts: [],
      maxHeight: 220,
      extruderCount: 1,
    });
  });

  it('drops the degenerate ["0x0"] exclusion', () => {
    const bed = printerBedFromConfig({
      printable_area: '0x0;250x0;250x250;0x250',
      printable_height: '250',
      bed_exclude_area: '0x0',
      nozzle_diameter: '0.4',
    });

    expect(bed?.keepouts).toEqual([]);
  });

  it('keeps a real exclusion polygon as a keepout bbox', () => {
    const bed = printerBedFromConfig({
      printable_area: '0x0;250x0;250x250;0x250',
      bed_exclude_area: '0x0,11x0,11x16,0x16',
    });

    expect(bed?.keepouts).toEqual([{ minX: 0, minY: 0, maxX: 11, maxY: 16 }]);
  });

  it('drops real exclusions when asked to ignore them', () => {
    const bed = printerBedFromConfig(
      {
        printable_area: '0x0;250x0;250x250;0x250',
        bed_exclude_area: '0x0,11x0,11x16,0x16',
      },
      { ignoreExclusions: true },
    );

    expect(bed?.keepouts).toEqual([]);
  });

  it('counts extruders from nozzle_diameter, comma- or semicolon-joined', () => {
    const area = '0x0;250x0;250x250;0x250';
    expect(printerBedFromConfig({ printable_area: area, nozzle_diameter: '0.4;0.4' })?.extruderCount).toBe(2);
    expect(printerBedFromConfig({ printable_area: area, nozzle_diameter: '0.4,0.4,0.4,0.4' })?.extruderCount).toBe(4);
    expect(printerBedFromConfig({ printable_area: area })?.extruderCount).toBe(1);
  });

  it('leaves maxHeight unbounded when printable_height is absent', () => {
    const bed = printerBedFromConfig({ printable_area: '0x0;250x0;250x250;0x250' });
    expect(bed?.maxHeight).toBe(Infinity);
  });

  it('returns null when printable_area is missing or unparseable', () => {
    expect(printerBedFromConfig({})).toBeNull();
    expect(printerBedFromConfig({ printable_area: 'not-a-bed' })).toBeNull();
  });
});
