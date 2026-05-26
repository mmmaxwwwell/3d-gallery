import { createViewer, type ModelFormat } from "./viewer";
import { render, h } from "preact";
import { useState } from "preact/hooks";
import fiMiniCaseLib from "../models/fi-mini-case/lib/fi-mini-case-lib.scad?raw";
import fiMiniCaseAssembled from "../models/fi-mini-case/previews/assembled.scad?raw";
import fiMiniCaseCap from "../models/fi-mini-case/previews/cap.scad?raw";
import qrSignLib from "../models/qr-sign/lib/qr-sign-lib.scad?raw";
import qrSignAssembled from "../models/qr-sign/previews/assembled.scad?raw";
import { parseParams } from "./lib/scad-parser";
import { createOpenSCADApi, injectParameters } from "./lib/openscad-api";
import type { ScadParam, ScadValue } from "./lib/types";

interface LegendEntry {
  color: string;
  label: string;
}

interface Part {
  file: string;
  format: ModelFormat;
  label: string;
  default?: boolean;
  legend?: LegendEntry[];
  module?: string;
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

interface Model {
  slug: string;
  title: string;
  description?: string;
  customizable?: boolean;
  previews?: Part[];
  parts: Part[];
  hardware?: HardwareItem[];
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
const hardwareEl = document.getElementById("hardware-list")!;
const legendEl = document.getElementById("viewer-legend")!;
const customizerEl = document.getElementById("customizer")!;
const customizedBadge = document.getElementById("customized-badge")!;
const loadingOverlay = document.getElementById("viewer-loading")!;
const loadingStatus = loadingOverlay.querySelector(".loading-status")!;
const loadingBarFill = loadingOverlay.querySelector(".loading-bar-fill") as HTMLElement;
const viewerPrompt = document.getElementById("viewer-prompt")!;

const viewer = createViewer(viewerContainer);

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
  const buf = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

function renderLegend(part: Part) {
  legendEl.innerHTML = "";
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

// ── Customizer (Preact) ──────────────────────────────────

interface CustomizerProps {
  libSource: string;
  previewSource?: string;
  params: ScadParam[];
  slug: string;
  part: Part;
  initialValues?: Record<string, ScadValue>;
  onValuesChange: (values: Record<string, ScadValue>) => void;
  onStart: () => void;
  onProgress: (status: string) => void;
  onFinish: () => void;
  onGenerated: (data: ArrayBuffer, format: ModelFormat, filename: string) => void;
  onError: (msg: string) => void;
}

function Customizer({ libSource, previewSource, params, slug, part, initialValues, onValuesChange, onStart, onProgress, onFinish, onGenerated, onError }: CustomizerProps) {
  const [values, setValues] = useState<Record<string, ScadValue>>(() => {
    const defaults: Record<string, ScadValue> = {};
    for (const p of params) defaults[p.name] = p.default;
    if (initialValues) Object.assign(defaults, initialValues);
    return defaults;
  });
  const [generating, setGenerating] = useState(false);

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
      const fullSource = isMulticolor && previewSource
        ? libSource + "\n" + previewSource
        : libSource + `\n$fn=40;\n${moduleName}();\n`;
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

      const source = injectParameters(fullSource, values);
      let result: ArrayBuffer;
      if (isMulticolor) {
        result = await api.renderMulticolor(source, (line) => onProgress(line));
      } else {
        result = await api.render(source, outputFormat, (line) => onProgress(line));
      }

      setCachedResult(slug, cacheHash, result);

      const filename = `${slug}-${moduleName}-custom.${outputFormat}`;
      onGenerated(result, outputFormat, filename);
      onFinish();
      api.dispose();
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
      onFinish();
    } finally {
      setGenerating(false);
    }
  };

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
                  value: values[param.name] as string,
                  onChange: (e: Event) => handleChange(param.name, (e.target as HTMLSelectElement).value),
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

function showCustomizer(model: Model, part: Part, initialValues?: Record<string, ScadValue>) {
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
      libSource: sources.lib,
      previewSource,
      params,
      slug: model.slug,
      part,
      initialValues,
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
    ...model.parts.map((p) => ({ part: p, group: "Parts" })),
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

  setCustomizedBadge(false);
  hideViewerPrompt();
  renderLegend(part);

  if (!opts.skipPush) {
    pushRoute(model.slug, part.module, opts.initialValues);
  }

  if (model.customizable) {
    showCustomizer(model, part, opts.initialValues);
    if (!opts.promptOnly) {
      setDownloadUrl(url, part.file);
    } else {
      downloadLink.hidden = true;
    }
  } else {
    hideCustomizer();
    setDownloadUrl(url, part.file);
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

  // Hardware (show once per model, not per part)
  renderHardware(model);

  // Determine which part to load
  const targetPart = partOverride ?? defaultItemFor(model)?.part;
  if (!targetPart) return;

  // Populate dropdown & load part
  populatePartSelect(model, targetPart);
  loadPart(model, targetPart, opts);

  closeSidebarOnMobile();
}

// Dropdown change → switch part within the current model
function handlePartChange(selectedFile: string) {
  if (!currentModel) return;
  const item = currentItems.find((i) => i.part.file === selectedFile);
  if (item) {
    // Sync both selects
    partSelect.value = selectedFile;
    mobilePartSelect.value = selectedFile;
    loadPart(currentModel, item.part);
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
