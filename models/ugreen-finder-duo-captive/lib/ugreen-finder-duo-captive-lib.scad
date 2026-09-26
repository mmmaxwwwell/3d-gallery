include <BOSL2/std.scad>
include <qr.scad>

// BEGIN_DESCRIPTION
// A one-piece cover for the UGREEN Finder Duo Air tracker. No cap, no screws,
// and nothing to thread.
// The collar runs in a channel along the underside. The slot in the bottom of
// that channel is a few mm narrower than the strap, so the strap presses in
// through it and a lip down each side holds it there. Directly above the
// channel — sitting on it, never cut into it — is the cavity for the tracker.
// The case is closed on every face but that one slot: the tracker goes in and
// comes out the same way the strap does, through the underside.
// Print it in a flexible filament (TPU). The lip is an interference fit on
// both the strap and the tracker, and it is the filament's give that lets
// them past it.
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

// Text on the top at the opposite end from the QR code. // multiline
// Each line break starts a new line; the lines are centered as one block.
// Leave empty for none.
top_text = "IF FOUND\nSCAN ME";

// Font for the text. The WASM customizer ships with the
// Liberation family only.
font_style = "Sans Bold";  // [Sans Bold, Sans, Serif Bold, Serif, Mono Bold, Mono]

// Height of the text, in mm. Every line shares it.
text_size = 3;

// Width of your collar strap, in mm. 25.4 mm (1 in) is the common
// large-dog biothane size. Measure the strap, not the buckle.
strap_width = 25.4;

// Thickness of your collar strap, in mm. 3 mm suits biothane or a
// thick nylon strap; thin webbing is closer to 1.5 mm.
strap_thickness = 3;

// How long the solid strip at each end is, in mm — the stretch at the front
// and back of the case where the underside is closed and the strap is fully
// enclosed rather than just pressed in behind the lip. This is what actually
// holds the collar on; the lip along the middle only keeps it seated. Longer
// grips better and resists twisting, shorter makes the case smaller.
capture_length = 6;

// Corner radius of the tracker's square footprint, in mm. Measured off the
// photos rather than a spec sheet — if the tracker rocks in the cavity or
// will not seat, this is the number to adjust.
tag_corner_r = 8;

// How far the lip reaches in from each side of the slot in the underside, in
// mm. This is the only thing holding either part in. At 2 mm the slot comes
// out 3.2 mm under a 25.4 mm strap and 13.8 mm under the tracker, so both have
// to be worked past it and neither falls back out. Raise it to grip harder,
// lower it for an easier fit. It has to beat strap_clearance or the slot ends
// up wider than the strap and nothing holds it in at all.
strap_lip_width = 2;
// END_PARAMS

// BEGIN_SLICER_SETTINGS
top_single_wall_layers = 7;
// END_SLICER_SETTINGS

qr_thickness = 1.4;  // mm - thickness of QR code modules

// ============================================================
// UGREEN Finder Duo Air Dimensions
// ============================================================
tag_length    = 36;       // mm - UGREEN Finder Duo Air (X axis, along the strap)
tag_width     = 36;       // mm - square footprint
tag_height    = 9.8;      // mm - thickness (Z axis)
tag_clearance = 0.4;      // mm - slip fit around the tracker

// ============================================================
// Case Parameters
// ============================================================
wall_thickness   = 1.6;  // mm - wall thickness on every side. No screws pass
                         //      through it, so it carries nothing but itself.
qr_backing       = 0.8;  // mm - solid plastic left under the QR recess
strap_clearance  = 0.4;  // mm - slip fit on the strap's width only
lip_height       = 1.2;  // mm - thickness of the lip under the strap
lip_rounding     = 0.6;  // mm - rounding on the bottom slot's dog-facing edges
slot_corner_r    = 2;    // mm - plan-view radius on the bottom slot's corners,
                         //      so the lip has no sharp corner to tear from
strap_edge_d     = 2.5;  // mm - diameter of the round on the strap's edges
// The channel's long edges take the strap's own round, so the strap fills its
// corners. Capped at half the channel height for a strap too thin to carry it.
channel_rounding = min(strap_edge_d / 2, strap_thickness / 2);
// Concentric with the channel's bottom edges, so the lip under the strap
// wraps its edge at an even thickness.
edge_rounding    = channel_rounding + lip_height;
cut_overlap      = 1;    // mm - how far one cut runs into the next. Adjacent
                         //      cuts must never stop on a shared plane; see
                         //      CLAUDE.md for the 8-micron film this prevents.
qr_end_margin    = 4.5;  // mm - from the case's -X end to the QR's edge

// ============================================================
// USB-C Port Cutout Parameters
// ============================================================
// Centred on the -Y side face. The tracker is square, so the choice is only
// between a side and an end — and an end would have to be bored through a
// capture_length strip, which is the one part of the case that has a job to do.
usbc_width  = 14;
usbc_height = 7;
usbc_depth  = 10;
usbc_rounding = 2;
usbc_offset   = -1.25;  // mm - from the tracker's mid-height, positive is up

