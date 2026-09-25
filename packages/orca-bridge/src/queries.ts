// SPDX-License-Identifier: MIT
// The enumeration queries, as plain functions returning plain data. Both the
// CLI and the MCP server are thin shells over these — neither owns logic.

import { existsSync } from 'node:fs';
import { indexPresets, resolvePreset, findPreset, relPath, type PresetKind, type PresetRef } from './presets.ts';
import { summarizeConf, readLogSummary, type LogSummary } from './conf.ts';
import { readOrcaProject, type OrcaProject } from './project.ts';
import { readStore, removePreset, storePath, upsertPreset } from './store.ts';
import type { OrcaPaths } from './paths.ts';

export const PRESET_KINDS: PresetKind[] = ['printer', 'filament', 'process'];

/** A query precondition failed in a way the caller can act on. */
export class OrcaQueryError extends Error {
  // Declared rather than a constructor parameter property: the packages here
  // run under `node`'s strip-only type stripping, which rejects those.
  suggestions: string[];

  constructor(message: string, suggestions: string[] = []) {
    super(message);
    this.name = 'OrcaQueryError';
    this.suggestions = suggestions;
  }
}

export interface PresetSummary {
  name: string;
  kind: PresetKind;
  scope: 'user' | 'system';
  vendor?: string;
  profile?: string;
  path: string;
  modifiedAt: string;
  inherits?: string[];
  overrideCount?: number;
  overriddenFields?: string[];
  missingParents?: string[];
  address?: string;
}

function summarize(paths: OrcaPaths, ref: PresetRef, detail: boolean): PresetSummary {
  const base: PresetSummary = {
    name: ref.name,
    kind: ref.kind,
    scope: ref.scope,
    vendor: ref.vendor,
    profile: ref.profile,
    path: relPath(paths, ref.path),
    modifiedAt: ref.modifiedAt,
  };
  if (!detail) return base;
  const resolved = resolvePreset(paths, ref);
  return {
    ...base,
    inherits: resolved.chain.map((c) => c.name),
    overrideCount: resolved.overrides.length,
    overriddenFields: resolved.overrides.map((o) => o.key),
    missingParents: resolved.missingParents,
    address: typeof resolved.merged['print_host'] === 'string'
      ? resolved.merged['print_host']
      : undefined,
  };
}

export function doctor(paths: OrcaPaths) {
  const index = indexPresets(paths);
  const conf = summarizeConf(paths);
  const logs = readLogSummary(paths);
  return {
    root: paths.root,
    confFound: !!conf,
    // `app.version` in OrcaSlicer.conf is the Bambu network plugin's version,
    // not Orca's. The slicer version only appears inside project files.
    networkPluginVersion: conf?.version,
    userProfiles: paths.userDirs.map((d) => relPath(paths, d)),
    presetCounts: Object.fromEntries(
      PRESET_KINDS.map((k) => [
        k,
        {
          user: index.refs.filter((r) => r.kind === k && r.scope === 'user').length,
          system: index.refs.filter((r) => r.kind === k && r.scope === 'system').length,
        },
      ]),
    ),
    currentSelection: { machine: conf?.currentMachine, filaments: conf?.currentFilaments },
    localMachines: conf?.localMachines.length ?? 0,
    recentProjects: conf?.recentProjects.length ?? 0,
    usageCombos: conf?.usage.length ?? 0,
    logs: {
      severityLevel: logs.severityLevel,
      files: logs.files.length,
      dominatedBySingleMessage: logs.dominatedBySingleMessage,
      note: logs.dominatedBySingleMessage
        ? 'Logs carry no usable change history at this severity level — use preset files and OrcaSlicer.conf instead.'
        : undefined,
    },
  };
}

export interface ListPresetsInput {
  kind: PresetKind;
  scope?: 'user' | 'system';
  name?: string;
  detail?: boolean;
}

export function listPresets(paths: OrcaPaths, input: ListPresetsInput) {
  let refs = indexPresets(paths, [input.kind]).refs;
  if (input.scope) refs = refs.filter((r) => r.scope === input.scope);
  if (input.name) {
    const needle = input.name.toLowerCase();
    refs = refs.filter((r) => r.name.toLowerCase().includes(needle));
  }
  refs.sort((a, b) => a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name));
  return {
    kind: input.kind,
    count: refs.length,
    presets: refs.map((r) => summarize(paths, r, input.detail ?? false)),
  };
}

