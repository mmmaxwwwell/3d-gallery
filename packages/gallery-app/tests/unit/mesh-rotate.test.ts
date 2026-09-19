// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import {
  IDENTITY_QUAT,
  isIdentityQuat,
  meshBbox,
  meshBboxRotated,
  rotateMesh,
  type Bbox3,
  type Quat,
} from '../../src/print/mesh-bounds.js';

/** Quaternion for `deg` degrees about a unit axis. */
function axisAngle(ax: number, ay: number, az: number, deg: number): Quat {
  const half = (deg * Math.PI) / 180 / 2;
  const s = Math.sin(half);
  return { x: ax * s, y: ay * s, z: az * s, w: Math.cos(half) };
}

/** A 2x4x6 box as an ASCII STL — the shape the gallery's own artifacts take. */
function asciiBox(w: number, d: number, h: number): ArrayBuffer {
  const v = [
    [0, 0, 0], [w, 0, 0], [w, d, 0], [0, d, 0],
    [0, 0, h], [w, 0, h], [w, d, h], [0, d, h],
  ];
  const quads: Array<[number, number, number, number]> = [
    [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7],
  ];
  let out = 'solid box\n';
  for (const [a, b, c, dd] of quads) {
    for (const [i, j, k] of [[a, b, c], [a, c, dd]] as const) {
      out += '  facet normal 0.000000 0.000000 1.000000\n    outer loop\n';
      for (const idx of [i, j, k]) {
        out += `      vertex ${v[idx][0].toFixed(6)} ${v[idx][1].toFixed(6)} ${v[idx][2].toFixed(6)}\n`;
      }
      out += '    endloop\n  endfacet\n';
    }
  }
  return new TextEncoder().encode(out + 'endsolid box\n').buffer as ArrayBuffer;
}

function binaryBox(w: number, d: number, h: number): ArrayBuffer {
  const ascii = new TextDecoder().decode(new Uint8Array(asciiBox(w, d, h)));
  const tris = [...ascii.matchAll(/outer loop([\s\S]*?)endloop/g)].map((m) =>
    [...m[1].matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)].map((v) => [+v[1], +v[2], +v[3]]),
  );
  const buf = new ArrayBuffer(84 + tris.length * 50);
  const dv = new DataView(buf);
  dv.setUint32(80, tris.length, true);
  tris.forEach((tri, i) => {
    const base = 84 + i * 50 + 12;
    tri.forEach((p, vi) => {
      dv.setFloat32(base + vi * 12, p[0], true);
      dv.setFloat32(base + vi * 12 + 4, p[1], true);
      dv.setFloat32(base + vi * 12 + 8, p[2], true);
    });
  });
  return buf;
}

function dims(b: Bbox3 | null): [number, number, number] {
  if (!b) throw new Error('no bbox');
  return [b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ];
}

function expectDims(b: Bbox3 | null, want: [number, number, number]): void {
  const got = dims(b);
  for (let i = 0; i < 3; i++) expect(got[i]).toBeCloseTo(want[i], 3);
}

describe('isIdentityQuat', () => {
  it('accepts the identity and a missing rotation', () => {
    expect(isIdentityQuat(IDENTITY_QUAT)).toBe(true);
    expect(isIdentityQuat(undefined)).toBe(true);
    expect(isIdentityQuat(axisAngle(0, 0, 1, 90))).toBe(false);
  });
});

describe('meshBboxRotated', () => {
  it('swaps X and Y for a 90 degree turn about Z (ascii stl)', () => {
    const stl = asciiBox(2, 4, 6);
    expectDims(meshBbox(stl, 'stl'), [2, 4, 6]);
    expectDims(meshBboxRotated(stl, 'stl', axisAngle(0, 0, 1, 90)), [4, 2, 6]);
  });

  it('stands the box on its side for a 90 degree turn about X', () => {
    const stl = asciiBox(2, 4, 6);
    expectDims(meshBboxRotated(stl, 'stl', axisAngle(1, 0, 0, 90)), [2, 6, 4]);
  });

  it('measures the true rotated hull, not the rotated bbox, at 45 degrees', () => {
    // A rotated 2x4 footprint spans (2+4)/sqrt(2) ~= 4.243 on both axes.
    // Expanding the bbox corners instead would give the same number here, so
    // the check that matters is that it is not the naive 4 or 2.
    const [w, d] = dims(meshBboxRotated(asciiBox(2, 4, 6), 'stl', axisAngle(0, 0, 1, 45)));
    expect(w).toBeCloseTo(6 / Math.SQRT2, 3);
    expect(d).toBeCloseTo(6 / Math.SQRT2, 3);
  });

  it('handles binary stl the same as ascii', () => {
    const q = axisAngle(0, 0, 1, 90);
    expectDims(meshBboxRotated(binaryBox(2, 4, 6), 'stl', q), [4, 2, 6]);
  });

  it('returns the unrotated bbox for the identity quaternion', () => {
    expectDims(meshBboxRotated(asciiBox(2, 4, 6), 'stl', IDENTITY_QUAT), [2, 4, 6]);
  });
});

describe('rotateMesh', () => {
  it('bakes the rotation into ascii stl bytes', () => {
    const stl = asciiBox(2, 4, 6);
    const rotated = rotateMesh(stl, 'stl', axisAngle(0, 0, 1, 90));
    expect(rotated).not.toBeNull();
    expectDims(meshBbox(rotated!, 'stl'), [4, 2, 6]);
    expect(new TextDecoder().decode(new Uint8Array(rotated!))).toContain('facet normal');
  });

  it('rotates ascii stl facet normals along with the vertices', () => {
    const rotated = rotateMesh(asciiBox(2, 4, 6), 'stl', axisAngle(1, 0, 0, 90));
    const text = new TextDecoder().decode(new Uint8Array(rotated!));
    // Every normal started as +Z; a +90 turn about X sends +Z to -Y.
    const normals = [...text.matchAll(/facet normal\s+(\S+)\s+(\S+)\s+(\S+)/g)];
    expect(normals.length).toBeGreaterThan(0);
    for (const n of normals) {
      expect(+n[1]).toBeCloseTo(0, 5);
      expect(+n[2]).toBeCloseTo(-1, 5);
      expect(+n[3]).toBeCloseTo(0, 5);
    }
  });

  it('bakes the rotation into binary stl bytes', () => {
    const rotated = rotateMesh(binaryBox(2, 4, 6), 'stl', axisAngle(0, 0, 1, 90));
    expectDims(meshBbox(rotated!, 'stl'), [4, 2, 6]);
  });

  it('is a no-op for the identity quaternion', () => {
    const stl = asciiBox(2, 4, 6);
    expect(rotateMesh(stl, 'stl', IDENTITY_QUAT)).toBe(stl);
  });

  it('agrees with meshBboxRotated after baking', () => {
    const stl = asciiBox(2, 4, 6);
    const q = axisAngle(1, 1, 0, 35);
    const measured = meshBboxRotated(stl, 'stl', q);
    const baked = meshBbox(rotateMesh(stl, 'stl', q)!, 'stl');
    expectDims(baked, dims(measured));
  });
});
