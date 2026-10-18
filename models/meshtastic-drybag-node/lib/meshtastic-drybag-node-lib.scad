// Meshtastic dry-bag node: a flat T-shaped frame, antenna up. The LiFePO4
// cell lies across the bottom, shut in a housing (the frame's half and a
// lid screwed onto it) that takes the knocks. The boards lie flat in pockets
// on the housing's top, dropped in from above, so they're perpendicular to
// the antenna: the LiFePO4 protection board and the XIAO kit on the left,
// the power-bank board on the right. Above them the N bulkhead clamps
// through a wall on its panel nut, and the antenna stands up from it.
//
// Use frame: X along the cell, Z up as it hangs, Y out of the front face.
// z = 0 is the housing's bottom. The frame prints back face down
// (frame_print()); the lid prints front face down (battery_lid_print()).

// BEGIN_PARAMS
// 32140 LiFePO4 cell
cell_d = 32;
cell_len = 140;
// Gap round the cell in its housing
cell_clear = 0.4;
// Room past each end of the cell for its welded tab and lead
end_clear = 3;
// Back plate thickness
plate_t = 3;
// Housing wall round the cell (the back plate is its back)
housing_wall = 3;
// Housing's end walls, which carry the lid's screws
end_wall = 10;
// Lid's M3 cap screws: length under the head, and how much of it threads into the frame
lid_screw_len = 16;
lid_screw_thread = 8;
m3_clear_d = 3.4;
m3_pilot_d = 2.5;
m3_head_d = 6.2;
// Cell leads out through the end walls, along the joint, between the screws
lead_d = 6;
// N female bulkhead: 5/8-24 UNEF thread, 3/4" hex panel nut
n_thread_d = 15.9;
n_hole_clear = 0.5;
n_nut_af = 19.05;
// Wall the bulkhead clamps through. Thin, so the panel nut leaves the antenna enough thread (user confirmed 4 mm)
bulkhead_wall_t = 4;
// Room between the boards' shelf and the bulkhead wall, for the boards and for the jack's body and the coax's bend (not measured)
rear_gap = 22;
// Antenna radome
antenna_d = 22;
antenna_len = 180;
// Its N male coupling nut
antenna_nut_d = 21.5;
antenna_nut_len = 20;
// How far the frame's stem runs up the antenna from the bulkhead wall
stem_len = 70;
// Power-bank charge board, measured off a photo against the cell: along
// the cell (its USB ports face the crossbar's end), out from the plate,
// and its tallest part above the shelf (not measured)
board_w = 39;
board_d = 44;
board_t = 9;
// XIAO nRF52840 + Wio-SX1262 stack, the same way round
kit_w = 22;
kit_d = 24;
kit_t = 12;
// 1S LiFePO4 protection board (KOOBOOK 24 A; typical size, not measured), outboard of the kit
bms_w = 25;
bms_d = 50;
bms_t = 4;
// Space between the boards and the middle, where the jack's body comes down
board_gap = 4;
// Shelf on the housing's top that the boards lie on
shelf_t = 3;
// Pocket round each board: clearance, and the rim's width and height
pocket_clear = 0.5;
rim_w = 2;
rim_h = 3;
// Saddle and zip tie at the top of the stem, round the antenna
saddle_w = 6;
tie_w = 4.5;
tie_t = 2;
corner_r = 4;
// END_PARAMS

cell_r = cell_d / 2 + cell_clear;
cell_y = plate_t + cell_r;
cell_z = housing_wall + cell_r;
cavity_half_x = cell_len / 2 + end_clear;
housing_half_x = cavity_half_x + end_wall;
housing_top = cell_z + cell_r + housing_wall;
lid_front_y = cell_y + cell_r + housing_wall;
lid_t = lid_front_y - cell_y;
lid_screw_x = cavity_half_x + end_wall / 2;
lid_screw_dz = cell_r - m3_head_d / 2;
lid_counterbore = lid_t - (lid_screw_len - lid_screw_thread);
// At the centreline, between the lid's screws.
lead_z = cell_z;

shelf_top = housing_top + shelf_t;

