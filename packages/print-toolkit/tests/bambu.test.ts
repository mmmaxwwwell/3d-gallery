// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { strFromU8, strToU8, unzipSync } from 'fflate';
import { md5Hex } from '../src/md5.js';
import { bambuGcode3mfEntries, packageBambuGcode3mf, placeholderPng } from '../src/bambu-3mf.js';
import { bambuSliceConfig, orcaConfigValue } from '../src/bambu-slice-config.js';
import {
  AMS_EXTERNAL,
  amsFamily,
  amsTrayLabel,
  bambuModelId,
  filamentUsePerSlot,
  isBambuPrinterConfig,
  isBambuProxyVersion,
  matchAmsTrays,
  type AmsState,
} from '../src/bambu.js';
import { threeMfVolumes, volumeSlots } from '../src/threemf-volumes.js';
import { simulate } from '../src/print-schedule.js';
import { fetchPrinterInfo, fetchPrinterLive, startPrint } from '../src/moonraker-api.js';
import { plate3mf } from './fixtures/plate-3mf.js';

describe('md5Hex', () => {
  it('matches the RFC 1321 test vectors', () => {
    expect(md5Hex(strToU8(''))).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5Hex(strToU8('abc'))).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(md5Hex(strToU8('12345678901234567890123456789012345678901234567890123456789012345678901234567890')))
      .toBe('57edf4a22be3c955ac49da2e2107b67a');
  });
});

describe('packageBambuGcode3mf', () => {
  const job = {
    gcode: '; HEADER_BLOCK_START\nG28\nM620 S1A\nT1\n',
    printerModelId: 'BL-P001',
    nozzleDiameter: 0.4,
    filaments: [
      { slot: 1, type: 'PLA', color: '#000000', trayInfoIdx: 'GFA00', usedGrams: 3.25, usedMeters: 1.1 },
      { slot: 2, type: 'PLA', color: '#ffffff' },
    ],
    predictionSec: 1931.4,
    weightGrams: 3.7,
    title: 'Tag & <plate>',
  };

  it('holds every entry a Bambu Studio export points the firmware at', () => {
    const files = unzipSync(packageBambuGcode3mf(job));
    expect(Object.keys(files).sort()).toEqual([
      '3D/3dmodel.model',
      'Metadata/_rels/model_settings.config.rels',
      'Metadata/model_settings.config',
      'Metadata/plate_1.gcode',
      'Metadata/plate_1.gcode.md5',
      'Metadata/plate_1.png',
      'Metadata/plate_1_small.png',
      'Metadata/slice_info.config',
      '[Content_Types].xml',
      '_rels/.rels',
    ]);
    expect(strFromU8(files['Metadata/plate_1.gcode'])).toBe(job.gcode);
    expect(strFromU8(files['Metadata/plate_1.gcode.md5'])).toBe(md5Hex(strToU8(job.gcode)).toUpperCase());
    expect(strFromU8(files['[Content_Types].xml'])).toContain('Extension="gcode" ContentType="text/x.gcode"');
    expect(strFromU8(files['_rels/.rels'])).toContain('Target="/Metadata/plate_1.png"');
    expect(strFromU8(files['Metadata/_rels/model_settings.config.rels']))
      .toContain('Target="/Metadata/plate_1.gcode" Id="rel-1" Type="http://schemas.bambulab.com/package/2021/gcode"');
    expect(strFromU8(files['Metadata/model_settings.config'])).toContain('<metadata key="gcode_file" value="Metadata/plate_1.gcode"/>');
    expect(strFromU8(files['3D/3dmodel.model'])).toContain('<metadata name="Title">Tag &amp; &lt;plate&gt;</metadata>');
  });

  it('describes the plate and its filaments in slice_info', () => {
    const info = strFromU8(bambuGcode3mfEntries(job)['Metadata/slice_info.config']);
    expect(info).toContain('<metadata key="index" value="1"/>');
    expect(info).toContain('<metadata key="printer_model_id" value="BL-P001"/>');
    expect(info).toContain('<metadata key="nozzle_diameters" value="0.4"/>');
    expect(info).toContain('<metadata key="prediction" value="1931"/>');
    expect(info).toContain('<metadata key="weight" value="3.7"/>');
    expect(info).toContain('<filament id="1" tray_info_idx="GFA00" type="PLA" color="#000000" used_m="1.1" used_g="3.25" />');
    expect(info).toContain('<filament id="2" type="PLA" color="#FFFFFF" used_m="0" used_g="0" />');
  });

  it('names the plate it carries', () => {
    const files = bambuGcode3mfEntries({ ...job, plate: 3 });
    expect(files['Metadata/plate_3.gcode']).toBeDefined();
    expect(strFromU8(files['Metadata/slice_info.config'])).toContain('<metadata key="index" value="3"/>');
  });

  it('draws a valid PNG when the gallery has no thumbnail', () => {
    const png = placeholderPng(16);
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(strFromU8(png.subarray(12, 16))).toBe('IHDR');
    expect(new DataView(png.buffer).getUint32(16)).toBe(16);
  });
});

