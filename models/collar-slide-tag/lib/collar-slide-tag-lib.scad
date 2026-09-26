// BEGIN_DESCRIPTION
// A slide-on pet collar tag. The collar strap threads straight through a
// slot in the tag, so there is no split ring, nothing dangling, and
// nothing to jingle or snag. Type a name and the tag sizes itself around
// both the name and your strap.
//
// The name is recessed into the top face. Comes in two flavors:
//   * single     — one filament; the name is an engraved pocket.
//   * multicolor — the same pocket filled with an accent-color inlay
//     whose top surface is flush with the tag, printed as a single
//     multi-material job.
// END_DESCRIPTION

// BEGIN_PARAMS
// Name to put on the tag.
name = "Name";

// Font for the name. These are the faces shipped in both the Nix devshell
// and the WASM customizer's font bundle — the Liberation family, which is
// metrically compatible with Arial / Times New Roman / Courier New.
font_style = "Sans Bold";  // [Sans Bold, Sans, Serif Bold, Serif, Mono Bold, Mono]

// Width of your collar strap, in mm. 25 mm (1 in) is the common
// large-dog size. Measure the strap itself, not the buckle.
collar_width = 25;

// Thickness of your collar strap, in mm. 3 mm suits a thick nylon or
// biothane strap; thin webbing is closer to 1.5 mm. The slot's edges are
// fully rounded to this thickness, matching a biothane strap's profile.
collar_thickness = 3;

// Material wrapped around the strap slot, in mm — the same on every side,
// since the tag's rounded edges are concentric with the slot's. The top
// is the face the name is cut into, so keep this comfortably thicker than
// text_thickness, or the letters break through into the slot.
wall_thickness = 3;

// How deep the name is recessed into the top face, in mm. On the
// multicolor version this is also the height of the accent inlay, so keep
// it a whole multiple of your layer height (0.6 mm = 3 layers at 0.2 mm)
// and the color swap lands on a clean layer boundary.
text_thickness = 0.6;
// END_PARAMS

// ============================================================
// Fixed styling (not customizable)
// ============================================================

// Slip fit between strap and slot, in mm, across each dimension. Without
// it the tag binds on the strap instead of sliding along it.
slot_clearance = 0.6;

// Cap height of the name as a fraction of the tag's face height. Normalized
// by `font_cap` below, so this is a true fraction whatever the font: at 0.45 a
// capital covers 45% of the face — tall enough to read at arm's length, short
// enough to clear the rounded top and bottom edges even with a descender.
text_height_frac = 0.45;

// Gap between the inlay letters and the pocket walls on the multicolor
// version, in mm. Small but nonzero so the two solids never share a
// coincident wall, which makes OpenSCAD drop faces. A multi-material
// slicer closes it.
inlay_clearance = 0.15;

// Facets on the corner spheres and slot ends. 48 is smooth at tag scale
// and keeps the hulls cheap.
rounding_fn = 48;

// Radius of the fillet where the slot breaks out through each rounded end,
// as a fraction of wall_thickness. Must stay under 0.5, where the fillet
// becomes a full bullnose with no end left to blend into.
mouth_fillet_frac = 0.4;

// Slices in each mouth fillet's hulled sweep.
mouth_fillet_steps = 12;

// The six faces offered by `font_style`, in enum order.
font_names = [
    "Liberation Sans:style=Bold",
    "Liberation Sans",
    "Liberation Serif:style=Bold",
    "Liberation Serif",
    "Liberation Mono:style=Bold",
    "Liberation Mono"
];

font_index =
    font_style == "Sans Bold"  ? 0 :
    font_style == "Sans"       ? 1 :
    font_style == "Serif Bold" ? 2 :
    font_style == "Serif"      ? 3 :
    font_style == "Mono Bold"  ? 4 :
    font_style == "Mono"       ? 5 :
                                 0;

text_font = font_names[font_index];

// Cap height of each face as a multiple of text()'s `size`, in enum order.
// The families genuinely differ (Serif sits ~5% lower than Sans), so dividing
// by this is what keeps `text_height_frac` meaning the same thing in every
// font — switch Sans to Serif and the letters stay the same height.
font_cap = [0.9555, 0.9555, 0.9094, 0.9094, 0.9152, 0.9152];

