include <../lib/pebblebee-air-captive-lib.scad>;
$fn = 40;

// Multicolor body: black shell with the text recess, white text inlay.
// color() calls are at the top level so the multicolor 3MF builder
// can extract them via regex.

color("black") case();

if (text_lines_n > 0)
    color("white") top_text_block();
