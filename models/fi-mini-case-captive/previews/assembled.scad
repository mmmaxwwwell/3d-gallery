include <../lib/fi-mini-case-captive-lib.scad>;
$fn = 40;

// Multicolor body: black shell with QR recesses + white QR modules.
// color() calls are at the top level so the multicolor 3MF builder
// can extract them via regex.

color("black") case();

if (qr_code_text != "")
    color("white") qr_dark_modules();
