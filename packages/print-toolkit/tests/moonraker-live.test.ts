// SPDX-License-Identifier: AGPL-3.0-or-later
// Response bodies are trimmed from a ZMOD Adventurer 5M's real Moonraker replies.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchPrinterLive,
  fetchConsoleTail,
  listGcodeFiles,
  sendGcode,
  emergencyStop,
  firmwareRestart,
  pausePrint,
  resumePrint,
  cancelPrint,
} from '../src/moonraker-api.js';

const originalFetch = globalThis.fetch;

type Route = (url: URL) => { status?: number; json?: unknown } | undefined;

/** Answer each request from `route`, 404 when it has nothing; returns the mock to inspect calls. */
function serve(route: Route) {
  const mock = vi.fn((input: string, _init?: RequestInit) => {
    const res = route(new URL(input)) ?? { status: 404, json: { error: 'not found' } };
    const status = res.status ?? 200;
    return Promise.resolve({
      ok: status < 400, status, statusText: String(status),
      json: () => Promise.resolve(res.json),
      text: () => Promise.resolve(JSON.stringify(res.json)),
    });
  });
  globalThis.fetch = mock as unknown as typeof fetch;
  return mock;
}

function setProtocol(protocol: string) {
  Object.defineProperty(globalThis, 'window', { value: { location: { protocol } }, writable: true, configurable: true });
}

beforeEach(() => setProtocol('http:'));
afterEach(() => { globalThis.fetch = originalFetch; });

const OBJECTS = [
  'webhooks', 'configfile', 'heaters', 'fan_generic fanM106', 'fan_generic chamber_fan', 'idle_timeout', 'pause_resume',
  'filament_switch_sensor e1_sensor', 'filament_switch_sensor e0_sensor', 'gcode_move', 'gcode_macro LOAD_FILAMENT',
  'gcode_macro _CLIENT_EXTRUDE', 'print_stats', 'virtual_sdcard', 'display_status', 'exclude_object', 'heater_bed',
  'led chamber_light', 'system_stats', 'toolhead', 'extruder',
];

const PRINTING = {
  webhooks: { state: 'ready', state_message: 'Printer is ready' },
  print_stats: { filename: 'plate-1.gcode', print_duration: 7200, state: 'printing', info: { total_layer: 550, current_layer: 72 } },
  virtual_sdcard: { progress: 0.25 },
  display_status: { progress: 0.24, message: 'Layer 72' },
  extruder: { temperature: 254.8, target: 255, power: 0.41, can_extrude: true },
  heater_bed: { temperature: 60.1, target: 60, power: 0.2 },
  toolhead: { homed_axes: 'xyz', position: [105, 105, 20.16, 1432.5] },
  gcode_move: { speed_factor: 1.5, extrude_factor: 0.95, homing_origin: [0, 0, -0.05, 0] },
  'fan_generic fanM106': { speed: 0.4, rpm: null },
  'filament_switch_sensor e0_sensor': { filament_detected: true, enabled: true },
  'filament_switch_sensor e1_sensor': { filament_detected: false, enabled: false },
  exclude_object: {
    objects: [{ name: 'part_a' }, { name: 'part_b' }, { name: 'part_c' }],
    excluded_objects: ['part_b'],
    current_object: 'part_c',
  },
  idle_timeout: { state: 'Printing', printing_time: 7300 },
  pause_resume: { is_paused: false },
  'led chamber_light': { color_data: [[0, 0, 0, 1]] },
  system_stats: { sysload: 0.05, cputime: 96980.7, memavail: 47348 },
};

function printerRoute(overrides: Partial<Record<string, Route>> = {}): Route {
  return (url) => {
    const special = overrides[url.pathname];
    if (special) return special(url);
    switch (url.pathname) {
      case '/printer/objects/list': return { json: { result: { objects: OBJECTS } } };
      case '/printer/objects/query': return { json: { result: { eventtime: 1, status: PRINTING } } };
      case '/machine/proc_stats': return { json: { result: { system_uptime: 600956.26 } } };
      case '/server/files/metadata': return { json: { result: { estimated_time: 36000 } } };
    }
    return undefined;
  };
}

