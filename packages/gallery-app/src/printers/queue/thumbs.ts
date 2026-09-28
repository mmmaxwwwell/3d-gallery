// SPDX-License-Identifier: MIT
// A picture of each of a project's plates as it will print, for the queue.
// Loaded on its own (queue-watch.ts imports it lazily): it pulls in Three.js,
// which the rest of the Printers page does without.

import { listPlates, plateSignature, printedPlate } from '../../print/plate-store.js';
import { resolvePlate } from '../../print/plate-resolve.js';
import { buildInstances } from '../../print/plate-geometry.js';
import { plateThumbnail } from '../../print/plate-thumbnail.js';

/** Calls `onThumb` as each plate is drawn; null for one that won't resolve. */
export async function plateThumbs(projectId: string, onThumb: (plateId: string, thumb: string | null) => void): Promise<void> {
  for (const plate of await listPlates(projectId)) {
    let thumb: string | null = null;
    try {
      const printed = printedPlate(plate);
      const report = await resolvePlate(printed);
      thumb = plateThumbnail(plateSignature(printed), buildInstances(printed, report.objects));
    } catch {
      // A plate that won't resolve just goes without a picture.
    }
    onThumb(plate.id, thumb);
  }
}
