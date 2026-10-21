// Solar node: a slim sealed box under a salvaged 240 x 168 mm solar panel.
//
// Three rigid pieces and a gasket, top to bottom:
// - Bezel: a flat ring over the panel's border, clamping it down.
// - Frame: the panel drops into a pocket in its top onto a ledge carrying a
//   bead of construction adhesive. The bezel squeezes the bead to
//   `glue_gap` thick, which leaves the panel's top flush with the frame's.
// - Tray: floor and walls, holding the electronics. Its top wall carries a
//   tongue that side-squeezes a U-section TPU gasket in a groove under the
//   frame (memory: never screws through a squeezed bead).
// One ring of M3 cap screws, outside the seal, runs down through bezel and
// frame into columns on the tray's outside. Undoing them lifts the frame
// with the glued panel and the bezel off the tray in one; the bezel never
// has to come off the panel.
//
// Inside: LP1260110 LiPo pouch (10 Ah), Heltec V3, TP4056 charger and a 5 V
// buck-boost, each between corner brackets on the floor (stick them down
// with foam tape). An N female bulkhead goes through the +X end wall for the
// pigtail to the Heltec.
//
// Frame: X along the panel, Y across, Z up, origin at the middle of the
// tray's underside. Every piece prints as modelled (bottom face down) except
// the gasket, which `gasket_print()` turns floor-down. The footprint needs a
// 270 mm bed (Q2, U1).

// BEGIN_PARAMS
// The solar panel: length, width, thickness (thickness unmeasured)
panel_l = 240;
panel_w = 168;
panel_t = 3;

// Clearance round the panel in its pocket, per side
panel_clear = 0.5;

// The ledge the panel rests on (the adhesive's land), how far it reaches
// in under the panel and how thick it is
ledge_w = 6;
ledge_t = 3;

// Construction adhesive under the panel once the bezel is screwed down
glue_gap = 1;

// Frame rim outside the panel's pocket: screws and the seal's groove
rim_w = 11;

// How far the bezel reaches in over the panel's border, and its thickness
bezel_overlap = 4;
bezel_t = 5;

// Outside corner radius
corner_r = 4;

// Tray: floor, height inside (sized for the N bulkhead's panel nut), wall
tray_floor = 2.5;
tray_inside_h = 25;
tray_wall = 4;

// How far the tray's wall sits in from the frame's edge (the screw columns
// stand out to the edge)
tray_inset = 5.5;

// M3 cap screws: inset from the outside, most spacing allowed, pilot for
// self-tapping, clearance, counterbore diameter and depth, column diameter
screw_e = 3.5;
screw_pitch = 40;
pilot_d = 2.5;
clear_d = 3.4;
cbore_d = 6;
cbore_h = 3.2;
column_d = 7;

// How deep the pilots go into the tray (M3x16: 1.8 bezel + frame + the rest)
pilot_depth = 9;

// Seal: groove inset from the outside, depth; the TPU gasket's walls, slot
// and floor; side squeeze per side
groove_e = 6.4;
groove_depth = 3;
gasket_wall = 1.2;
gasket_slot = 1.2;
gasket_floor = 0.4;
seal_squeeze = 0.2;

// N female bulkhead, 5/8"-24 thread: hole, its body/flange outside, its
// panel nut across flats, the most panel it clamps, and how far its back
// (with the pigtail's crimp) reaches in from the wall
n_thread_d = 15.9;
n_hole_clear = 0.5;
n_body_d = 24;
n_nut_af = 19.05;
n_panel = 4;
n_back_len = 15;

// LP1260110 LiPo pouch: length, width, thickness
bat_l = 110;
bat_w = 60;
bat_t = 12;

// Heltec WiFi LoRa 32 V3: length, width, height with the OLED
heltec_l = 50.2;
heltec_w = 25.5;
heltec_h = 10.2;

// TP4056 module (USB-C version) and the 5 V buck-boost (size a guess)
charger_l = 28;
charger_w = 17.5;
buck_l = 30;
buck_w = 20;

// Corner brackets that place each part on the floor: wall, leg, height,
// clearance round the part; the battery's are taller
bracket_wall = 1.2;
bracket_leg = 8;
bracket_h = 3;
bat_bracket_h = 6;
bracket_clear = 0.5;

// Where the parts sit along X (Heltec nearest the bulkhead)
bat_x = -60;
board_x = 20;
heltec_x = 75;
// END_PARAMS

eps = 0.01;

