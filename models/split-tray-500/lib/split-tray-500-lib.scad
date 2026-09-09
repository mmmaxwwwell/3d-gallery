include <BOSL2/std.scad>

// ============================================================
// split-tray-500-lib.scad
//
// 500 × 500 mm parts tray — walls only, no base. Rounded bullnose
// walls forming an open frame that drops down over pre-existing
// corner bars on the +X side. Split into a 2 × 2 grid so each
// quadrant fits inside a ~250 mm build volume (Qidi Q2 class).
//
// PUBLIC modules:
//   * quadrant(xi, yi)  — one printable quadrant with vertical
//                         dovetail tongue and/or groove on its
//                         seam faces.
//   * tray()            — the whole tray as one monolithic reference
//                         piece (no split, no joints).
//
// Joint (one per wall-seam crossing, 4 total):
//   Vertical sliding dovetail. Trapezoidal tongue on the owner
//   quadrant, matching groove (blind pocket, closed at top) on
//   the mate. Narrow at the seam plane, wide at the tip →
//   positive-retention capture against horizontal separation.
//   Slight interference on the horizontal cross-section gives
//   press-fit friction along the vertical slide axis.
//
// Every quadrant is pressed straight DOWN to seat and pulled
// straight UP to release. No horizontal sliding, no drop-in keys.
//
// Assembly order:
//   1. Place FL.
//   2. Press FR straight down onto FL (engages front-wall seam).
//   3. Press BL straight down onto FL (engages left-wall seam).
//   4. Press BR straight down onto both (engages back-wall and
//      right-wall seams simultaneously).
// ============================================================

// ---------------- Outer geometry ----------------
tray_x         = 500;
tray_y         = 500;
wall_thickness = 25;
tall_wall_h    = 75;
short_wall_h   = 25;
edge_r         = wall_thickness / 2;

// Derived
qx             = tray_x / 2;
qy             = tray_y / 2;
total_h        = tall_wall_h;

// Concave interior wall-to-ground fillet bead (quarter-round). With
// no base to sit on, this becomes a small toe of material at the
// inside base of every wall — the wall's inner face curves smoothly
// down to the ground plane.
fillet_r       = edge_r;

// ---------------- Vertical sliding dovetail ----------------
// Trapezoidal cross-section in the horizontal plane, extruded
// vertically. The tongue's narrow edge sits on the seam plane;
// the wide edge is embedded in the mating quadrant's material,
// so pulling the two halves apart across the seam is blocked
// (wide tip can't pass through the narrow opening).
//
// Assembly force is a small vertical press-fit — dial vdt_clr
// up if it binds, down if it rattles.
vdt_narrow       = 6;    // width perpendicular to seam at the base
vdt_wide         = 10;   // width perpendicular to seam at the tip
vdt_depth        = 8;    // extension across the seam plane
vdt_height_short = 15;   // vertical extent on the 25 mm front wall
vdt_height_tall  = 55;   // vertical extent on the 75 mm side / back walls
vdt_clr          = 0.15; // clearance / press-fit gap

// Groove roof — the groove is a blind pocket, so its ceiling would
// be a horizontal overhang if left flat. Cap the pocket with a
// tent-shaped roof that tapers to a ridge line so the ceiling is
// self-supporting (~40° overhang from vertical at the widest edge
// when cap_h = 6 and vdt_wide = 10). The tongue's tip is still
// flat — the roof leaves headroom above it, which doesn't affect
// the horizontal dovetail capture.
vdt_cap_h        = 6;

// ---------------- Corner bar cutouts ----------------
// Full-height 20 × 20 mm vertical channels at the front-right and
// rear-right corners so the tray drops onto pre-existing vertical
// bars. Only the FR and BR quadrants carry material at those
// corners.
corner_cut = 20;

// ============================================================
// PUBLIC
// ============================================================
module quadrant(xi, yi) {
    difference() {
        union() {
            _clipped_shell(xi, yi);
            _vdt_tongues(xi, yi);
        }
        _vdt_grooves(xi, yi);
        _corner_bar_cutouts();
    }
}

module tray() {
    difference() {
        _full_shell();
        _corner_bar_cutouts();
    }
}

// ============================================================
// Shell — bullnose walls forming the open frame (no base)
// ============================================================
module _full_shell() {
    // Front wall — short (25 mm), spans full X.
    translate([tray_x/2, wall_thickness/2, short_wall_h/2])
        rotate([0, 0, 90])
            _wall(d = wall_thickness, l = tray_x, h = short_wall_h);

    // Back wall — tall (75 mm), spans full X.
    translate([tray_x/2, tray_y - wall_thickness/2, tall_wall_h/2])
        rotate([0, 0, 90])
            _wall(d = wall_thickness, l = tray_x, h = tall_wall_h);

    // Left wall — tall, spans full Y.
    translate([wall_thickness/2, tray_y/2, tall_wall_h/2])
        _wall(d = wall_thickness, l = tray_y, h = tall_wall_h);

    // Right wall — tall, spans full Y.
    translate([tray_x - wall_thickness/2, tray_y/2, tall_wall_h/2])
        _wall(d = wall_thickness, l = tray_y, h = tall_wall_h);

    _interior_fillets();
}

// -------- Interior wall-to-ground fillets --------
module _fillet_front() {
    r = fillet_r;
    translate([0, wall_thickness, 0])
        difference() {
            cube([tray_x, r, r]);
            translate([-0.1, r, r])
                rotate([0, 90, 0])
                    cylinder(h = tray_x + 0.2, r = r, $fn = 40);
        }
}

module _fillet_back() {
    r = fillet_r;
    translate([0, tray_y - wall_thickness - r, 0])
        difference() {
            cube([tray_x, r, r]);
            translate([-0.1, 0, r])
                rotate([0, 90, 0])
                    cylinder(h = tray_x + 0.2, r = r, $fn = 40);
        }
}

