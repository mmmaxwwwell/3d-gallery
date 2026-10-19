// Modular insert for a Harbor Freight Apache case, first built as a portable
// MeshCore repeater in an Apache 1800 (small).
//
// - A baseplate fills the case floor. It carries a grid of M3 pilots at
//   `pitch`, and every module screws down onto the grid with M3 cap screws,
//   so nothing rattles when the case is carried.
// - Every module's holes are whole multiples of `pitch` apart, so a module
//   lands on any grid point and can move without reprinting the plate.
// - Repeater modules: two clips with screwed hooks for a 32140 LiFePO4
//   cell lying front to back against the case's right end wall, and two board trays with zip-tie slots: the
//   cell's charge board, and a perfboard carrier with the radio (Ebyte
//   E22P-915M30S, 1 W), the MCU (Seeed XIAO nRF54LM20A) and the radio's 5 V
//   boost (Pololu U3V40F5).
// - The antenna's N bulkhead goes through a hole drilled in the case's left
//   end wall; the modules keep clear of it.
//
// Frame: X along the case (the cell's end at +X, the bulkhead's at -X), Y across it (+Y toward
// the hinge), Z up from the case's inside floor. The plate is centred on
// the origin. Each module is modelled with its first screw hole at its
// origin and placed by grid index with `at()`.

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
plate_t = 6;
plate_chamfer = 2;
pitch = 20;
grid_margin = 8;

// M3 cap screws: clearance, pilot (threads into bare plastic), the head's
// counterbore and its depth, and the thickness of every module's base
m3_clear_d = 3.4;
m3_pilot_d = 2.5;
m3_cb_d = 6.2;
m3_cb_depth = 3.2;
base_t = 6;
// A hole's centre from its module's outer edge
ear = 5;

// 32140 LiFePO4 cell (tabbed, wire leads), lying along X; gap round it
cell_d = 32;
cell_len = 140;
cell_clear = 0.4;
// Cell clips: the cell's axis lies one grid column outboard of the clips'
// screws, on the last column, about 1 mm off the end wall. Each clip is a
// cradle under the cell, open on the wall side: its length along the cell,
// the seat's floor, its inner post's face (from the screw column), how far
// past the axis it reaches toward the wall, and its two screws' spacing
// (in tabs past its ends, so they're reached from above)
clip_len = 24;
clip_floor = 3;
clip_post_x = -8;
clip_reach = 13;
clip_hole_dy = 40;
// Hook: screwed onto the clip's post, it curls over the cell to
// `hook_end_angle` above the axis on the wall side and presses it into the
// cradle. Its wall, ear thickness, screws (inboard of the screw column, clear
// of the arch) and their spacing, their pilots' depth, and its squeeze
hook_t = 3;
hook_ear_t = 5;
hook_screw_x = -3;
hook_screw_dy = 12;
hook_pilot_depth = 12;
hook_end_angle = 45;
hook_squeeze = 0.3;

// Boards, [along X, along Y, thickness]: the LiFePO4 charge board (from the
// Kingboss bank, not measured) and the radio's carrier, a 50 x 70 perfboard
charge_dims = [39, 44, 9];
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
cell_axis_z = plate_t + clip_floor + seat_r;
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
function hole_span(pocket) = ceil((pocket + 2 * rim_w + m3_cb_d + 1) / pitch) * pitch;

module m3_counterbored(h) {
  translate([0, 0, -eps]) cylinder(d = m3_clear_d, h = h + 2 * eps);
  translate([0, 0, h - m3_cb_depth]) cylinder(d = m3_cb_d, h = m3_cb_depth + eps);
}

// ---- baseplate

module baseplate() {
  difference() {
    hull() {
      linear_extrude(eps) rounded_rect([plate_l - 2 * plate_chamfer, plate_w - 2 * plate_chamfer], plate_r - plate_chamfer);
      translate([0, 0, plate_chamfer]) linear_extrude(plate_t - plate_chamfer) rounded_rect([plate_l, plate_w], plate_r);
    }
    for (i = [0 : grid_nx - 1], j = [0 : grid_ny - 1])
      translate([grid_pt(i, j)[0], grid_pt(i, j)[1], -eps]) cylinder(d = m3_pilot_d, h = plate_t + 2 * eps);
  }
}

