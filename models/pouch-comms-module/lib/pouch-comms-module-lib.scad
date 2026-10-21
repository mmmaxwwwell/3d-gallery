// Pouch comms module: a box that rides in a backpack side pouch, holding a
// power bank, a Franklin T9 hotspot, a Raspberry Pi Zero 2 W and a Heltec
// HT-HC33 (ESP32-S3 + Wi-Fi HaLow).
//
// Two pieces: the box (floor and walls) and a flat lid on four M3 cap
// screws, one in each inside corner.
//
// Plan, looking down on the open box, +Y up (the end that sticks out of
// the pouch):
//   - left column: the power bank lying flat, ports toward +Y, held between
//     the left wall and a full-height divider. A rib at its -Y end stops it,
//     and two posts catch the corners of its port end.
//   - above the bank: an open bay for its plugs and the cables. The divider
//     stops at the bank's end, so the bay opens into the right column.
//   - right column: the T9 at -Y between corner brackets, then the HC33
//     (by the divider) and the Pi (by the right wall) side by side on
//     standoffs, their long sides along Y, with a cable lane between them.
//   - an SMA bulkhead through the +Y end wall over the HC33, for its HaLow
//     antenna on a U.FL pigtail.
//
// Frame: origin at the box's outer -X -Y bottom corner, X across, Y along,
// Z up. Box and lid both print as modelled, bottom face down.

// BEGIN_PARAMS
// Outer size across (X) and along (Y); the height follows from the bank
outer_w = 140;
outer_l = 190;

// Walls, floor and lid
wall = 5;

// Outside corner radius
corner_r = 6;

// Power bank lying flat: across, along, height
bank_w = 44.5;
bank_l = 145;
bank_h = 36.5;

// Clearance round the bank per side, and over its top under the lid
bank_fit = 0.5;
bank_head = 1;

// Rib that stops the bank at its -Y end, and its height
bank_stop_h = 10;

// Posts that catch the bank's port-end corners: how far each reaches in
// from the side, and its thickness along Y. The middle of the end stays
// clear for the ports
bank_post_reach = 5;
bank_post_t = 3;

// Divider between the bank and the electronics
divider_t = 2;

// Franklin T9: across, along, height
t9_w = 67;
t9_l = 94;
t9_h = 14;

// Gap between the T9's brackets and the boards' zone, for its cable
board_gap = 8;

// Raspberry Pi Zero 2 W: board width and length, hole inset and the
// standoff height; M2.5 screws
pi_w = 30;
pi_l = 65;
pi_hole_inset = 3.5;
pi_standoff_h = 3;
pi_pilot_d = 2.1;
pi_standoff_d = 5.5;

// Heltec HT-HC33: board width and length, hole inset; the standoff clears
// the 3.6 mm battery socket underneath. M2 screws
hc_w = 33.5;
hc_l = 60;
hc_hole_inset = 2;
hc_standoff_h = 4.2;
hc_pilot_d = 1.6;
hc_standoff_d = 4.5;

// How far each board sits in from its side of the column
board_side_gap = 2;

// SMA bulkhead (1/4-36): hole through the end wall, and how far the
// connector's back and the pigtail's bend reach in from the wall
sma_hole_d = 6.6;
sma_behind = 12;

// Corner brackets that place the T9: wall, leg, height, clearance
bracket_wall = 1.2;
bracket_leg = 10;
bracket_h = 4;
bracket_clear = 0.5;

// M3 cap screws through the lid: corner boss diameter, pilot and its
// depth, clearance hole, counterbore diameter and depth
boss_d = 8;
pilot_d = 2.5;
pilot_depth = 10;
clear_d = 3.4;
cbore_d = 6;
cbore_h = 3;
// END_PARAMS

eps = 0.01;

inner_h = bank_h + bank_head;
box_h = wall + inner_h;
total_h = box_h + wall;

x_in0 = wall;
x_in1 = outer_w - wall;
y_in0 = wall;
y_in1 = outer_l - wall;
boss_r = boss_d / 2;

// Bank pocket, clear of the -Y corner boss
bank_x0 = x_in0;
bank_x1 = x_in0 + bank_w + 2 * bank_fit;
bank_y0 = y_in0 + boss_r + 0.5;
bank_y1 = bank_y0 + bank_l + 2 * bank_fit;
div_x0 = bank_x1;
div_x1 = bank_x1 + divider_t;

col_x0 = div_x1;
col_x1 = x_in1;
col_cx = (col_x0 + col_x1) / 2;

// T9 pocket: its -Y brackets run into the wall
t9_y0 = y_in0 + bracket_clear;
t9_cy = t9_y0 + t9_l / 2;
t9_y1 = t9_y0 + t9_l;

boards_y0 = t9_y1 + bracket_clear + bracket_wall + board_gap;
hc_x0 = col_x0 + board_side_gap;
pi_x1 = col_x1 - board_side_gap;
pi_x0 = pi_x1 - pi_w;
lane_w = pi_x0 - (hc_x0 + hc_w);

hc_holes = [for (i = [0, 1], j = [0, 1])
  [hc_x0 + hc_hole_inset + i * (hc_w - 2 * hc_hole_inset),
   boards_y0 + hc_hole_inset + j * (hc_l - 2 * hc_hole_inset)]];
pi_holes = [for (i = [0, 1], j = [0, 1])
  [pi_x0 + pi_hole_inset + i * (pi_w - 2 * pi_hole_inset),
   boards_y0 + pi_hole_inset + j * (pi_l - 2 * pi_hole_inset)]];

sma_x = hc_x0 + hc_w / 2;
sma_z = wall + inner_h / 2;

screws = [for (x = [x_in0, x_in1], y = [y_in0, y_in1]) [x, y]];

