// Meshtastic dry-bag node: a sealed body that winches itself up into a tree.
// A line thrown over branches has both ends tied to two reels, one either
// side of a narrow tower; each reel winds its end in and the node climbs the
// line with no tie line left hanging. Each line leaves its reel through a
// four-roller fairlead on top of the reel's outer edge, which holds it
// centred, so the node hangs from two fixed points, and everything heavy
// sits underneath, balanced under them.
//
// The body (TPU 64D, one piece, sealed) is a tube along X under both reels,
// exactly as deep as they are, with the tower rising between them. The
// tube holds the two worm gearmotors (at its back) and the cell (across its
// middle), and opens at both ends: each end door (PCTG) carries boards. The
// tower's cap carries the antenna's bulkhead and a sled hanging into the
// tower with the radio and the charge board, within the pigtail's 6", with
// room for a 1 W module instead. Every opening seals on a tongue wider than
// the groove round its rim, with M5 x 10 screws in flanges outside the seal;
// every M5 x 10 gets 8 mm of thread.
//
// Each motor's shaft comes out through the back wall (its pinion's hub
// sealed in the TPU) to a pinion, which drives an idler, which drives a gear
// ring on the reel's rear flange. Each reel turns on M5 axles between its
// own front and rear cradle plates (PCTG, flat-pack, full rings tied by
// dovetailed linking bars): the front plate screws flat to the body's front
// face, the rear plate stands off its back behind the gears and carries the
// idler. Towers on both plates carry the fairlead box. The solar panel hangs
// under the body at 45°, facing back, on two panel plates, placed so the
// node hangs level.
//
// Use frame: X across, Z up as it hangs, Y forward. z = 0 is the body's
// bottom, y = 0 its back. Each part's *_print() module puts it in its print
// orientation. Every hole is round: no teardrops.

// BEGIN_PARAMS
// 32140 LiFePO4 cell
cell_d = 32;
cell_len = 140;
// Gap round the cell in its cradle, and past each end for its tab and lead
cell_clear = 0.4;
end_clear = 3;
// The back wall's thickness
plate_t = 6;
// Body walls (TPU 64D), its floor, and the top band over the tube's inside: the floor and top band take the cradle plates' blind pilots
wall = 6;
floor_t = 12;
top_t = 11;
// End doors' thickness, and the tower cap's, PCTG
cover_t = 5;
cap_t = 6;
// Outside corner radius of every opening's rim
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
// Every opening's screws sit in a flange outside the seal: how far out of
// the wall each screw's centre is, the boss's radius round it, and how far
// the flange runs back from the opening
ear_out = 3.5;
ear_r = 6.5;
flange_len = 14;
// N female bulkhead: 5/8-24 UNEF thread, 3/4" hex panel nut; its body and
// O-ring inside, which the tower's top is relieved round
n_thread_d = 15.9;
n_hole_clear = 0.5;
n_nut_af = 19.05;
n_body_d = 24;
n_body_len = 15;
// Antenna radome and its N male coupling nut
antenna_d = 22;
antenna_len = 180;
antenna_nut_d = 21.5;
antenna_nut_len = 20;
// Stem up the antenna from the tower's cap, with a saddle and zip-tie slots
stem_len = 40;
saddle_w = 6;
tie_w = 6;
tie_t = 2.5;
// The tower between the reels: its inside width (room for a 1 W radio
// module), and how far its top stands above the reels' tops
tower_in_w = 46;
tower_above = 12;
// Radio: XIAO nRF52840 + Wio-SX1262 stack, on the sled under the tower's
// cap; and the room kept free on the sled for a 1 W module, [w, h]
kit_w = 22;
kit_h = 24;
kit_t = 12;
radio_room = [40, 70];
// Boards: the charge board on the sled, the others on the end doors' insides: [w, h, thickness]
board_dims = [39, 44, 9];
bms_dims = [50, 25, 4];
mcu_dims = [18, 21, 6];
drv_dims = [19, 17, 5];
// Pocket round each board: clearance, and the rim's width and height
pocket_clear = 0.5;
rim_w = 2;
rim_h = 3;
// The sled hanging from the cap into the tower: thickness and height
sled_t = 4;
sled_h = 100;
// The user's 5/8" watertight connector for the solar panel, through the left end door
solar_hole_d = 15.875 + 0.4;
// Each motor sits on a pad this high, so its gearbox clears the floor
mot_lift = 1.5;
// Winch motors: JGY-370 worm gearmotor lying along X at the tube's back, its
// output shaft out through the back wall (not measured): length along X,
// depth from its output face, height, and how far in from its outer end the
// shaft is
mot_len = 75;
mot_d = 26;
mot_h = 32;
mot_shaft_in = 16;
// Its D-shaft: diameter, across the flat, length past the output face. The
// pinion's grub screw on the flat pulls the motor's face against the back wall.
shaft_d = 6;
shaft_flat = 5;
shaft_len = 14;
// Drive: gear module, teeth on the pinion, the idler and the reel's ring,
// and the gears' face width (the reel's rear flange is that thick)
gear_m = 2;
pinion_z = 12;
idler_z = 14;
ring_z = 56;
gear_w = 6;
// Pinion's hub through the back wall; the TPU hole is this much tighter, as a lip seal
hub_d = 12;
hub_seal = 0.4;
// Reels for 150-200 ft of 1/8" Dacron: plain front flange diameter, core,
// length between flanges, front flange thickness; gap from the gear ring to the tower
spool_od = 112;
spool_core_d = 30;
spool_len = 72;
spool_flange_t = 4;
// The front flange is its own disc, keyed onto a hex spigot on the core's end (across flats), so the reel prints without overhangs
spigot_af = 20;
spool_tower_gap = 4;
// The line's end wedges into a V jam cleat in the core by the front flange
cleat_mouth = 8;
cleat_throat = 2.4;
cleat_depth = 12;
cleat_len = 10;
// M5 bolts as the reel's axles, threaded 8 mm into its cradle plates; the reel turns on their shanks
axle_d = 5.4;
// Cradle plates (PCTG): thickness, bar width, the rings' gap to the reel and
// width, and the clearance round tabs and dovetails
cage_t = 8;
bar_w = 10;
ring_gap = 3;
ring_w = 10;
cage_gap = 1;
slot_clear = 0.3;
// Linking bars between each reel's plates, round the whole ring: width
// (along the ring), thickness (across it), and their angles out from the
// reel's axis (right reel; the left mirrors). None on the tower's side,
// where it would run into the tower.
xbar_w = 16;
xbar_t = 8;
xbar_angles = [0, 50, 130, -50, -130];
// Dovetails on the bars' ends: depth, width at the shoulder and the tip, clearance
dv_depth = 3.5;
dv_w0 = 10;
dv_w1 = 14;
dv_clear = 0.25;
// Rear plates stand off the tube's back on posts into its floor and top band, at these x from the reel's axis
standoff_d = 14;
standoff_dx = [-26, 24];
// Roller fairlead on top of each reel's outer edge: four rollers round a
// square window the line runs through (1/8" line); how far its window is in
// from the reel's edge, and how far its lower rollers are above the reel's top
roller_d = 26;
line_gap = 4.5;
fl_in = 7;
fairlead_above = 10;
// Each roller is two print-in-place roller bearings back to back on its
// bolt: a hub, the sleeve, and pins between them whose 45° collar runs in a
// V groove in both, so all three start on the bed and nothing overhangs past
// 45°. The hub's radius, the pins' radius, their collar's height, how many,
// and the gap round them (0.2-0.3 mm is what people print these at). Run
// them with silicone oil.
pip_hub_r = 5.5;
pip_rn = 1.75;
pip_b = 1.0;
pip_n = 7;
pip_c = 0.25;
// Solar panel (5 V 3 W, not measured), hung under the body at panel_tilt,
// facing back and up; panel_y is where its centre sits front to back, set
// so the node hangs level
panel_w = 145;
panel_h = 120;
panel_t = 3;
panel_tilt = 45;
panel_y = -42;
// Panel plates: thickness, members' width, how deep the panel's edge sits
// in each groove, and the material either side of the panel along it
pp_t = 12;
pp_groove = 4;
pp_band = 8;
corner_r = 4;
// Body length along X: inside the reels' span, and short enough for the U1's 270 mm bed
cup_half = 133;
// END_PARAMS

