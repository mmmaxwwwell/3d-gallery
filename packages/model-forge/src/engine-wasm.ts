import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseColorString, type ArtifactFormat } from '@3d-gallery/model-core';
import { NoEngineError, RenderFailedError, type RenderEngine, type RenderOptions } from './engine.ts';
// @ts-expect-error — plain-JS build script shared with the native engine and the root CLI.
import { build3mf, parseStl } from '../../../scripts/build-multicolor-3mf.mjs';

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DEFAULT_ASSETS = join(PACKAGE_ROOT, 'assets');

/** Every file `npm run fetch-wasm -w @3d-gallery/model-forge` puts in assets/. */
const REQUIRED = ['openscad.wasm.js', 'openscad.wasm'];
const LIBRARIES = [
  { file: 'openscad.fonts.js', add: 'addFonts' },
  { file: 'openscad.mcad.js', add: 'addMCAD' },
  { file: 'openscad.bosl2.js', add: 'addBOSL2' },
  { file: 'openscad.qr.js', add: 'addQR' },
] as const;

// The emscripten glue reads its Module config off `globalThis.OpenSCAD`, which
// is how the upstream browser wrapper hands it options too.
declare global {
  // eslint-disable-next-line no-var
  var OpenSCAD: Record<string, unknown> | undefined;
}

/** A colour as OpenSCAD prints it, plus its parsed form for the 3MF palette. */
interface DiscoveredColor {
  raw: string;
  rgba: [number, number, number, number];
}

interface OpenSCADInstance {
  FS: {
    writeFile(path: string, data: string | Uint8Array): void;
    readFile(path: string): Uint8Array;
    mkdir(path: string): void;
    unlink(path: string): void;
  };
  callMain(args: string[]): number;
}

export interface WasmEngineOptions {
  /** Defaults to `packages/model-forge/assets`. */
  assetsDir?: string;
}

export function wasmAssetsPresent(assetsDir = DEFAULT_ASSETS): boolean {
  return REQUIRED.every((f) => existsSync(join(assetsDir, f)));
}

/**
 * OpenSCAD compiled to WebAssembly, running under Node.
 *
 * The fallback for machines without the `openscad` binary — a plain-Node CI
 * runner, or a contributor who hasn't entered the Nix devshell. Slower than
 * native on boolean-heavy CSG, but it renders the same geometry, and because the
 * engine is recorded in the cache sidecar rather than hashed into the artifact
 * key, what it produces is a valid cache hit for a natively-rendering machine
 * and vice versa.
 *
 * Assets are fetched out-of-band (~25 MB) by `scripts/fetch-wasm.mjs`.
 */
