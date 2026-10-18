// Meshtastic dry-bag node: a sealed box that winches itself up into a tree.
// A line thrown over branches has both ends tied to two reels, one behind
// each end of the box, as far out to the sides as they'll go. Each drum's
// axis runs front to back, square to the line's pull, so the line comes
// straight up off the drum. Each reel has its own self-locking worm motor
// standing inside the box, its shaft out through the back wall's TPU, driven
// by a second XIAO (the nRF52840 Sense, for its IMU) that levels the box as
// it climbs. A PCTG cage holds each reel close all round, built flat-pack:
// every piece prints flat and they slot together like a cardboard cutout,
// so each one is loaded along its strong axis. A front plate screws flat to
// the box's back, a rear plate carries the reels' outer axles, three ribs
// run between them outboard of and between the reels, and a bottom plate
// ties them under the reels. Tabs locate every joint and an M5 x 10 through
// one piece threads 8 mm into the other's edge. The solar panel sits behind
// the reels, on the far side from the antenna and battery, as high as it
// goes under them, three quarters out behind the cage, facing back and up
// at 45° in a frame whose tabs slot through two panel ribs hung from the
// bottom plate.
//
// The body is TPU 64D; the door, reels, straps, cage and panel frame are PCTG. The door
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
// Door screws: a pair either side of every corner, end_screws more evenly up
// each end between them, and these along the top and the bottom. The top's
// middle screw goes into the top sealed post instead, since the bulkhead's
// nut is on the roof there.
end_screws = 3;
screw_xs_top = [-45, 45];
screw_xs_bottom = [-40, 0, 40];
// Sealed screw posts inside, from the back wall to the door: a door screw
// threads into each, and the post's end stands post_squeeze proud so the
// door presses it round the screw's hole. A line over the battery between
// its straps, and one at the top under the bulkhead.
post_d = 12;
post_squeeze = 0.3;
low_post_xs = [-25, 0, 25];
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
// Power-bank charge board: it stands with its USB ports up, into open space
// under the roof (width and height here are as it lies, ports on a long edge)
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
boss_d = 30;
boss_t = 8;
// Line's end wedges into a V jam cleat cut into the core by the inner
// flange: its mouth, its throat (narrower than the line, so it bites), how
// deep it cuts toward the axis, and its length along the axis
cleat_mouth = 8;
cleat_throat = 2.4;
cleat_depth = 12;
cleat_len = 10;
// Reels for 150-200 ft of 1/8" Dacron: flange diameter, core, length between flanges, flange thickness
spool_od = 112;
spool_core_d = 30;
spool_len = 72;
spool_flange_t = 4;
// Gap between the two reels, across the middle, where the middle rib goes
spool_mid_gap = 12;
// The reel's hub goes through the back wall onto the motor's shaft; the TPU hole is this much tighter, as a lip seal
hub_d = 12;
hub_seal = 0.4;
// M5 bolt as the reel's outer axle: it threads into the rear frame's
// upright and the reel turns on its shank
axle_d = 5.4;
// Cage (PCTG, flat-pack): every piece's thickness, the clearance round its
// tabs in their slots, the tabs' length, the frames' bar width, and the
// rings round each reel (their gap to the flange, and width)
cage_t = 9;
slot_clear = 0.3;
tab_len = 20;
bar_w = 12;
ring_gap = 3;
ring_w = 12;
// Gap between each cage piece and the reel it's beside
cage_gap = 1;
// Where the front plate screws to the box's back: into the solid strips
// above and below the cell, at these x
front_screw_xs = [-20, 20];
// Solar panel (5 V 3 W, not measured): its size, tilt (facing back and up),
// its top edge's drop below the bottom plate, and how much of it sticks out
// behind the cage (the user's 3/4)
panel_w = 145;
panel_h = 120;
panel_t = 3;
panel_tilt = 45;
panel_gap = 6;
panel_out = 0.75;
// Panel frame: border round the panel, its lip over the panel's face, and
// its tabs through the panel ribs (length, and how far past the rib for a zip tie)
frame_border = 6;
frame_lip = 4;
frame_tab_len = 16;
frame_tab_out = 9;
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

