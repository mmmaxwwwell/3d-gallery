// SPDX-License-Identifier: MIT
import { syncFromServerOnce } from './server-store.js';
import { operatorUrl, printersUrl, projectUrl, SETTINGS_PATH } from '../shell/views.js';

/**
 * The print panels the gallery used to answer are pages of their own now, and
 * each old query forwards there. `main.ts` excludes these names from the
 * customizer's parameter sweep, so they never reach a model as a param.
 */

/** Query names this module owns. Exported so the gallery router can skip them. */
export const PRINT_ROUTE_PARAMS = ['projects', 'plate', 'project', 'dispatch', 'operator', 'settings'] as const;

/** Where a panel query on the gallery now lives, in the precedence the panels were read in; null if none. */
function movedTo(params: URLSearchParams): string | null {
  const base = import.meta.env.BASE_URL;
  const operatorId = params.get('operator');
  if (operatorId) return operatorUrl(operatorId);
  const plateId = params.get('plate');
  if (plateId) return `${base}project/?${new URLSearchParams({ plate: plateId })}`;
  const projectId = params.get('project');
  if (projectId) return projectUrl(projectId);
  const dispatchId = params.get('dispatch');
  if (dispatchId) return printersUrl(dispatchId);
  if (params.get('settings')) return base + SETTINGS_PATH;
  if (params.get('projects')) return `${base}project/`;
  return null;
}

/**
 * Forward a moved panel's link to its page. Call once, after the gallery has
 * booted.
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
}
