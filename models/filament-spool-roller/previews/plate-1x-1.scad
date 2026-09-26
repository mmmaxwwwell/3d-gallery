include <../lib/filament-spool-roller-lib.scad>;
$fn = 40;

// One-lane print plate 1: the left wall, both rollers and the beam.
color("#ffd60a") plate_wall(0);
color("#ff6b00") plate_lane_rollers();
color("#39ff14") plate_lane_beam();
