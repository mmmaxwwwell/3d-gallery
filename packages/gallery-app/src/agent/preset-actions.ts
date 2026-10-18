// SPDX-License-Identifier: MIT
/**
 * Agent actions for the preset library: import Orca files without a file
 * picker, find duplicates, and work out which filaments belong to which
 * printers. They write through print-storage like Settings does, so every
 * open page hears the change.
 */

import { deletePreset, importPreset, listPresets, savePreset, type PrintPreset } from '../print/print-storage.js';
import { flattenPresetForSlicer } from '../print/preset-flatten.js';
import { parseOrcaPresetFile, type ParsedPreset } from '../print/orca-import.js';
import { setOverride } from '../print/preset-edit.js';
import type { OrcaValue } from '../print/print-storage.js';
import { NeedsConfirmation, type AgentAction } from './registry.js';

/** Keys that name or file a preset rather than say how it prints. Two presets
 *  differing only here print the same. */
const IDENTITY_KEYS = new Set([
  'name', 'from', 'inherits', 'instantiation', 'version', 'type', 'setting_id', 'is_custom_defined',
  'printer_settings_id', 'filament_settings_id', 'print_settings_id', 'filament_id', 'renamed_from',
  'compatible_printers', 'compatible_printers_condition', 'compatible_prints', 'compatible_prints_condition',
  'inherits_group', 'filament_vendor',
]);

/**
 * What the `@ …` suffix of a filament name usually means, for printers whose
 * own names don't say it. Tokens are lowercase with spaces removed.
 */
const PRINTER_ALIASES: Record<string, string[]> = {
  ffadm5: ['adventurer5m', 'ad5m', 'flashforgeadventurer5m'],
  ad5m: ['adventurer5m', 'ffadm5'],
  x1c: ['x1carbon', 'bambulabx1'],
  bblx1c: ['x1carbon', 'bambulabx1'],
  bbl1c: ['x1carbon', 'bambulabx1'],
  bbl: ['bambulab'],
  q2: ['qidiq2', 'qudiq2'],
  u1: ['snapmakeru1'],
};

