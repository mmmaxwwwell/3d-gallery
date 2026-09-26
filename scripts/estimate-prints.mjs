// Slice every printable pre-rendered artifact and record how long it takes to
// print at a handful of volumetric flow limits.
//
// Writes public/models/print-estimates.json, keyed by artifact key, so an
// estimate can only ever be matched to the exact bytes it was sliced from.
//
// What counts as printable: every STL, every print plate (`plate: true`), plus
// the 3MF previews of a model that ships no STL parts — there the 3MF is the
// print. Any other 3MF is an assembly render (pieces in their assembled
// positions) and slicing it means nothing.
//
// Each model is sliced at its recommended profile (walls, infill, supports,
// brim — `printProfile` in the manifest over model-core's default), the same
// profile the print planner slices with in the browser.
//
// Run after build:models. Results are cached in .cache/print-estimates/ under
// the artifact key, the slice config and the slicer binary, so an unchanged
// part is never re-sliced.
//
// Usage:  node scripts/estimate-prints.mjs [--published] [slug...]
//
// A local run includes `devOnly` models, so the dev server shows their print
// time too; --published (CI, `npm run build`) leaves them out, like the
// published build. With slugs, only those models are sliced and the output
// file is left alone.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { availableParallelism } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMainThread, parentPort, Worker } from "node:worker_threads";

import { buildViews, describeProfile, recommendedProfile } from "../packages/model-core/src/index.ts";
import { createForge, targetOf } from "../packages/model-forge/src/index.ts";

// print-toolkit writes its relative imports as `.js` for tsc; Node's type
// stripping runs the `.ts` files directly, so point those imports at them.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && specifier.endsWith(".js") && context.parentURL?.endsWith(".ts")) {
      const ts = new URL(specifier.replace(/\.js$/, ".ts"), context.parentURL);
      if (existsSync(fileURLToPath(ts))) return next(ts.href, context);
    }
    return next(specifier, context);
  },
});

const { createNodeSlicerEngine, slicerWasmPath } = await import("../packages/print-toolkit/src/node-slicer.ts");
const { buildOrcaConfig } = await import("../packages/print-toolkit/src/orca-slicer-settings.ts");
const { DEFAULT_PRINT_PROFILE } = await import("../packages/print-toolkit/src/print-profile.ts");
const { filamentByType } = await import("../packages/print-toolkit/src/gcode-parser.ts");

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "public", "models", "print-estimates.json");
const CACHE_DIR = join(ROOT, ".cache", "print-estimates");

/** Flow ceilings (mm³/s) to estimate at, and the filament each one stands for. */
const RATES = [
  { mmPerS: 3, label: "TPU" },
  { mmPerS: 8 },
  { mmPerS: 12, label: "PETG" },
  { mmPerS: 18, label: "PLA" },
];

/** Weight and cost are quoted in PLA. */
const FILAMENT = { material: "PLA", density: 1.24, costPerKg: 10 };

/**
 * g/cm³ by material family, so the gallery can re-weigh a piece in the
 * filament its model names. Display-only: kept out of the cache salt.
 */
const DENSITIES = { PLA: 1.24, PETG: 1.27, TPU: 1.21 };

/** A model's recommended profile, as the toolkit's full process profile. */
function processProfile(recommended) {
  return {
    ...DEFAULT_PRINT_PROFILE,
    wallLoops: recommended.walls,
    sparseInfillDensity: recommended.infillDensity,
    sparseInfillPattern: recommended.infillPattern,
    supportEnabled: recommended.supports !== "none",
    supportType: recommended.supports === "tree" ? "tree_auto" : "normal_auto",
    supportStyle: recommended.supports === "tree" ? "organic" : "default",
    supportOnBuildPlateOnly: recommended.supportsOnBuildPlateOnly,
    adhesionType: recommended.brim ? "brim" : "none",
    brimType: "outer_only",
    brimWidth: 5,
  };
}

