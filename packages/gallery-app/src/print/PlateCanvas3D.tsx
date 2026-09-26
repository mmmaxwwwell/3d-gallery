// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
//
// The 3D plate editor.
//
// Two coordinate systems meet here. The plate speaks *model space* — X right,
// Y back, Z up, millimetres — because that is what OpenSCAD, the manifest and
// every slicer mean by a coordinate. Three.js speaks Y-up. The conversion is a
// -90 degree turn about X, and it is applied in exactly two places: baked into
// each geometry once at parse time, and applied to transforms as they cross
// the boundary. Nothing in between has to think about it.
//
// Consequence worth knowing: because the geometry is pre-turned, a Three-space
// object's local axes *are* the model axes permuted, so TransformControls'
// world-space translate handles land on model X and Y, and its local-space
// scale handles land on model X, Y and Z. That is why the gizmo needs no
// special casing.

import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { extractColorMeshes } from '@3d-gallery/viewer/merge-3mf';
import type { Rect2 } from '@3d-gallery/print-toolkit';
import type { Quat } from './mesh-bounds.js';
import type { PlateScale, PlateTransform } from './plate-store.js';

export type TransformMode = 'translate' | 'rotate' | 'scale';

export interface PlateCanvas3DObject {
  id: string;
  label: string;
  format: 'stl' | '3mf';
  data: ArrayBuffer;
  /** Identifies the artifact, so geometry is parsed once however many copies. */
  meshKey: string;
  transform: PlateTransform;
  /** Drawn muted and outlined — the fit oracle could not place this copy. */
  ghost?: boolean;
}

export interface PlateCanvas3DProps {
  bed: Rect2;
  keepouts: Rect2[];
  maxHeight: number;
  /** Rigid plate-space to bed-space translation, from the fit oracle. */
  plateOffset: { dx: number; dy: number };
  objects: PlateCanvas3DObject[];
  selectedId?: string;
  disabled?: boolean;
  onSelect: (id: string | null) => void;
  onTransform: (id: string, next: { x: number; y: number; rot: Quat; scale: PlateScale }) => void;
  /** Takes the selected copy off the plate. */
  onDelete?: (id: string) => void;
  /** Plate-level tools (Arrange) that belong in the same floating rail as the
   *  per-object ones, even though the dialog owns them. */
  toolbarExtra?: ComponentChildren;
}

const BED_COLOR = 0x150330;
const GRID_COLOR = 0x4b1093;
const BORDER_COLOR = 0xb829ff;
const KEEPOUT_COLOR = 0xff2d55;
const MODEL_COLOR = 0x00d5ff;
const SELECTION_COLOR = 0xff17c7;
const GHOST_COLOR = 0xff2e6e;
const GRID_SPACING = 10;
const TRANSLATE_SNAP = 1;
const ROTATE_SNAP = Math.PI / 12;
const SCALE_SNAP = 0.05;

// ── coordinate conversion ───────────────────────────────────────────────────

const X_AXIS = new THREE.Vector3(1, 0, 0);
const MODEL_TO_THREE = new THREE.Quaternion().setFromAxisAngle(X_AXIS, -Math.PI / 2);
const THREE_TO_MODEL = MODEL_TO_THREE.clone().invert();

export function modelToThreeQuat(q: Quat): THREE.Quaternion {
  return MODEL_TO_THREE.clone()
    .multiply(new THREE.Quaternion(q.x, q.y, q.z, q.w))
    .multiply(THREE_TO_MODEL);
}

function threeToModelQuat(q: THREE.Quaternion): Quat {
  const m = THREE_TO_MODEL.clone().multiply(q).multiply(MODEL_TO_THREE);
  return { x: m.x, y: m.y, z: m.z, w: m.w };
}

/** Model Y becomes Three -Z, so a per-axis scale is a permutation, not a turn. */
export function modelToThreeScale(s: PlateScale): THREE.Vector3 {
  return new THREE.Vector3(s.x, s.z, s.y);
}

function threeToModelScale(v: THREE.Vector3): PlateScale {
  return { x: v.x, y: v.z, z: v.y };
}

// ── geometry ────────────────────────────────────────────────────────────────

function material(color: number): THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({ color, specular: 0x222222, shininess: 40 });
}

