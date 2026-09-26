import { createViewer, type ColorDisplay, type ModelFormat, type ViewState } from "@3d-gallery/viewer";
import { registerSW } from "virtual:pwa-register";
import { render, h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";

// PWA: check for a new SW every time the app opens; if one is
// waiting, activate it and reload so the user always sees the latest
// deploy. Between opens the cached shell keeps working offline.
//
// In dev, actively unregister any lingering service worker (from a
// previous prod visit on localhost, or a stale `vite preview` run) and
// nuke its caches. Without this, the SW keeps serving the old bundle
// and edits appear to not take effect until the whole browser cache is
// cleared — which is what people mean when they say "I have to kill
// the dev server."
// Bundle marker — if you don't see this in the console after refresh,
// your browser is still running a cached bundle (probably from a stale
// service worker) and none of the recent fixes are in effect.
console.info("[3d-gallery] boot", { dev: import.meta.env.DEV, buildTag: __BUILD_TAG__ });

if (import.meta.env.PROD) {
  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) registration.update().catch(() => {});
    },
    onNeedRefresh() {
      void updateSW(true);
    },
  });
} else if ("serviceWorker" in navigator) {
  // Kill any lingering service worker + cache from a prior prod visit
  // (or an old `vite preview`) that's still intercepting fetches with a
  // stale bundle. Reload once so the current page runs the fresh code.
  (async () => {
    let didWork = false;
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        if (await r.unregister()) didWork = true;
      }
    } catch { /* noop */ }
    try {
      if ("caches" in window) {
        const names = await caches.keys();
        for (const n of names) {
          if (await caches.delete(n)) didWork = true;
        }
      }
    } catch { /* noop */ }
    if (didWork) {
      console.warn("[3d-gallery] cleared stale service worker + caches — reloading");
      window.location.reload();
    }
  })();
}

// Install button: hidden until Chromium fires beforeinstallprompt
// (i.e. install is actually available on this browser + state). Once
// installed or dismissed, hide it again so it doesn't linger.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
const installBtn = document.getElementById("install-app") as HTMLButtonElement | null;
if (installBtn) {
  const alreadyInstalled = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (!alreadyInstalled) {
    let deferred: BeforeInstallPromptEvent | null = null;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferred = e as BeforeInstallPromptEvent;
      installBtn.hidden = false;
    });
    installBtn.addEventListener("click", async () => {
      if (!deferred) return;
      installBtn.disabled = true;
      await deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      installBtn.hidden = true;
      installBtn.disabled = false;
    });
    window.addEventListener("appinstalled", () => {
      deferred = null;
      installBtn.hidden = true;
    });
  }
}
import { parseParams, coerceToParamType, mainAssembly, selectBuild, KEY_SCHEMA, describeProfile, recommendedProfile, plateMaterial } from "@3d-gallery/model-core";
import type { ScadParam, ScadValue, RuntimeManifest, PrintProfileHint } from "@3d-gallery/model-core";
import {
  createArtifactClient,
  createIdbCache,
  createWasmRenderer,
  embedSourceUrl,
  type ArtifactClient,
  type ArtifactSource,
} from "@3d-gallery/viewer";
import {
  PRINT_ROUTE_PARAMS,
  initPrintRouting,
  openCurrentProject,
  openProjectPlanner,
} from "./print/mount";
import { openNewProject } from "./print/current-project";
import { setPlateArtifactClient } from "./print/plate-resolve";
import { listPresets } from "./print/print-storage";
import { CUSTOMIZABLE_SOURCES as INITIAL_SOURCES } from "./customizable-sources";
import {
  addItemToPlate,
  createPlatesWithItems,
  ensureTargetPlate,
} from "./print/plate-store";

interface LegendEntry {
  color: string;
  /** Alternate shades of `color`, alternating piece to piece; the same entry. */
  shades?: string[];
  label: string;
  note?: string;
  /** File name of the part this legend row navigates to when clicked. */
  part?: string;
  /** Every part drawn in this colour, when that is more than `part`. */
  parts?: string[];
  /** Customizer params applied when navigating (e.g. { piece_i: 1 }). */
  params?: Record<string, ScadValue>;
}

interface ComponentInstance {
  id: string;
  where?: string;
}

interface ComponentRef {
  part: string;
  qty: number;
  instances?: ComponentInstance[];
}

interface Part {
  file: string;
  format: ModelFormat;
  label: string;
  note?: string;
  default?: boolean;
  legend?: LegendEntry[];
  module?: string;
  components?: ComponentRef[];
  /** Key of the artifact rendered with default parameters (runtime manifest). */
  defaultKey?: string;
  /** One bed's worth of pieces in print orientation. */
  plate?: boolean;
}

interface HardwareSource {
  url: string;
  vendor?: string;
}

interface HardwareUse {
  part: string;
  /** Per printed piece of `part`. */
  each: number;
}

interface HardwareItem {
  qty: number;
  label: string;
  source?: HardwareSource;
  usedBy?: HardwareUse[];
}

/** A product the model is designed around rather than built from. */
interface CompatibleProduct {
  label: string;
  qty?: number;
  note?: string;
  source?: HardwareSource;
}

interface FilamentEntry {
  material: string;
  color?: string;
  note?: string;
  /** Printed files this filament is for; without it, every part no other entry names. */
  parts?: string[];
  source?: HardwareSource;
}

/** One configuration of a generator model, with its own entries and hardware. */
interface Build {
  id: string;
  label: string;
  default?: boolean;
  params: Record<string, ScadValue>;
  previews?: Part[];
  parts?: Part[];
  hardware?: HardwareItem[];
}

interface Model {
  slug: string;
  title: string;
  description?: string;
  customizable?: boolean;
  /** Opened when the app loads without a route. */
  default?: boolean;
  /** Work in progress — a published manifest never carries one. */
  devOnly?: boolean;
  previews?: Part[];
  parts?: Part[];
  hardware?: HardwareItem[];
  worksWith?: CompatibleProduct[];
  filament?: FilamentEntry[];
  printProfile?: PrintProfileHint;
  builds?: Build[];
  /** On a view made by `viewOf`: the build whose entries `previews`, `parts` and `hardware` hold. */
  build?: Build;
}

interface Manifest {
  models: Model[];
}

// ── DOM refs ─────────────────────────────────────────────

const sidebarEl = document.getElementById("sidebar")!;
const sidebarToggle = document.getElementById("sidebar-toggle")!;
const sidebarBackdrop = document.getElementById("sidebar-backdrop")!;
const modelListEl = document.getElementById("model-list")!;
const modelTitleEl = document.getElementById("model-title")!;
const buildSwitchEl = document.getElementById("build-switch")!;
const modelDescEl = document.getElementById("model-description")!;
const partSelect = document.getElementById("part-select") as HTMLSelectElement;
const mobilePartSelect = document.getElementById("mobile-part-select") as HTMLSelectElement;
const viewerContainer = document.getElementById("viewer-container")!;
const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
const printBtn = document.getElementById("print-btn") as HTMLButtonElement | null;
const platesBtn = document.getElementById("plates-btn") as HTMLButtonElement | null;
const errorEl = document.getElementById("viewer-error")!;
const descTextEl = document.getElementById("description-text")!;
const descToggle = document.getElementById("description-toggle") as HTMLButtonElement;
const printedListEl = document.getElementById("printed-list")!;
const hardwareEl = document.getElementById("hardware-list")!;
const unlinkedListEl = document.getElementById("unlinked-list")!;
const worksWithEl = document.getElementById("works-with-list")!;
const filamentListEl = document.getElementById("filament-list")!;
const printTimeEl = document.getElementById("print-time")!;
const projectActionsEl = document.getElementById("project-actions")!;
const infoPanelEl = document.getElementById("info-panel")!;
const infoPanelEmpty = document.getElementById("info-panel-empty")!;
const infoBtn = document.getElementById("info-btn") as HTMLButtonElement;
const infoCloseBtn = document.getElementById("info-close") as HTMLButtonElement;
const legendEl = document.getElementById("viewer-legend")!;
const customizerEl = document.getElementById("customizer")!;
const customizerBackdrop = document.getElementById("customizer-backdrop")!;
const customizeBtn = document.getElementById("customize-btn") as HTMLButtonElement;
const customizedBadge = document.getElementById("customized-badge")!;
const staleBadge = document.getElementById("stale-badge")!;
const loadingOverlay = document.getElementById("viewer-loading")!;
const loadingStatus = loadingOverlay.querySelector(".loading-status")!;
const loadingNote = loadingOverlay.querySelector(".loading-note") as HTMLElement;
const loadingBarFill = loadingOverlay.querySelector(".loading-bar-fill") as HTMLElement;
const viewerPrompt = document.getElementById("viewer-prompt")!;
const leaderSvg = document.getElementById("viewer-leader") as unknown as SVGSVGElement;

const viewer = createViewer(viewerContainer);

// Bidirectional parts-key ↔ viewer hover wiring. A group is one physical
// part of the assembly — every piece of it, whatever colour those pieces are
// drawn in. Rebuilt whenever the key re-renders; the viewer's hover callback
// and the key rows drive the same handler so the active state stays
// consistent no matter the input device.
interface PartGroup {
  /** Display colours of every piece belonging to this part, as authored — each entry's colour, then its shades. */
  colors: string[];
  /** Drawn by a single key entry — one filament, however many shades — so each piece is one mesh. */
  oneEntry: boolean;
  /** Those colours snapped onto what the loaded mesh actually carries. */
  meshColors: string[];
  /** How many pieces of this part the assembly contains. */
  qty: number;
  label: string;
  note?: string;
  /** Every part file this entry draws; the parts list groups those files under it. */
  files: string[];
  /** The floating key's row first, then any parts-list rows naming the same part. */
  rows: HTMLElement[];
  /** Manifest entry to open on click, when the part resolves to one. */
  target: Part | null;
  params?: Record<string, ScadValue>;
}

let partGroups: PartGroup[] = [];
const partGroupByColor = new Map<string, PartGroup>();
/** Key groups by every part file they draw — how the parts list finds its swatches. */
const partGroupsByFile = new Map<string, PartGroup[]>();
/** Key groups naming no part: reference geometry, or a single part's filaments. */
let unlinkedGroups: PartGroup[] = [];
let legendIsPartsKey = false;
let activeGroup: PartGroup | null = null;
/** Colour of the piece the leader line points at. */
let activeColor: string | null = null;
/** The row under the pointer, when a row (not the mesh) set the active part. */
let activeRow: HTMLElement | null = null;
/** Set by renderLegend: only an assembly's key has parts worth pointing at. */
let leaderEnabled = false;

// Named pieces (B1, W3, …). A colour can hold several parts, so where the
// viewer can tell a part's pieces apart they light one by one: a part's rows
// glow just its pieces, and an id lifts its own piece above them.
/** Part file of every named piece in this view's BOM. */
const pieceFile = new Map<string, string>();
/** Parts whose every named piece the viewer has placed. */
const piecesByFile = new Map<string, string[]>();
/** Parts-list rows by the part file they count. */
const rowsByFile = new Map<string, HTMLElement[]>();
/** Every list element naming a piece, by id. */
const pieceEls = new Map<string, HTMLElement[]>();
/** What a bound row lights when the pointer comes back to it off one of its ids. */
const rowActivators = new WeakMap<HTMLElement, () => void>();
/** Set while parts are lit piece by piece rather than by colour. */
let activeFiles: string[] = [];
let activePiece: string | null = null;

function normColor(hex: string): string {
  return hex.toLowerCase();
}

/**
 * Two tiers of highlight: the piece under the cursor brightens, and every
 * other piece of the same part glows. Pointing at a key row has no single
 * piece under the cursor, so it glows the whole group and anchors the leader
 * line (when one is drawn) on the first piece.
 */
function setActivePart(group: PartGroup | null, hoverColor: string | null, row: HTMLElement | null = null) {
  activeGroup = group;
  activeRow = row;
  activeColor = hoverColor ?? group?.meshColors[0] ?? null;
  activeFiles = [];
  activePiece = null;
  clearActiveClasses();
  for (const row of group?.rows ?? []) row.classList.add("legend-active");
  viewer.setHighlight({ hover: hoverColor, glow: group?.meshColors ?? [] });
  updateLeaderLine();
}

function clearActiveClasses() {
  for (const el of document.querySelectorAll(".legend-active")) el.classList.remove("legend-active");
  for (const el of document.querySelectorAll(".piece-active")) el.classList.remove("piece-active");
}

/**
 * Light these parts' pieces, not their whole colour. With `piece`, that one
 * lifts bright above its glowing siblings, its id lights up in the list, and
 * the leader runs between the two; without, a leader runs to every piece.
 */