export function createWasmEngine(options: WasmEngineOptions = {}): RenderEngine {
  const assetsDir = options.assetsDir ?? DEFAULT_ASSETS;

  if (!wasmAssetsPresent(assetsDir)) {
    throw new NoEngineError(
      `OpenSCAD WASM assets missing from ${assetsDir}. Run: npm run fetch-wasm -w @3d-gallery/model-forge`,
    );
  }

  // Read once and reused for every instance — the glue is 120 KB and the binary
  // 7.4 MB, and a prerender pass instantiates dozens of times.
  const glueUrl = `data:text/javascript;base64,${Buffer.from(readFileSync(join(assetsDir, 'openscad.wasm.js'))).toString('base64')}`;
  const wasmBinary = readFileSync(join(assetsDir, 'openscad.wasm'));

  let librariesPromise: Promise<((inst: OpenSCADInstance) => void)[]> | null = null;
  function libraries(): Promise<((inst: OpenSCADInstance) => void)[]> {
    librariesPromise ??= Promise.all(
      LIBRARIES.filter(({ file }) => existsSync(join(assetsDir, file)))
        .map(async ({ file, add }) => {
          const mod = await import(join(assetsDir, file));
          return mod[add] as (inst: OpenSCADInstance) => void;
        }),
    );
    return librariesPromise;
  }

  let instanceCounter = 0;

  async function createInstance(onErr: (line: string) => void): Promise<OpenSCADInstance> {
    const module: Record<string, unknown> = {
      noInitialRun: true,
      // Handed the bytes directly so the glue never resolves a URL — the browser
      // build's locateFile path uses fetch(), which cannot read file:// in Node.
      wasmBinary: new Uint8Array(wasmBinary),
      print: () => {},
      printErr: onErr,
    };

    globalThis.OpenSCAD = module;
    // The fragment forces a fresh evaluation: Node keys its module cache on the
    // full URL, and every render needs its own instance because OpenSCAD keeps
    // global state between callMain invocations.
    await import(`${glueUrl}#${instanceCounter++}`);
    globalThis.OpenSCAD = undefined;

    await new Promise<void>((resolve) => {
      module.onRuntimeInitialized = () => resolve();
    });

    const inst = module as unknown as OpenSCADInstance;
    for (const add of await libraries()) add(inst);
    for (const dir of ['/tmp', '/libraries', '/locale', '/home', '/home/web_user', '/home/web_user/.local', '/home/web_user/.local/share']) {
      try {
        inst.FS.mkdir(dir);
      } catch {
        // already exists
      }
    }
    return inst;
  }

  /** One render pass. Returns the raw output plus whatever OpenSCAD wrote to stderr. */
  async function run(
    source: string,
    args: string[],
    readOutput: boolean,
    tolerateFailure = false,
  ): Promise<{ output: Uint8Array | null; logs: string[] }> {
    const logs: string[] = [];
    const inst = await createInstance((line) => logs.push(line));
    inst.FS.writeFile('/input.scad', source);

    let exitCode: number;
    try {
      exitCode = inst.callMain(args);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (typeof status !== 'number') throw new RenderFailedError((err as Error).message, logs);
      exitCode = status;
    }

    if (exitCode !== 0 && !tolerateFailure) {
      throw new RenderFailedError(
        exitCode > 255
          ? `OpenSCAD-WASM crashed (code ${exitCode}) — often memory exhaustion on a large model`
          : `OpenSCAD-WASM exited with code ${exitCode}`,
        logs,
      );
    }

    if (!readOutput) return { output: null, logs };

    try {
      return { output: inst.FS.readFile('/output.stl'), logs };
    } catch (err) {
      throw new RenderFailedError(`Render succeeded but produced no output: ${(err as Error).message}`, logs);
    }
  }

  /**
   * Find the distinct `color()` values the model uses by overriding `color()`
   * with an echo and reading them off stderr.
   *
   * The CLI path regex-scans the source instead, which is why the repo convention
   * requires top-level `color()` literals in preview files — this path doesn't
   * care where they live, but both must agree, so don't rely on the difference.
   */
  async function discoverColors(source: string): Promise<DiscoveredColor[]> {
    const tag = `colorid_${instanceCounter}`;
    // This pass deliberately renders nothing — color() is replaced by an echo —
    // so OpenSCAD exits non-zero complaining about an empty top-level object.
    // Only stderr matters here.
    const { logs } = await run(
      source,
      ['/input.scad', '-o', '/output.stl', '-D', `module color(c) {echo(${tag}=str(c));}`],
      false,
      true,
    );

    const prefix = `ECHO: ${tag} = `;
    const seen = new Set<string>();
    for (const line of logs) {
      if (!line.startsWith(prefix)) continue;
      // echo() wraps a string value in quotes that are not part of the value, so
      // color("orange") arrives as `"orange"`. Matching a pass on the quoted form
      // renders nothing and fails the whole 3MF. Vectors print unquoted and are
      // unaffected.
      seen.add(line.slice(prefix.length).trim().replace(/^"|"$/g, ''));
    }
    if (seen.size === 0) {
      throw new RenderFailedError('No color() calls found; cannot build a multicolor 3MF', logs);
    }

    const colors: DiscoveredColor[] = [];
    for (const raw of seen) {
      const rgba = parseColorString(raw);
      // `raw` is kept verbatim: the render filter matches on it by string
      // equality rather than re-deriving the colour in SCAD, which is what lets
      // hex literals like color("#a5560a") work at all. rgba is only used for
      // the 3MF palette metadata.
      if (rgba) colors.push({ raw, rgba });
    }
    // Deterministic order so the same model always yields the same 3MF layout.
    colors.sort((a, b) => {
      for (let i = 0; i < 4; i++) {
        if (a.rgba[i] !== b.rgba[i]) return a.rgba[i] - b.rgba[i];
      }
      return 0;
    });
    return colors;
  }

  /**
   * Render only the geometry wrapped in one specific color.
   *
   * Matches on `str(c)` against the string discovery already captured, instead
   * of resolving the colour to RGB inside SCAD. Resolving in SCAD means teaching
   * it every literal form OpenSCAD accepts — and a hex literal like
   * color("#a5560a") silently resolved to black, so that pass rendered nothing
   * and the whole 3MF failed. String equality handles named, hex, and vector
   * forms identically for free.
   */
  async function renderColorPass(source: string, color: DiscoveredColor): Promise<Uint8Array> {
    const literal = color.raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const filter = [
      '$colored = false;',
      'module color(c) {',
      '  if ($colored) { children(); }',
      '  else {',
      '    $colored = true;',
      `    if (str(c) == "${literal}") children();`,
      '  }',
      '}',
    ].join(' ');

    const { output } = await run(source, ['/input.scad', '-o', '/output.stl', '-D', filter], true);
    if (!output || output.byteLength === 0) {
      throw new RenderFailedError(`Color pass ${color.raw} produced no geometry`, []);
    }
    return output;
  }

  return {
    id: 'openscad-wasm',
    args: [],

    async version(): Promise<string> {
      const manifestPath = join(assetsDir, 'assets.json');
      if (!existsSync(manifestPath)) return 'openscad-wasm (unknown build)';
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
        files: Record<string, { sha256: string }>;
      };
      // The build has no version string, so the wasm digest identifies it.
      return `openscad-wasm ${manifest.files['openscad.wasm']?.sha256.slice(0, 16) ?? 'unknown'}`;
    },

    async render(source: string, format: ArtifactFormat, opts: RenderOptions): Promise<Uint8Array> {
      if (format === 'stl') {
        const { output } = await run(source, ['/input.scad', '-o', '/output.stl'], true);
        if (!output) throw new RenderFailedError('render produced no output', []);
        return output;
      }

      // Multicolor: one pass to learn the palette, then one pass per colour,
      // assembled by the same builder the native engine uses.
      const colors = await discoverColors(source);
      const dir = mkdtempSync(join(tmpdir(), 'forge-wasm-'));
      try {
        const meshes = [];
        for (const color of colors) {
          const stl = await renderColorPass(source, color);
          const path = join(dir, `${color.raw.replace(/[^a-z0-9]/gi, '_')}.stl`);
          writeFileSync(path, stl);
          meshes.push({ key: color.raw, rgba: color.rgba, mesh: parseStl(path) });
        }
        return build3mf(meshes, { asAssembly: opts.asAssembly ?? false });
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  };
}
