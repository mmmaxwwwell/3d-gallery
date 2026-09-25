// SPDX-License-Identifier: MIT

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { rmSync } from 'node:fs';
import { resolveOrcaPaths, type OrcaPaths } from '../src/paths.ts';
import { indexPresets, resolvePreset, findPreset, diffFields } from '../src/presets.ts';
import { summarizeConf, readLogSummary } from '../src/conf.ts';
import { readOrcaProject } from '../src/project.ts';
import * as q from '../src/queries.ts';
import { makeFixture, type Fixture } from './fixture.ts';

let fixture: Fixture;
let paths: OrcaPaths;

beforeAll(() => {
  fixture = makeFixture();
  const resolved = resolveOrcaPaths(fixture.root);
  if (!resolved) throw new Error('fixture root did not resolve');
  paths = resolved;
});

afterAll(() => {
  rmSync(fixture.root, { recursive: true, force: true });
});

describe('paths', () => {
  it('resolves an explicit root and finds its user profiles', () => {
    expect(paths.root).toBe(fixture.root);
    expect(paths.userDirs).toHaveLength(1);
    expect(paths.userDirs[0]).toMatch(/12345$/);
  });

  it('returns null when the root does not exist', () => {
    expect(resolveOrcaPaths('/definitely/not/here')).toBeNull();
  });
});

describe('preset enumeration', () => {
  it('finds user and system presets and skips vendor bundles', () => {
    const { refs } = indexPresets(paths, ['printer']);
    const names = refs.map((r) => r.name);
    expect(names).toContain('Test Printer Left');
    expect(names).toContain('fdm_common');
    // TestVendor.json carries machine_list — it describes presets, isn't one.
    expect(names).not.toContain('TestVendor');
  });

  it('shadows a system preset with the user preset of the same name', () => {
    const ref = findPreset(paths, 'printer', 'Test Printer 0.6 Nozzle');
    expect(ref?.scope).toBe('user');
    // And the user copy's value is what resolution yields.
    expect(resolvePreset(paths, ref!).merged['printable_height']).toBe('999');
  });

  it('enumerates every kind', () => {
    expect(q.listPresets(paths, { kind: 'filament' }).count).toBe(2);
    expect(q.listPresets(paths, { kind: 'process' }).count).toBe(1);
  });

  it('filters by scope and name', () => {
    expect(q.listPresets(paths, { kind: 'printer', scope: 'system' }).count).toBe(3);
    const filtered = q.listPresets(paths, { kind: 'printer', name: 'left' });
    expect(filtered.presets.map((p) => p.name)).toEqual(['Test Printer Left']);
  });
});

describe('inheritance resolution', () => {
  it('walks the full chain root-last', () => {
    const resolved = resolvePreset(paths, findPreset(paths, 'printer', 'Test Printer Left')!);
    expect(resolved.chain.map((c) => c.name)).toEqual(['Test Printer 0.4 Nozzle', 'fdm_common']);
    expect(resolved.missingParents).toEqual([]);
  });

  it('merges with descendants winning and drops the inherits marker', () => {
    const { merged } = resolvePreset(paths, findPreset(paths, 'printer', 'Test Printer Left')!);
    expect(merged['gcode_flavor']).toBe('klipper');       // from the root
    expect(merged['printable_height']).toBe('220');        // model layer beats root's 200
    expect(merged['machine_start_gcode']).toBe('START_PRINT'); // user layer wins
    expect(merged['inherits']).toBeUndefined();
  });

  it('reports only the fields the preset itself declares', () => {
    // Regression: a key absent from the child is inherited, not removed. Orca
    // has no negation, so `removed` diffs would restate the whole parent.
    const { overrides } = resolvePreset(paths, findPreset(paths, 'printer', 'Test Printer Left')!);
    expect(overrides.map((o) => o.key).sort()).toEqual(['machine_start_gcode', 'print_host']);
    expect(overrides.find((o) => o.key === 'print_host')?.kind).toBe('added');
    const changed = overrides.find((o) => o.key === 'machine_start_gcode');
    expect(changed).toMatchObject({ kind: 'changed', from: 'G28', to: 'START_PRINT' });
    expect(overrides.some((o) => o.kind === 'removed')).toBe(false);
  });

  it('excludes bookkeeping keys from the override set', () => {
    const { overrides } = resolvePreset(paths, findPreset(paths, 'printer', 'Test Printer Right')!);
    const keys = overrides.map((o) => o.key);
    expect(keys).not.toContain('name');
    expect(keys).not.toContain('version');
    expect(keys).not.toContain('printer_settings_id');
  });

  it('records a missing parent instead of throwing', () => {
    const resolved = resolvePreset(paths, findPreset(paths, 'printer', 'Orphan Printer')!);
    expect(resolved.missingParents).toEqual(['No Such Parent']);
    expect(resolved.chain).toEqual([]);
  });

  it('compares values structurally, not by reference', () => {
    expect(diffFields({ a: ['1', '2'] }, { a: ['1', '2'] })).toEqual([]);
    expect(diffFields({ a: ['1'] }, { a: ['2'] })).toHaveLength(1);
  });
});

