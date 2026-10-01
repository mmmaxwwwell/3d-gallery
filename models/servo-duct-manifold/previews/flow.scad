include <../lib/servo-duct-manifold-lib.scad>;
$fn = 96;

// The venturi flow section with the pressure sensor's tray; the board
// is a stand-in.
color("#1fedff") venturi_part("section");
color("#ff7d1f") venturi_part("tray");
color("#a021ff") venturi_part("gasket");
color("#2e8b57") venturi_part("board");
