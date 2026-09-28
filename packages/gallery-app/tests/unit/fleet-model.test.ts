// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import type { PrinterLiveStatus } from '@3d-gallery/print-toolkit';
import type { PrintPreset } from '../../src/print/print-storage.js';
import {
  EMPTY_POLL,
  STALE_MS,
  filamentSensor,
  fleetPrinters,
  fleetSummary,
  formatAgo,
  formatDuration,
  formatLayer,
  formatTemp,
  hasJob,
  isRunout,
  isStale,
  pollDelayMs,
  printerCondition,
  printersBadge,
  type PrinterPoll,
} from '../../src/printers/fleet-model.js';

function live(extra: Partial<PrinterLiveStatus> = {}): PrinterLiveStatus {
  return {
    state: 'standby', klippyState: 'ready', klippyMessage: '', file: '', progress: 0, message: '',
    layer: null, totalLayers: null, elapsedSec: 0, remainingSec: 0,
    extruder: { actual: 25, target: 0, power: 0 }, bed: { actual: 24, target: 0, power: 0 },
    fanPct: 0, speedPct: 100, flowPct: 100, zOffset: 0, homedAxes: '', position: [0, 0, 0],
    sensors: [
      { name: 'e0_sensor', enabled: true, detected: true },
      { name: 'e1_sensor', enabled: true, detected: false },
    ],
    lightOn: true, objects: [], idleState: 'Idle', paused: false, host: null, uptimeSec: 3600,
    macros: new Set(),
    ...extra,
  };
}

function ok(extra: Partial<PrinterLiveStatus> = {}): PrinterPoll {
  return { ...EMPTY_POLL, live: live(extra), lastOkAt: 1_000 };
}

function preset(name: string, address?: string): PrintPreset {
  return { id: `printer:${name}`, kind: 'printer', name, raw: {}, parents: [], address, updatedAt: 0 };
}

describe('fleetPrinters', () => {
  it('keeps printers with an address, sorted, and splits off the switched-off ones', () => {
    const presets = [preset('Right', '10.0.0.2'), preset('No host'), preset('Left', '10.0.0.1'), preset('Center', '10.0.0.3')];
    const fleet = fleetPrinters(presets, { 'printer:Center': false, 'printer:Left': true });
    expect(fleet.on.map((p) => p.name)).toEqual(['Left', 'Right']);
    expect(fleet.off).toEqual([{ id: 'printer:Center', name: 'Center', address: '10.0.0.3' }]);
  });
});

describe('printerCondition', () => {
  it('is connecting before the first answer', () => {
    expect(printerCondition(undefined)).toBe('connecting');
    expect(printerCondition(EMPTY_POLL)).toBe('connecting');
  });

  it('is unreachable after a failed poll, even with an older reading', () => {
    expect(printerCondition({ ...ok({ state: 'printing' }), failures: 1, error: 'Failed to fetch' })).toBe('unreachable');
  });

  it('calls an https mixed-content refusal blocked, not unreachable', () => {
    const poll = { ...EMPTY_POLL, failures: 1, error: 'Mixed content blocked: cannot reach an HTTP printer from an HTTPS page.' };
    expect(printerCondition(poll)).toBe('blocked');
  });

  it('reads Klipper before the print', () => {
    expect(printerCondition(ok({ state: '', klippyState: 'shutdown' }))).toBe('shutdown');
    expect(printerCondition(ok({ state: '', klippyState: 'error' }))).toBe('error');
    expect(printerCondition(ok({ state: '', klippyState: 'disconnected' }))).toBe('error');
    expect(printerCondition(ok({ state: '', klippyState: 'startup' }))).toBe('starting');
  });

  it('maps the print state', () => {
    expect(printerCondition(ok({ state: 'printing', file: 'a.gcode' }))).toBe('printing');
    expect(printerCondition(ok({ state: 'paused', file: 'a.gcode' }))).toBe('paused');
    expect(printerCondition(ok({ state: 'error' }))).toBe('error');
    for (const state of ['standby', 'complete', 'cancelled']) expect(printerCondition(ok({ state }))).toBe('idle');
  });

  it('calls a paused print with an empty filament sensor a runout', () => {
    const sensors = [{ name: 'e0_sensor', enabled: true, detected: false }, { name: 'e1_sensor', enabled: true, detected: false }];
    expect(printerCondition(ok({ state: 'paused', file: 'a.gcode', sensors }))).toBe('runout');
    expect(printerCondition(ok({ state: 'standby', sensors }))).toBe('idle');
  });
});

