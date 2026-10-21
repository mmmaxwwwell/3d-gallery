include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
// The cap lifted 40 mm off the sleeve so the stack shows.
lift = 40;
color("#3a4250") sleeve();
color("#3a4250") cap_in_place(lift);
color("#2f6fb0") ref_tp();
color("#e8c547") ref_cell();
color("#2f8f4e") ref_hc();
color("#7a3fa0") ref_v4();
color("#c9a227") ref_sma(lift);
