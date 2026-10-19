// Modular insert for a Harbor Freight Apache case, first built as a portable
// MeshCore repeater in an Apache 1800 (small).
//
// - A baseplate fills the case floor. It carries a grid of M5 pilots at
//   `pitch`, and every module screws down onto the grid with M5 x 10 cap
//   screws, so nothing rattles when the case is carried.
// - Every module's holes are whole multiples of `pitch` apart, so a module
//   lands on any grid point and can move without reprinting the plate.
// - Repeater modules:
//   - a cell bed: a 32140 LiFePO4 cell lies front to back in it against the
//     case's right end wall, held by two screwed hooks, with the cell's
//     charge board in a slot under it
//   - a tray for a perfboard carrying the radio (Ebyte E22P-915M30S, 1 W),
//     the MCU (Seeed XIAO nRF54LM20A) and the radio's 5 V boost (Pololu
//     U3V40F5)
// - The antenna's N bulkhead goes through a hole drilled in the case's left
//   end wall; the modules keep clear of it.
//
// Frame: X along the case (the cell's end at +X, the bulkhead's at -X), Y
// across it (+Y toward the hinge), Z up from the case's inside floor. The
// plate is centred on the origin. Trays are modelled with their first screw
// hole at their origin and placed by grid index with `at()`; the cell bed
// and its hooks are modelled about the cell's axis.

// Case inside (the user's measurements: straight-sided, every corner about
// r 5), at the floor and at the rim, and the base's inside depth. The lid
// is the same size inside and 18 deep.
case_floor = [214, 150];
case_rim = [214, 150];
case_depth = 76;
case_corner_r = 5;
// Case wall thickness, for the reference render only
case_wall = 3;

// Baseplate: gap to the case walls each side, thickness, the 45° chamfer
// round its bottom edge (clears the fillet where the case floor meets the
// walls), the grid pitch, the closest a grid hole may come to the edge
plate_clear = 1;
plate_t = 7;
plate_chamfer = 2;
pitch = 20;
grid_margin = 8;

// M5 x 10 cap screws everywhere (the user's pick): clearance, pilot (threads
// into bare plastic), the head's counterbore, the screw's length under the
// head, and how much of a part it clamps (the rest, 6, threads into the
// 7 mm plate). Trays' base thickness.
m5_clear_d = 5.5;
m5_pilot_d = 4.2;
m5_cb_d = 9.2;
screw_len = 10;
clamp_t = 4;
base_t = 6;
// A hole's centre from its module's outer edge
ear = 7;

// 32140 LiFePO4 cell (tabbed, wire leads), lying along X; gap round it
cell_d = 32;
cell_len = 140;
cell_clear = 0.4;
// Cell bed: one cradle the cell's whole length, the cell's axis on the last
// grid column, about 1 mm off the end wall; open on the wall side, so the
// wall stops the cell rolling out. Its inner post's face and how far it
// reaches toward the wall (both from the axis), the floor under the charge
// board, the gap from the board's top to the cell, and its screws' Y
// positions, down the axis under the cell (fit them before the cell)
bed_post_x = -32;
bed_reach = 13;
bed_floor = 4;
board_gap = 1.5;
bed_hole_ys = [-60, -40, 40, 60];
// Hooks: screwed onto the bed's post, each curls over the cell to
// `hook_end_angle` above the axis on the wall side and presses it into the
// bed. Their Y positions and length, wall, ear thickness, screws (from the
// axis, with the heads clear of the arch) and their spacing, pilot depth
// into the post, and squeeze
hook_ys = [-45, 45];
hook_len = 24;
hook_t = 3;
hook_ear_t = 5;
hook_screw_x = -24;
hook_screw_dy = 12;
hook_pilot_depth = 8;
hook_end_angle = 45;
hook_squeeze = 0.3;

// Boards, [along X, along Y, thickness]. The LiFePO4 charge board (from the
// Kingboss bank), under the cell with its USB-C and USB-A toward -X and its
// button toward the wall: 33 wide (the user's caliper), 40 long (scaled
// from a photo), 9 over the USB-A (a guess). The radio's carrier, a 50 x
// 70 perfboard.
charge_dims = [40, 33, 9];
carrier_dims = [70, 50, 1.6];
// On the carrier, for the reference render: the E22P-915M30S, the XIAO
// nRF54LM20A and the U3V40F5 boost
e22_dims = [38.5, 24, 3];
xiao_dims = [21, 17.8, 3.5];
boost_dims = [15.2, 15.2, 5.6];
// Board pocket: clearance round the board, its rim's width and height, and
// the relief under the board (solder tails) inside a ledge it rests on
pocket_clear = 0.5;
rim_w = 2;
rim_h = 3;
ledge_w = 2;
relief_depth = 2.5;
// Zip tie up to 3.6 wide: slot through the base, groove along the underside
tie_slot = [4.2, 2.2];
tie_groove_depth = 2;

