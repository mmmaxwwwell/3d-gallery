include <../lib/heltec-ht-hc33-case-lib.scad>;
$fn = 40;

// Each piece as it prints, its TPU in place.
color("#2f3542") print_layout(0) battery_case_print();
color("#ff4757") print_layout(0) battery_case_gasket_print();
color("#57606f") print_layout(1) mcu_plate_print();
color("#ff6b81") print_layout(1) mcu_plate_gasket_print();
color("#747d8c") print_layout(2) cover_part_print();
color("#ffa502") print_layout(2) cover_gasket_print();
color("#a4b0be") print_layout(3) door_part_print();
color("#ff7f50") print_layout(3) door_gasket_print();
