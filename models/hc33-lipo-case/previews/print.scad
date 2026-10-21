include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
// Both pieces on one bed: the body on its right face, the door on its
// outer face.
color("#3a4250") body_print();
color("#3a4250") translate([0, 60, 0]) door_print();
