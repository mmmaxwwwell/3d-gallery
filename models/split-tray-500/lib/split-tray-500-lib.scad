include <BOSL2/std.scad>

// ============================================================
// split-tray-500-lib.scad
//
// 500 × 500 mm parts tray with a 10 mm base and 25 mm thick outer
// walls. Split into a 2 × 2 grid so each quadrant fits inside a
// ~250 mm build volume (Qidi Q2 class).
//
// PUBLIC modules:
//   * quadrant(xi, yi)  — one printable quadrant (base + wall dovetails
//                         + bowtie-key slots opening upward through
//                         the tray floor).
//   * bowtie_key()      — one printable bowtie / dovetail key.
//   * tray()            — the whole tray as one monolithic reference
//                         piece (no split, no dovetails, no cavities).
//
// Joint systems (per seam):
//   1. BASE sliding dovetail at Z = 1-4 (runs the length of the seam,
//      buried inside the 10 mm base).
//   2. WALL sliding dovetail at Z = 20-23 wherever a wall crosses the
//      seam — same cross-section and slide direction as the base
//      dovetail. This stops the tall walls from hinging apart at the
//      seam even though the base is already locked.
//   3. TWO bowtie / dovetail keys per seam segment, dropped in from
//      ABOVE through slots in the tray floor after the pair is slid
//      together — locks the sliding axis.
//
// Assembly (no flip):
//   1. Slide FR onto FL along −Y; drop 2 keys into the seam slots.
//   2. Slide BR onto BL along −Y; drop 2 keys into the seam slots.
//   3. Slide the back pair in −X across the front pair; drop 4 keys
//      (2 per Y = qy seam segment).
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

// ---------------- Base sliding dovetail (lengthwise) ----------------
// Moved to the BOTTOM of the base (Z = 1-4) so the bowtie slots can
// open upward through the tray floor without colliding.
dt_bot_w   = 8;
dt_top_w   = 4;
dt_z_bot   = 1;
dt_z_top   = 4;
dt_clr     = 0.25;
dt_end_clr = 30;

// ---------------- Wall bowtie key (vertical) ----------------
// Every wall-seam crossing carries a bowtie-shaped vertical channel
// cut into the two mating wall halves. A taller bowtie key drops in
// from the top of the wall and locks the halves against pulling
// apart. Same polygon as the base bowtie (so wall keys are just a
// taller extrusion of the same shape), placed with its waist on the
// seam plane and its long axis perpendicular to the seam. One key
// per wall-seam crossing (4 wall keys total per tray).
wall_key_depth = 20;   // vertical extrusion — Z from wall top downward

// ---------------- Bowtie / dovetail key ----------------
// Slot opens at the top of the base (Z = 5-10) — key drops in from
// above, flush with the tray floor when seated. No flip required.
key_len    = 30;
key_flare  = 14;
key_waist  = 6;
key_depth  = 5;
key_clr    = 0.25;
n_keys     = 2;

// ---------------- Corner bar cutouts ----------------
// Full-height 20 × 20 mm vertical channels at the front-right and
// rear-right corners so the tray drops down onto pre-existing
// vertical bars. Cut all the way through base + wall.
corner_cut = 20;

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
        _wall_bowtie_pockets(xi, yi);
        _corner_bar_cutouts();
    }
}

module bowtie_key() {
    linear_extrude(key_depth)
        _bowtie_polygon(key_len, key_flare, key_waist);
}

module wall_bowtie_key() {
    linear_extrude(wall_key_depth)
        _bowtie_polygon(key_len, key_flare, key_waist);
}

// Full tray as one monolithic piece — shell only, no quadrant
// clipping, no dovetails, no bowtie slots. Corner bar cutouts
// still apply so the preview matches printed geometry.
module tray() {
    difference() {
        _full_shell();
        _corner_bar_cutouts();
    }
}

