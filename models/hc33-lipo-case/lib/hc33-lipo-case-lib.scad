// HT-HC33 LiPo case: a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), a Heltec
// WiFi LoRa 32 V4, a 103665 LiPo pouch cell and a USB-C TP4056 charger
// board in a two-piece screwed case that stands on end, with two SMA
// bulkheads through its top end and the three USB-Cs out of its bottom.
//
// Two columns side by side, two layers deep:
// - the base: the back face and the walls up to the taller of the cell and
//   the V4. The cell lies flat in the +X column; the V4 lies flat in the -X
//   column between corner brackets, its USB-C through the bottom wall. A
//   divider runs between them.
// - the lid: the front face and the rest of the walls. The HC33 hangs from
//   it on four M2 posts over the cell, face toward the lid, its USB-C
//   through the bottom wall. The TP4056 hangs upside down over the V4's
//   lower end, on a pad between corner brackets, its USB-C through the
//   bottom wall above the V4's. Two ribs either side of the cell column
//   stop just over the cell and hold it down. The SMAs go through the top
//   end wall over the V4's column, past the TP4056.
// M3 cap screws go down through the lid's corner towers into the base's.
// A tongue round the base's rim drops into a groove under the lid's.
//
// Frame: origin at the cavity's centre in plan, z = 0 on the back face. Y
// runs up the case (+Y the top end, the SMAs; -Y the bottom, the USB-Cs),
// X across, Z out the front. The base prints as modelled, back face down;
// the lid prints front face down (`lid_print()`).

// BEGIN_PARAMS
// 103665 LiPo pouch, protection board included: thickness, width, length
// (nominal, unmeasured)
cell_t = 10;
cell_w = 36;
cell_l = 65;

// Clearance round the cell per side
cell_fit = 0.5;

// Gap between the base's rim and the HC33's underside parts
hc_head = 1.5;

// Heltec HT-HC33: length, width, PCB thickness, the tallest part under
// the PCB and over it
hc_l = 60;
hc_w = 33.5;
hc_pcb = 1.5;
hc_under = 3.6;
hc_over = 3.3;

// HC33 mounting holes: inset from the board's edges, and the M2 pilot in
// the lid's posts (hole size unmeasured)
hc_hole_inset = 2;
hc_pilot_d = 1.7;
hc_post_d = 4.5;

// How far the HC33's USB-C sticks out past the board's end, and its
// centre over the PCB's top face
hc_usb_overhang = 1.54;
hc_usb_z = 0.3;

// Heltec WiFi LoRa 32 V4: length, width, thickness over its parts; its
// USB-C's centre over the board's underside and how far it sticks out
// past the board's end (both unmeasured)
v4_l = 51.7;
v4_w = 25.4;
v4_t = 10.7;
v4_usb_z = 4;
v4_usb_overhang = 0.5;

// Clearance round the V4 per side
v4_fit = 0.3;

// Divider between the cell and the V4
divider_t = 1.6;

// TP4056 USB-C charger board: PCB length and width, PCB thickness, the
// receptacle's height over the PCB and how far it sticks out past the
// board's end (unmeasured)
tp_l = 28;
tp_w = 17.5;
tp_pcb = 1.6;
tp_usb_h = 3.2;
tp_usb_overhang = 0.6;

// Pad between the TP4056 and the lid, so a plug's overmold clears the
// lid's face
tp_lift = 1;

// Clearance round the TP4056 per side
tp_fit = 0.3;

// Corner brackets round the V4 and the TP4056: wall, leg, height
bracket_wall = 1.2;
bracket_leg = 5;
bracket_h = 2.5;

// Gap between each USB-C's face and the bottom wall
usb_gap = 0.3;

// USB-C openings, sized for a plug's overmold, with 45° chamfered corners
usb_open_w = 13;
usb_open_h = 7;
usb_open_chamfer = 1.5;

// SMA bulkheads (1/4-36) through the top end wall: the pair's centre
// across from the V4 column's centre, either side of it by this much, the
// hole, the inner nut across corners, and how far the connector's back
// and the pigtail's bend reach in from the wall
sma_shift = 1.5;
sma_dx = 7.5;
sma_hole_d = 6.6;
sma_nut_d = 9.2;
sma_behind = 12;

// Walls, back and front
wall = 2.5;

// Outside corner radius
corner_r = 4;

// Hold-down ribs either side of the cell column: thickness, and the gap
// over the cell
rib_t = 1.2;
rib_gap = 0.3;

