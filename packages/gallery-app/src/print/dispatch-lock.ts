// SPDX-License-Identifier: MIT
// Makes one open page the one that runs a project's dispatch. Every page that
// shows a project's queue has its own daemon, and two of them sending the
// same upload or start would print a plate twice.
//
// A Web Lock is the real thing: the browser grants it to one page and hands it
// on the moment that page closes. But Web Locks are secure-context only, and
// printer control runs over plain HTTP on the LAN, so without them a lease in
// localStorage stands in. The lease is weaker — a page frozen past the lease
// loses it while its upload may still be going — so it is long enough to
// outlast a hidden tab's throttled timers, and handed back on close.

export interface HeldLock {
  /** Whether this page runs the queue right now. */
  readonly held: boolean;
  /** Give it up, or stop waiting for it. */
  release(): void;
}

/** Fires with `true` once the lock is this page's, and with `false` if a lease is lost. */
export type LockListener = (held: boolean) => void;

export function holdLock(name: string, onChange: LockListener): HeldLock {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (locks) return webLock(locks, name, onChange);
  const storage = safeLocalStorage();
  if (storage) return leaseLock(name, onChange, { storage });
  // No way to agree with other pages: run, as a single page always did.
  onChange(true);
  return { held: true, release() {} };
}

function webLock(locks: LockManager, name: string, onChange: LockListener): HeldLock {
  const abort = new AbortController();
  let unlock: (() => void) | null = null;
  let held = false;
  locks.request(name, { signal: abort.signal }, () => new Promise<void>((resolve) => {
    held = true;
    unlock = resolve;
    onChange(true);
  })).catch(() => { /* aborted while waiting */ });
  return {
    get held() { return held; },
    release() {
      held = false;
      if (unlock) unlock();
      else abort.abort();
    },
  };
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch { return null; }
}

interface Lease { owner: string; until: number }

export interface LeaseOptions {
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  /** How long a lease lasts unrenewed. */
  ttlMs?: number;
  /** How often the lease is renewed, or tried for. */
  beatMs?: number;
  now?: () => number;
}

/** Chrome runs a long-hidden tab's timers once a minute; the lease outlives that. */
const LEASE_TTL_MS = 120_000;
const LEASE_BEAT_MS = 5_000;
const CONFIRM_MS = 300;

export function leaseLock(name: string, onChange: LockListener, opts: LeaseOptions): HeldLock {
  const { storage, ttlMs = LEASE_TTL_MS, beatMs = LEASE_BEAT_MS, now = Date.now } = opts;
  const key = `3dg:lock:${name}`;
  const me = Math.random().toString(36).slice(2);
  let held = false;

  const read = (): Lease | null => {
    try {
      const raw = storage.getItem(key);
      return raw ? (JSON.parse(raw) as Lease) : null;
    } catch { return null; }
  };
  const set = (next: boolean) => {
    if (next === held) return;
    held = next;
    onChange(next);
  };
  const write = () => {
    try {
      storage.setItem(key, JSON.stringify({ owner: me, until: now() + ttlMs } satisfies Lease));
    } catch { /* blocked: stays unheld */ }
  };
  const drop = () => {
    if (read()?.owner === me) {
      try { storage.removeItem(key); } catch { /* it lapses on its own */ }
    }
    set(false);
  };
  let confirm: ReturnType<typeof setTimeout> | null = null;
  const beat = () => {
    const lease = read();
    if (lease?.owner === me) {
      write();
      set(true);
    } else if (lease && lease.until > now()) {
      set(false);
    } else if (confirm === null) {
      // Two pages can both find the lease free and both claim it. The last
      // write stands, so a claim only counts once it reads back as ours.
      write();
      confirm = setTimeout(() => {
        confirm = null;
        set(read()?.owner === me);
      }, CONFIRM_MS);
    }
  };

  const timer = setInterval(beat, beatMs);
  const onStorage = (e: StorageEvent) => { if (e.key === key && e.newValue === null) beat(); };
  // A page restored from the back/forward cache claims again on its next beat.
  const hasWindow = typeof window !== 'undefined';
  if (hasWindow) {
    window.addEventListener('storage', onStorage);
    window.addEventListener('pagehide', drop);
  }
  beat();
  return {
    get held() { return held; },
    release() {
      clearInterval(timer);
      if (confirm !== null) clearTimeout(confirm);
      if (hasWindow) {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('pagehide', drop);
      }
      drop();
    },
  };
}
