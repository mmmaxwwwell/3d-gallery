// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
//
// The operator's runbook: a phone screen for the trips to the printers. The
// home page counts down to the next session; a session's front page says
// what it holds and what to bring; each stop walks one printer through its
// steps. Start / Stop on a stop time the operator, so the plan's allowances
// can be checked against what the work really takes.
//
// It reads the plan the project view last drew (plan-snapshot.ts), so it can
// be read while planning and follows every re-plan. What the operator logs —
// timings, ticks, how prints went, photos — lives in operator-store.ts.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Page } from './Page.js';
import { loadPlanSnapshot, onPlanSnapshot, type PlanSnapshot } from './plan-snapshot.js';
import { getDaemon, hasDispatch } from './dispatch-daemon.js';
import type { PrinterLive } from './dispatch-model.js';
import { isFinal, latestStart, refreshPrintReports, reportSummary, type PrintReport } from './print-report.js';
import {
  OUTCOMES,
  TOOL_TEXT,
  countdown,
  filamentLabel,
  minutes,
  sessionStates,
  sessionTools,
  sessions as sessionsOf,
  stopHeadline,
  stopSteps,
  stopTools,
  upcoming,
  type OutcomeFlag,
  type Session,
  type SessionState,
  type StepId,
  type Stop,
  type ToolId,
} from './operator-model.js';
import {
  addPhoto,
  deletePhoto,
  listPhotos,
  listPrints,
  listSessionLogs,
  listStopLogs,
  onOperatorChange,
  patchSessionLog,
  patchStopLog,
  recordPrint,
  type Photo,
  type PhotoKind,
  type PrintRecord,
  type SessionLog,
  type StopLog,
} from './operator-store.js';

export interface OperatorAppProps {
  projectId: string;
  onClose: () => void;
  onOpenPlanner: () => void;
}

type View = { at: 'home' } | { at: 'session'; key: string } | { at: 'stop'; key: string };

interface Logs {
  stops: Map<string, StopLog>;
  sessions: Map<string, SessionLog>;
  photos: Photo[];
  prints: PrintRecord[];
}

const EMPTY: Logs = { stops: new Map(), sessions: new Map(), photos: [], prints: [] };

function clock(ms: number, now: number): string {
  const d = new Date(ms);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return new Date(now).toDateString() === d.toDateString() ? time : `${d.toLocaleDateString([], { weekday: 'short' })} ${time}`;
}

