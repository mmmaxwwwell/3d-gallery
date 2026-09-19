// SPDX-License-Identifier: MIT
//
// End-to-end WASM slice test — the real thing. Drives OrcaSlicer WASM
// against the XYZ test cube with the user's actual Flashforge printer +
// Kingroon PETG filament config, captures the emitted g-code, and asserts:
//   1. Raw slicer output has structural correctness (G28, macros, layers).
//   2. The known bug (out-of-bed coordinates from center-origin `printable_area`)
//      is either NOT present or IS fixed by our post-processor.
//   3. Placeholders like `[bed_temperature_initial_layer_single]` are gone
//      after post-processing.
//   4. The post-processed final gcode fits within the bed bounds.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const FIX = (n: string) => JSON.parse(readFileSync(join(HERE, 'fixtures', n), 'utf8'));

// Fixtures now use the raw+parents schema; flattening happens in-page via the
// gallery-app's `flattenPresetForSlicer` helper (same code path as production).
const PRINTER = FIX('flashforge-adventurer-5m-klipper-left.json') as {
  name: string;
  raw: Record<string, unknown>;
  parents: Array<{ name: string; raw: Record<string, unknown> }>;
  compatiblePrinters?: string[];
};
const FILAMENT = FIX('kingroon-petg-ffadm5.json') as {
  name: string;
  raw: Record<string, unknown>;
  parents: Array<{ name: string; raw: Record<string, unknown> }>;
  compatiblePrinters?: string[];
};

