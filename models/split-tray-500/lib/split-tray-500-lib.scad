include <BOSL2/std.scad>

// ============================================================
// split-tray-500-lib.scad
//
// Parametric parts tray — bullnose walls forming an open (or
// based) frame, split into an N×N grid so each piece fits inside
// a small print bed. Every seam is a vertical sliding dovetail:
// tongue on one piece, blind pocket on the mate. Assembly is
// straight-down press-fit, no drop-in keys.
//
// PUBLIC modules:
//   * cell(xi, yi)      — one printable cell of the grid, xi/yi
//                          0-based. For a split=N grid, valid
//                          indices are 0..N-1. Interior cells
//                          in a 3×3 (i.e. (1,1)) have no wall
//                          material and render empty unless a
//                          base is present.
//   * piece()           — cell(piece_i, piece_j). The
//                          customizer's single entry point —
//                          user picks which cell via the
//                          piece_i / piece_j params.
//   * tray()            — the whole tray as one monolithic
//                          reference piece (no split, no joints).
// ============================================================

// BEGIN_PARAMS

// Tray outer length along X (mm).
length = 500;

// Tray outer width along Y (mm).
width = 500;

// Bullnose wall diameter (mm). Cross-section is a circle of
// this diameter; every visible edge radius is half of it.
wall_diameter = 25;

// Tall-wall height on the back, left, and right walls (mm). The
// front lip auto-caps at min(25, wall_height) so it stays low
// for reach-in.
wall_height = 75;

// Base plate thickness (mm). 0 = open frame, no base. When set
// >0, grooves punch through the base at each seam so tongues
// can enter from below during assembly.
base_thickness = 0;

// Grid split factor.
// 2 = 2×2 (4 pieces), 3 = 3×3 (8 pieces — center cell is empty).
split = 2; // [2, 3]

// Cell index along X (0-based) for the piece() module — lets
// you render any cell of a 3×3 in the customizer. Ignored by
// the four fixed quadrant_* modules.
piece_i = 0; // [0, 1, 2]

// Cell index along Y (0-based) for the piece() module. Ignored
// by the four fixed quadrant_* modules.
piece_j = 0; // [0, 1, 2]

// END_PARAMS

// ---------------- Legacy / derived ----------------
tray_x         = length;
tray_y         = width;
wall_thickness = wall_diameter;
edge_r         = wall_diameter / 2;

// Front wall stays low for reach-in — but never taller than the
// back walls (guard against wall_height < 25 configurations).
short_wall_h = min(25, wall_height);

// Per-cell footprint
qx = length / split;
qy = width  / split;

total_h  = base_thickness + wall_height;
fillet_r = edge_r;

// ---------------- Vertical sliding dovetail ----------------
// Trapezoidal cross-section in the horizontal plane, extruded
// vertically. Scales with wall_diameter so the joint stays
// proportional when walls get thicker or thinner.
vdt_narrow = max(3, wall_diameter * 0.24); // 6 @ 25 mm walls
vdt_wide   = max(5, wall_diameter * 0.40); // 10 @ 25 mm walls
vdt_depth  = max(4, wall_diameter * 0.32); // 8  @ 25 mm walls
vdt_clr    = 0.15;

// Tent-shaped roof so the pocket ceiling is self-supporting
// (~40° overhang from vertical) — no bridging needed.
vdt_cap_h  = max(3, vdt_wide * 0.6);

// Dovetail vertical extent leaves clearance for the tent cap
// plus a few mm of solid wall above.
vdt_height_short = max(5, short_wall_h - vdt_cap_h - 4);
vdt_height_tall  = max(5, wall_height  - vdt_cap_h - 14);

// ---------------- Corner bar cutouts ----------------
// Full-height 20 × 20 mm vertical channels at the front-right
// and rear-right corners so the tray drops onto pre-existing
// vertical bars.
corner_cut = 20;

// ============================================================
// PUBLIC
// ============================================================
module cell(xi, yi) {
    if (_cell_has_material(xi, yi)) {
        difference() {
            union() {
                _clipped_shell(xi, yi);
                _vdt_tongues(xi, yi);
            }
            _vdt_grooves(xi, yi);
            _corner_bar_cutouts();
        }
    }
}

module piece() { cell(piece_i, piece_j); }

module tray() {
    difference() {
        union() {
            _full_shell();
            if (base_thickness > 0) _full_base();
        }
        _corner_bar_cutouts();
    }
}

// ============================================================
// Cell material predicate — a cell holds material iff it touches
// an outer wall or a base plate exists.
// ============================================================
function _cell_has_material(xi, yi) =
    (yi == 0) || (yi == split - 1) ||
    (xi == 0) || (xi == split - 1) ||
    (base_thickness > 0);

