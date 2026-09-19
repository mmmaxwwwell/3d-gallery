// SPDX-License-Identifier: MIT
// Lightweight STL / 3MF bounding-box parser. We use it to compute the mesh's
// geometry center so we can pass it to the slicer as an explicit position —
// bypassing the ambiguity of "does posX/posY mean mesh origin or mesh bbox
// center?". After we translate the mesh to (0, 0, 0) center, `posX = bedCenter`
// unambiguously puts the geometry on the bed.

import { unzipSync, zipSync, type Unzipped, type Zippable } from 'fflate';

export interface Bbox3 {
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
}

/** Look at the first 6 bytes to decide binary vs ASCII STL. Not perfect
 *  (binary STL files can start with the ASCII 5-byte "solid" tag) — we
 *  fall back to header keyword detection. */
function isAsciiStl(buf: Uint8Array): boolean {
  if (buf.length < 6) return false;
  const solid = buf[0] === 0x73 && buf[1] === 0x6f && buf[2] === 0x6c && buf[3] === 0x69 && buf[4] === 0x64;
  if (!solid) return false;
  // Binary STL sometimes has 'solid' at start; check that 'facet' appears
  // within the first ~1KB (typical for ASCII, absent from binary).
  const head = new TextDecoder().decode(buf.subarray(0, Math.min(1024, buf.length)));
  return /\bfacet\s+normal\b/i.test(head);
}

function bboxFromAsciiStl(buf: Uint8Array): Bbox3 | null {
  const text = new TextDecoder().decode(buf);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  let seen = false;
  const re = /vertex\s+(-?\d+(?:\.\d+)?(?:e-?\d+)?)\s+(-?\d+(?:\.\d+)?(?:e-?\d+)?)\s+(-?\d+(?:\.\d+)?(?:e-?\d+)?)/gi;
  for (const m of text.matchAll(re)) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    const z = parseFloat(m[3]);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    seen = true;
  }
  return seen ? { minX, maxX, minY, maxY, minZ, maxZ } : null;
}

function bboxFromBinaryStl(buf: Uint8Array): Bbox3 | null {
  // Header (80 bytes) + uint32 triangle count + 50 bytes per triangle.
  if (buf.length < 84) return null;
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const triCount = dv.getUint32(80, true);
  const expectedLen = 84 + triCount * 50;
  if (buf.length < expectedLen) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < triCount; i++) {
    const base = 84 + i * 50 + 12; // skip 12 bytes normal
    for (let v = 0; v < 3; v++) {
      const x = dv.getFloat32(base + v * 12, true);
      const y = dv.getFloat32(base + v * 12 + 4, true);
      const z = dv.getFloat32(base + v * 12 + 8, true);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
  }
  return triCount > 0 ? { minX, maxX, minY, maxY, minZ, maxZ } : null;
}

export function stlBbox(buf: ArrayBuffer): Bbox3 | null {
  const bytes = new Uint8Array(buf);
  return isAsciiStl(bytes) ? bboxFromAsciiStl(bytes) : bboxFromBinaryStl(bytes);
}

// ---------------------------------------------------------------------------
// 3MF
//
// A 3MF is a zip whose `3D/3dmodel.model` XML holds <object> resources (each
// with a <mesh> or a list of <component> references) and a <build> listing the
// <item>s that actually get printed. Both items and components may carry a
// row-major 3x4 `transform`, so authored vertex coordinates are not world
// coordinates. We only ever rewrite the numbers we have to and hand every
// other archive entry back to the zipper untouched, because the colour groups
// in this XML and `Metadata/model_settings.config` are what make a multicolor
// print multicolor.
// ---------------------------------------------------------------------------

/** Row-major 3MF transform: m00 m01 m02 m10 m11 m12 m20 m21 m22 m30 m31 m32.
 *  Points are row vectors, so the last triple is the translation. */
type Mat34 = number[];

const IDENTITY_MAT: Mat34 = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];

const ATTR_X = /\bx="([^"]*)"/;
const ATTR_Y = /\by="([^"]*)"/;
const ATTR_Z = /\bz="([^"]*)"/;
const ATTR_TRANSFORM = /\btransform="([^"]*)"/;

function attrOf(tag: string, name: string): string | null {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : null;
}

function parseMat34(raw: string | null): Mat34 | null {
  if (raw === null) return IDENTITY_MAT;
  const parts = raw.trim().split(/\s+/);
  if (parts.length !== 12) return null;
  const m = parts.map(Number);
  return m.every((v) => Number.isFinite(v)) ? m : null;
}