function setActivePieces(files: string[], piece: string | null, row: HTMLElement | null) {
  const groups = [...new Set(files.flatMap((f) => partGroupsByFile.get(f) ?? []))];
  activeGroup = groups[0] ?? null;
  activeRow = row;
  activeColor = null;
  activeFiles = files;
  activePiece = piece;
  clearActiveClasses();
  // The key row stands for the colour, which these parts are drawn in.
  for (const g of groups) g.rows[0]?.classList.add("legend-active");
  for (const f of files) for (const r of rowsByFile.get(f) ?? []) r.classList.add("legend-active");
  if (piece) for (const el of pieceEls.get(piece) ?? []) el.classList.add("piece-active");
  viewer.setHighlight({ hoverInstance: piece, glowInstances: piecesOf(files) });
  updateLeaderLine();
}

function piecesOf(files: string[]): string[] {
  return files.flatMap((f) => piecesByFile.get(f) ?? []);
}

/** Every one of these parts' pieces is placed, so they can be lit one by one. */
function allPlaced(files: string[]): boolean {
  return files.length > 0 && files.every((f) => piecesByFile.has(f));
}

/**
 * Tie this view's named pieces to the loaded mesh. Only a part drawn by one
 * key entry qualifies — a multicolour part is several meshes per piece, while
 * an entry's shades only alternate from piece to piece — and only when the
 * viewer places every piece of it; a part with any piece fused to a neighbour
 * stays lit by colour, as before.
 */
function resolvePieces() {
  pieceFile.clear();
  piecesByFile.clear();
  if (!currentModel || !currentPart) return;
  const colorsById = new Map<string, string[]>();
  const idsByFile = new Map<string, string[]>();
  for (const comp of bomFor(currentModel, currentPart).entries) {
    const groups = partGroupsByFile.get(comp.part) ?? [];
    if (groups.length !== 1 || !groups[0].oneEntry || !comp.instances) continue;
    const colors = groups[0].meshColors;
    for (const inst of comp.instances) {
      colorsById.set(inst.id, colors);
      pieceFile.set(inst.id, comp.part);
    }
    idsByFile.set(comp.part, [...(idsByFile.get(comp.part) ?? []), ...comp.instances.map((i) => i.id)]);
  }
  const placed = viewer.resolveInstances(colorsById);
  for (const [file, ids] of idsByFile) {
    if (ids.every((id) => placed.has(id))) piecesByFile.set(file, ids);
  }
  for (const [id, els] of pieceEls) {
    for (const el of els) el.classList.toggle("piece-live", isPieceLive(id));
  }
}

function isPieceLive(id: string): boolean {
  const file = pieceFile.get(id);
  return file !== undefined && piecesByFile.has(file);
}

/**
 * Join the key to the loaded mesh by colour. A manifest hex and the hex the
 * viewer reads back off the mesh now describe the same sRGB value, but they
 * get there through OpenSCAD's 6-significant-digit CSG floats and two 8-bit
 * roundings, so they can still land a shade apart — near enough to snap, far
 * enough that an exact match would silently drop the row. Runs after every
 * load because the colours only exist once the mesh is in the viewer.
 */
const COLOR_SNAP_TOLERANCE = 12;

function colorDistance(a: string, b: string): number {
  const ca = parseInt(a.slice(1), 16);
  const cb = parseInt(b.slice(1), 16);
  if (Number.isNaN(ca) || Number.isNaN(cb)) return Number.POSITIVE_INFINITY;
  const dr = ((ca >> 16) & 0xff) - ((cb >> 16) & 0xff);
  const dg = ((ca >> 8) & 0xff) - ((cb >> 8) & 0xff);
  const db = (ca & 0xff) - (cb & 0xff);
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function resolvePartColors() {
  const loaded = viewer.getPartColors();
  if (loaded.length === 0) return;
  for (const group of partGroups) {
    group.meshColors = group.colors.map((color) => {
      let best = color;
      let bestDist = COLOR_SNAP_TOLERANCE;
      for (const candidate of loaded) {
        const dist = colorDistance(color, candidate);
        if (dist <= bestDist) {
          bestDist = dist;
          best = candidate;
        }
      }
      return best;
    });
    for (const color of group.meshColors) partGroupByColor.set(color, group);
  }
  resolvePieces();
  applyReferenceDisplay();
}

function updateLeaderLine() {
  clearLeader();
  if (!leaderEnabled || !activeGroup) return;
  let row: HTMLElement | undefined;
  let meshPositions: { x: number; y: number }[];
  if (activeFiles.length > 0) {
    // A piece reads its own id; a row with no piece picked points at all of its pieces.
    const pieces = activePiece ? [activePiece] : piecesOf(activeFiles);
    row = activeRow
      ?? (activePiece ? pieceEls.get(activePiece)?.find(isRowOnScreen) : undefined)
      ?? activeFiles.map((f) => rowsByFile.get(f)?.find(isRowOnScreen)).find((r) => r !== undefined)
      ?? activeGroup.rows.find(isRowOnScreen);
    meshPositions = pieces
      .map((id) => viewer.getScreenPositionForInstance(id))
      .filter((p) => p !== null);
  } else {
    if (!activeColor) return;
    // Desktop hides the floating key behind the docked parts list, so the
    // leader goes to whichever of the group's rows is actually on screen.
    row = activeRow ?? activeGroup.rows.find(isRowOnScreen);
    const meshPos = viewer.getScreenPositionForColor(activeColor);
    meshPositions = meshPos ? [meshPos] : [];
  }
  if (!row || meshPositions.length === 0) return;

  // Legend row's midpoint on its left edge — the leader lands where the
  // color swatch sits so the connection reads visually as "this piece →
  // that row."
  const containerRect = viewerContainer.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();
  // A parts-list row sits outside the viewer; stop at the viewer's edge,
  // level with the row, rather than draw across the panel.
  const rowX = Math.min(rowRect.left - containerRect.left, containerRect.width);
  const rowY = Math.min(
    Math.max(rowRect.top - containerRect.top + rowRect.height / 2, 0),
    containerRect.height,
  );

  for (const p of meshPositions) drawLeader(p.x, p.y, rowX, rowY);
}

/** Laid out, and inside whatever scroll box holds it. */
function isRowOnScreen(row: HTMLElement): boolean {
  const rect = row.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const clip = row.closest("#info-panel-body, #viewer-legend")?.getBoundingClientRect();
  return !clip || (rect.bottom > clip.top && rect.top < clip.bottom);
}

function clearLeader() {
  while (leaderSvg.firstChild) leaderSvg.removeChild(leaderSvg.firstChild);
}

function drawLeader(x1: number, y1: number, x2: number, y2: number) {
  const svgNs = "http://www.w3.org/2000/svg";
  const dot = document.createElementNS(svgNs, "circle");
  dot.setAttribute("cx", String(x1));
  dot.setAttribute("cy", String(y1));
  dot.setAttribute("r", "3");
  leaderSvg.appendChild(dot);
  const line = document.createElementNS(svgNs, "line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  leaderSvg.appendChild(line);
}

viewer.onHover((info) => {
  if (!info) {
    viewerContainer.style.cursor = "";
    setActivePart(null, null);
    return;
  }
  const col = normColor(info.color);
  // A 3MF can carry ancillary colours that no key row claims. Those still
  // brighten under the cursor; they just have no part to glow or link to.
  const group = partGroupByColor.get(col) ?? null;
  viewerContainer.style.cursor = group?.target ? "pointer" : "";
  const file = info.instance ? pieceFile.get(info.instance) : undefined;
  if (file && piecesByFile.has(file)) setActivePieces([file], info.instance, null);
  else setActivePart(group, col);
  if (group) warmGroup(group);
});

// Clicking a mesh opens the same part its key row links to — delegated by
// dispatching the row's own click handler so both entry points share a flow.
viewer.onClick((hex) => {
  const row = partGroupByColor.get(normColor(hex))?.rows[0];
  if (row?.classList.contains("legend-clickable")) row.click();
});

// Redraw the leader line each animation frame while a part is active so it
// tracks camera orbit without needing a viewer event.
function leaderTick() {
  if (leaderEnabled && activeGroup) updateLeaderLine();
  requestAnimationFrame(leaderTick);
}
requestAnimationFrame(leaderTick);

// Mobile sidebar drawer
function setSidebarOpen(open: boolean) {
  sidebarEl.classList.toggle("open", open);
  document.body.classList.toggle("sidebar-open", open);
  sidebarToggle.setAttribute("aria-expanded", String(open));
}

sidebarToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  setSidebarOpen(!sidebarEl.classList.contains("open"));
});

sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));

// ── Mobile header controls ───────────────────────────────
// The customizer sheet is CSS-gated to narrow viewports; the handler below
// just owns its open/closed state.

// The blurb is clamped to a couple of lines everywhere and opens on demand.
// Whether a given description actually overflows that clamp is a measurement,
// not something CSS can express, so the toggle is shown only when it does.
function syncDescriptionToggle() {
  requestAnimationFrame(() => {
    // Expanded, scrollHeight equals clientHeight — measuring then would hide
    // the only control that collapses it again.
    if (modelDescEl.classList.contains("expanded")) return;
    descToggle.hidden = descTextEl.scrollHeight <= descTextEl.clientHeight + 1;
  });
}

function setDescriptionExpanded(expanded: boolean) {
  modelDescEl.classList.toggle("expanded", expanded);
  descToggle.setAttribute("aria-expanded", String(expanded));
  descToggle.textContent = expanded ? "Less" : "More";
  if (!expanded) syncDescriptionToggle();
}

descToggle.addEventListener("click", () => {
  setDescriptionExpanded(!modelDescEl.classList.contains("expanded"));
});

window.addEventListener("resize", syncDescriptionToggle);

function setCustomizerOpen(open: boolean) {
  document.body.classList.toggle("customizer-open", open);
  customizeBtn.setAttribute("aria-expanded", String(open));
}

customizeBtn.addEventListener("click", () => {
  setCustomizerOpen(!document.body.classList.contains("customizer-open"));
});

customizerBackdrop.addEventListener("click", () => setCustomizerOpen(false));

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  setCustomizerOpen(false);
  setSidebarOpen(false);
});

function closeSidebarDrawer() {
  if (window.innerWidth < 1280) setSidebarOpen(false);
}

// Track current blob URL for cleanup
let currentBlobUrl: string | null = null;

function formatOf(file: string): ModelFormat | null {
  if (file.endsWith(".stl")) return "stl";
  if (file.endsWith(".3mf")) return "3mf";
  return null;
}

function setError(msg: string | null) {
  if (msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  } else {
    errorEl.hidden = true;
  }
}

function setCustomizedBadge(visible: boolean, origin?: ArtifactOrigin) {
  customizedBadge.hidden = !visible;
  customizedBadge.textContent = origin ? `Customized · ${ORIGIN_SHORT[originKind(origin)]}` : "Customized";
  // Estimates are for the default parameters; a customized render is a different print.
  printTimeEl.hidden = visible || printTimeEl.childElementCount === 0;
}

/** `slow` shows the note that a browser render takes a while. */
function showLoadingOverlay(status: string, slow = false) {
  loadingStatus.textContent = status;
  loadingNote.hidden = !slow;
  loadingOverlay.hidden = false;

  const pctMatch = status.match(/(\d{1,3})%/);
  if (pctMatch) {
    const pct = Math.min(parseInt(pctMatch[1], 10), 100);
    loadingBarFill.style.width = `${pct}%`;
    loadingBarFill.style.marginLeft = "0";
    loadingBarFill.style.animation = "none";
  } else {
    loadingBarFill.style.width = "";
    loadingBarFill.style.marginLeft = "";
    loadingBarFill.style.animation = "";
  }
}

function hideLoadingOverlay() {
  loadingOverlay.hidden = true;
}

function showViewerPrompt() {
  viewerPrompt.hidden = false;
}

function hideViewerPrompt() {
  viewerPrompt.hidden = true;
}

// ── URL routing ──────────────────────────────────────────

// Everything else in the query is a customizer parameter, so the print UI's
// own route names have to be named here or a `?plate=<id>` deep link would
// reach the model as a param.
const ROUTE_PARAMS = new Set(["model", "build", "part", ...PRINT_ROUTE_PARAMS]);

