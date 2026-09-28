// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Moonraker REST API client for fetching printer configuration.
 *
 * Endpoints used:
 * - GET /printer/objects/query?configfile — parsed printer.cfg (bed size, stepper limits, extruder config)
 * - GET /printer/objects/query?toolhead — live motion limits
 * - GET /server/files/config/printer.cfg — raw config file text
 * - POST /server/files/upload — upload a G-code file (multipart)
 * - POST /printer/print/start — start printing an already-uploaded file
 * - GET /server/info, /printer/info — whether Klipper is up
 * - GET /server/files/metadata — whether a file is on the printer
 * - GET /server/history/list — how past prints ended
 * - GET /server/webcams/list — camera URLs
 * - GET /printer/objects/list, /printer/objects/query, /machine/proc_stats — live dashboard status
 * - GET /server/files/list, /server/gcode_store — the printer's files and console
 * - POST /printer/gcode/script, /printer/emergency_stop, /printer/firmware_restart,
 *   /printer/print/{pause,resume,cancel} — controls
 */

// Pulled in for the `window.AndroidPrinterDiscovery` feature-detect below.
import './android-shim-types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PrinterConfig {
  bedWidth: number;
  bedDepth: number;
  bedCircular: boolean;
  maxHeight: number;
  originCenter: boolean;
  maxVelocity: number;
  maxAccel: number;
  squareCornerVelocity: number;
  nozzleDiameter: number;
  filamentDiameter: number;
  maxExtrudeOnlyVelocity: number;
  extruderCount: number;
  startGcode: string;
  endGcode: string;
}

interface MoonrakerConfigfileResponse {
  result: {
    status: {
      configfile: {
        config: Record<string, Record<string, string>>;
      };
    };
  };
}

