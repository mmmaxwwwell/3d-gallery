// SPDX-License-Identifier: MIT
// What each printer control may do right now, worked out from one live poll.
// The safety rules live here rather than in the card so every one is unit
// tested: what's hidden (the printer lacks the macro), what's greyed out and
// why, and what needs a press-and-hold. No Preact, no I/O.

import { materialFamily } from '@3d-gallery/model-core';
import { controlAvailable, type MacroControl, type PrinterLiveStatus } from '@3d-gallery/print-toolkit';
import { firstValue } from '../print/preset-spec.js';

export type ControlId =
  | 'emergencyStop' | 'startPrint'
  | 'pause' | 'resume' | 'cancel' | 'pauseNextLayer' | 'excludeObject' | 'zOffset' | 'speed' | 'flow' | 'fan'
  | 'nozzleTemp' | 'bedTemp' | 'preheat'
  | 'load' | 'unload' | 'purge' | 'extrude' | 'retract'
  | 'home' | 'meshAndSave' | 'clearNozzle' | 'coldPull' | 'park' | 'disableMotors' | 'light' | 'restartCamera'
  | 'firmwareRestart' | 'reboot' | 'powerOff';

export type GroupId = 'print' | 'heat' | 'filament' | 'machine';

export interface ControlState {
  visible: boolean;
  enabled: boolean;
  /** Why it's disabled; empty when enabled. */
  reason: string;
  confirm: 'none' | 'hold';
}

/** The card's collapsible groups. Emergency stop and starting a file sit outside them. */
export const GROUPS: ReadonlyArray<{ id: GroupId; label: string; controls: readonly ControlId[] }> = [
  { id: 'print', label: 'Print', controls: ['pause', 'resume', 'cancel', 'pauseNextLayer', 'excludeObject', 'zOffset', 'speed', 'flow', 'fan'] },
  { id: 'heat', label: 'Heat', controls: ['nozzleTemp', 'bedTemp', 'preheat'] },
  { id: 'filament', label: 'Filament', controls: ['load', 'unload', 'purge', 'extrude', 'retract'] },
  {
    id: 'machine',
    label: 'Machine',
    controls: ['home', 'meshAndSave', 'clearNozzle', 'coldPull', 'park', 'disableMotors', 'light', 'restartCamera', 'firmwareRestart', 'reboot', 'powerOff'],
  },
];

/** Klipper's own default when printer.cfg sets none. */
export const DEFAULT_MIN_EXTRUDE_TEMP = 170;
export const NOZZLE_PRESETS = [0, 230, 250, 280] as const;
export const BED_PRESETS = [0, 60, 80, 100] as const;
export const Z_STEPS = [-0.05, -0.01, 0.01, 0.05] as const;
/** Load and unload heat to this when the nozzle has no working target: PETG, the fleet's default material. */
export const DEFAULT_FILAMENT_TEMP = 240;
export const EXTRUDE_MM = 10;

/** The pull temperatures ZMOD's own COLDPULL prompt offers, hot then release. */
export const COLD_PULL_TEMPS: ReadonlyArray<{ material: string; hot: number; cold: number }> = [
  { material: 'PLA', hot: 220, cold: 100 },
  { material: 'PETG', hot: 250, cold: 100 },
  { material: 'ABS', hot: 260, cold: 105 },
  { material: 'NYLON', hot: 265, cold: 120 },
];

/** Tune limits: M220/M221 accept more, but past these a nudge is a mistake. */
export const TUNE = {
  speed: { step: 10, min: 10, max: 300 },
  flow: { step: 1, min: 50, max: 150 },
  fan: { step: 10, min: 0, max: 100 },
} as const;

export const STOPPED_NOTICE = 'Emergency stopped — firmware restart to recover';
const ERROR_NOTICE = 'Klipper error — firmware restart to recover';

const HOLD: ReadonlySet<ControlId> = new Set(['cancel', 'reboot', 'powerOff', 'firmwareRestart', 'meshAndSave', 'excludeObject']);

