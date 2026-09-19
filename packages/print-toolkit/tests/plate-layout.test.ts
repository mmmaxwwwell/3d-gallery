// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import {
  plateBounds,
  placePlateOnBed,
  evaluateAuthoredPlateFit,
  findPlateOverlaps,
  type PlateFootprint,
} from '../src/plate-layout.js';
import type { PrinterBed } from '../src/plate-fit.js';

function box(
  id: string,
  x: number,
  y: number,
  w: number,
  d: number,
  h = 10,
  colorCount?: number,
): PlateFootprint {
  return { id, name: id, x, y, halfW: w / 2, halfD: d / 2, height: h, colorCount };
}

function printer(w: number, d: number, h = 250, keepouts: PrinterBed['keepouts'] = [], extruderCount = 1): PrinterBed {
  return { bed: { minX: 0, minY: 0, maxX: w, maxY: d }, keepouts, maxHeight: h, extruderCount };
}

describe('plateBounds', () => {
  it('is null for an empty plate', () => {
    expect(plateBounds([])).toBeNull();
  });

  it('unions the footprints and takes the tallest object', () => {
    const b = plateBounds([box('a', 0, 0, 20, 20, 5), box('b', 50, 10, 20, 40, 30)])!;
    expect(b.minX).toBe(-10);
    expect(b.maxX).toBe(60);
    expect(b.minY).toBe(-10);
    expect(b.maxY).toBe(30);
    expect(b.width).toBe(70);
    expect(b.depth).toBe(40);
    expect(b.height).toBe(30);
    expect(b.centerX).toBe(25);
    expect(b.centerY).toBe(10);
  });
});

describe('placePlateOnBed', () => {
  it('centres the arrangement on the bed', () => {
    const items = [box('a', 0, 0, 20, 20)];
    expect(placePlateOnBed(items, printer(200, 200))).toEqual({ dx: 100, dy: 100 });
  });

  it('centres the arrangement as a whole, not each object', () => {
    const items = [box('a', 0, 0, 20, 20), box('b', 40, 0, 20, 20)];
    const at = placePlateOnBed(items, printer(200, 200))!;
    // Plate spans x -10..50, centre 20 -> shifted so that centre lands at 100.
    expect(at.dx).toBe(80);
    expect(at.dy).toBe(100);
  });

  it('refuses a plate wider than the bed', () => {
    const items = [box('a', 0, 0, 240, 20)];
    expect(placePlateOnBed(items, printer(220, 220))).toBeNull();
  });

  it('honours an edge margin', () => {
    const items = [box('a', 0, 0, 195, 20)];
    expect(placePlateOnBed(items, printer(200, 200), { edgeSpacing: 5 })).toBeNull();
    expect(placePlateOnBed(items, printer(200, 200), { edgeSpacing: 2 })).not.toBeNull();
  });

  it('slides off centre to clear a keepout', () => {
    const keepout = { minX: 90, minY: 90, maxX: 110, maxY: 110 };
    const items = [box('a', 0, 0, 20, 20)];
    const at = placePlateOnBed(items, printer(200, 200, 250, [keepout]))!;
    const cx = 0 + at.dx;
    const cy = 0 + at.dy;
    const clear = cx + 10 <= 90 || cx - 10 >= 110 || cy + 10 <= 90 || cy - 10 >= 110;
    expect(clear).toBe(true);
  });

  it('returns null when every position hits a keepout', () => {
    const keepout = { minX: 0, minY: 0, maxX: 200, maxY: 200 };
    expect(placePlateOnBed([box('a', 0, 0, 20, 20)], printer(200, 200, 250, [keepout]))).toBeNull();
  });

  it('places an empty plate at the origin', () => {
    expect(placePlateOnBed([], printer(200, 200))).toEqual({ dx: 0, dy: 0 });
  });
});

describe('evaluateAuthoredPlateFit', () => {
  it('fits a small plate and reports bed-space positions', () => {
    const items = [box('a', -20, 0, 20, 20), box('b', 20, 0, 20, 20)];
    const fit = evaluateAuthoredPlateFit(items, printer(200, 200));
    expect(fit.status).toBe('fits');
    expect(fit.reasons).toEqual([]);
    expect(fit.layout.a).toEqual({ x: 80, y: 100 });
    expect(fit.layout.b).toEqual({ x: 120, y: 100 });
  });

  it('blocks a plate wider than the bed and says so in millimetres', () => {
    const items = [box('a', -70, 0, 100, 20), box('b', 70, 0, 100, 20)];
    const fit = evaluateAuthoredPlateFit(items, printer(220, 220));
    expect(fit.status).toBe('blocked');
    expect(fit.offset).toBeNull();
    expect(fit.unplacedIds).toEqual(['a', 'b']);
    expect(fit.reasons[0]).toBe('Plate is 240 × 20 mm; bed is 220 × 220 mm.');
  });

  it('blocks an object taller than the machine', () => {
    const fit = evaluateAuthoredPlateFit([box('tall', 0, 0, 20, 20, 300)], printer(200, 200, 250));
    expect(fit.status).toBe('blocked');
    expect(fit.reasons[0]).toBe('tall is 300 mm tall; printer max is 250 mm.');
  });

  it('warns when an object needs more colours than the printer has extruders', () => {
    const fit = evaluateAuthoredPlateFit([box('multi', 0, 0, 20, 20, 10, 4)], printer(200, 200));
    expect(fit.status).toBe('warn');
    expect(fit.reasons[0]).toContain('4 colors');
    expect(fit.reasons[0]).toContain('1 extruder');
    // A warning still prints, so the plate is still placed.
    expect(fit.layout.multi).toEqual({ x: 100, y: 100 });
  });

  it('does not warn when the printer has enough extruders', () => {
    const fit = evaluateAuthoredPlateFit([box('multi', 0, 0, 20, 20, 10, 2)], printer(200, 200, 250, [], 4));
    expect(fit.status).toBe('fits');
  });

  it('blames exclusion zones when size is not the problem', () => {
    const keepout = { minX: 0, minY: 0, maxX: 200, maxY: 200 };
    const fit = evaluateAuthoredPlateFit([box('a', 0, 0, 20, 20)], printer(200, 200, 250, [keepout]));
    expect(fit.status).toBe('blocked');
    expect(fit.reasons[0]).toContain('exclusion zones');
  });

  it('fits an empty plate', () => {
    const fit = evaluateAuthoredPlateFit([], printer(200, 200));
    expect(fit.status).toBe('fits');
    expect(fit.bounds).toBeNull();
  });
});

describe('findPlateOverlaps', () => {
  it('finds interpenetrating pairs', () => {
    expect(findPlateOverlaps([box('a', 0, 0, 20, 20), box('b', 10, 0, 20, 20)])).toEqual([['a', 'b']]);
  });

  it('allows objects that merely touch', () => {
    expect(findPlateOverlaps([box('a', 0, 0, 20, 20), box('b', 20, 0, 20, 20)])).toEqual([]);
  });
});
