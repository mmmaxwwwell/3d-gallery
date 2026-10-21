// HT-HC33 LiPo case: a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), a 103665
// LiPo pouch cell and a USB-C TP4056 charger board in a two-piece screwed
// case that stands on end, with two SMA bulkheads through its top end.
//
// Two pieces:
// - the base: the back face and the walls up to the cell's top. The cell
//   lies flat in it; the TP4056 sits at the bottom end, raised on a pad
//   between corner brackets, its USB-C through the bottom wall. Two stubs
//   stop the cell short of the TP4056 and leave the middle open for its
//   leads.
// - the lid: the front face and the rest of the walls. The HC33 hangs from
//   it on four M2 posts, face toward the lid, over the TP4056 and the
//   cell's lower end, its USB-C through the bottom wall above the
//   TP4056's. Two ribs down the long walls stop just over the cell and
//   hold it down. The SMAs go through the top end wall, over the cell's
//   upper end, past the board's end.
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

// Gap between the cell's top and the HC33's underside parts
cell_head = 1.5;

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

// TP4056 USB-C charger board: PCB length and width,
// PCB thickness, the receptacle's height over the PCB and how far it
// sticks out past the board's end (unmeasured)
tp_l = 28;
tp_w = 17.5;
tp_pcb = 1.6;
tp_usb_h = 3.2;
tp_usb_overhang = 0.6;

// Pad the TP4056 sits on, so a plug's overmold clears the floor
tp_lift = 1;

// Clearance round the TP4056 per side
tp_fit = 0.3;

// Corner brackets round the TP4056: wall, leg, height over the pad
bracket_wall = 1.2;
bracket_leg = 5;
bracket_h = 2.5;

// Stubs between the TP4056 and the cell: thickness along Y, and how far
// each reaches in from a side wall. The middle stays open for the leads
stop_t = 1.6;
stop_reach = 8;

// Gap between each USB-C's face and the bottom wall
usb_gap = 0.3;

// USB-C openings, sized for a plug's overmold, with 45° chamfered corners
usb_open_w = 13;
usb_open_h = 7;
usb_open_chamfer = 1.5;

// SMA bulkheads (1/4-36) through the top end wall: either side of the
// centre by this much, the hole, the inner nut across corners, and how
// far the connector's back and the pigtail's bend reach in from the wall
sma_dx = 10;
sma_hole_d = 6.6;
sma_nut_d = 9.2;
sma_behind = 12;

// Walls, back and front
wall = 2.5;

// Outside corner radius
corner_r = 4;

// Hold-down ribs down the long walls: thickness, and the gap over the cell
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

hx = cell_w / 2 + cell_fit;
inner_r = max(corner_r - wall, 0.5);

// Along Y from the bottom wall's inner face
y0 = 0;
// Each board's USB-C face is usb_gap off the bottom wall; its PCB starts
// the receptacle's overhang further in
tp_y0 = y0 + usb_gap;
tp_pcb_y0 = tp_y0 + tp_usb_overhang;
tp_y1 = tp_pcb_y0 + tp_l;
stop_y0 = tp_y1 + tp_fit + bracket_wall;
cell_y0 = stop_y0 + stop_t + cell_fit;
y1 = cell_y0 + cell_l + cell_fit;
hc_y0 = y0 + usb_gap;
hc_pcb_y0 = hc_y0 + hc_usb_overhang;
hc_y1 = hc_pcb_y0 + hc_l;
// The cavity is centred on the origin
ys = -(y0 + y1) / 2;
hy = (y1 - y0) / 2;

// Up from the back face
cell_top = wall + cell_t;
split = cell_top;
tp_z0 = wall + tp_lift;
tp_usb_cz = tp_z0 + tp_pcb + tp_usb_h / 2;
pcb_bot = cell_top + cell_head + hc_under;
pcb_top = pcb_bot + hc_pcb;
hc_usb_cz = pcb_top + hc_usb_z;
groove_top = split + tongue_h + 0.3;
ceiling = max(hc_usb_cz + usb_open_h / 2 + 1, pcb_top + hc_over + 1);
total_h = ceiling + wall;
sma_z = ceiling - sma_nut_d / 2 - 0.3;

