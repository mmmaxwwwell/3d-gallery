/**
 * Print objects: which pieces of a multicolour render a slicer keeps together.
 *
 * Every builder renders one mesh per colour, so a print layout of four bodies,
 * each with its TPU seal printed in place, arrives as eight colour meshes.
 * Written as one 3MF object per colour, a slicer sees eight unrelated objects:
 * it arranges a seal away from its body, or offers to fuse the lot into one
 * object of eight parts. Which pieces belong together is geometric: each colour
 * mesh splits into its separate solids, and solids whose bounds touch or
 * overlap are one object. That object carries one part per colour, each on its
 * colour's extruder.
 *
 * The OpenSCAD source can't say this instead: the colour passes render a
 * flattened CSG, where the preview's own modules are gone.
 */

export type Vec3 = [number, number, number];

/** A triangle mesh whose vertices are welded by position. */
export interface IndexedMesh {
  vertices: Vec3[];
  triangles: Vec3[];
}

export interface PrintObject {
  /** One part per colour the object has, in palette order. `color` indexes the input. */
  parts: { color: number; mesh: IndexedMesh }[];
}

export interface PaletteEntry {
  /** `#RRGGBBAA`. */
  hex: string;
  /** The slicer's name for this colour's parts. */
  label: string;
  /** The filament slot, 1-based. Defaults to the colour's place in the palette (see extruders.ts). */
  extruder?: number;
}

/** Bounds closer than this (mm) count as touching: a seal printed onto its body. */
const TOUCH_MM = 0.01;

interface Box { min: Vec3; max: Vec3 }

interface Piece {
  color: number;
  mesh: IndexedMesh;
  box: Box;
}

