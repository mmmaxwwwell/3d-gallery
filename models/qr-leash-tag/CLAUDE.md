# qr-leash-tag

A one-piece two-filament QR tag that threads onto leash webbing. No hardware,
no assembly, no supports.

## File layout

```
lib/
  qr-leash-tag-lib.scad    all geometry modules + every shared parameter
previews/
  tag.scad                 code-up view      → tag.3mf
  plate.scad               print orientation → plate.3mf
```

There are no `parts/` files — the tag is inherently two-colour, so both
outputs are multicolor 3MFs built from `previews/`.

## Orientation convention

**The lib models the tag code-up**: z = 0 is the back face, the QR band is the
top `qr_thickness` of the solid. That matters for one reason — `qr()` renders
an unmirrored code when viewed from **+Z**, so a band on the top face needs no
`mirror()`. Put the band on a downward-facing face and you must mirror it, or
the printed code comes out reversed and won't scan.

`previews/plate.scad` flips the whole tag (`translate([0,0,total_h]) rotate([180,0,0])`)
so the code lands on the build plate. Flipping a finished solid doesn't mirror
anything — only *constructing* the code against a -Z face would.

## Z stack

Bottom to top, all parametric:

```
qr_z + qr_thickness  ┌──────────────┐  total_h        5.5
                     │   QR band    │  qr_thickness   1.0
qr_z                 ├──────────────┤                 4.5
                     │ solid        │  front_thickness 0.5
                     ├──────────────┤                 4.0
                     │ webbing slot │  leash_thickness 3.0
                     ├──────────────┤                 1.0
                     │ back face    │  back_thickness  1.0
                     └──────────────┘                 0.0
```

`body_size = leash_width + 2 * wall` drives both X and Y — the tag stays square
so the code stays as large as the strap allows.

## Two-filament split

`tag_dark()` and `tag_light()` partition the solid exactly: their union is the
whole tag and they never overlap. `qr_polarity` decides which side of the band
each one gets:

- `Light on dark` — dark = shell minus the code cells; light = the cells.
- `Dark on light` — dark = shell minus the whole band, plus the cells; light =
  the band minus the cells.

A change to either module has to preserve the partition, or the 3MF will have
overlapping or missing geometry. The cheapest check is that
`volume(tag_dark) + volume(tag_light) == volume(tag_shell union qr_band)`.

`qr_cells()` intersects the code with `qr_band()` so a `qr_margin` of 0 trims
modules at the rounded corners instead of leaving them floating past the edge.

## Edge rounding

All twelve edges are rounded, from two parameters: `corner_r` for the four
vertical edges and `edge_r` for the eight around the top and bottom faces.
`body_solid()` gets both in one pass — `corner_r` goes into the 2D footprint
(`body_profile()`, a BOSL2 `rect()` path), and BOSL2's `offset_sweep()` extrudes
that footprint with an `os_circle` fillet at each end. The sweep keeps the outer
dimensions exact: z spans 0 to `total_h` and the footprint still measures
`body_size` across, so nothing downstream had to move.

`body_profile()` is a **function returning a path**, not a module — `offset_sweep`
needs a path, and a `hull()` of corner circles can't produce one. That's why the
footprint is BOSL2's `rect()` rather than a hand-rolled rounded rectangle.

`body_e` clamps `edge_r` to `total_h / 2 - 0.01`; past that the two fillets meet
and the sweep inverts. At or below 0 `body_solid()` falls back to a plain
`linear_extrude`, because `os_circle(r = 0)` is degenerate.

**`qr_band()` must stay a slice of `body_solid()`.** It is the intersection of
the body with a slab above `qr_z`, which is what makes the band — and the code
cells clipped to it — follow the rounded crown. Rebuilding it as its own
`linear_extrude` of the footprint, which is what it used to be, puts a
square-edged band back on top of a rounded body: geometry poking out through
the crown, and a two-filament split that no longer partitions the solid.

`edge_r` defaults to 0.5 mm against a `qr_margin` of 1 mm, so the code sits
wholly inside the flat part of the face. Raise `edge_r` past `qr_margin` and the
outermost modules start curving over the rim — the tag prints QR-face-down, so
that is the face on the build plate.

## Editing rules

- **Don't redefine lib parameters in the previews.** Change values in the lib.
- **Don't add geometry in the previews.** They place `color()` calls and
  orientation, nothing else.
- **Keep `color()` calls at the top level of the preview files.** The CLI
  multicolor builder finds the palette by scanning for them.
- **Don't add a `mirror()` to `qr_cells()`.** The band faces +Z; it's already
  the right way round.
- **Keep the two-filament partition exact** after any geometry change. Cheapest
  check: render `tag_dark()`, `tag_light()` and `tag_shell()` and confirm the
  first two volumes sum to the third.
