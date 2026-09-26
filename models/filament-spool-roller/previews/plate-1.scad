include <../lib/filament-spool-roller-lib.scad>;
$fn = 40;

// Print plate 1: the left wall, lane 1's rollers and beam, and the
// bulkhead template's left half.
color("#ffd60a") plate_wall(0);
color("#00eaff") plate_wall_template(-1);
color("#ff6b00") plate_lane_rollers();
color("#39ff14") plate_lane_beam();
