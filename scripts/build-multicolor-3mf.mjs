#!/usr/bin/env node
// Build a multi-color 3MF from an OpenSCAD file that uses top-level color()
// calls. The approach:
//
//   1. Parse the .scad text for `color("name")` and `color([r,g,b,a])` literals.
//      Use the unique set as our color palette.
//   2. For each color, render a "masked" version of the .scad where only that
//      color's subtree contributes geometry. The mask is implemented by
//      injecting an OpenSCAD wrapper module that overrides `color()` to
//      render its children only when the color matches a `selected_color`
//      variable passed on the CLI via `-D`.
//   3. Merge the per-color STLs into a single 3MF with <colorgroup> metadata.
//      One <object> per color, each pid'd to its colorgroup. Browser-side
//      ThreeMFLoader assigns vertex colors based on that.
//
// This is a CLI port of the techniques used in
// openscad-web-generator/src/lib/merge-3mf.ts.

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFile } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { zipSync } from "fflate";

const execFileAsync = promisify(execFile);

// ---------- color parsing ----------

const NAMED_COLORS = {
  red: [1, 0, 0, 1], green: [0, 0.5, 0, 1], blue: [0, 0, 1, 1],
  cyan: [0, 1, 1, 1], magenta: [1, 0, 1, 1], yellow: [1, 1, 0, 1],
  white: [1, 1, 1, 1], black: [0, 0, 0, 1],
  gray: [0.5, 0.5, 0.5, 1], grey: [0.5, 0.5, 0.5, 1],
  lightgray: [0.83, 0.83, 0.83, 1], lightgrey: [0.83, 0.83, 0.83, 1],
  darkgray: [0.66, 0.66, 0.66, 1], darkgrey: [0.66, 0.66, 0.66, 1],
  silver: [0.75, 0.75, 0.75, 1],
  orange: [1, 0.65, 0, 1],
  pink: [1, 0.75, 0.8, 1],
  purple: [0.5, 0, 0.5, 1],
  brown: [0.65, 0.16, 0.16, 1],
  lime: [0, 1, 0, 1],
  navy: [0, 0, 0.5, 1],
  teal: [0, 0.5, 0.5, 1],
  olive: [0.5, 0.5, 0, 1],
  maroon: [0.5, 0, 0, 1],
};

function parseColorLiteral(raw) {
  // Returns canonical key + RGBA tuple, or null if unparseable.
  raw = raw.trim();
  // Named: "red", "blue", etc.
  const nameMatch = raw.match(/^"([a-zA-Z]+)"$/);
  if (nameMatch) {
    const name = nameMatch[1].toLowerCase();
    if (NAMED_COLORS[name]) {
      return { key: `name:${name}`, rgba: NAMED_COLORS[name] };
    }
    return null;
  }
  // Hex: "#RRGGBB" or "#RRGGBBAA"
  const hexMatch = raw.match(/^"#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})"$/);
  if (hexMatch) {
    const h = hexMatch[1];
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { key: `hex:#${h.toLowerCase()}`, rgba: [r, g, b, a] };
  }
  // Array literal: [r, g, b] or [r, g, b, a]
  const arr = raw.match(/^\[\s*([0-9.\-]+)\s*,\s*([0-9.\-]+)\s*,\s*([0-9.\-]+)\s*(?:,\s*([0-9.\-]+)\s*)?\]$/);
  if (arr) {
    const r = parseFloat(arr[1]), g = parseFloat(arr[2]), b = parseFloat(arr[3]);
    const a = arr[4] !== undefined ? parseFloat(arr[4]) : 1;
    return { key: `rgba:${r},${g},${b},${a}`, rgba: [r, g, b, a] };
  }
  return null;
}

