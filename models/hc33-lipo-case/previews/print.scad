include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
// One Snapmaker U1 bed: the body standing on its bottom with the side door
// in its track and the plugs on their straps, and the carriage on its door
// face, each with its TPU printed in place. TPU Air from head 1, black PCTG
// from head 3, orange TPU 75A from head 4.
echo(gallery_extruders = [["#0a0a0a", 1], ["#1a1a1a", 3], ["#ff7a1a", 4]]);
translate([46.5, 0, 0]) {
  color("#1a1a1a") body();
  color("#ff7a1a") body_tpu();
  color("#0a0a0a") body_seal();
}
translate([11.5, 0, 0]) {
  color("#1a1a1a") carriage_print();
  color("#ff7a1a") carriage_tpu_print();
  color("#0a0a0a") carriage_seal_print();
}
