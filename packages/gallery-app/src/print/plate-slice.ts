// SPDX-License-Identifier: MIT
// One plate, one printer, to G-code. The print dialog drives this with the
// plate on screen; the project planner drives it for every plate at once, with
// no dialog open. Both must produce the same bytes for the same inputs, so the
// config merge, post-processing and provenance live here and nowhere else.

import {
  buildProvenanceComment,
  createSlicerBackend,
  evaluateAuthoredPlateFit,
  forceStripBedExcludeArea,
  hashConfig,
  parseGcodeMetadata,
  postProcessGcode,
  printerBedFromConfig,
  sanitizeBedExcludeArea,
  type PostProcessReport,
  type Provenance,
  type ProvenancePart,
  type SlicerBackend,
} from '@3d-gallery/print-toolkit';
import type { RecommendedProfile, ScadValue } from '@3d-gallery/model-core';
import { firstValue } from './preset-spec.js';
import { flattenPresetForSlicer } from './preset-flatten.js';
import type { PrintPreset } from './print-storage.js';
import { bakeInstance, buildInstances, toFootprints, withArrangedGaps, type PlateInstance } from './plate-geometry.js';
import { resolvePlate } from './plate-resolve.js';
import type { Plate } from './plate-store.js';
import {
  brimConfig,
  buildProcessConfig,
  listTemplates,
  supportConfig,
  type ProcessSettings,
} from './process-templates.js';

// Orca stores five bed-surface-specific temperatures per filament, keyed by
// the plate the user has installed. `curr_bed_type` picks which one — if
// unset, the slicer defaults to `cool_plate_temp` (60 °C), which is why
// PETG was heating the bed to 60 instead of 85. Send an explicit value.
export const BED_SURFACES = [
  { value: 'Hot Plate', label: 'Hot Plate (hot_plate_temp)', tempKey: 'hot_plate_temp' },
  { value: 'Textured PEI Plate', label: 'Textured PEI (textured_plate_temp)', tempKey: 'textured_plate_temp' },
  { value: 'Cool Plate', label: 'Cool Plate (cool_plate_temp)', tempKey: 'cool_plate_temp' },
  { value: 'Supertack Plate', label: 'Supertack (supertack_plate_temp)', tempKey: 'supertack_plate_temp' },
  { value: 'Engineering Plate', label: 'Engineering (eng_plate_temp)', tempKey: 'eng_plate_temp' },
] as const;
export const DEFAULT_BED_SURFACE = 'Hot Plate';
export type BedSurface = (typeof BED_SURFACES)[number]['value'];

export function bedSurfaceTempKey(surface: BedSurface): string {
  return BED_SURFACES.find((s) => s.value === surface)?.tempKey ?? 'hot_plate_temp';
}

/** Everything about a slice that is not the plate itself. */
export interface SliceSetup {
  printer: PrintPreset;
  filament: PrintPreset;
  proc: ProcessSettings;
  layerHeight: string;
  bedSurface: BedSurface;
  preheat: boolean;
  centerOnBed: boolean;
  clearExclusionZones: boolean;
}

export interface SlicedPlate {
  /** Post-processed, provenance comment prepended. */
  gcode: string;
  report: PostProcessReport;
  /** The slicer's own estimate, from the G-code header. */
  seconds?: number;
  grams?: number;
}

/** A model's recommended profile as the dialog's process settings. What the
 *  profile does not speak to comes from the Standard template. */
export function processFromProfile(profile: RecommendedProfile): ProcessSettings {
  const base = listTemplates().find((t) => t.id === 'builtin:standard')!.settings;
  return {
    ...base,
    wallLoops: String(profile.walls),
    infillDensity: String(profile.infillDensity),
    infillPattern: profile.infillPattern,
    supportStyle: profile.supports,
    // A plate saved before the field existed carries no value for it.
    supportOnBuildPlateOnly: profile.supportsOnBuildPlateOnly ?? false,
    brim: profile.brim,
    skirt: false,
  };
}

function provenanceParams(params: Record<string, ScadValue>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    out[k] = typeof v === 'number' || typeof v === 'string' ? v : String(v);
  }
  return out;
}

