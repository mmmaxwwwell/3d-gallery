// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
//
// The printers, one card each. A card is the printer's state, camera and
// readiness, what the plan asks of it (filament by spool, hours, and the
// operator's stops, touches and swaps there), its Print button, and its queue
// of plates in the order it prints them. Uploads run in the background
// (dispatch-daemon.ts); Print starts the plate at the head of the queue once
// every check passes. Below, the queue of commands and the log of what they did.
import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Page } from './Page.js';
import { operatorUrl } from '../shell/views.js';
import { getProject, listPlates, plateSignature, printedPlate } from './plate-store.js';
import { resolvePlate } from './plate-resolve.js';
import { buildInstances } from './plate-geometry.js';
import { plateThumbnail } from './plate-thumbnail.js';
import { formatWhen, loadPlannerSettings, savePlannerSettings } from './fleet-plan.js';
import { formatDuration } from './planner-model.js';
import { loadPlanSnapshot, onPlanSnapshot, type PlanSnapshot } from './plan-snapshot.js';
import { fleetStats, printerStats, type PrinterStats } from './printer-stats.js';
import { listPrints, onOperatorChange, type PrintRecord } from './operator-store.js';
import { latestStart, refreshPrintReports, reportSummary, type PrintReport } from './print-report.js';
import { getDaemon, type DaemonSnapshot, type DispatchDaemon } from './dispatch-daemon.js';
import {
  belt,
  canStart,
  jobPhase,
  latestTask,
  needsUpload,
  nextJob,
  printerIds,
  readinessChecks,
  type DispatchJob,
  type DispatchTask,
  type JobPhase,
  type PrinterLive,
} from './dispatch-model.js';
import type { Webcam } from '@3d-gallery/print-toolkit';

export interface PrintDispatchProps {
  projectId: string;
  onClose: () => void;
  onOpenPlanner: () => void;
}

const PHASE_TEXT: Record<JobPhase, string> = {
  waiting: 'Not uploaded',
  uploading: 'Uploading…',
  uploaded: 'On the printer',
  starting: 'Starting…',
  printing: 'Printing',
  failed: 'Failed',
  finished: 'Finished',
};

function clock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function hours(h: number): string {
  return h === 0 ? '0h' : formatDuration(h * 3600);
}

