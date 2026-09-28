// SPDX-License-Identifier: MIT
/**
 * Old links keep working. Before the split every view was a query on the one
 * page at `/` (later `/gallery/`), and those URLs live on in bookmarks, shared
 * customizer links and the permalink baked into every downloaded part. Home and
 * Models run this first and forward any of them to the page that owns it now.
 * This is the only place that still knows the old routes.
 */

interface LegacyRoute {
  /** The query name that marks the old route. */
  param: string;
  /** Where it goes now, under the site base, query included. */
  to: (query: URLSearchParams) => string;
}

/** The gallery itself: the whole query goes along unchanged. */
const toGallery = (query: URLSearchParams) => `gallery/?${query}`;

const toOperator = (query: URLSearchParams) =>
  `operator/?${new URLSearchParams({ id: query.get('operator')! })}`;

/** A plate's project isn't in its old link; the Project page looks it up. */
const toPlate = (query: URLSearchParams) => `project/?${new URLSearchParams({ plate: query.get('plate')! })}`;

const toProject = (query: URLSearchParams) => `project/?${new URLSearchParams({ id: query.get('project')! })}`;

const toProjects = () => 'project/';

const toSettings = () => 'settings/';

const toPrinters = (query: URLSearchParams) =>
  `printers/?${new URLSearchParams({ project: query.get('dispatch')! })}`;

/** First match wins, so a model link that also names a panel opens the panel. */
export const LEGACY_ROUTES: readonly LegacyRoute[] = [
  { param: 'plate', to: toPlate },
  { param: 'project', to: toProject },
  { param: 'dispatch', to: toPrinters },
  { param: 'operator', to: toOperator },
  { param: 'settings', to: toSettings },
  { param: 'projects', to: toProjects },
  // Every other gallery query (`build`, `part`, customizer params) rides on `model`.
  { param: 'model', to: toGallery },
];

/** Where a query on `/` now lives, relative to the site base; null if it's Home's own. */
export function legacyTarget(search: string): string | null {
  const query = new URLSearchParams(search);
  const route = LEGACY_ROUTES.find((r) => query.has(r.param));
  return route ? route.to(query) : null;
}

/**
 * Forwards an old URL, replacing it in history so Back doesn't bounce. True if
 * it did. The gallery passes `fromGallery`: a model link is already home there,
 * and only a panel query that moved out has to leave.
 */
export function forwardLegacyRoute(fromGallery = false): boolean {
  const target = legacyTarget(location.search);
  if (target === null || (fromGallery && target.startsWith('gallery/'))) return false;
  location.replace(import.meta.env.BASE_URL + target + location.hash);
  return true;
}
