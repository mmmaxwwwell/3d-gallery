// SPDX-License-Identifier: MIT
// Reader for a sliced OrcaSlicer 3MF project.
//
// What a project file does and does not carry decides the whole import
// strategy, so it's worth stating:
//
//   Metadata/project_settings.config  ~600 flattened keys, `inherits` stripped
//                                     plus printer/filament/print `*_settings_id`
//   Metadata/model_settings.config    objects (source_file, 4x4 matrix, source
//                                     offsets, extruder) and plates (which
//                                     object instances sit on which plate)
//   Metadata/plate_N.json             per-object bbox, area, layer height
//   3D/Objects/<source>.stl_N.model   the geometry, named after the source file
//
// So a project names the presets it used and carries their resolved values,
// but no lineage — nothing says which preset a value came from, or where the
// source STL lived. Identity has to be recovered by matching, which is why
// this module only extracts and never guesses.

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { unzipSync, type Unzipped } from 'fflate';

export interface ProjectObject {
  /** Orca's object id within the project. */
  id: string;
  name: string;
  /** Original file the object was loaded from, per Orca's own metadata. */
  sourceFile?: string;
  /** Row-major 4x4 placement matrix, when present. */
  matrix?: number[];
  sourceOffset?: { x: number; y: number; z: number };
  extruder?: number;
  /** From plate_N.json, matched by name. */
  bbox?: number[];
  area?: number;
  layerHeight?: number;
}

export interface ProjectPlate {
  index: number;
  name?: string;
  /** Object ids placed on this plate. */
  objectIds: string[];
  bboxAll?: number[];
  thumbnail?: string;
}

export interface ProjectPresetIds {
  printer?: string;
  filaments: string[];
  process?: string;
}

export interface OrcaProject {
  path: string;
  fileName: string;
  presetIds: ProjectPresetIds;
  printerModel?: string;
  printerVariant?: string;
  nozzleDiameter?: string[];
  filamentTypes?: string[];
  layerHeight?: number;
  bedType?: string;
  orcaVersion?: string;
  /** The full flattened config, ~600 keys. Values without identity. */
  flatConfig: Record<string, unknown>;
  objects: ProjectObject[];
  plates: ProjectPlate[];
  /** Entry names of embedded geometry, one per object. */
  geometryEntries: string[];
}

function text(zip: Unzipped, entry: string): string | null {
  const bytes = zip[entry];
  return bytes ? new TextDecoder().decode(bytes) : null;
}

/** Pull `<metadata key="k" value="v"/>` pairs out of one XML fragment.
 *  Orca writes these flat and unescaped-attribute-free in practice; a parser
 *  dependency would buy nothing here. */
function metadataPairs(fragment: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /<metadata\s+key="([^"]*)"\s+value="([^"]*)"\s*\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fragment))) out[m[1]] = m[2];
  return out;
}

function numbers(value: string | undefined): number[] | undefined {
  if (!value) return undefined;
  const parts = value.trim().split(/\s+/).map(Number);
  return parts.every((n) => Number.isFinite(n)) ? parts : undefined;
}

function parseObjects(modelSettings: string): ProjectObject[] {
  const objects: ProjectObject[] = [];
  const re = /<object\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/object>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(modelSettings))) {
    const id = m[1];
    const body = m[2];
    // Object-level metadata sits before the first <part>; part metadata carries
    // source_file and the transform.
    const partStart = body.indexOf('<part');
    const objectMeta = metadataPairs(partStart >= 0 ? body.slice(0, partStart) : body);
    const partMeta = partStart >= 0 ? metadataPairs(body.slice(partStart)) : {};

    const ox = Number(partMeta['source_offset_x']);
    const oy = Number(partMeta['source_offset_y']);
    const oz = Number(partMeta['source_offset_z']);
    const extruder = Number(objectMeta['extruder']);

    objects.push({
      id,
      name: objectMeta['name'] ?? partMeta['name'] ?? `object_${id}`,
      sourceFile: partMeta['source_file'],
      matrix: numbers(partMeta['matrix']),
      sourceOffset:
        Number.isFinite(ox) && Number.isFinite(oy) && Number.isFinite(oz)
          ? { x: ox, y: oy, z: oz }
          : undefined,
      extruder: Number.isFinite(extruder) ? extruder : undefined,
    });
  }
  return objects;
}

