/**
 * Filament slots: which extruder each colour of a multicolour 3MF prints on.
 *
 * By default a colour's slot is its place in the palette (first colour on 1,
 * second on 2, …). A preview that wants particular slots, to match what's
 * loaded in an AMS, echoes them at top level, by the hex of its color() calls —
 *
 *     echo(gallery_extruders = [["#222222", 3], ["#ff4757", 4]]);
 *
 * — and the builders lift that line off OpenSCAD's stderr. A colour the echo
 * doesn't name keeps its default slot; a named colour the render didn't draw
 * (a customizer option turned it off) is ignored.
 */

import type { PaletteEntry } from './print-objects.ts';

export const EXTRUDER_ECHO = 'gallery_extruders';

export interface ExtruderSlot {
  /** `#RRGGBB`, upper case. */
  hex: string;
  /** 1-based, as slicers number filaments. */
  extruder: number;
}

const ECHO_PREFIX = `ECHO: ${EXTRUDER_ECHO} = `;

/**
 * The slots echoed in a render's log, or null when the source echoes none.
 * A malformed echo throws: it is an authoring error, and dropping it quietly
 * would put filaments on the wrong slots with no hint why.
 */
export function parseExtruderEcho(lines: Iterable<string>): ExtruderSlot[] | null {
  for (const line of lines) {
    const at = line.indexOf(ECHO_PREFIX);
    if (at === -1) continue;
    const raw = line.slice(at + ECHO_PREFIX.length).trim();
    const bad = () => new Error(`${EXTRUDER_ECHO}: not a list of ["#RRGGBB", slot] pairs: ${raw}`);
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      throw bad();
    }
    if (!Array.isArray(value)) throw bad();
    const seen = new Set<string>();
    return value.map((entry) => {
      if (!Array.isArray(entry) || entry.length !== 2) throw bad();
      const [hex, extruder] = entry;
      if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) throw bad();
      if (!Number.isInteger(extruder) || extruder < 1) throw bad();
      const key = hex.toUpperCase();
      if (seen.has(key)) throw new Error(`${EXTRUDER_ECHO}: ${hex} is echoed twice`);
      seen.add(key);
      return { hex: key, extruder };
    });
  }
  return null;
}

function channels(hex: string): number[] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

/**
 * The palette with each echoed colour pinned to its slot. Colours match within
 * one step per channel: the browser path round-trips them through linear RGB.
 */
export function assignExtruders<T extends PaletteEntry>(palette: T[], slots: ExtruderSlot[] | null): T[] {
  if (!slots) return palette;
  return palette.map((entry) => {
    const want = channels(entry.hex);
    const slot = slots.find((s) => channels(s.hex).every((c, i) => Math.abs(c - want[i]) <= 1));
    return slot ? { ...entry, extruder: slot.extruder } : entry;
  });
}
