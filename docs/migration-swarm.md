# Print-toolkit migration — swarm brief

Self-contained brief for the agent swarm that ports the slice-and-print stack out of `../openscad-web-generator/` (OWG) into this workspace, moves the gallery UI into a workspace package, and seeds an Android shell.

The workspace bootstrap (T1) is already committed. Every other task below is unstarted at the time of writing.

## How to launch the swarm

Each `## T#` section below is a self-contained task brief. Hand a single task to a single agent. The **Shared context** section above the tasks is prepended to every agent's prompt.

Dependency graph:

```
T1 (done)
├── T2 ─┬─ T4 ─┐
│       ├─ T5  │
│       └─ T6  │
├── T3 ────────┤
│              │
└── T7 ────────┘
        │
        T8
        │
        T9
        │
        T10
```

Parallel-safe pairings: (T2, T3), (T4, T5, T6), (T7, T8).

---

# SHARED CONTEXT (read this before your task)

## Mission
Extract the slice-and-print stack from `/home/max/git/openscad-web-generator/` (OWG) into a new reusable package `packages/print-toolkit/` inside `/home/max/git/3d-gallery/`, then rewire `3d-gallery`'s app into `packages/gallery-app/`, wire the print UI, and seed an Android shell in `packages/android-shell/`. OWG stays intact on disk — do not delete it.

## Target repo layout after migration
```
3d-gallery/                          (workspace root)
├── package.json                     workspaces: ["packages/*"]  (already done)
├── flake.nix
├── models/                          (unchanged, top-level)
├── scripts/build-models.mjs         (unchanged, top-level; called by gallery-app builds)
├── tests/build/                     (unchanged)
├── packages/
│   ├── print-toolkit/               framework-agnostic slicer + moonraker + orca importer
│   │   ├── package.json             (already scaffolded)
│   │   ├── tsconfig.json            (already scaffolded)
│   │   ├── src/
│   │   │   ├── index.ts             barrel export
│   │   │   ├── slicer-engine.ts     WASM slicer engine
│   │   │   ├── slicer-backend.ts    picks native if window.NativeSlicer else WASM
│   │   │   ├── native-slicer-backend.ts   Android JNI bridge
│   │   │   ├── slicer-worker.ts     Web Worker entry
│   │   │   ├── plate-slicer.ts      multi-object build plate
│   │   │   ├── orca-slicer-settings.ts    config dict builder
│   │   │   ├── slicer-settings.ts   Klipper G-code conversion + types
│   │   │   ├── moonraker-api.ts     Klipper HTTP client
│   │   │   ├── merge-3mf.ts         3MF merging helpers
│   │   │   ├── gcode-parser.ts
│   │   │   ├── storage.ts           StorageAdapter interface + factory
│   │   │   ├── storage-browser.ts   IndexedDB implementation
│   │   │   ├── types.ts             hoisted shared types (see T2)
│   │   │   ├── android-shim-types.ts   declares window.NativeSlicer etc.
│   │   │   └── vite-plugin.ts       copyPrintToolkitAssets() Vite plugin
│   │   ├── scripts/fetch-wasm.mjs   downloads libslic3r.wasm from GitHub Releases
│   │   ├── assets/                  gitignored, populated by fetch-wasm.mjs
│   │   ├── tests/                   vitest unit + integration
│   │   └── README.md                (already exists)
│   ├── gallery-app/                 the 3d-gallery web UI
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts           moved from repo root, paths adjusted
│   │   ├── index.html               moved
│   │   ├── public/                  moved
│   │   ├── src/                     moved; adds src/print/ with new Preact UI
│   │   │   ├── main.ts
│   │   │   ├── viewer.ts
│   │   │   ├── style.css
│   │   │   ├── lib/                 keep openscad-* files here for now
│   │   │   └── print/               NEW — PrintButton, PrintDialog, SettingsPanel
│   │   └── tests/e2e/               moved
│   └── android-shell/               thin WebView host, seeded from OWG's android/
│       ├── build.gradle.kts
│       ├── app/
│       └── native/
```