// Advance width of every printable ASCII glyph, as a multiple of `size`, for
// each face in `font_names` order. Indexed [font_index][ord(c) - 32].
//
// Measured with OpenSCAD's textmetrics() and baked in so the tag can size
// itself to the name WITHOUT that function — it needs the --enable=textmetrics
// CLI flag, which the WASM customizer does not ship. One table per face is not
// redundancy: "Name" is 3.78 em in Sans Bold but 3.32 in Serif, so sharing a
// table would size the plate wrong by up to 12%.
//
// Regenerate by echoing textmetrics(chr(i), size=1000, font=f).advance[0]/1000
// for i = 32..126, plus textmetrics("H", ...).size[1]/1000 for `font_cap`.
//
// Rows of eight, so each row of every table covers these characters:
//
//    !"#$%&'
//   ()*+,-./
//   01234567
//   89:;<=>?
//   @ABCDEFG
//   HIJKLMNO
//   PQRSTUVW
//   XYZ[\]^_
//   `abcdefg
//   hijklmno
//   pqrstuvw
//   xyz{|}~
glyph_adv_by_font = [
    // Sans Bold
    [
        0.3859, 0.4625, 0.6585, 0.7724, 0.7724, 1.2349, 1.0030, 0.3303,
        0.4625, 0.4625, 0.5405, 0.8111, 0.3859, 0.4625, 0.3859, 0.3859,
        0.7724, 0.7724, 0.7724, 0.7724, 0.7724, 0.7724, 0.7724, 0.7724,
        0.7724, 0.7724, 0.4625, 0.4625, 0.8111, 0.8111, 0.8111, 0.8484,
        1.3543, 1.0030, 1.0030, 1.0030, 1.0030, 0.9264, 0.8484, 1.0803,
        1.0030, 0.3859, 0.7724, 1.0030, 0.8484, 1.1570, 1.0030, 1.0803,
        0.9264, 1.0803, 1.0030, 0.9264, 0.8484, 1.0030, 0.9264, 1.3109,
        0.9264, 0.9264, 0.8484, 0.4625, 0.3859, 0.4625, 0.8111, 0.7724,
        0.4625, 0.7724, 0.8484, 0.7724, 0.8484, 0.7724, 0.4625, 0.8484,
        0.8484, 0.3859, 0.3859, 0.7724, 0.3859, 1.2349, 0.8484, 0.8484,
        0.8484, 0.8484, 0.5405, 0.7724, 0.4625, 0.8484, 0.7724, 1.0803,
        0.7724, 0.7724, 0.6945, 0.5405, 0.3886, 0.5405, 0.8111
    ],
    // Sans
    [
        0.3859, 0.3859, 0.4930, 0.7724, 0.7724, 1.2349, 0.9264, 0.2652,
        0.4625, 0.4625, 0.5405, 0.8111, 0.3859, 0.4625, 0.3859, 0.3859,
        0.7724, 0.7724, 0.7724, 0.7724, 0.7724, 0.7724, 0.7724, 0.7724,
        0.7724, 0.7724, 0.3859, 0.3859, 0.8111, 0.8111, 0.8111, 0.7724,
        1.4099, 0.9264, 0.9264, 1.0030, 1.0030, 0.9264, 0.8484, 1.0803,
        1.0030, 0.3859, 0.6945, 0.9264, 0.7724, 1.1570, 1.0030, 1.0803,
        0.9264, 1.0803, 1.0030, 0.9264, 0.8484, 1.0030, 0.9264, 1.3109,
        0.9264, 0.9264, 0.8484, 0.3859, 0.3859, 0.3859, 0.6517, 0.7724,
        0.4625, 0.7724, 0.7724, 0.6945, 0.7724, 0.7724, 0.3859, 0.7724,
        0.7724, 0.3086, 0.3086, 0.6945, 0.3086, 1.1570, 0.7724, 0.7724,
        0.7724, 0.7724, 0.4625, 0.6945, 0.3859, 0.7724, 0.6945, 1.0030,
        0.6945, 0.6945, 0.6945, 0.4639, 0.3608, 0.4639, 0.8111
    ],
    // Serif Bold
    [
        0.3472, 0.4625, 0.7711, 0.6945, 0.6945, 1.3889, 1.1570, 0.3859,
        0.4625, 0.4625, 0.6945, 0.7914, 0.3472, 0.4625, 0.3472, 0.3859,
        0.6945, 0.6945, 0.6945, 0.6945, 0.6945, 0.6945, 0.6945, 0.6945,
        0.6945, 0.6945, 0.4625, 0.4625, 0.7914, 0.7914, 0.7914, 0.6945,
        1.2919, 1.0030, 0.9264, 1.0030, 1.0030, 0.9264, 0.8484, 1.0803,
        1.0803, 0.5405, 0.6945, 1.0803, 0.9264, 1.3109, 1.0030, 1.0803,
        0.8484, 1.0803, 1.0030, 0.7724, 0.9264, 1.0030, 1.0030, 1.3889,
        1.0030, 1.0030, 0.9264, 0.4625, 0.3859, 0.4625, 0.8070, 0.6945,
        0.4625, 0.6945, 0.7724, 0.6165, 0.7724, 0.6165, 0.4625, 0.6945,
        0.7724, 0.3859, 0.4625, 0.7724, 0.3859, 1.1570, 0.7724, 0.6945,
        0.7724, 0.7724, 0.6165, 0.5405, 0.4625, 0.7724, 0.6945, 1.0030,
        0.6945, 0.6945, 0.6165, 0.5473, 0.3059, 0.5473, 0.7222
    ],
    // Serif
    [
        0.3472, 0.4625, 0.5670, 0.6945, 0.6945, 1.1570, 1.0803, 0.2502,
        0.4625, 0.4625, 0.6945, 0.7833, 0.3472, 0.4625, 0.3472, 0.3859,
        0.6945, 0.6945, 0.6945, 0.6945, 0.6945, 0.6945, 0.6945, 0.6945,
        0.6945, 0.6945, 0.3859, 0.3859, 0.7833, 0.7833, 0.7833, 0.6165,
        1.2790, 1.0030, 0.9264, 0.9264, 1.0030, 0.8484, 0.7724, 1.0030,
        1.0030, 0.4625, 0.5405, 1.0030, 0.8484, 1.2349, 1.0030, 1.0030,
        0.7724, 1.0030, 0.9264, 0.7724, 0.8484, 1.0030, 1.0030, 1.3109,
        1.0030, 1.0030, 0.8484, 0.4625, 0.3859, 0.4625, 0.6517, 0.6945,
        0.4625, 0.6165, 0.6945, 0.6165, 0.6945, 0.6165, 0.4625, 0.6945,
        0.6945, 0.3859, 0.3859, 0.6945, 0.3859, 1.0803, 0.6945, 0.6945,
        0.6945, 0.6945, 0.4625, 0.5405, 0.3859, 0.6945, 0.6945, 1.0030,
        0.6945, 0.6945, 0.6165, 0.6666, 0.2781, 0.6666, 0.7514
    ],
    // Mono Bold
    [
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335
    ],
    // Mono
    [
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335,
        0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335, 0.8335
    ]
];