interface MoonrakerToolheadResponse {
  result: {
    status: {
      toolhead: {
        max_velocity: number;
        max_accel: number;
        square_corner_velocity: number;
      };
    };
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a full URL from a printer address (may or may not include protocol). */
export function buildMoonrakerUrl(address: string, path: string): string {
  const base = /^https?:\/\//.test(address)
    ? address.replace(/\/+$/, '')
    : `http://${address}`;
  return `${base}${path}`;
}

/** Check whether the request would be blocked by mixed-content rules. */
function checkMixedContent(url: string): void {
  const nativeBridge = window.AndroidPrinterDiscovery;
  const cleartextAllowed =
    typeof nativeBridge?.allowsCleartextTraffic === 'function' &&
    nativeBridge.allowsCleartextTraffic();
  if (
    !cleartextAllowed &&
    window.location.protocol === 'https:' &&
    url.startsWith('http://')
  ) {
    throw new Error(
      'Mixed content blocked: cannot reach an HTTP printer from an HTTPS page. ' +
        'Either access this app over HTTP, or put Moonraker behind an HTTPS reverse proxy.',
    );
  }
}

async function moonrakerGet<T>(address: string, path: string): Promise<T> {
  const url = buildMoonrakerUrl(address, path);
  checkMixedContent(url);
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Moonraker ${path} failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

async function moonrakerPost<T>(address: string, path: string): Promise<T> {
  const url = buildMoonrakerUrl(address, path);
  checkMixedContent(url);
  const res = await fetch(url, { method: 'POST', mode: 'cors' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Moonraker ${path} failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

// ─── API ─────────────────────────────────────────────────────────────────────

/** Fetch parsed printer.cfg sections via the configfile object. */
export async function fetchConfigfile(address: string): Promise<Record<string, Record<string, string>>> {
  const data = await moonrakerGet<MoonrakerConfigfileResponse>(
    address,
    '/printer/objects/query?configfile',
  );
  return data.result.status.configfile.config;
}

/** Fetch live toolhead limits. */
export async function fetchToolhead(address: string) {
  const data = await moonrakerGet<MoonrakerToolheadResponse>(
    address,
    '/printer/objects/query?toolhead',
  );
  return data.result.status.toolhead;
}

/** Fetch the raw printer.cfg text. */
export async function fetchRawPrinterCfg(address: string): Promise<string> {
  const url = buildMoonrakerUrl(address, '/server/files/config/printer.cfg');
  checkMixedContent(url);
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Moonraker printer.cfg fetch failed (${res.status}): ${text || res.statusText}`);
  }
  return res.text();
}

/** What a printer is doing, and how long until its bed is free. */
export interface PrintStatus {
  /** Klipper `print_stats.state`: standby, printing, paused, complete, cancelled, error. */
  state: string;
  filename: string;
  /** Seconds left on the current print; 0 when nothing is running. */
  remainingSec: number;
  /** Fraction of the file printed, 0–1. */
  progress: number;
}

interface MoonrakerPrintStatsResponse {
  result: {
    status: {
      print_stats: { state: string; filename: string; print_duration: number };
      virtual_sdcard: { progress: number };
    };
  };
}

/**
 * Current job and time left on it. Time left comes from the slicer's estimate
 * in the file's metadata when Moonraker has it, else from progress so far.
 */
export async function fetchPrintStatus(address: string): Promise<PrintStatus> {
  const data = await moonrakerGet<MoonrakerPrintStatsResponse>(
    address,
    '/printer/objects/query?print_stats&virtual_sdcard',
  );
  const { print_stats: stats, virtual_sdcard: sd } = data.result.status;
  const remainingSec = await estimateRemainingSec(address, stats.state, stats.filename, stats.print_duration, sd.progress);
  return { state: stats.state, filename: stats.filename, remainingSec, progress: sd.progress };
}

/**
 * Seconds left on the job: the slicer's estimate from the file's metadata when
 * Moonraker has it, else extrapolated from progress so far. 0 when idle.
 */
async function estimateRemainingSec(
  address: string,
  state: string,
  filename: string,
  printDurationSec: number,
  progress: number,
): Promise<number> {
  if (state !== 'printing' && state !== 'paused') return 0;
  let remainingSec = progress > 0 ? printDurationSec / progress - printDurationSec : 0;
  try {
    const meta = await moonrakerGet<{ result: { estimated_time?: number } }>(
      address,
      `/server/files/metadata?filename=${encodeURIComponent(filename)}`,
    );
    const estimated = meta.result.estimated_time;
    if (typeof estimated === 'number' && estimated > 0) remainingSec = estimated - printDurationSec;
  } catch {
    // Metadata is a refinement; the progress-based figure stands without it.
  }
  return Math.max(0, remainingSec);
}

/** Whether Klipper is up, as Moonraker sees it. */
export interface KlippyState {
  /** `ready`, `startup`, `shutdown`, `error` or `disconnected`. */
  state: string;
  /** Klipper's own explanation when it isn't ready; empty otherwise. */
  message: string;
}

/** Throws only when Moonraker itself can't be reached. */
export async function fetchKlippyState(address: string): Promise<KlippyState> {
  const info = await moonrakerGet<{ result: { klippy_state: string } }>(address, '/server/info');
  const state = info.result.klippy_state;
  if (state === 'ready') return { state, message: '' };
  // /printer/info only answers while Klipper is connected; the state stands without it.
  const detail = await moonrakerGet<{ result: { state_message?: string } }>(address, '/printer/info').catch(() => null);
  return { state, message: detail?.result.state_message?.trim() ?? '' };
}

/** Whether `fileName` is in the printer's gcodes root. */
export async function fileExists(address: string, fileName: string): Promise<boolean> {
  const url = buildMoonrakerUrl(address, `/server/files/metadata?filename=${encodeURIComponent(fileName)}`);
  checkMixedContent(url);
  const res = await fetch(url, { mode: 'cors' });
  if (res.status === 404) return false;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Moonraker file lookup failed (${res.status}): ${text || res.statusText}`);
  }
  return true;
}

/** One print from Moonraker's job history. */
export interface HistoryJob {
  filename: string;
  /** `completed`, `cancelled`, `error`, `klippy_shutdown`, `in_progress`, … */
  status: string;
  /** Epoch ms, printer clock. */
  startTime: number;
  /** Epoch ms, printer clock; absent while it runs. */
  endTime?: number;
  /** Seconds spent printing, pauses excluded. */
  printDurationSec?: number;
  /** Filament pushed, mm. */
  filamentUsedMm?: number;
}

interface MoonrakerHistoryJob {
  filename: string;
  status: string;
  start_time: number;
  end_time?: number | null;
  print_duration?: number;
  filament_used?: number;
}

/** Prints started at or after `sinceMs`, newest first. */
export async function fetchJobHistory(address: string, sinceMs: number): Promise<HistoryJob[]> {
  const since = Math.floor(sinceMs / 1000);
  const data = await moonrakerGet<{ result: { jobs: MoonrakerHistoryJob[] } }>(
    address,
    `/server/history/list?since=${since}&limit=100&order=desc`,
  );
  return data.result.jobs.map((j) => ({
    filename: j.filename,
    status: j.status,
    startTime: j.start_time * 1000,
    ...(j.end_time ? { endTime: j.end_time * 1000 } : {}),
    ...(typeof j.print_duration === 'number' ? { printDurationSec: j.print_duration } : {}),
    ...(typeof j.filament_used === 'number' ? { filamentUsedMm: j.filament_used } : {}),
  }));
}

/** One line of the printer's console, as Moonraker keeps it. */
export interface ConsoleLine {
  message: string;
  /** Epoch ms, printer clock. */
  time: number;
  /** `command` (sent to Klipper) or `response` (what Klipper said). */
  type: string;
}

/** The last `count` console lines (Moonraker keeps 1000 by default), oldest first. */
export async function fetchConsole(address: string, count = 1000): Promise<ConsoleLine[]> {
  const data = await moonrakerGet<{ result: { gcode_store: Array<{ message: string; time: number; type: string }> } }>(
    address,
    `/server/gcode_store?count=${count}`,
  );
  return data.result.gcode_store.map((l) => ({ message: l.message, time: l.time * 1000, type: l.type }));
}

export interface Webcam {
  name: string;
  snapshotUrl: string;
  streamUrl: string;
}

/**
 * Resolve a webcam URL from Moonraker's config. Relative ones are served by
 * the printer's web front end (Mainsail/Fluidd behind nginx), on the host's
 * default port rather than Moonraker's.
 */
export function resolveWebcamUrl(address: string, url: string): string {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  const origin = new URL(buildMoonrakerUrl(address, '/'));
  return `${origin.protocol}//${origin.hostname}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** The printer's enabled cameras. */
export async function listWebcams(address: string): Promise<Webcam[]> {
  const data = await moonrakerGet<{
    result: { webcams: Array<{ name: string; enabled?: boolean; snapshot_url?: string; stream_url?: string }> };
  }>(address, '/server/webcams/list');
  return data.result.webcams
    .filter((w) => w.enabled !== false)
    .map((w) => ({
      name: w.name,
      snapshotUrl: resolveWebcamUrl(address, w.snapshot_url ?? ''),
      streamUrl: resolveWebcamUrl(address, w.stream_url ?? ''),
    }));
}

/** Start printing a file that has already been uploaded. */
export async function startPrint(address: string, fileName: string): Promise<void> {
  await moonrakerPost(address, `/printer/print/start?filename=${encodeURIComponent(fileName)}`);
}

/**
 * Upload a G-code file to Moonraker via `/server/files/upload`.
 * `body` can be a Blob (browser) or ArrayBuffer/Uint8Array (worker/native).
 */
export async function uploadGcode(
  address: string,
  fileName: string,
  body: Blob | ArrayBuffer | Uint8Array,
): Promise<void> {
  const url = buildMoonrakerUrl(address, '/server/files/upload');
  checkMixedContent(url);

  let blob: Blob;
  if (body instanceof Blob) {
    blob = body;
  } else {
    // `Uint8Array<ArrayBufferLike>` in the default TS lib isn't `BlobPart`
    // (SharedArrayBuffer isn't allowed). Copy into a fresh ArrayBuffer.
    const bytes = body instanceof Uint8Array ? body : new Uint8Array(body);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    blob = new Blob([copy.buffer], { type: 'text/plain' });
  }

  const formData = new FormData();
  formData.append('file', blob, fileName);

  const res = await fetch(url, { method: 'POST', mode: 'cors', body: formData });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Moonraker upload failed (${res.status}): ${text || res.statusText}`);
  }
}

// ─── Live status ────────────────────────────────────────────────────────────

export interface HeaterLive {
  actual: number;
  target: number;
  /** Heater duty, 0–1. */
  power: number;
}

export interface FilamentSensorLive {
  /** The config name, e.g. `e0_sensor`. */
  name: string;
  enabled: boolean;
  detected: boolean;
}

export interface PrintObjectLive {
  name: string;
  excluded: boolean;
  /** The object being printed right now. */
  current: boolean;
}

/**
 * Everything the fleet dashboard shows for one printer, from one poll. A field
 * is null when the printer has no such object (or Klipper isn't up to say).
 */
export interface PrinterLiveStatus {
  /** `print_stats.state`: standby, printing, paused, complete, cancelled, error; '' while Klipper is down. */
  state: string;
  /** `ready`, `startup`, `shutdown`, `error` or `disconnected`. */
  klippyState: string;
  /** Klipper's explanation when it isn't ready; empty otherwise. */
  klippyMessage: string;
  file: string;
  /** Fraction of the file printed, 0–1. */
  progress: number;
  /** The last M117 message; empty when none. */
  message: string;
  /** From `print_stats.info`, which only the slicer's SET_PRINT_STATS_INFO fills in. */
  layer: number | null;
  totalLayers: number | null;
  /** Seconds spent printing, pauses excluded. */
  elapsedSec: number;
  /** Seconds left; 0 when nothing is running. */
  remainingSec: number;
  extruder: HeaterLive | null;
  bed: HeaterLive | null;
  /** Part-cooling fan, 0–100. */
  fanPct: number | null;
  /** M220 speed factor, 100 = as sliced. */
  speedPct: number | null;
  /** M221 extrude factor, 100 = as sliced. */
  flowPct: number | null;
  /** Z of the G-code offset (`gcode_move.homing_origin`), mm. */
  zOffset: number | null;
  /** Some of `xyz`; empty when nothing is homed. */
  homedAxes: string;
  /** Toolhead x, y, z, mm. */
  position: [number, number, number] | null;
  sensors: FilamentSensorLive[];
  /** `led chamber_light` lit at all. */
  lightOn: boolean | null;
  /** Objects the running file defines for EXCLUDE_OBJECT. */
  objects: PrintObjectLive[];
  /** `idle_timeout.state`: Idle, Ready or Printing. */
  idleState: string | null;
  paused: boolean;
  /** Host load average and free memory, from Klipper's `system_stats`. */
  host: { load: number; memAvailKb: number } | null;
  /** Host uptime, s. */
  uptimeSec: number | null;
  /** Every `gcode_macro` the printer defines, by name as Klipper lists it. */
  macros: Set<string>;
}

const LIGHT_OBJECT = 'led chamber_light';
/** Klipper's own part fan when configured, else the fleet's ZMOD one (M106 drives it). */
const FAN_OBJECTS = ['fan', 'fan_generic fanM106'];
const WANTED_OBJECTS = [
  'webhooks', 'print_stats', 'virtual_sdcard', 'display_status', 'extruder', 'heater_bed',
  'toolhead', 'gcode_move', 'exclude_object', 'idle_timeout', 'pause_resume', LIGHT_OBJECT, 'system_stats',
];

// A printer's objects only change with its config, and asking every poll would
// double the requests. A failed query drops the entry so a restart re-reads it.
const objectLists = new Map<string, Promise<string[]>>();

function printerObjects(address: string): Promise<string[]> {
  let list = objectLists.get(address);
  if (!list) {
    list = moonrakerGet<{ result: { objects: string[] } }>(address, '/printer/objects/list').then((d) => d.result.objects);
    objectLists.set(address, list);
    list.catch(() => objectLists.delete(address));
  }
  return list;
}

// Only fields read below are typed; Klipper sends more.
interface LiveQueryStatus {
  webhooks?: { state: string; state_message: string };
  print_stats?: {
    state: string;
    filename: string;
    print_duration: number;
    info?: { current_layer: number | null; total_layer: number | null };
  };
  virtual_sdcard?: { progress: number };
  display_status?: { message: string | null };
  extruder?: { temperature: number; target: number; power: number };
  heater_bed?: { temperature: number; target: number; power: number };
  toolhead?: { homed_axes: string; position: number[] };
  gcode_move?: { speed_factor: number; extrude_factor: number; homing_origin: number[] };
  exclude_object?: { objects: Array<{ name: string }>; excluded_objects: string[]; current_object: string | null };
  idle_timeout?: { state: string };
  pause_resume?: { is_paused: boolean };
  system_stats?: { sysload: number; memavail: number };
  [object: string]: unknown;
}

function heater(h: { temperature: number; target: number; power: number } | undefined): HeaterLive | null {
  return h ? { actual: h.temperature, target: h.target, power: h.power } : null;
}

/**
 * The printer's live state in one object query, plus host uptime. While
 * Klipper is down it still resolves, with the Klipper state and message and
 * nothing else; it throws only when Moonraker can't be reached.
 */
export async function fetchPrinterLive(address: string): Promise<PrinterLiveStatus> {
  const uptime = moonrakerGet<{ result: { system_uptime?: number } }>(address, '/machine/proc_stats')
    .then((d) => d.result.system_uptime ?? null)
    .catch(() => null);

  let objects: string[];
  let status: LiveQueryStatus;
  try {
    objects = await printerObjects(address);
    const listed = new Set(objects);
    const fan = FAN_OBJECTS.find((f) => listed.has(f));
    const sensors = objects.filter((o) => o.startsWith('filament_switch_sensor '));
    const query = [...WANTED_OBJECTS.filter((o) => listed.has(o)), ...(fan ? [fan] : []), ...sensors];
    const data = await moonrakerGet<{ result: { status: LiveQueryStatus } }>(
      address,
      `/printer/objects/query?${query.map(encodeURIComponent).join('&')}`,
    );
    status = data.result.status;
  } catch {
    objectLists.delete(address);
    const klippy = await fetchKlippyState(address);
    return { ...offlineStatus(), klippyState: klippy.state, klippyMessage: klippy.message, uptimeSec: await uptime };
  }

  const stats = status.print_stats;
  const progress = status.virtual_sdcard?.progress ?? 0;
  const fanObject = FAN_OBJECTS.find((f) => f in status);
  const fan = fanObject ? (status[fanObject] as { speed: number }) : undefined;
  const move = status.gcode_move;
  const exclude = status.exclude_object;
  const light = status[LIGHT_OBJECT] as { color_data: number[][] } | undefined;
  const pos = status.toolhead?.position;

  return {
    state: stats?.state ?? '',
    klippyState: status.webhooks?.state ?? 'ready',
    klippyMessage: status.webhooks?.state === 'ready' ? '' : (status.webhooks?.state_message.trim() ?? ''),
    file: stats?.filename ?? '',
    progress,
    message: status.display_status?.message ?? '',
    layer: stats?.info?.current_layer ?? null,
    totalLayers: stats?.info?.total_layer ?? null,
    elapsedSec: stats?.print_duration ?? 0,
    remainingSec: stats ? await estimateRemainingSec(address, stats.state, stats.filename, stats.print_duration, progress) : 0,
    extruder: heater(status.extruder),
    bed: heater(status.heater_bed),
    fanPct: fan ? fan.speed * 100 : null,
    speedPct: move ? move.speed_factor * 100 : null,
    flowPct: move ? move.extrude_factor * 100 : null,
    zOffset: move ? move.homing_origin[2] : null,
    homedAxes: status.toolhead?.homed_axes ?? '',
    position: pos ? [pos[0], pos[1], pos[2]] : null,
    sensors: objects
      .filter((o) => o.startsWith('filament_switch_sensor ') && o in status)
      .map((o) => {
        const s = status[o] as { enabled: boolean; filament_detected: boolean };
        return { name: o.slice('filament_switch_sensor '.length), enabled: s.enabled, detected: s.filament_detected };
      }),
    lightOn: light ? light.color_data.some((c) => c.some((v) => v > 0)) : null,
    objects: (exclude?.objects ?? []).map((o) => ({
      name: o.name,
      excluded: exclude!.excluded_objects.includes(o.name),
      current: exclude!.current_object === o.name,
    })),
    idleState: status.idle_timeout?.state ?? null,
    paused: status.pause_resume?.is_paused ?? false,
    host: status.system_stats ? { load: status.system_stats.sysload, memAvailKb: status.system_stats.memavail } : null,
    uptimeSec: await uptime,
    macros: new Set(objects.filter((o) => o.startsWith('gcode_macro ')).map((o) => o.slice('gcode_macro '.length))),
  };
}

function offlineStatus(): PrinterLiveStatus {
  return {
    state: '', klippyState: '', klippyMessage: '', file: '', progress: 0, message: '',
    layer: null, totalLayers: null, elapsedSec: 0, remainingSec: 0, extruder: null, bed: null,
    fanPct: null, speedPct: null, flowPct: null, zOffset: null, homedAxes: '', position: null,
    sensors: [], lightOn: null, objects: [], idleState: null, paused: false, host: null,
    uptimeSec: null, macros: new Set(),
  };
}

/** The last few console lines, oldest first. */
export function fetchConsoleTail(address: string, count = 50): Promise<ConsoleLine[]> {
  return fetchConsole(address, count);
}

// ─── Files ──────────────────────────────────────────────────────────────────

export interface GcodeFile {
  /** Relative to the gcodes root; what `startPrint` takes. */
  path: string;
  size: number;
  /** Epoch ms, printer clock. */
  modified: number;
  /** The slicer's print-time estimate, s. */
  estimatedSec?: number;
  /** The largest embedded thumbnail. */
  thumbnailUrl?: string;
}

interface MoonrakerFileMetadata {
  estimated_time?: number;
  thumbnails?: Array<{ width: number; height: number; relative_path: string }>;
}

/** The printer's G-code files, newest first, with estimates and thumbnails where the metadata has them. */
export async function listGcodeFiles(address: string): Promise<GcodeFile[]> {
  const data = await moonrakerGet<{ result: Array<{ path: string; modified: number; size: number }> }>(
    address,
    '/server/files/list?root=gcodes',
  );
  const files = data.result
    .filter((f) => /\.(gcode|gco|g)$/i.test(f.path))
    .sort((a, b) => b.modified - a.modified);
  return Promise.all(files.map(async (f) => {
    const file: GcodeFile = { path: f.path, size: f.size, modified: f.modified * 1000 };
    const meta = await moonrakerGet<{ result: MoonrakerFileMetadata }>(
      address,
      `/server/files/metadata?filename=${encodeURIComponent(f.path)}`,
    ).then((m) => m.result).catch(() => null);
    if (typeof meta?.estimated_time === 'number' && meta.estimated_time > 0) file.estimatedSec = meta.estimated_time;
    const thumb = meta?.thumbnails?.reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a));
    if (thumb) {
      // A thumbnail's path is relative to the directory its G-code sits in.
      const dir = f.path.includes('/') ? f.path.slice(0, f.path.lastIndexOf('/') + 1) : '';
      const encoded = `${dir}${thumb.relative_path}`.split('/').map(encodeURIComponent).join('/');
      file.thumbnailUrl = buildMoonrakerUrl(address, `/server/files/gcodes/${encoded}`);
    }
    return file;
  }));
}

