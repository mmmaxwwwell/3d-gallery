include <../lib/filament-spool-roller-lib.scad>;
$fn = 40;

// Print plate 3: a centre wall, and lane 3's rollers and beam.
color("#ffd60a") plate_wall(2);
color("#ff6b00") plate_lane_rollers();
color("#39ff14") plate_lane_beam();