/** Each would ruin a running print, or fights the pause that's holding one. */
const NOT_WHILE_PRINTING: ReadonlySet<ControlId> = new Set([
  'startPrint', 'home', 'meshAndSave', 'load', 'unload', 'purge', 'clearNozzle', 'coldPull', 'park', 'disableMotors',
  'nozzleTemp', 'bedTemp', 'preheat', 'firmwareRestart', 'reboot', 'powerOff',
]);

const PRINT_ONLY: ReadonlySet<ControlId> = new Set([
  'pause', 'resume', 'cancel', 'pauseNextLayer', 'excludeObject', 'zOffset', 'speed', 'flow', 'fan',
]);

/** Klipper refuses to move a cold extruder. */
const NEEDS_HOT: ReadonlySet<ControlId> = new Set(['purge', 'extrude', 'retract']);

/** Reboot and power off aren't here: without their macros they go through Moonraker's host endpoints. */
const MACRO: Partial<Record<ControlId, MacroControl>> = {
  load: 'loadFilament',
  unload: 'unloadFilament',
  purge: 'purge',
  meshAndSave: 'meshAndSave',
  clearNozzle: 'clearNozzle',
  coldPull: 'coldPull',
  pauseNextLayer: 'pauseNextLayer',
  light: 'light',
  restartCamera: 'restartCamera',
  extrude: 'extrude',
  retract: 'retract',
  park: 'park',
};

const ALL: readonly ControlId[] = ['emergencyStop', 'startPrint', ...GROUPS.flatMap((g) => g.controls)];

function state(id: ControlId, visible: boolean, reason: string): ControlState {
  return { visible, enabled: visible && !reason, reason, confirm: HOLD.has(id) ? 'hold' : 'none' };
}

/** What stops the printer taking commands, or null when Klipper is ready. */
export function stopNotice(live: PrinterLiveStatus | null): string | null {
  if (!live) return "Can't reach the printer";
  switch (live.klippyState) {
    case 'ready': return null;
    case 'shutdown': return STOPPED_NOTICE;
    case 'error': return ERROR_NOTICE;
    case 'startup': return 'Klipper is starting up';
    default: return "Klipper isn't running";
  }
}

/** Whether reboot and power off must go through Moonraker, Klipper being unable to run the macros. */
export function hostPowerViaMoonraker(live: PrinterLiveStatus, macro: 'REBOOT' | 'SHUTDOWN'): boolean {
  return live.klippyState !== 'ready' || !live.macros.has(macro);
}

function readyReason(id: ControlId, live: PrinterLiveStatus, minExtrudeTemp: number): string {
  const printing = live.state === 'printing';
  const paused = live.state === 'paused';
  if (printing && NOT_WHILE_PRINTING.has(id)) return 'Not while printing';
  if (paused && NOT_WHILE_PRINTING.has(id)) return 'Not while paused';
  if (!printing && !paused && PRINT_ONLY.has(id)) return 'Only while printing';
  if (printing && (id === 'extrude' || id === 'retract')) return 'Not while printing';
  if (id === 'pauseNextLayer') {
    if (paused) return 'Already paused';
    if (live.totalLayers === null) return "This file doesn't report layer changes";
  }
  if (id === 'excludeObject' && !live.objects.some((o) => !o.excluded)) return 'This file names no objects to cancel';
  if (id === 'park' && !['x', 'y', 'z'].every((a) => live.homedAxes.includes(a))) return 'Home first';
  if (NEEDS_HOT.has(id)) {
    const nozzle = live.extruder?.actual ?? 0;
    if (nozzle < minExtrudeTemp) return `Nozzle is ${Math.round(nozzle)} °C — heat it to ${minExtrudeTemp} °C first`;
  }
  return '';
}

