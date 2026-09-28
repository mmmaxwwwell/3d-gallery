include <../lib/servo-duct-manifold-lib.scad>;
$fn = 96;

// The hub with a valve or a spigot adapter on every port; servos are stand-ins.
color("#1fedff") hub();
if (valved_ports > 0) color("#ffdb27") hub_valve_bodies();
if (valved_ports > 0) color("#ff7d1f") hub_valve_discs();
if (valved_ports > 0) color("#ff33ce") hub_valve_couplers();
if (valved_ports < ports) color("#51ff30") hub_adapters();
if (valved_ports > 0) color("#8a8f98") hub_servos();
