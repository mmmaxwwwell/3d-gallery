import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { unzipSync, strFromU8 } from "fflate";
import { INSTANCE_ANCHORS_PATH, type InstanceAnchor } from "@3d-gallery/model-core";

export type ModelFormat = "stl" | "3mf";

export interface LoadOptions {
  /** Keep the current camera position + orbit target. Near/far are still
   *  updated so the new geometry doesn't clip. Used for HMR reloads. */
  preserveView?: boolean;
  /** Frame the model from this camera instead of auto-fitting. Ignored when
   *  `preserveView` is set. */
  view?: ViewState;
}

/** Camera position + orbit target, enough to put the camera back where it was. */
export interface ViewState {
  position: [number, number, number];
  target: [number, number, number];
}

export interface HoverInfo {
  /** Normalized #rrggbb of the hovered mesh's color, in sRGB (matches the manifest). */
  color: string;
  /** Id of the named piece under the cursor, once `resolveInstances` has placed it. */
  instance: string | null;
  /** Container-relative screen position of the hovered mesh's projected center. */
  screenX: number;
  screenY: number;
}

export interface HighlightState {
  /** sRGB hex of the piece under the cursor. It alone gets the brightness lift. */
  hover?: string | null;
  /** sRGB hexes of the sibling pieces of the same part. They get the neon glow. */
  glow?: string[];
  /** A single named piece to lift, when the colour it shares holds others. */
  hoverInstance?: string | null;
  /** Named pieces to glow one by one, where a whole colour would take in other parts. */
  glowInstances?: string[];
}

/** How a colour's meshes are drawn: as they are, faint and see-through, or not at all. */
export type ColorDisplay = "solid" | "ghost" | "hidden";

export interface Viewer {
  load(data: ArrayBuffer, format: ModelFormat, opts?: LoadOptions): void;
  clear(): void;
  dispose(): void;
  /** Listen for mesh-hover events. Passes null when the cursor leaves any mesh. */
  onHover(cb: (info: HoverInfo | null) => void): () => void;
  /** Listen for mesh-click events (sRGB hex of the clicked mesh). */
  onClick(cb: (color: string) => void): () => void;
  /** Paint the hovered piece bright and its siblings with a glow. */
  setHighlight(state: HighlightState): void;
  /** sRGB hexes of every distinct piece colour in the loaded model. */
  getPartColors(): string[];
  /** Container-relative projected screen position of the mesh matching `hex`. */
  getScreenPositionForColor(hex: string): { x: number; y: number } | null;
  /**
   * Tie the loaded 3MF's echoed anchors to the pieces they sit in, so each can
   * be lit and pointed at alone. `colorsById` names, per id, the colours its
   * piece may be drawn in — an anchor only ever claims a mesh of those. Returns
   * the ids that landed on exactly one piece of their own; an id whose piece is
   * fused to a sibling, or whose anchor lies in no piece, is left out rather
   * than guessed.
   */
  resolveInstances(colorsById: Map<string, string[]>): Set<string>;
  /** Container-relative projected screen position of a resolved piece. */
  getScreenPositionForInstance(id: string): { x: number; y: number } | null;
  /**
   * Serialize the mesh whose sRGB color matches `hex` to a binary STL buffer,
   * with its XY bbox recentered on the origin and its minZ dropped to 0 —
   * ready to drop into a slicer or the local cache as a printable piece.
   * Returns null if no mesh matches.
   */
  getMeshStlByColor(hex: string): ArrayBuffer | null;
  /**
   * Draw these colours ghosted or hidden; every other colour is solid. Kept
   * across loads, so a reload of the same view keeps it. A ghosted or hidden
   * mesh no longer takes the pointer, so what's behind it can be hovered.
   */
  setColorDisplay(display: Record<string, ColorDisplay>): void;
  getView(): ViewState;
}

const GHOST_OPACITY = 0.2;

const DEFAULT_FACE = 0x00d5ff;

/**
 * Normalized `#rrggbb` for a material colour, in sRGB — the same encoding the
 * .3mf stores. `getHexString` already converts out of the working (linear)
 * space, so converting first would apply gamma twice and every mid-tone would
 * read back a shade too bright (black and white, being fixed points, would
 * still look correct — which is how that hides).
 */
function toSrgbHex(color: THREE.Color): string {
  return "#" + color.getHexString();
}

/**
 * Retrowave sunset as an equirectangular canvas texture. Used as the scene
 * background so it sits at infinity and swings with the camera orbit instead
 * of being painted flat behind the canvas.
 *
 * Canvas rows map top→zenith and the midpoint to the horizon, so the sun is
 * drawn straddling y = H/2 and the ground gradient is painted over its lower
 * half — that clip is what gives the disc its horizon-cut look.
 */
