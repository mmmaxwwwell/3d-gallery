// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
//
// The project view: the open project's plates, and the one screen for
// turning them into prints. There is always an open project — an unsaved
// draft until it is saved — and "Add to project" drops parts on the plate
// picked here.
//
// Desktop shows three panes at once — the plates on the left, the timeline
// top right, the printers bottom right — under a summary of the whole job
// that every change recomputes. A phone shows the same panes one at a time.
// Plates slice on their own, in the background, for whichever printer the
// timeline gives them — a re-plan that moves a plate slices it again. The way
// out is Send to printers, which stays shut until every plate is sliced for
// its printer and the timeline is clean, and hands the plan to the printers
// screen (PrintDispatch), where it's uploaded and started.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  evaluateAuthoredPlateFit,
  fetchPrintStatus,
  printerBedFromConfig,
  type OperatorBlock,
  type PlateFootprint,
  type PrintStatus,
  type Schedule,
  type ScheduleObjective,
  type SchedulePrinter,
} from '@3d-gallery/print-toolkit';
import { materialFamily } from '@3d-gallery/model-core';
import { Modal } from './Modal.js';
import { listPresets, type PrintPreset } from './print-storage.js';
import { flattenPresetForSlicer } from './preset-flatten.js';
import { resolvePlate } from './plate-resolve.js';
import { buildInstances, toFootprints } from './plate-geometry.js';
import {
  createPlate,
  currentProject,
  deletePlate,
  duplicatePlate,
  getActivePlateId,
  getProject,
  listPlates,
  listSlicedGcode,
  nextPlateName,
  plateSignature,
  putSlicedGcode,
  savePlate,
  saveProject,
  setActivePlateId,
  type Plate,
  type Project,
  type SlicedGcode,
} from './plate-store.js';
import { openNewProject, openProject } from './current-project.js';
import { DEFAULT_BED_SURFACE, processFromProfile, slicePlate, type SliceSetup } from './plate-slice.js';
import { listTemplates, type ProcessSettings } from './process-templates.js';
import { loadLastSelections } from './PrintDialog.js';
import { formatWhen, loadPlannerSettings, operatorBlocks, planFleet, savePlannerSettings, type PlannerSettings } from './fleet-plan.js';
import {
  collisions,
  formatDuration,
  freshSlices,
  gcodeName,
  isReady,
  loadEstimates,
  plateFilament,
  plateGrams,
  plateMaterial,
  plateNumbers,
  plateSeconds,
  readiness,
  scheduleJobs,
  sliceSetupKey,
  type Estimates,
  type Measured,
} from './planner-model.js';
import { plateThumbnail } from './plate-thumbnail.js';
import { PlannerGantt } from './PlannerGantt.js';
import { getDaemon, hasDispatch } from './dispatch-daemon.js';
import type { DispatchJob } from './dispatch-model.js';

export interface ProjectPlannerProps {
  projectId: string;
  onClose: () => void;
  onOpenPlate: (plateId: string) => void;
  onOpenProjects: () => void;
  /** Shows another project, once it has become the open one. */
  onShowProject: (projectId: string) => void;
  onOpenSettings: () => void;
  onOpenDispatch: () => void;
}

type StatusState = PrintStatus | { error: string } | 'loading';
type Geometry = { footprints: PlateFootprint[]; thumb: string | null } | { failed: string };
type Tab = 'plates' | 'timeline' | 'printers';

/** The single-printer yardstick: one machine, every plate in turn. */
const ONE_PRINTER = '__one';