// ============================================================
// Derived Dimensions
// ============================================================
cavity_l = tag_length + 2 * tag_clearance;
cavity_w = tag_width  + 2 * tag_clearance;

channel_w = strap_width + 2 * strap_clearance;
// No clearance in Z: the strap's top face is the tracker's floor over the
// middle of the case, so anything added here becomes slop under the tracker.
channel_h = strap_thickness;

// What survives of the underside either side of the strap channel, running the
// full length. The tracker rests on these, which is what lets the cavity sit
// straight on top of the channel with no printed floor in between — and a
// floor there would have to bridge the whole channel, in TPU, for the length
// of the case.
shoulder_w = (cavity_w - channel_w) / 2;

slot_w = channel_w - 2 * strap_lip_width;
// As long as the cavity, so the tracker slides straight up through it with no
// floor under its ends to be worked past. The end strips still close the
// underside beyond it.
slot_l = cavity_l;

// The QR is recessed into the top face, so the top wall has to carry it plus a
// solid backing — otherwise the recess opens into the cavity.
top_thickness = qr_thickness + qr_backing;

case_length   = cavity_l + 2 * capture_length;
case_width    = cavity_w + 2 * wall_thickness;
case_corner_r = tag_corner_r + wall_thickness;

// z = 0 is the underside of the case (the face against the dog).
z_channel = lip_height;              // strap rests on the lip
z_cavity  = z_channel + channel_h;   // tracker rests on the shoulders + strap
case_height = z_cavity + tag_height + tag_clearance + top_thickness;

// Just inside the flat top across Y, and toward the -X end: its -X edge stops
// about 2.5mm short of the rounded end and its -X corners clear the
// rounded corners in plan. Tight on quiet zone; qr_dark_modules() still clips
// it to the shell if it grows.
qr_size = 32.3;
qr_x = -(case_length / 2 - qr_end_margin - qr_size / 2);

// The text follows the QR at a fixed gap rather than centering in what is
// left, so the two move as one when qr_end_margin changes. At the defaults the
// block's +X edge stops about 1.5mm short of the rounded end; top_text_block()
// still clips it to the shell for larger text.
text_thickness = qr_thickness;
text_line_gap  = 1.4 * text_size;
text_gap       = 0.8;  // mm - between the QR's +X edge and the text
text_font =
    font_style == "Sans Bold"  ? "Liberation Sans:style=Bold"  :
    font_style == "Sans"       ? "Liberation Sans"             :
    font_style == "Serif Bold" ? "Liberation Serif:style=Bold" :
    font_style == "Serif"      ? "Liberation Serif"            :
    font_style == "Mono Bold"  ? "Liberation Mono:style=Bold"  :
    font_style == "Mono"       ? "Liberation Mono"             :
    "Liberation Sans:style=Bold";
has_inlay = qr_code_text != "" || top_text != "";
text_lines   = top_text == "" ? [] : str_split(top_text, "\n");
text_lines_n = len(text_lines);
text_block   = text_lines_n == 0 ? 0 : text_size + (text_lines_n - 1) * text_line_gap;
text_x       = qr_x + qr_size / 2 + text_gap + text_block / 2;
usbc_z  = z_cavity + tag_height / 2 + usbc_offset;

assert(text_x + text_block / 2 < case_length / 2,
       str("text_size of ", text_size, " mm runs the text off the end of the case; at most ",
           (case_length / 2 - (qr_x + qr_size / 2) - text_gap) / (1 + 1.4 * (text_lines_n - 1)), " mm"));

assert(shoulder_w > 0,
       str("strap_width of ", strap_width, " mm leaves the tracker no shoulder to rest on; max is ",
           cavity_w - 2 * strap_clearance, " mm"));

assert(slot_corner_r >= 0 && slot_corner_r <= slot_w / 2,
       str("slot_corner_r of ", slot_corner_r, " mm must be between 0 and ", slot_w / 2, " mm"));

assert(strap_lip_width > strap_clearance && slot_w > 2 * lip_rounding,
       str("strap_lip_width of ", strap_lip_width, " mm does not hold the strap; it must be over ",
           strap_clearance, " mm and under ", (channel_w - 2 * lip_rounding) / 2, " mm"));

// ============================================================
// Geometry Modules
// ============================================================

// Closed on every face. The only way into the case is the slot underneath.
module case_shell() {
    translate([0, 0, case_height / 2])
        minkowski() {
            cuboid(
                [case_length - 2 * edge_rounding,
                 case_width  - 2 * edge_rounding,
                 case_height - 2 * edge_rounding],
                rounding = case_corner_r - edge_rounding,
                edges = "Z",
                $fn = 40
            );
            sphere(r = edge_rounding, $fn = 20);
        }
}

