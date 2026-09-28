// SPDX-License-Identifier: MIT
//
// The Moonraker simulator is what every printer e2e test and the fake fleet
// stand on, so its answers have to match what the real fleet sends.

import { describe, expect, it } from 'vitest';
import { MoonrakerSim, parseGcodeLine, parseMultipartFile, type SimRequest } from '../fixtures/moonraker-sim.ts';

const T0 = 1_790_000_000_000;

function sim(options: ConstructorParameters<typeof MoonrakerSim>[0] = {}) {
  const s = new MoonrakerSim({ name: 'Left', clock: () => T0, ...options });
  s.addFile('cube.gcode', { estimatedTime: 100, layers: 10, objects: ['cube_1', 'cube_2'], nozzleTemp: 200, bedTemp: 60 });
  return s;
}

function call(s: MoonrakerSim, method: string, url: string, extra: Partial<SimRequest> = {}) {
  const res = s.handle({ method, url, ...extra });
  if (res.kind !== 'http') return { status: 0, json: null as any };
  return { status: res.status, json: typeof res.body === 'string' && res.contentType === 'application/json' ? JSON.parse(res.body) : null, res };
}

const get = (s: MoonrakerSim, url: string) => call(s, 'GET', url);
const post = (s: MoonrakerSim, url: string) => call(s, 'POST', url);
const script = (s: MoonrakerSim, gcode: string) => post(s, `/printer/gcode/script?script=${encodeURIComponent(gcode)}`);
const status = (s: MoonrakerSim, query: string) => get(s, `/printer/objects/query?${query}`).json.result.status;

describe('MoonrakerSim: shapes', () => {
  it('answers server and printer info as Moonraker 1.4 does', () => {
    const s = sim();
    expect(get(s, '/server/info').json.result).toMatchObject({ klippy_connected: true, klippy_state: 'ready', api_version_string: '1.4.0' });
    expect(get(s, '/printer/info').json.result).toMatchObject({ state: 'ready', state_message: 'Printer is ready', hostname: 'left' });
    expect(get(s, '/printer/objects/list').json.result.objects).toContain('gcode_macro LOAD_FILAMENT');
  });

  it('filters a query by attribute and answers an unknown object with {}', () => {
    const s = sim();
    const st = status(s, 'extruder=temperature,target&nope&print_stats');
    expect(st.extruder).toEqual({ temperature: 22, target: 0 });
    expect(st.nope).toEqual({});
    expect(st.print_stats).toMatchObject({ state: 'standby', filename: '', info: { total_layer: null, current_layer: null } });
  });

  it('accepts a POST query with a JSON body', () => {
    const s = sim();
    const res = call(s, 'POST', '/printer/objects/query', {
      headers: { 'content-type': 'application/json' },
      body: new TextEncoder().encode(JSON.stringify({ objects: { webhooks: null } })),
    });
    expect(res.json.result.status.webhooks).toEqual({ state: 'ready', state_message: 'Printer is ready' });
  });

  it('drops a missing macro from the object list, and then treats it as unknown', () => {
    const s = sim({ missing: ['gcode_macro COLDPULL'] });
    expect(get(s, '/printer/objects/list').json.result.objects).not.toContain('gcode_macro COLDPULL');
    expect(script(s, 'COLDPULL').status).toBe(200);
    expect(get(s, '/server/gcode_store?count=1').json.result.gcode_store[0].message).toBe('// Unknown command:"COLDPULL"');
  });

  it('lists files with metadata and serves their thumbnails', () => {
    const s = sim();
    expect(get(s, '/server/files/list?root=gcodes').json.result).toEqual([
      { path: 'cube.gcode', modified: T0 / 1000, size: 1_000_000, permissions: 'rw' },
    ]);
    const meta = get(s, '/server/files/metadata?filename=cube.gcode').json.result;
    expect(meta).toMatchObject({ filename: 'cube.gcode', estimated_time: 100, layer_count: 10 });
    const thumb = get(s, `/server/files/gcodes/${encodeURIComponent(meta.thumbnails[1].relative_path)}`);
    expect(thumb.status).toBe(200);
    expect(thumb.res?.kind === 'http' && thumb.res.contentType).toBe('image/png');
    expect(get(s, '/server/files/metadata?filename=nope.gcode').status).toBe(404);
  });

  it('points the camera at its own origin when it has one', () => {
    const cams = get(sim({ origin: 'http://127.0.0.1:17125' }), '/server/webcams/list').json.result.webcams;
    expect(cams.find((c: { enabled: boolean }) => c.enabled).snapshot_url).toBe('http://127.0.0.1:17125/webcam/?action=snapshot');
    const relative = get(sim(), '/server/webcams/list').json.result.webcams;
    expect(relative.find((c: { enabled: boolean }) => c.enabled).stream_url).toBe('/webcam/?action=stream');
  });

  it('refuses a GET on a command endpoint', () => {
    expect(get(sim(), '/printer/emergency_stop').status).toBe(405);
  });
});

