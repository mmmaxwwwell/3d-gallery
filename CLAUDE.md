# 3d-gallery

GitHub Pages gallery of 3D-printable OpenSCAD models with an in-browser Three.js viewer. Some models are **customizable** — user tweaks parameters and the model re-renders live via OpenSCAD-WASM.

## Stack

- **Vite + Preact + TypeScript** front-end, deployed to GitHub Pages at base path `/3d-gallery/`.
- **Three.js** viewer (STL + 3MF, colorized per multi-color 3MF metadata).
- **OpenSCAD** (CLI) for pre-built artifacts. **OpenSCAD-WASM** (via `openscad-web-generator`) for the live customizer.
- **Nix flake** pins OpenSCAD, Node, BOSL2, qr.scad — `nix develop` gives you the exact toolchain CI uses.

## Repo layout

```
models/<slug>/            one directory per model
  lib/<slug>-lib.scad     ALL params + geometry modules. No top-level render.
  parts/*.scad            single-color STLs. 3 lines: include lib, $fn, module_call()
  previews/*.scad         multicolor 3MFs. include lib + top-level color() calls
  build/                  generated (.gitignored artifacts)
  README.md, CLAUDE.md    per-model docs (create both for new models)
models/manifest.json      source of truth for what appears in the sidebar
scripts/
  build-models.mjs        renders every part/preview per manifest
  build-multicolor-3mf.mjs multicolor 3MF pipeline (see gotcha below)
  openscad-args.mjs       shared CLI flags (Manifold backend)
  cache.mjs               on-disk build cache
src/
  main.ts                 app entry, sidebar, part loader, customizer host
  viewer.ts               Three.js viewer
  style.css               all styles
  lib/                    scad-parser, openscad-api, types
public/models/            build output copied here at build time (Vite-served)
tests/
  build/                  node --test, baseline STL/3MF checksums
  e2e/                    Playwright
.github/workflows/        deploy.yml, e2e.yml — both use Nix
vite.config.ts            `@owg` alias → ../openscad-web-generator/src
```

## Model convention (enforced)

Every model splits geometry the same way. **Follow it.** The build pipeline, the WASM customizer, and the multicolor 3MF builder all rely on this split.

- **`lib/<slug>-lib.scad`** — every shared parameter + every geometry module. No top-level render calls. Consumers `include <>` it (not `use`) so parameters land in their scope.
- **`parts/<name>.scad`** — a printable single-color STL. Intentionally three lines:
  ```scad
  include <../lib/<slug>-lib.scad>;
  $fn = 40;
  some_module();
  ```
- **`previews/<name>.scad`** — a multicolor 3MF preview. Wraps geometry in top-level `color(...)` calls. The builder scans these to split geometry per filament.

**Don't** put geometry in `parts/*.scad` or redefine lib parameters in consumers. Change values in the lib.

## Manifest schema (`models/manifest.json`)

The sidebar, download list, and build queue all come from here.

```jsonc
{
  "slug": "my-model",              // matches the models/<slug>/ directory
  "title": "…",
  "description": "…",
  "customizable": true,            // optional — enables the WASM customizer UI
  "default": true,                 // optional — opens when the app loads with no ?model=
  "devOnly": true,                 // optional — dev server only; never built or published
  "filament": [                    // optional — hints in the sidebar
    { "material": "PLA", "color": "any", "note": "…" },
    { "material": "TPU 64D", "color": "any", "parts": ["peg.stl"] }  // parts = files printed in it
  ],
  "printProfile": { "walls": 3 },  // optional — overrides fields of the default recommended profile
  "previews": [
    { "file": "plate-1.3mf", "format": "3mf", "label": "Print plate 1: …", "plate": true,  // a print plate
      "components": [ { "part": "foo.stl", "qty": 2 } ] },
  "previews": [
    { "file": "assembled.3mf", "format": "3mf", "label": "…",
      "default": true, "module": "assembled",     // module = for WASM re-render
      "legend": [ { "color": "#000", "label": "…", "part": "foo.stl",
                    "shades": ["#333"],                      // optional alternate shade(s) of color
                    "parts": ["foo.stl", "foo-end.stl"] } ],  // parts = every file drawn in this colour
      "components": [ { "part": "foo.stl", "qty": 2,     // BOM for assemblies
                        "instances": [ { "id": "F1", "where": "left end" }, { "id": "F2", "where": "right end" } ] } ]
    }
  ],
  "parts": [
    { "file": "cap.stl", "format": "stl", "label": "…", "module": "cap" }
  ],
  "hardware": [
    { "qty": 6, "label": "M3x6 SHCS — what it's for",
      "source": { "url": "https://…", "vendor": "…" },
      "usedBy": [ { "part": "foo.stl", "each": 3 } ] }  // per printed piece
  ],
  "builds": [                      // optional — instead of previews/parts/hardware above
    { "id": "4x", "label": "4×", "default": true, "params": { "lanes": 4 },
      "previews": [ … ], "parts": [ … ], "hardware": [ … ] }
  ]
}
```

