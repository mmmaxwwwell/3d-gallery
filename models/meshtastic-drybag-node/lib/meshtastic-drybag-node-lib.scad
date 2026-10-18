// Meshtastic dry-bag node: a sealed box that winches itself up into a tree.
// A line thrown over branches has both ends tied to two reels, one behind
// each end of the box, as far out to the sides as they'll go. Each drum's
// axis runs front to back, square to the line's pull, so the line comes
// straight up off the drum. Each reel has its own self-locking worm motor
// standing inside the box, its shaft out through the back wall's TPU, driven
// by a second XIAO (the nRF52840 Sense, for its IMU) that levels the box as
// it climbs. A PCTG cage cradles each reel's lower half, built flat-pack:
// every piece prints flat, loaded along its strong axis. A back plate
// screws flat to the box's back, an outside plate behind the reels carries
// their outer axles, and linking bars between the two tie the cradles'
// corners first, each bar's ends dovetailed into the plates and locked with
// a screw. The solar panel sits behind the reels, on the far side from the
// antenna and battery, as high as it goes under the cage, three quarters
// out behind it, facing back and up at 45°, lying on two triangular panel
// ribs that run straight out under the outside plate.
//
// The battery sits in a cup on the box's back, under the reels, as the
// counterweight: printed on its own, open toward the box, its rim sealing
// into a groove round the back wall the same way the door does. The
// antenna stands on a mast 100 mm above the roof.
//
// The body is TPU 64D; the door, reels, cage, battery cup and mast are PCTG. The door
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
// the door's bottom run, and one at the top under the bulkhead. The cage's
// back plate screws into their back ends too.
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
stem_len = 40;
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
// Cage (PCTG, flat-pack): every piece's thickness, the plates' bar width,
// the bar across their bottoms' height (deep enough for a pilot from
// below), and the rings round each reel (their gap to the flange, and width)
cage_t = 8;
bar_w = 10;
plate_bar_h = 14;
ring_gap = 3;
ring_w = 10;
// Gap between each cage piece and the reel it's beside
cage_gap = 1;
slot_clear = 0.3;
// Linking bars: width (along the ring) and thickness (across it), and
// their angles round each reel (right reel; the left mirrors it). The
// cradle's corners come first: its outer top corner (0°, at the axle) and
// outer bottom corner (-40°). Under each reel, the panel plate is the
// bottom crossmember.
xbar_w = 16;
xbar_t = 8;
xbar_angles = [0, -40];
// Dovetail on every bar's ends: its depth into the plate, its width at the
// shoulder and at the tip, and its clearance in the plate's socket
dv_depth = 3.5;
dv_w0 = 10;
dv_w1 = 14;
dv_clear = 0.25;
// Solar panel (5 V 3 W, not measured): its size and tilt (facing back and
// up), and how far behind the outside plate its top edge sits. It's set
// back to balance the box's weight on the other side of the reels.
panel_w = 145;
panel_h = 120;
panel_t = 3;
panel_tilt = 45;
panel_back = 4;
// Panel plates, one just outside each of the panel's side edges: each fits
// the rectangle under its reel (doubling as the reel's bottom crossmember),
// comes out behind with a top member and a diagonal crossmember, and has
// the panel's groove cut in it. Their members' width, the rectangle's
// depth, how deep the panel's edge sits in each groove, the material either
// side of the panel along the groove, and the lugs either side of the
// outside plate's bottom bar.
pp_t = 12;
pp_sq_h = 16;
pp_groove = 4;
pp_band = 8;
pp_lug = 5;
// Battery cup, on the box's back under the reels: its wall, its screws
// along the top (it has two more in each end), and the window in the box's
// back wall for the cell's leads, [x, width, height]
cup_wall = 4;
cup_screw_xs = [-50, 0, 50];
cup_window = [-55, 30, 22];
// The box's back wall is thickened inside round the cup, for its groove and screws
back_pad_t = 9;
// Antenna mast (PCTG): height above the roof, its bore (room for the
// bulkhead's body), wall, and the flange its foot screws down with
mast_h = 100;
mast_bore = 23;
mast_wall = 4;
mast_flange_t = 6;
// Saddle on the stem round the mast, and the zip-tie slots either side of it, below and above
saddle_w = 6;
tie_w = 6;
tie_t = 2.5;
corner_r = 4;
// END_PARAMS