describe('MoonrakerSim: a print', () => {
  it('heats, advances layers on tick, completes, and files the job in history', () => {
    const s = sim();
    expect(post(s, '/printer/print/start?filename=cube.gcode').status).toBe(200);
    expect(s.scripts).toEqual(['SDCARD_PRINT_FILE FILENAME="cube.gcode"']);
    expect(status(s, 'extruder=target&heater_bed=target')).toEqual({ extruder: { target: 200 }, heater_bed: { target: 60 } });
    s.tick(10);
    expect(status(s, 'virtual_sdcard=progress').virtual_sdcard.progress).toBe(0); // still heating
    s.tick(60);
    const mid = status(s, 'print_stats&virtual_sdcard');
    expect(mid.print_stats.state).toBe('printing');
    expect(mid.virtual_sdcard.progress).toBeGreaterThan(0);
    expect(mid.print_stats.info.current_layer).toBeGreaterThan(1);
    s.tick(200);
    expect(s.state).toBe('complete');
    const jobs = get(s, '/server/history/list?limit=10').json.result.jobs;
    expect(jobs[0]).toMatchObject({ filename: 'cube.gcode', status: 'completed', end_time: T0 / 1000 });
  });

  it('pauses, resumes and cancels through the print endpoints', () => {
    const s = sim();
    s.startPrint('cube.gcode');
    post(s, '/printer/print/pause');
    expect(status(s, 'pause_resume').pause_resume.is_paused).toBe(true);
    post(s, '/printer/print/resume');
    expect(s.state).toBe('printing');
    post(s, '/printer/print/cancel');
    expect(s.state).toBe('cancelled');
    expect(s.scripts.slice(1)).toEqual(['PAUSE', 'RESUME', 'CANCEL_PRINT']);
    expect(get(s, '/server/history/list').json.result.jobs[0].status).toBe('cancelled');
  });

  it('refuses a second start and a missing file as Klipper does', () => {
    const s = sim();
    expect(post(s, '/printer/print/start?filename=nope.gcode').json.error.message).toBe('Unable to open file');
    s.startPrint('cube.gcode');
    const busy = post(s, '/printer/print/start?filename=cube.gcode');
    expect(busy.status).toBe(400);
    expect(busy.json.error.message).toBe('SD busy');
  });

  it('pauses at the next layer when asked', () => {
    const s = sim();
    s.startPrint('cube.gcode');
    s.tick(60);
    script(s, 'SET_PAUSE_NEXT_LAYER ENABLE=1');
    s.tick(20);
    expect(s.state).toBe('paused');
  });

  it('marks excluded objects', () => {
    const s = sim();
    s.startPrint('cube.gcode');
    script(s, 'EXCLUDE_OBJECT NAME=cube_2');
    expect(status(s, 'exclude_object').exclude_object).toMatchObject({
      objects: [{ name: 'CUBE_1' }, { name: 'CUBE_2' }],
      excluded_objects: ['CUBE_2'],
    });
  });

  it('pauses on filament runout', () => {
    const s = sim();
    s.startPrint('cube.gcode');
    s.runout();
    expect(s.state).toBe('paused');
    expect(status(s, 'filament_switch_sensor%20e0_sensor')['filament_switch_sensor e0_sensor'].filament_detected).toBe(false);
  });

  it('keeps an uploaded file with the metadata Orca wrote into it', () => {
    const s = sim();
    const boundary = 'XyZ';
    const gcode = '; estimated printing time (normal mode) = 1h 2m 3s\n; total layer number: 42\nEXCLUDE_OBJECT_DEFINE NAME=part_a CENTER=0,0\nG28\n';
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="up.gcode"\r\nContent-Type: text/plain\r\n\r\n${gcode}\r\n--${boundary}--\r\n`;
    const res = call(s, 'POST', '/server/files/upload', {
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      body: new TextEncoder().encode(body),
    });
    expect(res.status).toBe(201);
    expect(res.json.result.item.path).toBe('up.gcode');
    expect(get(s, '/server/files/metadata?filename=up.gcode').json.result).toMatchObject({ estimated_time: 3723, layer_count: 42 });
    expect(get(s, '/server/files/gcodes/up.gcode').res).toMatchObject({ body: gcode });
  });
});

describe('MoonrakerSim: G-code', () => {
  it('logs every script and answers an unknown command in the console, not as an error', () => {
    const s = sim();
    expect(script(s, 'FROB X=1').json).toEqual({ result: 'ok' });
    expect(s.scripts).toEqual(['FROB X=1']);
    expect(get(s, '/server/gcode_store?count=5').json.result.gcode_store.map((l: { message: string }) => l.message))
      .toEqual(['FROB X=1', '// Unknown command:"FROB"']);
  });

  it('refuses a cold extrude and an unhomed move', () => {
    const s = sim();
    expect(script(s, 'G1 E5').json.error.message).toMatch(/^Extrude below minimum temp/);
    expect(script(s, 'G1 X10').json.error.message).toMatch(/^Must home axis first/);
    script(s, 'G28');
    expect(script(s, 'G91\nG1 Z10').status).toBe(200);
    expect(status(s, 'toolhead=homed_axes').toolhead.homed_axes).toBe('xyz');
  });

  it('applies temperatures, fan, speed, flow, Z offset and light', () => {
    const s = sim();
    script(s, 'M104 S230\nM140 S80\nM106 S128\nM220 S120\nM221 S95\nSET_GCODE_OFFSET Z_ADJUST=0.05\nSET_GCODE_OFFSET Z_ADJUST=-0.01\nLED_ON');
    const st = status(s, 'extruder=target&heater_bed=target&fan_generic%20fanM106=speed&gcode_move&led%20chamber_light');
    expect(st.extruder.target).toBe(230);
    expect(st.heater_bed.target).toBe(80);
    expect(st['fan_generic fanM106'].speed).toBeCloseTo(128 / 255);
    expect(st.gcode_move).toMatchObject({ speed_factor: 1.2, extrude_factor: 0.95, homing_origin: [0, 0, 0.04, 0] });
    expect(st['led chamber_light'].color_data).toEqual([[1, 1, 1, 1]]);
    s.tick(100);
    expect(s.temperatures.extruder.temperature).toBe(230);
  });

  it('heats for LOAD_FILAMENT so a following extrude works', () => {
    const s = sim();
    script(s, 'LOAD_FILAMENT TEMP=250');
    expect(s.temperatures.extruder).toEqual({ temperature: 250, target: 250 });
    expect(script(s, 'M83\nG1 E10 F300').status).toBe(200);
  });

  it('parses both G-code parameter styles', () => {
    expect(parseGcodeLine('g1 x10 E-2.5 F300')).toEqual({ cmd: 'G1', params: { X: '10', E: '-2.5', F: '300' } });
    expect(parseGcodeLine('EXCLUDE_OBJECT name="Part 1" CURRENT=1')).toEqual({ cmd: 'EXCLUDE_OBJECT', params: { NAME: 'Part 1', CURRENT: '1' } });
  });
});

describe('MoonrakerSim: klippy and faults', () => {
  it('shuts down on emergency stop, refuses G-code, and recovers on firmware restart', () => {
    const s = sim();
    s.startPrint('cube.gcode');
    s.tick(60);
    post(s, '/printer/emergency_stop');
    expect(get(s, '/server/info').json.result.klippy_state).toBe('shutdown');
    expect(get(s, '/printer/info').json.result.state_message).toMatch(/^Shutdown due to webhooks request/);
    expect(s.state).toBe('error');
    expect(get(s, '/server/history/list').json.result.jobs[0].status).toBe('klippy_shutdown');
    const refused = script(s, 'G28');
    expect(refused.status).toBe(400);
    expect(refused.json.error.message).toBe('Shutdown due to webhooks request');

    post(s, '/printer/firmware_restart');
    expect(get(s, '/server/info').json.result.klippy_state).toBe('disconnected');
    expect(get(s, '/printer/objects/query?webhooks').status).toBe(503);
    s.tick(3);
    expect(s.klippyState).toBe('ready');
    expect(s.state).toBe('standby');
  });

  it('accepts FIRMWARE_RESTART as G-code while shut down', () => {
    const s = sim();
    script(s, 'M112');
    expect(s.klippyState).toBe('shutdown');
    expect(script(s, 'FIRMWARE_RESTART').status).toBe(200);
    s.tick(3);
    expect(s.klippyState).toBe('ready');
  });

  it('reports a klippy error with its message', () => {
    const s = sim();
    s.klippyError('MCU \'mcu\' shutdown: Timer too close');
    expect(get(s, '/printer/info').json.result).toMatchObject({ state: 'error', state_message: "MCU 'mcu' shutdown: Timer too close" });
  });

  it('goes unreachable, slow, and fails uploads on request', () => {
    const s = sim();
    s.faults.unreachable = true;
    expect(s.handle({ method: 'GET', url: '/server/info' })).toEqual({ kind: 'unreachable' });
    s.faults.unreachable = false;
    s.faults.latencyMs = 5000;
    expect(s.handle({ method: 'GET', url: '/server/info' })).toMatchObject({ kind: 'http', delayMs: 5000 });
    s.faults.latencyMs = 0;
    s.faults.failUploads = 1;
    const upload = () => call(s, 'POST', '/server/files/upload', {
      headers: { 'content-type': 'multipart/form-data; boundary=b' },
      body: new TextEncoder().encode('--b\r\nContent-Disposition: form-data; name="file"; filename="a.gcode"\r\n\r\nG28\r\n--b--\r\n'),
    });
    expect(upload()).toMatchObject({ status: 500, json: { error: { code: 500, message: 'disk full' } } });
    expect(upload().status).toBe(201);
  });

  it('drops off the network for a reboot and comes back idle', () => {
    const s = sim();
    script(s, 'REBOOT');
    expect(s.handle({ method: 'GET', url: '/server/info' }).kind).toBe('unreachable');
    s.tick(31);
    expect(get(s, '/server/info').json.result.klippy_state).toBe('ready');
    expect(get(s, '/machine/proc_stats').json.result.system_uptime).toBeLessThan(5);
  });

  it('reboots through /machine/reboot even while Klipper is shut down', () => {
    const s = sim();
    post(s, '/printer/emergency_stop');
    expect(script(s, 'REBOOT').status).toBe(400);
    expect(post(s, '/machine/reboot').status).toBe(200);
    expect(s.handle({ method: 'GET', url: '/server/info' }).kind).toBe('unreachable');
    s.tick(31);
    expect(s.klippyState).toBe('ready');
  });

  it('stays off after SHUTDOWN until powered on', () => {
    const s = sim();
    script(s, 'SHUTDOWN');
    s.tick(600);
    expect(s.handle({ method: 'GET', url: '/server/info' }).kind).toBe('unreachable');
    s.powerOn();
    expect(get(s, '/server/info').status).toBe(200);
  });
});

describe('parseMultipartFile', () => {
  it('finds the file part among other fields', () => {
    const body = '--b\r\nContent-Disposition: form-data; name="root"\r\n\r\ngcodes\r\n--b\r\nContent-Disposition: form-data; name="file"; filename="x.gcode"\r\n\r\nG28\nG1 X1\r\n--b--\r\n';
    const part = parseMultipartFile('multipart/form-data; boundary=b', new TextEncoder().encode(body));
    expect(part?.filename).toBe('x.gcode');
    expect(new TextDecoder().decode(part!.content)).toBe('G28\nG1 X1');
  });
});
