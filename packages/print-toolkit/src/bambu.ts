// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Bambu Lab printers behind bambu-klipper-proxy: telling one apart, and
 * which AMS tray feeds which filament. The slice config is in
 * bambu-slice-config.ts, kept apart because it carries Orca's option table.
 *
 * The proxy speaks Moonraker, so a Bambu printer is reached like any other.
 * What differs is the file (a `.gcode.3mf`, see bambu-3mf.ts), the slicer
 * profile (Bambu's own machine G-code, which switches filament through the AMS
 * with M620/M621) and the start, which carries an `ams_mapping`.
 *
 * Pure: no DOM, no fetch.
 */

/** `printer/info.software_version` of a printer reached through the proxy. */
export const BAMBU_PROXY_SOFTWARE = 'bambu-klipper-proxy';

export function isBambuProxyVersion(softwareVersion: string | undefined): boolean {
  return !!softwareVersion?.startsWith(BAMBU_PROXY_SOFTWARE);
}

/** `slice_info` printer model ids, by Orca `printer_model`. */
const MODEL_IDS: Record<string, string> = {
  'Bambu Lab X1 Carbon': 'BL-P001',
  'Bambu Lab X1': 'BL-P002',
  'Bambu Lab X1E': 'C13',
  'Bambu Lab P1P': 'C11',
  'Bambu Lab P1S': 'C12',
  'Bambu Lab A1': 'N2S',
  'Bambu Lab A1 mini': 'N1',
};

/** A flattened printer preset is a Bambu Lab machine. */
export function isBambuPrinterConfig(config: Record<string, string>): boolean {
  return (config['printer_model'] ?? '').startsWith('Bambu Lab');
}

/** The model id Bambu firmware checks a file against, or undefined for a printer it doesn't know. */
export function bambuModelId(config: Record<string, string>): string | undefined {
  return MODEL_IDS[config['printer_model'] ?? ''];
}

// ── AMS ──────────────────────────────────────────────────

/** One AMS tray (or the external spool) as the proxy's `bambu_ams` reports it. */
export interface AmsTray {
  /** 0–3 AMS 1, 4–7 AMS 2. Absent on the external spool. */
  slot?: number;
  /** Empty when the tray holds nothing. */
  type: string;
  color: string;
  name: string;
  /** Percent left, or -1 when the AMS can't tell. */
  remain: number;
}

export interface AmsState {
  trays: AmsTray[];
  external: AmsTray | null;
}

/** The proxy's `ams_mapping` index for the external spool. */
export const AMS_EXTERNAL = 254;

/** The family the proxy matches by: first word, with `-` read as a space. "PLA Basic", "PLA-S" → PLA. */
export function amsFamily(type: string): string {
  return type.replace(/-/g, ' ').trim().split(/\s+/)[0]?.toUpperCase() ?? '';
}

function rgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorDistance(a: string, b: string): number {
  const x = rgb(a);
  const y = rgb(b);
  if (!x || !y) return Infinity;
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

export interface AmsFilamentNeed {
  slot: number;
  type: string;
  color: string;
}

export interface AmsAssignment {
  /** The filament slot (1-based) this feeds. */
  slot: number;
  /** Proxy tray index: 0–7, or AMS_EXTERNAL. */
  tray: number;
  /** The tray's colour is the filament's, not just the nearest one loaded. */
  exact: boolean;
  trayName: string;
  trayColor: string;
}

export interface AmsMatch {
  assignments: AmsAssignment[];
  /** One line per filament no loaded tray can feed. */
  problems: string[];
}

/**
 * Feed each filament from a tray of its family: the same colour if one is
 * loaded, else the nearest colour. The gallery sends the result as
 * `ams_mapping` rather than leaving the proxy to match, because the proxy
 * matches colours exactly and a model's colours are design colours, not the
 * colour of the spool someone loaded.
 */
/**
 * How far (RGB distance) a loaded spool's colour may sit from the one asked for
 * and still feed it: a shade (#161616 for #000000 is 38), never another colour
 * (black to red is 255). A wrong tray wastes the print, so past this it's refused.
 */
export const AMS_SHADE_DISTANCE = 64;

export function matchAmsTrays(needs: AmsFilamentNeed[], ams: AmsState): AmsMatch {
  const sources = [
    ...ams.trays.filter((t) => t.slot !== undefined).map((t) => ({ tray: t.slot!, t })),
    ...(ams.external ? [{ tray: AMS_EXTERNAL, t: ams.external }] : []),
  ].filter(({ t }) => t.type.trim() !== '');
  const assignments: AmsAssignment[] = [];
  const problems: string[] = [];
  // Two different colours on the plate must not end up on one spool.
  const colourOfTray = new Map<number, string>();
  for (const need of needs) {
    const family = amsFamily(need.type);
    const wanted = need.color.toUpperCase();
    const ofFamily = sources.filter(({ t }) => amsFamily(t.type) === family);
    if (ofFamily.length === 0) {
      problems.push(`Filament ${need.slot} (${need.type} ${wanted}): no ${family} loaded in the AMS.`);
      continue;
    }
    const best = ofFamily
      .map((s) => ({ ...s, d: colorDistance(s.t.color, need.color) }))
      .filter((c) => c.d <= AMS_SHADE_DISTANCE && (colourOfTray.get(c.tray) ?? wanted) === wanted)
      .sort((a, b) => a.d - b.d || a.tray - b.tray)[0];
    if (!best) {
      const loaded = ofFamily.map(({ t }) => t.color.toUpperCase()).join(', ');
      problems.push(`Filament ${need.slot} (${need.type} ${wanted}): no ${family} in that colour loaded (${family} in the AMS: ${loaded}).`);
      continue;
    }
    colourOfTray.set(best.tray, wanted);
    assignments.push({
      slot: need.slot,
      tray: best.tray,
      exact: best.d === 0,
      trayName: best.t.name,
      trayColor: best.t.color,
    });
  }
  return { assignments, problems };
}

/** A tray index as the operator reads it: "AMS 2 · 3", "External spool". */
export function amsTrayLabel(tray: number): string {
  if (tray === AMS_EXTERNAL) return 'External spool';
  return `AMS ${Math.floor(tray / 4) + 1} · ${(tray % 4) + 1}`;
}

/** Per filament slot, what the G-code's footer says it uses: `; filament used [g] = 2.72, 0.99`. */
export function filamentUsePerSlot(gcode: string): { grams: number[]; meters: number[] } {
  const tail = gcode.slice(-200_000);
  const list = (unit: string) => {
    const m = new RegExp(`^; filament used \\[${unit}\\] = ([^\\r\\n]+)`, 'm').exec(tail);
    return m ? m[1].split(',').map((v) => Number(v.trim())).filter(Number.isFinite) : [];
  };
  return { grams: list('g'), meters: list('mm').map((mm) => mm / 1000) };
}
