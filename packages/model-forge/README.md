# @3d-gallery/model-forge

The Node side of the 3d-gallery module: resolves SCAD sources, renders them on
demand, and keeps the results in a content-addressed store that build time and
request time share.

Nothing here is ever imported by a browser bundle. The isomorphic half lives in
`@3d-gallery/model-core`.

## Deferred generation

```ts
const forge = createForge({ root: process.cwd() });
const { bytes, status } = await forge.ensure({ slug: 'collar-tag', target: 'multicolor', format: '3mf' });
```

`ensure` renders only on a miss. Concurrent callers for the same key share a
single render, so ten dev-server reloads run one `openscad`.

**There is no invalidation step, because there is nothing to invalidate.** The
key is derived from the source, so editing a `.scad` produces a key the store
has never seen — a miss, which renders. The previous artifact just goes cold.
`forge.invalidate(slug)` exists only to drop the in-memory source memo; skipping
it costs a `stat` per contributing file, never correctness.

## What's stored

```
.cache/forge/
  ab/abcdef….3mf     artifact bytes
  ab/abcdef….json    sidecar: slug, target, params, engine, engineVersion, args, renderMs, builtAt
  errors/abcdef….json  negative cache
```

Writes are temp-file-plus-rename, so an interrupted render can't leave a
truncated artifact that later reads as a hit.

The **sidecar** holds everything deliberately excluded from the key — engine, its
version, its flags. Excluding them is what lets a natively-built artifact satisfy
a request on a machine with no `openscad`, and stops a toolchain bump from
cold-starting the whole store.

The **negative cache** remembers a failed render for `negativeTtlMs` (default
60s). Without it, a SCAD typo re-runs a full render on every page refresh.

## Serving

```ts
server.middlewares.use(createArtifactMiddleware(forge));
```

- `GET /a/<key>.<ext>` — hit: stream, `immutable`. Miss with no payload: 404.
- `GET /a/<key>.<ext>?r=<encodeRenderRequest(req)>` — miss: decode, verify the
  request hashes to `<key>`, render, store, stream.

The verification matters: without it, anyone could have arbitrary parameters
rendered and cached under a key of their choosing. A mismatch is a 400, a broken
model is a 500, and the two are never confused.

## Build time

`forge.prerender()` builds every part and preview at defaults plus every declared
`variant`. Anything already stored is a no-op, so an incremental build renders
only what changed. `forge.runtimeManifest()` emits the manifest the browser gets:
the authored one plus `sourceDigest`, `paramSchema`, `defaultKey`, and a key per
variant.

## Source resolution

`parts/<target>.scad` then `previews/<target>.scad`; failing both, a consumer is
synthesized for a lib module of that name — but only if the lib actually declares
it. OpenSCAD merely *warns* on an unknown module and renders nothing, so without
that check a typo would cache an empty mesh under a perfectly valid key.

Local includes are inlined recursively (cycle-detected); library-path includes
like `BOSL2/std.scad` are left for `OPENSCADPATH` and recorded in the sidecar.
Renders always run from a temp directory — never the model tree, which is how the
repo ended up with stale `_pass_*.scad` files from an older builder.

Parameters are injected between the lib and the consumer's own statements, so a
preview-local override (`split = 3;` in `assembled-3x3.scad`) stays authoritative.
With no parameters the assembled text is byte-identical to the on-disk source.

## Engines

`auto` (default) prefers the native `openscad` binary — 3-10x faster on this
repo's boolean-heavy CSG — and falls back to **OpenSCAD compiled to WebAssembly**
running in Node when the binary isn't installed. Force either with
`engine: 'native'` or `engine: 'wasm'`.

The WASM assets are ~24 MB, versioned with the upstream build rather than this
repo, and useless where rendering is native — so they're fetched on demand into a
gitignored `assets/`:

```bash
npm run fetch-wasm -w @3d-gallery/model-forge
```

A fully-warm store needs no engine at all: one is only resolved on a miss.

**The two engines must agree on geometry**, because the engine is recorded in the
sidecar rather than hashed into the key — an artifact built by one is served to a
machine running the other. `tests/engine-parity.test.ts` renders the same fixture
through both and compares bounding box, triangle count, and 3MF palette. It skips
itself unless both engines are available, so don't read a green run as proof
they were compared.

### Multicolor under WASM

The native path flattens to CSG and regex-scans for colours. The WASM path
renders from source instead: one pass overrides `color()` with an `echo` to
discover the palette, then one pass per colour keeps only matching geometry.

That filter matches on `str(c)` **by string equality** against what discovery
captured, rather than resolving the colour to RGB inside SCAD. Resolving in SCAD
means reimplementing every literal form OpenSCAD accepts — and a hex literal like
`color("#a5560a")` silently resolved to black, so its pass rendered nothing and
the whole 3MF failed. Note also that `echo()` prints string values wrapped in
quotes that aren't part of the value; those are stripped before matching.

## Conventions

TypeScript with explicit `.ts` import extensions, run directly by Node 22's type
stripping — no build step. The two `scripts/*.mjs` imports are the shared
multicolor-3MF pipeline, kept in one place so the root CLI and this package can't
diverge.
