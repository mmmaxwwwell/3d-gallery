# folding-panel-divider

A print-in-place accordion divider: N flat panels chained by BOSL2 knuckle hinges, emitted already folded. One printable part (`strip`), one preview (`plate`). Fully customizable via the WASM customizer.

Ported from `~/git/3d/divider/divider3.scad` (Sept 2024). At the default parameters the geometry is identical to that file — same vertex set, same triangle count, same bounding box.

## File layout

```
lib/
  folding-panel-divider-lib.scad   all params + geometry modules, no top-level render
parts/
  strip.scad                       include + $fn + strip()   → strip.stl
previews/
  plate.scad                       two strips, 2 colors      → plate.3mf
```

## Local coordinate frame

`_panel()` builds one panel centred on the origin. **The fold axis is local X, not Z** — this is the single fact everything else depends on:

| Local axis | Extent | Meaning |
| --- | --- | --- |
| X | `panel_height` | along the hinge lines — the fold axis |
| Y | `panel_width` | across the panel |
| Z | `panel_thickness` | face to face |

Hinges sit on the ±Y edges (outer half at −Y on the +Z face, inner half at +Y on the −Z face). Snap joiners sit on the ±X edges, spread along Y by `ycopies`.

`strip()` stacks panel *i* at `Z = panel_thickness * i`, turning every other one 180° about Z so the hinges alternate edges, then rotates the whole stack 90° about Y. That maps local X → world Z, so the fold axis ends up vertical: the strip stands on the bed with every hinge bore pointing up. **That is the whole reason for the orientation** — a bore along Z prints round without support. Don't "helpfully" lay the part flat.

## `panel_height` vs `panel_width`

`divider3.scad` used `width` for local X and `height` for local Y, then swapped them at every site that mattered: the hinge's `length`, both relief-cut positions, the pin's Y position, both joiner X offsets, and the joiner count. Every one of them cancelled out because the panels were square, so the file only ever worked at `width == height`.

This port renames local X to `panel_height` (it *is* the standing height) and local Y to `panel_width`, and uses each consistently. Non-square panels now work — verified at 240 × 160, where the original put the joiners in the middle of the panel and hung them 40 mm off each side.

If you touch a dimension in the lib, work out which axis it is from the table above rather than from the name of the nearest variable.

## Public modules

- **`strip(top, bottom)`** — one folded strip. `top` / `bottom` are optional per-instance overrides of the `top_joiners` / `bottom_joiners` params; `undef` (the default) falls through to the param. **This is the only supported way to vary a strip's joiners** — never redefine a param in a preview file to do it, or the customizer's checkbox for that param silently stops working on that preview.

Internal helpers (leading underscore — not stable API):

- **`_panel(first, last, odd, top, bottom)`** — one panel with its hinge halves and joiners. `first`/`last` suppress the hinge on the end that has no neighbour; `odd` is `i % 2`.
- **`_joiner_row(odd, top, n)`** — places `n` joiners along one X edge. Takes children so the clearance cut and the joiner body share one placement path; keep it that way.
- **`_hinge(inner, knuckle_pitch)`** — the `knuckle_hinge` call and its bore-diameter choice.

## Pin fit

Three constants, not params, because only their relationship matters:

```
pin_bore_fixed (1.5) < pin_diameter (1.65) < pin_bore_free (2.0)
```

The fixed half's bore is undersized so the printed pin fuses to it; the free half's is oversized so it turns. Break the ordering and the hinge either seizes solid or has no pin at all. If these ever need to be adjustable, add **one** param (a fit clearance) and derive the bores from it — don't expose three independent diameters.

## Render cost

`_panel()` is `render()`-wrapped and rounds its body with `minkowski(cube, sphere)`. That is the expensive operation in the model: a plate is ~10 s and ~180 k triangles at `$fn = 40`. Raising `$fn` or `num_panels` scales it roughly linearly. Don't replace the minkowski with `offset()`/hull tricks without re-fingerprinting — it changes the mesh.

## Editing rules

- **Don't** redefine any param in consumers — the lib owns them. `parts/strip.scad` stays three lines, and `previews/plate.scad` stays top-level `color()` calls.
- **Don't** reorient `strip()`. The 90° rotate about Y is what stands the bores up; anything downstream that wants a different pose does it in the preview.
- **Don't** couple the joiner geometry to `panel_height`. Joiners spread along Y, so their count comes from `panel_width`.
- **Do** keep `_joiner_row()` the single placement path for both the clearance cut and the joiner body — they have to land in exactly the same place.
