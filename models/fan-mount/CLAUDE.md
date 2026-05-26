# fan-mount

A 120mm-class fan mount assembly: a base plate that captures the fan into a counterbored seat, a TPU base gasket, a TPU fan-body ring gasket, and a two-piece conical clamp that grips the fan's tapered upper body.

## File layout

```
lib/
  fan-mount-lib.scad     all geometry modules + every shared parameter
parts/
  fan-mount.scad         renders base()
  base-gasket.scad       renders base_gasket()
  fan-gasket.scad        renders fan_gasket()
  fan-clamp.scad         renders one half of the conical clamp (+Y half)
previews/
  assembled.scad         stacked assembly with color() per part → multicolor 3MF
```

Each consumer file is intentionally thin — three lines: `include`, `$fn`, one module call. Geometry lives in the lib; consumers just pick which module to render.

## Assembly convention

Every module is centered on the world origin in its natural reference frame:

- **base()** — centered at origin; top face at `z = base_thickness/2`. The fan sits in the mating cutout on the top face, sunk by `fan_sunk_depth`.
- **base_gasket()** — flat ring centered at origin; sandwiched between base and fan.
- **fan_gasket()** — short ring centered at origin; drops into the `mating_cutout` channel on the base.
- **clamp_cone()** — cone bottom at z=0, top at `z = clamp_height`. In `fan-clamp.scad` this is offset so the clamp sits on top of a vertical skirt that drops to `z = -skirt_drop`.

Because each module renders centered, you align parts in your slicer (or in a mental model) by stacking on z. No translates in the consumer files.

## Working with the lib

`fan-mount-lib.scad` defines **everything shared** at the top:

- Fan geometry: `fan_length`, `fan_od`, `fan_wall_thickness`, `fan_sunk_depth`, `fan_taper_z_start`, `fan_taper_z_end`, `fan_taper_d_reduction`
- Plate: `base_d` (round-plate diameter), `base_thickness`, `gap` (default fit clearance)
- Base screw layout: `screw_inset` plus the perimeter position iterators
- Gasket dimensions: `base_gasket_thickness`, `fan_gasket_gap`, `fan_gasket_thickness`
- Clamp dimensions: `clamp_height` (derived from taper), `clamp_id_large`, `clamp_id_small`, `clamp_wall`, `clamp_gap`
- M5 fastener constants: `m5_passthrough_d` (5.3), `m5_bite_d` (4.2), `m5_head_d` (9.5), `m5_head_h` (3)
- Foot mounting (clamp → base): `foot_footprint`, `foot_center_r`, `foot_angles`, `foot_receiver_d`

Then helper modules:
- `airflow_cutout()`, `mating_cutout()` — for the base
- `screw_hole_positions()` — `children()`-style iterator over the 8 perimeter mount positions (M5 passthrough + counterbore)
- `screw_holes()` — punches M5 passthrough + 10.5×3mm head pocket at every perimeter position
- `foot_receiver_holes()` — places `foot_receiver_d` receivers at every `foot_angles[i] × foot_center_r` position in the base

Then the public modules: `base()`, `base_gasket()`, `fan_gasket()`, `clamp_cone()`.

## `include` vs `use`

All consumers use `include <../lib/fan-mount-lib.scad>;` — **not** `use`. The lib needs its top-level variables (`fan_od`, `clamp_height`, etc.) visible in the consumer scope, which `use` doesn't do. The lib has no top-level render calls, so `include` is safe.

## Centering and orientation

- Cylinders/cones along Z by default; explicit `center=true` everywhere.
- Holes are subtracted with `h = base_thickness * 3` (or similar overshoot) and `center=true` so they punch cleanly through without z-fighting at the surfaces.
- The base's `mating_cutout` is offset by `+base_thickness` to land on the top face — that's the only intentional non-centered geometry in the lib.

## Two-part clamp split

`parts/fan-clamp.scad` renders only the **+Y half**. The split is a top-level `intersection()` against a half-space at `y >= 0`. To get the other half, mirror in the slicer (or `mirror([0,1,0])` in a derived file). The screw cutouts in `screw_cutout()` are asymmetric across `y=0`:
- The head-side ear gets `m5_passthrough_d` (5.3) — screw passes through cleanly
- The bite-side ear gets `m5_bite_d` (4.2) — screw threads bite into plastic

So one M5 screw spans both halves: head pocket and clearance in the +Y ear, thread-bite in the −Y ear.

## Foot mounting alignment

Feet are at 8 positions around the skirt (every 45° offset by 22.5°). The base has matching 4mm receiver holes at the same `(foot_center_r × cos/sin)` positions. The clamp's foot blocks are shifted **1mm inward** into the skirt (`foot_inward_bite`) for structural bite, but the screw center stays at the unshifted `foot_center_r` so it aligns with the base receiver below.

## Build / render commands

OpenSCAD CLI for STL export:

```bash
openscad -o build/fan-mount.stl   parts/fan-mount.scad
openscad -o build/base-gasket.stl parts/base-gasket.scad
openscad -o build/fan-gasket.stl  parts/fan-gasket.scad
openscad -o build/fan-clamp.stl   parts/fan-clamp.scad
```

Smoke-test a change without writing an STL (fast, validates manifoldness):

```bash
openscad -o /tmp/test.stl parts/fan-clamp.scad 2>&1 | tail -8
```

Look at the trailing summary lines — `Simple: yes` and `Volumes: 2` (solid + air void) indicates a clean render. `Volumes: >2` means something is disconnected (tangent contact, floating fragment) and the slicer will complain.

Nix users: `flake.nix` lives one level up in [../bambu-spool-dry-box/flake.nix](../bambu-spool-dry-box/flake.nix) and provides `openscad` + `nodejs` + `zip`. Not yet wired into this folder.

## Editing rules

- **Don't redefine lib parameters in consumer files.** If a value needs to change, change it in the lib.
- **Don't add `translate()` in consumer files.** Modules render centered; positioning is a slicer concern.
- **When adding a feature, add it to the lib first, then call it from a consumer.** Avoid putting one-off geometry in consumer .scad files — they should stay 3-line entry points.
- **`m5_*` constants are the source of truth for fastener sizing.** Don't re-derive 5.3 / 4.2 / 9.5 inline.
- **Keep geometry centered.** When subtracting holes, use `center=true` and overshoot the length by 3× so the subtraction crosses both faces cleanly.

## Verifying a print before slicing

1. Render the .scad in the OpenSCAD GUI (faster preview than CLI).
2. Confirm the `Volumes` count in the trailing CLI output is exactly 2.
3. For two-part assemblies (clamp halves), mentally walk a screw through the assembly: head pocket → passthrough → bite hole. The `screw_cutout()` module in `parts/fan-clamp.scad` is the canonical example.
