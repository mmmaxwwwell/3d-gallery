import { describe, it, expect } from 'vitest';
import { groupPrintObjects, printObjectsXml, splitSolids, type IndexedMesh } from '../src/print-objects.ts';

/** An axis-aligned box as 12 triangles. */
function box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): IndexedMesh {
  const vertices: IndexedMesh['vertices'] = [];
  for (const z of [z0, z1]) for (const y of [y0, y1]) for (const x of [x0, x1]) vertices.push([x, y, z]);
  const quads = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
  return { vertices, triangles: quads.flatMap(([a, b, c, d]) => [[a, b, c], [a, c, d]] as IndexedMesh['triangles']) };
}

function join(...meshes: IndexedMesh[]): IndexedMesh {
  const out: IndexedMesh = { vertices: [], triangles: [] };
  for (const m of meshes) {
    const base = out.vertices.length;
    out.vertices.push(...m.vertices);
    out.triangles.push(...m.triangles.map(([a, b, c]) => [a + base, b + base, c + base] as [number, number, number]));
  }
  return out;
}

const palette = [
  { hex: '#2F3542FF', label: 'body' },
  { hex: '#FF4757FF', label: 'seal' },
];

describe('splitSolids', () => {
  it('splits a mesh into the shells that share no vertex', () => {
    const solids = splitSolids(join(box(0, 0, 0, 1, 1, 1), box(5, 0, 0, 6, 1, 1)));
    expect(solids).toHaveLength(2);
    expect(solids.map((s) => s.triangles.length)).toEqual([12, 12]);
    expect(solids[1].vertices.every(([x]) => x >= 5)).toBe(true);
  });
});

describe('groupPrintObjects', () => {
  // Two bodies side by side on a plate, each with its seal printed on top.
  const bodies = join(box(0, 0, 0, 10, 10, 5), box(20, 0, 0, 30, 10, 5));
  const seals = join(box(2, 2, 5, 8, 8, 6), box(22, 2, 5, 28, 8, 6));

  it('makes one object per body, its seal a second part', () => {
    const objects = groupPrintObjects([bodies, seals]);
    expect(objects).toHaveLength(2);
    for (const o of objects) expect(o.parts.map((p) => p.color)).toEqual([0, 1]);
    expect(objects[0].parts[1].mesh.vertices.every(([x]) => x < 10)).toBe(true);
    expect(objects[1].parts[1].mesh.vertices.every(([x]) => x > 20)).toBe(true);
  });

  it('keeps a lone single-colour piece a one-part object', () => {
    const objects = groupPrintObjects([join(bodies, box(50, 0, 0, 51, 1, 1)), seals]);
    expect(objects.map((o) => o.parts.length)).toEqual([2, 2, 1]);
  });

  it('merges every piece of a colour inside one object into one part', () => {
    const inlays = join(box(1, 1, 5, 2, 2, 6), box(4, 4, 5, 5, 5, 6));
    const [object] = groupPrintObjects([box(0, 0, 0, 10, 10, 5), inlays]);
    expect(object.parts[1].mesh.triangles).toHaveLength(24);
  });

  it('puts everything in one object when asked', () => {
    expect(groupPrintObjects([bodies, seals], { single: true })).toHaveLength(1);
  });

  it('drops colours that drew nothing', () => {
    expect(groupPrintObjects([bodies, { vertices: [], triangles: [] }], { single: true })[0].parts)
      .toHaveLength(1);
  });
});

describe('printObjectsXml', () => {
  const objects = groupPrintObjects([
    join(box(0, 0, 0, 10, 10, 5), box(20, 0, 0, 30, 10, 5), box(50, 0, 0, 60, 10, 5)),
    join(box(2, 2, 5, 8, 8, 6), box(22, 2, 5, 28, 8, 6)),
  ]);
  const { model, settings } = printObjectsXml(palette, objects);

  it('builds one item per object, a components object for each multi-part one', () => {
    expect(model.match(/<item /g)).toHaveLength(3);
    expect(model.match(/<components>/g)).toHaveLength(2);
    expect(model.match(/<colorgroup /g)).toHaveLength(2);
  });

  it('defines every mesh before the components that use it', () => {
    const firstComponents = model.indexOf('<components>');
    for (const [, id] of model.matchAll(/<component objectid="(\d+)"/g)) {
      expect(model.indexOf(`<object id="${id}"`)).toBeLessThan(firstComponents);
    }
  });

  it('names each object after its biggest part and pins each part to its colour', () => {
    expect(settings.match(/<object id=/g)).toHaveLength(3);
    expect(settings).toMatch(/<metadata key="name" value="seal" \/>\s*<metadata key="extruder" value="2" \/>/);
    const objectNames = [...settings.matchAll(/<object id="\d+">\s*<metadata key="name" value="([^"]+)"/g)].map((m) => m[1]);
    expect(objectNames).toEqual(['body', 'body', 'body']);
  });

  it('puts a part on its palette entry\'s slot when it has one', () => {
    const pinned = printObjectsXml([{ ...palette[0], extruder: 3 }, { ...palette[1], extruder: 4 }], objects).settings;
    expect(pinned).toMatch(/<metadata key="name" value="seal" \/>\s*<metadata key="extruder" value="4" \/>/);
    expect(pinned).not.toMatch(/key="extruder" value="[12]"/);
  });

  it('refuses an empty render', () => {
    expect(() => printObjectsXml(palette, [])).toThrow(/No geometry/);
  });
});
