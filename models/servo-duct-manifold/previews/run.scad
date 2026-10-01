include <../lib/servo-duct-manifold-lib.scad>;
$fn = 96;

// A run of modules locked end to end: duct plug, tube, sensor section,
// venturi, two 45° elbows making a 90° bend, and a duct spigot.
color("#2d7dff") run_part("duct_plug");
color("#1fedff") run_part("tube");
color("#ffdb27") run_part("sensor");
color("#ff7d1f") run_part("cap");
color("#51ff30") run_part("venturi");
color("#ff33ce") run_part("tray");
color("#c77dff") run_part("elbow");
color("#00c2a8") run_part("adapter");
color("#a021ff") run_part("gasket");