// ---- cell clip and hook (origin at the first screw hole; the cell's axis
// runs along Y one `pitch` outboard, at +X)

module clip() {
  za = clip_floor + seat_r;
  translate([0, clip_hole_dy / 2, 0]) difference() {
    union() {
      translate([clip_post_x, -clip_len / 2, 0]) cube([pitch + clip_reach - clip_post_x, clip_len, za]);
      translate([0, 0, base_t / 2]) linear_extrude(base_t, center = true) rounded_rect([2 * ear, clip_hole_dy + 2 * ear], ear - 0.5);
    }
    translate([pitch, -clip_len, za]) rotate([-90, 0, 0]) cylinder(r = seat_r, h = 2 * clip_len, $fn = 96);
    for (s = [-1, 1]) {
      translate([0, s * clip_hole_dy / 2, 0]) m3_counterbored(base_t);
      translate([hook_screw_x, s * hook_screw_dy / 2, za - hook_pilot_depth]) cylinder(d = m3_pilot_d, h = hook_pilot_depth + eps);
    }
  }
}

// The hook's profile in (x, z), z from the plate's top
module hook_2d() {
  za = clip_floor + seat_r;
  a = hook_end_angle;
  difference() {
    union() {
      intersection() {
        translate([pitch, za]) circle(r = seat_r + hook_t, $fn = 96);
        translate([pitch, za]) polygon([[0, 0], [50 * cos(a), 50 * sin(a)], [-50, 50], [-50, 0]]);
      }
      translate([clip_post_x, za]) square([pitch - clip_post_x, hook_ear_t]);
    }
    translate([pitch, za - hook_drop]) circle(r = seat_r, $fn = 96);
  }
}

module hook() {
  translate([0, clip_hole_dy / 2, 0]) difference() {
    rotate([90, 0, 0]) linear_extrude(clip_len, center = true) hook_2d();
    for (s = [-1, 1]) translate([hook_screw_x, s * hook_screw_dy / 2, clip_floor + seat_r - eps]) cylinder(d = m3_clear_d, h = hook_ear_t + 2 * eps);
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
    for (sx = [-1, 1], sy = [-1, 1]) translate([sx * span / 2, sy * pitch / 2, 0]) m3_counterbored(base_t);
    for (x = tie_xs) {
      for (s = [-1, 1]) translate([x, s * tie_y, base_t / 2]) cube([tie_slot[0], tie_slot[1], base_t + 1], center = true);
      translate([x, 0, 0]) cube([tie_slot[0], 2 * tie_y + tie_slot[1], 2 * tie_groove_depth], center = true);
    }
  }
}

module charge_tray() board_tray(charge_dims, [1, 0]);
module carrier_tray() board_tray(carrier_dims, [0, -1]);

// ---- the repeater's layout, by grid index

// The cell runs along Y against the right end wall
clip_at = [[8, 0], [8, 4]];
charge_at = [0, 4];
carrier_at = [0, 1];

cell_axis = [
  grid_pt(clip_at[0][0], 0)[0] + pitch,
  (grid_pt(0, clip_at[0][1])[1] + grid_pt(0, clip_at[1][1])[1] + clip_hole_dy) / 2,
  cell_axis_z
];

module clips_placed() for (p = clip_at) at(p[0], p[1]) clip();
module hooks_placed() for (p = clip_at) at(p[0], p[1]) hook();
module charge_tray_placed() at(charge_at[0], charge_at[1]) charge_tray();
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

module charge_ref() translate(tray_centre(charge_at, charge_dims) + [0, 0, charge_dims[2] / 2]) cube(charge_dims, center = true);

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

module clip_print() clip();
// On its side: the arch would otherwise print in mid-air
module hook_print() translate([0, 0, clip_len / 2]) rotate([90, 0, 0]) translate([0, -clip_hole_dy / 2, 0]) hook();
module charge_tray_print() charge_tray();
module carrier_tray_print() carrier_tray();
