// Meshtastic dry-bag node: a sealed box that winches itself up into a tree.
// A line thrown over branches has both ends tied to two reels, one behind
// each end of the box, as far out to the sides as they'll go. Each drum's
// axis runs front to back, square to the line's pull, so the line comes
// straight up off the drum. Each reel has its own self-locking worm motor
// standing inside the box, its shaft out through the back wall's TPU, driven
// by a second XIAO (the nRF52840 Sense, for its IMU) that levels the box as
// it climbs. A PCTG rear frame ties the reels' free ends together: an
// upright behind them carries their outer axles, a floor under the box
// screws to it, and the solar panel hangs from the upright at 45°, facing
// back and up. The battery at the bottom and the panel are the ballast.
//
// The body is TPU 64D; the door, reels, straps and rear frame are PCTG. The door
// seals with a tongue round its back that's wider than the groove round
// the body's rim, so the TPU grips it from the sides, and M5 x 10 screws in
// ears outside the seal thread straight into the TPU. Every M5 x 10 gets
// thread_len of thread: whatever it passes through is counterbored down to
// the rest under its head. The boards stand
// flat on the back wall in pockets and go straight in from the front. The
// N bulkhead clamps through the roof, and the antenna stands up from it,
// zip-tied to a short stem whose back plate slopes down to the roof.
//
// Use frame: X along the cell, Z up as it hangs, Y out of the front face.
// z = 0 is the box's bottom, y = 0 its back. Each part's *_print() module
// puts it in its print orientation.

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
// Body walls and bottom, TPU 64D
wall = 6;
// Roof: thicker, for the bulkhead's relief
roof_t = 10;
// Door thickness, PCTG
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
// M5 x 10 screws: length under the head, how much of it threads in (the
// user's 8 mm), clearance, pilot, and the cap head's counterbore
screw_len = 10;
thread_len = 8;
m5_clear_d = 5.5;
m5_pilot_d = 4.2;
m5_head_d = 9.2;
// Each door screw is in an ear outside the wall: how far out its centre is,
// the boss's radius, and how wide the ear blends into the wall
ear_out = 3.5;
ear_r = 6.5;
ear_base = 26;
// How deep the ears run back from the front; below that they taper into the wall at 45°
ear_len = 12;
// Door screws: a pair either side of every corner, one mid-height in each
// end, and these along the top and the bottom
screw_xs_top = [-40, 40];
screw_xs_bottom = [-30, 30];
// N female bulkhead: 5/8-24 UNEF thread, 3/4" hex panel nut
n_thread_d = 15.9;
n_hole_clear = 0.5;
n_nut_af = 19.05;
// Its body and O-ring, inside: the roof is relieved round it, and it hangs this far below the roof
n_body_d = 24;
n_body_len = 15;
// Roof left under the bulkhead, so the panel nut leaves the antenna enough thread (user confirmed 4 mm)
bulkhead_wall_t = 4;
// Antenna radome
antenna_d = 22;
antenna_len = 180;
// Its N male coupling nut
antenna_nut_d = 21.5;
antenna_nut_len = 20;
// How far the stem runs up the antenna from the roof
stem_len = 26;
// The back plate's slopes run from the stem's top down to the roof here, inboard of the reels
slope_foot_x = 52;
// Rounded rib along the foot of the stem and slopes, where they meet the roof
rib_r = 8;
// The user's 5/8" watertight connector for the solar panel, through the door in front of the charge board
solar_hole_d = 15.875 + 0.4;
// Boards stand flat on the back wall, each in a pocket, in two rows across
// the middle: width along the cell, height, and how far it stands off the
// wall (none measured; the charge board is scaled off a photo)
// Power-bank charge board; its USB ports face +X, into open space
board_w = 39;
board_h = 44;
board_t = 9;
// XIAO nRF52840 + Wio-SX1262 stack (the Meshtastic radio)
kit_w = 22;
kit_h = 24;
kit_t = 12;
// 1S LiFePO4 protection board (KOOBOOK 24 A; typical size)
bms_w = 50;
bms_h = 25;
bms_t = 4;
// Winch controller: XIAO nRF52840 Sense, for its built-in IMU
mcu_w = 18;
mcu_h = 21;
mcu_t = 6;
// DRV8833 dual motor driver module
drv_w = 19;
drv_h = 17;
drv_t = 5;
// Space above the cell before the boards start
board_gap = 4;
// Pocket round each board: clearance, and the rim's width and height
pocket_clear = 0.5;
rim_w = 2;
rim_h = 3;
// Winch motors: JGY-370 worm gearmotor, standing inside each end with its
// output shaft out through the back wall (not measured): width along X,
// depth from its mounting face, height, and the shaft's distance below its
// top: it stands gearbox-up, so the reels sit high (the user's call)
mot_t = 32;
mot_d = 26;
mot_h = 75;
mot_shaft_down = 16;
// Its D-shaft: diameter, across the flat, length past the mounting face
shaft_d = 6;
shaft_flat = 5;
shaft_len = 14;
// Boss round each shaft hole, inside the back wall: lengthens the hub's seal
boss_d = 22;
boss_t = 8;
// Reels for 150-200 ft of 1/8" Dacron: flange diameter, core, length between flanges, flange thickness
spool_od = 120;
spool_core_d = 30;
spool_len = 62;
spool_flange_t = 4;
// Gap between the back wall and the reel's inner flange
spool_gap = 2;
// Gap between the two reels, across the middle
spool_mid_gap = 12;
// The reel's hub goes through the back wall onto the motor's shaft; the TPU hole is this much tighter, as a lip seal
hub_d = 12;
hub_seal = 0.4;
// M5 bolt as the reel's outer axle: it threads into the rear frame's
// upright and the reel turns on its shank
axle_d = 5.4;
// Rear frame (PCTG): the upright behind the reels (thick enough for the
// axles' 8 mm of thread, and flat behind so it prints on its back), its gap
// to them, the floor under the box, and the gussets between floor and upright
rear_t = 9;
rear_gap = 1;
floor_t = 6;
gusset_h = 45;
// Upright's margin round the axles
rear_margin = 14;
// Floor's screws into the box's bottom, at these x
floor_screw_xs = [-50, 50];
// Solar panel (5 V 3 W, not measured), hung from the upright at panel_tilt,
// facing back and up; the frame's border round it and its lip
panel_w = 145;
panel_h = 120;
panel_t = 3;
panel_tilt = 45;
// Clearance between the panel's frame and the box's bottom ears
panel_drop = 8;
frame_border = 6;
frame_lip = 4;
// Battery straps: two PCTG caps over the cell's front, each screwed into the
// solid strips above and below the cell at both ends. Their x, width, the
// cap's thickness over the cell, the tabs' thickness, and the strips' height
strap_xs = [-45, 45];
strap_w = 14;
strap_t = 3;
strap_tab_t = 4;
strap_lug_h = 10;
// Saddle on the stem round the antenna, and the zip-tie slots either side of it, below and above
saddle_w = 6;
tie_w = 6;
tie_t = 2.5;
corner_r = 4;
// END_PARAMS