// Board pockets, interiors [x0, z0, x1, z1], between the motors, above the
// line of posts over the battery: the protection board and radio along the
// bottom; over them the charge board, then the top post's place, then the
// winch XIAO with the motor driver above it.
bay_x = mot_x0 - 2;
low_post_z = seat_top + post_d / 2 + 2;
bay_z = seat_top + post_d + 4;
row2_z = bay_z + pw(max(bms_h, kit_h)) + rim_w;
bms_pocket = [-bay_x, bay_z, -bay_x + pw(bms_w), bay_z + pw(bms_h)];
kit_pocket = [bms_pocket[2] + rim_w, bay_z, bms_pocket[2] + rim_w + pw(kit_w), bay_z + pw(kit_h)];
board_pocket = [-bay_x, row2_z, -bay_x + pw(board_h), row2_z + pw(board_w)];
top_post_x = board_pocket[2] + rim_w + post_d / 2 + 2;
mcu_pocket = [top_post_x + post_d / 2 + 1 + rim_w, row2_z, top_post_x + post_d / 2 + 1 + rim_w + pw(mcu_w), row2_z + pw(mcu_h)];
drv_pocket = [mcu_pocket[0], mcu_pocket[3] + rim_w, mcu_pocket[0] + pw(drv_w), mcu_pocket[3] + rim_w + pw(drv_h)];
pockets = [kit_pocket, board_pocket, bms_pocket, drv_pocket, mcu_pocket];
boards_top = max([for (p = pockets) p[3]]) + rim_w;
// Room over the charge board's ports for a plug
port_room = 20;

mot_z0 = bay_z;
shaft_z = mot_z0 + mot_h - mot_shaft_down;
roof_z = max(boards_top + n_body_len + 2, mot_z0 + mot_h + 2, board_pocket[3] + port_room);
box_h = roof_z + roof_t;

drum_y0 = -cage_t - cage_gap;
drum_y1 = drum_y0 - 2 * spool_flange_t - spool_len;
drum_top = shaft_z + spool_od / 2;
// Cage, in y: the front plate against the box's back, the reel behind it,
// the rear plate behind the reel. In x: a rib outboard of each reel and one
// in the middle. In z: the bottom plate under the reels.
front_y1 = 0;
front_y0 = -cage_t;
rear_y1 = drum_y1 - cage_gap;
rear_y0 = rear_y1 - cage_t;
ring_r0 = spool_od / 2 + ring_gap;
ring_r1 = ring_r0 + ring_w;
rib_xs = [-(spool_x + spool_od / 2 + cage_gap + cage_t / 2), 0, spool_x + spool_od / 2 + cage_gap + cage_t / 2];
cage_half = rib_xs[2] + cage_t / 2;
bottom_z1 = shaft_z - spool_od / 2 - cage_gap;
bottom_z0 = bottom_z1 - cage_t;
cage_top = shaft_z + ring_r1;

seal_inset = wall / 2;
// Door screws as [centre, outward normal], in groups that share one ear: a
// pair either side of each corner, where its curve starts, then the singles.
corner_x = bar_half - box_corner_r;
ear_groups = concat(
  [for (sx = [-1, 1], top = [false, true])
    [[[sx * corner_x, top ? box_h + ear_out : -ear_out], [0, top ? 1 : -1]],
     [[sx * (bar_half + ear_out), top ? box_h - box_corner_r : box_corner_r], [sx, 0]]]],
  [for (sx = [-1, 1], k = [1 : end_screws])
    [[[sx * (bar_half + ear_out), box_corner_r + (box_h - 2 * box_corner_r) * k / (end_screws + 1)], [sx, 0]]]],
  [for (x = screw_xs_top) [[[x, box_h + ear_out], [0, 1]]]],
  [for (x = screw_xs_bottom) [[[x, -ear_out], [0, -1]]]]);
screws = [for (g = ear_groups) each g];
screw_points = [for (e = screws) e[0]];
top_post_z = roof_z - n_body_len - post_d / 2 - 2;
post_points = concat([for (x = low_post_xs) [x, low_post_z]], [[top_post_x, top_post_z]]);
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

