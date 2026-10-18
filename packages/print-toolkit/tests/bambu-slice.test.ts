// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * A two-filament plate sliced for the X1 Carbon by the real libslic3r WASM in
 * Node, then packaged as the printer's `.gcode.3mf`. Skipped when the slicer
 * assets haven't been fetched (`npm run fetch-wasm`).
 */

import { existsSync } from 'node:fs';
import { strFromU8, unzipSync, strToU8 } from 'fflate';
import { describe, expect, it } from 'vitest';
import { createNodeSlicerEngine, slicerWasmPath } from '../src/node-slicer.js';
import { loadBblPresets, type BblPreset } from '../src/bbl-presets.js';
import { bambuSliceConfig, type OrcaPresetJson } from '../src/bambu-slice-config.js';
import { packageBambuGcode3mf } from '../src/bambu-3mf.js';
import { threeMfVolumes } from '../src/threemf-volumes.js';
import { md5Hex } from '../src/md5.js';
import { plate3mf, type Part } from './fixtures/plate-3mf.js';

function merged(preset: BblPreset): OrcaPresetJson {
  const out: OrcaPresetJson = {};
  for (const p of [...preset.parents].reverse()) Object.assign(out, p.raw);
  Object.assign(out, preset.raw);
  delete out['inherits'];
  return out;
}

/** Which tools extrude at which X, from the G-code. Tools are T0..T15; T255/T1000/… are Bambu's own. */
function toolsByX(gcode: string): Array<{ tool: number; x: number }> {
  const out: Array<{ tool: number; x: number }> = [];
  let tool = -1;
  let x = 0;
  for (const line of gcode.split('\n')) {
    const t = /^T(\d+)\s*$/.exec(line);
    if (t && Number(t[1]) < 16) { tool = Number(t[1]); continue; }
    const move = /^G[0-3]\s/.exec(line);
    if (!move) continue;
    const mx = /\bX(-?[\d.]+)/.exec(line);
    if (mx) x = Number(mx[1]);
    const e = /\bE(-?[\d.]+)/.exec(line);
    if (e && Number(e[1]) > 0 && tool >= 0) out.push({ tool, x });
  }
  return out;
}

const PROCESS = {
  layer_height: '0.2', initial_layer_print_height: '0.2', wall_loops: '2', sparse_infill_density: '15%',
  sparse_infill_pattern: 'gyroid', enable_support: '0', brim_type: 'no_brim', skirt_loops: '0',
};

describe.skipIf(!existsSync(slicerWasmPath()))('X1 Carbon slice', () => {
  it('feeds each piece from the filament slot it asks for, through the AMS', async () => {
    const bbl = await loadBblPresets();
    const printer = merged(bbl.printers[0]);
    const pla = merged(bbl.filaments.find((f) => f.name.startsWith('Bambu PLA Basic'))!);

    // Left piece in white (slot 2), right piece in black (slot 1): the second
    // object's volumes are the ones the WASM's merge renumbers.
    const left: Part = { color: '#ffffff', extruder: 2, box: [-25, -10, -8, 8, 0, 1] };
    const right: Part = { color: '#000000', extruder: 1, box: [10, 25, -8, 8, 0, 1] };
    const file = plate3mf([[left], [right]]);
    const volumes = threeMfVolumes(file)!;
    expect(volumes.map((v) => [v.color, v.extruder])).toEqual([['#ffffff', 2], ['#000000', 1]]);

    const engine = await createNodeSlicerEngine();
    let gcode: string;
    try {
      const obj = engine.add3MFObject(file, 128, 128, 0, 1, 1, 1);
      for (const v of volumes) engine.setVolumeExtruder(obj, v.index, v.extruder);
      engine.setConfig({
        ...bambuSliceConfig({ printer, filaments: [pla, pla], colors: ['#000000', '#FFFFFF'], bedType: 'Textured PEI Plate' }),
        ...PROCESS,
      });
      engine.slice();
      gcode = engine.exportGCode();
    } finally {
      engine.destroy();
    }

    expect(gcode).toContain(';===== machine: X1');
    expect(gcode).toMatch(/^M620 S0A/m);
    expect(gcode).toMatch(/^M620 S1A/m);
    const moves = toolsByX(gcode).filter(({ x }) => x > 100 && x < 156);
    const leftTools = new Set(moves.filter(({ x }) => x < 128).map((m) => m.tool));
    const rightTools = new Set(moves.filter(({ x }) => x > 128).map((m) => m.tool));
    expect([...leftTools]).toEqual([1]);
    expect([...rightTools]).toEqual([0]);

    const archive = unzipSync(packageBambuGcode3mf({
      gcode,
      printerModelId: bbl.printers[0].modelId,
      nozzleDiameter: 0.4,
      filaments: [
        { slot: 1, type: 'PLA', color: '#000000', trayInfoIdx: 'GFA00' },
        { slot: 2, type: 'PLA', color: '#ffffff', trayInfoIdx: 'GFA00' },
      ],
    }));
    expect(strFromU8(archive['Metadata/plate_1.gcode'])).toBe(gcode);
    expect(strFromU8(archive['Metadata/plate_1.gcode.md5'])).toBe(md5Hex(strToU8(gcode)).toUpperCase());
    const info = strFromU8(archive['Metadata/slice_info.config']);
    expect(info).toContain('<metadata key="printer_model_id" value="BL-P001"/>');
    expect([...info.matchAll(/<filament id="(\d)"[^>]* type="PLA" color="(#[0-9A-F]{6})"/g)].map((m) => [m[1], m[2]]))
      .toEqual([['1', '#000000'], ['2', '#FFFFFF']]);
  }, 120000);
});

describe('loadBblProcess', () => {
  it('gives an X1C plate Bambu\'s own speeds, nearest its layer height', async () => {
    const { loadBblProcess } = await import('../src/bbl-presets.js');
    const draft = await loadBblProcess(0.28);
    expect(draft.name).toBe('0.28mm Extra Draft @BBL X1C');
    expect(draft.config['default_acceleration']).toBe('10000');
    expect(Number(draft.config['outer_wall_speed'])).toBeGreaterThanOrEqual(150);
    expect(draft.config['inherits']).toBeUndefined();
    expect((await loadBblProcess(0.16)).name).toBe('0.20mm Standard @BBL X1C');
  });
});
