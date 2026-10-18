// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { render } from 'preact';
import { NavBar } from './NavBar.js';
import { recordLastOpen } from './last-open.js';
import { viewById, type PageId } from './views.js';
import './shell.css';

/**
 * Puts the view switcher on a page and makes the page's tab resume it.
 *
 * `root` is the element the bar renders into. The page itself is left alone
 * apart from a class on <html> that shell.css uses to keep the page's content
 * (and the gallery's fixed panels) clear of the bar.
 */
export function mountShell(root: HTMLElement, viewId: PageId): void {
  document.documentElement.classList.add('has-shell');
  document.documentElement.dataset.shellView = viewId;
  render(<NavBar current={viewId} />, root);
  // The dev server's MCP tools drive the page through this. A build replaces
  // import.meta.hot with undefined, so the bridge isn't even bundled.
  if (import.meta.hot) void import('../agent/bridge.js').then((m) => m.startAgentBridge(viewId));

  if (viewId === 'settings' || !viewById(viewId).resumes) return;
  const remember = () => recordLastOpen(viewId, location.pathname + location.search);
  remember();
  // Views route with pushState, which fires nothing, so the URL is read again
  // on the way out. `visibilitychange` is the one a phone reliably fires when
  // the app is swapped away rather than navigated.
  window.addEventListener('popstate', remember);
  window.addEventListener('pagehide', remember);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') remember();
  });
  root.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) remember();
  });
}