function pw(w) = w + 2 * pocket_clear;

cell_r = cell_d / 2 + cell_clear;
cell_y = plate_t + cell_r;
cell_z = wall + strap_lug_h + cell_r;
cell_top = cell_z + cell_r;
seat_top = cell_top + strap_lug_h;
strap_screw_zs = [cell_z - cell_r - strap_lug_h / 2, cell_top + strap_lug_h / 2];

// Reels behind each end, far enough out that the two clear each other; the
// motors stand inside the box in line with them.
spool_x = spool_od / 2 + spool_mid_gap / 2;
inner_half = max(spool_x + mot_t / 2, cell_len / 2 + end_clear);
bar_half = inner_half + wall;
mot_x0 = spool_x - mot_t / 2;
front_y = max(cell_y + cell_r + strap_t + 1, plate_t + boss_t + mot_d + 1);

// Board pockets, interiors [x0, z0, x1, z1], in two rows between the motors.
bay_x = mot_x0 - 2;
bay_z = seat_top + board_gap;
row2_z = bay_z + pw(max(board_h, kit_h)) + rim_w;
kit_pocket = [-bay_x, bay_z, -bay_x + pw(kit_w), bay_z + pw(kit_h)];
board_pocket = [kit_pocket[2] + rim_w, bay_z, kit_pocket[2] + rim_w + pw(board_w), bay_z + pw(board_h)];
bms_pocket = [-bay_x, row2_z, -bay_x + pw(bms_w), row2_z + pw(bms_h)];
drv_pocket = [bms_pocket[2] + rim_w, row2_z, bms_pocket[2] + rim_w + pw(drv_w), row2_z + pw(drv_h)];
mcu_pocket = [drv_pocket[2] + rim_w, row2_z, drv_pocket[2] + rim_w + pw(mcu_w), row2_z + pw(mcu_h)];
pockets = [kit_pocket, board_pocket, bms_pocket, drv_pocket, mcu_pocket];
boards_top = max([for (p = pockets) p[3]]) + rim_w;

