// SPDX-License-Identifier: MIT
// Full-slice bookmarks: the whole "how do I want to print this?" bundle —
// printer, filament, layer height, process template + overrides, plus the
// two post-process toggles. Stored in localStorage; small enough to fit
// comfortably.

import type { ProcessSettings } from './process-templates.js';

export interface SlicePresetConfig {
  printerId: string;
  filamentId: string;
  templateId: string;
  layerHeight: string;
  proc: ProcessSettings;
  preheat: boolean;
  centerOnBed: boolean;
  bedSurface?: string;
  clearExclusionZones?: boolean;
}

export interface SlicePreset {
  id: string;
  name: string;
  savedAt: number;
  config: SlicePresetConfig;
}

const LS_KEY = '3dg:print:slice-presets';
const MAX = 20;

/** The stable id for the auto-updated "Last print" preset. Pinned first in
 *  the recent/saved list; overwritten (not appended) on each successful
 *  slice so it never fills the list. */
export const LAST_PRINT_ID = 'slice:__last_print__';

function load(): SlicePreset[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SlicePreset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function save(list: SlicePreset[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX))); } catch { /* full — drop */ }
}

export function listSlicePresets(): SlicePreset[] {
  const all = load();
  // Pin "Last print" first, then newest → oldest for user-saved bookmarks.
  const last = all.find((p) => p.id === LAST_PRINT_ID);
  const rest = all.filter((p) => p.id !== LAST_PRINT_ID).sort((a, b) => b.savedAt - a.savedAt);
  return last ? [last, ...rest] : rest;
}

/** Overwrite (never append) the pinned "Last print" preset. Called on every
 *  successful slice so users always have one-click recall of the exact combo
 *  they last used. */
export function saveLastPrintPreset(config: SlicePresetConfig): SlicePreset {
  const list = load().filter((p) => p.id !== LAST_PRINT_ID);
  const record: SlicePreset = { id: LAST_PRINT_ID, name: 'Last print', savedAt: Date.now(), config };
  list.push(record);
  save(list);
  return record;
}

export function saveSlicePreset(name: string, config: SlicePresetConfig): SlicePreset {
  const list = load();
  const id = `slice:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
  const record: SlicePreset = { id, name, savedAt: Date.now(), config };
  list.push(record);
  save(list);
  return record;
}

export function deleteSlicePreset(id: string): void {
  save(load().filter((p) => p.id !== id));
}

export function renameSlicePreset(id: string, name: string): void {
  const list = load();
  const p = list.find((x) => x.id === id);
  if (!p) return;
  p.name = name;
  save(list);
}