function pw(w) = w + 2 * pocket_clear;
// Every M5 x 10 threads thread_len in; its pilot runs 1 mm deeper.
pilot_depth = thread_len + 1;
under_head = screw_len - thread_len;
cell_r = cell_d / 2 + cell_clear;

function pitch_r(z) = gear_m * z / 2;
function tip_r(z) = gear_m * (z + 2) / 2;

// The tower's outside half width, and each reel beside it, its gear ring
// spool_tower_gap clear of it.
tw_half = tower_in_w / 2 + wall;
spool_x = tw_half + spool_tower_gap + tip_r(ring_z);

// The tube, along X under both reels: its floor, its inside (as tall as the
// motors and the cell need), and the top band over it.
cup_in_h = max(mot_lift + mot_h + 1.5, 1 + 2 * cell_r + 1);
ceiling = floor_t + cup_in_h;
cup_top = ceiling + top_t;

// Gear train, in a vertical line behind the back wall: the pinion on the
// motor's shaft, the idler over it, the reel's ring over that.
pinion_c = [spool_x, floor_t + mot_lift + mot_h / 2];
idler_c = pinion_c + [0, pitch_r(pinion_z) + pitch_r(idler_z)];
shaft_z = idler_c[1] + pitch_r(idler_z) + pitch_r(ring_z);
gear_y1 = -1;
gear_y0 = gear_y1 - gear_w;

// Each motor lies along X at the tube's back, its output face on the back
// wall and its shaft on the pinion's axis. It slides in from its end with
// its shaft clear of the wall, then back onto the pinion's hub.
mot_x0 = spool_x + mot_shaft_in - mot_len;
mot_x1 = spool_x + mot_shaft_in;
mot_y1 = plate_t + mot_d;
mot_z0 = floor_t + mot_lift;

// The cell lies along X in front of the motors, in V cradles. It slides in
// from the right end against a stop at the left; the right door's post holds it.
cell_y = mot_y1 + 3 + cell_r;
cell_z = floor_t + 1 + cell_r;
cradle_h = 10;
cradle_xs = [-25, 25];
cell_end = cell_len / 2 + end_clear;

// The reel, behind to front: its gear ring (the rear flange), the drum, the
// front flange. The body is exactly as deep: the front plate lies flat on
// its front face, the rear plate stands off its back behind the gears.
drum_y0 = gear_y1;
drum_y1 = drum_y0 + spool_len;
drum_top = shaft_z + spool_od / 2;
front_y = drum_y1 + spool_flange_t + cage_gap;
front_y0 = front_y;
front_y1 = front_y0 + cage_t;
rear_y1 = gear_y0 - cage_gap;
rear_y0 = rear_y1 - cage_t;
// The line runs centred between the plates, at the drum's middle.
line_y = (rear_y1 + front_y0) / 2;
ring_r0 = spool_od / 2 + ring_gap;
ring_r1 = ring_r0 + ring_w;
tower_top = drum_top + tower_above;

// The openings: each end of the tube, and the tower's top. Each seals on a
// tongue in a groove round its rim, with screws in flanges outside it.
r_c = box_corner_r;
seal_inset = wall / 2;
flange_h = ear_out + ear_r;
// End doors' screws, [y, z]: along the top and bottom flanges.
end_screw_ys = [ear_r + 2, front_y / 2, front_y - ear_r - 2];
end_screws = [for (y = end_screw_ys, z = [cup_top + ear_out, -ear_out]) [y, z]];
// The antenna's bulkhead in the cap, the sled hanging under it, and the
// stem on the cap behind the antenna.
antenna_y = line_y;
sled_y0 = antenna_y + n_body_d / 2 + 1;
sled_hw = tower_in_w / 2 - 1;
sled_z0 = tower_top - sled_h;
stem_y0 = antenna_y + antenna_d / 2 + 2;
stem_y1 = stem_y0 + cage_t;
stem_foot_h = 10;
// Cap screws, [x, y]: along the tower's two side flanges. The pair at
// stem_y go through the stem's feet too.
stem_screw_y = stem_y1 - 7;
cap_screw_ys = [ear_r + 2, (ear_r + 2 + stem_screw_y) / 2, stem_screw_y, front_y - ear_r - 2];
cap_screws = [for (sx = [-1, 1], y = cap_screw_ys) [sx * (tw_half + ear_out), y]];

n_hole_d = n_thread_d + n_hole_clear;
nut_r = n_nut_af / sqrt(3);
bulkhead_bottom = tower_top - n_body_len;

// Boards. On the sled, [x0, z0, x1, z1]: the radio kit at its top on the back
// face, under the bulkhead; the charge board at its foot on the front face.
// The rest of the back face is room for a 1 W module instead of the kit.
kit_top = bulkhead_bottom - 2;
kit_pocket = [-pw(kit_w) / 2, kit_top - pw(kit_h), pw(kit_w) / 2, kit_top];
charge_pocket = [-pw(board_dims[0]) / 2, sled_z0 + 2, pw(board_dims[0]) / 2, sled_z0 + 2 + pw(board_dims[1])];
// On the end doors' insides, [y0, z0, y1, z1]: the protection board on the
// left; the winch XIAO and the motor driver on the right, beside the cell's post.
door_z0 = floor_t + 2;
bms_pocket = [wall + 2, door_z0, wall + 2 + pw(bms_dims[0]), door_z0 + pw(bms_dims[1])];
mcu_pocket = [wall + 2, door_z0, wall + 2 + pw(mcu_dims[0]), door_z0 + pw(mcu_dims[1])];
drv_pocket = [mcu_pocket[2] + 2 * rim_w + 1, door_z0, mcu_pocket[2] + 2 * rim_w + 1 + pw(drv_dims[0]), door_z0 + pw(drv_dims[1])];
post_c = [cell_y + cell_r - 6, cell_z];
post_d = 10;
// Solar connector through the tower's front wall, over the charge board.
solar_c = [0, charge_pocket[3] + 20];