function pw(w) = w + 2 * pocket_clear;

cell_r = cell_d / 2 + cell_clear;
// The cup: the cell lies along x just behind the box's back face, at its bottom.
cup_half_x = cell_len / 2 + end_clear + cup_wall;
cell_y = -cell_r - 0.5;
cell_z = cup_wall + cell_r;
cup_top = cell_z + cell_r + cup_wall;
cup_depth = -cell_y + cell_r + cup_wall;

// Reels behind each end, far enough out that the two clear each other; the
// motors stand inside the box in line with them.
spool_x = spool_od / 2 + spool_mid_gap / 2;
inner_half = spool_x + mot_t / 2;
bar_half = inner_half + wall;
mot_x0 = spool_x - mot_t / 2;
front_y = plate_t + boss_t + mot_d + 1;

// Board pockets, interiors [x0, z0, x1, z1], between the motors, above the
// line of posts over the battery cup: the protection board and radio along the
// bottom; over them the charge board, then the top post's place, then the
// winch XIAO with the motor driver above it.
bay_x = mot_x0 - 2;
low_post_z = cup_top + post_d / 2 + 2;
// The box stays tall: the boards and motors start high enough that the
// reels' cage, under them, clears the battery cup.
bay_z = max(cup_top + post_d + 4, cup_top + 2 + pp_sq_h + ring_gap + ring_w + spool_od / 2 - (mot_h - mot_shaft_down));
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
// Cage, in y: the back plate against the box's back, the reel behind it,
// the outside plate behind the reel.
front_y1 = 0;
front_y0 = -cage_t;
rear_y1 = drum_y1 - cage_gap;
rear_y0 = rear_y1 - cage_t;
ring_r0 = spool_od / 2 + ring_gap;
ring_r1 = ring_r0 + ring_w;

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
// The cup's screws, outside its seal: along its top, and two up each end
// into the box's end walls.
cup_screws = concat(
  [for (x = cup_screw_xs) [[x, cup_top + ear_out], [0, 1]]],
  [for (sx = [-1, 1], z = [cup_top / 4, 3 * cup_top / 4]) [[sx * (cup_half_x + ear_out), z], [sx, 0]]]);
post_points = concat([for (x = low_post_xs) [x, low_post_z]], [[top_post_x, top_post_z]]);
// Every M5 x 10 threads thread_len in; its pilot runs 1 mm deeper.
pilot_depth = thread_len + 1;
under_head = screw_len - thread_len;
ear_back_y = front_y - ear_len - (ear_out + ear_r);

n_hole_d = n_thread_d + n_hole_clear;
nut_r = n_nut_af / sqrt(3);
mast_r = mast_bore / 2 + mast_wall;
antenna_y = plate_t + mast_r + 1;
mast_top = box_h + mast_h;
// Mast's flange on the roof, between the back plate's stem and the roof's front edge.
mast_flange = [[-mast_r - 12, plate_t + 0.5], [mast_r + 12, front_y - 1]];
mast_screws = [for (sx = [-1, 1], dy = [-8, 8]) [sx * (mast_r + 6), antenna_y + dy]];
mast_seal_r = mast_bore / 2 + mast_wall / 2;

solar_x = (board_pocket[0] + board_pocket[2]) / 2;
solar_z = (board_pocket[1] + board_pocket[3]) / 2;

stem_half = mast_r + 0.5 + tie_t + 3;
stem_top = box_h + stem_len;
// Ties and saddle round the mast, above its flange's cone.
tie_zs = [box_h + mast_flange_t + 8 + tie_w / 2 + 2, stem_top - tie_w / 2 - 2];
antenna_saddle_z = (tie_zs[0] + tie_zs[1]) / 2;
rib_notch = mast_flange[1][0] + 1;

// Panel plates sit just outside the panel's side edges, its edges in their grooves.
pp_x0 = panel_w / 2 + 0.5 - pp_groove;
pp_x1 = pp_x0 + cage_t;

