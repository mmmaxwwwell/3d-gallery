include <qr.scad>

// BEGIN_DESCRIPTION
// A one-piece case for a small rectangular object — a GPS tracker, a
// key fob, a battery, an AirTag. Type in the object's length, width and
// height and the pocket sizes itself around it; the outer face carries
// a QR code you can put a phone number or a lost-and-found link on.
//
// Prints face down. The QR face goes on the build plate and the pocket
// opens upward, so the filament swap happens in the first millimetre
// and there is nothing to bridge and nothing to support. Print the
// "Print orientation" file as-is.
// END_DESCRIPTION

// BEGIN_PARAMS
// Text to encode in the QR code on the face. // multiline
// Short strings make bigger, more reliable modules. Leave empty for a
// plain face with no code.
qr_text = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

// Which filament the QR modules print in. "Light on dark" gives a dark
// case with light modules (the code comes out inverted — most phones
// read it fine). "Dark on light" is the standard arrangement: a light
// background with dark modules, and it scans on everything.
qr_polarity = "Light on dark";  // [Light on dark, Dark on light]

// Length of the object the case holds, in mm — the long axis.
object_length = 43;

// Width of the object the case holds, in mm.
object_width = 31;

// Height of the object the case holds, in mm — how deep the pocket is.
object_height = 11.5;

// Corner radius of the object, in mm. 0 gives a sharp-cornered pocket.
object_corner_r = 9;

// Slip fit around the object, in mm, per side. Raise it if the object
// binds, lower it if it rattles.
fit_clearance = 0.3;

// Wall thickness around the pocket, in mm.
wall = 2;

// Solid material between the bottom of the pocket and the QR band, in mm.
face_thickness = 1.5;

// Height of the two-colour QR band, in mm. This is how far the second
// filament prints for.
qr_thickness = 1;

// Gap between the code and the outer edge, in mm. Gives the code a
// quiet zone and keeps it clear of the rounded corners.
qr_margin = 2;
// END_PARAMS

// Error correction level. "L" (~7% recovery) yields the fewest modules,
// so each one prints as large as the face allows.
qr_error_correction = "L";

// ============================================================
// Derived dimensions
// ============================================================
pocket_l = object_length + 2 * fit_clearance;
pocket_w = object_width  + 2 * fit_clearance;
pocket_h = object_height + fit_clearance;

outer_l = pocket_l + 2 * wall;
outer_w = pocket_w + 2 * wall;

total_h = pocket_h + face_thickness + qr_thickness;
qr_z    = pocket_h + face_thickness;
qr_size = min(outer_l, outer_w) - 2 * qr_margin;

// Clamped so an over-large radius in the customizer rounds the pocket
// all the way into a stadium rather than past it. outer_r tracks it so
// the wall stays uniform, and stays within its own half-side because
// min(outer_l, outer_w) is min(pocket_l, pocket_w) + 2 * wall.
pocket_r = min(object_corner_r + fit_clearance, min(pocket_l, pocket_w) / 2);
outer_r  = pocket_r + wall;

// ============================================================
// Geometry helpers
// ============================================================

// Rounded rectangle, centred. Built as a hull of corner circles rather
// than offset(square(...)) so that a radius at the clamp — half the
// shorter side — degenerates into a stadium instead of into a
// zero-area square, which offset() would turn into an empty model.
module rounded_rect(l, w, r) {
    if (r <= 0)
        square([l, w], center = true);
    else
        hull()
            for (x = [-1, 1], y = [-1, 1])
                translate([x * (l / 2 - r), y * (w / 2 - r)])
                    circle(r = r);
}

module outer_profile() {
    rounded_rect(outer_l, outer_w, outer_r);
}

module pocket_profile() {
    rounded_rect(pocket_l, pocket_w, pocket_r);
}

// Outer solid, before the pocket is removed.
module case_solid() {
    linear_extrude(total_h)
        outer_profile();
}

// The object pocket — open at z = 0, so it faces away from the QR.
module pocket() {
    translate([0, 0, -1])
        linear_extrude(pocket_h + 1)
            pocket_profile();
}

// The case itself, with no QR band split out yet.
module case_shell() {
    difference() {
        case_solid();
        pocket();
    }
}

// The full face band the two filaments share.
module qr_band() {
    translate([0, 0, qr_z])
        linear_extrude(qr_thickness)
            outer_profile();
}

// The code's dark cells, clipped to the face so a small qr_margin can't
// leave modules hanging past the rounded corners.
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
module case_dark() {
    if (qr_polarity == "Dark on light")
        union() {
            difference() {
                case_shell();
                qr_band();
            }
            qr_cells();
        }
    else
        difference() {
            case_shell();
            qr_cells();
        }
}

// Everything printed in the accent filament (white by default), QR face up.
module case_light() {
    if (qr_polarity == "Dark on light")
        difference() {
            qr_band();
            qr_cells();
        }
    else
        qr_cells();
}
