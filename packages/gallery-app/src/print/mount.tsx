// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { render } from 'preact';
import { PrintDialog } from './PrintDialog.js';
import { PlatesPanel } from './PlatesPanel.js';
import { ProjectPlanner } from './ProjectPlanner.js';
import { SettingsPanel } from './SettingsPanel.js';
import { mayLeavePrintUI, setPrintLeaveGuard } from './nav-guard.js';
import { syncFromServerOnce } from './server-store.js';

/**
 * Preact print UI lives in a single portal div appended to <body>. Each open
 * call clears the portal and renders the modal, so the imperative host
 * (`src/main.ts`) doesn't need to hold a Preact ref.
 *
 * Which panel is open is part of the URL, alongside the gallery's own
 * `?model=&part=` route: `?plates=1`, `?plate=<id>`, `?project=<id>`,
 * `?settings=1`. That makes
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
  | { view: 'plates' }
  | { view: 'plate'; plateId: string }
  | { view: 'project'; projectId: string }
  | { view: 'settings' }
  | null;

/** Query names this module owns. Exported so the gallery router can skip them. */
export const PRINT_ROUTE_PARAMS = ['plates', 'plate', 'project', 'settings'] as const;

function readRoute(): PrintRoute {
  const params = new URLSearchParams(window.location.search);
  const plateId = params.get('plate');
  if (plateId) return { view: 'plate', plateId };
  const projectId = params.get('project');
  if (projectId) return { view: 'project', projectId };
  if (params.get('settings')) return { view: 'settings' };
  if (params.get('plates')) return { view: 'plates' };
  return null;
}

function routePath(route: PrintRoute): string {
  const url = new URL(window.location.href);
  for (const name of PRINT_ROUTE_PARAMS) url.searchParams.delete(name);
  if (route?.view === 'plates') url.searchParams.set('plates', '1');
  else if (route?.view === 'plate') url.searchParams.set('plate', route.plateId);
  else if (route?.view === 'project') url.searchParams.set('project', route.projectId);
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

/** Settings is the one panel that can be handed a custom way out — it is
 *  reached from the other two and returns to whichever opened it. */
let settingsOnClose: (() => void) | null = null;

/** What is on screen — the route to restore if a guard refuses a Back. */
let painted: PrintRoute = null;

function paint(route: PrintRoute): void {
  const portal = ensurePortal();
  painted = route;
  if (route === null) {
    render(null, portal);
    return;
  }
  if (route.view === 'plates') {
    render(
      <PlatesPanel
        onClose={() => closePrintUI()}
        onOpenPlate={openPlateDialog}
        onOpenProject={openProjectPlanner}
        onOpenSettings={() => openSettingsPanel(() => openPlatesPanel(true), true)}
      />,
      portal,
    );
    return;
  }
  if (route.view === 'project') {
    const { projectId } = route;
    render(
      <ProjectPlanner
        projectId={projectId}
        onClose={() => closePrintUI()}
        onOpenPlate={openPlateDialog}
        onOpenPlates={() => openPlatesPanel()}
        onOpenSettings={() => openSettingsPanel(() => openProjectPlanner(projectId, true), true)}
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
        onClose={() => closePrintUI()}
        onOpenSettings={() => openSettingsPanel(() => openPlateDialog(plateId, true), true)}
      />,
      portal,
    );
    return;
  }
  render(<SettingsPanel onClose={() => (settingsOnClose ?? closePrintUI)()} />, portal);
}

export function openPlatesPanel(replace = false): void {
  settingsOnClose = null;
  navigate({ view: 'plates' }, replace);
  paint({ view: 'plates' });
}

export function openPlateDialog(plateId: string, replace = false): void {
  settingsOnClose = null;
  navigate({ view: 'plate', plateId }, replace);
  paint({ view: 'plate', plateId });
}

export function openProjectPlanner(projectId: string, replace = false): void {
  settingsOnClose = null;
  navigate({ view: 'project', projectId }, replace);
  paint({ view: 'project', projectId });
}

export function openSettingsPanel(onClose?: () => void, replace = false): void {
  settingsOnClose = onClose ?? null;
  navigate({ view: 'settings' }, replace);
  paint({ view: 'settings' });
}

export function closePrintUI(): void {
  settingsOnClose = null;
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
    paint(readRoute());
  });
  const route = readRoute();
  if (route) paint(route);
}
