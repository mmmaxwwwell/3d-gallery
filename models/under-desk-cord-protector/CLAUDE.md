# under-desk-cord-protector

An extruded-profile cord cradle for the underside of a desk. The J
profile is the **cross-section**; it is extruded along the desk width.
Segments chain end to end through a rib-and-groove joint.

## Coordinate system

Authored in **print orientation**, so the part as rendered is the part
as sliced:

- **Z** — along the desk width, and the print-up axis. `[0, 154]`
  (body `[0, 150]`, rib `[150, 154]`).
- **Y** — vertical as installed. `[0, 160.4]`; the **desk underside is
  the top face** at `y = part_height`.
- **X** — depth out from the wall. `[0, 144.91]`; the wall's outer face
  (against the desk edge) is `x = 0`, its inner face `x = material_thickness`.

Internally the profile is built in a *raw* frame with the desk face at
`y = 0` hanging into `-y` and the wall inner face at `x = 0`, because
that is the frame the tangent-circle math is natural in. `segment()`
applies the single `translate([_t, part_height, 0])` that moves it into
the octant above. **Every `_`-prefixed module is in the raw frame; only
`segment()` and `run()` are in the final frame.**

## Profile

The straight drop is **tangent** to the arc circle: the arc centre sits
at `[_r_in, -drop_height]`, one inner-radius inboard of the tangent
point, so there is no kink where the two meet. Material lies on the
**outside** of that circle — `arc_inner_diameter` is the concave face
cords rest on, not the centreline and not the outside.

The sector is an explicit `polygon()` built from `arc_facets` samples
(outer arc forward, inner arc back). No BOSL2 sweep, no `rotate_extrude`
— nothing new to keep in sync between the CLI and WASM paths.

`part_height` and `part_depth` are derived from those same sample
points plus the tip round, so they stay exact when any parameter
changes. If you add geometry that extends the bounding box, extend
those two expressions too or `segment()` will no longer sit on the
origin.

## Joint

Rib on the `+Z` end face, groove on the `-Z` end face, both generated
by `offset()` on the profile itself:

- rib = `offset(delta = -_rib_inset)` → 3 mm wide, 4 mm proud
- groove = `offset(delta = -_groove_inset)` → 3.4 mm wide, 4.5 mm deep

Eroding the same region by two different amounts gives two bands on the
**same centreline**, which is why the fit is concentric for free at any
thickness. Keep it that way — don't hand-author a separate rib profile.

Groove on the bed end, rib on top, deliberately: a rib on the first
layer would put only a 3 mm-wide trace on the bed.

## Screw recesses

The screws go through the vertical wall itself — no bosses, nothing in
the cord channel. Each one is `_screw_recess`, a round bore on an axis
that crosses the top face on the wall's centreline and leans inboard
from there, stopping `screw_head_grip` short of that face, plus
`_screw_hole`, the shank clearance on the same axis through the lip that
is left. Both come off `_screw_axis_cut`, so they cannot drift apart.

The tilt is what makes it fit. Square to the desk, a 6-7 mm head all but
fills an 8 mm wall and there is no thickness left to wrap a pocket
around; leaning the axis `screw_tilt` toward the arc centre keeps the
outside face solid (1.7 mm at the defaults) and lets the bore break out
of the *inside* face instead, a couple of mm below the seat. That
opening is how the head gets in and how the driver reaches it, on the
screw's own axis.

`_seat_axial` is derived, not chosen: the seat is square to the axis so
the head bears flat, which means its uphill edge is the thinnest point
of the lip, so the seat has to sink further than `screw_head_grip` to
leave that much plastic. Change the tilt and it follows.

It prints in this orientation with no supports: the bore is a round gap
in a Z band, so the lip above it stays a continuous rail along the
print-up axis and never starts a layer in mid-air.

`_screw_z()` puts the outer screws `screw_edge_inset` in from each end
and spaces any others evenly between them. `_screw_inset` clamps that
so no recess can reach the groove at the -Z end or the rib at +Z.

## Prop

`prop_beam()` / `prop_panel()` / `prop_screen()` are the same profile at
three widths, the last one perforated. The profile carries the cradle's
own circle — same centre, same two radii — from `_arc_a1` (the tip) to
360°, which lands the pair on a true half circle since the cradle starts
at 180°, and then rises straight to the desk. At 360° the shell is
already running vertically, so the riser leaves the curve tangentially;
that is why the sweep stops exactly there and not at some prettier
number. The shared centre is the rest of the trick: nothing is
hand-fitted, so any change to `arc_inner_diameter`, `material_thickness`
or `drop_height` moves both halves together.

