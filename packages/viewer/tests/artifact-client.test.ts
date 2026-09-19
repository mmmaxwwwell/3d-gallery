import { describe, it, expect, vi } from 'vitest';
import { artifactKey, decodeRenderRequest, KEY_SCHEMA, type RuntimeManifest, type RuntimePart } from '@3d-gallery/model-core';
import { createArtifactClient, UnknownTargetError, ArtifactUnavailableError, KeySchemaMismatchError } from '../src/artifact-client.ts';
import { createMemoryCache } from '../src/artifact-cache.ts';

const DIGEST = 'a'.repeat(64);
const DEFAULT_KEY = 'b'.repeat(64);

const part: RuntimePart = {
  file: 'multicolor.3mf',
  format: '3mf',
  label: 'Multicolor',
  module: 'multicolor',
  sourceDigest: DIGEST,
  paramSchema: [
    { name: 'size', type: 'number', default: 10, help: '' },
    { name: 'tag_text', type: 'string', default: 'BEANS', help: '' },
  ],
  defaultKey: DEFAULT_KEY,
};

const manifest: RuntimeManifest = {
  keySchema: KEY_SCHEMA,
  artifactBase: '/a/',
  models: [{ slug: 'collar-tag', title: 'Collar Tag', description: '…', previews: [part] }],
};

function bytes(n: number): ArrayBuffer {
  return new Uint8Array(Array.from({ length: n }, (_, i) => i % 256)).buffer;
}

function okResponse(body: ArrayBuffer, forgeStatus?: string): Response {
  return {
    ok: true,
    status: 200,
    headers: { get: (k: string) => (k.toLowerCase() === 'x-forge-status' ? forgeStatus ?? null : null) },
    arrayBuffer: async () => body,
  } as unknown as Response;
}

const notFound = { ok: false, status: 404, headers: { get: () => null } } as unknown as Response;

const req = { slug: 'collar-tag', target: 'multicolor' };

describe('keyFor', () => {
  it('uses the manifest default key when no parameters are given', async () => {
    const client = createArtifactClient({ manifest, cache: null, fetchImpl: vi.fn() });
    expect(await client.keyFor(req)).toBe(DEFAULT_KEY);
  });

  it('uses the manifest default key when parameters are an empty object', async () => {
    const client = createArtifactClient({ manifest, cache: null, fetchImpl: vi.fn() });
    expect(await client.keyFor({ ...req, params: {} })).toBe(DEFAULT_KEY);
  });

  it('computes a key from the published digest once parameters differ', async () => {
    const client = createArtifactClient({ manifest, cache: null, fetchImpl: vi.fn() });
    const key = await client.keyFor({ ...req, params: { size: 12 } });
    expect(key).toBe(await artifactKey({
      slug: 'collar-tag', target: 'multicolor', format: '3mf',
      sourceDigest: DIGEST, schema: part.paramSchema, params: { size: 12 },
    }));
    expect(key).not.toBe(DEFAULT_KEY);
  });

  it('rejects a target the manifest does not list', async () => {
    const client = createArtifactClient({ manifest, cache: null, fetchImpl: vi.fn() });
    await expect(client.keyFor({ slug: 'collar-tag', target: 'nope' })).rejects.toThrow(UnknownTargetError);
  });
});