assert(roof_z - n_body_len > boards_top, "the bulkhead's body hangs into the boards");
assert(max(kit_pocket[2], drv_pocket[2], mcu_pocket[2]) + rim_w < mot_x0 - 1, "boards run into the right motor");
assert(board_pocket[2] + rim_w < top_post_x - post_d / 2 - 1, "charge board runs into the top post");
assert(top_post_z - post_d / 2 > max(kit_pocket[3], bms_pocket[3]) + rim_w, "top post runs into the lower boards");
assert(tongue_w > groove_w && tongue_len < groove_depth, "the tongue must be wider than the groove and stop short of its floor");
assert((wall - groove_w) / 2 >= 2, "too little TPU either side of the groove");
assert(ear_out - m5_pilot_d / 2 + seal_inset - groove_w / 2 >= 2.5, "screw pilots too close to the groove");
assert(pilot_depth < front_y - plate_t, "door screw pilots run out of the back");
assert(plate_t + boss_t + mot_d < front_y, "motor doesn't fit the box's depth");
assert(pp_bot[1] > -130, "panel hangs far below the box");
assert(cup_half_x + ear_out + m5_pilot_d / 2 < bar_half && cup_half_x + ear_out - m5_pilot_d / 2 > inner_half, "cup's end screws miss the box's end walls");
assert(cup_depth < -rear_y1, "battery cup runs into the outside plate");
assert(spool_x - spool_od / 2 > 0, "reels overlap across the middle");
assert(cover_t > under_head && cage_t > under_head, "a part is thinner than the screws' under-head length");
assert(plate_t + back_pad_t > pilot_depth + 1, "back wall too thin round the cup for its screws");
assert(mast_seal_r - groove_w / 2 > 10 + 1, "mast's seal crowds the coax hole");
assert(cage_t >= thread_len, "outside plate too thin for the axles' 8 mm of thread");
assert(xbar_t >= m5_pilot_d + 3 && xbar_w > dv_w1 + 1, "linking bars too small for their pilots or dovetails");
assert(ring_r0 < xbar_r - xbar_t / 2 && xbar_r + xbar_t / 2 < ring_r1, "linking bars hang off their rings");
assert(pp_x1 < spool_x + spool_od / 2 - 2, "panel plates aren't under the reels");
assert(spool_x - spool_od / 2 > xbar_t / 2 + 1, "the middle bar runs into the reels");
assert(boss_d / 2 > 11 + m5_pilot_d / 2 + 1 && 11 - m5_pilot_d / 2 > (hub_d - hub_seal) / 2 + 2, "motor-boss screws crowd the hub's seal or the boss's edge");
assert(antenna_y - antenna_d / 2 > plate_t, "antenna radome hits the back plate");
assert(antenna_y + n_body_d / 2 < front_y - groove_depth - 1, "bulkhead relief breaks into the groove");

// Round hole along Z. Holes are round everywhere, no teardrops (the user's call).
module tear_2d(d, y_max = 1e9) {
  circle(d = d);
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
  r = mast_r + 0.4;
  difference() {
    translate([-stem_half + 2, plate_t - 0.01, antenna_saddle_z - saddle_w / 2])
      cube([2 * stem_half - 4, antenna_y - plate_t, saddle_w]);
    translate([0, antenna_y, antenna_saddle_z]) cylinder(r = r, h = saddle_w + 2, center = true, $fn = 96);
  }
}

// The cup's outline on the box's back, its seal's centre loop, and its ears.
module cup_outline_2d() {
  offset(3) offset(-3) translate([-cup_half_x, 0]) square([2 * cup_half_x, cup_top]);
}

module cup_seal_band(w) {
  difference() {
    offset(w / 2) offset(1) offset(-1) translate([-cup_half_x + cup_wall / 2, cup_wall / 2]) square([2 * cup_half_x - cup_wall, cup_top - cup_wall]);
    offset(-w / 2) offset(1) offset(-1) translate([-cup_half_x + cup_wall / 2, cup_wall / 2]) square([2 * cup_half_x - cup_wall, cup_top - cup_wall]);
  }
}

module cup_ears_2d() {
  for (e = cup_screws) ear_2d(e);
}

// Inside the box, the back wall thickened round the cup for its groove and screws.
module back_pad() {
  xz_extrude(plate_t - 0.01, plate_t + back_pad_t)
    intersection() {
      translate([-inner_half - 0.01, wall - 0.01]) square([2 * inner_half + 0.02, cup_top + ear_out + ear_r - wall]);
      offset(8) cup_outline_2d();
    }
}

