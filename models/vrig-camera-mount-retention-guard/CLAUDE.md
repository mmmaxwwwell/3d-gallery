# vrig-camera-mount-retention-guard

A rectangular 64D TPU sleeve, open top and bottom, that wraps the
VRIG AC-91 magnetic quick-release adapter's camera/mount interface to
constrain the joint against side impacts.

## File layout

```
lib/
  vrig-camera-mount-retention-guard-lib.scad   all params + guard() module
parts/
  guard.scad                                    3-line: include, $fn, guard()
```

No `previews/` — the model is a single-color part, so no multicolor 3MF
is generated. The STL renders directly in the viewer.

## Geometry

- **Inner cavity**: `[inner_w, inner_d, height]` = `[39, 16.9, 10.5]` mm.
  Sized to match the object exactly — 64D TPU flexes enough on install
  to give a friction fit without a separate clearance allowance.
- **Outer body**: inner + `2 * wall` on each side. Vertical corners
  rounded at `outer_corner_r` (2.5 mm) via BOSL2 `cuboid()`. Top and
  bottom edges are **sharp** (no fillet) — a previous version used
  `minkowski()` with a small sphere for an all-edge fillet, but in
  the current OpenSCAD/Manifold (2026.02.25-unstable), sphere($fn=16)
  poles sit at ~0.98·r rather than exactly r, so the outer top/bottom
  came up ~0.012 mm short of `height/2`. That caused features
  anchored to `height/2` (long-side inner bumps) to poke past the
  outer body. Exact geometry > tiny cosmetic fillet.
- **Inner cavity** rounds only the four vertical corners at
  `inner_corner_r` (1 mm) and cuts cleanly through top and bottom
  (height + 0.2 mm bump).
- **Long-side inner bumps**: two raised pads on the *inside* of the
  ±Y long walls, `inset_length × inset_height × inset_depth`
  = 23 × 4.2 × 0.3 mm, centered on X, top flush with the sleeve's top
  edge. They protrude into the cavity (union with the wall), not
  pockets cut into the outer face. Implemented as cuboids overlapping
  the wall by `slop` so the union fuses without coincident-face
  artifacts. The wrapped object has matching recesses that engage
  these bumps for lateral retention.
- **Long-side bottom chamfers**: 45° chamfer added at the interior
  bottom edge of each long wall, matching a chamfer on the wrapped
  object's bottom long edges. `chamfer_face` (1.25 mm hypotenuse) →
  legs of `chamfer_face / sqrt(2)` (~0.884 mm) each. Implemented as a
  triangular prism *added* to the interior (union, not difference)
  then translated outward by `chamfer_slop` (0.2 mm) so the sleeve
  chamfer doesn't press directly against the object's chamfer — 0.2 mm
  of clearance for tolerance. Spans the main cavity X range
  (`inner_w` long); does not extend into the short-side pockets since
  those are outside the chamfer's Y range.
- **Short-side bumpouts** (asymmetric wall + interior pocket):
  `outer_w = inner_w + 2*wall + 2*bumpout_depth` = 48 mm. The short
  walls become 4.5 mm thick uniformly. On each short wall a
  `bumpout_width × bumpout_depth × height` = 10 × 2.5 × 10.5 mm pocket
  is cut, extending the interior cavity outward and leaving 2 mm of
  material on the pocket's outer face — matching the wall thickness
  everywhere else. Note: an earlier attempt tried a *localized* 10 mm
  exterior bumpout with a matching 10 mm interior cutout; that
  disconnects the ear from the main body (the interior cutout eats
  through the exterior bumpout's ±Y walls, leaving a floating outer
  wall — Manifold reported genus -3 = 4 disconnected pieces). Uniform
  short-wall thickening avoids that failure mode.

## Print orientation

Stand the part upright (open axis vertical, 10.5 mm tall). First layer
is a small rectangular frame, walls print straight up with no
overhangs. 64D TPU: standard slower first-layer settings, no brim
needed for this footprint.

## Editing rules

- **Change dimensions in the lib**, not in `parts/guard.scad`. The
  consumer stays three lines.
- **Don't add clearance to `inner_w` / `inner_d`.** They match the
  object being wrapped. The TPU material choice is the fit strategy —
  changing the geometry breaks that.
- **Wall thickness is 2 mm** because 64D TPU walls thinner than that
  buckle on install. Don't drop below without re-testing.
- **`outer_corner_r` must be > `edge_r`.** The lib subtracts `edge_r`
  from the cuboid rounding before the minkowski, so a smaller
  `outer_corner_r` would go negative.

## Build / render

```bash
openscad -o build/guard.stl parts/guard.scad
```

Or via the gallery pipeline:

```bash
npm run build:models
```
