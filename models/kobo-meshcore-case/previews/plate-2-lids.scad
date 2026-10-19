include <../lib/kobo-meshcore-case-lib.scad>;
$fn = 40;
color("#e8a33d") cover();
color("#2f5a99") translate([case_l - back_x0 + 6, 0, 0]) bezel();