describe('get', () => {
  it('serves from the local cache without touching the network', async () => {
    const cache = createMemoryCache();
    await cache.put(DEFAULT_KEY, bytes(8));
    const fetchImpl = vi.fn();

    const client = createArtifactClient({ manifest, cache, fetchImpl });
    const result = await client.get(req);

    expect(result.source).toBe('cache');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('asks for a clean immutable URL first, with no query string', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse(bytes(4)));
    const client = createArtifactClient({ manifest, cache: null, fetchImpl });

    const result = await client.get(req);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe(`/a/${DEFAULT_KEY}.3mf`);
    expect(result.source).toBe('network');
  });

  it('stores what it fetched, so the next call is a cache hit', async () => {
    const cache = createMemoryCache();
    const fetchImpl = vi.fn().mockResolvedValue(okResponse(bytes(4)));
    const client = createArtifactClient({ manifest, cache, fetchImpl });

    await client.get(req);
    const second = await client.get(req);

    expect(second.source).toBe('cache');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries with an attached render request after a 404', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(notFound)
      .mockResolvedValueOnce(okResponse(bytes(4), 'built'));

    const client = createArtifactClient({ manifest, cache: null, fetchImpl });
    const result = await client.get({ ...req, params: { size: 12 } });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const retryUrl = fetchImpl.mock.calls[1][0] as string;
    expect(retryUrl).toContain('?r=');
    expect(decodeRenderRequest(new URL(retryUrl, 'http://x').searchParams.get('r')!))
      .toEqual({ slug: 'collar-tag', target: 'multicolor', format: '3mf', params: { size: 12 } });
    expect(result.source).toBe('network');
  });

  it('does not retry when server rendering is disabled, which is the static-host case', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(notFound);
    const client = createArtifactClient({
      manifest, cache: null, fetchImpl, allowServerRender: false,
      localRenderer: { render: async () => bytes(2) },
    });

    const result = await client.get(req);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('local');
  });

  it('falls back to a local render when the server has nothing', async () => {
    const render = vi.fn().mockResolvedValue(bytes(16));
    const client = createArtifactClient({
      manifest, cache: null,
      fetchImpl: vi.fn().mockResolvedValue(notFound),
      localRenderer: { render },
    });

    const result = await client.get({ ...req, params: { size: 12 } });

    expect(result.source).toBe('local');
    expect(render).toHaveBeenCalledOnce();
    expect(render.mock.calls[0][0]).toMatchObject({ slug: 'collar-tag', target: 'multicolor', format: '3mf' });
  });

  it('caches a local render, so the same parameters are instant next time', async () => {
    const cache = createMemoryCache();
    const render = vi.fn().mockResolvedValue(bytes(16));
    const client = createArtifactClient({
      manifest, cache, fetchImpl: vi.fn().mockResolvedValue(notFound), localRenderer: { render },
    });

    await client.get({ ...req, params: { size: 12 } });
    const second = await client.get({ ...req, params: { size: 12 } });

    expect(second.source).toBe('cache');
    expect(render).toHaveBeenCalledOnce();
  });

  it('reports an unavailable artifact when there is no renderer to fall back to', async () => {
    const client = createArtifactClient({
      manifest, cache: null, fetchImpl: vi.fn().mockResolvedValue(notFound),
    });
    await expect(client.get(req)).rejects.toThrow(ArtifactUnavailableError);
  });

  it('treats a network failure like a miss rather than propagating it', async () => {
    const client = createArtifactClient({
      manifest, cache: null,
      fetchImpl: vi.fn().mockRejectedValue(new Error('offline')),
      localRenderer: { render: async () => bytes(2) },
    });
    expect((await client.get(req)).source).toBe('local');
  });
});

describe('urlFor', () => {
  it('builds a content-addressed URL under the manifest base', async () => {
    const client = createArtifactClient({ manifest, cache: null, fetchImpl: vi.fn() });
    expect(await client.urlFor(req)).toBe(`/a/${DEFAULT_KEY}.3mf`);
  });

  it('honours an overridden base', async () => {
    const client = createArtifactClient({ manifest, cache: null, fetchImpl: vi.fn(), artifactBase: '/3d-gallery/a/' });
    expect(await client.urlFor(req)).toBe(`/3d-gallery/a/${DEFAULT_KEY}.3mf`);
  });
});

describe('assertKeySchema', () => {
  it('accepts a manifest built by the same schema', () => {
    const client = createArtifactClient({ manifest, cache: null, fetchImpl: vi.fn() });
    expect(() => client.assertKeySchema(KEY_SCHEMA)).not.toThrow();
  });

  it('rejects a stale manifest loudly, instead of 404-looping forever', () => {
    const stale = { ...manifest, keySchema: '3dg-artifact/0' };
    const client = createArtifactClient({ manifest: stale, cache: null, fetchImpl: vi.fn() });
    expect(() => client.assertKeySchema(KEY_SCHEMA)).toThrow(KeySchemaMismatchError);
  });
});
