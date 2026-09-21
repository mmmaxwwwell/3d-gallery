import { createViewer, type ModelFormat } from "@3d-gallery/viewer";
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
import collarTagLib from "../../../models/collar-tag/lib/collar-tag-lib.scad?raw";
import collarTagMulticolor from "../../../models/collar-tag/previews/multicolor.scad?raw";
import collarSlideTagLib from "../../../models/collar-slide-tag/lib/collar-slide-tag-lib.scad?raw";
import collarSlideTagMulticolor from "../../../models/collar-slide-tag/previews/multicolor.scad?raw";
import fiMiniCaseLib from "../../../models/fi-mini-case/lib/fi-mini-case-lib.scad?raw";
import fiMiniCaseAssembled from "../../../models/fi-mini-case/previews/assembled.scad?raw";
import fiMiniCaseCap from "../../../models/fi-mini-case/previews/cap.scad?raw";
import fiMiniCaseCaptiveLib from "../../../models/fi-mini-case-captive/lib/fi-mini-case-captive-lib.scad?raw";
import fiMiniCaseCaptiveAssembled from "../../../models/fi-mini-case-captive/previews/assembled.scad?raw";
import ugreenFinderDuoLib from "../../../models/ugreen-finder-duo-captive/lib/ugreen-finder-duo-captive-lib.scad?raw";
import ugreenFinderDuoAssembled from "../../../models/ugreen-finder-duo-captive/previews/assembled.scad?raw";
import qrSignLib from "../../../models/qr-sign/lib/qr-sign-lib.scad?raw";
import qrSignAssembled from "../../../models/qr-sign/previews/assembled.scad?raw";
import qrLeashTagLib from "../../../models/qr-leash-tag/lib/qr-leash-tag-lib.scad?raw";
import qrLeashTagTag from "../../../models/qr-leash-tag/previews/tag.scad?raw";
import qrLeashTagPlate from "../../../models/qr-leash-tag/previews/plate.scad?raw";
import parametricQrCaseLib from "../../../models/parametric-qr-case/lib/parametric-qr-case-lib.scad?raw";
import parametricQrCaseCase from "../../../models/parametric-qr-case/previews/case.scad?raw";
import parametricQrCasePlate from "../../../models/parametric-qr-case/previews/plate.scad?raw";
import parametricShelfLib from "../../../models/parametric-shelf/lib/parametric-shelf-lib.scad?raw";
import ff5mFilamentSensorLib from "../../../models/ff5m-filament-sensor/lib/ff5m-filament-sensor-lib.scad?raw";
import et300KnobAideKnurledLib from "../../../models/et300-knob-aide-knurled/lib/et300-knob-aide-knurled-lib.scad?raw";
import et300KnobAideKnurledLogoPolygon from "../../../models/et300-knob-aide-knurled/lib/logo-polygon-data.scad?raw";
import et300KnobAideKnurledMulticolor from "../../../models/et300-knob-aide-knurled/previews/tactile-aide-multicolor.scad?raw";
import splitTray500Lib from "../../../models/split-tray-500/lib/split-tray-500-lib.scad?raw";
import splitTray500Assembled2x2 from "../../../models/split-tray-500/previews/assembled-2x2.scad?raw";
import splitTray500Assembled3x3 from "../../../models/split-tray-500/previews/assembled-3x3.scad?raw";
import underDeskCordProtectorLib from "../../../models/under-desk-cord-protector/lib/under-desk-cord-protector-lib.scad?raw";
import underDeskCordProtectorAssembled from "../../../models/under-desk-cord-protector/previews/assembled.scad?raw";
import underDeskCordProtectorPropped from "../../../models/under-desk-cord-protector/previews/propped.scad?raw";
import underDeskCordProtectorHex from "../../../models/under-desk-cord-protector/previews/hex.scad?raw";
import underDeskCordProtectorPlate from "../../../models/under-desk-cord-protector/previews/plate.scad?raw";
import scaffoldCubeLib from "../../../models/scaffold-cube/lib/scaffold-cube-lib.scad?raw";
import scaffoldCubeUnit1u from "../../../models/scaffold-cube/previews/unit-1u.scad?raw";
import scaffoldCubeStack3x3 from "../../../models/scaffold-cube/previews/stack-3x3.scad?raw";
import scaffoldCubeCloset from "../../../models/scaffold-cube/previews/closet.scad?raw";
import { parseParams, coerceToParamType, KEY_SCHEMA } from "@3d-gallery/model-core";
import type { ScadParam, ScadValue, RuntimeManifest } from "@3d-gallery/model-core";
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
  openPlateDialog,
  openPlatesPanel,
} from "./print/mount";
import { setPlateArtifactClient } from "./print/plate-resolve";
import { addItemToPlate, ensureTargetPlate } from "./print/plate-store";

