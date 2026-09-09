// SPDX-License-Identifier: AGPL-3.0-or-later
import type { StorageAdapter } from './types.js';

/**
 * Create a browser storage adapter (IndexedDB).
 */
export async function createStorage(): Promise<StorageAdapter> {
  const { BrowserStorageAdapter } = await import('./storage-browser.js');
  return new BrowserStorageAdapter();
}
