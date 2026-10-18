// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Package sliced G-code as the `.gcode.3mf` a Bambu Lab printer prints.
 *
 * Bambu firmware doesn't take bare G-code: it opens a 3MF, runs the plate's
 * `Metadata/plate_<n>.gcode` (checked against `plate_<n>.gcode.md5`), shows
 * `plate_<n>.png` on its screen, and reads `Metadata/slice_info.config` for the
 * printer model and the filaments the plate uses. The bambu-klipper-proxy maps
 * those `<filament>` entries to AMS trays when it starts the print.
 *
 * This writes the subset of a Bambu Studio export that carries those: no
 * model geometry (the printer never reads it) and one plate. The layout and
 * attribute names copy a Bambu Studio 2.05 X1C export.
 *
 * Pure: no DOM, no fetch.
 */

import { zipSync, zlibSync, strToU8 } from 'fflate';
import { md5Hex } from './md5.js';

export interface BambuFilament {
  /** 1-based slot the G-code calls it by (T0 is slot 1). */
  slot: number;
  /** Orca `filament_type`: PLA, PETG, TPU, … */
  type: string;
  /** `#RRGGBB`. */
  color: string;
  /** Bambu's filament code (`filament_ids`, e.g. GFA00), when the preset has one. */
  trayInfoIdx?: string;
  usedGrams?: number;
  usedMeters?: number;
}

export interface BambuPlateJob {
  /** The plate's G-code, as the slicer wrote it. */
  gcode: string;
  /** Plate number inside the 3MF. Default 1. */
  plate?: number;
  /** `slice_info` printer model id: BL-P001 is the X1 Carbon. */
  printerModelId: string;
  nozzleDiameter: number;
  /** Filaments the plate prints with, in slot order. */
  filaments: BambuFilament[];
  /** Print time estimate, seconds. */
  predictionSec?: number;
  /** Filament weight, g. */
  weightGrams?: number;
  supportUsed?: boolean;
  /** PNG shown on the printer's screen. A plain tile when absent. */
  thumbnail?: Uint8Array;
  title?: string;
}