n_hole_d = n_thread_d + n_hole_clear;
// The nut's corners swing through this as it's tightened.
nut_r = n_nut_af / sqrt(3);
wall_half_x = nut_r + 3;
antenna_y = plate_t + max(nut_r, antenna_nut_d / 2) + 1;
wall_top_y = antenna_y + nut_r + 3;
wall_z = shelf_top + rear_gap;

// Pocket interiors, inboard edge first: x0 < x1 either way.
kit_x1 = -(wall_half_x + board_gap);
kit_x0 = kit_x1 - kit_w - 2 * pocket_clear;
bms_x1 = kit_x0 - rim_w;
bms_x0 = bms_x1 - bms_w - 2 * pocket_clear;
board_x0 = wall_half_x + board_gap;
board_x1 = board_x0 + board_w + 2 * pocket_clear;
shelf_d = max(kit_d, bms_d, board_d) + 2 * pocket_clear + rim_w;

bar_half = max(housing_half_x, -bms_x0 + rim_w, board_x1 + rim_w);
bar_top = shelf_top + max(kit_t, board_t, bms_t) + 4;
stem_half = antenna_d / 2 + 2 + tie_t + 3;
stem_top = wall_z + bulkhead_wall_t + stem_len;
antenna_saddle_z = stem_top - 3 - saddle_w / 2;
antenna_tie_z = antenna_saddle_z - saddle_w / 2 - tie_w / 2 - 2;

assert(shelf_top + max(board_t, kit_t, bms_t) < wall_z - 2, "boards reach the bulkhead wall");
assert(bar_top < wall_z, "crossbar runs up past the bulkhead wall");
assert(lid_counterbore > 1 && lid_counterbore < lid_t - 3, "lid screw length doesn't suit the lid's thickness");
assert(lid_screw_thread < cell_y - 1, "lid screws would break through the back");
assert(end_wall >= m3_head_d + 2, "end walls too thin for the lid's counterbores");
assert(antenna_y + n_hole_d / 2 * sqrt(2) < wall_top_y - 1, "bulkhead hole's peak breaks out of the wall");
assert(antenna_y - antenna_d / 2 > plate_t, "antenna radome hits the back plate");

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
  rounded_rect_xz(-bar_half, bar_half, 0, bar_top, corner_r);
  rounded_rect_xz(-stem_half, stem_half, bar_top - corner_r * 2, stem_top, corner_r);
  // Fill the inside corners where the stem meets the crossbar.
  for (s = [-1, 1])
    difference() {
      translate([s > 0 ? stem_half : -stem_half - corner_r, 0, bar_top]) cube([corner_r, plate_t, corner_r]);
      translate([s * (stem_half + corner_r), -1, bar_top + corner_r])
        rotate([-90, 0, 0]) cylinder(r = corner_r, h = plate_t + 2);
    }
}

module cell_cavity() {
  translate([0, cell_y, cell_z]) rotate([0, 90, 0]) cylinder(r = cell_r, h = 2 * cavity_half_x, center = true, $fn = 96);
  for (s = [-1, 1])
    translate([s * (cavity_half_x + end_wall / 2), cell_y, lead_z])
      rotate([0, 90, 0]) cylinder(d = lead_d, h = end_wall + 2, center = true, $fn = 24);
}

module lid_screw_axes() {
  for (sx = [-1, 1], sz = [-1, 1])
    translate([sx * lid_screw_x, 0, cell_z + sz * lid_screw_dz]) children();
}

// The frame's half of the housing: back plate to the joint at the cell's centreline.
module housing_back() {
  difference() {
    translate([-housing_half_x, plate_t - 0.01, 0]) cube([2 * housing_half_x, cell_y - plate_t + 0.01, housing_top]);
    cell_cavity();
    lid_screw_axes() translate([0, cell_y - lid_screw_thread - 1, 0]) rotate([-90, 0, 0]) cylinder(d = m3_pilot_d, h = lid_screw_thread + 2, $fn = 24);
  }
}

