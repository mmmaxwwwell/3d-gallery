// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { macroScript, MACRO_NEEDS, controlAvailable, type MacroControl } from '../src/moonraker-control.js';

describe('macroScript', () => {
  it.each<[string, string]>([
    [macroScript.home(), 'G28'],
    [macroScript.loadFilament(), 'LOAD_FILAMENT'],
    [macroScript.loadFilament(240), 'M109 S240\nLOAD_FILAMENT'],
    [macroScript.unloadFilament(), 'UNLOAD_FILAMENT'],
    [macroScript.unloadFilament(230), 'M109 S230\nUNLOAD_FILAMENT'],
    [macroScript.purge(), 'PURGE_FILAMENT'],
    [macroScript.purge(40), 'SET_GCODE_VARIABLE MACRO=PURGE_FILAMENT VARIABLE=purge_distance VALUE=40\nPURGE_FILAMENT'],
    [macroScript.meshAndSave(), 'AUTO_FULL_BED_LEVEL\nNEW_SAVE_CONFIG'],
    [macroScript.clearNozzle(), 'CLEAR_NOZZLE'],
    [macroScript.coldPull(), 'COLDPULL'],
    [macroScript.coldPull({ hot: 250, cold: 100 }), '_COLDPULL_LOAD_MATERIAL TEMP=250 COLD=100'],
    [macroScript.pauseNextLayer(), 'SET_PAUSE_NEXT_LAYER ENABLE=1'],
    [macroScript.excludeObject('plate-1.stl_id_0_copy_0'), 'EXCLUDE_OBJECT NAME=plate-1.stl_id_0_copy_0'],
    [macroScript.zOffsetAdjust(-0.025), 'SET_GCODE_OFFSET Z_ADJUST=-0.025 MOVE=1'],
    [macroScript.zOffsetAdjust(0.1 + 0.2), 'SET_GCODE_OFFSET Z_ADJUST=0.3 MOVE=1'],
    [macroScript.speed(150), 'M220 S150'],
    [macroScript.flow(95), 'M221 S95'],
    [macroScript.fan(100), 'M106 S255'],
    [macroScript.fan(40), 'M106 S102'],
    [macroScript.fan(0), 'M106 S0'],
    [macroScript.fan(120), 'M106 S255'],
    [macroScript.light(true), 'LED_ON'],
    [macroScript.light(false), 'LED_OFF'],
    [macroScript.restartCamera(), 'CAMERA_RESTART'],
    [macroScript.reboot(), 'REBOOT'],
    [macroScript.powerOff(), 'SHUTDOWN'],
    [macroScript.disableMotors(), 'M84'],
    [macroScript.extrude(10), '_CLIENT_EXTRUDE LENGTH=10'],
    [macroScript.retract(-2), '_CLIENT_RETRACT LENGTH=2'],
    [macroScript.park(), '_TOOLHEAD_PARK_PAUSE_CANCEL'],
    [macroScript.setNozzle(255), 'M104 S255'],
    [macroScript.setBed(0), 'M140 S0'],
  ])('%j', (script, expected) => {
    expect(script).toBe(expected);
  });

  it('refuses a number G-code cannot take', () => {
    expect(() => macroScript.setNozzle(NaN)).toThrow(RangeError);
    expect(() => macroScript.zOffsetAdjust(Infinity)).toThrow(RangeError);
    expect(() => macroScript.fan(NaN)).toThrow(RangeError);
    expect(() => macroScript.loadFilament(NaN)).toThrow(RangeError);
  });

  it('refuses an object name that would inject another command', () => {
    expect(() => macroScript.excludeObject('a\nFIRMWARE_RESTART')).toThrow(RangeError);
    expect(() => macroScript.excludeObject('two words')).toThrow(RangeError);
    expect(() => macroScript.excludeObject('')).toThrow(RangeError);
  });
});

describe('MACRO_NEEDS / controlAvailable', () => {
  it('names a requirement list for every control', () => {
    expect(Object.keys(MACRO_NEEDS).sort()).toEqual(Object.keys(macroScript).sort());
  });

  it('every macro a script calls is one it declares', () => {
    const builtins = new Set(['G28', 'M104', 'M106', 'M109', 'M140', 'M220', 'M221', 'M84', 'EXCLUDE_OBJECT', 'SET_GCODE_OFFSET', 'SET_GCODE_VARIABLE']);
    const sample: Record<MacroControl, () => string> = {
      home: () => macroScript.home(), loadFilament: () => macroScript.loadFilament(200),
      unloadFilament: () => macroScript.unloadFilament(200), purge: () => macroScript.purge(5),
      meshAndSave: () => macroScript.meshAndSave(), clearNozzle: () => macroScript.clearNozzle(),
      coldPull: () => `${macroScript.coldPull()}\n${macroScript.coldPull({ hot: 1, cold: 1 })}`,
      pauseNextLayer: () => macroScript.pauseNextLayer(), excludeObject: () => macroScript.excludeObject('x'),
      zOffsetAdjust: () => macroScript.zOffsetAdjust(0.01), speed: () => macroScript.speed(100),
      flow: () => macroScript.flow(100), fan: () => macroScript.fan(50),
      light: () => `${macroScript.light(true)}\n${macroScript.light(false)}`,
      restartCamera: () => macroScript.restartCamera(), reboot: () => macroScript.reboot(),
      powerOff: () => macroScript.powerOff(), disableMotors: () => macroScript.disableMotors(),
      extrude: () => macroScript.extrude(1), retract: () => macroScript.retract(1), park: () => macroScript.park(),
      setNozzle: () => macroScript.setNozzle(1), setBed: () => macroScript.setBed(1),
    };
    for (const [control, script] of Object.entries(sample) as Array<[MacroControl, () => string]>) {
      const called = script().split('\n').map((l) => l.split(' ')[0]).filter((c) => !builtins.has(c));
      expect(new Set(called), control).toEqual(new Set(MACRO_NEEDS[control]));
    }
  });

  it('hides a control whose macro the printer lacks', () => {
    const macros = new Set(['LOAD_FILAMENT', 'LED_ON']);
    expect(controlAvailable('loadFilament', macros)).toBe(true);
    expect(controlAvailable('unloadFilament', macros)).toBe(false);
    expect(controlAvailable('light', macros)).toBe(false);
    expect(controlAvailable('home', new Set())).toBe(true);
  });
});
