// SPDX-License-Identifier: MIT
// MCP server exposing the Orca readers over HTTP.
//
// Transport is stateless Streamable HTTP: the client POSTs JSON-RPC and gets a
// single `application/json` response back. No session ids, no server-initiated
// SSE stream — every tool here is a synchronous read, so there is nothing to
// push. GET and DELETE are therefore 405.
//
// Single user, no auth: the server runs inside the gallery dev server and the
// MCP caller is assumed to be the same person already running it. When this
// moves to a hosted multi-user model the identity of the *config root* is what
// has to become per-user — every query already takes `OrcaPaths`, so that
// seam is where auth will land.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolveOrcaPaths, searchedRoots, type OrcaPaths } from './paths.ts';
import { OrcaQueryError, PRESET_KINDS, type ListPresetsInput } from './queries.ts';
import * as q from './queries.ts';

export const SERVER_NAME = 'orca-bridge';
export const SERVER_VERSION = '0.1.0';

/** Newest first. We answer `initialize` with the client's version when we know
 *  it, otherwise our newest. */
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];

type Json = Record<string, unknown>;

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
}

interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: Json;
  /** Advertised as `readOnlyHint` so clients can auto-approve the reads and
   *  prompt on the writes. Every `orca_*` tool is read-only; only the
   *  `gallery_*` writers touch disk, and never Orca's config. */
  readOnly: boolean;
  run(paths: () => OrcaPaths, args: Json, repoRoot: string): unknown | Promise<unknown>;
}

const KIND_SCHEMA = {
  type: 'string',
  enum: PRESET_KINDS,
  description: 'Which preset family to look at.',
};

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function bool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

function strArray(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  const single = str(v);
  // Tolerate a comma-joined string — models reach for that shape often.
  return single ? single.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
}