function isIdentityMat(m: Mat34): boolean {
  for (let i = 0; i < 12; i++) if (m[i] !== IDENTITY_MAT[i]) return false;
  return true;
}

/** Row-vector composition: applying `child` then `parent`. */
function composeMat(child: Mat34, parent: Mat34): Mat34 {
  const out = new Array<number>(12);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) sum += child[row * 3 + k] * parent[k * 3 + col];
      out[row * 3 + col] = row === 3 ? sum + parent[9 + col] : sum;
    }
  }
  return out;
}

function fmtCoord(n: number): string {
  const r = Math.round(n * 1e6) / 1e6;
  return Object.is(r, -0) ? '0' : String(r);
}

interface MfObject {
  /** Absolute offsets of the <vertices> element's inner content in the XML. */
  verticesStart: number;
  verticesEnd: number;
  /** Flat x,y,z triples as authored (object-local). */
  vertices: number[];
  components: Array<{ objectid: string; matrix: Mat34 }>;
}

interface MfItem {
  objectid: string;
  matrix: Mat34;
  /** Absolute offsets of the <item> tag itself, for rewriting its transform. */
  tagStart: number;
  tagEnd: number;
}

interface MfModel {
  objects: Map<string, MfObject>;
  items: MfItem[];
  hasTransform: boolean;
}

