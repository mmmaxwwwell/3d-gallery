include <../lib/heltec-ht-hc33-case-lib.scad>;
$fn = 40;

// Each piece as it prints, its TPU in place. One colour per material, so the
// 3MF carries two filaments: black PETG on slot 3 and TPU 75A on slot 4.
echo(gallery_extruders = [["#222222", 3], ["#ff4757", 4]]);
color("#222222") print_layout(0) battery_case_print();
color("#ff4757") print_layout(0) battery_case_gasket_print();
color("#222222") print_layout(1) mcu_plate_print();
color("#ff4757") print_layout(1) mcu_plate_gasket_print();
color("#222222") print_layout(2) cover_part_print();
color("#ff4757") print_layout(2) cover_gasket_print();
color("#222222") print_layout(3) door_part_print();
color("#ff4757") print_layout(3) door_gasket_print();
