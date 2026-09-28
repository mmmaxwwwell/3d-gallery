// SPDX-License-Identifier: MIT
// What the Printers page reads off each printer's polls: which printers it
// shows, what state each is in, which need someone, when to poll next, and
// how to word the numbers. No Preact and no fetches, so a test can drive it.

import type { ConsoleLine, FilamentSensorLive, HeaterLive, PrinterLiveStatus, Webcam } from '@3d-gallery/print-toolkit';
import type { PrintPreset } from '../print/print-storage.js';

/** A printer as every control on its card sees it. */
export interface FleetPrinter {
  id: string;
  name: string;
  /** Moonraker, from the preset's `print_host`. */
  address: string;
}

/** Everything known about one printer so far. */
export interface PrinterPoll {
  /** The last status that came back; kept through failures so the card can show it as stale. */
  live: PrinterLiveStatus | null;
  /** When `live` arrived, epoch ms. */
  lastOkAt: number | null;
  /** Polls failed in a row since the last one that worked. */
  failures: number;
  /** Why the last poll failed; null once one works. */
  error: string | null;
  /** Null until asked; the camera list only changes with the printer's config. */
  cams: Webcam[] | null;
  /** Only fetched while the card is open. */
  console: ConsoleLine[] | null;
}

export const EMPTY_POLL: PrinterPoll = { live: null, lastOkAt: null, failures: 0, error: null, cams: null, console: null };

/**
 * The printers the page shows: every imported printer preset that says where
 * its Moonraker is, split by the planner's switch. A switched-off printer is
 * most likely powered down, so polling it would only raise an alarm.
 */
export function fleetPrinters(
  presets: readonly PrintPreset[],
  enabled: Readonly<Record<string, boolean>>,
): { on: FleetPrinter[]; off: FleetPrinter[] } {
  const on: FleetPrinter[] = [];
  const off: FleetPrinter[] = [];
  for (const p of presets) {
    if (p.kind !== 'printer' || !p.address) continue;
    (enabled[p.id] === false ? off : on).push({ id: p.id, name: p.name, address: p.address });
  }
  const byName = (a: FleetPrinter, b: FleetPrinter) => a.name.localeCompare(b.name);
  return { on: on.sort(byName), off: off.sort(byName) };
}

// ── State ────────────────────────────────────────────────

export type Condition =
  | 'connecting'
  /** An https page can't reach an http printer; not the printer's fault. */
  | 'blocked'
  | 'unreachable'
  | 'shutdown'
  | 'error'
  | 'starting'
  | 'runout'
  | 'paused'
  | 'printing'
  | 'idle';

/** What puts a printer in the attention count and on the tab's badge. */
export const NEEDS_ATTENTION: ReadonlySet<Condition> = new Set(['unreachable', 'shutdown', 'error', 'runout', 'paused']);

const LABELS: Record<Condition, string> = {
  connecting: 'Connecting…',
  blocked: 'Blocked on https',
  unreachable: 'Unreachable',
  shutdown: 'Emergency stopped',
  error: 'Error',
  starting: 'Starting up',
  runout: 'Filament out',
  paused: 'Paused',
  printing: 'Printing',
  idle: 'Idle',
};

export function conditionLabel(c: Condition): string {
  return LABELS[c];
}

export function isMixedContentError(message: string | null): boolean {
  return !!message && message.startsWith('Mixed content blocked');
}

/**
 * The sensor that watches the filament path. The fleet's ZMOD config lists a
 * second one, `e1_sensor`, that is wired to nothing and always reads empty, so
 * "any sensor empty" would call every printer out of filament. Klipper numbers
 * the first extruder's `e0`; a printer with a single sensor uses that.
 */
export function filamentSensor(sensors: readonly FilamentSensorLive[]): FilamentSensorLive | null {
  const enabled = sensors.filter((s) => s.enabled);
  return enabled.find((s) => s.name === 'e0_sensor') ?? (enabled.length === 1 ? enabled[0] : null);
}