function grams(g: number, approx: boolean): string {
  return `${approx ? '≈' : ''}${Math.round(g)} g`;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function num(order: number): string {
  return `#${String(order).padStart(2, '0')}`;
}

// ── Screen ───────────────────────────────────────────────

export function OperatorApp({ projectId, onClose, onOpenPlanner }: OperatorAppProps) {
  const [plan, setPlan] = useState<PlanSnapshot | null>(() => loadPlanSnapshot(projectId));
  const [logs, setLogs] = useState<Logs>(EMPTY);
  const [live, setLive] = useState<Record<string, PrinterLive>>({});
  const [now, setNow] = useState(() => Date.now());
  const [view, setView] = useState<View>({ at: 'home' });

  useEffect(() => onPlanSnapshot((id) => { if (id === projectId) setPlan(loadPlanSnapshot(projectId)); }), [projectId]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [stops, sessionLogs, photos, prints] = await Promise.all([
        listStopLogs(projectId), listSessionLogs(projectId), listPhotos(projectId), listPrints(projectId),
      ]);
      if (cancelled) return;
      setLogs({
        stops: new Map(stops.map((s) => [s.key, s])),
        sessions: new Map(sessionLogs.map((s) => [s.key, s])),
        photos,
        prints,
      });
    };
    void load().catch(() => {});
    const off = onOperatorChange((id) => { if (id === projectId) void load().catch(() => {}); });
    return () => { cancelled = true; off(); };
  }, [projectId]);

  // Ask the printers about every print started here: on load, and each minute
  // while this is open. Answers land in the store, which reloads the logs.
  useEffect(() => {
    void refreshPrintReports(projectId).catch(() => {});
    const t = window.setInterval(() => void refreshPrintReports(projectId).catch(() => {}), 60_000);
    return () => window.clearInterval(t);
  }, [projectId]);

  // Live printer state, when the plan has been sent — a paused job to cancel,
  // a finished print still on the bed, the print this stop just started.
  useEffect(() => {
    if (!hasDispatch(projectId)) return;
    let off = () => {};
    let cancelled = false;
    void getDaemon(projectId).then((d) => {
      if (cancelled) return;
      setLive(d.snapshot.live);
      off = d.subscribe(() => setLive(d.snapshot.live));
    });
    return () => { cancelled = true; off(); };
  }, [projectId]);

  const list = useMemo(() => (plan ? sessionsOf(plan) : []), [plan]);
  const progress = (key: string) => logs.sessions.get(key);
  const states = sessionStates(list, progress, now);

  /** Something is known to be on this printer's bed besides what the plan says. */
  const hadPrint = (stop: Stop): boolean => {
    if (stop.previous) return true;
    const state = live[stop.printerId]?.status?.state;
    if (state === 'complete' || state === 'cancelled' || state === 'error') return true;
    return logs.prints.some((p) => p.printerId === stop.printerId && p.kind === 'start' && p.plateId !== stop.job.plateId);
  };

  const found = view.at === 'session'
    ? list.find((s) => s.key === view.key)
    : view.at === 'stop'
      ? list.find((s) => s.stops.some((st) => st.key === view.key))
      : undefined;

  const startStop = async (session: Session, stop: Stop) => {
    const at = Date.now();
    if (!progress(session.key)?.startedAt) await patchSessionLog({ key: session.key, projectId }, { startedAt: at });
    await patchStopLog({ key: stop.key, projectId, sessionKey: session.key }, { startedAt: at, stoppedAt: undefined });
  };

  const finishStop = async (session: Session, stop: Stop) => {
    const at = Date.now();
    await patchStopLog({ key: stop.key, projectId, sessionKey: session.key }, { stoppedAt: at });
    const allDone = session.stops.every((s) => s.key === stop.key || logs.stops.get(s.key)?.stoppedAt);
    if (allDone) await patchSessionLog({ key: session.key, projectId }, { endedAt: at });
  };

  let body;
  if (!plan || list.length === 0) {
    body = (
      <div class="op-scroll">
        <Hero label="Next session" big="--:--" sub={plan ? 'Nothing planned yet' : 'No plan yet — open the project and it plans itself'} />
        <button type="button" class="btn btn-primary op-wide" onClick={onOpenPlanner}>Open the project</button>
      </div>
    );
  } else if (view.at === 'stop' && found) {
    const stop = found.stops.find((s) => s.key === view.key)!;
    const lastPlateId = stop.previous?.plateId
      ?? [...logs.prints].filter((p) => p.printerId === stop.printerId && p.kind === 'start' && p.plateId !== stop.job.plateId)
        .sort((a, b) => b.at - a.at)[0]?.plateId;
    body = (
      <StopPage
        projectId={projectId}
        session={found}
        stop={stop}
        log={logs.stops.get(stop.key)}
        photos={logs.photos.filter((p) => p.stopKey === stop.key)}
        hadPrint={hadPrint(stop)}
        lastPlateId={lastPlateId}
        live={live[stop.printerId]}
        lastReport={lastPlateId ? latestStart(logs.prints, lastPlateId, stop.printerId)?.report : undefined}
        ownReport={latestStart(logs.prints, stop.job.plateId, stop.printerId)?.report}
        now={now}
        stopLog={(key) => logs.stops.get(key)}
        onStart={() => void startStop(found, stop)}
        onFinish={() => void finishStop(found, stop)}
        onOpenStop={(key) => setView({ at: 'stop', key })}
        onBack={() => setView({ at: 'session', key: found.key })}
      />
    );
  } else if (view.at === 'session' && found) {
    const state = states[list.indexOf(found)];
    body = (
      <SessionPage
        session={found}
        state={state}
        log={progress(found.key)}
        stopLog={(key) => logs.stops.get(key)}
        hadPrint={hadPrint}
        now={now}
        onOpenStop={(key) => setView({ at: 'stop', key })}
        onStart={() => {
          const first = found.stops.find((s) => !logs.stops.get(s.key)?.stoppedAt) ?? found.stops[0];
          void patchSessionLog({ key: found.key, projectId }, { startedAt: progress(found.key)?.startedAt ?? Date.now() });
          setView({ at: 'stop', key: first.key });
        }}
        onEnd={() => void patchSessionLog({ key: found.key, projectId }, { endedAt: Date.now() })}
        onReopen={() => void patchSessionLog({ key: found.key, projectId }, { endedAt: undefined })}
        onBack={() => setView({ at: 'home' })}
      />
    );
  } else {
    body = (
      <HomePage
        plan={plan}
        list={list}
        states={states}
        progress={progress}
        now={now}
        onOpen={(key) => setView({ at: 'session', key })}
      />
    );
  }

  return (
    <Page label="Operator runbook" onClose={onClose}>
      <div class="op">
        <header class="op-bar">
          <button type="button" class="btn" onClick={onOpenPlanner}>← Project</button>
          <span class="op-bar-title">{plan?.projectName ?? 'Runbook'}</span>
          <button type="button" class="btn op-bar-close" aria-label="Close" onClick={onClose}>×</button>
        </header>
        {body}
      </div>
    </Page>
  );
}

