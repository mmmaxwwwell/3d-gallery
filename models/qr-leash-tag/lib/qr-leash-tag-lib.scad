include <BOSL2/std.scad>
include <qr.scad>

// BEGIN_DESCRIPTION
// A QR tag that slides onto a leash. One piece, two filaments, no
// hardware — the webbing threads through a slot across the middle and
// the tag stays wherever you push it.
//
// The code fills the whole face: put your phone number, your dog's
// name, or a link to a lost-pet page on it so whoever finds the leash
// can reach you.
//
// Prints face down. The QR face goes on the build plate, so the colour
// swap happens in the first millimetre, the code comes out dead flat,
// and nothing needs support. Print the "Print orientation" file as-is.
// END_DESCRIPTION

// BEGIN_PARAMS
// Text to encode in the QR code. // multiline
// Short strings make bigger, more reliable modules. A long URL still
// works, but the modules shrink and may drop below what your printer
// can resolve. Leave empty for a blank tag.
qr_text = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

// Which filament the QR modules print in. "Light on dark" gives a dark
// tag with light modules (the code comes out inverted — most phones
// read it fine). "Dark on light" is the standard arrangement: a light
// background with dark modules, and it scans on everything.
qr_polarity = "Light on dark";  // [Light on dark, Dark on light]

// Width of the leash webbing, in mm. The tag's outer square is this
// plus a wall on each side.
leash_width = 25;

// Thickness of the leash webbing, in mm — the height of the slot the
// webbing threads through.
leash_thickness = 3;

// Wall beside the slot, in mm. Also how much wider the tag is than the
// webbing it rides on.
wall = 2;

// The back face, in mm — the side the webbing presses against.
back_thickness = 1;

// Solid material between the top of the slot and the bottom of the QR
// band, in mm.
front_thickness = 0.5;

// Height of the two-colour QR band, in mm. This is how far the second
// filament prints for.
qr_thickness = 1;

// Rounding on the four vertical edges, in mm.
corner_r = 2;

// Rounding on the eight horizontal edges, in mm — the rim around the QR
// face and the rim around the back. Keep it under qr_margin, or the
// outermost modules of the code start to curve over the edge instead of
// lying flat on the build plate.
edge_r = 0.5;

// Gap between the code and the outer edge, in mm. Gives the code a
// quiet zone and keeps it clear of the rounded corners.
qr_margin = 1;
// END_PARAMS

// Segments in each horizontal-edge fillet. The fillet is a sub-millimetre
// feature, so 8 already reads as round and anything more is mesh the
// customizer has to push around for nothing.
edge_steps = 8;

// Error correction level. "L" (~7% recovery) yields the fewest modules,
// which on a tag this small is the difference between modules a printer
// can resolve and ones it can't.
qr_error_correction = "L";

// ============================================================
// Derived dimensions
// ============================================================
body_size = leash_width + 2 * wall;
total_h   = back_thickness + leash_thickness + front_thickness + qr_thickness;
qr_z      = back_thickness + leash_thickness + front_thickness;
qr_size   = body_size - 2 * qr_margin;

// Clamped off both ends: an over-large radius in the customizer rounds the
// square all the way into a circle rather than past it, and a negative one
// would round the corners inward into a star instead of flattening them.
body_r = max(min(corner_r, body_size / 2), 0);

// Clamped off both ends: a zero radius degenerates the sweep, and two
// fillets deeper than half the height would meet and invert it.
body_e = min(edge_r, total_h / 2 - 0.01);

// ============================================================
// Geometry helpers
// ============================================================

// Rounded-square footprint of the tag, as a path — offset_sweep needs a
// path, which is why this is BOSL2's rect() and not a hull of circles.
function body_profile() = rect([body_size, body_size], rounding = body_r);

// Outer solid, before the webbing slot is removed. Every edge is rounded:
// the four vertical ones by body_r in the footprint, the eight horizontal
// ones by body_e as the footprint is swept up. The sweep keeps the outer
// dimensions exact — 0 to total_h, body_size across.
module body_solid() {
    if (body_e <= 0)
        linear_extrude(total_h)
            polygon(body_profile());
    else
        offset_sweep(body_profile(),
                     height = total_h,
                     bottom = os_circle(r = body_e, steps = edge_steps),
                     top    = os_circle(r = body_e, steps = edge_steps));
}

// The webbing channel — straight through, open at both ends.
module leash_slot() {
    translate([0, 0, back_thickness])
        linear_extrude(leash_thickness)
            square([body_size + 2, leash_width], center = true);
}

// The slider itself, with no QR band split out yet.
module tag_shell() {
    difference() {
        body_solid();
        leash_slot();
    }
}

// The full top band the two filaments share — everything in the body above
// qr_z. Taken as a slice of body_solid() rather than its own extrusion so
// the band follows the rounded crown instead of poking out through it.
module qr_band() {
    intersection() {
        body_solid();
        translate([0, 0, qr_z])
            linear_extrude(qr_thickness + 1)
                square(body_size + 2, center = true);
    }
}

// The code's dark cells, clipped to the tag footprint so a qr_margin of
// 0 can't leave modules hanging past the rounded corners.
module qr_cells() {
    if (qr_text != "")
        intersection() {
            translate([0, 0, qr_z])
                qr(qr_text, error_correction = qr_error_correction,
                   width = qr_size, height = qr_size,
                   thickness = qr_thickness, center = true);
            qr_band();
        }
}

// ============================================================
// Public modules — called by consumers
// ============================================================

// Everything printed in the body filament (black by default), QR face up.
module tag_dark() {
    if (qr_polarity == "Dark on light")
        union() {
            difference() {
                tag_shell();
                qr_band();
            }
            qr_cells();
        }
    else
        difference() {
            tag_shell();
            qr_cells();
        }
}

// Everything printed in the accent filament (white by default), QR face up.
module tag_light() {
    if (qr_polarity == "Dark on light")
        difference() {
            qr_band();
            qr_cells();
        }
    else
        qr_cells();
}
