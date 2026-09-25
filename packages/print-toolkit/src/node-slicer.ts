// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Run the libslic3r WASM slicer in Node — for build-time slicing (print-time
 * estimates in CI), where there is no worker and no server to fetch from.
 *
 * Node only: never import this from a browser bundle.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { engineFromModule, type CreateSlicerModule, type SlicerEngine, type SlicerModule } from './slicer-engine.js';

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

let modulePromise: Promise<SlicerModule> | null = null;

async function loadModule(): Promise<SlicerModule> {
  const jsPath = join(ASSETS_DIR, 'libslic3r.js');
  // The glue is built with ENVIRONMENT=worker and reads `self.location` while
  // it initialises. Handing it the wasm bytes up front means it never fetches.
  (globalThis as { self?: unknown }).self ??= { location: { href: `file://${jsPath}` } };
  const create = new Function(`${readFileSync(jsPath, 'utf8')}\nreturn createSlicerModule;`)() as CreateSlicerModule;
  const module = await create({
    wasmBinary: readFileSync(join(ASSETS_DIR, 'libslic3r.wasm')),
    print: () => {},
    printErr: (text: string) => console.warn('[slicer-wasm]', text),
  });
  try { module.FS.mkdir('/tmp'); } catch { /* already exists */ }
  return module;
}

/** The wasm32 slicer, instantiated once per process. */
export async function createNodeSlicerEngine(): Promise<SlicerEngine> {
  modulePromise ??= loadModule();
  return engineFromModule(await modulePromise, 'wasm32');
}

/** The slicer binary, so callers can key cached results on the slicer version. */
export function slicerWasmPath(): string {
  return join(ASSETS_DIR, 'libslic3r.wasm');
}
