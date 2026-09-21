# parametric-qr-case

A one-piece two-filament case whose pocket is driven by the dimensions of the
object it holds. No hardware, no assembly, no supports.

## File layout

```
lib/
  parametric-qr-case-lib.scad    all geometry modules + every shared parameter
previews/
  case.scad                      code-up view      → case.3mf
  plate.scad                     print orientation → plate.3mf
```

There are no `parts/` files — the case is inherently two-colour, so both
outputs are multicolor 3MFs built from `previews/`.

## Orientation convention

**The lib models the case code-up**, pocket opening toward -Z. That matters for
one reason: `qr()` renders an unmirrored code when viewed from **+Z**, so a
band on the top face needs no `mirror()`. Put the band on a downward-facing
face and you must mirror it, or the printed code comes out reversed and won't
scan.

`previews/plate.scad` flips the whole case (`translate([0,0,total_h]) rotate([180,0,0])`)
so the code lands on the build plate and the pocket opens upward. Flipping a
finished solid doesn't mirror anything — only *constructing* the code against a
-Z face would.

This is the same convention `qr-leash-tag` uses; keep them in step.

## Z stack

Bottom to top in lib coordinates, all parametric:

```
qr_z + qr_thickness  ┌──────────────┐  total_h
                     │   QR band    │  qr_thickness
qr_z                 ├──────────────┤
                     │ face         │  face_thickness
                     ├──────────────┤  pocket_h
                     │ pocket       │  object_height + fit_clearance
                     └──   open   ──┘  0
```

Pocket and outer footprints share one radius relationship:
`outer_r = pocket_r + wall`, so the wall is uniform all the way round.
`pocket_r` is clamped by `min()` against half the shorter pocket side, which
keeps `outer_r` inside its own half-side for free — the outer footprint is the
pocket plus `2 * wall` on both axes. An over-large `object_corner_r` therefore
rounds the pocket into a stadium rather than past it.

`rounded_rect()` builds those footprints as a hull of corner circles, not
`offset(square(...))`. At the clamp the offset form would be asked for a
zero-area square and hand back an empty model; the hull form gives the stadium.
It also branches to a plain `square()` at `r <= 0`, since `circle(r = 0)` is
empty and would take the hull with it.

## Two-filament split

`case_dark()` and `case_light()` partition the solid exactly: their union is
the whole case and they never overlap. `qr_polarity` decides which side of the
band each one gets:

- `Light on dark` — dark = shell minus the code cells; light = the cells.
- `Dark on light` — dark = shell minus the whole band, plus the cells; light =
  the band minus the cells.

A change to either module has to preserve the partition, or the 3MF will have
overlapping or missing geometry. The cheapest check is that
`volume(case_dark) + volume(case_light) == volume(case_shell union qr_band)`.

`qr_cells()` intersects the code with `qr_band()` so a small `qr_margin` trims
modules at the rounded corners instead of leaving them floating past the edge.

## Editing rules

- **Don't redefine lib parameters in the previews.** Change values in the lib.
- **Don't add geometry in the previews.** They place `color()` calls and
  orientation, nothing else.
- **Keep `color()` calls at the top level of the preview files.** The CLI
  multicolor builder finds the palette by scanning for them.
- **Don't add a `mirror()` to `qr_cells()`.** The band faces +Z; it's already
  the right way round.
- **The pocket is a plain prism.** Retention features (a lip, strap slots, a
  snap) are not designed yet — add them to the lib, not the previews.
