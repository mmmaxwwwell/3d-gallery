include <../lib/servo-duct-manifold-lib.scad>;
$fn = 96;

// The hub with a valve or a duct end on every port; servos are stand-ins.
color("#1fedff") polar_assembly("hub");
if (valved_ports > 0) color("#ffdb27") polar_assembly("body");
if (valved_ports > 0) color("#ff7d1f") polar_assembly("disc");
if (valved_ports > 0) color("#ff33ce") polar_assembly("coupler");
if (joint != "bolt" || valved_ports < ports) color("#51ff30") polar_assembly("adapter");
if (joint != "bolt") color("#2d7dff") polar_assembly("duct_plug");
if (joint != "bolt") color("#a021ff") polar_assembly("gasket");
if (valved_ports > 0) color("#8a8f98") polar_assembly("servo");
