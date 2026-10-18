// SPDX-License-Identifier: MIT

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { galleryImportRecords } from '../src/gallery-import.ts';
import { resolveOrcaPaths, type OrcaPaths } from '../src/paths.ts';
import { makeFixture, type Fixture } from './fixture.ts';

let fixture: Fixture;
let paths: OrcaPaths;

beforeAll(() => {
  fixture = makeFixture();
  paths = resolveOrcaPaths(fixture.root)!;
});
afterAll(() => { rmSync(fixture.root, { recursive: true, force: true }); });

describe('galleryImportRecords', () => {
  it('turns each user printer and filament into a record with its chain, as the folder import does', () => {
    const { records } = galleryImportRecords(paths);
    const left = records.find((r) => r.name === 'Test Printer Left')!;
    expect(left.kind).toBe('printer');
    expect(left.address).toBe('10.0.0.11:7125');
    expect(left.raw['inherits']).toBe('Test Printer 0.4 Nozzle');
    expect(left.parents.map((p) => p.name)).toEqual(['Test Printer 0.4 Nozzle', 'fdm_common']);
    expect(left.parents[0]!.raw['printer_model']).toBe('Test Printer');
    expect(left.source).toMatchObject({ kind: 'orca-config', path: expect.stringContaining('Test Printer Left.json') });
    expect(records.some((r) => r.name === 'House PETG' && r.kind === 'filament')).toBe(true);
    // Processes stay out: the gallery slices with its own templates.
    expect(records.some((r) => r.kind === 'process')).toBe(false);
    // System presets are donors, not records.
    expect(records.some((r) => r.name === 'Generic PETG')).toBe(false);
  });

  it('narrows to named presets and says which it could not find', () => {
    const out = galleryImportRecords(paths, { names: ['House PETG', 'Nope'] });
    expect(out.records.map((r) => r.name)).toEqual(['House PETG']);
    expect(out.notFound).toEqual(['Nope']);
  });

  it('keeps the newer of two same-named presets from different Orca profiles', () => {
    const other = join(fixture.root, 'user', 'second-profile', 'filament');
    mkdirSync(other, { recursive: true });
    const file = join(other, 'House PETG.json');
    writeFileSync(file, JSON.stringify({ name: 'House PETG', inherits: 'Generic PETG', from: 'User', filament_settings_id: 'House PETG', nozzle_temperature: ['250'] }));
    const future = new Date(Date.now() + 60_000);
    utimesSync(file, future, future);
    // Profiles are found when the install is resolved.
    const out = galleryImportRecords(resolveOrcaPaths(fixture.root)!, { names: ['House PETG'] });
    expect(out.records).toHaveLength(1);
    expect(out.records[0]!.raw['nozzle_temperature']).toEqual(['250']);
    expect(out.warnings.join('\n')).toMatch(/House PETG" is in two Orca profiles; kept user\/second-profile/);
    rmSync(join(fixture.root, 'user', 'second-profile'), { recursive: true, force: true });
  });
});
