include <../lib/qr-leash-tag-lib.scad>;
$fn = 40;

// QR side up — the readable view. color() stays at the top level so the
// multicolor 3MF builder can split per filament.

color("black") tag_dark();

// Nothing lands in the accent filament when the code is empty and the
// band is all body colour.
if (qr_text != "" || qr_polarity == "Dark on light")
    color("white") tag_light();
