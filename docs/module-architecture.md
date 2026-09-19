# 3d-gallery as a consumable module

Turns this repo from "a site" into "an engine plus a model pack", so an Astro site
(or any Vite app) can hand it a manifest and get a working gallery back.

Status: design. Build order at the bottom.

## The shape of the thing

The consumer passes a **manifest**. The module gives back:

- **artifact URLs** that are pure functions of (source, params) — a content hash,
- **generation** of any artifact that isn't cached yet, deferred until something asks,
- **viewer + customizer islands** to render the result.

There is no production server. "SSR" here means *deferred generation*: the dev
server and the build step both render on demand and write into the same
content-addressed cache. Production output is static files. A model whose `.scad`
changed while the dev server is running regenerates on the next request for it —
not on save, and not for the parts you aren't looking at.

## Why content-addressing does the work

Every artifact is addressed by a hash of what produced it:

```
key = sha256(
  "3dg-artifact/1"    // key schema version — bump to invalidate the world
  \0 slug
  \0 target           // module name, or the parts//previews/ file base name
  \0 format           // "stl" | "3mf"
  \0 sourceDigest     // sha256 of the include-inlined .scad source
  \0 canonicalParams  // JSON, sorted keys, defaults elided
)
```

Served at `/<base>/a/<key>.<ext>`.

Three properties fall out of this, and they're the whole design:

1. **Edit-then-regenerate is free.** A changed `.scad` yields a different
   `sourceDigest`, so the next request is a miss and gets rendered. Nothing has to
   detect the change, diff it, or invalidate anything. The old key just goes cold.
2. **The URL is immutable.** Content-addressed means `Cache-Control: public,
   max-age=31536000, immutable` is always correct — CDN, service worker, and browser
   cache all stop being a correctness problem.
3. **Build-time and request-time caches are the same cache.** An artifact baked into
   `dist/` by CI is a legitimate hit for a dev-server request, and vice versa.

### What's deliberately NOT in the key

`openscad --version`, `--backend Manifold` vs CGAL, engine (native vs WASM), file
paths, mtimes. These live in a **sidecar** next to the bytes, not in the address.

Rationale: the repo's own build test (`tests/build/fingerprint.mjs`) already treats
different boolean backends as equivalent — it compares colour palette, bbox ±5e-3mm,
and triangle count ±25%, precisely because re-triangulation differs. If the engine
were in the address, a natively-baked cache would miss on a WASM-only machine and
every Nix bump would cold-start the entire cache. Excluding it is what makes the
"aggressive cache hits" work.

The cost is that a genuine OpenSCAD geometry regression won't self-invalidate. That's
handled deliberately instead of silently: `forge verify` re-renders and compares
fingerprints, and the key schema version is there to nuke everything when needed.

> This is a change from `scripts/cache.mjs`, which hashes the scad *path* plus
> `openscad --version` plus the args. That key is machine-local and invalidates far
> more than it needs to.

### Param canonicalization is where the hit rate comes from

`canonicalParams` is not `JSON.stringify(values)`. Before hashing:

1. drop any key not in the parsed `BEGIN_PARAMS` schema — it can't affect the render,
2. **drop any value equal to the lib default**,
3. sort remaining keys,
4. normalize numbers (`-0` → `0`).

Step 2 matters most. The customizer holds a full value map and posts all of it, so a
user who changed nothing currently hashes differently from the default build. After
canonicalization `{}`, `{split: 2}` (where 2 is the default), and the pre-built
default artifact all address the same bytes. That is the "look for a pregenerate
match" behaviour.

### The browser never assembles source

Node computes `sourceDigest` once and publishes it in the runtime manifest. The
browser computes `sha256(... sourceDigest ... canonicalParams ...)` from that.

The alternative — having both sides concatenate lib + consumer source and hope the
bytes match — is a standing fragility: one stray newline in the CLI path vs the WASM
path and every key silently diverges. Only `canonicalParams` has to be reproduced on
both sides, and that's a pure function with a shared test vector file.

## Param injection stays textual

`injectParameters()` appends `name = value;` to the **lib** source, and the consumer
source is concatenated **after** it. Preview-local overrides depend on that ordering
— `previews/assembled-3x3.scad` sets `split = 3;` and must win over the user's value.

OpenSCAD's `-D` flag assigns after everything at top level, so switching to `-D` would
silently override those preview-local assignments. Keep the textual injection; it is
also what keeps the CLI and WASM paths byte-identical.

## Packages

| Package | Runtime | Responsibility |
|---|---|---|
| `@3d-gallery/model-core` | isomorphic, zero-dep | manifest schema + validation, `parseParams`, `injectParameters`, `canonicalizeParams`, `artifactKey`, `artifactUrl` |
| `@3d-gallery/model-forge` | Node | source resolution, render engines, 3MF pipeline, content-addressed store, `ensure()`, `prerender()`, dev middleware |
| `@3d-gallery/viewer` | browser | Three.js viewer + Preact customizer as a framework-free mount API, fetch-or-render-in-WASM client |
| `@3d-gallery/astro` | Astro | integration (dev middleware, build prerender, manifest emit) + `<ModelViewer>` / `<Customizer>` / `<PartPicker>` |

