include <BOSL2/std.scad>

// ============================================================
// split-tray-500-lib.scad
//
// 500 × 500 mm parts tray with a 10 mm base and 25 mm thick outer
// walls. Split into a 2 × 2 grid so each quadrant fits inside a
// ~250 mm build volume (Qidi Q2 class).
//
// SHELL CONSTRUCTION — a rounded-corner base (hull of four corner
// cylinders) plus four bullnose walls built from the _wall helper
// (a stadium column with a rounded top). All four walls span their
// full side (front/back to tray_x, left/right to tray_y) so each
// pair of adjacent walls SHARES a corner post: their end-cap centers
// coincide at (wall_thickness/2, wall_thickness/2) etc. Front is
// 25 mm tall (short) between its corner posts; back / left / right
// are 75 mm tall — so the front-corner posts take the tall wall
// height where they overlap the left/right walls' caps.
// Interior wall-to-floor fillets are added as concave quarter-
// cylinder beads at each of the four wall-floor junctions.
//
// PUBLIC modules:
//   * quadrant(xi, yi)  — one printable quadrant of the split tray
//                         (joined via sliding dovetail + bowtie keys).
//   * bowtie_key()      — one printable bowtie / dovetail key.
//   * tray()            — the whole tray as one monolithic piece
//                         (no quadrant split, no bowtie cavities);
//                         reference geometry for preview / debug.
//
// Joint systems (quadrant only):
//   * Sliding dovetail lengthwise per seam, embedded at Z = 6-9 mm.
//   * Bowtie / dovetail keys inserted from below, at Z = 0-5 mm.
//
// Assembly:
//   1. Slide FR onto FL along −Y → front pair.
//   2. Slide BR onto BL along −Y → back pair.
//   3. Slide back pair in −X across the front pair.
//   4. Flip upside down; push 12 bowtie keys into their bottom slots.
// ============================================================

// ---------------- Outer geometry ----------------
tray_x         = 500;
tray_y         = 500;
base_thickness = 10;
wall_thickness = 25;
tall_wall_h    = 75;
short_wall_h   = 25;
edge_r         = wall_thickness / 2;   // 12.5 mm — bullnose radius

// Derived
qx             = tray_x / 2;
qy             = tray_y / 2;
total_h        = base_thickness + tall_wall_h;   // 85
short_total_h  = base_thickness + short_wall_h;  // 35

// Interior fillet bead radius (wall-to-floor concave fillet)
fillet_r       = edge_r;

// ---------------- Sliding dovetail (lengthwise) ----------------
dt_bot_w   = 8;
dt_top_w   = 4;
dt_z_bot   = 6;
dt_z_top   = 9;
dt_clr     = 0.25;
dt_end_clr = 30;

// ---------------- Bowtie / dovetail key ----------------
key_len    = 30;
key_flare  = 14;
key_waist  = 6;
key_depth  = 5;
key_clr    = 0.25;
n_keys     = 3;

// ============================================================
// PUBLIC
// ============================================================
module quadrant(xi, yi) {
    difference() {
        union() {
            _clipped_shell(xi, yi);
            _dovetail_tongues(xi, yi);
        }
        _dovetail_grooves(xi, yi);
        _bowtie_slot_cavities(xi, yi);
    }
}

module bowtie_key() {
    linear_extrude(key_depth)
        _bowtie_polygon(key_len, key_flare, key_waist);
}

// Full tray as one monolithic piece — shell only, no quadrant
// clipping, no dovetails, no bowtie slots.
module tray() {
    _full_shell();
}

module _bowtie_polygon(l, f, w) {
    polygon(points = [
        [-l/2, -f/2],
        [-l/2,  f/2],
        [ 0,    w/2],
        [ l/2,  f/2],
        [ l/2, -f/2],
        [ 0,   -w/2],
    ]);
}

// ============================================================
// Shell — union of bullnose walls + base + interior fillet beads
// ============================================================
module _full_shell() {
    _base();

    // Front wall — 25 mm tall, spans full X (owns the front corners).
    translate([tray_x/2, wall_thickness/2, base_thickness + short_wall_h/2])
        rotate([0, 0, 90])
            _wall(d = wall_thickness, l = tray_x, h = short_wall_h);