/**
 * Slice already-posed copies. `offset` is the rigid plate-to-bed translation
 * the fit oracle chose; the caller owns the backend so it can cancel it.
 */
export async function sliceInstances(
  backend: SlicerBackend,
  plate: Plate,
  instances: PlateInstance[],
  offset: { dx: number; dy: number },
  setup: SliceSetup,
  onProgress?: (stage: string, pct: number, message?: string) => void,
): Promise<SlicedPlate> {
  const { proc, layerHeight, bedSurface } = setup;
  const printerFlat = flattenPresetForSlicer(setup.printer);
  const filamentFlat = flattenPresetForSlicer(setup.filament);

  // One slicer object per copy. The pose is baked into the bytes, so the
  // job carries no rotation and no scale — there is nothing left for the
  // slicer to interpret differently from the editor. Position is the
  // plate-space spot plus the rigid offset that put the plate on this bed.
  const sliceObjects = instances.map((inst) => {
    const baked = bakeInstance(inst);
    if (!baked) {
      throw new Error(`Could not apply the rotation and scale on “${inst.label}” to its mesh.`);
    }
    // A part carries only the settings it overrides; one that agrees with
    // the process carries no per-object config at all.
    const o = plate.overrides?.[inst.id];
    const objectConfig: Record<string, string> = {
      ...(o?.supports !== undefined && o.supports !== proc.supportStyle
        ? supportConfig(o.supports) : {}),
      ...(o?.brim !== undefined && o.brim !== proc.brim ? brimConfig(o.brim) : {}),
    };
    return {
      data: baked.data,
      format: baked.format,
      posX: baked.x + offset.dx,
      posY: baked.y + offset.dy,
      rotZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      config: Object.keys(objectConfig).length > 0 ? objectConfig : undefined,
    };
  });

  // Printer contributes acceleration, speed limits, kinematics, start/end
  // gcode. Filament contributes temps, cooling, flow. Process contributes
  // only the user-facing knobs.
  // Tell the slicer which bed surface is installed. Without this, it
  // reads `cool_plate_temp` (usually 60) for every filament regardless.
  const bedSurfaceConfig: Record<string, string> = {
    curr_bed_type: bedSurface,
    // Also mirror the effective bed temp into the "generic" fields Orca
    // uses when substituting placeholders in machine_start_gcode. If
    // the placeholder resolves to the wrong bed-type-specific field
    // (some builds do this), these aliases guarantee the correct number.
    first_layer_bed_temperature:
      firstValue(filamentFlat[bedSurfaceTempKey(bedSurface)]) ?? '',
    bed_temperature_initial_layer_single:
      firstValue(filamentFlat[bedSurfaceTempKey(bedSurface)]) ?? '',
  };
  // Merge everything, then strip degenerate `bed_exclude_area` values
  // (`["0x0"]` placeholder from fdm_qidi_common etc.) that the slicer
  // combines with `extruder_clearance_radius` and turns into a bogus
  // ~47 mm keepout circle at the corner.
  const mergedConfig: Record<string, string> = {
    ...printerFlat,
    ...filamentFlat,
    ...bedSurfaceConfig,
    ...buildProcessConfig(proc, layerHeight),
  };
  // Sanitize the placeholder ["0x0"] exclusion; if the user opted to
  // ignore even real exclusion zones (their setup lets them print in
  // the corner), force-strip everything.
  const config = setup.clearExclusionZones
    ? forceStripBedExcludeArea(mergedConfig)
    : sanitizeBedExcludeArea(mergedConfig);

  const sliceResult = await backend.slicePlate(sliceObjects, config, undefined, onProgress);

  const nozzleTemp = firstValue(filamentFlat['nozzle_temperature_initial_layer']) ??
    firstValue(filamentFlat['nozzle_temperature']);
  // Read the bed temp for the surface the user actually has installed —
  // not the generic (60 °C) cool-plate default.
  const initialKey = `${bedSurfaceTempKey(bedSurface)}_initial_layer`;
  const bedTemp = firstValue(filamentFlat[initialKey]) ??
    firstValue(filamentFlat[bedSurfaceTempKey(bedSurface)]);
  const report = postProcessGcode(sliceResult.gcode, {
    printableArea: printerFlat['printable_area'],
    nozzleTemp,
    bedTemp,
    preheat: setup.preheat,
    centerOnBed: setup.centerOnBed,
  });

  // Build the provenance comment block: full lineage of the print so
  // this .gcode file is self-describing. Prepended to the top so it's
  // visible even if the file is opened as text.
  const meta = parseGcodeMetadata(report.gcode);
  const [printerConfigHash, filamentConfigHash] = await Promise.all([
    hashConfig(printerFlat).catch(() => undefined),
    hashConfig(filamentFlat).catch(() => undefined),
  ]);
  const supportsLabel =
    proc.supportStyle === 'none' ? 'no supports' :
    `${proc.supportStyle} supports${proc.supportOnBuildPlateOnly ? ' (build plate only)' : ''}`;
  const parts: ProvenancePart[] = plate.items.map((i) => ({
    file: `${i.target}.${i.format}`,
    label: i.label,
    qty: i.qty,
    params: i.params && provenanceParams(i.params),
  }));
  // Model-level lineage only means something when every part on the
  // plate came from the same model.
  const slugs = [...new Set(plate.items.map((i) => i.slug))];
  const singleSlug = slugs.length === 1 ? slugs[0] : undefined;
  const provenance: Provenance = {
    timestamp: new Date().toISOString(),
    slicerName: meta.slicerName && meta.slicerVersion ? `${meta.slicerName} ${meta.slicerVersion}` : undefined,
    modelSlug: singleSlug,
    modelTitle: singleSlug ? plate.items[0].modelTitle : undefined,
    modelUrl: singleSlug ? window.location.href : undefined,
    modelSourceUrl: singleSlug
      ? `https://github.com/mmmaxwwwell/3d-gallery/tree/main/models/${singleSlug}`
      : undefined,
    plateName: plate.name,
    parts,
    printerName: setup.printer.name,
    filamentName: setup.filament.name,
    bedSurface,
    bedTempC: bedTemp !== undefined ? Number(bedTemp) : undefined,
    nozzleTempC: nozzleTemp !== undefined ? Number(nozzleTemp) : undefined,
    processDescription: `${proc.wallLoops} walls, ${proc.infillPattern} ${proc.infillDensity}%, ${layerHeight}mm layer, ${supportsLabel}${proc.brim ? ', brim' : ''}${proc.skirt ? ', skirt' : ''}`,
    printerConfigHash,
    filamentConfigHash,
  };

  return {
    gcode: buildProvenanceComment(provenance) + report.gcode,
    report,
    seconds: meta.printTimeSeconds,
    grams: meta.filamentGrams,
  };
}

