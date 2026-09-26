// SPDX-License-Identifier: MIT
// A still of a plate as it will print, for lists that show many plates at
// once. One offscreen renderer draws every thumbnail — a live WebGL context
// per row would exhaust the browser's context limit on a big project.

import * as THREE from 'three';
import { disposeGroup, modelToThreeQuat, modelToThreeScale, parseGeometry, place } from './PlateCanvas3D.js';
import type { PlateInstance } from './plate-geometry.js';

const SIZE = 192;

let renderer: THREE.WebGLRenderer | null | undefined;

function getRenderer(): THREE.WebGLRenderer | null {
  if (renderer !== undefined) return renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(SIZE, SIZE, false);
  } catch {
    renderer = null;
  }
  return renderer;
}

const cache = new Map<string, string | null>();

/**
 * A PNG data URL of `instances` seen from the front-left, above the bed.
 * `key` names the arrangement (`plateSignature`), so an unchanged plate is
 * drawn once. Null where WebGL is unavailable.
 */
export function plateThumbnail(key: string, instances: PlateInstance[]): string | null {
  if (cache.has(key)) return cache.get(key)!;
  const gl = getRenderer();
  if (!gl || instances.length === 0) return null;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x302040, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(-1, 2, 1.5);
  scene.add(sun);

  const templates = new Map<ArrayBuffer, THREE.Group>();
  for (const inst of instances) {
    let template = templates.get(inst.data);
    if (!template) {
      template = parseGeometry(inst.data, inst.format);
      templates.set(inst.data, template);
    }
    const node = template.clone(true);
    node.quaternion.copy(modelToThreeQuat(inst.transform.rot));
    node.scale.copy(modelToThreeScale(inst.transform.scale));
    scene.add(node);
    place(node, inst.transform.x, inst.transform.y);
  }

  const box = new THREE.Box3().setFromObject(scene);
  const centre = box.getCenter(new THREE.Vector3());
  const radius = box.getBoundingSphere(new THREE.Sphere()).radius || 1;
  const camera = new THREE.PerspectiveCamera(30, 1, radius / 100, radius * 20);
  const dir = new THREE.Vector3(-0.55, 0.75, 1).normalize();
  camera.position.copy(centre).addScaledVector(dir, radius / Math.sin((camera.fov / 2) * Math.PI / 180));
  camera.lookAt(centre);

  gl.setClearColor(0x000000, 0);
  gl.render(scene, camera);
  const url = gl.domElement.toDataURL('image/png');
  for (const template of templates.values()) disposeGroup(template, true);
  cache.set(key, url);
  return url;
}
