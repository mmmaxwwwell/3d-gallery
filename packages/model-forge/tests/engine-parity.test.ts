import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNativeEngine } from '../src/engine.ts';
import { createWasmEngine, wasmAssetsPresent } from '../src/engine-wasm.ts';
import { resolveSourceShape, assemble } from '../src/source.ts';
import type { RenderEngine } from '../src/engine.ts';
// @ts-expect-error — plain-JS test helper shared with the root build tests.
import { fingerprintStl, fingerprint3mf } from '../../../tests/build/fingerprint.mjs';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

function nativeInstalled(): boolean {
  try {
    execFileSync('openscad', ['--version'], { stdio: 'ignore', timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

const canCompare = nativeInstalled() && wasmAssetsPresent();
const describeParity = canCompare ? describe : describe.skip;

function sourceFor(target: string): string {
  return assemble(resolveSourceShape({
    modelsDir: join(FIXTURES, 'models'), slug: 'fixture-cube', target, root: FIXTURES,
  }));
}

async function renderTo(engine: RenderEngine, target: string, format: 'stl' | '3mf', dir: string): Promise<string> {
  const bytes = await engine.render(sourceFor(target), format, {
    sourceDir: join(FIXTURES, 'models', 'fixture-cube'),
    timeoutMs: 120_000,
  });
  const path = join(dir, `${engine.id}-${target}.${format}`);
  writeFileSync(path, bytes);
  return path;
}

describe('wasm engine availability', () => {
  it('reports whether the assets have been fetched', () => {
    expect(typeof wasmAssetsPresent()).toBe('boolean');
  });

  it('refuses to construct without assets, naming the fix', () => {
    expect(() => createWasmEngine({ assetsDir: '/nonexistent' })).toThrow(/fetch-wasm/);
  });
});

/**
 * The engine is deliberately excluded from the artifact key, so an artifact
 * built by one engine is served to a machine running the other. That is only
 * sound if they agree on geometry — this is the test that keeps it honest.
 */
describeParity('native and wasm produce equivalent geometry', () => {
  let dir: string;
  let native: RenderEngine;
  let wasm: RenderEngine;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'forge-parity-'));
    native = createNativeEngine();
    wasm = createWasmEngine();
  });

  it('agrees on an STL part', async () => {
    const a = fingerprintStl(await renderTo(native, 'box', 'stl', dir));
    const b = fingerprintStl(await renderTo(wasm, 'box', 'stl', dir));

    // Different boolean backends re-triangulate the same volume differently, so
    // the bounding box must match tightly while the triangle count may drift —
    // the same tolerance tests/build/ applies to baselines.
    for (const corner of [0, 1]) {
      for (const axis of [0, 1, 2]) {
        expect(Math.abs(a.bbox[corner][axis] - b.bbox[corner][axis])).toBeLessThan(5e-3);
      }
    }
    expect(b.triangleCount).toBeGreaterThan(a.triangleCount * 0.75);
    expect(b.triangleCount).toBeLessThan(a.triangleCount * 1.25);
  }, 180_000);

  it('agrees on a multicolor 3MF, including the palette', async () => {
    const a = fingerprint3mf(await renderTo(native, 'duo', '3mf', dir));
    const b = fingerprint3mf(await renderTo(wasm, 'duo', '3mf', dir));

    // The palette has to match exactly — a dropped or shifted colour means a
    // different filament assignment on the printer.
    expect(b.colors).toEqual(a.colors);
    for (const corner of [0, 1]) {
      for (const axis of [0, 1, 2]) {
        expect(Math.abs(a.bbox[corner][axis] - b.bbox[corner][axis])).toBeLessThan(5e-3);
      }
    }
  }, 300_000);

  // Hex literals are not resolved to a vector when OpenSCAD compiles the source
  // directly, so a filter that re-derives colours in SCAD renders nothing for
  // them and fails the whole 3MF. The wasm engine matches on the discovered
  // string instead, which handles named, hex, and vector forms alike.
  it('agrees on a 3MF whose colours are hex literals', async () => {
    const a = fingerprint3mf(await renderTo(native, 'duo-hex', '3mf', dir));
    const b = fingerprint3mf(await renderTo(wasm, 'duo-hex', '3mf', dir));

    expect(b.colors).toEqual(a.colors);
    expect(b.colors).toHaveLength(2);
    for (const corner of [0, 1]) {
      for (const axis of [0, 1, 2]) {
        expect(Math.abs(a.bbox[corner][axis] - b.bbox[corner][axis])).toBeLessThan(5e-3);
      }
    }
  }, 300_000);

  it('reports an identifiable engine version for the sidecar', async () => {
    expect(await wasm.version()).toMatch(/^openscad-wasm /);
    expect(await native.version()).toMatch(/OpenSCAD/);
  });

  it('surfaces a SCAD error rather than producing empty geometry', async () => {
    await expect(wasm.render('this is not scad(((', 'stl', { sourceDir: dir, timeoutMs: 60_000 }))
      .rejects.toMatchObject({ code: 'E_RENDER_FAILED' });
  }, 120_000);
});