function buildUrl(
  slug: string,
  partModule?: string,
  customValues?: Record<string, ScadValue>,
  buildId?: string,
): string {
  const url = new URL(window.location.href);
  // The query is rebuilt from scratch so a stale customizer param can't
  // survive a model switch — but the print UI's params say which panel is
  // open, which this router knows nothing about. Carry them across.
  const open = new Map<string, string>();
  for (const name of PRINT_ROUTE_PARAMS) {
    const value = url.searchParams.get(name);
    if (value !== null) open.set(name, value);
  }
  url.search = "";
  for (const [name, value] of open) url.searchParams.set(name, value);
  url.searchParams.set("model", slug);
  if (buildId) url.searchParams.set("build", buildId);
  if (partModule) url.searchParams.set("part", partModule);
  if (customValues) {
    for (const [k, v] of Object.entries(customValues)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.pathname + url.search;
}

function isSameRoute(a: string, b: string): boolean {
  const canon = (path: string) => {
    const url = new URL(path, window.location.origin);
    url.searchParams.sort();
    return url.pathname + url.search;
  };
  return canon(a) === canon(b);
}

function pushRoute(slug: string, partModule?: string, customValues?: Record<string, ScadValue>, buildId?: string) {
  const path = buildUrl(slug, partModule, customValues, buildId);
  // buildUrl puts the print UI's params first; the print router appends them
  // last. Same route, different order — pushing it would stack a Back step
  // that goes nowhere.
  if (!isSameRoute(window.location.pathname + window.location.search, path)) {
    history.pushState({ slug, build: buildId, part: partModule, custom: customValues }, "", path);
  }
}

function getRouteFromUrl(): {
  slug: string;
  buildId?: string;
  partModule?: string;
  customValues: Record<string, string>;
} | null {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("model");
  if (!slug) return null;
  const buildId = params.get("build") ?? undefined;
  const partModule = params.get("part") ?? undefined;
  const customValues: Record<string, string> = {};
  for (const [k, v] of params.entries()) {
    if (!ROUTE_PARAMS.has(k)) customValues[k] = v;
  }
  return { slug, buildId, partModule, customValues };
}

// ── Builds ───────────────────────────────────────────────

/**
 * The model as one of its builds presents it: that build's entries and
 * hardware in place of the model's own, so everything downstream of selection
 * reads `previews`, `parts` and `hardware` without knowing builds exist. A
 * model without builds is its own view.
 */
function viewOf(model: Model, buildId?: string | null): Model {
  if (!model.builds) return model;
  const view = selectBuild(model, buildId);
  return { ...model, previews: view.previews, parts: view.parts, hardware: view.hardware, build: view.build as Build };
}

/** Where a view's named outputs live under `models/<slug>/`. */
function partPath(model: Model, part: Part): string {
  return `${import.meta.env.BASE_URL}models/${model.slug}/${model.build ? `${model.build.id}/` : ""}${part.file}`;
}

/** What a view's entries render with when nothing is customized. */
function buildParams(model: Model): Record<string, ScadValue> | undefined {
  return model.build?.params;
}

/**
 * The build switch sits beside the title rather than in the part list: a
 * build replaces the whole list, BOM and hardware, so it is a choice made
 * before any part is. Switching keeps the entry on screen when the other build
 * has it too.
 */
function renderBuildSwitch(model: Model) {
  buildSwitchEl.innerHTML = "";
  buildSwitchEl.hidden = !model.builds;
  for (const build of model.builds ?? []) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(build.id === model.build?.id));
    tab.textContent = build.label;
    tab.addEventListener("click", () => {
      if (!currentModel || build.id === currentModel.build?.id) return;
      const next = viewOf(currentModel, build.id);
      const file = currentPart?.file;
      const same = allItemsFor(next).find((i) => i.part.file === file)?.part;
      selectModel(next, same);
    });
    buildSwitchEl.appendChild(tab);
  }
}

// ── Artifact client ──────────────────────────────────────

/** A part's file base name — how the runtime manifest addresses it. */
function targetOf(part: Part): string {
  return part.file.replace(/\.\w+$/, "");
}

// Updated in place on HMR: the WASM renderer holds this object, so an edited
// .scad reaches it without rebuilding the renderer or reloading the page.
const customizableSources = { ...INITIAL_SOURCES };

const artifactCache = createIdbCache();
let artifactClient: ArtifactClient | null = null;

/** Progress sink of the resolve in flight, if any. */
let renderProgress: ((status: string) => void) | null = null;
/** Stage sink of the resolve in flight, if any. */
let renderStage: ((stage: ResolveStage) => void) | null = null;
/** `x-forge-status` off the most recent artifact response: `hit` or `built`. */
let lastForgeStatus: string | null = null;

const trackedFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);
  const status = res.headers.get("x-forge-status");
  if (status) lastForgeStatus = status;
  return res;
};

function buildArtifactClient(manifest: RuntimeManifest): ArtifactClient {
  return createArtifactClient({
    manifest,
    cache: artifactCache,
    localRenderer: createWasmRenderer(customizableSources, {
      onLog: (line) => renderProgress?.(line),
    }),
    // Only the dev middleware can answer the `?r=` retry. On a static host it
    // is a second 404 in front of the browser render we already know we need.
    allowServerRender: import.meta.env.DEV,
    fetchImpl: trackedFetch,
    onLog: (line) => {
      console.debug("[3d-gallery] artifact", line);
      const stage = RESOLVE_STAGES.find((s) => line.startsWith(`${s} `));
      if (stage) renderStage?.(stage);
    },
  });
}

interface ArtifactOrigin {
  source: ArtifactSource;
  key: string;
  /** Forge render status, when the response carried one. */
  forgeStatus: string | null;
}

/** The artifact client's log prefixes, in the order a resolve passes them. */
const RESOLVE_STAGES = ["cache", "fetch", "server render", "local render"] as const;
type ResolveStage = (typeof RESOLVE_STAGES)[number];

/** What the user waits on at each stage. Only a render is worth warning about. */
const STAGE_STATUS: Record<ResolveStage, string> = {
  cache: "Found in cache — loading…",
  fetch: "Downloading…",
  "server render": "Generating on the dev server…",
  "local render": "Generating in your browser…",
};

type OriginKind = "cached" | "downloaded" | "server" | "browser";

function originKind(origin: ArtifactOrigin): OriginKind {
  if (origin.source === "local") return "browser";
  if (origin.source === "network") return origin.forgeStatus === "built" ? "server" : "downloaded";
  return "cached";
}

const ORIGIN_LABEL: Record<OriginKind, string> = {
  cached: "Loaded from cache",
  downloaded: "Downloaded prebuilt",
  server: "Generated on the dev server",
  browser: "Generated in your browser",
};

const ORIGIN_SHORT: Record<OriginKind, string> = {
  cached: "from cache",
  downloaded: "prebuilt",
  server: "generated",
  browser: "generated",
};

async function resolveArtifact(
  req: { slug: string; target: string; params?: Record<string, ScadValue> },
  onProgress: (status: string) => void,
  onStage: (stage: ResolveStage) => void,
  force = false,
): Promise<{ bytes: ArrayBuffer; format: ModelFormat; origin: ArtifactOrigin }> {
  if (!artifactClient) throw new Error("The model manifest hasn't loaded yet — reload the page.");
  lastForgeStatus = null;
  renderProgress = onProgress;
  renderStage = onStage;
  try {
    const { bytes, format, key, source } = await artifactClient.get(req, { force });
    return { bytes, format, origin: { source, key, forgeStatus: lastForgeStatus } };
  } finally {
    renderProgress = null;
    renderStage = null;
  }
}

/**
 * When a user clicks a colored legend piece on an already-loaded assembled
 * preview, that mesh is *already* sitting in the viewer as its own split
 * BufferGeometry. Extract it as STL and store it under the artifact key the
 * customizer is about to ask for — so when `handlePartChange` fires and the
 * customizer auto-generates, it hits cache instantly instead of firing WASM to
 * reproduce a mesh we already have. Silent on failure — falls back to WASM.
 */
async function seedCacheFromLegendClick(model: Model, target: Part, entry: LegendEntry): Promise<void> {
  try {
    // Without params this would address the pre-built default artifact, and a
    // mesh lifted out of the viewer has no business standing in for that.
    if (!artifactClient || target.format !== "stl" || !entry.params) return;
    const meshBytes = viewer.getMeshStlByColor(entry.color);
    if (!meshBytes) return;
    // Params equal to a lib default drop out during canonicalization, so the
    // legend's overrides alone address the same artifact as the full form.
    const key = await artifactClient.keyFor({
      slug: model.slug,
      target: targetOf(target),
      params: { ...buildParams(model), ...entry.params },
    });
    await artifactCache.put(key, meshBytes);
  } catch {
    // Cache seeding is a nice-to-have — never let it break the click flow.
  }
}

// ── Download helpers ─────────────────────────────────────

function setDownloadBlob(data: ArrayBuffer, filename: string) {
  if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
  const blob = new Blob([data], { type: "application/octet-stream" });
  currentBlobUrl = URL.createObjectURL(blob);
  downloadLink.href = currentBlobUrl;
  downloadLink.setAttribute("download", filename);
  downloadLink.hidden = false;
  updatePrintButtonVisibility();
}

function setDownloadUrl(url: string, filename: string) {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  downloadLink.href = url;
  downloadLink.setAttribute("download", filename);
  downloadLink.hidden = false;
  updatePrintButtonVisibility();
}

// The Print button is only meaningful when there's a fetchable mesh in a
// format the WASM slicer understands. We piggy-back on whatever the download
// link points to since it's already the source of truth for "current mesh."
function updatePrintButtonVisibility() {
  if (!printBtn) return;
  if (downloadLink.hidden) {
    printBtn.hidden = true;
    return;
  }
  // Customizer output is a `blob:` URL — the format isn't in the href, but
  // it IS in the download attribute (which setDownloadBlob writes) or the
  // current part's manifest entry.
  const format = currentPrintFormat();
  printBtn.hidden = !format || !currentModel || !currentPart;
}

/** Detect the current mesh's format from whichever source is set. Handles
 *  static server-served files (URL ends in .stl/.3mf) AND customizer blob
 *  URLs (blob:… with the format in the `download` attribute). */
function currentPrintFormat(): ModelFormat | null {
  return (
    formatOf(downloadLink.href) ??
    formatOf(downloadLink.getAttribute('download') ?? '') ??
    (currentPart ? formatOf(currentPart.file) : null)
  );
}

// ── Legend & hardware ────────────────────────────────────

/** Pieces of `file` this view contains, when the BOM declares a count. */
function bomQty(part: Part, file: string): number | null {
  return part.components?.find((c) => c.part === file)?.qty ?? null;
}

/**
 * Two different things wear the same key, and which one it is changes what the
 * rows mean:
 *
 * - An **assembly** — two or more parts on screen. Rows are parts, carry a
 *   `×N` piece count, and earn a leader line, because "which of these is
 *   that?" is a real question.
 * - A **single part** — one object, however many filaments it takes. Rows are
 *   that part's material assignments. No leader line: the whole viewport is
 *   already the part the row names.
 *
 * Rows group by part *and* params: repeated pieces of one part collapse into a
 * single row (and glow together on hover), but the same part rendered with
 * different params — a tray cell, say — is a different artifact and keeps its
 * own row. Entries with no part link stay one row each.
 *
 * The two readings meet on a multicolour part inside an assembly: it repeats in
 * the key once per filament, not once per copy, so those rows are labelled with
 * their filament count instead of a piece count.
 */