// The strap path, the full length of the underside. Over the cavity its roof is
// the tracker itself; only under the two end walls does it get a printed one,
// and there it is exactly channel_h tall — this cut reaches the outside faces,
// so any slack added here shows up as a loose strap slot on the end of the case.
// The overlap with the cavity above is tag_cavity()'s job instead.
module strap_channel() {
    translate([0, 0, z_channel + channel_h / 2])
        cuboid([case_length + 2, channel_w, channel_h],
               rounding = channel_rounding, edges = "X", $fn = 20);
    // Where the channel leaves each end face, the same round flares it out so
    // the strap never bends over a square edge.
    for (s = [0, 1])
        mirror([s, 0, 0])
            translate([case_length / 2, 0, z_channel + channel_h / 2])
                rotate([0, -90, 0])
                    flared_edge(rect([channel_h, channel_w], rounding = channel_rounding, $fn = 20),
                                channel_rounding, $fn = 20);
}

// A cut's outline, flared out by r where it meets the face at z = 0 and back to
// the outline itself by z = r: a negative-radius round on the cut's edge. Built
// from hulls of thin slices rather than offset_sweep(), because OpenSCAD-WASM
// (the customizer) renders with CGAL, which crashes on offset_sweep's mesh.
module flared_edge(outline, r, steps = 8) {
    function slice_d(j) = r - r * sin(90 * j / steps);
    function slice_z(j) = r - r * cos(90 * j / steps);
    module slice(d, z) {
        translate([0, 0, z]) linear_extrude(0.01) offset(r = d) polygon(outline);
    }
    hull() { slice(r, -cut_overlap); slice(r, 0); }
    for (j = [0 : steps - 1])
        hull() { slice(slice_d(j), slice_z(j)); slice(slice_d(j + 1), slice_z(j + 1)); }
}

// The slot in the underside both parts are pressed through, narrower than the
// channel by strap_lip_width at each side. What is left either side of it is
// the lip that holds them in.
module strap_slot() {
    z0 = -1;
    z1 = z_channel + cut_overlap;
    outline = rect([slot_l, slot_w], rounding = slot_corner_r, $fn = 32);
    translate([0, 0, z0])
        linear_extrude(z1 - z0)
            polygon(outline);
    // A negative radius flares the cut outward at the underside, rounding the
    // dog-facing edge all the way round and giving the strap a lead-in.
    flared_edge(outline, lip_rounding, $fn = 32);
}

// Sits on top of the strap channel, adjacent to it and never cut into it. Its
// corner radius matches the tracker's, so the tracker seats rather than rattles.
module tag_cavity() {
    h = tag_height + tag_clearance;
    translate([0, 0, z_cavity + h / 2])
        cuboid([cavity_l, cavity_w, h], rounding = tag_corner_r, edges = "Z", $fn = 40);
    // Reaches cut_overlap down into the channel so the two cuts overlap rather
    // than meeting on the cavity floor plane. Clipped to the cavity's footprint
    // so it cannot break an end wall, and to well inside the channel's width so
    // it cannot take the top off a shoulder.
    intersection() {
        translate([0, 0, z_cavity])
            cuboid([cavity_l, cavity_w, 2 * cut_overlap],
                   rounding = tag_corner_r, edges = "Z", $fn = 40);
        translate([0, 0, z_cavity])
            cube([cavity_l + 2, channel_w - 2 * channel_rounding - 0.2, 4 * cut_overlap],
                 center = true);
    }
}

module usbc_cutout() {
    hw = usbc_width  / 2 - usbc_rounding;
    hh = usbc_height / 2 - usbc_rounding;
    translate([0, -(cavity_w / 2 + wall_thickness), usbc_z])
        rotate([90, 0, 0])
            hull() {
                for (x = [-hw, hw], z = [-hh, hh])
                    translate([x, z, 0])
                        cylinder(r = usbc_rounding, h = usbc_depth, center = true, $fn = 20);
            }
}

module qr_dark_modules() {
    intersection() {
        case_shell();
        translate([qr_x, 0, case_height - qr_thickness + 0.01])
            qr(qr_code_text, error_correction = "L",
               width = qr_size, height = qr_size, thickness = qr_thickness, center = true);
    }
}

// Reads with the +X end at the top, so the lines run across the case.
module top_text_block() {
    intersection() {
        case_shell();
        translate([text_x, 0, case_height - text_thickness + 0.01])
            rotate([0, 0, -90])
                for (i = [0 : text_lines_n - 1])
                    translate([0, ((text_lines_n - 1) / 2 - i) * text_line_gap, 0])
                        linear_extrude(text_thickness)
                            text(text_lines[i], size = text_size, font = text_font,
                                 halign = "center", valign = "center");
    }
}

// Everything inlaid in the top face, in the second colour.
module top_inlay() {
    if (qr_code_text != "") qr_dark_modules();
    if (text_lines_n > 0) top_text_block();
}

// ============================================================
// Public Modules — called by consumers
// ============================================================

// The whole printable part, sitting on the bed at z = 0.
module case() {
    difference() {
        case_shell();
        tag_cavity();
        strap_channel();
        strap_slot();
        usbc_cutout();
        if (has_inlay) top_inlay();
    }
}