function num(v: unknown): number | undefined {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

function requireKind(v: unknown): ListPresetsInput['kind'] {
  const kind = str(v);
  if (kind && (PRESET_KINDS as string[]).includes(kind)) return kind as ListPresetsInput['kind'];
  throw new OrcaQueryError(
    `"kind" must be one of ${PRESET_KINDS.join(', ')}.`,
    PRESET_KINDS as string[],
  );
}

export const TOOLS: ToolDef[] = [
  {
    name: 'orca_doctor',
    title: 'Locate the Orca install',
    description:
      'Where the OrcaSlicer config lives and what it holds: preset counts per kind and scope, '
      + 'user profiles, current selection, and whether the logs carry anything useful. '
      + 'Call this first — every other tool depends on the install being found.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnly: true,
    run: (paths) => q.doctor(paths()),
  },
  {
    name: 'orca_list_presets',
    title: 'Enumerate presets',
    description:
      'List printer, filament or process presets. Scope "user" is what the person authored; '
      + '"system" is the vendor library (thousands of entries — always pass a name filter). '
      + 'With detail, each row adds its inheritance chain, the fields it overrides, and any '
      + 'print_host address.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: KIND_SCHEMA,
        scope: { type: 'string', enum: ['user', 'system'], description: 'Omit for both.' },
        name: { type: 'string', description: 'Case-insensitive substring filter on the name.' },
        detail: {
          type: 'boolean',
          description: 'Resolve each preset to add chain, overridden fields and address. Slower.',
        },
      },
      required: ['kind'],
      additionalProperties: false,
    },
    readOnly: true,
    run: (paths, args) =>
      q.listPresets(paths(), {
        kind: requireKind(args['kind']),
        scope: str(args['scope']) as 'user' | 'system' | undefined,
        name: str(args['name']),
        detail: bool(args['detail']),
      }),
  },
  {
    name: 'orca_get_preset',
    title: 'Resolve one preset',
    description:
      'Resolve a single preset by name: its inheritance chain, the field-level overrides it '
      + 'applies to the inherited base, and optionally its own raw keys or the full merged '
      + 'values. The overrides list is the useful part — it is what a human actually chose, '
      + 'as opposed to the ~600 inherited values.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: KIND_SCHEMA,
        name: { type: 'string', description: 'Exact preset name.' },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Return only these keys from the merged config.',
        },
        raw: { type: 'boolean', description: "Include the preset file's own keys." },
        merged: { type: 'boolean', description: 'Include all merged values.' },
      },
      required: ['kind', 'name'],
      additionalProperties: false,
    },
    readOnly: true,
    run: (paths, args) =>
      q.getPreset(paths(), {
        kind: requireKind(args['kind']),
        name: str(args['name']) ?? '',
        fields: strArray(args['fields']),
        raw: bool(args['raw']),
        merged: bool(args['merged']),
      }),
  },
  {
    name: 'orca_machines',
    title: 'Registered network machines',
    description:
      'The network machines Orca itself has registered, plus the installed vendor models. '
      + 'Note this is not the same set as printers reachable via presets — a preset can carry '
      + 'a print_host Orca never registered here.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnly: true,
    run: (paths) => q.machines(paths()),
  },
  {
    name: 'orca_usage',
    title: 'Which preset combos are actually used',
    description:
      'Printer + filament + process combinations that have actually been used together, '
      + 'deduped and ranked by frequency, from Orca\'s own history. This is the best available '
      + 'signal for which of a large preset library matters in practice.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max combos to return (default 20).' } },
      additionalProperties: false,
    },
    readOnly: true,
    run: (paths, args) => q.usage(paths(), num(args['limit']) ?? 20),
  },
  {
    name: 'orca_list_projects',
    title: 'Recently sliced projects',
    description:
      'The 3MF projects Orca has recently opened or sliced, most recent first, each flagged '
      + 'with whether the file still exists. Feed a path to orca_read_project.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnly: true,
    run: (paths) => q.projects(paths()),
  },
  {
    name: 'orca_read_project',
    title: 'Extract a sliced project',
    description:
      'Extract a 3MF: the preset NAMES it used (printer/filament/process), its objects with '
      + 'source filenames, transforms and bounding boxes, and its plates with object placement. '
      + 'Important limitation: a project carries resolved config VALUES but no lineage, so the '
      + 'preset names are the only identity available and may not match any preset still on '
      + 'disk. Reconcile by name first, then by comparing field values.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path to a .3mf project file.' },
        configFields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Pick specific keys out of the flattened config.',
        },
        fullConfig: {
          type: 'boolean',
          description: 'Include all ~600 flattened config keys. Large — prefer configFields.',
        },
      },
      required: ['path'],
      additionalProperties: false,
    },
    readOnly: true,
    run: (_paths, args) =>
      q.project({
        path: str(args['path']) ?? '',
        configFields: strArray(args['configFields']),
        fullConfig: bool(args['fullConfig']),
      }),
  },
  {
    name: 'gallery_list_presets',
    title: 'What the gallery store holds',
    description:
      'List the preset records saved server-side for the gallery. These are separate from '
      + 'Orca\'s own presets: they are the gallery\'s records, flattened and self-contained, '
      + 'which the browser upserts into IndexedDB on load in dev.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnly: true,
    run: (_paths, _args, repoRoot) => q.galleryList(repoRoot),
  },
  {
    name: 'gallery_add_printer',
    title: 'Copy an Orca preset into the gallery',
    description:
      'Copy an Orca preset into the gallery store, resolving its inheritance chain down to a '
      + 'flat self-contained record. Pass "as" to store it under a new name and "address" to '
      + 'point it at a different machine — together those duplicate a printer onto another host '
      + 'without touching the Orca config. Writes only the gallery store; Orca is never modified. '
      + 'The browser picks it up on the next page load in dev.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the Orca preset to copy.' },
        kind: { ...KIND_SCHEMA, description: 'Defaults to printer.' },
        as: { type: 'string', description: 'Store under this name instead, making it a duplicate.' },
        address: {
          type: 'string',
          description: 'Moonraker address (host:port) for the copy. Printers only.',
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
    readOnly: false,
    run: (paths, args, repoRoot) =>
      q.galleryAddFromOrca(paths(), repoRoot, {
        kind: args['kind'] === undefined ? 'printer' : requireKind(args['kind']),
        name: str(args['name']) ?? '',
        as: str(args['as']),
        address: str(args['address']),
      }),
  },
  {
    name: 'gallery_remove_preset',
    title: 'Drop a record from the gallery store',
    description:
      'Remove a preset record from the gallery store. Does not delete anything already synced '
      + 'into the browser — the sync is additive and never deletes.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        kind: { ...KIND_SCHEMA, description: 'Defaults to printer.' },
      },
      required: ['name'],
      additionalProperties: false,
    },
    readOnly: false,
    run: (_paths, args, repoRoot) =>
      q.galleryRemove(
        repoRoot,
        args['kind'] === undefined ? 'printer' : requireKind(args['kind']),
        str(args['name']) ?? '',
      ),
  },
  {
    name: 'orca_logs',
    title: 'What the Orca logs contain',
    description:
      'Summarize the Orca log files: severity level, sizes, and the most frequent messages. '
      + 'At the default "warning" level Orca logs no preset, slice or upload events, so this is '
      + 'for diagnosing the install rather than reconstructing what a user did.',
    inputSchema: {
      type: 'object',
      properties: {
        files: { type: 'number', description: 'How many of the newest log files to scan (default 1).' },
      },
      additionalProperties: false,
    },
    readOnly: true,
    run: (paths, args) => q.logs(paths(), num(args['files']) ?? 1),
  },
];

