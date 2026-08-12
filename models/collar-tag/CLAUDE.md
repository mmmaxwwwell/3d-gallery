# collar-tag

A two-color pet collar tag with a pick-your-shape body (circle, hexagon,
bean), an embossed name, and a raised border edge. Prints as a single
multi-material job.

## File layout

```
lib/
  collar-tag-lib.scad      all geometry + every shared parameter
previews/
  multicolor.scad          colored body + emboss → multicolor 3MF
  single.scad              body + emboss unioned → single-color STL
```

There is **no `parts/` directory**. Each preview *is* a complete
printable tag:

- `multicolor.3mf` — two-filament print (body + accent). The `color()`
  calls at the top level of `multicolor.scad` are what the build
  pipeline scans to split geometry per filament.
- `single.stl` — single-filament print. `single()` unions `body()` and
  `emboss()` into one solid; the text and border are still physically
  raised on the top face, they just don't change color.

Both build from the same lib and share every parameter, including the
font selection.

## Two-color split (in Z, not X/Y)

- **`body()`** — the shape + ring + neck extruded to `thickness`
  (default 2.5 mm). Prints in the primary filament.
- **`emboss()`** — the border edge + name text extruded a further
  `emboss_height` (default 0.6 mm) on top of the body. Prints in the
  accent filament.

The printer swaps filament at `z = thickness` and lays down the emboss
color on top. Keep `emboss_height` a whole multiple of your layer
height (0.6 mm = 3 layers at 0.2 mm) so the swap lands on a clean
layer boundary.

## Shape modules

Every shape is 2D, centered on the origin, and `size_mult`-scaled:

- **`circle_shape()`** — `base_circle_d` diameter (30 mm × mult).
- **`hex_shape()`** — flat-top hexagon, `base_hex_d` flat-to-flat
  (32 mm × mult). Uses `$fn=6` on `circle()` so flats land on Y and
  vertices on X naturally, no rotate needed.
- **`bean_shape()`** — hull of two overlapping circles with a top
  indent subtracted. Kidney-bean silhouette generated parametrically
  in OpenSCAD; no SVG file, no `import()`. The WASM customizer's
  virtual FS doesn't carry `.svg` files, and CSG bakes identically in
  both the CLI and WASM pipelines.

`body_shape()` dispatches on the `shape` param — extend it by adding a
new `else if` branch and a matching entry in the enum comment.

## Ring integration

The ring is a separate `translate() difference() { circle(od); circle(id); }`
unioned into `body_2d()`. It is deliberately **embedded** in the body,
not perched on top: `ring_center_y() = shape_top_y() + ring_id/2 - 0.5`
puts the bottom of the ring hole 0.5 mm inside the shape's top edge,
which means the ring's outer boundary is anchored ~3 mm deep into the
body material for the default `ring_od=10 / ring_id=5`. Only the hole
and the top rim of the ring stick above the body — a pull on the
collar's split ring is resisted by 3 mm of body material, not by a
thin bridge.

`shape_top_y()` for the bean uses the **effective** top at x=0 (the
floor of the indent, `bean_indent_y - bean_indent_r = 9`), not the
bounding-box top. Without that, the ring would center on the lobes'
peak Y and float over the concave indent at x=0.

A rectangular `neck` still bridges body and ring at x=0 as
belt-and-suspenders — it fills any remaining gap for the bean and
costs nothing on the convex shapes. The neck stops at
`ring_center_y() - ring_id/2` so it doesn't fill the ring hole itself.

`edge_border_2d()` uses `body_shape()` alone (not `body_2d()`) so the
border wraps only the tag body — not the ring, not the neck. Otherwise
the accent color would ring the loop and obscure the hole.

## Font selection

`font_style` is a friendly-labeled enum (`Sans Bold`, `Sans`,
`Serif Bold`, `Serif`, `Mono Bold`, `Mono`) mapped to real OpenSCAD
font strings by a ternary chain (`text_font = font_style == "..." ? ...`).
Only fonts shipped by the WASM bundle are exposed — currently the
Liberation family (metrics-compatible with Arial / Times New Roman /
Courier New). Adding a new option means: (a) new label in the enum
comment, (b) new branch in the `text_font` ternary, (c) confirming the
font's `.ttf` is in `openscad-web-generator/wasm/openscad.fonts.js` or
it won't render in the customizer.

Because the injected `font_style = "..."` line lands at the end of the
source and OpenSCAD uses the last assignment for a variable in scope,
`text_font` picks up the injected value even though its definition
appears earlier in the file.

## Text sizing and clipping

`text_2d()` is intersected with `offset(r = -(edge_inset + edge_border
+ 0.4)) body_shape()` — this **clips** the text to the safe area
inside the border. Long strings shrink into that area instead of
crashing the edge or hanging off the shape. `text_size()` is a
shape-specific fraction of the base footprint so text scales with
`size_mult`.

## External library dependency

The lib uses [`BOSL2/std.scad`](https://github.com/BelfrySCAD/BOSL2)
via `include <>`. The gallery's Nix devshell provides it; the WASM
customizer loads it via `addBOSL2` in `openscad-worker.ts`.

## `include` vs `use`

Consumers use `include <../lib/collar-tag-lib.scad>;` — the lib has
top-level parameters that the preview needs visible in its scope, and
the lib has no top-level render calls, so `include` is safe.

## Editing rules

- **Don't redefine lib parameters in `previews/multicolor.scad`.**
  Customizer values live in the lib's `BEGIN_PARAMS` block.
- **Don't `translate()` in the preview.** `body()` and `emboss()` are
  already registered in Z (emboss stacks on top of body).
- **Keep `edge_border`, `edge_inset`, `neck_width` fixed.** They're
  print-quality constants, not size-scaled — scaling them with
  `size_mult` would make small tags look chunky and large tags look
  spindly.
- **When adding a shape**, also add a case to `shape_top_y()`,
  `text_size()`, and `text_y_offset()` — the ring position and text
  layout are shape-specific.

## Build / render

```bash
# quick single-color preview in the OpenSCAD GUI (opens the lib and
# renders tag(); no CLI flags needed)
openscad models/collar-tag/lib/collar-tag-lib.scad
```

The gallery's `scripts/build-models.mjs` runs
`scripts/build-multicolor-3mf.mjs` for the `assembled.3mf` entry,
which scans top-level `color()` calls and emits one mesh per color
into a single multicolor 3MF.
