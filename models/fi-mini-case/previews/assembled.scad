include <../lib/fi-mini-case-lib.scad>;
$fn = 40;

// Side-by-side assembly for multicolor 3MF preview.
// Each part is wrapped in color() so the gallery's multicolor 3MF builder
// can split it into per-color meshes.

// Cap body (black) — top half with QR recesses
color("black") cap();

// QR dark modules (white) — fills the recesses in the cap
if (qr_code_text != "")
    translate([0, 0, fi_height / 2])
        color("white")
            qr_dark_modules();

// Base (dark gray) — bottom half, offset in Y
translate([0, case_width + 5, 0])
    color("#555555")
        base();
