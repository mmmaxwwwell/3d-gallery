include <../lib/filament-spool-roller-lib.scad>;
$fn = 40;

// Print plate 6: every roller, on end, and every beam, on its flange.
color("#ff6b00") plate_rollers();
color("#39ff14") plate_beams();
