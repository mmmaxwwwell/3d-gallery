import { injectParameters, type ArtifactFormat, type RuntimePart, type ScadValue } from '@3d-gallery/model-core';
import { createOpenSCADApi, type OpenSCADApi } from './openscad-api.ts';
import type { ArtifactRequest, LocalRenderer } from './artifact-client.ts';

/** SCAD source for one model, as imported by the consumer (Vite `?raw`, a fetch, anything). */
export interface ScadSources {
  lib: string;
  /** Preview source keyed by target (the file base name), with `include <>` stripped. */
  previews: Record<string, string>;
}

export class NoSourcesError extends Error {
  readonly code = 'E_NO_SOURCES';
  constructor(slug: string) {
    super(`No SCAD sources bundled for "${slug}", so it cannot be rendered in the browser`);
    this.name = 'NoSourcesError';
  }
}

/**
 * Strip `include <...>` lines from a preview source.
 *
 * The lib is concatenated in directly, and the browser has no filesystem for
 * OpenSCAD-WASM to resolve a relative include against.
 */
export function stripIncludes(source: string): string {
  return source.replace(/^\s*include\s*<[^>]*>\s*;?\s*$/gm, '');
}

/**
 * Renders in the browser when the server has no artifact — the static-host path
 * for any parameter set that wasn't pre-baked.
 *
 * This does not have to reproduce the server's SCAD text byte-for-byte. The key
 * comes from the digest the manifest publishes, not from anything assembled
 * here, so the two only need to agree on geometry.
 */
export function createWasmRenderer(
  sources: Record<string, ScadSources>,
  options: { api?: OpenSCADApi; onLog?: (line: string) => void } = {},
): LocalRenderer {
  let api: OpenSCADApi | null = options.api ?? null;
  let ready: Promise<void> | null = null;

  async function engine(): Promise<OpenSCADApi> {
    // Booting the WASM module costs seconds, so it's deferred until something
    // actually misses the cache.
    api ??= createOpenSCADApi();
    ready ??= api.init();
    await ready;
    return api;
  }

  return {
    async render(req: ArtifactRequest & { format: ArtifactFormat; part: RuntimePart }): Promise<ArrayBuffer> {
      const bundle = sources[req.slug];
      if (!bundle) throw new NoSourcesError(req.slug);

      const params = (req.params ?? {}) as Record<string, ScadValue>;
      // Injected into the lib, with the preview concatenated after — so a
      // preview's own assignments stay authoritative, matching the server.
      const lib = injectParameters(bundle.lib, params);
      const preview = bundle.previews[req.target];
      const scad = req.format === '3mf' && preview
        ? `${lib}\n${preview}`
        : `${lib}\n$fn = 40;\n${req.part.module ?? req.target}();\n`;

      const openscad = await engine();
      return req.format === '3mf' && preview
        ? openscad.renderMulticolor(scad, options.onLog)
        : openscad.render(scad, req.format, options.onLog);
    },
  };
}
