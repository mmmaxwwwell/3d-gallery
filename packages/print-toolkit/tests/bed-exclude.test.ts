// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import {
  excludeAreaBboxes,
  forceStripBedExcludeArea,
  isDegenerateExcludeArea,
  parseBedExcludeArea,
  sanitizeBedExcludeArea,
} from '../src/bed-exclude.js';

describe('parseBedExcludeArea', () => {
  it('returns [] on empty / undefined input', () => {
    expect(parseBedExcludeArea(undefined)).toEqual([]);
    expect(parseBedExcludeArea(null)).toEqual([]);
    expect(parseBedExcludeArea('')).toEqual([]);
  });

  it('parses the fdm_qidi_common single-point placeholder as one degenerate polygon', () => {
    // Flattened value = one polygon of one point.
    expect(parseBedExcludeArea('0x0')).toEqual([[{ x: 0, y: 0 }]]);
  });

  it('parses the Qudi Q2 comma-separated 4-point polygon', () => {
    expect(parseBedExcludeArea('0x0,11x0,11x16,0x16')).toEqual([[
      { x: 0, y: 0 }, { x: 11, y: 0 }, { x: 11, y: 16 }, { x: 0, y: 16 },
    ]]);
  });

  it('parses multiple polygons separated by ; between comma-joined points', () => {
    // Two 5x5 exclusion boxes at opposite corners.
    const field = '0x0,5x0,5x5,0x5;100x100,105x100,105x105,100x105';
    expect(parseBedExcludeArea(field)).toEqual([
      [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }],
      [{ x: 100, y: 100 }, { x: 105, y: 100 }, { x: 105, y: 105 }, { x: 100, y: 105 }],
    ]);
  });

  it('drops malformed segments silently', () => {
    expect(parseBedExcludeArea('0x0,garbage,10x10')).toEqual([[{ x: 0, y: 0 }, { x: 10, y: 10 }]]);
  });
});

describe('excludeAreaBboxes', () => {
  it('computes axis-aligned bounds per polygon', () => {
    const field = '0x0,11x0,11x16,0x16;100x100,105x100,105x105,100x105';
    expect(excludeAreaBboxes(field)).toEqual([
      { minX: 0, maxX: 11, minY: 0, maxY: 16 },
      { minX: 100, maxX: 105, minY: 100, maxY: 105 },
    ]);
  });

  it('returns [] for empty input', () => {
    expect(excludeAreaBboxes(undefined)).toEqual([]);
  });
});

describe('isDegenerateExcludeArea', () => {
  it('flags single-point exclusion (< 3 points)', () => {
    expect(isDegenerateExcludeArea('0x0')).toBe(true);
  });

  it('flags empty / undefined as degenerate', () => {
    expect(isDegenerateExcludeArea(undefined)).toBe(true);
    expect(isDegenerateExcludeArea('')).toBe(true);
  });

  it('flags a single 2-point polygon (line, not area)', () => {
    expect(isDegenerateExcludeArea('0x0,10x0')).toBe(true);
  });

  it('flags 3+ duplicate points (still not an area)', () => {
    expect(isDegenerateExcludeArea('0x0,0x0,0x0')).toBe(true);
  });

  it('accepts the Qudi Q2 4-point corner rectangle as real', () => {
    expect(isDegenerateExcludeArea('0x0,11x0,11x16,0x16')).toBe(false);
  });

  it('accepts a real triangle', () => {
    expect(isDegenerateExcludeArea('0x0,10x0,10x10')).toBe(false);
  });

  it('returns false when ANY polygon is real, even if others are placeholders', () => {
    expect(isDegenerateExcludeArea('0x0;100x100,105x100,105x105,100x105')).toBe(false);
  });
});

describe('sanitizeBedExcludeArea', () => {
  it('strips bed_exclude_area when it is only the "0x0" placeholder', () => {
    const out = sanitizeBedExcludeArea({
      bed_exclude_area: '0x0',
      nozzle_diameter: '0.4',
      extruder_clearance_radius: '47',
    });
    expect(out).toEqual({ nozzle_diameter: '0.4', extruder_clearance_radius: '47' });
  });

  it('passes real Qudi Q2 4-point corner polygon through', () => {
    const config = {
      bed_exclude_area: '0x0,11x0,11x16,0x16',
      nozzle_diameter: '0.4',
    };
    expect(sanitizeBedExcludeArea(config)).toEqual(config);
  });

  it('is a no-op when bed_exclude_area is absent', () => {
    const config = { nozzle_diameter: '0.4' };
    expect(sanitizeBedExcludeArea(config)).toEqual(config);
  });
});

describe('forceStripBedExcludeArea', () => {
  it('removes bed_exclude_area even for legitimate polygons', () => {
    const out = forceStripBedExcludeArea({
      bed_exclude_area: '0x0,11x0,11x16,0x16',
      nozzle_diameter: '0.4',
    });
    expect(out).toEqual({ nozzle_diameter: '0.4' });
  });

  it('is a no-op when the field is absent', () => {
    const config = { nozzle_diameter: '0.4' };
    expect(forceStripBedExcludeArea(config)).toEqual(config);
  });
});
