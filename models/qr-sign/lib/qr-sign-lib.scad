include <BOSL2/std.scad>
include <qr.scad>

// BEGIN_DESCRIPTION
// A two-color QR sign. Print a rounded plate in one filament with the QR
// code embossed in a contrasting filament. Scan with any phone camera to
// open the encoded URL.
//
// Designed as a single multi-material print — the plate and the QR
// modules interlock in Z so a multi-material printer (or a manual
// filament swap at the right layer) produces a sharp, durable sign with
// no glue or assembly.
// END_DESCRIPTION

// BEGIN_PARAMS
// URL or text to encode in the QR code.
// Short URLs produce larger, more reliable modules.
// Long URLs work, but the modules get smaller and may exceed
// your printer's resolution.
qr_url_text = "https://example.com";

// Outer width of the sign plate, in mm.
sign_size = 235;

// Corner rounding radius on the plate, in mm.
corner_r = 10;

// Print layer height, in mm. The QR section height is computed as
// 4 × layer_h so the two-color split lands on a clean layer boundary.
layer_h = 0.28;
// END_PARAMS

section_h = 4 * layer_h;

// ============================================================
// Geometry helpers
// ============================================================

// Rounded square plate, extruded to height h.
module plate(h) {
    linear_extrude(h)
        offset(r = corner_r)
            square(sign_size - 2 * corner_r, center = true);
}

// Raw QR module geometry from the qr.scad library.
module qr_raw() {
    qr(qr_url_text, width = sign_size, height = sign_size,
       thickness = section_h, center = true);
}

// The black QR layer is two stacked qr_raw blocks: one that fills the
// pocket in the plate, and one that sits on top so the modules are
// visually proud of the surface.
module qr_black() {
    qr_raw();
    translate([0, 0, 2 * section_h])
        qr_raw();
}

// Clip the QR geometry to the plate footprint so modules near the
// rounded corners don't leak past the plate outline.
module qr_black_clipped() {
    intersection() {
        translate([0, 0, -section_h])
            plate(5 * section_h);
        qr_black();
    }
}

// ============================================================
// Public modules
// ============================================================

// The plate with the QR pocket subtracted — ready to print in the
// "plate" filament (usually white or a light color).
module plate_with_pocket() {
    difference() {
        plate(3 * section_h);
        qr_black();
    }
}

// The QR modules, clipped to the plate footprint — ready to print in
// the "QR" filament (usually black or a dark color).
module qr_modules() {
    qr_black_clipped();
}

// Full two-color sign in one render — used by the preview only.
// Production prints are split into the two modules above so the
// gallery builder can emit a multicolor 3MF.
module sign() {
    color("white") plate_with_pocket();
    color("black") qr_modules();
}