describe('fetchPrinterLive', () => {
  it('asks only for objects the printer lists, and the part fan it has', async () => {
    const mock = serve(printerRoute());
    await fetchPrinterLive('printer-a.local');
    const query = mock.mock.calls.map(([u]) => new URL(u)).find((u) => u.pathname === '/printer/objects/query')!;
    const asked = [...query.searchParams.keys()];
    expect(asked).toEqual(expect.arrayContaining([
      'webhooks', 'print_stats', 'virtual_sdcard', 'display_status', 'extruder', 'heater_bed', 'toolhead',
      'gcode_move', 'exclude_object', 'idle_timeout', 'pause_resume', 'led chamber_light', 'system_stats',
      'fan_generic fanM106', 'filament_switch_sensor e0_sensor', 'filament_switch_sensor e1_sensor',
    ]));
    expect(asked).not.toContain('fan');
    expect(asked).not.toContain('fan_generic chamber_fan');
    expect(asked).toHaveLength(16);
  });

  it('flattens the query into one status', async () => {
    serve(printerRoute());
    const live = await fetchPrinterLive('printer-b.local');
    expect(live).toEqual({
      state: 'printing',
      klippyState: 'ready',
      klippyMessage: '',
      file: 'plate-1.gcode',
      progress: 0.25,
      message: 'Layer 72',
      layer: 72,
      totalLayers: 550,
      elapsedSec: 7200,
      remainingSec: 36000 - 7200,
      extruder: { actual: 254.8, target: 255, power: 0.41 },
      bed: { actual: 60.1, target: 60, power: 0.2 },
      fanPct: 40,
      speedPct: 150,
      flowPct: 95,
      zOffset: -0.05,
      homedAxes: 'xyz',
      position: [105, 105, 20.16],
      sensors: [
        { name: 'e1_sensor', enabled: false, detected: false },
        { name: 'e0_sensor', enabled: true, detected: true },
      ],
      lightOn: true,
      objects: [
        { name: 'part_a', excluded: false, current: false },
        { name: 'part_b', excluded: true, current: false },
        { name: 'part_c', excluded: false, current: true },
      ],
      idleState: 'Printing',
      paused: false,
      host: { load: 0.05, memAvailKb: 47348 },
      uptimeSec: 600956.26,
      macros: new Set(['LOAD_FILAMENT', '_CLIENT_EXTRUDE']),
    });
  });

  it('falls back to progress when the file has no slicer estimate', async () => {
    serve(printerRoute({ '/server/files/metadata': () => ({ status: 404, json: {} }) }));
    const live = await fetchPrinterLive('printer-c.local');
    expect(live.remainingSec).toBe(7200 / 0.25 - 7200);
  });

  it('reports null for objects the printer lacks, and no time left when idle', async () => {
    const mock = serve(printerRoute({
      '/printer/objects/list': () => ({ json: { result: { objects: ['webhooks', 'print_stats', 'virtual_sdcard'] } } }),
      '/printer/objects/query': () => ({ json: { result: { status: {
        webhooks: PRINTING.webhooks,
        print_stats: { filename: '', print_duration: 0, state: 'standby', info: { total_layer: null, current_layer: null } },
        virtual_sdcard: { progress: 0 },
      } } } }),
      '/machine/proc_stats': () => ({ status: 500, json: {} }),
    }));
    const live = await fetchPrinterLive('printer-d.local');
    expect(live).toMatchObject({
      state: 'standby', remainingSec: 0, layer: null, totalLayers: null, extruder: null, bed: null,
      fanPct: null, speedPct: null, flowPct: null, zOffset: null, position: null, lightOn: null,
      idleState: null, host: null, uptimeSec: null, sensors: [], objects: [],
    });
    expect(live.macros.size).toBe(0);
    expect(mock.mock.calls.some(([u]) => new URL(u).pathname === '/server/files/metadata')).toBe(false);
  });

  it('reads the object list once per printer', async () => {
    const mock = serve(printerRoute());
    await fetchPrinterLive('printer-e.local');
    await fetchPrinterLive('printer-e.local');
    const lists = mock.mock.calls.filter(([u]) => new URL(u).pathname === '/printer/objects/list');
    expect(lists).toHaveLength(1);
  });

  it('reports Klipper\'s state when it is down, and re-reads the object list after', async () => {
    let down = true;
    const mock = serve(printerRoute({
      '/printer/objects/list': () => (down
        ? { status: 503, json: { error: { message: 'Klippy Host not connected' } } }
        : { json: { result: { objects: OBJECTS } } }),
      '/server/info': () => ({ json: { result: { klippy_state: 'shutdown' } } }),
      '/printer/info': () => ({ json: { result: { state_message: 'MCU \'mcu\' shutdown: Timer too close\n' } } }),
    }));
    const live = await fetchPrinterLive('printer-f.local');
    expect(live).toMatchObject({
      state: '', klippyState: 'shutdown', klippyMessage: 'MCU \'mcu\' shutdown: Timer too close',
      extruder: null, uptimeSec: 600956.26,
    });
    down = false;
    expect((await fetchPrinterLive('printer-f.local')).state).toBe('printing');
    expect(mock.mock.calls.filter(([u]) => new URL(u).pathname === '/printer/objects/list')).toHaveLength(2);
  });

  it('throws when Moonraker itself is unreachable', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))) as unknown as typeof fetch;
    await expect(fetchPrinterLive('printer-g.local')).rejects.toThrow('Failed to fetch');
  });
});