function renderLegend(model: Model, part: Part) {
  legendEl.innerHTML = "";
  partGroups = [];
  partGroupByColor.clear();
  partGroupsByFile.clear();
  unlinkedGroups = [];
  pieceFile.clear();
  piecesByFile.clear();
  legendIsPartsKey = false;
  setActivePart(null, null);
  leaderEnabled = false;
  if (!part.legend || part.legend.length === 0) {
    legendEl.hidden = true;
    return;
  }

  const grouped = new Map<string, LegendEntry[]>();
  for (const entry of part.legend) {
    const key = entry.part
      ? `${entry.part}\u0000${JSON.stringify(entry.params ?? null)}`
      : `label\u0000${entry.label}`;
    const bucket = grouped.get(key);
    if (bucket) bucket.push(entry);
    else grouped.set(key, [entry]);
  }

  const rows = [...grouped.values()].map((entries) => {
    const target = entries[0].part ? findPart(model, entries[0].part) : null;
    // Repeats only stand for copies when the target prints in one filament —
    // a 3MF part's repeats are its own colours.
    const pieces =
      (target ? bomQty(part, target.file) : null)
      ?? (target && target.format !== "3mf" ? entries.length : 1);
    return { entries, target, pieces };
  });

  const partRows = rows.filter((r) => r.target).length;
  const bomPieces = (part.components ?? []).reduce((n, c) => n + c.qty, 0);
  const isPartsKey = partRows > 0 && (partRows >= 2 || bomPieces >= 2);
  legendIsPartsKey = isPartsKey;
  leaderEnabled = partRows >= 2;
  const swatchCount = rows.reduce((n, r) => n + r.entries.length, 0);

  const heading = document.createElement("div");
  heading.className = "legend-title";
  heading.textContent = isPartsKey ? "Parts" : swatchCount > 1 ? "Filaments" : "Filament";
  legendEl.appendChild(heading);

  for (const { entries, target, pieces } of rows) {
    const first = entries[0];
    const colors = entries.flatMap((e) => [e.color, ...(e.shades ?? [])].map(normColor));
    const files = [...new Set(entries.flatMap((e) => [e.part, ...(e.parts ?? [])]).filter((f) => f !== undefined))];
    // An entry drawing several parts names them all; the one it opens is just one of them.
    const named = files.length > 1 ? null : target;

    const row = document.createElement("div");
    row.className = "legend-row";
    const swatches = document.createElement("span");
    swatches.className = "legend-swatches";
    swatches.appendChild(swatchEl(colors));
    const label = document.createElement("span");
    label.className = "legend-label";
    label.textContent = named?.label ?? first.label;
    row.appendChild(swatches);
    row.appendChild(label);
    if (isPartsKey && pieces > 1) {
      const qty = document.createElement("span");
      qty.className = "legend-qty";
      qty.textContent = `×${pieces}`;
      row.appendChild(qty);
    } else if (isPartsKey && target && entries.length > 1) {
      const note = document.createElement("span");
      note.className = "legend-qty legend-note";
      note.textContent = `${entries.length} filaments`;
      row.appendChild(note);
    }

    const group: PartGroup = {
      colors,
      oneEntry: entries.length === 1,
      meshColors: colors,
      qty: pieces,
      label: named?.label ?? first.label,
      note: named ? named.note : first.note,
      files,
      rows: [row],
      target,
      params: first.params,
    };
    partGroups.push(group);
    for (const color of colors) partGroupByColor.set(color, group);
    for (const file of files) partGroupsByFile.set(file, [...(partGroupsByFile.get(file) ?? []), group]);
    if (files.length === 0) unlinkedGroups.push(group);
    if (group.note) row.title = group.note;

    row.addEventListener("pointerenter", () => {
      if (allPlaced(files)) setActivePieces(files, null, row);
      else setActivePart(group, null, row);
      warmGroup(group);
    });
    row.addEventListener("pointerleave", () => setActivePart(null, null));

    if (target) {
      row.classList.add("legend-clickable");
      row.title = `Open ${target.label}`;
      row.addEventListener("click", () => {
        void seedCacheFromLegendClick(model, target, first).finally(() => {
          handlePartChange(target.file, first.params);
        });
      });
    }

    legendEl.appendChild(row);
  }
  legendEl.hidden = false;
}

/** A legend `part` may name either a printable part or a multicolour preview. */
function findPart(model: Model, file: string): Part | null {
  return (model.parts ?? []).find((p) => p.file === file)
    ?? (model.previews ?? []).find((p) => p.file === file)
    ?? null;
}

/**
 * Fetch a part's prebuilt artifact ahead of the click that opens it, so the
 * jump from the assembly to the part is a cache hit. Only for parts addressed
 * without params — those are the prerendered ones, already sitting on the
 * server. A params-carrying row would have to *render* to warm, which is what
 * seedCacheFromLegendClick sidesteps by lifting the mesh out of the viewer.
 */
const warmedTargets = new Set<string>();
function warmGroup(group: PartGroup): void {
  const model = currentModel;
  if (!model || !artifactClient || !group.target || group.params) return;
  const key = partPath(model, group.target);
  if (warmedTargets.has(key)) return;
  warmedTargets.add(key);
  void artifactClient
    .get({ slug: model.slug, target: targetOf(group.target), params: buildParams(model) })
    .catch(() => warmedTargets.delete(key));
}

// ── Parts list panel ─────────────────────────────────────
// One surface answering "what do I need to build this": what you print, what
// you buy at the hardware store, and the product the print is designed around.
// A separate screen on mobile, a docked column on desktop — where it also
// stands in for the floating key, so its rows carry the key's swatches and
// drive the same highlight.

interface ListRowOpts {
  source?: HardwareSource;
  note?: string;
  onClick?: () => void;
  /** Swatch column. Pass `[]` for a blank swatch that keeps the column aligned. */
  colors?: string[];
  /** Names of the individual pieces this row counts. */
  ids?: string[];
  /** Revealed by the row's disclosure toggle. */
  details?: HTMLLIElement[];
}

/**
 * One swatch for an entry, however many shades it has: the shades split the box
 * on the diagonal, so a part whose copies alternate shade still reads as one part.
 * No colours gives an invisible placeholder that keeps the row's columns aligned.
 */
function swatchEl(colors: string[]): HTMLSpanElement {
  const swatch = document.createElement("span");
  swatch.className = colors.length > 0 ? "legend-swatch" : "legend-swatch item-swatch-empty";
  if (colors.length === 1) {
    swatch.style.background = colors[0];
  } else if (colors.length > 1) {
    const band = 100 / colors.length;
    const stops = colors.map((c, i) => `${c} ${i * band}% ${(i + 1) * band}%`);
    swatch.style.background = `linear-gradient(135deg, ${stops.join(", ")})`;
  }
  return swatch;
}

/** Shared row shape: a quantity, a label, and an optional vendor link. */
function listRow(qty: number | undefined, label: string, opts: ListRowOpts = {}): HTMLLIElement {
  const li = document.createElement("li");

  if (opts.colors) {
    const swatches = document.createElement("span");
    swatches.className = "legend-swatches item-swatches";
    swatches.appendChild(swatchEl(opts.colors));
    li.appendChild(swatches);
  }

  const qtyEl = document.createElement("span");
  qtyEl.className = "item-qty";
  // A lone companion product reads better unquantified than as "1×".
  qtyEl.textContent = qty === undefined ? "" : `${qty}×`;
  li.appendChild(qtyEl);

  const body = document.createElement("span");
  body.className = "item-body";

  if (opts.onClick) {
    const link = document.createElement("a");
    link.className = "part-link";
    link.href = "#";
    link.textContent = label;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      closeInfoPanelOnMobile();
      opts.onClick!();
    });
    body.appendChild(link);
  } else {
    const text = document.createElement("span");
    text.className = "item-label";
    text.textContent = label;
    body.appendChild(text);
  }

  if (opts.ids && opts.ids.length > 0) {
    const ids = document.createElement("span");
    ids.className = "item-ids";
    const shown = summarizeIds(opts.ids);
    const gap = shown.length < opts.ids.length ? " … " : " · ";
    shown.forEach((id, i) => {
      if (i > 0) ids.append(gap);
      const ref = document.createElement("span");
      ref.className = "item-id-ref";
      ref.textContent = id;
      bindPiece(ref, id);
      ids.appendChild(ref);
    });
    body.appendChild(ids);
  }

  if (opts.note) {
    const note = document.createElement("span");
    note.className = "item-note";
    note.textContent = opts.note;
    body.appendChild(note);
  }
  li.appendChild(body);

  if (opts.source) {
    const link = document.createElement("a");
    link.className = "hardware-source";
    link.href = opts.source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = opts.source.vendor ?? "source";
    li.appendChild(link);
  }

  if (opts.details && opts.details.length > 0) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "item-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", `Show details for ${label}`);
    const sub = document.createElement("ul");
    sub.className = "item-details";
    sub.hidden = true;
    for (const d of opts.details) sub.appendChild(d);
    toggle.addEventListener("click", () => {
      sub.hidden = !sub.hidden;
      toggle.setAttribute("aria-expanded", String(!sub.hidden));
    });
    li.appendChild(toggle);
    li.appendChild(sub);
  }
  return li;
}

/** Few enough ids read inline; a long run shows its ends and leaves the rest to the details. */
function summarizeIds(ids: string[]): string[] {
  return ids.length <= 6 ? ids : [ids[0], ids[ids.length - 1]];
}

/**
 * Hovering an id lifts that one piece. Leaving it for the rest of its row
 * hands back to the row, which the pointer never left as far as the row's own
 * listeners know. A piece the viewer couldn't place does nothing here, so the
 * row's colour highlight carries on underneath.
 */
function bindPiece(el: HTMLElement, id: string) {
  el.dataset.piece = id;
  el.classList.toggle("piece-live", isPieceLive(id));
  pieceEls.set(id, [...(pieceEls.get(id) ?? []), el]);
  el.addEventListener("pointerenter", () => {
    const file = pieceFile.get(id);
    if (file && piecesByFile.has(file)) setActivePieces([file], id, el);
  });
  el.addEventListener("pointerleave", (e) => {
    if (activePiece !== id) return;
    let row = el.parentElement;
    while (row && !rowActivators.has(row)) row = row.parentElement;
    if (row && e.relatedTarget instanceof Node && row.contains(e.relatedTarget)) rowActivators.get(row)!();
    else setActivePart(null, null);
  });
}

/** One piece in a row's details: its id, and where it goes, on one line. */
function instanceRow(qty: number | undefined, inst: ComponentInstance): HTMLLIElement {
  const li = document.createElement("li");
  if (qty !== undefined) {
    const qtyEl = document.createElement("span");
    qtyEl.className = "item-qty";
    qtyEl.textContent = `${qty}×`;
    li.appendChild(qtyEl);
  }
  const body = document.createElement("span");
  body.className = "item-body";
  const id = document.createElement("span");
  id.className = "item-id";
  id.textContent = inst.id;
  body.appendChild(id);
  if (inst.where) body.append(" ", inst.where);
  li.appendChild(body);
  bindPiece(li, inst.id);
  return li;
}

/** A subheading inside a row's details. */
function detailHeading(text: string): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "item-detail-heading";
  li.textContent = text;
  return li;
}

function renderSection(el: HTMLElement, title: string, rows: HTMLLIElement[], controls?: HTMLElement) {
  el.innerHTML = "";
  if (rows.length === 0) {
    el.hidden = true;
    return;
  }
  const heading = document.createElement("h3");
  heading.textContent = title;
  if (controls) {
    const header = document.createElement("div");
    header.className = "section-header";
    header.append(heading, controls);
    el.appendChild(header);
  } else {
    el.appendChild(heading);
  }

  const ul = document.createElement("ul");
  for (const row of rows) ul.appendChild(row);
  el.appendChild(ul);
  el.hidden = false;
}

/**
 * Hover a parts-list row and the pieces it names glow, exactly as its key row
 * would. A part can sit under several key rows — one per params set — so a
 * row naming several glows them all without joining any one of them.
 */
function bindKeyRow(row: HTMLElement, groups: PartGroup[], files: string[] = []) {
  if (groups.length === 0) return;
  for (const g of groups) g.rows.push(row);
  for (const file of files) rowsByFile.set(file, [...(rowsByFile.get(file) ?? []), row]);
  const activate = () => {
    if (allPlaced(files)) {
      setActivePieces(files, null, row);
    } else if (groups.length === 1) {
      setActivePart(groups[0], null, row);
    } else {
      setActivePart({
        colors: groups.flatMap((g) => g.colors),
        oneEntry: false,
        meshColors: groups.flatMap((g) => g.meshColors),
        qty: groups.reduce((n, g) => n + g.qty, 0),
        label: groups[0].label,
        files: groups.flatMap((g) => g.files),
        rows: [row],
        target: null,
      }, null, row);
    }
  };
  rowActivators.set(row, activate);
  row.addEventListener("pointerenter", () => {
    activate();
    for (const g of groups) warmGroup(g);
  });
  row.addEventListener("pointerleave", () => setActivePart(null, null));
}

/** Parts-list rows are rebuilt on every render; forget the ones that left the page. */
function pruneKeyRows() {
  for (const g of partGroups) g.rows = g.rows.filter((r) => r.isConnected);
  for (const els of [rowsByFile, pieceEls]) {
    for (const [key, list] of els) {
      const live = list.filter((el) => el.isConnected);
      if (live.length > 0) els.set(key, live);
      else els.delete(key);
    }
  }
}

function keyColors(file: string): string[] {
  return (partGroupsByFile.get(file) ?? []).flatMap((g) => g.colors);
}

interface Bom {
  entries: ComponentRef[];
  /** `where` for every piece the model's main assembly names. */
  whereById: Map<string, string>;
  /** Pieces per part in the main assembly — what hardware `each` multiplies. */
  mainQty: Map<string, number>;
  mainInstances: Map<string, ComponentInstance[]>;
}

