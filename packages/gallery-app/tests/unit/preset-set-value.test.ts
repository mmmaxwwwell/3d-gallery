// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { withValue } from '../../src/agent/preset-actions.js';
import type { PrintPreset } from '../../src/print/print-storage.js';

const left: PrintPreset = {
  id: 'printer:Left',
  kind: 'printer',
  name: 'Left',
  raw: { name: 'Left', print_host: '192.168.30.228:7125' },
  parents: [],
  overrides: { retraction_length: ['0.5'] },
  address: '192.168.30.228:7125',
  updatedAt: 1,
};

describe('presets.set_value', () => {
  it('moves a printer\'s address with its print_host, keeping its other edits', () => {
    const next = withValue(left, 'print_host', '192.168.68.73:7125');
    expect(next.address).toBe('192.168.68.73:7125');
    expect(next.overrides).toMatchObject({ print_host: '192.168.68.73:7125', retraction_length: ['0.5'] });
  });

  it('leaves the address alone when another setting changes', () => {
    expect(withValue(left, 'retraction_length', ['0.8']).address).toBe('192.168.30.228:7125');
  });

  it('unaddresses a printer whose print_host is cleared', () => {
    expect(withValue(left, 'print_host', '').address).toBeUndefined();
  });
});