// ============================================================
// Full shell + base — the whole tray as one piece, later clipped
// per-cell.
// ============================================================
module _full_shell() {
    z0 = base_thickness;

    // Front wall — short, spans full X.
    translate([length/2, wall_thickness/2, z0 + short_wall_h/2])
        rotate([0, 0, 90])
            _wall(d = wall_thickness, l = length, h = short_wall_h);

    // Back wall — tall, spans full X.
    translate([length/2, width - wall_thickness/2, z0 + wall_height/2])
        rotate([0, 0, 90])
            _wall(d = wall_thickness, l = length, h = wall_height);

    // Left wall — tall, spans full Y.
    translate([wall_thickness/2, width/2, z0 + wall_height/2])
        _wall(d = wall_thickness, l = width, h = wall_height);

    // Right wall — tall, spans full Y.
    translate([length - wall_thickness/2, width/2, z0 + wall_height/2])
        _wall(d = wall_thickness, l = width, h = wall_height);

    _interior_fillets(z0);
}

module _full_base() {
    cube([length, width, base_thickness]);
}

// -------- Interior wall-to-ground / wall-to-base fillets --------
module _fillet_front(z0) {
    r = fillet_r;
    translate([0, wall_thickness, z0])
        difference() {
            cube([length, r, r]);
            translate([-0.1, r, r])
                rotate([0, 90, 0])
                    cylinder(h = length + 0.2, r = r, $fn = 40);
        }
}

module _fillet_back(z0) {
    r = fillet_r;
    translate([0, width - wall_thickness - r, z0])
        difference() {
            cube([length, r, r]);
            translate([-0.1, 0, r])
                rotate([0, 90, 0])
                    cylinder(h = length + 0.2, r = r, $fn = 40);
        }
}

module _fillet_left(z0) {
    r = fillet_r;
    translate([wall_thickness, 0, z0])
        difference() {
            cube([r, width, r]);
            translate([r, -0.1, r])
                rotate([-90, 0, 0])
                    cylinder(h = width + 0.2, r = r, $fn = 40);
        }
}

module _fillet_right(z0) {
    r = fillet_r;
    translate([length - wall_thickness - r, 0, z0])
        difference() {
            cube([r, width, r]);
            translate([0, -0.1, r])
                rotate([-90, 0, 0])
                    cylinder(h = width + 0.2, r = r, $fn = 40);
        }
}

module _interior_fillets(z0) {
    _fillet_front(z0);
    _fillet_back(z0);
    _fillet_left(z0);
    _fillet_right(z0);
}

module _wall(d, l, h) {
    hull() {
        translate([0, -l/2 + d/2, 0])
            _wall_post(d, h);
        translate([0,  l/2 - d/2, 0])
            _wall_post(d, h);
    }
}

module _wall_post(d, h) {
    // Flat bottom, cylindrical body, hemispherical bullnose top.
    r = d / 2;
    hull() {
        translate([0, 0, -h/2])
            cylinder(r = r, h = 0.001);
        translate([0, 0, h/2 - r])
            sphere(r = r);
    }
}

module _corner_bar_cutouts() {
    z0 = -1;
    zh = total_h + 2;
    translate([length - corner_cut, 0, z0])
        cube([corner_cut, corner_cut, zh]);
    translate([length - corner_cut, width - corner_cut, z0])
        cube([corner_cut, corner_cut, zh]);
}

// Clip the full tray (walls + optional base) to one cell's footprint.
module _clipped_shell(xi, yi) {
    intersection() {
        union() {
            _full_shell();
            if (base_thickness > 0) _full_base();
        }
        translate([xi*qx, yi*qy, -1])
            cube([qx, qy, total_h + 5]);
    }
}

// ============================================================
// Vertical dovetail — tongue polygon (XY cross-section).
// Base (narrow edge) at X=0, tip (wide edge) at X=depth.
// Rotated as needed for Y-seam tongues.
// ============================================================
module _vdt_polygon(narrow, wide, depth) {
    polygon(points = [
        [0,     -narrow/2],
        [0,      narrow/2],
        [depth,  wide/2],
        [depth, -wide/2],
    ]);
}

