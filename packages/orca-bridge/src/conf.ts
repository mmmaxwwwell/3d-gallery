// SPDX-License-Identifier: MIT
// Readers for `OrcaSlicer.conf`. The file is Orca's app state, and two of its
// keys are the only record of what the user actually *does*: `orca_presets`
// accumulates the printer+filament+process combos that have been used
// together, and `recent_projects` lists the sliced 3MFs.
//
// Note on logs: Orca's `log/` dir is not an audit trail. At the default
// `log_severity_level` of "warning" it carries no preset, slice, or upload
// events, so `readLogSummary` reports level and error lines only — change
// detection comes from preset files and this file, not from logs.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { OrcaPaths } from './paths.ts';

export interface LocalMachine {
  /** Orca's key — a serial for cloud printers, `host:port` for LAN ones. */
  id: string;
  name: string;
  address: string;
  printerType?: string;
}

export interface UsageCombo {
  machine?: string;
  filaments: string[];
  process?: string;
  bedType?: string;
  /** How many history entries collapsed into this combo. */
  count: number;
}

export interface OrcaConfSummary {
  version?: string;
  logSeverityLevel?: string;
  currentMachine?: string;
  currentFilaments?: string[];
  recentProjects: string[];
  localMachines: LocalMachine[];
  /** Installed vendor models, as Orca records them. */
  models: Array<{ model: string; vendor?: string; nozzleDiameter?: string }>;
  /** Used combos, most-used first. */
  usage: UsageCombo[];
}

type Json = Record<string, unknown>;

function asObject(v: unknown): Json | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : null;
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

export function readConf(paths: OrcaPaths): Json | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(paths.conf, 'utf8'));
    return asObject(parsed);
  } catch {
    return null;
  }
}

/** Collect `filament`, `filament_01`, `filament_02`, … from one history row. */
function filamentsOf(row: Json): string[] {
  const out: string[] = [];
  const primary = asString(row['filament']);
  if (primary) out.push(primary);
  for (const [key, value] of Object.entries(row)) {
    if (!/^filament_\d+$/.test(key)) continue;
    const name = asString(value);
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

function comboKey(c: Omit<UsageCombo, 'count'>): string {
  return [c.machine ?? '', c.process ?? '', c.bedType ?? '', c.filaments.join('|')].join('\0');
}

/** Roll `orca_presets` history rows up into deduped combos with counts. */
export function readUsage(conf: Json): UsageCombo[] {
  const rows = conf['orca_presets'];
  if (!Array.isArray(rows)) return [];
  const byKey = new Map<string, UsageCombo>();
  for (const entry of rows) {
    const row = asObject(entry);
    if (!row) continue;
    const combo: Omit<UsageCombo, 'count'> = {
      machine: asString(row['machine']),
      filaments: filamentsOf(row),
      process: asString(row['process']),
      bedType: asString(row['curr_bed_type']),
    };
    const key = comboKey(combo);
    const existing = byKey.get(key);
    if (existing) existing.count++;
    else byKey.set(key, { ...combo, count: 1 });
  }
  return [...byKey.values()].sort((a, b) => b.count - a.count);
}

function readLocalMachines(conf: Json): LocalMachine[] {
  const block = asObject(conf['local_machines']);
  if (!block) return [];
  const out: LocalMachine[] = [];
  for (const [id, raw] of Object.entries(block)) {
    const row = asObject(raw);
    if (!row) continue;
    const address = asString(row['dev_ip']) ?? id;
    out.push({
      id,
      name: asString(row['dev_name']) ?? address,
      address,
      printerType: asString(row['printer_type']),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function readModels(conf: Json): OrcaConfSummary['models'] {
  const rows = conf['models'];
  if (!Array.isArray(rows)) return [];
  const out: OrcaConfSummary['models'] = [];
  for (const entry of rows) {
    const row = asObject(entry);
    const model = row && asString(row['model']);
    if (!row || !model) continue;
    out.push({
      model,
      vendor: asString(row['vendor']),
      nozzleDiameter: asString(row['nozzle_diameter']),
    });
  }
  return out;
}

export function summarizeConf(paths: OrcaPaths): OrcaConfSummary | null {
  const conf = readConf(paths);
  if (!conf) return null;

  const app = asObject(conf['app']) ?? {};
  const selection = asObject(conf['presets']) ?? {};
  const recent = asObject(conf['recent_projects']) ?? {};
  const filaments = selection['filaments'];

  return {
    version: asString(app['version']) ?? asString(conf['header']),
    logSeverityLevel: asString(app['log_severity_level']),
    currentMachine: asString(selection['machine']),
    currentFilaments: Array.isArray(filaments)
      ? filaments.map(String)
      : asString(filaments) ? [asString(filaments)!] : undefined,
    // Keys are zero-padded ordinals ("001" newest) — sort, don't trust order.
    recentProjects: Object.keys(recent)
      .sort()
      .map((k) => asString(recent[k]))
      .filter((v): v is string => !!v),
    localMachines: readLocalMachines(conf),
    models: readModels(conf),
    usage: readUsage(conf),
  };
}

export interface LogSummary {
  severityLevel?: string;
  files: Array<{ name: string; bytes: number; modifiedAt: string }>;
  /** Distinct error/warning messages, most frequent first. */
  topMessages: Array<{ level: string; message: string; count: number }>;
  /** True when one message dominates — the signal that logging is too coarse
   *  to be useful for change detection. */
  dominatedBySingleMessage: boolean;
  linesScanned: number;
}

const LOG_LINE = /^\[(\w+)\]\s+[\d-]+ [\d:.]+\[Thread [^\]]+\]:(.*)$/;

/** Read the newest log file and report what it actually contains. */
export function readLogSummary(paths: OrcaPaths, maxFiles = 1): LogSummary {
  let entries: Array<{ name: string; bytes: number; modifiedAt: string; path: string }> = [];
  try {
    entries = readdirSync(paths.logDir)
      .filter((f) => f.startsWith('debug_') && !f.endsWith('.enc'))
      .map((name) => {
        const path = join(paths.logDir, name);
        const st = statSync(path);
        return { name, bytes: st.size, modifiedAt: st.mtime.toISOString(), path };
      })
      .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  } catch {
    entries = [];
  }

  const counts = new Map<string, { level: string; message: string; count: number }>();
  let linesScanned = 0;
  for (const entry of entries.slice(0, maxFiles)) {
    let text: string;
    try { text = readFileSync(entry.path, 'utf8'); } catch { continue; }
    for (const line of text.split('\n')) {
      const m = LOG_LINE.exec(line);
      if (!m) continue;
      linesScanned++;
      const level = m[1];
      if (level === 'info') continue;
      // Collapse paths and numbers so repeats group.
      const message = m[2].trim().replace(/\/\S+/g, '<path>').replace(/\d+/g, 'N').slice(0, 140);
      const key = `${level}\0${message}`;
      const existing = counts.get(key);
      if (existing) existing.count++;
      else counts.set(key, { level, message, count: 1 });
    }
  }

  const topMessages = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 20);
  const total = topMessages.reduce((sum, m) => sum + m.count, 0);
  return {
    severityLevel: summarizeConf(paths)?.logSeverityLevel,
    files: entries.map(({ name, bytes, modifiedAt }) => ({ name, bytes, modifiedAt })),
    topMessages,
    dominatedBySingleMessage: total > 0 && topMessages[0].count / total > 0.9,
    linesScanned,
  };
}
