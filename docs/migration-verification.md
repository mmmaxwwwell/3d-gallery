# Migration verification (T10)

Final verification that the print-toolkit migration is self-contained: the
workspace no longer depends on `../openscad-web-generator/` (OWG) at runtime
or build time.

## Migration commits

1. `5767957` workspace: bootstrap npm workspaces + print-toolkit package (T1)
2. `31c42bd` print-toolkit: migrate headless sources from openscad-web-generator (T2)
3. `23904f3` gallery-app: move web app into packages/gallery-app workspace (T3)
4. `de8a384` print-toolkit: WASM fetch script + vite plugin for asset copy (T4)
5. `038430c` print-toolkit: migrate vitest unit + integration tests (T5)
6. `c67bfde` print-toolkit: framework-free slicer backend + android shim contract (T6)
7. `7fbb8af` gallery-app: curated print UI via @3d-gallery/print-toolkit (T7)
8. `97f3faf` ci + tooling: adapt to workspace layout (T8)
9. `d3e341d` android-shell: seed from openscad-web-generator, retarget to gallery-app (T9)

## Reference audit

- `git grep -F "@owg" .` — only doc mentions (`CLAUDE.md`, `docs/migration-swarm.md`). No code, no build scripts.
- `git grep -F "openscad-web-generator" .` — hits fall entirely into allowed
  categories:
  - This plan (`docs/migration-swarm.md`).
  - Historical doc references (`CLAUDE.md`, `README.md` attribution, `models/collar-tag/CLAUDE.md`).
  - `packages/android-shell/README.md` + `.gitignore` — references OWG's Nix
    packages for jniLibs regeneration (allowed).
  - `packages/print-toolkit/README.md` and `scripts/fetch-wasm.mjs` — the
    latter targets the durable GitHub repo `mmmaxwwwell/openscad-web-generator`,
    not a filesystem path.
  - `packages/gallery-app/src/lib/openscad-worker.ts` — points at
    `https://mmmaxwwwell.github.io/openscad-web-generator` for hosted
    OpenSCAD-WASM fonts. Durable URL, not a filesystem dep.
  - `scripts/build-multicolor-3mf.mjs` — attribution comment.
- `git grep libslic3r` / `orcaslicer` — restricted to `packages/print-toolkit`,
  `packages/android-shell`, `packages/gallery-app/src/print`, docs, and the
  multicolor 3MF builder comment. No stray references outside their intended
  homes.

## OWG-absent test (Step 3)

Renamed `/home/max/git/openscad-web-generator/` →
`/home/max/git/openscad-web-generator.disabled/` and ran the verification
suite under `nix develop`:

| Command                                                                                       | Result |
| --------------------------------------------------------------------------------------------- | ------ |
| `SKIP_PRINT_TOOLKIT_WASM=1 npm install`                                                       | pass   |
| `npm run build:models`                                                                        | pass   |
| `npm test -w @3d-gallery/print-toolkit` (7 files, 1071 tests)                                 | pass   |
| `cd packages/gallery-app && npx tsc --noEmit`                                                 | pass   |
| `cd packages/print-toolkit && npx tsc --noEmit`                                               | pass   |

OWG directory restored to `/home/max/git/openscad-web-generator/` immediately
after the tests; `ls` confirms contents (`agent-work`, `android`, `CLAUDE.md`,
`coverage`, `dist`, …) are back in place.

`npm run build` at the workspace root was intentionally skipped per the T10
brief — it hits the pre-existing PWA precache limit (17.7 MB STL exceeds
Workbox's default 2 MB per-file cap). Documented by T7/T9 as out of scope for
this migration.

## Known caveats

- **WASM assets not published upstream.** `packages/print-toolkit/scripts/fetch-wasm.mjs`
  expects a GitHub release tagged `orcaslicer-wasm-*` under
  `mmmaxwwwell/openscad-web-generator`. Until such a release exists, install
  with `SKIP_PRINT_TOOLKIT_WASM=1` or run `nix build .#orcaslicer-wasm64`
  from OWG locally to seed `packages/print-toolkit/assets/`.
- **PWA precache limit (pre-existing).** `npm run build` at root fails when
  models produce >2 MB build artifacts because the Workbox precache manifest
  rejects them. This predates the migration; T7 flagged it and it is
  out-of-scope here.
- **`noUnusedLocals` relaxed in `packages/gallery-app/tsconfig.json`.** T7
  disabled the strict-unused check locally so migrated code compiles without
  scrub. Tracked as tech debt for a follow-up sweep.

## Discovered during rename test

Nothing. Every command succeeded on the first run with OWG absent, and OWG
was restored cleanly.
