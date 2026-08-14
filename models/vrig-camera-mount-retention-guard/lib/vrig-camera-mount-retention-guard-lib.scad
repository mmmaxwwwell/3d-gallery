include <BOSL2/std.scad>

// Rectangular sleeve that slides over the VRIG magnetic quick-release
// adapter (AC-91) at the camera/mount interface. Open on top and bottom;
// the walls physically constrain lateral movement so a knock can't shear
// the magnetic joint sideways.

// ============================================================
// Inner cavity — sized to the object being wrapped.
// ============================================================
inner_w  = 39;     // mm - long axis of the joint
inner_d  = 16.9;   // mm - short axis of the joint
height   = 10.5;   // mm - vertical span of the sleeve

// ============================================================
// Wall + rounding
// ============================================================
wall           = 2;     // mm - wall thickness on all four sides
outer_corner_r = 2.5;   // mm - radius on the four vertical outer corners
inner_corner_r = 1;     // mm - radius on the four vertical inner corners

// ============================================================
// Long-side inner bumps — raised pads on the inside of the two long
// walls, centered horizontally, top flush with the sleeve's top edge.
// They protrude into the cavity by `inset_depth` to grip the wrapped
// object where it has a matching recess.
// ============================================================
inset_length = 23;    // mm - along the wall (X)
inset_height = 4.2;   // mm - down from the top (Z)
inset_depth  = 0.3;   // mm - protrusion into the cavity (toward center)

// ============================================================
// Short-side bumpouts — the outer width grows uniformly by
// `bumpout_depth` on each short side (so the short walls become
// `wall + bumpout_depth` = 4.5 mm thick everywhere). A `bumpout_width`
// × `bumpout_depth` pocket is then cut into each short wall,
// extending the interior cavity outward. That leaves `wall` (2 mm) of
// material on the pocket's outer face — same as the rest of the
// sleeve — and 2.5 mm of material on the ±Y edges of each pocket.
// The pocket runs the full sleeve height. Total outer X extent:
// inner_w + 2*wall + 2*bumpout_depth = 48 mm.
// ============================================================
bumpout_depth = 2.5;  // mm - outward extension on each short side
bumpout_width = 11;   // mm - pocket width along Y, centered on Y = 0

// ============================================================
// Long-side bottom chamfers — the wrapped object has a 45° chamfer
// at its bottom long edges (`chamfer_face` mm hypotenuse). We add
// matching triangular material to the sleeve interior at the bottom-
// inside corner of each long wall so the object seats flush against
// the chamfered surface instead of leaving a triangular gap.
// ============================================================
chamfer_face = 1.25;  // mm - hypotenuse length of the chamfer face (matches object)
chamfer_slop = 0.2;   // mm - outward offset of the chamfer material so the object's chamfer clears it

// ============================================================
// Derived
// ============================================================
outer_w = inner_w + 2 * wall + 2 * bumpout_depth;
outer_d = inner_d + 2 * wall;

// ============================================================
// Geometry
// ============================================================

// Outer body: exact `outer_w × outer_d × height` cuboid with only the
// vertical corners rounded. No minkowski — the earlier version applied
// a 0.6mm all-edge fillet via minkowski with a sphere, but sphere($fn=16)
// in current OpenSCAD (2026.02.25-unstable / Manifold) has pole
// vertices at ~0.98·r instead of exactly r, so the sleeve's top/bottom
// came up ~0.012mm short of `height`. That made features anchored to
// height/2 (like the long-side inner bumps) poke past the outer body.
// Sharp top/bottom edges are fine for a 64D TPU print.
module outer_body() {
    cuboid([outer_w, outer_d, height],
           rounding = outer_corner_r, edges = "Z", $fn = 40);
}

// Inner cavity: rounded vertical corners only. The 0.2 mm height bump
// guarantees a clean through-cut top and bottom.
module inner_cavity() {
    cuboid(
        [inner_w, inner_d, height + 0.2],
        rounding = inner_corner_r,
        edges    = "Z",
        $fn      = 40
    );
}

// Raised pad added to the inside of one long wall. `side = +1` for the
// +Y wall (pad on its inner face, which is at y = +inner_d/2), `-1` for
// the -Y wall. The pad extends into the cavity by `inset_depth` and
// overlaps back into the wall by `slop` so the union fuses cleanly with
// no coincident-face artifacts.
module long_side_bump(side) {
    slop  = 0.5;
    thick = inset_depth + slop;
    y_c   = side * (inner_d / 2 - inset_depth / 2 + slop / 2);
    z_c   = height / 2 - inset_height / 2;
    translate([0, y_c, z_c])
        cube([inset_length, thick, inset_height], center = true);
}

module long_side_bumps() {
    long_side_bump(+1);
    long_side_bump(-1);
}

// Interior cavity extension into one short-side wall. Extends the
// main cavity outward by `bumpout_depth` over a `bumpout_width`-wide
// strip at full sleeve height. Overlaps the main cavity by `slop` in
// X and pokes 0.1 mm past the sleeve top/bottom in Z so the
// through-cut is clean top and bottom.
module short_side_bumpout_cavity(side) {
    slop  = 0.5;
    thick = bumpout_depth + slop;
    x_c   = side * (inner_w / 2 + bumpout_depth / 2 - slop / 2);
    translate([x_c, 0, 0])
        cube([thick, bumpout_width, height + 0.2], center = true);
}

module short_side_bumpout_cavities() {
    short_side_bumpout_cavity(+1);
    short_side_bumpout_cavity(-1);
}

// Triangular prism added inside the cavity, along the interior bottom
// edge of one long wall. `side = +1` (+Y wall) or `-1` (-Y wall).
// The prism's cross-section is a right triangle with legs of
// `chamfer_face / sqrt(2)` along the inner wall (Z) and the sleeve
// bottom (Y), meeting at a 45° hypotenuse that matches the wrapped
// object's chamfer. Extruded along X across the main cavity, then
// translated outward by `chamfer_slop` so the object's chamfered
// bottom doesn't press directly against the sleeve chamfer.
module long_side_bottom_chamfer(side) {
    leg = chamfer_face / sqrt(2);
    translate([0, side * chamfer_slop, 0])
        rotate([0, 90, 0])
            linear_extrude(height = inner_w, center = true)
                polygon([
                    [height / 2,       side * inner_d / 2],
                    [height / 2,       side * (inner_d / 2 - leg)],
                    [height / 2 - leg, side * inner_d / 2],
                ]);
}

module long_side_bottom_chamfers() {
    long_side_bottom_chamfer(+1);
    long_side_bottom_chamfer(-1);
}

// Public: printable sleeve, centered on origin, seated on z = -height/2.
// Build order:
//   1. Outer body (already includes the +bumpout_depth on each short side)
//   2. Subtract main cavity + short-side pockets
//   3. Union the long-side inner bumps + bottom chamfers back into the cavity
module guard() {
    union() {
        difference() {
            outer_body();
            inner_cavity();
            short_side_bumpout_cavities();
        }
        long_side_bumps();
        long_side_bottom_chamfers();
    }
}