mot_z0 = bay_z;
shaft_z = mot_z0 + mot_h - mot_shaft_down;
roof_z = max(boards_top + n_body_len + 2, mot_z0 + mot_h + 2);
box_h = roof_z + roof_t;

drum_y0 = -spool_gap;
drum_y1 = drum_y0 - 2 * spool_flange_t - spool_len;
drum_top = shaft_z + spool_od / 2;
rear_y1 = drum_y1 - rear_gap;
rear_y0 = rear_y1 - rear_t;
rear_half = spool_x + rear_margin;
rear_top = shaft_z + rear_margin;

seal_inset = wall / 2;
// Door screws as [centre, outward normal], in groups that share one ear: a
// pair either side of each corner, where its curve starts, then the singles.
corner_x = bar_half - box_corner_r;
ear_groups = concat(
  [for (sx = [-1, 1], top = [false, true])
    [[[sx * corner_x, top ? box_h + ear_out : -ear_out], [0, top ? 1 : -1]],
     [[sx * (bar_half + ear_out), top ? box_h - box_corner_r : box_corner_r], [sx, 0]]]],
  [for (sx = [-1, 1]) [[[sx * (bar_half + ear_out), box_h / 2], [sx, 0]]]],
  [for (x = screw_xs_top) [[[x, box_h + ear_out], [0, 1]]]],
  [for (x = screw_xs_bottom) [[[x, -ear_out], [0, -1]]]]);
screws = [for (g = ear_groups) each g];
screw_points = [for (e = screws) e[0]];
// Every M5 x 10 threads thread_len in; its pilot runs 1 mm deeper.
pilot_depth = thread_len + 1;
under_head = screw_len - thread_len;
ear_back_y = front_y - ear_len - (ear_out + ear_r);

n_hole_d = n_thread_d + n_hole_clear;
nut_r = n_nut_af / sqrt(3);
antenna_y = plate_t + n_body_d / 2 + 1;

solar_x = (board_pocket[0] + board_pocket[2]) / 2;
solar_z = (board_pocket[1] + board_pocket[3]) / 2;

stem_half = antenna_d / 2 + 0.5 + tie_t + 3;
stem_top = box_h + stem_len;
antenna_saddle_z = box_h + stem_len / 2;
tie_zs = [box_h + tie_w / 2 + 1, stem_top - tie_w / 2 - 2];
rib_notch = nut_r + 3;

// Panel centre: its frame's top edge, at the back, meets the upright's front
// face, low enough to clear the box's bottom ears.
panel_half = panel_h / 2 + frame_border;
panel_zc = -(ear_out + ear_r) - panel_drop - panel_half * sin(panel_tilt) - floor_t;
panel_y = rear_y1 + panel_half * cos(panel_tilt);
panel_c = [0, panel_y, panel_zc];
floor_y1 = ear_back_y - 1;
floor_screw_y = (plate_t + floor_y1) / 2;

