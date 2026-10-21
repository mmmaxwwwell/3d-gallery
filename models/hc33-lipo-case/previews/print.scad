include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
// Both pieces on one bed, in print orientation: the sleeve standing on its
// bottom, the cap top face down.
color("#3a4250") translate([-30, 0, 0]) sleeve();
color("#3a4250") translate([30, 0, 0]) cap_print();