describe('orcaConfigValue', () => {
  it('writes vectors the way libslic3r splits them', () => {
    expect(orcaConfigValue('nozzle_temperature', ['220', '230'])).toBe('220,230');
    expect(orcaConfigValue('printable_area', ['0x0', '256x0', '256x256', '0x256'])).toBe('0x0,256x0,256x256,0x256');
    expect(orcaConfigValue('filament_type', ['PLA', 'PETG'])).toBe('PLA;PETG');
    expect(orcaConfigValue('filament_start_gcode', ['; filament start gcode\n', 'M106 P3 S0']))
      .toBe('"; filament start gcode\\n";"M106 P3 S0"');
    expect(orcaConfigValue('layer_height', '0.2')).toBe('0.2');
    expect(orcaConfigValue('unknown_numbers', ['1', '2'])).toBe('1,2');
  });
});

describe('bambuSliceConfig', () => {
  const printer = {
    printer_model: 'Bambu Lab X1 Carbon',
    nozzle_diameter: ['0.4'],
    layer_change_gcode: 'M73 L{layer_num+1}',
    machine_start_gcode: ';===== machine: X1\nM620 S[initial_extruder]A',
  };
  const pla = { filament_type: ['PLA'], nozzle_temperature: ['220'], filament_flow_ratio: ['0.98'] };
  const petg = { filament_type: ['PETG'], nozzle_temperature: ['255'] };

  it('gives every filament setting one value per slot', () => {
    const config = bambuSliceConfig({ printer, filaments: [pla, petg], colors: ['#000000', '#ffffff'] });
    expect(config['filament_type']).toBe('PLA;PETG');
    expect(config['nozzle_temperature']).toBe('220,255');
    // PETG's preset leaves the flow ratio out; its slot still gets a value.
    expect(config['filament_flow_ratio']).toBe('0.98,0.98');
    expect(config['filament_colour']).toBe('#000000;#FFFFFF');
    expect(config['flush_volumes_matrix']).toBe('0,280,280,0');
    expect(config['machine_start_gcode']).toBe(printer.machine_start_gcode);
  });

  it('resets E before each layer, which the slicer insists on for a Marlin-flavoured printer', () => {
    expect(bambuSliceConfig({ printer, filaments: [pla], colors: ['#000000'] })['before_layer_change_gcode']).toBe('G92 E0');
  });

  it('refuses a slot without a colour', () => {
    expect(() => bambuSliceConfig({ printer, filaments: [pla, pla], colors: ['#000000'] })).toThrow();
  });
});

describe('Bambu printers', () => {
  it('are told apart by the preset and by the proxy', () => {
    expect(isBambuPrinterConfig({ printer_model: 'Bambu Lab X1 Carbon' })).toBe(true);
    expect(isBambuPrinterConfig({ printer_model: 'Flashforge Adventurer 5M' })).toBe(false);
    expect(bambuModelId({ printer_model: 'Bambu Lab X1 Carbon' })).toBe('BL-P001');
    expect(isBambuProxyVersion('bambu-klipper-proxy 0.3.0')).toBe(true);
    expect(isBambuProxyVersion('v0.12.0-1-g6b2e')).toBe(false);
  });
});

describe('filamentUsePerSlot', () => {
  it('reads the footer the slicer writes', () => {
    const gcode = 'G1 X1\n; filament used [mm] = 896.79, 325.71\n; filament used [g] = 2.72, 0.99\n';
    expect(filamentUsePerSlot(gcode)).toEqual({ grams: [2.72, 0.99], meters: [0.89679, 0.32571] });
    expect(filamentUsePerSlot('G28\n')).toEqual({ grams: [], meters: [] });
  });
});

describe('matchAmsTrays', () => {
  const ams: AmsState = {
    trays: [
      { slot: 0, type: 'PLA Basic', color: '#101010', name: 'Bambu PLA Basic', remain: 80 },
      { slot: 1, type: 'PETG', color: '#FFFFFF', name: 'PETG HF', remain: 50 },
      { slot: 2, type: '', color: '#000000', name: '', remain: -1 },
      { slot: 5, type: 'PLA-S', color: '#FFFFFF', name: 'Support', remain: 10 },
    ],
    external: { type: 'TPU', color: '#FF0000', name: 'TPU 95A', remain: -1 },
  };

  it('feeds each filament from its family, the nearest colour first', () => {
    const match = matchAmsTrays([
      { slot: 1, type: 'PLA', color: '#000000' },
      { slot: 2, type: 'PLA', color: '#ffffff' },
      { slot: 3, type: 'TPU', color: '#ff0000' },
    ], ams);
    expect(match.problems).toEqual([]);
    expect(match.assignments.map((a) => [a.slot, a.tray, a.exact])).toEqual([
      [1, 0, false],
      [2, 5, true],
      [3, AMS_EXTERNAL, true],
    ]);
  });

  it('says which filament no tray can feed', () => {
    const match = matchAmsTrays([{ slot: 1, type: 'ABS', color: '#000000' }], ams);
    expect(match.assignments).toEqual([]);
    expect(match.problems).toEqual(['Filament 1 (ABS #000000): no ABS loaded in the AMS.']);
  });

  it('reads families and trays the way the proxy does', () => {
    expect(amsFamily('PLA Basic')).toBe('PLA');
    expect(amsFamily('PLA-S')).toBe('PLA');
    expect(amsFamily('petg')).toBe('PETG');
    expect(amsTrayLabel(6)).toBe('AMS 2 · 3');
    expect(amsTrayLabel(AMS_EXTERNAL)).toBe('External spool');
  });
});