// ─── Commands ───────────────────────────────────────────────────────────────

/** Run G-code (a line or several, `\n`-separated). Resolves once Klipper has run all of it. */
export async function sendGcode(address: string, script: string): Promise<void> {
  await moonrakerPost(address, `/printer/gcode/script?script=${encodeURIComponent(script)}`);
}

/** M112: Klipper shuts down at once, heaters and motors off. Needs a firmware restart after. */
export async function emergencyStop(address: string): Promise<void> {
  await moonrakerPost(address, '/printer/emergency_stop');
}

export async function firmwareRestart(address: string): Promise<void> {
  await moonrakerPost(address, '/printer/firmware_restart');
}

export async function pausePrint(address: string): Promise<void> {
  await moonrakerPost(address, '/printer/print/pause');
}

export async function resumePrint(address: string): Promise<void> {
  await moonrakerPost(address, '/printer/print/resume');
}

export async function cancelPrint(address: string): Promise<void> {
  await moonrakerPost(address, '/printer/print/cancel');
}

/**
 * Reboots the printer's host through Moonraker rather than Klipper, so it
 * works while Klipper is shut down or errored, when the REBOOT macro is refused.
 */
export async function rebootHost(address: string): Promise<void> {
  await moonrakerPost(address, '/machine/reboot');
}

