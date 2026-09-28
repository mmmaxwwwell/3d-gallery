// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// The Project page: the saved projects, a project's planner, and the plate
// editor, as screens of one page routed by its query (see route.ts). Moving
// between them is in-page history, so Back steps through them the way it did
// when they were panels over the gallery. Everything else — Models, Printers,
// Settings — is another page, reached by a link.

import { render } from 'preact';
import { mountShell } from '../shell/shell.js';
import { registerServiceWorker } from '../shell/pwa.js';
import { lastOpen } from '../shell/last-open.js';
import { printersUrl, SETTINGS_PATH, viewHref } from '../shell/views.js';
import { guardPageUnload, mayLeavePrintUI, setPrintLeaveGuard } from '../print/nav-guard.js';
import { syncFromServerOnce } from '../print/server-store.js';
import { currentProject, getPlate } from '../print/plate-store.js';
import { setPlateArtifactClient } from '../print/plate-resolve.js';
import { loadArtifactClient } from './artifacts.js';
import { projectRoutePath, readProjectRoute, type ProjectRoute } from './route.js';
import { ProjectsPanel } from './ProjectsPanel.js';
import { ProjectPlanner } from './ProjectPlanner.js';
import { PrintDialog } from './PrintDialog.js';
import './project.css';

export function mountProject(): void {
  registerServiceWorker();
  mountShell(document.getElementById('shell-nav')!, 'project');
  guardPageUnload();
  // Adopt anything added to the optional server store since the last load —
  // including records an agent created over MCP. No-op unless the user has
  // opted in, and failures are swallowed so the local-first path always works.
  void syncFromServerOnce();
  setPlateArtifactClient(loadArtifactClient());

  const root = document.getElementById('page')!;
  /** What is on screen — the route to restore if a guard refuses a Back. */
  let painted: ProjectRoute = readProjectRoute(location.search);

  /** `replace` is for a screen handing control back to the one that opened
   *  it — pushing there would stack a Back step that just undoes the return. */
  const navigate = (route: ProjectRoute, replace = false) => {
    const path = projectRoutePath(route, location.pathname);
    if (location.pathname + location.search !== path) {
      if (replace) history.replaceState(null, '', path);
      else history.pushState(null, '', path);
    }
    paint(route);
  };

  const openCurrentProject = async (replace = false) => {
    const project = await currentProject();
    navigate({ view: 'project', projectId: project.id }, replace);
  };

  const openSettings = () => location.assign(import.meta.env.BASE_URL + SETTINGS_PATH);

  function paint(route: ProjectRoute): void {
    painted = route;
    if (route.view === 'projects') {
      render(
        <ProjectsPanel
          onClose={() => void openCurrentProject(true)}
          onOpenProject={(projectId) => navigate({ view: 'project', projectId }, true)}
          onOpenSettings={openSettings}
        />,
        root,
      );
      return;
    }
    if (route.view === 'project') {
      const { projectId } = route;
      render(
        <ProjectPlanner
          key={projectId}
          projectId={projectId}
          onClose={() => location.assign(viewHref('models', lastOpen('models')))}
          onOpenPlate={(plateId) => navigate({ view: 'plate', projectId, plateId }, true)}
          onOpenProjects={() => navigate({ view: 'projects' })}
          onShowProject={(id) => navigate({ view: 'project', projectId: id }, true)}
          onOpenSettings={openSettings}
          onOpenPrinters={() => location.assign(printersUrl(projectId))}
        />,
        root,
      );
      return;
    }
    if (route.view === 'plate') {
      const { projectId, plateId } = route;
      render(
        <PrintDialog
          key={plateId}
          plateId={plateId}
          onClose={() => navigate({ view: 'project', projectId }, true)}
          onOpenSettings={openSettings}
        />,
        root,
      );
      return;
    }
    const { plateId } = route;
    render(null, root);
    void getPlate(plateId).then((plate) => {
      if (plate) navigate({ view: 'plate', projectId: plate.projectId, plateId }, true);
      else void openCurrentProject(true);
    });
  }

  window.addEventListener('popstate', () => {
    // Back is a close, so it has to ask the same question Cancel does. On a
    // refusal the entry we came from goes back on the stack and the screen is
    // left alone — it never blinks.
    if (!mayLeavePrintUI()) {
      history.pushState(null, '', projectRoutePath(painted, location.pathname));
      return;
    }
    setPrintLeaveGuard(null);
    paint(readProjectRoute(location.search));
  });

  paint(painted);
}
