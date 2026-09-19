include <../lib/under-desk-cord-protector-lib.scad>;
$fn = 40;

// Three chained segments, shown as installed: the desk underside is the
// flat top face, the profile drops and curves below it. color() stays at
// the top level so the multicolor 3MF builder can split per filament.

color("#00eaff") rotate([90, 0, 0]) translate([0, 0, 0 * segment_length]) segment();
color("#39ff14") rotate([90, 0, 0]) translate([0, 0, 1 * segment_length]) segment();
color("#ff6b00") rotate([90, 0, 0]) translate([0, 0, 2 * segment_length]) segment();