interface LegendEntry {
  color: string;
  label: string;
  /** File name of the part this legend row navigates to when clicked. */
  part?: string;
  /** Customizer params applied when navigating (e.g. { piece_i: 1 }). */
  params?: Record<string, ScadValue>;
}

interface ComponentRef {
  part: string;
  qty: number;
}

interface Part {
  file: string;
  format: ModelFormat;
  label: string;
  default?: boolean;
  legend?: LegendEntry[];
  module?: string;
  components?: ComponentRef[];
}

interface HardwareSource {
  url: string;
  vendor?: string;
}

interface HardwareItem {
  qty: number;
  label: string;
  source?: HardwareSource;
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
}

interface Manifest {
  models: Model[];
}

// Strip include lines from a .scad source (for WASM concatenation with lib)
function stripIncludes(source: string): string {
  return source
    .split("\n")
    .filter((line) => !line.match(/^\s*include\s*<.*>/))
    .join("\n");
}

// Customizable model sources keyed by slug. `previews` is keyed by the
// artifact target — the manifest file's base name, which is what the forge
// resolves `previews/<target>.scad` against. That is not always the manifest
// `module` (et300's preview declares `assembled`).
const CUSTOMIZABLE_SOURCES: Record<string, { lib: string; previews: Record<string, string> }> = {
  "collar-tag": {
    lib: collarTagLib,
    previews: {
      multicolor: stripIncludes(collarTagMulticolor),
    },
  },
  "collar-slide-tag": {
    lib: collarSlideTagLib,
    previews: {
      multicolor: stripIncludes(collarSlideTagMulticolor),
    },
  },
  "fi-mini-case": {
    lib: fiMiniCaseLib,
    previews: {
      assembled: stripIncludes(fiMiniCaseAssembled),
      cap: stripIncludes(fiMiniCaseCap),
    },
  },
  "fi-mini-case-captive": {
    lib: fiMiniCaseCaptiveLib,
    previews: {
      assembled: stripIncludes(fiMiniCaseCaptiveAssembled),
    },
  },
  "ugreen-finder-duo-captive": {
    lib: ugreenFinderDuoLib,
    previews: {
      assembled: stripIncludes(ugreenFinderDuoAssembled),
    },
  },
  "qr-sign": {
    lib: qrSignLib,
    previews: {
      assembled: stripIncludes(qrSignAssembled),
    },
  },
  "qr-leash-tag": {
    lib: qrLeashTagLib,
    previews: {
      tag: stripIncludes(qrLeashTagTag),
      plate: stripIncludes(qrLeashTagPlate),
    },
  },
  "parametric-qr-case": {
    lib: parametricQrCaseLib,
    previews: {
      case: stripIncludes(parametricQrCaseCase),
      plate: stripIncludes(parametricQrCasePlate),
    },
  },
  "parametric-shelf": {
    lib: parametricShelfLib,
    previews: {},
  },
  "ff5m-filament-sensor": {
    lib: ff5mFilamentSensorLib,
    previews: {},
  },
  "et300-knob-aide-knurled": {
    // Lib `include`s logo-polygon-data.scad — resolved by openscad CLI, but
    // the WASM path has no filesystem. Prepend the polygon data and strip
    // the include so the customizer sees a single self-contained source.
    lib: et300KnobAideKnurledLogoPolygon + "\n" + stripIncludes(et300KnobAideKnurledLib),
    previews: {
      "tactile-aide-multicolor": stripIncludes(et300KnobAideKnurledMulticolor),
    },
  },
  "split-tray-500": {
    lib: splitTray500Lib,
    previews: {
      "assembled-2x2": stripIncludes(splitTray500Assembled2x2),
      "assembled-3x3": stripIncludes(splitTray500Assembled3x3),
    },
  },
  "under-desk-cord-protector": {
    lib: underDeskCordProtectorLib,
    previews: {
      assembled: stripIncludes(underDeskCordProtectorAssembled),
      propped: stripIncludes(underDeskCordProtectorPropped),
      hex: stripIncludes(underDeskCordProtectorHex),
      plate: stripIncludes(underDeskCordProtectorPlate),
    },
  },
  "scaffold-cube": {
    lib: scaffoldCubeLib,
    previews: {
      "unit-1u": stripIncludes(scaffoldCubeUnit1u),
      "stack-3x3": stripIncludes(scaffoldCubeStack3x3),
      closet: stripIncludes(scaffoldCubeCloset),
    },
  },
};