## The three critical architectural rules

1. **`print-toolkit` is framework-free.** No React, no Preact, no DOM globals beyond `window` feature-detects. It exports functions and classes. Consumers wire their own UI. If you find yourself importing React/hooks, hoist the pure logic and let the consumer wrap it.

2. **The Android shim contract lives in `print-toolkit`.** Android integrates by injecting these optional globals; the toolkit feature-detects them:
   - `window.NativeSlicer` — native OrcaSlicer via JNI (skips WASM)
   - `window.AndroidPrinterDiscovery` — mDNS/NSD LAN scan
   - `window.AndroidFileBridge` — Storage Access Framework file picker

   These are all optional. Every toolkit function that could benefit checks with `if (window.X)` then falls back. TypeScript declarations for these globals live in `src/android-shim-types.ts` — this file is the durable contract between the WebView (`gallery-app`) and the shell (`android-shell`).

3. **`gallery-app` uses Preact.** The existing `vite.config.ts` aliases `react → preact/compat`, `react-dom → preact/compat`, `react/jsx-runtime → preact/jsx-runtime`. Preserve this. The new print UI is Preact, not React.

## Source of truth for the migration
Every file that moves has a source path in OWG. Never re-derive logic — copy the file, adjust imports, hoist types. OWG lib source root: `/home/max/git/openscad-web-generator/src/`. OWG stays on disk; you're copying, not moving.

**Files to migrate (source → destination):**

| OWG source                                         | Destination                                            |
| -------------------------------------------------- | ------------------------------------------------------ |
| `src/lib/slicer-engine.ts`                         | `packages/print-toolkit/src/slicer-engine.ts`          |
| `src/lib/slicer-backend.ts`                        | `packages/print-toolkit/src/slicer-backend.ts`         |
| `src/lib/native-slicer-backend.ts`                 | `packages/print-toolkit/src/native-slicer-backend.ts`  |
| `src/workers/slicer-worker.ts`                     | `packages/print-toolkit/src/slicer-worker.ts`          |
| `src/lib/plate-slicer.ts`                          | `packages/print-toolkit/src/plate-slicer.ts`           |
| `src/lib/orca-slicer-settings.ts`                  | `packages/print-toolkit/src/orca-slicer-settings.ts`   |
| `src/lib/slicer-settings.ts`                       | `packages/print-toolkit/src/slicer-settings.ts`        |
| `src/lib/moonraker-api.ts`                         | `packages/print-toolkit/src/moonraker-api.ts`          |
| `src/lib/merge-3mf.ts`                             | `packages/print-toolkit/src/merge-3mf.ts`              |
| `src/lib/gcode-parser.ts`                          | `packages/print-toolkit/src/gcode-parser.ts`           |
| `src/lib/storage.ts` + `src/lib/storage-browser.ts`| `packages/print-toolkit/src/{storage,storage-browser}.ts` |
| `src/lib/__tests__/*.test.ts` (relevant subset)    | `packages/print-toolkit/tests/*.test.ts`               |
| `scripts/download-slicer-wasm.mjs`                 | `packages/print-toolkit/scripts/fetch-wasm.mjs`        |
| `android/**`                                       | `packages/android-shell/`                              |

**Do NOT migrate:**
- `src/lib/openscad-*.ts`, `src/lib/scad-parser.ts` — OWG has these but gallery-app already has its own copies at `src/lib/`
- `src/components/*.tsx` — these are React UI; gallery-app builds its own Preact UI
- `src/hooks/*` — extract types from these into `types.ts`, then discard

## Known cross-layer imports to fix
- `orca-slicer-settings.ts:16` imports `ResolvedFilamentSettings` from `hooks/usePrinterFilamentOverrides` (a React hook). This is a **type-only** import — hoist the type into `packages/print-toolkit/src/types.ts` and update the import.
- `plate-slicer.ts:17` same issue, same fix.
- `slicer-backend.ts` and `native-slicer-backend.ts` import `../hooks/useSlicer` — that's a React hook and should not be pulled into the toolkit. Refactor those two files to be framework-free (they already are functionally, the hook import is dead weight or provides a type — hoist the type).

