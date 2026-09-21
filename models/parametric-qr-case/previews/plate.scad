include <../lib/parametric-qr-case-lib.scad>;
$fn = 40;

// Print plate: the case flipped so the QR face lies on the build plate
// and the pocket opens upward. Nothing overhangs, nothing bridges, and
// the filament swap happens in the first millimetre. color() stays at
// the top level so the multicolor 3MF builder can split per filament.

color("black") translate([0, 0, total_h]) rotate([180, 0, 0]) case_dark();

if (qr_text != "" || qr_polarity == "Dark on light")
    color("white") translate([0, 0, total_h]) rotate([180, 0, 0]) case_light();