// Rear plates' posts into the back wall, [x, z] (right reel): into the floor
// and into the top band.
standoff_pts = [for (dx = standoff_dx, z = [standoff_d / 2, ceiling + top_t / 2]) [spool_x + dx, z]];
// Front plates' screws into the front wall's floor and top band, [x, z].
face_screws = [for (x = [spool_x - 46, spool_x, cup_half - 11], z = [floor_t / 2, ceiling + top_t / 2]) [x, z]];

// Linking bars round each ring.
xbar_r = (ring_r0 + ring_r1) / 2;
xbar_len = front_y0 - rear_y1;
xbar_total = xbar_len + 2 * dv_depth;

// The fairlead box (right reel), round a window at [fl_xc, line_y]: two
// cheeks either side, carrying the lower pair of rollers (axes along X,
// which centre the line front to back); two spacers front and back,
// carrying the upper pair (axes along Y, which hold it side to side). The
// cheeks dovetail into towers on the two cradle plates.
fl_xc = spool_x + spool_od / 2 - fl_in;
roff = line_gap / 2 + roller_d / 2;
roller_len = 2 * (roff + roller_d / 2) + 1;
fl_gap = roller_len / 2;
fl_za = drum_top + fairlead_above + roller_d / 2;
fl_zb = fl_za + roller_d + 2;
fl_x0 = fl_xc - fl_gap - cage_t;
fl_x1 = fl_xc + fl_gap + cage_t;
fl_z0 = fl_za - roller_d / 2 - 8;
fl_z1 = fl_zb + roller_d / 2 + 8;
sp_z0 = fl_zb - roller_d / 2 - 6;
sp_z1 = fl_zb + roller_d / 2 + 6;

// Panel plates sit just outside the panel's side edges, its edges in their
// grooves. Each one's top member runs under the floor, screwed up into it.
pp_x0 = panel_w / 2 + 0.5 - pp_groove;
pp_x1 = pp_x0 + cage_t;
pp_r = panel_t / 2 + pp_band;
pp_ya = plate_t;
pp_yb = front_y - wall;
pp_screw_ys = [pp_ya + 8, (pp_ya + pp_yb) / 2, pp_yb - 8];
// The panel's high and low edges (mid-thickness), [y, z].
pp_hi = [panel_y + panel_h / 2 * cos(panel_tilt), -pp_t / 2 - pp_r];
pp_lo = pp_hi - panel_h * [cos(panel_tilt), sin(panel_tilt)];
panel_c = [0, (pp_hi[0] + pp_lo[0]) / 2, (pp_hi[1] + pp_lo[1]) / 2];

stem_half = antenna_d / 2 + 0.5 + tie_t + 3;
cap_top = tower_top + cap_t;
saddle_z = cap_top + 4 + antenna_nut_len + saddle_w / 2 + 1;
tie_zs = [saddle_z - saddle_w / 2 - tie_w / 2 - 2, saddle_z + saddle_w / 2 + tie_w / 2 + 2];
stem_top = tie_zs[1] + tie_w / 2 + 3;

pip_rc = pip_hub_r + pip_c + pip_rn;
pip_ro = pip_rc + pip_rn + pip_c;
pip_h = roller_len / 2;

assert(tongue_w > groove_w && tongue_len < groove_depth, "the tongue must be wider than the groove and stop short of its floor");
assert((wall - groove_w) / 2 >= 2, "too little TPU either side of the groove");
assert(ear_out - m5_pilot_d / 2 + seal_inset - groove_w / 2 >= 2.5, "screw pilots too close to the groove");
assert(cover_t > under_head && cage_t > under_head, "a part is thinner than the screws' under-head length");
assert(cage_t >= thread_len, "cradle plates too thin for the axles' 8 mm of thread");
assert(2 * cup_half <= 268, "body doesn't fit the U1's 270 mm bed");
assert(cup_half < spool_x + spool_od / 2, "the body is wider than the reels");
assert(mot_x0 > tower_in_w / 2 - 20 && mot_x1 + 2 * mot_len / 3 < 2 * cup_half, "motor doesn't fit its end of the tube");
assert(mot_z0 + mot_h < ceiling, "motor is taller than the tube's inside");
assert(cell_z + cell_r < ceiling && cell_y + cell_r < front_y - wall, "cell doesn't fit the tube");
assert(mot_y1 + shaft_len < front_y - wall, "motor can't slide in with its shaft clear of the back wall");
for (dx = standoff_dx) assert(norm([dx, ceiling + top_t / 2 - idler_c[1]]) > tip_r(idler_z) + standoff_d / 2 + 1, "idler runs into a rear plate's post");
assert(shaft_z - tip_r(ring_z) > ceiling + top_t / 2 + standoff_d / 2, "gear ring runs into the rear plate's posts");
assert(shaft_z - sqrt(pow(spool_od / 2, 2) - pow(cup_half - flange_len - spool_x, 2)) > cup_top + flange_h + 2, "reel's bottom runs into the end flanges");
assert(shaft_z - spool_od / 2 > cup_top + 2, "reel's bottom runs into the tube");
assert(fl_z0 > shaft_z + sqrt(pow(spool_od / 2, 2) - pow(max(0, fl_x0 + cage_t - spool_x), 2)) + 2, "fairlead box runs into the reel");
assert(kit_top - sled_z0 >= radio_room[1] && 2 * sled_hw >= radio_room[0], "no room left on the sled for a 1 W module");
assert(tower_top - kit_pocket[1] < 152 - 60, "radio kit is out of the 6\" pigtail's reach");
assert(drv_pocket[2] + rim_w < post_c[0] - post_d / 2 - 1, "motor driver runs into the cell's post");
assert(bms_pocket[2] < front_y - wall && bms_pocket[3] < ceiling, "protection board doesn't fit the left door");
assert(pp_x1 < cup_half - 10, "panel plates aren't under the floor");
assert(floor_t > pilot_depth + 2, "floor too thin for the panel plates' pilots");
assert(tw_half - nut_r > ear_r, "bulkhead nut crowds the cap's flanges");
assert(pip_hub_r - pip_b - pip_c - axle_d / 2 >= 1.5 && roller_d / 2 - pip_ro - pip_b >= 1.5, "roller bearing's races too thin");
assert(2 * PI * pip_rc / pip_n > 2 * (pip_rn + pip_b) + 0.6, "too many roller pins for the bearing's circle");

// Round hole along Z. Holes are round everywhere, no teardrops (the user's call).
module tear_2d(d, y_max = 1e9) {
  circle(d = d);
}

// A 2D shape in the XZ plane (its y is z), extruded through y0..y1.
module xz_extrude(y0, y1) {
  translate([0, y1, 0]) rotate([90, 0, 0]) linear_extrude(y1 - y0) children();
}

// A 2D shape in the YZ plane (its x is y, its y is z), extruded through x0..x1.
module yz_extrude(x0, x1) {
  translate([x0, 0, 0]) rotate([90, 0, 90]) linear_extrude(x1 - x0) children();
}