## Verification standards
- Every task ends with: `npm install` succeeds at root; `nix develop -c bash -c "cd packages/print-toolkit && npx tsc --noEmit"` succeeds (once the toolkit has TS content); existing `gallery-app` build still passes if the task touched app code.
- No commented-out code left behind. Deletions are complete.
- No `console.log` added.
- Commit messages describe *why*, not *what*.
- Do not add new dependencies unless the migrated code requires them. `fflate` and `idb` are already declared in `packages/print-toolkit/package.json`.

## Non-goals for this migration
- Do NOT redesign the API surface — copy OWG's public functions verbatim and simplify by removing framework glue only.
- Do NOT rewrite the print UI to be "better." The goal is parity with what OWG can do, from a Preact host, in a curated per-model flow.
- Do NOT migrate OpenSCAD-WASM code. That's a future workstream.
- Do NOT publish the toolkit to npm. It stays private in the workspace.
- Do NOT modify `models/`, `scripts/build-models.mjs`, `tests/build/`, or the SCAD build pipeline.
- Do NOT delete or modify `/home/max/git/openscad-web-generator/`. It stays intact.

---

# TASKS

## T1: Workspace bootstrap
STATUS: DONE.

## T2: Migrate headless toolkit sources — depends on: T1
**Goal:** Copy every file in the migration table under "print-toolkit" from OWG into `packages/print-toolkit/src/`. Adjust imports; hoist shared types; make all files framework-free.

