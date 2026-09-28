include <../lib/spool-drybox-lib.scad>;
$fn = 40;

// Plate 1: the left wall's base and lid halves on their outside faces,
// their gaskets printed in.
color("#ffdb27") plate_wall(-1, "walls");
color("#ff33ce") plate_wall(-1, "gaskets");