- `format`: `"stl"` (single-color) or `"3mf"` (multicolor, top-level `color()` calls).
- `module`: the lib module name to render live in the WASM customizer. Only needed when `customizable: true`.
- `previews` = multicolor 3MFs, `parts` = single-color STLs. A part with just STL is fine; no preview is fine too.
- `default` (model level): what the gallery opens on when the URL carries no `?model=`. At most one model may set it; without one the first model wins. The `default` on a part/preview picks which of *that* model's entries opens.
- **Main assembly** = the default preview with `components` (else the first with any). A view without its own BOM — a reference render, a single part — shows the main assembly's in the parts list, not one of everything.
- `instances` names each physical piece (`qty` of them). Only the main assembly must give `where`; a plate can list just `{ "id": "W2" }` and borrows the rest by id.
- **Pointing at one piece.** Hovering an id (B1) in the parts list lifts that one piece in the viewer, its siblings glow faintly, and the leader runs to it; hovering the piece lights its id. The viewer can only do this when the preview says where each piece is: the lib computes `[[id, [x, y, z]], …]` (a point near the middle of each piece, in the preview's frame) and the preview echoes it at top level — `echo(gallery_instances = stand_instances());`. Every builder (CLI, node WASM, browser worker) lifts that echo off stderr into the 3MF as `Metadata/gallery_instances.json` (`model-core/src/instances.ts`). The viewer splits each colour into its separate solids and gives each anchor the solid whose bounds hold it. A part lights piece by piece only if one key entry draws it (in any of that entry's shades) and *every* one of its pieces resolved; pieces fused into one solid stay lit by colour. Without the echo nothing changes.
- `shades`: alternate `#rrggbb` shades of an entry's `color`, for an assembly whose copies of a part alternate shade piece to piece so they read as "different but the same". The key and parts list show the entry as one row with a swatch per shade, and every shade hovers and highlights as that entry. Each shade needs its own top-level `color()` call in the preview — split the lib's placement module by piece parity (see filament-spool-roller's `stand_*(parity)`). Adjacent copies in different shades land in different colour passes, which is also what keeps touching pieces (dovetailed tiles) from fusing into one solid. A `color()` whose subtree draws nothing fails the whole 3MF build, so guard a shade that can come out empty (`if (lanes > 1) color(…) …`).
- `usedBy` attributes hardware to printed parts: `each` × that part's main-assembly count. Validation rejects an attribution that exceeds `qty`; any remainder shows as "not tied to a printed part". The parts list's Hardware tabs (Total / By part) only appear once some item has `usedBy`. The text before " — " in a hardware label is its short name in the By-part view.
- On desktop the docked parts list replaces the floating key: printed rows carry the key's swatches (matched through `legend[].part`/`parts`), and key rows that name no part land under "For reference — not printed", with a Solid / See-through / Hidden switch for how the viewer draws them (`setColorDisplay`; ghosted and hidden meshes don't take the pointer).
- `builds`: for a generator lib built more than one way (a lane count, a size) where each configuration has a different set of pieces. A build is `params` plus its own `previews`, `parts` and `hardware`, each checked like a model's own. A model with `builds` has no top-level entries. The gallery shows a switch beside the title and routes `?build=<id>`. Every entry of a build renders at the build's `params`: the forge prebuilds it at those, the customizer opens on them, and named outputs land in `build/<id>/<file>` and `models/<slug>/<id>/<file>`. Builds may share a file (the same `.scad` at other params), but a shared name must mean the same `file` and `module` in each. The browser finds an artifact by slug and file base name, and only the params tell two builds' copies apart. Runtime `defaultKey` stays at lib defaults, so address a build's entries with its params. Print-time estimates don't cover builds yet. For a single part's baked-in parameter sets, use part-level `variants` instead.
- `printProfile`: how the model is meant to print. Every model has one — model-core's `DEFAULT_PRINT_PROFILE` (4 walls, 15% gyroid, no supports, no brim, PETG) with this object's fields over it. `supportsOnBuildPlateOnly: true` keeps supports from starting on the part (Orca's "On build plate only"; the print dialog shows it under Supports). `material` is what a piece prints in when no `filament` entry names it; without it, a `filament` entry with no `parts` decides. The CI estimator slices every artifact at its model's profile, the parts list shows it, and plates made from the model carry it into the print dialog and the planner.
- `plate: true` (on a preview): one bed's worth of pieces, laid out in print orientation for a 220 mm bed. A view's plates are what the parts list's **+ Add to project / + New project** turns into a project (one print plate per manifest plate, the 3MF as its single item), and the estimator slices them. A plate's `components` must all be one material family — a single-extruder printer can't swap mid-plate — and validation rejects a plate that mixes them. The planner that schedules and sends a project is described in `docs/print-planner.md`.
- `devOnly`: a work-in-progress model. `scripts/build-models.mjs` builds a forge with `includeDevOnly: false`, so the model is never rendered, never mirrored into `public/`, and never named in the published `manifest.json` — which in turn keeps it out of the fingerprint baseline and the e2e suites (both filter it out). The dev server's forge keeps it, so `npm run dev` shows it, tagged DEV in the sidebar. Outside dev, a manifest that names any dev-only model gets a near-invisible "+ dev" toggle at the foot of the list (remembered in `localStorage`); a `?model=` link to one reveals them for that visit. Flip the flag to ship it.

## Adding a model — checklist

1. `mkdir -p models/<slug>/{lib,parts,previews}`
2. Author `lib/<slug>-lib.scad` — params (with `// BEGIN_PARAMS` block if customizable), then modules. **No top-level rendering.**
3. Add thin `parts/*.scad` and/or `previews/*.scad` files (the 3-line pattern).
4. Add an entry to `models/manifest.json`.
5. Write `models/<slug>/README.md` (human-facing) and `models/<slug>/CLAUDE.md` (agent-facing conventions).
6. If **customizable**: also wire it into `packages/gallery-app/src/customizable-sources.ts` — add `?raw` imports and an entry in `CUSTOMIZABLE_SOURCES` keyed by slug.
7. `npm run build:models` to render. `npm run dev` to preview locally.
8. If adding baseline tests: `npm run test:build:baseline` to seed checksums, then `npm run test:build` to verify.

## Multicolor 3MF — the regex gotcha

`build-multicolor-3mf.mjs` finds the color palette by **regex-scanning the raw `.scad` file** for `color("name")` / `color([r,g,b])` literals. Consequences:

- `color()` calls must appear **as text in the preview file itself**. Colors buried inside an `include`d library module are invisible to the regex.
- Wrap top-level parts in `color(...)` in `previews/*.scad`; don't hide them behind a helper module in the lib.
- The **WASM path** (customizer) uses CSG discovery, not regex, so module-level color works there — but the CLI build won't match. Keep both paths in mind: **top-level color() in the preview file** works for both.

## WASM customizer wiring (`src/customizable-sources.ts`)

For a customizable model:

```ts
import myModelLib from "../models/<slug>/lib/<slug>-lib.scad?raw";
import myModelAssembled from "../models/<slug>/previews/assembled.scad?raw";

export const CUSTOMIZABLE_SOURCES: Record<string, { lib: string; previews: Record<string, string> }> = {
  "<slug>": {
    lib: myModelLib,
    previews: {
      assembled: stripIncludes(myModelAssembled),  // strip include<> — lib is concatenated in
    },
  },
};
```

- The customizer parses `// BEGIN_PARAMS` … `// END_PARAMS` in the lib to build the form. Comment lines above each param become help text; `// [a, b, c]` becomes an enum.
- For a **part**: WASM concatenates lib + `$fn=40; moduleName();` and renders as STL.
- For a **preview**: WASM concatenates lib + stripped preview source and renders multicolor 3MF.
- BOSL2 and qr.scad are pre-loaded in the WASM virtual filesystem.
- Results cached in `localStorage` under `3dg:${slug}:${hash}`, where `hash` is `SHA-256(scadSource + "\0" + moduleName + "\0" + JSON.stringify(sortedValues))` (keys sorted, null-byte separators). See `computeCacheKey` in `src/main.ts`.

## `include` vs `use`

Use `include <...>` in every consumer (parts, previews) — the customizer + build pipeline both need the lib's top-level params visible in the consumer's scope. `use` hides them.

## Build / dev commands

```bash
nix develop                       # openscad, node, BOSL2, qr.scad
npm install
npm run build:models              # render all .scad → STL/3MF under models/*/build/, mirror to public/
npm run estimate:prints           # slice printable artifacts → public/models/print-estimates.json
npm run dev                       # vite @ localhost:5173 — renders models on demand (see below)
npm run build                     # build:models + vite build
npm run test:build                # verify rendered artifacts against baseline fingerprints
npm run test:build:baseline       # re-capture fingerprints (only when a change is intentional)
npm run test:e2e                  # Playwright (fast subset)
npm run test:e2e:full             # includes @matrix
```

**Dev-server generation is lazy.** `vite.config.ts`'s `galleryModelsPlugin` serves `models/<slug>/<file>` straight out of the artifact forge, rendering on a cache miss. Saving a `.scad` no longer rebuilds every part of the model — it changes the source digest, and only the part you actually request gets re-rendered. The URL shape is unchanged, so the app needed no changes to benefit.

**A `.scad` save doesn't reload the page.** The plugin sends a `scad-rebuilt` event instead of a full reload. The client refetches the runtime manifest (the digests moved, so the old artifact keys are stale) and swaps the new render into the viewer with the camera where it was. The `?raw` sources live in `customizable-sources.ts`, a module `main.ts` accepts over HMR — keep them out of `main.ts`, or every edit to a customizable model falls back to a full reload. Full reloads that do still happen (manifest or TS edits) stash the camera in `sessionStorage` and restore it on the same part.

The plugin is `enforce: 'pre'`; registered any later, Vite's static handler answers first with a stale `public/models/` copy. It also accepts both base-prefixed and base-stripped URLs, because whether Vite has stripped `/3d-gallery/` by that point depends on where in the middleware stack it runs.

**`models/manifest.json` hot-reloads too.** The forge parses the manifest once at construction, so the plugin watches the file and rebuilds the forge (and everything derived from it — the middlewares and the part index) on change, then sends a full page reload. The registered middlewares delegate through one mutable binding, which is what lets a reload take effect without re-registering them. A half-written or invalid manifest is logged and ignored; the last good one keeps serving. No dev-server restart needed for a manifest edit.

**Shebang note.** `scripts/*.mjs` do NOT carry `#!/usr/bin/env node` shebangs — esbuild (which vite uses to load `vite.config.ts`) rejects shebangs in imported entry points. All scripts are invoked as `node scripts/…` per `package.json`.

- `npm run build:models` renders via `@3d-gallery/model-forge` and then writes the named outputs (`models/<slug>/build/` + `public/models/<slug>/`) the viewer, the PWA precache, and `tests/build/` all expect.
- `npm run estimate:prints` slices every STL and every print plate (`plate: true`) — plus the 3MFs of a model with no STL parts, whose 3MF *is* the print — with the OrcaSlicer WASM in Node (`@3d-gallery/print-toolkit/node`) at 3 / 8 / 12 / 18 mm³/s (TPU / – / PETG / PLA), on an Adventurer 5M profile at the model's recommended profile (`printProfile`); $10/kg. Each estimate records the profile it was sliced at, and splits its grams into support and purge (prime tower) by tallying the G-code's `;TYPE:` features. The gallery's Print time leads with a row that times each piece at its own material's rate and weighs it at that material's density: a `filament` entry with `parts` covers those files, the entry without `parts` covers the rest, and a model that names no filament (or one with no rate, like ASA) is assumed PETG (`defaultMaterial` in the estimator). Material families match on the first word, so "TPU 64D" runs at the TPU rate. Assembly 3MFs are never sliced. Output is keyed by artifact key, so the parts list's "Print time" only matches the exact default render (and hides once customized). Cached in `.cache/print-estimates/`; a cold run takes a while (big parts slice for minutes). A part that won't slice gets a CI warning, not a failure. A local run includes `devOnly` models (so the dev server shows them); CI and `npm run build` pass `--published` to leave them out. Estimates are a snapshot: after a `.scad` edit the part's key moves and its print time disappears until you re-run. Needs the slicer WASM: `npm run fetch-wasm -w @3d-gallery/print-toolkit`.
- `OPENSCAD_BACKEND=CGAL` swaps out Manifold (default) for the older CGAL boolean engine — mostly a smoke-test escape hatch.

## External deps in the SCAD path

- **BOSL2** (`include <BOSL2/std.scad>;`) — pinned by the Nix flake, injected into WASM FS by `openscad-worker.ts` (in `openscad-web-generator`).
- **qr.scad** — same treatment. Available in both CLI and WASM.

If you add a new SCAD dependency, it must land in **both** places or the CLI/WASM outputs will diverge.

## Editing rules (for agents)

- Don't add features, options, or params the task didn't ask for. Follow `~/CLAUDE.md` → eng-standards.
- Don't write explanatory comments describing *what* the code does — only *why*, and only when non-obvious.
- Don't duplicate constants across lib + consumers. The lib owns them.
- Don't change the split-plane / assembly convention for an existing model without updating every consumer.
- Don't relocate files that the build pipeline discovers by convention (`lib/`, `parts/`, `previews/`, filenames in the manifest).
- Prefer editing the lib over adding branching in consumers.

## Notable quirks

- **The customizer's OpenSCAD-WASM has no Manifold** — it renders with CGAL, while the CLI build uses Manifold. Geometry that Manifold takes in stride can crash CGAL ("internal error (C++ exception)", `polygon_mesh_to_nef_3`). BOSL2's `offset_sweep()` with a negative `os_circle` is one: the captive cases build that flare from hulled slices (`flared_edge()`) instead. After a lib change, try **Force regenerate** in the customizer — it skips the cache and the dev server and renders in the browser.
- **Base path** is `/3d-gallery/` in production. Local dev also serves under `/3d-gallery/`. Asset URLs go through Vite's base handling.
- **Filenames in manifest** map to `models/<slug>/build/<file>`; the source `.scad` is discovered by matching the base name against `parts/` then `previews/`.
- **Build test = semantic fingerprint, not exact checksum**: `tests/build/fingerprint.mjs` compares color palette (exact), bbox (±5e-3 mm), and triangle count (±25%). Different boolean engines re-triangulate the same volume differently, so hash-equality would false-positive. Baseline lives at `tests/build/baseline.json`; re-capture with `TEST_UPDATE_BASELINE=1`.
- **CI**: `.github/workflows/deploy.yml` builds via Nix; artifacts are baked into `packages/gallery-app/dist/` and pushed to Pages. `e2e.yml` runs Playwright on PRs.

## Workspaces

The repo is an npm workspace (`workspaces: ["packages/*"]` in root `package.json`). The historical single-project layout has been split; per-package details override anything above that reads as "at the repo root".

- **`packages/gallery-app/`** — the Vite + Preact + Three.js UI. Owns `index.html`, `vite.config.ts`, `playwright.config.ts`, `src/`, `tests/e2e/`. `vite.config.ts` still aliases `react → preact/compat` (and `react-dom`, `react/jsx-runtime`) — the print UI is Preact, not React. The runtime manifest (authored manifest + source digests + artifact keys) is served in dev by `galleryModelsPlugin`, reading from repo-root `models/`. Base path stays `/3d-gallery/`.
- **`packages/print-toolkit/`** — framework-free slicer + Moonraker + Orca importer. **Never import React, Preact, or DOM globals beyond `window.*` feature-detects** here. Consumers wire their own UI. WASM assets ship out-of-band via `npm run fetch-wasm -w @3d-gallery/print-toolkit`.
  - **`src/orca-schema.generated.ts` is generated** from an OrcaSlicer source tree (`npm run gen:orca-schema -w @3d-gallery/print-toolkit -- <orca-src>`); never hand-edit it. It types every printer/filament key and carries Orca's tab layout. See the package README.
  - **Stored presets are never edited in place.** A `PrintPreset` keeps the imported file as `raw` and its chain as `parents`; the gallery's preset editor (`gallery-app/src/print/PresetEditor.tsx`, model in `preset-edit.ts`) writes only `overrides`, which `mergeInheritance` layers last. Anything that saves a preset must spread the existing record (`{ ...preset, … }`) or it drops the user's edits; re-imports go through `importPreset`, which keeps them.
- **`packages/model-core/`** — isomorphic, zero-dep. Manifest schema + validation, SCAD param parsing, parameter canonicalization, content-addressed artifact keys. Imported by both the browser and Node, so **never** import a Node builtin or a DOM global here (`tests/isomorphic.test.ts` enforces it).
- **`packages/model-forge/`** — Node only. Source resolution, render engines, the content-addressed artifact store, `ensure`/`prerender`, dev middleware. Never import from a browser bundle. Ships two engines: native `openscad`, and OpenSCAD-WASM in Node for machines without it (`npm run fetch-wasm -w @3d-gallery/model-forge`, ~24 MB, gitignored). `auto` prefers native. Their geometry must stay equivalent — `tests/engine-parity.test.ts` enforces it, and that is what licenses leaving the engine out of the artifact key.
- **`packages/viewer/`** — browser only. Three.js viewer, the artifact cache client, and the OpenSCAD-WASM fallback renderer.
- **`packages/orca-bridge/`** — Node only. Reads a local OrcaSlicer install: presets with resolved inheritance, `OrcaSlicer.conf` history, and sliced 3MF projects. Serves an MCP HTTP server plus a small REST store on the dev server (`/3d-gallery/__mcp`, `/3d-gallery/__devstore`, wired by `orcaMcpPlugin` in gallery-app's `vite.config.ts`, `apply: 'serve'`), and a CLI — all three over the same `queries.ts`. No auth: single user, dev server only; the per-user seam for a hosted model is the `OrcaPaths` / `repoRoot` pair every query already takes.
  - Vite doesn't hot-reload this package inside the running dev server: after editing it, restart `npm run dev` before exercising `__mcp` / `__devstore`.
  - **The Orca config is read-only and must stay that way.** A job is reconstructed by *matching* against Orca's data, never by editing it — `orca_*` tools are all `readOnlyHint: true`, enforced by a test.
  - **The gallery's own store is writable** (`.cache/orca-bridge/gallery-presets.json`, via `gallery_*` tools). That is the only write path, and it exists because MCP runs in Node while the gallery's presets live in browser IndexedDB.
  - **The gallery is local-first.** IndexedDB is the real store; the server store is opt-in, so a hosted deployment costs nothing to run without one. `server-store.ts` in gallery-app probes `__devstore` and hides its UI unless a real JSON response comes back — a 200 from the SPA fallback is HTML, not a store.
  - See its README for why 3MF import is reconciliation rather than import, and why the Orca logs are useless for change detection.
- **`packages/astro/`** — Astro integration + `<ModelViewer>`. Consumed by an external Astro site; must not become a dependency of `gallery-app`.
- **`packages/android-shell/`** — planned WebView host. Not seeded.

### Artifact addressing

Every rendered artifact is addressed by `sha256(schema \0 slug \0 target \0 format \0 sourceDigest \0 canonicalParams)` and stored in `.cache/forge/`. Consequences worth knowing before touching any of it:

- **Editing a `.scad` needs no invalidation.** The digest changes, so the next request carries a key the store has never seen. The old artifact goes cold.
- **The engine is NOT in the key** — it lives in a sidecar next to the bytes. That's what lets a build-time artifact satisfy a request on another machine. Don't "fix" this by hashing `openscad --version`.
- **Parameters equal to the lib default are dropped before hashing**, so an untouched customizer addresses the same artifact as the pre-built default.
- **`model-core` must produce identical keys in Node and the browser.** It ships a pure-JS SHA-256 for insecure contexts (plain HTTP on a LAN) precisely because a *different* fallback hash would silently give those clients their own private cache. `tests/key-vectors.json` pins the agreement.
- Imports in the new packages carry explicit `.ts` extensions so bare `node` runs them via type stripping — no build step. Consumers need `allowImportingTsExtensions`.

See `docs/module-architecture.md` for the full design.

Root scripts split by concern:

- **Stay at root** (still run from the repo root, unchanged): `build:models`, `build:model`, `test:build`, `test:build:baseline`, `preflight`. The scripts they invoke live in `scripts/` at the repo root and operate on `models/` and `tests/build/`.
- **Delegate to gallery-app** via `-w @3d-gallery/gallery-app`: `dev`, `build`, `preview`, `test:e2e`, `test:e2e:full`, `test:e2e:ui`. Root `build` still runs `build:models` first, then delegates.

CI + hooks:

- `.github/workflows/deploy.yml` runs `npm run build:models`, `npm run test:build`, `npm run build -w @3d-gallery/gallery-app`, then uploads `packages/gallery-app/dist/` to Pages.
- `.github/workflows/e2e.yml` runs `npm run test:e2e` at root; Playwright artifacts land under `packages/gallery-app/{playwright-report,test-results}/`.
- `.githooks/pre-push` runs `npm run preflight`, which now builds via the gallery-app workspace instead of a bare `npx vite build`.
