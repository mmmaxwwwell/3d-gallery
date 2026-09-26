// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { ORCA_SCHEMA } from '@3d-gallery/print-toolkit/orca-schema-data';
import {
  clearOverride,
  filterLayout,
  listChanges,
  resolveField,
  setOverride,
  unrecognisedKeys,
} from '../../src/print/preset-edit.js';
import { exportRawJson, flattenPresetForSlicer, mergeInheritance } from '../../src/print/preset-flatten.js';
import type { PrintPreset } from '../../src/print/print-storage.js';

const def = ORCA_SCHEMA.options;

function preset(overrides?: PrintPreset['overrides']): PrintPreset {
  return {
    id: 'printer:Left',
    kind: 'printer',
    name: 'Left',
    raw: { name: 'Left', inherits: 'AD5M 0.4', print_host: '10.0.0.58:7125', retraction_length: ['0.8'] },
    parents: [
      { name: 'AD5M 0.4', raw: { nozzle_diameter: ['0.4'], retraction_length: ['1.2'], gcode_flavor: 'klipper' } },
      { name: 'fdm_common', raw: { gcode_flavor: 'marlin', z_offset: '0' } },
    ],
    overrides,
    updatedAt: 0,
  };
}

describe('resolveField', () => {
  it('names the layer each value comes from', () => {
    const p = preset();
    expect(resolveField(p, {}, 'print_host', def['print_host']).origin).toEqual({ layer: 'file' });
    expect(resolveField(p, {}, 'nozzle_diameter', def['nozzle_diameter']).origin)
      .toEqual({ layer: 'parent', name: 'AD5M 0.4' });
    // The nearest parent wins over the root.
    expect(resolveField(p, {}, 'gcode_flavor', def['gcode_flavor']).value).toBe('klipper');
    expect(resolveField(p, {}, 'thumbnails', def['thumbnails']).origin).toEqual({ layer: 'default' });
    expect(resolveField(p, {}, 'no_such_key', undefined).origin).toEqual({ layer: 'unset' });
  });

  it('keeps what an edited field started at', () => {
    const state = resolveField(preset(), { retraction_length: ['0.5'] }, 'retraction_length', def['retraction_length']);
    expect(state).toMatchObject({
      value: ['0.5'],
      origin: { layer: 'override' },
      base: ['0.8'],
      baseOrigin: { layer: 'file' },
      overridden: true,
    });
  });
});

describe('setOverride / clearOverride', () => {
  it('records a change and drops it again when set back', () => {
    const p = preset();
    const edited = setOverride(p, {}, 'retraction_length', ['0.5'], def['retraction_length']);
    expect(edited).toEqual({ retraction_length: ['0.5'] });
    expect(setOverride(p, edited, 'retraction_length', ['0.8'], def['retraction_length'])).toEqual({});
  });

  it('treats matching the Orca default as no change for a field nothing sets', () => {
    expect(setOverride(preset(), {}, 'thumbnails', def['thumbnails'].default!, def['thumbnails'])).toEqual({});
  });

  it('does not mutate what it was given', () => {
    const before = { z_offset: '0.1' };
    clearOverride(before, 'z_offset');
    expect(before).toEqual({ z_offset: '0.1' });
  });
});

describe('listChanges', () => {
  it('lists each edit with where the old value came from', () => {
    const [change] = listChanges(preset(), { nozzle_diameter: ['0.6'] }, ORCA_SCHEMA);
    expect(change).toMatchObject({
      key: 'nozzle_diameter',
      from: ['0.4'],
      fromOrigin: { layer: 'parent', name: 'AD5M 0.4' },
      to: ['0.6'],
    });
  });
});

describe('unrecognisedKeys', () => {
  it("finds fields the schema doesn't list for the kind, ignoring bookkeeping", () => {
    const p = preset();
    p.raw['sparse_infill_density'] = '15%';
    expect(unrecognisedKeys(p, {}, ORCA_SCHEMA.kinds.printer)).toEqual(['sparse_infill_density']);
  });
});

describe('filterLayout', () => {
  const pages = [{ title: 'P', groups: [{ title: 'G', keys: ['nozzle_diameter', 'retraction_length', 'z_offset'] }] }];

  it('searches labels and keys, and can narrow to edited fields', () => {
    const hits = filterLayout(pages, ORCA_SCHEMA, { mode: 'develop', query: 'nozzle diam', changedOnly: false }, () => false);
    expect(hits[0].groups[0].keys).toEqual(['nozzle_diameter']);
    const changed = filterLayout(pages, ORCA_SCHEMA, { mode: 'develop', query: '', changedOnly: true }, (k) => k === 'z_offset');
    expect(changed[0].groups[0].keys).toEqual(['z_offset']);
  });

  it('drops pages that end up empty', () => {
    expect(filterLayout(pages, ORCA_SCHEMA, { mode: 'develop', query: 'zzz', changedOnly: false }, () => false)).toEqual([]);
  });
});

describe('overrides reach the slicer and exports', () => {
  it('layers edits over the file and the chain', () => {
    const p = preset({ retraction_length: ['0.5'] });
    expect(mergeInheritance(p)['retraction_length']).toEqual(['0.5']);
    expect(flattenPresetForSlicer(p)['retraction_length']).toBe('0.5');
    // The imported file itself is untouched.
    expect(p.raw['retraction_length']).toEqual(['0.8']);
  });

  it("exports the preset's own fields with edits applied", () => {
    const exported = JSON.parse(exportRawJson(preset({ z_offset: '0.1' })));
    expect(exported).toMatchObject({ inherits: 'AD5M 0.4', z_offset: '0.1', print_host: '10.0.0.58:7125' });
  });
});
