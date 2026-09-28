// SPDX-License-Identifier: MIT
//
// One Klipper + Moonraker printer as a pure state machine, so the printers UI
// can be driven end to end with no real printer: e2e tests reach it through
// `tests/e2e/fixtures/fake-moonraker.ts` (page.route) and a person or agent
// through `scripts/fake-printers.ts` (a Node HTTP server). It does no I/O and
// runs no timers. Adapters hand it requests and advance its clock with tick().
//
// Response shapes, the object list and the macro list mirror read-only GETs
// against the fleet (Flashforge AD5M running ZMOD, Moonraker API 1.4.0). The
// macros' bodies weren't read, so what a ZMOD macro does here (LOAD_FILAMENT
// heats, AUTO_FULL_BED_LEVEL homes, …) is a stand-in for its visible effect.
// Behaviour taken from Klipper's source rather than observed: an unknown
// command answers `// Unknown command:"X"` with HTTP 200; any command but
// FIRMWARE_RESTART/RESTART fails with the state message while klippy isn't
// ready; an extrude below `min_extrude_temp` and a move on an unhomed axis
// fail the script.

// ─── Wire types ──────────────────────────────────────────────────────────────

export interface SimRequest {
  method: string;
  /** Path and query, e.g. `/printer/objects/query?print_stats`. */
  url: string;
  /** Lower-case header names; only `content-type` is read. */
  headers?: Record<string, string>;
  body?: Uint8Array;
}

export type SimResponse =
  | { kind: 'unreachable' }
  | {
    kind: 'http';
    status: number;
    contentType: string;
    body: string | Uint8Array;
    /** Answer only after this long (fault injection). */
    delayMs: number;
    /** An MJPEG stream: the adapter repeats `body` as frames while the client listens. */
    stream?: boolean;
  };

// ─── Fleet constants ─────────────────────────────────────────────────────────

/** `/printer/objects/list` as the fleet reports it. */
export const FLEET_OBJECTS: readonly string[] = ['gcode', 'webhooks', 'configfile', 'mcu', 'mcu eboard', 'heaters', 'heater_fan heat_fan', 'fan_generic fanM106', 'fan_generic chamber_fan', 'fan_generic internal_fan', 'fan_generic external_fan', 'gcode_button btn_power', 'idle_timeout', 'pause_resume', 'tmc2209 stepper_x', 'tmc2209 stepper_y', 'tmc2209 stepper_z', 'temperature_sensor weightValue', 'temperature_sensor tvocValue', 'filament_switch_sensor e1_sensor', 'gcode_button check_level_pin', 'filament_switch_sensor e0_sensor', 'servo my_servo', 'gcode_move', 'gcode_macro M900', 'gcode_macro M106', 'gcode_macro M107', 'print_stats', 'virtual_sdcard', 'display_status', 'exclude_object', 'bed_mesh', 'probe', 'controller_fan driver_fan', 'gcode_macro _KAMP_BED_MESH_CALIBRATE', 'gcode_macro KAMP_DEFINE_AREA', 'gcode_macro LINE_PURGE', 'gcode_macro _LINE_PURGE', 'gcode_macro SMART_PARK', 'gcode_macro _KAMP_Settings', 'firmware_retraction', 'mod_params', 'gcode_macro TONE', 'gcode_macro M300', 'gcode_macro M356', 'gcode_macro BEEP', 'gcode_macro ALARM', 'gcode_macro M108', 'gcode_macro G28', 'gcode_macro LIST_MOD_PARAMS', 'gcode_macro WAIT', 'gcode_macro SHELL', 'gcode_macro BED_LEVEL_SCREWS_TUNE', 'gcode_macro _CHECK_BED_MESH', 'gcode_macro _CHECK_BED_MESH_PROBE', 'gcode_macro _CHECK_BED_MESH_VERIFY', 'gcode_macro _CHECK_BED_MESH_HANDLE_FAIL', 'gcode_macro CLEAR_NOZZLE', 'gcode_macro _CLEAR_NOZZLE_PROBE', 'gcode_macro _CLEAR_NOZZLE_SAVE_PROBE', 'gcode_macro _CLEAR_NOZZLE', 'gcode_macro _PREPARE_LEVELING', 'gcode_macro _FULL_BED_LEVEL', 'gcode_macro AUTO_FULL_BED_LEVEL', 'gcode_macro _AUTO_FULL_BED_LEVEL', 'gcode_macro M357', 'gcode_macro PID_TUNE_BED', 'gcode_macro PID_TUNE_EXTRUDER', 'gcode_macro LOAD_FILAMENT', 'gcode_macro UNLOAD_FILAMENT', 'gcode_macro PURGE_FILAMENT', 'gcode_macro LOAD_MATERIAL', 'gcode_macro _LOAD_MATERIAL_SELECT', 'gcode_macro _LOAD_MATERIAL_HEATUP', 'gcode_macro _LOAD_MATERIAL_ACTION', 'gcode_macro _FILAMENT_ACTION', 'gcode_macro _LOAD_MATERIAL_END', 'gcode_macro M600', 'gcode_macro _INTERACTIVE_LOAD_END', 'gcode_macro SHUTDOWN', 'gcode_macro REBOOT', 'gcode_macro REMOVE_MOD', 'gcode_macro REMOVE_MOD_SOFT', 'gcode_macro SKIP_MOD', 'gcode_macro SKIP_MOD_SOFT', 'gcode_macro _TOUCH_BOOT_FLAG', 'gcode_macro LED_ON', 'gcode_macro LED_OFF', 'gcode_macro LED', 'gcode_macro MEM', 'gcode_macro AIR_CIRCULATION_INTERNAL', 'gcode_macro AIR_CIRCULATION_EXTERNAL', 'gcode_macro AIR_CIRCULATION_STOP', 'gcode_macro PLAY_MIDI', 'gcode_macro CAMERA_RELOAD', 'gcode_macro CAMERA_RESTART', 'gcode_macro DATE_GET', 'gcode_macro DATE_SET', 'gcode_macro WEB', 'gcode_macro _G17', 'gcode_macro G17', 'gcode_macro G18', 'gcode_macro G19', 'gcode_macro _STOP', 'gcode_macro ZSHAPER', 'gcode_macro SET_TIMEZONE', 'gcode_macro KAMP', 'gcode_macro STOP_MOD', 'gcode_macro START_MOD', 'gcode_macro TEST_EMMC', 'gcode_macro CLEAR_EMMC', 'gcode_macro ZSSH_RELOAD', 'gcode_macro CONFIG_BACKUP', 'gcode_macro CONFIG_RESTORE', 'gcode_macro CONFIG_VERIFY', 'gcode_macro TAR_BACKUP', 'gcode_macro TAR_DEBUG', 'gcode_macro _CLEAR1', 'gcode_macro _CLEAR2', 'gcode_macro _CLEAR3', 'gcode_macro _CLEAR4', 'gcode_macro _CANCEL_DELAYED_COMMANDS', 'gcode_macro _START_PRINT_PREPARE', 'gcode_macro _START_PRINT', 'gcode_macro _WAIT_TEMPERATURE', 'gcode_macro _WAIT_TEMPERATURE_CHECK_LOOP', 'gcode_macro _WAIT_TEMPERATURE_CHECK', 'gcode_macro _WAIT_TEMPERATURE_FINAL_CHECK', 'gcode_macro _RAISE_WITH_PRINT_CANCEL', 'gcode_macro _RAISE_ERROR', 'gcode_macro NEW_SAVE_CONFIG', 'gcode_macro _MAYBE_AUTO_REBOOT', 'gcode_macro _CANCEL_AUTO_REBOOT', 'gcode_macro _ENSURE_SERVICES_STARTED', 'gcode_macro _COLDPULL_LOAD_MATERIAL_END', 'gcode_macro _COLDPULL_LOAD_MATERIAL', 'gcode_macro COLDPULL', 'gcode_macro SET_GCODE_OFFSET', 'gcode_macro LOAD_GCODE_OFFSET', 'gcode_macro SET_FAN_SPEED', 'gcode_macro MOVE_SAFE', 'gcode_macro _CLIENT_LINEAR_MOVE', 'gcode_macro SET_LED', 'gcode_macro _PRINT_STATUS', 'gcode_macro SUPPORT_FORGE_X', 'gcode_macro CANCEL_PRINT', 'gcode_macro PAUSE', 'gcode_macro RESUME', 'gcode_macro SET_PAUSE_NEXT_LAYER', 'gcode_macro SET_PAUSE_AT_LAYER', 'gcode_macro SET_PRINT_STATS_INFO', 'gcode_macro _TOOLHEAD_PARK_PAUSE_CANCEL', 'gcode_macro _CLIENT_EXTRUDE', 'gcode_macro _CLIENT_RETRACT', 'gcode_macro RESURRECT', 'gcode_macro RESURRECT_ABORT', 'gcode_macro _SHUTDOWN_BUTTON_TRIGGER', 'gcode_macro _CLIENT_VARIABLE', 'gcode_macro _CANCEL_PRINT_WITH_AUDIO_WARNING', 'gcode_macro _PAUSE_WITH_STATUS', 'gcode_macro _RESUME_WITH_STATUS', 'gcode_macro _COMMON_END_PRINT', 'gcode_macro START_PRINT', 'gcode_macro END_PRINT', 'gcode_macro _BACKLIGHT', 'gcode_macro M24', 'gcode_macro M25', 'tmc2209 extruder', 'heater_bed', 'led chamber_light', 'system_stats', 'motion_report', 'query_endstops', 'manual_probe', 'toolhead', 'extruder'];

