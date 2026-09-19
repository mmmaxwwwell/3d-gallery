// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import {
  IDENTITY_POSE,
  isIdentityPose,
  meshBbox,
  meshBboxPosed,
  transformMesh,
  type Bbox3,
  type MeshPose,
  type Quat,
} from '../../src/print/mesh-bounds.js';

function axisAngle(ax: number, ay: number, az: number, deg: number): Quat {
  const half = (deg * Math.PI) / 180 / 2;
  const s = Math.sin(half);
  return { x: ax * s, y: ay * s, z: az * s, w: Math.cos(half) };
}

function pose(rot: Quat, sx = 1, sy = 1, sz = 1): MeshPose {
  return { rot, scale: { x: sx, y: sy, z: sz } };
}

function asciiBox(w: number, d: number, h: number): ArrayBuffer {
  const v = [
    [0, 0, 0], [w, 0, 0], [w, d, 0], [0, d, 0],
    [0, 0, h], [w, 0, h], [w, d, h], [0, d, h],
  ];
  // Every facet is written with a +Z normal. Geometrically that is a lie, but
  // it makes "where did +Z end up?" answerable for every facet in the file.
  const tris: Array<[number, number, number]> = [
    [0, 3, 2], [0, 2, 1], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4],
    [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7],
  ];
  let out = 'solid box\n';
  for (const [a, b, c] of tris) {
    out += '  facet normal 0.000000 0.000000 1.000000\n    outer loop\n';
    for (const idx of [a, b, c]) {
      out += `      vertex ${v[idx][0].toFixed(6)} ${v[idx][1].toFixed(6)} ${v[idx][2].toFixed(6)}\n`;
    }
    out += '    endloop\n  endfacet\n';
  }
  return new TextEncoder().encode(out + 'endsolid box\n').buffer as ArrayBuffer;
}

function dims(b: Bbox3 | null): [number, number, number] {
  if (!b) throw new Error('no bbox');
  return [b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ];
}

function expectDims(b: Bbox3 | null, want: [number, number, number]): void {
  const got = dims(b);
  for (let i = 0; i < 3; i++) expect(got[i]).toBeCloseTo(want[i], 3);
}

describe('isIdentityPose', () => {
  it('separates a real pose from the identity', () => {
    expect(isIdentityPose(IDENTITY_POSE)).toBe(true);
    expect(isIdentityPose(undefined)).toBe(true);
    expect(isIdentityPose(pose(IDENTITY_POSE.rot, 2, 2, 2))).toBe(false);
    expect(isIdentityPose(pose(axisAngle(0, 0, 1, 90)))).toBe(false);
  });
});

describe('meshBboxPosed', () => {
  it('scales the bbox uniformly', () => {
    expectDims(meshBboxPosed(asciiBox(2, 4, 6), 'stl', pose(IDENTITY_POSE.rot, 2, 2, 2)), [4, 8, 12]);
  });

  it('scales per axis', () => {
    expectDims(meshBboxPosed(asciiBox(2, 4, 6), 'stl', pose(IDENTITY_POSE.rot, 3, 1, 0.5)), [6, 4, 3]);
  });

  it('scales in the object axes, then rotates', () => {
    // Stretch X by 3 (2 -> 6), then turn 90 deg about Z: the stretched axis
    // becomes Y. Rotating first and then scaling world-X would give 12 x 2.
    const p = pose(axisAngle(0, 0, 1, 90), 3, 1, 1);
    expectDims(meshBboxPosed(asciiBox(2, 4, 6), 'stl', p), [4, 6, 6]);
  });
});

describe('transformMesh', () => {
  it('bakes scale into the bytes', () => {
    const baked = transformMesh(asciiBox(2, 4, 6), 'stl', pose(IDENTITY_POSE.rot, 2, 2, 2));
    expectDims(meshBbox(baked!, 'stl'), [4, 8, 12]);
  });

  it('agrees with meshBboxPosed for a combined pose', () => {
    const stl = asciiBox(2, 4, 6);
    const p = pose(axisAngle(1, 0, 0, 90), 1.5, 2, 0.5);
    expectDims(meshBbox(transformMesh(stl, 'stl', p)!, 'stl'), dims(meshBboxPosed(stl, 'stl', p)));
  });

  it('keeps normals unit-length and correct under uniform scale', () => {
    const baked = transformMesh(asciiBox(2, 4, 6), 'stl', pose(axisAngle(1, 0, 0, 90), 2, 2, 2));
    const text = new TextDecoder().decode(new Uint8Array(baked!));
    for (const n of text.matchAll(/facet normal\s+(\S+)\s+(\S+)\s+(\S+)/g)) {
      expect(Math.hypot(+n[1], +n[2], +n[3])).toBeCloseTo(1, 5);
      expect(+n[2]).toBeCloseTo(-1, 5); // +Z rotated 90 deg about X -> -Y
    }
  });

  it('keeps an axis-aligned normal axis-aligned under non-uniform scale', () => {
    // A +Z face stays a +Z face when X and Y are stretched; a naive
    // vertex-matrix normal would come out scaled but still +Z, so the real
    // check is that it is unit length and has not acquired X/Y components.
    const baked = transformMesh(asciiBox(2, 4, 6), 'stl', pose(IDENTITY_POSE.rot, 4, 0.25, 1));
    const text = new TextDecoder().decode(new Uint8Array(baked!));
    const normals = [...text.matchAll(/facet normal\s+(\S+)\s+(\S+)\s+(\S+)/g)];
    expect(normals.length).toBe(12);
    for (const n of normals) {
      expect(+n[1]).toBeCloseTo(0, 5);
      expect(+n[2]).toBeCloseTo(0, 5);
      expect(+n[3]).toBeCloseTo(1, 5);
    }
  });

  it('rejects a degenerate pose instead of emitting flat geometry', () => {
    expect(transformMesh(asciiBox(2, 4, 6), 'stl', pose(IDENTITY_POSE.rot, 1, 1, 0))).toBeNull();
  });

  it('is a no-op for the identity pose', () => {
    const stl = asciiBox(2, 4, 6);
    expect(transformMesh(stl, 'stl', IDENTITY_POSE)).toBe(stl);
  });
});
