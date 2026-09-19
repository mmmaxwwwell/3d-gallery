import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KEY_SCHEMA,
  artifactKey,
  artifactKeyPreimage,
  artifactUrl,
  encodeRenderRequest,
  decodeRenderRequest,
  assertRequestMatchesKey,
  type ArtifactKeyInput,
} from '../src/key.ts';
import { KeyMismatchError } from '../src/errors.ts';
import type { ScadParam } from '../src/types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const VECTORS_PATH = join(HERE, 'key-vectors.json');

const SCHEMA: ScadParam[] = [
  { name: 'width', type: 'number', default: 40, help: '' },
  { name: 'shape', type: 'enum', default: 'circle', help: '', options: ['circle', 'hexagon'] },
  { name: 'label', type: 'string', default: 'Rex', help: '' },
];

const BASE: ArtifactKeyInput = {
  slug: 'collar-tag',
  target: 'multicolor',
  format: '3mf',
  sourceDigest: 'a'.repeat(64),
  schema: SCHEMA,
};

describe('artifactKey', () => {
  it('is a 64-char lowercase hex digest', async () => {
    expect(await artifactKey(BASE)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is stable across calls', async () => {
    expect(await artifactKey(BASE)).toBe(await artifactKey(BASE));
  });

  it('changes when the source changes', async () => {
    const other = await artifactKey({ ...BASE, sourceDigest: 'b'.repeat(64) });
    expect(other).not.toBe(await artifactKey(BASE));
  });

  it.each([
    ['slug', { slug: 'other-tag' }],
    ['target', { target: 'single' }],
    ['format', { format: 'stl' as const }],
  ])('changes when %s changes', async (_name, patch) => {
    expect(await artifactKey({ ...BASE, ...patch })).not.toBe(await artifactKey(BASE));
  });

  it('is identical for no params and for params left at their defaults', async () => {
    const defaults = await artifactKey({ ...BASE, params: { width: 40, shape: 'circle', label: 'Rex' } });
    expect(defaults).toBe(await artifactKey(BASE));
  });

  it('differs once a param leaves its default', async () => {
    const custom = await artifactKey({ ...BASE, params: { width: 41 } });
    expect(custom).not.toBe(await artifactKey(BASE));
  });

  it('ignores the order params were supplied in', async () => {
    const a = await artifactKey({ ...BASE, params: { width: 41, shape: 'hexagon' } });
    const b = await artifactKey({ ...BASE, params: { shape: 'hexagon', width: 41 } });
    expect(a).toBe(b);
  });

  it('does not depend on the render engine, so nothing engine-shaped is in the preimage', () => {
    const preimage = artifactKeyPreimage({ ...BASE, params: { width: 41 } });
    expect(preimage.startsWith(KEY_SCHEMA)).toBe(true);
    expect(preimage).not.toMatch(/manifold|cgal|openscad|wasm/i);
  });
});

describe('artifactUrl', () => {
  it('builds a content-addressed path', () => {
    expect(artifactUrl('abc', '3mf')).toBe('/a/abc.3mf');
  });

  it('tolerates a base with or without a trailing slash', () => {
    expect(artifactUrl('abc', 'stl', '/3d-gallery/a')).toBe('/3d-gallery/a/abc.stl');
    expect(artifactUrl('abc', 'stl', '/3d-gallery/a/')).toBe('/3d-gallery/a/abc.stl');
  });
});

describe('render request transport', () => {
  it('round-trips', () => {
    const req = { slug: 'collar-tag', target: 'multicolor', format: '3mf' as const, params: { label: 'Rex' } };
    expect(decodeRenderRequest(encodeRenderRequest(req))).toEqual(req);
  });

  it('survives non-ASCII parameter values', () => {
    const req = { slug: 'qr-sign', target: 'sign', format: 'stl' as const, params: { text: 'café — 日本語' } };
    expect(decodeRenderRequest(encodeRenderRequest(req))).toEqual(req);
  });

  it('is URL-safe', () => {
    const encoded = encodeRenderRequest({ slug: 's', target: 't', format: 'stl', params: { a: '?&=/+' } });
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('assertRequestMatchesKey', () => {
  it('accepts a request that hashes to its key', async () => {
    const key = await artifactKey({ ...BASE, params: { width: 41 } });
    await expect(assertRequestMatchesKey(key, { ...BASE, params: { width: 41 } })).resolves.toBeUndefined();
  });

  it('rejects params swapped in under someone else key', async () => {
    const key = await artifactKey({ ...BASE, params: { width: 41 } });
    await expect(assertRequestMatchesKey(key, { ...BASE, params: { width: 9999 } }))
      .rejects.toBeInstanceOf(KeyMismatchError);
  });
});

// Frozen vectors. The browser computes these keys too; if this file and the
// browser ever disagree, every client silently misses the cache instead of
// failing, so the agreement is pinned rather than assumed.
// Re-capture with TEST_UPDATE_VECTORS=1 — only when a key-schema change is intended.
describe('frozen key vectors', () => {
  const cases: { name: string; input: ArtifactKeyInput }[] = [
    { name: 'defaults', input: BASE },
    { name: 'one-number', input: { ...BASE, params: { width: 41 } } },
    { name: 'enum-and-string', input: { ...BASE, params: { shape: 'hexagon', label: 'Fido' } } },
    { name: 'stl-part', input: { ...BASE, target: 'single', format: 'stl' } },
    { name: 'unicode', input: { ...BASE, params: { label: 'café — 日本語' } } },
  ];

  it('match the checked-in digests', async () => {
    const actual: Record<string, string> = {};
    for (const c of cases) actual[c.name] = await artifactKey(c.input);

    if (process.env.TEST_UPDATE_VECTORS === '1' || !existsSync(VECTORS_PATH)) {
      writeFileSync(VECTORS_PATH, `${JSON.stringify({ keySchema: KEY_SCHEMA, keys: actual }, null, 2)}\n`);
    }

    const frozen = JSON.parse(readFileSync(VECTORS_PATH, 'utf8'));
    expect(frozen.keySchema).toBe(KEY_SCHEMA);
    expect(actual).toEqual(frozen.keys);
  });
});