The joint is a bolted **half-lap on the honeycomb**, cut in 3D rather than
in the profile, because its boundary is the lattice. It is exactly one
lattice column wide, centred on the bolt: across that column the cradle
keeps the inner half of the shell and the prop the outer half, and either
side of it one part stops and the other is full thickness. Both cuts come
from `_hex_band`, which lays cells grown to the full pitch — grown that
far they tile with no wall left between them, so the boundary of a run of
them follows the honeycomb. The cradle's bands are grown a further
`prop_join_gap`, and that difference is the clearance between the two
parts.

Three traps, all of which have already bitten:

- A cell that opens out with the radius (`_hex_slice(..., rad = true)`)
  gives a true radial hole, but **cones only tile in z at the radius they
  were drawn for**. Bands must stay prismatic, and carry `_hex_arc_grow`
  — the tangential shortfall at the outer face — instead.
- Grown cells tile *exactly*; `_hex_weld` nudges them past each other so
  neighbouring cuts overlap rather than meet on a shared face.
- `_hex_band` and `_hex_grid` take their z anchor as an argument. A
  narrow prop anchors on its own single bolt, not on `_screw_z(0)`, or it
  only fits where its lattice happens to line up.

`_prop_bolt_a` is shared: the prop's M5 clearance and the cradle's
`_prop_pilot` are generated from it at the same Z, so they are coaxial by
construction. The pilot is `prop_m5_pilot` (M5 root diameter) straight
through the 4 mm tongue, so the screw cuts its own thread. The stack is
`_t` total — half lap, half tongue — which is what fixes the screw at
M5 × 8; a 10 mm screw would stand proud inside.

Props are rendered in the installed frame, not moved to the origin.
Z still starts at 0, which is all the bed cares about, and it means
`previews/propped.scad` can place them with no fitting maths.

## Honeycomb

`_hex_at_u` places one opening at unrolled distance `u` — down the wall, round
the arc, up the riser — and `u` is **one coordinate for the whole tube**, shared
by the cradle and the prop. Each part only cuts where it has material, so the
pattern runs through the joint with no seam and no bookkeeping.

The lattice is anchored twice over. Rows land on the screw lines —
`_hex_rows_dz` rounds rows-per-screw-pitch to an **even** number so every screw
row falls on the same side of the stagger, which is what puts every bolt in the
same cell. The phase in u is set by the **desk end**, not the joint: `_u_first`
puts the first column as close under the desk face as `prop_screen_wall` of
rail allows, and `_u_bolt` then takes the nearest column to `prop_bolt_inset`.
That order matters — the rail is structural, the bolt's exact position is not.
`prop_screen_flat` is nominal; the lattice rounds it and `_hex_flat` is what
gets cut.

`_hex_grid` fills — leaves solid — only the cells that carry a screw: anything
within `_hex_recess_u` of either desk face, on a screw line. Everything else is
open, right out to the ends, and every run ends on whole cells because the
parts themselves end on the lattice.

The joint column is a `kmin`/`kmax` exclusion, not a fill rule: **neither part
opens a cell there.** The boundary runs down the middle of those cells' webs,
and a 3 mm web split two ways, less `prop_join_gap` and `_hex_arc_grow`, leaves
each part about a millimetre — too thin to stand up in a print. Solid, each
part gets a honeycomb-edged tongue half a column wide with the bolt through it.

`_u_bolt_max` is the other half of that: the bolt column has to sit far enough
back that the cradle's furthest tooth — half a column plus half a grown cell
beyond the bolt — still has shell under it. Push it out past that and the teeth
get clipped by the tip into exactly the slivers this is all avoiding.

## Editing rules

- The `BEGIN_PARAMS` block is the customizer's contract. New params go
  inside it with `//` help comments above; derived values go below.
- Every file in `parts/` is a three-line wrapper — geometry goes in the
  lib.
- `previews/assembled.scad` keeps its `color()` calls at the **top
  level**; the multicolor 3MF builder regex-scans the preview file.
- Don't make the drop non-tangent to the arc. The whole point is a
  continuous inner surface for the cord to ride.
- Don't square the screw axis up to the desk unless the wall gets
  thicker than the head — the tilt is what keeps the outside solid.
- Don't let the prop's profile drift off the cradle's circle. Both come
  from `_arc_c` and the same two radii, and that is why they mate.
- Don't re-centre the honeycomb. It is anchored on the bolt on purpose;
  centring it would drift the screws off the lattice.
- Don't move `_prop_bolt_a` or the prop's Z spacing without the cradle's
  pilots following — they are the same expression on purpose.
- `_screw_recess` / `_screw_hole` take the axis X so the wall and the prop's
  riser share one construction. The tilt is the same either way; which face it
  breaks out of depends only on which side of the tube the part is.