const FILAMENT_SETTINGS = {
  nozzleTemp: 220,
  bedTemp: 55,
  fanSpeed: 100,
  firstLayerFan: 0,
  printSpeed: 200,
  retractDist: 0.8,
  retractSpeed: 35,
  deretractionSpeed: 35,
  firstLayerNozzleTemp: 220,
  firstLayerBedTemp: 55,
  minSpeed: 20,
  minLayerTime: 6,
  flowRatio: 1.0,
  enablePressureAdvance: false,
  pressureAdvance: 0.04,
  adaptivePressureAdvance: false,
  overhangFanSpeed: 100,
  overhangFanThreshold: 0,
  enableOverhangBridgeFan: true,
  closeFanFirstLayers: 1,
  fanCoolingLayerTime: 60,
  slowDownLayerTime: 4,
  fanMaxSpeed: 100,
  coolPlateTemp: 55,
  coolPlateTempInitialLayer: 55,
  engPlateTemp: 55,
  engPlateTempInitialLayer: 55,
  texturedPlateTemp: 55,
  texturedPlateTempInitialLayer: 55,
};

// FlashForge Adventurer 5M, 0.4 nozzle — the printers these models are made on.
const PRINTER = {
  name: "FlashForge Adventurer 5M, 0.4 mm nozzle",
  settings: {
    bedWidth: 220,
    bedDepth: 220,
    maxHeight: 220,
    originCenter: true,
    startGcode: "",
    endGcode: "",
    toolChangeGcode: "",
    printableArea: [],
    bedExcludeAreas: [],
    printerStructureType: "corexy",
    nozzleType: "stainless_steel",
    nozzleHRC: 0,
    auxiliaryFan: true,
    chamberTempControl: false,
    maxVolumetricSpeed: 0,
  },
  // Orca's built-in machine limits are a slow generic printer, and the time
  // estimator honours them. These are the AD5M system profile's.
  limits: {
    gcode_flavor: "klipper",
    machine_max_acceleration_x: "20000",
    machine_max_acceleration_y: "20000",
    machine_max_acceleration_z: "500",
    machine_max_acceleration_e: "5000",
    machine_max_acceleration_extruding: "20000",
    machine_max_acceleration_retracting: "5000",
    machine_max_acceleration_travel: "20000",
    machine_max_speed_x: "600",
    machine_max_speed_y: "600",
    machine_max_speed_z: "20",
    machine_max_speed_e: "30",
    machine_max_jerk_x: "9",
    machine_max_jerk_y: "9",
    machine_max_jerk_z: "3",
    machine_max_jerk_e: "2.5",
  },
};

function sliceConfig(recommended) {
  return {
    ...buildOrcaConfig(processProfile(recommended), FILAMENT_SETTINGS, PRINTER.settings, null, 1),
    ...PRINTER.limits,
    filament_density: String(FILAMENT.density),
    filament_cost: String(FILAMENT.costPerKg),
  };
}

/**
 * Artifacts worth slicing: every STL, every print plate, and the 3MFs of a
 * model with no STL parts. A model with builds is sliced once per build, with
 * that build's params.
 */
function printableRequests(forge) {
  const out = [];
  for (const model of forge.manifest.models) {
    const recommended = recommendedProfile(model);
    const config = sliceConfig(recommended);
    const profile = describeProfile(recommended);
    for (const view of buildViews(model)) {
      const params = Object.keys(view.params).length > 0 ? { params: view.params } : {};
      const build = view.build ? ` (${view.build.label ?? view.build.id})` : "";
      for (const part of [...view.previews, ...view.parts]) {
        if (part.format === "3mf" && !part.plate && (view.parts.length > 0 || part.components?.length)) continue;
        out.push({ slug: model.slug, target: targetOf(part), format: part.format, file: `${part.file}${build}`, config, profile, ...params });
      }
    }
  }
  return out;
}

async function sliceAt(bytes, format, config) {
  const engine = await createNodeSlicerEngine();
  try {
    if (format === "3mf") engine.load3MF(bytes);
    else engine.loadSTL(bytes);
    engine.setConfig(config);
    // The C++ side narrates every stage straight to console.log.
    const log = console.log;
    console.log = () => {};
    try { engine.slice(); } finally { console.log = log; }
    // The print-time estimate is filled in by the G-code processor, which only
    // runs on export.
    const gcode = engine.exportGCode();
    const stats = engine.getSliceStats();
    if (!stats?.printTime) throw new Error("slicer returned no print time");
    return { stats, gcode };
  } finally {
    engine.destroy();
  }
}

