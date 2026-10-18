/**
 * Slice one manifest print plate for the Bambu Lab X1 Carbon with the slicer
 * WASM in Node, and write the `.gcode.3mf` the printer takes — the gallery's
 * Bambu path without a browser. Nothing is sent anywhere.
 *
 *   node scripts/slice-bambu-plate.mjs <slug> <plate file> [out.gcode.3mf]
 *   node scripts/slice-bambu-plate.mjs qr-leash-tag plate.3mf /tmp/qr.gcode.3mf
 *
 * Each of the plate's filaments (model-core `plateFilaments`) gets an AMS slot
 * and the bundled Bambu filament preset for its family. Needs the slicer WASM
 * (`npm run fetch-wasm -w @3d-gallery/print-toolkit`).
 */

import { existsSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildViews, materialFamily, plateFilaments, recommendedProfile } from "../packages/model-core/src/index.ts";
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

const toolkit = "../packages/print-toolkit/src";
const { createNodeSlicerEngine } = await import(`${toolkit}/node-slicer.ts`);
const { loadBblPresets } = await import(`${toolkit}/bbl-presets.ts`);
const { bambuSliceConfig } = await import(`${toolkit}/bambu-slice-config.ts`);
const { packageBambuGcode3mf } = await import(`${toolkit}/bambu-3mf.ts`);
const { filamentUsePerSlot } = await import(`${toolkit}/bambu.ts`);
const { threeMfVolumes, volumeSlots } = await import(`${toolkit}/threemf-volumes.ts`);

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const [slug, file, out = join(ROOT, ".cache", `${slug}-${file}`.replace(/\.3mf$/, ".gcode.3mf"))] = process.argv.slice(2);
if (!slug || !file) {
  console.error("usage: node scripts/slice-bambu-plate.mjs <slug> <plate file> [out.gcode.3mf]");
  process.exit(1);
}

const forge = createForge({ root: ROOT });
const model = forge.manifest.models.find((m) => m.slug === slug);
if (!model) throw new Error(`No model "${slug}"`);
const view = buildViews(model).find((v) => v.previews.some((p) => p.file === file));
const plate = view?.previews.find((p) => p.file === file);
if (!plate) throw new Error(`${slug} has no preview "${file}"`);

const { bytes } = await forge.ensure({
  slug, target: targetOf(plate), format: plate.format,
  ...(Object.keys(view.params).length > 0 ? { params: view.params } : {}),
});

const merged = (preset) => {
  const json = {};
  for (const p of [...preset.parents].reverse()) Object.assign(json, p.raw);
  Object.assign(json, preset.raw);
  delete json.inherits;
  return json;
};
const bbl = await loadBblPresets();
const printerPreset = bbl.printers[0];
const filamentFor = (material) => {
  const family = materialFamily(material);
  const preset = bbl.filaments.find((f) => materialFamily(merged(f).filament_type?.[0] ?? "") === family);
  if (!preset) throw new Error(`No bundled ${family} filament preset`);
  return preset;
};

const slots = plateFilaments(model, plate);
const presets = slots.map((s) => filamentFor(s.material));
const colors = slots.map((s) => s.hexes[0] ?? "#808080");
const profile = recommendedProfile(model);
const process_ = {
  layer_height: "0.2",
  initial_layer_print_height: "0.2",
  wall_loops: String(profile.walls),
  sparse_infill_density: `${profile.infillDensity}%`,
  sparse_infill_pattern: profile.infillPattern,
  enable_support: profile.supports === "none" ? "0" : "1",
  brim_type: profile.brim ? "outer_only" : "no_brim",
  skirt_loops: "0",
  curr_bed_type: "Textured PEI Plate",
};

const volumes = threeMfVolumes(bytes);
if (!volumes) throw new Error(`${file} is not a readable 3MF`);
const engine = await createNodeSlicerEngine();
let gcode;
let stats;
try {
  const object = engine.add3MFObject(bytes, 128, 128, 0, 1, 1, 1);
  for (const [volume, slot] of Object.entries(volumeSlots(volumes, slots.map((s) => s.hexes)))) {
    engine.setVolumeExtruder(object, Number(volume), slot);
  }
  engine.setConfig({ ...bambuSliceConfig({ printer: merged(printerPreset), filaments: presets.map(merged), colors }), ...process_ });
  engine.slice();
  gcode = engine.exportGCode();
  stats = engine.getSliceStats();
} finally {
  engine.destroy();
}

const use = filamentUsePerSlot(gcode);
const archive = packageBambuGcode3mf({
  gcode,
  printerModelId: printerPreset.modelId,
  nozzleDiameter: 0.4,
  filaments: slots.map((s, i) => ({
    slot: i + 1,
    type: merged(presets[i]).filament_type?.[0] ?? materialFamily(s.material),
    color: colors[i],
    trayInfoIdx: merged(presets[i]).filament_id,
    usedGrams: use.grams[i],
    usedMeters: use.meters[i],
  })),
  predictionSec: stats?.printTime,
  weightGrams: stats?.totalWeight,
  title: `${model.title} — ${plate.label}`,
});
writeFileSync(out, archive);

const tools = new Set([...gcode.matchAll(/^T(\d+)\s*$/gm)].map((m) => Number(m[1])).filter((t) => t < 16));
const changes = (gcode.match(/^M620 S\d+A/gm) ?? []).length;
console.log(`${out}: ${archive.length} bytes`);
console.log(`filaments: ${slots.map((s, i) => `${i + 1}=${s.material} ${colors[i]}`).join(", ")}`);
console.log(`tools used: ${[...tools].sort().map((t) => `T${t}`).join(" ")}; AMS switches (M620): ${changes}`);
console.log(`X1 start G-code: ${gcode.includes(";===== machine: X1") ? "yes" : "NO"}; estimate ${stats?.printTimeStr ?? "?"}, ${stats?.totalWeight?.toFixed(2) ?? "?"} g`);
