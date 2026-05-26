include <BOSL2/std.scad>
include <qr.scad>

// BEGIN_DESCRIPTION
// A protective case for the Fi Mini GPS tracker.
// Held together by 6 M3x6 SHCS (socket head cap screws).
// Supports an optional QR code on the top surface — enter your phone number,
// home address, emergency contact, vet info, or care instructions so anyone
// who finds your dog can scan the code and reach you.
// END_DESCRIPTION

// BEGIN_PARAMS
// Text to encode in the QR code on top of the case. // multiline
// You can include multiple lines: phone number, address,
// pet name, special care instructions, etc.
// Keep it short — more text means smaller QR modules,
// which may exceed your printer's resolution.
// Leave empty for no QR code.
qr_code_text = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
// END_PARAMS

// BEGIN_SLICER_SETTINGS
top_single_wall_layers = 7;
// END_SLICER_SETTINGS

qr_thickness = 1.4;  // mm - thickness of QR code modules

// ============================================================
// Fi Mini GPS Tracker Dimensions
// ============================================================
fi_length     = 43;      // mm - length of Fi Mini (X axis)
fi_width      = 31;      // mm - width of Fi Mini (Y axis)
fi_height     = 11.5;    // mm - height/thickness of Fi Mini (Z axis)
fi_corner_r   = 9;       // mm - corner radius on vertical edges

// ============================================================
// M3x6mm Socket Head Cap Screw (DIN 912 / ISO 4762)
// ============================================================
screw_shaft_d = 2.75;    // mm - shaft/thread outer diameter (M3)
screw_shaft_l = 6;       // mm - thread/shaft length
screw_head_d  = 5.5;     // mm - socket head diameter
screw_head_h  = 3;       // mm - socket head height

// ============================================================
// Case Parameters
// ============================================================
wall_thickness = 2;      // mm - wall thickness on sides and bottom
top_thickness  = 1;      // mm - wall thickness on top of case
edge_rounding  = 2;      // mm - rounding on top and bottom case edges

// ============================================================
// USB-C Port Cutout Parameters
// ============================================================
usbc_width  = 14;
usbc_height = 8;
usbc_depth  = 10;
usbc_rounding = 2;
usbc_z_offset = fi_height/2 + (wall_thickness - top_thickness) - usbc_height/2;

// ============================================================
// Collar Parameters
// ============================================================
collar_width     = 25.4; // mm - 1 inch collar width
collar_thickness = 3;    // mm - collar thickness

// ============================================================
// Screw Layout
// ============================================================
num_screws_per_side = 3;

// ============================================================
// Derived Dimensions
// ============================================================
case_length = fi_length + 2 * wall_thickness;
case_width  = fi_width + 2 * (1.5 + screw_shaft_d / 2 + screw_head_d / 2 + 0.5);
case_height = fi_height + 2 * wall_thickness;
screw_hole_d    = screw_shaft_d + 0.3;
screw_head_bore = screw_head_d  + 0.5;
full_case_height = fi_height + collar_thickness + 2 * wall_thickness;
case_z_top = (wall_thickness - collar_thickness) / 2 + full_case_height / 2;
qr_size = 35;
split_z = -fi_height / 2;

// ============================================================
// Geometry Modules
// ============================================================

module fi_mini_body() {
    cuboid(
        [fi_length, fi_width, fi_height],
        rounding = fi_corner_r,
        edges = "Z",
        $fn = 40
    );
}

module collar_cutout() {
    translate([0, 0, -(fi_height + collar_thickness) / 2])
        cube([case_length + 20, collar_width, collar_thickness], center = true);
}

module m3x6_shcs() {
    cylinder(d = screw_head_d, h = screw_head_h, $fn = 30);
    translate([0, 0, screw_head_h])
        cylinder(d = screw_shaft_d, h = screw_shaft_l, $fn = 30);
}

module screw_row(side = 1) {
    y_pos = side * (fi_width / 2 + 1.5 + screw_shaft_d / 2);
    z_bottom = -(fi_height / 2 + collar_thickness + wall_thickness);
    screw_spread = fi_length - 2 * (fi_corner_r + wall_thickness);
    translate([0, y_pos, z_bottom])
        xcopies(l = screw_spread, n = num_screws_per_side)
            m3x6_shcs();
}

module all_screws() {
    screw_row(side = 1);
    screw_row(side = -1);
}

module usbc_cutout() {
    hw = usbc_width / 2 - usbc_rounding;
    hh = usbc_height / 2 - usbc_rounding;
    translate([0, -(fi_width / 2 + wall_thickness), usbc_z_offset])
        rotate([90, 0, 0])
            hull() {
                for (x = [-hw, hw], z = [-hh, hh])
                    translate([x, z, 0])
                        cylinder(r = usbc_rounding, h = usbc_depth, center = true, $fn = 20);
            }
}

module full_case() {
    difference() {
        translate([0, 0, (wall_thickness - collar_thickness) / 2])
            minkowski() {
                cuboid(
                    [case_length - 2*edge_rounding, case_width - 2*edge_rounding, full_case_height - 2*edge_rounding],
                    rounding = fi_corner_r + wall_thickness - edge_rounding,
                    edges = "Z",
                    $fn = 40
                );
                sphere(r = edge_rounding, $fn = 20);
            }
        translate([0, 0, (wall_thickness - top_thickness) / 2])
            cuboid(
                [fi_length, fi_width, fi_height + wall_thickness - top_thickness + 0.01],
                rounding = fi_corner_r,
                edges = "Z",
                $fn = 40
            );
        collar_cutout();
        all_screws();
        usbc_cutout();
    }
}

module qr_dark_modules() {
    translate([0, 0, case_z_top - qr_thickness + 0.01])
        mirror([0, 1, 0])
            qr(qr_code_text, error_correction = "L",
               width = qr_size, height = qr_size, thickness = qr_thickness, center = true);
}

module qr_pocket() {
    translate([0, 0, case_z_top - qr_thickness + 0.01])
        linear_extrude(qr_thickness)
            square([qr_size, qr_size], center = true);
}

module top_half() {
    intersection() {
        full_case();
        translate([0, 0, (split_z + 50) / 2])
            cube([200, 200, 50 - split_z], center = true);
    }
}

module bottom_half() {
    intersection() {
        full_case();
        translate([0, 0, (split_z - 50) / 2])
            cube([200, 200, split_z + 50], center = true);
    }
}

// ============================================================
// Public Modules — called by consumers
// ============================================================

// Cap: top half of case, positioned for printing (split face on z=0).
// Single-color render includes QR recesses; multicolor adds white fill.
module cap() {
    translate([0, 0, fi_height / 2])
        if (qr_code_text != "") {
            difference() {
                top_half();
                qr_dark_modules();
            }
        } else {
            top_half();
        }
}

// Base: bottom half of case, flipped for printing (split face on z=0).
module base() {
    translate([0, 0, 2 * split_z])
        rotate([180, 0, 0])
            translate([0, 0, split_z])
                bottom_half();
}

