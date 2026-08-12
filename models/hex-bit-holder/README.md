# hex-bit-holder

A 1/4" hex-shank bit holder: a single rounded-edge block with a row of 6 hexagonal holes punched straight through. Each hole grips a standard 1/4" power-driver bit by friction. Designed to be printed in **64D TPU** so the holes flex just enough to hold bits firmly without a detent. Single-part print.

## File layout

```
lib/
  hex-bit-holder-lib.scad   all geometry + every shared parameter
parts/
  hex-bit-holder.scad       renders hex_bit_holder() — the complete block
previews/
  assembled.scad            colored hex_bit_holder() → 3MF preview
```

Each consumer file is intentionally thin — three lines: `include`, `$fn`, one module call.

## Geometry overview

- **Rounded box** (`_rounded_box`) — hull of eight 3mm-diameter spheres (one per corner) inset so the overall bounding box stays exactly `block_length × block_depth × block_height`. This gives the smooth rounded edges.
- **Hex holes** (`_hex_hole`) — a row of `hole_count` six-sided through-holes along Z (the block height), spaced `hole_spacing` apart and centered with `end_margin` at each end.

## Fit / sizing

The grip is set by **`gap`** (default `0.25`mm): the printed across-flats opening of each hex hole is `shank_across_flats + gap` = `6.35 + 0.25` = `6.60`mm. Tuning notes live in the param comments:

- Looser fit or stiffer filament → raise `gap` toward 0.4mm.
- Tighter grip → lower `gap` toward 0.1mm (64D TPU's squish gives slack).

A hexagon's across-flats `A` maps to OpenSCAD's circumscribed-circle diameter by `d = A / cos(30°)`, which is how the lib derives the `$fn=6` cylinder diameter.

## Working with the lib

`hex-bit-holder-lib.scad` exposes:

- Parameters: `gap`, `shank_across_flats`, `hole_count`, `hole_spacing`, `end_margin`, `block_depth`, `block_height`, `corner_sphere_d`
- Derived: `hex_across_flats`, `block_length`
- Helpers: `_rounded_box()`, `_hex_hole()`, `_hole_positions()`
- Public module: `hex_bit_holder()`

## `include` vs `use`

Consumers use `include <../lib/hex-bit-holder-lib.scad>;` — the lib needs its top-level params visible in consumer scope, and has no top-level render calls so `include` is safe.

## Editing rules

- **Don't redefine lib parameters in consumer files.** Change values in the lib.
- **Don't add `translate()` in consumer files.** The block renders centered on the origin.
- Keep holes subtracted with `center=true` and an overshoot (`block_height * 3`) so they punch cleanly through both faces.

## Build / render

```bash
openscad -o build/hex-bit-holder.stl parts/hex-bit-holder.scad
```

Confirm `Simple: yes` and `Volumes: 2` (solid + through-hole void) in the trailing output for a clean manifold render.

## Printing notes

- **Filament:** 64D TPU. Holes run vertically (along Z) as modeled — print the block on its side so the hex holes run horizontally across the bed if you want the flats to lie cleanly, or print as-modeled with the holes vertical for bridging-free walls.
- The flats of each hex are oriented top/bottom (`rotate 90`) so a bit's flats seat against flat hole walls.
