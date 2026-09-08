# et300-knob-aide-knurled

Diamond-knurled cap for the Educator Mini ET-300 intensity knob.
Customizable via the WASM customizer.

## File layout

```
assets/
  logo.svg                             Kanix logo (source vector; the runtime
                                       geometry lives baked in lib/logo-polygon-data.scad)
lib/
  et300-knob-aide-knurled-lib.scad    all params + public modules
  logo-polygon-data.scad               `logo_points` + `logo_paths` — used by
                                       `_logo_2d()` via `polygon()`, so the WASM
                                       customizer doesn't need the SVG in its FS
parts/
  tactile-aide.scad                    → tactile-aide.stl          (parametric, customizable)
  tactile-aide-engraved.scad           → tactile-aide-engraved.stl (logo recess)
  tactile-aide-kd{2_0..5_0}.scad       → seven fixed-knurl_depth variants,
                                         one file per 0.5 mm step from 2.0 to 5.0
  knurl-depth-grid.scad                → knurl-depth-grid.stl (4×2 comparison plate)
previews/
  tactile-aide-multicolor.scad         → tactile-aide-multicolor.3mf (logo in different
                                         color; customizable — re-renders live in the
                                         WASM customizer)
```

The seven fixed variants pass `kd = X` to `tactile_aide()`; the parametric
one takes no argument and picks up whatever `knurl_depth` is set (either
the file-scope default or a customizer override). Same pattern for the
grid — it loops through a `_depths` list and calls `tactile_aide(kd=…)`.

## Public modules

All three take optional `(kd = knurl_depth, bo = knurl_base_offset)` so the
customizer can render them at any override values. The base cylinder radius
is `outer_diameter/2 - bo` (independent of `kd`); bumps rise `kd` above that
base, reaching `outer_diameter/2` exactly when `kd == bo`. If `kd > bo` the
bump tips get clipped flat by the fillet at `outer_diameter/2`.

- **`tactile_aide(kd, bo)`** — plain cap, no engraving.
- **`tactile_aide_engraved(kd, bo)`** — cap with the logo engraved as a
  shallow recess in the top face.
- **`logo_inlay(kd, bo)`** — just the logo piece that fills the engraving,
  clipped to the disc's outer profile. Used by the multicolor preview so
  the recess can be printed in a contrasting filament.

## Internal helpers

- **`_knurl_bumps()`** / **`_diamond_bump()`** — staggered-grid diamond
  bumps unioned onto a smaller base cylinder. See lib comments for the
  ≤ 45° face-angle rationale.
- **`_cutouts_3d()`** — two stacked subtracts: the "circle + plus" bore
  and the wider bottom pocket.
- **`_bottom_fillet_radius()`** — auto-caps the bottom edge fillet so the
  outer rim of the disc still touches z=0 given the current cutouts and
  outer_diameter. Otherwise a large user-set `fillet_radius` combined with
  the pocket + cross-plus reach eats every last mm of z=0 material and
  the slicer refuses to print ("empty first layer").
- **`_filleted_disc()`** / **`_fillet_profile_2d()`** — outer fillet
  bounding solid. Explicit polygon (arc + straight segments) rather than
  `offset(r=+f) offset(r=-f) square()` because that idiom produces
  near-axis vertices that crash rotate_extrude → CGAL in the customizer.
- **`_logo_solid()`** / **`_logo_2d()`** — the extruded logo. Uses
  `polygon(points = logo_points, paths = logo_paths)` from
  `lib/logo-polygon-data.scad` rather than `import()` on the SVG so the
  WASM customizer works without injecting the asset into its filesystem.
  Y-axis is flipped so the logo reads right-side-up (source SVG is y-down).

## Editing rules

- **Change values in the lib**, not in the thin part/preview wrappers.
- If you regenerate `lib/logo-polygon-data.scad` (e.g. re-tracing the SVG),
  re-measure the bbox and update the `logo_bbox_*` constants in the lib —
  they're in the polygon data's own coordinate space.
- The multicolor preview is wired into the customizer via `CUSTOMIZABLE_SOURCES`
  in `src/main.ts`. The customizer concatenates `logo-polygon-data.scad` +
  (lib with its `include` stripped) so the WASM sees a single
  self-contained source. When adding new preview keys, add both the
  `module` field in the manifest entry and the corresponding stripped-source
  entry in `CUSTOMIZABLE_SOURCES[...].previews`.