describe('app config', () => {
  it('collapses duplicate usage rows and counts them', () => {
    const conf = summarizeConf(paths)!;
    expect(conf.usage[0]).toMatchObject({
      machine: 'Test Printer Left',
      process: 'Fast 0.28',
      count: 2,
    });
    expect(conf.usage).toHaveLength(2);
  });

  it('collects multi-extruder filament columns into one combo', () => {
    const right = summarizeConf(paths)!.usage.find((c) => c.machine === 'Test Printer Right');
    expect(right?.filaments).toEqual(['House PETG', 'Generic PETG']);
  });

  it('reads selection, machines and models', () => {
    const conf = summarizeConf(paths)!;
    expect(conf.currentMachine).toBe('Test Printer Left');
    expect(conf.localMachines[0]).toMatchObject({ name: 'Left', address: '10.0.0.11:7125' });
    expect(conf.models[0]).toMatchObject({ model: 'Test Printer', vendor: 'TestVendor' });
  });

  it('flags missing recent projects without dropping them', () => {
    const listed = q.projects(paths);
    expect(listed.projects[0]).toMatchObject({ rank: 1, exists: true });
    expect(listed.projects[1]).toMatchObject({ exists: false });
  });
});

describe('logs', () => {
  it('detects that one message dominates the log', () => {
    const summary = readLogSummary(paths);
    expect(summary.severityLevel).toBe('warning');
    expect(summary.dominatedBySingleMessage).toBe(true);
    // Paths and numbers are collapsed so repeats group.
    expect(summary.topMessages.some((m) => m.message.includes('<path>'))).toBe(true);
  });

  it('surfaces the dominance note through doctor', () => {
    expect(q.doctor(paths).logs.note).toMatch(/no usable change history/);
  });
});

describe('3MF project', () => {
  it('extracts preset names, objects and plates', async () => {
    const project = await readOrcaProject(fixture.projectPath);
    expect(project.presetIds).toEqual({
      printer: 'Test Printer Left',
      filaments: ['House PETG'],
      process: 'Fast 0.28',
    });
    expect(project.printerModel).toBe('Test Printer');
    expect(project.layerHeight).toBe(0.28);
    expect(project.orcaVersion).toBe('2.3.2');
    expect(project.objects.map((o) => o.name)).toEqual(['widget.stl', 'bracket.stl']);
    expect(project.plates).toHaveLength(1);
    expect(project.plates[0]).toMatchObject({ index: 1, name: 'Plate A', objectIds: ['2', '4'] });
  });

  it('reads per-part transforms and extruder assignment', async () => {
    const [widget, bracket] = (await readOrcaProject(fixture.projectPath)).objects;
    expect(widget.sourceFile).toBe('widget.stl');
    expect(widget.matrix).toHaveLength(16);
    expect(widget.sourceOffset).toEqual({ x: 10.5, y: 20.25, z: 3 });
    expect(widget.extruder).toBe(1);
    expect(bracket.extruder).toBe(2);
    // No matrix metadata on the second part — absent, not zero-filled.
    expect(bracket.matrix).toBeUndefined();
  });

  it('folds plate geometry onto objects by name', async () => {
    const project = await readOrcaProject(fixture.projectPath);
    expect(project.plates[0].bboxAll).toEqual([0, 0, 50, 50]);
    const widget = project.objects.find((o) => o.name === 'widget.stl')!;
    expect(widget.bbox).toEqual([0, 0, 20, 20]);
    expect(widget.area).toBe(400);
  });

  it('withholds the flattened config unless asked', async () => {
    const lean = await q.project({ path: fixture.projectPath });
    expect(lean['configFieldCount']).toBeGreaterThan(5);
    expect(lean['flatConfig']).toBeUndefined();

    const picked = await q.project({ path: fixture.projectPath, configFields: ['outer_wall_speed'] });
    expect(picked['config']).toEqual({ outer_wall_speed: 200 });

    const full = await q.project({ path: fixture.projectPath, fullConfig: true });
    expect(Object.keys(full['flatConfig'] as object).length).toBe(lean['configFieldCount']);
  });
});

describe('query errors', () => {
  it('suggests near matches for an unknown preset name', () => {
    try {
      q.getPreset(paths, { kind: 'printer', name: 'Test Printer Lefty' });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(q.OrcaQueryError);
      expect((err as q.OrcaQueryError).suggestions).toContain('Test Printer Left');
    }
  });

  it('rejects a project path that does not exist', async () => {
    await expect(q.project({ path: '/nope/missing.3mf' })).rejects.toThrow(/No such file/);
  });

  it('rejects a file that is not a 3MF', async () => {
    await expect(q.project({ path: paths.conf })).rejects.toThrow(/Could not read/);
  });
});
