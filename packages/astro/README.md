# @3d-gallery/astro

Drops the 3d-gallery module into an Astro site. You hand it a manifest; it gives
you artifact URLs that are pure functions of source and parameters, generates
whatever isn't cached, and renders a viewer island.

The site stays **static**. There is no server at runtime.

## Usage

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import gallery from '@3d-gallery/astro';

export default defineConfig({
  base: '/3d-gallery/',
  integrations: [gallery({ root: import.meta.dirname })],
});
```

```astro
---
import ModelViewer from '@3d-gallery/astro/ModelViewer.astro';
import { manifest } from 'virtual:3d-gallery';
---
<ModelViewer slug="collar-tag" />
<ModelViewer slug="collar-tag" target="single" params={{ tag_text: 'REX' }} />
```

`virtual:3d-gallery` exports the runtime manifest — every model, its parameter
schema, and the artifact key for each part — so a page never hand-wires a forge
or hard-codes a digest. A `slug` or `target` that doesn't exist fails the build
rather than shipping a page with an empty box on it.

## What happens when

**Dev.** Artifacts are generated the first time something asks for one.
`GET /a/<key>.<ext>` streams from the store; on a miss the client re-asks with
`?r=<render request>` attached and the server renders it. Editing a `.scad`
changes its digest, so the next request carries a key the store has never seen —
a miss, which renders. No invalidation step exists because none is needed, and
the superseded artifact simply goes cold.

Only the part you're looking at gets rebuilt, not every part of the model.

**Build.** Artifacts are rendered into `dist/<artifactBase>/<key>.<ext>`, plus the
runtime manifest. Anything already in the cache is a no-op — persist
`.cache/forge` in CI and an incremental build renders only what changed. A model
that fails to render fails the build.

How much gets baked depends on `prerender`:

- **`'referenced'`** (default) — only what a `<ModelViewer>` actually placed
  during the build, plus the declared `variants` of those same parts. A blog that
  embeds a few models shouldn't ship the whole catalogue. Measured on a real
  14-model manifest: **43 artifacts / 96 MB → 17 artifacts / 8.2 MB**, and a
  17 MB calibration part that no page displays stopped shipping entirely.
- **`'declared'`** — everything in the manifest. Right for a dedicated gallery
  where every part is reachable.
- **`false`** — nothing.

The runtime manifest always lists *every* model regardless of mode, so a client
can still render an unbaked one locally via the WASM fallback.

Reference tracking hangs off `globalThis`: `<ModelViewer>` runs inside Astro's
SSR bundle while the integration runs in the Astro process — two module graphs in
one Node process — so a module-level registry would give each side its own empty
copy.

**Production.** Static files. Default and declared-variant parameters are always
a hit. Anything else 404s, and the client falls back to OpenSCAD-WASM in the
browser if you configured a local renderer.

## Options

| Option | Default | |
|---|---|---|
| `root` | Astro project root | Directory containing `models/` |
| `modelsDir` | `<root>/models` | |
| `manifest` | `<modelsDir>/manifest.json` | An object or a path |
| `cacheDir` | `<root>/.cache/forge` | Persist in CI to skip rebuilds |
| `artifactBase` | `/a/` | Site-base-relative |
| `manifestPath` | `/models/manifest.json` | |
| `engine` | `auto` | Native `openscad`; see the engine note below |
| `concurrency` | `4` | Simultaneous renders |
| `prerender` | `'referenced'` | `'referenced'` \| `'declared'` \| `false` — see below |

## Two things that bit during implementation

**Vite strips the site base before middlewares see `req.url`.** With
`base: '/demo/'`, the dev routes mount at `/a/` while the browser fetches
`/demo/a/`. The manifest therefore publishes the *prefixed* base while the
middleware matches the *stripped* one — these are deliberately different values,
not a redundancy.

**The Vite plugin is `enforce: 'pre'`.** Astro installs a catch-all dev
middleware from its own plugin. Registered any later — including from
`astro:server:setup` — every artifact request 404s before reaching us.

## Engine

Rendering needs `openscad` on PATH (the repo's Nix devshell provides it). A
WASM-in-Node engine isn't implemented yet, so a machine without `openscad`
cannot render — but a warm cache still serves every prebuilt artifact, because
an engine is only resolved on a miss.
