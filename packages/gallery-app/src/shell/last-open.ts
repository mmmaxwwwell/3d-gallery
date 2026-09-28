// SPDX-License-Identifier: MIT
/**
 * The URL each view was last left at, so its tab reopens it.
 *
 * Views are separate pages, so this can't be in-memory state: it lives in
 * `localStorage`, which every page on the origin shares. Storage that throws
 * (private mode, quota) just means tabs open their view's front page.
 */
import type { ViewId } from './views.js';

const KEY_PREFIX = '3dg:shell:last:';

export function lastOpenKey(id: ViewId): string {
  return KEY_PREFIX + id;
}

export function recordLastOpen(id: ViewId, url: string, storage: Storage = localStorage): void {
  try {
    storage.setItem(lastOpenKey(id), url);
  } catch {
    // Nothing to remember it in; the tab falls back to the front page.
  }
}

export function lastOpen(id: ViewId, storage: Storage = localStorage): string | null {
  try {
    return storage.getItem(lastOpenKey(id));
  } catch {
    return null;
  }
}
