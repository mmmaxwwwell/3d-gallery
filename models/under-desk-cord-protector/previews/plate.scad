include <../lib/under-desk-cord-protector-lib.scad>;
$fn = 40;

// Print plate: a screened segment and its screened prop, both standing on the
// grooved end — the only orientation either will print in without supports —
// with the prop turned end for end so the two curves nest. About 163 x 160 mm
// of bed, 154 mm tall. color() stays at the top level so the multicolor 3MF
// builder can split per filament.

color("#00eaff") segment_screen();
color("#39ff14") translate([150, 0, 150]) rotate([0, 180, 0]) prop_screen();
