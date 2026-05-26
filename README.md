# 3D Gallery

**[Live Site](https://mmmaxwwwell.github.io/3d-gallery/)**

A GitHub Pages gallery of 3D-printable models with an interactive in-browser viewer (Three.js, colorized for multi-color assemblies).

Models live under [`models/`](models/). Each model is an OpenSCAD project; STL and 3MF artifacts are pre-built by a GitHub Action on every push and served alongside the viewer.

## Models

- [`fan-mount`](models/fan-mount/) — 100mm fan mount with conical clamp and TPU gaskets.
- [`fi-mini-case`](models/fi-mini-case/) — Protective case for the Fi Mini GPS tracker with optional QR code.
- [`qr-sign`](models/qr-sign/) — Two-color QR sign that encodes any URL onto a 235mm rounded plate.
- [`air-purifier-shelf`](models/air-purifier-shelf/) — Wall-mounted round shelf for the Levoit Core 200S air purifier.

## Local development

```bash
nix develop                 # openscad + node 22
npm install
npm run build:models        # render every .scad → STL / 3MF under models/*/build/
npm run dev                 # vite dev server at localhost:5173
```

## Adding a model

1. Drop your project into `models/<slug>/` (one or more `.scad` files; libraries named `*-lib.scad` are skipped by the builder).
2. Optionally include `<slug>/assembled.scad` with top-level `color(...)` calls — the builder renders it as a multi-color 3MF.
3. Add an entry to [`models/manifest.json`](models/manifest.json).
4. Push — the GitHub Action rebuilds the artifacts and redeploys.

## License

MIT (see [LICENSE](LICENSE)). The Three.js viewer code is derived from [openscad-web-generator](https://github.com/mmmaxwwwell/openscad-web-generator) (AGPL); the lifted portion is small enough to be relicensed under MIT.