    // Back wall — 75 mm tall, spans full X (owns the back corners).
    translate([tray_x/2, tray_y - wall_thickness/2, base_thickness + tall_wall_h/2])
        rotate([0, 0, 90])
            _wall(d = wall_thickness, l = tray_x, h = tall_wall_h);

    // Left wall — 75 mm tall, spans full Y so its end-cap centers
    // coincide with the front / back walls' left-cap centers at
    // (wall_thickness/2, wall_thickness/2) and (wall_thickness/2,
    // tray_y - wall_thickness/2).
    translate([wall_thickness/2, tray_y/2, base_thickness + tall_wall_h/2])
        _wall(d = wall_thickness, l = tray_y, h = tall_wall_h);

    // Right wall — 75 mm tall, spans full Y (same corner alignment).
    translate([tray_x - wall_thickness/2, tray_y/2, base_thickness + tall_wall_h/2])
        _wall(d = wall_thickness, l = tray_y, h = tall_wall_h);

    _interior_fillets();
}

module _wall(d,l,h){

    hull(){
        translate([0,-l/2 + d/2,0])
        _wall_post(d,h);

        translate([0,l/2 - d/2,0])
        _wall_post(d,h);
    }
}

module _wall_post(d, h) {
    // Hull of a thin base disk and a top sphere → flat bottom,
    // straight cylindrical body, hemispherical top. Using a thin
    // disk (not a d-tall cylinder) keeps the top hemisphere from
    // being swallowed when h == d, so short walls still get a
    // proper bullnose dome instead of a flat top.
    r = d / 2;
    hull() {
        translate([0, 0, -h/2])
            cylinder(r = r, h = 0.001);
        translate([0, 0, h/2 - r])
            sphere(r = r);
    }
}


module _base() {
    // Rounded-corner slab: hull of four corner cylinders whose axes
    // sit at the wall end-cap positions. Corner radius matches the
    // wall bullnose radius so the base and walls share one clean
    // rounded profile.
    r = wall_thickness / 2;
    hull() {
        for (p = [[r,           r,           0],
                  [tray_x - r,  r,           0],
                  [r,           tray_y - r,  0],
                  [tray_x - r,  tray_y - r,  0]])
            translate(p)
                cylinder(r = r, h = base_thickness);
    }
}

// -------- Interior wall-to-floor fillets --------
// Each bead is a concave quarter-cylinder filler running along the
// wall's length at the wall's inner face and the floor's top.
//
// The FRONT and BACK wall beads span the full X range including the
// corner regions. In the corner regions those beads sit INSIDE the
// left / right wall material, which is a harmless redundant union.

// Front-wall inner corner (Y = wall_thickness, Z = base_thickness)
module _fillet_front() {
    r = fillet_r;
    translate([0, wall_thickness, base_thickness])
        difference() {
            cube([tray_x, r, r]);
            translate([-0.1, r, r])
                rotate([0, 90, 0])
                    cylinder(h = tray_x + 0.2, r = r, $fn = 40);
        }
}

// Back-wall inner corner (Y = tray_y − wall_thickness − r, Z = base_thickness)
module _fillet_back() {
    r = fillet_r;
    translate([0, tray_y - wall_thickness - r, base_thickness])
        difference() {
            cube([tray_x, r, r]);
            translate([-0.1, 0, r])
                rotate([0, 90, 0])
                    cylinder(h = tray_x + 0.2, r = r, $fn = 40);
        }
}

// Left-wall inner corner (X = wall_thickness, Z = base_thickness)
module _fillet_left() {
    r = fillet_r;
    translate([wall_thickness, 0, base_thickness])
        difference() {
            cube([r, tray_y, r]);
            translate([r, -0.1, r])
                rotate([-90, 0, 0])
                    cylinder(h = tray_y + 0.2, r = r, $fn = 40);
        }
}

