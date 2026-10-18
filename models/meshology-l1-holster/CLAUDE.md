# meshology-l1-holster

A TPU 64D slide-in holster for the Meshology L1 radio. `devOnly` until a test print confirms the fit.

## Radio outline

Seen from below the radio is an octagon: `radio_width` × `radio_thickness`, with four diagonal faces symmetric front and back. The user measured the inside angle between the front face and a diagonal face as 122.5° (`radio_corner_angle`), so each diagonal rises at 57.5° off the front plane. Its front-to-back reach, `radio_chamfer_depth`, is a guess (6 mm); the width follows from it. That back and front chamfers match is also assumed.

The front and back faces are bevelled the same way on their top and bottom edges too. Seen from the front, the outline's four corners are R11 (`radio_corner_radius`, measured), and so are the front face's. The face is the outline inset by the bevel width, so its arcs share the outline's centres and the bevel is the same width all round.

`radio_body()` builds this the way the user suggested: a hull of cylinders on Y, one per corner, in three sets. The outline's set spans the full-width band, and a thin set sits at each face. `radio_body(d)` is the radio grown by `d` on every face. Centres stay put, the outline radius grows by `d`, the face radius by `d + cw - cw'`, and `grown_bevel()` gives the grown bevel `[cw', c']`. Seen from below it's still the octagon `radio_outline()` everywhere above the corner arcs.

## Holster

- Pocket = `radio_body(tolerance, radio_height)`, its top lifted far past the rim so the channel is open, on a `wall`-thick floor. The floor rises into the R11 bottom corners and ramps up the bottom bevels front and back, so the radio is cradled with `tolerance` all round. `tolerance` is 0.1: 0.3 printed too loose in PETG, on both the holster and the stand.
- `wall` is 3 (the user asked for a thicker model). Outside (`outside()`) = the pocket's `radio_body()` minkowski'd with a `wall` sphere: the user wanted the bottom to follow the radio so the wall is the same thickness all the way round. Printed standing, that underside would overhang under the R11 corners and the bottom bevels, so it's hulled to a footprint set back just far enough that the skirt rises at exactly 45° (tangent to the corner arc, and to the round over the bevel's top edge). The wall is thicker only in that skirt. The footprint's corners are rounded (r 5) so the bottom has no sharp corners (the user's ask).
- `front_lip` is measured in from the radio's side faces, not the holster's outside, and must reach past the diagonal face onto the front face (asserted).
- The front cutout leaves `front_sill` above the floor; its lower corners are R11 (`cutout_corner_radius`), matching the radio's.
- The cutout's edge is a full half-round across the wall (`cutout_edge_radius = wall / 2`): the band within that radius of the opening is cut away, less a rod along the edge in the wall's mid-plane (`cutout_edge_rod()`). It only works because the whole edge runs on the flat front wall, clear of the face's corner arcs and the floor ramps. Check that again if `front_lip`, `front_sill` or the corner radii change.
- The rim slopes up from front to back at `rim_angle` (43.8°, the user's pick). Along the walls' mid-line it's a plane. At the back wall it's level with the back face's top corner centres (radio top − bevel width − `radio_corner_radius`). That's where the raised back's curve starts straight up, so the slope runs into it without a step (the user asked for that clean transition). The front height follows from the angle (≈41 mm below the radio's top). Across the front face the lips' tops keep sloping, down toward the opening at the same angle from where the flat face ends (`front_face_x`, `lip_rim_z()`), so no stretch of rim is level (the user's ask). The user first had the back at the back face's top edge and the front 30 mm down, then kept that angle and lowered it twice.
- `walls()`: below the rim's low point the walls are `outside()`. Above it they're a ball (radius `wall / 2`) rolled over a sheet on the wall's mid-line, cut one radius under the rim (`under_rim()`: the sloping plane, and across the front face the lips' slopes). So every wall keeps vertical faces and the rim is a half-round on top of it, whichever way the wall runs. Cutting the shell with the tilted plane and capping it with a rod instead leaves a notch on the low side of the front and back walls, because the plane crosses those walls' thickness.
- OpenSCAD's preview of that minkowski drops the sheet's faces, so the side walls look missing above the low point. The exported STL is whole; check by importing the STL or by slicing (`projection(cut = true)`).
- At each lip top the edge rod ends in a ball at the rim's height, so the two rounds meet in a ball end, not a crease. Every round sits on top of its wall, and a sloping top edge on a vertical wall never overhangs.
- Prints standing on the floor. All walls are vertical and the floor's corner fillets and ramps face up, so it's support-free.

## Back and locking tabs

- From behind, the back wall's top rises from the back corner, where the side slope arrives at `rim_back_z`, along a straight ramp tangent to the radio back face's R11 corner arc (`under_back_rise()`). On −x it follows the arc up to the face's top edge (the tab row runs onto the arc there). On +x it leaves the arc along a tangent and climbs to a guard a wall wide beside the row's first slit; if the guard stands so high that the climb from the back corner clears the arc (it does since the tabs were raised), the ramp runs straight to the guard's round. The user asked for each step: the curve instead of 45°, no level step, a guard so the tabs don't get torn off. The ball rolls on an arc `cutout_edge_radius` inside the corner, so the rounded top lands on the outline itself. Elsewhere between the slits the wall stops at the face's top edge (`back_top_z`) and the tabs carry on from there.
- The tab row (slits at both ends included) runs from `tab_start` (23, the user's measurement) in from the radio's +x side to `tab_wrap` (45°, my pick for "some of the edge curvature") round the −x corner's arc, split into `tabs` (3) tabs (`tab_width` and `tab_pitch` are derived: ~10 and ~11.5). **The user's left is +x, seen from the back.** History: the +x place was left out at first ("something there we can't use"), then the user had it back as a full clip and said the straight edge ran 7 mm further on +x, then replaced all that with this row.
- Each tab is `tab_profile()` run along the back face's top edge (`tabs()`): extruded across the straight top and swept round the −x arc (`rotate_extrude` about the corner's centre), so the last tab's bend follows the curved bevel. It carries the back wall up `tab_lift` (3, the user's number after the first print) past the radio's top back edge, then bends forward along the bevel, a wall thick, for `tab_reach` (6: the bevel's whole depth, the user's "basically the entire length"; it was 2). The user called my 45° bend the wrong angle, so the bend's underside overhangs 57.5°, past the 45° rule, by the user's choice. The bend's end is square to it, facing up and forward: the radio's bottom back bevel, coming down, pushes it back. To let the radio past each tab flexes back about the full reach; in PETG that's near its limit. Edges rounded `tab_edge_radius` by a minkowski. The tabs are unioned after the pocket is cut, because the bends reach into the pocket's space.
- `slit_width` slits, `slit_length` (20, the user's number) down from `back_top_z` and round-bottomed, sit at both ends of the row and between tabs (`slit_x(k)`), so each tab is a free tongue. Neighbours share a slit (`tab_pitch` = tab + slit). Slits on the −x arc are still vertical cuts. The slits' edges are a half-round across the wall like the rim's (the user preferred that to the chamfer I first gave them): the band within `cutout_edge_radius` of each slit is cut, less a rod along its edge in the wall's mid-plane, round bottom included (`slit_edge_rod()`). The slit is 1.5 at the wall's middle and about 4.5 at its faces. The tabs are rounded at nearly the same radius (`tab_edge_radius`), so their sides carry the same bullnose up from the slits; their bodies are added after the slits are cut.

## Kanix plate mount

The holster bolts to a Kanix belt clip (the user's own system, `~/git/kanix/scad`). Only the interface is taken, not Kanix code, which is CC BY-NC-ND. That interface is an M5 grid at 19.05 mm pitch with 4.2 mm self-tap pilots, drilled blind from the clip side. Plates are as tall as their belt: 38 mm for 2 rows, 52 for 3. The width is pitch × (cols − 1) + 14.

- `kanix_cols` × `kanix_rows` = 3 × 2 (the user's pick, the long side horizontal), centred on the back, its pad's top just below the slits so the tabs still flex.
- An M5×10 through the clip (5 mm plate, 2.4 mm head counterbore) reaches 7.4 mm in. The pilots go 8 mm, mostly through the pad and on into the wall, and the pad (`kanix_pad`, 5.8) is sized to leave `kanix_skin` (0.8, the user's number) before the pocket, so no screw tip reaches the radio (the user's concern). Check: the pilots must clear `pocket()` shifted 0.79 toward them and touch it at 0.81. That's also why `wall` went from 2.4 to 3.
- The pad (`kanix_pad()`) is a hull of rounded corners. Its face is the plate's size; its flanks spread into the back wall at 45° underneath (no overhang) and only a rounding's width at the sides and top, to fit the back's flat and stay clear of the slits. Pilots are plain round holes; the user dropped my teardrops, so their tops bridge.

## USB-C opening

In the −x side (the user's right; I first put it on +x and they moved it), centred `usb_z` (38) above the radio's bottom face and `usb_y` (7) back from its front face, `usb_width` (8) × `usb_height` (14), standing upright. A 9 mm-wide port lying front-to-back would run onto the bevel there; that's my inference, not measured. The rim at that spot is lower than the opening's top, so it's a U-notch down from the rim (`usb_notch()`), cut from the rim's ball path (grown by the edge radius) so the rolled rim rounds its edges.

## Drainage

`drain_holes` (4) holes of `drain_hole_diameter` (5) at `drain_hole_spacing` (12) in a row across the floor's flat, clear of the corner arcs and bevel ramps (asserted). Both edges are chamfered 0.6 mm at 45°; the bed side's chamfer is a 45° overhang.

## Overhangs

Run the facet check on the exported STL (facet normals), since OpenSCAD's preview drops faces of the minkowski parts. Past 45°, only the tabs' bends (57.5°) and the round pilots' tops should show, both the user's calls.

## Checking fit

`intersection() { holster(); radio(); }` must render empty.

## Desk stand

`desk_stand()` (`parts/desk-stand.scad`, rigid filament, PETG by default) holds the radio up on a desk. The user asked for it to be cut with the holster's pocket. It sinks `pocket()` and `front_cutout()` into a block, in the holster's frame, tilted back `stand_angle` (15°, my pick; the user kept it and had the base lengthened instead) by `stand_tilt()`. The front opening is the same as the holster's, so the stand covers no more of the face than the holster does.

- The cradle is `radio_body(tolerance + wall)` (a wall thick, like the holster's) cut level at `stand_depth` (24, my pick) up the radio. An assert keeps it 3 mm below the USB-C opening's bottom, so a cable plugs in while it stands.
- The base reaches `stand_base_back` (45; the user first had 60, then asked for 3/4 of it) behind the radio's bottom. The first print (15°, base ending under the cradle's back top edge, ~22 mm back) tipped over backwards with an antenna on top; the user asked for the base to go back further rather than less lean.
- Every edge is rounded `stand_round` (1.2), bottom edge included (the user's ask; it overhangs a little at the bed). `desk_stand()` is `stand_core()` minkowski'd with a sphere. The core is the cradle and footprint hulled at `stand_round` in, minus the pocket and `cutout_through()` grown by it, so the pocket and cutout come back to size with rounded mouths. That replaced the holster's half-round band and the 45° mouth chamfer. `stand_round` must stay under `wall / 2`: at exactly half the core's front wall is zero thick and the minkowski crashes.
- The walls in front of the radio's front and diagonal faces have no level top: each is a 45° lead-in across the full wall, from its outside edge down to the pocket a `wall` lower (`stand_front_bevel()`), so the radio is guided in (the user's ask: "make it diagonal to guide the radio in"). It's mitred along the bisectors where the diagonals meet the sides, so the side and back walls keep their height and stand as a rounded post at each front corner. Before that I sloped the lips down sideways, outward and then inward; the user said both were the wrong face.
- Fit: `intersection() { desk_stand(); desk_stand_radio(); }` must render empty.
