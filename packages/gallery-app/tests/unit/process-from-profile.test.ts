// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { DEFAULT_PRINT_PROFILE } from '@3d-gallery/model-core';
import { processFromProfile } from '../../src/print/plate-slice.js';
import type { ProcessSettings } from '../../src/print/process-templates.js';

const draft: ProcessSettings = {
  wallLoops: '2', topShells: '5', bottomShells: '3', infillDensity: '15', infillPattern: 'grid',
  supportStyle: 'none', supportOnBuildPlateOnly: false, brim: false, skirt: false, adaptiveLayerHeight: false,
};

describe('processFromProfile', () => {
  it('takes what the profile names and keeps the chosen process for the rest', () => {
    const proc = processFromProfile({ ...DEFAULT_PRINT_PROFILE, walls: 3, infillDensity: 20 }, draft);
    expect(proc).toMatchObject({ wallLoops: '3', infillDensity: '20', infillPattern: 'gyroid' });
    expect(proc).toMatchObject({ topShells: '5', bottomShells: '3', adaptiveLayerHeight: false });
  });
});