describe('threeMfVolumes', () => {
  it('lists volumes in build-item, then component, order with their colour and slot', () => {
    const file = plate3mf([
      [{ color: '#112233', extruder: 2, box: [0, 1, 0, 1, 0, 1] }, { color: '#AABBCC', extruder: 3, box: [0, 1, 0, 1, 1, 2] }],
      [{ color: '#112233', extruder: 2, box: [5, 6, 0, 1, 0, 1] }],
    ]);
    expect(threeMfVolumes(file)).toEqual([
      { index: 0, color: '#112233', extruder: 2 },
      { index: 1, color: '#aabbcc', extruder: 3 },
      { index: 2, color: '#112233', extruder: 2 },
    ]);
  });

  it('puts each volume on the slot that prints its colour, else slot 1', () => {
    const volumes = [
      { index: 0, color: '#112233', extruder: 2 },
      { index: 1, color: '#aabbcc', extruder: 1 },
      { index: 2, color: '#999999', extruder: 3 },
    ];
    expect(volumeSlots(volumes, [['#AABBCC'], ['#112233']])).toEqual({ 0: 2, 1: 1, 2: 1 });
  });

  it('is null for bytes that are not a 3MF', () => {
    expect(threeMfVolumes(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

describe('simulate with an AMS printer', () => {
  const opts = { now: 0, changeoverSec: 60, materialSwapSec: 900, unavailable: [] };
  const jobs = [
    { id: 'a', label: 'a', seconds: 600, material: 'PLA' },
    { id: 'b', label: 'b', seconds: 600, material: 'PETG' },
  ];

  it('never charges it a filament swap', () => {
    const plan = simulate(jobs, [{ id: 'x1c', name: 'X1C', freeAt: 0, material: 'TPU', multiMaterial: true }], opts, 0);
    expect(plan.jobs.map((j) => j.swapFrom)).toEqual([undefined, undefined]);
    expect(plan.jobs[1].start - plan.jobs[0].end).toBe(60_000);
  });

  it('still charges a single-spool printer', () => {
    const plan = simulate(jobs, [{ id: '5m', name: '5M', freeAt: 0, material: 'PLA' }], opts, 0);
    expect(plan.jobs[1].swapFrom).toBe('PLA');
  });
});

describe('Moonraker on a Bambu printer', () => {
  const originalFetch = globalThis.fetch;
  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', { value: { location: { protocol: 'http:' } }, writable: true, configurable: true });
  });
  afterEach(() => { globalThis.fetch = originalFetch; });

  function serve(route: (url: URL) => unknown) {
    const mock = vi.fn((input: string) => {
      const json = route(new URL(input));
      return Promise.resolve({
        ok: json !== undefined, status: json === undefined ? 404 : 200, statusText: '',
        json: () => Promise.resolve(json), text: () => Promise.resolve(JSON.stringify(json)),
      });
    });
    globalThis.fetch = mock as unknown as typeof fetch;
    return mock;
  }

  it('says from printer/info that the proxy is answering', async () => {
    serve(() => ({ result: { software_version: 'bambu-klipper-proxy 0.1.0', state: 'ready' } }));
    expect(await fetchPrinterInfo('x1c.test:7125')).toEqual({ softwareVersion: 'bambu-klipper-proxy 0.1.0', bambu: true });
  });

  it('starts a print with the AMS mapping', async () => {
    const mock = serve(() => ({ result: 'ok' }));
    await startPrint('x1c.test:7125', '01-tag.gcode.3mf', { amsMapping: [4, 0] });
    expect(mock.mock.calls[0][0]).toBe('http://x1c.test:7125/printer/print/start?filename=01-tag.gcode.3mf&ams_mapping=4,0');
  });

  it('reads the AMS from bambu_ams', async () => {
    const trays = [{ slot: 0, type: 'PLA', color: '#000000', name: 'PLA', remain: 90 }];
    serve((url) => {
      if (url.pathname === '/printer/objects/list') return { result: { objects: ['webhooks', 'print_stats', 'bambu_ams'] } };
      if (url.pathname === '/printer/objects/query') {
        expect(url.search).toContain('bambu_ams');
        return { result: { status: { webhooks: { state: 'ready', state_message: '' }, bambu_ams: { trays, external: null } } } };
      }
      if (url.pathname === '/machine/proc_stats') return { result: { system_uptime: 5 } };
      return undefined;
    });
    const live = await fetchPrinterLive('bambu-live.test:7125');
    expect(live.ams).toEqual({ trays, external: null });
  });
});