function parseVertexList(content: string): number[] {
  const out: number[] = [];
  const tagRe = /<(?:[\w.-]+:)?vertex\b[^>]*>/g;
  for (const m of content.matchAll(tagRe)) {
    const xm = ATTR_X.exec(m[0]);
    const ym = ATTR_Y.exec(m[0]);
    const zm = ATTR_Z.exec(m[0]);
    if (!xm || !ym || !zm) continue;
    const x = parseFloat(xm[1]);
    const y = parseFloat(ym[1]);
    const z = parseFloat(zm[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
    out.push(x, y, z);
  }
  return out;
}

function parseModelXml(xml: string): MfModel | null {
  const objects = new Map<string, MfObject>();
  let hasTransform = false;

  const objRe = /<(?:[\w.-]+:)?object\b([^>]*)>/g;
  let om: RegExpExecArray | null;
  while ((om = objRe.exec(xml)) !== null) {
    const attrs = om[1];
    const bodyStart = om.index + om[0].length;
    let bodyEnd = bodyStart;
    if (!/\/\s*$/.test(attrs)) {
      const closeRe = /<\/(?:[\w.-]+:)?object\s*>/g;
      closeRe.lastIndex = bodyStart;
      const close = closeRe.exec(xml);
      if (!close) return null;
      bodyEnd = close.index;
      objRe.lastIndex = close.index + close[0].length;
    }
    const id = attrOf(attrs, 'id');
    if (!id) continue;

    const body = xml.slice(bodyStart, bodyEnd);
    const entry: MfObject = { verticesStart: -1, verticesEnd: -1, vertices: [], components: [] };

    const vOpen = /<(?:[\w.-]+:)?vertices\s*>/.exec(body);
    if (vOpen) {
      const contentStart = vOpen.index + vOpen[0].length;
      const closeRe = /<\/(?:[\w.-]+:)?vertices\s*>/g;
      closeRe.lastIndex = contentStart;
      const vClose = closeRe.exec(body);
      if (!vClose) return null;
      entry.verticesStart = bodyStart + contentStart;
      entry.verticesEnd = bodyStart + vClose.index;
      entry.vertices = parseVertexList(body.slice(contentStart, vClose.index));
    }

    const compRe = /<(?:[\w.-]+:)?component\b([^>]*)>/g;
    for (const cm of body.matchAll(compRe)) {
      const objectid = attrOf(cm[1], 'objectid');
      if (!objectid) continue;
      const raw = ATTR_TRANSFORM.exec(cm[1]);
      const matrix = parseMat34(raw ? raw[1] : null);
      if (!matrix) return null;
      if (!isIdentityMat(matrix)) hasTransform = true;
      entry.components.push({ objectid, matrix });
    }

    objects.set(id, entry);
  }
  if (objects.size === 0) return null;

  const items: MfItem[] = [];
  const buildOpen = /<(?:[\w.-]+:)?build\b[^>]*>/.exec(xml);
  if (buildOpen) {
    const contentStart = buildOpen.index + buildOpen[0].length;
    const closeRe = /<\/(?:[\w.-]+:)?build\s*>/g;
    closeRe.lastIndex = contentStart;
    const close = closeRe.exec(xml);
    const content = xml.slice(contentStart, close ? close.index : xml.length);
    const itemRe = /<(?:[\w.-]+:)?item\b([^>]*)>/g;
    for (const im of content.matchAll(itemRe)) {
      const objectid = attrOf(im[1], 'objectid');
      if (!objectid) continue;
      const raw = ATTR_TRANSFORM.exec(im[1]);
      const matrix = parseMat34(raw ? raw[1] : null);
      if (!matrix) return null;
      if (!isIdentityMat(matrix)) hasTransform = true;
      const tagStart = contentStart + (im.index ?? 0);
      items.push({ objectid, matrix, tagStart, tagEnd: tagStart + im[0].length });
    }
  }

  return { objects, items, hasTransform };
}

interface BboxAcc {
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
  seen: boolean;
}

function accumulateObject(model: MfModel, id: string, mat: Mat34, acc: BboxAcc, stack: Set<string>): void {
  if (stack.has(id)) return;
  const obj = model.objects.get(id);
  if (!obj) return;
  stack.add(id);
  const v = obj.vertices;
  for (let i = 0; i < v.length; i += 3) {
    const x = v[i], y = v[i + 1], z = v[i + 2];
    const wx = x * mat[0] + y * mat[3] + z * mat[6] + mat[9];
    const wy = x * mat[1] + y * mat[4] + z * mat[7] + mat[10];
    const wz = x * mat[2] + y * mat[5] + z * mat[8] + mat[11];
    if (wx < acc.minX) acc.minX = wx; if (wx > acc.maxX) acc.maxX = wx;
    if (wy < acc.minY) acc.minY = wy; if (wy > acc.maxY) acc.maxY = wy;
    if (wz < acc.minZ) acc.minZ = wz; if (wz > acc.maxZ) acc.maxZ = wz;
    acc.seen = true;
  }
  for (const comp of obj.components) {
    accumulateObject(model, comp.objectid, composeMat(comp.matrix, mat), acc, stack);
  }
  stack.delete(id);
}

/** World-space bbox: every build item, with its transform applied. Falls back
 *  to treating each object as a top-level identity item when the file has no
 *  <build> section. */
function worldBbox(model: MfModel): Bbox3 | null {
  const acc: BboxAcc = {
    minX: Infinity, maxX: -Infinity,
    minY: Infinity, maxY: -Infinity,
    minZ: Infinity, maxZ: -Infinity,
    seen: false,
  };
  if (model.items.length > 0) {
    for (const item of model.items) accumulateObject(model, item.objectid, item.matrix, acc, new Set());
  } else {
    for (const id of model.objects.keys()) accumulateObject(model, id, IDENTITY_MAT, acc, new Set());
  }
  if (!acc.seen) return null;
  return { minX: acc.minX, maxX: acc.maxX, minY: acc.minY, maxY: acc.maxY, minZ: acc.minZ, maxZ: acc.maxZ };
}

/** Attribute-order-tolerant scan of every <vertex> in the document, ignoring
 *  transforms. The fallback for files this module cannot structurally parse. */
function rawVertexBbox(xml: string): Bbox3 | null {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  let seen = false;
  const re = /<vertex\b[^>]*\bx="(-?\d+(?:\.\d+)?(?:e-?\d+)?)"[^>]*\by="(-?\d+(?:\.\d+)?(?:e-?\d+)?)"[^>]*\bz="(-?\d+(?:\.\d+)?(?:e-?\d+)?)"/gi;
  for (const m of xml.matchAll(re)) {
    const x = parseFloat(m[1]); const y = parseFloat(m[2]); const z = parseFloat(m[3]);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    seen = true;
  }
  return seen ? { minX, maxX, minY, maxY, minZ, maxZ } : null;
}

interface ThreeMfDoc {
  files: Unzipped;
  modelPath: string;
  xml: string;
}

function readThreeMf(buf: ArrayBuffer): ThreeMfDoc | null {
  try {
    const files = unzipSync(new Uint8Array(buf));
    let modelPath: string | undefined = files['3D/3dmodel.model'] ? '3D/3dmodel.model' : undefined;
    if (!modelPath) {
      for (const path of Object.keys(files)) {
        if (path.toLowerCase().endsWith('3dmodel.model')) { modelPath = path; break; }
      }
    }
    if (!modelPath) return null;
    return { files, modelPath, xml: new TextDecoder().decode(files[modelPath]) };
  } catch { return null; }
}

/** Extract bbox from a 3MF, in build (world) coordinates. */
export function threeMfBbox(buf: ArrayBuffer): Bbox3 | null {
  const doc = readThreeMf(buf);
  if (!doc) return null;
  try {
    const model = parseModelXml(doc.xml);
    if (model) {
      const bbox = worldBbox(model);
      if (bbox) return bbox;
    }
  } catch { /* structural parse failed; fall through to the raw scan */ }
  return rawVertexBbox(doc.xml);
}

export function meshBbox(buf: ArrayBuffer, format: 'stl' | '3mf'): Bbox3 | null {
  return format === 'stl' ? stlBbox(buf) : threeMfBbox(buf);
}

/** Translate every vertex in an ASCII STL by (dx, dy, dz). Preserves normals
 *  (translation-invariant). Only supports ASCII STL for now — binary would
 *  need rewriting the float32 arrays. */
function translateAsciiStl(buf: ArrayBuffer, dx: number, dy: number, dz: number): ArrayBuffer {
  const text = new TextDecoder().decode(new Uint8Array(buf));
  const out = text.replace(
    /vertex\s+(-?\d+(?:\.\d+)?(?:e-?\d+)?)\s+(-?\d+(?:\.\d+)?(?:e-?\d+)?)\s+(-?\d+(?:\.\d+)?(?:e-?\d+)?)/gi,
    (_, x, y, z) => {
      const nx = (parseFloat(x) + dx).toFixed(6);
      const ny = (parseFloat(y) + dy).toFixed(6);
      const nz = (parseFloat(z) + dz).toFixed(6);
      return `vertex ${nx} ${ny} ${nz}`;
    },
  );
  return new TextEncoder().encode(out).buffer as ArrayBuffer;
}

/** Translate every vertex in a binary STL by (dx, dy, dz). Returns a new
 *  ArrayBuffer (doesn't mutate). */
function translateBinaryStl(buf: ArrayBuffer, dx: number, dy: number, dz: number): ArrayBuffer {
  const src = new Uint8Array(buf);
  const dst = new Uint8Array(src.length);
  dst.set(src);
  const dv = new DataView(dst.buffer);
  if (dst.length < 84) return dst.buffer;
  const triCount = dv.getUint32(80, true);
  for (let i = 0; i < triCount; i++) {
    const base = 84 + i * 50 + 12;
    for (let v = 0; v < 3; v++) {
      dv.setFloat32(base + v * 12, dv.getFloat32(base + v * 12, true) + dx, true);
      dv.setFloat32(base + v * 12 + 4, dv.getFloat32(base + v * 12 + 4, true) + dy, true);
      dv.setFloat32(base + v * 12 + 8, dv.getFloat32(base + v * 12 + 8, true) + dz, true);
    }
  }
  return dst.buffer;
}

function shiftAttr(tag: string, re: RegExp, name: string, delta: number): string {
  return tag.replace(re, (whole, value: string) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? `${name}="${fmtCoord(n + delta)}"` : whole;
  });
}

function translateVertexList(content: string, dx: number, dy: number, dz: number): string {
  const tagRe = /<(?:[\w.-]+:)?vertex\b[^>]*>/g;
  return content.replace(tagRe, (tag) => {
    let out = shiftAttr(tag, ATTR_X, 'x', dx);
    out = shiftAttr(out, ATTR_Y, 'y', dy);
    return shiftAttr(out, ATTR_Z, 'z', dz);
  });
}

function withTranslation(itemTag: string, mat: Mat34, dx: number, dy: number, dz: number): string {
  const moved = mat.slice();
  moved[9] += dx; moved[10] += dy; moved[11] += dz;
  const value = moved.map(fmtCoord).join(' ');
  if (ATTR_TRANSFORM.test(itemTag)) return itemTag.replace(ATTR_TRANSFORM, `transform="${value}"`);
  const selfClosing = /\/\s*>\s*$/.test(itemTag);
  const head = itemTag.replace(/\s*\/?\s*>\s*$/, '');
  return `${head} transform="${value}"${selfClosing ? ' />' : '>'}`;
}

function spliceAll(xml: string, edits: Array<{ start: number; end: number; text: string }>): string {
  const sorted = [...edits].sort((a, b) => a.start - b.start);
  let out = '';
  let cursor = 0;
  for (const edit of sorted) {
    if (edit.start < cursor) throw new Error('overlapping edit');
    out += xml.slice(cursor, edit.start) + edit.text;
    cursor = edit.end;
  }
  return out + xml.slice(cursor);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
    return bytes.buffer as ArrayBuffer;
  }
  return bytes.slice().buffer as ArrayBuffer;
}

