include <BOSL2/std.scad>
include <BOSL2/hinges.scad>
include <BOSL2/joiners.scad>

// BEGIN_DESCRIPTION
// A folding panel divider printed in one piece, already folded. Flat
// panels are joined edge to edge by interlocking knuckle hinges with the
// pin printed through the bore, so the strip comes off the bed hinged —
// no assembly, no hardware. Unfold it accordion-style to stand it up as
// a room divider, a draught screen or a pet barrier; fold it back and it
// stacks to one panel wide.
//
// Consecutive panels carry their knuckles on opposite faces, so the run
// zig-zags rather than curling one way. Snap joiners along the top and
// bottom edges let two strips stack for a taller screen.
// END_DESCRIPTION

// BEGIN_PARAMS
// Height of the divider (mm) — the panel dimension running along the
// hinge lines. Those lines stand vertical both on the bed and in use, so
// this is also how tall the print is.
panel_height = 240;

// Width of one panel (mm), measured across the fold. An unfolded strip
// spans this much per panel.
panel_width = 240;

// Thickness of one panel (mm). Also the fold pitch — a folded strip is
// num_panels times this thick.
panel_thickness = 7;

// Panels in one strip. Every panel but the first and last is hinged on
// both edges.
num_panels = 8;

// Knuckle segments per hinge, counting both halves. Each knuckle is
// panel_height/hinge_segments long and the pin sits half that off the
// panel face, so raising this too far drops the pin inside the knuckle
// barrel and OpenSCAD stops on a BOSL2 assertion.
hinge_segments = 40;

// Radius of the rounding applied to every panel edge (mm).
corner_radius = 1;

// Clearance around the moving parts (mm) — the gap between neighbouring
// knuckles, the extra radius on the relief that lets a panel swing clear
// of its neighbour's hinge, and the set-back on each panel face.
clearance = 0.35;

// Snap joiners along the top edge, to take a strip stacked above.
top_joiners = true;

// Snap joiners along the bottom edge, to sit on the strip below.
bottom_joiners = false;

// Spread the panels apart to see into the hinges. Inspection only — an
// exploded strip is not printable.
explode = false;
// END_PARAMS

// The pin is printed in place, running through both halves of every
// knuckle. The fixed half's bore is undersized so the pin fuses to it;
// the free half's is oversized so it can still turn. The three only work
// as a set — pin_bore_fixed < pin_diameter < pin_bore_free.
pin_diameter   = 1.65;
pin_bore_fixed = 1.5;
pin_bore_free  = 2;

// BOSL2 half_joiner length. Joiners sit three lengths apart, so the count
// is however many fit across a panel at that pitch.
joiner_length = 15;

// One folded strip. `top` / `bottom` override the top_joiners /
// bottom_joiners params for this instance, which is how a preview shows
// both halves of a stacking pair without redefining a param. Leave them
// undef and the params win.
module strip(top = undef, bottom = undef) {
    want_top    = is_undef(top)    ? top_joiners    : top;
    want_bottom = is_undef(bottom) ? bottom_joiners : bottom;

    for (i = [1:num_panels])
        rotate([0, 90, 0])
        translate([0, 0, explode ? i * panel_thickness : 0])
        union() {
            if (i != num_panels)
                rotate([0, 0, (i + 1) % 2 ? 0 : 180])
                translate([0, 0, panel_thickness * (i + 1)])
                translate([0, panel_width / 2, -panel_thickness / 2])
                rotate([0, 90, 0])
                cylinder(d = pin_diameter, h = panel_height, center = true);

            rotate([0, 0, i % 2 ? 0 : 180])
            translate([0, 0, panel_thickness * i])
            _panel(
                first  = i == 1,
                last   = i == num_panels,
                odd    = i % 2,
                top    = want_top,
                bottom = want_bottom
            );
        }
}

module _panel(first, last, odd, top, bottom) {
    knuckle_pitch = panel_height / hinge_segments;
    joiner_width  = panel_thickness * 0.8;
    joiners       = floor((floor(panel_width / joiner_length) - 1) / 3);

    render() {
        difference() {
            minkowski() {
                cube([panel_height    - corner_radius * 2,
                      panel_width     - corner_radius * 2,
                      panel_thickness - clearance * 2 - corner_radius * 2],
                     center = true);
                sphere(r = corner_radius);
            }

            // Scallop the hinged edges so a panel swings clear of the
            // neighbouring panel's knuckles instead of binding on them.
            if (!last)
                translate([0, -panel_width / 2, panel_thickness / 2])
                rotate([0, 90, 0])
                cylinder(r = knuckle_pitch / 3 + clearance, h = panel_height, center = true);

            if (!first)
                translate([0, panel_width / 2, -panel_thickness / 2])
                rotate([0, 90, 0])
                cylinder(r = knuckle_pitch / 3 + clearance, h = panel_height, center = true);

            if (top)
                _joiner_row(odd, true, joiners)
                    half_joiner_clear(l = joiner_length, w = joiner_width);

            if (bottom)
                _joiner_row(odd, false, joiners)
                    half_joiner_clear(l = joiner_length, w = joiner_width);
        }

        if (top)
            _joiner_row(odd, true, joiners)
                half_joiner(l = joiner_length, w = joiner_width);

        if (bottom)
            _joiner_row(odd, false, joiners)
                half_joiner2(l = joiner_length, w = joiner_width);

        if (!last)
            translate([0, -panel_width / 2 + knuckle_pitch / 2, panel_thickness / 2])
            rotate([90, 0, 0])
            _hinge(inner = false, knuckle_pitch = knuckle_pitch);

        if (!first)
            translate([0, panel_width / 2 - knuckle_pitch / 2, -panel_thickness / 2])
            rotate([270, 0, 0])
            _hinge(inner = true, knuckle_pitch = knuckle_pitch);
    }
}

// strip() turns the even-numbered panels 180 degrees about Z; the odd ones
// take a 180 about Y here instead. Either way local +X lands on the same
// world edge, so every panel's top joiners end up on the strip's top.
module _joiner_row(odd, top, n) {
    rotate([0, odd ? 180 : 0, 0])
    translate([top ? panel_height / 2 : -panel_height / 2, 0, 0])
    rotate([0, top ? 90 : 270, 0])
    ycopies(n = n, spacing = joiner_length * 3)
    children();
}

module _hinge(inner, knuckle_pitch) {
    knuckle_hinge(
        length    = panel_height,
        segs      = hinge_segments,
        offset    = knuckle_pitch / 2,
        inner     = inner,
        arm_angle = 90,
        clear_top = true,
        fill      = false,
        pin_diam  = inner ? pin_bore_free : pin_bore_fixed,
        gap       = clearance
    );
}
