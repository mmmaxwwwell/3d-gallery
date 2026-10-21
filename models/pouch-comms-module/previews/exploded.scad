include <../lib/pouch-comms-module-lib.scad>;
$fn = 40;
// Everything lifted straight up out of its place, the SMAs pulled out of
// the wall, the cage over the T9, the lid on top.
lift = 60;
color("#3a4250") box();
color("#3a4250") lid_in_place(2.2 * lift);
color("#d9622b") cage_in_place(1.6 * lift);
color("#e8c547") ref_bank(lift);
color("#d0d3d8") ref_t9(lift);
color("#2f8f4e") ref_boards(lift);
color("#2d6fb8") ref_fr(1.9 * lift);
color("#c9a227") ref_sma(30);
