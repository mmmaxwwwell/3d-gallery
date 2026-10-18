// Meshtastic dry-bag node: a sealed box, antenna up, its back plate a T
// with the inside corners filled by slopes up a short stem. The body is TPU
// 64D, the door (cover) is PCTG. The LiFePO4 cell lies across the bottom of
// the box. The boards lie flat in pockets on a shelf over it, perpendicular
// to the antenna: the LiFePO4 protection board on the left; the XIAO kit and
// the power-bank board on the right. The N bulkhead clamps through the roof
// on its panel nut, and the antenna stands up from it, zip-tied to the stem.
// The door seals with a tongue round its back that's wider than the groove
// round the body's rim, so the TPU grips it from the sides. Ten M5 x 10
// screws, outside the seal in ears, thread straight into the TPU and only
// hold the door on. The solar cable comes in through the user's 5/8"
// watertight connector in the right end wall.
//
// Use frame: X along the cell, Z up as it hangs, Y out of the front face.
// z = 0 is the box's bottom, y = 0 its back. The body prints back face down
// (frame_print()); the door prints front face down (cover_print()).

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
// Body walls, bottom and roof, TPU 64D
wall = 6;
// Door (cover) thickness, PCTG
cover_t = 4;
// Outside corner radius of the box, seen from the front
box_corner_r = 8;
// Groove round the body's rim, centred in the wall, and the door's tongue
// that goes in it: wider than the groove, so the TPU either side grips it
groove_w = 1.6;
groove_depth = 4;
tongue_w = 2.2;
tongue_len = 3.5;
// The tongue's tip narrows over this much, to lead it in
tongue_lead = 0.8;
// M5 x 10 screws straight into the TPU: length under the head, clearance in the door, pilot in the body
screw_len = 10;
m5_clear_d = 5.5;
m5_pilot_d = 4.2;
// Each screw is in an ear outside the wall: how far out its centre is, and the ear's radius
ear_out = 3;
ear_r = 5.5;
// Screws along the top and bottom, at these x; one more mid-height in each end
screw_xs = [-70, -30, 30, 70];
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
// How far the stem runs up the antenna from the roof
stem_len = 26;
// Rounded rib along the foot of the stem and slopes, where they meet the roof
rib_r = 8;
// The user's 5/8" watertight connector for the solar panel, through the right end wall
solar_hole_d = 15.875 + 0.4;
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
// Saddle on the stem round the antenna, and the zip-tie slots either side of it, below and above
saddle_w = 6;
tie_w = 6;
tie_t = 2.5;
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
  [for (x = screw_xs) [x, -ear_out]],
  [for (x = screw_xs) [x, box_h + ear_out]],
  [[-bar_half - ear_out, box_h / 2], [bar_half + ear_out, box_h / 2]]);
pilot_depth = screw_len - cover_t + 1;

n_hole_d = n_thread_d + n_hole_clear;
nut_r = n_nut_af / sqrt(3);
antenna_y = plate_t + n_body_d / 2 + 1;

solar_z = (shelf_top + board_t + roof_z) / 2;
solar_y = (plate_t + front_y) / 2;

stem_half = antenna_d / 2 + 0.5 + tie_t + 3;
stem_top = box_h + stem_len;
antenna_saddle_z = box_h + stem_len / 2;
tie_zs = [box_h + tie_w / 2 + 1, stem_top - tie_w / 2 - 2];
rib_notch = nut_r + 3;

assert(shelf_top + max(board_t, kit_t, bms_t) < roof_z - 2, "boards reach the roof");
// The locknut sits in the end wall's relief, outboard of the boards, so it only has to clear the shelf and roof.
assert(solar_z + solar_hole_d / 2 < roof_z && solar_z - solar_hole_d / 2 > shelf_top, "solar connector's hole runs into the shelf or the roof");
assert(solar_y + solar_hole_d / 2 < front_y - groove_depth && solar_y - solar_hole_d / 2 > plate_t, "solar connector's hole breaks into the groove or the back");
assert(tongue_w > groove_w && tongue_len < groove_depth, "the tongue must be wider than the groove and stop short of its floor");
assert((wall - groove_w) / 2 >= 2, "too little TPU either side of the groove");
assert(ear_out - m5_pilot_d / 2 + seal_inset - groove_w / 2 >= 2.5, "screw pilots too close to the groove");
assert(pilot_depth < front_y - plate_t, "screw pilots run out of the back");
assert(-bms_x0 + rim_w < inner_half, "protection board runs into the left end wall");
assert(antenna_y + n_body_d / 2 * sqrt(2) < front_y - 1, "bulkhead relief's peak breaks out of the front");
assert(stem_top - antenna_saddle_z > saddle_w / 2 + tie_w + 2, "stem too short for its saddle and ties");
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

