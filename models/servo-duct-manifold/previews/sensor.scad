include <../lib/servo-duct-manifold-lib.scad>;
$fn = 96;

// A sensor section with its cap on; the board is a stand-in.
color("#1fedff") sensor_part("section");
color("#ff7d1f") sensor_part("cap");
color("#a021ff") sensor_part("gasket");
color("#2e8b57") sensor_part("board");
