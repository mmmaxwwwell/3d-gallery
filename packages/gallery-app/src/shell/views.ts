// SPDX-License-Identifier: MIT
/**
 * The one list of views the app is split into.
 *
 * Each view is its own Vite page, so nothing here may import a view's code:
 * the nav bar, the Home cards and the tests all read this table, and a view
 * is reached only by the URL it names.
 */

export type ViewId = 'home' | 'models' | 'project' | 'printers' | 'operator';

/** Settings is a page but not a tab; it's reached from Home and the rail's gear. */
export type PageId = ViewId | 'settings';

export interface View {
  id: ViewId;
  label: string;
  /** Drawn beside the label, never instead of it. */
  icon: string;
  /** Under the site base, with a trailing slash. */
  path: string;
  /** Whether the tab reopens the last URL seen in the view rather than its front page. */
  resumes: boolean;
}

export const VIEWS: readonly View[] = [
  { id: 'home', label: 'Home', icon: '🏠', path: '', resumes: false },
  { id: 'models', label: 'Models', icon: '🧊', path: 'gallery/', resumes: true },
  { id: 'project', label: 'Project', icon: '🗂️', path: 'project/', resumes: true },
  { id: 'printers', label: 'Printers', icon: '🖨️', path: 'printers/', resumes: true },
  { id: 'operator', label: 'Operator', icon: '🧭', path: 'operator/', resumes: true },
];

export const SETTINGS_PATH = 'settings/';

const BASE = import.meta.env.BASE_URL;

export function viewById(id: ViewId): View {
  const view = VIEWS.find((v) => v.id === id);
  if (!view) throw new Error(`unknown view: ${id}`);
  return view;
}

/**
 * Where a view's tab goes: the URL last seen in it, else its front page.
 *
 * A remembered URL is only trusted while it's still under the view's own path,
 * so a stale or foreign entry can't send a tab to another view.
 */
export function viewHref(id: ViewId, last: string | null, base = BASE): string {
  const view = viewById(id);
  const front = base + view.path;
  if (!view.resumes || !last) return front;
  return last.startsWith(front) ? last : front;
}

/** The runbook for a project's plan. */
export function operatorUrl(projectId: string, base = BASE): string {
  return `${base}${viewById('operator').path}?id=${encodeURIComponent(projectId)}`;
}

/** A project's planner. It's still a panel over the gallery until the Project page lands. */
export function projectUrl(projectId: string, base = BASE): string {
  return `${base}gallery/?project=${encodeURIComponent(projectId)}`;
}
