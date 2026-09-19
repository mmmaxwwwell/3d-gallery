# @3d-gallery/model-core

Isomorphic core of the 3d-gallery module. Zero dependencies, no Node builtins, no
DOM globals — it has to produce identical results in the browser and in Node,
because both sides compute artifact keys and a silent disagreement would turn
every cache lookup into a miss.

## What it does

- **Manifest schema + validation** — `validateManifest` reports every issue at once via `ManifestError.issues`.
- **SCAD parameter parsing** — `parseParams` reads a `// BEGIN_PARAMS` … `// END_PARAMS` block.
- **Parameter canonicalization** — `canonicalizeParams` reduces a value map to the minimal set that changes the render.
- **Content-addressed artifact keys** — `artifactKey`, plus the request transport used on a cache miss.

## The key

```
key = sha256(
  "3dg-artifact/1" \0 slug \0 target \0 format \0 sourceDigest \0 canonicalParams
)
```

`sourceDigest` is computed by the Node side and published in the runtime manifest;
the browser never re-derives it. Only `canonicalParams` has to be reproduced on
both sides, and `tests/key-vectors.json` pins that agreement.

The render engine, its version, and its CLI flags are deliberately **not** in the
key — they live in the cache sidecar. Putting them in would mean a natively-built
artifact misses on a WASM-only machine, and every toolchain bump would cold-start
the whole cache.

## Why canonicalization matters

The customizer holds a value for every parameter and posts all of them, so
without normalization a user who changed nothing would address a different
artifact than the pre-built default. `canonicalizeParams` drops unknown names,
coerces URL strings to their declared type, drops anything equal to the lib
default, and sorts what's left — so `{}`, an untouched full value map, and the
pre-built default all collapse to one key.

## Cache misses

An artifact key is one-way, so a miss can't tell the server what to render. The
client attaches the request it hashed:

```
GET /a/<key>.3mf?r=<encodeRenderRequest(req)>
```

The server decodes it, recomputes the key, and refuses anything that doesn't
match (`assertRequestMatchesKey`) — so nobody can have arbitrary parameters
rendered under someone else's key. On a static host the query is ignored, the
file 404s, and the client falls back to rendering in the browser.

## `target` is overloaded, on purpose

On a single-color part, `module` in the manifest names a SCAD module that gets
called. On a multicolor preview it names the `previews/<name>.scad` source to
concatenate — which is why `assembled-2x2` appears there despite not being a
legal SCAD identifier. Both cases answer "which source do I resolve", so the key
calls it `target` and allows hyphens.

## Conventions

Imports carry explicit `.ts` extensions so bare `node` can run this source with
no build step. Consumers need `allowImportingTsExtensions` in their tsconfig.

`tsconfig.json` compiles `src/` with no Node types on purpose;
`tsconfig.test.json` adds them for the tests. `tests/isomorphic.test.ts` fails the
build if anything platform-specific creeps into `src/`.
