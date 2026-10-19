include <../lib/apache-case-modules-lib.scad>;
$fn = 40;
color("#e8a33d") translate([75, 30, 0]) cell_bed_print();
color("#f0c674") {
  translate([-10, 40, 0]) hook_print();
  translate([-10, 80, 0]) hook_print();
}
color("#2e8b57") translate([-100, -87, 0]) carrier_tray_print();
