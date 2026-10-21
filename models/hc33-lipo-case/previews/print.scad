include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
// One Snapmaker U1 bed: the body standing on its bottom and the carriage
// on its door face, each with its orange TPU 75A (the base, the grip
// rings) printed in place. Black PCTG from head 3, TPU from head 4.
echo(gallery_extruders = [["#1a1a1a", 3], ["#ff7a1a", 4]]);
color("#1a1a1a") translate([46.5, 0, 0]) body();
color("#ff7a1a") translate([46.5, 0, 0]) body_tpu();
color("#1a1a1a") translate([11.5, 0, 0]) carriage_print();
color("#ff7a1a") translate([11.5, 0, 0]) carriage_tpu_print();