// ── Home ─────────────────────────────────────────────────

function Hero({ label, big, sub, tone }: { label: string; big: string; sub: string; tone?: 'due' | 'active' }) {
  return (
    <section class={`op-hero${tone ? ` is-${tone}` : ''}`} aria-live="polite">
      <div class="op-hero-label">{label}</div>
      <div class="op-hero-big">{big}</div>
      <div class="op-hero-sub">{sub}</div>
    </section>
  );
}

/** The countdown to the session that's next, or what's happening now. */
function sessionHero(session: Session | undefined, log: SessionLog | undefined, now: number) {
  if (!session) return <Hero label="Next session" big="--:--" sub="Every session is done" />;
  if (log?.startedAt) {
    return <Hero tone="active" label={`Session ${session.index} · in progress`} big={countdown(now - log.startedAt)} sub={`Started ${clock(log.startedAt, now)} · planned ${session.estMin} min`} />;
  }
  if (session.at <= now) {
    return <Hero tone="due" label={`Session ${session.index} · due`} big="Now" sub={`Due since ${clock(session.at, now)}`} />;
  }
  return <Hero label={`Session ${session.index} in`} big={countdown(session.at - now)} sub={clock(session.at, now)} />;
}

const STATE_TEXT: Record<SessionState, string> = {
  done: 'Done',
  active: 'In progress',
  due: 'Due now',
  next: 'Up next',
  later: 'Later',
};

interface HomeProps {
  plan: PlanSnapshot;
  list: Session[];
  states: SessionState[];
  progress: (key: string) => SessionLog | undefined;
  now: number;
  onOpen: (key: string) => void;
}