Four packages because there are four distinct runtimes. `model-core` has to run in
both the browser and Node (it's what makes client-side key computation possible),
`model-forge` can never be imported by a browser bundle, `viewer` can never be
imported by Node, and `@3d-gallery/astro` must not be a dependency of the plain-Vite
consumer (`gallery-app`).

`@3d-gallery/print-toolkit` is unchanged and stays orthogonal.

### Complexity tracking

| Decision | Why needed | Simpler alternative rejected because |
|---|---|---|
| 4 packages instead of 1 | four disjoint runtimes (isomorphic / Node-only / browser-only / Astro-only) | a single package forces `node:fs` into the browser bundle and Astro into `gallery-app` |
| Engine identity in a sidecar, not the key | build-time and dev-time caches must be interchangeable | engine-in-key cold-starts the whole cache on every Nix bump and on every native↔WASM crossing |
| Separate authored vs runtime manifest | runtime needs digests + keys; humans shouldn't hand-maintain hashes | one manifest means either checked-in hashes that go stale, or clients that can't address the cache |
| Negative cache for failed renders | a model with a SCAD error otherwise re-runs a 30s render on every page refresh | no negative cache makes a broken model a dev-server DoS |

## Manifest: authored vs runtime

**Authored** — `models/manifest.json`, today's schema, hand-edited, plus one optional
addition per part/preview:

```jsonc
{ "file": "multicolor.3mf", "format": "3mf", "module": "multicolor",
  "variants": [                                  // NEW — pre-bake popular configs
    { "label": "Hexagon", "params": { "shape": "hexagon" } }
  ]
}
```

`variants` is how "a cache of the default models" extends to the non-default configs
worth paying for at build time.

**Runtime** — generated, served to the browser, never hand-edited. Adds per
part/preview:

```jsonc
{ "sourceDigest": "…", "paramSchema": [ … ], "defaultKey": "…",
  "variants": [ { "label": "Hexagon", "params": {…}, "key": "…" } ] }
```

Plus a top-level `artifactBase` (default `/a/`) and `keySchema` version so a client
built against an older key schema fails loudly instead of 404-looping.

## Cache layout

```
.cache/forge/
  <k0><k1>/<key>.<ext>       artifact bytes
  <k0><k1>/<key>.json        sidecar: slug, target, format, params, engine,
                             engineVersion, args, byteLength, renderMs, builtAt
  errors/<key>.json          negative cache: message, logs, builtAt, ttlMs
```

Sharded two hex chars deep. Sidecar next to the bytes — no index file to corrupt, no
database. Eviction is size-capped LRU over `builtAt`, and never evicts anything the
current manifest still declares.

## The three flows

**Dev.** `forge.middleware()` handles `GET /a/:key.:ext`. Hit → stream from CAS.
Miss → resolve source, render, store, stream. In-flight requests for the same key
share one promise, so ten reloads run one `openscad`. A `.scad` watcher clears only
the memoized source digest for that slug and pushes an HMR event — it does *not*
eagerly rebuild, which is the behaviour change from today's `scadWatcherPlugin`
(currently one save rebuilds every part of the model).

**Build.** Walk the manifest, `ensure()` every default + declared variant, emit each
into `dist/<base>/a/<key>.<ext>`, emit the runtime manifest. Everything already in
the CAS is a no-op, so an incremental build renders only what actually changed.

**Prod (static).** Client computes the key, fetches `/a/<key>.<ext>`. Default and
declared-variant params are always a static hit. Anything else 404s and falls back to
the existing in-browser OpenSCAD-WASM path, cached in IndexedDB.

## Security note

The network surface accepts *parameter values*, never SCAD source. Values are
validated against the parsed `BEGIN_PARAMS` schema (type, enum membership, vector
arity) before injection, and `injectParameters` already gates names on
`/^[a-zA-Z_]\w*$/`. Renders run with a wall-clock timeout and a bounded concurrency
pool. This matters because `ensure()` is reachable from the dev middleware.

## Build order

1. **`model-core`** — DONE. 73 tests. Frozen key vectors in `tests/key-vectors.json`; a
   pure-JS SHA-256 fallback asserted against WebCrypto so insecure-context clients compute
   identical keys.
2. **`model-forge`** — DONE. 72 tests including real openscad renders. `collar-tag`'s 3MF
   still matches `tests/build/baseline.json` after a forced uncached rebuild.
3. **`viewer`** — DONE. 22 tests. `viewer.ts` and the OpenSCAD-WASM path moved out of
   `gallery-app`; `scad-parser.ts`/`types.ts` deleted in favour of `model-core`.
4. **`@3d-gallery/astro`** — DONE. 31 tests, driving a real `astro build` twice and a
   spawned `astro dev` with on-demand rendering and live `.scad` regeneration.
5. **rewire `gallery-app`** onto the three packages; `scripts/build-models.mjs` becomes a thin
   CLI over `forge.prerender()`. Gate: full e2e + build-fingerprint suite green. NOT DONE.

### Two Astro-specific findings worth keeping

- **Vite strips the site base before middlewares see `req.url`.** With `base: '/demo/'` the
  dev routes mount at `/a/` while the browser fetches `/demo/a/`. The published base and the
  mounted base are deliberately different values.
- **The Vite plugin must be `enforce: 'pre'`.** Astro installs a catch-all dev middleware from
  its own plugin; registered any later — including from `astro:server:setup` — every artifact
  request 404s before reaching the forge.

**WASM-in-Node engine** — DONE. `auto` falls back to OpenSCAD-WASM when the binary
is absent; an `astro build` completes with no `openscad` on PATH. Parity with native
is tested on STL bbox/triangle count and on the 3MF palette, including hex colour
literals, which is what makes excluding the engine from the key sound.

Optional follow-up: **module-granular source slicing.** Today every part of a model
includes the whole lib, so editing any parameter invalidates every part. Hashing only the
call-graph closure reachable from the target module would fix that. Needs a real SCAD
parser and a conservative whole-file fallback when analysis is uncertain — worth doing
only if cache misses on unrelated parts actually hurt.
