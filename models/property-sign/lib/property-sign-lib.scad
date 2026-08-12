include <BOSL2/std.scad>

// BEGIN_DESCRIPTION
// A flush three-color property warning sign. A white rounded plate carries
// five stacked messages — the first two ("Private Property" / "No
// Trespassing") in red, the rest in black.
//
// The text is recessed into the top face of the plate and then filled back
// in with colored inlays whose top surface is exactly coplanar with the
// plate. There is no relief: run a finger across the finished sign and the
// plate, red, and black all sit in one smooth plane. This is what makes the
// sign legible from any angle and easy to wipe clean.
//
// The plate sizes itself to the text. Set the font size and margins; the
// plate grows to the widest line plus the stacked height of all lines, so
// editing the copy never leaves the text cramped or swimming in empty
// space. The result is clamped to fit a 200x200 print bed.
//
// Designed as a single multi-material print — plate and both ink colors
// interlock in X/Y, so a multi-material printer (or a painted inlay)
// produces a finished sign with no assembly.
// END_DESCRIPTION

// BEGIN_PARAMS
// Base font size (cap-height region), in mm. Every line is sized as a
// multiple of this; the plate grows to fit the text exactly. Larger =
// bigger sign.
base_size = 13;

// Print layer height, in mm. Plate and inlay thicknesses are expressed in
// whole layers so every color swap lands on a clean layer boundary.
layer_h = 0.2;

// Total plate thickness = 8 layers (1.6 mm at 0.2 mm layers).
plate_h = 8 * layer_h;

// Depth the text is recessed into (and the inlays rise to fill) =
// 4 layers (0.8 mm at 0.2 mm layers). The inlay top is flush with the
// plate top, so the color occupies the top 4 layers of the print.
text_h = 4 * layer_h;

// Inner margin from the plate edge to the text block, in mm.
margin = 14;

// Corner rounding radius on the plate, in mm.
corner_r = 8;

// Gap between the inlay letters and the pocket walls, in mm. Small but
// nonzero so the plate and inlays never share a coincident wall (which
// makes OpenSCAD drop faces). A multi-material slicer closes it.
clearance = 0.15;

// ---- Garden-stake mount (back of plate) -------------------------------
// The sign slides down onto a U-shaped landscape staple: two 3 mm wire
// legs spaced `stake_span` apart, joined by a horizontal top bar. The legs
// run vertically (along Y) up the back of the plate; the bar sits across
// the saddle tops. The mount has:
//   * bottom saddles — D-section tubes flush with the bottom edge; the legs
//                       thread through their `leg_hole_d` bores into ground.
//   * bar stop       — a block flush on the back, `bar_stop_gap` above the
//                       saddle tops, that blocks the top bar from riding up.

// Set false to render the plain sign with no stake mount.
stake_mount = true;

// Center-to-center spacing of the two stake legs, in mm (1.18 in).
stake_span = 30;

// Stake wire diameter, in mm. Holes/slots are sized off this.
stake_wire_d = 3;

// Clearance bore for a leg, in mm — wire diameter plus a slip fit.
leg_hole_d = 3.25;

// How far the mount features stand proud of the plate back, in mm.
mount_proud = 8;

// Gap between the saddle tops and the bottom of the bar-stop block, in mm.
// The staple's top bar rests in this gap on the saddle tops.
bar_stop_gap = 4;

// Length (along Y) of each bottom saddle tube, in mm.
saddle_len = 16;

// Length (along Y) of the bar-stop block, in mm.
block_len = 8;
// END_PARAMS

// ============================================================
// Sign copy + per-line layout
// ============================================================

// Each entry: [text, color, relative_size, width_unit].
// Lines render top-to-bottom.
//
// `width_unit` is the rendered width of the line measured at base_size = 1
// (so the real width is `width_unit * base_size`). These are pre-measured
// with OpenSCAD's textmetrics() for "Liberation Sans:style=Bold" and baked
// in so the plate can auto-size WITHOUT the experimental textmetrics()
// function — that function needs the `--enable=textmetrics` CLI flag, which
// the OpenSCAD GUI does not pass, leaving the plate undefined. Baking the
// widths keeps the sign rendering everywhere with no flags and no warnings.
//
// If you edit the wording, re-measure with scripts/measure-line-widths
// (or run textmetrics manually) and update the width_unit column.
lines = [
    ["Private Property",                 "red",   1.55, 16.4768],
    ["No Trespassing",                   "red",   1.55, 15.7440],
    ["No Soliciting (including",           "black", 1.00, 15.3224],
    ["political/religious)",               "black", 1.00, 11.7238],
    ["Dogs on Premises",                 "black", 1.00, 11.9685],
    ["Audio and Video",                  "black", 1.00, 10.8427],
    ["Recording in Use",                 "black", 1.00, 11.2816],
];

font     = "Liberation Sans:style=Bold";
line_gap = 0.45;  // gap between lines, as a fraction of base_size

// ============================================================
// Auto-sizing (from baked per-line widths — no textmetrics needed)
// ============================================================

total_units = sum([for (l = lines) l[2]]);
n_lines     = len(lines);

// Width of line i at the current font size, from its baked width_unit.
function line_w(i) = lines[i][3] * base_size;

// Stacked text-block dimensions: widest line drives width; sum of line
// heights plus the gaps between them drives height.
block_w = max([for (i = [0:n_lines-1]) line_w(i)]);
block_h = base_size * (total_units + line_gap * (n_lines - 1));

