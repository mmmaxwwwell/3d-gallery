// Meshtastic dry-bag node: a sealed box, antenna up, its back plate a T
// with the inside corners filled by slopes up the antenna's stem. The
// LiFePO4 cell lies across the bottom of the box. The boards lie flat in
// pockets on a shelf over it, perpendicular to the antenna: the LiFePO4
// protection board on the left; the XIAO kit and the power-bank board on the
// right. The N bulkhead clamps through the box's roof on its panel nut, and
// the antenna stands up from it. One cover closes the whole front onto a
// TPU bead printed in place in a groove round the frame's rim. Ten M3 cap
// screws run down the middle of the seal, each through a TPU disc. The
// solar cable comes in through a PG7 gland in the right end wall.
//
// Use frame: X along the cell, Z up as it hangs, Y out of the front face.
// z = 0 is the box's bottom, y = 0 its back. The frame and its TPU print
// back face down (frame_print(), frame_gasket_print()); the cover prints
// front face down (cover_print()).

// BEGIN_PARAMS
// 32140 LiFePO4 cell
cell_d = 32;
cell_len = 140;
// Gap round the cell in its seat
cell_clear = 0.4;
// Room past each end of the cell for its welded tab and lead
end_clear = 3;
// Back plate thickness
plate_t = 3;
// Box walls, bottom and roof: thick enough for the seal and its screws, and for knocks
wall = 9;
// Cover thickness
cover_t = 6;
// Outside corner radius of the box, seen from the front
box_corner_r = 8;
// Seal groove round the rim, centred in the wall
groove_w = 3;
groove_depth = 2.5;
// TPU bead standing in the groove: its width, and how far it stands proud for the cover to squeeze
bead_w = 1.6;
bead_proud = 0.5;
// Round each screw the groove widens to a pocket and the bead to a disc the screw threads through
screw_pocket_d = 6.6;
screw_disc_d = 5.6;
// M3 cap screws: length under the head, clearance, pilot, head
screw_len = 12;
m3_clear_d = 3.4;
m3_pilot_d = 2.5;
m3_head_d = 6.2;
cover_counterbore = 3.5;
// Screws along the top and bottom runs, at these x; one more mid-height in each end
screw_xs = [-60, -20, 20, 60];
// Cell leads up through the shelf to the protection board, outboard of it
lead_d = 6;
// N female bulkhead: 5/8-24 UNEF thread, 3/4" hex panel nut
n_thread_d = 15.9;
n_hole_clear = 0.5;
n_nut_af = 19.05;
// Its body and O-ring, inside: the roof is relieved round it
n_body_d = 24;
// Roof left under the bulkhead, so the panel nut leaves the antenna enough thread (user confirmed 4 mm)
bulkhead_wall_t = 4;
// Bay between the shelf and the roof, for the boards and for the jack's body and the coax's bend (not measured)
rear_gap = 28;
// Antenna radome
antenna_d = 22;
antenna_len = 180;
// Its N male coupling nut
antenna_nut_d = 21.5;
antenna_nut_len = 20;
// How far the frame's stem runs up the antenna from the roof
stem_len = 70;
// PG7 cable gland for the solar cable: thread, panel it wants, and its locknut's corners
gland_thread_d = 12.5;
gland_panel_t = 4;
gland_nut_d = 18;
// Power-bank charge board, measured off a photo against the cell: along
// the cell (its USB ports face the right end), out from the plate, and its
// tallest part above the shelf (not measured)
board_w = 39;
board_d = 44;
board_t = 9;
// XIAO nRF52840 + Wio-SX1262 stack, the same way round
kit_w = 22;
kit_d = 24;
kit_t = 12;
// 1S LiFePO4 protection board (KOOBOOK 24 A; typical size, not measured), lying along the cell
bms_w = 50;
bms_d = 25;
bms_t = 4;
// Space either side of the middle, where the jack's body comes down
mid_gap = 11;
// Shelf over the cell that the boards lie on
shelf_t = 3;
// Pocket round each board: clearance, and the rim's width and height
pocket_clear = 0.5;
rim_w = 2;
rim_h = 3;
// Ribs on the cover that hold the cell in its seat, at these x
cell_rib_xs = [-45, 0, 45];
cell_rib_w = 4;
// Saddle and zip tie at the top of the stem, round the antenna
saddle_w = 6;
tie_w = 4.5;
tie_t = 2;
corner_r = 4;
// END_PARAMS

cell_r = cell_d / 2 + cell_clear;
cell_y = plate_t + cell_r;
cell_z = wall + cell_r;
shelf_z = cell_z + cell_r;
shelf_top = shelf_z + shelf_t;
roof_z = shelf_top + rear_gap;
box_h = roof_z + wall;