/** Klipper's own commands (not macros) that the sim accepts, most as no-ops. */
const KLIPPER_COMMANDS = new Set([
  'G0', 'G1', 'G4', 'G10', 'G11', 'G20', 'G21', 'G28', 'G90', 'G91', 'G92', 'M82', 'M83', 'M84', 'M18', 'M104', 'M105',
  'M109', 'M112', 'M114', 'M115', 'M117', 'M118', 'M140', 'M190', 'M204', 'M220', 'M221', 'M400',
  'SET_HEATER_TEMPERATURE', 'TURN_OFF_HEATERS', 'TEMPERATURE_WAIT', 'SET_VELOCITY_LIMIT', 'SET_PRESSURE_ADVANCE',
  'SET_KINEMATIC_POSITION', 'SET_IDLE_TIMEOUT', 'SET_STEPPER_ENABLE', 'SET_FILAMENT_SENSOR', 'QUERY_FILAMENT_SENSOR',
  'QUERY_ENDSTOPS', 'EXCLUDE_OBJECT', 'EXCLUDE_OBJECT_DEFINE', 'EXCLUDE_OBJECT_START', 'EXCLUDE_OBJECT_END',
  'SDCARD_PRINT_FILE', 'SDCARD_RESET_FILE', 'CLEAR_PAUSE', 'BED_MESH_CALIBRATE', 'BED_MESH_PROFILE', 'BED_MESH_CLEAR',
  'SAVE_CONFIG', 'FIRMWARE_RESTART', 'RESTART', 'STATUS', 'HELP', 'RESPOND', 'GET_POSITION', 'SAVE_GCODE_STATE',
  'RESTORE_GCODE_STATE', 'SET_RETRACTION', 'GET_RETRACTION', 'SET_PIN', 'SET_SERVO', 'MANUAL_PROBE', 'PROBE',
  'SET_GCODE_OFFSET', 'SET_FAN_SPEED', 'SET_LED', 'PAUSE', 'RESUME', 'CANCEL_PRINT',
]);

const MIN_EXTRUDE_TEMP = 170;
const AMBIENT = 22;
/** °C per second a heater moves toward its target: heating, cooling. */
const EXTRUDER_RATE = [4, 1.5] as const;
const BED_RATE = [1, 0.3] as const;
/** Seconds Klipper is gone after FIRMWARE_RESTART, and the host after REBOOT. */
const RESTART_SECONDS = 2;
const REBOOT_SECONDS = 30;
/** What a load/unload/purge macro heats to when no TEMP is given. */
const DEFAULT_LOAD_TEMP = 240;
const SHUTDOWN_TRAILER = '\nOnce the underlying issue is corrected, use the\n"FIRMWARE_RESTART" command to reset the firmware, reload the\nconfig, and restart the host software.\nPrinter is shutdown\n';

const THUMBNAIL_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAY0lEQVR42u3ZMQ0AIAwAQeQwMDKipErQhBJkoaIkkEvewM1fautPVwAAAAAAAAAAAAAAAAAALgFiz9QAAACSAWNFagAAAAAAAAAAAAAAAAAAAAAAAABfAhwaAAAAAAAAgI8AB4jhmOb63K/pAAAAAElFTkSuQmCC';
const CAMERA_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAUAAAADwCAIAAAD+Tyo8AAACqUlEQVR42u3TsQ2AMAxEUU8SUWUUamo3NAyWIRgwW1gCP+lNcKcf45jAR4UJQMCAgAEBg4ABAQMCBgQMAgYEDAgYBAwIGBAwIGAQMCBgQMCAgEHAgIABAYOAAQEDAgYEDAIGBAwIGBAwCBgQMCBgEDAgYEDAgIBBwICAAQGDgK0AAgYEDAgYBAwIGBAwIGAQMCBgQMAgYEDAgIABAYOAAQEDAgYEDAIGBAwIGAQMCBgQMCBgEDAgYEDAgIBBwICAAQGDgAEBAwIGBAwCBgQMCBgEDAgYEDAgYBAwIGBAwICAQcCAgAEBg4ABAQMCBgQMAgYEDAgYEDAIGBAwIGAQMCBgQMCAgEHAgIABAQMCLnK9TyseF7CABYyABSxgASNgAQtYwAJGwAIWMAIWsIAFjIAFLGABCxgBC1jAAkbAAhYwAkbAAhYwAhawgAWMgAUsYAELGAELWMACtoKABSxgBCxgAQtYwAhYwAIWMAIWsIARMAIWsIARsIAFLGAELGABC1jACFjAAhYwAhawgBGwgAUsYAEjYAELWMAIWMACFrCAEbCABYyABSxgASNgAQtYwAJGwAIWsIARsIAFjICdXhJw5k2Bc2UrHq8hYAELWMAIWMACFrCAEbCABSxgBCxgASNgBCxgASNgAQtYwAhYwAIWsIARsIAFLGAELGABI2ABC1jAAkbAAhawgBGwgAUsYAEjYAELGAGDgAEBAwIGAQMCBgQMCBgEDAgYEDAgYBAwIGBAwCBgQMCAgAEBg4ABAQMCBgFbAQQMCBgQMAgYEDAgYEDAIGBAwICAQcCAgAEBAwIGAQMCBgQMCBgEDAgYEDAIGBAwIGBAwCBgQMCAgAEBg4ABAQMCBgEDAgYEDAgYBAwIGBAwCBgQMCBgQMAgYEDAgIABAcN/bKhMV1JLWu3BAAAAAElFTkSuQmCC';

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// ─── Model types ─────────────────────────────────────────────────────────────

