import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KEY_SCHEMA, type RuntimeManifest } from '@3d-gallery/model-core';

const SITE = join(dirname(fileURLToPath(import.meta.url)), 'fixture-site');
const DIST = join(SITE, 'dist');

function build(mode: 'declared' | 'referenced' = 'declared'): string {
  return execFileSync('npx', ['astro', 'build', '--root', SITE], {
    cwd: SITE,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GALLERY_PRERENDER: mode },
  });
}

function nativeEngineInstalled(): boolean {
  try {
    execFileSync('openscad', ['--version'], { stdio: 'ignore', timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

const describeBuild = nativeEngineInstalled() ? describe : describe.skip;

describeBuild('astro build', () => {
  let firstRun: string;
  let secondRun: string;
  let manifest: RuntimeManifest;

  beforeAll(() => {
    // Cold: no dist, no artifact cache, so the counts below are deterministic.
    rmSync(DIST, { recursive: true, force: true });
    rmSync(join(SITE, '.cache'), { recursive: true, force: true });
    firstRun = build();
    secondRun = build();
    manifest = JSON.parse(readFileSync(join(DIST, 'models', 'manifest.json'), 'utf8'));
  }, 300_000);

  it('renders every declared artifact, including variants and unreferenced parts', () => {
    // cube default + cube@Beveled + lid — lid appears on no page.
    expect(firstRun).toMatch(/prerendered 3 declared artifacts: 3 built, 0 cached/);
  });

  it('renders nothing on a rerun, because the store persists across builds', () => {
    expect(secondRun).toMatch(/prerendered 3 declared artifacts: 0 built, 3 cached/);
  });

  it('emits the runtime manifest', () => {
    expect(manifest.keySchema).toBe(KEY_SCHEMA);
    expect(manifest.models).toHaveLength(1);
  });

  it('prefixes the artifact base with the site base, so a fetch resolves', () => {
    expect(manifest.artifactBase).toBe('/demo/a/');
  });

  it('publishes a digest and schema so the browser can key without any SCAD source', () => {
    const part = manifest.models[0].parts![0];
    expect(part.sourceDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(part.paramSchema.map((p) => p.name)).toEqual(['size', 'beveled']);
  });

  it('writes every artifact at the path its key addresses', () => {
    const part = manifest.models[0].parts![0];
    for (const key of [part.defaultKey, ...(part.variants ?? []).map((v) => v.key)]) {
      expect(existsSync(join(DIST, 'a', `${key}.stl`))).toBe(true);
    }
  });

  it('gives the variant its own artifact, distinct from the default', () => {
    const part = manifest.models[0].parts![0];
    expect(part.variants![0].key).not.toBe(part.defaultKey);
  });

  it('renders the page with the island wired to the right target', () => {
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');
    expect(html).toContain('data-dg-slug="demo-cube"');
    expect(html).toContain('data-dg-target="cube"');
    expect(html).toContain(`data-default-key="${manifest.models[0].parts![0].defaultKey}"`);
  });

  it('exposes the manifest to page frontmatter via the virtual module', () => {
    expect(readFileSync(join(DIST, 'index.html'), 'utf8')).toContain('1 model(s)');
  });
});


describeBuild('astro build — prerender: "referenced"', () => {
  let output: string;
  let manifest: RuntimeManifest;

  beforeAll(() => {
    rmSync(DIST, { recursive: true, force: true });
    output = build('referenced');
    manifest = JSON.parse(readFileSync(join(DIST, 'models', 'manifest.json'), 'utf8'));
  }, 300_000);

  it('bakes only what a page actually placed, plus that part\'s declared variants', () => {
    // The page shows cube; lid is declared but never referenced.
    expect(output).toMatch(/prerendered 2 referenced artifacts/);
  });

  it('omits the unreferenced part from the output', () => {
    const lid = manifest.models[0].parts!.find((p) => p.file === 'lid.stl')!;
    expect(existsSync(join(DIST, 'a', `${lid.defaultKey}.stl`))).toBe(false);
  });

  it('still ships the referenced part and its variant', () => {
    const cube = manifest.models[0].parts!.find((p) => p.file === 'cube.stl')!;
    expect(existsSync(join(DIST, 'a', `${cube.defaultKey}.stl`))).toBe(true);
    expect(existsSync(join(DIST, 'a', `${cube.variants![0].key}.stl`))).toBe(true);
  });

  it('still lists every model in the manifest, so a client can render the rest locally', () => {
    expect(manifest.models[0].parts).toHaveLength(2);
  });

  it('reports the emitted size, so an oversized deploy is visible', () => {
    expect(output).toMatch(/emitted 2 artifacts \([\d.]+ MB\)/);
  });
});
