// SPDX-License-Identifier: MIT
/**
 * Old links keep working. Before the split every view was a query on the one
 * page at `/`, and those URLs live on in bookmarks, shared customizer links and
 * the permalink baked into every downloaded part. Home runs this first and
 * forwards any of them to the page that owns it now.
 */

interface LegacyRoute {
  /** The query name that marks the old route. */
  param: string;
  /** Where it goes now, under the site base, query included. */
  to: (query: URLSearchParams) => string;
}

/** Still a panel over the gallery, so the whole query goes along unchanged. */
const toGallery = (query: URLSearchParams) => `gallery/?${query}`;

const toOperator = (query: URLSearchParams) =>
  `operator/?${new URLSearchParams({ id: query.get('operator')! })}`;

/**
 * First match wins, in the precedence `print/mount.tsx` reads its panels in, so
 * a URL naming two routes lands where it used to. Each view's task edits only
 * its own row when its page lands.
 */
export const LEGACY_ROUTES: readonly LegacyRoute[] = [
  { param: 'plate', to: toGallery },
  { param: 'project', to: toGallery },
  { param: 'dispatch', to: toGallery },
  { param: 'operator', to: toOperator },
  { param: 'settings', to: toGallery },
  { param: 'projects', to: toGallery },
  // Every other gallery query (`build`, `part`, customizer params) rides on `model`.
  { param: 'model', to: toGallery },
];

/** Where a query on `/` now lives, relative to the site base; null if it's Home's own. */
export function legacyTarget(search: string): string | null {
  const query = new URLSearchParams(search);
  const route = LEGACY_ROUTES.find((r) => query.has(r.param));
  return route ? route.to(query) : null;
}

/** Forwards an old URL, replacing it in history so Back doesn't bounce. True if it did. */
export function forwardLegacyRoute(): boolean {
  const target = legacyTarget(location.search);
  if (target === null) return false;
  location.replace(import.meta.env.BASE_URL + target + location.hash);
  return true;
}
