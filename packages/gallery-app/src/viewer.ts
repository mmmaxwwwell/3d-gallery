import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type ModelFormat = "stl" | "3mf";

export interface LoadOptions {
  /** Keep the current camera position + orbit target. Near/far are still
   *  updated so the new geometry doesn't clip. Used for HMR reloads. */
  preserveView?: boolean;
}

export interface HoverInfo {
  /** Normalized #rrggbb of the hovered mesh's color, in sRGB (matches the manifest). */
  color: string;
  /** Container-relative screen position of the hovered mesh's projected center. */
  screenX: number;
  screenY: number;
}

export interface Viewer {
  load(data: ArrayBuffer, format: ModelFormat, opts?: LoadOptions): void;
  clear(): void;
  dispose(): void;
  /** Listen for mesh-hover events. Passes null when the cursor leaves any mesh. */
  onHover(cb: (info: HoverInfo | null) => void): () => void;
  /** Listen for mesh-click events (sRGB hex of the clicked mesh). */
  onClick(cb: (color: string) => void): () => void;
  /** Force-highlight the mesh whose sRGB color matches `hex`, or clear if null. */
  highlightByColor(hex: string | null): void;
  /** Container-relative projected screen position of the mesh matching `hex`. */
  getScreenPositionForColor(hex: string): { x: number; y: number } | null;
}

const DEFAULT_FACE = 0x4a90d9;

/**
 * Convert a Three.js linear-space color to a normalized sRGB hex string
 * `#rrggbb` — matches the encoding in `models/manifest.json` legends and
 * the raw `color("#xxx")` literals in .scad previews.
 */
function toSrgbHex(linear: THREE.Color): string {
  const srgb = linear.clone().convertLinearToSRGB();
  return "#" + srgb.getHexString();
}

function addEdgeLines(mesh: THREE.Mesh, faceColor: THREE.Color) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 30);
  const inverted = new THREE.Color(1 - faceColor.r, 1 - faceColor.g, 1 - faceColor.b);
  const lineMat = new THREE.LineBasicMaterial({ color: inverted, transparent: true, opacity: 0.35 });
  mesh.add(new THREE.LineSegments(edges, lineMat));
}

/**
 * The 3MFLoader produces a single vertex-colored mesh per <object> — all
 * cells of an assembled preview end up sharing one white MeshPhongMaterial
 * with per-vertex color data. Split those meshes so each unique color
 * becomes its own solid-color Mesh; that's what lets hover / highlight
 * key off `material.color`.
 */
function splitVertexColoredMesh(mesh: THREE.Mesh): THREE.Mesh[] {
  const geo = mesh.geometry;
  const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
  const colorAttr = geo.getAttribute("color") as THREE.BufferAttribute | undefined;
  if (!posAttr || !colorAttr) return [mesh];

  // The pipeline writes flat per-triangle color (all three verts of a
  // triangle share the same p-index), so keying off vertex 0 of each
  // triangle correctly groups the whole tri.
  const groups = new Map<string, { positions: number[]; r: number; g: number; b: number }>();
  const triCount = Math.floor(posAttr.count / 3);
  for (let t = 0; t < triCount; t++) {
    const v0 = t * 3;
    const r = colorAttr.getX(v0);
    const g = colorAttr.getY(v0);
    const b = colorAttr.getZ(v0);
    const key = `${r.toFixed(5)},${g.toFixed(5)},${b.toFixed(5)}`;
    let group = groups.get(key);
    if (!group) {
      group = { positions: [], r, g, b };
      groups.set(key, group);
    }
    for (let v = 0; v < 3; v++) {
      const vi = v0 + v;
      group.positions.push(posAttr.getX(vi), posAttr.getY(vi), posAttr.getZ(vi));
    }
  }

  const out: THREE.Mesh[] = [];
  for (const [, group] of groups) {
    const newGeo = new THREE.BufferGeometry();
    newGeo.setAttribute("position", new THREE.Float32BufferAttribute(group.positions, 3));
    newGeo.computeVertexNormals();
    const color = new THREE.Color(group.r, group.g, group.b); // still linear
    const material = new THREE.MeshPhongMaterial({
      color,
      specular: 0x222222,
      shininess: 40,
      flatShading: true,
    });
    const newMesh = new THREE.Mesh(newGeo, material);
    newMesh.position.copy(mesh.position);
    newMesh.rotation.copy(mesh.rotation);
    newMesh.scale.copy(mesh.scale);
    out.push(newMesh);
  }
  return out;
}