export type KlippyState = 'ready' | 'startup' | 'shutdown' | 'error' | 'disconnected';
export type PrintState = 'standby' | 'printing' | 'paused' | 'complete' | 'cancelled' | 'error';

/** What a file on the printer claims about itself, as an Orca slice would. */
export interface SimFileSpec {
  /** Slicer estimate, seconds. Omit to model a file Moonraker found no estimate in. */
  estimatedTime?: number;
  layers?: number;
  /** Object names the file defines for EXCLUDE_OBJECT. */
  objects?: string[];
  material?: string;
  nozzleTemp?: number;
  bedTemp?: number;
  grams?: number;
  /** Seconds before the sim's clock that the file was written. */
  ageSec?: number;
  /** Whether the slicer embedded thumbnails (default true). */
  thumbnails?: boolean;
  content?: Uint8Array;
}

interface SimFile {
  name: string;
  size: number;
  modified: number;
  content: Uint8Array | null;
  metadata: Record<string, unknown>;
  objects: string[];
}

interface HistoryJob {
  job_id: string;
  user: string;
  filename: string;
  status: string;
  start_time: number;
  end_time: number | null;
  print_duration: number;
  total_duration: number;
  filament_used: number;
  metadata: Record<string, unknown>;
  auxiliary_data: unknown[];
  exists: boolean;
}

export interface SimOptions {
  /** Shown as the host name. */
  name?: string;
  /** Epoch ms now. Timestamps (history, files, console) come from it; physics from tick(). */
  clock?: () => number;
  /**
   * Where the sim is served, e.g. `http://127.0.0.1:17125`. The fleet's cameras
   * are relative URLs on port 80 behind nginx. With an origin the sim lists
   * them on its own port instead, and serves the frames itself.
   */
  origin?: string;
  /** Objects this printer lacks, e.g. `gcode_macro COLDPULL`, to model a printer without a macro. */
  missing?: string[];
  /** Host uptime at start, seconds. */
  uptimeSec?: number;
}

/** Fault injection. Adapters read it on every request, so tests flip it any time. */
export interface SimFaults {
  /** Every request fails as a refused connection. */
  unreachable: boolean;
  /** Answer every request only after this long. */
  latencyMs: number;
  /** This many next uploads fail with HTTP 500. */
  failUploads: number;
  uploadError: string;
}

type Reply =
  | { json: unknown; status?: number }
  | { bytes: Uint8Array; stream?: boolean }
  | { text: string };

const OK: Reply = { json: 'ok' };

class GcodeError extends Error {}
class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ─── The simulator ───────────────────────────────────────────────────────────

export class MoonrakerSim {
  readonly name: string;
  readonly faults: SimFaults = { unreachable: false, latencyMs: 0, failUploads: 0, uploadError: 'disk full' };
  /** Every G-code script Klippy ran, verbatim, oldest first, including the ones Moonraker sends for print/start|pause|resume|cancel. */
  readonly scripts: string[] = [];
  /** Every request, as `METHOD /path` (no query), oldest first. */
  readonly requests: string[] = [];

  private readonly clock: () => number;
  private readonly origin: string | null;
  private readonly objects: string[];
  private readonly macros: Set<string>;
  private uptime: number;

  private klippy: KlippyState = 'ready';
  private klippyMessage = '';
  /** Seconds until a restarting Klipper (or rebooting host) comes back. */
  private restartIn = 0;
  private rebootIn = 0;
  private poweredOff = false;

  private extruder = { temperature: AMBIENT, target: 0 };
  private bed = { temperature: AMBIENT, target: 0 };
  private fanSpeed = 0;
  private speedFactor = 1;
  private extrudeFactor = 1;
  private zOffset = 0;
  private homed = '';
  private position = [0, 0, 0, 0];
  private relative = false;
  private relativeE = false;
  private light = [0, 0, 0, 0];
  private sensors: Record<string, boolean> = { e0_sensor: true, e1_sensor: false };

  private files = new Map<string, SimFile>();
  private history: HistoryJob[] = [];
  private nextJobId = 1;
  private gcodeStore: Array<{ message: string; time: number; type: string }> = [];

  private printState: PrintState = 'standby';
  private printMessage = '';
  private job: { file: SimFile; history: HistoryJob } | null = null;
  private progress = 0;
  private printDuration = 0;
  private totalDuration = 0;
  private filamentUsed = 0;
  private excluded: string[] = [];
  private pauseNextLayer = false;
  private pauseAtLayer = 0;

  constructor(options: SimOptions = {}) {
    this.name = options.name ?? 'printer';
    this.clock = options.clock ?? Date.now;
    this.origin = options.origin?.replace(/\/+$/, '') ?? null;
    const missing = new Set(options.missing ?? []);
    this.objects = FLEET_OBJECTS.filter((o) => !missing.has(o));
    this.macros = new Set(this.objects.filter((o) => o.startsWith('gcode_macro ')).map((o) => o.slice(12).toUpperCase()));
    this.uptime = options.uptimeSec ?? 3 * 86400;
  }

  // ── Test-facing state ──

  get klippyState(): KlippyState { return this.klippy; }
  get state(): PrintState { return this.printState; }
  get filename(): string { return this.job?.file.name ?? ''; }
  get temperatures() {
    return { extruder: { ...this.extruder }, bed: { ...this.bed } };
  }
  get excludedObjects(): readonly string[] { return this.excluded; }
  /** Files in the gcodes root, sorted by name. */
  fileNames(): string[] { return [...this.files.keys()].sort(); }

  addFile(name: string, spec: SimFileSpec = {}): void {
    const now = this.nowSec();
    const base = name.replace(/\.gcode$/i, '');
    const thumbs = spec.thumbnails === false ? [] : [32, 300].map((px) => ({
      width: px, height: px, size: THUMBNAIL_PNG.length, relative_path: `.thumbs/${base}-${px}x${px}.png`,
    }));
    const content = spec.content ?? null;
    const grams = spec.grams ?? 20;
    const metadata: Record<string, unknown> = {
      size: content?.length ?? 1_000_000,
      modified: now - (spec.ageSec ?? 0),
      uuid: `sim-${base}`,
      slicer: 'OrcaSlicer',
      slicer_version: '2.3.1',
      layer_count: spec.layers ?? 100,
      object_height: (spec.layers ?? 100) * 0.2,
      nozzle_diameter: 0.4,
      layer_height: 0.2,
      first_layer_height: 0.2,
      first_layer_extr_temp: spec.nozzleTemp ?? 240,
      first_layer_bed_temp: spec.bedTemp ?? 70,
      chamber_temp: 0,
      filament_name: `Generic ${spec.material ?? 'PETG'}`,
      filament_type: spec.material ?? 'PETG',
      filament_total: grams * 330,
      filament_weight_total: grams,
      ...(spec.estimatedTime !== undefined ? { estimated_time: spec.estimatedTime } : {}),
      ...(thumbs.length ? { thumbnails: thumbs } : {}),
    };
    this.files.set(name, {
      name,
      size: metadata.size as number,
      modified: metadata.modified as number,
      content,
      metadata,
      objects: (spec.objects ?? []).map((o) => o.toUpperCase()),
    });
  }

