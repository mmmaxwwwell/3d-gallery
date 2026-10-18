// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { reimported, type PrintPreset } from '../../src/print/print-storage.js';

const fromOrca = {
  kind: 'printer' as const,
  name: 'Left',
  raw: { name: 'Left', print_host: '192.168.68.58:7125' },
  parents: [],
  address: '192.168.68.58:7125',
};

const stored = (overrides?: PrintPreset['overrides']): PrintPreset => ({
  ...fromOrca, id: 'printer:Left', overrides, address: '192.168.30.228:7125', updatedAt: 1,
});

describe('reimported', () => {
  it('keeps an address edited in the gallery over the one the Orca file still names', () => {
    const next = reimported(fromOrca, stored({ print_host: '192.168.30.228:7125', retraction_length: ['0.5'] }));
    expect(next.address).toBe('192.168.30.228:7125');
    expect(next.overrides).toEqual({ print_host: '192.168.30.228:7125', retraction_length: ['0.5'] });
    expect(next.raw).toBe(fromOrca.raw);
  });

  it('takes the file\'s address when the gallery never edited it', () => {
    expect(reimported(fromOrca, stored({ retraction_length: ['0.5'] })).address).toBe('192.168.68.58:7125');
    expect(reimported(fromOrca, undefined).address).toBe('192.168.68.58:7125');
  });

  it('leaves a printer with its address cleared in the gallery unaddressed', () => {
    expect(reimported(fromOrca, stored({ print_host: '' })).address).toBeUndefined();
  });
});
