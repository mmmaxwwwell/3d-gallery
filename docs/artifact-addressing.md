# First-class artifact addressing — implementation spec

Binding contract, same rules as docs/plate-design.md. Read that file too.

## The problem

`artifactKey()` (packages/model-core/src/key.ts) already hashes exactly the
right thing:

    sha256( KEY_SCHEMA \0 slug \0 target \0 format \0 sourceDigest \0 canonicalParamsJson(params, schema) )

- `sourceDigest` is sha256 over the **include-inlined** SCAD source, so it
  covers BOSL2 / qr.scad, not just the one file.
- `canonicalParamsJson` canonicalizes params against the parsed BEGIN_PARAMS
  schema and **drops values equal to the lib default**. That is deliberate and
  must not change: it is what makes an untouched customizer address the same
  bytes as the pre-built default artifact. `tests/key-vectors.json` pins it.

`packages/viewer/src/artifact-client.ts` already computes this key in the
browser and resolves cache -> network -> local render, returning
`source: 'cache' | 'network' | 'local'`.

Two gaps stop any of it from being used:

1. **`main.ts` never adopted it.** It uses its own `computeCacheKey`
   (main.ts:467) — `SHA-256(assembledSource \0 module \0 JSON.stringify(sortedValues))`
   into localStorage. It hashes assembled source instead of the published
   digest, does not canonicalize against the schema, and lives in a separate
   address space from the forge, so a customizer render can never hit a
   build-time artifact.
2. **Production ships no digests.** `scripts/build-models.mjs:87` copies the
   *authored* `models/manifest.json` to `public/models/manifest.json`. Only the
   dev middleware serves the runtime manifest. Browser-side key computation is
   structurally impossible on the deployed site.

Closing gap 2 also removes the `stale` state invented in docs/plate-design.md:
a plate item becomes a render request, and a cache miss just re-resolves.

---

## A1 — emit the runtime manifest and content-addressed artifacts at build time

Owner file: `scripts/build-models.mjs` (only).

Today the script renders via the forge, writes named outputs to
`models/<slug>/build/` + `public/models/<slug>/`, and copies the authored
manifest. Add, without removing any of that:

1. After rendering, write `forge.runtimeManifest()` (JSON) to
   `public/models/manifest.json`, **replacing** the authored-manifest copy at
   line ~87. The named `public/models/<slug>/<file>` outputs stay exactly as
   they are — they are the human-facing download URLs and the viewer's
   fallback, and `tests/build/` reads them.
2. Emit content-addressed copies: for every artifact the forge prerendered,
   write it to `public/a/<key>.<format>`. Get the keys from the same forge API
   the manifest uses; do not recompute them by hand.
3. Set `artifactBase` in the emitted manifest to `/3d-gallery/a/` so the
   deployed client resolves against the right prefix. Read the base path from
   the same place the rest of the build does rather than hardcoding it twice.
4. Log a one-line summary: how many artifacts were emitted and the total bytes,
   so a deploy that silently emits nothing is visible in CI logs.

Constraints: keep the script shebang-free (esbuild rejects shebangs in imported
entry points — see CLAUDE.md). `npm run test:build` must still pass unchanged.

## A2 — unbreak the production build

Owner file: `packages/gallery-app/vite.config.ts` (only).

`npm run build -w @3d-gallery/gallery-app` currently FAILS, and has since
before this work: `workbox.maximumFileSizeToCacheInBytes` is 10 MB
(vite.config.ts:165) and two shipped assets exceed it —
`wasm/libslic3r-wasm64.wasm` (10.7 MB) and
`models/et300-knob-aide-knurled/knurl-depth-grid.stl` (17.7 MB, in the repo
since commit f1414d3). vite-plugin-pwa treats that as fatal.

Fix by keeping large assets **network-only**, not by raising the cap —
precaching ~113 MB on first visit is not acceptable for this site.

- Add `globIgnores` for the wasm64 build, for oversized model artifacts, and
  for the new `a/**` content-addressed tree (those are immutable and fetched on
  demand; precaching them would double the payload).
- Leave the 10 MB cap where it is.
- The existing offline behaviour for the app shell, CSS, JS and small model
  artifacts must not regress. Read the existing PWA config comments first and
  preserve their intent.

Verify: `npm run build -w @3d-gallery/gallery-app` exits 0 and prints a PWA
precache summary. Report the real entry count and size.

## A3 — real 3MF recentering

Owner file: `packages/gallery-app/src/print/mesh-bounds.ts` (only).

`recenterMeshXY` translates ASCII and binary STL but returns 3MF unchanged with
`translation: {0,0,0}` (mesh-bounds.ts:162-165). On a multi-object plate the
layout treats `posX/posY` as the object centre, so a 3MF keeps its authored
offset and can be placed wrong and collide with a neighbour. Several manifest
entries are 3MF parts (`cap.3mf`, `multicolor.3mf`), so this is load-bearing,
not theoretical.

