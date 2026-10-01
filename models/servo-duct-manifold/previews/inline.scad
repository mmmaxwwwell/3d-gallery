include <../lib/servo-duct-manifold-lib.scad>;
$fn = 96;

// One valve with a duct end on each side; the servo is a stand-in.
color("#ffdb27") inline_assembly("body");
color("#ff7d1f") inline_assembly("disc");
color("#ff33ce") inline_assembly("coupler");
color("#51ff30") inline_assembly("adapter");
if (joint != "bolt") color("#2d7dff") inline_assembly("duct_plug");
if (joint != "bolt") color("#a021ff") inline_assembly("gasket");
color("#8a8f98") inline_assembly("servo");
