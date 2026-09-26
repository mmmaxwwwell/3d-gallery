// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { filamentByType } from '../src/gcode-parser.js';

describe('filamentByType', () => {
  it('tallies relative extrusion per feature, ignoring retracts and unretracts', () => {
    const gcode = [
      'M83',
      ';TYPE:Outer wall',
      'G1 X10 Y0 E1.5',
      'G1 X10 Y10 E0.5',
      'G1 E-0.8',
      ';TYPE:Support',
      'G1 E0.8',
      'G1 X0 Y10 E0.25 ; inline comment',
      ';TYPE:Prime tower',
      'G1 X5 Y5 E2',
      'G0 X0 Y0',
    ].join('\n');
    expect(filamentByType(gcode)).toEqual({ wall: 2, support: 0.25, 'purge-tower': 2 });
  });

  it('follows absolute extrusion and G92 resets', () => {
    const gcode = [
      'M82',
      ';TYPE:Inner wall',
      'G1 X1 Y0 E1',
      'G1 X2 Y0 E3',
      'G92 E0',
      ';TYPE:Support transition',
      'G1 X3 Y0 E0.5',
    ].join('\n');
    expect(filamentByType(gcode)).toEqual({ wall: 3, support: 0.5 });
  });
});
