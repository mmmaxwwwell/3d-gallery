include <../lib/fan-mount-lib.scad>;
$fn = 64;
// Translate so the bottom of the feet sit on z=0 (print-bed orientation).
translate([0, 0, clamp_skirt_drop])
    fan_clamp_half();
