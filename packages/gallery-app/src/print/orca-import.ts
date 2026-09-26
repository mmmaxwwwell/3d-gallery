// SPDX-License-Identifier: MIT
// Import OrcaSlicer preset files (.orca_printer/.orca_filament/.orca_process,
// or raw preset .json exports, or a whole ~/.config/OrcaSlicer/ folder).
//
// The output preserves the ORIGINAL JSON — the user's raw file plus its
// inheritance chain. Nothing is flattened at import time. That work happens
// at slice time (in preset-flatten.ts) so we don't lose type info (arrays,
// nested objects, unknown fields) that Orca's format actually uses.

import type { OrcaJson, OrcaParent, OrcaValue, PresetKind, PresetSource } from './print-storage.js';

export interface ParsedPreset {
  kind: PresetKind;
  name: string;
  raw: OrcaJson;
  parents: OrcaParent[];
  compatiblePrinters?: string[];
  address?: string;
  source: PresetSource;
}

const KIND_BY_EXT: Record<string, PresetKind> = {
  '.orca_printer': 'printer',
  '.orca_filament': 'filament',
  '.orca_process': 'process',
  '.ini': 'process',
};

function inferKindFromJson(obj: OrcaJson): PresetKind | null {
  if ('printer_settings_id' in obj) return 'printer';
  if ('filament_settings_id' in obj) return 'filament';
  if ('print_settings_id' in obj) return 'process';
  return null;
}

function extOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

function baseNameOf(filename: string): string {
  const noPath = filename.split(/[/\\]/).pop() ?? filename;
  const dot = noPath.lastIndexOf('.');
  return dot > 0 ? noPath.slice(0, dot) : noPath;
}

function parseIniPreset(text: string): OrcaJson {
  const out: OrcaJson = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';') || line.startsWith('[')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

/** Extract the compatible_printers array from a raw JSON (array of strings). */
function readCompatiblePrinters(obj: OrcaJson): string[] | undefined {
  const cp = obj['compatible_printers'];
  if (!Array.isArray(cp)) return undefined;
  return cp.map((v) => String(v)).filter(Boolean);
}

