include <BOSL2/std.scad>

// BEGIN_DESCRIPTION
// A pet collar tag. Pick a body shape (circle, hexagon, or bean), type
// a name, choose a font, and the tag emerges with the name and a border
// edge raised on the top face. An integrated ring at the top attaches
// to the collar with a split ring or S-hook.
//
// Comes in two flavors:
//   * multicolor — body + raised text/edge in two different filaments,
//     printed as a single multi-material job.
//   * single    — same geometry as one solid, for single-filament
//     printers. The text and edge are still physically raised; they
//     just don't change color.
// END_DESCRIPTION

// BEGIN_PARAMS
// Body shape.
shape = "bean";  // [circle, hexagon, bean]

// Name (or short message) to emboss on the tag. Keep it short — 3–6
// characters fit best; longer strings shrink to fit inside the border.
tag_text = "BEANS";

// Font for the name text. The WASM customizer ships with the Liberation
// family (metrics-compatible with Arial / Times New Roman / Courier New).
font_style = "Sans Bold";  // [Sans Bold, Sans, Serif Bold, Serif, Mono Bold, Mono]

// How the text is laid out: "straight" reads left-to-right, "arc"
// curves the text along the top of the tag (each letter rotated to
// follow the arc, middle letter at the top of the curve).
text_style = "straight";  // [straight, arc]

// Text height in mm. Leave at 0 to size automatically based on the
// shape and size_mult; set to a positive number to override.
text_size_mm = 0;

// Nudge the text right (positive) or left (negative), in mm, from the
// shape's horizontal center. 0 keeps it centered.
text_offset_x = 0;

// Nudge the text up (positive) or down (negative), in mm, from the
// shape's default vertical placement. 0 uses the per-shape default
// (which already nudges the bean text below the top valley).
text_offset_y = 0;

// Size multiplier for the tag body. 1.0 is the default; 1.5 makes the
// tag 50% larger in every dimension (but the ring stays fixed so it
// still fits standard split rings).
size_mult = 1.0;

// Body thickness, in mm. The whole tag prints in the body filament up
// to this height.
thickness = 2.5;

// Height the text and border edge rise above the body, in mm. This is
// the depth of the second-color layer — the printer swaps filament at
// z = thickness and prints this much more on top in the accent color.
emboss_height = 0.6;

// Outer diameter of the collar-attachment ring, in mm. The ring is
// embedded ~3 mm into the body so a tug on the collar can't snap it
// off — only the hole and the top of the ring stick above the body.
ring_od = 10;

// Inner diameter of the ring hole, in mm — sized for whatever split
// ring or S-hook you'll attach.
ring_id = 5;
// END_PARAMS

// ============================================================
// Fixed styling (not customizable)
// ============================================================

// Width of the raised border edge, in mm.
edge_border = 1.6;

// Distance from the outer shape edge to the outside of the border,
// in mm — leaves a thin unraised lip around the outside.
edge_inset  = 1.2;

// Rectangular neck that ties the ring into the body. For shapes with a
// concave top (the bean) the neck bridges the gap at x=0 so the ring
// can't be torn free even if the shape doesn't reach the ring at that
// column of material.
neck_width  = 4.5;

// Resolve the friendly font enum to the actual OpenSCAD font string
// (family[:style=...]). Falls back to Sans Bold for anything unexpected.
text_font =
    font_style == "Sans Bold"  ? "Liberation Sans:style=Bold"  :
    font_style == "Sans"       ? "Liberation Sans"             :
    font_style == "Serif Bold" ? "Liberation Serif:style=Bold" :
    font_style == "Serif"      ? "Liberation Serif"            :
    font_style == "Mono Bold"  ? "Liberation Mono:style=Bold"  :
    font_style == "Mono"       ? "Liberation Mono"             :
                                 "Liberation Sans:style=Bold";

// Base 2D shape footprints at size_mult = 1.0, in mm.
base_circle_d = 30;   // diameter of the circle body
base_hex_d    = 32;   // flat-to-flat of the hexagon body

// Bean body — traced from a bezier-defined kidney silhouette. Bounding
// box at size_mult=1 is ~44 × 24 mm. See `bean_bezpath` below for the
// outline itself; these constants are the derived dimensions the layout
// math needs (ring position, arc-text center, etc).
bean_rx        = 22;  // half-width  (matches P0/P3 X coordinates)
bean_ry_top    = 12;  // top-most Y (matches lobe-peak Y)
bean_ry_bot    = 12.5;// bottom-most |Y| (matches bottom-sweep Y)
bean_valley_y  = 5.5; // Y of the top-center valley bottom
bean_valley_x  = 1;   // X offset of the valley (kidney asymmetry)