/** Parse artifact bytes into Three-space geometry (model axes already turned). */
export function parseGeometry(data: ArrayBuffer, format: 'stl' | '3mf'): THREE.Group {
  const group = new THREE.Group();

  if (format === 'stl') {
    const geometry = new STLLoader().parse(data.slice(0));
    geometry.rotateX(-Math.PI / 2);
    group.add(new THREE.Mesh(geometry, material(MODEL_COLOR)));
    return group;
  }

  // A multicolor 3MF carries its palette in metadata the 3MF loader drops, so
  // the per-colour meshes are extracted directly when there is a palette.
  const colorMeshes = extractColorMeshes(data);
  if (colorMeshes.length > 0) {
    for (const cm of colorMeshes) {
      if (cm.vertices.length === 0) continue;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(cm.vertices, 3));
      geometry.computeVertexNormals();
      geometry.rotateX(-Math.PI / 2);
      group.add(new THREE.Mesh(geometry, material(new THREE.Color(cm.colorHex.slice(0, 7)).getHex())));
    }
    if (group.children.length > 0) return group;
  }

  const parsed = new ThreeMFLoader().parse(data.slice(0)) as THREE.Group;
  parsed.traverse((child) => {
    if (child instanceof THREE.Mesh) child.geometry.rotateX(-Math.PI / 2);
  });
  while (parsed.children.length > 0) {
    const child = parsed.children[0];
    parsed.remove(child);
    group.add(child);
  }
  return group;
}

/** Fresh materials per instance so one copy can be tinted without the others. */
function instantiate(template: THREE.Group): THREE.Group {
  const clone = template.clone(true);
  clone.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = (child.material as THREE.Material).clone();
    }
  });
  return clone;
}

export function disposeGroup(group: THREE.Object3D, geometries: boolean): void {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (geometries) child.geometry.dispose();
    const mat = child.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else (mat as THREE.Material).dispose();
  });
}

function setTint(group: THREE.Object3D, color: number | null): void {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mat = child.material as THREE.MeshPhongMaterial;
    if (!mat.userData.baseColor) mat.userData.baseColor = mat.color.getHex();
    mat.color.setHex(color ?? (mat.userData.baseColor as number));
    mat.opacity = color === null ? 1 : 0.85;
    mat.transparent = color !== null;
  });
}

/**
 * Sit the object on the bed with its footprint centred where the plate says.
 *
 * Placement is derived from the posed geometry every time rather than stored,
 * because a rotation changes which part of the mesh is lowest — a part tipped
 * onto a corner has to drop further than the same part lying flat.
 */
export function place(obj: THREE.Object3D, bedX: number, bedY: number): void {
  obj.position.set(0, 0, 0);
  obj.updateMatrixWorld(true);
  // Precise: the loose box (the local AABB's corners, turned) overstates a
  // rotated part, and the fit oracle measures the real hull. A placement built
  // on the loose box would float the part above a bed the oracle says it sits on.
  const box = new THREE.Box3().setFromObject(obj, true);
  if (box.isEmpty()) return;
  const centre = box.getCenter(new THREE.Vector3());
  obj.position.set(bedX - centre.x, -box.min.y, -bedY - centre.z);
  obj.updateMatrixWorld(true);
}

// ── scene furniture ─────────────────────────────────────────────────────────