assert(bank_w - 2 * bank_post_reach >= 30, "the posts cover the bank's ports");
assert(bank_y1 + bank_post_t <= y_in1 - 20, "no bay left over the bank's ports");
assert(t9_w + 2 * (bracket_clear + bracket_wall) <= col_x1 - col_x0, "T9 doesn't fit across the column");
assert(t9_x1() <= x_in1 - boss_r, "T9 runs into the corner boss");
assert(lane_w >= 12, "no cable lane between the boards");
assert(boards_y0 + max(hc_l, pi_l) <= y_in1 - boss_r, "boards run into the +Y corner bosses");
assert(boards_y0 + hc_l <= y_in1 - sma_behind, "HC33 runs into the SMA's back");
assert(t9_h < inner_h);
assert(pilot_depth < box_h - wall, "pilot breaks through the floor");

function t9_x1() = col_cx + t9_w / 2 + bracket_clear + bracket_wall;

// Outline inset e from the outer edge
module plan(e = 0) {
  r = max(corner_r - e, 0.5);
  translate([e + r, e + r]) offset(r) square([outer_w - 2 * e - 2 * r, outer_l - 2 * e - 2 * r]);
}

// Horizontal hole along Y, peaked at 45° up the print, tip cut to a short
// bridge.
module teardrop_y(d, len) {
  rotate([90, 0, 0]) linear_extrude(len, center = true) intersection() {
    hull() {
      circle(d = d);
      rotate(45) square(d / 2);
    }
    translate([-d, -d]) square([2 * d, d / 2 + 0.5 + d]);
  }
}

// L-shaped corner brackets round a part l x w centred at (x, y)
module corner_brackets(x, y, w, l, h) {
  gw = w / 2 + bracket_clear;
  gl = l / 2 + bracket_clear;
  translate([x, y, 0]) for (sx = [-1, 1], sy = [-1, 1]) scale([sx, sy, 1]) translate([gw, gl, 0]) {
    translate([-bracket_leg, 0, 0]) cube([bracket_leg + bracket_wall, bracket_wall, h]);
    translate([0, -bracket_leg, 0]) cube([bracket_wall, bracket_leg + bracket_wall, h]);
  }
}

module standoffs(holes, d, h, pilot) {
  for (p = holes) translate([p[0], p[1], 0]) difference() {
    cylinder(d = d, h = h);
    translate([0, 0, 0.6]) cylinder(d = pilot, h = h);
  }
}

// ---- box

module box() {
  difference() {
    union() {
      difference() {
        linear_extrude(box_h) plan();
        translate([0, 0, wall]) linear_extrude(box_h) plan(wall);
      }
      intersection() {
        linear_extrude(box_h) plan();
        for (p = screws) translate([p[0], p[1], 0]) cylinder(d = boss_d, h = box_h);
      }
      translate([div_x0, y_in0 - eps, 0]) cube([divider_t, bank_y1 + bank_post_t - y_in0, box_h]);
      translate([bank_x0 - eps, y_in0 - eps, 0]) cube([bank_x1 - bank_x0 + 2 * eps, bank_y0 - bank_fit - y_in0, wall + bank_stop_h]);
      for (x = [bank_x0 - eps, bank_x1 - bank_post_reach]) translate([x, bank_y1, 0]) cube([bank_post_reach + eps, bank_post_t, box_h]);
      translate([0, 0, wall - eps]) {
        corner_brackets(col_cx, t9_cy, t9_w, t9_l, bracket_h + eps);
        standoffs(hc_holes, hc_standoff_d, hc_standoff_h + eps, hc_pilot_d);
        standoffs(pi_holes, pi_standoff_d, pi_standoff_h + eps, pi_pilot_d);
      }
    }
    for (p = screws) translate([p[0], p[1], box_h - pilot_depth]) cylinder(d = pilot_d, h = pilot_depth + 1);
    translate([sma_x, outer_l - wall / 2, sma_z]) teardrop_y(sma_hole_d, wall + 2);
  }
}

// ---- lid

module lid() {
  difference() {
    linear_extrude(wall) plan();
    for (p = screws) translate([p[0], p[1], 0]) {
      translate([0, 0, -1]) cylinder(d = clear_d, h = wall + 2);
      translate([0, 0, wall - cbore_h]) cylinder(d = cbore_d, h = cbore_h + 1);
    }
  }
}

module lid_in_place(lift = 0) {
  translate([0, 0, box_h + lift]) lid();
}

// ---- reference parts

module ref_bank(lift = 0) {
  translate([0, 0, lift]) translate([bank_x0 + bank_fit, bank_y0 + bank_fit, wall]) cube([bank_w, bank_l, bank_h]);
}

module ref_t9(lift = 0) {
  translate([0, 0, lift]) translate([col_cx - t9_w / 2, t9_y0, wall]) cube([t9_w, t9_l, t9_h]);
}

module ref_boards(lift = 0) {
  translate([hc_x0, boards_y0, wall + hc_standoff_h + lift]) {
    cube([hc_w, hc_l, 1.5]);
    translate([3, 6, 1.5]) cube([hc_w - 6, hc_l - 12, 3.3]);
  }
  translate([pi_x0, boards_y0, wall + pi_standoff_h + lift]) {
    cube([pi_w, pi_l, 1.2]);
    translate([3, 8, 1.2]) cube([pi_w - 6, pi_l - 16, 3.5]);
  }
}

module ref_sma(out = 0) {
  translate([sma_x, outer_l + out, sma_z]) rotate([90, 0, 0]) {
    translate([0, 0, -10]) cylinder(d = 8, h = 10);
    cylinder(d = 6.35, h = wall + sma_behind - 2);
  }
}
