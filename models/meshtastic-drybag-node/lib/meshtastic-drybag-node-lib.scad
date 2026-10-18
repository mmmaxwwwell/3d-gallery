// Meshtastic dry-bag node: a flat T-shaped frame. The LiFePO4 cell lies
// across the top, the N bulkhead hangs under its middle with the antenna
// pointing down, the XIAO kit sits left of the bulkhead and the power-bank
// board right of it. Everything is zip-tied to one face.
//
// Use frame: X along the cell, Z up as it hangs, Y out of the front face.
// z = 0 is the underside of the bulkhead wall, where its panel nut seats.
// The frame prints back face down (frame_print()).

// BEGIN_PARAMS
// 32140 LiFePO4 cell
cell_d = 32;
cell_len = 140;
// Gap round the cell in its saddles
cell_clear = 0.4;
// Back plate thickness
plate_t = 3;
// N female bulkhead: 5/8-24 UNEF thread, 3/4" hex panel nut
n_thread_d = 15.9;
n_hole_clear = 0.5;
n_nut_af = 19.05;
// Wall the bulkhead clamps through. Thin, so the panel nut leaves the antenna enough thread (not measured)
bulkhead_wall_t = 4;
// Room between the wall and the cell for the jack's body and the coax's bend (not measured)
rear_gap = 22;
// Antenna radome
antenna_d = 22;
antenna_len = 180;
// Its N male coupling nut
antenna_nut_d = 21.5;
antenna_nut_len = 20;
// How far the frame's stem runs down the antenna from the bulkhead wall
stem_len = 70;
// Power-bank charge board, measured off a photo against the cell
board_w = 39;
board_h = 44;
// XIAO nRF52840 + Wio-SX1262 stack
kit_w = 22;
kit_h = 24;
kit_t = 12;
// Space between the boards and the bulkhead wall, and between the boards and the cell
board_gap = 3;
// Ledge each board sits on, and the one along its inboard edge
lip_h = 2;
lip_w = 2;
// Saddles under the cell and the antenna
saddle_w = 6;
saddle_inset = 18;
// Zip-tie slots, for 3.6 mm ties
tie_w = 4.5;
tie_t = 2;
// Cord hole above the cell
hang_d = 6;
hang_tab = 12;
corner_r = 4;
// END_PARAMS

n_hole_d = n_thread_d + n_hole_clear;
// The nut's corners swing through this as it's tightened.
nut_r = n_nut_af / sqrt(3);
wall_half_x = nut_r + 3;
antenna_y = plate_t + max(nut_r, antenna_nut_d / 2) + 1;
wall_top_y = antenna_y + nut_r + 3;

cell_r = cell_d / 2 + cell_clear;
cell_y = plate_t + cell_r;
cell_z = bulkhead_wall_t + rear_gap + cell_r;
saddle_x = cell_len / 2 - saddle_inset;

board_top = cell_z - cell_r - board_gap;
board_bottom = board_top - max(board_h, kit_h);
kit_x1 = -(wall_half_x + board_gap);
kit_x0 = kit_x1 - kit_w;
board_x0 = wall_half_x + board_gap;
board_x1 = board_x0 + board_w;

bar_bottom = board_bottom - lip_w - 3;
bar_top = cell_z + cell_r + tie_t + 4;
stem_half = antenna_d / 2 + 2 + tie_t + 3;
stem_bottom = -stem_len;
antenna_saddle_z = stem_bottom + 3 + saddle_w / 2;
antenna_tie_z = antenna_saddle_z + saddle_w / 2 + tie_w / 2 + 2;

assert(board_x1 + 2 + tie_t < cell_len / 2, "power-bank board runs off the end of the crossbar");
assert(kit_x0 - 2 - tie_t > -cell_len / 2, "XIAO kit runs off the end of the crossbar");
assert(board_bottom > stem_bottom + 20, "boards hang below the stem's antenna saddle");
assert(antenna_y + n_hole_d / 2 * sqrt(2) < wall_top_y - 1, "bulkhead hole's peak breaks out of the wall");
assert(antenna_y - antenna_d / 2 > plate_t, "antenna radome hits the back plate");
assert(saddle_x + saddle_w / 2 <= cell_len / 2, "saddles past the cell's ends");

// Round hole along Z, peaked at 45° toward +Y: up as the frame prints.
module tear_2d(d) {
  hull() {
    circle(d = d);
    translate([0, d / 2 * sqrt(2)]) square(0.01, center = true);
  }
}

module rounded_rect_xz(x0, x1, z0, z1, r) {
  translate([0, plate_t, 0]) rotate([90, 0, 0])
    linear_extrude(plate_t)
      offset(r) offset(-r) translate([x0, z0]) square([x1 - x0, z1 - z0]);
}

