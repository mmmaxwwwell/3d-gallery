import { describe, it, expect } from 'vitest';
import { createMemoryCache, createIdbCache } from '../src/artifact-cache.ts';

function bytes(n: number): ArrayBuffer {
  return new Uint8Array(n).buffer;
}

describe('createMemoryCache', () => {
  it('round-trips', async () => {
    const cache = createMemoryCache();
    await cache.put('k', bytes(4));
    expect((await cache.get('k'))?.byteLength).toBe(4);
  });

  it('misses an unknown key', async () => {
    expect(await createMemoryCache().get('nope')).toBeNull();
  });

  it('clears', async () => {
    const cache = createMemoryCache();
    await cache.put('k', bytes(4));
    await cache.clear();
    expect(await cache.get('k')).toBeNull();
  });
});

describe('createIdbCache without IndexedDB', () => {
  // Private browsing and some embedded webviews have no IndexedDB. Losing the
  // persistent cache is acceptable there; failing every render is not.
  it('still caches in memory rather than throwing', async () => {
    expect(typeof indexedDB).toBe('undefined');
    const cache = createIdbCache();
    await cache.put('k', bytes(8));
    expect((await cache.get('k'))?.byteLength).toBe(8);
  });

  it('reports a miss for an unknown key', async () => {
    expect(await createIdbCache().get('absent')).toBeNull();
  });
});
