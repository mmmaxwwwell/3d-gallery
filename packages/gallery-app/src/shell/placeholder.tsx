// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { render } from 'preact';
import { mountShell } from './shell.js';
import { registerServiceWorker } from './pwa.js';
import { viewById, type PageId } from './views.js';

type PlaceholderPage = Exclude<PageId, 'home' | 'models'>;

/**
 * Where each page's screen still lives: a panel over the gallery. Pages that
 * take an `?id=` carry it across so a deep link lands on the same project.
 */
export function panelRoute(page: PlaceholderPage, id: string | null): string {
  const gallery = `${import.meta.env.BASE_URL}gallery/`;
  if (page === 'settings') return `${gallery}?settings=1`;
  if (page === 'project' && id) return `${gallery}?project=${encodeURIComponent(id)}`;
  if (page === 'operator' && id) return `${gallery}?operator=${encodeURIComponent(id)}`;
  return `${gallery}?projects=1`;
}

/**
 * A page whose screen hasn't moved out of the gallery yet. It has the view
 * switcher, so the page and its tab exist, and it points at the panel that
 * still does the job. Each is replaced by its real page as that lands.
 */
export function mountPlaceholder(page: PlaceholderPage): void {
  registerServiceWorker();
  mountShell(document.getElementById('shell-nav')!, page);
  const label = page === 'settings' ? 'Settings' : viewById(page).label;
  const id = new URLSearchParams(location.search).get('id');
  render(
    <main class="shell-page shell-placeholder">
      <h1>{label}</h1>
      <p>{label} is moving here soon. Until then it opens inside Models.</p>
      <a class="shell-button" href={panelRoute(page, id)}>
        Open in Models
      </a>
    </main>,
    document.getElementById('page')!,
  );
}
