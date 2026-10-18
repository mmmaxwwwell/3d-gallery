// SPDX-License-Identifier: MIT
// The gallery's own Bambu Lab presets, saved into the preset store like an
// import. They come from the Orca release the slicer WASM was built from,
// which is what lets them slice: an X1C preset from a newer Orca install uses
// G-code placeholders this slicer doesn't know (print-toolkit README → Bambu).

import { getPreset, importPreset, type PrintPreset } from './print-storage.js';

/** Save the X1 Carbon and its AMS filaments. Returns the presets saved. */
export async function addBuiltinBambuPresets(): Promise<PrintPreset[]> {
  const { loadBblPresets } = await import('@3d-gallery/print-toolkit/bbl-presets');
  const bundle = await loadBblPresets();
  const addedAt = Date.now();
  const saved: PrintPreset[] = [];
  for (const preset of [...bundle.printers, ...bundle.filaments]) {
    const compatible = preset.raw['compatible_printers'];
    const existing = await getPreset(`${preset.kind}:${preset.name}`);
    saved.push(await importPreset({
      kind: preset.kind,
      name: preset.name,
      raw: preset.raw,
      parents: preset.parents,
      ...(Array.isArray(compatible) ? { compatiblePrinters: compatible.map(String) } : {}),
      // Adding them again refreshes the files; the address is the operator's.
      ...(existing?.address ? { address: existing.address } : {}),
      source: { kind: 'builtin', orcaVersion: bundle.orcaVersion, addedAt },
    }));
  }
  return saved;
}