function squash(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function flat(preset: PrintPreset): Record<string, string> {
  try {
    return flattenPresetForSlicer(preset);
  } catch {
    return {};
  }
}

/**
 * The preset with one setting edited, as the preset editor saves it. The
 * record spreads the person's other edits, and a printer's `address` follows
 * its `print_host`: the Printers view and the dispatcher read `address`.
 */
export function withValue(preset: PrintPreset, key: string, value: OrcaValue): PrintPreset {
  const next = { ...preset, overrides: setOverride(preset, preset.overrides ?? {}, key, value, undefined) };
  if (preset.kind !== 'printer') return next;
  return { ...next, address: flat(next)['print_host']?.trim() || undefined };
}

/** Printing values only, in a stable order, so identical configs compare equal. */
function fingerprint(preset: PrintPreset): string {
  const values = flat(preset);
  return Object.keys(values)
    .filter((k) => !IDENTITY_KEYS.has(k))
    .sort()
    .map((k) => `${k}=${values[k]}`)
    .join('\n');
}

function differingKeys(a: PrintPreset, b: PrintPreset): string[] {
  const fa = flat(a);
  const fb = flat(b);
  return [...new Set([...Object.keys(fa), ...Object.keys(fb)])]
    .filter((k) => !IDENTITY_KEYS.has(k) && fa[k] !== fb[k])
    .sort();
}

/** "Kingroon PETG @ X1C - Copy (2)" → "kingroonpetg": the name with copy marks and the printer suffix dropped. */
function baseName(name: string): string {
  return squash(name.replace(/@.*$/, '').replace(/\s*-\s*copy\b.*$/i, '').replace(/\(\d+\)\s*$/, ''));
}

function groupBy<T>(items: T[], key: (t: T) => string): T[][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

/** Everything a printer is known as: its name, model, and every preset it inherits from. */
function printerNames(printer: PrintPreset): string[] {
  const values = flat(printer);
  return [printer.name, values['printer_model'] ?? '', values['printer_settings_id'] ?? '', ...printer.parents.map((p) => p.name)]
    .filter(Boolean);
}

function suffixTokens(filamentName: string): string[] {
  const at = filamentName.split('@')[1];
  if (!at) return [];
  const token = squash(at.replace(/\d+(\.\d+)?\s*(mm)?\s*nozzle/i, '').replace(/0\.\d+$/, ''));
  if (!token || token === 'system' || token === 'systemcopy') return [];
  return [token, ...(PRINTER_ALIASES[token] ?? [])];
}

function filamentMapping(filaments: PrintPreset[], printers: PrintPreset[]) {
  const known = new Map(printers.map((p) => [p.id, printerNames(p).map(squash)]));
  return filaments.map((f) => {
    const values = flat(f);
    const listed = f.compatiblePrinters ?? [];
    // A listed name may be a vendor printer the person's printer inherits from.
    const viaList = listed.length
      ? printers.filter((p) => listed.some((n) => known.get(p.id)!.includes(squash(n)))).map((p) => p.name)
      : [];
    const tokens = suffixTokens(f.name);
    const viaName = tokens.length
      ? printers.filter((p) => known.get(p.id)!.some((n) => tokens.some((t) => n.includes(t)))).map((p) => p.name)
      : [];
    let verdict: string;
    if (!listed.length) verdict = viaName.length ? 'offered to every printer, but its name says it is for some' : 'offered to every printer';
    else if (!viaList.length) verdict = 'lists only printers you do not have, so no printer is offered it';
    else verdict = 'restricted to the listed printers';
    return {
      id: f.id,
      name: f.name,
      type: values['filament_type']?.split(';')[0] ?? null,
      colour: values['filament_colour']?.split(';')[0] ?? null,
      nozzleTemp: values['nozzle_temperature']?.split(';')[0] ?? null,
      compatiblePrinters: listed,
      offeredTo: listed.length ? viaList : printers.map((p) => p.name),
      nameSuggests: viaName,
      verdict,
    };
  });
}

function presetFor(all: PrintPreset[], key: unknown, kind?: string): PrintPreset {
  const pool = kind ? all.filter((p) => p.kind === kind) : all;
  const found = pool.find((p) => p.id === key) ?? pool.find((p) => p.name === key);
  if (!found) throw new Error(`No ${kind ?? ''} preset "${String(key)}". presets.list shows them.`);
  return found;
}

export const PRESET_ACTIONS: Record<string, AgentAction> = {
  'presets.import': {
    description:
      'Store presets in this browser, as Settings → Import does. Prefer the presets_import tool, which '
      + 'reads the Orca config folder for you. Pass `files` ([{name, text}]) for exported '
      + '.orca_printer / .orca_filament / .json files you have the contents of. Re-importing a preset '
      + 'refreshes it and keeps the edits made in the gallery.',
    writes: true,
    args: {
      type: 'object',
      properties: {
        presets: { type: 'array', description: 'Records from the dev server (presets_import fills this).' },
        files: {
          type: 'array',
          items: { type: 'object', properties: { name: { type: 'string' }, text: { type: 'string' } }, required: ['name', 'text'] },
        },
      },
    },
    async run(args) {
      const before = new Set((await listPresets()).map((p) => p.id));
      const parsed: ParsedPreset[] = Array.isArray(args['presets']) ? (args['presets'] as ParsedPreset[]) : [];
      const failed: string[] = [];
      for (const file of Array.isArray(args['files']) ? (args['files'] as Array<{ name: string; text: string }>) : []) {
        try {
          parsed.push(parseOrcaPresetFile(file.name, file.text));
        } catch (err) {
          failed.push(`${file.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      const added: string[] = [];
      const updated: string[] = [];
      for (const preset of parsed) {
        const saved = await importPreset(preset);
        (before.has(saved.id) ? updated : added).push(`${saved.kind}: ${saved.name}`);
      }
      return { added, updated, failed };
    },
  },
  'presets.audit': {
    description:
      'Review the preset library: duplicates (identical printing values under different names; '
      + 'near-identical names such as "- Copy" with the keys they differ in; printers sharing one '
      + 'address) and, for every filament, which printers it is offered to, which its name suggests, '
      + 'and whether those disagree. Read-only; fix with presets.delete and presets.set_compatible.',
    async run() {
      const all = await listPresets();
      const printers = all.filter((p) => p.kind === 'printer');
      const filaments = all.filter((p) => p.kind === 'filament');
      const identical = ['printer', 'filament'].flatMap((kind) =>
        groupBy(all.filter((p) => p.kind === kind), fingerprint).map((g) => ({ kind, presets: g.map((p) => p.name) })));
      const similar = ['printer', 'filament'].flatMap((kind) =>
        groupBy(all.filter((p) => p.kind === kind), (p) => baseName(p.name))
          .map((g) => ({
            kind,
            presets: g.map((p) => p.name),
            differFrom: Object.fromEntries(g.slice(1).map((p) => {
              const keys = differingKeys(g[0]!, p);
              return [p.name, keys.length > 12 ? [...keys.slice(0, 12), `…${keys.length - 12} more`] : keys];
            })),
          })));
      const sharedAddress = groupBy(printers.filter((p) => p.address), (p) => p.address!.replace(/^https?:\/\//, '').replace(/\/+$/, ''))
        .map((g) => ({ address: g[0]!.address, printers: g.map((p) => p.name) }));
      return {
        counts: { printers: printers.length, filaments: filaments.length },
        duplicates: { identical, similarNames: similar, sharedAddress },
        printers: printers.map((p) => ({ id: p.id, name: p.name, address: p.address ?? null, knownAs: printerNames(p).slice(1) })),
        filaments: filamentMapping(filaments, printers),
      };
    },
  },
  'presets.set_compatible': {
    description:
      'Choose which printers a filament preset is offered to: printer names, or [] for every printer. '
      + 'The print dialog only lists compatible filaments for the chosen printer.',
    writes: true,
    args: {
      type: 'object',
      properties: {
        filament: { type: 'string', description: 'Filament preset id or name.' },
        printers: { type: 'array', items: { type: 'string' } },
      },
      required: ['filament', 'printers'],
    },
    async run(args) {
      const all = await listPresets();
      const filament = presetFor(all, args['filament'], 'filament');
      const names = (Array.isArray(args['printers']) ? args['printers'] : []).map((n) => presetFor(all, n, 'printer').name);
      // Spread the record: it carries the person's edits (overrides).
      await savePreset({ ...filament, compatiblePrinters: names });
      return { filament: filament.name, compatiblePrinters: names.length ? names : 'every printer' };
    },
  },
  'presets.set_value': {
    description:
      'Change one setting of a printer or filament preset, as the preset editor does: kept as an edit on '
      + 'top of the imported preset, so a re-import from Orca keeps it, and setting it back to the '
      + 'inherited value removes the edit. Orca keys and shapes, e.g. filament_max_volumetric_speed ["12"]. '
      + 'Changes how every plate using the preset prints: say what you changed.',
    writes: true,
    args: {
      type: 'object',
      properties: {
        preset: { type: 'string', description: 'Preset id or name.' },
        key: { type: 'string', description: 'An Orca setting key.' },
        value: { description: 'The value, in Orca\'s shape (per-extruder settings are arrays of strings).' },
      },
      required: ['preset', 'key', 'value'],
    },
    async run(args) {
      const all = await listPresets();
      const preset = presetFor(all, args['preset']);
      const key = String(args['key'] ?? '');
      if (!/^[a-z][a-z0-9_]*$/.test(key)) throw new Error(`"${key}" is not an Orca setting key.`);
      const before = flat(preset)[key] ?? null;
      const saved = await savePreset(withValue(preset, key, args['value'] as OrcaValue));
      return { preset: saved.name, key, before, after: flat(saved)[key] ?? null, edited: Object.keys(saved.overrides ?? {}) };
    },
  },
  'presets.delete': {
    description:
      'Delete presets from this browser (ids or names). Asks first: pass confirm: true once the person '
      + 'has agreed to delete exactly these. A preset imported from Orca can be imported again; edits '
      + 'made in the gallery cannot.',
    writes: true,
    args: { type: 'object', properties: { presets: { type: 'array', items: { type: 'string' } } }, required: ['presets'] },
    async run(args, ctx) {
      const all = await listPresets();
      const doomed = (Array.isArray(args['presets']) ? args['presets'] : []).map((k) => presetFor(all, k));
      if (!doomed.length) throw new Error('Name the presets to delete.');
      if (!ctx.confirmed) {
        const edited = doomed.filter((p) => p.overrides && Object.keys(p.overrides).length);
        throw new NeedsConfirmation(
          `Delete ${doomed.map((p) => `${p.kind} "${p.name}"`).join(', ')}?`
          + (edited.length ? ` ${edited.map((p) => p.name).join(', ')} carry edits made in the gallery, which go with them.` : ''),
        );
      }
      for (const p of doomed) await deletePreset(p.id);
      return { deleted: doomed.map((p) => `${p.kind}: ${p.name}`) };
    },
  },
};
