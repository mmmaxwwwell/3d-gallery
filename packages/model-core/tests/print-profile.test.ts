import { describe, it, expect } from 'vitest';
import { validateManifest } from '../src/manifest.ts';
import { ManifestError } from '../src/errors.ts';
import {
  DEFAULT_PRINT_PROFILE,
  describeProfile,
  materialFor,
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

  it('rejects a print plate that mixes materials', () => {
    const m = model({
      parts: [part('peg.stl'), part('roller.stl')],
      previews: [{ ...part('plate-1.3mf'), plate: true, components: [{ part: 'peg.stl', qty: 1 }, { part: 'roller.stl', qty: 1 }] }],
      filament: [{ material: 'PETG', color: 'any' }, { material: 'TPU', color: 'any', parts: ['peg.stl'] }],
    });
    expect(issuesOf({ models: [m] })).toEqual(['thing.plate-1.3mf: a print plate mixes TPU and PETG — one plate prints in one material']);
  });
});