describe('filament sensor', () => {
  it('ignores the fleet’s unwired e1_sensor', () => {
    expect(filamentSensor(live().sensors)?.name).toBe('e0_sensor');
    expect(isRunout(live({ state: 'printing' }))).toBe(false);
  });

  it('uses a lone sensor whatever its name, and skips disabled ones', () => {
    expect(filamentSensor([{ name: 'runout', enabled: true, detected: false }])?.name).toBe('runout');
    expect(filamentSensor([{ name: 'e0_sensor', enabled: false, detected: false }])).toBeNull();
    expect(filamentSensor([])).toBeNull();
  });

  it('only counts an empty sensor as a runout during a print', () => {
    const sensors = [{ name: 'e0_sensor', enabled: true, detected: false }];
    expect(isRunout(live({ state: 'printing', sensors }))).toBe(true);
    expect(isRunout(live({ state: 'complete', sensors }))).toBe(false);
  });
});

describe('summary and badge', () => {
  it('counts printing, idle and attention', () => {
    const c = ['printing', 'printing', 'idle', 'paused', 'runout', 'unreachable', 'shutdown', 'error', 'connecting', 'blocked', 'starting'] as const;
    expect(fleetSummary(c)).toEqual({ printing: 2, idle: 1, attention: 5 });
    expect(printersBadge(c)).toBe('5');
  });

  it('shows no badge when nothing needs attention', () => {
    expect(printersBadge(['printing', 'idle', 'blocked'])).toBeNull();
    expect(printersBadge([])).toBeNull();
  });
});

describe('polling', () => {
  it('polls every 2 s on screen and every 30 s hidden', () => {
    expect(pollDelayMs(true, 0)).toBe(2_000);
    expect(pollDelayMs(false, 0)).toBe(30_000);
  });

  it('backs off on failures up to a minute', () => {
    expect([1, 2, 3, 4, 5, 6, 50].map((f) => pollDelayMs(true, f))).toEqual([4_000, 8_000, 16_000, 32_000, 60_000, 60_000, 60_000]);
    expect(pollDelayMs(false, 1)).toBe(60_000);
    expect(pollDelayMs(false, 5)).toBe(60_000);
  });

  it('marks a reading stale once polls fail past the threshold', () => {
    const poll = { ...ok(), failures: 1 };
    expect(isStale(poll, 1_000 + STALE_MS)).toBe(false);
    expect(isStale(poll, 1_001 + STALE_MS)).toBe(true);
    expect(isStale(ok(), 1_000_000)).toBe(false);
    expect(isStale({ ...EMPTY_POLL, failures: 3 }, 1_000_000)).toBe(false);
  });
});

describe('wording', () => {
  it('formats temperatures with and without a target', () => {
    expect(formatTemp({ actual: 214.6, target: 220, power: 1 })).toBe('215 → 220 °C');
    expect(formatTemp({ actual: 24.2, target: 0, power: 0 })).toBe('24 °C');
    expect(formatTemp(null)).toBe('—');
  });

  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(45 * 60)).toBe('45m');
    expect(formatDuration(3 * 3600 + 7 * 60)).toBe('3h 07m');
    expect(formatDuration(2 * 86400 + 4 * 3600)).toBe('2d 4h');
  });

  it('shows the layer only when the slicer reported it', () => {
    expect(formatLayer(live())).toBeNull();
    expect(formatLayer(live({ layer: 12, totalLayers: 140 }))).toBe('Layer 12 / 140');
    expect(formatLayer(live({ layer: 12 }))).toBe('Layer 12');
  });

  it('says how long ago a printer was last heard', () => {
    expect(formatAgo(0, 42_000)).toBe('Last seen 42 s ago');
    expect(formatAgo(0, 3 * 60_000)).toBe('Last seen 3 min ago');
    expect(formatAgo(0, 2 * 3_600_000)).toBe('Last seen 2h 00m ago');
  });

  it('has a job only while printing or paused on a file', () => {
    expect(hasJob(live({ state: 'printing', file: 'a.gcode' }))).toBe(true);
    expect(hasJob(live({ state: 'paused', file: 'a.gcode' }))).toBe(true);
    expect(hasJob(live({ state: 'complete', file: 'a.gcode' }))).toBe(false);
    expect(hasJob(live({ state: 'printing' }))).toBe(false);
  });
});
