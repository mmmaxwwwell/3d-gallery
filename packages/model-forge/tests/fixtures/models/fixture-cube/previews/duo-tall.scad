include <../lib/fixture-cube-lib.scad>;
$fn = 16;

// A preview-local override. It must stay authoritative over a user's value,
// which is the whole reason parameters are injected into the lib rather than
// appended after the consumer.
height_mult = 3;

color("red") box();
color("blue") translate([0, 0, size * height_mult]) lid();