// Panel: its frame's top edge, at the front, sits panel_gap under the bottom
// plate, with (1 - panel_out) of its depth forward of the rear plate.
panel_half = panel_h / 2 + frame_border;
frame_half_w = panel_w / 2 + frame_border;
panel_top = [0, rear_y1 + (1 - panel_out) * 2 * panel_half * cos(panel_tilt), bottom_z0 - panel_gap];
panel_c = panel_top - [0, panel_half * cos(panel_tilt), panel_half * sin(panel_tilt)];
// Panel ribs just outboard of the panel's frame.
pr_x0 = frame_half_w + slot_clear + 1;
pr_x1 = pr_x0 + cage_t;
frame_tab_lys = [panel_half - frame_tab_len / 2 - 6, -panel_half + frame_tab_len / 2 + 6];

assert(roof_z - n_body_len > boards_top, "the bulkhead's body hangs into the boards");
assert(max(kit_pocket[2], drv_pocket[2], mcu_pocket[2]) + rim_w < mot_x0 - 1, "boards run into the right motor");
assert(board_pocket[2] + rim_w < top_post_x - post_d / 2 - 1, "charge board runs into the top post");
assert(top_post_z - post_d / 2 > max(kit_pocket[3], bms_pocket[3]) + rim_w, "top post runs into the lower boards");
assert(max([for (x = low_post_xs) abs(x)]) + post_d / 2 < strap_xs[1] - strap_w / 2, "a low post runs into a battery strap");
assert(tongue_w > groove_w && tongue_len < groove_depth, "the tongue must be wider than the groove and stop short of its floor");
assert((wall - groove_w) / 2 >= 2, "too little TPU either side of the groove");
assert(ear_out - m5_pilot_d / 2 + seal_inset - groove_w / 2 >= 2.5, "screw pilots too close to the groove");
assert(pilot_depth < front_y - plate_t, "door screw pilots run out of the back");
assert(plate_t + boss_t + mot_d < front_y, "motor doesn't fit the box's depth");
assert(panel_c[2] - panel_half * sin(panel_tilt) > -60, "panel hangs far below the box");
assert(spool_x - spool_od / 2 > 0, "reels overlap across the middle");
assert(cover_t > under_head && strap_tab_t > under_head && cage_t > under_head, "a part is thinner than the screws' under-head length");
assert(cage_t > thread_len && cage_t >= m5_pilot_d + 4, "cage pieces too thin for 8 mm of thread, or for a pilot in their edges");
assert(spool_x - spool_od / 2 - cage_gap > cage_t / 2, "middle rib runs into the reels");
assert(pr_x1 < spool_x + spool_od / 2 && pr_x0 > frame_half_w, "panel ribs don't sit just outboard of the panel");
assert(boss_d / 2 > 11 + m5_pilot_d / 2 + 1 && 11 - m5_pilot_d / 2 > (hub_d - hub_seal) / 2 + 2, "motor-boss screws crowd the hub's seal or the boss's edge");
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
      for (p = post_points) translate([p[0], plate_t - 0.01, p[1]]) rotate([-90, 0, 0]) cylinder(d = post_d, h = front_y + post_squeeze - plate_t + 0.01, $fn = 48);
    }
    for (p = post_points) translate([p[0], front_y + post_squeeze - pilot_depth, p[1]]) rotate([-90, 0, 0]) cylinder(d = m5_pilot_d, h = pilot_depth + 1, $fn = 32);
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
    // The cage's front plate screws into the back: into the solid strips
    // above and below the cell, and into each motor's boss.
    for (p = front_screw_points())
      translate([p[0], -1, p[1]]) rotate([-90, 0, 0]) cylinder(d = m5_pilot_d, h = pilot_depth + 1, $fn = 32);
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
    for (p = post_points) plate_screw([p[0], front_y, p[1]], [0, 1, 0], cover_t);
    // Solar connector: round, as the user asked.
    translate([solar_x, front_y - 1, solar_z]) rotate([-90, 0, 0]) cylinder(d = solar_hole_d, h = cover_t + 2, $fn = 64);
  }
}

// Reel (right side), axis Y at (spool_x, shaft_z), behind the box. Its hub
// runs forward through the back wall onto the motor's D-shaft; an M5 bolt
// threaded into the rear frame's upright is its outer axle. The line's end
// wedges into a V jam cleat in the core.
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
    // V jam cleat: a notch from the core's surface toward the axis, narrowing
    // from cleat_mouth to cleat_throat, its walls along the axis so they print upright.
    translate([0, 0, -drum_y0 + spool_flange_t + 1])
      linear_extrude(cleat_len)
        polygon([[spool_core_d / 2 + 1, -cleat_mouth / 2], [spool_core_d / 2 + 1, cleat_mouth / 2],
                 [spool_core_d / 2 - cleat_depth, cleat_throat / 2], [spool_core_d / 2 - cleat_depth, -cleat_throat / 2]]);
  }
}

