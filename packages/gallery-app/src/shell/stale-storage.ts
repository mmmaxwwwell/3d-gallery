// SPDX-License-Identifier: MIT
/**
 * Renders used to be cached in localStorage, base64, under
 * `3dg:<slug>:<sha256>`. The cache moved to IndexedDB (viewer's
 * artifact-cache) but the old entries stayed, and on a browser that used the
 * old gallery they fill the origin's ~5 MB: then nothing else stores, and a
 * plan sent to the printers is lost. They are a cache, so they go.
 */
const OLD_RENDER_KEY = /^3dg:[a-z0-9-]+:[0-9a-f]{64}$/;

export function dropOldRenderCache(storage: Storage): number {
  const stale: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && OLD_RENDER_KEY.test(key)) stale.push(key);
  }
  for (const key of stale) storage.removeItem(key);
  return stale.length;
}