const XML = '<?xml version="1.0" encoding="UTF-8"?>\n';

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function round(n: number, places: number): string {
  return String(Math.round(n * 10 ** places) / 10 ** places);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(strToU8(type), 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** A square of one grey: what the printer shows when the gallery has no picture of the plate. */
export function placeholderPng(size = 128): Uint8Array {
  const header = new Uint8Array(13);
  const hv = new DataView(header.buffer);
  hv.setUint32(0, size);
  hv.setUint32(4, size);
  header.set([8, 0, 0, 0, 0], 8); // 8-bit greyscale, no interlace
  const raw = new Uint8Array(size * (size + 1)).fill(0x80);
  for (let y = 0; y < size; y++) raw[y * (size + 1)] = 0; // filter byte per row
  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const parts = [signature, pngChunk('IHDR', header), pngChunk('IDAT', zlibSync(raw)), pngChunk('IEND', new Uint8Array())];
  const png = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { png.set(p, at); at += p.length; }
  return png;
}

/** The archive's entries, by path. Exposed so tests can read what a printer would. */
export function bambuGcode3mfEntries(job: BambuPlateJob): Record<string, Uint8Array> {
  const n = job.plate ?? 1;
  const gcodePath = `Metadata/plate_${n}.gcode`;
  const gcode = strToU8(job.gcode);
  const thumb = job.thumbnail ?? placeholderPng();

  const contentTypes = XML
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n'
    + ' <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n'
    + ' <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>\n'
    + ' <Default Extension="png" ContentType="image/png"/>\n'
    + ' <Default Extension="gcode" ContentType="text/x.gcode"/>\n'
    + '</Types>\n';

  const rels = XML
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n'
    + ' <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>\n'
    + ` <Relationship Target="/Metadata/plate_${n}.png" Id="rel-2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail"/>\n`
    + ` <Relationship Target="/Metadata/plate_${n}.png" Id="rel-4" Type="http://schemas.bambulab.com/package/2021/cover-thumbnail-middle"/>\n`
    + ` <Relationship Target="/Metadata/plate_${n}_small.png" Id="rel-5" Type="http://schemas.bambulab.com/package/2021/cover-thumbnail-small"/>\n`
    + '</Relationships>\n';

  const model = XML
    + '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021">\n'
    + ' <metadata name="Application">3d-gallery</metadata>\n'
    + ' <metadata name="BambuStudio:3mfVersion">1</metadata>\n'
    + ` <metadata name="Title">${esc(job.title ?? '')}</metadata>\n`
    + ' <resources>\n </resources>\n <build/>\n</model>\n';

  const modelSettings = XML + '<config>\n  <plate>\n'
    + `    <metadata key="plater_id" value="${n}"/>\n`
    + '    <metadata key="plater_name" value=""/>\n'
    + '    <metadata key="locked" value="false"/>\n'
    + `    <metadata key="gcode_file" value="${gcodePath}"/>\n`
    + `    <metadata key="thumbnail_file" value="Metadata/plate_${n}.png"/>\n`
    + '  </plate>\n</config>\n';

  const modelSettingsRels = XML
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n'
    + ` <Relationship Target="/${gcodePath}" Id="rel-1" Type="http://schemas.bambulab.com/package/2021/gcode"/>\n`
    + '</Relationships>\n';

  const plate: string[] = [
    `    <metadata key="index" value="${n}"/>`,
    `    <metadata key="printer_model_id" value="${esc(job.printerModelId)}"/>`,
    `    <metadata key="nozzle_diameters" value="${job.nozzleDiameter}"/>`,
    '    <metadata key="timelapse_type" value="0"/>',
    `    <metadata key="prediction" value="${Math.round(job.predictionSec ?? 0)}"/>`,
    `    <metadata key="weight" value="${round(job.weightGrams ?? 0, 2)}"/>`,
    '    <metadata key="outside" value="false"/>',
    `    <metadata key="support_used" value="${job.supportUsed ? 'true' : 'false'}"/>`,
    '    <metadata key="label_object_enabled" value="false"/>',
    ...job.filaments.map((f) => '    <filament'
      + ` id="${f.slot}"`
      + (f.trayInfoIdx ? ` tray_info_idx="${esc(f.trayInfoIdx)}"` : '')
      + ` type="${esc(f.type)}"`
      + ` color="${esc(f.color.toUpperCase())}"`
      + ` used_m="${round(f.usedMeters ?? 0, 2)}"`
      + ` used_g="${round(f.usedGrams ?? 0, 2)}"`
      + ' />'),
  ];
  const sliceInfo = XML + '<config>\n  <header>\n'
    + '    <header_item key="X-BBL-Client-Type" value="slicer"/>\n'
    + '    <header_item key="X-BBL-Client-Version" value="01.00.00.00"/>\n'
    + '  </header>\n  <plate>\n' + plate.join('\n') + '\n  </plate>\n</config>\n';

  return {
    '[Content_Types].xml': strToU8(contentTypes),
    '_rels/.rels': strToU8(rels),
    '3D/3dmodel.model': strToU8(model),
    'Metadata/model_settings.config': strToU8(modelSettings),
    'Metadata/_rels/model_settings.config.rels': strToU8(modelSettingsRels),
    'Metadata/slice_info.config': strToU8(sliceInfo),
    [gcodePath]: gcode,
    [`${gcodePath}.md5`]: strToU8(md5Hex(gcode).toUpperCase()),
    [`Metadata/plate_${n}.png`]: thumb,
    [`Metadata/plate_${n}_small.png`]: thumb,
  };
}

/** The `.gcode.3mf` bytes to upload. */
export function packageBambuGcode3mf(job: BambuPlateJob): Uint8Array {
  return zipSync(bambuGcode3mfEntries(job), { level: 6 });
}
