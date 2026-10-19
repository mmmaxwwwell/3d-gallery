include <../lib/kobo-meshcore-case-lib.scad>;
$fn = 40;
// The grip and every TPU piece on one Snapmaker U1 bed: PCTG from head 3,
// soft TPU from head 4. The cover and bezel go on plate 2.
echo(gallery_extruders = [["#1a1a1a", 3], ["#d8d8d8", 4]]);
color("#1a1a1a") translate([5, 35, 0]) grip();
color("#d8d8d8") translate([95 - back_x0, 5, 0]) back_gasket();
color("#d8d8d8") translate([172 - bezel_x0, 10 - display_y + 1.5, 0]) bezel_gasket();
color("#d8d8d8") translate([225, 20, 0]) usbc_plug();
color("#d8d8d8") for (x = [215, 232]) translate([x, 40, 0]) sma_washer();
color("#d8d8d8") translate([212, 55, 0]) kobo_pad();
