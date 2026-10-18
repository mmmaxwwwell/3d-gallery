// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Bambu Lab presets that slice on the gallery's own slicer. The data is
 * generated (bbl-presets.generated.ts, see scripts/gen-bbl-presets.mjs) from
 * the Orca release the WASM was built from, because Bambu's machine G-code
 * uses placeholders that change between releases: an X1C preset imported
 * from a newer Orca install fails to export with "Not a variable name".
 *
 * Import this lazily — the machine G-code alone is tens of kB.
 */

type OrcaValue = null | boolean | number | string | OrcaValue[] | { [k: string]: OrcaValue };

export interface BblPresetBundle {
  orcaVersion: string;
  printers: Array<{ name: string; model: string; modelId: string; chain: string[] }>;
  filaments: Array<{ name: string; chain: string[] }>;
  /** Process presets: the X1C's speeds and accelerations, one per layer height. */
  processes: Array<{ name: string; layerHeight: number; chain: string[] }>;
  /** Every preset any chain names, by name. */
  presets: Record<string, { [k: string]: OrcaValue }>;
}

export interface BblPreset {
  name: string;
  kind: 'printer' | 'filament';
  /** The preset's own file. */
  raw: { [k: string]: OrcaValue };
  /** Its parents, immediate first, root last. */
  parents: Array<{ name: string; raw: { [k: string]: OrcaValue } }>;
  /** Printers: the `slice_info` model id their firmware checks (BL-P001 is the X1 Carbon). */
  modelId?: string;
}

export async function loadBblPresets(): Promise<{ orcaVersion: string; printers: BblPreset[]; filaments: BblPreset[] }> {
  const { BBL_PRESETS } = await import('./bbl-presets.generated.js');
  const toPreset = (kind: BblPreset['kind']) => ({ name, chain, modelId }: { name: string; chain: string[]; modelId?: string }): BblPreset => ({
    name,
    kind,
    ...(modelId ? { modelId } : {}),
    raw: BBL_PRESETS.presets[chain[0]],
    parents: chain.slice(1).map((n) => ({ name: n, raw: BBL_PRESETS.presets[n] })),
  });
  return {
    orcaVersion: BBL_PRESETS.orcaVersion,
    printers: BBL_PRESETS.printers.map(toPreset('printer')),
    filaments: BBL_PRESETS.filaments.map(toPreset('filament')),
  };
}

/**
 * The X1C process preset nearest `layerHeight`, inheritance merged (root
 * first, `inherits` dropped). It carries the machine's real speeds and
 * accelerations; the gallery's own process knobs (walls, infill, layer
 * height…) go over it.
 */
export async function loadBblProcess(layerHeight: number): Promise<{ name: string; config: { [k: string]: OrcaValue } }> {
  const { BBL_PRESETS } = await import('./bbl-presets.generated.js');
  const nearest = [...BBL_PRESETS.processes]
    .sort((a, b) => Math.abs(a.layerHeight - layerHeight) - Math.abs(b.layerHeight - layerHeight))[0];
  if (!nearest) throw new Error('No Bambu process preset is bundled.');
  const config: { [k: string]: OrcaValue } = {};
  for (const n of [...nearest.chain].reverse()) Object.assign(config, BBL_PRESETS.presets[n]);
  delete config['inherits'];
  return { name: nearest.name, config };
}