function extractColors(scadSource) {
  // Scan for `color(<literal>)` calls. We only care about uniqueness, not order.
  // The argument can be a name string, hex string, or array literal.
  const re = /\bcolor\s*\(\s*("[^"]*"|\[[^\]]*\])\s*[,)\s]/g;
  const seen = new Map(); // key → rgba
  let m;
  while ((m = re.exec(scadSource)) !== null) {
    const parsed = parseColorLiteral(m[1]);
    if (parsed && !seen.has(parsed.key)) {
      seen.set(parsed.key, parsed.rgba);
    }
  }
  return [...seen.entries()].map(([key, rgba]) => ({ key, rgba }));
}

// ---------- per-color render ----------

let _passCounter = 0;

async function renderColorPass({ scadPath, selectedKey, outStl }) {
  const wrapperSource = `
_selected_color_key = "${selectedKey}";

// Build a canonical key string from a color argument the same way the JS
// parser does. Returns the string or "" for unrecognized inputs.
function _color_key(c) =
    is_string(c) ?
        (len(c) > 0 && c[0] == "#" ?
            str("hex:", _lowercase(c))
          : str("name:", _lowercase(c)))
      : is_list(c) ?
            (len(c) == 3 ?
                str("rgba:", c[0], ",", c[1], ",", c[2], ",1")
              : len(c) == 4 ?
                  str("rgba:", c[0], ",", c[1], ",", c[2], ",", c[3])
                : "")
      : "";

function _lowercase(s) = chr([for (i = [0:len(s)-1])
    let(code = ord(s[i]))
    (code >= 65 && code <= 90) ? code + 32 : code]);

// Override built-in color() with a module that masks geometry by selection.
module color(c, alpha = 1) {
    if (_color_key(c) == _selected_color_key) children();
}

include <${basename(scadPath)}>;
`;
  const passId = `_pass_${process.pid}_${++_passCounter}`;
  const sideBySide = join(dirname(scadPath), `${passId}.scad`);
  writeFileSync(sideBySide, wrapperSource);

  try {
    await execFileAsync("openscad", ["-o", outStl, sideBySide]);
  } finally {
    rmSync(sideBySide, { force: true });
  }
}

// ---------- STL parsing ----------

function parseStl(path) {
  const buf = readFileSync(path);
  const isAscii = buf.slice(0, 5).toString("ascii") === "solid"
    && (buf.length < 84
        || buf.length !== 84 + buf.readUInt32LE(80) * 50);
  return isAscii ? parseAsciiStl(buf.toString("ascii"))
                 : parseBinaryStl(buf);
}

function parseBinaryStl(buf) {
  const triCount = buf.readUInt32LE(80);
  const vertices = [];
  const triangles = [];
  const vIndex = new Map();
  function addVert(x, y, z) {
    const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
    let idx = vIndex.get(key);
    if (idx === undefined) {
      idx = vertices.length;
      vertices.push([x, y, z]);
      vIndex.set(key, idx);
    }
    return idx;
  }
  let off = 84;
  for (let i = 0; i < triCount; i++) {
    off += 12; // skip normal
    const tri = [];
    for (let j = 0; j < 3; j++) {
      tri.push(addVert(
        buf.readFloatLE(off),
        buf.readFloatLE(off + 4),
        buf.readFloatLE(off + 8)));
      off += 12;
    }
    off += 2; // attribute bytes
    triangles.push(tri);
  }
  return { vertices, triangles };
}

function parseAsciiStl(text) {
  const vertices = [];
  const triangles = [];
  const vIndex = new Map();
  function addVert(x, y, z) {
    const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
    let idx = vIndex.get(key);
    if (idx === undefined) {
      idx = vertices.length;
      vertices.push([x, y, z]);
      vIndex.set(key, idx);
    }
    return idx;
  }
  const facetRe = /facet\s+normal\s+\S+\s+\S+\s+\S+\s+outer\s+loop\s+vertex\s+(\S+)\s+(\S+)\s+(\S+)\s+vertex\s+(\S+)\s+(\S+)\s+(\S+)\s+vertex\s+(\S+)\s+(\S+)\s+(\S+)\s+endloop\s+endfacet/g;
  let m;
  while ((m = facetRe.exec(text)) !== null) {
    const tri = [
      addVert(+m[1], +m[2], +m[3]),
      addVert(+m[4], +m[5], +m[6]),
      addVert(+m[7], +m[8], +m[9]),
    ];
    triangles.push(tri);
  }
  return { vertices, triangles };
}

// ---------- 3MF assembly ----------

function rgbaToHex(rgba) {
  const linearToSrgb = (v) => v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1/2.4) - 0.055;
  const c = (v) => Math.round(Math.max(0, Math.min(1, linearToSrgb(v))) * 255)
                       .toString(16).padStart(2, "0").toUpperCase();
  return `#${c(rgba[0])}${c(rgba[1])}${c(rgba[2])}${c(rgba[3])}`;
}

