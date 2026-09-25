// SPDX-License-Identifier: MIT

import { describe, expect, it, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type Server } from 'node:http';
import { readStore, storePath, clearStore } from '../src/store.ts';
import { createDevStoreMiddleware } from '../src/devstore.ts';
import { handleMcpBody } from '../src/mcp.ts';
import { makeFixture, type Fixture } from './fixture.ts';

let fixture: Fixture;
let repoRoot: string;

beforeAll(() => { fixture = makeFixture(); });
afterAll(() => { rmSync(fixture.root, { recursive: true, force: true }); });

beforeEach(() => { repoRoot = mkdtempSync(join(tmpdir(), 'orca-repo-')); });
afterEach(() => { rmSync(repoRoot, { recursive: true, force: true }); });

type RpcEnvelope = { result?: Record<string, unknown>; error?: { code: number } };

async function call(name: string, args: Record<string, unknown> = {}) {
  const { body } = await handleMcpBody(
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } },
    { configDir: fixture.root, repoRoot },
  ) as { body: RpcEnvelope };
  return body.result as {
    content: Array<{ text: string }>;
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  };
}

describe('store file', () => {
  it('reads as empty before anything is written', () => {
    expect(readStore(repoRoot)).toEqual({ version: 1, presets: [] });
    expect(existsSync(storePath(repoRoot))).toBe(false);
  });

  it('survives a corrupt file rather than throwing', () => {
    mkdirSync(join(repoRoot, '.cache', 'orca-bridge'), { recursive: true });
    writeFileSync(storePath(repoRoot), '{ not json');
    expect(readStore(repoRoot).presets).toEqual([]);
  });
});