export interface GetPresetInput {
  kind: PresetKind;
  name: string;
  fields?: string[];
  raw?: boolean;
  merged?: boolean;
}

export function getPreset(paths: OrcaPaths, input: GetPresetInput) {
  const index = indexPresets(paths, [input.kind]);
  const ref = findPreset(paths, input.kind, input.name, index);
  if (!ref) {
    throw new OrcaQueryError(
      `No ${input.kind} preset named "${input.name}".`,
      nearNames(input.name, index.refs.map((r) => r.name)),
    );
  }

  const resolved = resolvePreset(paths, ref, index);
  const pick = (source: Record<string, unknown>) =>
    input.fields?.length
      ? Object.fromEntries(input.fields.map((f) => [f, source[f]]))
      : source;

  return {
    name: ref.name,
    kind: input.kind,
    scope: ref.scope,
    path: relPath(paths, ref.path),
    modifiedAt: ref.modifiedAt,
    inherits: resolved.chain.map((c) => ({ name: c.name, scope: c.scope, vendor: c.vendor })),
    missingParents: resolved.missingParents,
    overrides: resolved.overrides,
    ...(input.raw ? { raw: pick(resolved.raw) } : {}),
    ...(input.merged || input.fields?.length ? { merged: pick(resolved.merged) } : {}),
    mergedFieldCount: Object.keys(resolved.merged).length,
  };
}

/** Candidate names for a miss. Containment runs both ways on purpose: a typo
 *  usually *extends* the real name ("Printer Lefty"), so filtering only by
 *  "contains the query" finds nothing in the case that matters most. Falls
 *  back to shared-prefix ranking when neither contains the other. */
function nearNames(query: string, names: string[], limit = 10): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return names.slice(0, limit);

  const contained = names.filter((name) => {
    const n = name.toLowerCase();
    return n.includes(needle) || needle.includes(n);
  });
  if (contained.length) return contained.slice(0, limit);

  const prefixLength = (name: string): number => {
    const n = name.toLowerCase();
    let i = 0;
    while (i < n.length && i < needle.length && n[i] === needle[i]) i++;
    return i;
  };
  return names
    .map((name) => ({ name, score: prefixLength(name) }))
    .filter((c) => c.score >= 3)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((c) => c.name);
}

function requireConf(paths: OrcaPaths) {
  const conf = summarizeConf(paths);
  if (!conf) throw new OrcaQueryError(`Could not read ${paths.conf}.`);
  return conf;
}

export function machines(paths: OrcaPaths) {
  const conf = requireConf(paths);
  return {
    count: conf.localMachines.length,
    machines: conf.localMachines,
    installedModels: conf.models,
    note: 'These are the network machines Orca itself knows about. Printer presets can '
      + 'reference hosts Orca never registered here — cross-check listPresets with detail.',
  };
}

export function usage(paths: OrcaPaths, limit = 20) {
  const conf = requireConf(paths);
  return {
    count: conf.usage.length,
    currentSelection: { machine: conf.currentMachine, filaments: conf.currentFilaments },
    combos: conf.usage.slice(0, limit),
  };
}

export function projects(paths: OrcaPaths) {
  const conf = requireConf(paths);
  return {
    count: conf.recentProjects.length,
    projects: conf.recentProjects.map((path, i) => ({ rank: i + 1, path, exists: existsSync(path) })),
    note: 'Ordered most-recent first. A missing file means the project moved or was deleted.',
  };
}

export interface ProjectInput {
  path: string;
  configFields?: string[];
  fullConfig?: boolean;
}