export function createViewer(container: HTMLElement): Viewer {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 10000);
  camera.position.set(100, 100, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  scene.add(new THREE.AmbientLight(0x666666));
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(1, 1, 1).normalize();
  scene.add(key);
  const back = new THREE.DirectionalLight(0xffffff, 0.5);
  back.position.set(-1, -0.5, -1).normalize();
  scene.add(back);

  scene.add(new THREE.GridHelper(200, 20, 0xcccccc, 0xe0e0e0));

  let currentGroup: THREE.Group | null = null;

  interface TrackedMesh {
    mesh: THREE.Mesh;
    material: THREE.MeshPhongMaterial;
    originalEmissive: THREE.Color;
    color: string;
  }
  const meshesByColor = new Map<string, TrackedMesh>();
  let highlighted: TrackedMesh | null = null;

  const hoverListeners = new Set<(info: HoverInfo | null) => void>();
  const clickListeners = new Set<(color: string) => void>();

  function applyHighlight(target: TrackedMesh | null) {
    if (highlighted === target) return;
    if (highlighted) {
      highlighted.material.emissive.copy(highlighted.originalEmissive);
      highlighted.material.needsUpdate = true;
    }
    highlighted = target;
    if (target) {
      target.material.emissive.setHex(0x333333);
      target.material.needsUpdate = true;
    }
  }

  function projectMeshScreen(mesh: THREE.Mesh): { x: number; y: number } | null {
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    mesh.geometry.boundingBox!.getCenter(center);
    mesh.updateWorldMatrix(true, false);
    center.applyMatrix4(mesh.matrixWorld);
    center.project(camera);
    if (center.z < -1 || center.z > 1) return null;
    const canvasRect = renderer.domElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const x = (center.x + 1) * 0.5 * canvasRect.width + (canvasRect.left - containerRect.left);
    const y = (-center.y + 1) * 0.5 * canvasRect.height + (canvasRect.top - containerRect.top);
    return { x, y };
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerInside = false;

  function updateHover() {
    if (!pointerInside || !currentGroup) {
      if (highlighted) applyHighlight(null);
      for (const cb of hoverListeners) cb(null);
      return;
    }
    raycaster.setFromCamera(pointer, camera);
    const targets: THREE.Mesh[] = [];
    currentGroup.traverse((c) => {
      if (c instanceof THREE.Mesh) targets.push(c);
    });
    const hits = raycaster.intersectObjects(targets, false);
    if (hits.length === 0) {
      if (highlighted) applyHighlight(null);
      for (const cb of hoverListeners) cb(null);
      return;
    }
    const hitMesh = hits[0].object as THREE.Mesh;
    const mat = hitMesh.material as THREE.MeshPhongMaterial;
    const hex = toSrgbHex(mat.color);
    const tracked = meshesByColor.get(hex);
    if (tracked) applyHighlight(tracked);
    const proj = projectMeshScreen(hitMesh);
    const info: HoverInfo = {
      color: hex,
      screenX: proj?.x ?? 0,
      screenY: proj?.y ?? 0,
    };
    for (const cb of hoverListeners) cb(info);
  }

  function onPointerMove(ev: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    pointerInside = true;
    updateHover();
  }
  function onPointerLeave() {
    pointerInside = false;
    updateHover();
  }
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);

  // Listen on the WINDOW (not the canvas) with a target-filter — OrbitControls
  // captures pointer events on the canvas which was suppressing compat
  // mouse events from firing there. Window-level pointerdown/pointerup
  // still see the events after they bubble past the capturing element.
  const CLICK_DRAG_TOLERANCE_PX = 6;
  let mouseDownAt: { x: number; y: number } | null = null;
  function isOverCanvas(ev: MouseEvent | PointerEvent): boolean {
    const rect = renderer.domElement.getBoundingClientRect();
    return (
      ev.clientX >= rect.left &&
      ev.clientX <= rect.right &&
      ev.clientY >= rect.top &&
      ev.clientY <= rect.bottom
    );
  }
  function onWinPointerDown(ev: PointerEvent) {
    if (ev.button !== 0) return;
    if (!isOverCanvas(ev)) return;
    mouseDownAt = { x: ev.clientX, y: ev.clientY };
  }
  function onWinPointerUp(ev: PointerEvent) {
    if (ev.button !== 0 || !mouseDownAt) return;
    const dx = ev.clientX - mouseDownAt.x;
    const dy = ev.clientY - mouseDownAt.y;
    const wasClick = dx * dx + dy * dy <= CLICK_DRAG_TOLERANCE_PX * CLICK_DRAG_TOLERANCE_PX;
    mouseDownAt = null;
    if (!wasClick) return;
    if (!isOverCanvas(ev)) return;
    if (!currentGroup || clickListeners.size === 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const targets: THREE.Mesh[] = [];
    currentGroup.traverse((c) => {
      if (c instanceof THREE.Mesh) targets.push(c);
    });
    const hits = raycaster.intersectObjects(targets, false);
    if (hits.length === 0) return;
    const mat = (hits[0].object as THREE.Mesh).material as THREE.MeshPhongMaterial;
    if (!mat?.color) return;
    const hex = toSrgbHex(mat.color);
    for (const cb of clickListeners) cb(hex);
  }
  window.addEventListener("pointerdown", onWinPointerDown);
  window.addEventListener("pointerup", onWinPointerUp);

  const resizeObserver = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  resizeObserver.observe(container);

  let animId = 0;
  const animate = () => {
    animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  function disposeGroup(group: THREE.Group) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const mat = child.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
      if (child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        const mat = child.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }

  function clear() {
    if (currentGroup) {
      scene.remove(currentGroup);
      disposeGroup(currentGroup);
      currentGroup = null;
    }
    meshesByColor.clear();
    highlighted = null;
  }

  function trackMesh(mesh: THREE.Mesh) {
    const mat = mesh.material as THREE.MeshPhongMaterial;
    if (!mat || !mat.color) return;
    const hex = toSrgbHex(mat.color);
    meshesByColor.set(hex, {
      mesh,
      material: mat,
      originalEmissive: mat.emissive.clone(),
      color: hex,
    });
  }

  function load(data: ArrayBuffer, format: ModelFormat, opts: LoadOptions = {}) {
    clear();
    let group: THREE.Group;
    if (format === "stl") {
      const geometry = new STLLoader().parse(data);
      const material = new THREE.MeshPhongMaterial({ color: DEFAULT_FACE, specular: 0x222222, shininess: 40 });
      const mesh = new THREE.Mesh(geometry, material);
      group = new THREE.Group();
      group.add(mesh);
      addEdgeLines(mesh, material.color);
      trackMesh(mesh);
    } else {
      group = new ThreeMFLoader().parse(data) as THREE.Group;

      // First pass — collect existing meshes.
      const originals: THREE.Mesh[] = [];
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) originals.push(child);
      });

      for (const original of originals) {
        const mat = original.material as THREE.MeshPhongMaterial | undefined;
        if (mat?.vertexColors) {
          // Split into one solid-color mesh per unique color so hover
          // can key off material.color.
          const parts = splitVertexColoredMesh(original);
          const parent = original.parent!;
          parent.remove(original);
          original.geometry.dispose();
          mat.dispose();
          for (const p of parts) {
            parent.add(p);
            addEdgeLines(p, (p.material as THREE.MeshPhongMaterial).color);
            trackMesh(p);
          }
        } else if (!mat) {
          original.material = new THREE.MeshPhongMaterial({ color: DEFAULT_FACE, specular: 0x222222, shininess: 40 });
          addEdgeLines(original, new THREE.Color(DEFAULT_FACE));
          trackMesh(original);
        } else if (mat.name === THREE.Loader.DEFAULT_MATERIAL_NAME) {
          mat.color.setHex(DEFAULT_FACE);
          mat.specular = new THREE.Color(0x222222);
          mat.shininess = 40;
          addEdgeLines(original, mat.color);
          trackMesh(original);
        } else {
          mat.specular = mat.specular ?? new THREE.Color(0x222222);
          mat.shininess = mat.shininess ?? 40;
          addEdgeLines(original, mat.color ?? new THREE.Color(0x808080));
          trackMesh(original);
        }
      }
    }

    // OpenSCAD is Z-up, Three.js is Y-up — rotate to lay flat.
    group.rotation.x = -Math.PI / 2;
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    group.position.set(-center.x, -box.min.y, -center.z);
    currentGroup = group;
    scene.add(group);

    camera.near = maxDim * 0.001;
    camera.far = maxDim * 100;
    if (!opts.preserveView) {
      const fitDistance = maxDim / (2 * Math.tan((Math.PI * camera.fov) / 360));
      camera.position.set(fitDistance * 1.2, fitDistance * 0.8, fitDistance * 1.2);
      controls.target.set(0, 0, 0);
    }
    camera.updateProjectionMatrix();
    controls.update();
  }

  function dispose() {
    cancelAnimationFrame(animId);
    resizeObserver.disconnect();
    controls.dispose();
    renderer.domElement.removeEventListener("pointermove", onPointerMove);
    renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("pointerdown", onWinPointerDown);
    window.removeEventListener("pointerup", onWinPointerUp);
    clear();
    renderer.dispose();
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
  }

  function onHover(cb: (info: HoverInfo | null) => void) {
    hoverListeners.add(cb);
    return () => hoverListeners.delete(cb);
  }

  function onClick(cb: (color: string) => void) {
    clickListeners.add(cb);
    return () => clickListeners.delete(cb);
  }

  function highlightByColor(hex: string | null) {
    if (hex === null) {
      applyHighlight(null);
      return;
    }
    const tracked = meshesByColor.get(hex.toLowerCase());
    if (tracked) applyHighlight(tracked);
  }

  function getScreenPositionForColor(hex: string): { x: number; y: number } | null {
    const tracked = meshesByColor.get(hex.toLowerCase());
    if (!tracked) return null;
    return projectMeshScreen(tracked.mesh);
  }

  return { load, clear, dispose, onHover, onClick, highlightByColor, getScreenPositionForColor };
}
