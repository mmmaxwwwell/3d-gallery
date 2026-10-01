include <../lib/heltec-ht-hc33-case-lib.scad>;
$fn = 40;

// Top-level color() calls: the multicolor 3MF builder regex-scans this file.
color("#2f3542") battery_case();
color("#ff4757") battery_case_gasket();
color("#57606f") mcu_plate();
color("#ff6b81") mcu_plate_gasket();
color("#747d8c") cover();
color("#ffa502") cover_gasket();
color("#a4b0be") face_frame() door();
color("#ff7f50") face_frame() door_gasket();
color("#2ed573") ref_board();
color("#dfe4ea") ref_cell();