glyph_adv = glyph_adv_by_font[font_index];

// ============================================================
// Derived dimensions
// X runs along the strap, Y across it, Z through it.
// ============================================================

slot_w = collar_width + slot_clearance;
slot_h = collar_thickness + slot_clearance;

// The tag is a shell of wall_thickness wrapped around the slot, so face
// height (Y) and total height (Z) are fully determined by the strap.
tag_w = slot_w + 2 * wall_thickness;
tag_h = slot_h + 2 * wall_thickness;

// The tag is the hull of four spheres whose diameter is the tag's height;
// the slot's rounded ends share their centers (in Y-Z), which is what keeps
// the wall uniform around the slot's curve.
rounding = tag_h / 2;
edge_y = slot_w / 2 - slot_h / 2;

text_size = tag_w * text_height_frac / font_cap[font_index];

// Summed advance width of `name`, as a multiple of `size`. Kerning pairs
// are not applied, so this runs a hair wide — the safe direction.
function name_adv(i = 0) =
    i >= len(name) ? 0
                   : glyph_adv[max(0, min(len(glyph_adv) - 1, ord(name[i]) - 32))]
                     + name_adv(i + 1);

// Length (X) is the one free dimension, so it sizes itself to the name.
// The end margin is the sphere radius, which keeps the letters on the flat
// top rather than running down the rounded ends. Floored at the strap width
// so a one-letter name still leaves a tag with some body to it.
tag_l = max(name_adv() * text_size + 2 * rounding, collar_width);

