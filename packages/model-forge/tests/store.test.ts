import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, type Sidecar, type Store } from '../src/store.ts';

function sidecar(key: string, over: Partial<Sidecar> = {}): Sidecar {
  return {
    key,
    slug: 'fixture-cube',
    target: 'box',
    format: 'stl',
    params: {},
    sourceDigest: 'd'.repeat(64),
    externalIncludes: [],
    engine: 'openscad-native',
    engineVersion: 'OpenSCAD 2026.01',
    args: ['--backend', 'Manifold'],
    byteLength: 3,
    renderMs: 5,
    builtAt: new Date().toISOString(),
    ...over,
  };
}

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);

describe('createStore', () => {
  let dir: string;
  let store: Store;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'forge-store-'));
    store = createStore(dir);
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('round-trips bytes', () => {
    store.write(KEY_A, 'stl', new Uint8Array([1, 2, 3]), sidecar(KEY_A));
    expect(store.has(KEY_A, 'stl')).toBe(true);
    expect([...store.read(KEY_A, 'stl')]).toEqual([1, 2, 3]);
  });

  it('shards by the first two hex characters, so one directory never holds everything', () => {
    store.write(KEY_A, 'stl', new Uint8Array([1]), sidecar(KEY_A));
    expect(existsSync(join(dir, 'aa', `${KEY_A}.stl`))).toBe(true);
  });

  it('stores a sidecar next to the bytes', () => {
    store.write(KEY_A, 'stl', new Uint8Array([1]), sidecar(KEY_A, { renderMs: 42 }));
    expect(store.sidecar(KEY_A)?.renderMs).toBe(42);
  });

  it('records the engine, which is deliberately absent from the key', () => {
    store.write(KEY_A, 'stl', new Uint8Array([1]), sidecar(KEY_A));
    const s = store.sidecar(KEY_A)!;
    expect(s.engine).toBe('openscad-native');
    expect(s.engineVersion).toContain('OpenSCAD');
  });

  it('leaves no temp files behind', () => {
    store.write(KEY_A, 'stl', new Uint8Array([1]), sidecar(KEY_A));
    expect(readdirSync(join(dir, 'aa')).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });

  it('reports a missing artifact rather than throwing', () => {
    expect(store.has(KEY_B, 'stl')).toBe(false);
    expect(store.sidecar(KEY_B)).toBeNull();
  });

  it('survives a corrupt sidecar', () => {
    store.write(KEY_A, 'stl', new Uint8Array([1]), sidecar(KEY_A));
    writeFileSync(join(dir, 'aa', `${KEY_A}.json`), '{ not json');
    expect(store.sidecar(KEY_A)).toBeNull();
    expect(store.list()).toEqual([]);
  });

  describe('negative cache', () => {
    it('remembers a failure within the window', () => {
      store.writeError(KEY_A, { key: KEY_A, message: 'boom', logs: ['l1'], builtAt: new Date().toISOString() });
      expect(store.readError(KEY_A, 60_000)?.message).toBe('boom');
    });

    it('forgets a failure past the window', () => {
      store.writeError(KEY_A, { key: KEY_A, message: 'boom', logs: [], builtAt: new Date(Date.now() - 120_000).toISOString() });
      expect(store.readError(KEY_A, 60_000)).toBeNull();
    });

    it('clears on demand, so a fixed model retries immediately', () => {
      store.writeError(KEY_A, { key: KEY_A, message: 'boom', logs: [], builtAt: new Date().toISOString() });
      store.clearError(KEY_A);
      expect(store.readError(KEY_A, 60_000)).toBeNull();
    });
  });

  describe('eviction', () => {
    it('drops the oldest first until under budget', () => {
      const old = new Date(Date.now() - 10_000).toISOString();
      store.write(KEY_A, 'stl', new Uint8Array(100), sidecar(KEY_A, { byteLength: 100, builtAt: old }));
      store.write(KEY_B, 'stl', new Uint8Array(100), sidecar(KEY_B, { byteLength: 100 }));

      const result = store.evict(150);
      expect(result.removed).toBe(1);
      expect(store.has(KEY_A, 'stl')).toBe(false);
      expect(store.has(KEY_B, 'stl')).toBe(true);
    });

    it('never evicts what the manifest still declares', () => {
      const old = new Date(Date.now() - 10_000).toISOString();
      store.write(KEY_A, 'stl', new Uint8Array(100), sidecar(KEY_A, { byteLength: 100, builtAt: old }));
      store.write(KEY_B, 'stl', new Uint8Array(100), sidecar(KEY_B, { byteLength: 100 }));

      store.evict(150, new Set([KEY_A]));
      expect(store.has(KEY_A, 'stl')).toBe(true);
    });

    it('does nothing when already under budget', () => {
      store.write(KEY_A, 'stl', new Uint8Array(10), sidecar(KEY_A, { byteLength: 10 }));
      expect(store.evict(1000).removed).toBe(0);
    });
  });

  it('totals what it holds', () => {
    store.write(KEY_A, 'stl', new Uint8Array(10), sidecar(KEY_A, { byteLength: 10 }));
    store.write(KEY_B, '3mf', new Uint8Array(20), sidecar(KEY_B, { byteLength: 20, format: '3mf' }));
    expect(store.stats()).toEqual({ count: 2, bytes: 30 });
  });

  it('reports an empty store before anything is written', () => {
    expect(store.list()).toEqual([]);
    expect(store.stats()).toEqual({ count: 0, bytes: 0 });
  });
});
