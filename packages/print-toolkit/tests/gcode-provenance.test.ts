// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import {
  buildProvenanceComment,
  parseProvenanceComment,
  hashConfig,
  type Provenance,
  type ProvenancePart,
} from '../src/gcode-provenance.js';

const FULL: Provenance = {
  timestamp: '2026-09-09T14:00:00Z',
  galleryVersion: 'main@abcdef1',
  slicerName: 'OrcaSlicer 2.3.1',
  wasmBuildTag: 'orcaslicer-wasm-2.3.1',
  modelSlug: 'test-cube-xyz',
  modelTitle: 'XYZ Test Cube',
  modelUrl: 'https://mmmaxwwwell.github.io/3d-gallery/?model=test-cube-xyz&cube_size=30',
  modelSourceUrl: 'https://github.com/mmmaxwwwell/3d-gallery/tree/main/models/test-cube-xyz',
  partFile: 'cube.stl',
  partLabel: 'XYZ test cube',
  customizerParams: { cube_size: 30, letter_depth: 1.5, letter_size: 16 },
  printerName: 'Flashforge Adventurer 5M 0.4 Klipper Left',
  filamentName: 'Kingroon PETG @ FFADM5',
  bedSurface: 'Hot Plate',
  processDescription: '3 walls, gyroid 15%, 0.20mm, no supports',
  bedTempC: 85,
  nozzleTempC: 255,
  printerConfigHash: 'deadbeef',
  filamentConfigHash: 'cafefeed',
};

describe('buildProvenanceComment', () => {
  it('emits a fenced comment block with every field on its own line', () => {
    const out = buildProvenanceComment(FULL);
    expect(out.startsWith('; ===== 3d-gallery print provenance =====')).toBe(true);
    expect(out.endsWith('; =========================================\n')).toBe(true);
    expect(out).toContain('; gallery.timestamp: 2026-09-09T14:00:00Z');
    expect(out).toContain('; gallery.slicer: OrcaSlicer 2.3.1');
    expect(out).toContain('; gallery.wasm_build: orcaslicer-wasm-2.3.1');
    expect(out).toContain('; gallery.model_url: https://mmmaxwwwell.github.io/3d-gallery/?model=test-cube-xyz&cube_size=30');
    expect(out).toContain('; gallery.customizer.cube_size: 30');
    expect(out).toContain('; gallery.customizer.letter_depth: 1.5');
    expect(out).toContain('; gallery.customizer.letter_size: 16');
    expect(out).toContain('; gallery.bed_temp_c: 85');
    expect(out).toContain('; gallery.nozzle_temp_c: 255');
  });

  it('omits missing fields entirely', () => {
    const out = buildProvenanceComment({ modelSlug: 'foo' });
    expect(out).toContain('; gallery.model_slug: foo');
    expect(out).not.toContain('; gallery.customizer.');
    expect(out).not.toContain('; gallery.slicer:');
  });

  it('collapses whitespace and control chars in values', () => {
    const out = buildProvenanceComment({ modelTitle: '  weird\ttitle\nwith\r\nnewlines  ' });
    expect(out).toContain('; gallery.model_title: weird title with newlines');
    expect(out).not.toContain('\ttitle');
  });

  it('sorts customizer params alphabetically for stable output', () => {
    const a = buildProvenanceComment({ customizerParams: { z: '3', a: '1', m: '2' } });
    const b = buildProvenanceComment({ customizerParams: { m: '2', z: '3', a: '1' } });
    expect(a).toBe(b);
    // And sort order is alpha:
    const aIdx = a.indexOf('gallery.customizer.a:');
    const mIdx = a.indexOf('gallery.customizer.m:');
    const zIdx = a.indexOf('gallery.customizer.z:');
    expect(aIdx).toBeLessThan(mIdx);
    expect(mIdx).toBeLessThan(zIdx);
  });
});

const PLATE_PARTS: ProvenancePart[] = [
  { file: 'cap.stl', label: 'Cap', qty: 2, params: { piece_i: 0, piece_j: 1 } },
  { file: 'base.stl', label: 'Base plate', qty: 1 },
];

const PLATE: Provenance = {
  timestamp: '2026-09-09T14:00:00Z',
  modelSlug: 'split-tray-500',
  plateName: 'Tray run 3',
  parts: PLATE_PARTS,
  printerName: 'Qidi Q2',
};

describe('buildProvenanceComment with parts', () => {
  it('renders an indented list under a "; Parts:" heading', () => {
    const out = buildProvenanceComment(PLATE);
    const lines = out.split('\n');
    const heading = lines.indexOf('; Parts:');
    expect(heading).toBeGreaterThan(-1);
    expect(lines[heading + 1]).toBe(';   2x cap.stl \u2014 "Cap" (piece_i=0, piece_j=1)');
    expect(lines[heading + 2]).toBe(';   1x base.stl \u2014 "Base plate"');
    expect(out).toContain('; gallery.plate_name: Tray run 3');
    expect(out).toContain('; gallery.printer_preset: Qidi Q2');
  });

  it('sorts a part\'s params alphabetically and omits the group when empty', () => {
    const out = buildProvenanceComment({
      parts: [
        { file: 'a.stl', label: 'A', qty: 3, params: { z: 3, a: '1', m: 2 } },
        { file: 'b.stl', label: 'B', qty: 1, params: {} },
      ],
    });
    expect(out).toContain(';   3x a.stl \u2014 "A" (a=1, m=2, z=3)');
    expect(out).toContain(';   1x b.stl \u2014 "B"\n');
  });

  it('supersedes the deprecated single-part fields', () => {
    const out = buildProvenanceComment({
      ...FULL,
      plateName: 'Mixed plate',
      parts: PLATE_PARTS,
    });
    expect(out).not.toContain('; gallery.part_file:');
    expect(out).not.toContain('; gallery.part_label:');
    expect(out).not.toContain('; gallery.customizer.');
    expect(out).toContain(';   2x cap.stl \u2014 "Cap" (piece_i=0, piece_j=1)');
  });
});

