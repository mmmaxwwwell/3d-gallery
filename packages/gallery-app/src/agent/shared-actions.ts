// SPDX-License-Identifier: MIT
/**
 * Actions the agent can run from any view: they read and write the shared
 * stores every page sees, so they don't depend on which page is open.
 */

import { buildMoonrakerUrl, fetchPrinterLive, type PrinterLiveStatus } from '@3d-gallery/print-toolkit';
import { listPresets, type PresetKind, type PrintPreset } from '../print/print-storage.js';
import { flattenPresetForSlicer } from '../print/preset-flatten.js';
import { getActiveProjectId, listPlates, listProjects } from '../print/plate-store.js';
import { loadPlannerSettings, savePlannerSettings, type PlannerSettings } from '../print/fleet-plan.js';
import { projectUrl } from '../shell/views.js';
import type { AgentAction } from './registry.js';
import { PRESET_ACTIONS } from './preset-actions.js';
import { SLICE_ACTIONS } from './slice-actions.js';

const KINDS: PresetKind[] = ['printer', 'filament', 'process'];
const PRINTER_TIMEOUT_MS = 8000;

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function first(v: string | undefined): string | undefined {
  // Orca keeps per-extruder values as `a;b`.
  return v?.split(';')[0]?.trim() || undefined;
}

function presetSummary(preset: PrintPreset) {
  let flat: Record<string, string> = {};
  try {
    flat = flattenPresetForSlicer(preset);
  } catch {
    // A preset whose chain can't be resolved still lists, by name.
  }
  // Keys changed in the gallery's editor: they survive a re-import from Orca.
  const edited = Object.keys(preset.overrides ?? {});
  const base = { id: preset.id, name: preset.name, ...(edited.length ? { edited } : {}) };
  switch (preset.kind) {
    case 'printer':
      return {
        ...base,
        address: preset.address ?? null,
        model: flat['printer_model'] || null,
        nozzle: first(flat['nozzle_diameter']) ?? null,
        bed: flat['printable_area'] ?? null,
      };
    case 'filament':
      return {
        ...base,
        type: first(flat['filament_type']) ?? null,
        colour: first(flat['filament_colour']) ?? null,
        vendor: first(flat['filament_vendor']) ?? null,
        nozzleTemp: first(flat['nozzle_temperature']) ?? null,
        compatiblePrinters: preset.compatiblePrinters ?? [],
      };
    default:
      return { ...base, layerHeight: flat['layer_height'] ?? null };
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`no answer within ${ms / 1000} s`)), ms)),
  ]);
}

/**
 * The AMS trays a bambu-klipper-proxy reports as the non-Klipper `bambu_ams`
 * object. A Klipper printer has none, and its Moonraker answers the query
 * without the object.
 */
async function amsTrays(address: string): Promise<unknown> {
  try {
    const res = await withTimeout(fetch(buildMoonrakerUrl(address, '/printer/objects/query?bambu_ams')), PRINTER_TIMEOUT_MS);
    if (!res.ok) return null;
    const body = (await res.json()) as { result?: { status?: { bambu_ams?: unknown } } };
    return body.result?.status?.bambu_ams ?? null;
  } catch {
    return null;
  }
}

function liveSummary(live: PrinterLiveStatus) {
  return {
    state: live.state || null,
    klippy: live.klippyState,
    ...(live.klippyMessage ? { klippyMessage: live.klippyMessage } : {}),
    file: live.file || null,
    progress: Math.round(live.progress * 1000) / 10,
    remainingMin: live.remainingSec ? Math.round(live.remainingSec / 60) : 0,
    layer: live.layer != null ? `${live.layer}/${live.totalLayers ?? '?'}` : null,
    nozzle: live.extruder ? { actual: Math.round(live.extruder.actual), target: live.extruder.target } : null,
    bed: live.bed ? { actual: Math.round(live.bed.actual), target: live.bed.target } : null,
    filamentSensors: live.sensors.map((s) => ({ name: s.name, detected: s.detected, enabled: s.enabled })),
    homed: live.homedAxes,
    macros: live.macros.size,
  };
}