// Screws on the corners' diagonals, far enough out that the clearance
// hole clears the side walls' faces and the counterbore the cavity's corner
screw_d = max(clear_d / 2 + screw_skin,
              ((cbore_d / 2 + 0.8 + inner_r) / sqrt(2)) - inner_r);
tower_r = cbore_d / 2 + screw_skin;
screws = [for (sx = [-1, 1], sy = [-1, 1]) [sx * (hx + screw_d), sy * (hy + screw_d)]];
screw_engage = screw_len - (total_h - split - cbore_h);
pilot_depth = screw_engage + 1;

hc_holes = [for (sx = [-1, 1], yy = [hc_pcb_y0 + hc_hole_inset, hc_y1 - hc_hole_inset])
  [sx * (hc_w / 2 - hc_hole_inset), ys + yy]];

assert(hc_w / 2 + 0.3 <= hx - rib_t - 0.2, "the HC33 runs into the hold-down ribs");
assert(tp_w / 2 + tp_fit + bracket_wall <= hx - 0.5, "the TP4056 doesn't fit across");
assert(tp_usb_cz - usb_open_h / 2 >= wall + 0.5, "the TP4056's opening cuts into the back");
assert(tp_usb_cz + usb_open_h / 2 <= split - 1, "the TP4056's opening runs up into the base's rim");
assert(hc_usb_cz - usb_open_h / 2 >= groove_top + 1, "the HC33's opening runs into the lid's groove");
assert(sma_z - sma_hole_d / 2 >= groove_top + 1, "an SMA's hole runs into the lid's groove");
assert(sma_z - sma_nut_d / 2 >= cell_top + 0.5, "an SMA's inner nut sits on the cell");
assert(y1 - sma_behind >= hc_y1 + 1, "the SMAs' backs run into the HC33");
assert(sma_dx + sma_nut_d / 2 <= hx - rib_t - 0.5, "an SMA's nut hits a hold-down rib");
assert(2 * sma_dx >= sma_nut_d + 3, "the SMAs' nuts are too close");
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

// USB-C opening through the bottom wall, centred at height z
module usb_opening(z) {
  c = usb_open_chamfer;
  w = usb_open_w / 2;
  h = usb_open_h / 2;
  translate([0, -hy - wall / 2, z]) rotate([90, 0, 0]) linear_extrude(wall + 2, center = true)
    polygon([[-w + c, -h], [w - c, -h], [w, -h + c], [w, h - c], [w - c, h], [-w + c, h], [-w, h - c], [-w, -h + c]]);
}

// ---- base

module tp_brackets() {
  gw = tp_w / 2 + tp_fit;
  ya = ys + tp_pcb_y0 - tp_fit;
  yb = ys + tp_y1 + tp_fit;
  for (sx = [-1, 1]) scale([sx, 1, 1]) {
    // the bottom pair stand clear of the USB-C's corners, back from the wall
    translate([gw, ya + 2, 0]) cube([bracket_wall, bracket_leg, bracket_h]);
    translate([gw - bracket_leg, yb, 0]) cube([bracket_leg + bracket_wall, bracket_wall, bracket_h]);
    translate([gw, yb - bracket_leg, 0]) cube([bracket_wall, bracket_leg, bracket_h]);
  }
}

