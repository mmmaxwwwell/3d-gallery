include <../lib/fixture-cube-lib.scad>;
$fn = 16;

color("red") box();
color("blue") translate([0, 0, size]) lid();