async function estimate(bytes, format, config, profile) {
  const seconds = {};
  let sliced;
  for (const rate of RATES) {
    sliced = await sliceAt(bytes, format, { ...config, filament_max_volumetric_speed: String(rate.mmPerS) });
    seconds[rate.mmPerS] = sliced.stats.printTime;
  }
  const { stats, gcode } = sliced;
  const grams = (stats.totalFilamentMm3 / 1000) * FILAMENT.density;
  // The slicer's total is the authority; the G-code tally only splits it.
  const byType = filamentByType(gcode);
  const fed = Object.values(byType).reduce((a, b) => a + b, 0);
  const share = (type) => (fed > 0 ? Math.round((grams * (byType[type] ?? 0) / fed) * 10) / 10 : 0);
  return {
    seconds,
    layers: stats.layerCount,
    grams: Math.round(grams * 10) / 10,
    supportGrams: share("support"),
    purgeGrams: share("purge-tower"),
    cost: Math.round(grams * FILAMENT.costPerKg) / 1000,
    profile,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const forge = createForge({ root: ROOT, includeDevOnly: !args.includes("--published") });
  const only = args.filter((a) => !a.startsWith("--"));
  const requests = printableRequests(forge).filter((req) => only.length === 0 || only.includes(req.slug));
  const settings = { rates: RATES, filament: FILAMENT, densities: DENSITIES, defaultMaterial: "PETG", printer: PRINTER.name, profile: "0.2 mm layers" };
  const salt = createHash("sha256")
    // Bumped when an entry gains a field, so cached entries are re-sliced to carry it.
    .update("entry-v2")
    .update(JSON.stringify(RATES))
    .update(readFileSync(slicerWasmPath()))
    .digest("hex");

  mkdirSync(CACHE_DIR, { recursive: true });
  const estimates = {};
  const failed = [];
  const started = Date.now();

  const misses = [];
  for (const { file, config, profile, ...req } of requests) {
    const result = await forge.ensure(req);
    const cacheKey = createHash("sha256").update(`${salt}\0${JSON.stringify(config)}\0${profile}\0${result.key}`).digest("hex");
    const cachePath = join(CACHE_DIR, `${cacheKey}.json`);
    if (existsSync(cachePath)) estimates[result.key] = JSON.parse(readFileSync(cachePath, "utf8"));
    else misses.push({ name: `${req.slug}/${file}`, key: result.key, format: req.format, bytes: result.bytes, cachePath, config, profile });
  }
  console.log(`${requests.length - misses.length} cached, ${misses.length} to slice`);

  // Slicing is synchronous inside one wasm instance, so parallelism means threads.
  const threads = Math.min(misses.length, availableParallelism());
  await Promise.all(Array.from({ length: threads }, async () => {
    const worker = new Worker(fileURLToPath(import.meta.url));
    try {
      for (let job = misses.shift(); job; job = misses.shift()) {
        const t = Date.now();
        const reply = await new Promise((resolve, reject) => {
          const settle = (fn) => (value) => {
            worker.off("message", onMessage).off("error", onError);
            fn(value);
          };
          const onMessage = settle(resolve);
          const onError = settle(reject);
          worker.on("message", onMessage).on("error", onError);
          worker.postMessage({ bytes: job.bytes, format: job.format, config: job.config, profile: job.profile });
        });
        if (reply.error) {
          // An estimate is information, not a gate: report it and ship without one.
          failed.push(job.name);
          console.log(`::warning::print estimate failed for ${job.name}: ${reply.error}`);
          continue;
        }
        writeFileSync(job.cachePath, JSON.stringify(reply.entry));
        estimates[job.key] = reply.entry;
        console.log(`  [slice] ${job.name} (${Date.now() - t}ms)`);
      }
    } finally {
      await worker.terminate();
    }
  }));

  if (only.length === 0) writeFileSync(OUT, `${JSON.stringify({ settings, estimates })}\n`);
  console.log(`Estimated ${Object.keys(estimates).length}/${requests.length} artifacts in ${Date.now() - started}ms${only.length ? "" : ` → ${OUT}`}`);
  if (failed.length) console.log(`No estimate for: ${failed.join(", ")}`);
}

if (isMainThread) {
  await main();
} else {
  parentPort.on("message", async ({ bytes, format, config, profile }) => {
    try {
      parentPort.postMessage({ entry: await estimate(bytes, format, config, profile) });
    } catch (err) {
      parentPort.postMessage({ error: err.message });
    }
  });
}
