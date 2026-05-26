include <../lib/qr-sign-lib.scad>;
$fn = 64;

// Multicolor assembly preview. The gallery's build-multicolor-3mf.mjs
// scans top-level color() calls and emits one mesh per color.

color("white") plate_with_pocket();
color("black") qr_modules();
