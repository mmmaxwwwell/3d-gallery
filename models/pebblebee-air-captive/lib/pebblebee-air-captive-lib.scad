include <BOSL2/std.scad>

// BEGIN_DESCRIPTION
// A one-piece cover for the Pebblebee Air tracker. No cap, no screws, and
// nothing to thread.
// The collar runs in a channel along the underside. The slot in the bottom of
// that channel is a few mm narrower than the strap, so the strap presses in
// through it and a lip down each side holds it there. Directly above the
// channel — sitting on it, never cut into it — is the cavity for the tracker,
// long side along the strap. The case is closed on every face but that one
// slot: the tracker goes in and comes out the same way the strap does, through
// the underside.
// Print it in a flexible filament (TPU). The lip is an interference fit on
// both the strap and the tracker, and it is the filament's give that lets
// them past it.
// Takes a few lines of text on the top — a name, a phone number — inlaid in a
// second colour.
// END_DESCRIPTION

// BEGIN_PARAMS
// Text on the top of the case, bold sans. // multiline
// Each line break starts a new line; the lines are centered as one block and
// read along the strap. Lines too long for the top are cut off at its edge.
// Leave empty for none.
top_text = "IF FOUND\n555-555-0123";

// Height of the text, in mm. Every line shares it.
text_size = 3.5;

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

// How far the lip reaches in from each side of the slot in the underside, in
// mm. This is the only thing holding either part in. At 2 mm the slot comes
// out 3.2 mm under a 25.4 mm strap and 3.8 mm under the tracker, so both have
// to be worked past it and neither falls back out. Raise it to grip harder,
// lower it for an easier fit. It has to beat strap_clearance or the slot ends
// up wider than the strap and nothing holds it in at all.
strap_lip_width = 2;
// END_PARAMS

// ============================================================
// Pebblebee Air Dimensions
// ============================================================
tag_length    = 41.1;     // mm - Pebblebee Air (X axis, along the strap)
tag_width     = 26;       // mm - (Y axis, across the strap)
tag_height    = 4.8;      // mm - thickness (Z axis)
tag_corner_r  = 1.75;     // mm - plan-view corner radius (3.5 across)
tag_clearance = 0.4;      // mm - slip fit around the tracker

// ============================================================
// Case Parameters
// ============================================================
wall_thickness   = 1.6;  // mm - wall thickness on every side. No screws pass
                         //      through it, so it carries nothing but itself.
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
text_thickness   = 1;    // mm - depth of the text inlay; 5 layers, so the white
                         //      covers the black under it
text_backing     = 0.8;  // mm - solid plastic left under the text recess
top_cut_l        = 10;   // mm - length of the window in the top over the
                         //      tracker's +X end, cut down level with its face,
                         //      open at both sides, for the charging clip
top_end_capture  = 1.5;  // mm - how much of the tracker's +X end the top still
                         //      covers past the window, so that end stays captive
top_cut_rounding = 0.7;  // mm - round on every edge the cut leaves. Twice this
                         //      has to stay under the wall beside the tracker.
cut_overlap      = 1;    // mm - how far one cut runs into the next. Adjacent
                         //      cuts must never stop on a shared plane; see
                         //      CLAUDE.md for the 8-micron film this prevents.

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
// full length. The tracker is barely wider than a 1 in strap, so at the
// defaults these are 0.3 mm and the strap is the tracker's real floor; they
// still keep the cavity walls standing on something rather than on the channel.
shoulder_w = (cavity_w - channel_w) / 2;

slot_w = channel_w - 2 * strap_lip_width;
// As long as the cavity, so the tracker slides straight up through it with no
// floor under its ends to be worked past. The end strips still close the
// underside beyond it.
slot_l = cavity_l;

// The text is recessed into the top face, so the top wall has to carry it plus
// a solid backing — otherwise the recess opens into the cavity.
top_thickness = text_thickness + text_backing;

case_length   = cavity_l + 2 * capture_length;
case_width    = cavity_w + 2 * wall_thickness;
case_corner_r = tag_corner_r + wall_thickness;

// z = 0 is the underside of the case (the face against the dog).
z_channel = lip_height;              // strap rests on the lip
z_cavity  = z_channel + channel_h;   // tracker rests on the strap
case_height = z_cavity + tag_height + tag_clearance + top_thickness;

