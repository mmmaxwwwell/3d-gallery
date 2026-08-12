# hex-bit-holder

A single-part 1/4" hex-shank bit holder: a rounded-edge block with a row of 12 hexagonal through-holes that grip driver bits by friction. Intended for 64D TPU.

## File layout

```
lib/
  hex-bit-holder-lib.scad   all geometry modules + every shared parameter
parts/
  hex-bit-holder.scad       renders hex_bit_holder()
previews/
  assembled.scad            colored hex_bit_holder() → single-color 3MF
```

Each consumer file is a thin 3-line entry point: `include`, `$fn`, one module call. Geometry lives in the lib.

## Key parameters (lib is source of truth)

- `gap` (0.25) — fit clearance added to the hex across-flats. Printed opening = `shank_across_flats + gap`. The single most important tuning knob; tuned for 64D TPU.
- `shank_across_flats` (6.35) — 1/4" hex flat-to-flat. Don't change for standard bits.
- `hole_count` (12), `hole_spacing` (15), `end_margin` (spacing/2) — the row layout.
- `block_depth` (15), `block_height` (18) — cross-section; `block_height` is the hex pocket depth (holes run along Z).
- `corner_sphere_d` (3) — diameter of the eight hulled corner spheres that round the box.
- Derived: `block_length = (hole_count-1)*hole_spacing + 2*end_margin`; `hex_across_flats = shank_across_flats + gap`.

## Hex sizing math

OpenSCAD's `cylinder($fn=6, d=D)` sets the *circumscribed* diameter. To hit a target across-flats `A`, use `D = A / cos(30°)`. The lib does this in `_hex_hole()`. Don't pass across-flats directly as the diameter — the holes would come out ~15% too small.

## Geometry

- `_rounded_box(l,w,h,r)` — hull of 8 spheres at the box corners, inset by `r` so the bounding box stays exactly `l×w×h`. Centered on origin.
- `_hex_hole()` — one `$fn=6` cylinder along Z, overshooting `block_height*3`, `center=true`, rotated 90° so flats land top/bottom.
- `_hole_positions()` — `children()` iterator placing the row along X.
- `hex_bit_holder()` — `difference()` of the rounded box minus the row of hex holes.

## `include` vs `use`

Consumers `include` the lib (not `use`) — top-level params must be visible in consumer scope, and the lib has no top-level render calls.

## Editing rules

- Don't redefine lib params in consumer files; change them in the lib.
- Don't add `translate()` in consumer files — the block renders centered.
- Holes use `center=true` + 3× overshoot to punch through cleanly.

## Build / verify

```bash
openscad -o build/hex-bit-holder.stl parts/hex-bit-holder.scad 2>&1 | tail -8
```

Expect `Simple: yes` and `Volumes: 2`. >2 means a hole or sphere got disconnected.

Full pipeline (STL + 3MF preview, mirrors to public/): `node scripts/build-models.mjs` from repo root (run under `nix develop` if node isn't on PATH).
