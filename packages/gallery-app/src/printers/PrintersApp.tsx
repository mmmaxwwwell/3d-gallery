// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// The Printers page: every printer live at once, built for a phone held at
// the printers. Which printers there are comes from the imported presets and
// the planner's on/off switch, both of which another page can change while
// this one is open. Each card carries the printer's queue from every sent
// plan; `?project=<id>` puts one plan in front.

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { listPresets, onPresetsChange } from '../print/print-storage.js';
import { loadPlannerSettings, onPlannerSettingsChange, savePlannerSettings } from '../print/fleet-plan.js';
import { setBadge } from '../shell/badges.js';
import { printersUrl, SETTINGS_PATH } from '../shell/views.js';
import {
  EMPTY_POLL,
  fleetPrinters,
  fleetSummary,
  isMixedContentError,
  printerCondition,
  printersBadge,
  type FleetPrinter,
  type PrinterPoll,
} from './fleet-model.js';
import { FleetPoller } from './fleet-poller.js';
import { PrinterCard } from './PrinterCard.js';
import { QueueWatch } from './queue/queue-watch.js';
import { PrinterQueue } from './queue/PrinterQueue.js';
import { FocusBar } from './queue/FocusBar.js';
import { QueueSheet } from './queue/QueueSheet.js';
import { openTasks, unshownPrinters } from './queue/queue-model.js';

const TOAST_MS = 4_000;

interface Fleet {
  on: FleetPrinter[];
  off: FleetPrinter[];
}

interface Toast {
  text: string;
  ok: boolean;
  id: number;
}

