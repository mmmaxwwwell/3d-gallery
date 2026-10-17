# meshology-l1-holster

A TPU 64D slide-in holster for the Meshology L1 radio. `devOnly` until a test print confirms the fit.

## Radio outline

Seen from below the radio is an octagon: `radio_width` × `radio_thickness`, with four diagonal faces symmetric front and back. The user measured the inside angle between the front face and a diagonal face as 122.5° (`radio_corner_angle`), so each diagonal rises at 57.5° off the front plane. Its front-to-back reach, `radio_chamfer_depth`, is a guess (6 mm); the width follows from it. That back and front chamfers match is also assumed.

The front and back faces are bevelled the same way on their top and bottom edges too. Seen from the front, the outline's four corners are R11 (`radio_corner_radius`, measured), and so are the front face's. The face is the outline inset by the bevel width, so its arcs share the outline's centres and the bevel is the same width all round.

`radio_body()` builds this the way the user suggested: a hull of cylinders on Y, one per corner, in three sets. The outline's set spans the full-width band, and a thin set sits at each face. `radio_body(d)` is the radio grown by `d` on every face. Centres stay put, the outline radius grows by `d`, the face radius by `d + cw - cw'`, and `grown_bevel()` gives the grown bevel `[cw', c']`. Seen from below it's still the octagon `radio_outline()` everywhere above the corner arcs.

## Holster

- Pocket = `radio_body(tolerance, pocket_depth)`, its top lifted past the rim so the channel is open, on a `wall`-thick floor. The floor rises into the R11 bottom corners and ramps up the bottom bevels front and back, so the radio is cradled with `tolerance` all round.
- Shell = the pocket's cross-section (`pocket_outline()`) + `wall`, rounded outside corners, flat outside bottom.
- `front_lip` is measured in from the radio's side faces, not the holster's outside, and must reach past the diagonal face onto the front face (asserted).
- The front cutout leaves `front_sill` above the floor; its lower corners are R11 (`cutout_corner_radius`), matching the radio's.
- The cutout's edge is a full half-round across the wall (`cutout_edge_radius = wall / 2`): the band within that radius of the opening is cut away, less a rod along the edge in the wall's mid-plane (`cutout_edge_rod()`). It only works because the whole edge runs on the flat front wall, clear of the face's corner arcs and the floor ramps. Check that again if `front_lip`, `front_sill` or the corner radii change.
- Prints standing on the floor. All walls are vertical and the floor's corner fillets and ramps face up, so it's support-free.

## Checking fit

`intersection() { holster(); radio(); }` must render empty.

## Next

A MOLLE mount goes on the back. The back's outside still follows the octagon (chamfered corners); the mount will want a flat back face.