// M3 cap screws through the corner towers: clearance hole, pilot,
// counterbore diameter and depth, the plastic round them, and the
// screw's length under the head
clear_d = 3.4;
pilot_d = 2.5;
cbore_d = 6;
cbore_h = 3.2;
screw_skin = 1.2;
screw_len = 18;

// Indexing tongue round the base's rim: in from the cavity, width,
// height; the lid's groove clearance per side
tongue_e = 0.65;
tongue_w = 1.2;
tongue_h = 1.5;
groove_fit = 0.2;
// END_PARAMS

eps = 0.01;

// Across: the V4's column at -X, the divider, the cell's column at +X
v4_col = v4_w + 2 * v4_fit;
cell_col = cell_w + 2 * cell_fit;
hx = (v4_col + divider_t + cell_col) / 2;
v4_cx = -hx + v4_col / 2;
div_x0 = -hx + v4_col;
cell_cx = hx - cell_col / 2;
inner_r = max(corner_r - wall, 0.5);

// Along Y from the bottom wall's inner face. Each board's USB-C face is
// usb_gap off the wall; its PCB starts the receptacle's overhang further in
y0 = 0;
hc_pcb_y0 = y0 + usb_gap + hc_usb_overhang;
hc_y1 = hc_pcb_y0 + hc_l;
v4_pcb_y0 = y0 + usb_gap + v4_usb_overhang;
v4_y1 = v4_pcb_y0 + v4_l;
tp_pcb_y0 = y0 + usb_gap + tp_usb_overhang;
tp_y1 = tp_pcb_y0 + tp_l;
cell_y0 = y0 + cell_fit;
y1 = max(cell_y0 + cell_l + cell_fit, hc_y1 + 0.5, v4_y1 + v4_fit, tp_y1 + sma_behind + 1);
// The cavity is centred on the origin
ys = -(y0 + y1) / 2;
hy = (y1 - y0) / 2;

// Up from the back face
cell_top = wall + cell_t;
split = wall + max(cell_t, v4_t);
v4_usb_cz = wall + v4_usb_z;
pcb_bot = split + hc_head + hc_under;
pcb_top = pcb_bot + hc_pcb;
hc_usb_cz = pcb_top + hc_usb_z;
groove_top = split + tongue_h + 0.3;
ceiling = max(hc_usb_cz + usb_open_h / 2 + 1, pcb_top + hc_over + 1,
              split + 1 + tp_lift + tp_pcb + tp_usb_h);
total_h = ceiling + wall;
// The TP4056 hangs upside down: pad, PCB, then the receptacle under it
tp_pcb_z1 = ceiling - tp_lift;
tp_usb_cz = tp_pcb_z1 - tp_pcb - tp_usb_h / 2;
sma_z = ceiling - sma_nut_d / 2 - 0.3;
sma_xs = [for (s = [-1, 1]) v4_cx + sma_shift + s * sma_dx];

// Screws on the corners' diagonals, far enough out that the clearance
// hole clears the side walls' faces and the counterbore the cavity's corner
screw_d = max(clear_d / 2 + screw_skin,
              ((cbore_d / 2 + 0.8 + inner_r) / sqrt(2)) - inner_r);
tower_r = cbore_d / 2 + screw_skin;
screws = [for (sx = [-1, 1], sy = [-1, 1]) [sx * (hx + screw_d), sy * (hy + screw_d)]];
screw_engage = screw_len - (total_h - split - cbore_h);
pilot_depth = screw_engage + 1;

hc_holes = [for (sx = [-1, 1], yy = [hc_pcb_y0 + hc_hole_inset, hc_y1 - hc_hole_inset])
  [cell_cx + sx * (hc_w / 2 - hc_hole_inset), ys + yy]];
// Inner faces of the hold-down ribs, from the cell column's centre
rib_in = cell_col / 2 - 0.2 - rib_t;