assert(roof_z - n_body_len > boards_top, "the bulkhead's body hangs into the boards");
assert(board_pocket[2] + rim_w < mot_x0 - 1 && mcu_pocket[2] + rim_w < mot_x0 - 1, "boards run into the right motor");
assert(board_pocket[2] + 20 < mot_x0, "no room for a plug in the charge board's ports");
assert(tongue_w > groove_w && tongue_len < groove_depth, "the tongue must be wider than the groove and stop short of its floor");
assert((wall - groove_w) / 2 >= 2, "too little TPU either side of the groove");
assert(ear_out - m5_pilot_d / 2 + seal_inset - groove_w / 2 >= 2.5, "screw pilots too close to the groove");
assert(pilot_depth < front_y - plate_t, "door screw pilots run out of the back");
assert(plate_t + boss_t + mot_d < front_y, "motor doesn't fit the box's depth");
assert(shaft_z - spool_od / 2 > gusset_h, "reels run into the rear frame's gussets");
assert(spool_x - spool_od / 2 > 0, "reels overlap across the middle");
assert(cover_t > under_head && strap_tab_t > under_head && floor_t > under_head, "a part is thinner than the screws' under-head length");
assert(floor_screw_y + m5_pilot_d / 2 < cell_y, "floor pilots are out from under the cell's seat");
assert(rear_t > thread_len, "upright too thin for the axles' threads");
assert(antenna_y - antenna_d / 2 > plate_t, "antenna radome hits the back plate");
assert(antenna_y + n_body_d / 2 < front_y - groove_depth - 1, "bulkhead relief breaks into the groove");

