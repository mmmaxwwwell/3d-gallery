// SPDX-License-Identifier: MIT
/**
 * Look inside a plate's slice before it goes to a printer: the G-code's start
 * block and settings, and for a Bambu printer the filaments its .gcode.3mf
 * declares and the AMS trays they would print from. Read-only: so an agent
 * (and the person it answers to) can check a print before sending it.
 */

import { fetchAms, matchAmsTrays } from '@3d-gallery/print-toolkit';
import { listPlates, listSlicedGcode, getActiveProjectId, type SlicedGcode } from '../print/plate-store.js';
import { listPresets } from '../print/print-storage.js';
import type { AgentAction } from './registry.js';

/** Settings worth reading back before a print: what it prints in, how hot, on what. */
const SETTING_KEYS = [
  'printer_model', 'printer_settings_id', 'nozzle_diameter', 'filament_settings_id', 'filament_type',
  'filament_colour', 'nozzle_temperature', 'nozzle_temperature_initial_layer', 'hot_plate_temp',
  'textured_plate_temp', 'cool_plate_temp', 'eng_plate_temp', 'curr_bed_type', 'layer_height',
  'wall_loops', 'sparse_infill_density', 'sparse_infill_pattern', 'enable_support', 'brim_type',
  'enable_prime_tower', 'filament_max_volumetric_speed',
];

/** The G-code's own comment block: `; key = value` (Orca) or `; key: value`. */
function settings(gcode: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of SETTING_KEYS) {
    const m = new RegExp(`^;\\s*${key}\\s*[=:]\\s*(.*)$`, 'm').exec(gcode);
    if (m) out[key] = m[1]!.trim();
  }
  return out;
}

/**
 * The machine start G-code as it landed in the file: Orca brackets it with
 * MACHINE_START_GCODE_BEGIN/END; without those, everything before the first
 * layer change.
 */
function startBlock(gcode: string, maxLines: number): string[] {
  const lines = gcode.split('\n');
  let from = lines.findIndex((l) => /MACHINE_START_GCODE_BEGIN/.test(l));
  let to = lines.findIndex((l) => /MACHINE_START_GCODE_END/.test(l));
  if (from < 0 || to < 0) {
    from = lines.findIndex((l) => /EXECUTABLE_BLOCK_START|HEADER_BLOCK_END/.test(l));
    to = lines.findIndex((l) => /^;\s*(LAYER_CHANGE|CHANGE_LAYER)/.test(l));
    if (to < 0) to = Math.min(lines.length, from + maxLines);
  }
  const block = lines.slice(Math.max(0, from), to + 1);
  return block.length > maxLines ? [...block.slice(0, maxLines), `… ${block.length - maxLines} more lines`] : block;
}

/** Tool changes (T0…) and AMS commands (M620/M621), which say which slots the print really uses. */
function toolUse(gcode: string) {
  const tools = new Map<string, number>();
  for (const m of gcode.matchAll(/^T(\d+)\b/gm)) tools.set(`T${m[1]}`, (tools.get(`T${m[1]}`) ?? 0) + 1);
  return {
    toolChanges: Object.fromEntries(tools),
    m620: (gcode.match(/^M620\b/gm) ?? []).length,
    m621: (gcode.match(/^M621\b/gm) ?? []).length,
  };
}

export const SLICE_ACTIONS: Record<string, AgentAction> = {
  'slices.inspect': {
    description:
      'Read back a plate\'s slice before sending it: the settings written into the G-code (printer, '
      + 'filament type and colour, temperatures, bed type…), the machine start G-code as it landed, '
      + 'tool changes, and for a Bambu printer the filaments its .gcode.3mf declares and which live AMS '
      + 'tray each would print from (the mapping Print would send). Pass `grep` to pull other lines.',
    args: {
      type: 'object',
      properties: {
        plate: { type: 'string', description: 'Plate id or name. Default: every plate of the open project.' },
        project: { type: 'string', description: 'Project id. Default: the open project.' },
        startLines: { type: 'number', description: 'How many start-G-code lines to return (default 120).' },
        grep: { type: 'string', description: 'A regular expression; every matching G-code line comes back (max 200).' },
      },
    },
    async run(args) {
      const projectId = typeof args['project'] === 'string' ? args['project'] : getActiveProjectId();
      if (!projectId) throw new Error('No project is open.');
      const plates = (await listPlates(projectId))
        .filter((p) => !args['plate'] || p.id === args['plate'] || p.name === args['plate']);
      if (!plates.length) throw new Error(`No plate "${String(args['plate'])}" in this project.`);
      const printers = new Map((await listPresets('printer')).map((p) => [p.id, p]));
      const grep = typeof args['grep'] === 'string' ? new RegExp(args['grep'], 'i') : null;
      const startLines = typeof args['startLines'] === 'number' ? args['startLines'] : 120;

      return Promise.all(plates.map(async (plate) => {
        const slices = await listSlicedGcode(plate.id);
        return {
          plate: plate.name,
          material: plate.material ?? 'PETG',
          color: plate.color ?? null,
          slices: await Promise.all(slices.map(async (s: SlicedGcode) => {
            const printer = printers.get(s.printerId);
            let ams: unknown = null;
            if (s.bambu && printer?.address) {
              const live = await fetchAms(printer.address).catch((err: Error) => ({ error: err.message }));
              ams = live && !('error' in live)
                ? { live, mapping: matchAmsTrays(s.bambu.filaments.map((f) => ({ slot: f.slot, type: f.type, color: f.color })), live) }
                : live;
            }
            return {
              printer: printer?.name ?? s.printerId,
              filamentPreset: s.filamentId,
              slicedAt: new Date(s.slicedAt).toISOString(),
              minutes: s.seconds ? Math.round(s.seconds / 60) : null,
              grams: s.grams ?? null,
              bytes: s.gcode.length,
              settings: settings(s.gcode),
              ...toolUse(s.gcode),
              ...(s.bambu ? { bambu: s.bambu, ams } : {}),
              startGcode: startBlock(s.gcode, startLines),
              ...(grep ? { grep: s.gcode.split('\n').filter((l) => grep.test(l)).slice(0, 200) } : {}),
            };
          })),
        };
      }));
    },
  },
};
