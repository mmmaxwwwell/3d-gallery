import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KEY_SCHEMA } from '@3d-gallery/model-core';
import { createForge, targetOf, UnknownModelError, type Forge } from '../src/forge.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, 'fixtures');

// Probed synchronously: vitest picks a describe body at collection time, so an
// async beforeAll would leave every engine-backed test permanently skipped.
function nativeEngineInstalled(): boolean {
  try {
    execFileSync('openscad', ['--version'], { stdio: 'ignore', timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

const describeEngine = nativeEngineInstalled() ? describe : describe.skip;

describe('createForge', () => {
  let root: string;
  let forge: Forge;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'forge-run-'));
    cpSync(FIXTURES, root, { recursive: true });
    forge = createForge({ root, cacheDir: join(root, '.cache'), concurrency: 2 });
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  const box = { slug: 'fixture-cube', target: 'box', format: 'stl' as const };

  it('loads and validates the manifest from disk', () => {
    expect(forge.manifest.models.map((m) => m.slug)).toEqual(['fixture-cube']);
  });

  it('accepts a manifest passed in directly', () => {
    const passed = createForge({
      root,
      cacheDir: join(root, '.cache2'),
      manifest: JSON.parse(readFileSync(join(root, 'models', 'manifest.json'), 'utf8')),
    });
    expect(passed.manifest.models[0].slug).toBe('fixture-cube');
  });

  it('rejects an unknown slug', () => {
    expect(() => forge.shapeFor('nope', 'box')).toThrow(UnknownModelError);
  });

  it('derives a target from a part file name', () => {
    expect(targetOf({ file: 'duo-tall.3mf', format: '3mf', label: '' })).toBe('duo-tall');
  });

  describe('keys', () => {
    it('are stable for the same request', async () => {
      expect(await forge.keyFor(box)).toBe(await forge.keyFor(box));
    });

    it('collapse explicit defaults onto the no-params key', async () => {
      const explicit = await forge.keyFor({ ...box, params: { size: 10, height_mult: 1, corner: 'ne', notched: true } });
      expect(explicit).toBe(await forge.keyFor(box));
    });

    it('move when a parameter actually changes', async () => {
      expect(await forge.keyFor({ ...box, params: { size: 11 } })).not.toBe(await forge.keyFor(box));
    });

    it('move when the source changes', async () => {
      const before = await forge.keyFor(box);
      const lib = join(root, 'models', 'fixture-cube', 'lib', 'shared-constants.scad');
      await new Promise((r) => setTimeout(r, 10));
      writeFileSync(lib, 'NOTCH = 3;\nLID_THICKNESS = 1.5;\n');
      expect(await forge.keyFor(box)).not.toBe(before);
    });
  });

  describeEngine('ensure', () => {
    it('builds on a miss and hits afterwards', async () => {
      const first = await forge.ensure(box);
      expect(first.status).toBe('built');
      expect(first.bytes.byteLength).toBeGreaterThan(0);

      const second = await forge.ensure(box);
      expect(second.status).toBe('hit');
      expect(second.key).toBe(first.key);
    });

    it('serves explicit defaults from the artifact built for no params', async () => {
      const base = await forge.ensure(box);
      const explicit = await forge.ensure({ ...box, params: { size: 10, height_mult: 1, corner: 'ne', notched: true } });
      expect(explicit.status).toBe('hit');
      expect(explicit.key).toBe(base.key);
    });

    it('records what produced the artifact in the sidecar', async () => {
      const { sidecar } = await forge.ensure(box);
      expect(sidecar.engine).toBe('openscad-native');
      expect(sidecar.engineVersion).toBeTruthy();
      expect(sidecar.sourceDigest).toMatch(/^[0-9a-f]{64}$/);
      expect(sidecar.renderMs).toBeGreaterThanOrEqual(0);
    });

    it('collapses concurrent identical requests into one render', async () => {
      const results = await Promise.all(Array.from({ length: 4 }, () => forge.ensure({ ...box, params: { size: 12 } })));
      expect(new Set(results.map((r) => r.key)).size).toBe(1);
      expect(forge.store.stats().count).toBe(1);
    });

    it('renders a multicolor preview', async () => {
      const result = await forge.ensure({ slug: 'fixture-cube', target: 'duo', format: '3mf' });
      expect(result.bytes.byteLength).toBeGreaterThan(0);
    });

    it('rebuilds after the source changes, with no explicit invalidation', async () => {
      const before = await forge.ensure(box);
      const lib = join(root, 'models', 'fixture-cube', 'lib', 'shared-constants.scad');
      await new Promise((r) => setTimeout(r, 10));
      writeFileSync(lib, 'NOTCH = 5;\nLID_THICKNESS = 1.5;\n');

      const after = await forge.ensure(box);
      expect(after.key).not.toBe(before.key);
      expect(after.status).toBe('built');
    });

    it('remembers a failed render instead of re-running it', async () => {
      const lib = join(root, 'models', 'fixture-cube', 'lib', 'fixture-cube-lib.scad');
      writeFileSync(lib, 'this is not valid scad(((\n');

      await expect(forge.ensure({ slug: 'fixture-cube', target: 'box', format: 'stl' })).rejects.toThrow();
      // Second attempt comes from the negative cache, not a fresh render.
      await expect(forge.ensure({ slug: 'fixture-cube', target: 'box', format: 'stl' }))
        .rejects.toMatchObject({ code: 'E_RENDER_FAILED_CACHED' });
    });
  });

  describeEngine('ensureByKey', () => {
    it('serves a request that hashes to its key', async () => {
      const key = await forge.keyFor(box);
      const result = await forge.ensureByKey(key, 'stl', box);
      expect(result.key).toBe(key);
    });

    it('refuses parameters swapped in under another key', async () => {
      const key = await forge.keyFor(box);
      await expect(forge.ensureByKey(key, 'stl', { ...box, params: { size: 77 } })).rejects.toThrow();
    });

    it('refuses an extension that contradicts the request', async () => {
      const key = await forge.keyFor(box);
      await expect(forge.ensureByKey(key, '3mf', box)).rejects.toThrow(/contradicts/);
    });
  });

  describe('declared artifacts', () => {
    it('covers every part and preview, plus each declared variant', () => {
      const requests = forge.declaredRequests();
      expect(requests).toHaveLength(5); // duo, duo@Big, duo-tall, duo-hex, box
      expect(requests.filter((r) => r.params).length).toBe(1);
    });

    it('exposes the declared keys so eviction can spare them', async () => {
      const keys = await forge.declaredKeys();
      expect(keys.size).toBe(5);
    });
  });

  describe('runtimeManifest', () => {
    it('adds a source digest and default key to every entry', async () => {
      const rt = await forge.runtimeManifest();
      const model = rt.models[0];
      for (const part of [...model.previews!, ...model.parts!]) {
        expect(part.sourceDigest).toMatch(/^[0-9a-f]{64}$/);
        expect(part.defaultKey).toMatch(/^[0-9a-f]{64}$/);
      }
    });

    it('publishes the parameter schema the browser hashes against', async () => {
      const rt = await forge.runtimeManifest();
      expect(rt.models[0].parts![0].paramSchema.map((p) => p.name))
        .toEqual(['size', 'height_mult', 'corner', 'notched']);
    });

    it('keys each declared variant', async () => {
      const rt = await forge.runtimeManifest();
      const duo = rt.models[0].previews!.find((p) => p.file === 'duo.3mf')!;
      expect(duo.variants).toHaveLength(1);
      expect(duo.variants![0].key).toMatch(/^[0-9a-f]{64}$/);
      expect(duo.variants![0].key).not.toBe(duo.defaultKey);
    });

    it('carries the key schema so a stale client can tell', async () => {
      expect((await forge.runtimeManifest()).keySchema).toBe(KEY_SCHEMA);
    });

    it('agrees with the key the forge would render under', async () => {
      const rt = await forge.runtimeManifest();
      expect(rt.models[0].parts![0].defaultKey).toBe(await forge.keyFor(box));
    });
  });

  describeEngine('prerender', () => {
    it('builds everything declared, then reports pure hits on a rerun', async () => {
      const first = await forge.prerender();
      expect(first.failed).toEqual([]);
      expect(first.built).toBe(5);

      const second = await forge.prerender();
      expect(second.hit).toBe(5);
      expect(second.built).toBe(0);
    });
  });
});