function unionFind(n: number) {
  const parent = new Int32Array(n).map((_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => { parent[find(a)] = find(b); };
  return { find, union };
}

/** A mesh's separate solids: triangles joined through shared vertices. */
export function splitSolids(mesh: IndexedMesh): IndexedMesh[] {
  const { find, union } = unionFind(mesh.vertices.length);
  for (const [a, b, c] of mesh.triangles) {
    union(b, a);
    union(c, a);
  }
  const solids = new Map<number, { remap: Map<number, number>; mesh: IndexedMesh }>();
  for (const tri of mesh.triangles) {
    const root = find(tri[0]);
    let solid = solids.get(root);
    if (!solid) solids.set(root, (solid = { remap: new Map(), mesh: { vertices: [], triangles: [] } }));
    const s = solid;
    const local = (v: number) => {
      let i = s.remap.get(v);
      if (i === undefined) {
        i = s.mesh.vertices.length;
        s.mesh.vertices.push(mesh.vertices[v]);
        s.remap.set(v, i);
      }
      return i;
    };
    s.mesh.triangles.push([local(tri[0]), local(tri[1]), local(tri[2])]);
  }
  return [...solids.values()].map((s) => s.mesh);
}

function boundsOf(mesh: IndexedMesh): Box {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const v of mesh.vertices) {
    for (let k = 0; k < 3; k++) {
      if (v[k] < min[k]) min[k] = v[k];
      if (v[k] > max[k]) max[k] = v[k];
    }
  }
  return { min, max };
}

function touches(a: Box, b: Box): boolean {
  for (let k = 0; k < 3; k++) {
    if (a.min[k] > b.max[k] + TOUCH_MM || b.min[k] > a.max[k] + TOUCH_MM) return false;
  }
  return true;
}

function concat(meshes: IndexedMesh[]): IndexedMesh {
  if (meshes.length === 1) return meshes[0];
  const out: IndexedMesh = { vertices: [], triangles: [] };
  for (const m of meshes) {
    const base = out.vertices.length;
    out.vertices.push(...m.vertices);
    for (const [a, b, c] of m.triangles) out.triangles.push([a + base, b + base, c + base]);
  }
  return out;
}

/**
 * Group per-colour meshes into print objects. `single` makes everything one
 * object: a multi-material part whose colours may not touch (an inlay floating
 * in a recess) but must never be arranged apart.
 */
export function groupPrintObjects(colorMeshes: IndexedMesh[], { single = false } = {}): PrintObject[] {
  if (single) {
    const parts = colorMeshes
      .map((mesh, color) => ({ color, mesh }))
      .filter((p) => p.mesh.triangles.length > 0);
    return parts.length ? [{ parts }] : [];
  }

  const pieces: Piece[] = [];
  colorMeshes.forEach((mesh, color) => {
    for (const solid of splitSolids(mesh)) pieces.push({ color, mesh: solid, box: boundsOf(solid) });
  });

  // Sweep along x so a plate of hundreds of pieces isn't compared all-pairs.
  const { find, union } = unionFind(pieces.length);
  const byMinX = pieces.map((_, i) => i).sort((a, b) => pieces[a].box.min[0] - pieces[b].box.min[0]);
  for (let i = 0; i < byMinX.length; i++) {
    const a = pieces[byMinX[i]];
    for (let j = i + 1; j < byMinX.length; j++) {
      const b = pieces[byMinX[j]];
      if (b.box.min[0] > a.box.max[0] + TOUCH_MM) break;
      if (touches(a.box, b.box)) union(byMinX[i], byMinX[j]);
    }
  }

  // Objects in order of their first piece; parts in palette order.
  const groups = new Map<number, Map<number, IndexedMesh[]>>();
  pieces.forEach((piece, i) => {
    const root = find(i);
    let byColor = groups.get(root);
    if (!byColor) groups.set(root, (byColor = new Map()));
    const list = byColor.get(piece.color);
    if (list) list.push(piece.mesh);
    else byColor.set(piece.color, [piece.mesh]);
  });
  return [...groups.values()].map((byColor) => ({
    parts: [...byColor.entries()]
      .sort(([a], [b]) => a - b)
      .map(([color, meshes]) => ({ color, mesh: concat(meshes) })),
  }));
}

/** A closed mesh's volume (mm³), by the divergence theorem. */
function volumeOf({ vertices, triangles }: IndexedMesh): number {
  let six = 0;
  for (const [i, j, k] of triangles) {
    const [a, b, c] = [vertices[i], vertices[j], vertices[k]];
    six += a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  }
  return Math.abs(six) / 6;
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * The 3MF model XML and the slicer's `Metadata/model_settings.config` for a set
 * of print objects. A one-part object is a plain mesh object; a multi-part one
 * is a components object over one mesh object per part, which Bambu Studio and
 * OrcaSlicer read, with model_settings, as one object of several parts. Each
 * part's extruder is its palette entry's slot, or else its colour's place in the palette: the <colorgroup> tint
 * is only for display, slicers assign filaments from model_settings.
 */
export function printObjectsXml(
  palette: PaletteEntry[],
  objects: PrintObject[],
): { model: string; settings: string } {
  if (objects.length === 0) throw new Error('No geometry produced for any color');

  let nextId = 1;
  const used = [...new Set(objects.flatMap((o) => o.parts.map((p) => p.color)))].sort((a, b) => a - b);
  const groupId = new Map<number, number>();
  for (const color of used) groupId.set(color, nextId++);

  const resources: string[] = [];
  for (const color of used) {
    resources.push(`    <colorgroup id="${groupId.get(color)}">`);
    resources.push(`      <color color="${palette[color].hex}" />`);
    resources.push('    </colorgroup>');
  }

  // Ids first, so every mesh object is written before the components that use it.
  const placed = objects.map((object) => {
    const parts = object.parts.map((part) => ({ ...part, id: nextId++ }));
    return { parts, id: parts.length === 1 ? parts[0].id : nextId++ };
  });

  for (const object of placed) {
    for (const part of object.parts) {
      resources.push(`    <object id="${part.id}" type="model" pid="${groupId.get(part.color)}" pindex="0">`);
      resources.push('      <mesh>');
      resources.push('        <vertices>');
      for (const v of part.mesh.vertices) resources.push(`          <vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`);
      resources.push('        </vertices>');
      resources.push('        <triangles>');
      for (const t of part.mesh.triangles) resources.push(`          <triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}" />`);
      resources.push('        </triangles>');
      resources.push('      </mesh>');
      resources.push('    </object>');
    }
  }
  for (const object of placed) {
    if (object.parts.length === 1) continue;
    resources.push(`    <object id="${object.id}" type="model">`);
    resources.push('      <components>');
    for (const part of object.parts) resources.push(`        <component objectid="${part.id}" />`);
    resources.push('      </components>');
    resources.push('    </object>');
  }

  const model = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">',
    '  <metadata name="Application">3D Gallery</metadata>',
    '  <resources>',
    ...resources,
    '  </resources>',
    '  <build>',
    ...placed.map((o) => `    <item objectid="${o.id}" />`),
    '  </build>',
    '</model>',
  ].join('\n');

  const extruder = (color: number) => palette[color].extruder ?? color + 1;
  const settings = ['<?xml version="1.0" encoding="UTF-8"?>', '<config>'];
  for (const object of placed) {
    // Name the object after its biggest part: the body, not the seal.
    const main = object.parts.length === 1
      ? object.parts[0]
      : object.parts.map((p) => ({ p, v: volumeOf(p.mesh) })).reduce((a, b) => (b.v > a.v ? b : a)).p;
    settings.push(`  <object id="${object.id}">`);
    settings.push(`    <metadata key="name" value="${escXml(palette[main.color].label)}" />`);
    settings.push(`    <metadata key="extruder" value="${extruder(main.color)}" />`);
    for (const part of object.parts) {
      // A plain mesh object's single volume is part 0; a component's is its object id.
      settings.push(`    <part id="${object.parts.length === 1 ? 0 : part.id}" subtype="normal_part">`);
      settings.push(`      <metadata key="name" value="${escXml(palette[part.color].label)}" />`);
      settings.push(`      <metadata key="extruder" value="${extruder(part.color)}" />`);
      settings.push('    </part>');
    }
    settings.push('  </object>');
  }
  settings.push('</config>');

  return { model, settings: settings.join('\n') };
}
