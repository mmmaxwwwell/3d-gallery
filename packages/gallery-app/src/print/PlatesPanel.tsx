// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import { Modal } from './Modal.js';
import {
  createPlate,
  createProject,
  deletePlate,
  deleteProject,
  getActivePlateId,
  getActiveProjectId,
  listPlates,
  listProjects,
  newId,
  nextPlateName,
  savePlate,
  saveProject,
  setActivePlateId,
  setActiveProjectId,
  type Plate,
  type Project,
} from './plate-store.js';
import { listPresets, type PrintPreset } from './print-storage.js';
import { flattenPresetForSlicer } from './preset-flatten.js';
import { resolvePlate } from './plate-resolve.js';
import { evaluateAuthoredPlateFit, printerBedFromConfig } from '@3d-gallery/print-toolkit';
import { buildInstances, toFootprints } from './plate-geometry.js';

export interface PlatesPanelProps {
  onClose: () => void;
  /** Opens the print dialog for a plate. */
  onOpenPlate: (plateId: string) => void;
  /** Opens the planner that slices, schedules and sends a project's plates. */
  onOpenProject: (projectId: string) => void;
  /** Opens the OrcaSlicer preset panel; closing it returns here. */
  onOpenSettings: () => void;
}

type FitState =
  | { status: 'loading' }
  | { status: 'ready'; fitting: string[]; size: string | null }
  | { status: 'error'; message: string };

/** Fit depends on the geometry and the arrangement, so a rename must not
 *  invalidate a result that took a full resolve to produce — but a move must. */
function fitSignature(plate: Plate): string {
  const items = plate.items.map((i) => `${i.key}x${i.qty}`).join('|');
  return `${items}#${JSON.stringify(plate.transforms ?? {})}`;
}

function mm(value: number): string {
  return String(Math.round(value * 10) / 10);
}

function objectCount(plate: Plate): number {
  return plate.items.reduce((n, i) => n + i.qty, 0);
}

