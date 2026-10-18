// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The operator's first X1C print, checked before it is sent: black PCTG
 * (#161616) with their own "American Filament PCTG @ BBL1C" preset on a
 * Textured PEI plate, through the real slicer WASM. Once this went out with a
 * cold bed (`curr_bed_type` fell back to Cool Plate, 0 °C) and a grey
 * filament colour no tray matched. Skipped when the slicer assets aren't
 * fetched (`npm run fetch-wasm`).
 */

import { existsSync, readFileSync } from 'node:fs';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { createNodeSlicerEngine, slicerWasmPath } from '../src/node-slicer.js';
import { loadBblPresets, type BblPreset } from '../src/bbl-presets.js';
import { bambuSliceConfig, type OrcaPresetJson } from '../src/bambu-slice-config.js';
import { packageBambuGcode3mf } from '../src/bambu-3mf.js';
import { matchAmsTrays } from '../src/bambu.js';
import { threeMfVolumes } from '../src/threemf-volumes.js';
import { plate3mf } from './fixtures/plate-3mf.js';

/** Copied from the operator's Orca config, with its BBL parents as their Orca install has them. */
const PCTG = JSON.parse(readFileSync(new URL('./fixtures/american-filament-pctg-bbl1c.json', import.meta.url), 'utf8')) as Pick<BblPreset, 'raw' | 'parents'>;

function merged(preset: Pick<BblPreset, 'raw' | 'parents'>): OrcaPresetJson {
  const out: OrcaPresetJson = {};
  for (const p of [...preset.parents].reverse()) Object.assign(out, p.raw);
  Object.assign(out, preset.raw);
  delete out['inherits'];
  return out;
}

const first = (v: unknown) => Number((v as string[])[0]);
const BLACK = '#161616';

describe.skipIf(!existsSync(slicerWasmPath()))('black PCTG on the X1C', () => {
  it('heats the bed and nozzle the preset says, and names the loaded spool', async () => {
    const bbl = await loadBblPresets();
    const printer = merged(bbl.printers[0]);
    const pctg = merged(PCTG);
    const bedTemp = first(pctg['textured_plate_temp_initial_layer']);
    const nozzleTemp = first(pctg['nozzle_temperature_initial_layer']);
    expect(bedTemp).toBe(80);
    expect(nozzleTemp).toBe(265);

    const file = plate3mf([[{ color: BLACK, extruder: 1, box: [-20, 20, -15, 15, 0, 4] }]]);
    const engine = await createNodeSlicerEngine();
    let gcode: string;
    try {
      const obj = engine.add3MFObject(file, 128, 128, 0, 1, 1, 1);
      for (const v of threeMfVolumes(file)!) engine.setVolumeExtruder(obj, v.index, 1);
      engine.setConfig({
        ...bambuSliceConfig({ printer, filaments: [pctg], colors: [BLACK], bedType: 'Textured PEI Plate' }),
        layer_height: '0.2', initial_layer_print_height: '0.2', wall_loops: '4', sparse_infill_density: '15%',
      });
      engine.slice();
      gcode = engine.exportGCode();
    } finally {
      engine.destroy();
    }

    const body = gcode.slice(gcode.indexOf('; EXECUTABLE_BLOCK_START'), gcode.indexOf('; EXECUTABLE_BLOCK_END'));
    const beforeEnd = body.slice(0, body.indexOf('M140 S0 ; turn off bed'));
    // Every bed command until the end G-code turns it off heats to the textured plate's 80.
    const bed = [...beforeEnd.matchAll(/^M1[49]0 S(\d+)/gm)].map((m) => Number(m[1]));
    expect(bed.length).toBeGreaterThanOrEqual(2);
    expect(new Set(bed)).toEqual(new Set([bedTemp]));
    expect(beforeEnd).toMatch(/^M140 S80 ;set bed temp$/m);
    expect(beforeEnd).toMatch(/^M190 S80 ;wait for bed temp$/m);
    expect(beforeEnd).toMatch(/^M104 S265 ;set extruder temp$/m);
    expect(beforeEnd).toMatch(/^M109 S265$/m);
    expect(gcode).toMatch(/^; curr_bed_type = Textured PEI Plate$/m);
    expect(gcode).toMatch(/^; filament_colour = #161616$/m);
    expect(gcode).toMatch(/^; filament_type = PCTG$/m);

    const info = strFromU8(unzipSync(packageBambuGcode3mf({
      gcode,
      printerModelId: bbl.printers[0].modelId!,
      nozzleDiameter: 0.4,
      filaments: [{ slot: 1, type: 'PCTG', color: BLACK, trayInfoIdx: String(pctg['filament_id']) }],
    }))['Metadata/slice_info.config']);
    expect(info).toMatch(/<filament id="1" tray_info_idx="GFG99" type="PCTG" color="#161616"/);

    // The live AMS: PCTG #161616 in slot 3, nothing else.
    const ams = { trays: [{ slot: 3, type: 'PCTG', color: BLACK, name: 'PCTG', remain: 0 }], external: null };
    const match = matchAmsTrays([{ slot: 1, type: 'PCTG', color: BLACK }], ams);
    expect(match.problems).toEqual([]);
    expect(match.assignments.map((a) => [a.tray, a.exact])).toEqual([[3, true]]);
  }, 120000);
});