function translateThreeMf(doc: ThreeMfDoc, model: MfModel, dx: number, dy: number, dz: number): ArrayBuffer | null {
  const edits: Array<{ start: number; end: number; text: string }> = [];
  if (!model.hasTransform) {
    for (const obj of model.objects.values()) {
      if (obj.verticesStart < 0 || obj.vertices.length === 0) continue;
      const content = doc.xml.slice(obj.verticesStart, obj.verticesEnd);
      edits.push({ start: obj.verticesStart, end: obj.verticesEnd, text: translateVertexList(content, dx, dy, dz) });
    }
  } else if (model.items.length > 0) {
    // A transform sits between the authored vertices and the bed, so shifting
    // the vertices would land somewhere else entirely. Move the build items.
    for (const item of model.items) {
      const tag = doc.xml.slice(item.tagStart, item.tagEnd);
      edits.push({ start: item.tagStart, end: item.tagEnd, text: withTranslation(tag, item.matrix, dx, dy, dz) });
    }
  } else {
    return null;
  }
  if (edits.length === 0) return null;

  const nextXml = spliceAll(doc.xml, edits);
  const zippable: Zippable = {};
  for (const [path, data] of Object.entries(doc.files)) zippable[path] = data;
  zippable[doc.modelPath] = new TextEncoder().encode(nextXml);
  return toArrayBuffer(zipSync(zippable));
}