/**
 * What you print for this view. An assembly or plate names its own
 * components; any other view answers for the whole model — the main
 * assembly's count, then any part it leaves out (tools, alternates) once
 * apiece — rather than guessing one of everything.
 */
function bomFor(model: Model, part: Part): Bom {
  const main = mainAssembly(model)?.components ?? [];
  const whereById = new Map<string, string>();
  const mainQty = new Map<string, number>();
  const mainInstances = new Map<string, ComponentInstance[]>();
  for (const comp of main) {
    mainQty.set(comp.part, (mainQty.get(comp.part) ?? 0) + comp.qty);
    if (comp.instances) mainInstances.set(comp.part, [...(mainInstances.get(comp.part) ?? []), ...comp.instances]);
    for (const inst of comp.instances ?? []) if (inst.where) whereById.set(inst.id, inst.where);
  }

  let entries: ComponentRef[];
  if (part.components && part.components.length > 0) {
    entries = part.components;
  } else if (main.length > 0) {
    const listed = new Set(main.map((c) => c.part));
    entries = [
      ...main,
      ...(model.parts ?? []).filter((p) => !listed.has(p.file)).map((p) => ({ part: p.file, qty: 1 })),
    ];
  } else {
    entries = (model.parts ?? []).map((p) => ({ part: p.file, qty: 1 }));
  }
  return { entries, whereById, mainQty, mainInstances };
}

function withWhere(bom: Bom, instances: ComponentInstance[] | undefined): ComponentInstance[] {
  return (instances ?? []).map((i) => ({ id: i.id, where: i.where ?? bom.whereById.get(i.id) }));
}

/**
 * One row per part, except where the key draws several parts as one entry —
 * the floor tiles, say, whose left, middle and right variants share a colour.
 * Those sit under a row for the entry, which counts and lights them all.
 */
function printedRows(model: Model, bom: Bom): HTMLLIElement[] {
  const modelParts = model.parts ?? [];
  const hasSwatches = partGroupsByFile.size > 0;
  const partRow = (comp: ComponentRef) => {
    const match = modelParts.find((p) => p.file === comp.part);
    const instances = withWhere(bom, comp.instances);
    const row = listRow(comp.qty, match?.label ?? comp.part, {
      colors: hasSwatches ? keyColors(comp.part) : undefined,
      ids: instances.map((i) => i.id),
      details: instances.map((i) => instanceRow(undefined, i)),
      note: match?.note,
      onClick: match ? () => handlePartChange(match.file) : undefined,
    });
    bindKeyRow(row, partGroupsByFile.get(comp.part) ?? [], [comp.part]);
    return row;
  };

  const rows: HTMLLIElement[] = [];
  const done = new Set<ComponentRef>();
  for (const comp of bom.entries) {
    if (done.has(comp)) continue;
    const groups = partGroupsByFile.get(comp.part) ?? [];
    const members = groups.length === 1 ? bom.entries.filter((c) => groups[0].files.includes(c.part)) : [comp];
    for (const m of members) done.add(m);
    if (members.length < 2) {
      rows.push(partRow(comp));
      continue;
    }
    const group = groups[0];
    const files = [...new Set(members.map((m) => m.part))];
    const header = listRow(members.reduce((n, m) => n + m.qty, 0), group.label, {
      colors: group.colors,
      note: group.note,
    });
    header.classList.add("item-group");
    bindKeyRow(header, [group], files);
    rows.push(header);
    for (const m of members) {
      const row = partRow(m);
      row.classList.add("item-variant");
      rows.push(row);
    }
  }
  return rows;
}

/** Key rows that name no part, so the printed list above has nowhere to show them. */
function unlinkedRows(): HTMLLIElement[] {
  const rows = unlinkedGroups.map((group) => {
    const row = listRow(undefined, group.label, { colors: group.colors, note: group.note });
    bindKeyRow(row, [group]);
    return row;
  });
  if (legendIsPartsKey && rows.length > 0) {
    const note = document.createElement("li");
    note.className = "reference-note";
    const text = document.createElement("span");
    text.className = "item-note";
    text.textContent = "Drawn for scale and fit only: none of it is printed or added to a project. What to buy is under Hardware.";
    note.appendChild(text);
    rows.unshift(note);
  }
  return rows;
}

/** How the reference-only pieces are drawn; lasts the session, like the hardware view. */
let referenceDisplay: ColorDisplay = "solid";

/** Ghost or hide the parts-key rows that name no part. A colours-only key is the print itself, so it's left alone. */
function applyReferenceDisplay() {
  const colors = legendIsPartsKey ? unlinkedGroups.flatMap((g) => g.meshColors) : [];
  viewer.setColorDisplay(Object.fromEntries(colors.map((c) => [c, referenceDisplay])));
}

function referenceDisplayTabs(onChange: () => void): HTMLElement {
  const tabs = document.createElement("div");
  tabs.className = "section-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Show reference parts as");
  for (const [mode, text] of [["solid", "Solid"], ["ghost", "See-through"], ["hidden", "Hidden"]] as const) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(referenceDisplay === mode));
    tab.textContent = text;
    tab.addEventListener("click", () => {
      if (referenceDisplay === mode) return;
      referenceDisplay = mode;
      applyReferenceDisplay();
      onChange();
    });
    tabs.appendChild(tab);
  }
  return tabs;
}

function renderUnlinked() {
  if (!legendIsPartsKey) {
    renderSection(unlinkedListEl, "Colours", unlinkedRows());
  } else {
    renderSection(unlinkedListEl, "For reference — not printed", unlinkedRows(), referenceDisplayTabs(() => {
      renderUnlinked();
      pruneKeyRows();
    }));
  }
  applyReferenceDisplay();
}

// ── Hardware: totals, or broken down by the part each piece goes into ─────

type HardwareView = "total" | "by-part";
let hardwareView: HardwareView = "total";

/** The item's name, without the " — what it's for" a hardware label usually trails. */
function shortLabel(label: string): string {
  return label.split(" — ")[0];
}

function unattributedQty(item: HardwareItem, bom: Bom): number {
  const used = (item.usedBy ?? []).reduce((n, u) => n + u.each * (bom.mainQty.get(u.part) ?? 0), 0);
  return item.qty - used;
}

/** "Where do all 10 of these go": per part, then per named piece of it. */
function hardwareTotalRows(model: Model, bom: Bom): HTMLLIElement[] {
  return (model.hardware ?? []).map((item) => {
    const details: HTMLLIElement[] = [];
    for (const use of item.usedBy ?? []) {
      const part = (model.parts ?? []).find((p) => p.file === use.part);
      const pieces = bom.mainQty.get(use.part) ?? 0;
      details.push(detailHeading(`${use.each * pieces}× into ${part?.label ?? use.part}`));
      const instances = withWhere(bom, bom.mainInstances.get(use.part));
      for (const inst of instances) details.push(instanceRow(use.each, inst));
    }
    const rest = item.usedBy ? unattributedQty(item, bom) : 0;
    if (rest > 0) details.push(detailHeading(`${rest}× not tied to a printed part`));
    return listRow(item.qty, item.label, { source: item.source, details });
  });
}

/** "What does this part need": each printed part, and the hardware that goes into it. */
function hardwareByPartRows(model: Model, bom: Bom): HTMLLIElement[] {
  const hardware = model.hardware ?? [];
  const hasSwatches = partGroupsByFile.size > 0;
  const rows: HTMLLIElement[] = [];
  for (const part of model.parts ?? []) {
    const uses = hardware.flatMap((item) =>
      (item.usedBy ?? []).filter((u) => u.part === part.file).map((u) => ({ item, each: u.each })),
    );
    if (uses.length === 0) continue;
    const pieces = bom.mainQty.get(part.file) ?? 0;
    const instances = withWhere(bom, bom.mainInstances.get(part.file));
    const details = uses.map(({ item, each }) =>
      listRow(each * pieces, shortLabel(item.label), {
        note: pieces > 1 ? `${each} per piece` : undefined,
      }),
    );
    const row = listRow(pieces, part.label, {
      colors: hasSwatches ? keyColors(part.file) : undefined,
      ids: instances.map((i) => i.id),
      details,
    });
    bindKeyRow(row, partGroupsByFile.get(part.file) ?? [], [part.file]);
    rows.push(row);
  }
  const loose = hardware
    .map((item) => ({ item, rest: item.usedBy ? unattributedQty(item, bom) : item.qty }))
    .filter(({ rest }) => rest > 0);
  if (loose.length > 0) {
    rows.push(listRow(undefined, "Not tied to a printed part", {
      colors: hasSwatches ? [] : undefined,
      details: loose.map(({ item, rest }) => listRow(rest, shortLabel(item.label), { source: item.source })),
    }));
  }
  return rows;
}

function hardwareTabs(onChange: () => void): HTMLElement {
  const tabs = document.createElement("div");
  tabs.className = "section-tabs";
  tabs.setAttribute("role", "tablist");
  for (const [view, text] of [["total", "Total"], ["by-part", "By part"]] as const) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(hardwareView === view));
    tab.textContent = text;
    tab.addEventListener("click", () => {
      if (hardwareView === view) return;
      hardwareView = view;
      onChange();
    });
    tabs.appendChild(tab);
  }
  return tabs;
}

function renderHardware(model: Model, bom: Bom) {
  const attributed = (model.hardware ?? []).some((item) => item.usedBy && item.usedBy.length > 0);
  if (!attributed) {
    renderSection(hardwareEl, "Hardware", (model.hardware ?? []).map((item) =>
      listRow(item.qty, item.label, { source: item.source }),
    ));
    return;
  }
  const rows = hardwareView === "total" ? hardwareTotalRows(model, bom) : hardwareByPartRows(model, bom);
  renderSection(hardwareEl, "Hardware", rows, hardwareTabs(() => {
    renderHardware(model, bom);
    pruneKeyRows();
  }));
}

function renderInfoPanel(model: Model, part: Part) {
  const bom = bomFor(model, part);

  renderProjectActions(model);
  renderSection(printedListEl, "3D printed parts", printedRows(model, bom));
  renderUnlinked();
  renderHardware(model, bom);

  renderSection(
    worksWithEl,
    "Works with",
    (model.worksWith ?? []).map((item) =>
      listRow(item.qty, item.label, { source: item.source, note: item.note }),
    ),
  );

  renderSection(
    filamentListEl,
    "Filament",
    [
      ...(model.filament ?? []).map((entry) =>
        listRow(undefined, entry.color ? `${entry.material} (${entry.color})` : entry.material, {
          note: entry.note,
          source: entry.source,
        }),
      ),
      listRow(undefined, "Recommended profile", { note: describeProfile(recommendedProfile(model)) }),
    ],
  );

  renderPrintTime(model, part, bom);

  const empty =
    projectActionsEl.hidden &&
    printedListEl.hidden &&
    unlinkedListEl.hidden &&
    hardwareEl.hidden &&
    worksWithEl.hidden &&
    filamentListEl.hidden &&
    printTimeEl.hidden;
  infoPanelEmpty.hidden = !empty;
  // Desktop docks the panel permanently, so an all-empty model would otherwise
  // dock an empty column; hide the whole thing instead.
  infoPanelEl.hidden = empty;
  infoBtn.hidden = empty;
  if (empty) setInfoPanelOpen(false);
  pruneKeyRows();
}

// ── Print plates → project ───────────────────────────────

/**
 * On a view with print plates: load them as the open project, where the
 * planner slices, schedules and sends them.
 */
function renderProjectActions(model: Model) {
  const plates = (model.previews ?? []).filter((p) => p.plate);
  if (plates.length === 0) {
    renderSection(projectActionsEl, "Project", []);
    return;
  }
  const li = document.createElement("li");
  li.className = "project-actions-row";
  const note = document.createElement("span");
  note.className = "item-note";
  note.textContent = `${plates.length} print plate${plates.length === 1 ? "" : "s"}`;
  const load = document.createElement("button");
  load.type = "button";
  load.className = "btn btn-primary";
  load.textContent = "Load project";
  load.title = "Open a project holding every print plate of this build";
  load.addEventListener("click", () => {
    load.disabled = true;
    void loadBuildProject(model, plates)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => { load.disabled = false; });
  });
  li.append(note, load);
  renderSection(projectActionsEl, "Project", [li]);
}

