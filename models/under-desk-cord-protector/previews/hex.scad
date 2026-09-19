include <../lib/under-desk-cord-protector-lib.scad>;
$fn = 40;

// The two screened parts as installed, two lengths of them side by side: the
// hex cradle and the hex prop close into one tube, with the honeycomb running
// through the joint. color() stays at the top level so the multicolor 3MF
// builder can split per filament.

color("#2b5cff") rotate([90, 0, 0]) segment_screen();
color("#2b5cff") rotate([90, 0, 0]) translate([0, 0, segment_length]) segment_screen();

color("#39ff14") rotate([90, 0, 0]) prop_screen();
color("#39ff14") rotate([90, 0, 0]) translate([0, 0, segment_length]) prop_screen();