function HomePage({ plan, list, states, progress, now, onOpen }: HomeProps) {
  const next = upcoming(list, progress);
  return (
    <div class="op-scroll">
      {sessionHero(next, next && progress(next.key), now)}
      <p class="op-note">
        {plural(list.length, 'session')} · last print done {clock(plan.finish, now)}
        {plan.collect > plan.finish ? `, collect ${clock(plan.collect, now)}` : ''}
      </p>
      <ol class="op-cards">
        {list.map((s, i) => {
          const log = progress(s.key);
          const took = log?.startedAt && log.endedAt ? log.endedAt - log.startedAt : null;
          return (
            <li key={s.key}>
              <button type="button" class={`op-card op-session is-${states[i]}`} onClick={() => onOpen(s.key)}>
                <div class="op-card-head">
                  <span class="op-card-title">Session {s.index}</span>
                  <span class={`op-chip is-${states[i]}`}>{STATE_TEXT[states[i]]}</span>
                </div>
                <div class="op-session-when">{clock(s.at, now)}</div>
                <div class="op-card-meta">
                  {plural(s.stops.length, 'printer')}
                  {s.changes > 0 && ` · ${plural(s.changes, 'filament change')}`}
                  {' · '}{took !== null ? `took ${minutes(took)} of ${s.estMin} min` : `~${s.estMin} min`}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Session ──────────────────────────────────────────────

interface SessionProps {
  session: Session;
  state: SessionState;
  log: SessionLog | undefined;
  stopLog: (key: string) => StopLog | undefined;
  hadPrint: (stop: Stop) => boolean;
  now: number;
  onOpenStop: (key: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onReopen: () => void;
  onBack: () => void;
}

function ToolChips({ tools, spools }: { tools: ToolId[]; spools: string[] }) {
  return (
    <ul class="op-tools">
      {tools.flatMap((t) => (t === 'spools'
        ? spools.map((s) => <li key={`spool-${s}`} class="op-tool is-spool">{s}</li>)
        : [<li key={t} class="op-tool">{TOOL_TEXT[t]}</li>]))}
    </ul>
  );
}

function SessionPage({ session, state, log, stopLog, hadPrint, now, onOpenStop, onStart, onEnd, onReopen, onBack }: SessionProps) {
  const tools = sessionTools(session.stops, (id) => hadPrint(session.stops.find((s) => s.printerId === id)!));
  const doneStops = session.stops.filter((s) => stopLog(s.key)?.stoppedAt).length;
  return (
    <div class="op-scroll">
      <button type="button" class="op-back" onClick={onBack}>← Sessions</button>
      {state === 'done' && log?.startedAt && log.endedAt
        ? <Hero label={`Session ${session.index} · done`} big={minutes(log.endedAt - log.startedAt)} sub={`Planned ${session.estMin} min · ${clock(log.startedAt, now)}`} />
        : sessionHero(session, log, now)}

      <div class="op-facts">
        <div class="op-fact"><span class="op-fact-label">Starts</span><strong>{clock(session.at, now)}</strong></div>
        <div class="op-fact"><span class="op-fact-label">Printers</span><strong>{session.stops.length}</strong></div>
        <div class="op-fact"><span class="op-fact-label">Filament changes</span><strong>{session.changes}</strong></div>
        <div class="op-fact"><span class="op-fact-label">Planned</span><strong>{session.estMin} min</strong></div>
      </div>

      <section class="op-card">
        <h3 class="op-card-title">Filament going on</h3>
        <ul class="op-filaments">
          {session.filaments.map((f) => (
            <li key={f.label}><span>{f.label}</span><strong>{grams(f.grams, f.approx)}</strong><span class="op-muted">{plural(f.prints, 'print')}</span></li>
          ))}
        </ul>
      </section>

      <section class="op-card">
        <h3 class="op-card-title">Bring</h3>
        <ToolChips tools={tools} spools={session.filaments.map((f) => f.label)} />
      </section>

      <ol class="op-cards">
        {session.stops.map((stop) => {
          const l = stopLog(stop.key);
          const status = l?.stoppedAt && l.startedAt ? `✓ ${minutes(l.stoppedAt - l.startedAt)}` : l?.startedAt ? 'In progress' : `~${stop.estMin} min`;
          return (
            <li key={stop.key}>
              <button type="button" class={`op-card op-stop-card${l?.stoppedAt ? ' is-done' : l?.startedAt ? ' is-active' : ''}`} onClick={() => onOpenStop(stop.key)}>
                <div class="op-card-head">
                  <span class="op-card-title">Stop {stop.index} · {stop.printerName}</span>
                  <span class="op-muted">{status}</span>
                </div>
                <div class="op-card-meta">{stopHeadline(stop, hadPrint(stop))}</div>
                <div class="op-card-meta op-muted">{num(stop.job.order)} {stop.job.plateName}</div>
              </button>
            </li>
          );
        })}
      </ol>

      <div class="op-actions">
        {state === 'done' ? (
          <button type="button" class="btn op-wide" onClick={onReopen}>Reopen session</button>
        ) : (
          <>
            <button type="button" class="btn btn-primary op-wide op-big" onClick={onStart}>
              {log?.startedAt ? `Continue · ${doneStops}/${session.stops.length} stops done` : 'Start session'}
            </button>
            {log?.startedAt && <button type="button" class="btn op-wide" onClick={onEnd}>End session</button>}
          </>
        )}
      </div>
    </div>
  );
}

// ── Stop ─────────────────────────────────────────────────

interface StopProps {
  projectId: string;
  session: Session;
  stop: Stop;
  log: StopLog | undefined;
  photos: Photo[];
  hadPrint: boolean;
  /** The plate whose parts come off this bed, when known. */
  lastPlateId: string | undefined;
  live: PrinterLive | undefined;
  /** What the printer said about the print coming off this bed, and about this stop's own print. */
  lastReport: PrintReport | undefined;
  ownReport: PrintReport | undefined;
  now: number;
  stopLog: (key: string) => StopLog | undefined;
  onStart: () => void;
  onFinish: () => void;
  onOpenStop: (key: string) => void;
  onBack: () => void;
}

const STEP_TITLE: Record<StepId, string> = {
  log: 'Log the last print',
  clear: 'Clear the bed',
  bed: 'Fresh, clean bed on the printer',
  filament: 'Filament',
  start: 'Start the print',
  firstLayer: 'Watch the first layer',
};

function StopPage(props: StopProps) {
  const { projectId, session, stop, log, photos, hadPrint, live, now } = props;
  const base = { key: stop.key, projectId, sessionKey: session.key };
  const patch = (p: Partial<StopLog>) => void patchStopLog(base, p);
  const check = (step: StepId, on: boolean) => patch({ checked: { [step]: on } });
  const steps = stopSteps(stop, hadPrint);
  const done = steps.filter((s) => log?.checked[s]).length;
  const next = session.stops[stop.index];
  const status = live?.status;
  const paused = status?.state === 'paused' && status.filename !== stop.job.file ? status.filename : undefined;
  const printingIt = status?.state === 'printing' && status.filename === stop.job.file;
  const coming = stop.previous ? `${num(stop.previous.order)} ${stop.previous.plateName}` : 'the print on the bed';
  const outcome = log?.outcome ?? { plateId: props.lastPlateId ?? '', flags: [] as OutcomeFlag[], note: '' };
  const photo = (kind: PhotoKind, plateId: string) => (blob: Blob) =>
    void addPhoto({ projectId, stopKey: stop.key, plateId, kind, blob });
  const shots = (kind: PhotoKind) => photos.filter((p) => p.kind === kind);

  const toggleFlag = (flag: OutcomeFlag) => {
    const on = outcome.flags.includes(flag);
    const flags = on
      ? outcome.flags.filter((f) => f !== flag)
      : flag === 'ok' ? ['ok' as const] : [...outcome.flags.filter((f) => f !== 'ok'), flag];
    patch({ outcome: { ...outcome, flags }, checked: { log: flags.length > 0 } });
  };

  const running = log?.startedAt && !log.stoppedAt;
  const elapsed = log?.startedAt ? (log.stoppedAt ?? now) - log.startedAt : 0;
  const g = stop.job.grams;

  return (
    <div class="op-scroll">
      <button type="button" class="op-back" onClick={props.onBack}>← Session {session.index}</button>
      <ol class="op-dots" aria-label={`Stop ${stop.index} of ${session.stops.length}`}>
        {session.stops.map((s) => {
          const l = props.stopLog(s.key);
          return (
            <li key={s.key}>
              <button
                type="button"
                class={`op-dot${s.key === stop.key ? ' is-here' : ''}${l?.stoppedAt ? ' is-done' : ''}`}
                aria-label={`Stop ${s.index} · ${s.printerName}`}
                onClick={() => props.onOpenStop(s.key)}
              >{s.index}</button>
            </li>
          );
        })}
      </ol>

      <section class="op-card op-stop-head">
        <div class="op-hero-label">Stop {stop.index} of {session.stops.length}</div>
        <h2 class="op-stop-printer">{stop.printerName}</h2>
        <div class="op-card-meta">{stopHeadline(stop, hadPrint)}</div>
      </section>

      <section class={`op-card op-timer${running ? ' is-running' : ''}`}>
        <div class="op-timer-time">{log?.startedAt ? countdown(elapsed) : '0:00'}</div>
        <div class="op-muted">{log?.stoppedAt ? `Done · planned ${stop.estMin} min` : `Planned ${stop.estMin} min · ${done}/${steps.length} steps`}</div>
        {running
          ? <button type="button" class="btn btn-primary op-wide op-big" onClick={props.onFinish}>Stop task</button>
          : <button type="button" class="btn btn-primary op-wide op-big" onClick={props.onStart}>{log?.stoppedAt ? 'Restart task' : 'Start task'}</button>}
      </section>

      <section class="op-card">
        <h3 class="op-card-title">You'll need</h3>
        <ToolChips tools={stopTools(stop, hadPrint)} spools={[filamentLabel(stop.job)]} />
      </section>

      {steps.map((step, i) => (
        <section key={step} class={`op-card op-step${log?.checked[step] ? ' is-done' : ''}`}>
          <label class="op-step-head">
            <input type="checkbox" checked={!!log?.checked[step]} onChange={(e) => {
              const on = (e.target as HTMLInputElement).checked;
              check(step, on);
              if (step === 'start' && on) {
                void recordPrint({
                  projectId, plateId: stop.job.plateId, printerId: stop.printerId,
                  file: stop.job.file, at: Date.now(), kind: 'start', source: 'runbook',
                });
              }
            }} />
            <span class="op-step-num">{i + 1}</span>
            <span class="op-step-title">{STEP_TITLE[step]}</span>
          </label>

          {step === 'log' && (
            <div class="op-step-body">
              <p>How did {coming} go?</p>
              {props.lastReport && <PrinterSays report={props.lastReport} now={now} />}
              <div class="op-flags">
                {OUTCOMES.map(([flag, text]) => (
                  <button key={flag} type="button" aria-pressed={outcome.flags.includes(flag)}
                    class={`op-flag${outcome.flags.includes(flag) ? ' is-on' : ''}${flag === 'ok' ? ' is-ok' : ''}`}
                    onClick={() => toggleFlag(flag)}>{text}</button>
                ))}
              </div>
              <Note value={outcome.note} placeholder="Anything worth remembering" onCommit={(note) => patch({ outcome: { ...outcome, note } })} />
              <Photos label="Photo of the print" shots={shots('last-print')} onAdd={photo('last-print', outcome.plateId)} />
            </div>
          )}

          {step === 'clear' && (
            <div class="op-step-body">
              <p>Take {coming} off.</p>
              <div class="op-seg" role="group" aria-label="How the bed is cleared">
                <button type="button" class={log?.clearMethod === 'swap' ? 'is-on' : ''} onClick={() => patch({ clearMethod: 'swap' })}>Swap in a spare bed</button>
                <button type="button" class={log?.clearMethod === 'bin' ? 'is-on' : ''} onClick={() => patch({ clearMethod: 'bin' })}>Parts into a bin</button>
              </div>
              {log?.clearMethod === 'bin' && (
                <>
                  <Photos label="Photo: parts in the bin" shots={shots('bin-parts')} onAdd={photo('bin-parts', outcome.plateId)} />
                  <Photos label="Photo: the bin's label or code" shots={shots('bin-label')} onAdd={photo('bin-label', outcome.plateId)} />
                </>
              )}
              {log?.clearMethod === 'swap' && <p class="op-muted">Put the full bed somewhere it won't get knocked, parts still on.</p>}
            </div>
          )}

          {step === 'bed' && (
            <div class="op-step-body"><p class="op-muted">Seated, clean, nothing on it.</p></div>
          )}

          {step === 'filament' && (
            <div class="op-step-body">
              {stop.swap ? (
                <ol class="op-substeps">
                  <li>Heat up, cut <strong>{stop.swap.from}</strong> at the extruder and unload it.</li>
                  <li>Load <strong>{stop.swap.to}</strong> and purge until it runs clean.</li>
                  <li>At least <strong>{g !== undefined ? grams(g, !stop.job.sliced) : 'enough'}</strong> on the spool.</li>
                </ol>
              ) : (
                <p><strong>{filamentLabel(stop.job)}</strong> loaded, at least <strong>{g !== undefined ? grams(g, !stop.job.sliced) : 'enough for the print'}</strong> on the spool.</p>
              )}
            </div>
          )}

          {step === 'start' && (
            <div class="op-step-body">
              {paused && <p class="op-warn">Cancel the paused <code>{paused}</code> first.</p>}
              <p>Start <strong>{num(stop.job.order)} {stop.job.plateName}</strong></p>
              <p class="op-muted"><code>{stop.job.file}</code> · done about {clock(stop.job.end, now)}</p>
              {props.ownReport
                ? <PrinterSays report={props.ownReport} now={now} />
                : printingIt && <p class="op-good">The printer says it's printing this.</p>}
            </div>
          )}

          {step === 'firstLayer' && (
            <div class="op-step-body">
              <p>Stay for the first layer.</p>
              <div class="op-seg" role="group" aria-label="First layer">
                <button type="button" class={log?.firstLayer?.ok === true ? 'is-on is-ok' : ''}
                  onClick={() => patch({ firstLayer: { ok: true, note: log?.firstLayer?.note ?? '', at: Date.now() }, checked: { firstLayer: true } })}>
                  Went down OK
                </button>
                <button type="button" class={log?.firstLayer?.ok === false ? 'is-on is-bad' : ''}
                  onClick={() => patch({ firstLayer: { ok: false, note: log?.firstLayer?.note ?? '', at: Date.now() }, checked: { firstLayer: true } })}>
                  Problem
                </button>
              </div>
              {log?.firstLayer?.ok === false && (
                <>
                  <Note value={log.firstLayer.note} placeholder="What went wrong" onCommit={(note) => patch({ firstLayer: { ...log.firstLayer!, note } })} />
                  <Photos label="Photo of the first layer" shots={shots('first-layer')} onAdd={photo('first-layer', stop.job.plateId)} />
                </>
              )}
            </div>
          )}
        </section>
      ))}

      <div class="op-actions">
        {running && done === steps.length && (
          <button type="button" class="btn btn-primary op-wide op-big" onClick={props.onFinish}>Stop task</button>
        )}
        {next
          ? <button type="button" class="btn op-wide" onClick={() => props.onOpenStop(next.key)}>Next: Stop {next.index} · {next.printerName} →</button>
          : <button type="button" class="btn op-wide" onClick={props.onBack}>Back to the session</button>}
      </div>
    </div>
  );
}

function Note({ value, placeholder, onCommit }: { value: string; placeholder: string; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <textarea
      class="op-note-input"
      rows={2}
      placeholder={placeholder}
      value={draft ?? value}
      onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)}
      onBlur={() => { if (draft !== null && draft !== value) onCommit(draft); setDraft(null); }}
    />
  );
}

function Photos({ label, shots, onAdd }: { label: string; shots: Photo[]; onAdd: (blob: Blob) => void }) {
  const urls = useMemo(() => shots.map((p) => ({ photo: p, url: URL.createObjectURL(p.blob) })), [shots.map((p) => p.id).join()]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u.url)), [urls]);
  return (
    <div class="op-photos">
      {urls.map(({ photo, url }) => (
        <figure key={photo.id} class="op-photo">
          <img src={url} alt="" />
          <button type="button" class="op-photo-remove" aria-label="Remove photo" onClick={() => { if (confirm('Remove this photo?')) void deletePhoto(photo); }}>×</button>
        </figure>
      ))}
      <label class="op-photo-add">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const input = e.target as HTMLInputElement;
            for (const file of input.files ?? []) onAdd(file);
            input.value = '';
          }}
        />
        📷 {label}
      </label>
    </div>
  );
}

/** What the printer reported about a print, from its job history and console. */
function PrinterSays({ report, now }: { report: PrintReport; now: number }) {
  const tone = report.state === 'printed' ? 'is-good'
    : report.state === 'error' || report.state === 'cancelled' || report.errors.length > 0 ? 'is-bad'
      : '';
  return (
    <div class={`op-printer-says ${tone}`}>
      <div class="op-printer-says-label">The printer says{isFinal(report) ? '' : ` · checked ${clock(report.checkedAt, now)}`}</div>
      <div>{reportSummary(report, now)}</div>
      {report.errors.length > 0 && (
        <ul class="op-printer-errors">
          {report.errors.slice(-5).map((e, i) => <li key={i}><code>{e}</code></li>)}
        </ul>
      )}
    </div>
  );
}
