// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// One printer on the Printers page. Closed, it answers "is it OK and when is
// it done" at a glance; open, it adds the live camera and the finer numbers.
// The live stream only exists while the card is open: MJPEG never stops
// downloading, and a phone on the fleet's Wi-Fi feels it.

import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { PrinterLiveStatus, Webcam } from '@3d-gallery/print-toolkit';
import { formatWhen } from '../print/fleet-plan.js';
import {
  conditionLabel,
  filamentSensor,
  formatAgo,
  formatDuration,
  formatLayer,
  formatTemp,
  hasJob,
  isMixedContentError,
  isStale,
  printerCondition,
  type FleetPrinter,
  type PrinterPoll,
} from './fleet-model.js';
import { PrinterControls } from './PrinterControls.js';

/** How often the closed card's camera still is refreshed. */
const SNAPSHOT_MS = 10_000;

interface PrinterCardProps {
  printer: FleetPrinter;
  poll: PrinterPoll;
  now: number;
  expanded: boolean;
  onToggle(): void;
  onCommand(label: string, run: () => Promise<void>): void;
  /** The printer's queue, drawn above its controls. */
  children?: ComponentChildren;
}

export function PrinterCard({ printer, poll, now, expanded, onToggle, onCommand, children }: PrinterCardProps) {
  const condition = printerCondition(poll);
  const live = poll.live;
  const stale = isStale(poll, now);
  const reachable = poll.failures === 0 && !!live;
  const cam = poll.cams?.find((c) => c.snapshotUrl || c.streamUrl);

  return (
    <article class={`printers-card is-${condition}`} data-printer={printer.name} data-condition={condition}>
      <button type="button" class="printers-card-head" aria-expanded={expanded} onClick={onToggle}>
        <span class="printers-name">{printer.name}</span>
        <span class={`printers-chip is-${condition}`}>{conditionLabel(condition)}</span>
        <span class="printers-chevron" aria-hidden="true">{expanded ? '▴' : '▾'}</span>
      </button>

      {/* The summary toggles too, for a thumb; the head button is the keyboard's way in. */}
      <div class="printers-summary" onClick={onToggle}>
        {reachable && cam && !expanded && <Snapshot cam={cam} stamp={Math.floor((poll.lastOkAt ?? 0) / SNAPSHOT_MS)} />}
        {live ? (
          <Summary live={live} now={now} stale={stale} />
        ) : (
          condition === 'unreachable' && <p class="printers-note">No answer from {printer.address}.</p>
        )}
        {stale && poll.lastOkAt !== null && <p class="printers-note printers-stale">{formatAgo(poll.lastOkAt, now)}</p>}
      </div>

      {expanded && <Details poll={poll} cam={reachable ? cam : undefined} />}

      {children}

      <PrinterControls printer={printer} live={reachable ? live : null} onCommand={onCommand} />
    </article>
  );
}

function Summary({ live, now, stale }: { live: PrinterLiveStatus; now: number; stale: boolean }) {
  const job = hasJob(live);
  const layer = formatLayer(live);
  const sensor = filamentSensor(live.sensors);
  const pct = Math.round(live.progress * 100);
  return (
    <div class={`printers-facts${stale ? ' is-stale' : ''}`}>
      <dl class="printers-temps">
        <div>
          <dt>Nozzle</dt>
          <dd>{formatTemp(live.extruder)}</dd>
        </div>
        <div>
          <dt>Bed</dt>
          <dd>{formatTemp(live.bed)}</dd>
        </div>
      </dl>
      {job && (
        <>
          <p class="printers-file" title={live.file}>
            {live.file}
            {layer && <span class="printers-layer"> · {layer}</span>}
          </p>
          <div
            class="printers-progress"
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <span class="printers-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p class="printers-time">
            <strong>{pct}%</strong>
            {live.remainingSec > 0 && (
              <>
                {' · '}
                {formatDuration(live.remainingSec)} left · done {formatWhen(now + live.remainingSec * 1000, now)}
              </>
            )}
          </p>
        </>
      )}
      {sensor && (
        <p class={`printers-sensor${sensor.detected ? '' : ' is-empty'}`}>
          Filament: {sensor.detected ? 'loaded' : 'none'}
        </p>
      )}
    </div>
  );
}

function Snapshot({ cam, stamp }: { cam: Webcam; stamp: number }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [cam.snapshotUrl]);
  if (!cam.snapshotUrl || broken) return null;
  const src = `${cam.snapshotUrl}${cam.snapshotUrl.includes('?') ? '&' : '?'}_=${stamp}`;
  return <img class="printers-thumb" src={src} alt={`${cam.name} camera`} onError={() => setBroken(true)} />;
}

function Details({ poll, cam }: { poll: PrinterPoll; cam: Webcam | undefined }) {
  const live = poll.live;
  const [broken, setBroken] = useState(false);
  const streamSrc = cam?.streamUrl || cam?.snapshotUrl;
  return (
    <div class="printers-details">
      {streamSrc && !broken ? (
        <img class="printers-stream" src={streamSrc} alt={`${cam!.name} live`} onError={() => setBroken(true)} />
      ) : (
        <p class="printers-note">{cam ? 'Camera unreachable' : 'No camera'}</p>
      )}
      {live && (
        <dl class="printers-stats">
          <Stat label="Uptime" value={live.uptimeSec === null ? null : formatDuration(live.uptimeSec)} />
          <Stat label="Fan" value={pct(live.fanPct)} />
          <Stat label="Speed" value={pct(live.speedPct)} />
          <Stat label="Flow" value={pct(live.flowPct)} />
          <Stat label="Z offset" value={live.zOffset === null ? null : `${live.zOffset.toFixed(3)} mm`} />
          <Stat label="Elapsed" value={hasJob(live) ? formatDuration(live.elapsedSec) : null} />
        </dl>
      )}
      {live?.klippyMessage && <p class="printers-klippy">{live.klippyMessage}</p>}
      {live?.message && <p class="printers-note">Display: {live.message}</p>}
      {poll.error && !isMixedContentError(poll.error) && <p class="printers-note">{poll.error}</p>}
      {poll.console && poll.console.length > 0 && (
        <pre class="printers-console" aria-label="Console">
          {poll.console.map((l) => (l.type === 'command' ? `> ${l.message}` : l.message)).join('\n')}
        </pre>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  if (value === null) return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function pct(v: number | null): string | null {
  return v === null ? null : `${Math.round(v)}%`;
}
