include <../lib/apache-case-modules-lib.scad>;
$fn = 40;
color("#e8a33d") {
  translate([-95, 30, 0]) saddle_print();
  translate([-95, 85, 0]) saddle_print();
}
color("#f0c674") {
  translate([-20, 35, 0]) strap_print();
  translate([-20, 85, 0]) strap_print();
}
color("#5aa469") translate([-95, -95, 0]) charge_tray_print();
color("#2e8b57") translate([20, -95, 0]) kit_tray_print();