assert(hc_w / 2 + 0.3 <= rib_in, "the HC33 runs into the hold-down ribs");
assert(tp_w / 2 + tp_fit + bracket_wall <= v4_col / 2, "the TP4056's brackets leave the V4's column");
assert(abs(cell_cx - v4_cx) >= usb_open_w + 2, "the HC33's and the TP4056's openings run together");
assert(v4_usb_cz - usb_open_h / 2 >= wall + 0.5, "the V4's opening cuts into the back");
assert(v4_usb_cz + usb_open_h / 2 <= split - 1, "the V4's opening runs up into the base's rim");
assert(hc_usb_cz - usb_open_h / 2 >= groove_top + 1, "the HC33's opening runs into the lid's groove");
assert(tp_usb_cz - usb_open_h / 2 >= groove_top + 1, "the TP4056's opening runs into the lid's groove");
assert(tp_usb_cz + usb_open_h / 2 <= ceiling, "the TP4056's opening runs into the lid's face");
assert(sma_z - sma_hole_d / 2 >= groove_top + 1, "an SMA's hole runs into the lid's groove");
assert(sma_z - sma_nut_d / 2 >= split + 0.5, "an SMA's inner nut sits on the V4");
assert(y1 - sma_behind >= tp_y1 + 1, "the SMAs' backs run into the TP4056");
assert(sma_xs[1] - sma_xs[0] >= sma_nut_d + 3, "the SMAs' nuts are too close");
for (x = sma_xs) {
  assert(x + sma_nut_d / 2 <= cell_cx - rib_in - rib_t - 0.5, "an SMA's nut hits a hold-down rib");
  assert(x - sma_nut_d / 2 >= -hx + 0.5, "an SMA's nut hits the side wall");
  // The outer nut sits on the end face, beside the top corner's tower
  assert(norm([x - screws[1][0], hy + wall + 1 - screws[1][1]]) >= tower_r + sma_nut_d / 2 + 0.3,
         "an SMA's outer nut hits a screw tower");
}
assert(screw_engage >= 6, "the screws barely reach into the base");
assert(pilot_depth <= split - 1, "the screw's pilot breaks through the back");
assert(ceiling - pcb_top >= hc_over + 0.5, "the HC33's posts are shorter than its parts");
assert(tongue_e + tongue_w + groove_fit + 0.4 <= wall, "the groove breaks out of the wall");

// Footprint: the rounded body and the four screw towers
module outline() {
  r = corner_r;
  translate([-(hx + wall) + r, -(hy + wall) + r]) offset(r) square([2 * (hx + wall - r), 2 * (hy + wall - r)]);
  for (p = screws) translate(p) circle(r = tower_r);
}

module cavity(grow = 0) {
  r = inner_r + grow;
  translate([-hx - grow + r, -hy - grow + r]) offset(r) square([2 * (hx + grow - r), 2 * (hy + grow - r)]);
}

module tongue_plan(grow = 0) {
  difference() {
    cavity(tongue_e + tongue_w + grow);
    cavity(tongue_e - grow);
  }
}

// USB-C opening through the bottom wall, centred at (x, z)
module usb_opening(x, z) {
  c = usb_open_chamfer;
  w = usb_open_w / 2;
  h = usb_open_h / 2;
  translate([x, -hy - wall / 2, z]) rotate([90, 0, 0]) linear_extrude(wall + 2, center = true)
    polygon([[-w + c, -h], [w - c, -h], [w, -h + c], [w, h - c], [w - c, h], [-w + c, h], [-w, h - c], [-w, -h + c]]);
}

// Corner brackets round a board w wide whose PCB runs ya..yb (from the
// bottom wall), centred on x. The pair at the USB end stand back from the
// end so they clear the receptacle's corners.
module board_brackets(x, w, ya, yb, fit, h) {
  gw = w / 2 + fit;
  translate([x, 0, 0]) for (sx = [-1, 1]) scale([sx, 1, 1]) {
    translate([gw, ys + ya + 2, 0]) cube([bracket_wall, bracket_leg, h]);
    translate([gw - bracket_leg, ys + yb + fit, 0]) cube([bracket_leg + bracket_wall, bracket_wall, h]);
    translate([gw, ys + yb + fit - bracket_leg, 0]) cube([bracket_wall, bracket_leg, h]);
  }
}

// ---- base

module base() {
  difference() {
    union() {
      linear_extrude(split) outline();
      translate([0, 0, split - eps]) linear_extrude(tongue_h + eps) tongue_plan();
    }
    translate([0, 0, wall]) linear_extrude(split) cavity();
    for (p = screws) translate([p[0], p[1], split - pilot_depth]) cylinder(d = pilot_d, h = pilot_depth + 1);
    usb_opening(v4_cx, v4_usb_cz);
  }
  translate([div_x0, -hy - eps, wall - eps]) cube([divider_t, 2 * hy + 2 * eps, split - wall + eps]);
  translate([0, 0, wall - eps]) board_brackets(v4_cx, v4_w, v4_pcb_y0, v4_y1, v4_fit, bracket_h + eps);
}

// ---- lid, modelled in place