module spool_left() { mirror([1, 0, 0]) spool(); }

module panel_frame_2d() {
  difference() {
    square([2 * frame_half_w, 2 * panel_half], center = true);
    square([panel_w - 2 * frame_lip, panel_h - 2 * frame_lip], center = true);
  }
}

// Place a shape drawn in the panel's plane: x across, y up its slope
// (toward the front), z out of its face, which looks back and up, the way
// the reels face (the user's call). The frame is local z -panel_t-2..0.
module on_panel() {
  translate(panel_c) rotate([panel_tilt, 0, 0]) children();
}

// A 2D shape in the YZ plane (its x is y, its y is z), extruded through x0..x1.
module yz_extrude(x0, x1) {
  translate([x0, 0, 0]) rotate([90, 0, 90]) linear_extrude(x1 - x0) children();
}

// Where the front plate screws to the box's back, [x, z]: the solid strips
// above and below the cell, and each motor's boss either side of its hub.
function front_screw_points() = concat(
  [for (x = front_screw_xs, z = [wall + strap_lug_h / 2, seat_top - strap_lug_h / 2]) [x, z]],
  [for (s = [-1, 1], dz = [-11, 11]) [s * spool_x, shaft_z + dz]]);

// Joints, all on the cage's centre lines. Ribs' tabs into the front and rear
// plates, and the screws between them, at these z; their tabs into the
// bottom plate, and its screws into them, at these y.
rib_tab_zs = [bottom_z1 + tab_len, cage_top - tab_len];
rib_screw_zs = [bottom_z1 + 2.5 * tab_len, cage_top - 2.5 * tab_len];
rib_bottom_tab_ys = [front_y0 - tab_len, rear_y1 + tab_len];
rib_bottom_screw_y = (front_y0 + rear_y1) / 2;
// The bottom plate's tabs into the front and rear plates, and its screws, at these x.
bottom_tab_xs = [-100, -35, 35, 100];
bottom_screw_xs = [-spool_x, spool_x];
// The panel ribs' tabs into the bottom plate, and their screws, at these y.
pr_tab_ys = [front_y0 - tab_len, rear_y1 + tab_len / 2 + 4];
pr_screw_y = (pr_tab_ys[0] + pr_tab_ys[1]) / 2;

// A screw through a plate: p on the face its thread comes out of, n pointing
// back toward its head. Counterbored so under_head is left under the head.
module plate_screw(p, n, t = cage_t) {
  translate(p) rotate(n == [0, 1, 0] ? [-90, 0, 0] : n == [0, -1, 0] ? [90, 0, 0] : n == [0, 0, 1] ? [0, 0, 0] : [180, 0, 0]) {
    translate([0, 0, -1]) cylinder(d = m5_clear_d, h = t + 2, $fn = 32);
    translate([0, 0, under_head]) cylinder(d = m5_head_d, h = t, $fn = 32);
  }
}

// A pilot into a piece's edge at p, running pilot_depth along d.
module edge_pilot(p, d) {
  translate(p) rotate(d == [0, 1, 0] ? [-90, 0, 0] : d == [0, -1, 0] ? [90, 0, 0] : d == [0, 0, 1] ? [0, 0, 0] : [180, 0, 0])
    cylinder(d = m5_pilot_d, h = pilot_depth, $fn = 24);
}

// The front and rear plates' shared outline: a perimeter frame round both
// reels, a bar down the middle for the middle rib, and a ring round each reel.
module cage_frame_2d() {
  difference() {
    translate([-cage_half, bottom_z0]) square([2 * cage_half, cage_top - bottom_z0]);
    translate([-cage_half + bar_w, bottom_z0 + bar_w]) square([2 * (cage_half - bar_w), cage_top - bottom_z0 - 2 * bar_w]);
  }
  translate([-bar_w / 2, bottom_z0]) square([bar_w, cage_top - bottom_z0]);
  intersection() {
    for (s = [-1, 1]) translate([s * spool_x, shaft_z]) difference() { circle(r = ring_r1, $fn = 128); circle(r = ring_r0, $fn = 128); }
    translate([-cage_half, bottom_z0]) square([2 * cage_half, cage_top - bottom_z0]);
  }
}