// N female bulkhead through the case's left end wall (5/8-24 thread, 3/4"
// hex nut outside, its body and O-ring inside): centre height above the
// case floor, offset across the case
n_thread_d = 15.9;
n_nut_af = 19.05;
n_body_d = 24;
n_body_len = 15;
bulkhead_z = 45;
bulkhead_y = 0;
// ALFA AOA-915-5ACM on it, for the reference render
antenna_d = 22;
antenna_len = 180;

// ---- derived

plate_l = case_floor[0] - 2 * plate_clear;
plate_w = case_floor[1] - 2 * plate_clear;
plate_r = max(case_corner_r - plate_clear, plate_chamfer + 1);
grid_nx = floor((plate_l - 2 * grid_margin) / pitch) + 1;
grid_ny = floor((plate_w - 2 * grid_margin) / pitch) + 1;

seat_r = cell_d / 2 + cell_clear;
// The cell's axis above the plate's top
bed_axis_z = bed_floor + charge_dims[2] + board_gap + seat_r;
// The hook's bore drops below the seat's axis so it bears on the cell
// (which rests on the seat's floor) without pinching its sides
hook_drop = cell_clear + (seat_r - cell_d / 2) + hook_squeeze;

eps = 0.01;

// Grid point (i, j), counted from the -X, -Y corner, on the plate's top
function grid_pt(i, j) = [
  (i - (grid_nx - 1) / 2) * pitch,
  (j - (grid_ny - 1) / 2) * pitch,
  plate_t
];

module at(i, j) translate(grid_pt(i, j)) children();

module rounded_rect(size, r) {
  offset(r) offset(-r) square(size, center = true);
}

// Hole spacing that puts a module's holes outside a pocket of this size,
// counterbores clear of its rim
function hole_span(pocket) = ceil((pocket + 2 * rim_w + m5_cb_d + 1) / pitch) * pitch;

// An M5 x 10 through a part `h` thick: the head sinks to `clamp_t` above
// the part's bottom
module m5_seat(h) {
  translate([0, 0, -eps]) cylinder(d = m5_clear_d, h = h + 2 * eps);
  translate([0, 0, clamp_t]) cylinder(d = m5_cb_d, h = h - clamp_t + eps);
}

// ---- baseplate

module baseplate() {
  difference() {
    hull() {
      linear_extrude(eps) rounded_rect([plate_l - 2 * plate_chamfer, plate_w - 2 * plate_chamfer], plate_r - plate_chamfer);
      translate([0, 0, plate_chamfer]) linear_extrude(plate_t - plate_chamfer) rounded_rect([plate_l, plate_w], plate_r);
    }
    for (i = [0 : grid_nx - 1], j = [0 : grid_ny - 1])
      translate([grid_pt(i, j)[0], grid_pt(i, j)[1], -eps]) cylinder(d = m5_pilot_d, h = plate_t + 2 * eps);
  }
}

// ---- cell bed and hooks (modelled about the cell's axis: x = 0 on it,
// y = 0 at the cell's middle, z = 0 on the plate's top)

// The charge board's slot: across the bed, open to the top so the board
// drops in before the cell, the USB end flush with the post's face
charge_slot_w = charge_dims[1] + 2 * pocket_clear + 2 * (tie_slot[1] + 1);
charge_x0 = bed_post_x;

