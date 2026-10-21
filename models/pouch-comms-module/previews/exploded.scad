include <../lib/pouch-comms-module-lib.scad>;
$fn = 40;
// Everything lifted straight up out of its place, the SMA pulled out of
// its wall, the lid on top.
lift = 60;
color("#3a4250") box();
color("#3a4250") lid_in_place(2.2 * lift);
color("#e8c547") ref_bank(lift);
color("#d0d3d8") ref_t9(lift);
color("#2f8f4e") ref_boards(lift);
color("#c9a227") ref_sma(30);
