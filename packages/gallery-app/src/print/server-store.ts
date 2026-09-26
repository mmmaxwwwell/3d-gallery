// SPDX-License-Identifier: MIT
// Client for the optional server-side preset store.
//
// The gallery is local-first: IndexedDB is the real store. A server store is
// something you opt into by running your own, which is what keeps hosting off
// the critical path for everyone else — no server, no endpoint, and the UI
// hides itself.
//
// Sync is deliberately asymmetric, because the two directions answer different
// questions:
//   push  — "take my local records"        replaces the server's set
//   pull  — "use the server's values"      upserts into IndexedDB, deletes nothing
// Pull never deletes, so adopting server values can't silently destroy a preset
// someone imported locally.
//
// The automatic pull on page load is newer-wins per record: a preset edited in
// this browser after the server copy was written is left alone, or every
// reload would undo the edit. The explicit "Use server values" button forces.

import {
  getPreset,
  listPresets,
  savePreset,
  type OrcaJson,
  type OrcaParent,
  type PresetKind,
  type PresetSource,
} from './print-storage.js';

/** Tri-state, stored as '1' (sync) / '0' (don't) / absent (undecided).
 *
 *  Undecided resolves to *on* in dev and *off* otherwise. Running a dev server
 *  is already an explicit act — you started the process that serves the store —
 *  so requiring a click before it takes effect just means an agent can write a
 *  printer that never shows up. A hosted build has no endpoint at all, so it
 *  stays off until someone opts in. "Delete from server, use local" writes '0',
 *  which is why this is tri-state rather than a boolean: an explicit opt-out has
 *  to survive a reload and outrank the dev default. */
const OPT_IN_KEY = '3dg:print:server-store';

interface ServerPreset {
  kind: PresetKind;
  name: string;
  raw: OrcaJson;
  parents: OrcaParent[];
  overrides?: OrcaJson;
  address?: string;
  compatiblePrinters?: string[];
  source?: PresetSource;
  /** When the server copy was written. Absent on records from before it was
   *  tracked, which count as older than anything local. */
  updatedAt?: number;
}

export interface ServerStoreStatus {
  available: boolean;
  count: number;
  optedIn: boolean;
}

function endpoint(): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}__devstore`;
}

export function isOptedIn(): boolean {
  try {
    const stored = localStorage.getItem(OPT_IN_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
    return import.meta.env.DEV;
  } catch {
    return false;
  }
}

function setOptedIn(on: boolean): void {
  // Records the decision either way — see OPT_IN_KEY on why '0' is stored
  // rather than the key being removed.
  try { localStorage.setItem(OPT_IN_KEY, on ? '1' : '0'); }
  catch { /* private mode — the session just won't remember */ }
}

/** Probe for a real store. A deployment without one serves the SPA fallback,
 *  which answers 200 with HTML — so status alone proves nothing. The response
 *  has to parse as JSON and claim availability. */
export async function probeServerStore(): Promise<ServerStoreStatus> {
  const offline: ServerStoreStatus = { available: false, count: 0, optedIn: isOptedIn() };
  try {
    const res = await fetch(endpoint(), { headers: { Accept: 'application/json' } });
    if (!res.ok) return offline;
    if (!(res.headers.get('content-type') ?? '').includes('application/json')) return offline;
    const body = await res.json() as { available?: boolean; count?: number };
    if (body?.available !== true) return offline;
    return { available: true, count: body.count ?? 0, optedIn: isOptedIn() };
  } catch {
    return offline;
  }
}

/** Copy the server's records into IndexedDB. Additive — never deletes.
 *  Without `force`, a record changed locally since the server wrote it is
 *  skipped (see the header). */
export async function pullFromServer(
  { force = false }: { force?: boolean } = {},
): Promise<{ imported: number; skipped: number }> {
  const res = await fetch(endpoint(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Server store returned ${res.status}.`);
  const body = await res.json() as { presets?: ServerPreset[] };
  const presets = body.presets ?? [];
  let imported = 0;
  for (const preset of presets) {
    if (!force) {
      const local = await getPreset(`${preset.kind}:${preset.name}`);
      if (local && local.updatedAt >= (preset.updatedAt ?? 0)) continue;
    }
    await savePreset({
      kind: preset.kind,
      name: preset.name,
      raw: preset.raw,
      parents: preset.parents ?? [],
      overrides: preset.overrides,
      source: preset.source,
      address: preset.address,
      compatiblePrinters: preset.compatiblePrinters,
    });
    imported++;
  }
  setOptedIn(true);
  return { imported, skipped: presets.length - imported };
}

/** Replace the server's set with everything in IndexedDB. */
export async function pushToServer(): Promise<{ exported: number }> {
  const local = await listPresets();
  const presets: ServerPreset[] = local.map((p) => ({
    kind: p.kind,
    name: p.name,
    raw: p.raw,
    parents: p.parents,
    overrides: p.overrides,
    source: p.source,
    address: p.address,
    compatiblePrinters: p.compatiblePrinters,
    updatedAt: p.updatedAt,
  }));
  const res = await fetch(endpoint(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ presets }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Export failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  setOptedIn(true);
  const body = await res.json() as { count?: number };
  return { exported: body.count ?? presets.length };
}

/** Empty the server store and stop syncing from it. Local records are left
 *  exactly as they are — that is the whole point of the action. */
export async function clearServerAndUseLocal(): Promise<{ removed: number }> {
  const res = await fetch(endpoint(), { method: 'DELETE' });
  if (!res.ok) throw new Error(`Server store returned ${res.status}.`);
  const body = await res.json() as { removed?: number };
  setOptedIn(false);
  return { removed: body.removed ?? 0 };
}

let syncOnce: Promise<void> | null = null;

/** Pull server records once per page load, but only for someone who has opted
 *  in. Failures are swallowed: a missing or broken server store must never stop
 *  the local-first path from working. */
export function syncFromServerOnce(): Promise<void> {
  syncOnce ??= (async () => {
    if (!isOptedIn()) return;
    try {
      const status = await probeServerStore();
      if (status.available && status.count > 0) await pullFromServer();
    } catch { /* local records stand on their own */ }
  })();
  return syncOnce;
}