function filamentFamily(preset: PrintPreset): string | undefined {
  const type = flattenPresetForSlicer(preset)['filament_type']?.split(';')[0];
  return type ? materialFamily(type) : undefined;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Open `project` and return its id, or the id of the project that stays open. */
async function openCurrentOr(project: Project | undefined): Promise<string> {
  if (project && await openProject(project.id)) return project.id;
  return (await currentProject()).id;
}

// ── Component ────────────────────────────────────────────

export function ProjectPlanner({ projectId, onClose, onOpenPlate, onOpenProjects, onShowProject, onOpenSettings, onOpenDispatch }: ProjectPlannerProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [plates, setPlates] = useState<Plate[] | null>(null);
  const [targetPlate, setTargetPlate] = useState<string | null>(getActivePlateId);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [printers, setPrinters] = useState<PrintPreset[]>([]);
  const [filaments, setFilaments] = useState<PrintPreset[]>([]);
  const [estimates, setEstimates] = useState<Estimates | null>(null);
  const [slices, setSlices] = useState<Record<string, SlicedGcode[]>>({});
  const [geometry, setGeometry] = useState<Record<string, Geometry>>({});
  const [statuses, setStatuses] = useState<Record<string, StatusState>>({});
  const [settings, setSettingsState] = useState<PlannerSettings>(loadPlannerSettings);
  // The plate editor writes these; it replaces this screen, so reading them once is current.
  const [selections] = useState(loadLastSelections);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [slicing, setSlicing] = useState<{ plateId: string; pct: number } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [draftAway, setDraftAway] = useState({ start: '', end: '' });
  const [tab, setTab] = useState<Tab>('plates');
  const [timelineView, setTimelineView] = useState<'chart' | 'trips'>('chart');
  const [hovered, setHovered] = useState<string | null>(null);
  /** `plateId|printerId|setupKey` → why slicing it failed. Auto-slicing skips these until the Slice button retries. */
  const [sliceFailed, setSliceFailed] = useState<Record<string, string>>({});
  const [sent] = useState(() => hasDispatch(projectId));

  const setSettings = (patch: Partial<PlannerSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      savePlannerSettings(next);
      return next;
    });
  };

  // The plan starts "now", so it keeps up with the clock.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [proj, rows, p, f, est] = await Promise.all([
          getProject(projectId),
          listPlates(projectId),
          listPresets('printer'),
          listPresets('filament'),
          loadEstimates(),
        ]);
        // A URL can name a project that isn't the open one (history, a
        // deleted draft); showing it means opening it, or going back to the one that is.
        const current = await openCurrentOr(proj);
        if (current !== projectId) { onShowProject(current); return; }
        setProject(proj!);
        setPrinters(p);
        setFilaments(f);
        setEstimates(est);
        await showPlates(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [projectId]);

  const showPlates = async (rows: Plate[]) => {
    const kept = await Promise.all(rows.map(async (plate) => [plate.id, await listSlicedGcode(plate.id)] as const));
    setSlices(Object.fromEntries(kept));
    setPlates(rows);
  };
  const reloadPlates = async () => showPlates(await listPlates(projectId));

  const refreshStatuses = () => {
    for (const printer of printers) {
      if (!printer.address) continue;
      setStatuses((prev) => ({ ...prev, [printer.id]: 'loading' }));
      fetchPrintStatus(printer.address)
        .then((status) => setStatuses((prev) => ({ ...prev, [printer.id]: status })))
        .catch((err: unknown) => setStatuses((prev) => ({
          ...prev,
          [printer.id]: { error: err instanceof Error ? err.message : String(err) },
        })));
    }
    setNow(Date.now());
  };
  useEffect(refreshStatuses, [printers]);

  // Each plate's footprint (for bed fit) and thumbnail. Resolving meshes is
  // the slow part, so a plate is only resolved again once its arrangement changes.
  const geometryCache = useRef(new Map<string, Geometry>());
  useEffect(() => {
    if (!plates) return;
    let cancelled = false;
    void (async () => {
      for (const plate of plates) {
        const signature = plateSignature(plate);
        let entry = geometryCache.current.get(signature);
        if (entry) {
          setGeometry((prev) => ({ ...prev, [plate.id]: entry! }));
          continue;
        }
        try {
          const report = await resolvePlate(plate);
          const instances = buildInstances(plate, report.objects);
          entry = { footprints: toFootprints(instances), thumb: plateThumbnail(plateSignature(plate), instances) };
        } catch (err) {
          entry = { failed: err instanceof Error ? err.message : String(err) };
        }
        if (cancelled) return;
        geometryCache.current.set(signature, entry);
        setGeometry((prev) => ({ ...prev, [plate.id]: entry! }));
      }
    })();
    return () => { cancelled = true; };
  }, [plates]);

  const enabledPrinters = printers.filter((p) => settings.enabled[p.id] !== false);
  /** Plates with something on them. An empty plate waits for "Add to project"; it isn't planned or sliced. */
  const printable = useMemo(() => (plates ?? []).filter((p) => p.items.length > 0), [plates]);
  const plateById = useMemo(() => new Map((plates ?? []).map((p) => [p.id, p])), [plates]);
  const printerById = useMemo(() => new Map(printers.map((p) => [p.id, p])), [printers]);
  const materials = useMemo(() => [...new Set(printable.map(plateMaterial))].sort(), [printable]);

  /** Which printers each plate physically fits. A plate whose geometry
   *  couldn't be resolved is left unconstrained, and slicing will say. */
  const fits = useMemo(() => {
    const beds = printers
      .map((p) => ({ id: p.id, bed: printerBedFromConfig(flattenPresetForSlicer(p)) }))
      .filter((b) => b.bed);
    const out: Record<string, string[]> = {};
    for (const [plateId, g] of Object.entries(geometry)) {
      if ('footprints' in g) {
        out[plateId] = beds.filter((b) => evaluateAuthoredPlateFit(g.footprints, b.bed!).status !== 'blocked').map((b) => b.id);
      }
    }
    return out;
  }, [geometry, printers]);

  const filamentFor = (family: string): PrintPreset | undefined =>
    filaments.find((f) => f.id === settings.filaments[family])
    ?? filaments.find((f) => filamentFamily(f) === family);

  const procFor = (plate: Plate): ProcessSettings => {
    const template = listTemplates().find((t) => t.id === selections.templateId) ?? listTemplates()[0];
    return plate.profile ? processFromProfile(plate.profile) : selections.processOverride ?? template.settings;
  };

  /** How `plate` would be sliced on `printer`, or why it can't be. */
  const setupFor = (plate: Plate, printer: PrintPreset): SliceSetup | { problem: string } => {
    const family = plateMaterial(plate);
    const filament = filamentFor(family);
    if (!filament) return { problem: `No ${family} filament preset — import one, or pick one under Printers.` };
    return {
      printer,
      filament,
      proc: procFor(plate),
      layerHeight: selections.layerHeight ?? '0.20',
      bedSurface: selections.bedSurface ?? DEFAULT_BED_SURFACE,
      preheat: selections.preheat ?? true,
      centerOnBed: selections.centerOnBed ?? true,
      clearExclusionZones: selections.clearExclusionZones ?? false,
    };
  };

  /** plateId → printerId → the setup key a slice must carry to count, or null. */
  const setupKeys = useMemo(() => {
    const out: Record<string, Record<string, string | null>> = {};
    for (const plate of plates ?? []) {
      out[plate.id] = {};
      for (const printer of printers) {
        const setup = setupFor(plate, printer);
        out[plate.id][printer.id] = 'problem' in setup ? null : sliceSetupKey(setup);
      }
    }
    return out;
  }, [plates, printers, filaments, settings.filaments]);

  const freshIn = (map: Record<string, SlicedGcode[]>, plate: Plate) =>
    freshSlices(plate, map[plate.id], (printerId) => setupKeys[plate.id]?.[printerId] ?? null);

  const unavailable = useMemo<OperatorBlock[]>(
    () => operatorBlocks(settings, now),
    [settings.bedtime, settings.wake, settings.away, now],
  );

  const fleet = useMemo<SchedulePrinter[]>(() => enabledPrinters.map((p) => {
    const status = statuses[p.id];
    // A paused print never finishes on its own; the plan has the operator cancel it on the first trip.
    const remaining = status && status !== 'loading' && 'remainingSec' in status && status.state !== 'paused'
      ? status.remainingSec : 0;
    return { id: p.id, name: p.name, freeAt: now + remaining * 1000, material: settings.loaded[p.id] || undefined };
  }), [enabledPrinters.map((p) => p.id).join(), statuses, settings.loaded, now]);

  const fresh = useMemo(
    () => Object.fromEntries((plates ?? []).map((p) => [p.id, freshIn(slices, p)])),
    [plates, slices, setupKeys],
  );
  const times = useMemo(() => {
    const out: Record<string, Measured | null> = {};
    for (const plate of plates ?? []) out[plate.id] = plateSeconds(plate, fresh[plate.id], estimates);
    return out;
  }, [plates, fresh, estimates]);
  const grams = useMemo(() => {
    const out: Record<string, Measured | null> = {};
    for (const plate of plates ?? []) out[plate.id] = plateGrams(plate, fresh[plate.id], estimates);
    return out;
  }, [plates, fresh, estimates]);

  const plans = useMemo(() => {
    const jobs = scheduleJobs(printable, times, fits);
    if (jobs.length === 0) return null;
    // Bed fit doesn't apply to the yardstick: it stands for any one of the fleet.
    const one = planFleet(
      jobs.map(({ printers: _, ...job }) => job),
      [{ id: ONE_PRINTER, name: 'One printer', freeAt: now }],
      settings, unavailable, now, 'makespan',
    );
    if (fleet.length === 0) return { one, makespan: null, visits: null };
    return {
      one,
      makespan: planFleet(jobs, fleet, settings, unavailable, now, 'makespan'),
      visits: planFleet(jobs, fleet, settings, unavailable, now, 'visits'),
    };
  }, [printable, times, fits, fleet, settings, unavailable, now]);

  const plan = plans?.[settings.objective] ?? null;
  const numbers = useMemo(() => plateNumbers(plan), [plan]);
  const clashes = useMemo(() => collisions(plan), [plan]);
  const jobByPlate = useMemo(() => new Map((plan?.jobs ?? []).map((j) => [j.jobId, j])), [plan]);
  const ordered = [...(plates ?? [])].sort((a, b) =>
    (numbers.get(a.id) ?? Infinity) - (numbers.get(b.id) ?? Infinity));

  /** Where a plate will print: the plan's choice, else the first enabled printer it fits. */
  const targetFor = (plate: Plate, schedule: Schedule | null = plan): PrintPreset | undefined =>
    printerById.get(schedule?.jobs.find((j) => j.jobId === plate.id)?.printerId ?? '')
    ?? enabledPrinters.find((p) => !fits[plate.id] || fits[plate.id].includes(p.id));

  const ready = readiness(
    printable,
    plan,
    enabledPrinters.length,
    (plateId, printerId) => (fresh[plateId] ?? []).some((s) => s.printerId === printerId),
  );

  // ── Actions ────────────────────────────────────────────

  /** Slice `plate` for `printer` and keep it. Returns the updated slice map. */
  const sliceOne = async (
    plate: Plate,
    printer: PrintPreset,
    map: Record<string, SlicedGcode[]>,
    label: string,
  ): Promise<Record<string, SlicedGcode[]>> => {
    const setup = setupFor(plate, printer);
    if ('problem' in setup) throw new Error(`${plate.name}: ${setup.problem}`);
    setBusy(`${label}Slicing ${plate.name} for ${printer.name}…`);
    setSlicing({ plateId: plate.id, pct: 0 });
    const sliced = await slicePlate(plate, setup, (_stage, pct) => setSlicing({ plateId: plate.id, pct }));
    const record = await putSlicedGcode({
      plateId: plate.id,
      printerId: printer.id,
      filamentId: setup.filament.id,
      signature: plateSignature(plate),
      setup: sliceSetupKey(setup),
      gcode: sliced.gcode,
      seconds: sliced.seconds,
      grams: sliced.grams,
      slicedAt: Date.now(),
    });
    const next = { ...map, [plate.id]: [...(map[plate.id] ?? []).filter((s) => s.printerId !== printer.id), record] };
    setSlices(next);
    return next;
  };

  const run = async (what: string, body: () => Promise<void>) => {
    setError('');
    setLog([]);
    try {
      await body();
    } catch (err) {
      setError(`${what} stopped: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
      setSlicing(null);
    }
  };

  const failKey = (plate: Plate, printer: PrintPreset) => `${plate.id}|${printer.id}|${setupKeys[plate.id]?.[printer.id]}`;

  const handleSliceOne = (plate: Plate) => {
    const printer = targetFor(plate);
    if (printer) setSliceFailed(({ [failKey(plate, printer)]: _, ...rest }) => rest);
    void run('Slicing', async () => {
      if (!printer) throw new Error(`${plate.name}: no enabled printer fits it.`);
      await sliceOne(plate, printer, slices, '');
    });
  };

  /**
   * Slicing is local and free, so it doesn't wait to be asked: whenever a
   * plate lacks a fresh slice for the printer the plan gives it, slice it.
   * Each slice lands, re-plans (real times can move a plate), and this runs
   * again until every plate is sliced where the plan puts it. Waits for every
   * plate's footprint, so bed fit has had its say about where it goes.
   */
  useEffect(() => {
    if (busy || !plates || printable.some((p) => !geometry[p.id])) return;
    const todo = ordered
      .filter((plate) => plate.items.length > 0)
      .map((plate) => ({ plate, printer: targetFor(plate) }))
      .find(({ plate, printer }) => printer
        && !('problem' in setupFor(plate, printer))
        && !fresh[plate.id]?.some((s) => s.printerId === printer.id)
        && !sliceFailed[failKey(plate, printer)]);
    if (!todo) return;
    const { plate, printer } = todo as { plate: Plate; printer: PrintPreset };
    void (async () => {
      try {
        await sliceOne(plate, printer, slices, 'Auto · ');
        setLog((prev) => [...prev, `${plate.name}: sliced for ${printer.name}.`]);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setSliceFailed((prev) => ({ ...prev, [failKey(plate, printer)]: message }));
        setError(`Slicing ${plate.name} stopped: ${message}`);
      } finally {
        setBusy(null);
        setSlicing(null);
      }
    })();
  }, [busy, plates, geometry, plan, fresh, sliceFailed]);

  /** Hand the plan to the printers screen: each printer's jobs, in plan order,
   *  with the slice each one sends. Nothing reaches a printer from here. */
  const handleSend = () => {
    if (!plan || !isReady(ready)) return;
    const jobs: DispatchJob[] = plan.jobs.map((job) => {
      const plate = plateById.get(job.jobId)!;
      const slice = fresh[plate.id].find((s) => s.printerId === job.printerId)!;
      const order = numbers.get(job.jobId) ?? 0;
      return {
        plateId: plate.id,
        plateName: plate.name,
        printerId: job.printerId,
        file: gcodeName(order, plate),
        order,
        material: plateMaterial(plate),
        filament: plateFilament(plate),
        seconds: (job.end - job.start) / 1000,
        slicedAt: slice.slicedAt,
      };
    });
    void getDaemon(projectId).then((daemon) => {
      daemon.send(jobs);
      onOpenDispatch();
    });
  };

  // ── Plates and the project itself ──────────────────────

  const edit = (what: string, body: () => Promise<void>) => {
    setError('');
    body().catch((err) => setError(`${what}: ${err instanceof Error ? err.message : String(err)}`));
  };

  /** The plate "Add to project" drops parts on. */
  const selectTarget = (plateId: string | null) => {
    setActivePlateId(plateId);
    setTargetPlate(plateId);
  };

  // "Add to project" falls back to the newest plate when none was picked (ensureTargetPlate).
  const addsTo = plates?.find((p) => p.id === targetPlate)?.id ?? plates?.[0]?.id;

  const handleNewPlate = () => edit('New plate', async () => {
    const plate = await createPlate(await nextPlateName(projectId), projectId);
    selectTarget(plate.id);
    await reloadPlates();
  });

  const handleDuplicate = (plate: Plate) => edit('Duplicate', async () => {
    await duplicatePlate(plate);
    await reloadPlates();
  });

  const handleDeletePlate = (plate: Plate) => edit('Delete', async () => {
    if (plate.items.length > 0 && !confirm(`Delete “${plate.name}”?`)) return;
    await deletePlate(plate.id);
    if (targetPlate === plate.id) selectTarget(null);
    await reloadPlates();
  });

  const handleRenamePlate = (plate: Plate, name: string) => edit('Rename', async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === plate.name) return;
    await savePlate({ ...plate, name: trimmed });
    await reloadPlates();
  });

  const commitProjectName = () => edit('Rename', async () => {
    const name = nameDraft?.trim();
    setNameDraft(null);
    if (!project || !name || name === project.name) return;
    setProject(await saveProject({ ...project, name }));
  });

  const handleSaveProject = () => edit('Save', async () => {
    if (!project) return;
    const name = (nameDraft ?? project.name).trim() || project.name;
    setNameDraft(null);
    const { draft: _, ...saved } = project;
    setProject(await saveProject({ ...saved, name }));
  });

  const handleNewProject = () => edit('New project', async () => {
    const fresh = await openNewProject();
    if (fresh) onShowProject(fresh.id);
  });

  if (error && !project) {
    return <Modal title="Project" onClose={onClose}><p class="plate-empty">{error}</p></Modal>;
  }

  // ── Panes ──────────────────────────────────────────────

  const slicedCount = printable.filter((p) => {
    const job = jobByPlate.get(p.id);
    return job && fresh[p.id].some((s) => s.printerId === job.printerId);
  }).length;

  const summary = (
    <PlannerSummary
      plates={printable}
      times={times}
      grams={grams}
      plans={plans}
      now={now}
      printerCount={fleet.length}
    />
  );

  const platesPane = (
    <section class="planner-pane planner-pane-plates" aria-label="Plates">
      <header class="planner-pane-head">
        <h4>Plates <span class="planner-muted">{slicedCount}/{printable.length} sliced</span></h4>
        <div class="planner-pane-tools">
          <button type="button" class="btn" onClick={handleNewPlate}>New plate</button>
        </div>
      </header>
      <div class="planner-pane-body">
        {plates && plates.length === 0 && (
          <p class="plate-empty">
            Nothing here yet. Use <strong>Add to project</strong> on a part, or <strong>Load project</strong> on a build with print plates.
          </p>
        )}
        <ul class="planner-plates">
          {ordered.map((plate) => (
            <PlateRow
              key={plate.id}
              plate={plate}
              number={numbers.get(plate.id)}
              geometry={geometry[plate.id]}
              time={times[plate.id]}
              grams={grams[plate.id]}
              job={jobByPlate.get(plate.id)}
              target={targetFor(plate)}
              printerById={printerById}
              fresh={fresh[plate.id]}
              kept={slices[plate.id] ?? []}
              fitsNone={fits[plate.id]?.length === 0}
              setup={(printer) => setupFor(plate, printer)}
              proc={procFor(plate)}
              layerHeight={selections.layerHeight ?? '0.20'}
              bedSurface={selections.bedSurface ?? DEFAULT_BED_SURFACE}
              slicingPct={slicing?.plateId === plate.id ? slicing.pct : null}
              clash={clashes.has(plate.id)}
              hovered={hovered === plate.id}
              busy={!!busy}
              now={now}
              onHover={setHovered}
              onEdit={() => onOpenPlate(plate.id)}
              isTarget={plate.id === addsTo}
              onTarget={() => selectTarget(plate.id)}
              onRename={(name) => handleRenamePlate(plate, name)}
              onDuplicate={() => handleDuplicate(plate)}
              onDelete={() => handleDeletePlate(plate)}
              sliceFailed={(() => { const t = targetFor(plate); return t ? sliceFailed[failKey(plate, t)] : undefined; })()}
              onSlice={() => handleSliceOne(plate)}
            />
          ))}
        </ul>
      </div>
    </section>
  );

  const notOnChart = printable.filter((p) => !jobByPlate.has(p.id));
  const timelinePane = (
    <section class="planner-pane planner-pane-timeline" aria-label="Timeline">
      <header class="planner-pane-head">
        <h4>Timeline</h4>
        <div class="planner-pane-tools">
          <div class="planner-seg" role="group" aria-label="Timeline view">
            <button type="button" class={timelineView === 'chart' ? 'is-on' : ''} onClick={() => setTimelineView('chart')}>Chart</button>
            <button type="button" class={timelineView === 'trips' ? 'is-on' : ''} onClick={() => setTimelineView('trips')}>Trips</button>
          </div>
          <label class="planner-inline">
            Optimize for
            <select
              value={settings.objective}
              onChange={(e) => setSettings({ objective: (e.target as HTMLSelectElement).value as ScheduleObjective })}
            >
              <option value="makespan">Lowest wall-clock</option>
              <option value="visits">Fewest operator trips</option>
            </select>
          </label>
        </div>
      </header>
      <div class="planner-pane-body">
        {!plan ? (
          <p class="plate-empty">
            {printers.length === 0
              ? 'No printers yet — add them under Printers.'
              : enabledPrinters.length === 0
                ? 'Every printer is switched off.'
                : plates && plates.length === 0
                  ? 'This project has no plates.'
                  : 'No plate has a print time yet — it will once one is sliced.'}
          </p>
        ) : timelineView === 'chart' ? (
          <>
            <PlannerGantt
              plan={plan}
              now={now}
              printers={enabledPrinters}
              plates={plateById}
              numbers={numbers}
              unavailable={unavailable}
              collisions={clashes}
              hovered={hovered}
              onHover={setHovered}
            />
            <p class="planner-note">Shaded: you're away or asleep. Numbered lines: trips to the printers.</p>
          </>
        ) : (
          <Itinerary
            plan={plan}
            now={now}
            plates={plateById}
            printers={printerById}
            numbers={numbers}
            statuses={statuses}
            swapMin={settings.swapMin}
          />
        )}
        {clashes.size > 0 && (
          <p class="pd-notice is-bad">{plural(clashes.size, 'job')} overlap another on the same printer.</p>
        )}
        {notOnChart.length > 0 && (
          <p class="planner-note">
            Not on the chart: {notOnChart.map((p) => `${p.name} (${
              !times[p.id] ? 'no time yet — slice it' : fits[p.id]?.length === 0 ? 'fits no printer' : 'fits no enabled printer'
            })`).join(', ')}.
          </p>
        )}
      </div>
    </section>
  );

  const allOn = enabledPrinters.length === printers.length;
  const someOn = enabledPrinters.length > 0;
  const printersPane = (
    <section class="planner-pane planner-pane-printers" aria-label="Printers">
      <header class="planner-pane-head">
        <h4>Printers</h4>
        <div class="planner-pane-tools">
          <button type="button" class="btn" onClick={refreshStatuses}>Refresh status</button>
          <button type="button" class="btn" onClick={onOpenSettings}>Edit printers</button>
        </div>
      </header>
      <div class="planner-pane-body">
        {printers.length === 0 ? (
          <p class="plate-empty">
            None yet — <button type="button" class="plate-row-fit-link" onClick={onOpenSettings}>import your OrcaSlicer presets</button>.
          </p>
        ) : (
          <>
            <label class="planner-printer-all">
              <input
                type="checkbox"
                checked={allOn}
                ref={(el) => { if (el) el.indeterminate = someOn && !allOn; }}
                onChange={(e) => {
                  const on = (e.target as HTMLInputElement).checked;
                  setSettings({ enabled: Object.fromEntries(printers.map((p) => [p.id, on])) });
                }}
              />
              All printers <span class="planner-muted">({enabledPrinters.length} of {printers.length} in use)</span>
            </label>
            <ul class="planner-printers">
              {printers.map((printer) => (
                <PrinterRow
                  key={printer.id}
                  printer={printer}
                  on={settings.enabled[printer.id] !== false}
                  status={statuses[printer.id]}
                  loaded={settings.loaded[printer.id] ?? ''}
                  materials={materials}
                  onToggle={(on) => setSettings({ enabled: { ...settings.enabled, [printer.id]: on } })}
                  onLoaded={(m) => setSettings({ loaded: { ...settings.loaded, [printer.id]: m } })}
                />
              ))}
            </ul>
          </>
        )}
        {materials.length > 0 && (
          <div class="planner-filaments">
            {materials.map((family) => (
              <label key={family} class="planner-inline">
                {family} slices with
                <select
                  value={filamentFor(family)?.id ?? ''}
                  onChange={(e) => setSettings({ filaments: { ...settings.filaments, [family]: (e.target as HTMLSelectElement).value } })}
                >
                  <option value="">—</option>
                  {filaments.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </label>
            ))}
          </div>
        )}
        <details class="planner-operator-details">
          <summary>Your hours — bedtime {settings.bedtime}–{settings.wake}, {settings.changeoverMin} min bed change, {settings.swapMin} min swap</summary>
          <div class="planner-operator">
            <label class="planner-inline">
              Bedtime
              <input type="time" value={settings.bedtime} onChange={(e) => setSettings({ bedtime: (e.target as HTMLInputElement).value })} />
            </label>
            <label class="planner-inline">
              Up at
              <input type="time" value={settings.wake} onChange={(e) => setSettings({ wake: (e.target as HTMLInputElement).value })} />
            </label>
            <label class="planner-inline">
              Bed change
              <input
                type="number" min="0" step="1" value={settings.changeoverMin}
                onChange={(e) => setSettings({ changeoverMin: Math.max(0, Number((e.target as HTMLInputElement).value) || 0) })}
              /> min
            </label>
            <label class="planner-inline">
              Filament swap
              <input
                type="number" min="0" step="1" value={settings.swapMin}
                onChange={(e) => setSettings({ swapMin: Math.max(0, Number((e.target as HTMLInputElement).value) || 0) })}
              /> min
            </label>
          </div>
          <div class="planner-away">
            <span>Away</span>
            {settings.away.map((a, i) => (
              <span key={i} class="planner-chip">
                {formatWhen(new Date(a.start).getTime(), now)} – {formatWhen(new Date(a.end).getTime(), now)}
                <button
                  type="button" class="planner-chip-remove" aria-label="Remove"
                  onClick={() => setSettings({ away: settings.away.filter((_, j) => j !== i) })}
                >×</button>
              </span>
            ))}
            <input type="datetime-local" aria-label="Away from" value={draftAway.start}
              onChange={(e) => setDraftAway({ ...draftAway, start: (e.target as HTMLInputElement).value })} />
            <input type="datetime-local" aria-label="Away until" value={draftAway.end}
              onChange={(e) => setDraftAway({ ...draftAway, end: (e.target as HTMLInputElement).value })} />
            <button
              type="button" class="btn"
              disabled={!draftAway.start || !draftAway.end || draftAway.end <= draftAway.start}
              onClick={() => { setSettings({ away: [...settings.away, draftAway] }); setDraftAway({ start: '', end: '' }); }}
            >Add</button>
          </div>
        </details>
      </div>
    </section>
  );

  const checks: Array<[boolean, string]> = [
    [ready.printers, ready.printers ? plural(enabledPrinters.length, 'printer') + ' in use' : 'Switch on a printer'],
    [ready.scheduled, ready.scheduled ? 'Every plate is on the timeline' : `${plural(notOnChart.length, 'plate')} not on the timeline`],
    [ready.sliced, `${slicedCount}/${printable.length} plates sliced for their printer`],
    [ready.clear, ready.clear ? 'No overlapping jobs' : 'Jobs overlap on the timeline'],
  ];

  return (
    <Modal title="Project" onClose={onClose} bleed>
      <div class="planner" data-tab={tab}>
        <div class="planner-project">
          <input
            class="planner-project-name"
            aria-label="Project name"
            value={nameDraft ?? project?.name ?? ''}
            onInput={(e) => setNameDraft((e.target as HTMLInputElement).value)}
            onBlur={commitProjectName}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
          {project?.draft && <span class="planner-chip planner-unsaved">Unsaved</span>}
          <div class="planner-project-tools">
            {project?.draft && <button type="button" class="btn btn-primary" onClick={handleSaveProject}>Save</button>}
            <button type="button" class="btn" onClick={handleNewProject}>New</button>
            <button type="button" class="btn" onClick={onOpenProjects}>Projects…</button>
          </div>
        </div>
        {printable.length > 0 && summary}
        <nav class="planner-tabs" role="tablist">
          {(['plates', 'timeline', 'printers'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} class={tab === t ? 'is-on' : ''} onClick={() => setTab(t)}>
              {t === 'plates' ? 'Plates' : t === 'timeline' ? 'Timeline' : 'Printers'}
            </button>
          ))}
        </nav>
        <div class="planner-panes">
          {platesPane}
          {timelinePane}
          {printersPane}
        </div>
        <footer class="planner-footer">
          <ul class="planner-checks">
            {checks.map(([ok, text]) => (
              <li key={text} class={ok ? 'is-ok' : 'is-todo'}><span aria-hidden="true">{ok ? '✓' : '○'}</span> {text}</li>
            ))}
          </ul>
          <div class="planner-footer-status">
            {busy && <p class="planner-busy">{busy}{slicing ? ` ${Math.round(slicing.pct)}%` : ''}</p>}
            {error && <p class="pd-notice is-bad">{error}</p>}
            {log.length > 0 && !busy && <p class="planner-muted">{log[log.length - 1]}</p>}
          </div>
          {sent && <button type="button" class="btn" onClick={onOpenDispatch}>Printers</button>}
          <button
            type="button"
            class="btn btn-primary planner-send"
            disabled={!isReady(ready)}
            title={isReady(ready) ? undefined : 'Every plate has to be sliced for its printer, with a clean timeline'}
            onClick={handleSend}
          >
            Send to printers
          </button>
        </footer>
      </div>
    </Modal>
  );
}

// ── Summary ──────────────────────────────────────────────

interface SummaryProps {
  plates: Plate[];
  times: Record<string, Measured | null>;
  grams: Record<string, Measured | null>;
  plans: { one: Schedule; makespan: Schedule | null; visits: Schedule | null } | null;
  now: number;
  printerCount: number;
}

/** The whole job at a glance: filament, and how long it takes one printer or the fleet. */
function PlannerSummary({ plates, times, grams, plans, now, printerCount }: SummaryProps) {
  const byFilament = new Map<string, number>();
  let unweighed = 0;
  let estimated = false;
  for (const plate of plates) {
    const g = grams[plate.id];
    if (!g) { unweighed++; continue; }
    if (g.source === 'estimate') estimated = true;
    byFilament.set(plateFilament(plate), (byFilament.get(plateFilament(plate)) ?? 0) + g.value);
  }
  const totalGrams = [...byFilament.values()].reduce((a, b) => a + b, 0);
  const printSec = plates.reduce((t, p) => t + (times[p.id]?.value ?? 0), 0);
  const untimed = plates.filter((p) => !times[p.id]).length;
  const approx = estimated ? '≈' : '';

  const planCell = (key: string, label: string, schedule: Schedule | null | undefined) => (
    <div class="planner-stat" data-plan={key}>
      <div class="planner-stat-label">{label}</div>
      {schedule ? (
        <>
          <div class="planner-stat-value">{formatDuration((schedule.finish - now) / 1000)}</div>
          <div class="planner-stat-sub">
            <span class="planner-trips">{plural(schedule.visits.length, 'trip')}</span> · done {formatWhen(schedule.finish, now)}
          </div>
        </>
      ) : (
        <div class="planner-stat-sub">—</div>
      )}
    </div>
  );

  return (
    <section class="planner-summary" aria-label="Project summary">
      <div class="planner-stat planner-stat-filament">
        <div class="planner-stat-label">Filament</div>
        <ul class="planner-filament-list">
          {[...byFilament].map(([name, g]) => (
            <li key={name}><span>{name}</span> <strong>{approx}{Math.round(g)} g</strong></li>
          ))}
          {byFilament.size !== 1 && <li class="is-total"><span>Total</span> <strong>{approx}{Math.round(totalGrams)} g</strong></li>}
        </ul>
        {unweighed > 0 && <div class="planner-stat-sub">{plural(unweighed, 'plate')} not weighed yet</div>}
      </div>
      <div class="planner-stat" data-plan="print">
        <div class="planner-stat-label">Print time</div>
        <div class="planner-stat-value">{formatDuration(printSec)}</div>
        <div class="planner-stat-sub">{untimed > 0 ? `${plural(untimed, 'plate')} not timed yet` : `${plural(plates.length, 'plate')}, back to back`}</div>
      </div>
      {planCell('one', 'On one Adventurer 5M', plans?.one)}
      {planCell('makespan', `All ${plural(printerCount, 'printer')} · lowest wall-clock`, plans?.makespan)}
      {planCell('visits', `All ${plural(printerCount, 'printer')} · fewest trips`, plans?.visits)}
      {estimated && <p class="planner-stat-note">≈ CI estimates until a plate is sliced.</p>}
    </section>
  );
}

// ── Plate row ────────────────────────────────────────────

interface PlateRowProps {
  plate: Plate;
  number: number | undefined;
  geometry: Geometry | undefined;
  time: Measured | null;
  grams: Measured | null;
  job: Schedule['jobs'][number] | undefined;
  target: PrintPreset | undefined;
  printerById: Map<string, PrintPreset>;
  fresh: SlicedGcode[];
  kept: SlicedGcode[];
  fitsNone: boolean;
  setup: (printer: PrintPreset) => SliceSetup | { problem: string };
  proc: ProcessSettings;
  layerHeight: string;
  bedSurface: string;
  slicingPct: number | null;
  sliceFailed: string | undefined;
  clash: boolean;
  hovered: boolean;
  busy: boolean;
  now: number;
  onHover: (plateId: string | null) => void;
  onEdit: () => void;
  onSlice: () => void;
  /** Where "Add to project" drops parts. */
  isTarget: boolean;
  onTarget: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function PlateRow(props: PlateRowProps) {
  const { plate, number, geometry, time, grams, job, target, fresh, kept, proc } = props;
  const [name, setName] = useState<string | null>(null);
  const empty = plate.items.length === 0;
  const setup = target ? props.setup(target) : null;
  const slicedHere = !!target && fresh.some((s) => s.printerId === target.id);
  const status = empty
    ? { cls: 'is-todo', text: props.isTarget ? 'Empty — Add to project puts parts here' : 'Empty' }
    : props.slicingPct !== null
    ? { cls: 'is-busy', text: `Slicing… ${Math.round(props.slicingPct)}%` }
    : slicedHere
      ? { cls: 'is-ok', text: `Sliced for ${target!.name}` }
      : props.sliceFailed
        ? { cls: 'is-todo', text: `Slicing failed: ${props.sliceFailed}` }
        : fresh.length > 0
          ? { cls: 'is-todo', text: `Sliced for ${props.printerById.get(fresh[0].printerId)?.name ?? 'another printer'} — needs ${target?.name ?? 'its printer'}` }
          : kept.length > 0
            ? { cls: 'is-todo', text: 'Out of date — plate or settings changed' }
            : { cls: 'is-todo', text: 'Not sliced' };
  const supports = proc.supportStyle === 'none'
    ? 'none'
    : `${proc.supportStyle}${proc.supportOnBuildPlateOnly ? ', build plate only' : ''}`;
  const overridden = Object.keys(plate.overrides ?? {}).length;
  const specs: Array<[string, string]> = [
    ['Layer', `${props.layerHeight} mm${proc.adaptiveLayerHeight ? ', adaptive' : ''}`],
    ['Walls', proc.wallLoops],
    ['Top / bottom', `${proc.topShells} / ${proc.bottomShells}`],
    ['Infill', `${proc.infillDensity}% ${proc.infillPattern}`],
    ['Supports', supports],
    ['Brim', proc.brim ? 'yes' : 'no'],
    ['Bed', props.bedSurface],
    ['Filament', setup && !('problem' in setup) ? setup.filament.name : 'none picked'],
  ];
  if (overridden > 0) specs.push(['Per object', `${overridden} overridden`]);

  return (
    <li
      class={`planner-plate${props.hovered ? ' is-hovered' : ''}${props.clash ? ' is-collision' : ''}${props.isTarget ? ' is-target' : ''}${empty ? ' is-empty' : ''}`}
      data-plate={plate.id}
      onMouseEnter={() => props.onHover(plate.id)}
      onMouseLeave={() => props.onHover(null)}
      onClick={props.onTarget}
    >
      <div class="planner-thumb">
        {geometry && 'thumb' in geometry && geometry.thumb
          ? <img src={geometry.thumb} alt="" />
          : <span class="planner-thumb-empty">{!geometry ? '…' : 'failed' in geometry ? '!' : ''}</span>}
      </div>
      <div class="planner-plate-main">
        <div class="planner-plate-head">
          <span class="planner-plate-num" title="Plate number: the order it starts in">#{number ?? '–'}</span>
          <input
            class="planner-plate-name"
            aria-label="Plate name"
            title={plate.name}
            value={name ?? plate.name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            onBlur={() => { if (name !== null) props.onRename(name); setName(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
          {!empty && <span class="planner-chip">{plateFilament(plate)}</span>}
          {props.isTarget && <span class="planner-chip planner-target-chip" title="Add to project puts parts on this plate">Adding here</span>}
        </div>
        {!empty && <div class="planner-plate-meta">
          <span class="planner-plate-printer">{job ? props.printerById.get(job.printerId)?.name : props.fitsNone ? 'fits no printer' : 'not scheduled'}</span>
          {job && <span>starts {job.start <= props.now ? 'now' : formatWhen(job.start, props.now)}</span>}
          <span>
            {time ? formatDuration(time.value) : 'no time yet'}
            {grams && ` · ${Math.round(grams.value)} g`}
            {time && <span class="planner-muted"> ({time.source === 'sliced' ? 'sliced' : 'CI estimate'})</span>}
          </span>
        </div>}
        {!empty && <dl class="planner-specs">
          {specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>}
        <div class={`planner-slice-status ${status.cls}`}>{status.text}</div>
        {!empty && setup && 'problem' in setup && <p class="pd-notice is-bad">{setup.problem}</p>}
        {geometry && 'failed' in geometry && <p class="pd-notice is-bad">Couldn't load this plate: {geometry.failed}</p>}
      </div>
      <div class="planner-plate-actions">
        <button type="button" class="btn" onClick={props.onEdit}>Edit plate</button>
        {!empty && (
          <button type="button" class="btn" disabled={props.busy || !target || slicedHere} onClick={props.onSlice}>
            {props.sliceFailed ? 'Retry slice' : 'Slice'}
          </button>
        )}
        <button type="button" class="btn" onClick={props.onDuplicate}>Duplicate</button>
        <button type="button" class="btn" onClick={props.onDelete}>Delete</button>
      </div>
    </li>
  );
}

// ── Printer row ──────────────────────────────────────────

interface PrinterRowProps {
  printer: PrintPreset;
  on: boolean;
  status: StatusState | undefined;
  loaded: string;
  materials: string[];
  onToggle: (on: boolean) => void;
  onLoaded: (material: string) => void;
}

function PrinterRow({ printer, on, status, loaded, materials, onToggle, onLoaded }: PrinterRowProps) {
  return (
    <li class={`planner-printer${on ? '' : ' is-off'}`}>
      <label class="planner-toggle">
        <input type="checkbox" checked={on} onChange={(e) => onToggle((e.target as HTMLInputElement).checked)} />
        {printer.name}
      </label>
      <span class="planner-muted">
        {!printer.address ? 'no address — can plan, can’t send'
          : status === undefined || status === 'loading' ? 'checking…'
            : 'error' in status ? 'unreachable'
              : status.state === 'paused' ? `paused on ${status.filename} — planned as free once you cancel it`
                : status.remainingSec > 0 ? `printing ${status.filename}, ${formatDuration(status.remainingSec)} left`
                  : status.state === 'complete' ? 'finished — bed needs clearing'
                    : status.state}
      </span>
      <label class="planner-inline">
        Loaded
        <select value={loaded} onChange={(e) => onLoaded((e.target as HTMLSelectElement).value)}>
          <option value="">Unknown</option>
          {[...new Set([...materials, 'PLA', 'PETG', 'TPU'])].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
    </li>
  );
}

// ── Itinerary ────────────────────────────────────────────

interface ItineraryProps {
  plan: Schedule;
  now: number;
  plates: Map<string, Plate>;
  printers: Map<string, PrintPreset>;
  numbers: Map<string, number>;
  statuses: Record<string, StatusState>;
  swapMin: number;
}

/** The operator's trips: what to clear, swap and start at each. */
function Itinerary({ plan, now, plates, printers, numbers, statuses, swapMin }: ItineraryProps) {
  return (
    <ol class="planner-visits">
      {plan.visits.map((visit, i) => (
        <li key={i} class="planner-visit">
          <div class="planner-visit-when">
            <span class="planner-visit-num">{i + 1}</span>
            {i === 0 && visit.at === now ? 'Now' : formatWhen(visit.at, now)}
          </div>
          <ul>
            {visit.starts.map((s) => {
              const plate = plates.get(s.jobId)!;
              const status = statuses[s.printerId];
              // Only the first trip can find a bed that is already empty.
              const occupied = i > 0 || (typeof status === 'object' && 'state' in status
                && (status.state === 'complete' || status.remainingSec > 0));
              const paused = i === 0 && typeof status === 'object' && 'state' in status && status.state === 'paused';
              return (
                <li key={s.jobId}>
                  <strong>{printers.get(s.printerId)?.name}</strong>: {paused && typeof status === 'object' && 'filename' in status
                    ? `cancel the paused ${status.filename}, ` : ''}{occupied ? 'clear the bed, ' : ''}
                  {s.swapFrom && <span class="planner-swap">swap {s.swapFrom} → {plateMaterial(plate)} (allow {swapMin} min), </span>}
                  start <code>{gcodeName(numbers.get(s.jobId) ?? 0, plate)}</code> — {plate.name}{' '}
                  <span class="planner-muted">({formatDuration((s.end - s.start) / 1000)}, done {formatWhen(s.end, now)})</span>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
      <li class="planner-visit">
        <div class="planner-visit-when">
          <span class="planner-visit-num">✓</span>
          {formatWhen(plan.collect, now)}
        </div>
        <ul><li>Collect the last prints.</li></ul>
      </li>
    </ol>
  );
}