module cell_bed() {
  difference() {
    translate([bed_post_x, -cell_len / 2, 0]) cube([bed_reach - bed_post_x, cell_len, bed_axis_z]);
    translate([0, -cell_len, bed_axis_z]) rotate([-90, 0, 0]) cylinder(r = seat_r, h = 2 * cell_len, $fn = 96);
    translate([bed_post_x - 1, -charge_slot_w / 2, bed_floor]) cube([bed_reach - bed_post_x + 2, charge_slot_w, bed_axis_z]);
    // One zip tie across the board's middle: up beside it, over it, down,
    // and back along a groove under the floor
    tie_x = charge_x0 + charge_dims[0] / 2;
    for (s = [-1, 1]) translate([tie_x, s * (charge_slot_w / 2 - tie_slot[1] / 2 - 0.5), bed_floor / 2]) cube([tie_slot[0], tie_slot[1], bed_floor + 1], center = true);
    translate([tie_x, 0, 0]) cube([tie_slot[0], charge_slot_w, 2 * tie_groove_depth], center = true);
    for (y = bed_hole_ys) translate([0, y, 0]) m5_seat(bed_axis_z);
    for (hy = hook_ys, s = [-1, 1])
      translate([hook_screw_x, hy + s * hook_screw_dy / 2, bed_axis_z - hook_pilot_depth]) cylinder(d = m5_pilot_d, h = hook_pilot_depth + eps);
  }
}

// The hook's profile in (x, z)
module hook_2d() {
  a = hook_end_angle;
  difference() {
    union() {
      intersection() {
        translate([0, bed_axis_z]) circle(r = seat_r + hook_t, $fn = 96);
        translate([0, bed_axis_z]) polygon([[0, 0], [50 * cos(a), 50 * sin(a)], [-50, 50], [-50, 0]]);
      }
      translate([bed_post_x, bed_axis_z]) square([-bed_post_x, hook_ear_t]);
    }
    translate([0, bed_axis_z - hook_drop]) circle(r = seat_r, $fn = 96);
  }
}

module hook() {
  difference() {
    rotate([90, 0, 0]) linear_extrude(hook_len, center = true) hook_2d();
    for (s = [-1, 1]) translate([hook_screw_x, s * hook_screw_dy / 2, bed_axis_z - eps]) cylinder(d = m5_clear_d, h = hook_ear_t + 2 * eps);
  }
}

// ---- board tray (origin at the first hole). Two holes at each end along
// X, `pitch` apart, so the tray is only as deep as the board and its ties.

function tray_pocket(dims) = [dims[0] + 2 * pocket_clear, dims[1] + 2 * pocket_clear];
function tray_span(dims) = hole_span(tray_pocket(dims)[0]);

module board_tray(dims, open_side = [0, -1]) {
  pocket = tray_pocket(dims);
  span = tray_span(dims);
  outer = [pocket[0] + 2 * rim_w, pocket[1] + 2 * rim_w];
  tie_xs = [-pocket[0] / 4, pocket[0] / 4];
  tie_y = outer[1] / 2 + tie_slot[1] / 2 + 0.5;
  base = [span + 2 * ear, max(2 * tie_y + tie_slot[1] + 2, pitch + 2 * ear)];
  translate([span / 2, pitch / 2, 0]) difference() {
    union() {
      linear_extrude(base_t) rounded_rect(base, ear);
      difference() {
        linear_extrude(base_t + rim_h) square(outer, center = true);
        translate([0, 0, base_t]) linear_extrude(rim_h + eps) square(pocket, center = true);
        // The connector side has no rim
        translate([open_side[0] * outer[0] / 2, open_side[1] * outer[1] / 2, base_t])
          linear_extrude(rim_h + eps)
            square([open_side[0] == 0 ? pocket[0] : 2 * rim_w + eps, open_side[1] == 0 ? pocket[1] : 2 * rim_w + eps], center = true);
      }
    }
    translate([0, 0, base_t - relief_depth]) linear_extrude(relief_depth + eps)
      square(pocket - [2 * ledge_w, 2 * ledge_w], center = true);
    for (sx = [-1, 1], sy = [-1, 1]) translate([sx * span / 2, sy * pitch / 2, 0]) m5_seat(base_t);
    for (x = tie_xs) {
      for (s = [-1, 1]) translate([x, s * tie_y, base_t / 2]) cube([tie_slot[0], tie_slot[1], base_t + 1], center = true);
      translate([x, 0, 0]) cube([tie_slot[0], 2 * tie_y + tie_slot[1], 2 * tie_groove_depth], center = true);
    }
  }
}

module carrier_tray() board_tray(carrier_dims, [0, -1]);

// ---- the repeater's layout, by grid index

// The cell's axis on the last grid column, against the right end wall
cell_axis = [grid_pt(grid_nx - 1, 0)[0], 0, plate_t + bed_axis_z];
carrier_at = [0, 1];

