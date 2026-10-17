# meshology-l1-holster

A TPU 64D slide-in holster for the Meshology L1 radio. `devOnly` until a test print confirms the fit.

## Radio outline

Seen from below the radio is an octagon: `radio_width` × `radio_thickness`, with four diagonal faces symmetric front and back. The user measured the inside angle between the front face and a diagonal face as 122.5° (`radio_corner_angle`), so each diagonal rises at 57.5° off the front plane. Its front-to-back reach, `radio_chamfer_depth`, is a guess (6 mm); the width follows from it. That back and front chamfers match is also assumed.

The front and back faces are bevelled the same way on their top and bottom edges too. Seen from the front, the outline's four corners are R11 (`radio_corner_radius`, measured), and so are the front face's. The face is the outline inset by the bevel width, so its arcs share the outline's centres and the bevel is the same width all round.

`radio_body()` builds this the way the user suggested: a hull of cylinders on Y, one per corner, in three sets. The outline's set spans the full-width band, and a thin set sits at each face. `radio_body(d)` is the radio grown by `d` on every face. Centres stay put, the outline radius grows by `d`, the face radius by `d + cw - cw'`, and `grown_bevel()` gives the grown bevel `[cw', c']`. Seen from below it's still the octagon `radio_outline()` everywhere above the corner arcs.

## Holster

- Pocket = `radio_body(tolerance, radio_height)`, its top lifted far past the rim so the channel is open, on a `wall`-thick floor. The floor rises into the R11 bottom corners and ramps up the bottom bevels front and back, so the radio is cradled with `tolerance` all round.
- Outside (`outside()`) = the pocket's `radio_body()` minkowski'd with a `wall` sphere: the user wanted the bottom to follow the radio so the wall is the same thickness all the way round. Printed standing, that underside would overhang under the R11 corners and the bottom bevels, so it's hulled to a footprint set back just far enough that the skirt rises at exactly 45° (tangent to the corner arc, and to the round over the bevel's top edge). The wall is thicker only in that skirt.
- `front_lip` is measured in from the radio's side faces, not the holster's outside, and must reach past the diagonal face onto the front face (asserted).
- The front cutout leaves `front_sill` above the floor; its lower corners are R11 (`cutout_corner_radius`), matching the radio's.
- The cutout's edge is a full half-round across the wall (`cutout_edge_radius = wall / 2`): the band within that radius of the opening is cut away, less a rod along the edge in the wall's mid-plane (`cutout_edge_rod()`). It only works because the whole edge runs on the flat front wall, clear of the face's corner arcs and the floor ramps. Check that again if `front_lip`, `front_sill` or the corner radii change.
- The rim slopes up from front to back at `rim_angle` (43.8°, the user's pick). Along the walls' mid-line it's a plane. At the back wall it's level with the back face's top corner centres (radio top − bevel width − `radio_corner_radius`). That's where the raised back's curve starts straight up, so the slope runs into it without a step (the user asked for that clean transition). The front height follows from the angle (≈41 mm below the radio's top). Across the front face the lips' tops keep sloping, down toward the opening at the same angle from where the flat face ends (`front_face_x`, `lip_rim_z()`), so no stretch of rim is level (the user's ask). The user first had the back at the back face's top edge and the front 30 mm down, then kept that angle and lowered it twice.
- `walls()`: below the rim's low point the walls are `outside()`. Above it they're a ball (radius `wall / 2`) rolled over a sheet on the wall's mid-line, cut one radius under the rim (`under_rim()`: the sloping plane, and across the front face the lips' slopes). So every wall keeps vertical faces and the rim is a half-round on top of it, whichever way the wall runs. Cutting the shell with the tilted plane and capping it with a rod instead leaves a notch on the low side of the front and back walls, because the plane crosses those walls' thickness.
- OpenSCAD's preview of that minkowski drops the sheet's faces, so the side walls look missing above the low point. The exported STL is whole; check by importing the STL or by slicing (`projection(cut = true)`).
- At each lip top the edge rod ends in a ball at the rim's height, so the two rounds meet in a ball end, not a crease. Every round sits on top of its wall, and a sloping top edge on a vertical wall never overhangs.
- Prints standing on the floor. All walls are vertical and the floor's corner fillets and ramps face up, so it's support-free.

## Back and locking tab

- From behind, the back wall's top rises from the back corner, where the side slope arrives at `rim_back_z`, along a straight ramp (~67°) tangent to the radio back face's R11 corner arc. It follows the arc, then leaves it along a tangent and climbs straight to a guard beside the tabs (`under_back_rise()`). The guard is a wall wide and level with the tabs' tops (`tab_top_z`), so the tabs don't snag (the user's ask). Between the outer slits the wall stops at the face's top edge (`back_top_z`) and the tabs carry on from there. The user asked for a transition with no level step: first the arc started off a short level run, which they called out. The user first asked for a 45° rise, then for the curve. The ball rolls on an arc `cutout_edge_radius` inside the corner, so the rounded top lands on the outline itself.
- `tabs` (3) tabs, each `tab_width` (10), carry the back wall up to the radio's top back edge. Each then bends forward along the bevel (`tab_profile()`), `tolerance` off it (measured square to it) and a wall thick, for `tab_reach` (2, my pick for the user's "a little"). The user asked for "a little bend with the chamfer", and called my 45° bend the wrong angle. So the bend's underside overhangs 57.5° over 2 mm, past the 45° rule, by the user's choice. It's the only overhang past 45°; the facet check finds just those. The bend's end is square to it, facing up and forward: the radio's bottom back bevel, coming down, pushes it back. The tabs are unioned after the pocket is cut, because the bends reach into the pocket's space.
- `slit_width` slits, `slit_length` (20, the user's number) down from `back_top_z` and round-bottomed, sit either side of every tab, so each tab is a free 10 mm tongue. Neighbours share a slit (`tab_pitch` = tab + slit): three tabs and four slits fill the back's flat top (±18 of ±18.2), which is why there's no wall between them. More or wider tabs fail the assert.
- Overhang check: no facet of the STL faces down past 45° except at the bed. Run it on the exported STL (facet normals), since OpenSCAD's preview drops faces of the minkowski parts.

## Drainage

`drain_holes` (4) holes of `drain_hole_diameter` (5) at `drain_hole_spacing` (12) in a row across the floor's flat, clear of the corner arcs and bevel ramps (asserted). Both edges are chamfered 0.6 mm at 45°; the bed side's chamfer is a 45° overhang.

## Checking fit

`intersection() { holster(); radio(); }` must render empty.

## Next

A MOLLE mount goes on the back. The back's outside still follows the octagon (chamfered corners); the mount will want a flat back face.