// ============================================================
// Geometry — z = 0 is the bottom of the tag, which prints face down.
// ============================================================

module blank() {
    translate([0, 0, tag_h / 2])
        hull()
            for (x = [-1, 1], y = [-1, 1])
                translate([x * (tag_l / 2 - rounding), y * edge_y, 0])
                    sphere(r = rounding, $fn = rounding_fn);
}

// The strap channel — a stadium through-cut along X, overshooting both
// ends, shaped like a strap with fully rounded edges.
module slot() {
    translate([0, 0, tag_h / 2])
        hull()
            for (y = [-1, 1])
                translate([0, y * edge_y, 0])
                    rotate([0, 90, 0])
                        cylinder(r = slot_h / 2, h = tag_l + 2,
                                 center = true, $fn = rounding_fn);
}

// A stadium section concentric with the slot, of radius r, at distance x
// along the strap. The blank and slot share these centers, so growing r is
// how every section here widens without changing shape.
module stadium_slice(x, r) {
    translate([x, 0, tag_h / 2])
        rotate([0, 90, 0])
            linear_extrude(0.01, center = true)
                hull()
                    for (y = [-1, 1])
                        translate([0, y * edge_y])
                            circle(r = r, $fn = rounding_fn);
}

// Without this the slot wall meets the rounded end in a knife edge. In any
// section through the slot's axis that end is a circle of radius `rounding`
// and the wall is a line slot_h / 2 off it; the fillet is the circle of
// radius mouth_mf tangent to both, centred mouth_xc past the sphere centre.
// The lip ends in a rounded nose along that circle: its near half carves
// the slot side from mouth_xc, and its far half replaces the end past
// mouth_xt, where it touches the blank.
mouth_mf = mouth_fillet_frac * wall_thickness;
mouth_xc = sqrt(pow(rounding - mouth_mf, 2) - pow(slot_h / 2 + mouth_mf, 2));
mouth_xt = mouth_xc * rounding / (rounding - mouth_mf);

// Hulled slices rather than offset_sweep(), so the WASM customizer's CGAL
// can take it. Stepped by angle so the slices bunch up where the nose turns.
module mouth_sweep(sign) {
    end_x = tag_l / 2 - rounding;
    for (i = [0 : mouth_fillet_steps - 1])
        hull()
            for (a = [i, i + 1] * 90 / mouth_fillet_steps)
                stadium_slice(end_x + mouth_xc + mouth_mf * sin(a),
                              slot_h / 2 + mouth_mf + sign * mouth_mf * cos(a));
}

module both_ends() {
    for (m = [0, 1]) mirror([m, 0, 0]) children();
}

module shell() {
    difference() {
        intersection() {
            blank();
            union() {
                cube([2 * (tag_l / 2 - rounding + mouth_xt), 2 * tag_w, 3 * tag_h],
                     center = true);
                both_ends() mouth_sweep(1);
            }
        }
        slot();
        both_ends() mouth_sweep(-1);
    }
}

// The name as a prism standing on the pocket floor and punching up through
// the rounded crown. Differencing it against the shell gives a pocket, and
// intersecting it gives the matching inlay — either way the result follows
// the curved top face instead of assuming it is flat. `grow` widens the
// letters, which is how the pocket gets its clearance.
module name_prism(grow) {
    translate([0, 0, tag_h - text_thickness])
        linear_extrude(text_thickness + rounding + 1)
            offset(r = grow)
                text(name, size = text_size, font = text_font,
                     halign = "center", valign = "center");
}

// ============================================================
// Public modules — called by the previews / customizer
// ============================================================

// Single-filament tag: the name is an engraved pocket in the top face.
module single() {
    difference() {
        shell();
        name_prism(0);
    }
}

// Multicolor body: the same shell, but the pocket is opened by
// inlay_clearance so the accent inlay drops in without fighting it.
module body() {
    difference() {
        shell();
        name_prism(inlay_clearance);
    }
}

// Accent inlay: the name prism clipped to the shell, so its top surface is
// exactly flush with the tag's rounded crown — no relief to catch on fur.
module inlay() {
    intersection() {
        shell();
        name_prism(0);
    }
}

// Multicolor variant, for GUI convenience. The gallery's preview file
// calls color() on these two subtrees directly at the top level.
module multicolor() {
    color("#00eaff") body();
    color("#ff17c7") inlay();
}
