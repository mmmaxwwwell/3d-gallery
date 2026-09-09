import { createViewer, type ModelFormat } from "./viewer";
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
import fiMiniCaseLib from "../../../models/fi-mini-case/lib/fi-mini-case-lib.scad?raw";
import fiMiniCaseAssembled from "../../../models/fi-mini-case/previews/assembled.scad?raw";
import fiMiniCaseCap from "../../../models/fi-mini-case/previews/cap.scad?raw";
import qrSignLib from "../../../models/qr-sign/lib/qr-sign-lib.scad?raw";
import qrSignAssembled from "../../../models/qr-sign/previews/assembled.scad?raw";
import parametricShelfLib from "../../../models/parametric-shelf/lib/parametric-shelf-lib.scad?raw";
import ff5mFilamentSensorLib from "../../../models/ff5m-filament-sensor/lib/ff5m-filament-sensor-lib.scad?raw";
import et300KnobAideKnurledLib from "../../../models/et300-knob-aide-knurled/lib/et300-knob-aide-knurled-lib.scad?raw";
import et300KnobAideKnurledLogoPolygon from "../../../models/et300-knob-aide-knurled/lib/logo-polygon-data.scad?raw";
import et300KnobAideKnurledMulticolor from "../../../models/et300-knob-aide-knurled/previews/tactile-aide-multicolor.scad?raw";
import splitTray500Lib from "../../../models/split-tray-500/lib/split-tray-500-lib.scad?raw";
import splitTray500Assembled2x2 from "../../../models/split-tray-500/previews/assembled-2x2.scad?raw";
import splitTray500Assembled3x3 from "../../../models/split-tray-500/previews/assembled-3x3.scad?raw";
import { parseParams, coerceToParamType } from "./lib/scad-parser";
import { createOpenSCADApi, injectParameters } from "./lib/openscad-api";
import { embedSourceUrl } from "./lib/embed-source-url";
import type { ScadParam, ScadValue } from "./lib/types";

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
  previews?: Part[];
  parts?: Part[];
  hardware?: HardwareItem[];
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

// Customizable model sources keyed by slug
const CUSTOMIZABLE_SOURCES: Record<string, { lib: string; previews: Record<string, string> }> = {
  "collar-tag": {
    lib: collarTagLib,
    previews: {
      multicolor: stripIncludes(collarTagMulticolor),
    },
  },
  "fi-mini-case": {
    lib: fiMiniCaseLib,
    previews: {
      assembled: stripIncludes(fiMiniCaseAssembled),
      cap: stripIncludes(fiMiniCaseCap),
    },
  },
  "qr-sign": {
    lib: qrSignLib,
    previews: {
      assembled: stripIncludes(qrSignAssembled),
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
      assembled: stripIncludes(et300KnobAideKnurledMulticolor),
    },
  },
  "split-tray-500": {
    lib: splitTray500Lib,
    previews: {
      "assembled-2x2": stripIncludes(splitTray500Assembled2x2),
      "assembled-3x3": stripIncludes(splitTray500Assembled3x3),
    },
  },
};

// ── DOM refs ─────────────────────────────────────────────

const sidebarEl = document.getElementById("sidebar")!;
const sidebarToggle = document.getElementById("sidebar-toggle")!;
const modelListEl = document.getElementById("model-list")!;
const modelTitleEl = document.getElementById("model-title")!;
const modelDescEl = document.getElementById("model-description")!;
const partSelect = document.getElementById("part-select") as HTMLSelectElement;
const mobilePartSelect = document.getElementById("mobile-part-select") as HTMLSelectElement;
const viewerContainer = document.getElementById("viewer-container")!;
const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
const errorEl = document.getElementById("viewer-error")!;
const partsListEl = document.getElementById("parts-list")!;
const filamentListEl = document.getElementById("filament-list")!;
const hardwareEl = document.getElementById("hardware-list")!;
const legendEl = document.getElementById("viewer-legend")!;
const customizerEl = document.getElementById("customizer")!;
const customizedBadge = document.getElementById("customized-badge")!;
const loadingOverlay = document.getElementById("viewer-loading")!;
const loadingStatus = loadingOverlay.querySelector(".loading-status")!;
const loadingBarFill = loadingOverlay.querySelector(".loading-bar-fill") as HTMLElement;
const viewerPrompt = document.getElementById("viewer-prompt")!;
const leaderSvg = document.getElementById("viewer-leader") as unknown as SVGSVGElement;