async function computeFit(plate: Plate, printers: PrintPreset[]): Promise<FitState> {
  try {
    const report = await resolvePlate(plate);
    const footprints = toFootprints(buildInstances(plate, report.objects));
    const fitting: string[] = [];
    let size: string | null = null;
    for (const preset of printers) {
      const bed = printerBedFromConfig(flattenPresetForSlicer(preset));
      if (!bed) continue;
      const fit = evaluateAuthoredPlateFit(footprints, bed);
      if (fit.status !== 'blocked') fitting.push(preset.name);
      if (!size && fit.bounds) {
        size = `${mm(fit.bounds.width)} × ${mm(fit.bounds.depth)} × ${mm(fit.bounds.height)} mm`;
      }
    }
    return { status: 'ready', fitting, size };
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}

export function PlatesPanel({ onClose, onOpenPlate, onOpenProject, onOpenSettings }: PlatesPanelProps) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectId, setProjectId] = useState<string | null>(getActiveProjectId());
  const [plates, setPlates] = useState<Plate[]>([]);
  const [printers, setPrinters] = useState<PrintPreset[] | null>(null);
  const [activePlate, setActivePlate] = useState<string | null>(getActivePlateId());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [fits, setFits] = useState<Record<string, FitState>>({});
  const fitCache = useRef(new Map<string, FitState>());

  const selectProject = (id: string | null) => {
    setProjectId(id);
    setActiveProjectId(id);
  };

  const refreshProjects = async (): Promise<Project[]> => {
    const rows = await listProjects();
    setProjects(rows);
    // Keep the selection pointing at something real — a delete, or a first
    // visit with plates adopted by the v3 migration, both land here.
    const next = projectId && rows.some((p) => p.id === projectId) ? projectId : rows[0]?.id ?? null;
    if (next !== projectId) selectProject(next);
    return rows;
  };

  const refreshPlates = async (id: string | null) => {
    setPlates(id ? await listPlates(id) : []);
  };

  useEffect(() => {
    void refreshProjects();
    void listPresets('printer').then(setPrinters);
  }, []);

  useEffect(() => { void refreshPlates(projectId); }, [projectId]);

  // Resolving every plate is expensive, so it runs after first paint, one
  // plate at a time, filling rows in as results land.
  useEffect(() => {
    if (printers === null) return;
    let cancelled = false;
    void (async () => {
      for (const plate of plates) {
        const key = fitSignature(plate);
        const cached = fitCache.current.get(key);
        if (cached) {
          setFits((prev) => ({ ...prev, [plate.id]: cached }));
          continue;
        }
        setFits((prev) => ({ ...prev, [plate.id]: { status: 'loading' } }));
        const state = await computeFit(plate, printers);
        if (cancelled) return;
        fitCache.current.set(key, state);
        setFits((prev) => ({ ...prev, [plate.id]: state }));
      }
    })();
    return () => { cancelled = true; };
  }, [plates, printers]);

  const takeDraft = (id: string): string | undefined => {
    const draft = drafts[id];
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    return draft;
  };

  const commitProjectName = async (project: Project) => {
    const name = (takeDraft(project.id) ?? '').trim();
    if (!name || name === project.name) return;
    await saveProject({ ...project, name });
    await refreshProjects();
  };

  const commitPlateName = async (plate: Plate) => {
    const name = (takeDraft(plate.id) ?? '').trim();
    if (!name || name === plate.name) return;
    await savePlate({ ...plate, name });
    await refreshPlates(projectId);
  };

  const handleNewProject = async () => {
    const project = await createProject('New project');
    await refreshProjects();
    selectProject(project.id);
  };

  const handleDeleteProject = async (project: Project) => {
    const plateCount = (await listPlates(project.id)).length;
    const warning = plateCount === 0
      ? `Delete “${project.name}”?`
      : `Delete “${project.name}” and its ${plateCount} plate${plateCount === 1 ? '' : 's'}?`;
    if (!confirm(warning)) return;
    await deleteProject(project.id);
    await refreshProjects();
  };

  const handleNewPlate = async () => {
    if (!projectId) return;
    const plate = await createPlate(await nextPlateName(projectId), projectId);
    setActivePlateId(plate.id);
    setActivePlate(plate.id);
    await refreshPlates(projectId);
  };

  const handleDuplicate = async (plate: Plate) => {
    const copy = await createPlate(`${plate.name} (copy)`, plate.projectId);
    // Fresh item ids, so the arrangement has to be re-keyed to match or the
    // copy would open with everything unplaced.
    const remap = new Map(plate.items.map((i) => [i.id, newId()]));
    const transforms: Plate['transforms'] = {};
    for (const [id, transform] of Object.entries(plate.transforms ?? {})) {
      const [itemId, copyIndex] = [id.slice(0, id.lastIndexOf(':')), id.slice(id.lastIndexOf(':') + 1)];
      const next = remap.get(itemId);
      if (next) transforms[`${next}:${copyIndex}`] = transform;
    }
    await savePlate({
      ...copy,
      items: plate.items.map((i) => ({ ...i, id: remap.get(i.id) ?? newId() })),
      transforms,
    });
    await refreshPlates(projectId);
  };

  const handleDeletePlate = async (plate: Plate) => {
    await deletePlate(plate.id);
    if (getActivePlateId() === plate.id) {
      setActivePlateId(null);
      setActivePlate(null);
    }
    await refreshPlates(projectId);
  };

  const makeActive = (plate: Plate) => {
    setActivePlateId(plate.id);
    setActivePlate(plate.id);
  };

  const renderFit = (plate: Plate) => {
    const fit = fits[plate.id];
    if (!fit || fit.status === 'loading') {
      return <div class="plate-row-fit">Checking fit…</div>;
    }
    if (fit.status === 'error') {
      return <div class="plate-row-fit is-blocked">Could not check fit: {fit.message}</div>;
    }
    if (printers !== null && printers.length === 0) {
      return (
        <div class="plate-row-fit">
          No printers imported —{' '}
          <button type="button" class="plate-row-fit-link" onClick={onOpenSettings}>
            import presets
          </button>
        </div>
      );
    }
    const size = fit.size ? <span class="plate-row-size"> · {fit.size}</span> : null;
    if (fit.fitting.length === 0) {
      return <div class="plate-row-fit is-blocked">No printer fits this plate{size}</div>;
    }
    return <div class="plate-row-fit">Fits: {fit.fitting.join(', ')}{size}</div>;
  };

  const selected = projects?.find((p) => p.id === projectId) ?? null;

  return (
    <Modal title="Projects & plates" onClose={onClose}>
      <div class="plates-panel-toolbar">
        <button
          type="button"
          class="btn btn-secondary"
          onClick={onOpenSettings}
          title="Import and manage OrcaSlicer presets"
        >
          <span aria-hidden="true">⚙️</span> Print settings
        </button>
      </div>
      <div class="plates-panel">
        <section class="plates-pane">
          <div class="plates-pane-title">Projects</div>
          {projects !== null && projects.length === 0 ? (
            <p class="plate-empty">No projects yet.</p>
          ) : (
            <ul class="projects-list">
              {(projects ?? []).map((project) => (
                <li
                  key={project.id}
                  class={`project-row${project.id === projectId ? ' is-active' : ''}`}
                  onClick={() => selectProject(project.id)}
                >
                  <input
                    class="project-row-name"
                    aria-label="Project name"
                    value={drafts[project.id] ?? project.name}
                    onInput={(e) =>
                      setDrafts((prev) => ({ ...prev, [project.id]: (e.target as HTMLInputElement).value }))
                    }
                    onBlur={() => void commitProjectName(project)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                  />
                  <button
                    type="button"
                    class="btn btn-secondary project-row-delete"
                    title="Delete this project and its plates"
                    onClick={() => void handleDeleteProject(project)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" class="btn" onClick={() => void handleNewProject()}>
            New project
          </button>
        </section>

        <section class="plates-pane">
          <div class="plates-pane-title">
            Plates{selected ? ` — ${selected.name}` : ''}
            {selected && plates.length > 0 && (
              <button type="button" class="btn btn-primary plates-pane-plan" onClick={() => onOpenProject(selected.id)}>
                Plan &amp; print
              </button>
            )}
          </div>

          {!selected ? (
            <p class="plate-empty">Create a project to hold your plates.</p>
          ) : plates.length === 0 ? (
            <p class="plate-empty">
              No plates in this project. Add one, then use “Add to plate” on a part to fill it.
            </p>
          ) : (
            <ul class="plates-list">
              {plates.map((plate) => (
                <li
                  key={plate.id}
                  class={`plate-row${plate.id === activePlate ? ' is-active' : ''}`}
                  onClick={() => makeActive(plate)}
                >
                  <input
                    class="plate-row-name"
                    aria-label="Plate name"
                    value={drafts[plate.id] ?? plate.name}
                    onInput={(e) =>
                      setDrafts((prev) => ({ ...prev, [plate.id]: (e.target as HTMLInputElement).value }))
                    }
                    onBlur={() => void commitPlateName(plate)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                  />
                  <div class="plate-row-meta">
                    {plate.items.length} {plate.items.length === 1 ? 'part' : 'parts'} ·{' '}
                    {objectCount(plate)} {objectCount(plate) === 1 ? 'object' : 'objects'}
                  </div>
                  <div class="plate-row-actions">
                    <button type="button" class="btn btn-primary" onClick={() => onOpenPlate(plate.id)}>
                      Open
                    </button>
                    <button type="button" class="btn" onClick={() => void handleDuplicate(plate)}>
                      Duplicate
                    </button>
                    <button type="button" class="btn" onClick={() => void handleDeletePlate(plate)}>
                      Delete
                    </button>
                  </div>
                  {renderFit(plate)}
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            class="btn btn-primary"
            onClick={() => void handleNewPlate()}
            disabled={!selected}
          >
            New plate
          </button>
          {selected && plates.length > 0 && (
            <p class="plates-pane-hint">
              “Add to plate” drops parts on the highlighted plate. Click another to switch.
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}