const TOOLS_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

export interface McpServerOptions {
  /** Override the Orca config root. Defaults to platform discovery. */
  configDir?: string;
  /** Repo root the gallery store is written under. Required by the `gallery_*`
   *  tools; they refuse rather than guess a location. */
  repoRoot?: string;
}

function pathsGetter(options: McpServerOptions): () => OrcaPaths {
  return () => {
    const resolved = resolveOrcaPaths(options.configDir);
    if (!resolved) {
      throw new OrcaQueryError(
        'No OrcaSlicer config directory found.',
        searchedRoots(options.configDir),
      );
    }
    return resolved;
  };
}

interface RpcResult {
  status: number;
  body?: unknown;
}

function rpcError(id: JsonRpcRequest['id'], code: number, message: string, data?: unknown) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message, ...(data === undefined ? {} : { data }) },
  };
}

function rpcOk(id: JsonRpcRequest['id'], result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

async function callTool(
  getPaths: () => OrcaPaths,
  params: Json,
  repoRoot: string | undefined,
): Promise<{ result: unknown } | { error: { code: number; message: string; data?: unknown } }> {
  const name = str(params['name']);
  if (!name) return { error: { code: -32602, message: 'tools/call requires a tool name.' } };
  const tool = TOOLS_BY_NAME.get(name);
  if (!tool) {
    return {
      error: {
        code: -32602,
        message: `Unknown tool "${name}".`,
        data: { available: TOOLS.map((t) => t.name) },
      },
    };
  }
  const args = (params['arguments'] && typeof params['arguments'] === 'object'
    ? params['arguments']
    : {}) as Json;

  try {
    if (!tool.readOnly && !repoRoot) {
      throw new OrcaQueryError(
        `${tool.name} needs a repo root to write the gallery store, and none was configured.`,
      );
    }
    const data = await tool.run(getPaths, args, repoRoot ?? '');
    return {
      result: {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
      },
    };
  } catch (err) {
    // A failed read is a tool-level error, not a protocol error: report it in
    // the result so the model can correct its arguments and retry.
    const message = err instanceof Error ? err.message : String(err);
    const suggestions = err instanceof OrcaQueryError ? err.suggestions : [];
    const text = suggestions.length
      ? `${message}\n\nDid you mean:\n${suggestions.map((s) => `  ${s}`).join('\n')}`
      : message;
    return { result: { content: [{ type: 'text', text }], isError: true } };
  }
}

/** Handle one JSON-RPC message. Returns null for notifications. */
async function handleMessage(
  message: JsonRpcRequest,
  options: McpServerOptions,
): Promise<unknown | null> {
  const { id, method } = message;
  const isNotification = id === undefined || id === null;
  const params = (message.params && typeof message.params === 'object'
    ? message.params
    : {}) as Json;

  switch (method) {
    case 'initialize': {
      const requested = str(params['protocolVersion']);
      return rpcOk(id, {
        protocolVersion:
          requested && SUPPORTED_PROTOCOLS.includes(requested) ? requested : SUPPORTED_PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, title: 'OrcaSlicer bridge', version: SERVER_VERSION },
        instructions:
          'Read-only access to a local OrcaSlicer install. Call orca_doctor first to confirm the '
          + 'install was found, then enumerate presets, machines, usage history and sliced '
          + 'projects. Nothing here writes to the Orca config.',
      });
    }
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null;
    case 'ping':
      return isNotification ? null : rpcOk(id, {});
    case 'tools/list':
      return rpcOk(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          title: t.title,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: {
            readOnlyHint: t.readOnly,
            idempotentHint: true,
            destructiveHint: !t.readOnly,
            openWorldHint: false,
          },
        })),
      });
    case 'tools/call': {
      const outcome = await callTool(pathsGetter(options), params, options.repoRoot);
      if ('error' in outcome) return rpcError(id, outcome.error.code, outcome.error.message, outcome.error.data);
      return rpcOk(id, outcome.result);
    }
    // Declared unsupported rather than silently empty, so a client's probe is
    // unambiguous.
    case 'resources/list':
    case 'resources/templates/list':
    case 'prompts/list':
      return isNotification ? null : rpcError(id, -32601, `Method not supported: ${method}`);
    default:
      if (isNotification) return null;
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