/**
 * Slice a stored plate with no editor open: resolve its meshes, place any
 * copy that was never arranged exactly as the editor would, and put the
 * arrangement on this printer's bed.
 */
export async function slicePlate(
  plate: Plate,
  setup: SliceSetup,
  onProgress?: (stage: string, pct: number, message?: string) => void,
): Promise<SlicedPlate> {
  const report = await resolvePlate(plate);
  if (report.failed.length > 0) {
    throw new Error(`${plate.name}: ${report.failed.map((s) => `${s.label} — ${s.reason}`).join('; ')}`);
  }
  let instances = buildInstances(plate, report.objects);
  const gaps = withArrangedGaps(plate, instances);
  const placed = gaps ? { ...plate, transforms: gaps } : plate;
  if (gaps) instances = buildInstances(placed, report.objects);
  if (instances.length === 0) throw new Error(`${plate.name} is empty.`);

  const bed = printerBedFromConfig(flattenPresetForSlicer(setup.printer), {
    ignoreExclusions: setup.clearExclusionZones,
  });
  if (!bed) throw new Error(`${setup.printer.name} has no printable area in its preset.`);
  const fit = evaluateAuthoredPlateFit(toFootprints(instances), bed);
  if (!fit.offset || fit.status === 'blocked') {
    throw new Error(`${plate.name} does not fit ${setup.printer.name}: ${fit.reasons[0] ?? 'too big'}`);
  }

  const backend = createSlicerBackend();
  try {
    return await sliceInstances(backend, placed, instances, fit.offset, setup, onProgress);
  } finally {
    backend.destroy();
  }
}