// Plate outer dimensions: the text block plus margins. No clamp — the
// plate is exactly as big as the text needs.
plate_w = block_w + 2 * margin;
plate_d = block_h + 2 * margin;

// ============================================================
// Geometry helpers
// ============================================================

// Rounded plate of the auto-computed footprint, extruded to height h.
module plate(h) {
    linear_extrude(h)
        offset(r = corner_r)
            square([plate_w - 2 * corner_r, plate_d - 2 * corner_r],
                   center = true);
}

// Y-position (vertical center) of line i, measured from the plate center.
// Lines stack from the top of the text block downward.
function line_y(i) =
    let (
        above    = (i == 0 ? 0 : sum([for (j = [0:i-1]) lines[j][2]]))
                   + line_gap * i,
        self_top = above + lines[i][2] / 2
    )
    block_h / 2 - base_size * self_top;

// A single line of text as 2D geometry, centered on its own line_y.
module line_2d(i) {
    translate([0, line_y(i)])
        text(lines[i][0], size = base_size * lines[i][2], font = font,
             halign = "center", valign = "center", $fn = 32);
}

// All text of a given color, extruded to fill the recess so its top face
// is flush with the plate top.
module inlay(want_color) {
    translate([0, 0, plate_h - text_h])
        linear_extrude(text_h)
            for (i = [0:n_lines-1])
                if (lines[i][1] == want_color)
                    line_2d(i);
}

// All text (any color) as a 2D union — used to cut the pocket.
module all_text_2d() {
    for (i = [0:n_lines-1])
        line_2d(i);
}

// ============================================================
// Garden-stake mount geometry (back of plate, grows into -Z)
// ============================================================

// Bottom edge of the plate footprint, in Y.
bottom_y = -plate_d / 2;

// A D-section bar: flat face coplanar with the plate back (Z = 0), rounded
// outward into -Z. Width `w` (in X), reach `mount_proud` (in -Z), length
// `len` (in Y), centered in X and Y on the caller's translate.
//
// Built as a 2D D in the XZ plane (a half-stadium) then extruded along Y.
module d_bar(w, len) {
    translate([0, len / 2, 0])
        rotate([90, 0, 0])
            linear_extrude(len)
                // XZ profile: top edge flat on Z=0, body bulging to -mount_proud.
                intersection() {
                    offset(r = w / 2)
                        square([0.001, max(0.001, 2 * mount_proud - w)],
                               center = true);
                    translate([0, -mount_proud])
                        square([w + 2 * mount_proud,
                                2 * mount_proud], center = true);
                }
}

// One bottom saddle centered at X = x: a D-bar tube straddling the bottom
// edge with a vertical (Y) bore the leg threads through into the ground.
module saddle(x) {
    bore_z = -mount_proud / 2;   // bore centered in the D's reach
    saddle_w = leg_hole_d + 2 * 2.2;   // ~2.2 mm wall around the bore
    // Bottom of the saddle flush with the plate's bottom edge, growing up.
    translate([x, bottom_y + saddle_len / 2, 0])
        difference() {
            d_bar(saddle_w, saddle_len);
            // leg bore, along Y, running the full length plus through ends
            translate([0, -saddle_len / 2 - 1, bore_z])
                rotate([-90, 0, 0])
                    cylinder(h = saddle_len + 2, d = leg_hole_d);
        }
}

// Horizontal bar-stop block. After the legs thread up through the saddles,
// the staple's top bar rests on the saddle tops; this block sits flush
// against the back, `bar_stop_gap` above the saddle tops, and blocks the
// bar from sliding any further up (+Y) so the sign can't ride up off the
// stake. Spans the center third of the leg span, centered in X.
module bar_stop() {
    block_w = stake_span / 3;             // center 1/3 of the leg span
    block_h = mount_proud / 2 + 1;        // ~half as proud as the saddles, +1 mm
    bottom  = bottom_y + saddle_len + bar_stop_gap;   // 4 mm above saddles
    // A box flush on the plate back (Z = 0) growing into -Z.
    translate([0, bottom + block_len / 2, -block_h / 2])
        cube([block_w, block_len, block_h], center = true);
}

// All back-of-plate stake hardware, unioned.
module stake_features() {
    saddle(-stake_span / 2);
    saddle( stake_span / 2);
    bar_stop();
}

// ============================================================
// Public modules
// ============================================================

// White plate with the text pocket subtracted from the top face.
//
// The pocket is the text outline grown by `clearance` (0.15 mm) so the
// pocket walls never sit exactly on top of the inlay walls. Coincident
// walls make OpenSCAD's CGAL union cancel faces and silently drop the
// plate when all three colors are rendered together; the clearance keeps
// every surface distinct. At print scale the gap is a hair and a
// multi-material slicer butts the colors together cleanly.
module plate_with_pocket() {
    difference() {
        union() {
            plate(plate_h);
            if (stake_mount) stake_features();
        }
        // text pocket in the top face
        translate([0, 0, plate_h - text_h])
            linear_extrude(text_h + 0.01)
                offset(r = clearance)
                    all_text_2d();
    }
}

// The red inlay letters, flush with the plate top.
module red_inlay()   { inlay("red"); }

// The black inlay letters, flush with the plate top.
module black_inlay() { inlay("black"); }

// Full three-color sign in one render — used by the preview only.
module sign() {
    color("white") plate_with_pocket();
    color("red")   red_inlay();
    color("black") black_inlay();
}