module _corner_bar_cutouts() {
    z0 = -1;
    zh = total_h + 2;
    // Front-right corner
    translate([tray_x - corner_cut, 0, z0])
        cube([corner_cut, corner_cut, zh]);
    // Rear-right corner
    translate([tray_x - corner_cut, tray_y - corner_cut, z0])
        cube([corner_cut, corner_cut, zh]);
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
// BASE sliding dovetail — trapezoid in XZ (or YZ) at Z = [1, 4]
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
// WALL bowtie pockets — every wall-seam crossing gets a bowtie-shaped
// vertical channel cut from the top of the wall down by wall_key_depth.
// Half the bowtie sits in each mating quadrant's material; the halves
// align into a full pocket when the pieces are slid together, and a
// wall_bowtie_key() drops in from the top to lock the halves against
// pulling apart. No sliding dovetail in the walls — the horizontal
// base slide + a top-inserted bowtie is enough, and it doesn't require
// any through-slot in the wall face.
//
// Placement (one pocket per wall-seam crossing, 4 total):
//   Front wall  X=qx  → (qx, wall_thickness/2, [35-20, 35]), long axis X
//   Back  wall  X=qx  → (qx, tray_y - wall_thickness/2, [85-20, 85])
//   Left  wall  Y=qy  → (wall_thickness/2, qy, [85-20, 85]), long axis Y
//   Right wall  Y=qy  → (tray_x - wall_thickness/2, qy, [85-20, 85])
//
// Every quadrant sees TWO of the four pockets subtracted from its
// shell (one per shared seam), so the pocket cavity is identical on
// both sides of the seam.
// ============================================================
module _wall_bowtie_pockets(xi, yi) {
    // Front wall (X=qx crossing) — visible in FL (0,0) and FR (1,0)
    if (yi == 0)
        _wall_bowtie_pocket(qx, wall_thickness / 2,
                            base_thickness + short_wall_h,
                            0);
    // Back wall (X=qx crossing) — visible in BL (0,1) and BR (1,1)
    if (yi == 1)
        _wall_bowtie_pocket(qx, tray_y - wall_thickness / 2,
                            base_thickness + tall_wall_h,
                            0);
    // Left wall (Y=qy crossing) — visible in FL (0,0) and BL (0,1)
    if (xi == 0)
        _wall_bowtie_pocket(wall_thickness / 2, qy,
                            base_thickness + tall_wall_h,
                            90);
    // Right wall (Y=qy crossing) — visible in FR (1,0) and BR (1,1)
    if (xi == 1)
        _wall_bowtie_pocket(tray_x - wall_thickness / 2, qy,
                            base_thickness + tall_wall_h,
                            90);
}

module _wall_bowtie_pocket(x_c, y_c, z_top, rot) {
    // Extrudes from Z = (z_top - wall_key_depth) up to Z = z_top + 0.1
    // so the pocket cleanly opens through the top of the wall.
    translate([x_c, y_c, z_top - wall_key_depth])
        rotate([0, 0, rot])
            linear_extrude(wall_key_depth + 0.1)
                _bowtie_polygon(
                    key_len   + 2*key_clr,
                    key_flare + 2*key_clr,
                    key_waist + 2*key_clr
                );
}

// ============================================================
// Bowtie slots — open at TOP of base (Z = [5, 10]); key drops in
// from above through the tray floor. Long axis perpendicular to seam.
// ============================================================
module _bowtie_slot_cavities(xi, yi) {
    if (yi == 0) _bowtie_slots_on_x_seam(0,  qy);
    if (yi == 1) _bowtie_slots_on_x_seam(qy, tray_y);
    if (xi == 0) _bowtie_slots_on_y_seam(0,  qx);
    if (xi == 1) _bowtie_slots_on_y_seam(qx, tray_x);
}

module _bowtie_slot(x_c, y_c, rot) {
    translate([x_c, y_c, base_thickness - key_depth])
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