module base() {
  difference() {
    union() {
      linear_extrude(split) outline();
      translate([0, 0, split - eps]) linear_extrude(tongue_h + eps) tongue_plan();
    }
    translate([0, 0, wall]) linear_extrude(split) cavity();
    for (p = screws) translate([p[0], p[1], split - pilot_depth]) cylinder(d = pilot_d, h = pilot_depth + 1);
    usb_opening(tp_usb_cz);
  }
  translate([-tp_w / 2 - tp_fit, ys + y0 - eps, wall - eps])
    cube([tp_w + 2 * tp_fit, tp_y1 - y0 + tp_fit + eps, tp_lift + eps]);
  translate([0, 0, tp_z0 - eps]) tp_brackets();
  for (sx = [-1, 1]) scale([sx, 1, 1])
    translate([hx - stop_reach, ys + stop_y0, wall - eps]) cube([stop_reach + eps, stop_t, cell_t + eps]);
}

// ---- lid, modelled in place

module lid() {
  difference() {
    union() {
      difference() {
        translate([0, 0, split]) linear_extrude(total_h - split) outline();
        translate([0, 0, split - 1]) linear_extrude(ceiling - split + 1) cavity();
      }
      for (sx = [-1, 1]) translate([sx * (hx - 0.2 - rib_t / 2) - rib_t / 2, -hy + 0.5, cell_top + rib_gap])
        cube([rib_t, 2 * hy - 1, ceiling - cell_top - rib_gap + eps]);
      for (p = hc_holes) translate([p[0], p[1], pcb_top]) cylinder(d = hc_post_d, h = ceiling - pcb_top + eps);
    }
    translate([0, 0, split - 1]) linear_extrude(groove_top - split + 1) tongue_plan(groove_fit);
    for (p = screws) translate([p[0], p[1], 0]) {
      cylinder(d = clear_d, h = total_h + 1);
      translate([0, 0, total_h - cbore_h]) cylinder(d = cbore_d, h = cbore_h + 1);
    }
    for (p = hc_holes) translate([p[0], p[1], pcb_top - 1]) cylinder(d = hc_pilot_d, h = ceiling - pcb_top);
    usb_opening(hc_usb_cz);
    for (sx = [-1, 1]) translate([sx * sma_dx, hy + wall / 2, sma_z]) rotate([90, 0, 0])
      cylinder(d = sma_hole_d, h = wall + 2, center = true);
  }
}

module lid_in_place(lift = 0) {
  translate([0, 0, lift]) lid();
}

// Front face down, so the counterbores' floors are short bridges and the
// ribs and posts stand up off it.
module lid_print() {
  translate([0, 0, total_h]) mirror([0, 0, 1]) lid();
}

// ---- reference parts

module ref_cell() {
  translate([-cell_w / 2, ys + cell_y0, wall]) cube([cell_w, cell_l, cell_t]);
}

module ref_tp() {
  translate([-tp_w / 2, ys + tp_pcb_y0, tp_z0]) cube([tp_w, tp_l, tp_pcb]);
  translate([-4.5, ys + tp_y0, tp_z0 + tp_pcb]) cube([9, 7.5, tp_usb_h]);
}

// The PCB, its parts as blocks either side clear of the holes, and the USB-C
module ref_hc(lift = 0) {
  translate([0, 0, lift]) {
    translate([-hc_w / 2, ys + hc_pcb_y0, pcb_bot]) cube([hc_w, hc_l, hc_pcb]);
    translate([-hc_w / 2 + 5, ys + hc_pcb_y0 + 8, pcb_bot - hc_under]) cube([hc_w - 10, hc_l - 12, hc_under]);
    translate([-hc_w / 2 + 5, ys + hc_pcb_y0 + 8, pcb_top]) cube([hc_w - 10, hc_l - 12, hc_over]);
    translate([-4.5, ys + hc_y0, hc_usb_cz - 1.6]) cube([9, 7.5, 3.2]);
  }
}

module ref_sma(lift = 0) {
  for (sx = [-1, 1]) translate([sx * sma_dx, hy, sma_z + lift]) rotate([-90, 0, 0]) {
    translate([0, 0, -(sma_behind - 2)]) cylinder(d = 6.35, h = sma_behind - 2 + wall + 8);
    translate([0, 0, wall]) cylinder(d = sma_nut_d, h = 2, $fn = 6);
  }
}
