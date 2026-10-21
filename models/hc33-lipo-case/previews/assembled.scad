include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
// The lid, with the HC33 and the TP4056 on it, lifted 30 mm off the base
// so the inside shows.
lift = 30;
color("#3a4250") base();
color("#3a4250") lid_in_place(lift);
color("#e8c547") ref_cell();
color("#7a3fa0") ref_v4();
color("#2f6fb0") ref_tp(lift);
color("#2f8f4e") ref_hc(lift);
color("#c9a227") ref_sma(lift);
