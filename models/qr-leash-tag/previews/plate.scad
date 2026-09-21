include <../lib/qr-leash-tag-lib.scad>;
$fn = 40;

// Print plate: the tag flipped so the QR face lies on the build plate.
// The filament swap then happens in the first millimetre and the code
// prints flat against the sheet. color() stays at the top level so the
// multicolor 3MF builder can split per filament.

color("black") translate([0, 0, total_h]) rotate([180, 0, 0]) tag_dark();

if (qr_text != "" || qr_polarity == "Dark on light")
    color("white") translate([0, 0, total_h]) rotate([180, 0, 0]) tag_light();
