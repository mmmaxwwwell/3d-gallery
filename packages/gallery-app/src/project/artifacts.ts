// SPDX-License-Identifier: MIT
// The Project page's artifact client. Plates are render requests, so the
// planner and the plate editor need what the gallery resolves them with: the
// shared IndexedDB cache (a part the gallery already rendered is a hit here),
// the site, and an OpenSCAD-WASM render for a parameter set nobody prebuilt.
//
// The renderer and every model's SCAD source load only when something
// actually misses the cache and the site, so the page doesn't pay for them up
// front.

import { KEY_SCHEMA, type RuntimeManifest } from '@3d-gallery/model-core';
import { createArtifactClient, type ArtifactClient, type LocalRenderer } from '@3d-gallery/viewer/artifact-client';
import { createIdbCache } from '@3d-gallery/viewer/artifact-cache';

let renderer: Promise<LocalRenderer> | null = null;

const lazyRenderer: LocalRenderer = {
  async render(req) {
    renderer ??= Promise.all([
      import('@3d-gallery/viewer/wasm-renderer'),
      import('../customizable-sources.js'),
    ]).then(([wasm, sources]) => wasm.createWasmRenderer(sources.CUSTOMIZABLE_SOURCES));
    return (await renderer).render(req);
  },
};

export async function loadArtifactClient(): Promise<ArtifactClient> {
  const res = await fetch(`${import.meta.env.BASE_URL}models/manifest.json`);
  if (!res.ok) throw new Error(`manifest.json: HTTP ${res.status}`);
  const client = createArtifactClient({
    manifest: (await res.json()) as RuntimeManifest,
    cache: createIdbCache(),
    localRenderer: lazyRenderer,
    // Only the dev middleware can answer the `?r=` retry; on a static host it
    // is a second 404 in front of the browser render.
    allowServerRender: import.meta.env.DEV,
  });
  client.assertKeySchema(KEY_SCHEMA);
  return client;
}
