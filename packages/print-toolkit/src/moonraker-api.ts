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
  const running = stats.state === 'printing' || stats.state === 'paused';
  if (!running) return { state: stats.state, filename: stats.filename, remainingSec: 0, progress: sd.progress };

  let remainingSec = sd.progress > 0 ? stats.print_duration / sd.progress - stats.print_duration : 0;
  try {
    const meta = await moonrakerGet<{ result: { estimated_time?: number } }>(
      address,
      `/server/files/metadata?filename=${encodeURIComponent(stats.filename)}`,
    );
    const estimated = meta.result.estimated_time;
    if (typeof estimated === 'number' && estimated > 0) remainingSec = estimated - stats.print_duration;
  } catch {
    // Metadata is a refinement; the progress-based figure stands without it.
  }
  return { state: stats.state, filename: stats.filename, remainingSec: Math.max(0, remainingSec), progress: sd.progress };
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
}

/** Prints started at or after `sinceMs`, newest first. */
export async function fetchJobHistory(address: string, sinceMs: number): Promise<HistoryJob[]> {
  const since = Math.floor(sinceMs / 1000);
  const data = await moonrakerGet<{ result: { jobs: Array<{ filename: string; status: string; start_time: number }> } }>(
    address,
    `/server/history/list?since=${since}&limit=100&order=desc`,
  );
  return data.result.jobs.map((j) => ({ filename: j.filename, status: j.status, startTime: j.start_time * 1000 }));
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