describe('listGcodeFiles', () => {
  it('lists G-code newest first with estimates and the largest thumbnail', async () => {
    serve((url) => {
      if (url.pathname === '/server/files/list') {
        expect(url.searchParams.get('root')).toBe('gcodes');
        return { json: { result: [
          { path: 'old.gcode', modified: 1000, size: 10 },
          { path: 'notes.txt', modified: 3000, size: 1 },
          { path: 'jobs/140X200MM BASKET.gcode', modified: 2000, size: 20 },
        ] } };
      }
      if (url.pathname === '/server/files/metadata') {
        const name = url.searchParams.get('filename');
        if (name === 'old.gcode') return { status: 404, json: {} };
        return { json: { result: { estimated_time: 21456, thumbnails: [
          { width: 32, height: 25, relative_path: '.thumbs/140X200MM BASKET-32x32.png' },
          { width: 140, height: 110, relative_path: '.thumbs/140X200MM BASKET-140x110.png' },
        ] } } };
      }
      return undefined;
    });
    expect(await listGcodeFiles('printer.local:7125')).toEqual([
      {
        path: 'jobs/140X200MM BASKET.gcode', size: 20, modified: 2_000_000, estimatedSec: 21456,
        thumbnailUrl: 'http://printer.local:7125/server/files/gcodes/jobs/.thumbs/140X200MM%20BASKET-140x110.png',
      },
      { path: 'old.gcode', size: 10, modified: 1_000_000 },
    ]);
  });
});

describe('fetchConsoleTail', () => {
  it('asks for only the last few lines', async () => {
    const mock = serve((url) => (url.pathname === '/server/gcode_store'
      ? { json: { result: { gcode_store: [{ message: '// Display backlight: 10%', time: 1790018028.5, type: 'response' }] } } }
      : undefined));
    expect(await fetchConsoleTail('printer.local', 20)).toEqual([
      { message: '// Display backlight: 10%', time: 1790018028500, type: 'response' },
    ]);
    expect(new URL(mock.mock.calls[0][0]).searchParams.get('count')).toBe('20');
  });
});

describe('commands', () => {
  it('sends G-code as a POST, newlines and all', async () => {
    const mock = serve(() => ({ json: { result: 'ok' } }));
    await sendGcode('printer.local', 'M109 S240\nLOAD_FILAMENT');
    const [url, init] = mock.mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(new URL(url).pathname).toBe('/printer/gcode/script');
    expect(new URL(url).searchParams.get('script')).toBe('M109 S240\nLOAD_FILAMENT');
  });

  it.each<[string, (a: string) => Promise<void>]>([
    ['/printer/emergency_stop', emergencyStop],
    ['/printer/firmware_restart', firmwareRestart],
    ['/printer/print/pause', pausePrint],
    ['/printer/print/resume', resumePrint],
    ['/printer/print/cancel', cancelPrint],
  ])('POSTs %s', async (path, command) => {
    const mock = serve(() => ({ json: { result: 'ok' } }));
    await command('printer.local');
    expect(mock.mock.calls[0][0]).toBe(`http://printer.local${path}`);
    expect(mock.mock.calls[0][1]?.method).toBe('POST');
  });

  it('surfaces Klipper\'s refusal', async () => {
    serve(() => ({ status: 400, json: { error: { message: 'Must home axis first' } } }));
    await expect(sendGcode('printer.local', 'G1 X10')).rejects.toThrow(/\(400\).*Must home axis first/);
  });

  it('refuses to reach an HTTP printer from an HTTPS page, without sending', async () => {
    setProtocol('https:');
    const mock = serve(() => ({ json: { result: 'ok' } }));
    await expect(sendGcode('printer.local', 'G28')).rejects.toThrow(/Mixed content blocked/);
    await expect(emergencyStop('printer.local')).rejects.toThrow(/Mixed content blocked/);
    await expect(fetchPrinterLive('printer-h.local')).rejects.toThrow(/Mixed content blocked/);
    expect(mock).not.toHaveBeenCalled();
  });
});