function buildBed(bed: Rect2, keepouts: Rect2[]): THREE.Group {
  const group = new THREE.Group();
  const width = bed.maxX - bed.minX;
  const depth = bed.maxY - bed.minY;

  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({ color: BED_COLOR, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
  );
  surface.rotation.x = -Math.PI / 2;
  surface.position.set((bed.minX + bed.maxX) / 2, -0.05, -(bed.minY + bed.maxY) / 2);
  group.add(surface);

  const lines: number[] = [];
  for (let x = bed.minX; x <= bed.maxX + 1e-6; x += GRID_SPACING) {
    lines.push(x, 0, -bed.minY, x, 0, -bed.maxY);
  }
  for (let y = bed.minY; y <= bed.maxY + 1e-6; y += GRID_SPACING) {
    lines.push(bed.minX, 0, -y, bed.maxX, 0, -y);
  }
  const gridGeom = new THREE.BufferGeometry();
  gridGeom.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  group.add(new THREE.LineSegments(gridGeom, new THREE.LineBasicMaterial({ color: GRID_COLOR })));

  const border = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(bed.minX, 0.01, -bed.minY),
    new THREE.Vector3(bed.maxX, 0.01, -bed.minY),
    new THREE.Vector3(bed.maxX, 0.01, -bed.maxY),
    new THREE.Vector3(bed.minX, 0.01, -bed.maxY),
    new THREE.Vector3(bed.minX, 0.01, -bed.minY),
  ]);
  group.add(new THREE.Line(border, new THREE.LineBasicMaterial({ color: BORDER_COLOR })));

  // Keepouts sit above the grid and carry an outline: a flat wash at low
  // opacity disappears against the bed lines, and the whole point of drawing
  // them is that the user can see what the slicer will refuse to print over.
  for (const k of keepouts) {
    const zone = new THREE.Mesh(
      new THREE.PlaneGeometry(k.maxX - k.minX, k.maxY - k.minY),
      new THREE.MeshBasicMaterial({ color: KEEPOUT_COLOR, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
    );
    zone.rotation.x = -Math.PI / 2;
    zone.position.set((k.minX + k.maxX) / 2, 0.06, -(k.minY + k.maxY) / 2);
    group.add(zone);

    const outline = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(k.minX, 0.07, -k.minY),
      new THREE.Vector3(k.maxX, 0.07, -k.minY),
      new THREE.Vector3(k.maxX, 0.07, -k.maxY),
      new THREE.Vector3(k.minX, 0.07, -k.maxY),
      new THREE.Vector3(k.minX, 0.07, -k.minY),
    ]);
    group.add(new THREE.Line(outline, new THREE.LineBasicMaterial({ color: KEEPOUT_COLOR })));
  }
  return group;
}

// ── component ───────────────────────────────────────────────────────────────

interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  orbit: OrbitControls;
  gizmo: TransformControls;
  objectRoot: THREE.Group;
  outline: THREE.BoxHelper;
}