// A cylinder along Y at [x, z], from y0 to y1.
module y_cyl(c, y0, y1, d, fn = 48) {
  translate([c[0], y0, c[1]]) rotate([-90, 0, 0]) cylinder(d = d, h = y1 - y0, $fn = fn);
}

// A cylinder along X at [y, z], from x0 to x1.
module x_cyl(c, x0, x1, d, fn = 48) {
  translate([x0, c[0], c[1]]) rotate([0, 90, 0]) cylinder(d = d, h = x1 - x0, $fn = fn);
}

// Involute spur gear, gear_m module, 20° pressure angle, a little backlash.
module gear_2d(z) {
  rp = pitch_r(z);
  rb = rp * cos(20);
  ra = rp + gear_m;
  rf = rp - 1.25 * gear_m;
  up = sqrt(pow(rp / rb, 2) - 1);
  ua = sqrt(pow(ra / rb, 2) - 1);
  half = 90 / z + (up * 180 / PI - atan(up)) - 0.08 / rp * 180 / PI;
  n = 8;
  flank = [for (i = [0 : n]) let(u = ua * i / n, a = half - (u * 180 / PI - atan(u))) rb * sqrt(1 + u * u) * [cos(a), sin(a)]];
  circle(r = rf, $fn = 4 * z);
  for (k = [0 : z - 1]) rotate(k * 360 / z)
    polygon(concat([[0, 0]], flank, [for (i = [n : -1 : 0]) [flank[i][0], -flank[i][1]]]));
}

// A screw through a plate: p on the face its thread comes out of, n pointing
// back toward its head. Counterbored so under_head is left under the head.
module plate_screw(p, n, t = cage_t) {
  translate(p) rotate(n == [0, 1, 0] ? [-90, 0, 0] : n == [0, -1, 0] ? [90, 0, 0] : n == [0, 0, 1] ? [0, 0, 0] : n == [1, 0, 0] ? [0, 90, 0] : n == [-1, 0, 0] ? [0, -90, 0] : [180, 0, 0]) {
    translate([0, 0, -1]) cylinder(d = m5_clear_d, h = t + 2, $fn = 32);
    translate([0, 0, under_head]) cylinder(d = m5_head_d, h = t, $fn = 32);
  }
}

module rounded_rect(p0, p1, r) {
  offset(r) offset(-r) translate(p0) square(p1 - p0);
}

module seal_band_of(w) {
  difference() {
    offset(w / 2) offset(-seal_inset) children();
    offset(-w / 2) offset(-seal_inset) children();
  }
}

// The tube's end, seen along X: its rim, and the flanges along its top and
// bottom that the door screws into. Their outer corners are cut at 45°, so
// they print (back face down) without a shelf.
module end_outline_2d() { rounded_rect([0, 0], [front_y, cup_top], r_c); }
module flange_2d(z0, h) {
  c = ear_r;
  polygon([[0, z0], [front_y, z0], [front_y, z0 + h - c], [front_y - c, z0 + h], [c, z0 + h], [0, z0 + h - c]]);
}
module end_flanges_2d() {
  flange_2d(cup_top - 0.01, flange_h + 0.01);
  mirror([0, 1]) flange_2d(-0.01, flange_h + 0.01);
}

// The tower's top, seen from above, and the flanges either side the cap screws into.
module tower_outline_2d() { rounded_rect([-tw_half, 0], [tw_half, front_y], r_c); }
module tower_flanges_2d() {
  c = ear_r;
  for (sx = [-1, 1]) mirror([sx < 0 ? 1 : 0, 0])
    polygon([[tw_half - 0.01, 0], [tw_half + flange_h - c, 0], [tw_half + flange_h, c], [tw_half + flange_h, front_y - c], [tw_half + flange_h - c, front_y], [tw_half - 0.01, front_y]]);
}

// A rim round a pocket, its two sides only: a rim across a face that
// prints vertical would print as a shelf. Drawn in the pocket's plane; the
// caller extrudes it.
module side_rims_2d(p) {
  for (x = [p[0] - rim_w, p[2]]) translate([x, p[1] - rim_w]) square([rim_w, p[3] - p[1] + 2 * rim_w]);
}

module tube() {
  difference() {
    union() {
      yz_extrude(-cup_half, cup_half) end_outline_2d();
      translate([0, 0, cup_top - 1]) linear_extrude(tower_top - cup_top + 1) tower_outline_2d();
      // Fillets where the tower meets the tube's top.
      for (sx = [-1, 1]) mirror([sx < 0 ? 1 : 0, 0, 0])
        xz_extrude(0, front_y) polygon([[tw_half - 1, cup_top - 1], [tw_half + r_c, cup_top - 0.01], [tw_half - 1, cup_top + r_c + 1]]);
      for (sx = [-1, 1]) mirror([sx < 0 ? 1 : 0, 0, 0]) {
        yz_extrude(cup_half - flange_len, cup_half) end_flanges_2d();
      }
      translate([0, 0, tower_top - flange_len]) linear_extrude(flange_len) tower_flanges_2d();
    }
    translate([-cup_half - 1, wall, floor_t]) cube([2 * cup_half + 2, front_y - 2 * wall, cup_in_h]);
    translate([-tower_in_w / 2, wall, floor_t]) cube([tower_in_w, front_y - 2 * wall, tower_top]);
  }
}

// Each motor: on a pad, against a rim at its inner end, both growing off the
// back wall. The pinion's grub screw pulls it onto the back wall.
module motor_seats() {
  for (s = [-1, 1]) mirror([s < 0 ? 1 : 0, 0, 0]) {
    translate([mot_x0, plate_t - 0.01, floor_t - 0.01]) cube([mot_len, mot_d - 4, mot_lift + 0.01]);
    translate([mot_x0 - rim_w, plate_t - 0.01, floor_t - 0.01]) cube([rim_w, mot_d, mot_lift + 8]);
  }
}

// The cell's V cradles: 45° faces, which print without support. Its stop at
// the left hangs from the top band, above where the left motor slides past,
// its underside (as it prints) at 45°.
module cell_cradles() {
  zv = cell_z - cell_r * sqrt(2);
  top = floor_t + cradle_h;
  yl = cell_y - (top - zv);
  yr = cell_y + (top - zv);
  for (x = cradle_xs)
    translate([x - 3, 0, 0]) rotate([90, 0, 90]) linear_extrude(6) {
      polygon([[yl - cradle_h, floor_t - 0.01], [yl, top], [cell_y - (floor_t - zv), floor_t - 0.01]]);
      polygon([[cell_y + (floor_t - zv), floor_t - 0.01], [yr, top], [yr + 3, top], [yr + 3, floor_t - 0.01]]);
    }
  y0 = mot_y1 + shaft_len + 1;
  translate([-cell_end - 4, 0, 0]) rotate([90, 0, 90]) linear_extrude(4)
    polygon([[y0, ceiling + 0.01], [y0 + (ceiling - cell_z), cell_z], [front_y - wall + 0.01, cell_z], [front_y - wall + 0.01, ceiling + 0.01]]);
}

