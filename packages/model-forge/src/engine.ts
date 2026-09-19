import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { ArtifactFormat } from '@3d-gallery/model-core';
// @ts-expect-error — plain-JS build script shared with the root CLI, no types.
import { buildMulticolor3mf } from '../../../scripts/build-multicolor-3mf.mjs';
// @ts-expect-error — same.
import { OPENSCAD_ARGS } from '../../../scripts/openscad-args.mjs';

import { createWasmEngine, wasmAssetsPresent } from './engine-wasm.ts';

const execFileAsync = promisify(execFile);

export interface RenderOptions {
  /** Directory relative `import()` paths resolve against. */
  sourceDir: string;
  asAssembly?: boolean;
  timeoutMs?: number;
}

export interface RenderEngine {
  /** Stable identifier recorded in the sidecar, e.g. "openscad-native". */
  readonly id: string;
  /** Engine build string. Recorded, never hashed into a key. */
  version(): Promise<string>;
  readonly args: string[];
  render(source: string, format: ArtifactFormat, opts: RenderOptions): Promise<Uint8Array>;
}

export class RenderFailedError extends Error {
  readonly code = 'E_RENDER_FAILED';
  readonly logs: string[];
  constructor(message: string, logs: string[]) {
    super(message);
    this.name = 'RenderFailedError';
    this.logs = logs;
  }
}

export class NoEngineError extends Error {
  readonly code = 'E_NO_ENGINE';
  constructor(message: string) {
    super(message);
    this.name = 'NoEngineError';
  }
}

/** The `openscad` binary on PATH. What the Nix devshell and CI both provide. */
export function createNativeEngine(args: string[] = OPENSCAD_ARGS as string[]): RenderEngine {
  let cachedVersion: string | null = null;

  return {
    id: 'openscad-native',
    args,

    async version(): Promise<string> {
      if (cachedVersion) return cachedVersion;
      const { stdout, stderr } = await execFileAsync('openscad', ['--version']);
      cachedVersion = `${stdout}${stderr}`.trim();
      return cachedVersion;
    },

    async render(source: string, format: ArtifactFormat, opts: RenderOptions): Promise<Uint8Array> {
      const dir = mkdtempSync(join(tmpdir(), 'forge-render-'));
      try {
        const out = join(dir, `out.${format}`);

        if (format === '3mf') {
          await buildMulticolor3mf({
            scadSource: source,
            sourceDir: opts.sourceDir,
            outPath: out,
            asAssembly: opts.asAssembly ?? false,
            timeoutMs: opts.timeoutMs,
          });
        } else {
          const input = join(dir, 'input.scad');
          writeFileSync(input, source);
          await execFileAsync(
            'openscad',
            [...args, '-o', out, input],
            opts.timeoutMs ? { timeout: opts.timeoutMs } : {},
          );
        }

        return readFileSync(out);
      } catch (err) {
        const e = err as { message?: string; stderr?: string };
        const logs = (e.stderr ?? '').split('\n').filter(Boolean);
        throw new RenderFailedError(e.message ?? String(err), logs);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  };
}

export async function nativeAvailable(): Promise<boolean> {
  try {
    await execFileAsync('openscad', ['--version'], { timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

export type EngineChoice = 'auto' | 'native' | 'wasm';

/**
 * Pick a render engine.
 *
 * `auto` prefers the native binary, which is 3-10x faster on this repo's
 * boolean-heavy CSG, and falls back to OpenSCAD-WASM when it isn't installed.
 * Because the engine is recorded in the sidecar rather than hashed into the key,
 * artifacts built by one engine are valid cache hits for a machine running the
 * other — which is the whole reason the fallback is useful.
 */
export async function selectEngine(choice: EngineChoice = 'auto'): Promise<RenderEngine> {
  if (choice === 'native') {
    if (await nativeAvailable()) return createNativeEngine();
    throw new NoEngineError('engine "native" requested but `openscad` is not on PATH (try `nix develop`)');
  }

  if (choice === 'wasm') return createWasmEngine();

  if (await nativeAvailable()) return createNativeEngine();
  if (wasmAssetsPresent()) return createWasmEngine();

  throw new NoEngineError(
    'no render engine available. Either put `openscad` on PATH (try `nix develop`), '
    + 'or run `npm run fetch-wasm -w @3d-gallery/model-forge` for the WASM fallback. '
    + 'A fully-warm artifact cache needs neither.',
  );
}