**Steps:**
1. Copy each OWG source file to its destination path from the migration table.
2. Create `packages/print-toolkit/src/types.ts`. In it, define **exported** versions of these types by extracting them from OWG's `src/hooks/usePrinterFilamentOverrides.ts` and `src/types/index.ts`: `PrintProfile`, `PrinterSettings`, `PrinterConfig`, `FilamentSettings`, `ResolvedFilamentSettings`, `PrinterFilamentOverride`, `BuildPlate`, `BuildPlateObject`, `StorageAdapter` (move interface here from `storage.ts` or re-export).
3. In every moved file, replace imports like `import { X } from '../hooks/usePrinterFilamentOverrides'` and `import { X } from '../types'` with `import { X } from './types.js'`. All internal imports use `.js` extensions (bundler moduleResolution).
4. In `slicer-backend.ts` and `native-slicer-backend.ts`, remove the `../hooks/useSlicer` import. If it provided only types, hoist them into `types.ts` and import from there. If it provided runtime, refactor so the backend exposes a plain class/function and the consumer wraps it in their own hook.
5. Create `packages/print-toolkit/src/android-shim-types.ts` declaring `window.NativeSlicer`, `window.AndroidPrinterDiscovery`, `window.AndroidFileBridge` per the "critical rules" section above. All three optional. Export `{}` at the bottom to make it a module.
6. Rewrite `packages/print-toolkit/src/index.ts` as a barrel exporting the public API listed in `packages/print-toolkit/README.md`. Only export what a consumer would call. Anything internal (e.g. `slicer-worker.ts`, though it's referenced as a URL) doesn't need to be in the barrel.
7. Sanity: `cd packages/print-toolkit && npx tsc --noEmit` passes with zero errors.

**Verify:**
- `nix develop -c bash -c "cd packages/print-toolkit && npx tsc --noEmit"` → exits 0.
- `git grep -F "from '../hooks" packages/print-toolkit/` returns empty.
- `git grep -F "react" packages/print-toolkit/src/` returns empty.
- `packages/print-toolkit/src/index.ts` exports at minimum: `createSlicerEngine`, `createSlicerBackend`, `buildOrcaConfig`, `buildPlateSliceConfig`, `fetchPrinterConfig`, `uploadGcode`, `startPrint`, `buildMoonrakerUrl`, `BrowserStorageAdapter`, plus all types listed in the README.

**Commit as:** `print-toolkit: migrate headless sources from openscad-web-generator`

## T3: Move gallery-app into packages/gallery-app — depends on: T1 (parallel with T2)
**Goal:** Relocate the current 3d-gallery web app from repo root into `packages/gallery-app/`. Do NOT touch the toolkit. Do NOT change any application code semantics.

**Steps:**
1. `mkdir -p packages/gallery-app`
2. `git mv` the following from repo root into `packages/gallery-app/`: `src/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig.json`, `playwright.config.ts` (if it exists), `tests/e2e/` (if it exists — check first). **Do NOT move** `models/`, `scripts/`, `tests/build/`, `flake.nix`, `flake.lock`, `.githooks/`, `.github/`, `CLAUDE.md`, `README.md`.
3. Create `packages/gallery-app/package.json`. Move `preact`, `three`, `fflate` deps here. Move Playwright + `@types/three` + `vite-plugin-pwa` + `workbox-window` devDeps here. Root retains only shared dev tooling (`typescript`, `@types/node`, `@playwright/test` can stay at root or move — you decide).
4. In `packages/gallery-app/vite.config.ts`: fix all relative paths. Two known adjustments:
   - `import { buildModel, loadManifest } from './scripts/build-models.mjs'` → `import { buildModel, loadManifest } from '../../scripts/build-models.mjs'`
   - `resolve(__dirname, 'models', 'manifest.json')` → `resolve(__dirname, '..', '..', 'models', 'manifest.json')`
   - `resolve(__dirname, 'models')` → `resolve(__dirname, '..', '..', 'models')`

   Preserve the `react → preact/compat` aliases. Preserve base path `/3d-gallery/`.
5. In `packages/gallery-app/tsconfig.json`: remove the leftover `@owg/*` path mapping. Ensure `paths` and `include` reflect the new location.
6. Move scripts from root `package.json` into `packages/gallery-app/package.json`: `dev`, `build`, `preview`, `test:e2e`, `test:e2e:full`, `test:e2e:ui`. Root `package.json` gets thin wrappers: `"dev": "npm run dev -w @3d-gallery/gallery-app"`, `"build": "npm run build:models && npm run build -w @3d-gallery/gallery-app"`, same pattern for others. Keep `build:models` and `test:build` and `preflight` at root.
7. Any hardcoded string like `import.meta.env.BASE_URL` should still work. `models/manifest.json` is served the same way (via the Vite middleware in the moved config).

**Verify:**
- `nix develop -c npm install` → succeeds.
- `nix develop -c npm run build` at root → succeeds (delegates to gallery-app).
- `nix develop -c npm run dev -w @3d-gallery/gallery-app` → serves at :5173 without errors (kill the process after confirming startup).
- `nix develop -c npm run build:models` at root still works (unchanged path).

**Commit as:** `gallery-app: move web app into packages/gallery-app workspace`

## T4: WASM asset pipeline — depends on: T2
**Goal:** `fetch-wasm.mjs` downloads `libslic3r.wasm` + JS glue on demand; a Vite plugin copies those assets into consumer build output.

**Steps:**
1. Copy `openscad-web-generator/scripts/download-slicer-wasm.mjs` → `packages/print-toolkit/scripts/fetch-wasm.mjs`. Update the `WASM_DIR` constant to point to `packages/print-toolkit/assets/` (relative to the script). Update log messages to reference `@3d-gallery/print-toolkit`.
2. Write `packages/print-toolkit/src/vite-plugin.ts` exporting a function `copyPrintToolkitAssets(options?: { dest?: string })` that returns a Vite `Plugin`. Behavior:
   - Resolves the `assets/` dir inside the toolkit package (use `import.meta.resolve` or `require.resolve` on the package name — pick whichever works with the workspace symlink).
   - On `buildStart`, emits each file from `assets/*.js`, `assets/*.wasm` to `${outDir}/${options.dest ?? 'wasm'}/${filename}` via `emitFile({ type: 'asset', ... })`.
   - On `configureServer`, adds middleware that serves `assets/*` at `${dest}/*` in dev, so the WASM works with `vite dev` too.
   - Errors clearly if `assets/` is missing, pointing to `npm run fetch-wasm -w @3d-gallery/print-toolkit`.
3. Update `packages/print-toolkit/package.json` `"exports"` to expose `./vite-plugin`.
4. Add a `postinstall` hook to `packages/print-toolkit/package.json` that runs `node scripts/fetch-wasm.mjs`. Consider whether this should be opt-in (env var like `SKIP_PRINT_TOOLKIT_WASM=1`) to avoid slowing CI when the assets aren't needed. Recommendation: skip if `CI=1` and let CI explicitly run it.

**Verify:**
- `nix develop -c npm run fetch-wasm -w @3d-gallery/print-toolkit` → downloads files into `packages/print-toolkit/assets/`.
- `packages/print-toolkit/assets/libslic3r.wasm` exists and is >1MB.
- `.gitignore` still excludes `assets/`.

**Commit as:** `print-toolkit: WASM fetch script + vite plugin for asset copy`

## T5: Test migration — depends on: T2
**Goal:** Move the OWG tests that cover the headless code we migrated. Get them running under vitest.

**Steps:**
1. Copy these OWG test files from `openscad-web-generator/src/lib/__tests__/` to `packages/print-toolkit/tests/`:
   - `slicer-engine.test.ts`, `moonraker-api.test.ts`, `orca-slicer-settings.test.ts`, `plate-slicer.test.ts`, `plate-slicer-integration.test.ts`, `storage.test.ts`, `storage-browser.test.ts`. Skip anything React-y.
2. Fix imports in each test — they now import from `../src/*` instead of `..`.
3. Add `vitest` and `@vitest/browser` (if any test needs a browser env) to `packages/print-toolkit/devDependencies`. Add a `test` script: `"test": "vitest run"`.
4. Create `packages/print-toolkit/vitest.config.ts` if OWG had one — mirror any relevant config (setup files, browser mode).
5. Add `"types": ["vitest/globals"]` back to `packages/print-toolkit/tsconfig.json`.

**Important:** the initial `npm install` crashed on `vitest` peer-dep resolution during workspace bootstrap. If it recurs: pin an exact version (not a caret range), delete `packages/print-toolkit/node_modules` if it exists, and re-run `npm install` from the repo root. Do not run `npm install` inside the workspace subdir.

**Verify:**
- `nix develop -c npm test -w @3d-gallery/print-toolkit` → all migrated tests pass. Any test that requires the WASM runtime (`slicer-engine.test.ts` may) needs `assets/` populated first (T4).

**Commit as:** `print-toolkit: migrate vitest unit + integration tests`

## T6: Slicer backend refactor + shim types — depends on: T2
**Goal:** Ensure `slicer-backend.ts` cleanly picks between native (`window.NativeSlicer`) and WASM, with no framework coupling. Confirm `android-shim-types.ts` covers everything the toolkit feature-detects.

**Steps:**
1. Audit every file in `packages/print-toolkit/src/` for `window.X` access. Enumerate what globals are read.
2. Reconcile against `src/android-shim-types.ts`. Add any missing entries. Remove any that no toolkit code actually reads.
3. In `slicer-backend.ts`, ensure `createSlicerBackend()` returns an object with a consistent shape whether it wrapped `NativeSlicer` or `createSlicerEngine()`. Both branches must implement the same interface (define it explicitly, e.g. `interface SlicerBackend { loadAndSlice(...): Promise<Uint8Array>; ... }`).
4. If T2 removed hook-related runtime imports but left the flow broken, patch that here. The backend should be usable from a plain function call, not a React hook.

**Verify:**
- `git grep -nE "from '.*hooks" packages/print-toolkit/src/` → empty.
- `git grep -nE "\bwindow\.(NativeSlicer|AndroidPrinterDiscovery|AndroidFileBridge)" packages/print-toolkit/src/` → matches only shim-types.ts (for declaration) and the files that feature-detect.
- Manual: `createSlicerBackend()` returns the same interface in both branches (add a quick unit test if needed).

**Commit as:** `print-toolkit: framework-free slicer backend + android shim contract`

## T7: gallery-app print UI wiring — depends on: T2, T3, T4
**Goal:** Wire a curated print flow into `gallery-app`. Add `src/print/` with: a Print button on model cards, a compact print dialog (printer preset → filament preset → slice → send), and a settings panel to import Orca configs and manage presets.

**Steps:**
1. Add `"@3d-gallery/print-toolkit": "*"` to `packages/gallery-app/package.json` dependencies. Run `npm install` from root to link.
2. Update `packages/gallery-app/vite.config.ts` to add the toolkit's Vite plugin:
   ```ts
   import { copyPrintToolkitAssets } from '@3d-gallery/print-toolkit/vite-plugin';
   // ...
   plugins: [
     // existing plugins,
     copyPrintToolkitAssets({ dest: 'wasm' }),
   ]
   ```
3. Create `packages/gallery-app/src/print/PrintDialog.tsx` (Preact component). UI: three `<select>` elements (printer, filament, print profile) sourced from `BrowserStorageAdapter`, a "Slice & Send" button, a progress bar bound to the slicer engine's `onProgress` callback. On completion, `uploadGcode` then `startPrint` via `moonraker-api`.
4. Create `packages/gallery-app/src/print/SettingsPanel.tsx`: file input that accepts `.orca_printer`, `.orca_filament`, `.orca_process` bundles, parses them via the toolkit's Orca import helpers (see what OWG exposes; if it's not exported yet, do so in T2), and stores presets via `BrowserStorageAdapter`. Also renders a list of stored presets with delete controls.
5. Wire a "Print" button into the existing model sidebar / model page in `src/main.ts` that opens the dialog. Keep it optional per-model: models without a compatible mesh format (no STL/3MF part) don't show it.
6. Preserve the existing Preact patterns already in `src/main.ts` — don't introduce a new framework or state management.
7. Add localStorage-key namespacing to avoid clobbering existing gallery state. Use prefix like `3dg:print:` for anything the toolkit-facing storage adapter persists.

