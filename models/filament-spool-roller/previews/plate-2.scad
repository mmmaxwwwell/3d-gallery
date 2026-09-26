include <../lib/filament-spool-roller-lib.scad>;
$fn = 40;

// Print plate 2: a centre wall, and lane 2's rollers and beam.
color("#ffd60a") plate_wall(1);
color("#ff6b00") plate_lane_rollers();
color("#39ff14") plate_lane_beam();