outer_l = panel_l + 2 * (panel_clear + rim_w);
outer_w = panel_w + 2 * (panel_clear + rim_w);
frame_t = ledge_t + glue_gap + panel_t;
tray_h = tray_floor + tray_inside_h;
groove_w = 2 * gasket_wall + gasket_slot;
tongue_e = groove_e + gasket_wall - seal_squeeze;
tongue_w = gasket_slot + 2 * seal_squeeze;
tongue_len = groove_depth - gasket_floor - 0.3;
pocket_e = rim_w;
opening_e = rim_w + panel_clear + ledge_w;
bezel_e = rim_w + panel_clear + bezel_overlap;
tray_in_e = tray_inset + tray_wall;
inside_l = outer_l - 2 * tray_in_e;
inside_w = outer_w - 2 * tray_in_e;

lane_x = outer_l / 2 - screw_e;
lane_y = outer_w / 2 - screw_e;
screw_nx = ceil(2 * lane_x / screw_pitch);
screw_ny = ceil(2 * lane_y / screw_pitch);
screws = concat(
  [for (i = [0:screw_nx], s = [-1, 1]) [-lane_x + i * 2 * lane_x / screw_nx, s * lane_y]],
  [for (j = [1:screw_ny - 1], s = [-1, 1]) [s * lane_x, -lane_y + j * 2 * lane_y / screw_ny]]
);

// The bulkhead goes between two end-wall screws, low enough that its body
// clears the frame's underside.
n_y = screw_ny % 2 == 0 ? lane_y / screw_ny : 0;
end_pitch = 2 * lane_y / screw_ny;
n_z = tray_floor + n_body_d / 2 + 0.5;
n_hole_d = n_thread_d + n_hole_clear;

assert(groove_e - screw_e >= clear_d / 2 + 1, "groove too close to the screws");
assert(groove_e + groove_w <= pocket_e - 0.5, "groove runs into the panel pocket");
assert(groove_depth <= frame_t - 2, "groove leaves too little frame above it");
assert(tongue_e >= tray_inset + 0.5 && tongue_e + tongue_w <= tray_in_e - 0.5, "tongue doesn't sit on the tray wall");
assert(n_z + n_body_d / 2 <= tray_h, "bulkhead's body hits the frame");
assert(sqrt(2) * n_hole_d / 2 < n_body_d / 2, "hole's 45° peak shows past the bulkhead");
assert(tray_wall <= n_panel, "end wall too thick for the bulkhead");
assert(end_pitch / 2 - column_d / 2 >= n_body_d / 2, "bulkhead hits a screw column");
assert(lane_x * 2 / screw_nx <= screw_pitch && lane_y * 2 / screw_ny <= screw_pitch);

// Outline inset e from the outer edge
module plan(e) {
  r = max(corner_r - e, 0.5);
  offset(r) square([outer_l - 2 * e - 2 * r, outer_w - 2 * e - 2 * r], center = true);
}

module band(e0, e1) {
  difference() {
    plan(e0);
    plan(e1);
  }
}

// Panel-sized outline grown by g each side
module panel_plan(g) {
  square([panel_l + 2 * g, panel_w + 2 * g], center = true);
}

// A horizontal hole along +X, peaked at 45° up the print with its tip cut
// to a short bridge.
module teardrop_x(d, len) {
  rotate([0, 90, 0]) linear_extrude(len, center = true) rotate(90) intersection() {
    hull() {
      circle(d = d);
      rotate(45) square(d / 2);
    }
    translate([-d, -d]) square([d / 2 + 0.5 + d, 2 * d]);
  }
}

// ---- tray

module tray() {
  difference() {
    union() {
      linear_extrude(tray_floor) plan(tray_inset);
      linear_extrude(tray_h) band(tray_inset, tray_in_e);
      for (p = screws) translate([p[0], p[1], 0]) cylinder(d = column_d, h = tray_h);
      // tongue, its tip narrowed to lead it into the gasket
      translate([0, 0, tray_h - eps]) {
        linear_extrude(tongue_len - 0.5 + eps) band(tongue_e, tongue_e + tongue_w);
        translate([0, 0, tongue_len - 0.5]) linear_extrude(0.5) band(tongue_e + 0.25, tongue_e + tongue_w - 0.25);
      }
      translate([0, 0, tray_floor - eps]) brackets();
    }
    for (p = screws) translate([p[0], p[1], tray_h - pilot_depth]) cylinder(d = pilot_d, h = pilot_depth + 1);
    translate([outer_l / 2 - tray_in_e + tray_wall / 2, n_y, n_z]) teardrop_x(n_hole_d, tray_wall + 2);
  }
}

// L-shaped corner brackets round a part of size l x w centred at (x, y)
module corner_brackets(x, y, l, w, h) {
  gl = l / 2 + bracket_clear;
  gw = w / 2 + bracket_clear;
  translate([x, y, 0]) for (sx = [-1, 1], sy = [-1, 1]) scale([sx, sy, 1]) translate([gl, gw, 0]) {
    translate([-bracket_leg, 0, 0]) cube([bracket_leg + bracket_wall, bracket_wall, h]);
    translate([0, -bracket_leg, 0]) cube([bracket_wall, bracket_leg + bracket_wall, h]);
  }
}

