// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { dropOldRenderCache } from '../../src/shell/stale-storage.js';

function memoryStorage(entries: Record<string, string>): Storage {
  const map = new Map(Object.entries(entries));
  return {
    get length() { return map.size; },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    clear: () => map.clear(),
  };
}

describe('dropOldRenderCache', () => {
  it('drops the old base64 render cache and nothing else', () => {
    const hash = 'a'.repeat(64);
    const storage = memoryStorage({
      [`3dg:fan-mount:${hash}`]: 'AAAA',
      [`3dg:fi-mini-case:${'0123456789abcdef'.repeat(4)}`]: 'BBBB',
      '3dg:dispatch:3f2c': '{}',
      '3dg:show-dev': '1',
      '3dg:lock:3dg:dispatch:6d0b200b-486c-412b-b493-9514150747eb': 'x',
    });
    expect(dropOldRenderCache(storage)).toBe(2);
    expect([...Array(storage.length)].map((_, i) => storage.key(i)).sort())
      .toEqual(['3dg:dispatch:3f2c', '3dg:lock:3dg:dispatch:6d0b200b-486c-412b-b493-9514150747eb', '3dg:show-dev']);
  });
});