async function loadBuildProject(model: Model, plates: Part[]): Promise<void> {
  const client = artifactClient;
  if (!client) return;
  const params = buildParams(model);
  const profile = recommendedProfile(model);
  const entries = await Promise.all(plates.map(async (plate) => ({
    name: plate.label,
    material: plateMaterial(model, plate),
    color: plateColor(model, plate),
    profile,
    item: {
      slug: model.slug,
      target: targetOf(plate),
      format: plate.format,
      label: plate.label,
      modelTitle: model.title,
      params,
      key: await client.keyFor({ slug: model.slug, target: targetOf(plate), params }),
      qty: 1,
    },
  })));
  const name = model.build ? `${model.title} (${model.build.label})` : model.title;
  const project = await openNewProject(name, (p) => createPlatesWithItems(p.id, entries).then(() => undefined));
  if (!project) return;
  closeInfoPanelOnMobile();
  openProjectPlanner(project.id);
}

// ── Print-time estimates ─────────────────────────────────

/** `print-estimates.json`, written at build time by scripts/estimate-prints.mjs. */
interface PrintEstimates {
  settings: {
    rates: { mmPerS: number; label?: string }[];
    /** Weight and cost in the estimate are quoted in this filament. */
    filament: { material: string; density: number; costPerKg: number };
    /** g/cm³ by material family (the first word of a material, e.g. "TPU" for "TPU 64D"). */
    densities: Record<string, number>;
    /** What a piece is assumed to print in when its model doesn't say. */
    defaultMaterial: string;
    printer: string;
    profile: string;
  };
  /** By artifact key, so an estimate only ever matches the bytes it was sliced from. */
  estimates: Record<string, {
    seconds: Record<string, number>;
    /** Everything the print feeds, supports and purge included. */
    grams: number;
    /** Of `grams`; absent from estimates made before the split was recorded. */
    supportGrams?: number;
    purgeGrams?: number;
    cost: number;
    profile?: string;
  }>;
}

let printEstimates: PrintEstimates | null = null;

/** Optional data: a dev checkout that never ran the estimator just shows no print time. */
async function loadPrintEstimates(): Promise<PrintEstimates | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}models/print-estimates.json`);
    return res.ok ? ((await res.json()) as PrintEstimates) : null;
  } catch {
    return null;
  }
}

function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m}m` : `${h}h ${String(m).padStart(2, "0")}m`;
}

/**
 * What this view prints, timed: the parts list's pieces summed (each sliced on
 * its own, so the total is one-at-a-time), or — for a model whose print *is*
 * the 3MF — the viewed file itself.
 */
function renderPrintTime(model: Model, part: Part, bom: Bom) {
  // `defaultKey` is addressed at the lib defaults, not a build's params — and
  // the estimator slices each build at its params — so a build's entries need
  // their real key, which takes an async hash.
  if (!model.build) {
    fillPrintTime(model, part, bom, (p) => p?.defaultKey);
    return;
  }
  renderSection(printTimeEl, "Print time", []);
  const client = artifactClient;
  if (!printEstimates || !client) return;
  const entries = [...(model.previews ?? []), ...(model.parts ?? [])];
  void Promise.all(
    entries.map(async (p) => [p.file, await client.keyFor({ slug: model.slug, target: targetOf(p), params: buildParams(model) })] as const),
  ).then((pairs) => {
    if (currentPart !== part) return;
    const keys = new Map(pairs);
    fillPrintTime(model, part, bom, (p) => (p ? keys.get(p.file) : undefined));
    printTimeEl.hidden ||= !customizedBadge.hidden;
  }).catch(() => {
    // Print time is optional; a view without it is still a working view.
  });
}

/** "TPU 64D" → "TPU": what an estimate's rate labels and densities are keyed by. */
function materialFamily(material: string): string {
  return material.trim().split(/\s+/)[0].toUpperCase();
}

/** The filament a printed file is in: the entry naming it, else the entry naming nothing. */
/** The colour a print plate's filament comes in, when the model names one. */
function plateColor(model: Model, plate: Part): string | undefined {
  const color = filamentFor(model, plate.components?.[0]?.part ?? plate.file)?.color;
  return color && color !== "any" ? color : undefined;
}

function filamentFor(model: Model, file: string): FilamentEntry | undefined {
  const filament = model.filament ?? [];
  return filament.find((f) => f.parts?.includes(file)) ?? filament.find((f) => !f.parts);
}

function estimateRow(label: string, body: string, seconds: number, extraClass = ""): HTMLLIElement {
  const li = document.createElement("li");
  li.className = `estimate-row ${extraClass}`.trim();
  const labelEl = document.createElement("span");
  labelEl.className = "item-qty";
  labelEl.textContent = label;
  const bodyEl = document.createElement("span");
  bodyEl.className = "item-body item-label";
  bodyEl.textContent = body;
  const time = document.createElement("span");
  time.className = "estimate-time";
  time.textContent = formatDuration(seconds);
  li.append(labelEl, bodyEl, time);
  return li;
}

function fillPrintTime(model: Model, part: Part, bom: Bom, keyOf: (p: Part | undefined) => string | undefined) {
  const data = printEstimates;
  const rows: HTMLLIElement[] = [];
  if (data) {
    const byFile = new Map([...(model.previews ?? []), ...(model.parts ?? [])].map((p) => [p.file, p]));
    const lookup = (p: Part | undefined) => {
      const key = keyOf(p);
      return key ? data.estimates[key] : undefined;
    };

    let items = bom.entries.map((e) => ({ file: e.part, qty: e.qty, est: lookup(byFile.get(e.part)) }));
    if (!items.some((i) => i.est)) items = [{ file: part.file, qty: 1, est: lookup(part) }];
    const known = items.filter((i) => i.est).map((i) => ({ ...i, est: i.est! }));

    if (known.length > 0) {
      const pieces = known.reduce((n, i) => n + i.qty, 0);
      const { filament, densities, printer, profile, rates } = data.settings;

      // Each piece at its own material's flow and density. A piece whose model
      // names no material — or one the estimate has no rate for — is assumed
      // to be the default.
      const rateOf = (material: string) => rates.find((r) => r.label?.toUpperCase() === materialFamily(material));
      // Listed in the order the model names its filaments; an assumed one has no place there, so it goes last.
      const listed = (model.filament ?? []).map((f) => f.material);
      const pieceList = known.map((i) => {
        const named = filamentFor(model, i.file)?.material;
        const material = named && rateOf(named) && densities[materialFamily(named)] ? named : data.settings.defaultMaterial;
        return { ...i, material, assumed: material !== named, rate: rateOf(material), density: densities[materialFamily(material)] };
      }).sort((a, b) => (a.assumed ? listed.length : listed.indexOf(a.material)) - (b.assumed ? listed.length : listed.indexOf(b.material)));

      if (pieceList.every((i) => i.rate && i.density)) {
        const materials = [...new Set(pieceList.map((i) => (i.assumed ? `${i.material} (assumed)` : i.material)))];
        const seconds = pieceList.reduce((t, i) => t + i.qty * (i.est.seconds[i.rate!.mmPerS] ?? 0), 0);
        rows.push(estimateRow("", materials.join(" + "), seconds, "estimate-specified"));
      }
      for (const rate of rates) {
        rows.push(estimateRow(rate.label ?? "", `${rate.mmPerS} mm³/s`, known.reduce((t, i) => t + i.qty * (i.est.seconds[rate.mmPerS] ?? 0), 0)));
      }

      // Estimates weigh everything in the quoted filament; re-weigh per material by density.
      const byMaterial = new Map<string, number>();
      for (const i of pieceList) {
        const grams = (i.qty * i.est.grams * (i.density ?? filament.density)) / filament.density;
        byMaterial.set(i.material, (byMaterial.get(i.material) ?? 0) + grams);
      }
      const grams = [...byMaterial.values()].reduce((a, b) => a + b, 0);
      const split = byMaterial.size > 1
        ? ` (${[...byMaterial].map(([m, g]) => `${m} ${Math.round(g)} g`).join(" · ")})`
        : ` ${[...byMaterial.keys()][0]}`;
      const notes = [
        `${Math.round(grams)} g${split} · $${((grams * filament.costPerKg) / 1000).toFixed(2)} at $${filament.costPerKg}/kg`,
        pieces > 1 ? `All ${pieces} printed pieces, sliced one at a time` : "",
        part.format === "3mf" && items.length === 1 ? "Single filament — colour changes not included" : "",
        known.length < items.length ? `${items.length - known.length} part(s) not estimated` : "",
        `${printer} · ${[known[0].est.profile, profile].filter(Boolean).join(", ")}`,
      ];
      const li = document.createElement("li");
      li.className = "estimate-notes";
      for (const text of notes.filter(Boolean)) {
        const note = document.createElement("span");
        note.className = "item-note";
        note.textContent = text;
        li.appendChild(note);
      }
      rows.push(li);
    }
  }
  renderSection(printTimeEl, "Print time", rows);
}

function setInfoPanelOpen(open: boolean) {
  document.body.classList.toggle("info-open", open);
  infoBtn.setAttribute("aria-expanded", String(open));
}

function closeInfoPanelOnMobile() {
  if (window.matchMedia("(max-width: 767px)").matches) setInfoPanelOpen(false);
}

infoBtn.addEventListener("click", () => {
  setInfoPanelOpen(!document.body.classList.contains("info-open"));
});
infoCloseBtn.addEventListener("click", () => setInfoPanelOpen(false));

// ── Customizer (Preact) ──────────────────────────────────

interface CustomizerProps {
  params: ScadParam[];
  slug: string;
  buildId?: string;
  part: Part;
  initialValues?: Record<string, ScadValue>;
  /** When true, fire Generate automatically on first mount (used when
   *  clicking a legend row / cell — the click IS the generate action). */
  autoGenerate?: boolean;
  /** The viewer is loading this part's prebuilt default, so that is what's on screen. */
  showsDefault: boolean;
  onValuesChange: (values: Record<string, ScadValue>) => void;
  /** Whether the model on screen was made from other values than the form holds. */
  onStaleChange: (stale: boolean) => void;
  onStart: () => void;
  onProgress: (status: string) => void;
  onStage: (stage: ResolveStage) => void;
  onFinish: () => void;
  onGenerated: (
    data: ArrayBuffer,
    format: ModelFormat,
    filename: string,
    request: { key: string; params: Record<string, ScadValue> },
    origin: ArtifactOrigin,
  ) => void;
  onError: (msg: string) => void;
}

/** The render on screen: the values it was made from, and how it was got. */
interface Displayed {
  values: Record<string, ScadValue>;
  /** Null for the prebuilt default the part opened on. */
  origin: ArtifactOrigin | null;
  seconds?: number;
}

function formatScadValue(v: ScadValue | undefined): string {
  if (typeof v === "string") return v === "" ? "(empty)" : JSON.stringify(v);
  return JSON.stringify(v);
}