**Verify:**
- `nix develop -c npm run build` at root → passes.
- `nix develop -c npm run dev -w @3d-gallery/gallery-app` → app runs at :5173, sidebar loads, Print button visible on models with printable parts, dialog opens.
- Type-check clean: no `any` leaks from toolkit, all TypeScript strict.

**Commit as:** `gallery-app: curated print UI via @3d-gallery/print-toolkit`

## T8: Root scripts, CI, flake — depends on: T3
**Goal:** CI + `nix develop` + npm scripts all work with the new layout.

**Steps:**
1. Update `.github/workflows/deploy.yml`: change any `npm run build` invocations to work at workspace root. Add step to run `npm run fetch-wasm -w @3d-gallery/print-toolkit` before `npm run build` if the print UI needs WASM in production. If print UI is behind a feature flag or lazy-loaded, defer WASM to that path.
2. Update `.github/workflows/e2e.yml` similarly.
3. Update `flake.nix` if OWG's flake had an `orcaslicer-wasm` input we want to mirror. Otherwise leave alone — assets come from GitHub Releases via `fetch-wasm.mjs`, which doesn't need Nix.
4. Update `.githooks/pre-commit` (if it exists) to run at workspace root cleanly.
5. Update root `README.md` and root `CLAUDE.md` — add a Workspaces section explaining the two packages and how to run each. Do NOT delete existing content; append.
6. Update `packages/gallery-app/CLAUDE.md` if you moved one there. If not, either move the relevant sections from root CLAUDE.md, or add a per-package note.

