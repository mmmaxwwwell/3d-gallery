// SPDX-License-Identifier: MIT
// Which project the Operator page opens when its URL names none: a bare
// /operator/ link, or the tab before any runbook was opened.

export interface ProjectCandidates {
  /** The URL the Operator view was last left at. */
  lastOperatorUrl: string | null;
  /** The project open in Project. */
  activeProjectId: string | null;
  /** The project whose plan was kept last. */
  latestPlanned: string | null;
  hasPlan: (projectId: string) => boolean;
}

/**
 * The runbook last open, else the project open in Project, as long as it has
 * a plan to run; else whichever project was planned last; else none. A plan
 * is what the runbook shows, so a project without one only wins when it was
 * asked for by id.
 */
export function pickProject({ lastOperatorUrl, activeProjectId, latestPlanned, hasPlan }: ProjectCandidates): string | null {
  const last = lastOperatorUrl ? new URL(lastOperatorUrl, 'http://x').searchParams.get('id') : null;
  for (const id of [last, activeProjectId]) if (id && hasPlan(id)) return id;
  return latestPlanned;
}
