// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  evaluateAuthoredPlateFit,
  fetchPrintStatus,
  printerBedFromConfig,
  startPrint,
  uploadGcode,
  type OperatorBlock,
  type PrintStatus,
  type Schedule,
  type ScheduleJob,
  type ScheduleObjective,
  type SchedulePrinter,
} from '@3d-gallery/print-toolkit';
import { describeProfile, materialFamily } from '@3d-gallery/model-core';
import { Modal } from './Modal.js';
import { listPresets, type PrintPreset } from './print-storage.js';
import { flattenPresetForSlicer } from './preset-flatten.js';
import { resolvePlate } from './plate-resolve.js';
import { buildInstances, toFootprints } from './plate-geometry.js';
import {
  getProject,
  listPlates,
  listSlicedGcode,
  plateSignature,
  putSlicedGcode,
  type Plate,
  type Project,
  type SlicedGcode,
} from './plate-store.js';
import { DEFAULT_BED_SURFACE, processFromProfile, slicePlate, type SliceSetup } from './plate-slice.js';
import { listTemplates } from './process-templates.js';
import { loadLastSelections } from './PrintDialog.js';
import { formatWhen, loadPlannerSettings, operatorBlocks, planFleet, savePlannerSettings, type PlannerSettings } from './fleet-plan.js';

export interface ProjectPlannerProps {
  projectId: string;
  onClose: () => void;
  onOpenPlate: (plateId: string) => void;
  onOpenPlates: () => void;
  onOpenSettings: () => void;
}

// ── CI estimates ─────────────────────────────────────────

/** The slice of `print-estimates.json` the planner reads. */
interface Estimates {
  settings: { rates: { mmPerS: number; label?: string }[]; defaultMaterial: string };
  estimates: Record<string, { seconds: Record<string, number>; grams: number; profile?: string }>;
}

async function loadEstimates(): Promise<Estimates | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}models/print-estimates.json`);
    return res.ok ? ((await res.json()) as Estimates) : null;
  } catch {
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────

const HOUR = 3600_000;

function plateMaterial(plate: Plate): string {
  return materialFamily(plate.material ?? 'PETG');
}

function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m}m` : `${h}h ${String(m).padStart(2, '0')}m`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'plate';
}

/** Moonraker file name: the plan's start order first, so a printer's file list reads in print order. */
function gcodeName(order: number, plate: Plate): string {
  return `${String(order + 1).padStart(2, '0')}-${slugify(plate.name)}.gcode`;
}

function freshSlices(plate: Plate, slices: SlicedGcode[] | undefined): SlicedGcode[] {
  const signature = plateSignature(plate);
  return (slices ?? []).filter((s) => s.signature === signature);
}

type TimeSource = { seconds: number; source: 'sliced' | 'estimate' };

/**
 * How long a plate takes: the slicer's own figure for a fresh slice, else the
 * CI estimate at the plate's material rate, summed over its items.
 */
function plateTime(plate: Plate, slices: SlicedGcode[] | undefined, est: Estimates | null): TimeSource | null {
  const sliced = freshSlices(plate, slices).find((s) => s.seconds);
  if (sliced?.seconds) return { seconds: sliced.seconds, source: 'sliced' };
  if (!est) return null;
  const family = plateMaterial(plate);
  const rates = est.settings.rates;
  const rate = rates.find((r) => r.label === family)
    ?? rates.find((r) => r.label === materialFamily(est.settings.defaultMaterial));
  if (!rate) return null;
  let seconds = 0;
  for (const item of plate.items) {
    const s = est.estimates[item.key]?.seconds[rate.mmPerS];
    if (!s) return null;
    seconds += s * item.qty;
  }
  return seconds > 0 ? { seconds, source: 'estimate' } : null;
}

function filamentFamily(preset: PrintPreset): string | undefined {
  const type = flattenPresetForSlicer(preset)['filament_type']?.split(';')[0];
  return type ? materialFamily(type) : undefined;
}

type StatusState = PrintStatus | { error: string } | 'loading';

// ── Component ────────────────────────────────────────────