module frame() {
  difference() {
    union() {
      tube();
      motor_seats();
      cell_cradles();
    }
    // Grooves round the ends and the tower's top, and their screws' pilots.
    for (sx = [-1, 1]) mirror([sx < 0 ? 1 : 0, 0, 0]) {
      yz_extrude(cup_half - groove_depth, cup_half + 1) seal_band_of(groove_w) end_outline_2d();
      for (p = end_screws) x_cyl(p, cup_half - pilot_depth, cup_half + 1, m5_pilot_d, 24);
    }
    translate([0, 0, tower_top - groove_depth]) linear_extrude(groove_depth + 1) seal_band_of(groove_w) tower_outline_2d();
    for (p = cap_screws) translate([p[0], p[1], tower_top - pilot_depth]) cylinder(d = m5_pilot_d, h = pilot_depth + 1, $fn = 24);
    // Solar connector through the tower's front wall: round, as the user asked.
    y_cyl(solar_c, front_y - wall - 1, front_y + 1, solar_hole_d, 64);
    for (s = [-1, 1]) mirror([s < 0 ? 1 : 0, 0, 0]) {
      // Pinion hubs through the back wall: a tight hole, so the TPU seals round them.
      y_cyl(pinion_c, -1, plate_t + 1, hub_d - hub_seal);
      // Pilots for the rear plates' posts, and the front plates' screws.
      for (p = standoff_pts) y_cyl(p, -1, pilot_depth, m5_pilot_d, 24);
      for (p = face_screws) y_cyl(p, front_y - pilot_depth, front_y + 1, m5_pilot_d, 24);
      // Pilots up into the floor for the panel plates.
      for (y = pp_screw_ys) translate([(pp_x0 + pp_x1) / 2, y, -1]) cylinder(d = m5_pilot_d, h = pilot_depth + 1, $fn = 24);
    }
  }
}

// The tongue's tip starts narrower than the groove and widens to full width
// over tongue_lead, in steps, so it leads itself in. Drawn standing on z = 0
// down to z = -tongue_len; the caller places it.
module tongue_z() {
  steps = 4;
  translate([0, 0, -(tongue_len - tongue_lead)]) linear_extrude(tongue_len - tongue_lead + 0.01) seal_band_of(tongue_w) children();
  for (i = [0 : steps - 1])
    translate([0, 0, -tongue_len + tongue_lead * i / steps]) linear_extrude(tongue_lead / steps + 0.01)
      seal_band_of(groove_w - 0.2 + (tongue_w - groove_w + 0.2) * i / steps) children();
}

// End door (s = +1 right, -1 left). The right one carries the winch XIAO,
// the motor driver and the post that holds the cell against its stop; the
// left one the protection board.
module end_door(s = 1) {
  mirror([s < 0 ? 1 : 0, 0, 0])
    difference() {
      union() {
        yz_extrude(cup_half, cup_half + cover_t) { end_outline_2d(); end_flanges_2d(); }
        translate([cup_half, 0, 0]) rotate([90, 0, 90]) tongue_z() end_outline_2d();
        translate([cup_half - rim_h, 0, 0]) rotate([90, 0, 90]) linear_extrude(rim_h + 0.01)
          for (p = s > 0 ? [mcu_pocket, drv_pocket] : [bms_pocket]) side_rims_2d(p);
        if (s > 0) x_cyl(post_c, cell_end + 0.5, cup_half + 0.01, post_d, 32);
      }
      for (p = end_screws) plate_screw([cup_half, p[0], p[1]], [1, 0, 0], cover_t);
    }
}

// Tower cap: the bulkhead clamps through it, and the sled hangs from it with
// the radio and the charge board, so they come out together and the
// pigtail never has to stretch.
module tower_cap() {
  difference() {
    union() {
      translate([0, 0, tower_top]) linear_extrude(cap_t) { tower_outline_2d(); tower_flanges_2d(); }
      translate([0, 0, tower_top]) tongue_z() tower_outline_2d();
      translate([-sled_hw, sled_y0, sled_z0]) cube([2 * sled_hw, sled_t, sled_h + 0.01]);
      xz_extrude(sled_y0 - rim_h, sled_y0 + 0.01) side_rims_2d(kit_pocket);
      xz_extrude(sled_y0 + sled_t - 0.01, sled_y0 + sled_t + rim_h) side_rims_2d(charge_pocket);
    }
    translate([0, antenna_y, tower_top - 1]) cylinder(d = n_hole_d, h = cap_t + 2, $fn = 64);
    for (p = cap_screws)
      if (p[1] == stem_screw_y) translate([p[0], p[1], tower_top - 1]) cylinder(d = m5_clear_d, h = cap_t + 2, $fn = 32);
      else plate_screw([p[0], p[1], tower_top], [0, 0, 1], cap_t);
  }
}

// Antenna stem: on the cap behind the antenna, its feet on the cap's flanges
// held by the cap's screws there (M5 x 16), with a saddle round the
// antenna above its coupling nut and zip-tie slots either side.
module stem() {
  difference() {
    union() {
      xz_extrude(stem_y0, stem_y1) {
        translate([-(tw_half + flange_h), cap_top]) square([2 * (tw_half + flange_h), stem_foot_h]);
        hull() {
          translate([-stem_half, cap_top]) square([2 * stem_half, 0.01]);
          translate([-stem_half, stem_top - corner_r]) square([2 * stem_half, corner_r]);
        }
        for (sx = [-1, 1]) hull() {
          translate([sx > 0 ? stem_half - 1 : -stem_half - 9, cap_top]) square([10, stem_foot_h]);
          translate([sx > 0 ? stem_half - 1 : -stem_half + 0, cap_top + stem_foot_h + 20]) square([1, 1]);
        }
      }
      for (sx = [-1, 1]) translate([sx * (tw_half + ear_out) - 7, stem_y1 - 14, cap_top]) cube([14, 14, stem_foot_h]);
      difference() {
        translate([-antenna_d / 2 - 3.5, antenna_y, saddle_z - saddle_w / 2]) cube([antenna_d + 7, stem_y0 - antenna_y + 0.01, saddle_w]);
        translate([0, antenna_y, saddle_z]) cylinder(r = antenna_d / 2 + 0.4, h = saddle_w + 2, center = true, $fn = 96);
      }
    }
    for (sx = [-1, 1]) plate_screw([sx * (tw_half + ear_out), stem_screw_y, cap_top], [0, 0, 1], stem_foot_h);
    for (side = [-1, 1], z = tie_zs)
      translate([side * (antenna_d / 2 + 0.5 + tie_t / 2) - tie_t / 2, stem_y0 - 1, z - tie_w / 2]) cube([tie_t, cage_t + 2, tie_w]);
  }
}

