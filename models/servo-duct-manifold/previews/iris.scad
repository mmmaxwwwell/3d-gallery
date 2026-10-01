include <../lib/servo-duct-manifold-lib.scad>;
$fn = 96;

// The iris damper, iris_open percent open; the servo is a stand-in.
color("#1fedff") iris_part("body");
color("#ff7d1f") iris_part("blades");
color("#ffdb27") iris_part("ring");
color("#51ff30") iris_part("lid");
color("#ff33ce") iris_part("arm");
color("#a021ff") iris_part("gasket");
color("#8a8f98") iris_part("servo");
