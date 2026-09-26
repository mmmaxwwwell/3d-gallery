include <../lib/filament-spool-roller-lib.scad>;
$fn = 40;

// Print plate 5: the right wall and the bulkhead template's right half.
color("#ffd60a") plate_wall(4);
color("#00eaff") plate_wall_template(1);