// Slots in a front or rear plate for the ribs' and bottom plate's tabs.
module cage_plate_slots(y0, y1) {
  for (x = rib_xs, z = rib_tab_zs)
    translate([x - cage_t / 2 - slot_clear, y0 - 1, z - tab_len / 2 - slot_clear]) cube([cage_t + 2 * slot_clear, y1 - y0 + 2, tab_len + 2 * slot_clear]);
  for (x = bottom_tab_xs)
    translate([x - tab_len / 2 - slot_clear, y0 - 1, bottom_z0 - slot_clear]) cube([tab_len + 2 * slot_clear, y1 - y0 + 2, cage_t + 2 * slot_clear]);
}

// Front plate: flat on the box's back. Its frame and rings, and over the box
// a frame of its own with bars along the screw rows and pads on the motors'
// bosses. Screws from its front face into the ribs and the bottom plate go
// in before it goes on the box; screws from its back into the box after.
module front_plate() {
  difference() {
    xz_extrude(front_y0, front_y1) {
      cage_frame_2d();
      difference() {
        translate([-bar_half + 2, 2]) square([2 * bar_half - 4, box_h - 4]);
        translate([-bar_half + 2 + bar_w, 2 + bar_w]) square([2 * bar_half - 4 - 2 * bar_w, box_h - 4 - 2 * bar_w]);
      }
      for (z = [wall + strap_lug_h / 2, seat_top - strap_lug_h / 2]) translate([-bar_half + 2, z - bar_w / 2]) square([2 * bar_half - 4, bar_w]);
      translate([-bar_half + 2, shaft_z - bar_w / 2]) square([2 * bar_half - 4, bar_w]);
      for (s = [-1, 1]) translate([s * spool_x, shaft_z]) circle(d = boss_d + 6, $fn = 64);
    }
    for (s = [-1, 1]) translate([s * spool_x, front_y0 - 1, shaft_z]) rotate([-90, 0, 0]) cylinder(d = hub_d + 1, h = cage_t + 2, $fn = 48);
    cage_plate_slots(front_y0, front_y1);
    // Heads on the back face, threads into the box.
    for (p = front_screw_points()) plate_screw([p[0], front_y1, p[1]], [0, -1, 0]);
    // Heads on the front face, threads into the ribs and the bottom plate.
    for (x = rib_xs, z = rib_screw_zs) plate_screw([x, front_y0, z], [0, 1, 0]);
    for (x = bottom_screw_xs) plate_screw([x, front_y0, (bottom_z0 + bottom_z1) / 2], [0, 1, 0]);
  }
}

// Rear plate: the same frame and rings, with spokes to a boss on each reel's
// axis that its outer axle (an M5 x 25) threads into. It goes on last, once
// the reels are on their shafts.
module rear_plate() {
  difference() {
    xz_extrude(rear_y0, rear_y1) {
      cage_frame_2d();
      for (s = [-1, 1]) translate([s * spool_x, shaft_z]) {
        circle(d = 24, $fn = 48);
        for (a = [45, 135, 225, 315]) rotate(a) translate([0, -bar_w / 2]) square([ring_r0 + 1, bar_w]);
      }
    }
    for (s = [-1, 1]) translate([s * spool_x, rear_y1 + 1, shaft_z]) rotate([90, 0, 0]) cylinder(d = m5_pilot_d, h = cage_t + 2, $fn = 32);
    cage_plate_slots(rear_y0, rear_y1);
    for (x = rib_xs, z = rib_screw_zs) plate_screw([x, rear_y1, z], [0, -1, 0]);
    for (x = bottom_screw_xs) plate_screw([x, rear_y1, (bottom_z0 + bottom_z1) / 2], [0, -1, 0]);
  }
}

