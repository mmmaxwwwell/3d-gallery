// SPDX-License-Identifier: MIT
// Switching the open project. The store keeps exactly one project open; this
// is the one place that asks before an unsaved one with something on it is
// dropped to make room for another.

import {
  createProject,
  filledPlateCount,
  getActiveProjectId,
  getProject,
  setCurrentProject,
  UNTITLED_PROJECT,
  type Project,
} from './plate-store.js';

async function mayDropCurrent(): Promise<boolean> {
  const id = getActiveProjectId();
  const current = id ? await getProject(id) : undefined;
  if (!current?.draft) return true;
  const filled = await filledPlateCount(current.id);
  if (filled === 0) return true;
  return confirm(
    `“${current.name}” isn't saved. Replace it and lose its ${filled} plate${filled === 1 ? '' : 's'}?`,
  );
}

/** Open a saved project. False when the operator chose to keep the unsaved one. */
export async function openProject(id: string): Promise<boolean> {
  if (id === getActiveProjectId()) return true;
  if (!(await mayDropCurrent())) return false;
  await setCurrentProject(id);
  return true;
}

/**
 * Open a new, unsaved project, `fill`ed before it becomes the open one. Null
 * when the operator chose to keep the unsaved one.
 */
export async function openNewProject(
  name = UNTITLED_PROJECT,
  fill?: (project: Project) => Promise<void>,
): Promise<Project | null> {
  if (!(await mayDropCurrent())) return null;
  const project = await createProject(name, true);
  await fill?.(project);
  await setCurrentProject(project.id);
  return project;
}
