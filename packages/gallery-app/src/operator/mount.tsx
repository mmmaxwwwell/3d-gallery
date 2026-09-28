// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { render } from 'preact';
import { mountShell } from '../shell/shell.js';
import { registerServiceWorker } from '../shell/pwa.js';
import { lastOpen } from '../shell/last-open.js';
import { setBadge } from '../shell/badges.js';
import { operatorUrl, projectUrl, viewById } from '../shell/views.js';
import { getActiveProjectId } from '../print/plate-store.js';
import { syncFromServerOnce } from '../print/server-store.js';
import { latestPlanProject, loadPlanSnapshot } from '../print/plan-snapshot.js';
import { NoPlan, OperatorApp } from './operator-app.js';
import { pickProject } from './pick-project.js';
import './operator.css';

export function mountOperator(): void {
  registerServiceWorker();
  // The runbook reaches the printers through their presets, and the optional
  // server store may hold newer ones.
  void syncFromServerOnce();
  let id = new URLSearchParams(location.search).get('id');
  if (!id) {
    // Read before mountShell, which records this bare URL as the last one.
    id = pickProject({
      lastOperatorUrl: lastOpen('operator'),
      activeProjectId: getActiveProjectId(),
      latestPlanned: latestPlanProject(),
      hasPlan: (projectId) => loadPlanSnapshot(projectId) !== null,
    });
    // The id goes in the URL so a reload, a share and the tab all land on it.
    if (id) history.replaceState(history.state, '', operatorUrl(id) + location.hash);
  }
  mountShell(document.getElementById('shell-nav')!, 'operator');
  const page = document.getElementById('page')!;
  if (!id) {
    setBadge('operator', null);
    render(<NoPlan projectHref={import.meta.env.BASE_URL + viewById('project').path} />, page);
    return;
  }
  const projectId = id;
  render(<OperatorApp projectId={projectId} onOpenPlanner={() => location.assign(projectUrl(projectId))} />, page);
}