export function PrintersApp() {
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [polls, setPolls] = useState<Record<string, PrinterPoll>>({});
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState<Toast | null>(null);
  const [now, setNow] = useState(Date.now());
  const poller = useRef<FleetPoller | null>(null);
  const [focusId] = useState(() => new URLSearchParams(location.search).get('project'));
  const [queues, setQueues] = useState<QueueWatch | null>(null);
  const [, setQueueTick] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const watch = new QueueWatch(focusId, () => setQueueTick((n) => n + 1));
    setQueues(watch);
    return () => watch.stop();
  }, [focusId]);

  useEffect(() => {
    const p = new FleetPoller((id, poll) => {
      setPolls((prev) => ({ ...prev, [id]: poll }));
      setNow(Date.now());
    });
    poller.current = p;
    let alive = true;
    const reload = () =>
      void listPresets('printer').then((presets) => {
        if (!alive) return;
        const next = fleetPrinters(presets, loadPlannerSettings().enabled);
        p.setPrinters(next.on);
        setFleet(next);
      });
    reload();
    const offPresets = onPresetsChange((kind) => {
      if (kind === 'printer') reload();
    });
    const offPlanner = onPlannerSettingsChange(reload);
    // "Last seen" and the ETA clock move even while no poll answers.
    const clock = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => {
      alive = false;
      offPresets();
      offPlanner();
      window.clearInterval(clock);
      p.stop();
    };
  }, []);

  const conditions = useMemo(
    () => (fleet?.on ?? []).map((p) => printerCondition(polls[p.id])),
    [fleet, polls],
  );

  // The badge is written only once every printer has answered or failed, so
  // opening the page doesn't flash it to nothing while they connect.
  const lastBadge = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!fleet || conditions.includes('connecting')) return;
    const badge = printersBadge(conditions);
    if (badge === lastBadge.current) return;
    lastBadge.current = badge;
    setBadge('printers', badge);
  }, [fleet, conditions]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  const toggle = (id: string) => {
    const open = !expanded.has(id);
    const next = new Set(expanded);
    if (open) next.add(id);
    else next.delete(id);
    setExpanded(next);
    poller.current?.setExpanded(id, open);
  };

  const runCommand = (printerId: string) => (label: string, run: () => Promise<void>) => {
    void (async () => {
      try {
        await run();
        setToast({ text: `${label}: done`, ok: true, id: Date.now() });
      } catch (e) {
        setToast({ text: `${label} failed: ${e instanceof Error ? e.message : String(e)}`, ok: false, id: Date.now() });
      }
      poller.current?.pollNow(printerId);
    })();
  };

  if (!fleet) return <main class="printers" aria-busy="true" />;

  const entries = queues?.entries() ?? [];
  const dispatches = entries.map((e) => e.snap.dispatch);
  const pending = openTasks(dispatches);
  const unshown = unshownPrinters(dispatches, new Set(fleet.on.map((p) => p.id)));
  const loaded = queues?.loaded ?? {};
  const setLoaded = (printerId: string, material: string) => {
    const settings = loadPlannerSettings();
    savePlannerSettings({ ...settings, loaded: { ...settings.loaded, [printerId]: material } });
  };
  const nameOf = (printerId: string) =>
    entries.map((e) => e.snap.printers.get(printerId)?.name).find(Boolean) ?? printerId;

  const summary = fleetSummary(conditions);
  const blocked = fleet.on.some((p) => isMixedContentError(polls[p.id]?.error ?? null));

  return (
    <main class="printers">
      <header class="printers-header">
        <div class="pq-header-row">
          <h1 class="printers-title">Printers</h1>
          {entries.length > 0 && (
            <button
              type="button"
              class={`pq-btn pq-open-sheet${pending.some((t) => t.state === 'failed') ? ' is-bad' : ''}`}
              onClick={() => setSheetOpen(true)}
            >
              Queue ({pending.length})
            </button>
          )}
        </div>
        {fleet.on.length > 0 && (
          <p class="printers-strip" role="status">
            <span class="printers-count is-printing">{summary.printing} printing</span>
            <span class="printers-count is-idle">{summary.idle} idle</span>
            <span class={`printers-count is-attention${summary.attention ? ' is-hot' : ''}`}>
              {summary.attention} need{summary.attention === 1 ? 's' : ''} attention
            </span>
          </p>
        )}
      </header>

      {focusId && (
        <FocusBar projectId={focusId} entry={entries.find((e) => e.projectId === focusId)} allHref={printersUrl()} />
      )}

      {blocked && (
        <p class="printers-banner" role="note">
          <strong>Printers can't be reached from this secure page.</strong> Browsers don't let an https:// page talk to
          a printer over http://. Open the app over http:// on your own network, or use the Android app, to see and
          control your printers.
        </p>
      )}

      {fleet.on.length === 0 ? (
        <div class="printers-empty">
          <p>
            {fleet.off.length > 0
              ? 'Every printer is switched off in the planner settings.'
              : 'No printers yet. Import your OrcaSlicer printer presets; each one whose print host is set shows up here.'}
          </p>
          <a class="shell-button" href={`${import.meta.env.BASE_URL}${SETTINGS_PATH}`}>
            Settings → Import
          </a>
        </div>
      ) : (
        <div class="printers-grid">
          {fleet.on.map((p) => (
            <PrinterCard
              key={p.id}
              printer={p}
              poll={polls[p.id] ?? EMPTY_POLL}
              now={now}
              expanded={expanded.has(p.id)}
              onToggle={() => toggle(p.id)}
              onCommand={runCommand(p.id)}
            >
              <PrinterQueue
                printerId={p.id}
                printerName={p.name}
                entries={entries}
                focusId={focusId}
                loaded={loaded[p.id] ?? ''}
                onLoaded={(m) => setLoaded(p.id, m)}
              />
            </PrinterCard>
          ))}
        </div>
      )}

      {fleet.off.length > 0 && fleet.on.length > 0 && (
        <p class="printers-off">Switched off in the planner: {fleet.off.map((p) => p.name).join(', ')}</p>
      )}

      {unshown.length > 0 && (
        <p class="pq-unshown">Plates are queued for printers not shown here: {unshown.map(nameOf).join(', ')}.</p>
      )}

      {sheetOpen && <QueueSheet entries={entries} onClose={() => setSheetOpen(false)} />}

      {toast && (
        <p key={toast.id} class={`printers-toast${toast.ok ? '' : ' is-error'}`} role="status" aria-live="polite">
          {toast.text}
        </p>
      )}
    </main>
  );
}