export function PlateCanvas3D({
  bed,
  keepouts,
  maxHeight,
  plateOffset,
  objects,
  selectedId,
  disabled,
  onSelect,
  onTransform,
  onDelete,
  toolbarExtra,
}: PlateCanvas3DProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SceneRefs | null>(null);
  const geometryCache = useRef(new Map<string, THREE.Group>());
  const objectsRef = useRef(new Map<string, THREE.Object3D>());
  const propsRef = useRef({ objects, selectedId, onSelect, onTransform, onDelete, disabled });
  propsRef.current = { objects, selectedId, onSelect, onTransform, onDelete, disabled };

  const [mode, setMode] = useState<TransformMode>('translate');

  // Read by the scene's own event handlers, which outlive any single render.
  const offsetRef = useRef(plateOffset);
  offsetRef.current = plateOffset;

  // ── scene lifetime: built once, never torn down by a prop change ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.12;
    orbit.maxPolarAngle = Math.PI / 2 - 0.02;
    orbit.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(1, 1.6, 1).normalize();
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.9);
    fill.position.set(-1, 0.6, -1).normalize();
    scene.add(fill);

    const objectRoot = new THREE.Group();
    scene.add(objectRoot);

    const outline = new THREE.BoxHelper(new THREE.Object3D(), SELECTION_COLOR);
    outline.visible = false;
    scene.add(outline);

    const gizmo = new TransformControls(camera, renderer.domElement);
    gizmo.addEventListener('dragging-changed', (e) => { orbit.enabled = !e.value; });
    gizmo.addEventListener('objectChange', () => {
      const target = gizmo.object;
      if (!target) return;
      // Rotating or scaling changes which part of the mesh is lowest, so the
      // part is re-dropped every frame rather than sinking through the bed
      // until the drag ends. The loose box is fine here — this is the preview;
      // `place` redoes it precisely once the transform is committed.
      if (gizmo.mode !== 'translate') {
        target.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(target);
        if (!box.isEmpty()) target.position.y -= box.min.y;
      }
      outline.setFromObject(target);
    });
    gizmo.addEventListener('mouseUp', () => commit());
    scene.add(gizmo.getHelper());

    const commit = () => {
      const target = gizmo.object;
      const id = target?.userData.instanceId as string | undefined;
      if (!target || !id) return;
      const { onTransform: report } = propsRef.current;
      // Scaling is always uniform: a part scaled on one axis no longer fits
      // whatever it was designed against, and a per-axis handle is not
      // something a thumb can drive accurately anyway.
      if (gizmo.mode === 'scale') {
        const s = Math.max(target.scale.x, target.scale.y, target.scale.z);
        target.scale.setScalar(s);
      }
      target.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(target, true);
      const centre = box.getCenter(new THREE.Vector3());
      // The drag left the node wherever the gizmo put it, which for a rotation
      // is the cheap per-frame drop. Forget the stamp so the next props pass
      // re-places it precisely even if the pose came back byte-identical.
      target.userData.placedAt = '';
      report(id, {
        // Back out of bed space: the plate stores where the part sits on the
        // plate, not where it happens to land on this machine's bed.
        x: centre.x - offsetRef.current.dx,
        y: -centre.z - offsetRef.current.dy,
        rot: threeToModelQuat(target.quaternion),
        scale: threeToModelScale(target.scale),
      });
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downAt: { x: number; y: number } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      downAt = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!downAt || gizmo.dragging || propsRef.current.disabled) { downAt = null; return; }
      // A drag that orbited the camera must not also change the selection.
      const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 4;
      downAt = null;
      if (moved) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(objectRoot.children, true)[0];
      let node = hit?.object as THREE.Object3D | undefined;
      while (node && !node.userData.instanceId) node = node.parent ?? undefined;
      propsRef.current.onSelect((node?.userData.instanceId as string) ?? null);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      orbit.update();
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    sceneRef.current = { renderer, scene, camera, orbit, gizmo, objectRoot, outline };

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      gizmo.detach();
      gizmo.dispose();
      orbit.dispose();
      for (const obj of objectsRef.current.values()) disposeGroup(obj, false);
      objectsRef.current.clear();
      for (const tpl of geometryCache.current.values()) disposeGroup(tpl, true);
      geometryCache.current.clear();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  // ── bed ──
  const bedKey = `${bed.minX},${bed.minY},${bed.maxX},${bed.maxY}|${keepouts.map((k) => `${k.minX},${k.minY},${k.maxX},${k.maxY}`).join(';')}`;
  const bedRef = useRef<THREE.Group | null>(null);
  useEffect(() => {
    const refs = sceneRef.current;
    if (!refs) return;
    if (bedRef.current) {
      refs.scene.remove(bedRef.current);
      disposeGroup(bedRef.current, true);
    }
    const group = buildBed(bed, keepouts);
    refs.scene.add(group);
    bedRef.current = group;

    const span = Math.max(bed.maxX - bed.minX, bed.maxY - bed.minY, maxHeight);
    const cx = (bed.minX + bed.maxX) / 2;
    const cz = -(bed.minY + bed.maxY) / 2;
    refs.orbit.target.set(cx, 0, cz);
    refs.camera.position.set(cx + span * 0.75, span * 0.7, cz + span * 0.95);
    refs.camera.far = span * 20;
    refs.camera.updateProjectionMatrix();
    refs.orbit.update();
  }, [bedKey, maxHeight]);

  // ── objects ──
  useEffect(() => {
    const refs = sceneRef.current;
    if (!refs) return;
    const live = new Set(objects.map((o) => o.id));

    for (const [id, node] of objectsRef.current) {
      if (live.has(id)) continue;
      if (refs.gizmo.object === node) refs.gizmo.detach();
      refs.objectRoot.remove(node);
      disposeGroup(node, false);
      objectsRef.current.delete(id);
    }

    for (const spec of objects) {
      let template = geometryCache.current.get(spec.meshKey);
      if (!template) {
        try {
          template = parseGeometry(spec.data, spec.format);
        } catch {
          continue;
        }
        geometryCache.current.set(spec.meshKey, template);
      }

      let node = objectsRef.current.get(spec.id);
      if (!node || node.userData.meshKey !== spec.meshKey) {
        if (node) {
          if (refs.gizmo.object === node) refs.gizmo.detach();
          refs.objectRoot.remove(node);
          disposeGroup(node, false);
        }
        node = instantiate(template);
        node.userData.instanceId = spec.id;
        node.userData.meshKey = spec.meshKey;
        refs.objectRoot.add(node);
        objectsRef.current.set(spec.id, node);
      }

      // Placing is a precise vertex walk, so an edit to one object must not
      // re-measure the rest of the plate.
      const bedX = spec.transform.x + plateOffset.dx;
      const bedY = spec.transform.y + plateOffset.dy;
      const stamp = `${bedX},${bedY},${JSON.stringify(spec.transform.rot)},${JSON.stringify(spec.transform.scale)}`;
      if (node.userData.placedAt !== stamp) {
        node.quaternion.copy(modelToThreeQuat(spec.transform.rot));
        node.scale.copy(modelToThreeScale(spec.transform.scale));
        place(node, bedX, bedY);
        node.userData.placedAt = stamp;
      }
      setTint(node, spec.ghost ? GHOST_COLOR : null);
    }
  }, [objects, plateOffset.dx, plateOffset.dy]);

  // ── selection + gizmo settings ──
  useEffect(() => {
    const refs = sceneRef.current;
    if (!refs) return;
    const node = selectedId ? objectsRef.current.get(selectedId) : undefined;
    if (node && !disabled) {
      refs.gizmo.attach(node);
      refs.outline.setFromObject(node);
      refs.outline.visible = true;
    } else {
      refs.gizmo.detach();
      refs.outline.visible = false;
    }
  }, [selectedId, objects, disabled]);

  useEffect(() => {
    const refs = sceneRef.current;
    if (!refs) return;
    refs.gizmo.setMode(mode);
    refs.gizmo.space = mode === 'scale' ? 'local' : 'world';
    // Model Z is Three Y. Parts live on the bed, so the vertical translate
    // handle would only ever lift one off it.
    refs.gizmo.showY = mode !== 'translate';
    // Snapping is always on: 1 mm / 15° / 5% are the increments anyone
    // actually wants on a print bed, and free-dragging just makes a plate
    // that looks aligned but is not.
    refs.gizmo.setTranslationSnap(TRANSLATE_SNAP);
    refs.gizmo.setRotationSnap(ROTATE_SNAP);
    refs.gizmo.setScaleSnap(SCALE_SNAP);
  }, [mode]);

  // ── toolbar actions ──
  const selected = objects.find((o) => o.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId || disabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      const key = e.key.toLowerCase();
      if (key === 'g') { e.preventDefault(); setMode('translate'); }
      else if (key === 's') { e.preventDefault(); setMode('scale'); }
      else if (key === 'e') { e.preventDefault(); setMode('rotate'); }
      else if (key === 'delete' || key === 'backspace') {
        e.preventDefault();
        propsRef.current.onDelete?.(selectedId);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // Deliberately not keyed on the callback: it is a fresh closure on every
    // parent render, and re-subscribing that often leaves gaps where a
    // keystroke lands on no listener at all.
  }, [selectedId, disabled]);

  const scalePercent = selected
    ? Math.round(((selected.transform.scale.x + selected.transform.scale.y + selected.transform.scale.z) / 3) * 100)
    : 100;

  return (
    <div class="plate3d">
      <div class="plate3d-viewport" ref={containerRef} />
      <div class="plate3d-toolbar" role="toolbar" aria-label="Plate editor tools">
        {(['translate', 'rotate', 'scale'] as const).map((m) => (
          <button
            key={m}
            type="button"
            class={`plate3d-tool${mode === m ? ' is-active' : ''}`}
            onClick={() => setMode(m)}
            disabled={disabled}
            title={m === 'translate' ? 'Move (G)' : m === 'rotate' ? 'Rotate (E)' : 'Scale (S)'}
          >
            {m === 'translate' ? 'Move' : m === 'rotate' ? 'Rotate' : 'Scale'}
          </button>
        ))}
        <span class="plate3d-tool-sep" />
        <button
          type="button"
          class="plate3d-tool is-danger"
          onClick={() => selectedId && onDelete?.(selectedId)}
          disabled={disabled || !selected || !onDelete}
          title="Take this copy off the plate (Del)"
        >
          Delete
        </button>
        {toolbarExtra && (
          <>
            <span class="plate3d-tool-sep" />
            {toolbarExtra}
          </>
        )}
      </div>
      <div class="plate3d-status">
        {selected
          ? `${selected.label} · ${scalePercent}%`
          : `${objects.length} object${objects.length === 1 ? '' : 's'} · click to select`}
      </div>
    </div>
  );
}
