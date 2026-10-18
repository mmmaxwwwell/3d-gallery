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
import { bedQuestion, openTasks, printerShares, unshownPrinters } from './queue/queue-model.js';
import { canStart, jobPhase, nextJob, readinessChecks } from '../print/dispatch-model.js';
import { registerAgentView, NeedsConfirmation } from '../agent/registry.js';

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

  // ── Agent bridge (dev server only) ─────────────────────
  // Registered once; the actions read this render's values through the ref.
  const agent = useRef({ fleet, polls, queues });
  agent.current = { fleet, polls, queues };
  useEffect(() => {
    const printerFor = (key: unknown) => {
      const on = agent.current.fleet?.on ?? [];
      const p = on.find((x) => x.id === key) ?? on.find((x) => x.name === key)
        ?? on.find((x) => typeof key === 'string' && x.name.toLowerCase().includes(key.toLowerCase()));
      if (!p) throw new Error(`No printer "${String(key)}" shown. Printers: ${on.map((x) => x.name).join(', ')}.`);
      return p;
    };
    /** Each sent plan with plates for the printer: its next plate and whether it may start. */
    const queueOf = (printerId: string) => {
      const entries = agent.current.queues?.entries() ?? [];
      const loadedNow = agent.current.queues?.loaded ?? {};
      return printerShares(entries.map((e) => e.snap.dispatch), printerId).map((share) => {
        const entry = entries.find((e) => e.projectId === share.projectId)!;
        const d = entry.snap.dispatch;
        const live = entry.snap.live[printerId];
        const next = nextJob(d, printerId);
        const checks = readinessChecks(live, next, loadedNow[printerId] ?? '', !!entry.snap.printers.get(printerId)?.address);
        return { entry, live, next, checks, canStart: !!next && canStart(checks), share };
      });
    };
    registerAgentView({
      state: () => {
        const { fleet: f, polls: ps } = agent.current;
        return {
          printers: (f?.on ?? []).map((p) => {
            const live = ps[p.id]?.live;
            return {
              id: p.id,
              name: p.name,
              address: p.address,
              condition: printerCondition(ps[p.id]),
              error: ps[p.id]?.error ?? null,
              state: live?.state ?? null,
              file: live?.file || null,
              progress: live ? Math.round(live.progress * 1000) / 10 : null,
              remainingMin: live?.remainingSec ? Math.round(live.remainingSec / 60) : null,
              nozzle: live?.extruder ? Math.round(live.extruder.actual) : null,
              bed: live?.bed ? Math.round(live.bed.actual) : null,
              loaded: agent.current.queues?.loaded[p.id] ?? null,
              queue: queueOf(p.id).map((q) => ({
                project: q.entry.name,
                projectId: q.entry.projectId,
                plates: q.share.jobs.map((j) => ({ file: j.file, plate: j.plateName, material: j.material, phase: jobPhase(q.entry.snap.dispatch, j) })),
                next: q.next ? { file: q.next.file, plate: q.next.plateName } : null,
                checks: q.checks.map((c) => ({ ok: c.ok, text: c.text })),
                canStart: q.canStart,
              })),
            };
          }),
          switchedOff: (f?.off ?? []).map((p) => p.name),
          queueTasks: openTasks((agent.current.queues?.entries() ?? []).map((e) => e.snap.dispatch))
            .map((t) => ({ kind: t.kind, state: t.state, printer: t.printerId, file: t.file, error: t.error ?? null })),
        };
      },
      actions: {
        'printers.start': {
          description:
            'REACHES A PRINTER. Start the plate at the head of a printer\'s queue, once its checks pass '
            + '(online, Klipper ready, idle, file uploaded). Asks whether the bed is clear: put that '
            + 'question to the person, and repeat with confirm: true only when they say it is.',
          writes: true,
          args: {
            type: 'object',
            properties: {
              printer: { type: 'string', description: 'Printer id or name.' },
              project: { type: 'string', description: 'Project id, when several sent plans queue on this printer.' },
            },
            required: ['printer'],
          },
          run(args, ctx) {
            const printer = printerFor(args['printer']);
            const queue = queueOf(printer.id).filter((q) => !args['project'] || q.entry.projectId === args['project']);
            const q = queue.find((x) => x.next);
            if (!q || !q.next) throw new Error(`${printer.name} has nothing queued to start.`);
            if (!q.canStart) {
              throw new Error(`${printer.name} can't start ${q.next.file} yet: ${q.checks.filter((c) => c.ok !== true && c.id !== 'filament').map((c) => c.text).join('; ')}.`);
            }
            if (!ctx.confirmed) {
              throw new NeedsConfirmation(`Start ${q.next.file} (${q.next.plateName}) on ${printer.name}? ${bedQuestion(q.live)}`);
            }
            q.entry.daemon.print(printer.id);
            return { starting: q.next.file, printer: printer.name, next: 'app_state shows it printing once the printer reports it.' };
          },
        },
        'printers.upload_all': {
          description: 'REACHES A PRINTER. Upload every queued plate that has not gone to its printer yet. Nothing starts.',
          writes: true,
          run() {
            const entries = agent.current.queues?.entries() ?? [];
            for (const e of entries) e.daemon.uploadAll();
            return { plans: entries.length };
          },
        },
        'printers.set_loaded': {
          description: 'Record which filament family a printer has loaded (PLA, PETG, PCTG, TPU…). Advisory: the queue warns on a mismatch.',
          writes: true,
          args: {
            type: 'object',
            properties: { printer: { type: 'string' }, material: { type: 'string' } },
            required: ['printer', 'material'],
          },
          run(args) {
            const printer = printerFor(args['printer']);
            const settings = loadPlannerSettings();
            savePlannerSettings({ ...settings, loaded: { ...settings.loaded, [printer.id]: String(args['material']) } });
            return { printer: printer.name, loaded: String(args['material']) };
          },
        },
      },
    });
  }, []);

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
        <div class="printers-title-row">
          <h1 class="printers-title">Printers</h1>
          <div class="printers-title-actions">
            {entries.length > 0 && (
              <button
                type="button"
                class={`pq-btn pq-open-sheet${pending.some((t) => t.state === 'failed') ? ' is-bad' : ''}`}
                onClick={() => setSheetOpen(true)}
              >
                Queue ({pending.length})
              </button>
            )}
            <a class="printers-gear" href={`${import.meta.env.BASE_URL}${SETTINGS_PATH}`} aria-label="Settings" title="Settings: printers and presets">
              <span aria-hidden="true">⚙️</span>
            </a>
          </div>
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