describe('gallery_add_printer', () => {
  it('copies an Orca preset in flattened, with provenance', async () => {
    const result = await call('gallery_add_printer', { name: 'Test Printer Left' });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toMatchObject({
      created: true,
      name: 'Test Printer Left',
      address: '10.0.0.11:7125',
      copiedFrom: 'Test Printer Left',
    });

    const [saved] = readStore(repoRoot).presets;
    // Flattened: inherited values are present and `parents` is empty, so the
    // record does not depend on the vendor presets existing.
    expect(saved.raw['gcode_flavor']).toBe('klipper');
    expect(saved.parents).toEqual([]);
    expect(saved.source).toEqual({
      kind: 'orca-preset',
      presetName: 'Test Printer Left',
      chain: ['Test Printer 0.4 Nozzle', 'fdm_common'],
    });
  });

  it('duplicates onto another host with as + address', async () => {
    const result = await call('gallery_add_printer', {
      name: 'Test Printer Left',
      as: 'Test Printer Center',
      address: '10.0.0.71:7125',
    });
    expect(result.structuredContent).toMatchObject({
      created: true,
      name: 'Test Printer Center',
      address: '10.0.0.71:7125',
      copiedFrom: 'Test Printer Left',
    });

    const [saved] = readStore(repoRoot).presets;
    expect(saved.raw['print_host']).toBe('10.0.0.71:7125');
    // The name has to travel into the config too, or Orca round-trips it back
    // under the original identity.
    expect(saved.raw['name']).toBe('Test Printer Center');
    expect(saved.raw['printer_settings_id']).toBe('Test Printer Center');
    // Untouched fields still come from the source preset.
    expect(saved.raw['machine_start_gcode']).toBe('START_PRINT');
  });

  it('rewrites a derived web-UI link so it cannot point at the source machine', async () => {
    // Seed a record carrying print_host_webui, then duplicate it.
    await call('gallery_add_printer', { name: 'Test Printer Left' });
    const result = await call('gallery_add_printer', {
      name: 'Test Printer Right',
      as: 'Derived',
      address: '10.0.0.99:7125',
    });
    expect(result.isError).toBeFalsy();
    const saved = readStore(repoRoot).presets.find((p) => p.name === 'Derived')!;
    // The fixture's presets have no webui field, so it must stay absent rather
    // than being invented.
    expect(saved.raw['print_host_webui']).toBeUndefined();
  });

  it('reports the second write as an update, not a create', async () => {
    await call('gallery_add_printer', { name: 'Test Printer Left' });
    const again = await call('gallery_add_printer', { name: 'Test Printer Left' });
    expect(again.structuredContent).toMatchObject({ created: false, updated: true });
    expect(readStore(repoRoot).presets).toHaveLength(1);
  });

  it('refuses an address on a non-printer', async () => {
    const result = await call('gallery_add_printer', {
      kind: 'filament', name: 'House PETG', address: '10.0.0.1:7125',
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/only applies to a printer/);
  });

  it('suggests near matches for an unknown source preset', async () => {
    const result = await call('gallery_add_printer', { name: 'Test Printer Lefty' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Test Printer Left/);
  });

  it('refuses to write when no repo root is configured', async () => {
    const { body } = await handleMcpBody(
      {
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: 'gallery_add_printer', arguments: { name: 'Test Printer Left' } },
      },
      { configDir: fixture.root },
    ) as { body: RpcEnvelope };
    const result = body.result as { content: Array<{ text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/needs a repo root/);
  });
});

describe('gallery_list_presets / gallery_remove_preset', () => {
  it('lists what was added', async () => {
    await call('gallery_add_printer', { name: 'Test Printer Left' });
    const listed = await call('gallery_list_presets');
    expect(listed.structuredContent).toMatchObject({ count: 1 });
  });

  it('removes by name and reports a miss', async () => {
    await call('gallery_add_printer', { name: 'Test Printer Left' });
    const removed = await call('gallery_remove_preset', { name: 'Test Printer Left' });
    expect(removed.structuredContent).toMatchObject({ removed: true });
    expect(readStore(repoRoot).presets).toEqual([]);

    const miss = await call('gallery_remove_preset', { name: 'Test Printer Left' });
    expect(miss.isError).toBe(true);
  });
});

describe('devstore http', () => {
  let server: Server;
  let url: string;

  beforeEach(async () => {
    const middleware = createDevStoreMiddleware(repoRoot);
    server = createServer((req, res) => void middleware(req, res, () => {}));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('no port');
    url = `http://127.0.0.1:${address.port}/`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const row = (name: string, address: string) => ({
    kind: 'printer', name, raw: { name, print_host: address }, parents: [], address,
  });

  it('advertises availability so a client can tell it apart from an SPA fallback', async () => {
    const res = await fetch(url);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ available: true, count: 0, presets: [] });
  });

  it('round-trips a pushed set', async () => {
    const put = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presets: [row('A', '10.0.0.1:7125'), row('B', '10.0.0.2:7125')] }),
    });
    expect(await put.json()).toEqual({ count: 2 });

    const got = await (await fetch(url)).json() as { count: number; presets: Array<{ name: string }> };
    expect(got.count).toBe(2);
    expect(got.presets.map((p) => p.name)).toEqual(['A', 'B']);
  });

  it('replaces rather than merges on push', async () => {
    const push = (presets: unknown[]) => fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presets }),
    });
    await push([row('A', '10.0.0.1:7125'), row('B', '10.0.0.2:7125')]);
    await push([row('A', '10.0.0.1:7125')]);
    // A merge would resurrect B, which the user deleted locally.
    const got = await (await fetch(url)).json() as { presets: Array<{ name: string }> };
    expect(got.presets.map((p) => p.name)).toEqual(['A']);
  });

  it('rejects a malformed record with a reason', async () => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presets: [{ kind: 'nozzle', name: 'X', raw: {} }] }),
    });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toMatch(/presets\[0\]\.kind/);
  });

  it('rejects a body that is not a preset list', async () => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nope: true }),
    });
    expect(res.status).toBe(400);
  });

  it('empties the store on DELETE and reports the count', async () => {
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presets: [row('A', '10.0.0.1:7125')] }),
    });
    const res = await fetch(url, { method: 'DELETE' });
    expect(await res.json()).toEqual({ removed: 1 });
    expect(readStore(repoRoot).presets).toEqual([]);
  });

  it('rejects an unsupported verb', async () => {
    const res = await fetch(url, { method: 'POST', body: '{}' });
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toMatch(/DELETE/);
  });
});

describe('clearStore', () => {
  it('reports how many it dropped', async () => {
    await call('gallery_add_printer', { name: 'Test Printer Left' });
    expect(clearStore(repoRoot)).toEqual({ removed: 1 });
    expect(clearStore(repoRoot)).toEqual({ removed: 0 });
  });
});