// Reel (right side), axis Y at (spool_x, shaft_z). Its rear flange is the
// gear ring the idler drives; the front flange is a separate disc keyed on
// the core's hex spigot, held on by the front plate. It turns on M5 bolts
// threaded into the plates either side, their tips in its bore. The line's
// end wedges into a V jam cleat at the core's front end, under the flange.
module spool() {
  c = [spool_x, shaft_z];
  difference() {
    union() {
      xz_extrude(gear_y0, gear_y1) translate(c) gear_2d(ring_z);
      y_cyl(c, gear_y0, drum_y1, spool_core_d, 64);
      xz_extrude(drum_y1 - 0.01, drum_y1 + spool_flange_t - 0.2) translate(c) circle(d = spigot_af / cos(30), $fn = 6);
    }
    y_cyl(c, gear_y0 - 1, drum_y1 + spool_flange_t + 1, axle_d, 32);
    xz_extrude(drum_y1 - cleat_len, drum_y1 + spool_flange_t + 1) translate(c)
      polygon([[spool_core_d / 2 + 1, -cleat_mouth / 2], [spool_core_d / 2 + 1, cleat_mouth / 2],
               [spool_core_d / 2 - cleat_depth, cleat_throat / 2], [spool_core_d / 2 - cleat_depth, -cleat_throat / 2]]);
  }
}

module reel_flange() {
  xz_extrude(drum_y1, drum_y1 + spool_flange_t) translate([spool_x, shaft_z])
    difference() {
      circle(d = spool_od, $fn = 128);
      circle(d = spigot_af / cos(30) + 0.5, $fn = 6);
    }
}

// Pinion on the motor's D-shaft: its gear behind the back wall, its hub
// through the wall's lip seal. An M3 grub screw from the root between two
// teeth, on the shaft's flat, holds it and pulls the motor onto the wall.
module pinion() {
  grub = 180 / pinion_z;
  difference() {
    union() {
      xz_extrude(gear_y0, gear_y1) translate(pinion_c) gear_2d(pinion_z);
      y_cyl(pinion_c, gear_y1 - 0.01, plate_t - 0.5, hub_d);
    }
    xz_extrude(gear_y0 - 1, plate_t) translate(pinion_c) rotate(grub)
      intersection() {
        circle(d = shaft_d + 0.15, $fn = 32);
        translate([-shaft_d / 2 - 0.1, -shaft_d]) square([shaft_flat + 0.15, 2 * shaft_d]);
      }
    translate([pinion_c[0], (gear_y0 + gear_y1) / 2, pinion_c[1]]) rotate([0, -grub, 0]) rotate([0, 90, 0]) cylinder(d = 2.5, h = pitch_r(pinion_z), $fn = 16);
  }
}

// Idler: turns on an M5 x 16 threaded through the rear plate.
module idler() {
  xz_extrude(gear_y0, gear_y1) translate(idler_c)
    difference() { gear_2d(idler_z); circle(d = axle_d + 0.1, $fn = 32); }
}

// Linking bars round each reel's ring: [x, z, a], a the angle out from the
// reel's axis. Their dovetails slide into the plates' sockets from outside.
function xbars() = [for (s = [-1, 1], a = xbar_angles) [s * spool_x, shaft_z, s > 0 ? a : 180 - a]];

// Dovetail tenon on a bar's end, drawn as the bar's local frame has it: x
// across the bar's thickness (the way it slides into its socket), z across
// its width, y along it from the shoulder at 0 out to the tip at dv_depth.
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

// A tenon's socket in a plate, in the bar's frame: the dovetail grown by
// dv_clear, running x_len outward so the piece slides in from outside; and
// the screw through the plate into the piece's end. at_front: the front
// plate (socket in its back face) or the rear plate (in its front face).
module socket_local(at_front, x_len = 40) {
  if (at_front) translate([0, dv_depth + xbar_len, 0]) dovetail(xbar_t, dv_clear, x_len);
  else translate([0, dv_depth, 0]) mirror([0, 1, 0]) dovetail(xbar_t, dv_clear, x_len);
}
module lock_screw_local(at_front) {
  translate([xbar_t / 2, 0, 0])
    if (at_front) plate_screw([0, xbar_total, 0], [0, 1, 0], cage_t - dv_depth);
    else plate_screw([0, 0, 0], [0, -1, 0], cage_t - dv_depth);
}

// Where each fairlead cheek sits (right reel), in the bar frame: its inner
// face at x, the frame's origin at the rear dovetail's tip.
module place_cheek(x0) { translate([x0, rear_y1 - dv_depth, 0]) children(); }
cheek_x0s = [fl_x0, fl_xc + fl_gap];

// Everything one cradle plate takes from the bars and cheeks.
module plate_joints(at_front) {
  for (b = xbars()) if (b[0] > 0) place_xbar(b) { socket_local(at_front); lock_screw_local(at_front); }
  for (x = cheek_x0s, z = [fl_za, fl_zb]) place_cheek(x) translate([0, 0, z]) {
    socket_local(at_front, fl_x1 + 10 - x);
    lock_screw_local(at_front);
  }
}

// What both cradle plates share (right reel): a ring all the way round the
// reel (the user: with rollers on top, "that truss thing all the way around
// each of the spools"), a bar across it at the axle round a boss, four
// spokes, and a tower from its outer top quarter up to the fairlead box.
module cradle_2d() {
  translate([spool_x, shaft_z]) {
    difference() { circle(r = ring_r1, $fn = 128); circle(r = ring_r0, $fn = 128); }
    circle(d = 24, $fn = 48);
    translate([-ring_r0 - 1, -bar_w / 2]) square([2 * ring_r0 + 2, bar_w]);
    for (a = [45, 135, 225, 315]) rotate(a) translate([0, -bar_w / 2]) square([ring_r0 + 1, bar_w]);
  }
  difference() {
    hull() {
      translate([fl_x0 - 3, fl_z0 - 3]) square([fl_x1 - fl_x0 + 6, fl_z1 - fl_z0 + 6]);
      translate([spool_x, shaft_z]) for (a = [-10, 60]) rotate(a) translate([ring_r0, -1]) square([ring_w, 2]);
    }
    translate([spool_x, shaft_z]) circle(r = ring_r0, $fn = 128);
    // Lighten the tower, leaving a frame round it.
    offset(-bar_w) hull() {
      translate([fl_x0 - 3, fl_z0 - 3]) square([fl_x1 - fl_x0 + 6, fl_z1 - fl_z0 + 6]);
      translate([spool_x, shaft_z]) for (a = [-10, 60]) rotate(a) translate([ring_r0 + ring_w, -1]) square([0.01, 2]);
    }
  }
}

// Front plate (s = +1 right, -1 left, a mirror image): flat on the body's
// front face, screwed into its floor and top band, and up round the reel.
// It carries the reel's front axle.
module front_plate(s = 1) {
  mirror([s < 0 ? 1 : 0, 0, 0])
    difference() {
      xz_extrude(front_y0, front_y1) {
        cradle_2d();
        difference() {
          translate([tw_half + cage_gap, 0]) square([cup_half - tw_half - cage_gap, cup_top]);
          translate([tw_half + cage_gap + bar_w, floor_t + 2]) square([cup_half - tw_half - cage_gap - 2 * bar_w, cup_in_h - 4]);
        }
      }
      y_cyl([spool_x, shaft_z], front_y0 - 1, front_y1 + 1, m5_pilot_d, 32);
      for (p = face_screws) plate_screw([p[0], front_y0, p[1]], [0, 1, 0]);
      plate_joints(true);
    }
}

