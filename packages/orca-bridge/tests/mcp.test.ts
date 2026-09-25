// SPDX-License-Identifier: MIT

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { handleMcpBody, createMcpMiddleware, TOOLS } from '../src/mcp.ts';
import { makeFixture, type Fixture } from './fixture.ts';

let fixture: Fixture;

beforeAll(() => { fixture = makeFixture(); });
afterAll(() => { rmSync(fixture.root, { recursive: true, force: true }); });

const opts = () => ({ configDir: fixture.root });

type RpcEnvelope = {
  jsonrpc: string;
  id: number | string | null;
  result?: Record<string, unknown>;
  error?: { code: number; message: string; data?: unknown };
};

async function rpc(message: unknown) {
  return handleMcpBody(message, opts()) as Promise<{ status: number; body?: RpcEnvelope }>;
}

async function callTool(name: string, args: Record<string, unknown> = {}) {
  const { body } = await rpc({
    jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args },
  });
  return body!.result as { content: Array<{ text: string }>; structuredContent?: unknown; isError?: boolean };
}

describe('handshake', () => {
  it('echoes a protocol version it supports', async () => {
    const { body } = await rpc({
      jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' },
    });
    expect(body!.result!['protocolVersion']).toBe('2025-03-26');
    expect(body!.result!['capabilities']).toEqual({ tools: { listChanged: false } });
  });

  it('falls back to its newest version for an unknown one', async () => {
    const { body } = await rpc({
      jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1999-01-01' },
    });
    expect(body!.result!['protocolVersion']).toBe('2025-06-18');
  });

  it('acknowledges notifications with 202 and no body', async () => {
    const res = await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' });
    expect(res).toEqual({ status: 202 });
  });

  it('answers ping', async () => {
    const { body } = await rpc({ jsonrpc: '2.0', id: 7, method: 'ping' });
    expect(body!.result).toEqual({});
    expect(body!.id).toBe(7);
  });
});

describe('tools/list', () => {
  it('describes every tool with an object schema', async () => {
    const { body } = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    const tools = body!.result!['tools'] as Array<Record<string, unknown>>;
    expect(tools).toHaveLength(TOOLS.length);
    for (const tool of tools) {
      expect(tool['inputSchema']).toMatchObject({ type: 'object' });
      expect(String(tool['description']).length).toBeGreaterThan(20);
    }
  });

  it('marks the orca readers read-only and the gallery writers not', async () => {
    const { body } = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    const tools = body!.result!['tools'] as Array<{ name: string; annotations: Record<string, unknown> }>;
    // The split matters: a client can auto-approve reads of someone's slicer
    // config while still prompting before anything is written. Listed by name
    // rather than derived from the prefix, so adding a writer to the orca_*
    // family cannot silently inherit a read-only hint.
    const WRITERS = new Set(['gallery_add_printer', 'gallery_remove_preset']);
    for (const tool of tools) {
      const readOnly = !WRITERS.has(tool.name);
      expect(tool.annotations['readOnlyHint'], tool.name).toBe(readOnly);
      expect(tool.annotations['destructiveHint'], tool.name).toBe(!readOnly);
    }
    expect(tools.filter((t) => WRITERS.has(t.name))).toHaveLength(WRITERS.size);
    // Nothing that reads Orca may be a writer.
    expect([...WRITERS].every((n) => !n.startsWith('orca_'))).toBe(true);
  });
});

