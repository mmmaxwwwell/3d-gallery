// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The real libslic3r WASM, run in Node — the path build-time print estimates
 * take. Skipped when the assets haven't been fetched (`npm run fetch-wasm`).
 */

import { existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { createNodeSlicerEngine, slicerWasmPath } from '../src/node-slicer.js';
import { buildOrcaConfig } from '../src/orca-slicer-settings.js';
import { DEFAULT_PRINT_PROFILE } from '../src/print-profile.js';
import type { ResolvedFilamentSettings } from '../src/types.js';
import type { PrinterSettings } from '../src/slicer-settings.js';

/** Binary STL of an axis-aligned box sitting on z = 0. */
function boxStl(x: number, y: number, z: number): Uint8Array {
  const v = (i: number) => [(i & 1) * x, ((i >> 1) & 1) * y, ((i >> 2) & 1) * z];
  // Two outward-wound triangles per face, as corner indices.
  const tris = [
    [0, 2, 1], [1, 2, 3], [4, 5, 6], [5, 7, 6],
    [0, 1, 4], [1, 5, 4], [2, 6, 3], [3, 6, 7],
    [0, 4, 2], [2, 4, 6], [1, 3, 5], [3, 7, 5],
  ];
  const buf = new ArrayBuffer(84 + tris.length * 50);
  const view = new DataView(buf);
  view.setUint32(80, tris.length, true);
  tris.forEach((tri, t) => {
    const at = 84 + t * 50 + 12;
    tri.forEach((corner, c) => v(corner).forEach((n, k) => view.setFloat32(at + c * 12 + k * 4, n, true)));
  });
  return new Uint8Array(buf);
}

const FILAMENT: ResolvedFilamentSettings = {
  nozzleTemp: 210, bedTemp: 60, fanSpeed: 100, firstLayerFan: 0, printSpeed: 200,
  retractDist: 0.8, retractSpeed: 30, deretractionSpeed: 0, firstLayerNozzleTemp: 210,
  firstLayerBedTemp: 60, minSpeed: 20, minLayerTime: 6, flowRatio: 1.0,
  enablePressureAdvance: false, pressureAdvance: 0.04, adaptivePressureAdvance: false,
  overhangFanSpeed: 100, overhangFanThreshold: 0, enableOverhangBridgeFan: true,
  closeFanFirstLayers: 1, fanCoolingLayerTime: 60, slowDownLayerTime: 4, fanMaxSpeed: 100,
  coolPlateTemp: 55, coolPlateTempInitialLayer: 60, engPlateTemp: 80, engPlateTempInitialLayer: 85,
  texturedPlateTemp: 65, texturedPlateTempInitialLayer: 70,
};

const PRINTER: PrinterSettings = {
  bedWidth: 220, bedDepth: 220, maxHeight: 220, originCenter: false,
  startGcode: '', endGcode: '', toolChangeGcode: '', printableArea: [], bedExcludeAreas: [],
  printerStructureType: 'corexy', nozzleType: 'brass', nozzleHRC: 0, auxiliaryFan: false,
  chamberTempControl: false, maxVolumetricSpeed: 0,
};

async function printTime(flow: number): Promise<number> {
  const engine = await createNodeSlicerEngine();
  try {
    engine.loadSTL(boxStl(30, 30, 10));
    engine.setConfig({
      ...buildOrcaConfig(DEFAULT_PRINT_PROFILE, FILAMENT, PRINTER, null, 1),
      filament_max_volumetric_speed: String(flow),
    });
    engine.slice();
    engine.exportGCode();
    return engine.getSliceStats()?.printTime ?? 0;
  } finally {
    engine.destroy();
  }
}

describe.skipIf(!existsSync(slicerWasmPath()))('node slicer', () => {
  it('estimates a print time that falls as the flow ceiling rises', async () => {
    const slow = await printTime(3);
    const fast = await printTime(18);
    expect(fast).toBeGreaterThan(0);
    expect(slow).toBeGreaterThan(fast);
  }, 60000);
});