Implement it: unzip with `fflate` (already a dependency, already used in this
file and in merge-3mf.ts), rewrite the vertex coordinates in the 3D model XML,
re-zip, and return the real translation. Requirements:

- Translate so the XY bbox centre is (0,0) and minZ becomes 0, matching the STL
  path's contract exactly.
- Preserve everything else in the archive byte-for-byte where possible:
  `[Content_Types].xml`, `_rels/`, thumbnails, and — critically — the
  multicolor metadata that `merge-3mf.ts` and the viewer's colour handling
  read. Losing colour groups here silently breaks multicolor prints.
- Handle multiple `<object>`/`<mesh>` elements and any build-transform matrices
  the file carries; if a transform is present, do not double-apply it.
- If the file cannot be parsed, fall back to today's behaviour (return
  unchanged with zero translation) rather than throwing or corrupting it.

There is no vitest suite in gallery-app. Verify by writing a throwaway node
script under the scratchpad that round-trips a real repo 3MF
(`public/models/fi-mini-case/cap.3mf` or similar): assert the recentered bbox
is centred, that the archive still unzips, that the colour metadata survives,
and that re-running is idempotent. Paste the real output. Delete the script
afterwards; do not leave it in the repo.

## A4 — migrate the customizer onto the artifact client

Owner files: `packages/gallery-app/src/main.ts` (only).

Replace the ad-hoc `computeCacheKey` + localStorage path with
`createArtifactClient` from `@3d-gallery/viewer`.

- Build the client once from the runtime manifest main.ts already fetches
  (main.ts:1345). Call `assertKeySchema(KEY_SCHEMA)` so a stale bundle fails
  loudly instead of 404-looping.
- Supply the existing OpenSCAD-WASM path as the client's `localRenderer`, so a
  miss still renders locally exactly as it does today.
- Delete `computeCacheKey` and the `3dg:${slug}:${hash}` localStorage cache.
  The client's IDB cache replaces it. Do not leave both.
- Surface hit/miss. `get()` returns `source: 'cache' | 'network' | 'local'`,
  and the dev middleware sets an `x-forge-status` header. Show it in the
  customizer UI as a small, unobtrusive indicator — cached / prebuilt /
  rendered locally — reusing existing DOM and CSS patterns in main.ts. This is
  the "first class way to identify cache hits" the feature exists for; make it
  visible, not console-only.
- Add-to-plate: `meshKey` stops being `stock:<slug>/<file>` or a customizer
  hash. Store the render request instead, per A5's `PlateItem` shape, and
  compute the key via the client's `keyFor()`. Drop the `putCachedMesh` call —
  the client's own cache now holds the bytes.

Behaviour that must not regress: the customizer form, parameter injection,
progress reporting, the download link, and the viewer handoff.

## A5 — plate items become render requests

Owner files: `packages/gallery-app/src/print/plate-store.ts` and
`packages/gallery-app/src/print/plate-resolve.ts` (only).

`PlateItem` changes:

```ts
export interface PlateItem {
  id: string;
  slug: string;
  /** Manifest target (file base name), e.g. 'piece' for piece.stl. */
  target: string;
  format: 'stl' | '3mf';
  label: string;
  modelTitle: string;
  /** Raw customizer values. Canonicalized at key time, never pre-reduced. */
  params?: Record<string, ScadValue>;
  /** Artifact key, cached for display and dedupe. Recomputed on resolve. */
  key: string;
  qty: number;
}
```

- Drop `meshKey` and `file`. Drop the `meshes` object store and
  `getCachedMesh` / `putCachedMesh` / `pruneMeshCache` — the artifact client's
  IDB cache is now the only mesh cache. Bump the DB version and drop the old
  store on upgrade, following the v1->v2 precedent in print-storage.ts.
- `addItemToPlate` dedupes on `(slug, target, key)`.
- `resolvePlate` keeps its exported signature and `ResolveReport` shape, but
  resolves through the artifact client instead of the byte cache.
  **Delete the `stale` path** — a miss now re-resolves. Keep a `failed` array
  for genuine errors (unknown target, render failure) so PrintDialog can still
  report something actionable; update `ResolveReport` accordingly and say so in
  your report so the PrintDialog owner can react.
- Report per-object `source` in `ResolvedPlateObject` so the plate UI can show
  where each mesh came from.
- Existing stored plates from the previous schema: discard them on upgrade.
  This feature has never shipped, so there is no user data to migrate.

---

## Ground rules

Same as docs/plate-design.md: no what-comments, no unrequested features, only
your own files, report don't edit when you need someone else's file. Do not
weaken tests. Do not `any`-cast past a real mismatch. Report real command
output; never claim a check you did not run.
