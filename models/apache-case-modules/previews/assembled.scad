include <../lib/apache-case-modules-lib.scad>;
$fn = 40;
color("#3b6fb6") baseplate();
color("#e8a33d") saddles_placed();
color("#f0c674") straps_placed();
color("#5aa469") charge_tray_placed();
color("#2e8b57") carrier_tray_placed();
color("#d9d9d9") case_ref();
color("#c0392b") cell_ref();
color("#7a3fb0") { charge_ref(); carrier_parts_ref(); }
color("#1f6f4a") carrier_board_ref();
color("#c9a227") bulkhead_ref();
color("#2b2b2b") antenna_ref();