// Charger and buck-boost side by side across the tray, 6 mm apart
charger_cy = 3 + bracket_clear + bracket_wall + charger_w / 2;
buck_cy = -(3 + bracket_clear + bracket_wall + buck_w / 2);

module brackets() {
  corner_brackets(bat_x, 0, bat_l, bat_w, bat_bracket_h);
  corner_brackets(heltec_x, 0, heltec_l, heltec_w, bracket_h);
  corner_brackets(board_x, charger_cy, charger_l, charger_w, bracket_h);
  corner_brackets(board_x, buck_cy, buck_l, buck_w, bracket_h);
}
assert(bat_x - bat_l / 2 - bracket_clear - bracket_wall > -inside_l / 2, "battery runs into the -X wall");
assert(heltec_x + heltec_l / 2 + bracket_clear + bracket_wall < inside_l / 2 - n_back_len - 2, "Heltec runs into the bulkhead's back");
assert(bat_t < tray_inside_h);

// ---- frame

module frame() {
  difference() {
    linear_extrude(frame_t) difference() {
      plan(0);
      panel_plan(panel_clear - ledge_w);
    }
    translate([0, 0, ledge_t]) linear_extrude(frame_t) panel_plan(panel_clear);
    translate([0, 0, -eps]) linear_extrude(groove_depth + eps) band(groove_e, groove_e + groove_w);
    for (p = screws) translate([p[0], p[1], -1]) cylinder(d = clear_d, h = frame_t + 2);
  }
}

// ---- bezel

module bezel() {
  difference() {
    linear_extrude(bezel_t) plan(0);
    // inner edge bevelled 45° so it shades the cells less at low sun
    hull() {
      translate([0, 0, -1]) linear_extrude(1 + eps) panel_plan(-bezel_overlap);
      translate([0, 0, bezel_t]) linear_extrude(eps) panel_plan(-bezel_overlap + bezel_t);
    }
    for (p = screws) translate([p[0], p[1], 0]) {
      translate([0, 0, -1]) cylinder(d = clear_d, h = bezel_t + 2);
      translate([0, 0, bezel_t - cbore_h]) cylinder(d = cbore_d, h = cbore_h + 1);
    }
  }
}

assert(bezel_e < opening_e, "bezel reaches past the ledge");

// ---- gasket: TPU 85A, U-section, modelled as fitted (slot down)

module gasket() {
  difference() {
    linear_extrude(groove_depth) band(groove_e, groove_e + groove_w);
    translate([0, 0, -1]) linear_extrude(groove_depth - gasket_floor + 1) band(groove_e + gasket_wall, groove_e + gasket_wall + gasket_slot);
  }
}

module gasket_print() {
  translate([0, 0, groove_depth]) mirror([0, 0, 1]) gasket();
}

// ---- in place (z = 0 at the tray's underside); `lift` raises the lid

module frame_in_place(lift = 0) {
  translate([0, 0, tray_h + lift]) frame();
}

module gasket_in_place(lift = 0) {
  translate([0, 0, tray_h + lift]) gasket();
}

module bezel_in_place(lift = 0) {
  translate([0, 0, tray_h + frame_t + lift]) bezel();
}

// ---- reference parts

module ref_panel(lift = 0) {
  translate([0, 0, tray_h + ledge_t + glue_gap + lift]) linear_extrude(panel_t) panel_plan(0);
}

module ref_glue(lift = 0) {
  translate([0, 0, tray_h + ledge_t + lift]) linear_extrude(glue_gap) difference() {
    panel_plan(-1.5);
    panel_plan(-ledge_w + 1.5);
  }
}

module ref_battery() {
  translate([bat_x, 0, tray_floor + bat_t / 2]) cube([bat_l, bat_w, bat_t], center = true);
}

module ref_boards() {
  translate([heltec_x, 0, tray_floor + heltec_h / 2]) cube([heltec_l, heltec_w, heltec_h], center = true);
  translate([board_x, charger_cy, tray_floor + 2]) cube([charger_l, charger_w, 4], center = true);
  translate([board_x, buck_cy, tray_floor + 2.5]) cube([buck_l, buck_w, 5], center = true);
}

module ref_bulkhead() {
  wall_x = outer_l / 2 - tray_inset;
  translate([wall_x, n_y, n_z]) rotate([0, 90, 0]) {
    cylinder(d = n_body_d, h = 4);
    translate([0, 0, 4]) cylinder(d = 18, h = 16);
    translate([0, 0, -tray_wall - 5]) cylinder(d = n_nut_af / cos(30), h = 5, $fn = 6);
    translate([0, 0, -n_back_len]) cylinder(d = n_thread_d, h = n_back_len);
  }
}
