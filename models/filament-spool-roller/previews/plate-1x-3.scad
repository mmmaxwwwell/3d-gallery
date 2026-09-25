include <../lib/filament-spool-roller-lib.scad>;
$fn = 40;

// One-lane print plate 3: both rollers, on end, and the beam, on its flange.
color("#ff6b00") plate_rollers();
color("#39ff14") plate_beams();