// Pocket interiors, x0 < x1.
bms_x1 = -mid_gap;
bms_x0 = bms_x1 - bms_w - 2 * pocket_clear;
kit_x0 = mid_gap;
kit_x1 = kit_x0 + kit_w + 2 * pocket_clear;
board_x0 = kit_x1 + rim_w;
board_x1 = board_x0 + board_w + 2 * pocket_clear;
pocket_front = plate_t + max(kit_d, bms_d, board_d) + 2 * pocket_clear + rim_w;
front_y = pocket_front + 0.5;
lead_x = bms_x0 - rim_w - 1 - lead_d / 2;

inner_half = max(board_x1 + rim_w, -lead_x + lead_d / 2 + 1, cell_len / 2 + end_clear);
bar_half = inner_half + wall;

seal_inset = wall / 2;
screw_points = concat(
  [for (x = screw_xs) [x, seal_inset]],
  [for (x = screw_xs) [x, box_h - seal_inset]],
  [[-bar_half + seal_inset, box_h / 2], [bar_half - seal_inset, box_h / 2]]);
pilot_depth = groove_depth + (screw_len - (cover_t - cover_counterbore) - groove_depth) + 1;

n_hole_d = n_thread_d + n_hole_clear;
nut_r = n_nut_af / sqrt(3);
antenna_y = plate_t + n_body_d / 2 + 1;

gland_z = roof_z - gland_nut_d / 2 - 1;
gland_y = (plate_t + front_y) / 2;

stem_half = antenna_d / 2 + 2 + tie_t + 3;
stem_top = box_h + stem_len;
antenna_saddle_z = stem_top - 3 - saddle_w / 2;
antenna_tie_z = antenna_saddle_z - saddle_w / 2 - tie_w / 2 - 2;

assert(shelf_top + max(board_t, kit_t, bms_t) < roof_z - 2, "boards reach the roof");
// The locknut sits in the end wall's relief, outboard of the boards, so it only has to clear the shelf and roof.
assert(gland_z + gland_nut_d / 2 < roof_z && gland_z - gland_nut_d / 2 > shelf_top, "gland's relief runs into the shelf or the roof");
assert(screw_pocket_d < wall - 2, "screw pockets leave too little wall either side");
assert(screw_disc_d < screw_pocket_d && bead_w < groove_w, "TPU needs room in its groove to squeeze into");
assert(antenna_y + n_body_d / 2 * sqrt(2) < front_y - 1, "bulkhead relief's peak breaks out of the front");
assert(gland_y + gland_nut_d / 2 * sqrt(2) < front_y && gland_y - gland_nut_d / 2 > plate_t, "gland's relief breaks out of the end wall");
assert(-bms_x0 + rim_w < inner_half, "protection board runs into the left end wall");
assert(pilot_depth < front_y - plate_t, "screw pilots run out of the back");
assert(cover_t - cover_counterbore >= 2, "cover too thin under the screw heads");
assert(antenna_y - antenna_d / 2 > plate_t, "antenna radome hits the back plate");

// Round hole along Z, peaked at 45° toward +Y: up as the frame prints.
module tear_2d(d) {
  hull() {
    circle(d = d);
    translate([0, d / 2 * sqrt(2)]) square(0.01, center = true);
  }
}

// A 2D shape in the XZ plane (its y is z), extruded through y0..y1.
module xz_extrude(y0, y1) {
  translate([0, y1, 0]) rotate([90, 0, 0]) linear_extrude(y1 - y0) children();
}

module box_outline() {
  offset(box_corner_r) offset(-box_corner_r) translate([-bar_half, 0]) square([2 * bar_half, box_h]);
}

module seal_centre() {
  r = box_corner_r - seal_inset;
  offset(r) offset(-r) translate([-bar_half + seal_inset, seal_inset]) square([2 * (bar_half - seal_inset), box_h - 2 * seal_inset]);
}

module seal_band(w, disc_d) {
  difference() {
    offset(w / 2) seal_centre();
    offset(-w / 2) seal_centre();
  }
  for (p = screw_points) translate(p) circle(d = disc_d);
}

module screw_holes_2d(d) {
  for (p = screw_points) translate(p) circle(d = d);
}

// The back plate: the box's outline, then straight slopes from its top
// corners in to the stem's top, so the stem is braced along its whole length.
module plate() {
  xz_extrude(0, plate_t)
    offset(corner_r) offset(-corner_r)
      polygon([[-bar_half, 0], [bar_half, 0], [bar_half, box_h],
               [stem_half, stem_top], [-stem_half, stem_top], [-bar_half, box_h]]);
}

module walls() {
  xz_extrude(plate_t - 0.01, front_y)
    difference() {
      box_outline();
      translate([-inner_half, wall]) square([2 * inner_half, roof_z - wall]);
    }
}

