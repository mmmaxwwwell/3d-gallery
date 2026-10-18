// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The volumes of a multi-colour 3MF, in the order the slicer WASM holds them,
 * with the colour and filament slot each was authored with.
 *
 * `add3MFObject` loads a 3MF as libslic3r does — one model object per build
 * item, its volumes in component order — then folds every object into the
 * first and sets the extruder of each volume from the second object on to its
 * object's position (slicer_bindings.cpp). That suits OpenSCAD's
 * one-object-per-colour exports, not the gallery's plates, whose objects are
 * pieces with a part per colour; and a one-part object doesn't keep the
 * extruder the file gives it either (it comes out on slot 1). So the slot of
 * every volume is read here and set explicitly with `setVolumeExtruder`.
 *
 * Pure: no DOM, no fetch.
 */

import { unzipSync, strFromU8 } from 'fflate';

export interface ThreeMfVolume {
  /** Index among all volumes once the WASM has merged the objects. */
  index: number;
  /** `#rrggbb`, lowercase; '' when the file doesn't say. */
  color: string;
  /** 1-based filament slot the file assigns. */
  extruder: number;
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];
}

function hexColor(value: string | undefined): string {
  const m = /^#([0-9a-f]{6})/i.exec(value ?? '');
  return m ? `#${m[1].toLowerCase()}` : '';
}

/** `<object>` id → the component object ids it is built from; empty for a mesh. */
function objectParts(model: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const m of model.matchAll(/<object\b([^>]*)>([\s\S]*?)<\/object>/g)) {
    const id = attr(m[1], 'id');
    if (!id) continue;
    const components = [...m[2].matchAll(/<component\b([^>]*)\/?>/g)].map((c) => attr(c[1], 'objectid')).filter(Boolean) as string[];
    out.set(id, components);
  }
  return out;
}

/** Colour of a mesh object by its `pid`/`pindex` property, from a colour group or base materials. */
function propertyColors(model: string): (objectTag: string) => string {
  const groups = new Map<string, string[]>();
  for (const m of model.matchAll(/<(?:m:)?colorgroup\b([^>]*)>([\s\S]*?)<\/(?:m:)?colorgroup>/g)) {
    const id = attr(m[1], 'id');
    if (id) groups.set(id, [...m[2].matchAll(/<(?:m:)?color\b([^>]*)\/?>/g)].map((c) => hexColor(attr(c[1], 'color'))));
  }
  for (const m of model.matchAll(/<basematerials\b([^>]*)>([\s\S]*?)<\/basematerials>/g)) {
    const id = attr(m[1], 'id');
    if (id) groups.set(id, [...m[2].matchAll(/<base\b([^>]*)\/?>/g)].map((c) => hexColor(attr(c[1], 'displaycolor'))));
  }
  return (tag) => groups.get(attr(tag, 'pid') ?? '')?.[Number(attr(tag, 'pindex') ?? 0)] ?? '';
}

/**
 * model_settings.config's per-part metadata, keyed `<object id>:<part id>`.
 * A components object's parts are its component object ids; a plain mesh
 * object's one volume is part 0.
 */
function partSettings(settings: string): Map<string, { extruder?: number; color: string }> {
  const out = new Map<string, { extruder?: number; color: string }>();
  for (const obj of settings.matchAll(/<object\b([^>]*)>([\s\S]*?)<\/object>/g)) {
    const objId = attr(obj[1], 'id');
    if (!objId) continue;
    const objExtruder = /<metadata key="extruder" value="(\d+)"/.exec(obj[2].split('<part')[0])?.[1];
    const parts = [...obj[2].matchAll(/<part\b([^>]*)>([\s\S]*?)<\/part>/g)];
    for (const part of parts) {
      const id = attr(part[1], 'id');
      if (id === undefined) continue;
      const extruder = /<metadata key="extruder" value="(\d+)"/.exec(part[2])?.[1] ?? objExtruder;
      const name = /<metadata key="name" value="([^"]*)"/.exec(part[2])?.[1];
      out.set(`${objId}:${id}`, { extruder: extruder ? Number(extruder) : undefined, color: hexColor(name) });
    }
    if (parts.length === 0 && objExtruder) out.set(`${objId}:0`, { extruder: Number(objExtruder), color: '' });
  }
  return out;
}

/** Every volume of `data`, or null when it isn't a readable 3MF. */
export function threeMfVolumes(data: ArrayBuffer | Uint8Array): ThreeMfVolume[] | null {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(data instanceof Uint8Array ? data : new Uint8Array(data));
  } catch {
    return null;
  }
  const modelPath = Object.keys(files).find((p) => p.toLowerCase().endsWith('.model'));
  if (!modelPath) return null;
  const model = strFromU8(files[modelPath]);
  const settingsPath = Object.keys(files).find((p) => p.toLowerCase() === 'metadata/model_settings.config');
  const settings = settingsPath ? partSettings(strFromU8(files[settingsPath])) : new Map();
  const parts = objectParts(model);
  const colorOf = propertyColors(model);
  const tags = new Map([...model.matchAll(/<object\b([^>]*)>/g)].map((m) => [attr(m[1], 'id') ?? '', m[1]]));

  const items = [...model.matchAll(/<item\b([^>]*)\/?>/g)].map((m) => attr(m[1], 'objectid')).filter(Boolean) as string[];
  const volumes: ThreeMfVolume[] = [];
  for (const item of items) {
    const components = parts.get(item) ?? [];
    const pieces = components.length > 0
      ? components.map((id) => ({ mesh: id, key: `${item}:${id}` }))
      : [{ mesh: item, key: `${item}:0` }];
    for (const { mesh, key } of pieces) {
      const meta = settings.get(key);
      volumes.push({
        index: volumes.length,
        // The colour group is the colour; a part's name is often a label.
        color: colorOf(tags.get(mesh) ?? '') || meta?.color || '',
        extruder: meta?.extruder ?? 1,
      });
    }
  }
  return volumes;
}

/**
 * Each volume's 1-based filament slot on a printer that loads `slotColors`
 * (per slot, the `#rrggbb` colours it prints): the slot listing the volume's
 * colour, else slot 1 — what a one-filament printer would have printed it in.
 */
export function volumeSlots(volumes: ThreeMfVolume[], slotColors: string[][]): Record<number, number> {
  const slotOf = new Map<string, number>();
  slotColors.forEach((colors, i) => colors.forEach((c) => {
    const hex = c.toLowerCase();
    if (!slotOf.has(hex)) slotOf.set(hex, i + 1);
  }));
  return Object.fromEntries(volumes.map((v) => [v.index, slotOf.get(v.color) ?? 1]));
}