module frame() {
  difference() {
    union() {
      plate();
      walls();
      for (p = pockets) pocket_rim(p);
      motor_cradles();
      antenna_saddle();
      ears();
      stem_rib();
      for (p = post_points) translate([p[0], plate_t - 0.01, p[1]]) rotate([-90, 0, 0]) cylinder(d = post_d, h = front_y + post_squeeze - plate_t + 0.01, $fn = 48);
      back_pad();
    }
    for (p = post_points) translate([p[0], front_y + post_squeeze - pilot_depth, p[1]]) rotate([-90, 0, 0]) cylinder(d = m5_pilot_d, h = pilot_depth + 1, $fn = 32);
    // Seal groove, and the door screws' pilots in the ears.
    xz_extrude(front_y - groove_depth, front_y + 1) seal_band(groove_w);
    xz_extrude(front_y - pilot_depth, front_y + 1) screw_holes_2d(m5_pilot_d);
    // The coax up through the roof into the mast, the groove round it the
    // mast's tongue seals in, and the mast's screws, blind in the roof.
    translate([0, antenna_y, roof_z - 1]) cylinder(d = 20, h = roof_t + 2, $fn = 48);
    translate([0, antenna_y, box_h - groove_depth]) linear_extrude(groove_depth + 1)
      difference() { circle(r = mast_seal_r + groove_w / 2, $fn = 96); circle(r = mast_seal_r - groove_w / 2, $fn = 96); }
    for (p = mast_screws) translate([p[0], p[1], box_h - pilot_depth]) cylinder(d = m5_pilot_d, h = pilot_depth + 1, $fn = 24);
    // Reel hubs through the back wall and its bosses: a tight hole, so the TPU seals round them.
    for (s = [-1, 1])
      translate([s * spool_x, -1, shaft_z]) rotate([-90, 0, 0]) cylinder(d = hub_d - hub_seal, h = plate_t + boss_t + 2, $fn = 48);
    // The battery cup: the groove its rim's tongue seals in, its screws'
    // pilots, and the window its cell's leads come through.
    xz_extrude(-1, groove_depth) cup_seal_band(groove_w);
    for (e = cup_screws) translate([e[0][0], -1, e[0][1]]) rotate([-90, 0, 0]) cylinder(d = m5_pilot_d, h = pilot_depth + 1, $fn = 24);
    translate([cup_window[0] - cup_window[1] / 2, -1, cell_z - cup_window[2] / 2]) cube([cup_window[1], plate_t + back_pad_t + 2, cup_window[2]]);
    // The cage's back plate screws into the back: into the posts' back ends,
    // and into each motor's boss.
    for (p = front_screw_points())
      translate([p[0], -1, p[1]]) rotate([-90, 0, 0]) cylinder(d = m5_pilot_d, h = pilot_depth + 1, $fn = 32);
    for (side = [-1, 1], z = tie_zs)
      translate([side * (mast_r + 0.5 + tie_t / 2) - tie_t / 2, -1, z - tie_w / 2])
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

// Place a shape drawn in the panel's plane, centred on the panel: x across,
// y up its slope (toward the front), z out of its face, which looks back
// and up, the way the reels face (the user's call).
module on_panel() {
  translate(panel_c) rotate([panel_tilt, 0, 0]) children();
}

// A 2D shape in the YZ plane (its x is y, its y is z), extruded through x0..x1.
module yz_extrude(x0, x1) {
  translate([x0, 0, 0]) rotate([90, 0, 90]) linear_extrude(x1 - x0) children();
}

// Where the back plate screws to the box's back, [x, z]: the back ends of
// the posts along the bottom, and each motor's boss either side of its hub.
function front_screw_points() = concat(
  [for (x = low_post_xs) [x, low_post_z]],
  [for (s = [-1, 1], dz = [-11, 11]) [s * spool_x, shaft_z + dz]]);

// A screw through a plate: p on the face its thread comes out of, n pointing
// back toward its head. Counterbored so under_head is left under the head.
module plate_screw(p, n, t = cage_t) {
  translate(p) rotate(n == [0, 1, 0] ? [-90, 0, 0] : n == [0, -1, 0] ? [90, 0, 0] : n == [0, 0, 1] ? [0, 0, 0] : [180, 0, 0]) {
    translate([0, 0, -1]) cylinder(d = m5_clear_d, h = t + 2, $fn = 32);
    translate([0, 0, under_head]) cylinder(d = m5_head_d, h = t, $fn = 32);
  }
}

// The linking bars, all the same piece, round each reel's sides: [x, z, a],
// a the angle out from the reel's axis. The corners (40° above and below
// the outer side) come first: tying them is what holds the cage square.
xbar_r = (ring_r0 + ring_r1) / 2;
function xbars() = concat(
  [for (s = [-1, 1], a = xbar_angles) [s * spool_x, shaft_z, s > 0 ? a : 180 - a]],
  // One across the middle, on edge between the reels, tying the cradles'
  // inner top corners; it slides in sideways from the right reel's side.
  [[-xbar_r, shaft_z - xbar_w / 2 - 2, 0]]);
// A linking bar's length between the plates' faces, and overall with its dovetails.
xbar_len = front_y0 - rear_y1;
xbar_total = xbar_len + 2 * dv_depth;

// Dovetail tenon on a bar's end, drawn as the bar's local frame has it: x
// across the bar's thickness (the way it slides into its socket), z across
// its width, y along it from the shoulder at 0 out to the tip at dv_depth.
// It widens from dv_w0 at the shoulder to dv_w1 at the tip, so it can't
// pull out along the bar.
module dovetail(t, grow = 0, x_len = 0) {
  hull() {
    translate([-grow, -0.01, -dv_w0 / 2 - grow]) cube([t + 2 * grow + x_len, 0.01, dv_w0 + 2 * grow]);
    translate([-grow, dv_depth + grow, -dv_w1 / 2 - grow]) cube([t + 2 * grow + x_len, 0.01, dv_w1 + 2 * grow]);
  }
}

// A linking bar in its own frame: x radial (0 its inner face, xbar_t its
// outer), z tangent, y along it from the rear dovetail's tip.
module xbar_local() {
  difference() {
    union() {
      translate([0, dv_depth, -xbar_w / 2]) cube([xbar_t, xbar_len, xbar_w]);
      translate([0, dv_depth, 0]) mirror([0, 1, 0]) dovetail(xbar_t);
      translate([0, dv_depth + xbar_len, 0]) dovetail(xbar_t);
    }
    for (y = [-0.01, xbar_total - pilot_depth + 0.01])
      translate([xbar_t / 2, y, 0]) rotate([-90, 0, 0]) cylinder(d = m5_pilot_d, h = pilot_depth, $fn = 24);
  }
}

module place_xbar(b) {
  translate([b[0], rear_y1 - dv_depth, b[1]]) rotate([0, -b[2], 0]) translate([xbar_r - xbar_t / 2, 0, 0]) children();
}

module xbar(b) { place_xbar(b) xbar_local(); }

// A bar's socket in a plate's face: the dovetail, grown by dv_clear, open
// outward so the bar slides in from outside the ring. at_front: the front
// plate (socket in its back face) or the rear plate (in its front face).
module xbar_socket(b, at_front) {
  place_xbar(b)
    if (at_front) translate([0, dv_depth + xbar_len, 0]) dovetail(xbar_t, dv_clear, 40);
    else translate([0, dv_depth, 0]) mirror([0, 1, 0]) dovetail(xbar_t, dv_clear, 40);
}

// The screw locking a bar: through the plate from its far face into the bar's end.
module xbar_screw(b, at_front) {
  place_xbar(b) translate([xbar_t / 2, 0, 0])
    if (at_front) plate_screw([0, dv_depth + xbar_len + dv_depth, 0], [0, 1, 0], cage_t - dv_depth);
    else plate_screw([0, 0, 0], [0, -1, 0], cage_t - dv_depth);
}

// The plates' shared outline: the lower half of a ring round each reel, up
// to its axle (the cage only cradles the reels halfway up, the user's call),
// and a bar across the rings' bottoms.
module cage_rings_2d() {
  intersection() {
    for (s = [-1, 1]) translate([s * spool_x, shaft_z]) difference() { circle(r = ring_r1, $fn = 128); circle(r = ring_r0, $fn = 128); }
    translate([-500, -500]) square([1000, shaft_z + 500]);
  }
  translate([-pp_x1 - bar_w, shaft_z - ring_r1]) square([2 * (pp_x1 + bar_w), plate_bar_h]);
  // Where the two rings meet, solid enough for the middle bar's socket.
  translate([-xbar_t / 2 - bar_w / 2, shaft_z - xbar_w - 4 - bar_w / 2]) square([xbar_t + bar_w, xbar_w + 4 + bar_w / 2]);
}

// Back plate (the front of the cage): flat on the box's back. Its rings,
// and over the box a frame of its own, with bars along its screw rows, pads
// on the motors' bosses, and a pad for each panel rib's dovetail.
module front_plate() {
  difference() {
    xz_extrude(front_y0, front_y1) {
      cage_rings_2d();
      difference() {
        translate([-bar_half + 2, 2]) square([2 * bar_half - 4, box_h - 4]);
        translate([-bar_half + 2 + bar_w, 2 + bar_w]) square([2 * bar_half - 4 - 2 * bar_w, box_h - 4 - 2 * bar_w]);
      }
      translate([-bar_half + 2, low_post_z - bar_w / 2]) square([2 * bar_half - 4, bar_w]);
      translate([-bar_half + 2, shaft_z - bar_w / 2]) square([2 * bar_half - 4, bar_w]);
      for (s = [-1, 1]) translate([s * spool_x, shaft_z]) circle(d = boss_d + 6, $fn = 64);
      for (s = [-1, 1]) translate([s > 0 ? pp_x0 - bar_w : -pp_x1 - bar_w, pp_z0 - bar_w / 2]) square([cage_t + 2 * bar_w, pp_z1 - pp_z0 + bar_w]);
    }
    for (s = [-1, 1]) translate([s * spool_x, front_y0 - 1, shaft_z]) rotate([-90, 0, 0]) cylinder(d = hub_d + 1, h = cage_t + 2, $fn = 48);
    // Clear of the battery cup and its ears.
    xz_extrude(front_y0 - 1, front_y1 + 1) offset(1) { cup_outline_2d(); cup_ears_2d(); }
    for (b = xbars()) { xbar_socket(b, true); xbar_screw(b, true); }
    for (s = [-1, 1]) { pp_socket(s); pp_screw(s); }
    // Heads on the back face, threads into the box.
    for (p = front_screw_points()) plate_screw([p[0], front_y1, p[1]], [0, -1, 0]);
  }
}

// Outside plate (the rear of the cage): the same rings and bars, with
// spokes to a boss on each reel's axis that its outer axle (an M5 x 25)
// threads into. It goes on last, once the reels are on their shafts.
module rear_plate() {
  difference() {
    xz_extrude(rear_y0, rear_y1) {
      cage_rings_2d();
      // Across each reel at its axle, the cradle's top, and spokes down to the ring.
      for (s = [-1, 1]) translate([s * spool_x, shaft_z]) {
        circle(d = 24, $fn = 48);
        translate([-ring_r0 - 1, -bar_w / 2]) square([2 * ring_r0 + 2, bar_w]);
        for (a = [225, 315]) rotate(a) translate([0, -bar_w / 2]) square([ring_r0 + 1, bar_w]);
      }
    }
    for (s = [-1, 1]) translate([s * spool_x, rear_y1 + 1, shaft_z]) rotate([90, 0, 0]) cylinder(d = m5_pilot_d, h = cage_t + 2, $fn = 32);
    for (b = xbars()) { xbar_socket(b, false); xbar_screw(b, false); }
    // Pilots in the bottom bar for the panel ribs' screws, from below.
    for (s = [-1, 1]) translate([s * (pp_x0 + pp_x1) / 2, (rear_y0 + rear_y1) / 2, pp_z1 - 0.01]) cylinder(d = m5_pilot_d, h = pilot_depth, $fn = 24);
  }
}

// Panel plate (s = +1 right, -1 left; the same piece flipped). In its plane:
// - a rectangle under the reel, from the back plate (dovetailed into a pad
//   on it) to the outside plate, whose bottom bar sits on it between two
//   lugs and is screwed into from below;
// - a top member straight out behind from there to the panel's top edge;
// - a member along the panel, its groove holding the panel's edge;
// - a diagonal crossmember from the rectangle's bottom to the panel's
//   bottom edge.
// A truss, so it's rigid.
pp_z1 = shaft_z - ring_r1;
pp_z0 = pp_z1 - pp_sq_h;
assert(cup_top < pp_z0, "battery cup runs into the panel plates");
pp_r = panel_t / 2 + pp_band;
// The panel's top and bottom edges (mid-thickness), [y, z].
pp_top = [rear_y0 - panel_back - pp_r, pp_z1 - pp_t / 2 - pp_r];
pp_bot = pp_top - panel_h * [cos(panel_tilt), sin(panel_tilt)];
panel_c = concat([0], (pp_top + pp_bot) / 2);

module pp_2d() {
  // The rectangle under the reel.
  translate([rear_y0 - 0.01, pp_z0]) square([front_y0 - rear_y0, pp_sq_h]);
  // Lugs either side of the outside plate's bottom bar.
  for (y = [rear_y0 - pp_lug - slot_clear, rear_y1 + slot_clear]) translate([y, pp_z1 - 0.01]) square([pp_lug, pp_lug]);
  // Top member, out to the panel's top edge.
  hull() {
    translate([rear_y0, pp_z1 - pp_t]) square([0.01, pp_t]);
    translate(pp_top) circle(r = pp_r, $fn = 48);
  }
  // Along the panel.
  hull() for (p = [pp_top, pp_bot]) translate(p) circle(r = pp_r, $fn = 48);
  // Diagonal crossmember, from the rectangle's back bottom corner, behind the battery pod.
  hull() {
    translate([rear_y0, pp_z0]) square([0.01, pp_t]);
    translate(pp_bot) circle(r = pp_r, $fn = 48);
  }
}

// The plate's dovetail socket in the back plate's pad: it slides in from outboard.
module pp_socket(s) {
  translate([s > 0 ? pp_x0 : -pp_x1, front_y0, (pp_z0 + pp_z1) / 2])
    translate([s > 0 ? 0 : cage_t, 0, 0]) mirror([s > 0 ? 0 : 1, 0, 0]) dovetail(cage_t, dv_clear, 40);
}

module pp_screw(s) {
  plate_screw([s * (pp_x0 + pp_x1) / 2, front_y0 + dv_depth, (pp_z0 + pp_z1) / 2], [0, 1, 0], cage_t - dv_depth);
}

// Battery cup: printed on its own and screwed to the box's back, open
// toward the box. The cell drops into it from the front before it goes on;
// the box's back wall closes it, a window there letting the cell's leads in.
// Its rim's tongue goes into the groove round the back wall, like the door.
module battery_cup() {
  difference() {
    union() {
      xz_extrude(-cup_depth, 0) cup_outline_2d();
      xz_extrude(-cage_t, 0) cup_ears_2d();
      // The tongue stands out of the rim's face into the groove.
      cup_tongue_out();
    }
    // The cell's bed, open toward the box.
    translate([0, cell_y, cell_z]) rotate([0, 90, 0]) cylinder(r = cell_r, h = cell_len + 2 * end_clear, center = true, $fn = 96);
    translate([-cell_len / 2 - end_clear, cell_y, cell_z - cell_r]) cube([cell_len + 2 * end_clear, -cell_y + 1, 2 * cell_r]);
    for (e = cup_screws) plate_screw([e[0][0], 0, e[0][1]], [0, -1, 0], cage_t);
  }
}

// The tongue, out of the rim's face (y > 0) into the box's groove.
module cup_tongue_out() {
  steps = 4;
  xz_extrude(-0.01, tongue_len - tongue_lead) cup_seal_band(tongue_w);
  for (i = [0 : steps - 1])
    xz_extrude(tongue_len - tongue_lead * (i + 1) / steps, tongue_len - tongue_lead * i / steps + 0.01)
      cup_seal_band(groove_w - 0.2 + (tongue_w - groove_w + 0.2) * i / steps);
}

// Mast (PCTG): a tube the bulkhead clamps through at its top, standing on a
// flange that screws to the roof, a 45° cone between them. A tongue ring
// under the flange seals in the roof's groove; the bulkhead's O-ring seals
// its top. The coax runs up inside it.
module mast() {
  difference() {
    union() {
      translate([0, 0, box_h]) linear_extrude(mast_flange_t) offset(4) offset(-4) translate(mast_flange[0]) square(mast_flange[1] - mast_flange[0]);
      // The cone, trimmed flat at the back so it clears the back plate's stem.
      intersection() {
        translate([0, antenna_y, box_h + mast_flange_t - 0.01]) cylinder(r1 = mast_r + 8, r2 = mast_r, h = 8, $fn = 96);
        translate([-100, plate_t + 0.5, box_h]) cube([200, 100, 100]);
      }
      translate([0, antenna_y, box_h]) cylinder(r = mast_r, h = mast_h, $fn = 96);
      // Tongue ring, down into the roof's groove.
      translate([0, antenna_y, box_h - tongue_len]) linear_extrude(tongue_len + 0.01)
        difference() { circle(r = mast_seal_r + tongue_w / 2, $fn = 96); circle(r = mast_seal_r - tongue_w / 2, $fn = 96); }
    }
    translate([0, antenna_y, box_h - tongue_len - 1]) cylinder(d = mast_bore, h = mast_h - bulkhead_wall_t + tongue_len + 1, $fn = 96);
    translate([0, antenna_y, mast_top - bulkhead_wall_t - 1]) cylinder(d = n_hole_d, h = bulkhead_wall_t + 2, $fn = 64);
    for (p = mast_screws) plate_screw([p[0], p[1], box_h], [0, 0, 1], mast_flange_t);
  }
}

module panel_plate(s) {
  x0 = s > 0 ? pp_x0 : -pp_x1;
  xc = s * (pp_x0 + pp_x1) / 2;
  difference() {
    union() {
      yz_extrude(x0, x0 + cage_t) pp_2d();
      translate([x0, front_y0, (pp_z0 + pp_z1) / 2]) dovetail(cage_t);
    }
    // The panel's groove, in the plate's inner face.
    on_panel() translate([0, 0, 0]) cube([panel_w + 1, panel_h + 1, panel_t + 0.4], center = true);
    // Pilot in its front end for the back plate's screw.
    translate([xc, front_y0 + dv_depth + 0.01, (pp_z0 + pp_z1) / 2]) rotate([90, 0, 0]) cylinder(d = m5_pilot_d, h = pilot_depth, $fn = 24);
    // Up through the rectangle into the outside plate's bottom bar.
    plate_screw([xc, (rear_y0 + rear_y1) / 2, pp_z1], [0, 0, -1], pp_sq_h);
  }
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

// Cage pieces print flat, each on its widest face, sockets up.
module front_plate_print() { rotate([-90, 0, 0]) front_plate(); }
module rear_plate_print() { rotate([90, 0, 0]) translate([0, -rear_y0, 0]) rear_plate(); }
// Linking bars lie on their inner face, so their dovetails' outlines are in the bed's plane.
module xbar_print() { rotate([0, -90, 0]) xbar_local(); }
// The battery cup prints rim up, its tongue up and its bed open upward.
module battery_cup_print() { rotate([90, 0, 0]) translate([0, cup_depth, 0]) battery_cup(); }
// The mast prints upside down on its top, the flange's cone below it at 45°, the tongue up.
module mast_print() { translate([0, 0, mast_top]) rotate([180, 0, 0]) translate([0, -antenna_y, 0]) mast(); }
// Panel plates print on their outer face, groove up.
module panel_plate_print() { rotate([0, 90, 0]) translate([-pp_x1, 0, 0]) panel_plate(1); }

// Reference hardware, not printed.
module cell() {
  translate([0, cell_y, cell_z]) rotate([0, 90, 0]) cylinder(d = cell_d, h = cell_len, center = true, $fn = 64);
}

module antenna() {
  translate([0, antenna_y, mast_top]) {
    cylinder(r = nut_r, h = 4, $fn = 6);
    translate([0, 0, 4]) cylinder(d = antenna_nut_d, h = antenna_nut_len, $fn = 48);
    translate([0, 0, 4 + antenna_nut_len]) cylinder(d = antenna_d, h = antenna_len, $fn = 48);
  }
  translate([0, antenna_y, mast_top - bulkhead_wall_t - n_body_len]) cylinder(r = nut_r, h = n_body_len, $fn = 6);
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
  on_panel() cube([panel_w, panel_h, panel_t], center = true);
}

module solar_connector() {
  translate([solar_x, front_y + cover_t, solar_z]) rotate([-90, 0, 0]) cylinder(d = 22, h = 3, $fn = 6);
}