module cell_seat() {
  difference() {
    translate([-cell_len / 2, plate_t - 0.01, wall - 0.01]) cube([cell_len, cell_y - plate_t, shelf_z - wall + 0.02]);
    translate([0, cell_y, cell_z]) rotate([0, 90, 0]) cylinder(r = cell_r, h = cell_len + 2, center = true, $fn = 96);
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
  translate([-inner_half - 0.01, plate_t - 0.01, shelf_z]) cube([2 * inner_half + 0.02, pocket_front - plate_t, shelf_t]);
  pocket_rims(bms_x0, bms_x1, bms_d);
  pocket_rims(kit_x0, kit_x1, kit_d);
  pocket_rims(board_x0, board_x1, board_d);
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
      plate();
      walls();
      cell_seat();
      shelf();
      antenna_saddle();
    }
    // Seal groove and the screws' pilots.
    xz_extrude(front_y - groove_depth, front_y + 1) seal_band(groove_w, screw_pocket_d);
    xz_extrude(front_y - pilot_depth, front_y + 1) screw_holes_2d(m3_pilot_d);
    // Bulkhead through the roof, relieved from inside down to bulkhead_wall_t.
    translate([0, antenna_y, roof_z - 1]) linear_extrude(wall + 2) tear_2d(n_hole_d);
    translate([0, antenna_y, roof_z - 1]) linear_extrude(wall - bulkhead_wall_t + 1) tear_2d(n_body_d);
    // Gland through the right end wall, relieved from inside down to gland_panel_t.
    translate([bar_half - wall - 1, gland_y, gland_z]) rotate([0, 90, 0])
      linear_extrude(wall + 2) tear_2d(gland_thread_d + 0.3);
    translate([bar_half - wall - 1, gland_y, gland_z]) rotate([0, 90, 0])
      linear_extrude(wall - gland_panel_t + 1) tear_2d(gland_nut_d);
    // Cell leads up through the shelf.
    translate([lead_x, plate_t + lead_d / 2 + 1, shelf_z - 1]) linear_extrude(shelf_t + 2) tear_2d(lead_d);
    for (side = [-1, 1])
      translate([side * (antenna_d / 2 + 1 + tie_t / 2) - tie_t / 2, -1, antenna_tie_z - tie_w / 2])
        cube([tie_t, plate_t + 2, tie_w]);
  }
}

// TPU, printed in place in the frame's groove.
module frame_gasket() {
  xz_extrude(front_y - groove_depth, front_y + bead_proud)
    difference() {
      seal_band(bead_w, screw_disc_d);
      screw_holes_2d(m3_pilot_d);
    }
}

module cover() {
  difference() {
    union() {
      xz_extrude(front_y, front_y + cover_t) box_outline();
      for (x = cell_rib_xs)
        translate([x - cell_rib_w / 2, cell_y + cell_r + 0.5, cell_z - cell_r / 2]) cube([cell_rib_w, front_y - cell_y - cell_r - 0.5 + 0.01, cell_r]);
    }
    xz_extrude(front_y - 1, front_y + cover_t + 1) screw_holes_2d(m3_clear_d);
    xz_extrude(front_y + cover_t - cover_counterbore, front_y + cover_t + 1) screw_holes_2d(m3_head_d);
  }
}

module frame_print() {
  rotate([90, 0, 0]) frame();
}

module frame_gasket_print() {
  rotate([90, 0, 0]) frame_gasket();
}

module cover_print() {
  translate([0, 0, front_y + cover_t]) rotate([-90, 0, 0]) cover();
}

// Reference hardware, not printed.
module cell() {
  translate([0, cell_y, cell_z]) rotate([0, 90, 0]) cylinder(d = cell_d, h = cell_len, center = true, $fn = 64);
}

module antenna() {
  translate([0, antenna_y, box_h]) {
    cylinder(r = nut_r, h = 4, $fn = 6);
    translate([0, 0, 4]) cylinder(d = antenna_nut_d, h = antenna_nut_len, $fn = 48);
    translate([0, 0, 4 + antenna_nut_len]) cylinder(d = antenna_d, h = antenna_len, $fn = 48);
  }
  translate([0, antenna_y, roof_z - 15]) cylinder(r = nut_r, h = 15 + wall - bulkhead_wall_t, $fn = 6);
}

module boards() {
  translate([bms_x0 + pocket_clear, plate_t + pocket_clear, shelf_top]) cube([bms_w, bms_d, bms_t]);
  translate([kit_x0 + pocket_clear, plate_t + pocket_clear, shelf_top]) cube([kit_w, kit_d, kit_t]);
  translate([board_x0 + pocket_clear, plate_t + pocket_clear, shelf_top]) cube([board_w, board_d, 1.6]);
}

module gland() {
  translate([bar_half, gland_y, gland_z]) rotate([0, 90, 0]) {
    cylinder(d = 15 / cos(30), h = 8, $fn = 6);
    translate([0, 0, 8]) cylinder(d = 13, h = 10, $fn = 32);
  }
}