**Verify:**
- Push a WIP branch; check that CI runs the build workflow to completion.
- `nix develop` still hands you working openscad, node, BOSL2, qr.scad.
- `npm run preflight` (or its equivalent) still works.

**Commit as:** `ci + tooling: adapt to workspace layout`

## T9: Android shell seed — depends on: T7
**Goal:** Seed `packages/android-shell/` by copying (not moving) from `openscad-web-generator/android/`. Retarget WebView to load gallery-app's build output. Rename JS bridges to match `android-shim-types.ts`.

**Steps:**
1. Copy (do not move) `openscad-web-generator/android/` → `packages/android-shell/`. Rename files/paths as needed to reflect the new project name.
2. Update `packages/android-shell/app/build.gradle.kts` — package name, app label. Add a gradle task that runs `npm run build -w @3d-gallery/gallery-app` at the workspace root and copies `packages/gallery-app/dist/**` → `packages/android-shell/app/src/main/assets/webapp/`.
3. Update `MainActivity.kt`: WebView loads `https://appassets.androidplatform.net/assets/webapp/index.html` via `WebViewAssetLoader`. Set COOP/COEP response headers on the AssetLoader path handler (required for SharedArrayBuffer / pthreads WASM if native slicer is absent).
4. Rename `@JavascriptInterface` classes and their JS-bridge names to match: `NativeSlicer`, `AndroidPrinterDiscovery`, `AndroidFileBridge`. Method signatures must match `packages/print-toolkit/src/android-shim-types.ts` exactly.
5. If OWG doesn't have `AndroidFileBridge`, stub it: implement `openFile(mimeTypes): Promise<string>` using the Storage Access Framework (`ACTION_OPEN_DOCUMENT`), returning the file bytes as base64. `saveFile` similarly with `ACTION_CREATE_DOCUMENT`.
6. Add npm scripts at root: `apk`, `apk:install`, `apk:debug` — copies from OWG's setup, retargeted paths.
7. Update root `flake.nix` if Android SDK is a Nix input. If not, document Android SDK expectations in `packages/android-shell/README.md`.