/** Extract print_host from a raw JSON — Moonraker URL/host for the send flow. */
function readPrintHost(obj: OrcaJson): string | undefined {
  const v = obj['print_host'];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/** Single-file import: no inheritance chain available (parents = []).
 *  The slicer will still work if the file is a fully-flattened `.orca_*`
 *  export from Orca (which is what "Export preset" produces). */
export function parseOrcaPresetFile(filename: string, text: string): ParsedPreset {
  const ext = extOf(filename);
  const trimmed = text.trimStart();
  let name = baseNameOf(filename);
  let kind: PresetKind | null = KIND_BY_EXT[ext] ?? null;
  let raw: OrcaJson = {};

  if (trimmed.startsWith('{')) {
    raw = JSON.parse(text) as OrcaJson;
    const n = raw['name'];
    if (typeof n === 'string' && n.trim()) name = n.trim();
    if (!kind) kind = inferKindFromJson(raw);
  } else if (kind) {
    raw = parseIniPreset(text);
    const n = raw['name'];
    if (typeof n === 'string' && n.trim()) name = n.trim();
  }

  if (!kind) {
    throw new Error(
      `Unsupported preset file "${filename}". Expected .orca_printer/.orca_filament/.orca_process, or a JSON preset with printer_settings_id / filament_settings_id / print_settings_id.`,
    );
  }
  if (Object.keys(raw).length === 0) {
    throw new Error(`Preset "${filename}" parsed as empty — file may be a bundle (.zip) or unsupported format.`);
  }

  return {
    kind,
    name,
    raw,
    parents: [],
    compatiblePrinters: readCompatiblePrinters(raw),
    address: kind === 'printer' ? readPrintHost(raw) : undefined,
    source: { kind: 'orca-file', fileName: filename, importedAt: Date.now() },
  };
}

// ---------------------------------------------------------------------------
// Folder-picker import

interface RawPreset {
  kind: PresetKind | null;
  name: string;
  path: string;
  raw: OrcaJson;
  isUser: boolean;
}

function kindFromPath(path: string): PresetKind | null {
  const lower = path.toLowerCase();
  if (/\/machine\//.test(lower)) return 'printer';
  if (/\/filament\//.test(lower)) return 'filament';
  if (/\/process\//.test(lower)) return 'process';
  return null;
}

function readNameField(obj: OrcaJson, fallback: string): string {
  const n = obj['name'];
  if (typeof n === 'string' && n.trim()) return n.trim();
  return fallback;
}

function isVendorBundle(obj: OrcaJson): boolean {
  return (
    Array.isArray(obj['machine_list']) ||
    Array.isArray(obj['filament_list']) ||
    Array.isArray(obj['process_list']) ||
    Array.isArray(obj['machine_model_list'])
  );
}

/** Walk the `inherits` chain up. Returns the list of parents in order —
 *  immediate parent first, root last. Never includes `seed` itself. */
function collectParents(
  seed: RawPreset,
  index: Map<string, RawPreset>,
  warnings: string[],
): OrcaParent[] {
  const out: OrcaParent[] = [];
  const seen = new Set<string>();
  let cur = seed;
  while (true) {
    const parentName = cur.raw['inherits'];
    if (typeof parentName !== 'string' || !parentName.trim()) break;
    if (seen.has(parentName)) {
      warnings.push(`Inheritance cycle detected involving "${parentName}".`);
      break;
    }
    const parent = index.get(parentName);
    if (!parent) {
      warnings.push(`Missing parent preset "${parentName}" for "${seed.name}".`);
      break;
    }
    seen.add(parentName);
    out.push({ name: parent.name, raw: parent.raw });
    cur = parent;
    if (out.length > 8) {
      warnings.push(`Inheritance chain too deep for "${seed.name}"; stopping at 8.`);
      break;
    }
  }
  return out;
}

/** Merge inheritance for the sole purpose of extracting a couple of fields
 *  (compatible_printers, print_host) that need to see through the chain. The
 *  actual full flatten happens at slice time from the stored raw + parents. */
function shallowMergeForMetadata(seed: RawPreset, parents: OrcaParent[]): OrcaJson {
  const m: OrcaJson = {};
  for (let i = parents.length - 1; i >= 0; i--) Object.assign(m, parents[i].raw);
  Object.assign(m, seed.raw);
  return m;
}

export interface TreeImportResult {
  presets: ParsedPreset[];
  warnings: string[];
  skipped: string[];
}

/** Ingest a whole OrcaSlicer config folder. Returns presets in raw+parents
 *  form — no flattening. */
export async function parseOrcaConfigTree(files: FileList | File[]): Promise<TreeImportResult> {
  const arr = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.json'));
  const warnings: string[] = [];
  const skipped: string[] = [];

  // Read + parse in parallel batches. Each `file.text()` is an IPC round-trip
  // to Chromium's file backend; sequential awaits stall on ~5000-file Orca
  // config trees. 64 in flight is a good balance across most machines.
  const BATCH = 64;
  const raws: RawPreset[] = [];
  for (let i = 0; i < arr.length; i += BATCH) {
    const chunk = arr.slice(i, i + BATCH);
    const parsed = await Promise.all(chunk.map(async (file) => {
      const relPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      let obj: OrcaJson;
      try {
        obj = JSON.parse(await file.text()) as OrcaJson;
      } catch (err) {
        return { skipped: `${relPath}: ${(err as Error).message}` } as const;
      }
      if (isVendorBundle(obj)) return null;

      // Accept a file as a preset when its enclosing dir names the kind
      // (…/machine/…, …/filament/…, …/process/…), OR when its JSON has a
      // canonical settings-id field. Fall back on filename-based kind so
      // exported .orca_* files still work.
      const kind = kindFromPath(relPath) ?? inferKindFromJson(obj);
      if (!kind) return null;
      const name = readNameField(obj, baseNameOf(file.name));
      // A preset is "user-owned" when its path contains a `user` directory
      // segment. Handles both `OrcaSlicer/user/…` (parent picked) and
      // `user/…` (user/ picked directly).
      const isUser = /(^|\/)user\//i.test(relPath);
      return { raw: { kind, name, path: relPath, raw: obj, isUser } as RawPreset } as const;
    }));
    for (const p of parsed) {
      if (!p) continue;
      if ('skipped' in p && p.skipped) skipped.push(p.skipped);
      else if ('raw' in p) raws.push(p.raw);
    }
  }

  // Build a name → preset index. Prefer user versions when the same name
  // exists in both system and user.
  const index = new Map<string, RawPreset>();
  for (const r of raws) {
    const existing = index.get(r.name);
    if (!existing || (r.isUser && !existing.isUser)) index.set(r.name, r);
  }

  const userCount = raws.filter((r) => r.isUser).length;
  const systemCount = raws.length - userCount;
  const presets: ParsedPreset[] = [];
  for (const r of raws) {
    if (!r.isUser) continue; // Only user-facing presets. System entries act as inheritance donors.
    if (!r.kind) continue;
    // Orca process presets aren't used for slicing (we use inline templates
    // instead — see process-templates.ts). Skip them to avoid confusing the
    // Processes tab with imported Orca processes.
    if (r.kind === 'process') continue;

    const parents = collectParents(r, index, warnings);
    const merged = shallowMergeForMetadata(r, parents);
    const compatiblePrinters = readCompatiblePrinters(merged);
    const address = r.kind === 'printer' ? readPrintHost(merged) : undefined;

    presets.push({
      kind: r.kind, name: r.name, raw: r.raw, parents, compatiblePrinters, address,
      source: { kind: 'orca-config', path: r.path, importedAt: Date.now() },
    });
  }

  // Helpful diagnostics for the common failure modes.
  if (raws.length === 0) {
    warnings.push(
      'No preset JSON files found. Make sure you picked the OrcaSlicer config folder ' +
      '(the one containing `user/` and `system/`) — usually `~/.config/OrcaSlicer` on Linux, ' +
      '`~/Library/Application Support/OrcaSlicer` on macOS, or `%APPDATA%/OrcaSlicer` on Windows.',
    );
  } else if (userCount === 0) {
    warnings.push(
      `Found ${systemCount} system presets but no user presets. Pick the parent folder that ` +
      `also contains \`user/\` — right now you seem to have picked only the system dir.`,
    );
  } else if (presets.length === 0) {
    warnings.push(
      `Found ${userCount} user presets but none survived filtering (all processes? all uninheritable?). ` +
      `Check the warnings above.`,
    );
  } else if (systemCount === 0) {
    warnings.push(
      `Found ${userCount} user presets but no system presets to inherit from. ` +
      `Pick the parent OrcaSlicer folder so \`system/\` is included — otherwise your presets are missing most fields.`,
    );
  }

  return { presets, warnings, skipped };
}
