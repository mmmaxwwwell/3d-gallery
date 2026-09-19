// Fixture model for model-forge tests. Deliberately trivial so renders are fast.

include <shared-constants.scad>;

// BEGIN_PARAMS

// Edge length of the box (mm).
size = 10;

// Height multiplier.
height_mult = 1;

// Which corner to notch.
corner = "ne";  // [ne, nw, se, sw]

// Cut the notch at all.
notched = true;

// END_PARAMS

module box() {
  difference() {
    cube([size, size, size * height_mult]);
    if (notched) translate([size - NOTCH, size - NOTCH, 0]) cube([NOTCH, NOTCH, size]);
  }
}

module lid() {
  cube([size, size, LID_THICKNESS]);
}