/** Recenter the mesh so its XY bbox center is at (0, 0) and its minimum Z sits
 *  on the build plate. Returns a new buffer + the translation applied (for
 *  provenance) + the bbox as it was before the translation. */
export function recenterMeshXY(
  buf: ArrayBuffer,
  format: 'stl' | '3mf',
): { buffer: ArrayBuffer; translation: { dx: number; dy: number; dz: number }; bbox: Bbox3 | null } {
  const unchanged = (bbox: Bbox3 | null) => ({ buffer: buf, translation: { dx: 0, dy: 0, dz: 0 }, bbox });

  if (format === '3mf') {
    const doc = readThreeMf(buf);
    if (!doc) return unchanged(null);
    let model: MfModel | null = null;
    try { model = parseModelXml(doc.xml); } catch { model = null; }
    const bbox = (model && worldBbox(model)) || rawVertexBbox(doc.xml);
    if (!bbox || !model) return unchanged(bbox);
    const dx = -(bbox.minX + bbox.maxX) / 2;
    const dy = -(bbox.minY + bbox.maxY) / 2;
    const dz = -bbox.minZ;
    if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4 && Math.abs(dz) < 1e-4) return unchanged(bbox);
    let translated: ArrayBuffer | null = null;
    try { translated = translateThreeMf(doc, model, dx, dy, dz); } catch { translated = null; }
    if (!translated) return unchanged(bbox);
    return { buffer: translated, translation: { dx, dy, dz }, bbox };
  }

  const bbox = stlBbox(buf);
  if (!bbox) return unchanged(null);
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;
  // Also drop the mesh to the build plate: shift so minZ becomes 0.
  const dz = -bbox.minZ;
  if (Math.abs(cx) < 1e-4 && Math.abs(cy) < 1e-4 && Math.abs(dz) < 1e-4) return unchanged(bbox);
  const bytes = new Uint8Array(buf);
  const translated = isAsciiStl(bytes)
    ? translateAsciiStl(buf, -cx, -cy, dz)
    : translateBinaryStl(buf, -cx, -cy, dz);
  return { buffer: translated, translation: { dx: -cx, dy: -cy, dz }, bbox };
}

// ---------------------------------------------------------------------------
// Pose (orientation + scale)
//
// The plate editor lets an object take any orientation and any per-axis scale,
// but a slicer job carries only a Z rotation and world-axis scale factors —
// which do not compose the same way once the part is tipped onto a face. So
// the whole pose is baked into the mesh bytes instead, and the job is handed
// an already-posed mesh with rotZ 0 and scale 1. There is then exactly one
// interpretation of the geometry, and it is the one the editor drew.
//
// Baking is expensive (a full rewrite, and a re-zip for 3MF), so it happens
// once at slice time. Everything before that — the 3D canvas, the fit oracle —
// measures with `meshBboxPosed`, which never touches the bytes.
//
// Scale is applied in the object's own axes and then rotated, matching the
// TRS composition Three.js uses for the on-screen object.
// ---------------------------------------------------------------------------

/** Unit quaternion, Three.js component order. */
export interface Quat { x: number; y: number; z: number; w: number }

export const IDENTITY_QUAT: Quat = { x: 0, y: 0, z: 0, w: 1 };