const viewer = createViewer(viewerContainer);

// Bidirectional legend ↔ viewer hover wiring. `legendRowsByColor` is
// rebuilt whenever we re-render the legend for a new part; the viewer's
// hover callback fires the same handler either way so the "which row is
// active" state stays consistent no matter the input device.
const legendRowsByColor = new Map<string, HTMLElement>();
let activeLegendColor: string | null = null;

function normColor(hex: string): string {
  return hex.toLowerCase();
}

/**
 * Applies the same linear→sRGB transform that scripts/build-multicolor-3mf.mjs
 * runs on OpenSCAD's raw CSG color values, so a manifest legend hex
 * (authored in matching SCAD `color("#…")` source form) resolves to the
 * hex Three.js actually reads out of the 3MF.
 *
 * OpenSCAD's CSG output stores `color("#5b8dd6")` as `color([0.357, 0.553,
 * 0.839, 1])` — raw sRGB channels normalized to [0,1]. The pipeline then
 * treats those values as *linear* and encodes them back out as sRGB before
 * writing to the .3mf, so the on-disk hex is effectively double-encoded.
 */
function scadHexToDisplayHex(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return normColor(hex);
  const linearToSrgb = (v: number) =>
    v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  const chan = (i: number) => parseInt(m[1].slice(i, i + 2), 16) / 255;
  const r = chan(0), g = chan(2), b = chan(4);
  const enc = (v: number) =>
    Math.round(Math.max(0, Math.min(1, linearToSrgb(v))) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${enc(r)}${enc(g)}${enc(b)}`;
}

function setActiveLegend(color: string | null) {
  activeLegendColor = color;
  for (const [c, row] of legendRowsByColor) {
    row.classList.toggle("legend-active", color !== null && c === color);
  }
  updateLeaderLine();
}

function updateLeaderLine() {
  clearLeader();
  if (!activeLegendColor) return;
  const row = legendRowsByColor.get(activeLegendColor);
  if (!row) return;
  const meshPos = viewer.getScreenPositionForColor(activeLegendColor);
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
  if (info) {
    const col = normColor(info.color);
    // Only highlight if this color is in the current legend — 3MFs may
    // include ancillary colors (edges, defaults) we don't want to flash.
    if (legendRowsByColor.has(col)) {
      const row = legendRowsByColor.get(col);
      const clickable = row?.classList.contains("legend-clickable") ?? false;
      viewerContainer.style.cursor = clickable ? "pointer" : "";
      setActiveLegend(col);
      return;
    }
  }
  viewerContainer.style.cursor = "";
  setActiveLegend(null);
});

// Clicking a mesh navigates to the same target the matching legend row
// links to — delegated by dispatching the row's own click handler so
// both entry points share one flow.
viewer.onClick((hex) => {
  const row = legendRowsByColor.get(normColor(hex));
  if (row?.classList.contains("legend-clickable")) row.click();
});

// Redraw the leader line each animation frame while a legend is active
// so it tracks camera orbit without needing a viewer event.
function leaderTick() {
  if (activeLegendColor) updateLeaderLine();
  requestAnimationFrame(leaderTick);
}
requestAnimationFrame(leaderTick);

// Mobile sidebar toggle
sidebarToggle.addEventListener("click", () => {
  sidebarEl.classList.toggle("open");
});

function closeSidebarOnMobile() {
  if (window.innerWidth < 768) {
    sidebarEl.classList.remove("open");
  }
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

const ROUTE_PARAMS = new Set(["model", "part"]);

function buildUrl(slug: string, partModule?: string, customValues?: Record<string, ScadValue>): string {
  const url = new URL(window.location.href);
  url.search = "";
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

// ── localStorage cache ───────────────────────────────────

async function computeCacheKey(scadSource: string, moduleName: string, values: Record<string, ScadValue>): Promise<string> {
  const sortedKeys = Object.keys(values).sort();
  const sortedValues: Record<string, ScadValue> = {};
  for (const k of sortedKeys) sortedValues[k] = values[k];
  const payload = scadSource + "\0" + moduleName + "\0" + JSON.stringify(sortedValues);
  // crypto.subtle only exists in secure contexts (HTTPS or localhost). Fall
  // back to a non-cryptographic hash for plain HTTP so the customizer still
  // caches correctly when the dev server is reached over a LAN / tailscale IP.
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = new TextEncoder().encode(payload);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return fnv1aHex(payload);
}

// Two 32-bit FNV-1a-style hashes with different multipliers, concatenated
// for a 64-bit-ish key. Not cryptographic — just for cache-key uniqueness
// across the small set of param combinations one user will try.
function fnv1aHex(text: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x85ebca6b);
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

function getCachedResult(slug: string, hash: string): ArrayBuffer | null {
  try {
    const b64 = localStorage.getItem(`3dg:${slug}:${hash}`);
    if (!b64) return null;
    const binary = atob(b64);
    const buf = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
    return buf.buffer;
  } catch {
    return null;
  }
}

function setCachedResult(slug: string, hash: string, data: ArrayBuffer): void {
  try {
    const bytes = new Uint8Array(data);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    localStorage.setItem(`3dg:${slug}:${hash}`, btoa(binary));
  } catch {
    // localStorage full — silently ignore
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
}

function setDownloadUrl(url: string, filename: string) {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  downloadLink.href = url;
  downloadLink.setAttribute("download", filename);
  downloadLink.hidden = false;
}

// ── Legend & hardware ────────────────────────────────────

function renderLegend(model: Model, part: Part) {
  legendEl.innerHTML = "";
  legendRowsByColor.clear();
  setActiveLegend(null);
  if (!part.legend || part.legend.length === 0) {
    legendEl.hidden = true;
    return;
  }
  const heading = document.createElement("div");
  heading.className = "legend-title";
  heading.textContent = "Colors";
  legendEl.appendChild(heading);

  for (const entry of part.legend) {
    const row = document.createElement("div");
    row.className = "legend-row";
    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = entry.color;
    const label = document.createElement("span");
    label.className = "legend-label";
    label.textContent = entry.label;
    row.appendChild(swatch);
    row.appendChild(label);

    // The 3MF pipeline transforms SCAD hex literals before writing them
    // out, so we key the row (and paint its swatch) using the display hex
    // — otherwise viewer-emitted color events won't match. See
    // scadHexToDisplayHex().
    const displayColor = scadHexToDisplayHex(entry.color);
    swatch.style.background = displayColor;
    legendRowsByColor.set(displayColor, row);

    row.addEventListener("pointerenter", () => {
      viewer.highlightByColor(displayColor);
      setActiveLegend(displayColor);
    });
    row.addEventListener("pointerleave", () => {
      viewer.highlightByColor(null);
      setActiveLegend(null);
    });

    if (entry.part && entry.params) {
      const target = (model.parts ?? []).find((p) => p.file === entry.part);
      if (target) {
        row.classList.add("legend-clickable");
        row.title = `Open ${target.label}`;
        row.addEventListener("click", () => {
          handlePartChange(target.file, entry.params);
        });
      }
    }

    legendEl.appendChild(row);
  }
  legendEl.hidden = false;
}

function renderHardware(model: Model) {
  hardwareEl.innerHTML = "";
  if (!model.hardware || model.hardware.length === 0) {
    hardwareEl.hidden = true;
    return;
  }
  const heading = document.createElement("h3");
  heading.textContent = "Hardware required";
  hardwareEl.appendChild(heading);

  const ul = document.createElement("ul");
  for (const item of model.hardware) {
    const li = document.createElement("li");
    const qty = document.createElement("span");
    qty.className = "hardware-qty";
    qty.textContent = `${item.qty}×`;
    li.appendChild(qty);

    const label = document.createElement("span");
    label.className = "hardware-label";
    label.textContent = ` ${item.label}`;
    li.appendChild(label);

    if (item.source) {
      const link = document.createElement("a");
      link.className = "hardware-source";
      link.href = item.source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = item.source.vendor ?? "source";
      li.appendChild(document.createTextNode(" "));
      li.appendChild(link);
    }
    ul.appendChild(li);
  }
  hardwareEl.appendChild(ul);
  hardwareEl.hidden = false;
}

// ── Parts list (assembly components) ─────────────────────

function renderPartsList(model: Model, part: Part) {
  partsListEl.innerHTML = "";
  if (!part.components || part.components.length === 0) {
    partsListEl.hidden = true;
    return;
  }

  const heading = document.createElement("h3");
  heading.textContent = "Parts in this assembly";
  partsListEl.appendChild(heading);

  const ul = document.createElement("ul");
  ul.className = "parts-component-list";
  for (const comp of part.components) {
    const matchingPart = (model.parts ?? []).find((p) => p.file === comp.part);
    const li = document.createElement("li");
    const qty = document.createElement("span");
    qty.className = "hardware-qty";
    qty.textContent = `${comp.qty}×`;
    li.appendChild(qty);

    if (matchingPart) {
      const link = document.createElement("a");
      link.className = "part-link";
      link.href = "#";
      link.textContent = ` ${matchingPart.label}`;
      link.addEventListener("click", (e) => {
        e.preventDefault();
        handlePartChange(matchingPart.file);
      });
      li.appendChild(link);
    } else {
      const label = document.createElement("span");
      label.textContent = ` ${comp.part}`;
      li.appendChild(label);
    }
    ul.appendChild(li);
  }
  partsListEl.appendChild(ul);
  partsListEl.hidden = false;
}

// ── Filament recommendations ─────────────────────────────

function renderFilament(model: Model) {
  filamentListEl.innerHTML = "";
  if (!model.filament || model.filament.length === 0) {
    filamentListEl.hidden = true;
    return;
  }

  const heading = document.createElement("h3");
  heading.textContent = "Recommended filament";
  filamentListEl.appendChild(heading);

  const ul = document.createElement("ul");
  for (const entry of model.filament) {
    const li = document.createElement("li");
    let text = entry.material;
    if (entry.color) text += ` (${entry.color})`;
    if (entry.note) text += ` — ${entry.note}`;
    li.textContent = text;
    ul.appendChild(li);
  }
  filamentListEl.appendChild(ul);
  filamentListEl.hidden = false;
}

// ── Customizer (Preact) ──────────────────────────────────

interface CustomizerProps {
  libSource: string;
  previewSource?: string;
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
  onGenerated: (data: ArrayBuffer, format: ModelFormat, filename: string) => void;
  onError: (msg: string) => void;
}

function Customizer({ libSource, previewSource, params, slug, part, initialValues, autoGenerate, onValuesChange, onStart, onProgress, onFinish, onGenerated, onError }: CustomizerProps) {
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
  const isMulticolor = outputFormat === "3mf" && !!previewSource;

  const handleGenerate = async () => {
    setGenerating(true);
    onStart();
    onProgress("Checking cache…");
    onError("");

    try {
      // Inject user params into the lib first so any preview-specific
      // trailing assignments (e.g. `split = 3;` in assembled-3x3.scad)
      // remain authoritative — those are the preview's whole point.
      const injectedLib = injectParameters(libSource, values);
      const fullSource = isMulticolor && previewSource
        ? injectedLib + "\n" + previewSource
        : injectedLib + `\n$fn=40;\n${moduleName}();\n`;
      const cacheHash = await computeCacheKey(libSource, moduleName, values);

      const cached = getCachedResult(slug, cacheHash);
      if (cached) {
        onProgress("Loaded from cache!");
        const filename = `${slug}-${moduleName}-custom.${outputFormat}`;
        onGenerated(cached, outputFormat, filename);
        onFinish();
        setGenerating(false);
        return;
      }

      onProgress("Initializing OpenSCAD WASM…");
      const api = createOpenSCADApi();
      await api.init();
      onProgress(`Rendering ${outputFormat.toUpperCase()} — this may take a while…`);

      let result: ArrayBuffer;
      if (isMulticolor) {
        result = await api.renderMulticolor(fullSource, (line) => onProgress(line));
      } else {
        result = await api.render(fullSource, outputFormat, (line) => onProgress(line));
      }

      // Embed a permalink back to this exact param set into the output
      // file itself. Cache the tagged version so subsequent hits also
      // include it — the URL is derived from the same params as the
      // cache key, so they stay in sync.
      const sourceUrl =
        window.location.origin + buildUrl(slug, moduleName, values);
      const tagged = embedSourceUrl(result, outputFormat, sourceUrl);

      setCachedResult(slug, cacheHash, tagged);

      const filename = `${slug}-${moduleName}-custom.${outputFormat}`;
      onGenerated(tagged, outputFormat, filename);
      onFinish();
      api.dispose();
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
    ),
  );
}

function showCustomizer(model: Model, part: Part, initialValues?: Record<string, ScadValue>, autoGenerate = false) {
  const sources = CUSTOMIZABLE_SOURCES[model.slug];
  if (!sources || !part.module) {
    customizerEl.hidden = true;
    return;
  }
  const params = parseParams(sources.lib);
  const previewSource = sources.previews[part.module];

  customizerEl.hidden = false;
  render(
    h(Customizer, {
      // Force a fresh Customizer instance whenever the model, part, or
      // incoming initialValues change. Without this Preact reuses the
      // previous instance's useState (so cell-click params never make
      // it into the form) AND the mount-time autoGenerate useEffect
      // never re-fires on subsequent clicks of a different cell.
      key: `${model.slug}:${part.module ?? ""}:${JSON.stringify(initialValues ?? null)}`,
      libSource: sources.lib,
      previewSource,
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
      onGenerated: (data, format, filename) => {
        viewer.load(data, format);
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
let currentItems: { part: Part; group: string }[] = [];

interface LoadPartOptions {
  initialValues?: Record<string, ScadValue>;
  promptOnly?: boolean;
  skipPush?: boolean;
}

async function loadPart(model: Model, part: Part, opts: LoadPartOptions = {}) {
  const url = `${import.meta.env.BASE_URL}models/${model.slug}/${part.file}`;
  const format = formatOf(part.file);
  if (!format) {
    setError(`Unknown file type: ${part.file}`);
    return;
  }

  currentPart = part;
  setCustomizedBadge(false);
  hideViewerPrompt();
  renderLegend(model, part);
  renderPartsList(model, part);

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
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${part.file}: HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    viewer.load(buf, format);
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
    modelDescEl.textContent = model.description;
    modelDescEl.hidden = false;
  } else {
    modelDescEl.hidden = true;
  }

  // Hardware & filament (show once per model, not per part)
  renderHardware(model);
  renderFilament(model);

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

function renderSidebar(manifest: Manifest) {
  modelListEl.innerHTML = "";
  models = manifest.models;

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

  // Otherwise select first model
  if (models.length > 0) {
    selectModel(models[0], undefined, { skipPush: true });
  }
}

// Handle browser back/forward
window.addEventListener("popstate", () => {
  const route = getRouteFromUrl();
  if (route) {
    navigateToRoute(route, true);
  } else if (models.length > 0) {
    selectModel(models[0], undefined, { skipPush: true });
  }
});

async function init() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}models/manifest.json`);
    if (!res.ok) throw new Error(`manifest.json: HTTP ${res.status}`);
    const manifest = (await res.json()) as Manifest;
    renderSidebar(manifest);
  } catch (err) {
    modelListEl.textContent = "Failed to load manifest";
    setError(err instanceof Error ? err.message : String(err));
  }
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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  });
}
