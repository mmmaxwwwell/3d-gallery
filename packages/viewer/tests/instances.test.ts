import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { assignAnchors, splitConnectedComponents } from '../src/viewer.ts';

/** Two unit cubes `gap` apart along X, merged into one unindexed geometry the way a colour pass arrives. */
function twoCubes(gap: number): THREE.BufferGeometry {
  const a = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
  const b = new THREE.BoxGeometry(1, 1, 1).toNonIndexed().translate(1 + gap, 0, 0);
  const positions = [...a.getAttribute('position').array, ...b.getAttribute('position').array];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

function box(min: [number, number, number], max: [number, number, number]): THREE.Box3 {
  return new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max));
}

describe('splitConnectedComponents', () => {
  it('separates solids that do not touch', () => {
    const shells = splitConnectedComponents(twoCubes(0.5));
    expect(shells).toHaveLength(2);
    const centres = shells.map((g) => {
      g.computeBoundingBox();
      return g.boundingBox!.getCenter(new THREE.Vector3()).x;
    }).sort((p, q) => p - q);
    expect(centres[0]).toBeCloseTo(0);
    expect(centres[1]).toBeCloseTo(1.5);
  });

  it('keeps solids that share vertices together', () => {
    expect(splitConnectedComponents(twoCubes(0))).toHaveLength(1);
  });
});

describe('assignAnchors', () => {
  const left = { item: 'left', box: box([-10, -1, -1], [-2, 1, 1]) };
  const right = { item: 'right', box: box([2, -1, -1], [10, 1, 1]) };

  it('gives each anchor the piece it sits in', () => {
    const got = assignAnchors(
      [{ id: 'B1', at: [-6, 0, 0] }, { id: 'B2', at: [6, 0, 0] }],
      () => [left, right],
    );
    expect(Object.fromEntries(got)).toEqual({ B1: 'left', B2: 'right' });
  });

  it('prefers the nearest centre where bounds overlap', () => {
    // A long piece whose bounds swallow a short one's.
    const long = { item: 'long', box: box([-10, -1, -1], [10, 1, 1]) };
    const short = { item: 'short', box: box([4, -1, -1], [8, 1, 1]) };
    const got = assignAnchors(
      [{ id: 'L', at: [0, 0, 0] }, { id: 'S', at: [6, 0, 0] }],
      () => [long, short],
    );
    expect(Object.fromEntries(got)).toEqual({ L: 'long', S: 'short' });
  });

  it('drops anchors that share one fused piece instead of guessing', () => {
    const fused = { item: 'fused', box: box([-10, -1, -1], [10, 1, 1]) };
    const got = assignAnchors(
      [{ id: 'T1', at: [-5, 0, 0] }, { id: 'T2', at: [5, 0, 0] }],
      () => [fused],
    );
    expect(got.size).toBe(0);
  });

  it('leaves out an anchor that lies in no piece', () => {
    const got = assignAnchors([{ id: 'X', at: [0, 5, 0] }], () => [left, right]);
    expect(got.size).toBe(0);
  });

  it('only considers the candidates offered for that id', () => {
    const got = assignAnchors(
      [{ id: 'B1', at: [-6, 0, 0] }],
      (id) => (id === 'B1' ? [right] : [left]),
    );
    expect(got.size).toBe(0);
  });
});
