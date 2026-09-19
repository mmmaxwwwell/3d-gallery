import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artifactKey, encodeRenderRequest, KEY_SCHEMA, type RuntimeManifest } from '@3d-gallery/model-core';

const SITE = join(dirname(fileURLToPath(import.meta.url)), 'fixture-site');
const LIB = join(SITE, 'models', 'demo-cube', 'lib', 'demo-cube-lib.scad');
const PORT = 4417;
const ORIGIN = `http://localhost:${PORT}/demo`;

function nativeEngineInstalled(): boolean {
  try {
    execFileSync('openscad', ['--version'], { stdio: 'ignore', timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

const describeDev = nativeEngineInstalled() ? describe : describe.skip;

async function waitForServer(timeoutMs = 90_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${ORIGIN}/`);
      if (res.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`astro dev did not come up on ${PORT}`);
}

async function manifest(): Promise<RuntimeManifest> {
  const res = await fetch(`${ORIGIN}/models/manifest.json`);
  return (await res.json()) as RuntimeManifest;
}

function defaultKeyOf(m: RuntimeManifest): string {
  return m.models[0].parts![0].defaultKey;
}

const PAYLOAD = encodeRenderRequest({ slug: 'demo-cube', target: 'cube', format: 'stl' });

describeDev('astro dev — deferred generation', () => {
  let server: ChildProcess;
  let original: string;

  beforeAll(async () => {
    original = readFileSync(LIB, 'utf8');
    // Cold store, so the first request has to actually render.
    rmSync(join(SITE, '.cache'), { recursive: true, force: true });

    server = spawn('npx', ['astro', 'dev', '--root', SITE, '--port', String(PORT)], {
      cwd: SITE,
      stdio: 'ignore',
      detached: true,
    });
    await waitForServer();
  }, 180_000);

  afterAll(() => {
    writeFileSync(LIB, original);
    if (server?.pid) {
      try {
        process.kill(-server.pid, 'SIGTERM');
      } catch {
        server.kill('SIGTERM');
      }
    }
  });

  it('serves the runtime manifest, not the authored one', async () => {
    const m = await manifest();
    expect(m.keySchema).toBe(KEY_SCHEMA);
    expect(m.models[0].parts![0].sourceDigest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('publishes a site-base-prefixed artifact base, because the browser fetches the real URL', async () => {
    expect((await manifest()).artifactBase).toBe('/demo/a/');
  });

  it('404s a bare request for an artifact it has not built', async () => {
    const key = defaultKeyOf(await manifest());
    const res = await fetch(`${ORIGIN}/a/${key}.stl`);
    expect(res.status).toBe(404);
    // Its own 404, not Astro's catch-all — proof the middleware is mounted ahead of it.
    expect(res.headers.get('content-type')).toContain('text/plain');
  });

  it('renders on demand when the request carries its render payload', async () => {
    const key = defaultKeyOf(await manifest());
    const res = await fetch(`${ORIGIN}/a/${key}.stl?r=${PAYLOAD}`);

    expect(res.status).toBe(200);
    expect(res.headers.get('x-forge-status')).toBe('built');
    expect(res.headers.get('content-type')).toBe('model/stl');
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');

    const body = await res.text();
    expect(body).toContain('solid');
    expect(body.match(/facet normal/g)).toHaveLength(12);
  }, 120_000);

  it('serves the same artifact from the store afterwards, with no payload needed', async () => {
    const key = defaultKeyOf(await manifest());
    const res = await fetch(`${ORIGIN}/a/${key}.stl`);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-forge-status')).toBe('hit');
  });

  it('rejects a payload that does not hash to the requested key', async () => {
    // Must target a key the store does NOT hold: an artifact that already
    // exists is returned on its key alone, and the payload is never consulted.
    // That is safe — the caller gets the bytes for the key it named, not for
    // the parameters it attached — so verification only guards a fresh render.
    const part = (await manifest()).models[0].parts![0];
    const claimed = await artifactKey({
      slug: 'demo-cube', target: 'cube', format: 'stl',
      sourceDigest: part.sourceDigest, schema: part.paramSchema, params: { size: 41 },
    });
    const mismatched = encodeRenderRequest({ slug: 'demo-cube', target: 'cube', format: 'stl', params: { size: 42 } });

    const res = await fetch(`${ORIGIN}/a/${claimed}.stl?r=${mismatched}`);
    expect(res.status).toBe(400);
  });

  it('renders a parameter set that hashes correctly', async () => {
    const part = (await manifest()).models[0].parts![0];
    const key = await artifactKey({
      slug: 'demo-cube', target: 'cube', format: 'stl',
      sourceDigest: part.sourceDigest, schema: part.paramSchema, params: { size: 41 },
    });
    const payload = encodeRenderRequest({ slug: 'demo-cube', target: 'cube', format: 'stl', params: { size: 41 } });

    const res = await fetch(`${ORIGIN}/a/${key}.stl?r=${payload}`);
    expect(res.status).toBe(200);

    const vertices = [...(await res.text()).matchAll(/vertex ([-\d.e]+) ([-\d.e]+) ([-\d.e]+)/g)];
    expect(Math.max(...vertices.map((v) => Number(v[1])))).toBe(41);
  }, 120_000);

  it('regenerates after the .scad changes, with no invalidation step', async () => {
    const before = await manifest();
    const oldKey = defaultKeyOf(before);

    writeFileSync(LIB, original.replace('size = 10;', 'size = 25;'));
    // Let the watcher drop the memoized source shape.
    await new Promise((r) => setTimeout(r, 1500));

    const after = await manifest();
    const newKey = defaultKeyOf(after);

    expect(after.models[0].parts![0].sourceDigest).not.toBe(before.models[0].parts![0].sourceDigest);
    expect(newKey).not.toBe(oldKey);

    const rendered = await fetch(`${ORIGIN}/a/${newKey}.stl?r=${PAYLOAD}`);
    expect(rendered.headers.get('x-forge-status')).toBe('built');

    // The geometry really is the edited model, not a stale artifact.
    const vertices = [...(await rendered.text()).matchAll(/vertex ([-\d.e]+) ([-\d.e]+) ([-\d.e]+)/g)];
    expect(Math.max(...vertices.map((v) => Number(v[1])))).toBe(25);

    // The superseded artifact simply goes cold; nothing evicts it.
    const old = await fetch(`${ORIGIN}/a/${oldKey}.stl`);
    expect(old.status).toBe(200);
    expect(old.headers.get('x-forge-status')).toBe('hit');
  }, 120_000);
});
