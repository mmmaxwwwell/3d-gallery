include <../lib/servo-duct-manifold-lib.scad>;
$fn = 96;

// The cubic manifold with a valve on every plug and a duct plug in every
// socket; servos are stand-ins.
color("#1fedff") cubic_assembly("cells");
if (cubic_plugs > 0) color("#ffdb27") cubic_assembly("body");
if (cubic_plugs > 0) color("#ff7d1f") cubic_assembly("disc");
if (cubic_plugs > 0) color("#ff33ce") cubic_assembly("coupler");
if (cubic_plugs > 0) color("#51ff30") cubic_assembly("adapter");
if (cubic_sockets > 0) color("#2d7dff") cubic_assembly("duct_plug");
if (len(cells) > 1 || len(cubic_port_list) > 0) color("#a021ff") cubic_assembly("gasket");
if (cubic_plugs > 0) color("#8a8f98") cubic_assembly("servo");
