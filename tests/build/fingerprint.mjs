// Semantic-fingerprint helpers for STL and multicolor 3MF artifacts.
//
// Goal: catch build regressions without being fooled by legitimate
// per-run vertex-ordering noise or manifold-vs-CGAL mesh differences.
// We compare STABLE properties:
//   - color palette (multicolor 3MF): exact set of hex codes.
//   - bounding box: within a tight tolerance (5e-3 mm).
//   - triangle count: within a generous ±25% band — different boolean
//     engines re-triangulate the same volume very differently.
//   - non-empty output: > 0 triangles.
//
// Fingerprints are captured from the CURRENT build pipeline as the
// baseline, and re-verified after every optimization.

import { readFileSync } from "node:fs";
import { unzipSync } from "fflate";

// ── STL parsers ─────────────────────────────────────────────────

function isAsciiStl(buf) {
  return (
    buf.slice(0, 5).toString("ascii") === "solid" &&
    (buf.length < 84 || buf.length !== 84 + buf.readUInt32LE(80) * 50)
  );
}

function parseStlBinary(buf) {
  const triCount = buf.readUInt32LE(80);
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let off = 84;
  for (let i = 0; i < triCount; i++) {
    off += 12; // skip normal
    for (let j = 0; j < 3; j++) {
      const x = buf.readFloatLE(off);
      const y = buf.readFloatLE(off + 4);
      const z = buf.readFloatLE(off + 8);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      off += 12;
    }
    off += 2;
  }
  return { triangleCount: triCount, bbox: [[minX, minY, minZ], [maxX, maxY, maxZ]] };
}

function parseStlAscii(text) {
  let count = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  const re = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
  let m;
  let vertsInTri = 0;
  while ((m = re.exec(text)) !== null) {
    const x = +m[1], y = +m[2], z = +m[3];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    if (++vertsInTri === 3) { count++; vertsInTri = 0; }
  }
  return { triangleCount: count, bbox: [[minX, minY, minZ], [maxX, maxY, maxZ]] };
}

export function fingerprintStl(path) {
  const buf = readFileSync(path);
  const parsed = isAsciiStl(buf) ? parseStlAscii(buf.toString("ascii")) : parseStlBinary(buf);
  return {
    format: "stl",
    triangleCount: parsed.triangleCount,
    bbox: roundBbox(parsed.bbox),
  };
}

// ── 3MF parser ─────────────────────────────────────────────────

export function fingerprint3mf(path) {
  const zipped = readFileSync(path);
  const files = unzipSync(zipped);
  const model = Buffer.from(files["3D/3dmodel.model"]).toString("utf8");

  // Colors: extract every <color color="#RRGGBBAA"> from the model XML
  const colorMatches = [...model.matchAll(/<color\s+color="([^"]+)"/g)];
  const colors = colorMatches.map((m) => m[1].toUpperCase()).sort();

  // Bounding box + triangle count: extract every <vertex x="..." y="..." z="..."/>
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  const vertexRe = /<vertex\s+x="([-\d.eE+]+)"\s+y="([-\d.eE+]+)"\s+z="([-\d.eE+]+)"/g;
  let vm;
  while ((vm = vertexRe.exec(model)) !== null) {
    const x = +vm[1], y = +vm[2], z = +vm[3];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  const triangleCount = [...model.matchAll(/<triangle\s+v1=/g)].length;

  return {
    format: "3mf",
    colors,
    triangleCount,
    bbox: roundBbox([[minX, minY, minZ], [maxX, maxY, maxZ]]),
  };
}

function roundBbox([[x0, y0, z0], [x1, y1, z1]]) {
  const r = (n) => Math.round(n * 1000) / 1000;
  return [[r(x0), r(y0), r(z0)], [r(x1), r(y1), r(z1)]];
}

// ── Tolerant comparison ────────────────────────────────────────

/**
 * Compare a fresh fingerprint against a baseline. Returns null on match
 * or a human-readable failure message.
 *
 * - format + colors: exact match
 * - bbox: within 5e-3 mm on every corner
 * - triangleCount: within ±25% (manifold vs CGAL can re-triangulate)
 */
export function compareFingerprint(baseline, actual) {
  if (baseline.format !== actual.format) {
    return `format mismatch: baseline=${baseline.format} actual=${actual.format}`;
  }

  if (baseline.format === "3mf") {
    const bColors = (baseline.colors ?? []).join(",");
    const aColors = (actual.colors ?? []).join(",");
    if (bColors !== aColors) {
      return `color palette mismatch:\n  baseline: ${bColors}\n  actual:   ${aColors}`;
    }
  }

  const BBOX_TOL = 5e-3;
  for (let corner = 0; corner < 2; corner++) {
    for (let axis = 0; axis < 3; axis++) {
      const b = baseline.bbox[corner][axis];
      const a = actual.bbox[corner][axis];
      if (Math.abs(b - a) > BBOX_TOL) {
        return `bbox drift beyond ${BBOX_TOL} mm on corner ${corner}, axis ${"xyz"[axis]}:\n  baseline: ${b}\n  actual:   ${a}`;
      }
    }
  }

  if (baseline.triangleCount === 0 && actual.triangleCount > 0) {
    return `baseline had 0 triangles but actual has ${actual.triangleCount} — baseline may be stale`;
  }
  if (actual.triangleCount === 0) {
    return `actual has 0 triangles — build produced empty output`;
  }
  const ratio = actual.triangleCount / baseline.triangleCount;
  if (ratio < 0.75 || ratio > 1.25) {
    return `triangle count drift beyond ±25%:\n  baseline: ${baseline.triangleCount}\n  actual:   ${actual.triangleCount} (${(ratio * 100).toFixed(1)}%)`;
  }

  return null;
}
