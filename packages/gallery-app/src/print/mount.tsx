// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { render } from 'preact';
import { PrintDialog } from './PrintDialog.js';
import { ProjectsPanel } from './ProjectsPanel.js';
import { ProjectPlanner } from './ProjectPlanner.js';
import { PrintDispatch } from './PrintDispatch.js';
import { SettingsPanel } from './SettingsPanel.js';
import { mayLeavePrintUI, setPrintLeaveGuard } from './nav-guard.js';
import { syncFromServerOnce } from './server-store.js';
import { currentProject } from './plate-store.js';

/**
 * Preact print UI lives in a single portal div appended to <body>. Each open
 * call clears the portal and renders the modal, so the imperative host
 * (`src/main.ts`) doesn't need to hold a Preact ref.
 *
 * Which panel is open is part of the URL, alongside the gallery's own
 * `?model=&part=` route: `?projects=1`, `?plate=<id>`, `?project=<id>`,
 * `?dispatch=<id>`, `?settings=1`. That makes
 * a plate linkable and makes the browser's Back button close a panel instead
 * of leaving the app. `main.ts` excludes these names from the customizer's
 * parameter sweep, so they never reach a model as a param.
 */
function ensurePortal(): HTMLDivElement {
  let portal = document.getElementById('print-portal') as HTMLDivElement | null;
  if (!portal) {
    portal = document.createElement('div');
    portal.id = 'print-portal';
    document.body.appendChild(portal);
  }
  return portal;
}

export type PrintRoute =
  | { view: 'projects' }
  | { view: 'plate'; plateId: string }
  | { view: 'project'; projectId: string }
  | { view: 'dispatch'; projectId: string }
  | { view: 'settings' }
  | null;

/** Query names this module owns. Exported so the gallery router can skip them. */
export const PRINT_ROUTE_PARAMS = ['projects', 'plate', 'project', 'dispatch', 'settings'] as const;

function readRoute(): PrintRoute {
  const params = new URLSearchParams(window.location.search);
  const plateId = params.get('plate');
  if (plateId) return { view: 'plate', plateId };
  const projectId = params.get('project');
  if (projectId) return { view: 'project', projectId };
  const dispatchId = params.get('dispatch');
  if (dispatchId) return { view: 'dispatch', projectId: dispatchId };
  if (params.get('settings')) return { view: 'settings' };
  if (params.get('projects')) return { view: 'projects' };
  return null;
}

function routePath(route: PrintRoute): string {
  const url = new URL(window.location.href);
  for (const name of PRINT_ROUTE_PARAMS) url.searchParams.delete(name);
  if (route?.view === 'projects') url.searchParams.set('projects', '1');
  else if (route?.view === 'plate') url.searchParams.set('plate', route.plateId);
  else if (route?.view === 'project') url.searchParams.set('project', route.projectId);
  else if (route?.view === 'dispatch') url.searchParams.set('dispatch', route.projectId);
  else if (route?.view === 'settings') url.searchParams.set('settings', '1');
  return url.pathname + url.search;
}

/** `replace` is for a panel handing control back to the one that opened it —
 *  pushing there would stack a Back step that just undoes the return. */
function navigate(route: PrintRoute, replace = false): void {
  const path = routePath(route);
  if (window.location.pathname + window.location.search === path) return;
  const state = { ...(history.state ?? {}), print: route };
  if (replace) history.replaceState(state, '', path);
  else history.pushState(state, '', path);
}

/** Settings and the plate editor can be handed a custom way out — each is
 *  reached from other panels and returns to whichever opened it. */
let settingsOnClose: (() => void) | null = null;
let plateOnClose: (() => void) | null = null;

/** What is on screen — the route to restore if a guard refuses a Back. */
let painted: PrintRoute = null;

