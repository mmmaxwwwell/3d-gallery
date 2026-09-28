// SPDX-License-Identifier: MIT
import { MACRO_NEEDS, type PrinterLiveStatus } from '@3d-gallery/print-toolkit';
import { describe, expect, it } from 'vitest';
import {
  controlStates,
  DEFAULT_FILAMENT_TEMP,
  defaultOpenGroups,
  filamentTemp,
  GROUPS,
  hostPowerViaMoonraker,
  materialPreheats,
  nudge,
  STOPPED_NOTICE,
  stopNotice,
  type ControlId,
} from '../../src/printers/control-model.js';

const FLEET_MACROS = new Set([...new Set(Object.values(MACRO_NEEDS).flat())]);

function live(over: Partial<PrinterLiveStatus> = {}): PrinterLiveStatus {
  return {
    state: 'standby', klippyState: 'ready', klippyMessage: '', file: '', progress: 0, message: '',
    layer: null, totalLayers: null, elapsedSec: 0, remainingSec: 0,
    extruder: { actual: 25, target: 0, power: 0 }, bed: { actual: 24, target: 0, power: 0 },
    fanPct: 0, speedPct: 100, flowPct: 100, zOffset: 0, homedAxes: '', position: [0, 0, 0],
    sensors: [], lightOn: false, objects: [], idleState: 'Idle', paused: false, host: null, uptimeSec: 100,
    macros: new Set(FLEET_MACROS),
    ...over,
  };
}

const printing = (over: Partial<PrinterLiveStatus> = {}) => live({
  state: 'printing', file: 'a.gcode', idleState: 'Printing', homedAxes: 'xyz',
  extruder: { actual: 240, target: 240, power: 0.4 },
  objects: [{ name: 'CUBE', excluded: false, current: true }, { name: 'PEG', excluded: false, current: false }],
  totalLayers: 120, layer: 10,
  ...over,
});
const paused = (over: Partial<PrinterLiveStatus> = {}) => printing({ state: 'paused', paused: true, ...over });

const enabled = (states: ReturnType<typeof controlStates>) =>
  (Object.keys(states) as ControlId[]).filter((id) => states[id].enabled).sort();

describe('emergency stop', () => {
  it('is visible, enabled and unconfirmed whenever Klipper is ready', () => {
    for (const l of [live(), printing(), paused()]) {
      expect(controlStates(l).emergencyStop).toEqual({ visible: true, enabled: true, reason: '', confirm: 'none' });
    }
  });

  it('stays visible but disabled once stopped or unreachable', () => {
    expect(controlStates(live({ klippyState: 'shutdown' })).emergencyStop).toMatchObject({ visible: true, enabled: false, reason: 'Already stopped' });
    expect(controlStates(null).emergencyStop).toMatchObject({ visible: true, enabled: false, reason: "Can't reach the printer" });
  });
});

describe('hold to confirm', () => {
  it('holds cancel, reboot, power off, firmware restart, mesh and save, and excluding an object', () => {
    const states = controlStates(printing());
    const held = (Object.keys(states) as ControlId[]).filter((id) => states[id].confirm === 'hold').sort();
    expect(held).toEqual(['cancel', 'excludeObject', 'firmwareRestart', 'meshAndSave', 'powerOff', 'reboot']);
  });
});

describe('while printing or paused', () => {
  const blocked: ControlId[] = [
    'home', 'meshAndSave', 'load', 'unload', 'purge', 'clearNozzle', 'coldPull', 'park', 'disableMotors',
    'nozzleTemp', 'bedTemp', 'preheat', 'firmwareRestart', 'reboot', 'powerOff', 'startPrint',
  ];

  it.each(blocked)('%s is disabled and says why', (id) => {
    expect(controlStates(printing())[id]).toMatchObject({ visible: true, enabled: false, reason: 'Not while printing' });
    expect(controlStates(paused())[id]).toMatchObject({ visible: true, enabled: false, reason: 'Not while paused' });
  });

  it('keeps the print-time controls, the light and the camera', () => {
    expect(enabled(controlStates(printing()))).toEqual([
      'cancel', 'emergencyStop', 'excludeObject', 'fan', 'flow', 'light', 'pause', 'pauseNextLayer',
      'restartCamera', 'speed', 'zOffset',
    ]);
  });

  it('offers resume, not pause, while paused, and lets the nozzle be nudged hot', () => {
    const s = controlStates(paused());
    expect(s.pause.visible).toBe(false);
    expect(s.resume).toMatchObject({ visible: true, enabled: true });
    expect(s.pauseNextLayer).toMatchObject({ enabled: false, reason: 'Already paused' });
    expect(s.extrude.enabled).toBe(true);
    expect(s.retract.enabled).toBe(true);
  });

  it('shows resume only while paused', () => {
    expect(controlStates(printing()).resume.visible).toBe(false);
    expect(controlStates(live()).resume.visible).toBe(false);
  });

  it('never extrudes under a running print', () => {
    expect(controlStates(printing()).extrude).toMatchObject({ enabled: false, reason: 'Not while printing' });
  });
});

