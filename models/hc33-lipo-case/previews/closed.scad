include <../lib/hc33-lipo-case-lib.scad>;
$fn = 40;
color("#3a4250") body();
color("#3a4250") door();
// Locked: the knob tipped into the dogleg
color("#d9622b") bolt(tilt = 25);
color("#c9a227") ref_sma();