function paint(route: PrintRoute): void {
  const portal = ensurePortal();
  painted = route;
  if (route === null) {
    render(null, portal);
    return;
  }
  if (route.view === 'projects') {
    render(
      <ProjectsPanel
        onClose={() => void openCurrentProject(true)}
        onOpenProject={(projectId) => openProjectPlanner(projectId, true)}
        onOpenSettings={() => openSettingsPanel(() => openProjectsPanel(true), true)}
      />,
      portal,
    );
    return;
  }
  if (route.view === 'project') {
    const { projectId } = route;
    render(
      <ProjectPlanner
        key={projectId}
        projectId={projectId}
        onClose={() => closePrintUI()}
        onOpenPlate={(plateId) => openPlateDialog(plateId, true, () => openProjectPlanner(projectId, true))}
        onOpenProjects={() => openProjectsPanel()}
        onShowProject={(id) => openProjectPlanner(id, true)}
        onOpenSettings={() => openSettingsPanel(() => openProjectPlanner(projectId, true), true)}
        onOpenDispatch={() => openPrintDispatch(projectId)}
      />,
      portal,
    );
    return;
  }
  if (route.view === 'dispatch') {
    const { projectId } = route;
    render(
      <PrintDispatch
        key={projectId}
        projectId={projectId}
        onClose={() => closePrintUI()}
        onOpenPlanner={() => openProjectPlanner(projectId)}
      />,
      portal,
    );
    return;
  }
  if (route.view === 'plate') {
    const { plateId } = route;
    render(
      <PrintDialog
        plateId={plateId}
        onClose={() => (plateOnClose ?? closePrintUI)()}
        onOpenSettings={() => {
          const back = plateOnClose ?? undefined;
          openSettingsPanel(() => openPlateDialog(plateId, true, back), true);
        }}
      />,
      portal,
    );
    return;
  }
  render(<SettingsPanel onClose={() => (settingsOnClose ?? closePrintUI)()} />, portal);
}

export function openProjectsPanel(replace = false): void {
  settingsOnClose = null;
  plateOnClose = null;
  navigate({ view: 'projects' }, replace);
  paint({ view: 'projects' });
}

export function openPlateDialog(plateId: string, replace = false, onClose?: () => void): void {
  settingsOnClose = null;
  plateOnClose = onClose ?? null;
  navigate({ view: 'plate', plateId }, replace);
  paint({ view: 'plate', plateId });
}

export function openProjectPlanner(projectId: string, replace = false): void {
  settingsOnClose = null;
  plateOnClose = null;
  navigate({ view: 'project', projectId }, replace);
  paint({ view: 'project', projectId });
}

/** The project view on whichever project is open — there always is one. */
export async function openCurrentProject(replace = false): Promise<void> {
  const project = await currentProject();
  openProjectPlanner(project.id, replace);
}

export function openPrintDispatch(projectId: string, replace = false): void {
  settingsOnClose = null;
  plateOnClose = null;
  navigate({ view: 'dispatch', projectId }, replace);
  paint({ view: 'dispatch', projectId });
}

export function openSettingsPanel(onClose?: () => void, replace = false): void {
  settingsOnClose = onClose ?? null;
  plateOnClose = null;
  navigate({ view: 'settings' }, replace);
  paint({ view: 'settings' });
}

export function closePrintUI(): void {
  settingsOnClose = null;
  plateOnClose = null;
  navigate(null);
  paint(null);
}

/**
 * Open whatever panel the current URL names, and keep doing so as the user
 * moves through history. Call once, after the gallery has booted.
 */
export function initPrintRouting(): void {
  // Adopt anything added to the optional server store since the last load —
  // including records an agent created over MCP. No-op unless the user has
  // opted in, and failures are swallowed so the local-first path always works.
  void syncFromServerOnce();

  window.addEventListener('popstate', () => {
    // Back is a close, so it has to ask the same question Cancel does. On a
    // refusal the entry we came from goes back on the stack and the DOM is
    // left alone — the panel never blinks.
    if (!mayLeavePrintUI()) {
      history.pushState({ ...(history.state ?? {}), print: painted }, '', routePath(painted));
      return;
    }
    setPrintLeaveGuard(null);
    settingsOnClose = null;
    plateOnClose = null;
    paint(readRoute());
  });
  const route = readRoute();
  if (route) paint(route);
}
