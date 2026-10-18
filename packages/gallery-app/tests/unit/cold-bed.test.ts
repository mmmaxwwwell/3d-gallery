// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { coldBedProblem, orcaBedType } from '../../src/print/plate-slice.js';
import type { PrintPreset } from '../../src/print/print-storage.js';

const filament = (name: string, raw: Record<string, string[]>): PrintPreset =>
  ({ id: `filament:${name}`, kind: 'filament', name, raw, parents: [], updatedAt: 0 });
const pctg = filament('American Filament PCTG @ BBL1C', {
  textured_plate_temp: ['80'], textured_plate_temp_initial_layer: ['80'],
  cool_plate_temp: ['0'], cool_plate_temp_initial_layer: ['0'],
  hot_plate_temp: ['80'], hot_plate_temp_initial_layer: ['80'],
});

describe('the plate on the bed', () => {
  it("is named the way libslic3r knows it", () => {
    expect(orcaBedType('Hot Plate')).toBe('High Temp Plate');
    expect(orcaBedType('Textured PEI Plate')).toBe('Textured PEI Plate');
  });

  it('refuses a plate the filament gives 0 °C for, on either path', () => {
    expect(coldBedProblem({ filament: pctg, bedSurface: 'Textured PEI Plate' })).toBeNull();
    expect(coldBedProblem({ filament: pctg, bedSurface: 'Hot Plate' })).toBeNull();
    expect(coldBedProblem({ filament: pctg, bedSurface: 'Cool Plate' }))
      .toBe('American Filament PCTG @ BBL1C has no bed temperature for a Cool Plate (cool_plate_temp_initial_layer is 0) — choose the plate that\'s on the printer, or another filament preset.');
    const slots = [{ filament: pctg, material: 'PCTG', color: '#161616', colors: [] }];
    expect(coldBedProblem({ filament: pctg, slots, bedSurface: 'Cool Plate' })).toMatch(/no bed temperature for a Cool Plate/);
  });
});