// ============================================================
// 2D shape modules — every shape is centered on the origin.
// ============================================================

module circle_shape() {
    circle(d = base_circle_d * size_mult);
}

// Flat-top hexagon (flats at top/bottom, vertices at left/right).
// $fn=6 on circle() places vertices at 0°, 60°, 120°, … — so the flats
// naturally land on the top and bottom of the Y axis.
module hex_shape() {
    apothem = base_hex_d * size_mult / 2;
    r       = apothem / cos(30);
    circle(r = r, $fn = 6);
}

// Kidney bean outline — a chain of cubic bezier segments walking
// clockwise from the left tip. Reads as a proper kidney silhouette:
// smooth convex bottom, two soft top lobes with a valley between them,
// slight kidney asymmetry (valley pulled a hair right of center).
//
// The outline is our own work, released to the public domain (CC0) —
// see LICENSE.txt in the model directory. Baked in as bezier control
// points rather than imported from an SVG so the shape renders
// identically in the CLI build and the WASM customizer (the WASM
// worker's virtual FS doesn't carry .svg files, so `import("bean.svg")`
// is not an option; the equivalent bean.svg is shipped alongside for
// reference and downstream re-use).
bean_bezpath = [
    [-bean_rx, 0],                                                                       // P0: left tip
    // Left tip → bottom-left
    [-bean_rx, -bean_ry_bot * 0.62], [-16, -bean_ry_bot], [-8, -bean_ry_bot],            // C, C, P1
    // Bottom-left → bottom-right (single wide sweep)
    [-2, -bean_ry_bot], [2, -bean_ry_bot], [8, -bean_ry_bot],                            // C, C, P2
    // Bottom-right → right tip
    [16, -bean_ry_bot], [bean_rx, -bean_ry_bot * 0.62], [bean_rx, 0],                    // C, C, P3
    // Right tip → right-lobe peak
    [bean_rx, bean_ry_top * 0.62], [15, bean_ry_top], [7, bean_ry_top],                  // C, C, P4
    // Right lobe → valley (kidney asymmetry: valley pulled right)
    [3, bean_ry_top], [bean_valley_x + 2, bean_valley_y + 0.5], [bean_valley_x, bean_valley_y], // C, C, P5
    // Valley → left-lobe peak
    [-1, bean_valley_y], [-4, bean_ry_top - 1], [-8, bean_ry_top],                       // C, C, P6
    // Left lobe → back to left tip (closes loop)
    [-16, bean_ry_top], [-bean_rx, bean_ry_top * 0.62], [-bean_rx, 0]                    // C, C, P7 = P0
];

// Density of the polygon walked around the bezier — 24 gives ~150 pts
// total, smooth-looking at any reasonable size_mult and cheap to CSG.
bean_splinesteps = 24;

module bean_shape() {
    scale([size_mult, size_mult])
        polygon(bezpath_curve(bean_bezpath, splinesteps = bean_splinesteps));
}

module body_shape() {
    if      (shape == "circle")  circle_shape();
    else if (shape == "hexagon") hex_shape();
    else                         bean_shape();
}

// ============================================================
// Derived layout
// ============================================================

// Effective top Y of the body shape at x = 0. For circle/hexagon this
// is the top of the bounding box; for the bean, it's the bottom of the
// top-valley (indent), so the ring lands on solid material at the
// center column, not floating over the concave valley.
function shape_top_y() =
    shape == "circle"  ? base_circle_d * size_mult / 2 :
    shape == "hexagon" ? base_hex_d    * size_mult / 2 :
    /* bean */           bean_valley_y * size_mult;

// Ring center Y — chosen so the bottom of the ring HOLE sits 0.5 mm
// inside the shape's top edge. That embeds the ring ~3 mm deep into
// the body (for the default ring_od=10, ring_id=5), giving it a solid
// mechanical anchor. Only the hole and the top rim of the ring stick
// above the body — a tug on the split ring pulls against 3 mm of
// material, not against a thin neck.
function ring_center_y() = shape_top_y() + ring_id / 2 - 0.5;

// Font size for the name text. `text_size_mm` (customizer param)
// overrides when non-zero; otherwise auto-size to the shape.
function text_size() =
    text_size_mm > 0 ? text_size_mm :
    shape == "circle"  ? base_circle_d * size_mult * 0.28 :
    shape == "hexagon" ? base_hex_d    * size_mult * 0.28 :
    /* bean */           bean_ry_top   * size_mult * 0.62;

// Per-shape default vertical placement. For the bean this nudges the
// text below the top valley so it clears the indent; the customizer's
// text_offset_y is added on top of this default.
function text_y_default() =
    shape == "bean" ? -3 * size_mult : 0;