module on_cell_axis() translate([cell_axis[0], cell_axis[1], plate_t]) children();
module cell_bed_placed() on_cell_axis() cell_bed();
module hooks_placed() on_cell_axis() for (y = hook_ys) translate([0, y, 0]) hook();
module carrier_tray_placed() at(carrier_at[0], carrier_at[1]) carrier_tray();

// ---- reference: the case, cell, boards, bulkhead and antenna

module case_shell_2d(size, grow) rounded_rect(size + [2 * grow, 2 * grow], case_corner_r + grow);

// The floor, the back wall and the left end wall: the front and right are
// left off so the inside shows
module case_ref() {
  intersection() {
    difference() {
      hull() {
        translate([0, 0, -case_wall]) linear_extrude(eps) case_shell_2d(case_floor, case_wall);
        translate([0, 0, case_depth]) linear_extrude(eps) case_shell_2d(case_rim, case_wall);
      }
      hull() {
        linear_extrude(eps) case_shell_2d(case_floor, 0);
        translate([0, 0, case_depth]) linear_extrude(2 * eps) case_shell_2d(case_rim, 0);
      }
      translate([0, bulkhead_y, bulkhead_z]) rotate([0, -90, 0]) cylinder(d = n_thread_d + 0.5, h = 200);
    }
    union() {
      translate([-200, -200, -50]) cube([400, 400, 50 + eps]);
      translate([-200, 30, -50]) cube([400, 200, 200]);
      translate([-270, -200, -50]) cube([200, 400, 200]);
    }
  }
}

// Where the end wall's inside face is at the bulkhead's height
bulkhead_wall_x = (case_floor[0] + (case_rim[0] - case_floor[0]) * bulkhead_z / case_depth) / 2;

module bulkhead_ref() {
  mirror([1, 0, 0]) translate([bulkhead_wall_x, -bulkhead_y, bulkhead_z]) rotate([0, 90, 0]) {
    translate([0, 0, -n_body_len]) cylinder(d = n_body_d, h = n_body_len);
    cylinder(d = n_thread_d, h = case_wall + 10);
    translate([0, 0, case_wall]) cylinder(d = n_nut_af / cos(30), h = 5, $fn = 6);
  }
}

module antenna_ref() {
  mirror([1, 0, 0]) translate([bulkhead_wall_x + case_wall + 10, -bulkhead_y, bulkhead_z]) rotate([0, 90, 0])
    cylinder(d = antenna_d, h = antenna_len);
}

module cell_ref() {
  translate(cell_axis + [0, 0, -cell_clear]) rotate([90, 0, 0]) cylinder(d = cell_d, h = cell_len, center = true);
}

// A board's centre on its tray's floor
function tray_centre(at_ij, dims) = grid_pt(at_ij[0], at_ij[1]) + [tray_span(dims) / 2, pitch / 2, base_t];

module charge_ref() on_cell_axis() translate([charge_x0 + charge_dims[0] / 2, 0, bed_floor + charge_dims[2] / 2]) cube(charge_dims, center = true);

// Perfboard, the E22P at the end nearest the bulkhead (-X), the XIAO's
// USB-C at the open (front) edge, the boost behind it
module carrier_board_ref() translate(tray_centre(carrier_at, carrier_dims)) translate([0, 0, carrier_dims[2] / 2]) cube(carrier_dims, center = true);
module carrier_parts_ref() {
  c = tray_centre(carrier_at, carrier_dims) + [0, 0, carrier_dims[2]];
  translate(c + [-carrier_dims[0] / 2 + 3 + e22_dims[0] / 2, 0, e22_dims[2] / 2]) cube(e22_dims, center = true);
  translate(c + [carrier_dims[0] / 2 - 3 - xiao_dims[1] / 2, -carrier_dims[1] / 2 + xiao_dims[0] / 2, xiao_dims[2] / 2]) cube([xiao_dims[1], xiao_dims[0], xiao_dims[2]], center = true);
  translate(c + [carrier_dims[0] / 2 - 3 - boost_dims[0] / 2, carrier_dims[1] / 2 - 3 - boost_dims[1] / 2, boost_dims[2] / 2]) cube(boost_dims, center = true);
}

// ---- print layouts

module cell_bed_print() cell_bed();
// On its side: the arch would otherwise print in mid-air
module hook_print() translate([0, 0, hook_len / 2]) rotate([90, 0, 0]) hook();
module carrier_tray_print() carrier_tray();
