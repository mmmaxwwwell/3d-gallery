// SPDX-License-Identifier: AGPL-3.0-or-later
// Provenance comment block for sliced g-code. Prepended to the file so anyone
// with the .gcode can reconstruct the exact model + parameters + slicer
// version + config presets used to generate it.
//
// The block is a normal `; ` comment sequence — Klipper (and every other
// firmware) ignores it. Structured so a downstream tool could parse it back
// with a regex per key.

export interface ProvenancePart {
  file: string;
  label: string;
  qty: number;
  /** Customizer params for this specific item, if parametric. */
  params?: Record<string, string | number>;
}

export interface Provenance {
  /** Permalink back to the gallery page with the same model + customizer
   *  params. Round-trip: opening this URL rebuilds the mesh at the same
   *  parameters. */
  modelUrl?: string;
  /** Model slug (e.g. `test-cube-xyz`). */
  modelSlug?: string;
  /** Display title (e.g. `"XYZ Test Cube"`). */
  modelTitle?: string;
  /** GitHub-Pages/repo URL where the source .scad lives. */
  modelSourceUrl?: string;
  /** Plate name, when the gcode came from a multi-object plate. */
  plateName?: string;
  /** Every part on the plate. Supersedes partFile/partLabel/customizerParams. */
  parts?: ProvenancePart[];

  /** @deprecated superseded by `parts`. File name of the part sliced. */
  partFile?: string;
  /** @deprecated superseded by `parts`. Human label for the part. */
  partLabel?: string;
  /** @deprecated superseded by `parts[].params`. OpenSCAD parameters if the
   *  model is parametric — mesh doesn't change when these are absent, but
   *  recording them makes the print reproducible. */
  customizerParams?: Record<string, string | number>;

  /** Printer preset name (e.g. `"Flashforge Adventurer 5M 0.4 Klipper Left"`). */
  printerName?: string;
  /** Filament preset name (e.g. `"Kingroon PETG @ FFADM5"`). */
  filamentName?: string;
  /** Bed surface / plate type selected (`"Hot Plate"` etc.). */
  bedSurface?: string;
  /** One-line description of process settings. */
  processDescription?: string;

  /** Effective bed temperature actually sent to the printer, °C. */
  bedTempC?: number;
  /** Effective nozzle temperature, °C. */
  nozzleTempC?: number;

  /** Slicer name + version string (e.g. `"OrcaSlicer 2.3.1"`). */
  slicerName?: string;
  /** libslic3r WASM build tag / commit — printed for provenance so a rebuild
   *  can pin the same slicer engine. */
  wasmBuildTag?: string;

  /** Gallery-app git commit / build tag. */
  galleryVersion?: string;
  /** ISO timestamp — when the g-code was produced. */
  timestamp?: string;

  /** Fingerprint (hash) of the flattened printer/filament configs. Lets a
   *  reader confirm the print used identical presets without embedding the
   *  entire config dict. */
  printerConfigHash?: string;
  filamentConfigHash?: string;
}

function escapeCommentValue(value: string): string {
  // Newlines break the "one entry per line" grep-ability; carriage returns
  // trip some parsers. Collapse whitespace and drop control chars.
  return value.replace(/\s+/g, ' ').replace(/[^\x20-\x7e]/g, '').trim();
}

function emit(key: string, value: string | number | undefined): string | null {
  if (value === undefined || value === null || value === '') return null;
  const str = typeof value === 'number' ? String(value) : escapeCommentValue(String(value));
  if (!str) return null;
  return `; gallery.${key}: ${str}`;
}

// `;   2x cap.stl — "Cap" (piece_i=0, piece_j=1)`
const PART_LINE_RE = /^\s*;\s{2,}(\d+)x\s+(.+?)\s+—\s+"(.*)"(?:\s+\((.*)\))?\s*$/;
const PARTS_HEADING_RE = /^\s*;\s*Parts:\s*$/;

