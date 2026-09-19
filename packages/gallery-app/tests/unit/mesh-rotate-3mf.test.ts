// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { zipSync } from 'fflate';
import { meshBbox, meshBboxRotated, rotateMesh, type Bbox3, type Quat } from '../../src/print/mesh-bounds.js';

function axisAngle(ax: number, ay: number, az: number, deg: number): Quat {
  const half = (deg * Math.PI) / 180 / 2;
  const s = Math.sin(half);
  return { x: ax * s, y: ay * s, z: az * s, w: Math.cos(half) };
}

/** Minimal 3MF: one box object per entry, each placed by a build item.
 *  `transform` mirrors what a slicer-authored file looks like. */
function makeThreeMf(
  boxes: Array<{ w: number; d: number; h: number; transform?: string }>,
  opts: { withBuild?: boolean } = {},
): ArrayBuffer {
  const withBuild = opts.withBuild ?? true;
  const objects = boxes.map(({ w, d, h }, i) => {
    const v = [
      [0, 0, 0], [w, 0, 0], [w, d, 0], [0, d, 0],
      [0, 0, h], [w, 0, h], [w, d, h], [0, d, h],
    ];
    const verts = v.map(([x, y, z]) => `<vertex x="${x}" y="${y}" z="${z}"/>`).join('');
    const tris = [
      [0, 3, 2], [0, 2, 1], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4],
      [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7],
    ].map(([a, b, c]) => `<triangle v1="${a}" v2="${b}" v3="${c}"/>`).join('');
    return `<object id="${i + 1}" type="model"><mesh><vertices>${verts}</vertices><triangles>${tris}</triangles></mesh></object>`;
  }).join('');
  const items = boxes.map((b, i) =>
    `<item objectid="${i + 1}"${b.transform ? ` transform="${b.transform}"` : ''} />`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter">`
    + `<resources>${objects}</resources>${withBuild ? `<build>${items}</build>` : ''}</model>`;
  const files = {
    '[Content_Types].xml': new TextEncoder().encode('<Types/>'),
    '3D/3dmodel.model': new TextEncoder().encode(xml),
  };
  return zipSync(files).buffer as ArrayBuffer;
}

function dims(b: Bbox3 | null): [number, number, number] {
  if (!b) throw new Error('no bbox');
  return [b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ];
}

function expectDims(b: Bbox3 | null, want: [number, number, number]): void {
  const got = dims(b);
  for (let i = 0; i < 3; i++) expect(got[i]).toBeCloseTo(want[i], 3);
}

describe('3MF rotation', () => {
  it('measures a rotated single-item file', () => {
    const mf = makeThreeMf([{ w: 2, d: 4, h: 6 }]);
    expectDims(meshBbox(mf, '3mf'), [2, 4, 6]);
    expectDims(meshBboxRotated(mf, '3mf', axisAngle(0, 0, 1, 90)), [4, 2, 6]);
  });

  it('bakes the rotation by composing into the build item transform', () => {
    const mf = makeThreeMf([{ w: 2, d: 4, h: 6 }]);
    const rotated = rotateMesh(mf, '3mf', axisAngle(0, 0, 1, 90));
    expect(rotated).not.toBeNull();
    expectDims(meshBbox(rotated!, '3mf'), [4, 2, 6]);
  });

  it('respects an existing item transform rather than clobbering it', () => {
    // Item is pre-translated by (10, 20, 0); rotating must carry that along.
    const mf = makeThreeMf([{ w: 2, d: 4, h: 6, transform: '1 0 0 0 1 0 0 0 1 10 20 0' }]);
    const before = meshBbox(mf, '3mf')!;
    expect(before.minX).toBeCloseTo(10, 3);
    expect(before.minY).toBeCloseTo(20, 3);

    const q = axisAngle(0, 0, 1, 90);
    const measured = meshBboxRotated(mf, '3mf', q)!;
    const baked = meshBbox(rotateMesh(mf, '3mf', q)!, '3mf')!;
    expectDims(baked, dims(measured));
    // The pre-translation rotates with the part: (10,20) -> (-20,10).
    expect(baked.minX).toBeCloseTo(-24, 3);
    expect(baked.minY).toBeCloseTo(10, 3);
  });

  it('keeps multi-object (multicolor) files together under one rotation', () => {
    const mf = makeThreeMf([{ w: 2, d: 4, h: 6 }, { w: 2, d: 4, h: 6, transform: '1 0 0 0 1 0 0 0 1 5 0 0' }]);
    const q = axisAngle(0, 0, 1, 90);
    expectDims(meshBbox(rotateMesh(mf, '3mf', q)!, '3mf'), dims(meshBboxRotated(mf, '3mf', q)));
  });

  it('rotates vertices directly when the file has no build section', () => {
    const mf = makeThreeMf([{ w: 2, d: 4, h: 6 }], { withBuild: false });
    const rotated = rotateMesh(mf, '3mf', axisAngle(0, 0, 1, 90));
    expect(rotated).not.toBeNull();
    expectDims(meshBbox(rotated!, '3mf'), [4, 2, 6]);
  });
});
