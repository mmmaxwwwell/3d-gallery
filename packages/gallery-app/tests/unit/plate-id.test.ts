// SPDX-License-Identifier: MIT
import { afterEach, describe, expect, it } from 'vitest';
import { newId } from '../../src/print/plate-store.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newId', () => {
  const real = crypto.randomUUID;
  afterEach(() => {
    Object.defineProperty(crypto, 'randomUUID', { value: real, configurable: true });
  });

  it('mints a v4 uuid', () => {
    expect(newId()).toMatch(UUID_V4);
  });

  // `crypto.randomUUID` is secure-context-only. The gallery is routinely opened
  // over plain HTTP on a LAN or tailscale IP, where it is simply absent — and
  // every create path in the plate store calls this.
  it('mints unique v4 uuids with crypto.randomUUID absent', () => {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    const ids = new Set(Array.from({ length: 500 }, () => newId()));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(id).toMatch(UUID_V4);
  });
});
