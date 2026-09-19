# @3d-gallery/viewer

The browser half of the 3d-gallery module: the Three.js viewer, the artifact
cache client, and the OpenSCAD-WASM fallback renderer.

Never imported by Node. The isomorphic half is `@3d-gallery/model-core`; the
server half is `@3d-gallery/model-forge`.

## Resolving an artifact

```ts
const client = createArtifactClient({
  manifest,                              // the runtime manifest from the server
  localRenderer: createWasmRenderer(sources),
});

const { bytes, format, source } = await client.get({ slug: 'collar-tag', target: 'multicolor' });
viewer.load(bytes, format);
```

`get` tries, in order:

1. **Local cache** (IndexedDB, keyed by content hash).
2. **The server**, at a clean `/a/<key>.<ext>` with no query string — an
   immutable, CDN-friendly URL, and the overwhelmingly common case.
3. **The server again**, with `?r=<render request>` attached. A dev server
   renders it; a static host ignores the query and 404s again.
4. **A local WASM render**, cached for next time.

The key is computed from the `sourceDigest` the manifest publishes — the browser
never assembles SCAD source in order to hash it. That's deliberate: if both sides
had to concatenate lib and consumer into byte-identical text, one stray newline
would silently send every client to a different artifact. Only
`canonicalParams` has to agree, and `model-core` pins that with a shared vector
file.

With no parameters, `keyFor` doesn't hash at all — the manifest already carries
`defaultKey`.

## The WASM fallback doesn't have to match the server

`createWasmRenderer` assembles its own SCAD text, and it does *not* need to be
byte-identical to what `model-forge` builds. The key came from the manifest, not
from this text, so the two sides only need to agree on geometry. It does keep the
same injection order — parameters into the lib, preview concatenated after — so a
preview's local overrides stay authoritative.

WASM boot costs seconds, so it's deferred until something actually misses.

## Caching

IndexedDB, not localStorage: a 3MF runs to hundreds of kilobytes, localStorage
caps around 5MB, and it needs base64, which inflates binary by a third. Entries
are keyed by content hash and therefore never go stale — an edited model simply
stops being asked for. Falls back to memory when IndexedDB is absent.

## Key schema drift

`client.assertKeySchema(KEY_SCHEMA)` fails loudly when the bundle and the
manifest disagree. Without it the symptom is every request 404ing forever with no
explanation.

## What moved here

`viewer.ts`, `openscad-api.ts`, `openscad-worker.ts`, `color-utils.ts`,
`merge-3mf.ts`, and `embed-source-url.ts` came from `gallery-app`. `scad-parser.ts`
and `types.ts` were deleted — `model-core` owns them now, so the browser and the
Node renderer share one parser rather than two that can drift.

`injectParameters` is re-exported from `model-core` for the same reason.