/** Shuts the host down through Moonraker; like `rebootHost`, it needs no working Klipper. */
export async function shutdownHost(address: string): Promise<void> {
  await moonrakerPost(address, '/machine/shutdown');
}

// ─── Composite fetcher ──────────────────────────────────────────────────────

/**
 * Fetch all printer configuration data from Moonraker and return a unified PrinterConfig.
 * Fetches configfile + toolhead in parallel, then parses raw printer.cfg for start/end gcode.
 */
/**
 * Parse printer configuration from Moonraker configfile + toolhead data + raw config text.
 * Pure function — no I/O, suitable for unit testing.
 */
export function parsePrinterConfig(
  config: Record<string, Record<string, string>>,
  toolhead: { max_velocity: number; max_accel: number; square_corner_velocity: number },
  rawCfg: string,
): PrinterConfig {
  // Parse bed dimensions from stepper_x / stepper_y position_min/max
  const stepperX = config['stepper_x'] ?? {};
  const stepperY = config['stepper_y'] ?? {};
  const stepperZ = config['stepper_z'] ?? {};
  const xMin = parseFloat(stepperX['position_min'] ?? '0');
  const xMax = parseFloat(stepperX['position_max'] ?? '235');
  const yMin = parseFloat(stepperY['position_min'] ?? '0');
  const yMax = parseFloat(stepperY['position_max'] ?? '235');
  const bedWidth = xMax - xMin;
  const bedDepth = yMax - yMin;
  const maxHeight = parseFloat(stepperZ['position_max'] ?? '300');

  // Detect center origin: if position_min is significantly negative, origin is at bed center
  const originCenter = xMin < -1 && yMin < -1;

  // Detect circular bed (delta kinematics)
  const printerSection = config['printer'] ?? {};
  const kinematics = printerSection['kinematics'] ?? '';
  const bedCircular = kinematics === 'delta';

  // Extruder config
  const extruderSection = config['extruder'] ?? {};
  const nozzleDiameter = parseFloat(extruderSection['nozzle_diameter'] ?? '0.4');
  const filamentDiameter = parseFloat(extruderSection['filament_diameter'] ?? '1.75');
  const maxExtrudeOnlyVelocity = parseFloat(extruderSection['max_extrude_only_velocity'] ?? '50');

  // Count extruders (extruder, extruder1, extruder2, ...)
  let extruderCount = 0;
  for (const key of Object.keys(config)) {
    if (key === 'extruder' || /^extruder\d+$/.test(key)) {
      extruderCount++;
    }
  }
  extruderCount = Math.max(extruderCount, 1);

  // Parse start/end gcode from raw printer.cfg
  const startGcode = extractGcodeBlock(rawCfg, 'START_PRINT') || extractGcodeSection(rawCfg, 'start_gcode');
  const endGcode = extractGcodeBlock(rawCfg, 'END_PRINT') || extractGcodeSection(rawCfg, 'end_gcode');

  return {
    bedWidth,
    bedDepth,
    bedCircular,
    maxHeight,
    originCenter,
    maxVelocity: toolhead.max_velocity,
    maxAccel: toolhead.max_accel,
    squareCornerVelocity: toolhead.square_corner_velocity,
    nozzleDiameter,
    filamentDiameter,
    maxExtrudeOnlyVelocity,
    extruderCount,
    startGcode,
    endGcode,
  };
}

