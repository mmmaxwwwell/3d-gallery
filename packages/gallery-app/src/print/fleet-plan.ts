// SPDX-License-Identifier: MIT
import {
  dailyBlocks,
  planSchedule,
  type OperatorBlock,
  type Schedule,
  type ScheduleJob,
  type ScheduleObjective,
  type SchedulePrinter,
} from '@3d-gallery/print-toolkit';

/** Per browser, shared by every project: they describe the operator and the fleet, not a job. */
export interface PlannerSettings {
  objective: ScheduleObjective;
  /** "HH:MM", local. */
  bedtime: string;
  wake: string;
  changeoverMin: number;
  swapMin: number;
  /** One-off spans the operator is away, as `datetime-local` strings. */
  away: Array<{ start: string; end: string }>;
  /** printerId → false when switched off. Absent is on. */
  enabled: Record<string, boolean>;
  /** printerId → material family loaded. */
  loaded: Record<string, string>;
  /** Material family → filament preset id. */
  filaments: Record<string, string>;
}

const LS_PLANNER = '3dg:print:planner';
const DEFAULT_SETTINGS: PlannerSettings = {
  objective: 'makespan',
  bedtime: '23:00',
  wake: '07:00',
  changeoverMin: 5,
  swapMin: 15,
  away: [],
  enabled: {},
  loaded: {},
  filaments: {},
};

/** How far ahead operator bedtimes are laid out; a longer plan runs past them unconstrained. */
const HORIZON_DAYS = 21;
/** Flexibles print as one batch at the end, on one or two printers, rather than holding a printer all day. */
const LAST_MATERIALS = ['TPU'];

export function loadPlannerSettings(): PlannerSettings {
  try {
    const raw = localStorage.getItem(LS_PLANNER);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<PlannerSettings>) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

export function savePlannerSettings(settings: PlannerSettings): void {
  try {
    localStorage.setItem(LS_PLANNER, JSON.stringify(settings));
  } catch { /* private mode — settings last for the session */ }
}

/** Bedtimes over the planning horizon, plus the operator's away blocks. */
export function operatorBlocks(settings: PlannerSettings, now: number): OperatorBlock[] {
  return [
    ...dailyBlocks(settings.bedtime, settings.wake, now, HORIZON_DAYS),
    ...settings.away
      .map((a) => ({ start: new Date(a.start).getTime(), end: new Date(a.end).getTime() }))
      .filter((b) => Number.isFinite(b.start) && Number.isFinite(b.end) && b.end > b.start),
  ];
}

/** The planner's schedule for `jobs` on `fleet`, under the operator's settings. */
export function planFleet(
  jobs: ScheduleJob[],
  fleet: SchedulePrinter[],
  settings: PlannerSettings,
  unavailable: OperatorBlock[],
  now: number,
  objective: ScheduleObjective = settings.objective,
): Schedule {
  return planSchedule(jobs, fleet, {
    now,
    objective,
    changeoverSec: settings.changeoverMin * 60,
    materialSwapSec: settings.swapMin * 60,
    unavailable,
    lastMaterials: LAST_MATERIALS,
    lastMaterialPrinters: 2,
  });
}

/** A clock time, with the weekday when it isn't today. */
export function formatWhen(ms: number, now: number): string {
  const d = new Date(ms);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const today = new Date(now).toDateString() === d.toDateString();
  return today ? time : `${d.toLocaleDateString([], { weekday: 'short' })} ${time}`;
}
