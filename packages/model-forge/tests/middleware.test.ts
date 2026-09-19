import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { encodeRenderRequest, KEY_SCHEMA } from '@3d-gallery/model-core';
import { createForge, type Forge } from '../src/forge.ts';
import { createArtifactMiddleware, createManifestMiddleware } from '../src/middleware.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, 'fixtures');

function nativeEngineInstalled(): boolean {
  try {
    execFileSync('openscad', ['--version'], { stdio: 'ignore', timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}
const describeEngine = nativeEngineInstalled() ? describe : describe.skip;

interface Captured {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
  nexted: boolean;
}

async function call(handler: ReturnType<typeof createArtifactMiddleware>, url: string): Promise<Captured> {
  const captured: Captured = { status: 0, headers: {}, body: Buffer.alloc(0), nexted: false };

  const res = {
    set statusCode(v: number) { captured.status = v; },
    get statusCode() { return captured.status; },
    setHeader(k: string, v: string) { captured.headers[k.toLowerCase()] = String(v); },
    end(body?: Buffer | string) { captured.body = Buffer.from(body ?? ''); },
  } as unknown as ServerResponse;

  await handler({ url } as IncomingMessage, res, () => { captured.nexted = true; });
  return captured;
}

describe('createArtifactMiddleware', () => {
  let root: string;
  let forge: Forge;
  let handler: ReturnType<typeof createArtifactMiddleware>;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'forge-mw-'));
    cpSync(FIXTURES, root, { recursive: true });
    forge = createForge({ root, cacheDir: join(root, '.cache'), artifactBase: '/a/' });
    handler = createArtifactMiddleware(forge);
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  const box = { slug: 'fixture-cube', target: 'box', format: 'stl' as const };

  it('passes through a path outside its base', async () => {
    expect((await call(handler, '/other/thing.stl')).nexted).toBe(true);
  });

  it('passes through a name that is not a key', async () => {
    expect((await call(handler, '/a/not-a-key.stl')).nexted).toBe(true);
  });

  it('passes through an unsupported extension', async () => {
    expect((await call(handler, `/a/${'a'.repeat(64)}.obj`)).nexted).toBe(true);
  });

  it('404s a miss with no attached request, which is the static-host path', async () => {
    const res = await call(handler, `/a/${'a'.repeat(64)}.stl`);
    expect(res.status).toBe(404);
    expect(res.nexted).toBe(false);
  });

  it('serves a stored artifact immutably, without needing the request', async () => {
    const key = 'b'.repeat(64);
    forge.store.write(key, 'stl', new Uint8Array([1, 2, 3]), {
      key, slug: 'fixture-cube', target: 'box', format: 'stl', params: {},
      sourceDigest: '', externalIncludes: [], engine: 'x', engineVersion: 'x', args: [],
      byteLength: 3, renderMs: 1, builtAt: new Date().toISOString(),
    });

    const res = await call(handler, `/a/${key}.stl`);
    expect(res.status).toBe(200);
    expect([...res.body]).toEqual([1, 2, 3]);
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(res.headers['x-forge-status']).toBe('hit');
    expect(res.headers['content-type']).toBe('model/stl');
  });

  it('400s a malformed render payload', async () => {
    const res = await call(handler, `/a/${'c'.repeat(64)}.stl?r=not-base64url!!`);
    expect(res.status).toBe(400);
  });

  describeEngine('rendering on a miss', () => {
    it('renders and serves when a matching request is attached', async () => {
      const key = await forge.keyFor(box);
      const res = await call(handler, `/a/${key}.stl?r=${encodeRenderRequest(box)}`);

      expect(res.status).toBe(200);
      expect(res.headers['x-forge-status']).toBe('built');
      expect(res.body.byteLength).toBeGreaterThan(0);
    });

    it('serves the second request for the same key from the store', async () => {
      const key = await forge.keyFor(box);
      await call(handler, `/a/${key}.stl?r=${encodeRenderRequest(box)}`);
      const second = await call(handler, `/a/${key}.stl`);
      expect(second.headers['x-forge-status']).toBe('hit');
    });

    it('400s parameters that do not hash to the requested key', async () => {
      const key = await forge.keyFor(box);
      const res = await call(handler, `/a/${key}.stl?r=${encodeRenderRequest({ ...box, params: { size: 99 } })}`);
      expect(res.status).toBe(400);
    });

    it('500s a render failure and reports the openscad output', async () => {
      const key = await forge.keyFor(box);
      writeFileSync(join(root, 'models', 'fixture-cube', 'lib', 'shared-constants.scad'), 'not valid scad(((\n');

      // The source changed, so the old key no longer matches — which is itself
      // a client-side mismatch. Ask for the key the broken source now produces.
      const brokenKey = await forge.keyFor(box);
      const res = await call(handler, `/a/${brokenKey}.stl?r=${encodeRenderRequest(box)}`);
      expect(res.status).toBe(500);
      expect(res.body.toString()).toMatch(/error|ERROR|parse/i);
      expect(brokenKey).not.toBe(key);
    });
  });
});

describe('createManifestMiddleware', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'forge-mwm-'));
    cpSync(FIXTURES, root, { recursive: true });
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('serves the runtime manifest uncached, since digests move with the source', async () => {
    const forge = createForge({ root, cacheDir: join(root, '.cache') });
    const handler = createManifestMiddleware(forge);

    const captured = { status: 0, headers: {} as Record<string, string>, body: '' };
    const res = {
      set statusCode(v: number) { captured.status = v; },
      get statusCode() { return captured.status; },
      setHeader(k: string, v: string) { captured.headers[k.toLowerCase()] = String(v); },
      end(body?: string) { captured.body = body ?? ''; },
    } as unknown as ServerResponse;

    await handler({ url: '/manifest.json' } as IncomingMessage, res);

    expect(captured.status).toBe(200);
    expect(captured.headers['cache-control']).toBe('no-store');
    const parsed = JSON.parse(captured.body);
    expect(parsed.keySchema).toBe(KEY_SCHEMA);
    expect(parsed.models[0].parts[0].defaultKey).toMatch(/^[0-9a-f]{64}$/);
  });
});
