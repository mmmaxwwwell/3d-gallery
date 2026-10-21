include <../lib/pouch-comms-module-lib.scad>;
$fn = 40;
// The lid lifted 40 mm off the box so the inside shows.
lift = 40;
color("#3a4250") box();
color("#3a4250") lid_in_place(lift);
color("#d9622b") cage_in_place();
color("#e8c547") ref_bank();
color("#d0d3d8") ref_t9();
color("#2f8f4e") ref_boards();
color("#c9a227") ref_sma();