describe('print-time only', () => {
  it.each<ControlId>(['pause', 'cancel', 'pauseNextLayer', 'excludeObject', 'zOffset', 'speed', 'flow', 'fan'])(
    '%s is disabled while idle',
    (id) => {
      expect(controlStates(live())[id]).toMatchObject({ visible: true, enabled: false, reason: 'Only while printing' });
    },
  );

  it('cannot pause at the next layer when the file reports no layers', () => {
    expect(controlStates(printing({ totalLayers: null })).pauseNextLayer)
      .toMatchObject({ enabled: false, reason: "This file doesn't report layer changes" });
  });

  it('cannot cancel an object the file doesn\'t name, or one already cancelled', () => {
    expect(controlStates(printing({ objects: [] })).excludeObject.enabled).toBe(false);
    const allGone = printing({ objects: [{ name: 'CUBE', excluded: true, current: false }] });
    expect(controlStates(allGone).excludeObject).toMatchObject({ enabled: false, reason: 'This file names no objects to cancel' });
  });
});

describe('idle', () => {
  it('enables the machine, heat and filament controls that need no hot nozzle', () => {
    expect(enabled(controlStates(live()))).toEqual([
      'bedTemp', 'clearNozzle', 'coldPull', 'disableMotors', 'emergencyStop', 'firmwareRestart', 'home', 'light',
      'load', 'meshAndSave', 'nozzleTemp', 'powerOff', 'preheat', 'reboot', 'restartCamera', 'startPrint', 'unload',
    ]);
  });

  it('parks only once homed', () => {
    expect(controlStates(live({ homedAxes: 'xy' })).park).toMatchObject({ enabled: false, reason: 'Home first' });
    expect(controlStates(live({ homedAxes: 'xyz' })).park.enabled).toBe(true);
  });
});

describe('extrude and retract need a hot nozzle', () => {
  it.each<ControlId>(['extrude', 'retract', 'purge'])('%s waits for the min extrude temperature', (id) => {
    expect(controlStates(live({ extruder: { actual: 169.4, target: 240, power: 1 } }))[id])
      .toMatchObject({ enabled: false, reason: 'Nozzle is 169 °C — heat it to 170 °C first' });
    expect(controlStates(live({ extruder: { actual: 170, target: 240, power: 1 } }))[id].enabled).toBe(true);
  });

  it('uses the printer\'s own min extrude temperature', () => {
    const warm = live({ extruder: { actual: 185, target: 200, power: 1 } });
    expect(controlStates(warm, 190).extrude.reason).toBe('Nozzle is 185 °C — heat it to 190 °C first');
    expect(controlStates(warm, 180).extrude.enabled).toBe(true);
  });
});

describe('Klipper shut down or in error', () => {
  it.each(['shutdown', 'error'])('%s enables only firmware restart, reboot and power off', (klippyState) => {
    const s = controlStates(live({ klippyState, state: '' }));
    expect(enabled(s)).toEqual(['firmwareRestart', 'powerOff', 'reboot']);
  });

  it('says how to recover from an emergency stop, on every disabled control', () => {
    const l = live({ klippyState: 'shutdown' });
    expect(stopNotice(l)).toBe(STOPPED_NOTICE);
    expect(STOPPED_NOTICE).toBe('Emergency stopped — firmware restart to recover');
    expect(controlStates(l).home.reason).toBe(STOPPED_NOTICE);
  });

  it('while Klipper is restarting, allows only reboot and power off', () => {
    const s = controlStates(live({ klippyState: 'startup', state: '', macros: new Set() }));
    expect(enabled(s)).toEqual(['powerOff', 'reboot']);
    expect(s.firmwareRestart.reason).toBe('Klipper is starting up');
  });

  it('reboots and powers off through Moonraker when Klipper can\'t run the macros', () => {
    expect(hostPowerViaMoonraker(live(), 'REBOOT')).toBe(false);
    expect(hostPowerViaMoonraker(live({ klippyState: 'shutdown' }), 'REBOOT')).toBe(true);
    expect(hostPowerViaMoonraker(live({ macros: new Set() }), 'SHUTDOWN')).toBe(true);
  });
});

describe('unreachable', () => {
  it('shows only the emergency stop, disabled', () => {
    const s = controlStates(null);
    const visible = (Object.keys(s) as ControlId[]).filter((id) => s[id].visible);
    expect(visible).toEqual(['emergencyStop']);
  });
});

