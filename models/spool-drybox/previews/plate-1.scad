include <../lib/spool-drybox-lib.scad>;
$fn = 40;

// Plate 1: the left wall on its outside face, its gasket printed in.
color("#ffdb27") wall_left();
color("#ff33ce") wall_left_gasket();