export function ProjectPlanner({ projectId, onClose, onOpenPlate, onOpenPlates, onOpenSettings }: ProjectPlannerProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [plates, setPlates] = useState<Plate[] | null>(null);
  const [printers, setPrinters] = useState<PrintPreset[]>([]);
  const [filaments, setFilaments] = useState<PrintPreset[]>([]);
  const [estimates, setEstimates] = useState<Estimates | null>(null);
  const [slices, setSlices] = useState<Record<string, SlicedGcode[]>>({});
  const [fits, setFits] = useState<Record<string, string[]>>({});
  const [statuses, setStatuses] = useState<Record<string, StatusState>>({});
  const [settings, setSettingsState] = useState<PlannerSettings>(loadPlannerSettings);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [draftAway, setDraftAway] = useState({ start: '', end: '' });

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
        if (!proj) { setError(`Project not found: ${projectId}`); return; }
        setProject(proj);
        setPlates(rows);
        setPrinters(p);
        setFilaments(f);
        setEstimates(est);
        const kept = await Promise.all(rows.map(async (plate) => [plate.id, await listSlicedGcode(plate.id)] as const));
        setSlices(Object.fromEntries(kept));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [projectId]);

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

  // Which printers each plate physically fits. Resolving meshes is the slow
  // part, so it runs once per plate list and printer list.
  useEffect(() => {
    if (!plates || printers.length === 0) return;
    let cancelled = false;
    void (async () => {
      const beds = printers
        .map((p) => ({ id: p.id, bed: printerBedFromConfig(flattenPresetForSlicer(p)) }))
        .filter((b) => b.bed);
      for (const plate of plates) {
        try {
          const report = await resolvePlate(plate);
          const footprints = toFootprints(buildInstances(plate, report.objects));
          const ok = beds.filter((b) => evaluateAuthoredPlateFit(footprints, b.bed!).status !== 'blocked').map((b) => b.id);
          if (!cancelled) setFits((prev) => ({ ...prev, [plate.id]: ok }));
        } catch {
          // Unknown fit: the plan lets any printer take it, and slicing will say.
        }
      }
    })();
    return () => { cancelled = true; };
  }, [plates, printers]);

  const enabledPrinters = printers.filter((p) => settings.enabled[p.id] !== false);
  const materials = useMemo(() => [...new Set((plates ?? []).map(plateMaterial))].sort(), [plates]);

  const times = useMemo(() => {
    const out: Record<string, TimeSource | null> = {};
    for (const plate of plates ?? []) out[plate.id] = plateTime(plate, slices[plate.id], estimates);
    return out;
  }, [plates, slices, estimates]);

  const unavailable = useMemo<OperatorBlock[]>(
    () => operatorBlocks(settings, now),
    [settings.bedtime, settings.wake, settings.away, now],
  );

  const plan = useMemo<Schedule | null>(() => {
    if (!plates || enabledPrinters.length === 0) return null;
    const jobs: ScheduleJob[] = plates
      .filter((p) => times[p.id])
      .map((p) => ({
        id: p.id,
        label: p.name,
        seconds: times[p.id]!.seconds,
        material: plateMaterial(p),
        printers: fits[p.id],
      }));
    if (jobs.length === 0) return null;
    const fleet: SchedulePrinter[] = enabledPrinters.map((p) => {
      const status = statuses[p.id];
      // A paused print never finishes on its own; the plan has the operator cancel it on the first trip.
      const remaining = status && status !== 'loading' && 'remainingSec' in status && status.state !== 'paused'
        ? status.remainingSec : 0;
      return { id: p.id, name: p.name, freeAt: now + remaining * 1000, material: settings.loaded[p.id] || undefined };
    });
    return planFleet(jobs, fleet, settings, unavailable, now);
  }, [plates, times, fits, enabledPrinters.map((p) => p.id).join(), statuses, settings, unavailable, now]);

  const plateById = useMemo(() => new Map((plates ?? []).map((p) => [p.id, p])), [plates]);
  const printerById = useMemo(() => new Map(printers.map((p) => [p.id, p])), [printers]);
  const startOrder = useMemo(() => {
    const ordered = [...(plan?.jobs ?? [])].sort((a, b) => a.start - b.start);
    return new Map(ordered.map((j, i) => [j.jobId, i]));
  }, [plan]);

  const filamentFor = (family: string): PrintPreset | undefined =>
    filaments.find((f) => f.id === settings.filaments[family])
    ?? filaments.find((f) => filamentFamily(f) === family);

  const setupFor = (plate: Plate, printer: PrintPreset): SliceSetup => {
    const sel = loadLastSelections();
    const family = plateMaterial(plate);
    const filament = filamentFor(family);
    if (!filament) throw new Error(`No ${family} filament preset — import one in Print settings, or pick one below.`);
    const template = listTemplates().find((t) => t.id === sel.templateId) ?? listTemplates()[0];
    return {
      printer,
      filament,
      proc: plate.profile ? processFromProfile(plate.profile) : sel.processOverride ?? template.settings,
      layerHeight: sel.layerHeight ?? '0.20',
      bedSurface: sel.bedSurface ?? DEFAULT_BED_SURFACE,
      preheat: sel.preheat ?? true,
      centerOnBed: sel.centerOnBed ?? true,
      clearExclusionZones: sel.clearExclusionZones ?? false,
    };
  };

  /** A fresh slice of `plate` for `printer`, from the store or made now. */
  const ensureSlice = async (plate: Plate, printer: PrintPreset, label: string): Promise<SlicedGcode> => {
    const kept = freshSlices(plate, slices[plate.id]).find((s) => s.printerId === printer.id);
    if (kept) return kept;
    const setup = setupFor(plate, printer);
    setBusy(`${label}: slicing ${plate.name} for ${printer.name}…`);
    const sliced = await slicePlate(plate, setup, (_stage, pct) => {
      setBusy(`${label}: slicing ${plate.name} for ${printer.name}… ${Math.round(pct)}%`);
    });
    const record = await putSlicedGcode({
      plateId: plate.id,
      printerId: printer.id,
      filamentId: setup.filament.id,
      signature: plateSignature(plate),
      gcode: sliced.gcode,
      seconds: sliced.seconds,
      grams: sliced.grams,
      slicedAt: Date.now(),
    });
    setSlices((prev) => ({
      ...prev,
      [plate.id]: [...(prev[plate.id] ?? []).filter((s) => s.printerId !== printer.id), record],
    }));
    return record;
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
    }
  };

  /** Slice every plate for the printer the plan gives it — or, for a plate
   *  with no time yet, the first enabled printer it fits — so the plan runs
   *  on the slicer's own times rather than CI's. */
  const handleSliceAll = () => run('Slicing', async () => {
    const todo = (plates ?? []).map((plate) => {
      const assigned = plan?.jobs.find((j) => j.jobId === plate.id)?.printerId;
      const printer = printerById.get(assigned ?? '')
        ?? enabledPrinters.find((p) => !fits[plate.id] || fits[plate.id].includes(p.id));
      return { plate, printer };
    });
    for (const [i, { plate, printer }] of todo.entries()) {
      if (!printer) {
        setLog((prev) => [...prev, `${plate.name}: no enabled printer fits it.`]);
        continue;
      }
      await ensureSlice(plate, printer, `${i + 1}/${todo.length}`);
      setLog((prev) => [...prev, `${plate.name}: sliced for ${printer.name}.`]);
    }
  });

  /** Upload each printer's jobs in plan order, and start the first job on any
   *  printer the plan starts right now. The rest wait for the operator. */
  const handleSend = () => {
    if (!plan) return;
    const byPrinter = new Map<string, typeof plan.jobs>();
    for (const job of plan.jobs) byPrinter.set(job.printerId, [...(byPrinter.get(job.printerId) ?? []), job]);
    const missing = [...byPrinter.keys()].filter((id) => !printerById.get(id)?.address);
    if (missing.length > 0) {
      setError(`No Moonraker address for ${missing.map((id) => printerById.get(id)?.name ?? id).join(', ')}.`);
      return;
    }
    // A job behind a filament swap waits for the operator to load the spool.
    const startsNow = plan.visits[0]?.at === now ? plan.visits[0].starts.filter((s) => !s.swapFrom) : [];
    const summary = [
      `Upload ${plan.jobs.length} file${plan.jobs.length === 1 ? '' : 's'} to ${byPrinter.size} printer${byPrinter.size === 1 ? '' : 's'}`,
      startsNow.length > 0
        ? `and START printing now on ${startsNow.map((s) => printerById.get(s.printerId)?.name).join(', ')}`
        : 'without starting anything',
    ].join(' ');
    if (!confirm(`${summary}?\n\nMake sure those beds are clear.`)) return;

    void run('Sending', async () => {
      let n = 0;
      for (const [printerId, jobs] of byPrinter) {
        const printer = printerById.get(printerId)!;
        for (const job of [...jobs].sort((a, b) => a.start - b.start)) {
          const plate = plateById.get(job.jobId)!;
          const slice = await ensureSlice(plate, printer, `${++n}/${plan.jobs.length}`);
          const name = gcodeName(startOrder.get(job.jobId) ?? 0, plate);
          setBusy(`Uploading ${name} to ${printer.name}…`);
          await uploadGcode(printer.address!, name, new TextEncoder().encode(slice.gcode));
          setLog((prev) => [...prev, `${printer.name}: uploaded ${name}.`]);
        }
      }
      for (const start of startsNow) {
        const printer = printerById.get(start.printerId)!;
        const status = await fetchPrintStatus(printer.address!).catch(() => null);
        if (status && (status.state === 'printing' || status.state === 'paused')) {
          setLog((prev) => [...prev, `${printer.name}: still printing ${status.filename} — not started.`]);
          continue;
        }
        const name = gcodeName(startOrder.get(start.jobId) ?? 0, plateById.get(start.jobId)!);
        setBusy(`Starting ${name} on ${printer.name}…`);
        await startPrint(printer.address!, name);
        setLog((prev) => [...prev, `${printer.name}: started ${name}.`]);
      }
      refreshStatuses();
    });
  };

  if (error && !project) {
    return <Modal title="Plan & print" onClose={onClose}><p class="plate-empty">{error}</p></Modal>;
  }

  const unscheduled = (plates ?? []).filter((p) => !times[p.id]);
  const totalPrintSec = (plan?.jobs ?? []).reduce((t, j) => t + (j.end - j.start) / 1000, 0);
  const anySliced = (plates ?? []).some((p) => times[p.id]?.source === 'sliced');
  const profiles = [...new Set((plates ?? []).map((p) => (p.profile ? describeProfile(p.profile) : null)).filter(Boolean))];

  return (
    <Modal title={`Plan & print — ${project?.name ?? '…'}`} onClose={() => { if (!busy) onClose(); }}>
      <div class="planner">
        <section class="planner-summary">
          {plan ? (
            <div class="planner-headline">
              <div><span class="planner-big">{formatWhen(plan.finish, now)}</span> last print done</div>
              <div><span class="planner-big">{plan.visits.length}</span> trip{plan.visits.length === 1 ? '' : 's'} to the printers</div>
              <div>
                <span class="planner-big">{formatDuration(totalPrintSec)}</span> of printing on{' '}
                {new Set(plan.jobs.map((j) => j.printerId)).size} printer{new Set(plan.jobs.map((j) => j.printerId)).size === 1 ? '' : 's'}
              </div>
              {plan.collect > plan.finish && (
                <div class="planner-note">You'll collect it {formatWhen(plan.collect, now)}, after the break it lands in.</div>
              )}
            </div>
          ) : (
            <p class="plate-empty">
              {printers.length === 0
                ? 'No printers imported yet.'
                : enabledPrinters.length === 0
                  ? 'Every printer is switched off.'
                  : plates && plates.length === 0
                    ? 'This project has no plates.'
                    : 'No plate has a print time yet — slice them to plan.'}
            </p>
          )}
          <div class="planner-actions">
            <label class="planner-objective">
              Optimize for
              <select
                value={settings.objective}
                onChange={(e) => setSettings({ objective: (e.target as HTMLSelectElement).value as ScheduleObjective })}
              >
                <option value="makespan">Lowest wall-clock</option>
                <option value="visits">Fewest operator trips</option>
              </select>
            </label>
            <button type="button" class="btn" disabled={!!busy} onClick={refreshStatuses}>Refresh printers</button>
            <button type="button" class="btn" disabled={!!busy || !plates?.length} onClick={() => void handleSliceAll()}>
              Slice all
            </button>
            <button type="button" class="btn btn-primary" disabled={!!busy || !plan} onClick={handleSend}>
              Send to printers
            </button>
          </div>
          {busy && <p class="planner-busy">{busy}</p>}
          {error && <p class="pd-notice is-bad">{error}</p>}
          {log.length > 0 && <ul class="planner-log">{log.map((line, i) => <li key={i}>{line}</li>)}</ul>}
          <p class="planner-note">
            Times are {anySliced ? 'the slicer’s own where a plate is sliced, else ' : ''}CI estimates for an
            Adventurer 5M{profiles.length > 0 ? ` at ${profiles.join('; ')}` : ''}.
            {unscheduled.length > 0 && ` ${unscheduled.length} plate${unscheduled.length === 1 ? ' has' : 's have'} no time yet and ${unscheduled.length === 1 ? 'is' : 'are'} left out — Slice all fixes that.`}
            {plan && plan.unassigned.length > 0 && ` ${plan.unassigned.length} plate${plan.unassigned.length === 1 ? '' : 's'} fit${plan.unassigned.length === 1 ? 's' : ''} no enabled printer.`}
          </p>
        </section>

        {plan && (
          <Gantt
            plan={plan}
            now={now}
            printers={enabledPrinters}
            plates={plateById}
            unavailable={unavailable}
          />
        )}

        {plan && (
          <section class="planner-section">
            <h4>Operator itinerary</h4>
            <ol class="planner-visits">
              {plan.visits.map((visit, i) => (
                <li key={i} class="planner-visit">
                  <div class="planner-visit-when">
                    <span class="planner-visit-num">{i + 1}</span>
                    {i === 0 && visit.at === now ? 'Now' : formatWhen(visit.at, now)}
                  </div>
                  <ul>
                    {visit.starts.map((s) => {
                      const plate = plateById.get(s.jobId)!;
                      const status = statuses[s.printerId];
                      // Only the first trip can find a bed that is already empty.
                      const occupied = i > 0 || (typeof status === 'object' && 'state' in status
                        && (status.state === 'complete' || status.remainingSec > 0));
                      const paused = i === 0 && typeof status === 'object' && 'state' in status && status.state === 'paused';
                      return (
                        <li key={s.jobId}>
                          <strong>{printerById.get(s.printerId)?.name}</strong>: {paused && typeof status === 'object' && 'filename' in status
                            ? `cancel the paused ${status.filename}, ` : ''}{occupied ? 'clear the bed, ' : ''}
                          {s.swapFrom && <span class="planner-swap">swap {s.swapFrom} → {plateMaterial(plate)} (allow {settings.swapMin} min), </span>}
                          start <code>{gcodeName(startOrder.get(s.jobId) ?? 0, plate)}</code> — {plate.name}{' '}
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
          </section>
        )}

        <section class="planner-section">
          <h4>Plates</h4>
          <ul class="planner-plates">
            {(plates ?? []).map((plate) => {
              const time = times[plate.id];
              const job = plan?.jobs.find((j) => j.jobId === plate.id);
              const fit = fits[plate.id];
              return (
                <li key={plate.id} class="planner-plate">
                  <button type="button" class="plate-row-fit-link" onClick={() => onOpenPlate(plate.id)}>{plate.name}</button>
                  <span class="planner-chip">{plateMaterial(plate)}</span>
                  <span class="planner-muted">
                    {time ? `${formatDuration(time.seconds)} ${time.source === 'sliced' ? '(sliced)' : '(estimate)'}` : 'no time yet'}
                    {job && ` · ${printerById.get(job.printerId)?.name}`}
                    {fit && fit.length === 0 && ' · fits no printer'}
                  </span>
                </li>
              );
            })}
          </ul>
          <button type="button" class="btn btn-secondary" onClick={onOpenPlates}>Edit plates</button>
        </section>

        <section class="planner-section">
          <h4>Printers</h4>
          {printers.length === 0 ? (
            <p class="plate-empty">
              None yet — <button type="button" class="plate-row-fit-link" onClick={onOpenSettings}>import your OrcaSlicer presets</button>.
            </p>
          ) : (
            <ul class="planner-printers">
              {printers.map((printer) => {
                const status = statuses[printer.id];
                const on = settings.enabled[printer.id] !== false;
                return (
                  <li key={printer.id} class={`planner-printer${on ? '' : ' is-off'}`}>
                    <label class="plate3d-toggle">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => setSettings({ enabled: { ...settings.enabled, [printer.id]: (e.target as HTMLInputElement).checked } })}
                      />
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
                      <select
                        value={settings.loaded[printer.id] ?? ''}
                        onChange={(e) => setSettings({ loaded: { ...settings.loaded, [printer.id]: (e.target as HTMLSelectElement).value } })}
                      >
                        <option value="">Unknown</option>
                        {[...new Set([...materials, 'PLA', 'PETG', 'TPU'])].map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </label>
                  </li>
                );
              })}
            </ul>
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
        </section>

        <section class="planner-section">
          <h4>Operator</h4>
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
        </section>
      </div>
    </Modal>
  );
}

// ── Gantt ────────────────────────────────────────────────

interface GanttProps {
  plan: Schedule;
  now: number;
  printers: PrintPreset[];
  plates: Map<string, Plate>;
  unavailable: OperatorBlock[];
}

const TICK_STEPS = [1, 2, 3, 6, 12, 24].map((h) => h * HOUR);

function Gantt({ plan, now, printers, plates, unavailable }: GanttProps) {
  const end = Math.max(plan.collect, plan.finish) + HOUR / 2;
  const span = end - now;
  const pct = (t: number) => `${(Math.min(Math.max(t, now), end) - now) / span * 100}%`;
  const width = (a: number, b: number) => `${(Math.min(b, end) - Math.max(a, now)) / span * 100}%`;
  const step = TICK_STEPS.find((s) => span / s <= 10) ?? TICK_STEPS[TICK_STEPS.length - 1];
  const ticks: number[] = [];
  for (let t = Math.ceil(now / step) * step; t < end; t += step) ticks.push(t);
  const rows = printers.filter((p) => plan.jobs.some((j) => j.printerId === p.id));
  const blocks = unavailable.filter((b) => b.end > now && b.start < end);

  return (
    <section class="planner-section">
      <h4>Timeline</h4>
      <div class="gantt" role="img" aria-label="Print timeline by printer">
        <div class="gantt-axis">
          <div class="gantt-label" />
          <div class="gantt-track">
            {ticks.map((t) => (
              <span key={t} class="gantt-tick" style={{ left: pct(t) }}>
                {new Date(t).getHours() === 0 || step >= 24 * HOUR
                  ? new Date(t).toLocaleDateString([], { weekday: 'short' })
                  : new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ))}
            {plan.visits.map((v, i) => (
              <span key={i} class="gantt-visit-flag" style={{ left: pct(v.at) }} title={`Trip ${i + 1}`}>{i + 1}</span>
            ))}
          </div>
        </div>
        {rows.map((printer) => (
          <div key={printer.id} class="gantt-row">
            <div class="gantt-label">{printer.name}</div>
            <div class="gantt-track">
              {blocks.map((b, i) => (
                <div key={i} class="gantt-away" style={{ left: pct(b.start), width: width(b.start, b.end) }} />
              ))}
              {plan.visits.map((v, i) => <div key={i} class="gantt-visit" style={{ left: pct(v.at) }} />)}
              {plan.jobs.filter((j) => j.printerId === printer.id).map((j) => {
                const plate = plates.get(j.jobId);
                const family = materialFamily(plate?.material ?? 'PETG');
                return (
                  <div
                    key={j.jobId}
                    class={`gantt-bar is-${family.toLowerCase()}${j.swapFrom ? ' has-swap' : ''}`}
                    style={{ left: pct(j.start), width: width(j.start, j.end) }}
                    title={`${plate?.name} — ${new Date(j.start).toLocaleString()} → ${new Date(j.end).toLocaleString()}`}
                  >
                    <span>{plate?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p class="planner-note">Shaded: you're away or asleep. Numbered lines: trips to the printers.</p>
    </section>
  );
}