// ── DOM refs ─────────────────────────────────────────────

const sidebarEl = document.getElementById("sidebar")!;
const sidebarToggle = document.getElementById("sidebar-toggle")!;
const sidebarBackdrop = document.getElementById("sidebar-backdrop")!;
const modelListEl = document.getElementById("model-list")!;
const modelTitleEl = document.getElementById("model-title")!;
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
const worksWithEl = document.getElementById("works-with-list")!;
const filamentListEl = document.getElementById("filament-list")!;
const infoPanelEl = document.getElementById("info-panel")!;
const infoPanelEmpty = document.getElementById("info-panel-empty")!;
const infoBtn = document.getElementById("info-btn") as HTMLButtonElement;
const infoCloseBtn = document.getElementById("info-close") as HTMLButtonElement;
const legendEl = document.getElementById("viewer-legend")!;
const customizerEl = document.getElementById("customizer")!;
const customizerBackdrop = document.getElementById("customizer-backdrop")!;
const customizeBtn = document.getElementById("customize-btn") as HTMLButtonElement;
const customizedBadge = document.getElementById("customized-badge")!;
const loadingOverlay = document.getElementById("viewer-loading")!;
const loadingStatus = loadingOverlay.querySelector(".loading-status")!;
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
  /** Display colours of every piece belonging to this part, as authored. */
  colors: string[];
  /** Those colours snapped onto what the loaded mesh actually carries. */
  meshColors: string[];
  /** How many pieces of this part the assembly contains. */
  qty: number;
  row: HTMLElement;
  /** Manifest entry to open on click, when the part resolves to one. */
  target: Part | null;
  params?: Record<string, ScadValue>;
}

let partGroups: PartGroup[] = [];
const partGroupByColor = new Map<string, PartGroup>();
let activeGroup: PartGroup | null = null;
/** Colour of the piece the leader line points at. */
let activeColor: string | null = null;
/** Set by renderLegend: only an assembly's key has parts worth pointing at. */
let leaderEnabled = false;

function normColor(hex: string): string {
  return hex.toLowerCase();
}

/**
 * Two tiers of highlight: the piece under the cursor brightens, and every
 * other piece of the same part glows. Pointing at a key row has no single
 * piece under the cursor, so it glows the whole group and anchors the leader
 * line (when one is drawn) on the first piece.
 */
function setActivePart(group: PartGroup | null, hoverColor: string | null) {
  activeGroup = group;
  activeColor = hoverColor ?? group?.meshColors[0] ?? null;
  for (const g of partGroups) g.row.classList.toggle("legend-active", g === group);
  viewer.setHighlight({ hover: hoverColor, glow: group?.meshColors ?? [] });
  updateLeaderLine();
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
}

function updateLeaderLine() {
  clearLeader();
  if (!leaderEnabled || !activeGroup || !activeColor) return;
  const row = activeGroup.row;
  const meshPos = viewer.getScreenPositionForColor(activeColor);
  if (!meshPos) return;

  // Legend row's midpoint on its left edge — the leader lands where the
  // color swatch sits so the connection reads visually as "this piece →
  // that row."
  const containerRect = viewerContainer.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();
  const rowX = rowRect.left - containerRect.left;
  const rowY = rowRect.top - containerRect.top + rowRect.height / 2;

  drawLeader(meshPos.x, meshPos.y, rowX, rowY);
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
  setActivePart(group, col);
  if (group) warmGroup(group);
});