module plate_outline() {
  union() {
    rounded_rect_xz(-cell_len / 2, cell_len / 2, bar_bottom, bar_top, corner_r);
    rounded_rect_xz(-stem_half, stem_half, stem_bottom, bar_bottom + corner_r * 2, corner_r);
    rounded_rect_xz(-hang_d - 3, hang_d + 3, bar_top - corner_r * 2, bar_top + hang_tab, hang_d);
  }
  // Fill the inside corners where the stem meets the crossbar.
  for (s = [-1, 1])
    difference() {
      translate([s > 0 ? stem_half : -stem_half - corner_r, 0, bar_bottom - corner_r])
        cube([corner_r, plate_t, corner_r]);
      translate([s * (stem_half + corner_r), -1, bar_bottom - corner_r])
        rotate([-90, 0, 0]) cylinder(r = corner_r, h = plate_t + 2);
    }
}

// Slot through the plate: w along X, h along Z.
module tie_slot(x, z, w, h) {
  translate([x - w / 2, -1, z - h / 2]) cube([w, plate_t + 2, h]);
}

module saddle(len, r, centre_y) {
  difference() {
    translate([-len / 2, plate_t - 0.01, -r - 3]) cube([len, centre_y - plate_t, 2 * (r + 3)]);
    translate([0, centre_y, 0]) rotate([0, 90, 0]) cylinder(r = r, h = len + 2, center = true, $fn = 96);
  }
}

module cell_saddles() {
  for (s = [-1, 1])
    translate([s * saddle_x, 0, cell_z]) saddle(saddle_w, cell_r, cell_y);
}

module antenna_saddle() {
  r = antenna_d / 2 + 0.4;
  difference() {
    translate([-stem_half + 2, plate_t - 0.01, antenna_saddle_z - saddle_w / 2])
      cube([2 * stem_half - 4, antenna_y - plate_t, saddle_w]);
    translate([0, antenna_y, antenna_saddle_z]) cylinder(r = r, h = saddle_w + 2, center = true, $fn = 96);
  }
}

module bulkhead_wall() {
  difference() {
    translate([-wall_half_x, plate_t - 0.01, 0]) cube([2 * wall_half_x, wall_top_y - plate_t, bulkhead_wall_t]);
    translate([0, antenna_y, -1]) linear_extrude(bulkhead_wall_t + 2) tear_2d(n_hole_d);
  }
}

module board_ledges(x0, x1, inboard_x, outward) {
  // Bottom ledge carries the board's weight as the node hangs.
  translate([x0, plate_t - 0.01, board_bottom - lip_w]) cube([x1 - x0, lip_h, lip_w]);
  translate([outward > 0 ? inboard_x - lip_w : inboard_x, plate_t - 0.01, board_bottom - lip_w])
    cube([lip_w, lip_h, board_top - board_bottom + lip_w]);
}

module frame() {
  mid_z = (board_top + board_bottom) / 2;
  difference() {
    union() {
      plate_outline();
      cell_saddles();
      bulkhead_wall();
      antenna_saddle();
      board_ledges(kit_x0, kit_x1, kit_x1, -1);
      board_ledges(board_x0, board_x1, board_x0, 1);
    }
    for (s = [-1, 1], side = [-1, 1])
      tie_slot(s * (saddle_x - saddle_w / 2 - tie_w / 2 - 1), cell_z + side * (cell_r + tie_t / 2 + 0.5), tie_w, tie_t);
    for (side = [-1, 1])
      tie_slot(side * (antenna_d / 2 + 1 + tie_t / 2), antenna_tie_z, tie_t, tie_w);
    for (x = [kit_x0 - 1 - tie_t / 2, kit_x1 + 1 + tie_t / 2, board_x0 - 1 - tie_t / 2, board_x1 + 1 + tie_t / 2])
      tie_slot(x, mid_z, tie_t, tie_w);
    translate([0, -1, bar_top + hang_tab - hang_d])
      rotate([-90, 0, 0]) cylinder(d = hang_d, h = plate_t + 2);
  }
}

module frame_print() {
  rotate([90, 0, 0]) frame();
}

// Reference hardware, not printed.
module cell() {
  translate([0, cell_y, cell_z]) rotate([0, 90, 0]) cylinder(d = cell_d, h = cell_len, center = true, $fn = 64);
}

module antenna() {
  translate([0, antenna_y, 0]) {
    translate([0, 0, -4]) cylinder(r = nut_r, h = 4, $fn = 6);
    translate([0, 0, -4 - antenna_nut_len]) cylinder(d = antenna_nut_d, h = antenna_nut_len, $fn = 48);
    translate([0, 0, -4 - antenna_nut_len - antenna_len]) cylinder(d = antenna_d, h = antenna_len, $fn = 48);
    translate([0, 0, bulkhead_wall_t]) cylinder(r = nut_r, h = 15, $fn = 6);
  }
}

module boards() {
  translate([board_x0, plate_t, board_top - board_h]) cube([board_w, 1.6, board_h]);
  translate([kit_x0, plate_t, board_top - kit_h]) cube([kit_w, kit_t, kit_h]);
}