module seal_band(w) {
  difference() {
    offset(w / 2) seal_centre();
    offset(-w / 2) seal_centre();
  }
}

module screw_holes_2d(d) {
  for (p = screw_points) translate(p) circle(d = d);
}

module ears_2d() {
  for (p = screw_points) translate(p) circle(r = ear_r);
}

// The back plate: the box's outline, then straight slopes from its top
// corners in to the stem's top, so the stem is braced along its whole length.
module plate() {
  xz_extrude(0, plate_t) {
    offset(corner_r) offset(-corner_r)
      polygon([[-bar_half, 0], [bar_half, 0], [bar_half, box_h],
               [stem_half, stem_top], [-stem_half, stem_top], [-bar_half, box_h]]);
    ears_2d();
  }
}

module ears() {
  xz_extrude(plate_t - 0.01, front_y) ears_2d();
}

// Quarter-round fillet in the corner between the plate and the roof's top,
// across the box, notched round the bulkhead's nut and the antenna.
module stem_rib() {
  for (s = [-1, 1])
    translate([s > 0 ? rib_notch : -bar_half + box_corner_r, plate_t - 0.01, box_h - 0.01])
      difference() {
        cube([bar_half - box_corner_r - rib_notch, rib_r, rib_r]);
        translate([-1, rib_r, rib_r]) rotate([0, 90, 0]) cylinder(r = rib_r, h = bar_half + 2, $fn = 48);
      }
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
      ears();
      stem_rib();
    }
    // Seal groove, and the screws' pilots in the ears.
    xz_extrude(front_y - groove_depth, front_y + 1) seal_band(groove_w);
    xz_extrude(front_y - pilot_depth, front_y + 1) screw_holes_2d(m5_pilot_d);
    // Bulkhead through the roof, relieved from inside down to bulkhead_wall_t.
    translate([0, antenna_y, roof_z - 1]) linear_extrude(wall + 2) tear_2d(n_hole_d);
    translate([0, antenna_y, roof_z - 1]) linear_extrude(wall - bulkhead_wall_t + 1) tear_2d(n_body_d);
    // Solar connector through the right end wall: round, as the user asked.
    translate([bar_half - wall - 1, solar_y, solar_z]) rotate([0, 90, 0]) cylinder(d = solar_hole_d, h = wall + 2, $fn = 64);
    // Cell leads up through the shelf.
    translate([lead_x, plate_t + lead_d / 2 + 1, shelf_z - 1]) linear_extrude(shelf_t + 2) tear_2d(lead_d);
    for (side = [-1, 1], z = tie_zs)
      translate([side * (antenna_d / 2 + 0.5 + tie_t / 2) - tie_t / 2, -1, z - tie_w / 2])
        cube([tie_t, plate_t + 2, tie_w]);
  }
}

// The tongue's tip starts narrower than the groove and widens to full width
// over tongue_lead, in steps, so it leads itself in.
module tongue() {
  steps = 4;
  tip_y = front_y - tongue_len;
  xz_extrude(tip_y + tongue_lead, front_y + 0.01) seal_band(tongue_w);
  for (i = [0 : steps - 1])
    xz_extrude(tip_y + tongue_lead * i / steps, tip_y + tongue_lead * (i + 1) / steps + 0.01)
      seal_band(groove_w - 0.2 + (tongue_w - groove_w + 0.2) * i / steps);
}

module cover() {
  difference() {
    union() {
      xz_extrude(front_y, front_y + cover_t) { box_outline(); ears_2d(); }
      tongue();
      for (x = cell_rib_xs)
        translate([x - cell_rib_w / 2, cell_y + cell_r + 0.5, cell_z - cell_r / 2]) cube([cell_rib_w, front_y - cell_y - cell_r - 0.5 + 0.01, cell_r]);
    }
    xz_extrude(front_y - 1, front_y + cover_t + 1) screw_holes_2d(m5_clear_d);
  }
}

module frame_print() {
  rotate([90, 0, 0]) frame();
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

module solar_connector() {
  translate([bar_half, solar_y, solar_z]) rotate([0, 90, 0]) {
    cylinder(d = 22, h = 3, $fn = 6);
    translate([0, 0, 3]) cylinder(d = 18, h = 14, $fn = 32);
  }
}
