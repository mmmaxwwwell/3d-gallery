include <../lib/folding-panel-divider-lib.scad>;
$fn = 40;

// Print plate: both halves of a stacking pair, 7 mm apart, each standing
// on end so every hinge bore runs vertically and prints round without
// support. About 118 x 244 mm of bed, 243 mm tall. color() stays at the
// top level so the multicolor 3MF builder can split per filament.

color("#00eaff") strip(top = true, bottom = false);
color("#ff6b00") rotate([0, 180, 0]) strip(top = false, bottom = true);
