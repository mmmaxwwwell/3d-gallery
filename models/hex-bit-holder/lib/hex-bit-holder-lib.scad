include <BOSL2/std.scad>

// BEGIN_DESCRIPTION
// A 1/4-inch hex-shank bit holder: a single rounded-edge cube with a
// row of hexagonal holes punched straight through it. Designed to be
// printed in 64D TPU, which flexes just enough to grip each bit by
// friction without a detent.
//
// The hex holes are sized for a standard 1/4" (6.35mm across-flats)
// power-bit shank plus a `gap` clearance on the across-flats dimension,
// so the printed flat-to-flat opening is 6.35 + gap. At gap = 0.25mm
// the bits push in firmly and stay put in flexible TPU.
//
// The block's edges are rounded by hulling eight 3mm-diameter spheres
// (one per corner), giving a smooth, snag-free body.
// END_DESCRIPTION

// BEGIN_PARAMS
// Fit clearance added to the hex across-flats, in mm.
// The printed flat-to-flat opening = shank_across_flats + gap.
// 0.25mm suits 64D TPU for a firm friction grip. Raise toward 0.4mm
// for a looser fit or stiffer filaments; lower toward 0.1mm to grip
// harder (TPU's squish gives you slack here).
gap = 0.25;

// Across-flats size of a 1/4" hex shank, in mm.
// 1/4 inch = 6.35mm measured flat-to-flat. Don't change unless your
// bits are a different standard.
shank_across_flats = 6.35;

// Number of bit holes in the row.
hole_count = 6;

// Center-to-center spacing between adjacent holes, in mm.
hole_spacing = 15;

// End margin from the outer holes to the block ends, in mm.
// Half a spacing keeps the holes visually centered with even ends.
end_margin = hole_spacing / 2;

// Block depth (front-to-back, the short horizontal axis), in mm.
block_depth = 15;

// Block height (the axis the holes run through), in mm.
// Closed on the bottom with a 1mm base; hex bore depth = block_height - base_thickness.
block_height = 12;

// Base thickness at the bottom of the blind hex holes, in mm.
base_thickness = 1;

// Corner rounding sphere diameter, in mm.
// Eight spheres of this diameter are hulled to form the rounded box.
corner_sphere_d = 3;

// Detent bump diameter, in mm.
// Each hole gets two small spherical bumps — one on each of two opposing
// flats — that protrude into the bore to grip the bit. Each sphere sits
// halfway into the wall (its center on the flat face), so half pokes in.
detent_bump_d = 0.5;
// END_PARAMS

// ============================================================
// Derived values
// ============================================================

// Printed flat-to-flat opening for each hex hole.
hex_across_flats = shank_across_flats + gap;

// Block length (the long axis the row runs along), in mm.
// Outer holes span (hole_count - 1) * hole_spacing; add a margin each end.
block_length = (hole_count - 1) * hole_spacing + 2 * end_margin;

// Corner sphere radius.
_r = corner_sphere_d / 2;

// ============================================================
// Helper modules
// ============================================================

// Smooth rounded box: hull of 8 spheres of radius r at the corners of a
// box of size [l, w, h], inset by r so the overall bounding box stays
// exactly l × w × h. Centered on the origin.
module _rounded_box(l, w, h, r) {
    hull()
        for (x = [-1, 1], y = [-1, 1], z = [-1, 1])
            translate([x * (l/2 - r), y * (w/2 - r), z * (h/2 - r)])
                sphere(r = r);
}

// One blind hexagonal hole, axis along Z, open at the top, closed at the
// bottom with base_thickness of solid material.
// Bore depth = block_height - base_thickness.
module _hex_hole() {
    bore_depth = block_height - base_thickness;
    bore_bottom = -block_height/2 + base_thickness;
    // Bore from bore_bottom up through the top face (overshoot 1mm).
    translate([0, 0, bore_bottom])
        rotate([0, 0, 90])
            cylinder(h = bore_depth + 1, d = hex_across_flats / cos(30),
                     $fn = 6);
}

// Bottom-of-bore grip bumps: on each of the 3 pairs of parallel hex flats,
// a capsule (hull of two bump spheres) runs vertically from the bore floor.
// Heights: one pair 8mm, one pair 5mm, one pair 2mm (out of 11mm bore).
module _hex_detents() {
    flat_offset = hex_across_flats / 2;
    bore_bottom = -block_height/2 + base_thickness;
    bump_r = detent_bump_d / 2;
    // Three pairs of parallel flats, angles after the 90° hex rotation.
    // Heights for each pair (from bore bottom).
    heights = [8, 5, 2];
    angles = [0, 60, 120];
    for (i = [0:2]) {
        h = heights[i];
        a = angles[i];
        for (side = [0, 180])
            rotate([0, 0, a + side])
                translate([flat_offset, 0, 0])
                    hull() {
                        translate([0, 0, bore_bottom + bump_r])
                            sphere(d = detent_bump_d, $fn = 16);
                        translate([0, 0, bore_bottom + h - bump_r])
                            sphere(d = detent_bump_d, $fn = 16);
                    }
    }
}

// children()-style iterator over the row of hole centers along X.
module _hole_positions() {
    for (i = [0 : hole_count - 1])
        translate([-block_length/2 + end_margin + i * hole_spacing, 0, 0])
            children();
}

// ============================================================
// Public modules
// ============================================================

// The complete bit holder: rounded block with the row of hex holes
// punched straight through the height (Z) axis. Centered on the origin.
module hex_bit_holder() {
    union() {
        difference() {
            _rounded_box(block_length, block_depth, block_height, _r);
            _hole_positions() _hex_hole();
        }
        // grip detents added back into each bore after it is cut
        _hole_positions() _hex_detents();
    }
}
