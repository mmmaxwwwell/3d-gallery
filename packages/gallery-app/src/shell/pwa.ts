// SPDX-License-Identifier: MIT
import { registerSW } from 'virtual:pwa-register';

/**
 * Registers the service worker from a page other than Models, which does its
 * own (and its own dev-mode cleanup) in main.ts. Any page can be the first one
 * a visitor opens, and the worker has to be installed by then for every page
 * to load offline next time.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) registration.update().catch(() => {});
    },
    onNeedRefresh() {
      void updateSW(true);
    },
  });
}