export async function project(input: ProjectInput): Promise<Record<string, unknown>> {
  if (!input.path) throw new OrcaQueryError('A project path is required.');
  if (!existsSync(input.path)) throw new OrcaQueryError(`No such file: ${input.path}`);

  let parsed: OrcaProject;
  try {
    parsed = await readOrcaProject(input.path);
  } catch (err) {
    throw new OrcaQueryError(
      `Could not read ${input.path} as an Orca 3MF project: ${(err as Error).message}`,
    );
  }
  const { flatConfig, ...rest } = parsed;
  return {
    ...rest,
    configFieldCount: Object.keys(flatConfig).length,
    ...(input.fullConfig ? { flatConfig } : {}),
    ...(input.configFields?.length
      ? { config: Object.fromEntries(input.configFields.map((f) => [f, flatConfig[f]])) }
      : {}),
  };
}

export function logs(paths: OrcaPaths, files = 1): LogSummary {
  return readLogSummary(paths, files);
}

// ---------------------------------------------------------------------------
// Gallery store — the only writes in this package, and never to Orca's config.

export function galleryList(repoRoot: string) {
  const store = readStore(repoRoot);
  return {
    path: storePath(repoRoot),
    count: store.presets.length,
    presets: store.presets.map((p) => ({
      kind: p.kind,
      name: p.name,
      address: p.address,
      fieldCount: Object.keys(p.raw).length,
      source: p.source,
    })),
  };
}

export interface GalleryAddInput {
  kind: PresetKind;
  /** Orca preset to copy from. */
  name: string;
  /** Store it under a different name — this is what makes it a duplicate. */
  as?: string;
  /** Replace the Moonraker address. Printers only. */
  address?: string;
}

/**
 * Copy an Orca preset into the gallery store, flattened.
 *
 * Resolution happens here rather than in the browser so the record is
 * self-contained: the full inheritance chain is merged down and `parents` is
 * left empty, which is what makes it survive without the vendor presets.
 */
export function galleryAddFromOrca(paths: OrcaPaths, repoRoot: string, input: GalleryAddInput) {
  const index = indexPresets(paths, [input.kind]);
  const ref = findPreset(paths, input.kind, input.name, index);
  if (!ref) {
    throw new OrcaQueryError(
      `No ${input.kind} preset named "${input.name}" in the Orca config.`,
      nearNames(input.name, index.refs.map((r) => r.name)),
    );
  }

  const resolved = resolvePreset(paths, ref, index);
  const name = input.as?.trim() || ref.name;
  const raw: Record<string, unknown> = { ...resolved.merged, name };

  if (input.address !== undefined) {
    if (input.kind !== 'printer') {
      throw new OrcaQueryError('An address only applies to a printer preset.');
    }
    raw['print_host'] = input.address;
    // Orca's web-UI link is derived from the host, so a stale one would point
    // at the machine this was copied from.
    if (typeof raw['print_host_webui'] === 'string') {
      raw['print_host_webui'] = `http://${input.address.replace(/:\d+$/, '')}/mainsail`;
    }
  }
  if (input.kind === 'printer') raw['printer_settings_id'] = name;

  const address = typeof raw['print_host'] === 'string' ? raw['print_host'] : undefined;
  const compatible = raw['compatible_printers'];

  const { replaced } = upsertPreset(repoRoot, {
    kind: input.kind,
    name,
    raw,
    // Flattened on purpose — see above.
    parents: [],
    address,
    compatiblePrinters: Array.isArray(compatible) ? compatible.map(String) : undefined,
    source: {
      kind: 'orca-preset',
      presetName: ref.name,
      chain: resolved.chain.map((c) => c.name),
    },
  });

  return {
    created: !replaced,
    updated: replaced,
    id: `${input.kind}:${name}`,
    name,
    kind: input.kind,
    address,
    copiedFrom: ref.name,
    fieldCount: Object.keys(raw).length,
    storePath: storePath(repoRoot),
    note: 'Saved server-side. The browser upserts it into IndexedDB on next load '
      + 'of the gallery in dev — reload the page to see it in the printer list.',
  };
}

export function galleryRemove(repoRoot: string, kind: PresetKind, name: string) {
  const removed = removePreset(repoRoot, kind, name);
  if (!removed) throw new OrcaQueryError(`No ${kind} named "${name}" in the gallery store.`);
  return {
    removed: true,
    id: `${kind}:${name}`,
    note: 'Removed from the server store. A copy already synced into IndexedDB stays '
      + 'until deleted in Print settings — the sync never deletes browser records.',
  };
}
