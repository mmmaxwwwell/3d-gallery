include <../lib/fi-mini-case-lib.scad>;
$fn = 40;

// Multicolor cap: black body with QR recesses + white QR modules.
// color() calls are at the top level so the multicolor 3MF builder
// can extract them via regex.

color("black")
    translate([0, 0, fi_height / 2])
        if (qr_code_text != "") {
            difference() {
                top_half();
                qr_dark_modules();
            }
        } else {
            top_half();
        }

if (qr_code_text != "")
    translate([0, 0, fi_height / 2])
        color("white")
            qr_dark_modules();