function build3mf(perColorMeshes) {
  // perColorMeshes: [{ key, rgba, mesh:{vertices,triangles} }]
  let nextId = 1;
  const colorGroups = [];
  const objects = [];
  for (const entry of perColorMeshes) {
    if (entry.mesh.triangles.length === 0) continue;
    const cgId = nextId++;
    colorGroups.push({ id: cgId, hex: rgbaToHex(entry.rgba), label: entry.key });
    const objId = nextId++;
    objects.push({ id: objId, pid: cgId, mesh: entry.mesh });
  }
  if (objects.length === 0) throw new Error("No geometry produced for any color");

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">',
    '  <metadata name="Application">3D Gallery</metadata>',
    '  <resources>',
  ];
  for (const cg of colorGroups) {
    lines.push(`    <colorgroup id="${cg.id}">`);
    lines.push(`      <color color="${cg.hex}" />`);
    lines.push(`    </colorgroup>`);
  }
  for (const obj of objects) {
    lines.push(`    <object id="${obj.id}" type="model" pid="${obj.pid}" pindex="0">`);
    lines.push('      <mesh>');
    lines.push('        <vertices>');
    for (const v of obj.mesh.vertices) {
      lines.push(`          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`);
    }
    lines.push('        </vertices>');
    lines.push('        <triangles>');
    for (const t of obj.mesh.triangles) {
      lines.push(`          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />`);
    }
    lines.push('        </triangles>');
    lines.push('      </mesh>');
    lines.push('    </object>');
  }
  lines.push('  </resources>');
  lines.push('  <build>');
  for (const obj of objects) {
    lines.push(`    <item objectid="${obj.id}" />`);
  }
  lines.push('  </build>');
  lines.push('</model>');
  const modelXml = lines.join("\n");

  const contentTypes = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />',
    '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />',
    '</Types>',
  ].join("\n");
  const rels = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />',
    '</Relationships>',
  ].join("\n");

  const enc = new TextEncoder();
  return zipSync({
    "[Content_Types].xml": enc.encode(contentTypes),
    "_rels": { ".rels": enc.encode(rels) },
    "3D": { "3dmodel.model": enc.encode(modelXml) },
  });
}

// ---------- entry point ----------

export async function buildMulticolor3mf({ scadPath, outPath }) {
  const source = readFileSync(scadPath, "utf8");
  const colors = extractColors(source);
  if (colors.length === 0) {
    throw new Error(`No top-level color() calls in ${scadPath}; cannot build multi-color 3MF.`);
  }

  const tmpDir = mkdtempSync(join(tmpdir(), "3dgallery-passes-"));
  try {
    // Render all color passes in parallel
    const jobs = colors.map(({ key, rgba }) => {
      const safeName = key.replace(/[^a-z0-9]/gi, "_");
      const outStl = join(tmpDir, `${safeName}.stl`);
      return renderColorPass({ scadPath, selectedKey: key, outStl })
        .then(() => ({ key, rgba, mesh: parseStl(outStl) }));
    });
    const perColorMeshes = await Promise.all(jobs);
    const zipped = build3mf(perColorMeshes);
    writeFileSync(outPath, zipped);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

// CLI usage: node build-multicolor-3mf.mjs <input.scad> <output.3mf>
if (import.meta.url === `file://${process.argv[1]}`) {
  const [scadPath, outPath] = process.argv.slice(2);
  if (!scadPath || !outPath) {
    console.error("usage: build-multicolor-3mf.mjs <input.scad> <output.3mf>");
    process.exit(1);
  }
  buildMulticolor3mf({ scadPath, outPath });
}