function parsePlates(modelSettings: string): ProjectPlate[] {
  const plates: ProjectPlate[] = [];
  const re = /<plate>([\s\S]*?)<\/plate>/g;
  let m: RegExpExecArray | null;
  let fallbackIndex = 1;
  while ((m = re.exec(modelSettings))) {
    const body = m[1];
    // Plate-level metadata precedes the <model_instance> children.
    const firstInstance = body.indexOf('<model_instance>');
    const plateMeta = metadataPairs(firstInstance >= 0 ? body.slice(0, firstInstance) : body);
    const objectIds: string[] = [];
    const instRe = /<model_instance>([\s\S]*?)<\/model_instance>/g;
    let inst: RegExpExecArray | null;
    while ((inst = instRe.exec(body))) {
      const objectId = metadataPairs(inst[1])['object_id'];
      if (objectId) objectIds.push(objectId);
    }
    const index = Number(plateMeta['plater_id']);
    plates.push({
      index: Number.isFinite(index) ? index : fallbackIndex,
      name: plateMeta['plater_name'] || undefined,
      objectIds,
      thumbnail: plateMeta['thumbnail_file'],
    });
    fallbackIndex++;
  }
  return plates;
}

interface PlateJsonObject {
  name?: string;
  bbox?: number[];
  area?: number;
  layer_height?: number;
}

/** Fold plate_N.json geometry facts onto the objects, matched by name.
 *  The ids in plate_N.json are Orca's internal identifiers and do not
 *  correspond to the object ids in model_settings.config. */
function applyPlateJson(zip: Unzipped, plates: ProjectPlate[], objects: ProjectObject[]): void {
  const byName = new Map(objects.map((o) => [o.name, o]));
  for (const plate of plates) {
    const raw = text(zip, `Metadata/plate_${plate.index}.json`);
    if (!raw) continue;
    let parsed: { bbox_all?: number[]; bbox_objects?: PlateJsonObject[] };
    try { parsed = JSON.parse(raw); } catch { continue; }
    plate.bboxAll = parsed.bbox_all;
    for (const entry of parsed.bbox_objects ?? []) {
      const target = entry.name ? byName.get(entry.name) : undefined;
      if (!target) continue;
      target.bbox = entry.bbox;
      target.area = entry.area;
      target.layerHeight = entry.layer_height;
    }
  }
}

function stringArray(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return v.map(String);
  return typeof v === 'string' && v ? [v] : undefined;
}

export async function readOrcaProject(path: string): Promise<OrcaProject> {
  const zip = unzipSync(new Uint8Array(await readFile(path)));

  const settingsRaw = text(zip, 'Metadata/project_settings.config');
  let flatConfig: Record<string, unknown> = {};
  if (settingsRaw) {
    try { flatConfig = JSON.parse(settingsRaw) as Record<string, unknown>; } catch { flatConfig = {}; }
  }

  const modelSettings = text(zip, 'Metadata/model_settings.config') ?? '';
  const objects = parseObjects(modelSettings);
  const plates = parsePlates(modelSettings);
  applyPlateJson(zip, plates, objects);

  const layerHeight = Number(flatConfig['layer_height']);

  return {
    path,
    fileName: basename(path),
    presetIds: {
      printer: typeof flatConfig['printer_settings_id'] === 'string'
        ? flatConfig['printer_settings_id'] : undefined,
      filaments: stringArray(flatConfig['filament_settings_id']) ?? [],
      process: typeof flatConfig['print_settings_id'] === 'string'
        ? flatConfig['print_settings_id'] : undefined,
    },
    printerModel: typeof flatConfig['printer_model'] === 'string'
      ? flatConfig['printer_model'] : undefined,
    printerVariant: typeof flatConfig['printer_variant'] === 'string'
      ? flatConfig['printer_variant'] : undefined,
    nozzleDiameter: stringArray(flatConfig['nozzle_diameter']),
    filamentTypes: stringArray(flatConfig['filament_type']),
    layerHeight: Number.isFinite(layerHeight) ? layerHeight : undefined,
    bedType: typeof flatConfig['curr_bed_type'] === 'string'
      ? flatConfig['curr_bed_type'] : undefined,
    orcaVersion: typeof flatConfig['version'] === 'string'
      ? flatConfig['version'] : undefined,
    flatConfig,
    objects,
    plates,
    geometryEntries: Object.keys(zip).filter((e) => e.startsWith('3D/Objects/')),
  };
}
