// SPDX-License-Identifier: MIT
/**
 * The short text a view shows on its tab (a count needing attention, the time
 * to the next trip).
 *
 * Whoever computes a badge is usually a different page from the one showing
 * it, so badges go through `localStorage`: other tabs hear the `storage`
 * event, and this tab hears a window event, since `storage` never fires in
 * the tab that wrote.
 */
import type { ViewId } from './views.js';

const KEY_PREFIX = '3dg:shell:badge:';
const LOCAL_EVENT = '3dg:shell:badge';

export function badgeKey(id: ViewId): string {
  return KEY_PREFIX + id;
}

export function setBadge(id: ViewId, text: string | null): void {
  try {
    if (text) localStorage.setItem(badgeKey(id), text);
    else localStorage.removeItem(badgeKey(id));
  } catch {
    return;
  }
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: id }));
}

export function getBadge(id: ViewId): string | null {
  try {
    return localStorage.getItem(badgeKey(id));
  } catch {
    return null;
  }
}

/** Calls `listener` whenever any badge changes, in this tab or another. */
export function onBadgeChange(listener: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith(KEY_PREFIX)) listener();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(LOCAL_EVENT, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LOCAL_EVENT, listener);
  };
}
