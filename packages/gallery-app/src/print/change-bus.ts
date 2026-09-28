// SPDX-License-Identifier: MIT
// Tells every open page of the app that a store was written. The views are
// separate pages over the same IndexedDB and localStorage, so a plate saved in
// Project or a print started from Printers has to reach Operator open in
// another tab. Each store publishes `{ store, key }` once its write has
// committed; its own `on*Change` subscribers hear about it here, from this tab
// or another. No Preact.

/** The stores that announce their writes. */
export type StoreName = 'plates' | 'presets' | 'planner' | 'dispatch' | 'operator';

export interface StoreChange {
  store: StoreName;
  /** What changed within the store: a project id, a preset kind, … — each store says. */
  key: string;
}

export type ChangeListener = (key: string, fromOtherTab: boolean) => void;

export interface ChangeBus {
  /** Call after the write commits: other tabs read the store as soon as they hear. */
  publish(change: StoreChange): void;
  subscribe(store: StoreName, fn: ChangeListener): () => void;
  close(): void;
}

/** Where the `storage` fallback writes; only the event it raises matters. */
const STORAGE_KEY = '3dg:change-bus';

function isChange(data: unknown): data is StoreChange {
  const c = data as StoreChange | null;
  return typeof c?.store === 'string' && typeof c.key === 'string';
}

/**
 * A bus over `BroadcastChannel(name)`. Without one (old Safari), a write to a
 * localStorage key does the carrying: every other tab gets a `storage` event.
 */
export function createChangeBus(name = '3dg'): ChangeBus {
  const listeners = new Map<StoreName, Set<ChangeListener>>();
  const deliver = (change: StoreChange, fromOtherTab: boolean) => {
    for (const fn of listeners.get(change.store) ?? []) fn(change.key, fromOtherTab);
  };

  let channel: BroadcastChannel | null = null;
  let onStorage: ((e: StorageEvent) => void) | null = null;
  if (typeof BroadcastChannel === 'function') {
    channel = new BroadcastChannel(name);
    channel.onmessage = (e: MessageEvent) => { if (isChange(e.data)) deliver(e.data, true); };
  } else if (typeof window !== 'undefined') {
    onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const data: unknown = JSON.parse(e.newValue);
        if (isChange(data)) deliver(data, true);
      } catch { /* not ours */ }
    };
    window.addEventListener('storage', onStorage);
  }

  return {
    publish(change) {
      deliver(change, false);
      if (channel) {
        channel.postMessage(change);
        return;
      }
      try {
        // The nonce makes every write a change, so a repeat still raises an event.
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...change, nonce: Math.random() }));
      } catch { /* blocked storage: other tabs catch up on their next read */ }
    },
    subscribe(store, fn) {
      let set = listeners.get(store);
      if (!set) listeners.set(store, (set = new Set()));
      set.add(fn);
      return () => { set.delete(fn); };
    },
    close() {
      channel?.close();
      if (onStorage) window.removeEventListener('storage', onStorage);
      listeners.clear();
    },
  };
}

let shared: ChangeBus | null = null;

function bus(): ChangeBus {
  shared ??= createChangeBus();
  return shared;
}

export function publishChange(store: StoreName, key: string): void {
  bus().publish({ store, key });
}

/** `fn` hears every write to `store`, this tab's and other tabs'. */
export function onStoreChange(store: StoreName, fn: ChangeListener): () => void {
  return bus().subscribe(store, fn);
}