// Rib at x (three, all the same piece): a frame with a diagonal brace
// between the front and rear plates, standing on the bottom plate, tabbed
// into all three, with pilots in its edges for their screws.
module rib(x) {
  y0 = front_y0;
  y1 = rear_y1;
  difference() {
    yz_extrude(x - cage_t / 2, x + cage_t / 2) {
      difference() {
        translate([y1, bottom_z1]) square([y0 - y1, cage_top - bottom_z1]);
        translate([y1 + bar_w, bottom_z1 + bar_w]) square([y0 - y1 - 2 * bar_w, cage_top - bottom_z1 - 2 * bar_w]);
      }
      hull() {
        translate([y1 + bar_w / 2, bottom_z1 + bar_w / 2]) circle(d = bar_w);
        translate([y0 - bar_w / 2, cage_top - bar_w / 2]) circle(d = bar_w);
      }
      for (z = rib_tab_zs) {
        translate([y0, z - tab_len / 2]) square([front_y1 - y0 - 0.2, tab_len]);
        translate([rear_y0 + 0.2, z - tab_len / 2]) square([y1 - rear_y0 - 0.2, tab_len]);
      }
      for (y = rib_bottom_tab_ys) translate([y - tab_len / 2, bottom_z0 + 0.2]) square([tab_len, bottom_z1 - bottom_z0 - 0.2]);
    }
    for (z = rib_screw_zs) {
      edge_pilot([x, y0 + 0.01, z], [0, -1, 0]);
      edge_pilot([x, y1 - 0.01, z], [0, 1, 0]);
    }
    edge_pilot([x, rib_bottom_screw_y, bottom_z1 - 0.01], [0, 0, 1]);
  }
}

// Bottom plate: under the reels, between the front and rear plates, with
// cut-outs between the ribs. The ribs stand in its slots and the panel ribs
// hang from them.
module bottom_plate() {
  y0 = front_y0;
  y1 = rear_y1;
  difference() {
    union() {
      translate([-cage_half, y1, bottom_z0]) cube([2 * cage_half, y0 - y1, cage_t]);
      for (x = bottom_tab_xs) {
        translate([x - tab_len / 2, y0 - 0.01, bottom_z0]) cube([tab_len, front_y1 - y0 - 0.2, cage_t]);
        translate([x - tab_len / 2, rear_y0 + 0.2, bottom_z0]) cube([tab_len, y1 - rear_y0 - 0.2 + 0.01, cage_t]);
      }
    }
    // Cut-outs between the ribs and the panel ribs, leaving bars round them.
    for (s = [-1, 1]) {
      xa = s > 0 ? bar_w : -pr_x0 + bar_w;
      xb = s > 0 ? pr_x0 - bar_w : -bar_w;
      translate([min(xa, xb), y1 + bar_w, bottom_z0 - 1]) cube([abs(xb - xa), y0 - y1 - 2 * bar_w, cage_t + 2]);
      xc = s > 0 ? pr_x1 + bar_w : -rib_xs[2] + cage_t / 2 + bar_w;
      xd = s > 0 ? rib_xs[2] - cage_t / 2 - bar_w : -pr_x1 - bar_w;
      translate([min(xc, xd), y1 + bar_w, bottom_z0 - 1]) cube([abs(xd - xc), y0 - y1 - 2 * bar_w, cage_t + 2]);
    }
    for (x = rib_xs, y = rib_bottom_tab_ys)
      translate([x - cage_t / 2 - slot_clear, y - tab_len / 2 - slot_clear, bottom_z0 - 1]) cube([cage_t + 2 * slot_clear, tab_len + 2 * slot_clear, cage_t + 2]);
    for (s = [-1, 1], y = pr_tab_ys)
      translate([s > 0 ? pr_x0 - slot_clear : -pr_x1 - slot_clear, y - tab_len / 2 - slot_clear, bottom_z0 - 1]) cube([cage_t + 2 * slot_clear, tab_len + 2 * slot_clear, cage_t + 2]);
    for (x = rib_xs) plate_screw([x, rib_bottom_screw_y, bottom_z1], [0, 0, -1]);
    for (s = [-1, 1]) plate_screw([s * (pr_x0 + pr_x1) / 2, pr_screw_y, bottom_z0], [0, 0, 1]);
    for (x = bottom_screw_xs) {
      edge_pilot([x, y0 + 0.01, (bottom_z0 + bottom_z1) / 2], [0, -1, 0]);
      edge_pilot([x, y1 - 0.01, (bottom_z0 + bottom_z1) / 2], [0, 1, 0]);
    }
  }
}

