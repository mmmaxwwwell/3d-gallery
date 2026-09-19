import { manifest, keySchema } from 'virtual:3d-gallery';
// Imported from subpaths rather than the package index: the index also exports
// the OpenSCAD-WASM renderer, and Vite's worker plugin statically detects the
// `new Worker(new URL(...))` inside it, pulling the whole WASM path into every
// island even when no local renderer is configured.
import { createViewer, type Viewer } from '@3d-gallery/viewer/viewer';
import { createArtifactClient } from '@3d-gallery/viewer/artifact-client';
import type { ScadValue } from '@3d-gallery/model-core';

const MOUNTED = new WeakSet<HTMLElement>();

function parseParams(raw: string | null): Record<string, ScadValue> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, ScadValue>;
  } catch {
    return {};
  }
}

function setStatus(host: HTMLElement, message: string | null): void {
  const status = host.querySelector<HTMLElement>('.dg-viewer-status');
  if (!status) return;
  status.textContent = message ?? '';
  status.hidden = message === null;
}

/**
 * Boot every `<ModelViewer>` on the page.
 *
 * Idempotent — Astro view transitions and HMR both re-run this, and mounting a
 * second Three.js renderer onto the same element would leak a WebGL context.
 */
export function mountViewers(root: ParentNode = document): Viewer[] {
  const client = createArtifactClient({ manifest });
  client.assertKeySchema(keySchema);

  const viewers: Viewer[] = [];

  for (const host of root.querySelectorAll<HTMLElement>('[data-dg-slug]')) {
    if (MOUNTED.has(host)) continue;
    MOUNTED.add(host);

    const slug = host.dataset.dgSlug!;
    const target = host.dataset.dgTarget!;
    const params = parseParams(host.dataset.dgParams ?? null);

    const viewer = createViewer(host);
    viewers.push(viewer);

    setStatus(host, 'Loading…');
    client
      .get({ slug, target, params })
      .then(({ bytes, format }) => {
        viewer.load(bytes, format);
        setStatus(host, null);
      })
      .catch((err: Error) => {
        setStatus(host, err.message);
      });
  }

  return viewers;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountViewers());
  } else {
    mountViewers();
  }
  // Astro view transitions swap the DOM without a reload.
  document.addEventListener('astro:page-load', () => mountViewers());
}