  /** Start a file as `/printer/print/start` would. Throws like Klipper when it can't. */
  startPrint(filename: string): void {
    this.runScript(`SDCARD_PRINT_FILE FILENAME="${filename}"`, true);
  }

  /** Jump the running print to its end, as if it had just finished. */
  finish(): void {
    if (!this.job || (this.printState !== 'printing' && this.printState !== 'paused')) return;
    this.endPrint('complete', 'completed');
  }

  /** Flip a filament sensor. Losing filament mid-print pauses it, as the fleet's runout handler does. */
  setFilament(sensor: 'e0_sensor' | 'e1_sensor', detected: boolean): void {
    this.sensors[sensor] = detected;
    if (!detected && this.printState === 'printing') {
      this.respond(`// Filament Runout Sensor ${sensor}: runout event detected`);
      this.pause();
    }
  }

  runout(sensor: 'e0_sensor' | 'e1_sensor' = 'e0_sensor'): void {
    this.setFilament(sensor, false);
  }

  /** Klipper into its `error` state with `message`, as a failed MCU or config does. A firmware restart clears it. */
  klippyError(message: string): void {
    this.enterFault('error', message);
  }

  /** Power a printer back on after SHUTDOWN. */
  powerOn(): void {
    if (!this.poweredOff) return;
    this.poweredOff = false;
    this.bootHost();
  }

  /** Advance the physics: heaters, the print, restarts. */
  tick(seconds: number): void {
    let left = seconds;
    while (left > 0) {
      const dt = Math.min(1, left);
      left -= dt;
      this.step(dt);
    }
  }

  // ── Request handling ──

  handle(req: SimRequest): SimResponse {
    const url = new URL(req.url, 'http://sim');
    const path = decodeURIComponent(url.pathname);
    const method = req.method.toUpperCase();
    this.requests.push(`${method} ${url.pathname}`);
    if (this.faults.unreachable || this.poweredOff || this.rebootIn > 0) return { kind: 'unreachable' };
    try {
      const reply = this.route(method, path, url.searchParams, req);
      if ('bytes' in reply) return { ...this.http(200, 'image/png', reply.bytes), ...(reply.stream ? { stream: true } : {}) };
      if ('text' in reply) return this.http(200, 'text/plain', reply.text);
      return this.http(reply.status ?? 200, 'application/json', JSON.stringify({ result: reply.json }));
    } catch (err) {
      const status = err instanceof HttpError ? err.status : err instanceof GcodeError ? 400 : 500;
      const message = err instanceof Error ? err.message : String(err);
      return this.http(status, 'application/json', JSON.stringify({ error: { code: status, message } }));
    }
  }

  private http(status: number, contentType: string, body: string | Uint8Array): SimResponse {
    return { kind: 'http', status, contentType, body, delayMs: this.faults.latencyMs };
  }

  private route(method: string, path: string, q: URLSearchParams, req: SimRequest): Reply {
    const post = () => { if (method !== 'POST') throw new HttpError(405, 'Method Not Allowed'); };
    const klippyUp = () => {
      if (this.klippy === 'disconnected' || this.klippy === 'startup') throw new HttpError(503, 'Klippy Disconnected');
    };

    if (path === '/server/info') return { json: this.serverInfo() };
    if (path === '/machine/proc_stats') return { json: this.procStats() };
    // Moonraker's own host controls: they work while Klipper is shut down, which the ZMOD macros don't.
    if (path === '/machine/reboot' || path === '/machine/shutdown') {
      post();
      if (path === '/machine/reboot') this.rebootHost();
      else this.powerOff();
      return OK;
    }
    if (path === '/server/webcams/list') return { json: { webcams: this.webcams() } };
    if (path === '/webcam/' || path === '/webcam') {
      return { bytes: fromBase64(CAMERA_PNG), stream: q.get('action') === 'stream' };
    }
    if (path === '/server/gcode_store') {
      const count = Number(q.get('count') ?? 100);
      return { json: { gcode_store: this.gcodeStore.slice(-count) } };
    }
    if (path === '/server/history/list') return { json: this.historyList(q) };
    if (path === '/server/files/list') {
      return { json: [...this.files.values()].map((f) => ({ path: f.name, modified: f.modified, size: f.size, permissions: 'rw' })) };
    }
    if (path === '/server/files/metadata') {
      const name = q.get('filename') ?? '';
      const file = this.files.get(name);
      if (!file) throw new HttpError(404, `Metadata not available for <${name}>`);
      const last = this.history.find((j) => j.filename === name);
      return { json: { ...file.metadata, ...(last ? { print_start_time: last.start_time, job_id: last.job_id } : {}), filename: name } };
    }
    if (path === '/server/files/upload') {
      post();
      return { json: this.upload(req), status: 201 };
    }
    if (path === '/server/files/config/printer.cfg') {
      return { text: '[printer]\nkinematics: corexy\n\n[stepper_x]\nposition_min: -125\nposition_max: 125\n\n[stepper_y]\nposition_min: -125\nposition_max: 125\n\n[stepper_z]\nposition_max: 230\n\n[extruder]\nnozzle_diameter: 0.4\nmin_extrude_temp: 170\n' };
    }
    if (path.startsWith('/server/files/gcodes/')) {
      const name = path.slice('/server/files/gcodes/'.length);
      if (method === 'DELETE') {
        if (!this.files.delete(name)) throw new HttpError(404, `File ${name} does not exist`);
        return { json: { item: { path: name, root: 'gcodes' }, action: 'delete_file' } };
      }
      if (name.startsWith('.thumbs/')) {
        if ([...this.files.values()].some((f) => (f.metadata.thumbnails as Array<{ relative_path: string }> | undefined)
          ?.some((t) => t.relative_path === name))) return { bytes: fromBase64(THUMBNAIL_PNG) };
        throw new HttpError(404, 'Not Found');
      }
      const file = this.files.get(name);
      if (!file) throw new HttpError(404, 'Not Found');
      return { text: file.content ? new TextDecoder().decode(file.content) : `; ${name}\nG28\n` };
    }

    if (!path.startsWith('/printer/')) throw new HttpError(404, 'Not Found');
    klippyUp();
    if (path === '/printer/info') return { json: this.printerInfo() };
    if (path === '/printer/objects/list') return { json: { objects: this.objects } };
    if (path === '/printer/objects/query') return { json: this.query(this.queryObjects(method, q, req)) };
    if (path === '/printer/emergency_stop') {
      post();
      this.emergencyStop();
      return OK;
    }
    if (path === '/printer/firmware_restart' || path === '/printer/restart') {
      post();
      this.firmwareRestart();
      return OK;
    }
    if (path === '/printer/gcode/script') {
      post();
      const script = q.get('script') ?? this.jsonBody(req)?.script;
      if (typeof script !== 'string') throw new HttpError(400, "No data for argument: 'script'");
      this.gcodeStore.push({ message: script, time: this.nowSec(), type: 'command' });
      this.runScript(script, false);
      return OK;
    }
    const printAction = /^\/printer\/print\/(start|pause|resume|cancel)$/.exec(path)?.[1];
    if (printAction) {
      post();
      if (printAction === 'start') {
        const filename = q.get('filename') ?? this.jsonBody(req)?.filename;
        if (typeof filename !== 'string') throw new HttpError(400, "No data for argument: 'filename'");
        this.startPrint(filename);
      } else {
        this.runScript({ pause: 'PAUSE', resume: 'RESUME', cancel: 'CANCEL_PRINT' }[printAction]!, true);
      }
      return OK;
    }
    throw new HttpError(404, 'Not Found');
  }