export const SHARED_ACTIONS: Record<string, AgentAction> = {
  ...PRESET_ACTIONS,
  ...SLICE_ACTIONS,
  'presets.list': {
    description:
      'The printer, filament and process presets imported in Settings. Printers carry their Moonraker '
      + 'address and model; filaments their type (PLA, PETG, PCTG, TPU…), colour and the printers they '
      + 'are for.',
    args: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: KINDS },
        find: { type: 'string', description: 'Case-insensitive filter on the name, type or colour.' },
      },
    },
    async run(args) {
      const kind = KINDS.includes(args['kind'] as PresetKind) ? (args['kind'] as PresetKind) : undefined;
      const find = str(args['find'])?.toLowerCase();
      const rows = (await listPresets(kind)).map(presetSummary);
      return find ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(find)) : rows;
    },
  },
  'printers.status': {
    description:
      'Every printer with an address, live: state, file, progress, temperatures, filament sensors, '
      + 'and for a Bambu printer behind bambu-klipper-proxy the AMS trays (slot, type, colour, % left). '
      + 'Also what the planner believes is loaded and whether the printer is in the plan.',
    args: {
      type: 'object',
      properties: { printer: { type: 'string', description: 'Only printers whose name contains this.' } },
    },
    async run(args) {
      const find = str(args['printer'])?.toLowerCase();
      const settings = loadPlannerSettings();
      const printers = (await listPresets('printer'))
        .filter((p) => p.address && (!find || p.name.toLowerCase().includes(find)));
      return Promise.all(printers.map(async (p) => {
        const [live, ams] = await Promise.all([
          withTimeout(fetchPrinterLive(p.address!), PRINTER_TIMEOUT_MS).then(liveSummary, (err: Error) => ({ unreachable: err.message })),
          amsTrays(p.address!),
        ]);
        return {
          ...presetSummary(p),
          inPlan: settings.enabled[p.id] !== false,
          plannerLoaded: settings.loaded[p.id] ?? null,
          live,
          ...(ams ? { ams } : {}),
        };
      }));
    },
  },
  'projects.list': {
    description: 'Saved projects and the open draft, newest first, with plate counts and the URL that opens each.',
    async run() {
      const active = getActiveProjectId();
      const projects = (await listProjects()).sort((a, b) => b.updatedAt - a.updatedAt);
      return Promise.all(projects.map(async (p) => ({
        id: p.id,
        name: p.name,
        draft: p.draft === true,
        open: p.id === active,
        plates: (await listPlates(p.id)).length,
        path: projectUrl(p.id),
      })));
    },
  },
  'planner.settings': {
    description:
      'The planner settings: which printers are in the plan, what filament family each has loaded, '
      + 'which filament preset slices each material family, the objective, bedtime and wake.',
    run: () => loadPlannerSettings(),
  },
  'planner.update': {
    description:
      'Change planner settings. Maps are merged key by key: filaments {family: filamentPresetId} '
      + 'picks the preset that slices that material, loaded {printerId: family} records what a printer '
      + 'has on, enabled {printerId: bool} puts a printer in or out of the plan.',
    writes: true,
    args: {
      type: 'object',
      properties: {
        filaments: { type: 'object', additionalProperties: { type: 'string' } },
        loaded: { type: 'object', additionalProperties: { type: 'string' } },
        enabled: { type: 'object', additionalProperties: { type: 'boolean' } },
        objective: { type: 'string', enum: ['makespan', 'visits'] },
      },
    },
    run(args) {
      const settings = loadPlannerSettings();
      const merge = <T,>(key: 'filaments' | 'loaded' | 'enabled'): Record<string, T> => ({
        ...(settings[key] as Record<string, T>),
        ...((args[key] && typeof args[key] === 'object' ? args[key] : {}) as Record<string, T>),
      });
      const next: PlannerSettings = {
        ...settings,
        filaments: merge<string>('filaments'),
        loaded: merge<string>('loaded'),
        enabled: merge<boolean>('enabled'),
        ...(args['objective'] === 'makespan' || args['objective'] === 'visits' ? { objective: args['objective'] } : {}),
      };
      savePlannerSettings(next);
      return next;
    },
  },
};