export function PrintDispatch({ projectId, onClose, onOpenPlanner }: PrintDispatchProps) {
  const [daemon, setDaemon] = useState<DispatchDaemon | null>(null);
  const [snap, setSnap] = useState<DaemonSnapshot | null>(null);
  const [projectName, setProjectName] = useState('…');
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
  const [loaded, setLoadedState] = useState(() => loadPlannerSettings().loaded);
  const [activity, setActivity] = useState<'queue' | 'log'>('queue');
  const [plan, setPlan] = useState<PlanSnapshot | null>(() => loadPlanSnapshot(projectId));

  const [prints, setPrints] = useState<PrintRecord[]>([]);

  useEffect(() => onPlanSnapshot((id) => { if (id === projectId) setPlan(loadPlanSnapshot(projectId)); }), [projectId]);

  // What the printers said about each print started here — asked on load.
  useEffect(() => {
    const load = () => void listPrints(projectId).then(setPrints).catch(() => {});
    load();
    void refreshPrintReports(projectId).catch(() => {});
    return onOperatorChange((id) => { if (id === projectId) load(); });
  }, [projectId]);

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;
    void getDaemon(projectId).then((d) => {
      if (cancelled) return;
      setDaemon(d);
      setSnap(d.snapshot);
      unsubscribe = d.subscribe(() => setSnap(d.snapshot));
    });
    return () => { cancelled = true; unsubscribe(); };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [project, plates] = await Promise.all([getProject(projectId), listPlates(projectId)]);
      if (cancelled) return;
      setProjectName(project?.name ?? projectId);
      for (const plate of plates) {
        let thumb: string | null = null;
        try {
          const printed = printedPlate(plate);
          const report = await resolvePlate(printed);
          thumb = plateThumbnail(plateSignature(printed), buildInstances(printed, report.objects));
        } catch {
          // A plate that won't resolve just goes without a picture.
        }
        if (cancelled) return;
        setThumbs((prev) => ({ ...prev, [plate.id]: thumb }));
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const setLoaded = (printerId: string, material: string) => {
    const settings = loadPlannerSettings();
    const next = { ...settings.loaded, [printerId]: material };
    savePlannerSettings({ ...settings, loaded: next });
    setLoadedState(next);
  };

  const dispatch = snap?.dispatch;
  const rows = useMemo(() => (dispatch ? printerIds(dispatch) : []), [dispatch]);
  const materials = useMemo(() => [...new Set([...(dispatch?.jobs ?? []).map((j) => j.material), 'PLA', 'PETG', 'TPU'])], [dispatch]);
  const stats = useMemo(() => (plan ? printerStats(plan, dispatch?.jobs ?? []) : null), [plan, dispatch]);
  const fleet = useMemo(() => (plan ? fleetStats(plan, dispatch?.jobs ?? []) : null), [plan, dispatch]);

  const page = (body: ComponentChildren) => (
    <Page label={`Printers — ${projectName}`} onClose={onClose}>
      <div class="planner dispatch">{body}</div>
    </Page>
  );

  if (!daemon || !snap || !dispatch) return page(<p class="plate-empty">Loading…</p>);

  const toUpload = needsUpload(dispatch).length;
  const failed = dispatch.tasks.filter((t) => t.state === 'failed');
  const phases = dispatch.jobs.map((j) => jobPhase(dispatch, j));
  const count = (p: JobPhase) => phases.filter((x) => x === p).length;
  const nameOf = (printerId: string) => snap.printers.get(printerId)?.name ?? 'Unknown printer';

  const handlePrint = (printerId: string, job: DispatchJob) => {
    const lastState = snap.live[printerId]?.status?.state;
    const note = lastState === 'complete' || lastState === 'cancelled' || lastState === 'error'
      ? 'The last print is probably still on the bed.'
      : 'Check the bed is clear.';
    if (!confirm(`Start ${job.file} (${job.plateName}) on ${nameOf(printerId)}?\n\n${note}`)) return;
    daemon.print(printerId);
  };

  return page(
    <>
      <header class="dispatch-bar">
        <button type="button" class="btn" onClick={onOpenPlanner}>← Plan</button>
        <div class="dispatch-title">
          <strong class="dispatch-project">{projectName}</strong>
          <p class="dispatch-tally">
            {dispatch.jobs.length === 0 ? 'Nothing sent yet.' : (
              <>
                {count('uploaded') + count('starting') + count('printing') + count('finished')}/{dispatch.jobs.length} uploaded
                {' · '}{count('printing')} printing · {count('finished')} finished
                {count('failed') > 0 && <span class="dispatch-bad"> · {count('failed')} failed</span>}
                <span class="planner-muted"> · sent {formatWhen(dispatch.sentAt, Date.now())}</span>
              </>
            )}
          </p>
        </div>
        <div class="planner-pane-tools">
          <a class="btn" href={operatorUrl(projectId)}>Runbook</a>
          {failed.length > 0 && (
            <button type="button" class="btn" onClick={() => daemon.retryAllFailed()}>Retry failed ({failed.length})</button>
          )}
          <button type="button" class="btn btn-primary" disabled={toUpload === 0} onClick={() => daemon.uploadAll()}>
            Upload all{toUpload > 0 ? ` (${toUpload})` : ''}
          </button>
        </div>
      </header>

      <div class="dispatch-rows">
        {fleet && fleet.jobs > 0 && <FleetStrip stats={fleet} printers={rows.length} />}
        {rows.length === 0 && (
          <p class="plate-empty">No plan sent yet — go back to the plan and press Send to printers.</p>
        )}
        <div class="dispatch-grid">
          {rows.map((printerId) => (
            <PrinterCard
              key={printerId}
              name={nameOf(printerId)}
              hasAddress={!!snap.printers.get(printerId)?.address}
              jobs={belt(dispatch, printerId)}
              finished={dispatch.jobs.filter((j) => j.printerId === printerId && j.outcome).sort((a, b) => a.order - b.order)}
              reportOf={(j) => latestStart(prints, j.plateId, j.printerId)?.report}
              next={nextJob(dispatch, printerId)}
              live={snap.live[printerId]}
              cams={snap.cams[printerId] ?? []}
              stats={stats?.get(printerId)}
              loaded={loaded[printerId] ?? ''}
              materials={materials}
              thumbs={thumbs}
              phase={(j) => jobPhase(dispatch, j)}
              error={(j) => {
                const start = latestTask(dispatch, j, 'start');
                const upload = latestTask(dispatch, j, 'upload');
                return (start?.state === 'failed' ? start.error : undefined) ?? (upload?.state === 'failed' ? upload.error : undefined);
              }}
              onLoaded={(m) => setLoaded(printerId, m)}
              onPrint={(job) => handlePrint(printerId, job)}
              onUpload={(job) => daemon.upload(job)}
              onOutcome={(job, outcome) => daemon.setOutcome(job, outcome)}
              onRefresh={() => void daemon.probe(printerId)}
            />
          ))}
        </div>
      </div>

      <section class="dispatch-activity" aria-label="Queue and log">
        <nav class="planner-seg" role="tablist">
          <button type="button" role="tab" aria-selected={activity === 'queue'} class={activity === 'queue' ? 'is-on' : ''} onClick={() => setActivity('queue')}>
            Queue ({dispatch.tasks.filter((t) => t.state === 'queued' || t.state === 'running' || t.state === 'failed').length})
          </button>
          <button type="button" role="tab" aria-selected={activity === 'log'} class={activity === 'log' ? 'is-on' : ''} onClick={() => setActivity('log')}>
            Log ({dispatch.log.length})
          </button>
        </nav>
        {activity === 'queue'
          ? <Queue tasks={dispatch.tasks} nameOf={nameOf} onRetry={(id) => daemon.retry(id)} onCancel={(id) => daemon.cancel(id)} />
          : (
            <ol class="dispatch-log">
              {[...dispatch.log].reverse().map((e, i) => (
                <li key={i} class={e.level === 'error' ? 'is-error' : ''}>
                  <time>{clock(e.at)}</time>
                  {e.printerId && <strong>{nameOf(e.printerId)}</strong>}
                  <span>{e.text}</span>
                </li>
              ))}
              {dispatch.log.length === 0 && <li class="planner-muted">Nothing yet.</li>}
            </ol>
          )}
      </section>
    </>,
  );
}

// ── Stats ────────────────────────────────────────────────

function Figure({ value, label, title }: { value: string | number; label: string; title?: string }) {
  return (
    <div class="dispatch-figure" title={title}>
      <span class="dispatch-figure-value">{value}</span>
      <span class="dispatch-figure-label">{label}</span>
    </div>
  );
}

function Spools({ stats }: { stats: PrinterStats }) {
  if (stats.spools.length === 0) return null;
  return (
    <ul class="dispatch-spools">
      {stats.spools.map((s) => (
        <li key={s.label}>
          <span>{s.label}</span>
          <strong>{s.approx ? '≈' : ''}{Math.round(s.grams)} g</strong>
        </li>
      ))}
    </ul>
  );
}

/** The whole fleet, one line: what the plan asks of every printer and of the operator. */
function FleetStrip({ stats, printers }: { stats: PrinterStats; printers: number }) {
  const grams = stats.spools.reduce((t, s) => t + s.grams, 0);
  const approx = stats.spools.some((s) => s.approx);
  return (
    <section class="dispatch-fleet" aria-label="The whole plan">
      <Figure value={`${stats.printed}/${stats.jobs}`} label="printed" />
      <Figure value={hours(stats.hours)} label={`print time on ${printers}`} />
      <Figure value={`${approx ? '≈' : ''}${Math.round(grams)} g`} label="filament" />
      <Figure value={stats.stops} label="trips" title="Trips to the printers, counting the final collection" />
      <Figure value={stats.touches} label="touches" title="Beds cleared plus prints started" />
      <Figure value={stats.swaps} label="spool swaps" />
    </section>
  );
}

// ── One printer's card ───────────────────────────────────

interface PrinterCardProps {
  name: string;
  hasAddress: boolean;
  jobs: DispatchJob[];
  finished: DispatchJob[];
  reportOf: (job: DispatchJob) => PrintReport | undefined;
  next: DispatchJob | undefined;
  live: PrinterLive | undefined;
  cams: Webcam[];
  /** Its share of the plan; absent until the plan view has drawn one. */
  stats: PrinterStats | undefined;
  loaded: string;
  materials: string[];
  thumbs: Record<string, string | null>;
  phase: (job: DispatchJob) => JobPhase;
  error: (job: DispatchJob) => string | undefined;
  onLoaded: (material: string) => void;
  onPrint: (job: DispatchJob) => void;
  onUpload: (job: DispatchJob) => void;
  onOutcome: (job: DispatchJob, outcome: 'skipped' | undefined) => void;
  onRefresh: () => void;
}

/** One word for where the printer is, and the class that colours it. */
function liveState(live: PrinterLive | undefined, hasAddress: boolean): { text: string; cls: string } {
  if (!hasAddress) return { text: 'No address', cls: 'is-unknown' };
  if (!live) return { text: 'Checking…', cls: 'is-unknown' };
  if (live.error) return { text: 'Unreachable', cls: 'is-bad' };
  if (live.klippy && live.klippy.state !== 'ready') return { text: `Klipper ${live.klippy.state}`, cls: 'is-bad' };
  const state = live.status?.state;
  if (state === 'printing') return { text: 'Printing', cls: 'is-busy' };
  if (state === 'paused') return { text: 'Paused', cls: 'is-warn' };
  if (state === 'complete') return { text: 'Done — clear the bed', cls: 'is-warn' };
  if (state === 'error' || state === 'cancelled') return { text: state === 'error' ? 'Error' : 'Cancelled', cls: 'is-bad' };
  return { text: 'Idle', cls: 'is-ok' };
}

function PrinterCard(props: PrinterCardProps) {
  const { name, jobs, next, live, loaded, stats } = props;
  const checks = readinessChecks(live, next, loaded, props.hasAddress);
  const ready = !!next && canStart(checks);
  const status = live?.status;
  const running = status?.state === 'printing' || status?.state === 'paused' ? status : undefined;
  const foreign = running && !jobs.some((j) => j.file === running.filename) ? running : undefined;
  const state = liveState(live, props.hasAddress);

  return (
    <article class="dispatch-card" data-printer={name}>
      <header class="dispatch-card-head">
        <strong class="dispatch-card-name">{name}</strong>
        <span class={`dispatch-state ${state.cls}`}>{state.text}</span>
        <button type="button" class="planner-chip-remove" title="Check again" aria-label={`Check ${name} again`} onClick={props.onRefresh}>↻</button>
      </header>

      <Camera cams={props.cams} stamp={live?.checkedAt ?? 0} />

      {stats && stats.jobs > 0 && (
        <section class="dispatch-stats" aria-label={`What the plan asks of ${name}`}>
          <div class="dispatch-figures">
            <Figure value={`${stats.printed}/${stats.jobs}`} label="printed" />
            <Figure value={hours(stats.hours)} label="printing" title={stats.hoursPrinted > 0 ? `${hours(stats.hoursPrinted)} printed so far` : undefined} />
            <Figure value={stats.stops} label="stops" title="Trips that start a print here, plus collecting the last one" />
            <Figure value={stats.touches} label="touches" title={`${stats.clears} beds cleared, ${stats.starts} prints started`} />
            <Figure value={stats.swaps} label="swaps" title="Spool changes: a new material or colour" />
          </div>
          <Spools stats={stats} />
        </section>
      )}

      <ul class="dispatch-checks">
        {checks.map((c) => (
          <li key={c.id} class={c.ok === true ? 'is-ok' : c.ok === false ? 'is-bad' : 'is-unknown'}>
            <span aria-hidden="true">{c.ok === true ? '✓' : c.ok === false ? '✕' : '?'}</span> {c.text}
          </li>
        ))}
      </ul>

      <div class="dispatch-card-actions">
        <label class="planner-inline">
          Loaded
          <select value={loaded} onChange={(e) => props.onLoaded((e.target as HTMLSelectElement).value)}>
            <option value="">Unknown</option>
            {props.materials.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <button
          type="button"
          class="btn btn-primary dispatch-print"
          disabled={!ready}
          title={ready ? undefined : 'Every check above has to pass'}
          onClick={() => next && props.onPrint(next)}
        >
          {next ? `Print #${String(next.order).padStart(2, '0')}` : 'Nothing to print'}
        </button>
      </div>

      <ol class="dispatch-belt" aria-label={`${name}'s queue`}>
        {foreign && (
          <li class="dispatch-job is-foreign">
            <div class="dispatch-job-thumb" />
            <div class="dispatch-job-body">
              <div class="dispatch-job-head"><strong>{foreign.filename}</strong></div>
              <div class="dispatch-job-meta">Not from this project · {formatDuration(foreign.remainingSec)} left</div>
              <Progress value={foreign.progress} />
            </div>
          </li>
        )}
        {jobs.map((job) => {
          const phase = props.phase(job);
          const onPrinter = running?.filename === job.file ? running : undefined;
          const error = phase === 'failed' ? props.error(job) : undefined;
          return (
            <li key={job.file} class={`dispatch-job is-${phase}${job === next ? ' is-next' : ''}`} data-file={job.file}>
              <div class="dispatch-job-thumb">
                {props.thumbs[job.plateId] ? <img src={props.thumbs[job.plateId]!} alt="" /> : null}
              </div>
              <div class="dispatch-job-body">
                <div class="dispatch-job-head">
                  <span class="planner-plate-num">#{String(job.order).padStart(2, '0')}</span>
                  <strong>{job.plateName}</strong>
                </div>
                <div class="dispatch-job-meta">
                  <span class="planner-chip">{job.filament}</span>
                  <span>{formatDuration(job.seconds)}</span>
                  <span class={`dispatch-phase is-${phase}`}>
                    {PHASE_TEXT[phase]}
                    {onPrinter && ` ${Math.round(onPrinter.progress * 100)}% · ${formatDuration(onPrinter.remainingSec)} left`}
                  </span>
                </div>
                {onPrinter && <Progress value={onPrinter.progress} />}
                {error && <p class="dispatch-job-error">{error}</p>}
              </div>
              <div class="dispatch-job-actions">
                {(phase === 'waiting' || phase === 'failed' || phase === 'uploaded') && (
                  <button type="button" class="btn" onClick={() => props.onUpload(job)}>
                    {phase === 'uploaded' ? 'Re-upload' : 'Upload'}
                  </button>
                )}
                {phase !== 'starting' && (
                  <button type="button" class="btn" title={phase === 'printing' ? 'Take it off the queue — the printer is not told' : undefined}
                    onClick={() => props.onOutcome(job, 'skipped')}>
                    {phase === 'printing' ? 'Mark done' : 'Skip'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {jobs.length === 0 && !foreign && <li class="dispatch-belt-empty planner-muted">Queue empty.</li>}
      </ol>

      {props.finished.length > 0 && (
        <details class="dispatch-finished">
          <summary>{props.finished.length} off the queue</summary>
          <ul>
            {props.finished.map((j) => (
              <li key={j.file}>
                <span>
                  {j.file} — {j.outcome!.state}
                  {props.reportOf(j) && <span class="planner-muted"> · {reportSummary(props.reportOf(j)!, Date.now())}</span>}
                  {props.reportOf(j)?.errors.map((e, i) => <span key={i} class="dispatch-job-error"> {e}</span>)}
                </span>
                <button type="button" class="btn" onClick={() => props.onOutcome(j, undefined)}>Put back</button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function Progress({ value }: { value: number }) {
  return <div class="dispatch-progress"><div style={{ width: `${Math.round(value * 100)}%` }} /></div>;
}

function Camera({ cams, stamp }: { cams: Webcam[]; stamp: number }) {
  const [broken, setBroken] = useState(false);
  const cam = cams.find((c) => c.snapshotUrl || c.streamUrl);
  useEffect(() => setBroken(false), [cam?.snapshotUrl, cam?.streamUrl]);
  if (!cam || broken) {
    return <div class="dispatch-camera is-empty">{cam ? 'Camera unreachable' : 'No camera'}</div>;
  }
  // A snapshot, refreshed with every probe; a camera with only a stream shows the stream.
  const src = cam.snapshotUrl
    ? `${cam.snapshotUrl}${cam.snapshotUrl.includes('?') ? '&' : '?'}_=${stamp}`
    : cam.streamUrl;
  return (
    <a class="dispatch-camera" href={cam.streamUrl || cam.snapshotUrl} target="_blank" rel="noreferrer" title="Open the live stream">
      <img src={src} alt={`${cam.name} camera`} onError={() => setBroken(true)} />
    </a>
  );
}

// ── Queue ────────────────────────────────────────────────

interface QueueProps {
  tasks: DispatchTask[];
  nameOf: (printerId: string) => string;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
}

/** Commands still to run, running, or failed — newest first. */
function Queue({ tasks, nameOf, onRetry, onCancel }: QueueProps) {
  const open = tasks
    .filter((t) => t.state === 'queued' || t.state === 'running' || t.state === 'failed')
    .sort((a, b) => b.createdAt - a.createdAt);
  if (open.length === 0) return <p class="planner-muted dispatch-queue-empty">Nothing queued.</p>;
  return (
    <ol class="dispatch-queue">
      {open.map((t) => (
        <li key={t.id} class={`is-${t.state}`}>
          <span class="dispatch-queue-state">{t.state}</span>
          <span>
            {t.kind === 'upload' ? 'Upload' : 'Start'} <code>{t.file}</code> on <strong>{nameOf(t.printerId)}</strong>
            {t.attempts > 1 && <span class="planner-muted"> · try {t.attempts}</span>}
            {t.error && <span class="dispatch-job-error"> — {t.error}</span>}
          </span>
          <span class="dispatch-queue-actions">
            {t.state === 'failed' && <button type="button" class="btn" onClick={() => onRetry(t.id)}>Retry</button>}
            {(t.state === 'failed' || t.state === 'queued') && (
              <button type="button" class="btn" onClick={() => onCancel(t.id)}>{t.state === 'failed' ? 'Dismiss' : 'Cancel'}</button>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