function makeSunsetTexture(): THREE.CanvasTexture {
  const W = 2048;
  const H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // Eye level — v = 0.5 is the one row that projects to a straight horizon
  // whatever way the camera is turned. The default camera elevation below is
  // shallow enough to keep it in frame.
  const horizon = H / 2;

  // Stops bunch up at the horizon on purpose: the camera looks down at the
  // model, so only the first ten or so degrees of sky are ever in frame and
  // that is where the whole gradient has to happen.
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#02000a");
  sky.addColorStop(0.7, "#0d0230");
  sky.addColorStop(0.88, "#2e0655");
  sky.addColorStop(0.95, "#6d0f6e");
  sky.addColorStop(0.985, "#c01480");
  sky.addColorStop(1, "#ff3d7a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, horizon);

  // Deterministic star field — a seeded LCG keeps the backdrop identical
  // across reloads, so a screenshot diff of the viewer stays meaningful.
  let seed = 0x5eed;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0xffffffff);
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 280; i++) {
    const x = rand() * W;
    const y = rand() * horizon * 0.72;
    ctx.globalAlpha = 0.25 + rand() * 0.55;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  // Equirect u maps +X to 0.5; the default camera sits at (+x, +y, +z) looking
  // back at the origin, so u = 0.125 puts the sun dead ahead on first paint.
  const sunX = W * 0.125;
  const sunR = 80;
  const sunY = horizon - sunR * 0.2;
  const disc = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  disc.addColorStop(0, "#ffe600");
  disc.addColorStop(0.3, "#ff8a00");
  disc.addColorStop(0.7, "#ff17c7");
  disc.addColorStop(1, "#a021ff");
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = disc;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  // Slats: thicker and closer together toward the bottom of the disc.
  ctx.fillStyle = "#12022e";
  for (let i = 0, y = sunY - sunR * 0.3; y < sunY + sunR; i++) {
    const band = 3 + i * 1.6;
    ctx.fillRect(sunX - sunR, y, sunR * 2, band);
    y += band + Math.max(4, 22 - i * 2.4);
  }
  ctx.restore();

  const glow = ctx.createRadialGradient(sunX, horizon, 0, sunX, horizon, sunR * 2.6);
  glow.addColorStop(0, "rgba(255, 23, 199, 0.28)");
  glow.addColorStop(1, "rgba(255, 23, 199, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - sunR * 2.6, horizon - sunR * 2.6, sunR * 5.2, sunR * 5.2);

  // Scenery draws from its own LCG rather than the star field's: pulling from
  // that one would shift every star and void any screenshot baseline.
  let landSeed = 0x1a2d;
  const landRand = () => ((landSeed = (landSeed * 1664525 + 1013904223) >>> 0) / 0xffffffff);

  // u wraps at x = W, so a span crossing either edge is painted a second time a
  // full width away — without it the seam shows up as a sliced silhouette.
  const drawWrapped = (left: number, right: number, paint: () => void) => {
    paint();
    const shift = right > W ? -W : left < 0 ? W : 0;
    if (shift === 0) return;
    ctx.save();
    ctx.translate(shift, 0);
    paint();
    ctx.restore();
  };

  // Both silhouettes land before the ground gradient, which gives their skirts
  // the same horizon cut the sun disc gets. Crests stay inside ~55px of the
  // horizon because that is the sliver of sky the camera actually frames.
  const skirt = horizon + 14;

  const ridgeSpan = W / 3;
  const ridgeLeft = W * (0.125 + 1 / 3) - ridgeSpan / 2;
  const ridges: Array<{ peak: number; teeth: number; fill: string; rim: string; alpha: number }> = [
    { peak: 34, teeth: 11, fill: "#3d0b57", rim: "#ff2e6e", alpha: 0.8 },
    { peak: 44, teeth: 8, fill: "#250641", rim: "#a021ff", alpha: 0.92 },
    { peak: 54, teeth: 6, fill: "#12022e", rim: "#00eaff", alpha: 1 },
  ];
  for (const layer of ridges) {
    const steps = layer.teeth * 2;
    const crest: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const taper = Math.min(1, Math.sin(Math.PI * t) * 1.7);
      const h =
        i % 2 === 1
          ? layer.peak * (0.6 + landRand() * 0.4)
          : layer.peak * (0.1 + landRand() * 0.25);
      crest.push([ridgeLeft + t * ridgeSpan, horizon - h * taper]);
    }
    drawWrapped(ridgeLeft, ridgeLeft + ridgeSpan, () => {
      ctx.globalAlpha = layer.alpha;
      ctx.beginPath();
      ctx.moveTo(crest[0][0], skirt);
      for (const [x, y] of crest) ctx.lineTo(x, y);
      ctx.lineTo(crest[crest.length - 1][0], skirt);
      ctx.closePath();
      ctx.fillStyle = layer.fill;
      ctx.fill();
      ctx.globalAlpha = layer.alpha * 0.5;
      ctx.beginPath();
      for (const [x, y] of crest) ctx.lineTo(x, y);
      ctx.strokeStyle = layer.rim;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  const forestSpan = W / 3;
  const forestCenter = W * (0.125 + 2 / 3);
  const forestLeft = forestCenter - forestSpan / 2;
  const pineRows: Array<Array<{ x: number; w: number; h: number }>> = [[], []];
  pineRows.forEach((row, depth) => {
    const step = depth === 0 ? 9 : 7;
    for (let x = forestLeft; x <= forestLeft + forestSpan; x += step) {
      const t = (x - forestLeft) / forestSpan;
      const taper = Math.min(1, Math.sin(Math.PI * t) * 1.9);
      const h = depth === 0 ? 8 + landRand() * 11 : 12 + landRand() * 16;
      row.push({ x: x + landRand() * step * 0.6, w: 3 + landRand() * 2.4, h: h * taper });
    }
  });
  const tracePine = (tree: { x: number; w: number; h: number }) => {
    ctx.moveTo(tree.x - tree.w, skirt);
    ctx.lineTo(tree.x - tree.w * 0.58, horizon - tree.h * 0.44);
    ctx.lineTo(tree.x - tree.w * 0.86, horizon - tree.h * 0.4);
    ctx.lineTo(tree.x, horizon - tree.h);
    ctx.lineTo(tree.x + tree.w * 0.86, horizon - tree.h * 0.4);
    ctx.lineTo(tree.x + tree.w * 0.58, horizon - tree.h * 0.44);
    ctx.lineTo(tree.x + tree.w, skirt);
    ctx.closePath();
  };
  drawWrapped(forestLeft, forestLeft + forestSpan, () => {
    // Squashing the radial turns it into a haze band hugging the horizon; a
    // round one at this width would tower far above the treeline.
    ctx.save();
    ctx.translate(forestCenter, horizon);
    ctx.scale(1, 0.075);
    const haze = ctx.createRadialGradient(0, 0, 0, 0, 0, forestSpan * 0.6);
    haze.addColorStop(0, "rgba(0, 234, 255, 0.15)");
    haze.addColorStop(1, "rgba(0, 234, 255, 0)");
    ctx.fillStyle = haze;
    ctx.fillRect(-forestSpan * 0.6, -forestSpan * 0.6, forestSpan * 1.2, forestSpan * 1.2);
    ctx.restore();

    pineRows.forEach((row, depth) => {
      ctx.beginPath();
      for (const tree of row) tracePine(tree);
      ctx.fillStyle = depth === 0 ? "#26073d" : "#12022e";
      ctx.fill();
    });
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    for (const tree of pineRows[1]) tracePine(tree);
    ctx.strokeStyle = "#39ff14";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // The third of the panorama centred on the sun — the two the ridges and the
  // forest don't claim. Towers here read as silhouettes against the disc, which
  // is the whole point of putting the city there rather than beside it.
  const citySpan = W / 3;
  const cityCenter = sunX;
  const cityLeft = cityCenter - citySpan / 2;

  interface Tower {
    x: number;
    w: number;
    h: number;
    /** Tall ones carry a mast; the beacon on top blinks in nobody's imagination but yours. */
    mast: number;
  }
  const cityRows: Tower[][] = [[], []];
  cityRows.forEach((row, depth) => {
    const step = depth === 0 ? 26 : 19;
    for (let x = cityLeft; x <= cityLeft + citySpan; x += step) {
      const t = (x - cityLeft) / citySpan;
      // Same sine taper the ridges use, so the skyline settles into the horizon
      // at both ends instead of ending on a cliff.
      const taper = Math.min(1, Math.sin(Math.PI * t) * 1.6);
      const h = depth === 0 ? 16 + landRand() * 20 : 24 + landRand() * 30;
      const w = (depth === 0 ? 9 : 12) + landRand() * 9;
      row.push({
        x: x + landRand() * step * 0.4,
        w,
        h: h * taper,
        mast: landRand() < 0.28 ? 8 + landRand() * 14 : 0,
      });
    }
  });

  // Windows are precomputed so the wrapped second pass paints the same city
  // rather than rolling a fresh one a width away.
  const windows: Array<{ x: number; y: number; w: number; h: number; lit: string; alpha: number }> = [];
  for (const row of cityRows) {
    for (const tower of row) {
      if (tower.h < 14) continue;
      const cols = Math.max(1, Math.floor(tower.w / 4));
      const rows = Math.max(1, Math.floor(tower.h / 5));
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (landRand() > 0.38) continue;
          windows.push({
            x: tower.x - tower.w / 2 + 1.6 + c * 4,
            y: horizon - tower.h + 3 + r * 5,
            w: 1.6,
            h: 2.4,
            lit: landRand() < 0.5 ? "#00eaff" : "#ff17c7",
            alpha: 0.5 + landRand() * 0.4,
          });
        }
      }
    }
  }

  /**
   * A mech silhouette in the same flat-black register as the towers: boxy
   * shoulders, a V-fin, two lit eyes. Drawn from the feet up so `x` is where it
   * stands and `scale` is roughly its height in horizon pixels.
   */
  const drawMech = (x: number, scale: number, flip: boolean) => {
    ctx.save();
    ctx.translate(x, horizon);
    ctx.scale(flip ? -1 : 1, 1);
    const u = scale / 100;

    const boxes: Array<[number, number, number, number]> = [
      // Legs — splayed just enough to read as a stance at this size.
      [-14, -46, 9, 60],
      [5, -46, 9, 60],
      // Torso + hips.
      [-13, -78, 26, 34],
      [-16, -52, 32, 9],
      // Shoulder blocks, the one silhouette cue that sells the whole thing.
      [-29, -82, 15, 16],
      [14, -82, 15, 16],
      // Arms.
      [-27, -68, 8, 30],
      [19, -68, 8, 30],
      // Head.
      [-7, -92, 14, 13],
    ];
    ctx.fillStyle = "#08001c";
    for (const [bx, by, bw, bh] of boxes) ctx.fillRect(bx * u, by * u, bw * u, bh * u);
    // A cool rim is what separates it from the towers it stands among; without
    // it the whole thing reads as one more black rectangle.
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#00eaff";
    ctx.lineWidth = 1;
    for (const [bx, by, bw, bh] of boxes) ctx.strokeRect(bx * u, by * u, bw * u, bh * u);
    ctx.globalAlpha = 1;

    // V-fin.
    ctx.fillStyle = "#ffd60a";
    ctx.beginPath();
    ctx.moveTo(-9 * u, -95 * u);
    ctx.lineTo(0, -89 * u);
    ctx.lineTo(9 * u, -95 * u);
    ctx.lineTo(0, -92 * u);
    ctx.closePath();
    ctx.fill();

    // Eyes, and a chest light because of course there is one.
    ctx.fillStyle = "#39ff14";
    ctx.fillRect(-5 * u, -88 * u, 3.5 * u, 2.5 * u);
    ctx.fillRect(1.5 * u, -88 * u, 3.5 * u, 2.5 * u);
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "#ff2e6e";
    ctx.fillRect(-3 * u, -74 * u, 6 * u, 4 * u);
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  const mechs = [
    { x: cityCenter - citySpan * 0.1, scale: 88, flip: false },
    { x: cityCenter + citySpan * 0.3, scale: 54, flip: true },
  ];

  drawWrapped(cityLeft, cityLeft + citySpan, () => {
    ctx.save();
    ctx.translate(cityCenter, horizon);
    ctx.scale(1, 0.09);
    const smog = ctx.createRadialGradient(0, 0, 0, 0, 0, citySpan * 0.55);
    smog.addColorStop(0, "rgba(255, 23, 199, 0.18)");
    smog.addColorStop(1, "rgba(255, 23, 199, 0)");
    ctx.fillStyle = smog;
    ctx.fillRect(-citySpan * 0.55, -citySpan * 0.55, citySpan * 1.1, citySpan * 1.1);
    ctx.restore();

    cityRows.forEach((row, depth) => {
      ctx.fillStyle = depth === 0 ? "#2a0745" : "#0e0126";
      for (const tower of row) {
        ctx.fillRect(tower.x - tower.w / 2, horizon - tower.h, tower.w, tower.h + 14);
      }
      // Rooflines catch the sunset the way the ridge crests do.
      ctx.globalAlpha = depth === 0 ? 0.35 : 0.55;
      ctx.strokeStyle = depth === 0 ? "#a021ff" : "#00eaff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const tower of row) {
        ctx.moveTo(tower.x - tower.w / 2, horizon - tower.h);
        ctx.lineTo(tower.x + tower.w / 2, horizon - tower.h);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      for (const tower of row) {
        if (!tower.mast) continue;
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = "#0e0126";
        ctx.beginPath();
        ctx.moveTo(tower.x, horizon - tower.h);
        ctx.lineTo(tower.x, horizon - tower.h - tower.mast);
        ctx.stroke();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#ff2e6e";
        ctx.fillRect(tower.x - 1, horizon - tower.h - tower.mast - 1.5, 2, 2);
        ctx.globalAlpha = 1;
      }
    });

    for (const win of windows) {
      ctx.globalAlpha = win.alpha;
      ctx.fillStyle = win.lit;
      ctx.fillRect(win.x, win.y, win.w, win.h);
    }
    ctx.globalAlpha = 1;

    // Two of them, parked in the skyline like municipal statuary. Played
    // straight they'd take over the backdrop, so they're scaled to read as
    // "wait, is that—" rather than as the subject.
    for (const bot of mechs) drawMech(bot.x, bot.scale, bot.flip);
  });

  const ground = ctx.createLinearGradient(0, horizon, 0, H);
  ground.addColorStop(0, "#6b0c58");
  ground.addColorStop(0.06, "#280442");
  ground.addColorStop(0.3, "#0b0119");
  ground.addColorStop(1, "#000000");
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, W, H - horizon);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addEdgeLines(mesh: THREE.Mesh, faceColor: THREE.Color): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 30);
  const inverted = new THREE.Color(1 - faceColor.r, 1 - faceColor.g, 1 - faceColor.b);
  const lineMat = new THREE.LineBasicMaterial({ color: inverted, transparent: true, opacity: 0.35 });
  const lines = new THREE.LineSegments(edges, lineMat);
  mesh.add(lines);
  return lines;
}

const HIGHLIGHT_WHITE = new THREE.Color(0xffffff);
/** Shared glow hue, so "this piece belongs with the one you are pointing at"
 *  reads the same whatever colour the piece itself is — including black. */
const GLOW_TINT = new THREE.Color(0xff17c7);

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

/**
 * Split a mesh's triangles into its separate solids. A colour pass unions every
 * piece drawn in that colour, but pieces that don't touch stay apart as
 * separate shells, and that is what lets one of them be lit alone. Vertices are
 * welded by position, since the split-by-colour geometry is unindexed.
 */
export function splitConnectedComponents(geo: THREE.BufferGeometry): THREE.BufferGeometry[] {
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const index = geo.getIndex();
  const cornerCount = index ? index.count : pos.count;
  const corner = (i: number) => (index ? index.getX(i) : i);

  const weld = new Map<string, number>();
  const welded = new Int32Array(pos.count);
  for (let v = 0; v < pos.count; v++) {
    const key = `${Math.round(pos.getX(v) * 1e4)},${Math.round(pos.getY(v) * 1e4)},${Math.round(pos.getZ(v) * 1e4)}`;
    let id = weld.get(key);
    if (id === undefined) {
      id = weld.size;
      weld.set(key, id);
    }
    welded[v] = id;
  }
  const parent = new Int32Array(weld.size).map((_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (let c = 0; c < cornerCount; c += 3) {
    const a = find(welded[corner(c)]);
    parent[find(welded[corner(c + 1)])] = a;
    parent[find(welded[corner(c + 2)])] = a;
  }

  const shells = new Map<number, number[]>();
  for (let c = 0; c < cornerCount; c += 3) {
    const root = find(welded[corner(c)]);
    let out = shells.get(root);
    if (!out) shells.set(root, (out = []));
    for (let k = 0; k < 3; k++) {
      const v = corner(c + k);
      out.push(pos.getX(v), pos.getY(v), pos.getZ(v));
    }
  }
  return [...shells.values()].map((positions) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.computeVertexNormals();
    return g;
  });
}

/**
 * Give each anchor the piece it sits in: of the candidate pieces whose bounds
 * hold the point, the one whose centre is nearest. Two anchors landing on one
 * piece means that piece is several fused together, so neither gets it.
 */
export function assignAnchors<T>(
  anchors: InstanceAnchor[],
  candidates: (id: string) => { item: T; box: THREE.Box3 }[],
): Map<string, T> {
  const claims = new Map<T, string[]>();
  const point = new THREE.Vector3();
  const centre = new THREE.Vector3();
  for (const anchor of anchors) {
    point.fromArray(anchor.at);
    let best: T | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const { item, box } of candidates(anchor.id)) {
      if (!box.clone().expandByScalar(1e-3).containsPoint(point)) continue;
      const dist = box.getCenter(centre).distanceTo(point);
      if (dist < bestDist) {
        bestDist = dist;
        best = item;
      }
    }
    if (best !== null) claims.set(best, [...(claims.get(best) ?? []), anchor.id]);
  }
  const out = new Map<string, T>();
  for (const [item, ids] of claims) if (ids.length === 1) out.set(ids[0], item);
  return out;
}

/** The anchors a 3MF carries, or [] when its preview echoes none. */
function readInstanceAnchors(data: ArrayBuffer): InstanceAnchor[] {
  const files = unzipSync(new Uint8Array(data), { filter: (f) => f.name === INSTANCE_ANCHORS_PATH });
  const json = files[INSTANCE_ANCHORS_PATH];
  return json ? (JSON.parse(strFromU8(json)) as InstanceAnchor[]) : [];
}

export function createViewer(container: HTMLElement): Viewer {
  const scene = new THREE.Scene();
  scene.background = makeSunsetTexture();

  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 10000);
  camera.position.set(100, 100, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  // Near-white key so filament colours read true, with a violet ambient and a
  // cyan rim: the neon comes off the scene, not out of the model's own colour.
  //
  // The ambient is the floor a face gets when it points away from both
  // directionals, so it sets how a part reads *unhighlighted*. Dark and
  // saturated, it rendered those faces as near-black violet — legible only
  // once hover or glow added emissive on top. Bright and near-neutral, they
  // read as the filament's own colour. The key drops to match: ambient + key
  // now lands just under clipping on a white filament, where before the lit
  // side blew out and the shadow side vanished.
  scene.add(new THREE.AmbientLight(0x7a6d8a));
  const key = new THREE.DirectionalLight(0xfff0ff, 0.8);
  key.position.set(1, 1, 1).normalize();
  scene.add(key);
  const back = new THREE.DirectionalLight(0x00eaff, 0.55);
  back.position.set(-1, -0.5, -1).normalize();
  scene.add(back);

  scene.add(new THREE.GridHelper(200, 20, 0xff2e6e, 0x39ff14));

  let currentGroup: THREE.Group | null = null;

  interface TrackedMesh {
    mesh: THREE.Mesh;
    material: THREE.MeshPhongMaterial;
    baseColor: THREE.Color;
    baseEmissive: THREE.Color;
    edges: THREE.LineSegments | null;
    edgeColor: THREE.Color;
    edgeOpacity: number;
    color: string;
    /** Set by resolveInstances once this mesh is known to be one named piece. */
    instance: string | null;
  }
  // A colour can appear in more than one 3MF object, so this is one-to-many.
  const meshesByColor = new Map<string, TrackedMesh[]>();
  const trackedByMesh = new Map<THREE.Mesh, TrackedMesh>();
  const trackedByInstance = new Map<string, TrackedMesh>();
  let instanceAnchors: InstanceAnchor[] = [];
  /** Colours already broken into their separate solids. */
  const splitColors = new Set<string>();
  let painted: TrackedMesh[] = [];
  let colorDisplay = new Map<string, ColorDisplay>();

  function applyDisplay(t: TrackedMesh) {
    const mode = colorDisplay.get(t.color) ?? "solid";
    t.mesh.visible = mode !== "hidden";
    t.material.transparent = mode === "ghost";
    t.material.opacity = mode === "ghost" ? GHOST_OPACITY : 1;
    // A ghost mustn't hide what's behind it from the depth test.
    t.material.depthWrite = mode !== "ghost";
    t.material.needsUpdate = true;
  }

  function setColorDisplay(display: Record<string, ColorDisplay>) {
    colorDisplay = new Map(Object.entries(display).map(([hex, mode]) => [hex.toLowerCase(), mode]));
    for (const t of trackedByMesh.values()) applyDisplay(t);
  }

  /** Meshes the pointer can land on: ghosted and hidden ones are looked through. */
  function pointerTargets(): THREE.Mesh[] {
    const targets: THREE.Mesh[] = [];
    currentGroup?.traverse((c) => {
      if (c instanceof THREE.Mesh && (colorDisplay.get(trackedByMesh.get(c)?.color ?? "") ?? "solid") === "solid") targets.push(c);
    });
    return targets;
  }

  const hoverListeners = new Set<(info: HoverInfo | null) => void>();
  const clickListeners = new Set<(color: string) => void>();

  // "sibling" is a fainter glow, for the rest of a part while one of its
  // pieces is lifted: at full glow a neon piece reads the same as the lifted one.
  function paint(t: TrackedMesh, state: "base" | "glow" | "sibling" | "hover") {
    if (state === "hover") {
      t.material.color.copy(t.baseColor).lerp(HIGHLIGHT_WHITE, 0.38);
      t.material.emissive.copy(t.baseColor).multiplyScalar(0.18);
    } else if (state === "glow" || state === "sibling") {
      t.material.color.copy(t.baseColor);
      // Self-illuminate in the piece's own hue, so a glowing part still reads
      // as the colour its swatch shows. A piece too dark to light itself —
      // black cap bodies, dark grey gaskets — falls back to the shared tint.
      const strength = state === "glow" ? 1 : 0.4;
      t.material.emissive.copy(t.baseColor).multiplyScalar(0.5 * strength);
      const lit = t.material.emissive;
      if (lit.r + lit.g + lit.b < 0.12 * strength) lit.copy(GLOW_TINT).multiplyScalar(0.35 * strength);
    } else {
      t.material.color.copy(t.baseColor);
      t.material.emissive.copy(t.baseEmissive);
    }
    t.material.needsUpdate = true;
    if (!t.edges) return;
    const lineMat = t.edges.material as THREE.LineBasicMaterial;
    if (state === "base") {
      lineMat.color.copy(t.edgeColor);
      lineMat.opacity = t.edgeOpacity;
    } else {
      lineMat.color.copy(state === "hover" ? HIGHLIGHT_WHITE : GLOW_TINT);
      lineMat.opacity = state === "sibling" ? 0.5 : 0.9;
    }
  }

  function setHighlight(state: HighlightState) {
    for (const t of painted) paint(t, "base");
    painted = [];
    const hover = state.hover ? state.hover.toLowerCase() : null;
    const glow = new Set((state.glow ?? []).map((c) => c.toLowerCase()));
    if (hover) glow.delete(hover);
    const glowPieces = (state.glowInstances ?? []).filter((id) => id !== state.hoverInstance);
    const lit = (ts: Iterable<TrackedMesh | undefined>, how: "glow" | "sibling" | "hover") => {
      for (const t of ts) {
        if (!t) continue;
        paint(t, how);
        painted.push(t);
      }
    };
    for (const color of glow) lit(meshesByColor.get(color) ?? [], "glow");
    lit(glowPieces.map((id) => trackedByInstance.get(id)), state.hoverInstance ? "sibling" : "glow");
    if (hover) lit(meshesByColor.get(hover) ?? [], "hover");
    if (state.hoverInstance) lit([trackedByInstance.get(state.hoverInstance)], "hover");
  }

  /** Where the middle of these meshes lands on screen — one piece, or all of a colour. */
  function projectMeshScreen(...meshes: THREE.Mesh[]): { x: number; y: number } | null {
    const box = new THREE.Box3();
    for (const mesh of meshes) {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      box.union(mesh.geometry.boundingBox!);
    }
    const center = new THREE.Vector3();
    box.getCenter(center);
    // Every piece shares one parent transform, so the first carries it.
    meshes[0].updateWorldMatrix(true, false);
    center.applyMatrix4(meshes[0].matrixWorld);
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
      for (const cb of hoverListeners) cb(null);
      return;
    }
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pointerTargets(), false);
    const hitMesh = hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;
    // Keyed off the mesh, not its current material colour — highlighting
    // mutates that colour, and the lookup has to survive it.
    const tracked = hitMesh ? trackedByMesh.get(hitMesh) : undefined;
    if (!tracked) {
      for (const cb of hoverListeners) cb(null);
      return;
    }
    const proj = projectMeshScreen(tracked.mesh);
    const info: HoverInfo = {
      color: tracked.color,
      instance: tracked.instance,
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
    const hits = raycaster.intersectObjects(pointerTargets(), false);
    if (hits.length === 0) return;
    const tracked = trackedByMesh.get(hits[0].object as THREE.Mesh);
    if (!tracked) return;
    for (const cb of clickListeners) cb(tracked.color);
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
    trackedByMesh.clear();
    trackedByInstance.clear();
    splitColors.clear();
    instanceAnchors = [];
    painted = [];
  }

  function trackMesh(mesh: THREE.Mesh, edges: THREE.LineSegments | null, byColor = true): TrackedMesh | null {
    const mat = mesh.material as THREE.MeshPhongMaterial;
    if (!mat || !mat.color) return null;
    const hex = toSrgbHex(mat.color);
    const lineMat = edges?.material as THREE.LineBasicMaterial | undefined;
    const tracked: TrackedMesh = {
      mesh,
      material: mat,
      baseColor: mat.color.clone(),
      baseEmissive: mat.emissive.clone(),
      edges,
      edgeColor: lineMat ? lineMat.color.clone() : new THREE.Color(),
      edgeOpacity: lineMat?.opacity ?? 0,
      color: hex,
      instance: null,
    };
    if (byColor) {
      const existing = meshesByColor.get(hex);
      if (existing) existing.push(tracked);
      else meshesByColor.set(hex, [tracked]);
    }
    trackedByMesh.set(mesh, tracked);
    applyDisplay(tracked);
    return tracked;
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
      trackMesh(mesh, addEdgeLines(mesh, material.color));
    } else {
      group = new ThreeMFLoader().parse(data) as THREE.Group;
      instanceAnchors = readInstanceAnchors(data);

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
            trackMesh(p, addEdgeLines(p, (p.material as THREE.MeshPhongMaterial).color));
          }
        } else if (!mat) {
          original.material = new THREE.MeshPhongMaterial({ color: DEFAULT_FACE, specular: 0x222222, shininess: 40 });
          trackMesh(original, addEdgeLines(original, new THREE.Color(DEFAULT_FACE)));
        } else if (mat.name === THREE.Loader.DEFAULT_MATERIAL_NAME) {
          mat.color.setHex(DEFAULT_FACE);
          mat.specular = new THREE.Color(0x222222);
          mat.shininess = 40;
          trackMesh(original, addEdgeLines(original, mat.color));
        } else {
          mat.specular = mat.specular ?? new THREE.Color(0x222222);
          mat.shininess = mat.shininess ?? 40;
          trackMesh(original, addEdgeLines(original, mat.color ?? new THREE.Color(0x808080)));
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
    if (opts.preserveView) {
      // Keep the camera where it is.
    } else if (opts.view) {
      camera.position.fromArray(opts.view.position);
      controls.target.fromArray(opts.view.target);
    } else {
      const fitDistance = maxDim / (2 * Math.tan((Math.PI * camera.fov) / 360));
      // Shallow elevation: enough to read the top of a part, low enough that
      // the backdrop's horizon and sun stay in frame.
      // Orbit about the middle of the model, not the floor under it, so the
      // model sits centred in the frame rather than above it.
      const midY = size.y / 2;
      camera.position.set(fitDistance * 1.2, midY + fitDistance * 0.42, fitDistance * 1.2);
      controls.target.set(0, midY, 0);
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

  function getPartColors(): string[] {
    return [...meshesByColor.keys()];
  }

  function getScreenPositionForColor(hex: string): { x: number; y: number } | null {
    const tracked = meshesByColor.get(hex.toLowerCase());
    if (!tracked || tracked.length === 0) return null;
    return projectMeshScreen(...tracked.map((t) => t.mesh));
  }

  /** Swap each of a colour's meshes for one mesh per separate solid in it. */
  function splitColor(color: string) {
    if (splitColors.has(color)) return;
    splitColors.add(color);
    const pieces: TrackedMesh[] = [];
    for (const t of meshesByColor.get(color) ?? []) {
      const shells = splitConnectedComponents(t.mesh.geometry);
      if (shells.length < 2) {
        pieces.push(t);
        continue;
      }
      const parent = t.mesh.parent!;
      parent.remove(t.mesh);
      trackedByMesh.delete(t.mesh);
      t.mesh.geometry.dispose();
      if (t.edges) {
        t.edges.geometry.dispose();
        (t.edges.material as THREE.Material).dispose();
      }
      for (const geo of shells) {
        // Its own material, so lighting one piece leaves its siblings alone.
        const mesh = new THREE.Mesh(geo, t.material.clone());
        mesh.position.copy(t.mesh.position);
        mesh.rotation.copy(t.mesh.rotation);
        mesh.scale.copy(t.mesh.scale);
        parent.add(mesh);
        const piece = trackMesh(mesh, t.edges ? addEdgeLines(mesh, t.baseColor) : null, false);
        if (piece) pieces.push(piece);
      }
      t.material.dispose();
    }
    meshesByColor.set(color, pieces);
  }

  function resolveInstances(colorsById: Map<string, string[]>): Set<string> {
    setHighlight({});
    for (const t of trackedByInstance.values()) t.instance = null;
    trackedByInstance.clear();
    const anchors = instanceAnchors.filter((a) => colorsById.has(a.id));
    for (const a of anchors) for (const c of colorsById.get(a.id)!) splitColor(c.toLowerCase());
    const assigned = assignAnchors(anchors, (id) =>
      colorsById.get(id)!.flatMap((c) => meshesByColor.get(c.toLowerCase()) ?? []).map((t) => {
        if (!t.mesh.geometry.boundingBox) t.mesh.geometry.computeBoundingBox();
        return { item: t, box: t.mesh.geometry.boundingBox! };
      }),
    );
    for (const [id, t] of assigned) {
      t.instance = id;
      trackedByInstance.set(id, t);
    }
    return new Set(assigned.keys());
  }

  function getScreenPositionForInstance(id: string): { x: number; y: number } | null {
    const t = trackedByInstance.get(id);
    return t ? projectMeshScreen(t.mesh) : null;
  }

  function getMeshStlByColor(hex: string): ArrayBuffer | null {
    const tracked = meshesByColor.get(hex.toLowerCase());
    if (!tracked || tracked.length === 0) return null;
    if (tracked.length === 1) return meshToBinaryStl(tracked[0].mesh.geometry);
    const merged = new THREE.BufferGeometry();
    const positions: number[] = [];
    for (const t of tracked) {
      const attr = t.mesh.geometry.getAttribute("position");
      for (let i = 0; i < attr.count; i++) positions.push(attr.getX(i), attr.getY(i), attr.getZ(i));
    }
    merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    merged.computeVertexNormals();
    return meshToBinaryStl(merged);
  }

  function getView(): ViewState {
    return {
      position: camera.position.toArray() as ViewState["position"],
      target: controls.target.toArray() as ViewState["target"],
    };
  }

  return {
    load, clear, dispose, onHover, onClick, setHighlight, getPartColors, getScreenPositionForColor,
    resolveInstances, getScreenPositionForInstance, getMeshStlByColor, setColorDisplay, getView,
  };
}

/**
 * Serialize a BufferGeometry to a binary STL. Recenters XY to the origin
 * and drops minZ to 0 so the exported piece is print-ready without needing
 * further transforms in the slicer.
 */
function meshToBinaryStl(geo: THREE.BufferGeometry): ArrayBuffer {
  const posAttr = geo.getAttribute("position") as THREE.BufferAttribute | undefined;
  if (!posAttr) return new ArrayBuffer(84);

  // Compute bbox to recenter XY / floor Z.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const dz = minZ;

  const triCount = Math.floor(posAttr.count / 3);
  const buf = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buf);
  // 80-byte header left as zeros. UInt32 triangle count at offset 80.
  view.setUint32(80, triCount, true);

  let off = 84;
  const tmp = new Float32Array(3);
  for (let t = 0; t < triCount; t++) {
    const i0 = t * 3;
    const x0 = posAttr.getX(i0) - cx, y0 = posAttr.getY(i0) - cy, z0 = posAttr.getZ(i0) - dz;
    const x1 = posAttr.getX(i0 + 1) - cx, y1 = posAttr.getY(i0 + 1) - cy, z1 = posAttr.getZ(i0 + 1) - dz;
    const x2 = posAttr.getX(i0 + 2) - cx, y2 = posAttr.getY(i0 + 2) - cy, z2 = posAttr.getZ(i0 + 2) - dz;

    // Face normal via (v1-v0) × (v2-v0).
    const ax = x1 - x0, ay = y1 - y0, az = z1 - z0;
    const bx = x2 - x0, by = y2 - y0, bz = z2 - z0;
    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;
    const len = Math.hypot(nx, ny, nz);
    if (len > 0) { nx /= len; ny /= len; nz /= len; }

    tmp[0] = nx; tmp[1] = ny; tmp[2] = nz;
    view.setFloat32(off, nx, true); off += 4;
    view.setFloat32(off, ny, true); off += 4;
    view.setFloat32(off, nz, true); off += 4;
    view.setFloat32(off, x0, true); off += 4;
    view.setFloat32(off, y0, true); off += 4;
    view.setFloat32(off, z0, true); off += 4;
    view.setFloat32(off, x1, true); off += 4;
    view.setFloat32(off, y1, true); off += 4;
    view.setFloat32(off, z1, true); off += 4;
    view.setFloat32(off, x2, true); off += 4;
    view.setFloat32(off, y2, true); off += 4;
    view.setFloat32(off, z2, true); off += 4;
    view.setUint16(off, 0, true); off += 2;
  }
  return buf;
}