describe('missing macros', () => {
  it.each<[ControlId, string]>([
    ['load', 'LOAD_FILAMENT'],
    ['unload', 'UNLOAD_FILAMENT'],
    ['purge', 'PURGE_FILAMENT'],
    ['meshAndSave', 'NEW_SAVE_CONFIG'],
    ['clearNozzle', 'CLEAR_NOZZLE'],
    ['coldPull', '_COLDPULL_LOAD_MATERIAL'],
    ['pauseNextLayer', 'SET_PAUSE_NEXT_LAYER'],
    ['light', 'LED_ON'],
    ['restartCamera', 'CAMERA_RESTART'],
    ['extrude', '_CLIENT_EXTRUDE'],
    ['retract', '_CLIENT_RETRACT'],
    ['park', '_TOOLHEAD_PARK_PAUSE_CANCEL'],
  ])('hides %s without %s', (id, macro) => {
    const macros = new Set(FLEET_MACROS);
    macros.delete(macro);
    expect(controlStates(live({ macros }))[id].visible).toBe(false);
    expect(controlStates(live())[id].visible).toBe(true);
  });

  it('keeps reboot and power off, which fall back to Moonraker', () => {
    const s = controlStates(live({ macros: new Set() }));
    expect(s.reboot.visible && s.powerOff.visible).toBe(true);
  });

  it('hides the light on a printer without one', () => {
    expect(controlStates(live({ lightOn: null })).light.visible).toBe(false);
  });
});

describe('groups', () => {
  it('holds every control but emergency stop and starting a file, once', () => {
    const all = GROUPS.flatMap((g) => g.controls);
    expect(new Set(all).size).toBe(all.length);
    expect(Object.keys(controlStates(live())).filter((id) => !all.includes(id as ControlId)).sort())
      .toEqual(['emergencyStop', 'startPrint']);
  });

  it('opens Print while a print runs, Heat and Filament otherwise', () => {
    expect(defaultOpenGroups(printing())).toEqual(['print']);
    expect(defaultOpenGroups(paused())).toEqual(['print']);
    expect(defaultOpenGroups(live())).toEqual(['heat', 'filament']);
    expect(defaultOpenGroups(null)).toEqual(['heat', 'filament']);
  });

  it('opens Machine, where the way back is, once Klipper stops', () => {
    expect(defaultOpenGroups(live({ klippyState: 'shutdown' }))).toEqual(['machine']);
    expect(defaultOpenGroups(live({ klippyState: 'error' }))).toEqual(['machine']);
  });
});

describe('filamentTemp', () => {
  it('loads at the nozzle target when it extrudes, else the default', () => {
    expect(filamentTemp(live({ extruder: { actual: 30, target: 220, power: 1 } }))).toBe(220);
    expect(filamentTemp(live({ extruder: { actual: 30, target: 150, power: 1 } }))).toBe(DEFAULT_FILAMENT_TEMP);
    expect(filamentTemp(null)).toBe(DEFAULT_FILAMENT_TEMP);
  });
});

describe('nudge', () => {
  it('steps and clamps', () => {
    expect(nudge('speed', 100, 1)).toBe(110);
    expect(nudge('speed', 10, -1)).toBe(10);
    expect(nudge('flow', 99.6, 1)).toBe(101);
    expect(nudge('fan', 95, 1)).toBe(100);
    expect(nudge('fan', null, 1)).toBe(10);
    expect(nudge('speed', null, -1)).toBe(90);
  });
});

describe('materialPreheats', () => {
  const petgA = { id: 'filament:A', name: 'PETG A', flat: { filament_type: 'PETG', nozzle_temperature: '245;245', hot_plate_temp: '80' } };
  const petgB = { id: 'filament:B', name: 'PETG B', flat: { filament_type: 'PETG', nozzle_temperature: '235', hot_plate_temp: '75' } };
  const pla = { id: 'filament:P', name: 'PLA', flat: { filament_type: 'PLA', nozzle_temperature: '210', hot_plate_temp: '60' } };

  it('reads the preset the planner settings pick for each family', () => {
    expect(materialPreheats([petgA, petgB, pla], { PETG: 'filament:B' }, 'hot_plate_temp')).toEqual([
      { family: 'PETG', preset: 'PETG B', nozzle: 235, bed: 75 },
      { family: 'PLA', preset: 'PLA', nozzle: 210, bed: 60 },
    ]);
  });

  it('falls back to the first preset of the family, as the planner does', () => {
    expect(materialPreheats([petgA, petgB], {}, 'hot_plate_temp')).toEqual([{ family: 'PETG', preset: 'PETG A', nozzle: 245, bed: 80 }]);
  });

  it('skips a family with no preset or no temperatures', () => {
    const blank = { id: 'filament:X', name: 'X', flat: { filament_type: 'TPU' } };
    expect(materialPreheats([blank], { ASA: 'filament:gone' }, 'hot_plate_temp')).toEqual([]);
  });
});