export async function fetchPrinterConfig(address: string): Promise<PrinterConfig> {
  const [config, toolhead, rawCfg] = await Promise.all([
    fetchConfigfile(address),
    fetchToolhead(address),
    fetchRawPrinterCfg(address).catch(() => ''),
  ]);

  return parsePrinterConfig(config, toolhead, rawCfg);
}

// ─── Config parsing helpers ─────────────────────────────────────────────────

/**
 * Extract a gcode_macro block (e.g. [gcode_macro START_PRINT]) from raw printer.cfg.
 * Returns the gcode content or empty string if not found.
 */
export function extractGcodeBlock(rawCfg: string, macroName: string): string {
  const pattern = new RegExp(
    `\\[gcode_macro\\s+${macroName}\\]\\s*\\n([\\s\\S]*?)(?=\\n\\[|$)`,
    'i',
  );
  const match = rawCfg.match(pattern);
  if (!match) return '';

  // Find the gcode: line within the macro block
  const block = match[1];
  const gcodeMatch = block.match(/^gcode\s*:\s*([\s\S]*)$/m);
  if (!gcodeMatch) return '';

  // The gcode value is the first line after "gcode:" plus all continuation lines (indented)
  const lines = gcodeMatch[1].split('\n');
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trimEnd();
    // Continuation lines are indented (start with whitespace)
    if (result.length === 0 || /^\s/.test(line)) {
      result.push(trimmed.replace(/^\s+/, ''));
    } else {
      break;
    }
  }
  return result.filter((l) => l.length > 0).join('\n');
}

/**
 * Extract a plain gcode section (e.g. start_gcode:) from the [extruder] or [printer] section.
 * Klipper configs sometimes inline start/end gcode directly rather than using macros.
 */
export function extractGcodeSection(rawCfg: string, sectionName: string): string {
  const pattern = new RegExp(`^${sectionName}\\s*:\\s*(.*)$`, 'im');
  const match = rawCfg.match(pattern);
  if (!match) return '';

  const startIdx = rawCfg.indexOf(match[0]) + match[0].length;
  const rest = rawCfg.slice(startIdx);
  const lines = rest.split('\n');
  const result: string[] = [];

  // First line (after the colon) if non-empty
  const firstLine = match[1].trim();
  if (firstLine) result.push(firstLine);

  // Continuation lines (indented)
  for (const line of lines) {
    if (/^\s+/.test(line) && line.trim().length > 0) {
      result.push(line.trim());
    } else if (line.trim().length === 0) {
      // Blank lines within indented blocks are OK in Klipper configs
      continue;
    } else {
      break;
    }
  }
  return result.join('\n');
}