**Verify:**
- `cd packages/android-shell && gradle assembleDebug` succeeds (requires Android SDK).
- `adb install -r app/build/outputs/apk/debug/app-debug.apk` succeeds on a test device / emulator.
- App launches, WebView shows the gallery.
- In `adb logcat`, verify `window.NativeSlicer` is present when the WebView loads.

**Commit as:** `android-shell: seed from openscad-web-generator, retarget to gallery-app`

## T10: Final verification — depends on: T9 (and everything else)
**Goal:** Confirm the workspace is self-contained and OWG is not required at runtime or build time. `/home/max/git/openscad-web-generator/` stays on disk untouched — this task never deletes it.

**Steps:**
1. `git grep -F "@owg" /home/max/git/3d-gallery/` — expect zero hits.
2. `git grep -F "openscad-web-generator" /home/max/git/3d-gallery/` — expect hits only in this doc, changelog, or historical notes. No runtime imports, no build-script paths, no CI references.
3. Temporarily rename `/home/max/git/openscad-web-generator/` to something else (e.g. `openscad-web-generator.disabled/`) on your machine and run the full build + test suite: `nix develop -c bash -c "npm install && npm run build && npm run test:build && npm test -w @3d-gallery/print-toolkit"`. Everything must pass with OWG effectively absent. Rename back when done.
4. Manual smoke: web app runs, model loads, customizer works, print dialog opens, dummy slice succeeds against a real Moonraker instance if available (otherwise mocked).
5. If Android shell tests passed in T9, mark this done.

**Verify:**
- Everything above passes with OWG's directory temporarily inaccessible.
- No dangling references.

**Commit as:** `final: verify migration is self-contained`

---

# COORDINATION RULES

- Each task ends with a green commit on the working branch.
- Don't rebase or merge across tasks. The launching human resolves any conflicts.
- If a task discovers a blocker not covered here (e.g. an OWG file uses a package that isn't in the migration table), stop and report — don't invent scope.
- If a task depends on another and that one isn't done, halt and report — don't work around it.
- Keep changes minimal. If you notice something adjacent that would be nice to improve, note it in the commit message but don't do it.
- Preserve git history: for files being **moved within this repo** (T3), use `git mv`. For files being **copied from OWG** (T2, T9), plain copy is fine — OWG stays intact.
- `/home/max/git/openscad-web-generator/` is not touched at any point.
