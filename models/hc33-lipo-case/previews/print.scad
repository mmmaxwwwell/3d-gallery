include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
// All three pieces on one bed: the body on its right face, the door on
// its outer face, the bolt standing on its knob end.
color("#3a4250") translate([0, 0, 0]) body_print();
color("#3a4250") translate([0, 60, 0]) door_print();
color("#d9622b") translate([105, 72, 0]) bolt_print();
