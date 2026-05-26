import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type ModelFormat = "stl" | "3mf";

export interface Viewer {
  load(data: ArrayBuffer, format: ModelFormat): void;
  clear(): void;
  dispose(): void;
}

const DEFAULT_FACE = 0x4a90d9;

function addEdgeLines(mesh: THREE.Mesh, faceColor: THREE.Color) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 30);
  const inverted = new THREE.Color(1 - faceColor.r, 1 - faceColor.g, 1 - faceColor.b);
  const lineMat = new THREE.LineBasicMaterial({ color: inverted, transparent: true, opacity: 0.35 });
  mesh.add(new THREE.LineSegments(edges, lineMat));
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
  }

  function load(data: ArrayBuffer, format: ModelFormat) {
    clear();
    let group: THREE.Group;
    if (format === "stl") {
      const geometry = new STLLoader().parse(data);
      const material = new THREE.MeshPhongMaterial({ color: DEFAULT_FACE, specular: 0x222222, shininess: 40 });
      const mesh = new THREE.Mesh(geometry, material);
      group = new THREE.Group();
      group.add(mesh);
      addEdgeLines(mesh, material.color);
    } else {
      group = new ThreeMFLoader().parse(data) as THREE.Group;
      group.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const mat = child.material as THREE.MeshPhongMaterial | undefined;
        if (!mat) {
          child.material = new THREE.MeshPhongMaterial({ color: DEFAULT_FACE, specular: 0x222222, shininess: 40 });
          addEdgeLines(child, new THREE.Color(DEFAULT_FACE));
        } else if (mat.vertexColors) {
          mat.specular = new THREE.Color(0x222222);
          mat.shininess = 40;
          addEdgeLines(child, mat.color ?? new THREE.Color(0x808080));
        } else if (mat.name === THREE.Loader.DEFAULT_MATERIAL_NAME) {
          mat.color.setHex(DEFAULT_FACE);
          mat.specular = new THREE.Color(0x222222);
          mat.shininess = 40;
          addEdgeLines(child, mat.color);
        } else {
          addEdgeLines(child, mat.color ?? new THREE.Color(0x808080));
        }
      });
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

    const fitDistance = maxDim / (2 * Math.tan((Math.PI * camera.fov) / 360));
    camera.position.set(fitDistance * 1.2, fitDistance * 0.8, fitDistance * 1.2);
    camera.near = maxDim * 0.001;
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
  }

  function dispose() {
    cancelAnimationFrame(animId);
    resizeObserver.disconnect();
    controls.dispose();
    clear();
    renderer.dispose();
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
  }

  return { load, clear, dispose };
}