describe('parseProvenanceComment', () => {
  it('round-trips a multi-part plate, including qty and params', () => {
    const gcode = buildProvenanceComment(PLATE) + '\nG28\n';
    const parsed = parseProvenanceComment(gcode);
    expect(parsed.plateName).toBe('Tray run 3');
    expect(parsed.parts).toEqual([
      { file: 'cap.stl', label: 'Cap', qty: 2, params: { piece_i: '0', piece_j: '1' } },
      { file: 'base.stl', label: 'Base plate', qty: 1 },
    ]);
    expect(parsed.partFile).toBeUndefined();
    expect(parsed.customizerParams).toBeUndefined();
  });

  it('round-trips a part with qty 1 and no params', () => {
    const gcode = buildProvenanceComment({ parts: [{ file: 'cube.stl', label: 'XYZ test cube', qty: 1 }] });
    const parsed = parseProvenanceComment(gcode);
    expect(parsed.parts).toEqual([{ file: 'cube.stl', label: 'XYZ test cube', qty: 1 }]);
    expect(parsed.parts![0].params).toBeUndefined();
  });

  it('leaves parts undefined for single-part provenance (back-compat)', () => {
    const parsed = parseProvenanceComment(buildProvenanceComment(FULL) + '\nG28\n');
    expect(parsed.parts).toBeUndefined();
    expect(parsed.plateName).toBeUndefined();
    expect(parsed.partFile).toBe('cube.stl');
    expect(parsed.partLabel).toBe('XYZ test cube');
    expect(parsed.customizerParams).toEqual({ cube_size: '30', letter_depth: '1.5', letter_size: '16' });
  });

  it('stops collecting parts at the end of the list', () => {
    const gcode = buildProvenanceComment(PLATE) + ';   9x sneaky.stl \u2014 "Not on the plate"\n';
    expect(parseProvenanceComment(gcode).parts).toHaveLength(2);
  });

  it('round-trips buildProvenanceComment output verbatim', () => {
    const gcode = buildProvenanceComment(FULL) + '\nG28\nM104 S200\n';
    const parsed = parseProvenanceComment(gcode);
    expect(parsed.timestamp).toBe(FULL.timestamp);
    expect(parsed.galleryVersion).toBe(FULL.galleryVersion);
    expect(parsed.slicerName).toBe(FULL.slicerName);
    expect(parsed.wasmBuildTag).toBe(FULL.wasmBuildTag);
    expect(parsed.modelSlug).toBe(FULL.modelSlug);
    expect(parsed.modelTitle).toBe(FULL.modelTitle);
    expect(parsed.modelUrl).toBe(FULL.modelUrl);
    expect(parsed.modelSourceUrl).toBe(FULL.modelSourceUrl);
    expect(parsed.partFile).toBe(FULL.partFile);
    expect(parsed.printerName).toBe(FULL.printerName);
    expect(parsed.filamentName).toBe(FULL.filamentName);
    expect(parsed.bedSurface).toBe(FULL.bedSurface);
    expect(parsed.processDescription).toBe(FULL.processDescription);
    expect(parsed.bedTempC).toBe(85);
    expect(parsed.nozzleTempC).toBe(255);
    expect(parsed.printerConfigHash).toBe('deadbeef');
    expect(parsed.filamentConfigHash).toBe('cafefeed');
    expect(parsed.customizerParams).toEqual({ cube_size: '30', letter_depth: '1.5', letter_size: '16' });
  });

  it('returns empty object when no provenance is embedded', () => {
    expect(parseProvenanceComment('G28\nM104 S200')).toEqual({});
  });

  it('handles comments with extra whitespace and mixed content', () => {
    const gcode = 'G28\n  ;   gallery.model_slug:   foo   \n; not a gallery comment\nG1 X10';
    const p = parseProvenanceComment(gcode);
    expect(p.modelSlug).toBe('foo');
  });
});

describe('hashConfig', () => {
  it('produces the same hash regardless of insertion order', async () => {
    const a = await hashConfig({ nozzle_diameter: '0.4', layer_height: '0.2' });
    const b = await hashConfig({ layer_height: '0.2', nozzle_diameter: '0.4' });
    expect(a).toBe(b);
  });

  it('produces different hashes for different values', async () => {
    const a = await hashConfig({ nozzle_diameter: '0.4' });
    const b = await hashConfig({ nozzle_diameter: '0.6' });
    expect(a).not.toBe(b);
  });

  it('returns a 64-char hex digest (SHA-256)', async () => {
    const h = await hashConfig({ x: '1' });
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});
