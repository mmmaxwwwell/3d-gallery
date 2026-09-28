// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { render } from 'preact';
import { PrintDispatch } from './PrintDispatch.js';
import { syncFromServerOnce } from './server-store.js';
import { operatorUrl, projectUrl, SETTINGS_PATH } from '../shell/views.js';

/**
 * What is left of the print UI over the gallery: the printers screen, at
 * `?dispatch=<id>`, until it moves to the Printers page. It renders into a
 * portal div appended to <body>, so the imperative host (`src/main.ts`)
 * doesn't need to hold a Preact ref.
 *
 * Every other panel the gallery used to answer is a page of its own now, and
 * its old query forwards there. `main.ts` excludes these names from the
 * customizer's parameter sweep, so they never reach a model as a param.
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

/** Query names this module owns. Exported so the gallery router can skip them. */
export const PRINT_ROUTE_PARAMS = ['projects', 'plate', 'project', 'dispatch', 'operator', 'settings'] as const;

/** Where a panel query on the gallery now lives, in the precedence the panels were read in; null if it's still here. */
function movedTo(params: URLSearchParams): string | null {
  const base = import.meta.env.BASE_URL;
  const operatorId = params.get('operator');
  if (operatorId) return operatorUrl(operatorId);
  const plateId = params.get('plate');
  if (plateId) return `${base}project/?${new URLSearchParams({ plate: plateId })}`;
  const projectId = params.get('project');
  if (projectId) return projectUrl(projectId);
  if (params.get('dispatch')) return null;
  if (params.get('settings')) return base + SETTINGS_PATH;
  if (params.get('projects')) return `${base}project/`;
  return null;
}

function readDispatch(): string | null {
  return new URLSearchParams(window.location.search).get('dispatch');
}

function paint(projectId: string | null): void {
  const portal = ensurePortal();
  if (projectId === null) {
    render(null, portal);
    return;
  }
  render(
    <PrintDispatch
      key={projectId}
      projectId={projectId}
      onClose={() => closePrintUI()}
      onOpenPlanner={() => window.location.assign(projectUrl(projectId))}
    />,
    portal,
  );
}

function closePrintUI(): void {
  const url = new URL(window.location.href);
  for (const name of PRINT_ROUTE_PARAMS) url.searchParams.delete(name);
  const path = url.pathname + url.search;
  if (window.location.pathname + window.location.search !== path) {
    history.pushState({ ...(history.state ?? {}), print: null }, '', path);
  }
  paint(null);
}

/**
 * Forward a moved panel's link to its page, or open the printers screen the
 * URL names and keep doing so as the user moves through history. Call once,
 * after the gallery has booted.
 */
export function initPrintRouting(): void {
  const target = movedTo(new URLSearchParams(window.location.search));
  if (target) {
    window.location.replace(target);
    return;
  }
  // Adopt anything added to the optional server store since the last load —
  // including records an agent created over MCP. No-op unless the user has
  // opted in, and failures are swallowed so the local-first path always works.
  void syncFromServerOnce();

  window.addEventListener('popstate', () => paint(readDispatch()));
  const projectId = readDispatch();
  if (projectId) paint(projectId);
}