/** A running or paused print with no filament in the sensor. An idle printer is often unloaded on purpose. */
export function isRunout(live: PrinterLiveStatus): boolean {
  if (live.state !== 'printing' && live.state !== 'paused') return false;
  const sensor = filamentSensor(live.sensors);
  return !!sensor && !sensor.detected;
}

export function printerCondition(poll: PrinterPoll | undefined): Condition {
  if (!poll || (poll.failures === 0 && !poll.live)) return 'connecting';
  if (poll.failures > 0) return isMixedContentError(poll.error) ? 'blocked' : 'unreachable';
  const live = poll.live!;
  switch (live.klippyState) {
    case 'shutdown':
      return 'shutdown';
    case 'error':
    case 'disconnected':
      return 'error';
    case 'startup':
      return 'starting';
  }
  if (live.state === 'error') return 'error';
  if (isRunout(live)) return 'runout';
  if (live.state === 'paused') return 'paused';
  if (live.state === 'printing') return 'printing';
  return 'idle';
}

export interface FleetSummary {
  printing: number;
  idle: number;
  attention: number;
}

export function fleetSummary(conditions: readonly Condition[]): FleetSummary {
  return {
    printing: conditions.filter((c) => c === 'printing').length,
    idle: conditions.filter((c) => c === 'idle').length,
    attention: conditions.filter((c) => NEEDS_ATTENTION.has(c)).length,
  };
}

/** The Printers tab's badge: how many need someone, or nothing. */
export function printersBadge(conditions: readonly Condition[]): string | null {
  const n = fleetSummary(conditions).attention;
  return n > 0 ? String(n) : null;
}

// ── Polling ──────────────────────────────────────────────

export const POLL_VISIBLE_MS = 2_000;
export const POLL_HIDDEN_MS = 30_000;
const BACKOFF_CAP_MS = 60_000;
/** A reading older than this, with polls failing since, is shown as stale. */
export const STALE_MS = 10_000;

/** Wait before the next poll: doubling per failure in a row, so a printer that's off costs little. */
export function pollDelayMs(visible: boolean, failures: number): number {
  const base = visible ? POLL_VISIBLE_MS : POLL_HIDDEN_MS;
  return Math.min(base * 2 ** Math.min(failures, 10), Math.max(base, BACKOFF_CAP_MS));
}

/** Whether the card's numbers are from a reading that has since stopped coming. */
export function isStale(poll: PrinterPoll, now: number): boolean {
  return poll.lastOkAt !== null && poll.failures > 0 && now - poll.lastOkAt > STALE_MS;
}

// ── Wording ──────────────────────────────────────────────

/** "215 → 220 °C" while heating or holding, "24 °C" when off. */
export function formatTemp(h: HeaterLive | null): string {
  if (!h) return '—';
  const actual = Math.round(h.actual);
  return h.target > 0 ? `${actual} → ${Math.round(h.target)} °C` : `${actual} °C`;
}

/** "45m", "3h 07m", "2d 4h". */
export function formatDuration(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60));
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  if (d > 0) return `${d}d ${h}h`;
  return h === 0 ? `${m}m` : `${h}h ${String(m).padStart(2, '0')}m`;
}

/** "Layer 12 / 140" when the slicer reported layers, else null. */
export function formatLayer(live: PrinterLiveStatus): string | null {
  if (live.layer === null) return null;
  return live.totalLayers ? `Layer ${live.layer} / ${live.totalLayers}` : `Layer ${live.layer}`;
}

/** "Last seen 3 min ago". */
export function formatAgo(ms: number, now: number): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return `Last seen ${s} s ago`;
  if (s < 3600) return `Last seen ${Math.round(s / 60)} min ago`;
  return `Last seen ${formatDuration(s)} ago`;
}

/** Whether a print is under way, so progress and time left mean something. */
export function hasJob(live: PrinterLiveStatus): boolean {
  return (live.state === 'printing' || live.state === 'paused') && !!live.file;
}
