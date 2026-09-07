include <BOSL2/std.scad>

// BEGIN_DESCRIPTION
// A parametric shelf, printed as a single one-piece part. Open on
// the front, back, and bottom, with two side walls and a solid top.
// Each side wall has solid support columns at its four corners and
// a hexagonal lattice filling the interior "window" between them.
// Triangular gussets in the four internal top corners brace the
// junction between each side wall and the top plate.
// END_DESCRIPTION

// BEGIN_PARAMS
// Flat-to-flat size of hex cells in the side lattice (mm).
// Smaller = denser lattice with more, smaller cells.
hex_size = 15;

// Overall outer height of the shelf, top of top plate to bottom of
// side walls (mm).
height = 100;

// Overall outer width of the shelf (its long horizontal axis, i.e.
// its "length"), outside-to-outside across the two side walls (mm).
width = 200;

// Front-to-back depth of the shelf (mm).
depth = 100;

// Thickness of the solid top plate (mm).
top_thickness = 5;

// Thickness of each side wall — including the hex-lattice face and
// the solid corner columns / frame (mm).
wall_thickness = 5;

// Length of the triangular support gussets in the four internal
// corners where each side wall meets the top plate (mm). Each gusset
// is a right-triangle brace whose two legs are this long — one along
// the top plate underside, one down the wall's interior face. Set to
// 0 to disable gussets entirely.
gusset_length = 20;
// END_PARAMS

// ── Fixed shelf geometry (not customizable) ────────────────────────
// Change these to tweak the model itself, not per-print.
column_size = 12;   // mm — width of solid corner columns / frame
hex_wall    = 2;    // mm — wall thickness between hex cells

// ── Helpers ────────────────────────────────────────────────────────

function _hex_r(s) = s / sqrt(3);

// Pointy-top hex prism, flat-to-flat width `s`, extruded +Z to height `h`.
module _hex_prism(s, h) {
    linear_extrude(h)
        rotate([0, 0, 30])
            circle(r = _hex_r(s), $fn = 6);
}

// Full grid of hex prisms covering [0,w] × [0,h], each `cut_depth` tall.
// Pointy-top honeycomb with wall thickness `wall` between cells.
module _hex_grid(w, h, cut_depth, s, wall) {
    pitch_x = s + wall;
    pitch_y = (s + wall) * sqrt(3) / 2;
    nx = ceil(w / pitch_x) + 2;
    ny = ceil(h / pitch_y) + 2;
    for (j = [-1 : ny]) {
        offset_x = (j % 2 == 0) ? 0 : pitch_x / 2;
        for (i = [-1 : nx]) {
            translate([i * pitch_x + offset_x, j * pitch_y, 0])
                _hex_prism(s, cut_depth);
        }
    }
}

// One right-triangle gusset fin in the side's flat local frame.
// Stands perpendicular to the wall face (rising in +Z_local) at
// X_local = [x_start, x_start + wall_thickness]. The right-angle
// corner tucks under the top plate on the wall's inside face; one
// leg runs down the wall, the other runs inward under the top.
module _gusset_fin(x_start) {
    L = gusset_length;
    translate([x_start, 0, 0])
        rotate([90, 0, 90])
            linear_extrude(wall_thickness)
                polygon([
                    [height - top_thickness,     wall_thickness],
                    [height - top_thickness - L, wall_thickness],
                    [height - top_thickness,     wall_thickness + L],
                ]);
}

// One side wall, laid flat on the XY plane, as used inside shelf().
// Extents: X = [0, depth], Y = [0, height], Z = [0, wall_thickness]
// for the flat body, plus two triangular gusset fins rising into +Z
// when gusset_length > 0.
module _side_wall() {
    union() {
        difference() {
            cube([depth, height, wall_thickness]);
            translate([column_size, column_size, -0.01])
                intersection() {
                    cube([max(0.01, depth  - 2 * column_size),
                          max(0.01, height - 2 * column_size),
                          wall_thickness + 0.02]);
                    translate([-column_size, -column_size, 0])
                        _hex_grid(depth, height,
                                  wall_thickness + 0.02,
                                  hex_size, hex_wall);
                }
        }
        if (gusset_length > 0) {
            _gusset_fin(0);
            _gusset_fin(depth - wall_thickness);
        }
    }
}

// ── Public geometry ────────────────────────────────────────────────

// The whole shelf as one piece, positive-octant, bottom of sides at
// Z=0. Extents: X = [0, width], Y = [0, depth], Z = [0, height].
// Two side walls (right one mirrored so both sets of gussets face
// inward) unioned with a solid top plate.
module shelf() {
    // Left side wall: interior face at X = wall_thickness
    rotate([90, 0, 90]) _side_wall();

    // Right side wall: interior face at X = width - wall_thickness,
    // mirrored so its gussets also face inward.
    translate([width, 0, 0])
        mirror([1, 0, 0])
            rotate([90, 0, 90]) _side_wall();

    // Top plate: Z = [height - top_thickness, height]
    translate([0, 0, height - top_thickness])
        cube([width, depth, top_thickness]);
}