// Right-wall inner corner
module _fillet_right() {
    r = fillet_r;
    translate([tray_x - wall_thickness - r, 0, base_thickness])
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

// Clip to one quadrant footprint
module _clipped_shell(xi, yi) {
    intersection() {
        _full_shell();
        translate([xi*qx, yi*qy, -1])
            cube([qx, qy, total_h + 5]);
    }
}

// ============================================================
// Sliding dovetail — unchanged from previous version
// ============================================================
module _dovetail_tongues(xi, yi) {
    if (xi == 0 && yi == 0) {
        _tongue_x_seam(dt_end_clr,           qy - dt_end_clr);
        _tongue_y_seam(dt_end_clr,           qx - dt_end_clr);
    } else if (xi == 1 && yi == 0) {
        _tongue_y_seam(qx + dt_end_clr,      tray_x - dt_end_clr);
    } else if (xi == 0 && yi == 1) {
        _tongue_x_seam(qy + dt_end_clr,      tray_y - dt_end_clr);
    }
}

module _dovetail_grooves(xi, yi) {
    if (xi == 1 && yi == 0) {
        _groove_x_seam(0, qy);
    } else if (xi == 0 && yi == 1) {
        _groove_y_seam(0, qx);
    } else if (xi == 1 && yi == 1) {
        _groove_x_seam(qy, tray_y);
        _groove_y_seam(qx, tray_x);
    }
}

module _tongue_x_seam(y_min, y_max) {
    hull() {
        translate([qx - dt_bot_w/2, y_min, dt_z_bot])
            cube([dt_bot_w, y_max - y_min, 0.001]);
        translate([qx - dt_top_w/2, y_min, dt_z_top - 0.001])
            cube([dt_top_w, y_max - y_min, 0.001]);
    }
}

module _groove_x_seam(gy_min, gy_max) {
    span = gy_max - gy_min;
    hull() {
        translate([qx - dt_bot_w/2 - dt_clr,
                   gy_min - dt_clr,
                   dt_z_bot - dt_clr])
            cube([dt_bot_w + 2*dt_clr,
                  span + 2*dt_clr,
                  0.001]);
        translate([qx - dt_top_w/2 - dt_clr,
                   gy_min - dt_clr,
                   dt_z_top + dt_clr - 0.001])
            cube([dt_top_w + 2*dt_clr,
                  span + 2*dt_clr,
                  0.001]);
    }
}

module _tongue_y_seam(x_min, x_max) {
    hull() {
        translate([x_min, qy - dt_bot_w/2, dt_z_bot])
            cube([x_max - x_min, dt_bot_w, 0.001]);
        translate([x_min, qy - dt_top_w/2, dt_z_top - 0.001])
            cube([x_max - x_min, dt_top_w, 0.001]);
    }
}

module _groove_y_seam(gx_min, gx_max) {
    span = gx_max - gx_min;
    hull() {
        translate([gx_min - dt_clr,
                   qy - dt_bot_w/2 - dt_clr,
                   dt_z_bot - dt_clr])
            cube([span + 2*dt_clr,
                  dt_bot_w + 2*dt_clr,
                  0.001]);
        translate([gx_min - dt_clr,
                   qy - dt_top_w/2 - dt_clr,
                   dt_z_top + dt_clr - 0.001])
            cube([span + 2*dt_clr,
                  dt_top_w + 2*dt_clr,
                  0.001]);
    }
}

// ============================================================
// Bowtie slots — unchanged from previous version
// ============================================================
module _bowtie_slot_cavities(xi, yi) {
    if (yi == 0) _bowtie_slots_on_x_seam(0,  qy);
    if (yi == 1) _bowtie_slots_on_x_seam(qy, tray_y);
    if (xi == 0) _bowtie_slots_on_y_seam(0,  qx);
    if (xi == 1) _bowtie_slots_on_y_seam(qx, tray_x);
}

module _bowtie_slot(x_c, y_c, rot) {
    translate([x_c, y_c, -0.1])
        rotate([0, 0, rot])
            linear_extrude(key_depth + 0.1)
                _bowtie_polygon(
                    key_len   + 2*key_clr,
                    key_flare + 2*key_clr,
                    key_waist + 2*key_clr
                );
}

module _bowtie_slots_on_x_seam(y_min, y_max) {
    span = y_max - y_min;
    for (i = [1 : n_keys]) {
        y_c = y_min + span * i / (n_keys + 1);
        _bowtie_slot(qx, y_c, 0);
    }
}

module _bowtie_slots_on_y_seam(x_min, x_max) {
    span = x_max - x_min;
    for (i = [1 : n_keys]) {
        x_c = x_min + span * i / (n_keys + 1);
        _bowtie_slot(x_c, qy, 90);
    }
}
