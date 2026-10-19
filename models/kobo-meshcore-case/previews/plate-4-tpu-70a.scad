include <../lib/kobo-meshcore-case-lib.scad>;
$fn = 40;
color("#333333") translate([-bezel_x0, -display_y + 2, 0]) bezel_gasket();
color("#666666") translate([bezel_x1 - bezel_x0 + 6, 0, 0]) kobo_pad();
