// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { leaseLock, type HeldLock } from '../../src/print/dispatch-lock.js';

/** The localStorage two tabs share. */
function sharedStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
  };
}

const TTL = 60_000;
const BEAT = 1_000;

describe('lease lock (no Web Locks)', () => {
  const locks: HeldLock[] = [];
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => {
    for (const l of locks.splice(0)) l.release();
    vi.useRealTimers();
  });

  function take(storage: ReturnType<typeof sharedStorage>, onChange = vi.fn()) {
    const lock = leaseLock('3dg:dispatch:p1', onChange, { storage, ttlMs: TTL, beatMs: BEAT, now: Date.now });
    locks.push(lock);
    return { lock, onChange };
  }

  it('goes to one page of two', async () => {
    const storage = sharedStorage();
    const a = take(storage);
    const b = take(storage);
    await vi.advanceTimersByTimeAsync(BEAT * 3);
    expect([a.lock.held, b.lock.held].filter(Boolean)).toHaveLength(1);
  });

  it('passes on when the holder lets go', async () => {
    const storage = sharedStorage();
    const a = take(storage);
    await vi.advanceTimersByTimeAsync(BEAT);
    expect(a.lock.held).toBe(true);

    const b = take(storage);
    await vi.advanceTimersByTimeAsync(BEAT * 3);
    expect(b.lock.held).toBe(false);

    a.lock.release();
    expect(a.lock.held).toBe(false);
    await vi.advanceTimersByTimeAsync(BEAT * 2);
    expect(b.lock.held).toBe(true);
    expect(b.onChange).toHaveBeenLastCalledWith(true);
  });

  it('is taken over once a silent holder lets its lease lapse', async () => {
    const storage = sharedStorage();
    storage.setItem('3dg:lock:3dg:dispatch:p1', JSON.stringify({ owner: 'crashed', until: Date.now() + TTL }));
    const b = take(storage);
    await vi.advanceTimersByTimeAsync(TTL - BEAT);
    expect(b.lock.held).toBe(false);
    await vi.advanceTimersByTimeAsync(BEAT * 3);
    expect(b.lock.held).toBe(true);
  });

  it('says so when a lease is lost to another page', async () => {
    const storage = sharedStorage();
    const a = take(storage);
    await vi.advanceTimersByTimeAsync(BEAT);
    expect(a.lock.held).toBe(true);

    storage.setItem('3dg:lock:3dg:dispatch:p1', JSON.stringify({ owner: 'other', until: Date.now() + TTL }));
    await vi.advanceTimersByTimeAsync(BEAT);
    expect(a.lock.held).toBe(false);
    expect(a.onChange).toHaveBeenLastCalledWith(false);
  });
});