// Rear plate (s as above): behind the gears, standing off the back wall on
// four posts into its floor and top band. Its web over the gear train
// carries the idler's bolt; it carries the reel's rear axle.
module rear_plate(s = 1) {
  mirror([s < 0 ? 1 : 0, 0, 0])
    difference() {
      union() {
        xz_extrude(rear_y0, rear_y1) {
          cradle_2d();
          hull() {
            for (p = standoff_pts) translate(p) circle(d = standoff_d, $fn = 48);
            translate([spool_x - 10, shaft_z - ring_r0 - 2]) square([20, 2]);
          }
        }
        for (p = standoff_pts) y_cyl(p, rear_y1 - 0.01, 0, standoff_d);
      }
      y_cyl([spool_x, shaft_z], rear_y0 - 1, rear_y1 + 1, m5_pilot_d, 32);
      y_cyl(idler_c, rear_y0 - 1, rear_y1 + 1, m5_pilot_d, 32);
      y_cyl(pinion_c, rear_y0 - 1, rear_y1 + 1, shaft_d + 3, 32);
      for (p = standoff_pts) plate_screw([p[0], 0, p[1]], [0, -1, 0], -rear_y0);
      plate_joints(false);
    }
}

// Fairlead cheek (right reel), in the bar frame: a plate between the two
// towers, a tenon into each at both roller heights. outer: the outboard
// cheek, the lower rollers' bolt heads on its outside; the inboard one takes
// their threads. The spacers' screws come through both from outside.
module cheek_local(outer) {
  away = outer ? [1, 0, 0] : [-1, 0, 0];
  face = outer ? 0 : cage_t;
  yc = xbar_total / 2;
  difference() {
    union() {
      translate([0, dv_depth, 0]) rotate([90, 0, 90]) linear_extrude(cage_t)
        rounded_rect([0, fl_z0], [xbar_len, fl_z1], corner_r);
      for (z = [fl_za, fl_zb]) translate([0, 0, z]) {
        translate([0, dv_depth, 0]) mirror([0, 1, 0]) dovetail(cage_t);
        translate([0, dv_depth + xbar_len, 0]) dovetail(cage_t);
      }
    }
    for (z = [fl_za, fl_zb], y = [-0.01, xbar_total - pilot_depth + 0.01])
      translate([cage_t / 2, y, z]) rotate([-90, 0, 0]) cylinder(d = m5_pilot_d, h = pilot_depth, $fn = 24);
    for (dy = [-roff, roff])
      if (outer) plate_screw([face, yc + dy, fl_za], away, cage_t);
      else translate([-1, yc + dy, fl_za]) rotate([0, 90, 0]) cylinder(d = m5_pilot_d, h = cage_t + 2, $fn = 24);
    for (dy = [-1, 1], dz = [-8, 8]) plate_screw([face, yc + dy * (fl_gap + cage_t / 2), fl_zb + dz], away, cage_t);
  }
}

module cheek(outer, s = 1) {
  mirror([s < 0 ? 1 : 0, 0, 0]) place_cheek(cheek_x0s[outer ? 1 : 0]) cheek_local(outer);
}

// Spacer (right reel, world frame): between the cheeks, front (+1) or back
// (-1) of the window, carrying the upper rollers. The front one has their
// bolt heads; the back one takes their threads. Screwed from the cheeks into its ends.
module spacer(front, s = 1) {
  y0 = front ? line_y + fl_gap : line_y - fl_gap - cage_t;
  mirror([s < 0 ? 1 : 0, 0, 0])
    difference() {
      translate([fl_xc - fl_gap + 0.25, y0, sp_z0]) cube([2 * fl_gap - 0.5, cage_t, sp_z1 - sp_z0]);
      for (dx = [-roff, roff])
        if (front) plate_screw([fl_xc + dx, y0, fl_zb], [0, 1, 0], cage_t);
        else y_cyl([fl_xc + dx, fl_zb], y0 - 1, y0 + cage_t + 1, m5_pilot_d, 24);
      for (sx = [-1, 1], dz = [-8, 8])
        translate([fl_xc + sx * (fl_gap - pilot_depth / 2 + 0.5), y0 + cage_t / 2, fl_zb + dz]) rotate([0, 90, 0])
          cylinder(d = m5_pilot_d, h = pilot_depth + 1, center = true, $fn = 24);
    }
}

// Print-in-place roller bearing, half a roller, standing on z = 0: the hub
// on the bolt, the sleeve, and pip_n pins between with a 45° collar at mid
// height running in a V groove in both.
function pin_w(z) = pip_rn + max(0, pip_b - abs(z - pip_h / 2));
module pin_2d(grow = 0) {
  polygon(concat(
    [[-pip_rn - grow, -1], [pip_rn + grow, -1]],
    [[pip_rn + grow, pip_h / 2 - pip_b - grow], [pip_rn + pip_b + grow, pip_h / 2], [pip_rn + grow, pip_h / 2 + pip_b + grow]],
    [[pip_rn + grow, pip_h + 1], [-pip_rn - grow, pip_h + 1]],
    [[-pip_rn - grow, pip_h / 2 + pip_b + grow], [-pip_rn - pip_b - grow, pip_h / 2], [-pip_rn - grow, pip_h / 2 - pip_b - grow]]));
}
module roller_half() {
  top = pip_h - 0.6;
  difference() {
    union() {
      // Hub, full height: the bolt clamps the two hubs between the walls.
      difference() {
        cylinder(r = pip_hub_r, h = pip_h, $fn = 64);
        translate([0, 0, -1]) cylinder(d = axle_d, h = pip_h + 2, $fn = 32);
      }
      difference() {
        cylinder(d = roller_d, h = top, $fn = 96);
        translate([0, 0, -1]) cylinder(r = pip_ro, h = top + 2, $fn = 96);
      }
    }
    rotate_extrude($fn = 96) translate([pip_rc, 0]) intersection() {
      offset(delta = pip_c) pin_2d();
      translate([-pip_rn - pip_b - 1, -1]) square([2 * (pip_rn + pip_b + 1), pip_h + 2]);
    }
  }
  for (k = [0 : pip_n - 1]) rotate(k * 360 / pip_n) translate([pip_rc, 0, 0])
    rotate_extrude($fn = 24) intersection() {
      pin_2d();
      square([pip_rn + pip_b, top]);
    }
}

// A whole roller: two halves back to back (bed faces together), on an axis
// along +z from its start.
module roller_local() {
  roller_half();
  translate([0, 0, roller_len]) mirror([0, 0, 1]) roller_half();
}

module fairlead_rollers(s = 1) {
  mirror([s < 0 ? 1 : 0, 0, 0]) {
    for (dy = [-roff, roff]) translate([fl_xc - roller_len / 2, line_y + dy, fl_za]) rotate([0, 90, 0]) roller_local();
    for (dx = [-roff, roff]) translate([fl_xc + dx, line_y - roller_len / 2, fl_zb]) rotate([-90, 0, 0]) roller_local();
  }
}

// Place a shape drawn in the panel's plane, centred on the panel: x across,
// y up its slope (toward the front), z out of its face, which looks back
// and up (the user's call).
module on_panel() {
  translate(panel_c) rotate([panel_tilt, 0, 0]) children();
}