module _fillet_left() {
    r = fillet_r;
    translate([wall_thickness, 0, 0])
        difference() {
            cube([r, tray_y, r]);
            translate([r, -0.1, r])
                rotate([-90, 0, 0])
                    cylinder(h = tray_y + 0.2, r = r, $fn = 40);
        }
}

module _fillet_right() {
    r = fillet_r;
    translate([tray_x - wall_thickness - r, 0, 0])
        difference() {
            cube([r, tray_y, r]);
            translate([0, -0.1, r])
                rotate([-90, 0, 0])
                    cylinder(h = tray_y + 0.2, r = r, $fn = 40);
        }
}

module _interior_fillets() {
    _fillet_front();
    _fillet_back();
    _fillet_left();
    _fillet_right();
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
    translate([tray_x - corner_cut, 0, z0])
        cube([corner_cut, corner_cut, zh]);
    translate([tray_x - corner_cut, tray_y - corner_cut, z0])
        cube([corner_cut, corner_cut, zh]);
}

// Clip to one quadrant footprint
module _clipped_shell(xi, yi) {
    intersection() {
        _full_shell();
        translate([xi*qx, yi*qy, -1])
            cube([qx, qy, total_h + 5]);
    }
}

// ============================================================
// Vertical dovetail — tongue polygon (XY cross-section)
//
//     +Y
//      ^
//      |   [-narrow/2]  [+wide/2]
//      |        +----------+
//      |        |          |
//      |        |          |
//      |        +----------+
//      |   [-narrow/2]  [-wide/2]
//      +---------------------> +X
//         X=0                 X=depth
//
// Base (narrow edge) sits at X=0, tip (wide edge) at X=depth.
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

// Ownership:
//   X=qx front-wall crossing → tongue on FL, groove on FR
//   X=qx back-wall crossing  → tongue on BL, groove on BR
//   Y=qy left-wall crossing  → tongue on FL, groove on BL
//   Y=qy right-wall crossing → tongue on FR, groove on BR
module _vdt_tongues(xi, yi) {
    if (xi == 0 && yi == 0) {
        _vdt_tongue_x_seam(wall_thickness/2,           vdt_height_short);
        _vdt_tongue_y_seam(wall_thickness/2,           vdt_height_tall);
    } else if (xi == 1 && yi == 0) {
        _vdt_tongue_y_seam(tray_x - wall_thickness/2,  vdt_height_tall);
    } else if (xi == 0 && yi == 1) {
        _vdt_tongue_x_seam(tray_y - wall_thickness/2,  vdt_height_tall);
    }
}

module _vdt_grooves(xi, yi) {
    if (xi == 1 && yi == 0) {
        _vdt_groove_x_seam(wall_thickness/2,           vdt_height_short);
    } else if (xi == 0 && yi == 1) {
        _vdt_groove_y_seam(wall_thickness/2,           vdt_height_tall);
    } else if (xi == 1 && yi == 1) {
        _vdt_groove_x_seam(tray_y - wall_thickness/2,  vdt_height_tall);
        _vdt_groove_y_seam(tray_x - wall_thickness/2,  vdt_height_tall);
    }
}

// Tongue on an X=qx seam — extrudes from the seam plane in +X
// into the mating (right-hand) quadrant. Y is the wall centerline.
module _vdt_tongue_x_seam(y_wall, h) {
    translate([qx, y_wall, 0])
        linear_extrude(h)
            _vdt_polygon(vdt_narrow, vdt_wide, vdt_depth);
}

// Tongue on a Y=qy seam — same shape rotated so the tip points +Y.
module _vdt_tongue_y_seam(x_wall, h) {
    translate([x_wall, qy, 0])
        rotate([0, 0, 90])
            linear_extrude(h)
                _vdt_polygon(vdt_narrow, vdt_wide, vdt_depth);
}

// Groove on an X=qx seam — matching cavity in the mate. Slightly
// larger than the tongue on every side (vdt_clr), and extends a
// hair past the seam plane in -X so the two halves don't butt into
// a paper-thin sliver at the mouth. Capped with a tent-shaped roof
// so the pocket ceiling is self-supporting (no flat overhang).
module _vdt_groove_x_seam(y_wall, h) {
    translate([qx - vdt_clr, y_wall, -1])
        linear_extrude(h + 1 + vdt_clr)
            _vdt_polygon(
                vdt_narrow + 2*vdt_clr,
                vdt_wide   + 2*vdt_clr,
                vdt_depth  + vdt_clr
            );
    // Tent cap: tapers the trapezoid's Y width to a line at the top.
    translate([qx - vdt_clr, y_wall, h + vdt_clr])
        linear_extrude(vdt_cap_h, scale = [1, 0.001])
            _vdt_polygon(
                vdt_narrow + 2*vdt_clr,
                vdt_wide   + 2*vdt_clr,
                vdt_depth  + vdt_clr
            );
}

module _vdt_groove_y_seam(x_wall, h) {
    translate([x_wall, qy - vdt_clr, -1])
        rotate([0, 0, 90])
            linear_extrude(h + 1 + vdt_clr)
                _vdt_polygon(
                    vdt_narrow + 2*vdt_clr,
                    vdt_wide   + 2*vdt_clr,
                    vdt_depth  + vdt_clr
                );
    translate([x_wall, qy - vdt_clr, h + vdt_clr])
        rotate([0, 0, 90])
            linear_extrude(vdt_cap_h, scale = [1, 0.001])
                _vdt_polygon(
                    vdt_narrow + 2*vdt_clr,
                    vdt_wide   + 2*vdt_clr,
                    vdt_depth  + vdt_clr
                );
}
