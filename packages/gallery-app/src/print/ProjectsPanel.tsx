// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
//
// Saved projects: open one, rename it, delete it, or start a new one. The
// plates themselves live on the project view — this is only the shelf.
import { useEffect, useState } from 'preact/hooks';
import { Modal } from './Modal.js';
import {
  deleteProject,
  getActiveProjectId,
  listPlates,
  listProjects,
  saveProject,
  type Project,
} from './plate-store.js';
import { openNewProject, openProject } from './current-project.js';

export interface ProjectsPanelProps {
  /** Back to the open project. */
  onClose: () => void;
  /** Shows a project that has just become the open one. */
  onOpenProject: (projectId: string) => void;
  /** Opens the OrcaSlicer preset panel; closing it returns here. */
  onOpenSettings: () => void;
}

type Row = { project: Project; plates: number };

export function ProjectsPanel({ onClose, onOpenProject, onOpenSettings }: ProjectsPanelProps) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const openId = getActiveProjectId();

  const refresh = async () => {
    const projects = (await listProjects()).filter((p) => !p.draft);
    setRows(await Promise.all(projects.map(async (project) => ({ project, plates: (await listPlates(project.id)).length }))));
  };
  useEffect(() => { void refresh(); }, []);

  const guard = (body: () => Promise<void>) => () => {
    setError('');
    body().catch((err) => setError(err instanceof Error ? err.message : String(err)));
  };

  const commitName = async (project: Project) => {
    const name = (drafts[project.id] ?? '').trim();
    setDrafts(({ [project.id]: _, ...rest }) => rest);
    if (!name || name === project.name) return;
    await saveProject({ ...project, name });
    await refresh();
  };

  const handleOpen = (project: Project) => guard(async () => {
    if (await openProject(project.id)) onOpenProject(project.id);
  });

  const handleNew = guard(async () => {
    const project = await openNewProject();
    if (project) onOpenProject(project.id);
  });

  const handleDelete = (row: Row) => guard(async () => {
    const warning = row.plates === 0
      ? `Delete “${row.project.name}”?`
      : `Delete “${row.project.name}” and its ${row.plates} plate${row.plates === 1 ? '' : 's'}?`;
    if (!confirm(warning)) return;
    await deleteProject(row.project.id);
    await refresh();
  });

  return (
    <Modal title="Projects" onClose={onClose}>
      <div class="plates-panel-toolbar">
        <button type="button" class="btn btn-secondary" onClick={onOpenSettings} title="Import and manage OrcaSlicer presets">
          <span aria-hidden="true">⚙️</span> Print settings
        </button>
        <button type="button" class="btn btn-primary" onClick={handleNew}>New project</button>
      </div>
      {error && <p class="pd-notice is-bad">{error}</p>}
      {rows !== null && rows.length === 0 ? (
        <p class="plate-empty">No saved projects yet. Save the open one from its project view.</p>
      ) : (
        <ul class="projects-list">
          {(rows ?? []).map((row) => (
            <li key={row.project.id} class={`project-row${row.project.id === openId ? ' is-active' : ''}`}>
              <input
                class="project-row-name"
                aria-label="Project name"
                value={drafts[row.project.id] ?? row.project.name}
                onInput={(e) => setDrafts((prev) => ({ ...prev, [row.project.id]: (e.target as HTMLInputElement).value }))}
                onBlur={() => void commitName(row.project)}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              />
              <span class="project-row-meta">{row.plates} plate{row.plates === 1 ? '' : 's'}</span>
              <button type="button" class="btn project-row-open" onClick={handleOpen(row.project)}>
                {row.project.id === openId ? 'Open now' : 'Open'}
              </button>
              <button
                type="button"
                class="btn btn-secondary project-row-delete"
                title="Delete this project and its plates"
                onClick={handleDelete(row)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