module lid() {
  difference() {
    union() {
      difference() {
        translate([0, 0, split]) linear_extrude(total_h - split) outline();
        translate([0, 0, split - 1]) linear_extrude(ceiling - split + 1) cavity();
      }
      for (sx = [-1, 1]) translate([cell_cx + sx * (rib_in + rib_t / 2) - rib_t / 2, -hy + inner_r, cell_top + rib_gap])
        cube([rib_t, 2 * (hy - inner_r), ceiling - cell_top - rib_gap + eps]);
      for (p = hc_holes) translate([p[0], p[1], pcb_top]) cylinder(d = hc_post_d, h = ceiling - pcb_top + eps);
      translate([v4_cx - tp_w / 2 - tp_fit, -hy - eps, tp_pcb_z1])
        cube([tp_w + 2 * tp_fit, tp_y1 - y0 + tp_fit + eps, tp_lift + eps]);
      translate([0, 0, tp_pcb_z1 - bracket_h]) board_brackets(v4_cx, tp_w, tp_pcb_y0, tp_y1, tp_fit, bracket_h + eps);
    }
    translate([0, 0, split - 1]) linear_extrude(groove_top - split + 1) tongue_plan(groove_fit);
    for (p = screws) translate([p[0], p[1], 0]) {
      cylinder(d = clear_d, h = total_h + 1);
      translate([0, 0, total_h - cbore_h]) cylinder(d = cbore_d, h = cbore_h + 1);
    }
    for (p = hc_holes) translate([p[0], p[1], pcb_top - 1]) cylinder(d = hc_pilot_d, h = ceiling - pcb_top);
    usb_opening(cell_cx, hc_usb_cz);
    usb_opening(v4_cx, tp_usb_cz);
    for (x = sma_xs) translate([x, hy + wall / 2, sma_z]) rotate([90, 0, 0])
      cylinder(d = sma_hole_d, h = wall + 2, center = true);
  }
}

module lid_in_place(lift = 0) {
  translate([0, 0, lift]) lid();
}

// Front face down, so the counterbores' floors are short bridges and the
// ribs, posts and brackets stand up off it.
module lid_print() {
  translate([0, 0, total_h]) mirror([0, 0, 1]) lid();
}

// ---- reference parts

module ref_cell() {
  translate([cell_cx - cell_w / 2, ys + cell_y0, wall]) cube([cell_w, cell_l, cell_t]);
}

// A block of its full thickness, and its USB-C
module ref_v4() {
  translate([v4_cx - v4_w / 2, ys + v4_pcb_y0, wall]) cube([v4_w, v4_l, v4_t]);
  translate([v4_cx - 4.5, ys + y0 + usb_gap, v4_usb_cz - 1.6]) cube([9, v4_usb_overhang + 7, 3.2]);
}

// Upside down under the lid
module ref_tp(lift = 0) {
  translate([0, 0, lift]) {
    translate([v4_cx - tp_w / 2, ys + tp_pcb_y0, tp_pcb_z1 - tp_pcb]) cube([tp_w, tp_l, tp_pcb]);
    translate([v4_cx - 4.5, ys + y0 + usb_gap, tp_pcb_z1 - tp_pcb - tp_usb_h]) cube([9, 7.5, tp_usb_h]);
  }
}

// The PCB, its parts as blocks either side clear of the holes, and the USB-C
module ref_hc(lift = 0) {
  translate([cell_cx, 0, lift]) {
    translate([-hc_w / 2, ys + hc_pcb_y0, pcb_bot]) cube([hc_w, hc_l, hc_pcb]);
    translate([-hc_w / 2 + 5, ys + hc_pcb_y0 + 8, pcb_bot - hc_under]) cube([hc_w - 10, hc_l - 12, hc_under]);
    translate([-hc_w / 2 + 5, ys + hc_pcb_y0 + 8, pcb_top]) cube([hc_w - 10, hc_l - 12, hc_over]);
    translate([-4.5, ys + y0 + usb_gap, hc_usb_cz - 1.6]) cube([9, 7.5, 3.2]);
  }
}

module ref_sma(lift = 0) {
  for (x = sma_xs) translate([x, hy, sma_z + lift]) rotate([-90, 0, 0]) {
    translate([0, 0, -(sma_behind - 2)]) cylinder(d = 6.35, h = sma_behind - 2 + wall + 8);
    translate([0, 0, wall]) cylinder(d = sma_nut_d, h = 2, $fn = 6);
  }
}
