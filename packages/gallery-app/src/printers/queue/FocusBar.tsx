// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// The plan `?project=` points at: its name and how far it has got, the way
// back to Project, the runbook, Upload all, and the whole plan's figures.
// Its plates are highlighted on the printer cards below.

import { operatorUrl, projectUrl } from '../../shell/views.js';
import { formatWhen } from '../../print/fleet-plan.js';
import { fleetStats } from '../../print/printer-stats.js';
import { jobPhase, needsUpload, printerIds, type JobPhase } from '../../print/dispatch-model.js';
import { Figure, formatHours } from './Figure.js';
import type { QueueEntry } from './queue-watch.js';
import './queue.css';

interface FocusBarProps {
  projectId: string;
  /** Absent until the plan's daemon is up. */
  entry: QueueEntry | undefined;
  /** Where the page goes without a focus. */
  allHref: string;
}

export function FocusBar({ projectId, entry, allHref }: FocusBarProps) {
  const d = entry?.snap.dispatch;
  const phases = d ? d.jobs.map((j) => jobPhase(d, j)) : [];
  const count = (p: JobPhase) => phases.filter((x) => x === p).length;
  const toUpload = d ? needsUpload(d).length : 0;
  const fleet = entry?.plan && d ? fleetStats(entry.plan, d.jobs) : null;
  const grams = fleet ? fleet.spools.reduce((t, s) => t + s.grams, 0) : 0;

  return (
    <section class="pq-focus" aria-label="Plan">
      <div class="pq-focus-top">
        <a class="pq-focus-back" href={projectUrl(projectId)}>← Project</a>
        <strong class="pq-focus-name">{entry?.name ?? '…'}</strong>
        <a class="pq-focus-close" href={allHref} aria-label="Show every plan" title="Show every plan">✕</a>
      </div>
      <p class="pq-focus-tally">
        {!d ? 'Loading…' : d.jobs.length === 0 ? 'Nothing sent yet — press Send to printers in Project.' : (
          <>
            {count('uploaded') + count('starting') + count('printing') + count('finished')}/{d.jobs.length} uploaded
            {' · '}{count('printing')} printing · {count('finished')} finished
            {count('failed') > 0 && <span class="pq-bad"> · {count('failed')} failed</span>}
            <span class="pq-muted"> · sent {formatWhen(d.sentAt, Date.now())}</span>
          </>
        )}
      </p>
      <div class="pq-focus-tools">
        <a class="pq-btn" href={operatorUrl(projectId)}>Runbook</a>
        {entry && (
          <button type="button" class="pq-btn is-primary" disabled={toUpload === 0} onClick={() => entry.daemon.uploadAll()}>
            Upload all{toUpload > 0 ? ` (${toUpload})` : ''}
          </button>
        )}
      </div>
      {fleet && fleet.jobs > 0 && d && (
        <div class="pq-figures" aria-label="The whole plan">
          <Figure value={`${fleet.printed}/${fleet.jobs}`} label="printed" />
          <Figure value={formatHours(fleet.hours)} label={`print time on ${printerIds(d).length}`} />
          <Figure value={`${fleet.spools.some((s) => s.approx) ? '≈' : ''}${Math.round(grams)} g`} label="filament" />
          <Figure value={fleet.stops} label="trips" title="Trips to the printers, counting the final collection" />
          <Figure value={fleet.touches} label="touches" title="Beds cleared plus prints started" />
          <Figure value={fleet.swaps} label="spool swaps" />
        </div>
      )}
    </section>
  );
}