export function isIdentityQuat(q: Quat | undefined | null): boolean {
  if (!q) return true;
  return Math.abs(q.x) < 1e-9 && Math.abs(q.y) < 1e-9 && Math.abs(q.z) < 1e-9
    && Math.abs(Math.abs(q.w) - 1) < 1e-9;
}

/** Orientation plus per-axis scale, as the editor holds it. */
export interface MeshPose {
  rot: Quat;
  scale: { x: number; y: number; z: number };
}

export const IDENTITY_POSE: MeshPose = { rot: IDENTITY_QUAT, scale: { x: 1, y: 1, z: 1 } };

function isUnitScale(s: MeshPose['scale']): boolean {
  return Math.abs(s.x - 1) < 1e-9 && Math.abs(s.y - 1) < 1e-9 && Math.abs(s.z - 1) < 1e-9;
}

export function isIdentityPose(pose: MeshPose | undefined | null): boolean {
  return !pose || (isIdentityQuat(pose.rot) && isUnitScale(pose.scale));
}

/** Row-vector rotation matrix, matching the 3MF `transform` convention used
 *  throughout this module (`p' = p · M`, so M is the transpose of the usual
 *  column-vector rotation matrix). */
function quatToMat34(q: Quat): Mat34 {
  const n = Math.hypot(q.x, q.y, q.z, q.w) || 1;
  const x = q.x / n, y = q.y / n, z = q.z / n, w = q.w / n;
  return [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w),
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w),
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y),
    0, 0, 0,
  ];
}

/** Scale in local axes, then rotate — the order Three.js composes them in. */
function poseToMat34(pose: MeshPose): Mat34 {
  const { x, y, z } = pose.scale;
  const scaleMat: Mat34 = [x, 0, 0, 0, y, 0, 0, 0, z, 0, 0, 0];
  return composeMat(scaleMat, quatToMat34(pose.rot));
}

/**
 * Normals do not follow a non-uniform scale — a squashed box's faces tilt.
 * The matrix that does carry them is the inverse transpose. Returns null when
 * the pose is degenerate (a zero scale axis), which callers reject upstream.
 */
function normalMat(m: Mat34): Mat34 | null {
  const a = m[0], b = m[1], c = m[2];
  const d = m[3], e = m[4], f = m[5];
  const g = m[6], h = m[7], i = m[8];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) return null;
  // inverse, then transpose — written out as the cofactor matrix over det,
  // which is exactly (M^-1)^T for a row-vector convention.
  return [
    (e * i - f * h) / det, (f * g - d * i) / det, (d * h - e * g) / det,
    (c * h - b * i) / det, (a * i - c * g) / det, (b * g - a * h) / det,
    (b * f - c * e) / det, (c * d - a * f) / det, (a * e - b * d) / det,
    0, 0, 0,
  ];
}

function applyNormal(m: Mat34, x: number, y: number, z: number): [number, number, number] {
  const [nx, ny, nz] = applyMat(m, x, y, z);
  const len = Math.hypot(nx, ny, nz);
  return len > 1e-12 ? [nx / len, ny / len, nz / len] : [nx, ny, nz];
}

function applyMat(m: Mat34, x: number, y: number, z: number): [number, number, number] {
  return [
    x * m[0] + y * m[3] + z * m[6] + m[9],
    x * m[1] + y * m[4] + z * m[7] + m[10],
    x * m[2] + y * m[5] + z * m[8] + m[11],
  ];
}

function emptyAcc(): BboxAcc {
  return {
    minX: Infinity, maxX: -Infinity,
    minY: Infinity, maxY: -Infinity,
    minZ: Infinity, maxZ: -Infinity,
    seen: false,
  };
}

function accPoint(acc: BboxAcc, x: number, y: number, z: number): void {
  if (x < acc.minX) acc.minX = x; if (x > acc.maxX) acc.maxX = x;
  if (y < acc.minY) acc.minY = y; if (y > acc.maxY) acc.maxY = y;
  if (z < acc.minZ) acc.minZ = z; if (z > acc.maxZ) acc.maxZ = z;
  acc.seen = true;
}

function accToBbox(acc: BboxAcc): Bbox3 | null {
  if (!acc.seen) return null;
  return {
    minX: acc.minX, maxX: acc.maxX,
    minY: acc.minY, maxY: acc.maxY,
    minZ: acc.minZ, maxZ: acc.maxZ,
  };
}

const STL_NUM = String.raw`-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?`;
const STL_TRIPLE = new RegExp(
  String.raw`(vertex|facet\s+normal)\s+(${STL_NUM})\s+(${STL_NUM})\s+(${STL_NUM})`,
  'gi',
);

