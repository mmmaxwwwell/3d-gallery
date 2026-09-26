include <../lib/filament-spool-roller-lib.scad>;
$fn = 40;

// One-lane print plate 2: the right wall and the bulkhead template.
color("#ffd60a") plate_wall(lanes);
color("#00eaff") plate_wall_template(0);