/** Every control's state for one poll; `live` null means the printer can't be reached. */
export function controlStates(
  live: PrinterLiveStatus | null,
  minExtrudeTemp = DEFAULT_MIN_EXTRUDE_TEMP,
): Record<ControlId, ControlState> {
  const out = {} as Record<ControlId, ControlState>;
  const notice = stopNotice(live);
  for (const id of ALL) {
    if (!live) {
      out[id] = state(id, id === 'emergencyStop', notice!);
      continue;
    }
    const macro = MACRO[id];
    let visible = !macro || controlAvailable(macro, live.macros);
    if (id === 'pause') visible = live.state !== 'paused';
    if (id === 'resume') visible = live.state === 'paused';
    if (id === 'light') visible &&= live.lightOn !== null;

    let reason: string;
    if (!notice) {
      reason = readyReason(id, live, minExtrudeTemp);
    } else if (id === 'emergencyStop') {
      reason = live.klippyState === 'shutdown' ? 'Already stopped' : notice;
    } else if (id === 'reboot' || id === 'powerOff') {
      reason = '';
    } else if (id === 'firmwareRestart' && (live.klippyState === 'shutdown' || live.klippyState === 'error')) {
      reason = '';
    } else {
      reason = notice;
    }
    out[id] = state(id, visible, reason);
  }
  return out;
}

/**
 * Groups open on a phone: Machine when Klipper needs a restart (its controls
 * are the only way back), the print's own while one runs, else what readies
 * the next.
 */
export function defaultOpenGroups(live: PrinterLiveStatus | null): GroupId[] {
  if (live?.klippyState === 'shutdown' || live?.klippyState === 'error') return ['machine'];
  const busy = live?.state === 'printing' || live?.state === 'paused';
  return busy ? ['print'] : ['heat', 'filament'];
}

/** What load and unload heat to: the nozzle's own target when it's one that extrudes. */
export function filamentTemp(live: PrinterLiveStatus | null, minExtrudeTemp = DEFAULT_MIN_EXTRUDE_TEMP): number {
  const target = live?.extruder?.target ?? 0;
  return target >= minExtrudeTemp ? target : DEFAULT_FILAMENT_TEMP;
}

/** One tune nudge, clamped to the control's limits. */
export function nudge(control: keyof typeof TUNE, current: number | null, direction: 1 | -1): number {
  const { step, min, max } = TUNE[control];
  const from = Math.round(current ?? (control === 'fan' ? 0 : 100));
  return Math.min(max, Math.max(min, from + direction * step));
}

export interface FilamentPresetTemps {
  id: string;
  name: string;
  /** The preset flattened for the slicer (`flattenPresetForSlicer`). */
  flat: Record<string, string>;
}

export interface MaterialPreheat {
  family: string;
  preset: string;
  nozzle: number;
  bed: number;
}

/**
 * Preheat temperatures per material family, from the filament preset the
 * planner settings pick for it (else the first preset of that family, as the
 * planner itself falls back), so a preheat matches what the slice will ask for.
 */
export function materialPreheats(
  presets: readonly FilamentPresetTemps[],
  chosen: Readonly<Record<string, string>>,
  bedTempKey: string,
): MaterialPreheat[] {
  const familyOf = (p: FilamentPresetTemps) => {
    const type = firstValue(p.flat['filament_type']);
    return type ? materialFamily(type) : undefined;
  };
  const families = new Set([...Object.keys(chosen), ...presets.map(familyOf).filter((f): f is string => !!f)]);
  const out: MaterialPreheat[] = [];
  for (const family of [...families].sort()) {
    const preset = presets.find((p) => p.id === chosen[family]) ?? presets.find((p) => familyOf(p) === family);
    if (!preset) continue;
    const nozzle = Number(firstValue(preset.flat['nozzle_temperature']));
    const bed = Number(firstValue(preset.flat[bedTempKey]));
    if (!Number.isFinite(nozzle) || !Number.isFinite(bed) || nozzle <= 0) continue;
    out.push({ family, preset: preset.name, nozzle, bed });
  }
  return out;
}
