// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// One printer's queue on its card: for each sent plan with plates for it,
// what the plan asks of this printer, the readiness checks, Print for the
// head of the belt, and the belt itself. Uploads and starts go through the
// plan's dispatch daemon; this only draws it and passes the operator's taps on.

import { projectUrl } from '../../shell/views.js';
import { formatDuration } from '../../print/planner-model.js';
import { printerStats, type PrinterStats } from '../../print/printer-stats.js';
import { latestStart, reportSummary } from '../../print/print-report.js';
import { canStart, jobPhase, needsUpload, nextJob, readinessChecks, type DispatchJob } from '../../print/dispatch-model.js';
import { bedQuestion, jobError, PHASE_TEXT, plateNumber, printerShares, type PrinterShare } from './queue-model.js';
import type { QueueEntry } from './queue-watch.js';
import { Figure, formatHours } from './Figure.js';
import './queue.css';

interface PrinterQueueProps {
  printerId: string;
  printerName: string;
  entries: QueueEntry[];
  focusId: string | null;
  loaded: string;
  onLoaded: (material: string) => void;
}

const BASE_MATERIALS = ['PLA', 'PETG', 'TPU'];

export function PrinterQueue({ printerId, printerName, entries, focusId, loaded, onLoaded }: PrinterQueueProps) {
  const shares = printerShares(entries.map((e) => e.snap.dispatch), printerId);
  if (shares.length === 0) return null;
  const byId = new Map(entries.map((e) => [e.projectId, e]));
  const waiting = shares.reduce((t, s) => t + s.jobs.length, 0);
  const materials = [...new Set([...shares.flatMap((s) => s.jobs.map((j) => j.material)), ...BASE_MATERIALS])];

  const refresh = () => {
    for (const s of shares) void byId.get(s.projectId)!.daemon.probe(printerId);
  };

  return (
    <section class="pq" aria-label={`${printerName}'s queue`}>
      <header class="pq-head">
        <h3 class="pq-title">Queue</h3>
        <span class="pq-count">{waiting === 0 ? 'empty' : `${waiting} plate${waiting === 1 ? '' : 's'}`}</span>
        <button type="button" class="pq-btn pq-refresh" title="Check again" aria-label={`Check ${printerName} again`} onClick={refresh}>↻</button>
        <label class="pq-loaded">
          Loaded
          <select value={loaded} onChange={(e) => onLoaded((e.target as HTMLSelectElement).value)}>
            <option value="">Unknown</option>
            {materials.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </header>
      {shares.map((share) => (
        <ProjectShare
          key={share.projectId}
          entry={byId.get(share.projectId)!}
          share={share}
          printerId={printerId}
          printerName={printerName}
          focused={share.projectId === focusId}
          showName={shares.length > 1 || focusId === null}
          loaded={loaded}
        />
      ))}
    </section>
  );
}

interface ProjectShareProps {
  entry: QueueEntry;
  share: PrinterShare;
  printerId: string;
  printerName: string;
  focused: boolean;
  showName: boolean;
  loaded: string;
}

function ProjectShare({ entry, share, printerId, printerName, focused, showName, loaded }: ProjectShareProps) {
  const { daemon, snap, plan, prints, thumbs } = entry;
  const d = snap.dispatch;
  const live = snap.live[printerId];
  const hasAddress = !!snap.printers.get(printerId)?.address;
  const next = nextJob(d, printerId);
  const checks = readinessChecks(live, next, loaded, hasAddress);
  const ready = !!next && canStart(checks);
  const stats = plan ? printerStats(plan, d.jobs).get(printerId) : undefined;
  const toUpload = needsUpload(d).filter((j) => j.printerId === printerId);
  const status = live?.status;
  const running = status?.state === 'printing' || status?.state === 'paused' ? status : undefined;

  const print = (job: DispatchJob) => {
    if (!confirm(`Start ${job.file} (${job.plateName}) on ${printerName}?\n\n${bedQuestion(live)}`)) return;
    daemon.print(printerId);
  };

  return (
    <div class={`pq-project${focused ? ' is-focus' : ''}`} data-project={entry.projectId}>
      {showName && (
        <a class="pq-project-name" href={projectUrl(entry.projectId)}>{entry.name}</a>
      )}

      {stats && stats.jobs > 0 && <PlanAsks stats={stats} printerName={printerName} />}

      {share.jobs.length > 0 && (
        <>
          <ul class="pq-checks">
            {checks.map((c) => (
              <li key={c.id} class={c.ok === true ? 'is-ok' : c.ok === false ? 'is-bad' : 'is-unknown'}>
                <span aria-hidden="true">{c.ok === true ? '✓' : c.ok === false ? '✕' : '?'}</span> {c.text}
              </li>
            ))}
          </ul>
          <div class="pq-actions">
            {toUpload.length > 0 && (
              <button type="button" class="pq-btn" onClick={() => toUpload.forEach((j) => daemon.upload(j))}>
                Upload all ({toUpload.length})
              </button>
            )}
            <button
              type="button"
              class="pq-btn is-primary pq-print"
              disabled={!ready}
              title={ready ? undefined : 'Every check above has to pass'}
              onClick={() => next && print(next)}
            >
              {next ? `Print ${plateNumber(next)}` : 'Nothing to print'}
            </button>
          </div>
        </>
      )}

      <ol class="pq-belt" aria-label={`${entry.name} on ${printerName}`}>
        {share.jobs.map((job) => {
          const phase = jobPhase(d, job);
          const onPrinter = running?.filename === job.file ? running : undefined;
          const error = phase === 'failed' ? jobError(d, job) : undefined;
          const thumb = thumbs[job.plateId];
          return (
            <li key={job.file} class={`pq-job is-${phase}${job === next ? ' is-next' : ''}`} data-file={job.file}>
              <div class="pq-job-thumb">{thumb ? <img src={thumb} alt="" /> : null}</div>
              <div class="pq-job-body">
                <div class="pq-job-head">
                  <span class="pq-job-num">{plateNumber(job)}</span>
                  <strong>{job.plateName}</strong>
                </div>
                <div class="pq-job-meta">
                  <span class="pq-chip">{job.filament}</span>
                  <span>{formatDuration(job.seconds)}</span>
                  <span class={`pq-phase is-${phase}`}>
                    {PHASE_TEXT[phase]}
                    {onPrinter && ` ${Math.round(onPrinter.progress * 100)}% · ${formatDuration(onPrinter.remainingSec)} left`}
                  </span>
                </div>
                {error && <p class="pq-error">{error}</p>}
              </div>
              <div class="pq-job-actions">
                {(phase === 'waiting' || phase === 'failed' || phase === 'uploaded') && (
                  <button type="button" class="pq-btn" onClick={() => daemon.upload(job)}>
                    {phase === 'uploaded' ? 'Re-upload' : 'Upload'}
                  </button>
                )}
                {phase !== 'starting' && (
                  <button
                    type="button"
                    class="pq-btn"
                    title={phase === 'printing' ? 'Take it off the queue — the printer is not told' : undefined}
                    onClick={() => daemon.setOutcome(job, 'skipped')}
                  >
                    {phase === 'printing' ? 'Mark done' : 'Skip'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {share.finished.length > 0 && (
        <details class="pq-finished">
          <summary>{share.finished.length} off the queue</summary>
          <ul>
            {share.finished.map((j) => {
              const report = latestStart(prints, j.plateId, j.printerId)?.report;
              return (
                <li key={j.file}>
                  <span>
                    {j.file} — {j.outcome!.state}
                    {report && <span class="pq-muted"> · {reportSummary(report, Date.now())}</span>}
                    {report?.errors.map((e, i) => <span key={i} class="pq-error"> {e}</span>)}
                  </span>
                  <button type="button" class="pq-btn" onClick={() => daemon.setOutcome(j, undefined)}>Put back</button>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </div>
  );
}

/** What the plan asks of this printer and of the operator at it. */
function PlanAsks({ stats, printerName }: { stats: PrinterStats; printerName: string }) {
  return (
    <section class="pq-asks" aria-label={`What the plan asks of ${printerName}`}>
      <div class="pq-figures">
        <Figure value={`${stats.printed}/${stats.jobs}`} label="printed" />
        <Figure value={formatHours(stats.hours)} label="printing" title={stats.hoursPrinted > 0 ? `${formatHours(stats.hoursPrinted)} printed so far` : undefined} />
        <Figure value={stats.stops} label="stops" title="Trips that start a print here, plus collecting the last one" />
        <Figure value={stats.touches} label="touches" title={`${stats.clears} beds cleared, ${stats.starts} prints started`} />
        <Figure value={stats.swaps} label="swaps" title="Spool changes: a new material or colour" />
      </div>
      {stats.spools.length > 0 && (
        <ul class="pq-spools">
          {stats.spools.map((s) => (
            <li key={s.label}>
              <span>{s.label}</span>
              <strong>{s.approx ? '≈' : ''}{Math.round(s.grams)} g</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
