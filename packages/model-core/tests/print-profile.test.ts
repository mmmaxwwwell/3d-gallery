import { describe, it, expect } from 'vitest';
import { validateManifest } from '../src/manifest.ts';
import { ManifestError } from '../src/errors.ts';
import {
  DEFAULT_PRINT_PROFILE,
  describeProfile,
  materialFor,
  plateFilaments,
  plateMaterial,
  recommendedProfile,
} from '../src/print-profile.ts';

function issuesOf(raw: unknown): string[] {
  try {
    validateManifest(raw);
    return [];
  } catch (e) {
    if (e instanceof ManifestError) return e.issues;
    throw e;
  }
}

const part = (file: string) => ({ file, format: file.endsWith('.3mf') ? '3mf' : 'stl', label: file });
const model = (over: Record<string, unknown> = {}) => ({ slug: 'thing', title: 'Thing', description: 'A thing.', ...over });

describe('recommendedProfile', () => {
  it('is the default when the model says nothing', () => {
    expect(recommendedProfile({})).toEqual(DEFAULT_PRINT_PROFILE);
    expect(describeProfile(DEFAULT_PRINT_PROFILE)).toBe('4 walls, 15% gyroid, no supports, no brim');
  });

  it('says when supports stay on the build plate', () => {
    expect(describeProfile({ ...DEFAULT_PRINT_PROFILE, supports: 'tree', supportsOnBuildPlateOnly: true }))
      .toBe('4 walls, 15% gyroid, tree supports (build plate only), no brim');
  });

  it('takes a catch-all filament as the material, and an explicit profile over both', () => {
    const filament = [{ material: 'PLA', color: 'any' }, { material: 'TPU 64D', color: 'any', parts: ['peg.stl'] }];
    expect(recommendedProfile({ filament }).material).toBe('PLA');
    expect(recommendedProfile({ filament, printProfile: { material: 'ASA', walls: 2 } })).toMatchObject({ material: 'ASA', walls: 2 });
    expect(materialFor({ filament }, 'peg.stl')).toBe('TPU 64D');
    expect(materialFor({ filament }, 'wall.stl')).toBe('PLA');
  });

  it('gives a plate its pieces\' material', () => {
    const filament = [{ material: 'TPU', color: 'any', parts: ['peg.stl'] }];
    const plate = { file: 'plate-2.3mf', format: '3mf' as const, label: 'p', components: [{ part: 'peg.stl', qty: 4 }] };
    expect(plateMaterial({ filament }, plate)).toBe('TPU');
    expect(plateMaterial({ filament }, { ...plate, components: undefined })).toBe('PETG');
  });
});

describe('validateManifest — print profile', () => {
  it('accepts a partial profile', () => {
    expect(issuesOf({ models: [model({ printProfile: { walls: 3, supports: 'tree' } })] })).toEqual([]);
  });

  it('rejects bad fields', () => {
    expect(issuesOf({ models: [model({ printProfile: { walls: 0, infillDensity: 120, supports: 'lots', supportsOnBuildPlateOnly: 1, brim: 'yes', speed: 3 } })] })).toEqual([
      'thing.printProfile: "walls" must be a positive integer',
      'thing.printProfile: "infillDensity" must be a number from 0 to 100',
      'thing.printProfile: "supports" must be one of none, normal, tree',
      'thing.printProfile: "supportsOnBuildPlateOnly" must be a boolean',
      'thing.printProfile: "brim" must be a boolean',
      'thing.printProfile: unknown field "speed"',
    ]);
  });

  it('accepts a print plate that mixes materials, for a printer with an AMS', () => {
    const m = model({
      parts: [part('peg.stl'), part('roller.stl')],
      previews: [{ ...part('plate-1.3mf'), plate: true, components: [{ part: 'peg.stl', qty: 1 }, { part: 'roller.stl', qty: 1 }] }],
      filament: [{ material: 'PETG', color: 'any' }, { material: 'TPU', color: 'any', parts: ['peg.stl'] }],
    });
    expect(issuesOf({ models: [m] })).toEqual([]);
  });

  it('rejects a plate flag that is not a boolean', () => {
    const m = model({ previews: [{ ...part('plate-1.3mf'), plate: 'yes' }] });
    expect(issuesOf({ models: [m] })).toEqual(['thing.plate-1.3mf: "plate" must be a boolean']);
  });
});

describe('plateFilaments', () => {
  const legend = (color: string, extra: Record<string, unknown> = {}) => ({ color, label: color, ...extra });

  it('pairs part-less legend rows with part-less filaments by position', () => {
    const tag = {
      filament: [{ material: 'PLA', color: 'black' }, { material: 'PLA', color: 'white' }],
    };
    const plate = { ...part('plate.3mf'), legend: [legend('#000000'), legend('#FFFFFF')] } as never;
    expect(plateFilaments(tag, plate)).toEqual([
      { material: 'PLA', color: 'black', hexes: ['#000000'] },
      { material: 'PLA', color: 'white', hexes: ['#ffffff'] },
    ]);
  });

  it('gives colours that print in the same filament one slot', () => {
    const roller = { filament: [{ material: 'PETG', color: 'any' }, { material: 'TPU', color: 'any', parts: ['peg.stl'] }] };
    const plate = {
      ...part('plate-1.3mf'),
      legend: [
        legend('#4a90d9', { part: 'roller.stl', shades: ['#2f6db0'] }),
        legend('#e0e0e0', { part: 'stand.stl' }),
        legend('#ff4757', { part: 'peg.stl' }),
      ],
    } as never;
    expect(plateFilaments(roller, plate)).toEqual([
      { material: 'PETG', hexes: ['#4a90d9', '#2f6db0', '#e0e0e0'] },
      { material: 'TPU', hexes: ['#ff4757'] },
    ]);
  });

  it('is the plate material alone when there is no legend', () => {
    expect(plateFilaments({}, part('plate.3mf') as never)).toEqual([{ material: 'PETG', hexes: [] }]);
  });
});

describe('validateManifest — print plates', () => {
  it('still validates', () => {
    expect(issuesOf({ models: [model({ previews: [{ ...part('p.3mf'), plate: true }] })] })).toEqual([]);
  });
});
