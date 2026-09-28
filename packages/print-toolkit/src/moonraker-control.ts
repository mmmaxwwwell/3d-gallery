// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * G-code for each printer control the fleet dashboard has, as the string
 * `sendGcode` sends. The fleet runs ZMOD, so machine controls call its macros
 * rather than reimplement them; the README's Moonraker section records what
 * each macro does and whether it is safe mid-print.
 *
 * Kept pure (no I/O) so every script is unit tested without a printer.
 */

/** A number as G-code takes it: finite, and without float noise like 0.30000000000000004. */
function num(value: number, what: string): string {
  if (!Number.isFinite(value)) throw new RangeError(`${what} must be a finite number, got ${value}`);
  return String(Math.round(value * 1000) / 1000);
}

/** Heat the nozzle and wait, when a temperature is given, before a macro that needs it hot. */
function heatFirst(temp: number | undefined, macro: string): string {
  return temp === undefined ? macro : `M109 S${num(temp, 'temperature')}\n${macro}`;
}

export const macroScript = {
  /** ZMOD's G28 homes only the axes that aren't homed yet. */
  home: () => 'G28',
  /** LOAD_FILAMENT feeds cold; Klipper refuses to extrude below min_extrude_temp, so pass a temperature. */
  loadFilament: (temp?: number) => heatFirst(temp, 'LOAD_FILAMENT'),
  unloadFilament: (temp?: number) => heatFirst(temp, 'UNLOAD_FILAMENT'),
  /**
   * PURGE_FILAMENT takes no length; it reads its `purge_distance` variable,
   * so a length sets that first. It stays set until Klipper restarts.
   */
  purge: (mm?: number) => mm === undefined
    ? 'PURGE_FILAMENT'
    : `SET_GCODE_VARIABLE MACRO=PURGE_FILAMENT VARIABLE=purge_distance VALUE=${num(mm, 'purge length')}\nPURGE_FILAMENT`,
  /** AUTO_FULL_BED_LEVEL meshes into profile `auto` but leaves saving to the caller; NEW_SAVE_CONFIG restarts Klipper. */
  meshAndSave: () => 'AUTO_FULL_BED_LEVEL\nNEW_SAVE_CONFIG',
  clearNozzle: () => 'CLEAR_NOZZLE',
  /**
   * COLDPULL alone only raises a material prompt that Mainsail, Fluidd or the
   * printer's screen must answer; temperatures skip it and start the pull.
   */
  coldPull: (temps?: { hot: number; cold: number }) => temps === undefined
    ? 'COLDPULL'
    : `_COLDPULL_LOAD_MATERIAL TEMP=${num(temps.hot, 'cold pull temperature')} COLD=${num(temps.cold, 'cold pull release temperature')}`,
  pauseNextLayer: () => 'SET_PAUSE_NEXT_LAYER ENABLE=1',
  excludeObject: (name: string) => {
    // The script is raw G-code: whitespace would end the name and start another command.
    if (!/^\S+$/.test(name)) throw new RangeError(`object name must be one word, got ${JSON.stringify(name)}`);
    return `EXCLUDE_OBJECT NAME=${name}`;
  },
  /** MOVE=1 applies it now, not at the next Z move; ZMOD also saves it for later prints. Needs homed axes. */
  zOffsetAdjust: (mm: number) => `SET_GCODE_OFFSET Z_ADJUST=${num(mm, 'Z offset step')} MOVE=1`,
  speed: (pct: number) => `M220 S${num(pct, 'speed')}`,
  flow: (pct: number) => `M221 S${num(pct, 'flow')}`,
  /** M106 takes 0–255. */
  fan: (pct: number) => {
    num(pct, 'fan');
    return `M106 S${Math.round(Math.min(100, Math.max(0, pct)) * 2.55)}`;
  },
  light: (on: boolean) => (on ? 'LED_ON' : 'LED_OFF'),
  restartCamera: () => 'CAMERA_RESTART',
  reboot: () => 'REBOOT',
  powerOff: () => 'SHUTDOWN',
  disableMotors: () => 'M84',
  /** The client macros refuse to move a cold extruder rather than error the script. */
  extrude: (mm: number) => `_CLIENT_EXTRUDE LENGTH=${num(Math.abs(mm), 'extrude length')}`,
  retract: (mm: number) => `_CLIENT_RETRACT LENGTH=${num(Math.abs(mm), 'retract length')}`,
  /** Lifts and parks at the fleet's custom park position; needs homed axes. */
  park: () => '_TOOLHEAD_PARK_PAUSE_CANCEL',
  setNozzle: (c: number) => `M104 S${num(c, 'nozzle temperature')}`,
  setBed: (c: number) => `M140 S${num(c, 'bed temperature')}`,
} as const;

export type MacroControl = keyof typeof macroScript;

/**
 * The `gcode_macro`s each control calls, by Klipper's name for them. A control
 * that needs none uses only Klipper built-ins (ZMOD overrides some, like G28
 * and SET_GCODE_OFFSET, but stock Klipper has them too).
 */
export const MACRO_NEEDS: Record<MacroControl, readonly string[]> = {
  home: [],
  loadFilament: ['LOAD_FILAMENT'],
  unloadFilament: ['UNLOAD_FILAMENT'],
  purge: ['PURGE_FILAMENT'],
  meshAndSave: ['AUTO_FULL_BED_LEVEL', 'NEW_SAVE_CONFIG'],
  clearNozzle: ['CLEAR_NOZZLE'],
  coldPull: ['COLDPULL', '_COLDPULL_LOAD_MATERIAL'],
  pauseNextLayer: ['SET_PAUSE_NEXT_LAYER'],
  excludeObject: [],
  zOffsetAdjust: [],
  speed: [],
  flow: [],
  fan: [],
  light: ['LED_ON', 'LED_OFF'],
  restartCamera: ['CAMERA_RESTART'],
  reboot: ['REBOOT'],
  powerOff: ['SHUTDOWN'],
  disableMotors: [],
  extrude: ['_CLIENT_EXTRUDE'],
  retract: ['_CLIENT_RETRACT'],
  park: ['_TOOLHEAD_PARK_PAUSE_CANCEL'],
  setNozzle: [],
  setBed: [],
};

/** Whether the printer defines every macro `control` calls; `macros` is `PrinterLiveStatus.macros`. */
export function controlAvailable(control: MacroControl, macros: ReadonlySet<string>): boolean {
  return MACRO_NEEDS[control].every((m) => macros.has(m));
}