module battery_lid() {
  difference() {
    translate([-housing_half_x, cell_y, 0]) cube([2 * housing_half_x, lid_t, housing_top - 0.3]);
    cell_cavity();
    lid_screw_axes() {
      translate([0, cell_y - 1, 0]) rotate([-90, 0, 0]) cylinder(d = m3_clear_d, h = lid_t + 2, $fn = 24);
      translate([0, lid_front_y - lid_counterbore, 0]) rotate([-90, 0, 0]) cylinder(d = m3_head_d, h = lid_counterbore + 1, $fn = 32);
    }
  }
}

// Front rim, its underside chamfered 45° so it prints.
module front_rim(x0, x1, y) {
  hull() {
    translate([x0, y - rim_w, shelf_top - 0.01]) cube([x1 - x0, rim_w, rim_h]);
    translate([x0, y - rim_w - rim_h, shelf_top - 0.01]) cube([x1 - x0, 0.01, 0.01]);
  }
}

module pocket_rims(x0, x1, depth) {
  front = plate_t + depth + 2 * pocket_clear + rim_w;
  for (x = [x0 - rim_w, x1])
    translate([x, plate_t - 0.01, shelf_top - 0.01]) cube([rim_w, front - plate_t, rim_h]);
  front_rim(x0 - rim_w, x1 + rim_w, front);
}

module shelf() {
  translate([-bar_half, plate_t - 0.01, housing_top]) cube([2 * bar_half, shelf_d + 0.01, shelf_t]);
  pocket_rims(kit_x0, kit_x1, kit_d);
  pocket_rims(bms_x0, bms_x1, bms_d);
  pocket_rims(board_x0, board_x1, board_d);
}

module bulkhead_wall() {
  difference() {
    translate([-wall_half_x, plate_t - 0.01, wall_z]) cube([2 * wall_half_x, wall_top_y - plate_t, bulkhead_wall_t]);
    translate([0, antenna_y, wall_z - 1]) linear_extrude(bulkhead_wall_t + 2) tear_2d(n_hole_d);
  }
}

module antenna_saddle() {
  r = antenna_d / 2 + 0.4;
  difference() {
    translate([-stem_half + 2, plate_t - 0.01, antenna_saddle_z - saddle_w / 2])
      cube([2 * stem_half - 4, antenna_y - plate_t, saddle_w]);
    translate([0, antenna_y, antenna_saddle_z]) cylinder(r = r, h = saddle_w + 2, center = true, $fn = 96);
  }
}

module frame() {
  difference() {
    union() {
      plate_outline();
      housing_back();
      shelf();
      bulkhead_wall();
      antenna_saddle();
    }
    cell_cavity();
    for (side = [-1, 1])
      translate([side * (antenna_d / 2 + 1 + tie_t / 2) - tie_t / 2, -1, antenna_tie_z - tie_w / 2])
        cube([tie_t, plate_t + 2, tie_w]);
  }
}

module frame_print() {
  rotate([90, 0, 0]) frame();
}

module battery_lid_print() {
  translate([0, 0, lid_front_y]) rotate([-90, 0, 0]) battery_lid();
}

// Reference hardware, not printed.
module cell() {
  translate([0, cell_y, cell_z]) rotate([0, 90, 0]) cylinder(d = cell_d, h = cell_len, center = true, $fn = 64);
}

module antenna() {
  translate([0, antenna_y, wall_z + bulkhead_wall_t]) {
    cylinder(r = nut_r, h = 4, $fn = 6);
    translate([0, 0, 4]) cylinder(d = antenna_nut_d, h = antenna_nut_len, $fn = 48);
    translate([0, 0, 4 + antenna_nut_len]) cylinder(d = antenna_d, h = antenna_len, $fn = 48);
  }
  translate([0, antenna_y, wall_z - 15]) cylinder(r = nut_r, h = 15, $fn = 6);
}

module boards() {
  translate([board_x0 + pocket_clear, plate_t + pocket_clear, shelf_top]) cube([board_w, board_d, 1.6]);
  translate([kit_x0 + pocket_clear, plate_t + pocket_clear, shelf_top]) cube([kit_w, kit_d, kit_t]);
  translate([bms_x0 + pocket_clear, plate_t + pocket_clear, shelf_top]) cube([bms_w, bms_d, bms_t]);
}