/** Handle a parsed request body (single message or batch). */
export async function handleMcpBody(
  body: unknown,
  options: McpServerOptions = {},
): Promise<RpcResult> {
  if (Array.isArray(body)) {
    if (body.length === 0) return { status: 400, body: rpcError(null, -32600, 'Empty batch.') };
    const responses = (
      await Promise.all(body.map((m) => handleMessage(m as JsonRpcRequest, options)))
    ).filter((r) => r !== null);
    // A batch of nothing but notifications gets an acknowledgement, no body.
    return responses.length ? { status: 200, body: responses } : { status: 202 };
  }
  if (!body || typeof body !== 'object') {
    return { status: 400, body: rpcError(null, -32600, 'Request must be a JSON-RPC object.') };
  }
  const response = await handleMessage(body as JsonRpcRequest, options);
  return response === null ? { status: 202 } : { status: 200, body: response };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      raw += chunk;
      // A read-only RPC has no business being large; cap it rather than buffer
      // without bound.
      if (raw.length > 1_000_000) reject(new Error('Request body too large.'));
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body?: unknown): void {
  res.statusCode = status;
  if (body === undefined) {
    res.end();
    return;
  }
  const text = JSON.stringify(body);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', Buffer.byteLength(text));
  res.end(text);
}

/**
 * Connect-style middleware serving MCP over HTTP.
 *
 * Deliberately no auth: single-user, bound to the dev server, and the MCP
 * caller is the same person who started it.
 */
export function createMcpMiddleware(options: McpServerOptions = {}) {
  return async function mcpMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ): Promise<void> {
    const method = req.method ?? 'GET';

    if (method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id, MCP-Protocol-Version');
      send(res, 204);
      return;
    }

    if (method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS');
      send(res, 405, rpcError(null, -32600, 'This MCP endpoint is POST-only (no SSE stream).'));
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const raw = await readBody(req);
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        send(res, 400, rpcError(null, -32700, 'Parse error: body is not valid JSON.'));
        return;
      }
      const { status, body } = await handleMcpBody(parsed, options);
      send(res, status, body);
    } catch (err) {
      // Anything reaching here is a bug or a transport failure, not a bad tool
      // argument — surface it rather than letting Vite render an HTML error.
      send(res, 500, rpcError(null, -32603, (err as Error).message));
      next();
    }
  };
}
