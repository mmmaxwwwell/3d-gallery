include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
// The bolt drawn and the door swung open 90° so the stack shows.
color("#3a4250") body();
color("#3a4250") door_open(90);
color("#d9622b") bolt(true);
color("#2f6fb0") ref_tp();
color("#e8c547") ref_cell();
color("#2f8f4e") ref_hc();
color("#7a3fa0") ref_v4();
color("#c9a227") ref_sma();
