// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
//
// The printers, fed like conveyor belts. Each row is one printer — its state,
// camera and readiness on the left, its plates queued out to the right in the
// order it prints them. Uploads run in the background (dispatch-daemon.ts);
// each printer's Print button starts the plate at the head of its belt once
// every check passes. Below, the queue of commands and the log of what they did.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Modal } from './Modal.js';
import { getProject, listPlates, plateSignature } from './plate-store.js';
import { resolvePlate } from './plate-resolve.js';
import { buildInstances } from './plate-geometry.js';
import { plateThumbnail } from './plate-thumbnail.js';
import { formatWhen, loadPlannerSettings, savePlannerSettings } from './fleet-plan.js';
import { formatDuration } from './planner-model.js';
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

export function PrintDispatch({ projectId, onClose, onOpenPlanner }: PrintDispatchProps) {
  const [daemon, setDaemon] = useState<DispatchDaemon | null>(null);
  const [snap, setSnap] = useState<DaemonSnapshot | null>(null);
  const [projectName, setProjectName] = useState('…');
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
  const [loaded, setLoadedState] = useState(() => loadPlannerSettings().loaded);
  const [activity, setActivity] = useState<'queue' | 'log'>('queue');

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
          const report = await resolvePlate(plate);
          thumb = plateThumbnail(plateSignature(plate), buildInstances(plate, report.objects));
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

  if (!daemon || !snap || !dispatch) {
    return <Modal title="Printers" onClose={onClose} bleed><div class="planner dispatch"><p class="plate-empty">Loading…</p></div></Modal>;
  }

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

  return (
    <Modal title={`Printers — ${projectName}`} onClose={onClose} bleed>
      <div class="planner dispatch">
        <header class="dispatch-bar">
          <button type="button" class="btn" onClick={onOpenPlanner}>← Plan</button>
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
          <div class="planner-pane-tools">
            {failed.length > 0 && (
              <button type="button" class="btn" onClick={() => daemon.retryAllFailed()}>Retry failed ({failed.length})</button>
            )}
            <button type="button" class="btn btn-primary" disabled={toUpload === 0} onClick={() => daemon.uploadAll()}>
              Upload all{toUpload > 0 ? ` (${toUpload})` : ''}
            </button>
          </div>
        </header>

        <div class="dispatch-rows">
          {rows.length === 0 && (
            <p class="plate-empty">No plan sent yet — go back to the plan and press Send to printers.</p>
          )}
          {rows.map((printerId) => (
            <PrinterBelt
              key={printerId}
              name={nameOf(printerId)}
              hasAddress={!!snap.printers.get(printerId)?.address}
              jobs={belt(dispatch, printerId)}
              finished={dispatch.jobs.filter((j) => j.printerId === printerId && j.outcome).sort((a, b) => a.order - b.order)}
              next={nextJob(dispatch, printerId)}
              live={snap.live[printerId]}
              cams={snap.cams[printerId] ?? []}
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
      </div>
    </Modal>
  );
}

// ── One printer's row ────────────────────────────────────

interface PrinterBeltProps {
  name: string;
  hasAddress: boolean;
  jobs: DispatchJob[];
  finished: DispatchJob[];
  next: DispatchJob | undefined;
  live: PrinterLive | undefined;
  cams: Webcam[];
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

function PrinterBelt(props: PrinterBeltProps) {
  const { name, jobs, next, live, loaded } = props;
  const checks = readinessChecks(live, next, loaded, props.hasAddress);
  const ready = !!next && canStart(checks);
  const status = live?.status;
  const running = status?.state === 'printing' || status?.state === 'paused' ? status : undefined;
  const foreign = running && !jobs.some((j) => j.file === running.filename) ? running : undefined;

  return (
    <section class="dispatch-row" data-printer={name}>
      <div class="dispatch-printer">
        <header class="dispatch-printer-head">
          <strong>{name}</strong>
          <button type="button" class="planner-chip-remove" title="Check again" aria-label={`Check ${name} again`} onClick={props.onRefresh}>↻</button>
        </header>
        <Camera cams={props.cams} stamp={live?.checkedAt ?? 0} />
        <ul class="dispatch-checks">
          {checks.map((c) => (
            <li key={c.id} class={c.ok === true ? 'is-ok' : c.ok === false ? 'is-bad' : 'is-unknown'}>
              <span aria-hidden="true">{c.ok === true ? '✓' : c.ok === false ? '✕' : '?'}</span> {c.text}
            </li>
          ))}
        </ul>
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
        {props.finished.length > 0 && (
          <details class="dispatch-finished">
            <summary>{props.finished.length} off the belt</summary>
            <ul>
              {props.finished.map((j) => (
                <li key={j.file}>
                  <span>{j.file} — {j.outcome!.state}</span>
                  <button type="button" class="btn" onClick={() => props.onOutcome(j, undefined)}>Put back</button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <ol class="dispatch-belt" aria-label={`${name}'s queue`}>
        {foreign && (
          <li class="dispatch-job is-foreign">
            <div class="dispatch-job-head"><strong>{foreign.filename}</strong></div>
            <div class="planner-muted">Not from this project · {formatDuration(foreign.remainingSec)} left</div>
            <Progress value={foreign.progress} />
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
              <div class="dispatch-job-head">
                <span class="planner-plate-num">#{String(job.order).padStart(2, '0')}</span>
                <strong>{job.plateName}</strong>
              </div>
              <div class="dispatch-job-meta">
                <span class="planner-chip">{job.filament}</span>
                <span>{formatDuration(job.seconds)}</span>
              </div>
              <div class={`dispatch-phase is-${phase}`}>
                {PHASE_TEXT[phase]}
                {onPrinter && ` ${Math.round(onPrinter.progress * 100)}% · ${formatDuration(onPrinter.remainingSec)} left`}
              </div>
              {onPrinter && <Progress value={onPrinter.progress} />}
              {error && <p class="dispatch-job-error">{error}</p>}
              <div class="dispatch-job-actions">
                {(phase === 'waiting' || phase === 'failed' || phase === 'uploaded') && (
                  <button type="button" class="btn" onClick={() => props.onUpload(job)}>
                    {phase === 'uploaded' ? 'Re-upload' : 'Upload'}
                  </button>
                )}
                {phase !== 'starting' && (
                  <button type="button" class="btn" title={phase === 'printing' ? 'Take it off the belt — the printer is not told' : undefined}
                    onClick={() => props.onOutcome(job, 'skipped')}>
                    {phase === 'printing' ? 'Mark done' : 'Skip'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {jobs.length === 0 && !foreign && <li class="dispatch-belt-empty planner-muted">Belt empty.</li>}
      </ol>
    </section>
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
