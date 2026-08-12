include <../lib/property-sign-lib.scad>;
$fn = 64;

// Multicolor assembly preview. The gallery's build-multicolor-3mf.mjs scans
// top-level color() calls and emits one mesh per color into a single 3MF.

color("white") plate_with_pocket();
color("red")   red_inlay();
color("black") black_inlay();
