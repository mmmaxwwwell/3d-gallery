// SPDX-License-Identifier: MIT
// REST endpoint for the gallery preset store, for the browser to talk to.
//
// The gallery is local-first: IndexedDB is the real store and this server side
// is optional. That is a deliberate product constraint — someone running the
// hosted gallery without their own server keeps every record in their browser
// and simply never sees these endpoints, so no one pays to host what they do
// not use. The UI feature-detects a 404 and hides itself.
//
// Three verbs, matching the three things a user can decide:
//   GET     what does the server have?
//   PUT     take my local records (replace, not merge)
//   DELETE  forget everything; I will use my browser's copy
//
// Dev only and no auth, same as the MCP server it shares `store.ts` with.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { clearStore, readStore, replaceAll, type GalleryPreset, type PresetKind } from './store.ts';

const KINDS: PresetKind[] = ['printer', 'filament', 'process'];

function send(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Length', Buffer.byteLength(text));
  res.end(text);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      raw += chunk;
      // A whole preset library is a few MB at worst; refuse anything absurd
      // rather than buffer without a bound.
      if (raw.length > 32_000_000) reject(new Error('Request body too large.'));
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

/** Validate an incoming record hard enough that a malformed push can't poison
 *  the store — the browser reads these back and upserts them verbatim. */
function validate(value: unknown, index: number): GalleryPreset {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`presets[${index}] is not an object.`);
  }
  const row = value as Record<string, unknown>;
  const kind = row['kind'];
  const name = row['name'];
  if (typeof kind !== 'string' || !KINDS.includes(kind as PresetKind)) {
    throw new Error(`presets[${index}].kind must be one of ${KINDS.join(', ')}.`);
  }
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error(`presets[${index}].name must be a non-empty string.`);
  }
  const raw = row['raw'];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`presets[${index}].raw must be an object.`);
  }
  const parents = row['parents'];
  const address = row['address'];
  const compatible = row['compatiblePrinters'];
  return {
    kind: kind as PresetKind,
    name: name.trim(),
    raw: raw as Record<string, unknown>,
    parents: Array.isArray(parents) ? (parents as GalleryPreset['parents']) : [],
    address: typeof address === 'string' && address.trim() ? address.trim() : undefined,
    compatiblePrinters: Array.isArray(compatible) ? compatible.map(String) : undefined,
    source: { kind: 'manual' },
  };
}

export function createDevStoreMiddleware(repoRoot: string) {
  return async function devStoreMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ): Promise<void> {
    const method = req.method ?? 'GET';
    try {
      if (method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.statusCode = 204;
        res.end();
        return;
      }

      res.setHeader('Access-Control-Allow-Origin', '*');

      if (method === 'GET') {
        const store = readStore(repoRoot);
        send(res, 200, { available: true, count: store.presets.length, presets: store.presets });
        return;
      }

      if (method === 'PUT') {
        const parsed: unknown = JSON.parse(await readBody(req));
        const rows = (parsed as { presets?: unknown })?.presets;
        if (!Array.isArray(rows)) {
          send(res, 400, { error: 'Body must be {"presets": [...]}.' });
          return;
        }
        const presets = rows.map(validate);
        replaceAll(repoRoot, presets);
        send(res, 200, { count: presets.length });
        return;
      }

      if (method === 'DELETE') {
        send(res, 200, clearStore(repoRoot));
        return;
      }

      res.setHeader('Allow', 'GET, PUT, DELETE, OPTIONS');
      send(res, 405, { error: `${method} not supported.` });
    } catch (err) {
      send(res, 400, { error: (err as Error).message });
      next();
    }
  };
}