function stlBboxRotated(buf: ArrayBuffer, m: Mat34): Bbox3 | null {
  const bytes = new Uint8Array(buf);
  const acc = emptyAcc();
  if (isAsciiStl(bytes)) {
    const text = new TextDecoder().decode(bytes);
    const re = new RegExp(String.raw`vertex\s+(${STL_NUM})\s+(${STL_NUM})\s+(${STL_NUM})`, 'gi');
    for (const match of text.matchAll(re)) {
      const [x, y, z] = applyMat(m, parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) accPoint(acc, x, y, z);
    }
    return accToBbox(acc);
  }
  if (bytes.length < 84) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const triCount = dv.getUint32(80, true);
  if (bytes.length < 84 + triCount * 50) return null;
  for (let i = 0; i < triCount; i++) {
    const base = 84 + i * 50 + 12;
    for (let v = 0; v < 3; v++) {
      const off = base + v * 12;
      const [x, y, z] = applyMat(
        m, dv.getFloat32(off, true), dv.getFloat32(off + 4, true), dv.getFloat32(off + 8, true),
      );
      accPoint(acc, x, y, z);
    }
  }
  return accToBbox(acc);
}

function threeMfBboxRotated(buf: ArrayBuffer, m: Mat34): Bbox3 | null {
  const doc = readThreeMf(buf);
  if (!doc) return null;
  let model: MfModel | null = null;
  try { model = parseModelXml(doc.xml); } catch { model = null; }
  if (model) {
    const acc = emptyAcc();
    if (model.items.length > 0) {
      for (const item of model.items) {
        accumulateObject(model, item.objectid, composeMat(item.matrix, m), acc, new Set());
      }
    } else {
      for (const id of model.objects.keys()) accumulateObject(model, id, m, acc, new Set());
    }
    const bbox = accToBbox(acc);
    if (bbox) return bbox;
  }
  const raw = rawVertexBbox(doc.xml);
  if (!raw) return null;
  // Corner sweep of the unrotated bbox — an over-estimate, but the structural
  // parse already failed, so there is no vertex list left to be exact with.
  const acc = emptyAcc();
  for (const cx of [raw.minX, raw.maxX]) {
    for (const cy of [raw.minY, raw.maxY]) {
      for (const cz of [raw.minZ, raw.maxZ]) {
        const [x, y, z] = applyMat(m, cx, cy, cz);
        accPoint(acc, x, y, z);
      }
    }
  }
  return accToBbox(acc);
}

/** World bbox of the mesh under `pose`, without rewriting the mesh. */
export function meshBboxPosed(
  buf: ArrayBuffer,
  format: 'stl' | '3mf',
  pose: MeshPose,
): Bbox3 | null {
  if (isIdentityPose(pose)) return meshBbox(buf, format);
  const m = poseToMat34(pose);
  return format === 'stl' ? stlBboxRotated(buf, m) : threeMfBboxRotated(buf, m);
}

/** World bbox after `rotation` alone. */
export function meshBboxRotated(
  buf: ArrayBuffer,
  format: 'stl' | '3mf',
  rotation: Quat,
): Bbox3 | null {
  return meshBboxPosed(buf, format, { rot: rotation, scale: { x: 1, y: 1, z: 1 } });
}

function transformAsciiStl(buf: ArrayBuffer, m: Mat34, nm: Mat34): ArrayBuffer {
  const text = new TextDecoder().decode(new Uint8Array(buf));
  const out = text.replace(STL_TRIPLE, (whole, kind: string, xs: string, ys: string, zs: string) => {
    const isNormal = kind[0] === 'f' || kind[0] === 'F';
    const apply = isNormal ? applyNormal : applyMat;
    const [x, y, z] = apply(isNormal ? nm : m, parseFloat(xs), parseFloat(ys), parseFloat(zs));
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return whole;
    return `${kind} ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}`;
  });
  return new TextEncoder().encode(out).buffer as ArrayBuffer;
}

