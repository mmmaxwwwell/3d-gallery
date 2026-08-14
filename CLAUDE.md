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
  "filament": [                    // optional — hints in the sidebar
    { "material": "PLA", "color": "any", "note": "…" }
  ],
  "previews": [
    { "file": "assembled.3mf", "format": "3mf", "label": "…",
      "default": true, "module": "assembled",     // module = for WASM re-render
      "legend": [ { "color": "#000", "label": "…" } ],
      "components": [ { "part": "foo.stl", "qty": 2 } ]  // BOM for assemblies
    }
  ],
  "parts": [
    { "file": "cap.stl", "format": "stl", "label": "…", "module": "cap" }
  ],
  "hardware": [
    { "qty": 6, "label": "M3x6 SHCS",
      "source": { "url": "https://…", "vendor": "…" } }
  ]
}
```

- `format`: `"stl"` (single-color) or `"3mf"` (multicolor, top-level `color()` calls).
- `module`: the lib module name to render live in the WASM customizer. Only needed when `customizable: true`.
- `previews` = multicolor 3MFs, `parts` = single-color STLs. A part with just STL is fine; no preview is fine too.

## Adding a model — checklist

1. `mkdir -p models/<slug>/{lib,parts,previews}`
2. Author `lib/<slug>-lib.scad` — params (with `// BEGIN_PARAMS` block if customizable), then modules. **No top-level rendering.**
3. Add thin `parts/*.scad` and/or `previews/*.scad` files (the 3-line pattern).
4. Add an entry to `models/manifest.json`.
5. Write `models/<slug>/README.md` (human-facing) and `models/<slug>/CLAUDE.md` (agent-facing conventions).
6. If **customizable**: also wire it into `src/main.ts` — add `?raw` imports and an entry in `CUSTOMIZABLE_SOURCES` keyed by slug.
7. `npm run build:models` to render. `npm run dev` to preview locally.
8. If adding baseline tests: `npm run test:build:baseline` to seed checksums, then `npm run test:build` to verify.

## Multicolor 3MF — the regex gotcha

`build-multicolor-3mf.mjs` finds the color palette by **regex-scanning the raw `.scad` file** for `color("name")` / `color([r,g,b])` literals. Consequences:

- `color()` calls must appear **as text in the preview file itself**. Colors buried inside an `include`d library module are invisible to the regex.
- Wrap top-level parts in `color(...)` in `previews/*.scad`; don't hide them behind a helper module in the lib.
- The **WASM path** (customizer) uses CSG discovery, not regex, so module-level color works there — but the CLI build won't match. Keep both paths in mind: **top-level color() in the preview file** works for both.

## WASM customizer wiring (`src/main.ts`)

For a customizable model:

```ts
import myModelLib from "../models/<slug>/lib/<slug>-lib.scad?raw";
import myModelAssembled from "../models/<slug>/previews/assembled.scad?raw";

const CUSTOMIZABLE_SOURCES: Record<string, { lib: string; previews: Record<string, string> }> = {
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
npm run dev                       # vite @ localhost:5173 — auto-rebuilds .scad on save (see below)
npm run build                     # build:models + vite build
npm run test:build                # verify rendered artifacts against baseline fingerprints
npm run test:build:baseline       # re-capture fingerprints (only when a change is intentional)
npm run test:e2e                  # Playwright (fast subset)
npm run test:e2e:full             # includes @matrix
```

**Dev-server auto-rebuild.** `vite.config.ts` includes a `scadWatcherPlugin` that watches `models/**/*.scad` and, on save, calls `buildModel(model)` from `scripts/build-models.mjs` for the affected slug then triggers a full-reload. Debounced 200ms per-slug so a burst of saves collapses into one build. This is why the pipeline both writes to `models/<slug>/build/` and mirrors into `public/models/<slug>/` — the dev server serves from `public/`, not from `build/`. If you run raw `openscad` yourself, the public copy will be stale until `npm run build:models` (or a subsequent save) triggers the mirror.

**Shebang note.** `scripts/*.mjs` do NOT carry `#!/usr/bin/env node` shebangs — esbuild (which vite uses to load `vite.config.ts`) rejects shebangs in imported entry points. All scripts are invoked as `node scripts/…` per `package.json`.

- `OPENSCAD_CACHE=0` disables the build cache.
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

- **Base path** is `/3d-gallery/` in production. Local dev also serves under `/3d-gallery/`. Asset URLs go through Vite's base handling.
- **Filenames in manifest** map to `models/<slug>/build/<file>`; the source `.scad` is discovered by matching the base name against `parts/` then `previews/`.
- **Build test = semantic fingerprint, not exact checksum**: `tests/build/fingerprint.mjs` compares color palette (exact), bbox (±5e-3 mm), and triangle count (±25%). Different boolean engines re-triangulate the same volume differently, so hash-equality would false-positive. Baseline lives at `tests/build/baseline.json`; re-capture with `TEST_UPDATE_BASELINE=1`.
- **CI**: `.github/workflows/deploy.yml` builds via Nix; artifacts are baked into `dist/` and pushed to Pages. `e2e.yml` runs Playwright on PRs.
