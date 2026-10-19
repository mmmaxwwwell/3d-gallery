include <../lib/apache-case-modules-lib.scad>;
$fn = 40;
color("#e8a33d") {
  translate([-90, -15, 0]) clip_print();
  translate([-40, -15, 0]) clip_print();
}
color("#f0c674") {
  translate([10, 40, 0]) hook_print();
  translate([10, 70, 0]) hook_print();
}
color("#5aa469") translate([25, -87, 0]) charge_tray_print();
color("#2e8b57") translate([-100, -87, 0]) carrier_tray_print();