// Panel plate (s = +1 right, -1 left, a mirror image), a truss under the
// body: a top member screwed up into the floor, a member along the panel
// (its groove holding the panel's edge), a leg from the top member's back
// end to the panel's high edge, and a diagonal from its front end to the
// panel's low edge.
module pp_2d() {
  translate([pp_ya, -pp_t]) square([pp_yb - pp_ya, pp_t]);
  hull() {
    translate([pp_ya, -pp_t]) square([pp_t, pp_t]);
    translate(pp_hi) circle(r = pp_r, $fn = 48);
  }
  hull() for (p = [pp_hi, pp_lo]) translate(p) circle(r = pp_r, $fn = 48);
  hull() {
    translate([pp_yb - pp_t, -pp_t]) square([pp_t, pp_t]);
    translate(pp_lo) circle(r = pp_r, $fn = 48);
  }
}

module panel_plate(s = 1) {
  mirror([s < 0 ? 1 : 0, 0, 0])
    difference() {
      yz_extrude(pp_x0, pp_x1) intersection() {
        pp_2d();
        translate([-500, -500]) square([1000, 500]);
      }
      on_panel() cube([panel_w + 1, panel_h + 1, panel_t + 0.4], center = true);
      for (y = pp_screw_ys) plate_screw([(pp_x0 + pp_x1) / 2, y, 0], [0, 0, -1], pp_t);
    }
}

// Print orientations.
module frame_print() { rotate([90, 0, 0]) frame(); }
// End doors print outer face down; the cap upside down, its sled standing up.
module end_door_print(s = 1) {
  if (s > 0) translate([0, 0, cup_half + cover_t]) rotate([0, 90, 0]) end_door(1);
  else translate([0, 0, cup_half + cover_t]) rotate([0, -90, 0]) end_door(-1);
}
module tower_cap_print() { translate([0, 0, cap_top]) rotate([180, 0, 0]) tower_cap(); }
module stem_print() { translate([0, 0, stem_y1]) rotate([-90, 0, 0]) stem(); }
// Reels stand on their gear ring, spigot up.
module spool_print() { rotate([90, 0, 0]) translate([-spool_x, -gear_y0, -shaft_z]) spool(); }
module reel_flange_print() { rotate([90, 0, 0]) translate([-spool_x, -drum_y1, -shaft_z]) reel_flange(); }
module pinion_print() { rotate([90, 0, 0]) translate([-pinion_c[0], -gear_y0, -pinion_c[1]]) pinion(); }
module idler_print() { rotate([90, 0, 0]) translate([-idler_c[0], -gear_y0, -idler_c[1]]) idler(); }
// Cradle plates print flat, sockets up.
module front_plate_print(s = 1) { rotate([-90, 0, 0]) translate([0, -front_y1, 0]) front_plate(s); }
module rear_plate_print(s = 1) { rotate([90, 0, 0]) translate([0, -rear_y0, 0]) rear_plate(s); }
// Bars and cheeks lie on a face, so their dovetails' outlines are in the bed's plane.
module xbar_print() { rotate([0, -90, 0]) xbar_local(); }
module cheek_print(outer) {
  if (outer) translate([0, 0, cage_t]) rotate([0, 90, 0]) translate([0, 0, -fl_z0]) cheek_local(true);
  else rotate([0, -90, 0]) translate([0, 0, -fl_z0]) cheek_local(false);
}
module spacer_print(front) {
  if (front) translate([0, 0, line_y + fl_gap + cage_t]) rotate([-90, 0, 0]) spacer(true);
  else translate([0, 0, -(line_y - fl_gap - cage_t)]) rotate([90, 0, 0]) spacer(false);
}
module roller_half_print() { roller_half(); }
// Panel plates print on their outer face, groove up.
module panel_plate_print(s = 1) {
  if (s > 0) rotate([0, 90, 0]) translate([-pp_x1, 0, 0]) panel_plate(1);
  else rotate([0, -90, 0]) translate([pp_x1, 0, 0]) panel_plate(-1);
}

// Reference hardware, not printed.
module cell() {
  translate([0, cell_y, cell_z]) rotate([0, 90, 0]) cylinder(d = cell_d, h = cell_len, center = true, $fn = 64);
}

module antenna() {
  translate([0, antenna_y, cap_top]) {
    cylinder(r = nut_r, h = 4, $fn = 6);
    translate([0, 0, 4]) cylinder(d = antenna_nut_d, h = antenna_nut_len, $fn = 48);
    translate([0, 0, 4 + antenna_nut_len]) cylinder(d = antenna_d, h = antenna_len, $fn = 48);
  }
  translate([0, antenna_y, bulkhead_bottom]) cylinder(r = nut_r, h = n_body_len, $fn = 6);
}

module boards() {
  translate([charge_pocket[0] + pocket_clear, sled_y0 + sled_t, charge_pocket[1] + pocket_clear]) cube([board_dims[0], board_dims[2], board_dims[1]]);
  translate([kit_pocket[0] + pocket_clear, sled_y0 - kit_t, kit_pocket[1] + pocket_clear]) cube([kit_w, kit_t, kit_h]);
  for (b = [[bms_pocket, bms_dims, -1], [mcu_pocket, mcu_dims, 1], [drv_pocket, drv_dims, 1]])
    mirror([b[2] < 0 ? 1 : 0, 0, 0]) translate([cup_half - b[1][2], b[0][0] + pocket_clear, b[0][1] + pocket_clear]) cube([b[1][2], b[1][0], b[1][1]]);
}

// The room kept on the sled for a 1 W module, in the kit's place.
module radio_room() {
  translate([-radio_room[0] / 2, sled_y0 - 20, kit_top - radio_room[1]]) cube([radio_room[0], 20, radio_room[1]]);
}

module motors() {
  for (s = [-1, 1]) mirror([s < 0 ? 1 : 0, 0, 0]) {
    translate([mot_x0, plate_t, mot_z0]) cube([mot_len, mot_d, mot_h]);
    y_cyl(pinion_c, plate_t - shaft_len, plate_t, shaft_d, 24);
  }
}

module panel() {
  on_panel() cube([panel_w, panel_h, panel_t], center = true);
}

module solar_connector() {
  translate([solar_c[0], front_y, solar_c[1]]) rotate([-90, 0, 0]) cylinder(d = 22, h = 3, $fn = 6);
}

// Assembly groups, both sides.
module doors() { end_door(1); end_door(-1); tower_cap(); }
module drive() { pinion(); mirror([1, 0, 0]) pinion(); idler(); mirror([1, 0, 0]) idler(); }
module reels() { spool(); mirror([1, 0, 0]) spool(); reel_flange(); mirror([1, 0, 0]) reel_flange(); }
module cradles() { for (s = [-1, 1]) { front_plate(s); rear_plate(s); } for (b = xbars()) xbar(b); }
module fairlead_sets() { for (s = [-1, 1]) { cheek(true, s); cheek(false, s); spacer(true, s); spacer(false, s); } }
module all_rollers() { for (s = [-1, 1]) fairlead_rollers(s); }
