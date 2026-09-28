// SPDX-License-Identifier: MIT
// Which screen of the Project page a URL names. Pure, so the mapping between
// URLs and screens is tested without a browser.
//
//   project/                     the saved projects
//   project/?id=<project>        that project's planner
//   project/?id=<p>&plate=<id>   one of its plates, in the plate editor
//   project/?plate=<id>          a plate whose project isn't known yet (an
//                                old `?plate=` link); the page looks it up

export type ProjectRoute =
  | { view: 'projects' }
  | { view: 'project'; projectId: string }
  | { view: 'plate'; projectId: string; plateId: string }
  | { view: 'find-plate'; plateId: string };

export function readProjectRoute(search: string): ProjectRoute {
  const query = new URLSearchParams(search);
  const projectId = query.get('id');
  const plateId = query.get('plate');
  if (projectId && plateId) return { view: 'plate', projectId, plateId };
  if (plateId) return { view: 'find-plate', plateId };
  if (projectId) return { view: 'project', projectId };
  return { view: 'projects' };
}

/** The route's URL, from the path down: `pathname` is the Project page's own. */
export function projectRoutePath(route: ProjectRoute, pathname: string): string {
  const query = new URLSearchParams();
  if (route.view === 'project' || route.view === 'plate') query.set('id', route.projectId);
  if (route.view === 'plate' || route.view === 'find-plate') query.set('plate', route.plateId);
  const search = query.toString();
  return search ? `${pathname}?${search}` : pathname;
}
