// SPDX-License-Identifier: MIT
// Turns a stored plate into slicer-ready geometry: one object per copy, each
// recentered on the origin so the layout code only ever deals in positions.
//
// A plate item is a render request, so resolution is just the artifact client:
// content-addressed cache, then the site, then a local render. There is no
// separate mesh snapshot to go missing, and therefore no stale state — an item
// only fails when its artifact genuinely cannot be produced.

import { KEY_SCHEMA, type RuntimeManifest } from '@3d-gallery/model-core';
import { createArtifactClient, type ArtifactClient } from '@3d-gallery/viewer/artifact-client';
import type { ArtifactSource } from '@3d-gallery/viewer/artifact-cache';
import type { Plate } from './plate-store.js';
import { recenterMeshXY, type Bbox3 } from './mesh-bounds.js';

export interface ResolvedPlateObject {
  itemId: string;
  label: string;
  format: 'stl' | '3mf';
  /** Recentered so the XY bbox center is (0,0) and minZ is 0. */
  data: ArrayBuffer;
  bbox: Bbox3;
  /** Copy index within the item's qty, 0-based. */
  copy: number;
  /** Where the bytes came from, for the plate UI's cache indicator. */
  source: ArtifactSource;
}

export interface ResolveReport {
  objects: ResolvedPlateObject[];
  /** Items whose artifact could not be produced (unknown target, render failure). */
  failed: Array<{ itemId: string; label: string; reason: string }>;
}

let clientPromise: Promise<ArtifactClient> | null = null;

/**
 * Hand plate resolution the app's own client so it shares the customizer's
 * OpenSCAD-WASM local renderer; without it a parametric item that is neither
 * cached nor prebuilt has nowhere left to come from.
 */
export function setPlateArtifactClient(client: ArtifactClient): void {
  clientPromise = Promise.resolve(client);
}

async function loadClient(): Promise<ArtifactClient> {
  const res = await fetch(`${import.meta.env.BASE_URL}models/manifest.json`);
  if (!res.ok) throw new Error(`manifest.json: HTTP ${res.status}`);
  const client = createArtifactClient({ manifest: (await res.json()) as RuntimeManifest });
  client.assertKeySchema(KEY_SCHEMA);
  return client;
}

function getClient(): Promise<ArtifactClient> {
  // Never memoize a rejection: a manifest that failed to load once must be
  // retried on the next resolve rather than poisoning the dialog forever.
  clientPromise ??= loadClient().catch((err: unknown) => {
    clientPromise = null;
    throw err;
  });
  return clientPromise;
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function shiftBbox(bbox: Bbox3, dx: number, dy: number, dz: number): Bbox3 {
  return {
    minX: bbox.minX + dx, maxX: bbox.maxX + dx,
    minY: bbox.minY + dy, maxY: bbox.maxY + dy,
    minZ: bbox.minZ + dz, maxZ: bbox.maxZ + dz,
  };
}

/** One entry per copy: an item with qty 3 yields 3 ResolvedPlateObjects. */
export async function resolvePlate(
  plate: Plate,
  onProgress?: (done: number, total: number, label: string) => void,
): Promise<ResolveReport> {
  const objects: ResolvedPlateObject[] = [];
  const failed: ResolveReport['failed'] = [];
  const total = plate.items.length;

  let client: ArtifactClient;
  try {
    client = await getClient();
  } catch (err) {
    const reason = describe(err);
    return { objects, failed: plate.items.map((i) => ({ itemId: i.id, label: i.label, reason })) };
  }

  for (let i = 0; i < total; i++) {
    const item = plate.items[i];
    try {
      const { bytes, format, source } = await client.get({
        slug: item.slug,
        target: item.target,
        params: item.params,
      });
      // Recenter once per item; every copy shares the resulting bytes.
      const { buffer, translation, bbox: rawBbox } = recenterMeshXY(bytes, format);
      if (!rawBbox) throw new Error(`Could not read geometry from ${item.slug}/${item.target}.${format}.`);
      const bbox = shiftBbox(rawBbox, translation.dx, translation.dy, translation.dz);
      for (let copy = 0; copy < item.qty; copy++) {
        objects.push({ itemId: item.id, label: item.label, format, data: buffer, bbox, copy, source });
      }
    } catch (err) {
      failed.push({ itemId: item.id, label: item.label, reason: describe(err) });
    }
    onProgress?.(i + 1, total, item.label);
  }

  return { objects, failed };
}