  private jsonBody(req: SimRequest): Record<string, unknown> | null {
    if (!req.body?.length || !req.headers?.['content-type']?.includes('json')) return null;
    try {
      return JSON.parse(new TextDecoder().decode(req.body)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  // ── Server endpoints ──

  private serverInfo() {
    const connected = this.klippy !== 'disconnected';
    return {
      klippy_connected: connected,
      klippy_state: this.klippy,
      components: ['file_manager', 'klippy_apis', 'machine', 'data_store', 'proc_stats', 'job_state', 'history', 'webcam', 'octoprint_compat'],
      failed_components: [],
      registered_directories: ['config', 'logs', 'gcodes', 'config_examples', 'docs'],
      warnings: [],
      websocket_count: 0,
      moonraker_version: '?',
      missing_klippy_requirements: [],
      api_version: [1, 4, 0],
      api_version_string: '1.4.0',
    };
  }

  private printerInfo() {
    return {
      state: this.klippy,
      state_message: this.klippyMessage || 'Printer is ready',
      hostname: this.name.toLowerCase(),
      klipper_path: '/opt/klipper',
      python_path: '/opt/Python-3.7.11/bin/python3.7',
      log_file: '/data/logFiles/printer.log',
      config_file: '/opt/config/printer.cfg',
      software_version: '?',
      cpu_info: '2 core ARMv7 Processor rev 5 (v7l)',
    };
  }

  private procStats() {
    return {
      moonraker_stats: [{ time: this.nowSec(), cpu_usage: 1.6, memory: 38860, mem_units: 'kB' }],
      throttled_state: null,
      cpu_temp: null,
      network: { eth0: { rx_bytes: 0, tx_bytes: 0, bandwidth: 0 } },
      system_cpu_usage: { cpu: 1.5 },
      system_uptime: this.uptime,
      system_memory: { total: 110404, available: 46236, used: 64168 },
      websocket_connections: 0,
    };
  }

  private webcams() {
    const at = (url: string) => (this.origin ? `${this.origin}${url}` : url);
    const cam = (name: string, enabled: boolean, stream: string, snapshot: string) => ({
      name, enabled, icon: 'mdiWebcam', aspect_ratio: '4:3', target_fps: 15, target_fps_idle: 5, location: 'printer',
      service: 'mjpegstreamer', stream_url: stream, snapshot_url: snapshot, flip_horizontal: false, flip_vertical: false,
      rotation: 0, source: 'config', extra_data: {}, uid: `sim-${name}`,
    });
    return [
      cam('Example', false, 'http://your_IP:8080/?action=stream', 'http://your_IP:8080/?action=snapshot'),
      cam('cam', true, at('/webcam/?action=stream'), at('/webcam/?action=snapshot')),
    ];
  }

  private historyList(q: URLSearchParams) {
    const since = Number(q.get('since') ?? -Infinity);
    const before = Number(q.get('before') ?? Infinity);
    const start = Number(q.get('start') ?? 0);
    const limit = Number(q.get('limit') ?? 50);
    let jobs = this.history.filter((j) => j.start_time >= since && j.start_time < before);
    if (q.get('order') === 'asc') jobs = [...jobs].reverse();
    return { count: jobs.length, jobs: jobs.slice(start, start + limit).map((j) => ({ ...j })) };
  }

  private upload(req: SimRequest) {
    const part = parseMultipartFile(req.headers?.['content-type'] ?? '', req.body ?? new Uint8Array());
    if (!part) throw new HttpError(400, "No file included in upload");
    if (this.faults.failUploads > 0) {
      this.faults.failUploads--;
      throw new HttpError(500, this.faults.uploadError);
    }
    const text = new TextDecoder().decode(part.content);
    this.addFile(part.filename, { ...readGcodeHeader(text), content: part.content, thumbnails: false });
    const file = this.files.get(part.filename)!;
    return {
      item: { path: part.filename, root: 'gcodes', modified: file.modified, size: file.size, permissions: 'rw' },
      print_started: false,
      print_queued: false,
      action: 'create_file',
    };
  }

  // ── Printer objects ──

  private queryObjects(method: string, q: URLSearchParams, req: SimRequest): Record<string, string[] | null> {
    const wanted: Record<string, string[] | null> = {};
    if (method === 'POST') {
      const objects = this.jsonBody(req)?.objects;
      if (objects && typeof objects === 'object') Object.assign(wanted, objects);
      return wanted;
    }
    for (const [name, attrs] of q) wanted[name] = attrs ? attrs.split(',') : null;
    return wanted;
  }

  private query(wanted: Record<string, string[] | null>) {
    const status: Record<string, unknown> = {};
    for (const [name, attrs] of Object.entries(wanted)) {
      const full = this.objects.includes(name) ? this.objectStatus(name) : null;
      if (!full) {
        status[name] = {};
        continue;
      }
      status[name] = attrs ? Object.fromEntries(attrs.filter((a) => a in full).map((a) => [a, full[a]])) : full;
    }
    return { eventtime: this.uptime, status };
  }

  private objectStatus(name: string): Record<string, unknown> | null {
    const layers = this.job?.file.metadata.layer_count as number | undefined;
    const round = (n: number) => Math.round(n * 100) / 100;
    switch (name) {
      case 'webhooks':
        return { state: this.klippy, state_message: this.klippyMessage || 'Printer is ready' };
      case 'print_stats':
        return {
          filename: this.job?.file.name ?? '',
          total_duration: this.totalDuration,
          print_duration: this.printDuration,
          filament_used: this.filamentUsed,
          state: this.printState,
          message: this.printMessage,
          info: { total_layer: this.job ? layers ?? null : null, current_layer: this.job ? this.currentLayer() : null },
        };
      case 'virtual_sdcard':
        return {
          file_path: this.job ? `/data/gcodes/${this.job.file.name}` : null,
          progress: this.progress,
          is_active: this.printState === 'printing',
          file_position: Math.round(this.progress * (this.job?.file.size ?? 0)),
          file_size: this.job?.file.size ?? 0,
          estimate_print_time: null,
        };
      case 'display_status':
        return { progress: this.progress, message: null };
      case 'extruder':
        return {
          temperature: round(this.extruder.temperature), target: this.extruder.target,
          power: this.extruder.target > this.extruder.temperature ? 1 : this.extruder.target ? 0.3 : 0,
          can_extrude: this.extruder.temperature >= MIN_EXTRUDE_TEMP, pressure_advance: 0.035, smooth_time: 0.04,
        };
      case 'heater_bed':
        return {
          temperature: round(this.bed.temperature), target: this.bed.target,
          power: this.bed.target > this.bed.temperature ? 1 : this.bed.target ? 0.4 : 0,
        };
      case 'heaters':
        return { available_heaters: ['heater_bed', 'extruder'], available_sensors: ['heater_bed', 'extruder'], available_monitors: [] };
      case 'toolhead':
        return {
          homed_axes: this.homed, axis_minimum: [-125, -125, -10, 0], axis_maximum: [125, 125, 230, 0],
          print_time: 0, stalls: 0, estimated_print_time: this.uptime, extruder: 'extruder', position: [...this.position],
          max_velocity: 600, max_accel: 20000, max_accel_to_decel: 5000, square_corner_velocity: 9,
        };
      case 'gcode_move':
        return {
          speed_factor: this.speedFactor, speed: 1500, extrude_factor: this.extrudeFactor,
          absolute_coordinates: !this.relative, absolute_extrude: !this.relativeE,
          homing_origin: [0, 0, this.zOffset, 0], position: [...this.position], gcode_position: [...this.position],
          base_position: [0, 0, this.zOffset, 0],
        };
      case 'fan_generic fanM106':
        return { speed: this.fanSpeed, rpm: null };
      case 'fan_generic chamber_fan':
      case 'fan_generic internal_fan':
      case 'fan_generic external_fan':
        return { speed: 0, rpm: null };
      case 'filament_switch_sensor e0_sensor':
        return { filament_detected: this.sensors.e0_sensor, enabled: true };
      case 'filament_switch_sensor e1_sensor':
        return { filament_detected: this.sensors.e1_sensor, enabled: true };
      case 'exclude_object': {
        const objects = this.job?.file.objects ?? [];
        return {
          objects: objects.map((o, i) => {
            const x = -60 + (i % 3) * 60;
            const y = -60 + Math.floor(i / 3) * 60;
            return { name: o, center: [x, y], polygon: [[x - 15, y - 15], [x + 15, y - 15], [x + 15, y + 15], [x - 15, y + 15]] };
          }),
          excluded_objects: [...this.excluded],
          current_object: this.printState === 'printing' ? objects.find((o) => !this.excluded.includes(o)) ?? null : null,
        };
      }
      case 'idle_timeout':
        return {
          state: this.printState === 'printing' ? 'Printing' : this.homed || this.extruder.target || this.bed.target ? 'Ready' : 'Idle',
          printing_time: this.printState === 'printing' ? this.printDuration : 0,
        };
      case 'pause_resume':
        return { is_paused: this.printState === 'paused' };
      case 'led chamber_light':
        return { color_data: [[...this.light]] };
      case 'system_stats':
        return { sysload: 0.1, cputime: this.uptime / 50, memavail: 46176 };
      case 'motion_report':
        return { live_position: [...this.position], live_velocity: 0, live_extruder_velocity: 0, steppers: ['extruder', 'stepper_x', 'stepper_y', 'stepper_z'], trapq: ['extruder', 'toolhead'] };
      case 'firmware_retraction':
        return { retract_length: 0.7, retract_speed: 35, unretract_extra_length: 0, unretract_speed: 35 };
      case 'configfile':
        return {
          config: {
            printer: { kinematics: 'corexy' },
            stepper_x: { position_min: '-125', position_max: '125' },
            stepper_y: { position_min: '-125', position_max: '125' },
            stepper_z: { position_max: '230' },
            extruder: { nozzle_diameter: '0.4', min_extrude_temp: String(MIN_EXTRUDE_TEMP), max_temp: '300' },
            heater_bed: { max_temp: '110' },
          },
          settings: {
            extruder: { nozzle_diameter: 0.4, min_extrude_temp: MIN_EXTRUDE_TEMP, max_temp: 300 },
            heater_bed: { max_temp: 110 },
          },
        };
      default:
        return {};
    }
  }

  private currentLayer(): number | null {
    const layers = this.job?.file.metadata.layer_count as number | undefined;
    if (!layers) return null;
    return Math.min(layers, 1 + Math.floor(this.progress * layers));
  }

  // ── G-code ──

  /** Run a script as Klipper would: line by line, stopping at the first error. */
  private runScript(script: string, internal: boolean): void {
    this.scripts.push(script);
    for (const raw of script.split('\n')) {
      const line = raw.replace(/;.*$/, '').trim();
      if (!line) continue;
      try {
        this.runLine(line);
      } catch (err) {
        if (err instanceof GcodeError && !internal) this.respond(`!! ${err.message}`);
        throw err;
      }
    }
  }

  private runLine(line: string): void {
    const { cmd, params } = parseGcodeLine(line);
    const num = (key: string, fallback?: number): number | undefined => {
      if (!(key in params)) return fallback;
      const n = Number(params[key]);
      if (!Number.isFinite(n)) throw new GcodeError(`Unable to parse '${params[key]}' as a float`);
      return n;
    };

    if (this.klippy !== 'ready' && cmd !== 'FIRMWARE_RESTART' && cmd !== 'RESTART') {
      throw new GcodeError(this.klippyMessage.split('\n')[0] || `Klipper is ${this.klippy}`);
    }
    const isMacro = this.macros.has(cmd);
    if (!KLIPPER_COMMANDS.has(cmd) && !isMacro) {
      this.respond(`// Unknown command:"${cmd}"`);
      return;
    }

    switch (cmd) {
      case 'FIRMWARE_RESTART':
      case 'RESTART':
        this.firmwareRestart();
        return;
      case 'M112':
        this.emergencyStop();
        return;
      case 'G28':
        this.home(['X', 'Y', 'Z'].filter((a) => a in params));
        return;
      case 'G90':
        this.relative = false;
        this.relativeE = false;
        return;
      case 'G91':
        this.relative = true;
        this.relativeE = true;
        return;
      case 'M82':
        this.relativeE = false;
        return;
      case 'M83':
        this.relativeE = true;
        return;
      case 'G0':
      case 'G1':
        this.move(num('X'), num('Y'), num('Z'), num('E'));
        return;
      case 'M84':
      case 'M18':
        this.homed = '';
        return;
      case 'M104':
      case 'M109':
        this.setHeater('extruder', num('S', 0)!, cmd === 'M109');
        return;
      case 'M140':
      case 'M190':
        this.setHeater('heater_bed', num('S', 0)!, cmd === 'M190');
        return;
      case 'SET_HEATER_TEMPERATURE': {
        const heater = params.HEATER?.toLowerCase();
        if (heater !== 'extruder' && heater !== 'heater_bed') throw new GcodeError(`Heater ${params.HEATER} not known`);
        this.setHeater(heater, num('TARGET', 0)!, false);
        return;
      }
      case 'TURN_OFF_HEATERS':
        this.extruder.target = 0;
        this.bed.target = 0;
        return;
      case 'M106':
        this.fanSpeed = clamp(num('S', 255)! / 255, 0, 1);
        return;
      case 'M107':
        this.fanSpeed = 0;
        return;
      case 'SET_FAN_SPEED':
        if (params.FAN === 'fanM106') this.fanSpeed = clamp(num('SPEED', 0)!, 0, 1);
        return;
      case 'M220':
        this.speedFactor = num('S', 100)! / 100;
        return;
      case 'M221':
        this.extrudeFactor = num('S', 100)! / 100;
        return;
      case 'SET_GCODE_OFFSET':
        if ('Z' in params) this.zOffset = num('Z')!;
        if ('Z_ADJUST' in params) this.zOffset = Math.round((this.zOffset + num('Z_ADJUST')!) * 1e6) / 1e6;
        return;
      case 'EXCLUDE_OBJECT': {
        const name = params.NAME?.toUpperCase();
        if (name && !this.excluded.includes(name)) this.excluded.push(name);
        return;
      }
      case 'SDCARD_PRINT_FILE':
        this.beginPrint(params.FILENAME ?? '');
        return;
      case 'PAUSE':
      case 'M25':
        if (this.printState !== 'printing') throw new GcodeError('Print is not running');
        this.pause();
        return;
      case 'RESUME':
      case 'M24':
        if (this.printState !== 'paused') throw new GcodeError('Print is not paused, resume aborted');
        this.printState = 'printing';
        return;
      case 'CANCEL_PRINT':
        if (this.printState !== 'printing' && this.printState !== 'paused') throw new GcodeError('No print to cancel');
        this.endPrint('cancelled', 'cancelled');
        return;
      case 'SET_PAUSE_NEXT_LAYER':
        this.pauseNextLayer = num('ENABLE', 1) !== 0;
        return;
      case 'SET_PAUSE_AT_LAYER':
        this.pauseAtLayer = num('ENABLE', 1) !== 0 ? num('LAYER', 0)! : 0;
        return;
      case 'LED_ON':
        this.light = [1, 1, 1, 1];
        return;
      case 'LED_OFF':
        this.light = [0, 0, 0, 0];
        return;
      case 'LED': {
        const level = num('S', num('VALUE', 100))! / 100;
        this.light = [level, level, level, level].map((v) => clamp(v, 0, 1));
        return;
      }
      case 'SET_LED':
        if (params.LED === 'chamber_light') {
          this.light = ['RED', 'GREEN', 'BLUE', 'WHITE'].map((c) => clamp(num(c, 0)!, 0, 1));
        }
        return;
      case 'LOAD_FILAMENT':
      case 'UNLOAD_FILAMENT':
      case 'PURGE_FILAMENT':
        this.setHeater('extruder', num('TEMP', Math.max(this.extruder.target, DEFAULT_LOAD_TEMP))!, true);
        return;
      case 'AUTO_FULL_BED_LEVEL':
      case 'CLEAR_NOZZLE':
      case 'BED_MESH_CALIBRATE':
        this.home([]);
        return;
      case '_CLIENT_EXTRUDE':
        this.extrude(num('LENGTH', 10)!);
        return;
      case '_CLIENT_RETRACT':
        this.extrude(-num('LENGTH', 10)!);
        return;
      case 'REBOOT':
        this.rebootHost();
        return;
      case 'SHUTDOWN':
        this.powerOff();
        return;
      default:
        // A macro or Klipper command whose effect the dashboard can't see.
        return;
    }
  }

  private respond(message: string): void {
    this.gcodeStore.push({ message, time: this.nowSec(), type: 'response' });
    if (this.gcodeStore.length > 1000) this.gcodeStore.splice(0, this.gcodeStore.length - 1000);
  }

  private home(axes: string[]): void {
    const all = axes.length === 0 ? ['x', 'y', 'z'] : axes.map((a) => a.toLowerCase());
    this.homed = ['x', 'y', 'z'].filter((a) => all.includes(a) || this.homed.includes(a)).join('');
    for (const a of all) this.position['xyz'.indexOf(a)] = 0;
  }

  private move(x?: number, y?: number, z?: number, e?: number): void {
    const target = [x, y, z].map((v, i) => (v === undefined ? this.position[i] : this.relative ? this.position[i] + v : v));
    const moved = [x, y, z].some((v, i) => v !== undefined && target[i] !== this.position[i]);
    if (moved && this.homed !== 'xyz') {
      const pos = [...target, this.position[3]].map((v) => v.toFixed(3));
      throw new GcodeError(`Must home axis first: ${pos[0]} ${pos[1]} ${pos[2]} [${pos[3]}]`);
    }
    if (e !== undefined) this.extrude(this.relativeE ? e : e - this.position[3]);
    this.position = [...target, this.position[3]];
  }

  private extrude(mm: number): void {
    if (mm !== 0 && this.extruder.temperature < MIN_EXTRUDE_TEMP) {
      throw new GcodeError("Extrude below minimum temp\nSee the 'min_extrude_temp' config option for details");
    }
    this.position[3] += mm;
  }

  /** `wait` models M109/M190 and the macros that heat and wait: the HTTP call returns once hot. */
  private setHeater(heater: 'extruder' | 'heater_bed', target: number, wait: boolean): void {
    const h = heater === 'extruder' ? this.extruder : this.bed;
    const max = heater === 'extruder' ? 300 : 110;
    if (target > max) throw new GcodeError(`Requested temperature (${target.toFixed(1)}) out of range (0.0:${max.toFixed(1)})`);
    h.target = target;
    if (wait && target > 0) h.temperature = target;
  }

  // ── Print lifecycle ──

  private beginPrint(filename: string): void {
    if (this.printState === 'printing' || this.printState === 'paused') throw new GcodeError('SD busy');
    const file = this.files.get(filename);
    if (!file) throw new GcodeError('Unable to open file');
    const history: HistoryJob = {
      job_id: (this.nextJobId++).toString(16).toUpperCase().padStart(6, '0'),
      user: '_TRUSTED_USER_',
      filename,
      status: 'in_progress',
      start_time: this.nowSec(),
      end_time: null,
      print_duration: 0,
      total_duration: 0,
      filament_used: 0,
      metadata: { ...file.metadata },
      auxiliary_data: [],
      exists: true,
    };
    this.history.unshift(history);
    this.job = { file, history };
    this.printState = 'printing';
    this.printMessage = '';
    this.progress = 0;
    this.printDuration = 0;
    this.totalDuration = 0;
    this.filamentUsed = 0;
    this.excluded = [];
    this.pauseNextLayer = false;
    this.pauseAtLayer = 0;
    // START_PRINT: home, then heat to the file's first-layer temperatures.
    this.home([]);
    this.extruder.target = file.metadata.first_layer_extr_temp as number;
    this.bed.target = file.metadata.first_layer_bed_temp as number;
  }

  private pause(): void {
    this.printState = 'paused';
  }

  private endPrint(state: 'complete' | 'cancelled' | 'error', historyStatus: string): void {
    if (!this.job) return;
    if (state === 'complete') this.progress = 1;
    this.printState = state;
    const h = this.job.history;
    h.status = historyStatus;
    h.end_time = this.nowSec();
    h.print_duration = this.printDuration;
    h.total_duration = this.totalDuration;
    h.filament_used = this.filamentUsed;
    this.extruder.target = 0;
    this.bed.target = 0;
    this.fanSpeed = 0;
  }

  /** The host went away under a print: Moonraker files the job as interrupted-by-shutdown. */
  private interruptPrint(historyStatus: string): void {
    if (this.printState === 'printing' || this.printState === 'paused') this.endPrint('error', historyStatus);
  }

  private emergencyStop(): void {
    this.enterFault('shutdown', `Shutdown due to webhooks request${SHUTDOWN_TRAILER}`);
  }

  private enterFault(state: 'shutdown' | 'error', message: string): void {
    this.klippy = state;
    this.klippyMessage = message;
    if (this.printState === 'printing' || this.printState === 'paused') {
      this.printMessage = message.split('\n')[0];
      this.endPrint('error', 'klippy_shutdown');
    }
    this.extruder.target = 0;
    this.bed.target = 0;
    this.homed = '';
  }

  private rebootHost(): void {
    this.interruptPrint('klippy_shutdown');
    this.rebootIn = REBOOT_SECONDS;
  }

  private powerOff(): void {
    this.interruptPrint('klippy_shutdown');
    this.poweredOff = true;
  }

  private firmwareRestart(): void {
    this.interruptPrint('klippy_shutdown');
    this.klippy = 'disconnected';
    this.klippyMessage = '';
    this.restartIn = RESTART_SECONDS;
  }

  /** Klipper after a restart: nothing homed, heaters off, no print loaded. */
  private resetKlipper(): void {
    this.klippy = 'ready';
    this.klippyMessage = '';
    this.printState = 'standby';
    this.printMessage = '';
    this.job = null;
    this.progress = 0;
    this.printDuration = 0;
    this.totalDuration = 0;
    this.filamentUsed = 0;
    this.excluded = [];
    this.homed = '';
    this.extruder.target = 0;
    this.bed.target = 0;
    this.fanSpeed = 0;
    this.speedFactor = 1;
    this.extrudeFactor = 1;
    this.zOffset = 0;
    this.light = [0, 0, 0, 0];
  }

  private bootHost(): void {
    this.uptime = 0;
    this.extruder.temperature = AMBIENT;
    this.bed.temperature = AMBIENT;
    this.resetKlipper();
  }

  private step(dt: number): void {
    if (this.poweredOff) return;
    this.uptime += dt;
    if (this.rebootIn > 0) {
      this.rebootIn -= dt;
      if (this.rebootIn <= 0) this.bootHost();
      return;
    }
    if (this.restartIn > 0) {
      this.restartIn -= dt;
      if (this.restartIn <= 0) this.resetKlipper();
    }
    approach(this.extruder, EXTRUDER_RATE, dt);
    approach(this.bed, BED_RATE, dt);
    if (!this.job) return;
    if (this.printState === 'paused') this.totalDuration += dt;
    if (this.printState !== 'printing') return;
    this.totalDuration += dt;
    // START_PRINT waits for the nozzle before the first move.
    if (this.progress === 0 && this.extruder.temperature < this.extruder.target - 5) return;
    const estimated = (this.job.file.metadata.estimated_time as number | undefined) ?? 3600;
    const layerBefore = this.currentLayer();
    this.printDuration += dt;
    this.progress = Math.min(1, this.progress + (dt * this.speedFactor) / estimated);
    this.filamentUsed = Math.round(this.progress * (this.job.file.metadata.filament_total as number) * 100) / 100;
    this.job.history.print_duration = this.printDuration;
    this.job.history.total_duration = this.totalDuration;
    this.job.history.filament_used = this.filamentUsed;
    if (this.progress >= 1) {
      this.endPrint('complete', 'completed');
      return;
    }
    const layer = this.currentLayer();
    if (layer !== null && layer !== layerBefore) {
      if (this.pauseNextLayer || layer === this.pauseAtLayer) {
        this.pauseNextLayer = false;
        this.pauseAtLayer = 0;
        this.pause();
      }
    }
  }

  private nowSec(): number {
    return this.clock() / 1000;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function approach(h: { temperature: number; target: number }, [up, down]: readonly [number, number], dt: number): void {
  const goal = h.target > 0 ? h.target : AMBIENT;
  const diff = goal - h.temperature;
  const stepSize = (diff > 0 ? up : down) * dt;
  h.temperature = Math.abs(diff) <= stepSize ? goal : h.temperature + Math.sign(diff) * stepSize;
}

/**
 * One G-code line as Klipper reads it: `G1 X10 E-2` (letter + number params)
 * or `NAME KEY=value KEY="quoted value"` (extended). Names and keys upper-case.
 */
export function parseGcodeLine(line: string): { cmd: string; params: Record<string, string> } {
  const trimmed = line.trim();
  const [head = ''] = trimmed.split(/\s+/, 1);
  const cmd = head.toUpperCase();
  const rest = trimmed.slice(head.length);
  const params: Record<string, string> = {};
  if (/^[GMT]\d+$/.test(cmd)) {
    for (const m of rest.matchAll(/([A-Za-z])\s*([^\sA-Za-z]*)/g)) params[m[1].toUpperCase()] = m[2];
  } else {
    for (const m of rest.matchAll(/([A-Za-z_][A-Za-z0-9_]*)=("([^"]*)"|\S*)/g)) params[m[1].toUpperCase()] = m[3] ?? m[2];
  }
  return { cmd, params };
}

/** The `file` part of a multipart/form-data upload. */
export function parseMultipartFile(contentType: string, body: Uint8Array): { filename: string; content: Uint8Array } | null {
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType);
  const text = latin1(body);
  const delimiter = `--${boundary ? boundary[1] ?? boundary[2] : text.slice(2, text.indexOf('\r\n'))}`;
  for (const part of text.split(delimiter)) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd < 0) continue;
    const headers = part.slice(0, headerEnd);
    if (!/name="file"/.test(headers)) continue;
    const filename = /filename="([^"]*)"/.exec(headers)?.[1];
    if (!filename) continue;
    const data = part.slice(headerEnd + 4).replace(/\r\n$/, '');
    return { filename, content: Uint8Array.from(data, (c) => c.charCodeAt(0)) };
  }
  return null;
}

function latin1(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return out;
}

/** What Moonraker's metadata scan would find in an OrcaSlicer G-code file. */
function readGcodeHeader(text: string): SimFileSpec {
  const spec: SimFileSpec = {};
  const time = /; estimated printing time \(normal mode\) = (.+)/.exec(text)?.[1];
  if (time) {
    const unit = { d: 86400, h: 3600, m: 60, s: 1 } as Record<string, number>;
    spec.estimatedTime = [...time.matchAll(/(\d+)([dhms])/g)].reduce((s, m) => s + Number(m[1]) * unit[m[2]], 0);
  }
  const layers = /; total layer number: (\d+)/.exec(text)?.[1];
  if (layers) spec.layers = Number(layers);
  const objects = [...text.matchAll(/^EXCLUDE_OBJECT_DEFINE NAME=(\S+)/gm)].map((m) => m[1]);
  if (objects.length) spec.objects = objects;
  const material = /; filament_type = ([^;\n]+)/.exec(text)?.[1];
  if (material) spec.material = material.trim();
  return spec;
}