describe('tools/call', () => {
  it('returns both text and structured content', async () => {
    const result = await callTool('orca_doctor');
    expect(result.isError).toBeFalsy();
    const structured = result.structuredContent as { root: string };
    expect(structured.root).toBe(fixture.root);
    // The text block must be the same payload, so a client without
    // structuredContent support loses nothing.
    expect(JSON.parse(result.content[0].text)).toEqual(structured);
  });

  it('enumerates presets through the tool layer', async () => {
    const result = await callTool('orca_list_presets', { kind: 'printer', scope: 'user' });
    const { presets } = result.structuredContent as { presets: Array<{ name: string }> };
    expect(presets.map((p) => p.name)).toContain('Test Printer Left');
  });

  it('coerces a comma-joined string into a string array', async () => {
    // Models often pass "a,b" where the schema asks for an array.
    const result = await callTool('orca_get_preset', {
      kind: 'printer',
      name: 'Test Printer Left',
      fields: 'print_host,gcode_flavor',
    });
    const { merged } = result.structuredContent as { merged: Record<string, unknown> };
    expect(merged).toEqual({ print_host: '10.0.0.11:7125', gcode_flavor: 'klipper' });
  });

  it('reports a bad argument as a tool error, not a protocol error', async () => {
    const result = await callTool('orca_get_preset', { kind: 'printer', name: 'Nope' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/No printer preset named/);
  });

  it('rejects an invalid kind with the valid options', async () => {
    const result = await callTool('orca_list_presets', { kind: 'nozzle' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/printer, filament, process/);
  });

  it('raises a protocol error for an unknown tool name', async () => {
    const { body } = await rpc({
      jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'orca_nope' },
    });
    expect(body!.error?.code).toBe(-32602);
    expect((body!.error?.data as { available: string[] }).available).toContain('orca_doctor');
  });

  it('reads a project through the tool layer', async () => {
    const result = await callTool('orca_read_project', { path: fixture.projectPath });
    const project = result.structuredContent as { objects: unknown[]; presetIds: { printer: string } };
    expect(project.objects).toHaveLength(2);
    expect(project.presetIds.printer).toBe('Test Printer Left');
  });
});

describe('protocol errors', () => {
  it('rejects a non-object body', async () => {
    const { status, body } = await rpc('hello');
    expect(status).toBe(400);
    expect(body!.error?.code).toBe(-32600);
  });

  it('rejects an empty batch', async () => {
    const { status } = await rpc([]);
    expect(status).toBe(400);
  });

  it('answers a batch with one response per request', async () => {
    const { status, body } = await handleMcpBody(
      [
        { jsonrpc: '2.0', id: 1, method: 'ping' },
        { jsonrpc: '2.0', method: 'notifications/initialized' },
        { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      ],
      opts(),
    ) as { status: number; body: RpcEnvelope[] };
    expect(status).toBe(200);
    expect(body.map((r) => r.id)).toEqual([1, 2]);
  });

  it('reports an unknown method', async () => {
    const { body } = await rpc({ jsonrpc: '2.0', id: 4, method: 'resources/read' });
    expect(body!.error?.code).toBe(-32601);
  });
});

describe('http transport', () => {
  let server: Server;
  let url: string;

  beforeAll(async () => {
    const middleware = createMcpMiddleware(opts());
    server = createServer((req, res) => void middleware(req, res, () => {}));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('no port');
    url = `http://127.0.0.1:${address.port}/`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('serves a POSTed request as application/json', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    const json = await res.json() as RpcEnvelope;
    expect((json.result!['tools'] as unknown[]).length).toBe(TOOLS.length);
  });

  it('returns 202 with an empty body for a notification', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    });
    expect(res.status).toBe(202);
    expect(await res.text()).toBe('');
  });

  it('rejects GET — there is no server-initiated stream', async () => {
    const res = await fetch(url);
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST, OPTIONS');
  });

  it('answers a CORS preflight', async () => {
    const res = await fetch(url, { method: 'OPTIONS' });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('reports malformed JSON as a parse error', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    });
    expect(res.status).toBe(400);
    expect(((await res.json()) as RpcEnvelope).error?.code).toBe(-32700);
  });
});

describe('missing install', () => {
  it('reports a missing config root as a tool error with the paths searched', async () => {
    const { body } = await handleMcpBody(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'orca_doctor' } },
      { configDir: '/definitely/not/here' },
    ) as { body: RpcEnvelope };
    const result = body.result as { content: Array<{ text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/No OrcaSlicer config directory found/);
  });
});