// Round hole along Z, peaked at 45° toward +Y (up as the body prints),
// cut flat at y_max if given.
module tear_2d(d, y_max = 1e9) {
  intersection() {
    hull() {
      circle(d = d);
      translate([0, d / 2 * sqrt(2)]) square(0.01, center = true);
    }
    translate([-d, -d]) square([2 * d, min(y_max, d) + d]);
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

// Where an ear meets the wall: a strip along its outer face.
module ear_base_2d(e) {
  translate(e[0] - e[1] * ear_out) rotate(atan2(e[1][1], e[1][0])) translate([-1, -ear_base / 2]) square([1, ear_base]);
}

// The screw's boss hulled into a wide base on the wall, so it blends in.
module ear_2d(e) {
  hull() {
    translate(e[0]) circle(r = ear_r);
    ear_base_2d(e);
  }
}

module ears_2d() {
  for (g = ear_groups) hull() for (e = g) ear_2d(e);
}

// The back plate: the box's outline, then straight slopes from the roof,
// inboard of the arms, up to the stem's top.
module plate() {
  xz_extrude(0, plate_t)
    offset(corner_r) offset(-corner_r) union() {
      translate([-bar_half, 0]) square([2 * bar_half, box_h]);
      polygon([[-slope_foot_x, box_h - 1], [slope_foot_x, box_h - 1], [stem_half, stem_top], [-stem_half, stem_top]]);
    }
}

// Each ear runs ear_len back from the front, then tapers into the wall at
// 45° (as the body prints, its underside), so it needs no support.
module ears() {
  taper = ear_out + ear_r;
  for (g = ear_groups)
    hull() for (e = g) {
      xz_extrude(front_y - ear_len, front_y) ear_2d(e);
      xz_extrude(front_y - ear_len - taper, front_y - ear_len) ear_base_2d(e);
    }
}

// Quarter-round fillet in the corner between the plate and the roof's top,
// notched round the bulkhead's nut, out to the slopes' feet.
module stem_rib() {
  for (s = [-1, 1])
    translate([s > 0 ? rib_notch : -slope_foot_x, plate_t - 0.01, box_h - 0.01])
      difference() {
        cube([slope_foot_x - rib_notch, rib_r, rib_r]);
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

// The cell's back half sits in this block, which carries a solid strip above
// and below the cell for the straps' screws.
module cell_seat() {
  difference() {
    translate([-cell_len / 2, plate_t - 0.01, wall - 0.01]) cube([cell_len, cell_y - plate_t, seat_top - wall + 0.02]);
    translate([0, cell_y, cell_z]) rotate([0, 90, 0]) cylinder(r = cell_r, h = cell_len + 2, center = true, $fn = 96);
  }
}

// A rim round a pocket on the back wall; the board goes straight in from the front.
module pocket_rim(p) {
  xz_extrude(plate_t - 0.01, plate_t + rim_h)
    difference() {
      translate([p[0] - rim_w, p[1] - rim_w]) square([p[2] - p[0] + 2 * rim_w, p[3] - p[1] + 2 * rim_w]);
      translate([p[0], p[1]]) square([p[2] - p[0], p[3] - p[1]]);
    }
}

// Each motor stands inside its end, its mounting face on a boss round the
// shaft's hole in the back wall, on a ledge, with rims either side. Ribs on
// the door hold it from the front.
module motor_cradles() {
  for (s = [-1, 1]) {
    translate([s * spool_x, plate_t - 0.01, shaft_z]) rotate([-90, 0, 0]) cylinder(d = boss_d, h = boss_t + 0.01, $fn = 64);
    x0 = s * spool_x - mot_t / 2;
    translate([x0 - rim_w, plate_t - 0.01, mot_z0 - 3]) cube([mot_t + 2 * rim_w, boss_t + mot_d, 3]);
    for (x = [x0 - rim_w, x0 + mot_t]) translate([x, plate_t - 0.01, mot_z0 - 3]) cube([rim_w, boss_t + rim_h, mot_h]);
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
      plate();
      walls();
      cell_seat();
      for (p = pockets) pocket_rim(p);
      motor_cradles();
      antenna_saddle();
      ears();
      stem_rib();
    }
    // Seal groove, and the door screws' pilots in the ears.
    xz_extrude(front_y - groove_depth, front_y + 1) seal_band(groove_w);
    xz_extrude(front_y - pilot_depth, front_y + 1) screw_holes_2d(m5_pilot_d);
    // Bulkhead through the roof, relieved from inside down to bulkhead_wall_t.
    translate([0, antenna_y, roof_z - 1]) linear_extrude(roof_t + 2) tear_2d(n_hole_d);
    translate([0, antenna_y, roof_z - 1]) linear_extrude(roof_t - bulkhead_wall_t + 1) tear_2d(n_body_d, front_y - groove_depth - 1 - antenna_y);
    // Reel hubs through the back wall and its bosses: a tight hole, so the TPU seals round them.
    for (s = [-1, 1])
      translate([s * spool_x, -1, shaft_z]) rotate([-90, 0, 0]) cylinder(d = hub_d - hub_seal, h = plate_t + boss_t + 2, $fn = 48);
    // Battery straps' screw pilots, blind in the strips above and below the cell.
    for (x = strap_xs, z = strap_screw_zs)
      translate([x, cell_y - pilot_depth, z]) rotate([-90, 0, 0]) cylinder(d = m5_pilot_d, h = pilot_depth + 0.01, $fn = 32);
    // Rear frame's floor screws, blind in the bottom under the cell's seat.
    for (x = floor_screw_xs)
      translate([x, floor_screw_y, -1]) linear_extrude(pilot_depth + 1) tear_2d(m5_pilot_d);
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

module door_rib(x, z, w, h, y0) {
  translate([x - w / 2, y0, z - h / 2]) cube([w, front_y - y0 + 0.01, h]);
}

module cover() {
  difference() {
    union() {
      xz_extrude(front_y, front_y + cover_t) { box_outline(); ears_2d(); }
      tongue();
      for (s = [-1, 1]) door_rib(s * spool_x, mot_z0 + mot_h / 2, 8, mot_h - 10, plate_t + boss_t + mot_d + 0.5);
    }
    xz_extrude(front_y - 1, front_y + cover_t + 1) screw_holes_2d(m5_clear_d);
    xz_extrude(front_y + under_head, front_y + cover_t + 1) screw_holes_2d(m5_head_d);
    // Solar connector: round, as the user asked.
    translate([solar_x, front_y - 1, solar_z]) rotate([-90, 0, 0]) cylinder(d = solar_hole_d, h = cover_t + 2, $fn = 64);
  }
}

// Reel (right side), axis Y at (spool_x, shaft_z), behind the box. Its hub
// runs forward through the back wall onto the motor's D-shaft; an M5 bolt
// threaded into the rear frame's upright is its outer axle. A cross hole in the core takes
// the line's end.
module spool() {
  translate([spool_x, 0, shaft_z]) rotate([90, 0, 0]) difference() {
    union() {
      translate([0, 0, -drum_y0]) cylinder(d = spool_od, h = spool_flange_t, $fn = 128);
      translate([0, 0, -drum_y0]) cylinder(d = spool_core_d, h = drum_y0 - drum_y1, $fn = 64);
      translate([0, 0, -drum_y1 - spool_flange_t]) cylinder(d = spool_od, h = spool_flange_t, $fn = 128);
      translate([0, 0, -(plate_t + boss_t)]) cylinder(d = hub_d, h = plate_t + boss_t - drum_y0 + 0.01, $fn = 48);
    }
    translate([0, 0, -(plate_t + boss_t) - 1]) linear_extrude(shaft_len + 1.2)
      intersection() {
        circle(d = shaft_d + 0.15, $fn = 32);
        translate([-shaft_d / 2 - 0.1, -shaft_d]) square([shaft_flat + 0.15, 2 * shaft_d]);
      }
    translate([0, 0, -drum_y1 - 15]) cylinder(d = axle_d, h = 16, $fn = 32);
    translate([0, 0, -drum_y0 + spool_flange_t + 6]) rotate([0, 90, 0]) cylinder(d = 4, h = spool_core_d + 2, center = true, $fn = 24);
  }
}

module spool_left() { mirror([1, 0, 0]) spool(); }

module panel_frame_2d() {
  difference() {
    square([panel_w + 2 * frame_border, panel_h + 2 * frame_border], center = true);
    square([panel_w - 2 * frame_lip, panel_h - 2 * frame_lip], center = true);
  }
}

// Place a shape drawn in the panel's plane: x across, y up its slope
// (toward the back), z out of its face, which looks back and up, the way
// the reels face (the user's call).
module on_panel() {
  translate(panel_c) rotate([panel_tilt, 0, 0]) children();
}

// Rear frame: an upright behind the reels that each one's outer axle threads into, a floor under the box screwed to its bottom, gussets between them,
// and the panel's frame hung from the upright's foot with side plates up to
// the floor. Line pull on the reels goes through the axles into the
// upright, and through the floor into the box.
module rear_frame() {
  side_x = panel_w / 2 + frame_border;
  floor_z0 = -floor_t;
  panel_top_z = panel_zc + panel_half * sin(panel_tilt);
  difference() {
    union() {
      // Upright, from the panel's top edge up past the axles.
      translate([-rear_half, rear_y0, panel_top_z - 2]) cube([2 * rear_half, rear_t, rear_top - panel_top_z + 2]);
      // Floor under the box.
      translate([-max(rear_half, side_x), rear_y0, floor_z0]) cube([2 * max(rear_half, side_x), floor_y1 - rear_y0, floor_t]);
      // Gussets between floor and upright, clear of the reels.
      for (x = [-rear_half, -rear_t / 2, rear_half - rear_t])
        hull() {
          translate([x, rear_y1 - 0.01, 0]) cube([rear_t, 0.01, gusset_h]);
          translate([x, rear_y1 + gusset_h, -0.01]) cube([rear_t, 0.01, 0.01]);
        }
      // Panel frame, its lip on the panel's face.
      on_panel() translate([0, 0, -panel_t - 2]) linear_extrude(panel_t + 2) panel_frame_2d();
      // Side plates from the floor down to the frame's sides.
      for (s = [-1, 1])
        hull() {
          translate([s > 0 ? side_x - rear_t : -side_x, rear_y0, floor_z0]) cube([rear_t, floor_y1 - rear_y0, floor_t]);
          on_panel() translate([s * (side_x - rear_t / 2), 0, -panel_t / 2 - 1]) cube([rear_t, 2 * panel_half, panel_t + 2], center = true);
        }
    }
    // The panel's pocket: open behind its face, the lip over its face.
    on_panel() translate([0, 0, -panel_t - 2.01]) linear_extrude(panel_t + 0.01) square([panel_w + 0.6, panel_h + 0.6], center = true);
    for (s = [-1, 1]) translate([s * spool_x, rear_y1 + 1, shaft_z]) rotate([90, 0, 0]) cylinder(d = m5_pilot_d, h = rear_t + 2, $fn = 32);
    for (x = floor_screw_xs) translate([x, floor_screw_y, floor_z0 - 1]) {
      cylinder(d = m5_clear_d, h = floor_t + 2, $fn = 32);
      cylinder(d = m5_head_d, h = floor_t - under_head + 1, $fn = 32);
    }
  }
}

// Battery strap at x: a cap over the cell's front, cupped to it, with a tab
// at each end on the strips above and below the cell.
module battery_strap(x) {
  translate([x - strap_w / 2, 0, 0]) difference() {
    union() {
      translate([0, cell_y, cell_z - cell_r - strap_lug_h + 1]) cube([strap_w, strap_tab_t, 2 * (cell_r + strap_lug_h) - 2]);
      intersection() {
        translate([0, cell_y, cell_z]) rotate([0, 90, 0]) cylinder(r = cell_d / 2 + strap_t, h = strap_w, $fn = 96);
        translate([-1, cell_y, 0]) cube([strap_w + 2, cell_r + strap_t + 1, seat_top]);
      }
    }
    // Cupped a little tighter than the cell's seat, so it presses the cell home.
    translate([-1, cell_y, cell_z]) rotate([0, 90, 0]) cylinder(r = cell_d / 2 + 0.1, h = strap_w + 2, $fn = 96);
    for (z = strap_screw_zs) translate([strap_w / 2, cell_y - 1, z]) rotate([-90, 0, 0]) {
      cylinder(d = m5_clear_d, h = strap_tab_t + 2, $fn = 32);
      translate([0, 0, 1 + under_head]) cylinder(d = m5_head_d, h = strap_tab_t, $fn = 32);
    }
  }
}

// Straps print front face down, cup up.
module battery_strap_print() {
  translate([0, 0, cell_y + cell_d / 2 + strap_t]) rotate([-90, 0, 0]) battery_strap(0);
}

module frame_print() {
  rotate([90, 0, 0]) frame();
}

module cover_print() {
  translate([0, 0, front_y + cover_t]) rotate([-90, 0, 0]) cover();
}

// Reels print standing on their outer flange, hub up.
module spool_print() {
  translate([0, 0, -drum_y1]) rotate([90, 0, 0]) translate([-spool_x, 0, -shaft_z]) spool();
}

// The rear frame prints on the upright's back face: the floor, gussets and
// side plates rise from it as walls, and the panel's frame climbs from its
// joint with the upright at panel_tilt, the steepest overhang allowed.
module rear_frame_print() {
  rotate([90, 0, 0]) translate([0, -rear_y0, 0]) rear_frame();
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
  translate([0, antenna_y, roof_z - n_body_len]) cylinder(r = nut_r, h = n_body_len + roof_t - bulkhead_wall_t, $fn = 6);
}

module boards() {
  sizes = [[kit_w, kit_h, kit_t], [board_w, board_h, board_t], [bms_w, bms_h, bms_t], [drv_w, drv_h, drv_t], [mcu_w, mcu_h, mcu_t]];
  for (i = [0 : len(pockets) - 1])
    translate([pockets[i][0] + pocket_clear, plate_t, pockets[i][1] + pocket_clear]) cube([sizes[i][0], sizes[i][2], sizes[i][1]]);
}

module motors() {
  for (s = [-1, 1]) {
    translate([s * spool_x - mot_t / 2, plate_t + boss_t, mot_z0]) cube([mot_t, mot_d, mot_h]);
    translate([s * spool_x, plate_t + boss_t, shaft_z]) rotate([90, 0, 0]) cylinder(d = shaft_d, h = shaft_len, $fn = 24);
  }
}

module panel() {
  on_panel() translate([0, 0, -panel_t - 2]) linear_extrude(panel_t) square([panel_w, panel_h], center = true);
}

module solar_connector() {
  translate([solar_x, front_y + cover_t, solar_z]) rotate([-90, 0, 0]) cylinder(d = 22, h = 3, $fn = 6);
}
