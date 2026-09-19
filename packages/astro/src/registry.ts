import type { RenderRequest } from '@3d-gallery/model-core';

/**
 * Records which artifacts a build actually rendered a viewer for.
 *
 * `<ModelViewer>` runs in Astro's SSR bundle while the integration runs in the
 * Astro process — two separate module graphs in the same Node process — so the
 * registry hangs off `globalThis` rather than module scope. A plain module-level
 * Map would give each side its own empty copy.
 */
const KEY = Symbol.for('@3d-gallery/astro.referenced');

type Registry = Map<string, RenderRequest>;

function registry(): Registry {
  const host = globalThis as Record<symbol, unknown>;
  host[KEY] ??= new Map<string, RenderRequest>();
  return host[KEY] as Registry;
}

export function recordReference(request: RenderRequest): void {
  registry().set(JSON.stringify([request.slug, request.target, request.format, request.params ?? {}]), request);
}

export function referencedRequests(): RenderRequest[] {
  return [...registry().values()];
}

export function clearReferences(): void {
  registry().clear();
}