// ── arc-text layout (per shape) ──────────────────────────────────
// Each shape defines an arc center + radius so `arc_text_2d()` can
// walk the letters around it. The arc curves DOWN at the ends (frown)
// with the middle letter at the top of the curve, so text arcs across
// the top face of the tag like a rainbow.

function arc_center_y() =
    shape == "circle"  ? -base_circle_d * size_mult * 0.35 :
    shape == "hexagon" ? -base_hex_d    * size_mult * 0.35 :
    /* bean */           -bean_ry_top   * size_mult * 1.6;

function arc_radius() =
    shape == "circle"  ? base_circle_d * size_mult * 0.55 :
    shape == "hexagon" ? base_hex_d    * size_mult * 0.55 :
    /* bean */           bean_ry_top   * size_mult * 1.7;

// ============================================================
// 2D geometry
// ============================================================

// Body outline: shape + ring + neck, unioned into one silhouette.
module body_2d() {
    union() {
        body_shape();
        // ring annulus
        translate([0, ring_center_y()])
            difference() {
                circle(d = ring_od);
                circle(d = ring_id);
            }
        // neck — rectangle from inside the body up to the bottom of the
        // ring hole (so it merges with the annulus but never fills the
        // hole). Belt-and-suspenders anchor for the bean, whose concave
        // top would otherwise leave only a thin bridge at x = 0.
        neck_top = ring_center_y() - ring_id / 2;
        translate([-neck_width / 2, -0.5])
            square([neck_width, neck_top + 0.5]);
    }
}

// The raised border edge — annulus of the body shape only. The ring
// and neck are excluded so the emboss ring doesn't obscure the hole.
module edge_border_2d() {
    difference() {
        offset(r = -edge_inset) body_shape();
        offset(r = -(edge_inset + edge_border)) body_shape();
    }
}

// Each letter of `str` walked around a frown-arc (middle letter at
// top of curve, ends dipping down). Character spacing uses an
// approximation of the average glyph advance width — good enough
// for names in the Liberation family without needing --enable=textmetrics
// in the WASM build; wide letters like W/M can crowd the neighbors on
// long strings.
module arc_text_2d(str, cx, cy, r, size, font) {
    n = len(str);
    if (n > 0) {
        // Approx: an average letter takes ~0.6 × size in width, and one
        // radian of arc at radius r covers r units. So angle per char
        // ≈ (0.6 × size / r) radians = (0.6 × size / r) × 180/π degrees.
        char_angle  = (size * 0.6 / r) * 180 / PI;
        total_angle = char_angle * (n - 1);
        translate([cx, cy])
            for (i = [0 : n - 1]) {
                angle = total_angle / 2 - i * char_angle;
                rotate([0, 0, angle])
                    translate([0, r])
                        text(str[i], size = size, font = font,
                             halign = "center", valign = "center");
            }
    }
}

// The tag name as 2D text. `text_style` chooses layout: straight
// `text()` centered inside the border, or per-letter arc walking a
// frown-shaped curve across the top of the shape. Either way the
// result is translated by (text_offset_x, text_offset_y) and clipped
// to the inside of the border so long strings shrink into the safe
// area rather than crashing the edge.
module text_2d() {
    intersection() {
        translate([text_offset_x, text_offset_y])
            if (text_style == "arc") {
                arc_text_2d(tag_text,
                            cx = 0, cy = arc_center_y(), r = arc_radius(),
                            size = text_size(), font = text_font);
            } else {
                translate([0, text_y_default()])
                    text(tag_text, size = text_size(), font = text_font,
                         halign = "center", valign = "center");
            }
        offset(r = -(edge_inset + edge_border + 0.4)) body_shape();
    }
}

// ============================================================
// Public modules — called by the preview / customizer
// ============================================================

// Full body extrusion in the primary filament color.
module body() {
    linear_extrude(thickness) body_2d();
}

// Text + border edge extrusion in the accent filament color, sitting on
// top of the body.
module emboss() {
    translate([0, 0, thickness])
        linear_extrude(emboss_height)
            union() {
                edge_border_2d();
                text_2d();
            }
}

// Multicolor variant: two named subtrees so the multicolor 3MF builder
// (both the CLI and the WASM path) can split the geometry per color.
// The gallery's preview file calls color() on these directly at the
// top level; this module is here for GUI convenience.
module multicolor() {
    color("orange")  body();
    color("#a5560a") emboss();
}

// Single-color variant: body + emboss fused into one solid, so it
// prints correctly on a single-filament printer. The text and edge
// stay physically raised; they just don't change color.
module single() {
    union() {
        body();
        emboss();
    }
}