// Panel rib (s = +1 right, -1 left; the same piece flipped): hangs from the
// bottom plate just outboard of the panel and runs down the panel's side,
// with a slanted slot for each of the panel frame's tabs.
module panel_rib(s) {
  top = [panel_top[1], panel_top[2]];
  bot = [panel_top[1] - 2 * panel_half * cos(panel_tilt), panel_top[2] - 2 * panel_half * sin(panel_tilt)];
  x0 = s > 0 ? pr_x0 : -pr_x1;
  difference() {
    yz_extrude(x0, x0 + cage_t) {
      // Clipped to hang below the bottom plate; only its tabs go up into it.
      intersection() {
        translate([-500, -500]) square([1000, bottom_z0 + 500]);
        union() {
      difference() {
        hull() {
          translate([rear_y1, bottom_z0 - bar_w]) square([front_y0 - rear_y1 - 4, bar_w]);
          for (p = [top, bot]) translate(p) circle(r = bar_w, $fn = 32);
        }
        offset(-bar_w) hull() {
          translate([rear_y1, bottom_z0 - bar_w]) square([front_y0 - rear_y1 - 4, bar_w]);
          for (p = [top, bot]) translate(p) circle(r = bar_w, $fn = 32);
        }
      }
      // The panel's side runs along this bar.
      hull() for (p = [top, bot]) translate(p) circle(r = bar_w, $fn = 32);
        }
      }
      for (y = pr_tab_ys) translate([y - tab_len / 2, bottom_z0 - 0.01]) square([tab_len, cage_t - 0.2]);
    }
    for (ly = frame_tab_lys)
      intersection() {
        on_panel() translate([-200, ly - frame_tab_len / 2 - slot_clear, -panel_t - 2 - slot_clear]) cube([400, frame_tab_len + 2 * slot_clear, panel_t + 2 + 2 * slot_clear]);
        translate([x0 - 1, -500, -500]) cube([cage_t + 2, 1000, 1000]);
      }
    edge_pilot([(x0 + x0 + cage_t) / 2, pr_screw_y, bottom_z0 + 0.01], [0, 0, -1]);
  }
}

// Panel frame: holds the panel in a pocket with a lip over its face. Tabs
// either side go through the panel ribs' slots, a zip tie through each tab's
// end outside the rib.
module solar_mount() {
  on_panel() difference() {
    union() {
      translate([0, 0, -panel_t - 2]) linear_extrude(panel_t + 2) panel_frame_2d();
      for (s = [-1, 1], ly = frame_tab_lys)
        translate([s > 0 ? frame_half_w - 1 : -(pr_x1 + frame_tab_out), ly - frame_tab_len / 2, -panel_t - 2])
          cube([pr_x1 + frame_tab_out - frame_half_w + 1, frame_tab_len, panel_t + 2]);
    }
    translate([0, 0, -panel_t - 2.01]) linear_extrude(panel_t + 0.01) square([panel_w + 0.6, panel_h + 0.6], center = true);
    for (s = [-1, 1], ly = frame_tab_lys)
      translate([s * (pr_x1 + frame_tab_out / 2), ly, -panel_t - 3]) cylinder(d = 4.5, h = panel_t + 4, $fn = 24);
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

// The panel frame prints face side down, its pocket open upward.
module solar_mount_print() {
  rotate([180, 0, 0]) rotate([-panel_tilt, 0, 0]) translate(-panel_c) solar_mount();
}

module cover_print() {
  translate([0, 0, front_y + cover_t]) rotate([-90, 0, 0]) cover();
}

// Reels print standing on their outer flange, hub up.
module spool_print() {
  translate([0, 0, -drum_y1]) rotate([90, 0, 0]) translate([-spool_x, 0, -shaft_z]) spool();
}

// Cage pieces print flat, each on its widest face.
module front_plate_print() { rotate([90, 0, 0]) translate([0, -front_y0, 0]) front_plate(); }
module rear_plate_print() { rotate([90, 0, 0]) translate([0, -rear_y0, 0]) rear_plate(); }
module rib_print() { rotate([0, -90, 0]) translate([cage_t / 2, 0, 0]) rib(0); }
module bottom_plate_print() { translate([0, 0, -bottom_z0]) bottom_plate(); }
module panel_rib_print() { rotate([0, -90, 0]) translate([-pr_x0, 0, 0]) panel_rib(1); }

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
  sizes = [[kit_w, kit_h, kit_t], [board_h, board_w, board_t], [bms_w, bms_h, bms_t], [drv_w, drv_h, drv_t], [mcu_w, mcu_h, mcu_t]];
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
