include <../lib/apache-case-modules-lib.scad>;
$fn = 40;
color("#e8a33d") {
  translate([-95, -10, 0]) saddle_print();
  translate([-95, 50, 0]) saddle_print();
}
color("#f0c674") {
  translate([-30, -10, 0]) strap_print();
  translate([-30, 50, 0]) strap_print();
}
color("#5aa469") translate([25, -87, 0]) charge_tray_print();
color("#2e8b57") translate([-100, -87, 0]) carrier_tray_print();
