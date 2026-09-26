include <../lib/ugreen-finder-duo-captive-lib.scad>;
$fn = 40;

// Multicolor body: black shell with QR + text recesses, white inlay.
// color() calls are at the top level so the multicolor 3MF builder
// can extract them via regex.

color("black") case();

if (has_inlay)
    color("white") top_inlay();