function renderPart(part: ProvenancePart): string {
  const qty = Number.isFinite(part.qty) ? Math.max(1, Math.round(part.qty)) : 1;
  const file = escapeCommentValue(String(part.file ?? ''));
  // A quote in the label would make the closing quote ambiguous to the parser.
  const label = escapeCommentValue(String(part.label ?? '')).replace(/"/g, "'");
  const keys = part.params ? Object.keys(part.params).sort() : [];
  const params = keys
    .map((k) => `${k}=${escapeCommentValue(String(part.params![k]))}`)
    .join(', ');
  const suffix = params ? ` (${params})` : '';
  return `;   ${qty}x ${file} — "${label}"${suffix}`;
}

function parsePartParams(blob: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Split on `, ` only where the next token opens a new `key=`, so a value
  // containing a comma survives the round trip.
  const re = /([A-Za-z_][\w.]*)=(.*?)(?=,\s+[A-Za-z_][\w.]*=|$)/g;
  for (const m of blob.matchAll(re)) out[m[1]] = m[2].trim();
  return out;
}

/** Build the provenance comment block. Lines start with `; gallery.<key>: `
 *  so a downstream parser can extract them with `\bgallery\.([\w.]+):\s*(.*)/`.
 *  Idempotent — no dependence on ordering, no state. */
export function buildProvenanceComment(p: Provenance): string {
  const lines: string[] = ['; ===== 3d-gallery print provenance ====='];

  const push = (key: string, value: string | number | undefined) => {
    const line = emit(key, value);
    if (line) lines.push(line);
  };

  push('timestamp', p.timestamp);
  push('gallery_version', p.galleryVersion);
  push('slicer', p.slicerName);
  push('wasm_build', p.wasmBuildTag);
  push('model_slug', p.modelSlug);
  push('model_title', p.modelTitle);
  push('model_url', p.modelUrl);
  push('model_source', p.modelSourceUrl);
  push('plate_name', p.plateName);

  if (p.parts && p.parts.length > 0) {
    lines.push('; Parts:');
    for (const part of p.parts) lines.push(renderPart(part));
  } else {
    push('part_file', p.partFile);
    push('part_label', p.partLabel);

    if (p.customizerParams && Object.keys(p.customizerParams).length > 0) {
      // One line per param — easier to grep than a JSON blob, and Klipper
      // won't try to interpret an unclosed brace.
      const keys = Object.keys(p.customizerParams).sort();
      for (const k of keys) {
        push(`customizer.${k}`, p.customizerParams[k]);
      }
    }
  }

  push('printer_preset', p.printerName);
  push('filament_preset', p.filamentName);
  push('bed_surface', p.bedSurface);
  push('bed_temp_c', p.bedTempC);
  push('nozzle_temp_c', p.nozzleTempC);
  push('process', p.processDescription);
  push('printer_config_sha256', p.printerConfigHash);
  push('filament_config_sha256', p.filamentConfigHash);

  lines.push('; =========================================');
  return lines.join('\n') + '\n';
}

/** Parse a provenance comment block back into a Provenance object. Useful
 *  for tests and for tools that consume gallery-produced .gcode. */
export function parseProvenanceComment(gcode: string): Provenance {
  const out: Provenance = {};
  const customizer: Record<string, string> = {};
  const lineRe = /^\s*;\s*gallery\.([\w.]+):\s*(.*?)\s*$/gm;
  for (const m of gcode.matchAll(lineRe)) {
    const key = m[1];
    const value = m[2];
    if (key.startsWith('customizer.')) {
      customizer[key.slice('customizer.'.length)] = value;
      continue;
    }
    switch (key) {
      case 'timestamp': out.timestamp = value; break;
      case 'gallery_version': out.galleryVersion = value; break;
      case 'slicer': out.slicerName = value; break;
      case 'wasm_build': out.wasmBuildTag = value; break;
      case 'model_slug': out.modelSlug = value; break;
      case 'model_title': out.modelTitle = value; break;
      case 'model_url': out.modelUrl = value; break;
      case 'model_source': out.modelSourceUrl = value; break;
      case 'plate_name': out.plateName = value; break;
      case 'part_file': out.partFile = value; break;
      case 'part_label': out.partLabel = value; break;
      case 'printer_preset': out.printerName = value; break;
      case 'filament_preset': out.filamentName = value; break;
      case 'bed_surface': out.bedSurface = value; break;
      case 'bed_temp_c': out.bedTempC = parseFloat(value); break;
      case 'nozzle_temp_c': out.nozzleTempC = parseFloat(value); break;
      case 'process': out.processDescription = value; break;
      case 'printer_config_sha256': out.printerConfigHash = value; break;
      case 'filament_config_sha256': out.filamentConfigHash = value; break;
    }
  }
  if (Object.keys(customizer).length > 0) out.customizerParams = customizer;

  const parts: ProvenancePart[] = [];
  let inParts = false;
  for (const line of gcode.split(/\r?\n/)) {
    if (PARTS_HEADING_RE.test(line)) {
      inParts = true;
      continue;
    }
    if (!inParts) continue;
    const m = PART_LINE_RE.exec(line);
    if (!m) {
      inParts = false;
      continue;
    }
    const part: ProvenancePart = { file: m[2], label: m[3], qty: parseInt(m[1], 10) };
    if (m[4] !== undefined) {
      const params = parsePartParams(m[4]);
      if (Object.keys(params).length > 0) part.params = params;
    }
    parts.push(part);
  }
  if (parts.length > 0) out.parts = parts;

  return out;
}

/** Compute a stable SHA-256 hex digest over a flattened preset config.
 *  Sorts keys so equivalent configs hash identically regardless of insertion
 *  order. Requires WebCrypto (available in browsers and Node ≥ 20). */
export async function hashConfig(config: Record<string, string>): Promise<string> {
  const sortedKeys = Object.keys(config).sort();
  const payload = sortedKeys.map((k) => `${k}=${config[k]}`).join('\n');
  const buf = new TextEncoder().encode(payload);
  const digest = await (globalThis.crypto as Crypto).subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
