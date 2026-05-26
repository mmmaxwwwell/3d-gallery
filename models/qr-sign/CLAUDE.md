# qr-sign

A two-color QR sign — rounded plate in one filament, embossed QR modules in a contrasting filament. Prints as a single multi-material job.

## File layout

```
lib/
  qr-sign-lib.scad         all geometry + every shared parameter
previews/
  assembled.scad           colored plate + QR modules → multicolor 3MF
```

There is **no `parts/` directory** for this model. The sign is a single multi-material print; splitting it into per-color STLs would lose the layer-aligned interlock that makes the two colors mate cleanly. The only build output is `assembled.3mf`.

## Two-color split

The split is in Z, not in X/Y:

- **`plate_with_pocket()`** — rounded plate, 3 sections tall (`3 × section_h`), with the QR shape subtracted from the top. Prints in the "plate" filament.
- **`qr_modules()`** — QR modules, 2 sections tall, sitting in the pocket and rising 1 section proud of the plate surface. Prints in the "QR" filament.

`section_h = 4 × layer_h` (default `layer_h = 0.28`, so `section_h = 1.12mm`). The 4-layer count keeps the filament swap on a clean layer boundary and gives the QR enough thickness that scanners pick up the contrast under all lighting.

## External library dependencies

The lib uses two system OpenSCAD libraries via `include <>`:

- [`BOSL2/std.scad`](https://github.com/BelfrySCAD/BOSL2) — geometry primitives
- [`qr.scad`](https://github.com/marius/qrcode) — the `qr(text, width, height, thickness, center)` module

The gallery's build step expects these to be available on the system OpenSCAD library path. The Nix devshell at the repo root already provides BOSL2; `qr.scad` may need a manual drop into `~/.local/share/OpenSCAD/libraries/`.

## Working with the lib

`qr-sign-lib.scad` exposes:

- Parameters: `qr_url_text`, `sign_size`, `corner_r`, `layer_h`
- Derived: `section_h` (= `4 × layer_h`)
- Helpers: `plate(h)`, `qr_raw()`, `qr_black()`, `qr_black_clipped()`
- Public modules: `plate_with_pocket()`, `qr_modules()`, `sign()`

`sign()` exists only for quick GUI previews — the gallery preview uses the two split modules wrapped in `color()` so the multicolor 3MF builder can pick them apart.

## `include` vs `use`

Consumers use `include <../lib/qr-sign-lib.scad>;` — the lib needs its top-level params visible in the consumer scope, and the lib has no top-level render calls so `include` is safe.

## Editing rules

- **Don't redefine lib parameters in `previews/assembled.scad`.** Customizer values live in the lib's `BEGIN_PARAMS` block.
- **Don't `translate()` in the preview.** The two modules are already aligned in Z — the QR sits inside the plate pocket and protrudes above the surface.
- **Keep `section_h = 4 × layer_h`.** The 4-layer rule keeps color swaps on clean layer boundaries.
- **Don't change the default URL.** Don't ship a customer-specific URL as the default.

## Build / render

```bash
openscad -o build/assembled.stl previews/assembled.scad
```

The gallery's `build-models.mjs` runs `build-multicolor-3mf.mjs` for the `assembled.3mf` entry, which scans for `color()` calls and emits one mesh per color into a single multicolor 3MF.