// ------------------------------------------------------------
// Tongue / groove ownership for cell (xi, yi):
//   Front wall (yi == 0) hosts X-seams at x = k*qx, k=1..N-1.
//     tongue on the -X side cell (xi = k-1), groove on +X (xi = k).
//   Back wall (yi == N-1) — same X-seam convention.
//   Left wall (xi == 0) hosts Y-seams at y = k*qy.
//     tongue on -Y side (yi = k-1), groove on +Y (yi = k).
//   Right wall (xi == N-1) — same Y-seam convention.
// ------------------------------------------------------------
module _vdt_tongues(xi, yi) {
    // Front-wall tongue: cell (xi, 0) at the +X-facing seam.
    if (yi == 0 && xi < split - 1)
        _vdt_tongue_x_seam((xi + 1) * qx, wall_thickness/2, vdt_height_short);

    // Back-wall tongue: cell (xi, N-1) at the +X-facing seam.
    if (yi == split - 1 && xi < split - 1)
        _vdt_tongue_x_seam((xi + 1) * qx, width - wall_thickness/2, vdt_height_tall);

    // Left-wall tongue: cell (0, yi) at the +Y-facing seam.
    if (xi == 0 && yi < split - 1)
        _vdt_tongue_y_seam(wall_thickness/2, (yi + 1) * qy, vdt_height_tall);

    // Right-wall tongue: cell (N-1, yi) at the +Y-facing seam.
    if (xi == split - 1 && yi < split - 1)
        _vdt_tongue_y_seam(length - wall_thickness/2, (yi + 1) * qy, vdt_height_tall);
}

module _vdt_grooves(xi, yi) {
    // Front-wall groove: cell (xi, 0) at the -X-facing seam.
    if (yi == 0 && xi > 0)
        _vdt_groove_x_seam(xi * qx, wall_thickness/2, vdt_height_short);

    // Back-wall groove.
    if (yi == split - 1 && xi > 0)
        _vdt_groove_x_seam(xi * qx, width - wall_thickness/2, vdt_height_tall);

    // Left-wall groove.
    if (xi == 0 && yi > 0)
        _vdt_groove_y_seam(wall_thickness/2, yi * qy, vdt_height_tall);

    // Right-wall groove.
    if (xi == split - 1 && yi > 0)
        _vdt_groove_y_seam(length - wall_thickness/2, yi * qy, vdt_height_tall);
}

// Tongue on an X=x_seam wall crossing — extrudes in +X into the
// mating cell. y_wall is the wall centerline.
module _vdt_tongue_x_seam(x_seam, y_wall, h) {
    translate([x_seam, y_wall, base_thickness])
        linear_extrude(h)
            _vdt_polygon(vdt_narrow, vdt_wide, vdt_depth);
}

// Tongue on a Y=y_seam wall crossing — rotated so the tip points +Y.
module _vdt_tongue_y_seam(x_wall, y_seam, h) {
    translate([x_wall, y_seam, base_thickness])
        rotate([0, 0, 90])
            linear_extrude(h)
                _vdt_polygon(vdt_narrow, vdt_wide, vdt_depth);
}

// Groove on an X=x_seam wall crossing — a matching cavity in the
// mate. Slightly larger on every side (vdt_clr), extends from
// Z=-1 up through any base plate and into the wall, capped with a
// tent roof so the ceiling prints without support.
module _vdt_groove_x_seam(x_seam, y_wall, h) {
    z_top = base_thickness + h + vdt_clr;
    // Body of the pocket — punches through the base (if any) into the wall.
    translate([x_seam - vdt_clr, y_wall, -1])
        linear_extrude(z_top + 1)
            _vdt_polygon(
                vdt_narrow + 2*vdt_clr,
                vdt_wide   + 2*vdt_clr,
                vdt_depth  + vdt_clr
            );
    // Tent cap.
    translate([x_seam - vdt_clr, y_wall, z_top])
        linear_extrude(vdt_cap_h, scale = [1, 0.001])
            _vdt_polygon(
                vdt_narrow + 2*vdt_clr,
                vdt_wide   + 2*vdt_clr,
                vdt_depth  + vdt_clr
            );
}

module _vdt_groove_y_seam(x_wall, y_seam, h) {
    z_top = base_thickness + h + vdt_clr;
    translate([x_wall, y_seam - vdt_clr, -1])
        rotate([0, 0, 90])
            linear_extrude(z_top + 1)
                _vdt_polygon(
                    vdt_narrow + 2*vdt_clr,
                    vdt_wide   + 2*vdt_clr,
                    vdt_depth  + vdt_clr
                );
    translate([x_wall, y_seam - vdt_clr, z_top])
        rotate([0, 0, 90])
            linear_extrude(vdt_cap_h, scale = [1, 0.001])
                _vdt_polygon(
                    vdt_narrow + 2*vdt_clr,
                    vdt_wide   + 2*vdt_clr,
                    vdt_depth  + vdt_clr
                );
}
