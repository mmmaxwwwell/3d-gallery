include <../lib/parametric-qr-case-lib.scad>;
$fn = 40;

// QR side up — the readable view, pocket facing away. color() stays at
// the top level so the multicolor 3MF builder can split per filament.

color("black") case_dark();

// Nothing lands in the accent filament when the code is empty and the
// band is all body colour.
if (qr_text != "" || qr_polarity == "Dark on light")
    color("white") case_light();