text_font      = "Liberation Sans:style=Bold";
text_line_gap  = 1.4 * text_size;
text_lines     = top_text == "" ? [] : str_split(top_text, "\n");
text_lines_n   = len(text_lines);
text_block     = text_lines_n == 0 ? 0 : text_size + (text_lines_n - 1) * text_line_gap;
flat_top_w     = case_width - 2 * edge_rounding;
// Centred in what the top cut leaves of the flat top.
text_x         = (tag_length / 2 - top_end_capture - top_cut_l - (case_length / 2 - edge_rounding)) / 2;

top_cut_x1 = tag_length / 2 - top_end_capture;
top_cut_x0 = top_cut_x1 - top_cut_l;
z_face     = z_cavity + tag_height;

assert(text_block <= flat_top_w,
       str("text_size of ", text_size, " mm stacks the lines wider than the flat top (",
           flat_top_w, " mm); at most ", flat_top_w / (1 + 1.4 * (text_lines_n - 1)), " mm"));

assert(2 * top_cut_rounding < wall_thickness,
       str("top_cut_rounding of ", top_cut_rounding, " mm rounds the wall beside the tracker to a knife edge; max is ",
           wall_thickness / 2, " mm"));

assert(shoulder_w > 0,
       str("strap_width of ", strap_width, " mm is wider than the tracker's cavity; max is ",
           cavity_w - 2 * strap_clearance, " mm"));

assert(slot_corner_r >= 0 && slot_corner_r <= slot_w / 2,
       str("slot_corner_r of ", slot_corner_r, " mm must be between 0 and ", slot_w / 2, " mm"));

assert(strap_lip_width > strap_clearance && slot_w > 2 * lip_rounding,
       str("strap_lip_width of ", strap_lip_width, " mm does not hold the strap; it must be over ",
           strap_clearance, " mm and under ", (channel_w - 2 * lip_rounding) / 2, " mm"));

// ============================================================
// Geometry Modules
// ============================================================

// The outside of the case, eroded by inset: at inset 0 the full shell, closed
// on every face. The only way into the case is the slot underneath.
module case_shell(inset = 0) {
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
            sphere(r = edge_rounding - inset, $fn = 20);
        }
}

// The shell with its +X end of the top taken down to the tracker's face, from
// top_cut_x0 to top_cut_x1, across the full width, every edge the cut leaves
// rounded. Built as an opening: the shell eroded by the rounding, split into the
// three convex pieces the cut leaves of it (the full-height top either side,
// and everything below the cut), each grown back by a sphere. Growing a convex
// piece is exact, so the shell away from the cut comes back unchanged, and every
// convex edge along the cut comes back round. Convex pieces also keep
// minkowski() cheap under CGAL, which the customizer renders with.
module case_outer() {
    r = top_cut_rounding;
    big = 2 * (case_length + case_width + case_height);
    pieces = [
        [[-big, -big, -big], [top_cut_x0 - r + big, 2 * big, 2 * big]],
        [[top_cut_x1 + r, -big, -big], [big, 2 * big, 2 * big]],
        [[-big, -big, -big], [2 * big, 2 * big, z_face - r + big]],
    ];
    for (p = pieces)
        minkowski() {
            intersection() {
                case_shell(r);
                translate(p[0]) cube(p[1]);
            }
            sphere(r = r, $fn = 16);
        }
}

// Rounds the rim where the cut's floor meets the cavity, down the walls either
// side of the tracker.
module top_cut_rim() {
    intersection() {
        translate([0, 0, z_face])
            mirror([0, 0, 1])
                flared_edge(rect([cavity_l, cavity_w], rounding = tag_corner_r, $fn = 40),
                            top_cut_rounding, $fn = 40);
        translate([top_cut_x0, -case_width, z_face - 2 * cut_overlap])
            cube([top_cut_l, 2 * case_width, 4 * cut_overlap]);
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

// Reads along the strap. Clipped to the shell, so an over-long line stops at
// an edge instead of standing proud of it.
module top_text_block() {
    intersection() {
        case_outer();
        translate([text_x, 0, case_height - text_thickness + 0.01])
            for (i = [0 : text_lines_n - 1])
                translate([0, ((text_lines_n - 1) / 2 - i) * text_line_gap, 0])
                    linear_extrude(text_thickness)
                        text(text_lines[i], size = text_size, font = text_font,
                             halign = "center", valign = "center");
    }
}

// ============================================================
// Public Modules — called by consumers
// ============================================================

// The whole printable part, sitting on the bed at z = 0.
module case() {
    difference() {
        case_outer();
        tag_cavity();
        strap_channel();
        strap_slot();
        top_cut_rim();
        if (text_lines_n > 0) top_text_block();
    }
}