function Customizer({ params, slug, buildId, part, initialValues, autoGenerate, showsDefault, onValuesChange, onStaleChange, onStart, onProgress, onStage, onFinish, onGenerated, onError }: CustomizerProps) {
  const [values, setValues] = useState<Record<string, ScadValue>>(() => {
    const defaults: Record<string, ScadValue> = {};
    const known = new Map(params.map((p) => [p.name, p]));
    for (const p of params) defaults[p.name] = p.default;
    // URL-provided values arrive as strings (query params). Coerce
    // each one to the target param's type before merging so numeric
    // params don't get injected into SCAD as quoted strings (which
    // then blow up on arithmetic). Ignore names this model doesn't
    // know about — stale params from another model shouldn't ride
    // along in URL updates.
    if (initialValues) {
      for (const [k, v] of Object.entries(initialValues)) {
        const param = known.get(k);
        if (!param) continue;
        defaults[k] = typeof v === "string"
          ? coerceToParamType(v, param.type, param.default)
          : v;
      }
    }
    return defaults;
  });
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState<ResolveStage | null>(null);
  const [displayed, setDisplayed] = useState<Displayed | null>(() => {
    if (!showsDefault) return null;
    const defaults: Record<string, ScadValue> = {};
    for (const p of params) defaults[p.name] = p.default;
    return { values: defaults, origin: null };
  });

  const changed = displayed
    ? params.filter((p) => JSON.stringify(values[p.name]) !== JSON.stringify(displayed.values[p.name]))
    : [];
  const changedNames = new Set(changed.map((p) => p.name));
  const stale = !generating && !!displayed && changed.length > 0;

  useEffect(() => {
    onStaleChange(stale);
  }, [stale]);

  // useRef-latch so the auto-generate useEffect can invoke the latest
  // handleGenerate closure without adding it to the deps (which would
  // rerun it every render).
  const handleGenerateRef = useRef<() => void>(() => {});

  const handleChange = (name: string, value: ScadValue) => {
    const next = { ...values, [name]: value };
    setValues(next);
    onValuesChange(next);
  };

  const moduleName = part.module ?? "main";
  const outputFormat = part.format;

  const handleGenerate = async (force = false) => {
    // Edits made while this runs belong to the next Generate, not this one.
    const requested = values;
    const started = performance.now();
    setGenerating(true);
    setStage(null);
    setDisplayed(null);
    onStart();
    onError("");

    try {
      const { bytes, format, origin: resolved } = await resolveArtifact(
        { slug, target: targetOf(part), params: requested },
        onProgress,
        (s) => {
          setStage(s);
          onStage(s);
        },
        force,
      );

      // Embed a permalink back to this exact param set into the downloaded
      // file. The cache holds the artifact as addressed, untagged — the
      // permalink is a property of this page, not of the geometry.
      const sourceUrl = window.location.origin + buildUrl(slug, moduleName, requested, buildId);
      const tagged = embedSourceUrl(bytes, format, sourceUrl);

      const filename = `${slug}-${moduleName}-custom.${format}`;
      onGenerated(tagged, format, filename, { key: resolved.key, params: requested }, resolved);
      setDisplayed({ values: requested, origin: resolved, seconds: (performance.now() - started) / 1000 });
      onFinish();
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
      onFinish();
    } finally {
      setGenerating(false);
    }
  };

  // Keep the ref pointing at the latest handleGenerate so the mount-time
  // auto-generate effect below fires it with today's params.
  handleGenerateRef.current = handleGenerate;

  useEffect(() => {
    if (autoGenerate) handleGenerateRef.current();
    // Only fire once when the Customizer instance mounts. Subsequent
    // clicks on the same legend/cell force a fresh Customizer via the
    // `key={slug}:{part.module}` prop, so this useEffect re-runs then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return h("div", { className: "customizer-panel" },
    h("h3", null, "Customize"),
    params.length > 0 && h("div", { className: "param-list" },
      params.map((param) =>
        h("div", { key: param.name, className: changedNames.has(param.name) ? "param-field is-changed" : "param-field" },
          h("label", { className: "param-label" },
            h("span", { className: "param-name" },
              param.name,
              changedNames.has(param.name) && h("span", {
                className: "param-changed-tag",
                title: `The model shown was made with ${formatScadValue(displayed?.values[param.name])}`,
              }, "changed"),
            ),
            param.help && h("span", { className: "param-help" }, param.help),
          ),
          h("div", { className: "param-input" },
            param.type === "boolean"
              ? h("input", {
                  type: "checkbox",
                  checked: values[param.name] as boolean,
                  onChange: (e: Event) => handleChange(param.name, (e.target as HTMLInputElement).checked),
                })
              : param.type === "number"
              ? h("input", {
                  type: "number",
                  step: "any",
                  value: values[param.name] as number,
                  onChange: (e: Event) => {
                    const n = parseFloat((e.target as HTMLInputElement).value);
                    if (!isNaN(n)) handleChange(param.name, n);
                  },
                })
              : param.type === "enum"
              ? h("select", {
                  value: String(values[param.name]),
                  onChange: (e: Event) => {
                    const raw = (e.target as HTMLSelectElement).value;
                    // Preserve the original param type — the enum options
                    // came from a comment string, but the actual default
                    // may be a number, and injecting `"2"` into SCAD would
                    // break arithmetic on it.
                    handleChange(
                      param.name,
                      typeof param.default === "number" ? Number(raw) : raw,
                    );
                  },
                }, (param.options ?? []).map((opt) => h("option", { key: opt, value: opt }, opt)))
              : param.type === "text"
              ? h("textarea", {
                  className: "param-textarea",
                  rows: 3,
                  value: values[param.name] as string,
                  onInput: (e: Event) => handleChange(param.name, (e.target as HTMLTextAreaElement).value),
                })
              : h("input", {
                  type: "text",
                  value: values[param.name] as string,
                  onInput: (e: Event) => handleChange(param.name, (e.target as HTMLInputElement).value),
                }),
          ),
        ),
      ),
    ),
    h("div", { className: "customizer-actions" },
      h(CustomizerStatus, { generating, stage, displayed, changed: changed.length }),
      h("button", {
        className: "btn btn-secondary",
        onClick: () => handleGenerate(true),
        disabled: generating,
        title: "Skip the cache and render these settings again with OpenSCAD in your browser",
      }, "Force regenerate"),
      h("button", {
        className: "btn btn-primary",
        onClick: () => handleGenerate(),
        disabled: generating,
      }, generating ? "Working…" : `Generate Custom ${outputFormat.toUpperCase()}`),
    ),
  );
}

/** Whether the model on screen matches the form, and where it came from. */
function CustomizerStatus({ generating, stage, displayed, changed }: {
  generating: boolean;
  stage: ResolveStage | null;
  displayed: Displayed | null;
  changed: number;
}) {
  let kind: "busy" | "stale" | "synced" | "empty";
  let text: string;
  let title: string | undefined;
  if (generating) {
    kind = "busy";
    text = stage ? STAGE_STATUS[stage] : "Checking the cache…";
  } else if (!displayed) {
    kind = "empty";
    text = "Nothing generated for these settings yet.";
  } else if (changed > 0) {
    kind = "stale";
    text = `${changed} setting${changed === 1 ? "" : "s"} changed since this model was made — Generate to update it.`;
  } else {
    kind = "synced";
    const { origin, seconds } = displayed;
    const how = origin ? ORIGIN_LABEL[originKind(origin)] : "Default model";
    const kindOf = origin && originKind(origin);
    const timed = (kindOf === "browser" || kindOf === "server") && seconds !== undefined;
    text = `Showing these settings · ${how}${timed ? ` in ${seconds.toFixed(1)} s` : ""}`;
    title = origin
      ? `Artifact ${origin.key.slice(0, 12)}…` + (origin.forgeStatus ? ` · forge ${origin.forgeStatus}` : "")
      : undefined;
  }
  return h("div", { className: `customizer-status is-${kind}`, role: "status", title },
    h("span", { className: "customizer-status-dot", "aria-hidden": "true" }),
    h("span", null, text),
  );
}

function showCustomizer(model: Model, part: Part, initialValues?: Record<string, ScadValue>, autoGenerate = false, showsDefault = true) {
  const sources = customizableSources[model.slug];
  if (!sources || !part.module) {
    hideCustomizer();
    return;
  }
  // A build's params stand in for the lib defaults, so the form opens on the
  // build and an untouched Generate addresses the build's prebuilt artifact.
  const pinned = buildParams(model) ?? {};
  const params = parseParams(sources.lib).map((p) => (p.name in pinned ? { ...p, default: pinned[p.name]! } : p));

  customizerEl.hidden = false;
  customizeBtn.hidden = false;
  setCustomizerOpen(false);
  render(
    h(Customizer, {
      // Force a fresh Customizer instance whenever the model, part, or
      // incoming initialValues change. Without this Preact reuses the
      // previous instance's useState (so cell-click params never make
      // it into the form) AND the mount-time autoGenerate useEffect
      // never re-fires on subsequent clicks of a different cell.
      key: `${model.slug}:${model.build?.id ?? ""}:${part.module ?? ""}:${JSON.stringify(initialValues ?? null)}`,
      params,
      slug: model.slug,
      buildId: model.build?.id,
      part,
      initialValues,
      autoGenerate,
      showsDefault,
      onValuesChange: (vals) => {
        const path = buildUrl(model.slug, part.module, vals, model.build?.id);
        history.replaceState({ slug: model.slug, build: model.build?.id, part: part.module, custom: vals }, "", path);
      },
      onStaleChange: (stale) => {
        staleBadge.hidden = !stale;
      },
      onStart: () => {
        setCustomizerOpen(false);
        hideViewerPrompt();
        viewer.clear();
        showLoadingOverlay("Checking the cache…");
      },
      onProgress: (status) => {
        showLoadingOverlay(status, !loadingNote.hidden);
      },
      onStage: (stage) => {
        showLoadingOverlay(STAGE_STATUS[stage], stage === "local render" || stage === "server render");
      },
      onFinish: () => {
        hideLoadingOverlay();
      },
      onGenerated: (data, format, filename, request, origin) => {
        lastCustomizerRequest = request;
        viewer.load(data, format);
        resolvePartColors();
        setDownloadBlob(data, filename);
        setCustomizedBadge(true, origin);
        setError(null);
      },
      onError: (msg) => setError(msg || null),
    }),
    customizerEl,
  );
}

function hideCustomizer() {
  customizerEl.hidden = true;
  staleBadge.hidden = true;
  customizeBtn.hidden = true;
  setCustomizerOpen(false);
  render(null, customizerEl);
}

// ── Model & part loading ─────────────────────────────────

/** All parts (previews + parts) for a model, with group labels for the dropdown. */
function allItemsFor(model: Model): { part: Part; group: string }[] {
  return [
    ...(model.previews ?? []).map((p) => ({ part: p, group: "Previews" })),
    ...(model.parts ?? []).map((p) => ({ part: p, group: "Parts" })),
  ];
}

function defaultItemFor(model: Model): { part: Part; group: string } | undefined {
  const items = allItemsFor(model);
  return items.find((i) => i.part.default) ?? items[0];
}

/** Populate both part/preview dropdowns for the given model. */
function populatePartSelect(model: Model, activePart: Part) {
  const items = allItemsFor(model);
  const hide = items.length <= 1;

  for (const select of [partSelect, mobilePartSelect]) {
    select.innerHTML = "";
    let currentGroup = "";
    let optgroup: HTMLOptGroupElement | null = null;

    for (const { part, group } of items) {
      if (group !== currentGroup) {
        currentGroup = group;
        optgroup = document.createElement("optgroup");
        optgroup.label = group;
        select.appendChild(optgroup);
      }
      const option = document.createElement("option");
      option.value = part.file;
      option.textContent = part.label;
      if (part.file === activePart.file) option.selected = true;
      optgroup!.appendChild(option);
    }

    select.hidden = hide;
  }
}

// Current model state
let currentModel: Model | null = null;
let currentPart: Part | null = null;
/** The render request behind `downloadLink`, when the customizer produced it. */
let lastCustomizerRequest: { key: string; params: Record<string, ScadValue> } | null = null;
let currentItems: { part: Part; group: string }[] = [];

interface LoadPartOptions {
  initialValues?: Record<string, ScadValue>;
  promptOnly?: boolean;
  skipPush?: boolean;
}

/**
 * Prefer the content-addressed artifact over the static path: that is the copy
 * the key warms on hover, so opening a part from an assembly is a cache hit
 * rather than a second download. The static path stays the fallback for
 * anything the runtime manifest can't address — and remains what the download
 * link points at, since it carries a meaningful filename.
 */
async function fetchPartBytes(model: Model, part: Part, url: string): Promise<ArrayBuffer> {
  if (artifactClient) {
    try {
      const { bytes } = await artifactClient.get({ slug: model.slug, target: targetOf(part), params: buildParams(model) });
      return bytes;
    } catch {
      // Fall through — an unaddressable part is still servable by path.
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${part.file}: HTTP ${res.status}`);
  return res.arrayBuffer();
}

const VIEW_STASH_KEY = "3dg:dev-view";

interface StashedView {
  slug: string;
  file: string;
  view: ViewState;
}

/** The camera saved before a dev-server full reload, if it was on this part. One-shot. */
function takeStashedView(model: Model, part: Part): ViewState | undefined {
  if (!import.meta.hot) return undefined;
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(VIEW_STASH_KEY);
    sessionStorage.removeItem(VIEW_STASH_KEY);
  } catch {
    return undefined;
  }
  if (!raw) return undefined;
  const stash = JSON.parse(raw) as StashedView;
  return stash.slug === model.slug && stash.file === part.file ? stash.view : undefined;
}

async function loadPart(model: Model, part: Part, opts: LoadPartOptions = {}) {
  const url = partPath(model, part);
  const format = formatOf(part.file);
  if (!format) {
    setError(`Unknown file type: ${part.file}`);
    return;
  }

  // Taken up front so a stash can't outlive this load and ambush a later one.
  const stashedView = takeStashedView(model, part);
  currentPart = part;
  lastCustomizerRequest = null;
  setCustomizedBadge(false);
  hideViewerPrompt();
  renderLegend(model, part);
  renderInfoPanel(model, part);

  if (!opts.skipPush) {
    pushRoute(model.slug, part.module, opts.initialValues, model.build?.id);
  }

  const ext = part.file.split(".").pop();
  const baseName = part.file.replace(/\.\w+$/, "");
  const downloadName = `${[model.slug, model.build?.id, baseName].filter(Boolean).join("-")}.${ext}`;

  // When we're navigating in with pre-set params (a legend / cell click),
  // the click IS the "Generate" — auto-run WASM instead of showing the
  // Press-Generate prompt or fetching the pre-built default artifact.
  const autoGenerate = !!opts.initialValues && !!model.customizable;

  if (model.customizable) {
    showCustomizer(model, part, opts.initialValues, autoGenerate, !autoGenerate && !opts.promptOnly);
    if (autoGenerate || opts.promptOnly) {
      downloadLink.hidden = true;
      updatePrintButtonVisibility();
    } else {
      setDownloadUrl(url, downloadName);
    }
  } else {
    hideCustomizer();
    setDownloadUrl(url, downloadName);
  }

  if (autoGenerate) {
    // Auto-generate takes over: clear the viewer, hide the prompt, and
    // show the loading overlay immediately so there's no empty flash
    // before the Customizer's mount-time useEffect kicks off WASM.
    viewer.clear();
    hideViewerPrompt();
    showLoadingOverlay("Checking the cache…");
    return;
  }

  if (opts.promptOnly) {
    viewer.clear();
    showViewerPrompt();
    return;
  }

  try {
    setError(null);
    showLoadingOverlay("Loading model…");
    const buf = await fetchPartBytes(model, part, url);
    if (currentPart !== part) return;
    viewer.load(buf, format, { view: stashedView });
    resolvePartColors();
  } catch (err) {
    if (currentPart !== part) return;
    viewer.clear();
    setError(err instanceof Error ? err.message : String(err));
  } finally {
    if (currentPart === part) hideLoadingOverlay();
  }
}

/** Select a model: update sidebar highlight, description, dropdown, and load default part. */
function selectModel(model: Model, partOverride?: Part, opts: LoadPartOptions = {}) {
  currentModel = model;
  currentItems = allItemsFor(model);

  // Update sidebar highlight
  document.querySelectorAll(".model-item.active").forEach((el) => el.classList.remove("active"));
  const activeItem = modelListEl.querySelector(`.model-item[data-slug="${model.slug}"]`);
  if (activeItem) activeItem.classList.add("active");
  // A link straight to a dev-only model reveals the rest for this visit, without remembering it.
  if (model.devOnly) setDevShown(true);

  // Title & description
  modelTitleEl.textContent = model.title;
  renderBuildSwitch(model);
  if (model.description) {
    descTextEl.textContent = model.description;
    modelDescEl.hidden = false;
    setDescriptionExpanded(false);
  } else {
    modelDescEl.hidden = true;
  }

  // Determine which part to load
  const targetPart = partOverride ?? defaultItemFor(model)?.part;
  if (!targetPart) return;

  // Populate dropdown & load part
  populatePartSelect(model, targetPart);
  loadPart(model, targetPart, opts);

  closeSidebarDrawer();
}

// Dropdown change → switch part within the current model. `initialValues`
// pre-populates the customizer (used when a legend row / cell click
// routes through to its target piece with `piece_i` / `piece_j` set);
// loadPart's autoGenerate branch handles firing WASM immediately.
function handlePartChange(selectedFile: string, initialValues?: Record<string, ScadValue>) {
  if (!currentModel) return;
  const item = currentItems.find((i) => i.part.file === selectedFile);
  if (item) {
    // Sync both selects
    partSelect.value = selectedFile;
    mobilePartSelect.value = selectedFile;
    loadPart(currentModel, item.part, { initialValues });
  }
}

partSelect.addEventListener("change", () => handlePartChange(partSelect.value));
mobilePartSelect.addEventListener("change", () => handlePartChange(mobilePartSelect.value));

// Print controls — Plates lives in the sidebar and is always available, Add
// to plate appears only once a printable mesh (STL or 3MF) is loaded and
// downloadLink points at it.
platesBtn?.addEventListener("click", () => {
  closeSidebarDrawer();
  void openCurrentProject();
});

const plateNotice = document.createElement("span");
plateNotice.id = "plate-added";
plateNotice.hidden = true;
printBtn?.insertAdjacentElement("beforebegin", plateNotice);
let plateNoticeTimer: number | undefined;

function showPlateNotice(projectId: string, where: string): void {
  window.clearTimeout(plateNoticeTimer);
  plateNotice.textContent = `Added to ${where} · `;
  const open = document.createElement("a");
  open.className = "part-link";
  open.href = "#";
  open.textContent = "Open project";
  open.addEventListener("click", (e) => {
    e.preventDefault();
    window.clearTimeout(plateNoticeTimer);
    plateNotice.hidden = true;
    openProjectPlanner(projectId);
  });
  plateNotice.appendChild(open);
  plateNotice.hidden = false;
  plateNoticeTimer = window.setTimeout(() => { plateNotice.hidden = true; }, 8000);
}

async function addCurrentPartToPlate(): Promise<void> {
  if (!printBtn || !currentModel || !currentPart || !artifactClient) return;
  const format = currentPrintFormat();
  if (!format) return;
  const model = currentModel;
  const part = currentPart;
  const target = targetOf(part);
  // A plate item is a render request, so it stores the params the mesh on
  // screen was built from — the customizer's own values when it produced one,
  // otherwise none, which addresses the pre-built default artifact.
  const params = lastCustomizerRequest?.params ?? buildParams(model);

  printBtn.disabled = true;
  try {
    const key = lastCustomizerRequest?.key
      ?? await artifactClient.keyFor({ slug: model.slug, target, params });

    const { project, plate } = await ensureTargetPlate();
    await addItemToPlate(plate.id, {
      slug: model.slug,
      target,
      format,
      label: model.build ? `${part.label} (${model.build.label})` : part.label,
      modelTitle: model.title,
      params,
      key,
      qty: 1,
    });
    setError(null);
    showPlateNotice(project.id, `${project.name} / ${plate.name}`);
  } catch (err) {
    setError(err instanceof Error ? err.message : String(err));
  } finally {
    printBtn.disabled = false;
  }
}

printBtn?.addEventListener("click", () => {
  void addCurrentPartToPlate();
});

// ── Sidebar & routing ────────────────────────────────────

let models: Model[] = [];

function navigateToRoute(route: ReturnType<typeof getRouteFromUrl>, skipPush = false) {
  if (!route) return false;
  const found = models.find((m) => m.slug === route.slug);
  if (!found) return false;
  const model = viewOf(found, route.buildId);

  const items = allItemsFor(model);
  let targetPart = route.partModule
    ? items.find((i) => i.part.module === route.partModule)?.part
    : undefined;
  if (!targetPart) targetPart = defaultItemFor(model)?.part;
  if (!targetPart) return false;

  const hasCustomValues = Object.keys(route.customValues).length > 0;
  selectModel(model, targetPart, {
    initialValues: hasCustomValues ? route.customValues : undefined,
    promptOnly: hasCustomValues,
    skipPush,
  });
  return true;
}

/** What opens when there is no route: the manifest's default model, else the first. */
function landingModel(): Model | undefined {
  const listed = models.filter((m) => import.meta.env.DEV || !m.devOnly);
  return listed.find((m) => m.default) ?? listed[0];
}

const SHOW_DEV_KEY = "3dg:show-dev";

function readShowDev(): boolean {
  try {
    return localStorage.getItem(SHOW_DEV_KEY) === "1";
  } catch {
    return false;
  }
}

function writeShowDev(on: boolean) {
  try {
    if (on) localStorage.setItem(SHOW_DEV_KEY, "1");
    else localStorage.removeItem(SHOW_DEV_KEY);
  } catch {
    // Storage blocked: the toggle still works for this page view.
  }
}

/** The dev server always lists dev-only models; elsewhere they wait behind "+ dev". */
function setDevShown(on: boolean) {
  modelListEl.classList.toggle("show-dev", on);
  const toggle = modelListEl.querySelector<HTMLButtonElement>(".dev-toggle");
  if (toggle) {
    toggle.textContent = on ? "− dev" : "+ dev";
    toggle.setAttribute("aria-pressed", String(on));
  }
}

function renderSidebar(manifest: Manifest) {
  modelListEl.innerHTML = "";
  models = manifest.models;

  for (const model of models) {
    const item = document.createElement("div");
    item.className = "model-item";
    item.dataset.slug = model.slug;
    item.textContent = model.title;
    if (model.devOnly) {
      item.classList.add("dev-only");
      const badge = document.createElement("span");
      badge.className = "dev-badge";
      badge.textContent = "dev";
      item.appendChild(badge);
    }
    item.addEventListener("click", () => selectModel(viewOf(model)));
    modelListEl.appendChild(item);
  }

  if (!import.meta.env.DEV && models.some((m) => m.devOnly)) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "dev-toggle";
    toggle.title = "Show models that are still in development";
    toggle.addEventListener("click", () => {
      const on = !modelListEl.classList.contains("show-dev");
      writeShowDev(on);
      setDevShown(on);
    });
    modelListEl.appendChild(toggle);
  }
  setDevShown(import.meta.env.DEV || readShowDev());

  // Check URL route first
  const route = getRouteFromUrl();
  if (route && navigateToRoute(route, true)) return;

  const landing = landingModel();
  if (landing) selectModel(viewOf(landing), undefined, { skipPush: true });
}

// Handle browser back/forward
window.addEventListener("popstate", () => {
  const route = getRouteFromUrl();
  if (route) {
    navigateToRoute(route, true);
  } else {
    const landing = landingModel();
    if (landing) selectModel(viewOf(landing), undefined, { skipPush: true });
  }
});

/**
 * Fetch the runtime manifest and install an artifact client for it. Rerun on
 * every dev-server .scad edit: source digests are part of each artifact key,
 * so a client built from the old manifest would keep serving the old geometry.
 */
async function loadRuntimeManifest(): Promise<RuntimeManifest> {
  const res = await fetch(`${import.meta.env.BASE_URL}models/manifest.json`);
  if (!res.ok) throw new Error(`manifest.json: HTTP ${res.status}`);
  const manifest = (await res.json()) as RuntimeManifest;
  const client = buildArtifactClient(manifest);
  // A bundle that hashes differently than the manifest was generated for
  // would 404 on every artifact forever; fail here instead.
  client.assertKeySchema(KEY_SCHEMA);
  artifactClient = client;
  // Plate resolution shares this client so it inherits the WASM renderer.
  setPlateArtifactClient(client);
  return manifest;
}

async function init() {
  try {
    const [manifest, estimates] = await Promise.all([loadRuntimeManifest(), loadPrintEstimates()]);
    printEstimates = estimates;
    renderSidebar(manifest);
  } catch (err) {
    modelListEl.textContent = "Failed to load manifest";
    setError(err instanceof Error ? err.message : String(err));
  }
  // After the gallery, so a `?plate=` deep link opens over a painted page
  // rather than a blank one — and so a manifest failure still routes.
  initPrintRouting();
}

init();

if (import.meta.hot) {
  // Spelled out in full: Vite finds HMR boundaries by scanning for the literal
  // `import.meta.hot.accept(`, so an alias would silently fall back to a reload.
  import.meta.hot.accept("./customizable-sources", (mod) => {
    if (mod) Object.assign(customizableSources, mod.CUSTOMIZABLE_SOURCES);
  });

  // Editors that save in several writes fire several events; only the last
  // reload may touch the viewer, or an older render could land on top.
  let reloadSeq = 0;

  // The dev plugin sends this instead of a full reload when a model's .scad
  // changes. Skipped while the user is customizing — their WASM output takes
  // precedence over the file version.
  import.meta.hot.on("scad-rebuilt", async (data: { slug: string }) => {
    const seq = ++reloadSeq;
    try {
      await loadRuntimeManifest();
      const model = currentModel;
      const part = currentPart;
      if (seq !== reloadSeq || !model || !part || model.slug !== data.slug) return;
      if (model.customizable && !customizedBadge.hidden) return;
      const format = formatOf(part.file);
      if (!format) return;
      const buf = await fetchPartBytes(model, part, partPath(model, part));
      if (seq !== reloadSeq || currentPart !== part) return;
      viewer.load(buf, format, { preserveView: true });
      resolvePartColors();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  });

  // Manifest and TypeScript edits still reload the page; carry the camera
  // across so the reload lands where the user was looking.
  import.meta.hot.on("vite:beforeFullReload", () => {
    if (!currentModel || !currentPart) return;
    const stash: StashedView = { slug: currentModel.slug, file: currentPart.file, view: viewer.getView() };
    try {
      sessionStorage.setItem(VIEW_STASH_KEY, JSON.stringify(stash));
    } catch {
      // Storage blocked: the reload just re-frames the model.
    }
  });
}
