// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Framework-free g-code post-processing helpers. Consumers (gallery-app, the
// Android shell, anything downstream) call `postProcessGcode` with what the
// slicer emitted + printer/filament context, and get back a gcode blob that:
//   • has any surviving Orca temperature placeholders resolved
//   • is optionally translated so the toolpath sits inside the printer's
//     `printable_area` (fixes corner-origin vs center-origin mismatches)
//   • optionally has an async M140/M104 preamble prepended so a Klipper
//     START_PRINT macro doesn't run cold on a broken macro
//
// None of these helpers touch Z, E, or F — only XY.

export interface BedBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Parse OrcaSlicer's `printable_area` field: semicolon-separated `XxY`
 *  corners. Returns null if malformed. */
export function parsePrintableArea(field: string | undefined | null): BedBounds | null {
  if (!field) return null;
  const points: Array<[number, number]> = [];
  for (const seg of field.split(';')) {
    if (!seg.trim()) continue;
    const [xs, ys] = seg.split('x');
    const x = parseFloat(xs);
    const y = parseFloat(ys);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    points.push([x, y]);
  }
  if (points.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

const MOVE_RE = /^(?:G0|G1)\b([^\n;]*)/i;

/** Scan every G0/G1 in the gcode and return the XY bounds of the emitted
 *  toolpath. Returns null when no G0/G1 with X or Y is found. */
export function gcodeXYBounds(gcode: string): BedBounds | null {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let seen = false;
  for (const line of gcode.split('\n')) {
    const m = line.match(MOVE_RE);
    if (!m) continue;
    const args = m[1];
    const xm = args.match(/\bX(-?\d+(?:\.\d+)?)/i);
    const ym = args.match(/\bY(-?\d+(?:\.\d+)?)/i);
    if (xm) {
      const x = parseFloat(xm[1]);
      if (Number.isFinite(x)) { if (x < minX) minX = x; if (x > maxX) maxX = x; seen = true; }
    }
    if (ym) {
      const y = parseFloat(ym[1]);
      if (Number.isFinite(y)) { if (y < minY) minY = y; if (y > maxY) maxY = y; seen = true; }
    }
  }
  return seen ? { minX, maxX, minY, maxY } : null;
}

/** Translate every G0/G1 X/Y in the gcode by (dx, dy). Preserves Z, E, F.
 *  Comments after `;` are untouched. */
export function translateGcodeXY(gcode: string, dx: number, dy: number): string {
  if (dx === 0 && dy === 0) return gcode;
  const shift = (v: string, d: number) => {
    const n = parseFloat(v) + d;
    return n.toFixed(3).replace(/\.?0+$/, '') || '0';
  };
  return gcode.replace(/^((?:G0|G1)\b[^\n;]*)/gim, (line) => {
    return line
      .replace(/\bX(-?\d+(?:\.\d+)?)/i, (_, v) => `X${shift(v, dx)}`)
      .replace(/\bY(-?\d+(?:\.\d+)?)/i, (_, v) => `Y${shift(v, dy)}`);
  });
}

export interface PostProcessOptions {
  /** Printer preset `printable_area` (`-110x-110;110x-110;110x110;-110x110`). */
  printableArea?: string | null;
  /** First-layer nozzle temperature. Used for placeholder substitution + optional preheat. */
  nozzleTemp?: string | null;
  /** First-layer bed temperature. Used for placeholder substitution + optional preheat. */
  bedTemp?: string | null;
  /** Prepend `M140`/`M104` (no wait) before whatever the slicer emitted. Default: true. */
  preheat?: boolean;
  /** Translate G0/G1 XY so the toolpath sits inside `printable_area`. Default: true. */
  centerOnBed?: boolean;
  /** Replace `BED_TEMP=<n>` / `EXTRUDER_TEMP=<n>` on Klipper macro invocations
   *  (e.g. `START_PRINT BED_TEMP=60`) with `bedTemp` / `nozzleTemp` values.
   *  Fixes the case where the slicer's internal placeholder resolver picked
   *  the wrong per-plate temperature (a common WASM-build quirk when
   *  `curr_bed_type` isn't honored). Default: true when temps are provided. */
  overrideMacroTemps?: boolean;
}

export interface PostProcessReport {
  gcode: string;
  bedBounds: BedBounds | null;
  originalGcodeBounds: BedBounds | null;
  finalGcodeBounds: BedBounds | null;
  translation: { dx: number; dy: number };
  translated: boolean;
  outOfBounds: boolean;
  placeholdersResolved: boolean;
  macroTempsOverridden: boolean;
}

const PLACEHOLDERS = {
  bed: ['[bed_temperature_initial_layer_single]', '[first_layer_bed_temperature]'],
  nozzle: ['[nozzle_temperature_initial_layer]', '[first_layer_temperature]'],
};

/** Post-process a sliced g-code blob. See module doc for what it does. */
export function postProcessGcode(gcode: string, opts: PostProcessOptions = {}): PostProcessReport {
  const preheat = opts.preheat !== false;
  const centerOnBed = opts.centerOnBed !== false;
  const bedTemp = opts.bedTemp?.trim() || undefined;
  const nozzleTemp = opts.nozzleTemp?.trim() || undefined;
  const overrideMacroTemps = opts.overrideMacroTemps !== false && !!(bedTemp || nozzleTemp);

  let out = gcode;
  let placeholdersResolved = false;
  if (bedTemp) {
    for (const p of PLACEHOLDERS.bed) {
      if (out.includes(p)) { out = out.replaceAll(p, bedTemp); placeholdersResolved = true; }
    }
  }
  if (nozzleTemp) {
    for (const p of PLACEHOLDERS.nozzle) {
      if (out.includes(p)) { out = out.replaceAll(p, nozzleTemp); placeholdersResolved = true; }
    }
  }

  // Override any surviving BED_TEMP=<n> / EXTRUDER_TEMP=<n> in Klipper macro
  // invocations. Runs after placeholder substitution so we catch numbers
  // the slicer resolved incorrectly (e.g. cool_plate_temp=60 when the user
  // has a hot plate installed).
  let macroTempsOverridden = false;
  if (overrideMacroTemps) {
    if (bedTemp) {
      const before = out;
      out = out.replace(/\bBED_TEMP\s*=\s*-?\d+(?:\.\d+)?/gi, `BED_TEMP=${bedTemp}`);
      if (before !== out) macroTempsOverridden = true;
    }
    if (nozzleTemp) {
      const before = out;
      out = out.replace(/\bEXTRUDER_TEMP\s*=\s*-?\d+(?:\.\d+)?/gi, `EXTRUDER_TEMP=${nozzleTemp}`);
      if (before !== out) macroTempsOverridden = true;
    }
  }

  const bedBounds = parsePrintableArea(opts.printableArea);
  const originalGcodeBounds = gcodeXYBounds(out);

  let translation = { dx: 0, dy: 0 };
  let translated = false;

  if (centerOnBed && bedBounds && originalGcodeBounds) {
    const fits =
      originalGcodeBounds.minX >= bedBounds.minX &&
      originalGcodeBounds.maxX <= bedBounds.maxX &&
      originalGcodeBounds.minY >= bedBounds.minY &&
      originalGcodeBounds.maxY <= bedBounds.maxY;
    if (!fits) {
      const bedCX = (bedBounds.minX + bedBounds.maxX) / 2;
      const bedCY = (bedBounds.minY + bedBounds.maxY) / 2;
      const gcCX = (originalGcodeBounds.minX + originalGcodeBounds.maxX) / 2;
      const gcCY = (originalGcodeBounds.minY + originalGcodeBounds.maxY) / 2;
      translation = { dx: bedCX - gcCX, dy: bedCY - gcCY };
      out = translateGcodeXY(out, translation.dx, translation.dy);
      translated = true;
    }
  }

  if (preheat && (bedTemp || nozzleTemp)) {
    const preamble: string[] = ['; print-toolkit: async preheat targets (no wait)'];
    if (bedTemp) preamble.push(`M140 S${bedTemp} ; bed target`);
    if (nozzleTemp) preamble.push(`M104 S${nozzleTemp} ; nozzle target`);
    preamble.push('; print-toolkit: end preheat — START_PRINT below handles homing and waits');
    out = preamble.join('\n') + '\n' + out;
  }

  const finalGcodeBounds = gcodeXYBounds(out);
  const outOfBounds =
    !!bedBounds &&
    !!finalGcodeBounds &&
    (finalGcodeBounds.minX < bedBounds.minX ||
      finalGcodeBounds.maxX > bedBounds.maxX ||
      finalGcodeBounds.minY < bedBounds.minY ||
      finalGcodeBounds.maxY > bedBounds.maxY);

  return {
    gcode: out,
    bedBounds,
    originalGcodeBounds,
    finalGcodeBounds,
    translation,
    translated,
    outOfBounds,
    placeholdersResolved,
    macroTempsOverridden,
  };
}