function transformBinaryStl(buf: ArrayBuffer, m: Mat34, nm: Mat34): ArrayBuffer {
  const src = new Uint8Array(buf);
  if (src.length < 84) return buf;
  const dst = new Uint8Array(src.length);
  dst.set(src);
  const dv = new DataView(dst.buffer);
  const triCount = dv.getUint32(80, true);
  for (let i = 0; i < triCount; i++) {
    const base = 84 + i * 50;
    // Slot 0 is the stored normal; slots 1-3 are the vertices.
    for (let slot = 0; slot < 4; slot++) {
      const off = base + slot * 12;
      const apply = slot === 0 ? applyNormal : applyMat;
      const [x, y, z] = apply(
        slot === 0 ? nm : m,
        dv.getFloat32(off, true), dv.getFloat32(off + 4, true), dv.getFloat32(off + 8, true),
      );
      dv.setFloat32(off, x, true);
      dv.setFloat32(off + 4, y, true);
      dv.setFloat32(off + 8, z, true);
    }
  }
  return dst.buffer;
}

function transformVertexList(content: string, m: Mat34): string {
  const tagRe = /<(?:[\w.-]+:)?vertex\b[^>]*>/g;
  return content.replace(tagRe, (tag) => {
    const xs = ATTR_X.exec(tag);
    const ys = ATTR_Y.exec(tag);
    const zs = ATTR_Z.exec(tag);
    if (!xs || !ys || !zs) return tag;
    const [x, y, z] = applyMat(m, parseFloat(xs[1]), parseFloat(ys[1]), parseFloat(zs[1]));
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return tag;
    return tag
      .replace(ATTR_X, `x="${fmtCoord(x)}"`)
      .replace(ATTR_Y, `y="${fmtCoord(y)}"`)
      .replace(ATTR_Z, `z="${fmtCoord(z)}"`);
  });
}

function withMatrix(itemTag: string, mat: Mat34, m: Mat34): string {
  const value = composeMat(mat, m).map(fmtCoord).join(' ');
  if (ATTR_TRANSFORM.test(itemTag)) return itemTag.replace(ATTR_TRANSFORM, `transform="${value}"`);
  const selfClosing = /\/\s*>\s*$/.test(itemTag);
  const head = itemTag.replace(/\s*\/?\s*>\s*$/, '');
  return `${head} transform="${value}"${selfClosing ? ' />' : '>'}`;
}

function transformThreeMf(buf: ArrayBuffer, m: Mat34): ArrayBuffer | null {
  const doc = readThreeMf(buf);
  if (!doc) return null;
  let model: MfModel | null = null;
  try { model = parseModelXml(doc.xml); } catch { return null; }
  if (!model) return null;

  const edits: Array<{ start: number; end: number; text: string }> = [];
  if (model.items.length > 0) {
    // Composing into the build items poses the whole assembly once, without
    // touching a single vertex — and without double-applying to components.
    for (const item of model.items) {
      const tag = doc.xml.slice(item.tagStart, item.tagEnd);
      edits.push({ start: item.tagStart, end: item.tagEnd, text: withMatrix(tag, item.matrix, m) });
    }
  } else if (!model.hasTransform) {
    for (const obj of model.objects.values()) {
      if (obj.verticesStart < 0 || obj.vertices.length === 0) continue;
      const content = doc.xml.slice(obj.verticesStart, obj.verticesEnd);
      edits.push({ start: obj.verticesStart, end: obj.verticesEnd, text: transformVertexList(content, m) });
    }
  } else {
    // Component transforms with no build section: posing object vertices would
    // apply the transform once per nesting level.
    return null;
  }
  if (edits.length === 0) return null;

  const nextXml = spliceAll(doc.xml, edits);
  const zippable: Zippable = {};
  for (const [path, data] of Object.entries(doc.files)) zippable[path] = data;
  zippable[doc.modelPath] = new TextEncoder().encode(nextXml);
  return toArrayBuffer(zipSync(zippable));
}

/**
 * Bake `pose` into the mesh bytes. Returns null when the mesh cannot be posed
 * in place — callers must treat that as a hard failure rather than slicing
 * geometry the editor never showed.
 */
export function transformMesh(
  buf: ArrayBuffer,
  format: 'stl' | '3mf',
  pose: MeshPose,
): ArrayBuffer | null {
  if (isIdentityPose(pose)) return buf;
  const m = poseToMat34(pose);
  const nm = normalMat(m);
  if (!nm) return null;
  if (format === '3mf') return transformThreeMf(buf, m);
  const bytes = new Uint8Array(buf);
  return isAsciiStl(bytes) ? transformAsciiStl(buf, m, nm) : transformBinaryStl(buf, m, nm);
}

/** Bake `rotation` alone into the mesh bytes. */
export function rotateMesh(
  buf: ArrayBuffer,
  format: 'stl' | '3mf',
  rotation: Quat,
): ArrayBuffer | null {
  return transformMesh(buf, format, { rot: rotation, scale: { x: 1, y: 1, z: 1 } });
}
