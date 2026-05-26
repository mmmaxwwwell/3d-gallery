# fi-mini-case

A protective case for the Fi Mini GPS tracker with an optional QR code, held together by 6 M3x6 SHCS.

## File layout

```
lib/
  fi-mini-case-lib.scad    all geometry modules + every shared parameter
parts/
  cap.scad                 renders cap() — top half with QR recesses
  base.scad                renders base() — bottom half with collar channel
previews/
  assembled.scad           colored assembly with cap + QR + base → multicolor 3MF
```

Each consumer file is intentionally thin — three lines: `include`, `$fn`, one module call. Geometry lives in the lib; consumers just pick which module to render.

## Assembly convention

The case splits at `z = -fi_height/2` (where the collar meets the Fi body).

- **cap()** — top half, translated so the split face sits at z=0 (print-ready). Contains the Fi cavity, top wall, and QR code recesses if `qr_code_text` is non-empty.
- **base()** — bottom half, flipped 180° so the split face sits at z=0 (print-ready). Contains the collar channel, screw counterbores, and USB-C cutout.
- **assembled()** — colored preview: black cap, white QR modules, dark gray base, offset in Y.

## Working with the lib

`fi-mini-case-lib.scad` defines **everything shared** at the top:

- Fi geometry: `fi_length`, `fi_width`, `fi_height`, `fi_corner_r`
- Fasteners: `screw_shaft_d`, `screw_shaft_l`, `screw_head_d`, `screw_head_h`
- Case: `wall_thickness`, `top_thickness`, `edge_rounding`
- USB-C cutout: `usbc_width`, `usbc_height`, `usbc_depth`, `usbc_rounding`
- Collar: `collar_width`, `collar_thickness`
- QR: `qr_code_text` (customizable), `qr_thickness`, `qr_size`
- Derived: `case_length`, `case_width`, `full_case_height`, `split_z`

Then helper modules:
- `fi_mini_body()` — the Fi tracker solid
- `collar_cutout()` — collar channel volume
- `m3x6_shcs()` — single screw solid
- `screw_row(side)` — places screws along one side
- `all_screws()` — both sides
- `usbc_cutout()` — USB-C port opening
- `full_case()` — complete case shell (before splitting)
- `top_half()`, `bottom_half()` — raw halves (not positioned for printing)
- `qr_dark_modules()` — QR code geometry
- `qr_pocket()` — full QR-area pocket

Then the public modules: `cap()`, `base()`, `assembled()`.

## `include` vs `use`

All consumers use `include <../lib/fi-mini-case-lib.scad>;` — **not** `use`. The lib needs its top-level variables visible in the consumer scope.

## Build / render commands

OpenSCAD CLI for STL export:

```bash
openscad -o build/cap.stl   parts/cap.scad
openscad -o build/base.stl  parts/base.scad
```

The multicolor 3MF is built by the gallery's `build-multicolor-3mf.mjs` script via `build-models.mjs`.

## Editing rules

- **Don't redefine lib parameters in consumer files.** Change values in the lib.
- **Don't add geometry in consumer files.** They should stay 3-line entry points.
- **QR code is optional.** When `qr_code_text` is empty, `cap()` renders without recesses.
- **The split plane is at `z = -fi_height/2`.** Don't change this without updating both halves.
