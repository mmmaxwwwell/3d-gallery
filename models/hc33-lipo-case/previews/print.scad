include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
// Both pieces on one bed, in print orientation.
color("#3a4250") translate([-30, 0, 0]) base();
color("#3a4250") translate([30, 0, 0]) lid_print();
