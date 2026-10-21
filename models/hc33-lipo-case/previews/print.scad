include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
// Both pieces on one bed: the body standing on its bottom, the carriage on
// its door face.
color("#3a4250") translate([46.5, 0, 0]) body();
color("#3a4250") translate([11.5, 0, 0]) carriage_print();
