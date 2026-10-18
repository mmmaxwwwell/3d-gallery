include <../lib/meshtastic-drybag-node-lib.scad>;
$fn = 40;
// Each piece moved off along the way it goes on: the front door forward,
// the tray, motor plate and gears back, each reel's holder out sideways,
// its rollers and cheeks up, the panel mount down.
ex_door = 90;
ex_tray = 150;
ex_plate = 45;
ex_gears = 95;
ex_side = 60;
ex_front = 75;
ex_rear = 75;
ex_bars = 35;
ex_up = 50;
ex_panel = 70;
color("#2f3542") frame();
color("#747d8c") {
  translate([0, ex_door, 0]) front_door();
  translate([0, -ex_tray, 0]) tray();
}
color("#8395a7") translate([0, -ex_plate, 0]) motor_plate();
color("#e1b12c") translate([0, -ex_gears, 0]) drive();
color("#ffa502") for (s = [-1, 1]) translate([s * ex_side, 0, 0]) mirror([s < 0 ? 1 : 0, 0, 0]) {
  spool();
  translate([0, ex_front / 2, 0]) reel_flange();
  translate([0, -ex_rear / 2, 0]) reel_hub();
}
color("#a4b0be") for (s = [-1, 1]) {
  translate([s * (ex_side + ex_bars), ex_front, 0]) front_plate(s);
  translate([s * (ex_side + ex_bars), -ex_rear, 0]) rear_plate(s);
  translate([s * ex_side, 0, 0]) for (b = xbars()) if (b[0] * s > 0) translate([s * ex_bars * cos(b[2] * s), 0, ex_bars * sin(b[2] * s)]) xbar(b);
}
color("#ced6e0") {
  for (s = [-1, 1]) translate([s * (ex_side + ex_bars), 0, ex_up]) cheeks(s);
  translate([0, 0, -ex_panel]) panel_mount();
}
color("#f1f2f6") for (s = [-1, 1]) translate([s * (ex_side + ex_bars), 0, 2 * ex_up]) rollers(s);
color("#3742fa") translate([0, 0, -2 * ex_panel]) panel();
color("#57606f") translate([0, 0, ex_up]) antenna();
