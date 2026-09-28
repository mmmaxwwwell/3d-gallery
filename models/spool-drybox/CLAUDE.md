# spool-drybox

A sealed single-spool dry-box module. `devOnly: true`. Printed on a
Snapmaker U1 (270 mm cube, tool changer), so a part and its 75A TPU
gasket print together.

On 2026-09-26 the rollers came back, based on filament-spool-roller's
one-lane build: its `roller()` and 608s. Each runs in an ear (the user
called them "mouse ears") on both walls. Its axle is a peg moulded into
the wall, and an ear plate closes the ear round. The lid moved to span the
whole top, because a 200 mm spool can't pass through anything narrower
than about 157° of the ring.

On 2026-09-27 the lid became a hinged lid that opens diagonally (the
user's words: "open diagonally, as soon as you can after the first
roller"). A third roller in a new top ear rests on the spool. It has no
spring yet: the user wants the ear there "so we can mess with it later".
A draw latch at the front holds the lid shut. For the seal where the
cut crosses the walls, the user chose to widen the lane for an inward lip
over a thin TPU edge strip or lapping lid caps. For the latch, they
chose over-centre over a plain snap hook.

The previous square-box design (floor, flat walls, blistered panels,
lid, rollers on pegs) was replaced on 2026-09-25. A copy is in
`.cache/spool-drybox-before-drum/`, which is gitignored and never
committed.

## Construction (what the user asked for)

- Two round walls, radius ≈ spool + `spool_clearance` + `wall_thickness`
  (3 mm: "trust me, we'll reinforce later"). Round the ring from the top:
  **top ear, lid front panel, (cut), front ear, underneath panel, rear
  ear, back panel, (cut), lid back panel.**
- **The cut.** A plane through the axis at `cut_angle`, where the front
  ear's fillet meets the ring, and 180° round at the back. The lid is
  everything on the top/front side of it: both walls' tops (`_disc(1)`),
  the top ear, its plate and roller, and the two lid panels. The base is
  the rest (`_disc(-1)`, etc.). Because the cut goes through the axis, the
  opening is a full diameter, and every panel end on it is radial, like
  the seams.
- **The walls sit wider than the lane.** `wall_in` = lane + `_cut_face` −
  `wall_thickness`, so a lip (`_wall_lip`) inward along the cut, down to
  the lane, gives the cut's groove its full `_cut_face` width. The pegs'
  shoulders are that much longer (`peg_body`). The rollers stay
  spool-width, and the module is ~76 mm wide.
- **Ears.** The rollers sit at 180 ± `roller_angle`, `roller_d` =
  spool_r + roller_r from the axis, so the spool rests on them centred.
  Each wall's outline is the ring plus an ear of `ear_r` round each
  roller, joined by `ear_fillet` fillets. The ears are also the feet
  (`axis_z` is the lowest point of the outline).
- **Pegs are moulded into the walls** (`_peg()`): a shoulder that holds
  the bearing's inner race off the wall, and a shaft through the
  bearing. They print standing up off the wall's inside face. The user
  asked for this. The old "no pegs in walls" rule applied to the square
  box.
- **Ear plates** close each ear: a short stub of ring at each end, flared
  and cut square so the panels' seam TPU meets them like any end, then
  the fillets and the ear. Both ears take the same part (`ear_plate()`,
  roller axis on the origin). They have plain ends and no TPU.
- **Hinge** at the back end of the cut, at `hinge_s` on its line just
  outside the walls. The back panel carries a knuckle below mid-width and
  the lid's back panel one above, each webbed into its panel's land on
  its own side of the cut. The lid back panel prints upside down, so its
  knuckle starts on the bed. One M3 × 40 goes in from the lid's end.
- **Latch** at the front end: a lever on a lug off the front ear plate,
  and a link pinned to the lever that hooks a keeper off the lid's front
  panel. Everything is a profile in the cut's (s, t) plane, extruded
  along the axis (`_in_cut()`), so the lever and link print flat and the
  lug and keeper print on end with their panels. Shut, the link's pin is
  `lever_overcentre` past dead centre, so the pull holds the lever
  against a post on the lug. The lever's tip is asserted off the table.
  Opening is `_lever_swing(+)`.
- **Front ear plate** stops at the cut (the user: "terminate instead of
  making that last corner"). It is the ear plate ∩ the base's half, plus
  a cut land, the groove and the lug. The top and rear ears share
  `ear_plate()`.
- Screws go **straight through the middle of the TPU channel** (the user
  was emphatic). The pad round each screw is pilot-sized, so the screw
  threads through the TPU.
- Where the 3 mm won't hold the seal, parts flare and step outward, never
  into the spool's space. Each panel flares at 45° to `seal_land` (the
  ridge's base, 4.2) along all four edges, and gets a boss round every
  screw pilot. Each wall has a rib inside it under the panel edges, deep
  enough for the gland, `seal_skin` and a counterbore. The rib starts
  just inside `ring_r`, clear of the spool's rim, and the wall's rim
  grows to `disc_r` to hold it.

## The outline

Everything that follows the walls' outline is built from one chain of arcs,
`_wall_chain`: `[centre, radius, from, to, side]`, anticlockwise in the
ring's frame. Side +1 is a ring or ear arc, and −1 is a fillet with the
inside away from its centre. Neighbouring arcs are tangent, so:

- `_outline(o)` is the outline offset by `o` exactly (each radius ±`o`).
  The wall's plate and rib are polygons of it.
- `_arc_sweep(arc)` rotate-extrudes a (u, z) section along one arc, with u
  out from the inside of the panels. The groove, the gasket and the ear
  plates' section (`_panel_section`) are swept along the chain. The joints
  are coplanar because the tangent points sit on the line of centres.

`_ear_arcs(phi)` is the one place an ear's geometry is solved. Don't
build the ear from 2D `offset()`s, because the groove and ridges have to
match it arc for arc.

## Frames

Y is the spool axis, X front, Z up. Angle `a` runs round the axis from
straight up toward the front. Parts are drawn in the ring's local frame
(`_on_axis()`: local Z = world Y, phi = a − 90). A panel is drawn from
phi = 0 to its span, standing on its −Z edge, which is its print pose.
Walls print on their outside face. The left wall is the right one
mirrored, because front and back aren't symmetric.

## Seals

One section, `_ridge_2d` / `_groove_2d` / `_gasket_2d`, in (u, v) with
the TPU part on v < 0. The walls hold the TPU and the panels carry the
ridges. Every TPU channel then opens upward or sideways as printed,
never onto the bed. **Change the seal there, never per part.**

Seams: every panel end facing an ear plate holds TPU (`_seam_gasket`: a
channel plus a tip-wide column `joint_fit + gasket_squeeze` proud), so
the ear plates can have plain ends.

The cut has no screws. `_cut_seal(kind, e)` runs the same section round
a rounded rectangle in the cut's plane (`_loop_*`). Its short sides cross
the panel ends' lands (`_cut_land`, `_cut_face` wide) and its long sides
run along the walls' lips. The base holds the groove and TPU, and the lid
has the ridge, grown by `joint_fit` because the two faces sit
`joint_fit` apart. The loop is split between parts by `_panel_zone()`
(|z| < `seal_y`) and `_wall_zone()`. Pass `e` so that a panel gets only
its own end. The strip runs out through the ridge to its tip, touching the
wall's TPU so the loop is continuous.

## Checks worth re-running

Zero-volume pairwise intersections among each wall's halves, each panel,
each ear plate, the rollers, lever, link and `spool`, with the lid shut.
The lid walls against the lid panels come to ≈0.15 mm³, spread thin along
the edge ridges. That's facet noise between two 720-facet sweeps. Only
these overlap, on purpose: the gaskets with the ridges pressing on them,
and TPU on TPU.

Swing the lid (`_lid_swing`, 2°–110°): lid parts against base parts must
stay empty. The one exception is the keeper against the link at a few
degrees, which is the latch holding the lid shut. Swing the lever: past
shut by a few degrees it hits its post, and opening must stay clear to
90°. The link isn't swung, since it pivots on its own. In a check file,
set defaults as `OPEN = 0;` and not `is_undef(OPEN)`, or `-D` won't take.

Every plate's bbox must stay inside ±130 mm.

## Open

- The top roller is fixed where it touches the spool. The spring and
  tensioner that let it cinch the spool down come next, in that ear.
- A snap latch pulling 1 mm of 75A TPU over a ~550 mm loop is a lot of
  force. If the latch won't close, lower the squeeze on the cut, not on
  the screwed seals.

## Manifest

Multi-material plates are previews **without `plate: true`**. Validation
holds a plate to one material family.