// Clicking a mesh opens the same part its key row links to — delegated by
// dispatching the row's own click handler so both entry points share a flow.
viewer.onClick((hex) => {
  const row = partGroupByColor.get(normColor(hex))?.row;
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

function closeSidebarOnMobile() {
  if (window.innerWidth < 768) setSidebarOpen(false);
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

function setCustomizedBadge(visible: boolean) {
  customizedBadge.hidden = !visible;
}

function showLoadingOverlay(status: string) {
  loadingStatus.textContent = status;
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
const ROUTE_PARAMS = new Set(["model", "part", ...PRINT_ROUTE_PARAMS]);

function buildUrl(slug: string, partModule?: string, customValues?: Record<string, ScadValue>): string {
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

function pushRoute(slug: string, partModule?: string, customValues?: Record<string, ScadValue>) {
  const path = buildUrl(slug, partModule, customValues);
  if (window.location.pathname + window.location.search !== path) {
    history.pushState({ slug, part: partModule, custom: customValues }, "", path);
  }
}

function getRouteFromUrl(): { slug: string; partModule?: string; customValues: Record<string, string> } | null {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("model");
  if (!slug) return null;
  const partModule = params.get("part") ?? undefined;
  const customValues: Record<string, string> = {};
  for (const [k, v] of params.entries()) {
    if (!ROUTE_PARAMS.has(k)) customValues[k] = v;
  }
  return { slug, partModule, customValues };
}

// ── Artifact client ──────────────────────────────────────

/** A part's file base name — how the runtime manifest addresses it. */
function targetOf(part: Part): string {
  return part.file.replace(/\.\w+$/, "");
}

const artifactCache = createIdbCache();
let artifactClient: ArtifactClient | null = null;

/** Progress sink of the resolve in flight, if any. */
let renderProgress: ((status: string) => void) | null = null;
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
    localRenderer: createWasmRenderer(CUSTOMIZABLE_SOURCES, {
      onLog: (line) => renderProgress?.(line),
    }),
    // Only the dev middleware can answer the `?r=` retry. On a static host it
    // is a second 404 in front of the browser render we already know we need.
    allowServerRender: import.meta.env.DEV,
    fetchImpl: trackedFetch,
    onLog: (line) => {
      console.debug("[3d-gallery] artifact", line);
      // Booting OpenSCAD-WASM and rendering takes seconds. The cache and
      // network paths finish before a status line could even be read, so only
      // the local render is worth reporting.
      if (line.startsWith("local render")) {
        renderProgress?.("Rendering in your browser — this may take a while…");
      }
    },
  });
}

interface ArtifactOrigin {
  source: ArtifactSource;
  key: string;
  /** Forge render status, when the response carried one. */
  forgeStatus: string | null;
}

const ORIGIN_LABEL: Record<ArtifactSource, string> = {
  memory: "Cached",
  cache: "Cached",
  network: "Prebuilt",
  local: "Rendered locally",
};

const ORIGIN_COLOR: Record<ArtifactSource, string> = {
  memory: "#2bff88",
  cache: "#2bff88",
  network: "#00eaff",
  local: "#ffd60a",
};

async function resolveArtifact(
  req: { slug: string; target: string; params?: Record<string, ScadValue> },
  onProgress: (status: string) => void,
): Promise<{ bytes: ArrayBuffer; format: ModelFormat; origin: ArtifactOrigin }> {
  if (!artifactClient) throw new Error("The model manifest hasn't loaded yet — reload the page.");
  lastForgeStatus = null;
  renderProgress = onProgress;
  try {
    const { bytes, format, key, source } = await artifactClient.get(req);
    return { bytes, format, origin: { source, key, forgeStatus: lastForgeStatus } };
  } finally {
    renderProgress = null;
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
      params: entry.params,
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
  leaderEnabled = partRows >= 2;
  const swatchCount = rows.reduce((n, r) => n + r.entries.length, 0);

  const heading = document.createElement("div");
  heading.className = "legend-title";
  heading.textContent = isPartsKey ? "Parts" : swatchCount > 1 ? "Filaments" : "Filament";
  legendEl.appendChild(heading);

  for (const { entries, target, pieces } of rows) {
    const first = entries[0];
    const colors = entries.map((e) => normColor(e.color));

    const row = document.createElement("div");
    row.className = "legend-row";
    const swatches = document.createElement("span");
    swatches.className = "legend-swatches";
    for (const color of colors) {
      const swatch = document.createElement("span");
      swatch.className = "legend-swatch";
      swatch.style.background = color;
      swatches.appendChild(swatch);
    }
    const label = document.createElement("span");
    label.className = "legend-label";
    label.textContent = target?.label ?? first.label;
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
      meshColors: colors,
      qty: pieces,
      row,
      target,
      params: first.params,
    };
    partGroups.push(group);
    for (const color of colors) partGroupByColor.set(color, group);

    row.addEventListener("pointerenter", () => {
      setActivePart(group, null);
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
  const key = `${model.slug}/${group.target.file}`;
  if (warmedTargets.has(key)) return;
  warmedTargets.add(key);
  void artifactClient
    .get({ slug: model.slug, target: targetOf(group.target) })
    .catch(() => warmedTargets.delete(key));
}

// ── Parts list panel ─────────────────────────────────────
// One surface answering "what do I need to build this": what you print, what
// you buy at the hardware store, and the product the print is designed around.
// A separate screen on mobile, a docked column on desktop.

/** Shared row shape: a quantity, a label, and an optional vendor link. */
function listRow(
  qty: number | undefined,
  label: string,
  opts: { source?: HardwareSource; note?: string; onClick?: () => void } = {},
): HTMLLIElement {
  const li = document.createElement("li");

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
  return li;
}

function renderSection(el: HTMLElement, title: string, rows: HTMLLIElement[]) {
  el.innerHTML = "";
  if (rows.length === 0) {
    el.hidden = true;
    return;
  }
  const heading = document.createElement("h3");
  heading.textContent = title;
  el.appendChild(heading);

  const ul = document.createElement("ul");
  for (const row of rows) ul.appendChild(row);
  el.appendChild(ul);
  el.hidden = false;
}

/**
 * What you print. An assembly names its components with quantities; anything
 * else falls back to the model's own parts, one apiece — either way the screen
 * answers the question for the whole model, not just the mesh on screen.
 */
function printedRows(model: Model, part: Part): HTMLLIElement[] {
  const modelParts = model.parts ?? [];
  if (part.components && part.components.length > 0) {
    return part.components.map((comp) => {
      const match = modelParts.find((p) => p.file === comp.part);
      return listRow(comp.qty, match?.label ?? comp.part, {
        onClick: match ? () => handlePartChange(match.file) : undefined,
      });
    });
  }
  return modelParts.map((p) =>
    listRow(1, p.label, { onClick: () => handlePartChange(p.file) }),
  );
}

function renderInfoPanel(model: Model, part: Part) {
  renderSection(printedListEl, "3D printed parts", printedRows(model, part));

  renderSection(
    hardwareEl,
    "Hardware",
    (model.hardware ?? []).map((item) =>
      listRow(item.qty, item.label, { source: item.source }),
    ),
  );

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
    (model.filament ?? []).map((entry) =>
      listRow(undefined, entry.color ? `${entry.material} (${entry.color})` : entry.material, {
        note: entry.note,
      }),
    ),
  );

  const empty =
    printedListEl.hidden && hardwareEl.hidden && worksWithEl.hidden && filamentListEl.hidden;
  infoPanelEmpty.hidden = !empty;
  // Desktop docks the panel permanently, so an all-empty model would otherwise
  // dock an empty column; hide the whole thing instead.
  infoPanelEl.hidden = empty;
  infoBtn.hidden = empty;
  if (empty) setInfoPanelOpen(false);
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
  part: Part;
  initialValues?: Record<string, ScadValue>;
  /** When true, fire Generate automatically on first mount (used when
   *  clicking a legend row / cell — the click IS the generate action). */
  autoGenerate?: boolean;
  onValuesChange: (values: Record<string, ScadValue>) => void;
  onStart: () => void;
  onProgress: (status: string) => void;
  onFinish: () => void;
  onGenerated: (
    data: ArrayBuffer,
    format: ModelFormat,
    filename: string,
    request: { key: string; params: Record<string, ScadValue> },
  ) => void;
  onError: (msg: string) => void;
}

function Customizer({ params, slug, part, initialValues, autoGenerate, onValuesChange, onStart, onProgress, onFinish, onGenerated, onError }: CustomizerProps) {
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
  const [origin, setOrigin] = useState<ArtifactOrigin | null>(null);

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

  const handleGenerate = async () => {
    setGenerating(true);
    onStart();
    onProgress("Resolving artifact…");
    onError("");

    try {
      const { bytes, format, origin: resolved } = await resolveArtifact(
        { slug, target: targetOf(part), params: values },
        onProgress,
      );

      // Embed a permalink back to this exact param set into the downloaded
      // file. The cache holds the artifact as addressed, untagged — the
      // permalink is a property of this page, not of the geometry.
      const sourceUrl = window.location.origin + buildUrl(slug, moduleName, values);
      const tagged = embedSourceUrl(bytes, format, sourceUrl);

      setOrigin(resolved);
      const filename = `${slug}-${moduleName}-custom.${format}`;
      onGenerated(tagged, format, filename, { key: resolved.key, params: values });
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
        h("div", { key: param.name, className: "param-field" },
          h("label", { className: "param-label" },
            h("span", { className: "param-name" }, param.name),
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
      h("button", {
        className: "btn btn-primary",
        onClick: handleGenerate,
        disabled: generating,
      }, generating ? "Generating…" : `Generate Custom ${outputFormat.toUpperCase()}`),
      // Where the mesh on screen came from. Stays put while params are
      // edited — it describes what is displayed, not what Generate would do.
      origin && h("div", {
        className: "legend-row",
        style: { marginLeft: "auto", fontSize: "11px" },
        title: `Artifact ${origin.key.slice(0, 12)}…`
          + (origin.forgeStatus ? ` · forge ${origin.forgeStatus}` : ""),
      },
        h("span", { className: "legend-swatch", style: { background: ORIGIN_COLOR[origin.source] } }),
        h("span", { className: "legend-label" }, ORIGIN_LABEL[origin.source]),
      ),
    ),
  );
}

function showCustomizer(model: Model, part: Part, initialValues?: Record<string, ScadValue>, autoGenerate = false) {
  const sources = CUSTOMIZABLE_SOURCES[model.slug];
  if (!sources || !part.module) {
    hideCustomizer();
    return;
  }
  const params = parseParams(sources.lib);

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
      key: `${model.slug}:${part.module ?? ""}:${JSON.stringify(initialValues ?? null)}`,
      params,
      slug: model.slug,
      part,
      initialValues,
      autoGenerate,
      onValuesChange: (vals) => {
        const path = buildUrl(model.slug, part.module, vals);
        history.replaceState({ slug: model.slug, part: part.module, custom: vals }, "", path);
      },
      onStart: () => {
        setCustomizerOpen(false);
        hideViewerPrompt();
        viewer.clear();
        showLoadingOverlay("Starting…");
      },
      onProgress: (status) => {
        showLoadingOverlay(status);
      },
      onFinish: () => {
        hideLoadingOverlay();
      },
      onGenerated: (data, format, filename, request) => {
        lastCustomizerRequest = request;
        viewer.load(data, format);
        resolvePartColors();
        setDownloadBlob(data, filename);
        setCustomizedBadge(true);
        setError(null);
      },
      onError: (msg) => setError(msg || null),
    }),
    customizerEl,
  );
}

function hideCustomizer() {
  customizerEl.hidden = true;
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
      const { bytes } = await artifactClient.get({ slug: model.slug, target: targetOf(part) });
      return bytes;
    } catch {
      // Fall through — an unaddressable part is still servable by path.
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${part.file}: HTTP ${res.status}`);
  return res.arrayBuffer();
}

async function loadPart(model: Model, part: Part, opts: LoadPartOptions = {}) {
  const url = `${import.meta.env.BASE_URL}models/${model.slug}/${part.file}`;
  const format = formatOf(part.file);
  if (!format) {
    setError(`Unknown file type: ${part.file}`);
    return;
  }

  currentPart = part;
  lastCustomizerRequest = null;
  setCustomizedBadge(false);
  hideViewerPrompt();
  renderLegend(model, part);
  renderInfoPanel(model, part);

  if (!opts.skipPush) {
    pushRoute(model.slug, part.module, opts.initialValues);
  }

  const ext = part.file.split(".").pop();
  const baseName = part.file.replace(/\.\w+$/, "");
  const downloadName = `${model.slug}-${baseName}.${ext}`;

  // When we're navigating in with pre-set params (a legend / cell click),
  // the click IS the "Generate" — auto-run WASM instead of showing the
  // Press-Generate prompt or fetching the pre-built default artifact.
  const autoGenerate = !!opts.initialValues && !!model.customizable;

  if (model.customizable) {
    showCustomizer(model, part, opts.initialValues, autoGenerate);
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
    showLoadingOverlay("Starting…");
    return;
  }

  if (opts.promptOnly) {
    viewer.clear();
    showViewerPrompt();
    return;
  }

  try {
    setError(null);
    const buf = await fetchPartBytes(model, part, url);
    viewer.load(buf, format);
    resolvePartColors();
  } catch (err) {
    viewer.clear();
    setError(err instanceof Error ? err.message : String(err));
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

  // Title & description
  modelTitleEl.textContent = model.title;
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

  closeSidebarOnMobile();
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
  closeSidebarOnMobile();
  openPlatesPanel();
});

const plateNotice = document.createElement("span");
plateNotice.id = "plate-added";
plateNotice.hidden = true;
printBtn?.insertAdjacentElement("beforebegin", plateNotice);
let plateNoticeTimer: number | undefined;

function showPlateNotice(plateId: string, where: string): void {
  window.clearTimeout(plateNoticeTimer);
  plateNotice.textContent = `Added to ${where} · `;
  const open = document.createElement("a");
  open.className = "part-link";
  open.href = "#";
  open.textContent = "Open plate";
  open.addEventListener("click", (e) => {
    e.preventDefault();
    window.clearTimeout(plateNoticeTimer);
    plateNotice.hidden = true;
    openPlateDialog(plateId);
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
  const params = lastCustomizerRequest?.params;

  printBtn.disabled = true;
  try {
    const key = lastCustomizerRequest?.key
      ?? await artifactClient.keyFor({ slug: model.slug, target });

    const { project, plate } = await ensureTargetPlate(model.title);
    await addItemToPlate(plate.id, {
      slug: model.slug,
      target,
      format,
      label: part.label,
      modelTitle: model.title,
      params,
      key,
      qty: 1,
    });
    setError(null);
    showPlateNotice(plate.id, `${project.name} / ${plate.name}`);
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
  const model = models.find((m) => m.slug === route.slug);
  if (!model) return false;

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
  return models.find((m) => m.default) ?? models[0];
}

function renderSidebar(manifest: Manifest) {
  modelListEl.innerHTML = "";
  // A published manifest already omits dev-only models. This keeps them out of
  // any other host that serves the dev middleware's manifest instead.
  models = manifest.models.filter((m) => import.meta.env.DEV || !m.devOnly);

  for (const model of models) {
    const item = document.createElement("div");
    item.className = "model-item";
    item.dataset.slug = model.slug;
    item.textContent = model.title;
    item.addEventListener("click", () => selectModel(model));
    modelListEl.appendChild(item);
  }

  // Check URL route first
  const route = getRouteFromUrl();
  if (route && navigateToRoute(route, true)) return;

  const landing = landingModel();
  if (landing) selectModel(landing, undefined, { skipPush: true });
}

// Handle browser back/forward
window.addEventListener("popstate", () => {
  const route = getRouteFromUrl();
  if (route) {
    navigateToRoute(route, true);
  } else {
    const landing = landingModel();
    if (landing) selectModel(landing, undefined, { skipPush: true });
  }
});

async function init() {
  try {
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

// Dev-server HMR: when scripts/build-models.mjs rebuilds a model, the
// vite plugin sends a `scad-rebuilt` event. Re-fetch the current part
// (cache-busted) and reload the viewer while preserving camera state.
// Skipped when the model is customizable and the user is actively
// customizing — WASM output takes precedence over the file version.
if (import.meta.hot) {
  import.meta.hot.on("scad-rebuilt", async (data: { slug: string }) => {
    if (!currentModel || !currentPart) return;
    if (currentModel.slug !== data.slug) return;
    if (currentModel.customizable && !customizedBadge.hidden) return;
    const url = `${import.meta.env.BASE_URL}models/${currentModel.slug}/${currentPart.file}`;
    const format = formatOf(currentPart.file);
    if (!format) return;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      viewer.load(buf, format, { preserveView: true });
      resolvePartColors();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  });
}