// One test that runs the whole flow. Split into steps for isolated failure reporting.
test('sliced XYZ test cube fits in Flashforge Adventurer 5M bed after post-process', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('/');
  await page.waitForFunction(() => document.querySelectorAll('#model-list .model-item').length > 0);

  // Skip the test when the WASM assets aren't served — the slicer would fail
  // to init. Populate `packages/print-toolkit/assets/` first (either
  // `npm run fetch-wasm -w @3d-gallery/print-toolkit` or copy from
  // `openscad-web-generator/result/`).
  const wasmOk = await page.evaluate(async () => {
    const res = await fetch('/3d-gallery/wasm/libslic3r.wasm', { method: 'HEAD' });
    return res.ok;
  });
  test.skip(!wasmOk, 'libslic3r.wasm not served — populate packages/print-toolkit/assets first.');

  // Slice in-page using the real toolkit exports and the gallery-app's
  // preset-flatten helper (same production code path).
  const sliceResult = await page.evaluate(
    async ({ printerFixture, filamentFixture, process }) => {
      const toolkit = await import(
        '/3d-gallery/@fs/home/max/git/3d-gallery/packages/print-toolkit/src/index.ts'
      );
      const flat = await import(
        '/3d-gallery/@fs/home/max/git/3d-gallery/packages/gallery-app/src/print/preset-flatten.ts'
      );

      const meshRes = await fetch('/3d-gallery/models/test-cube-xyz/cube.stl');
      if (!meshRes.ok) throw new Error(`STL fetch failed: HTTP ${meshRes.status}`);
      const meshBuffer = await meshRes.arrayBuffer();

      const printerConfig = flat.flattenPresetForSlicer({
        id: 'printer:test', kind: 'printer', name: printerFixture.name,
        raw: printerFixture.raw, parents: printerFixture.parents, updatedAt: 0,
      });
      const filamentConfig = flat.flattenPresetForSlicer({
        id: 'filament:test', kind: 'filament', name: filamentFixture.name,
        raw: filamentFixture.raw, parents: filamentFixture.parents, updatedAt: 0,
      });

      // Bed-surface aliases — the slicer substitutes machine_start_gcode
      // placeholders from these field names, but Orca's per-plate schema
      // doesn't populate them. Feed the picked surface's temperature in
      // through the alias fields so START_PRINT gets the right BED_TEMP.
      const hotBedTemp = filamentConfig['hot_plate_temp_initial_layer']?.split(';')[0] ??
        filamentConfig['hot_plate_temp']?.split(';')[0] ?? '';
      const bedAliases: Record<string, string> = hotBedTemp ? {
        bed_temperature_initial_layer_single: hotBedTemp,
        first_layer_bed_temperature: hotBedTemp,
      } : {};

      const config: Record<string, string> = {
        ...printerConfig,
        ...filamentConfig,
        ...bedAliases,
        ...process,
      };

      const backend = toolkit.createSlicerBackend();
      const bed = toolkit.parsePrintableArea(printerConfig['printable_area']);
      const cx = bed ? (bed.minX + bed.maxX) / 2 : 0;
      const cy = bed ? (bed.minY + bed.maxY) / 2 : 0;
      const progress: Array<{ stage: string; pct: number }> = [];
      const result = await backend.slicePlate(
        [{ data: meshBuffer, format: 'stl', posX: cx, posY: cy, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1 }],
        config,
        undefined,
        (stage, pct) => progress.push({ stage, pct }),
      );
      backend.destroy();

      // Also run the post-process in-page so we get one atomic snapshot.
      const report = toolkit.postProcessGcode(result.gcode, {
        printableArea: printerConfig['printable_area'],
        nozzleTemp:
          filamentConfig['nozzle_temperature_initial_layer']?.split(';')[0] ??
          filamentConfig['nozzle_temperature']?.split(';')[0],
        bedTemp:
          filamentConfig['hot_plate_temp_initial_layer']?.split(';')[0] ??
          filamentConfig['hot_plate_temp']?.split(';')[0],
        preheat: true,
        centerOnBed: true,
      });

      return {
        engineName: backend.engineName,
        rawGcodeSize: result.gcode.length,
        rawHead: result.gcode.split('\n').slice(0, 40).join('\n'),
        rawBounds: toolkit.gcodeXYBounds(result.gcode),
        report: {
          bedBounds: report.bedBounds,
          originalGcodeBounds: report.originalGcodeBounds,
          finalGcodeBounds: report.finalGcodeBounds,
          translation: report.translation,
          translated: report.translated,
          outOfBounds: report.outOfBounds,
          placeholdersResolved: report.placeholdersResolved,
          finalHead: report.gcode.split('\n').slice(0, 40).join('\n'),
          finalSize: report.gcode.length,
        },
        progressStages: [...new Set(progress.map((p) => p.stage))],
      };
    },
    {
      printerFixture: PRINTER,
      filamentFixture: FILAMENT,
      process: {
        // Match the print-dialog defaults: 0.2 mm layer, 3 walls, 15% gyroid,
        // no supports, no brim, no skirt. `curr_bed_type = Hot Plate` picks
        // `hot_plate_temp` for the bed instead of the cool-plate default.
        curr_bed_type: 'Hot Plate',
        layer_height: '0.2',
        initial_layer_print_height: '0.2',
        wall_loops: '3',
        sparse_infill_density: '15%',
        sparse_infill_pattern: 'gyroid',
        enable_support: '0',
        brim_type: 'no_brim',
        brim_width: '0',
        skirt_loops: '0',
        skirt_distance: '0',
      },
    },
  );

  // Diagnostic dump — always print so failures include a full picture.
  console.log(`slice engine: ${sliceResult.engineName}`);
  console.log(`raw g-code size: ${sliceResult.rawGcodeSize} bytes`);
  console.log(`raw XY bounds: ${JSON.stringify(sliceResult.rawBounds)}`);
  console.log('=== raw g-code head ===');
  console.log(sliceResult.rawHead);
  console.log('=== post-process report ===');
  console.log(JSON.stringify(sliceResult.report, (_k, v) => v, 2));
  console.log('=== progress stages seen ===', sliceResult.progressStages);

  // Sanity — slicer produced non-trivial output.
  expect(sliceResult.rawGcodeSize).toBeGreaterThan(1000);
  expect(sliceResult.rawBounds).not.toBeNull();

  // Regression check — using `slicePlate` with explicit `posX/posY: 0`
  // places the object at the printable_area's origin. On a center-origin
  // bed like the Flashforge Adventurer 5M, that puts the cube on the bed
  // center — no post-process translation needed. If the slicer ever
  // regresses to placing at bed-min corner, `translated` will flip to true.
  const raw = sliceResult.rawBounds!;
  const rawCenterX = (raw.minX + raw.maxX) / 2;
  const rawCenterY = (raw.minY + raw.maxY) / 2;
  // Cube should sit within ±5 mm of bed center after slicePlate places it there.
  expect(Math.abs(rawCenterX)).toBeLessThan(5);
  expect(Math.abs(rawCenterY)).toBeLessThan(5);

  // Raw coords must be inside the bed. If this fails, slicePlate stopped
  // honoring posX/posY.
  expect(raw.minX).toBeGreaterThanOrEqual(-110);
  expect(raw.maxX).toBeLessThanOrEqual(110);
  expect(raw.minY).toBeGreaterThanOrEqual(-110);
  expect(raw.maxY).toBeLessThanOrEqual(110);

  // Bed bounds recovered from printer preset.
  expect(sliceResult.report.bedBounds).toEqual({ minX: -110, maxX: 110, minY: -110, maxY: 110 });

  // Auto-center should NOT trigger when the slicer already placed correctly.
  expect(sliceResult.report.translated).toBe(false);
  expect(sliceResult.report.translation.dx).toBe(0);
  expect(sliceResult.report.translation.dy).toBe(0);
  const finalC = sliceResult.report.finalGcodeBounds!;
  expect(Math.abs((finalC.minX + finalC.maxX) / 2)).toBeLessThan(5);
  expect(Math.abs((finalC.minY + finalC.maxY) / 2)).toBeLessThan(5);

  // No coord outside the bed after post-process.
  expect(sliceResult.report.outOfBounds).toBe(false);
  expect(finalC.minX).toBeGreaterThanOrEqual(-110);
  expect(finalC.maxX).toBeLessThanOrEqual(110);
  expect(finalC.minY).toBeGreaterThanOrEqual(-110);
  expect(finalC.maxY).toBeLessThanOrEqual(110);

  // Preheat prelude prepended, Klipper macro preserved, standard heat codes present.
  expect(sliceResult.report.finalHead).toMatch(/^; print-toolkit: async preheat/);
  expect(sliceResult.report.finalHead).toMatch(/M140\s+S\d/);
  expect(sliceResult.report.finalHead).toMatch(/M104\s+S\d/);
  expect(sliceResult.report.finalHead).toMatch(/START_PRINT\s+EXTRUDER_TEMP=\d+\s+BED_TEMP=\d+/);

  // START_PRINT must get the Kingroon PETG hot-plate values (255 / 85),
  // not the cool-plate default (60) — regression check for the "bed didn't
  // heat" bug. Both the async preheat and the macro invocation should agree.
  expect(sliceResult.report.finalHead).toMatch(/START_PRINT\s+EXTRUDER_TEMP=255\s+BED_TEMP=85/);
  expect(sliceResult.report.finalHead).toMatch(/M140\s+S85\b/);
  expect(sliceResult.report.finalHead).toMatch(/M104\s+S255\b/);

  // Placeholders that Klipper's macro can't parse must be gone.
  const finalContainsPlaceholders =
    sliceResult.report.finalHead.includes('[bed_temperature_initial_layer_single]') ||
    sliceResult.report.finalHead.includes('[first_layer_bed_temperature]') ||
    sliceResult.report.finalHead.includes('[nozzle_temperature_initial_layer]') ||
    sliceResult.report.finalHead.includes('[first_layer_temperature]');
  expect(finalContainsPlaceholders).toBe(false);

  // Placeholder resolution flag agrees with the check above — sanity.
  expect(sliceResult.report.placeholdersResolved).toBe(true);
});
