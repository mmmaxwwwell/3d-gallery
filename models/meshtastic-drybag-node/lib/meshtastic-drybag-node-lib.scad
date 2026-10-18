// Meshtastic dry-bag node: a sealed box that winches itself up into a tree.
// A line thrown over branches has both ends tied to two reels, one either
// side of the box; each reel winds its end in and the node climbs the line
// with no tie line left hanging. Each line leaves through a window of four
// rollers on top of its reel's outer edge, held both ways, so the node
// hangs from two fixed points, and everything heavy sits in the box, low
// between them.
//
// The box (TPU 64D, sealed) sits in the middle, as deep as the reels plus
// a little in front. Its back is a solid wall; it opens at the front, with
// a PCTG door on a tongue wider than the groove round its rim, held by M5 x
// 10 screws outside the seal; every M5 x 10 gets 8 mm of thread. The motors
// stand on the back wall inside, their pinions' hubs out through lip seals
// in it. The front door carries the boards and the saddles that hold the
// cell standing up. The radio sits on the right wall
// under the antenna's bulkhead in the top, within the pigtail's 6", with
// room for a 1 W module instead; the antenna's stem is part of the box.
//
// Each motor drives its reel through herringbone gears behind the back wall,
// under a small bolt-on cover each side: a pinion, two idlers on
// print-in-place bearings, and an output gear on the reel's axis whose hub
// runs out through a lip seal in the box's back slab into a hex in the
// reel's hub. Each reel turns between two flat skeleton plates
// (PCTG, each inside 220 x 220): a ring round it with spokes, crossmembers
// round it, and a flat outer part carrying the rollers. Each plate's inner
// edge sits in a channel on the box's side and screws in: the rear one on
// the back slab, the front one on a rib. The solar panel hangs under the box at 45°, facing back, on a
// spine screwed up into the floor, placed so the node hangs level.
//
// Use frame: X across, Z up as it hangs, Y forward. z = 0 is the box's
// bottom, y = 0 its back. Each part's *_print() module puts it in its print
// orientation. Every hole is round: no teardrops.

// BEGIN_PARAMS
// 32140 LiFePO4 cell, standing up in the box
cell_d = 32;
cell_len = 140;
// Gap round the cell, and past each end for its tab and lead
cell_clear = 0.4;
end_clear = 3;
// How far back from the front door the cell stands (its saddles reach it): it trims the node level
cell_back = 50;
// The back wall's thickness
plate_t = 6;
// Box (TPU 64D): its inside width, how far it runs on past the front plates
// (it balances the gears behind), its walls, its floor (thick enough for the
// panel spine's blind pilots), and its top (for the bulkhead)
box_in_w = 66;
box_front_extra = 24;
wall = 6;
floor_t = 12;
top_t = 10;
// Doors' thickness, PCTG
cover_t = 5;
// Outside corner radius of the box, seen from the front
box_corner_r = 8;
// Groove round each opening's rim, centred in the wall, and the door's tongue
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
// Every opening's screws sit in a flange round it, outside the seal: how
// far out of the wall each screw's centre is, the boss's radius round it,
// and how far the flange runs back from the opening
ear_out = 3.5;
ear_r = 6.5;
flange_len = 14;
// Front door screws up each side and along the top and bottom
door_side_screws = 5;
door_top_xs = [-20, 20];
// N female bulkhead: 5/8-24 UNEF thread, 3/4" hex panel nut; its body and
// O-ring inside, which the box's top is relieved round
n_thread_d = 15.9;
n_hole_clear = 0.5;
n_nut_af = 19.05;
n_body_d = 24;
n_body_len = 15;
// Box top left under the bulkhead (user confirmed 4 mm)
bulkhead_wall_t = 4;
// Antenna radome and its N male coupling nut
antenna_d = 22;
antenna_len = 180;
antenna_nut_d = 21.5;
antenna_nut_len = 20;
// The antenna's stem, up from the box's top beside it, and its zip-tie slots
stem_len = 40;
tie_w = 6;
tie_t = 2.5;
// Radio: XIAO nRF52840 + Wio-SX1262 stack, on the box's right wall under the
// bulkhead; and the room kept free there for a 1 W module, [along Y, along Z, depth]
kit_w = 22;
kit_h = 24;
kit_t = 12;
radio_room = [40, 70, 18];
// Boards, [w, h, thickness]: the charge board on the motor plate, the rest
// on the front door: the protection board, the winch XIAO, two DRV8871
// motor drivers and the U3V40F12 boost to 12 V (homelab-39's picks)
board_dims = [39, 44, 9];
bms_dims = [25, 50, 4];
mcu_dims = [18, 21, 6];
drv_dims = [25, 20, 5];
boost_dims = [25, 13, 5];
// Pocket round each board: clearance, and the rim's width and height
pocket_clear = 0.5;
rim_w = 2;
rim_h = 3;
// The user's 5/8" watertight connector for the solar panel, through the box's top
solar_hole_d = 15.875 + 0.4;
// Winch motors: JGY-370 worm gearmotor standing on the motor plate gearbox
// down, its output shaft back through it (not measured): length (along Z),
// the Hall encoder on the end of its can (on top), depth from its output
// face, width, and how far up from the gearbox's end the shaft is
mot_len = 75;
mot_encoder = 15;
mot_d = 26;
mot_h = 32;
mot_shaft_in = 16;
// Its D-shaft: diameter, across the flat, length past the output face. The
// pinion's grub screw on the flat pulls the motor's face against the back wall.
shaft_d = 6;
shaft_flat = 5;
shaft_len = 14;
// Drive: herringbone gears behind the back wall. Module, teeth on the
// pinion, the two idlers and the output gear, face width, and helix angle
// (30°: each half's flanks lean less than 45°, so they print gear down).
// The idlers turn on print-in-place roller bearings in their hubs, on pins
// in the covers' floors; the output gear on its own pin, with silicone oil.
gear_m = 2.25;
pinion_z = 12;
idler_z = 16;
out_z = 12;
gear_w = 16;
gear_helix = 30;
gear_pin_d = 7;
out_pin_d = 10;
// The idlers' bearings' hub radius (the other sizes are the rollers' bearings')
idler_hub_r = 6.25;
// Every gear is held both sides: the idlers' pins run on into sockets this
// deep in the back slab, and the pinion's back rides on a peg this wide in a
// pocket this deep in its rear face.
pin_socket = 3.5;
pinion_peg_d = 8;
pinion_peg_len = 4;
// The gear covers: floor, wall and gap round the gears; and the slab's
// outline round them (the old tray's wall and gap set how big it is)
cover_floor = 2;
cover_wall = 2.5;
tray_wall = 4;
tray_gap = 1;
// The pinion's hub through the back wall, in a hole this much tighter (a lip seal)
hub_d = 12;
// The output gear's hub through the back slab, in a hole this much tighter
// (a lip seal in the TPU), and its hex tip into the reel's hub (across flats)
out_hub_d = 16;
hub_seal = 0.4;
out_hex = 12;
// Reels for 150-200 ft of 1/8" Dacron: flange diameter, core, length
// between flanges, flange thickness; gap from the flanges to the holders'
// seats on the box
spool_od = 112;
spool_core_d = 30;
spool_len = 72;
spool_flange_t = 4;
// The front flange is its own disc, keyed onto a hex spigot on the core's end (across flats), so the reel prints without overhangs
spigot_af = 20;
spool_side_gap = 4;
// The line's end wedges into a V jam cleat in the core by the front flange
cleat_mouth = 8;
cleat_throat = 2.4;
cleat_depth = 12;
cleat_len = 10;
// The reels turn on generously sized print-in-place roller bearings pressed
// into the holder plates (the user's): the reel's front journal in the
// front plate's, its hub's journal in the rear plate's. The front journal's
// diameter (inside the spigot's flats, so the front flange slides over it);
// the bearings' pins' radius, collar and gap, and their races' walls. They
// press in rb_press tight. axle_d is the rollers' M5 axle bore.
axle_d = 5.4;
front_journal_d = 19;
rbp_rn = 2.5;
rbp_b = 1;
rbp_c = 0.3;
rbp_wall = 2.5;
// Holder plates (PCTG): thickness, crossmember width, the rings' gap to the
// reel and width, and the gap between pieces. Each plate's inner edge sits
// in a little channel on the box's side (the user's): on a TPU base between
// two low lips, two square blocks in it indexing notches in the edge, and
// bolts at 45° through the edge into the base. How far the plate's flat
// inner edge reaches out (seat_w); the base's thickness off the wall (so
// the bolts' pilots end in solid TPU, not through the wall); the lips'
// height and thickness; the blocks' length and depth.
cage_t = 8;
bar_w = 10;
ring_gap = 3;
ring_w = 8;
cage_gap = 1;
seat_w = 13;
ch_base = 4;
ch_lip_h = 3;
ch_lip_t = 2.5;
idx_len = 8;
idx_d = 3;
// Crossmembers between each reel's plates: width (along the ring),
// thickness (across it), and their angles out from the reel's axis (right
// reel; the left mirrors). None on the box's side, where the plates seat.
xbar_w = 16;
xbar_t = 8;
xbar_angles = [0, 120, -60, -120];
// Dovetails on the crossmembers' ends: depth, width at the shoulder and the tip, clearance
dv_depth = 3.5;
dv_w0 = 10;
dv_w1 = 14;
dv_clear = 0.25;
// The rollers on each reel's outer edge, two pairs round a window the line
// runs through: the lower pair's axes front to back from plate to plate
// (they hold the line side to side), the upper pair's across between two
// cheeks (front to back). Diameter, the window (1/8" line), how far in from
// the reel's edge it is, and how far the lower rollers are above the reel's top
roller_d = 30;
line_gap = 4.5;
fl_in = 7;
fairlead_above = 7;
// Each roller is a printed sleeve with a print-in-place roller bearing
// pressed into each end, printed separately (the user's). Each bearing's
// hub runs to the roller's middle, where it meets the other's, so the bolt
// clamps the two hubs (with an M5 washer at each end) and nothing else.
// The bearing: its outside diameter and its race's height; the hub's
// radius, the pins' radius, their 45° collar's height, how many, and the
// gap round them (0.2-0.3 mm is what people print these at). The sleeve's
// wall, its ribs, the press fit of the bearings, and the washers.
rb_d = 23;
rb_h = 8;
pip_hub_r = 5.25;
pip_rn = 1.5;
pip_b = 0.8;
pip_n = 8;
pip_c = 0.25;
roller_wall = 2.4;
roller_ribs = 6;
roller_rib_t = 1.6;
rb_press = 0.15;
washer_t = 1;
// Solar panel (5 V 3 W, not measured), hung under the box at panel_tilt,
// facing away from the box and up. panel_side: -1 hangs it behind (the gear
// side), +1 in front (the door side); with the gears and the motors
// behind, it hangs in front to level the node. panel_y is
// where its centre sits, set so the node hangs level and the box doesn't
// shade it.
panel_w = 145;
panel_h = 120;
panel_t = 3;
panel_tilt = 45;
panel_side = 1;
panel_y = 160;
// Panel mount: the spine's members' width, the bars that hold the panel's
// top and bottom edges (width across the slope, thickness), and how deep
// the panel's edge sits in each bar's groove
pp_t = 12;
pbar_w = 20;
pbar_t = 8;
pp_groove = 4;
corner_r = 4;
// END_PARAMS

function pw(w) = w + 2 * pocket_clear;
// Every M5 x 10 threads thread_len in; its pilot runs 1 mm deeper.
pilot_depth = thread_len + 1;
under_head = screw_len - thread_len;
cell_r = cell_d / 2 + cell_clear;

function pitch_r(z) = gear_m * z / 2;
function tip_r(z) = gear_m * (z + 2) / 2;

// The box: inside half width, outside half width, the flanges round its
// openings, and the holder plates' seats beside it.
in_half = box_in_w / 2;
box_half = in_half + wall;
flange_h = ear_out + ear_r;
ring_r0 = spool_od / 2 + ring_gap;
ring_r1 = ring_r0 + ring_w;
seat_x0 = box_half + ch_base;
seat_x1 = seat_x0 + seat_w;
spool_x = max(seat_x0 + ch_lip_h + spool_side_gap + spool_od / 2, seat_x0 + ring_r1 + 1);

// Depth, back to front: the covers, the gears just behind the box's back
// wall and slab; the slab; the rear plate on its front face; the reel's
// rear flange, drum and front flange; the front plate on its rib; the box
// on to the front door.
gear_y1 = -tray_gap;
gear_y0 = gear_y1 - gear_w;
cover_y0 = gear_y0 - tray_gap - cover_floor;
rear_y0 = flange_len;
rear_y1 = rear_y0 + cage_t;
rflange_y0 = rear_y1 + cage_gap;
drum_y0 = rflange_y0 + spool_flange_t;
drum_y1 = drum_y0 + spool_len;
front_y0 = drum_y1 + spool_flange_t + cage_gap;
front_y1 = front_y0 + cage_t;
box_d = front_y1 + box_front_extra;
// The line runs centred between the plates, at the drum's middle.
line_y = (rear_y1 + front_y0) / 2;

// Inside, behind to front: the motors standing on the back wall side by
// side, their shafts back through it; the cell standing back from the
// front door; the boards on the door and the back wall. The bulkhead's body
// hangs over the cell.
mot_z0 = floor_t + 3;
mot_x0 = 0.5;
mot_top = mot_z0 + mot_encoder + mot_len;
pinion_c = [mot_x0 + mot_h / 2, mot_z0 + mot_shaft_in];
cell_c = [-in_half + cell_r, box_d - rim_h - bms_dims[2] - 1 - cell_r - cell_back];
cell_z0 = floor_t + 1 + end_clear;
ceiling = cell_z0 + cell_len + end_clear + n_body_len + 2;
box_h = ceiling + top_t;

// Gear train, in a straight line: the pinion, two idlers, and the output
// gear on the reel's axis, as high as the line's length puts it.
gear_ds = [pitch_r(pinion_z) + pitch_r(idler_z), 2 * pitch_r(idler_z), pitch_r(idler_z) + pitch_r(out_z)];
gear_len = gear_ds[0] + gear_ds[1] + gear_ds[2];
gear_dx = spool_x - pinion_c[0];
shaft_z = pinion_c[1] + sqrt(pow(gear_len, 2) - pow(gear_dx, 2));
ring_c = [spool_x, shaft_z];
gear_th = atan2(ring_c[1] - pinion_c[1], ring_c[0] - pinion_c[0]);
gear_u = [cos(gear_th), sin(gear_th)];
gear_n = [-sin(gear_th), cos(gear_th)];
idlers_c = [pinion_c + gear_ds[0] * gear_u, pinion_c + (gear_ds[0] + gear_ds[1]) * gear_u];
// Tooth phase at the gears' mid-plane: each gear turned so the tooth facing
// its neighbour meets a gap. Neighbouring herringbones twist opposite ways.
function mesh_phase(psi_a, za, zb, th) = th + 180 - 180 / zb - (psi_a - th) * za / zb;
pinion_psi = 0;
idler_psis = [mesh_phase(pinion_psi, pinion_z, idler_z, gear_th), mesh_phase(mesh_phase(pinion_psi, pinion_z, idler_z, gear_th), idler_z, idler_z, gear_th)];
out_psi = mesh_phase(idler_psis[1], idler_z, out_z, gear_th);
// The tray's lobe round each train, out to the reel's axis: each gear's
// circle, its tip plus the gap plus the tray's wall.
lobe_cs = [idlers_c[0], idlers_c[1], ring_c];
lobe_rs = [tip_r(idler_z), tip_r(idler_z), tip_r(out_z)] + [1, 1, 1] * (tray_gap + tray_wall);
lobe_x1 = spool_x + lobe_rs[2];
drum_top = shaft_z + spool_od / 2;

// Antenna's bulkhead in the top, over the cell; the solar connector beside it.
antenna_x = 2;
antenna_y = line_y + 12;
n_hole_d = n_thread_d + n_hole_clear;
nut_r = n_nut_af / sqrt(3);
bulkhead_bottom = box_h - bulkhead_wall_t - n_body_len;
solar_c = [-in_half + 11, antenna_y];

// Boards. On the motor plate, [x0, z0, x1, z1]: the charge board over the motors.
charge_pocket = [-pw(board_dims[0]) / 2, mot_top + pocket_clear + rim_w + 3, pw(board_dims[0]) / 2, mot_top + pocket_clear + rim_w + 3 + pw(board_dims[1])];
// On the front door, [x0, z0, x1, z1]: the protection board in front of the
// cell, between its two saddles; the winch XIAO, the two drivers and the
// boost stacked to its right.
saddle_zs = [cell_z0 + 25, cell_z0 + cell_len - 25];
bms_pocket = [-in_half + 3, (saddle_zs[0] + saddle_zs[1]) / 2 - pw(bms_dims[1]) / 2, -in_half + 3 + pw(bms_dims[0]), (saddle_zs[0] + saddle_zs[1]) / 2 + pw(bms_dims[1]) / 2];
mcu_pocket = [3, floor_t + 6, 3 + pw(mcu_dims[0]), floor_t + 6 + pw(mcu_dims[1])];
function stack_pocket(below, dims) = [3, below[3] + 2 * rim_w + 2, 3 + pw(dims[0]), below[3] + 2 * rim_w + 2 + pw(dims[1])];
drv_pockets = [stack_pocket(mcu_pocket, drv_dims), stack_pocket(stack_pocket(mcu_pocket, drv_dims), drv_dims)];
boost_pocket = stack_pocket(drv_pockets[1], boost_dims);
front_pockets = [bms_pocket, mcu_pocket, drv_pockets[0], drv_pockets[1], boost_pocket];
front_dims = [bms_dims, mcu_dims, drv_dims, drv_dims, boost_dims];
// On the right wall, [y0, z0, y1, z1]: the kit just under the bulkhead's
// level, the 1 W module's room from there down.
kit_top = ceiling - 2;
kit_pocket = [line_y - pw(kit_w) / 2, kit_top - pw(kit_h), line_y + pw(kit_w) / 2, kit_top];
room_y0 = line_y - radio_room[0] / 2;

// Front door screws, [x, z]: up each side and along the top and bottom, in its flange.
door_x = box_half + ear_out;
door_side_zs = [for (k = [0 : door_side_screws - 1]) 20 + (box_h - 40) * k / (door_side_screws - 1)];
door_screws = concat(
  [for (sx = [-1, 1], z = door_side_zs) [sx * door_x, z]],
  [for (x = door_top_xs, z = [-ear_out, box_h + ear_out]) [x, z]]);
// Each gear cover's screws (right side), [x, z], into the back slab: along
// the lobe's edges, far enough out for a solid boss clear of the teeth, and
// one under the pinion into the box's floor. Any that would crowd a holder
// plate's 45° bolt are left out.
function lobe_z_at(x) = shaft_z + (x - spool_x) * tan(gear_th);
cover_boss_d = 18;
cover_screw_out = cover_boss_d / 2 + 2 - tray_wall;
cover_screws_all = concat(
  [for (i = [1, 2], side = [-1, 1]) lobe_cs[i] + side * (lobe_rs[i] + cover_screw_out) * gear_n],
  [for (side = [-1, 1]) lobe_cs[1] - 30 * gear_u + side * (lobe_rs[1] + cover_screw_out) * gear_n],
  [[pinion_c[0], floor_t / 2 - 1]]);
// The holder plates' bolts into their V channels, [z]: between the door
// screws; and the channel's steps outward, between those.
seat_zs = [for (k = [0 : door_side_screws - 2]) (door_side_zs[k] + door_side_zs[k + 1]) / 2];
idx_zs = [(seat_zs[0] + seat_zs[1]) / 2, (seat_zs[len(seat_zs) - 2] + seat_zs[len(seat_zs) - 1]) / 2];
cover_screws = [for (p = cover_screws_all) if (min([for (z = seat_zs) abs(p[1] - z) > m5_pilot_d + 1 || abs(p[0]) > seat_x0 + 4 ? 1 : 0]) == 1) p];
// Each plate's channel: the plates' mid-thickness y.
rail_ycs = [rear_y0 + cage_t / 2, front_y0 + cage_t / 2];
// The plates' inner edge runs up the seat from just under the lowest door screw.
strip_z0 = door_side_zs[0] - 8;

// Crossmembers round each ring.
xbar_r = (ring_r0 + ring_r1) / 2;
xbar_len = front_y0 - rear_y1;
xbar_total = xbar_len + 2 * dv_depth;

// The reels' bearings, [bore, hub radius, pins' circle, outer race's inside, outside diameter].
function reel_brg(bore) = let(hr = bore / 2 + rbp_wall, rc = hr + rbp_c + rbp_rn, ro = rc + rbp_rn + rbp_c)
  [bore, hr, rc, ro, 2 * (ro + rbp_b + rbp_wall)];
front_brg = reel_brg(front_journal_d + 0.4);
rear_brg = reel_brg(spool_core_d + 0.4);
pip_rc = pip_hub_r + pip_c + pip_rn;
pip_ro = pip_rc + pip_rn + pip_c;

function pipr_c(hr) = hr + pip_c + pip_rn;
function pipr_o(hr) = pipr_c(hr) + pip_rn + pip_c;

// The roller window (right reel), at [fl_xc, line_y] on top of the reel's
// outer edge: the lower pair at fl_za, either side of fl_xc; the upper
// pair at fl_zb, either side of line_y, between the cheeks.
fl_xc = spool_x + spool_od / 2 - fl_in;
roff = line_gap / 2 + roller_d / 2;
fl_za = drum_top + fairlead_above + roller_d / 2;
fl_zb = fl_za + roller_d + 2;
lower_c = [[fl_xc - roff, fl_za], [fl_xc + roff, fl_za]];
upper_len = 2 * (roff + roller_d / 2) + 1;
cheek_x0s = [fl_xc - upper_len / 2 - 0.5 - cage_t, fl_xc + upper_len / 2 + 0.5];
cheek_z0 = fl_zb - roller_d / 2 - 6;
cheek_z1 = fl_zb + roller_d / 2 + 6;
cheek_tenon_zs = [fl_zb - 10, fl_zb + 10];
roller_boss_r = roller_d / 2 + 8;
// The plates' outline round the window, [x, z] corners of its box.
win_x0 = cheek_x0s[0] - 3;
win_x1 = cheek_x0s[1] + cage_t + 3;
win_z1 = cheek_z1 + 3;

// The antenna's stem, on the box's top beside the antenna.
stem_x0 = antenna_x + antenna_d / 2 + 2;
stem_y0 = antenna_y - 30;
stem_y1 = min(antenna_y + 30, box_d - flange_len - flange_h - 1);


// Panel: its centre, and the bars at its top and bottom edges.
// Up its slope (toward the box), and out of its face.
panel_u = [-panel_side * cos(panel_tilt), sin(panel_tilt)];
panel_n = [panel_side * sin(panel_tilt), cos(panel_tilt)];
panel_rot = atan2(panel_u[1], panel_u[0]);
panel_cz = -panel_h / 2 * sin(panel_tilt) - pbar_w * sin(panel_tilt) - flange_h - 11;
panel_c = [0, panel_y, panel_cz];
pbar_off = panel_h / 2 - pp_groove + pbar_w / 2;
pbar_cs = [for (s = [1, -1]) [panel_y, panel_cz] + s * pbar_off * panel_u];
// The spine's anchors behind each bar.
pp_back = pbar_t / 2 + pp_t / 2;
pp_pts = [for (c = pbar_cs) c - pp_back * panel_n];
// The spine's top member fits between the bottom flanges.
pp_ya = flange_len + 1;
// (the slab's bottom flange is flange_len deep)
pp_yb = box_d - flange_len - flange_h - 1;
pp_screw_ys = [pp_ya + 8, (pp_ya + pp_yb) / 2, pp_yb - 8];

assert(tongue_w > groove_w && tongue_len < groove_depth, "the tongue must be wider than the groove and stop short of its floor");
assert((wall - groove_w) / 2 >= 2, "too little TPU either side of the groove");
assert(ear_out - m5_pilot_d / 2 + wall / 2 - groove_w / 2 >= 2.5, "screw pilots too close to the groove");
assert(cover_t > under_head && cage_t > under_head, "a part is thinner than the screws' under-head length");
assert(cage_t >= thread_len, "holder plates too thin for the axles' 8 mm of thread");
assert(2 * mot_h + 2 * mot_x0 <= box_in_w, "the motors don't fit side by side");
assert(cell_c[0] + cell_r <= 0, "the cell doesn't fit beside the middle");
assert(gear_len > gear_dx, "the gear train can't reach the reel's axis");
assert(2 * lobe_x1 + 2 <= 268, "the box's slab doesn't fit the U1's bed");
assert(pitch_r(idler_z) - 1.25 * gear_m - pipr_o(idler_hub_r) - pip_b >= 2.5, "the idlers' bearings leave too little gear round them");
assert(idler_hub_r - pip_b - pip_c - gear_pin_d / 2 >= 1.4, "the idlers' bearing hubs are too thin on their pins");
for (c = idlers_c) assert(c[0] - gear_pin_d / 2 > box_half + 1, "an idler's pin socket would break into the box");
assert(pitch_r(pinion_z) - 1.25 * gear_m - pinion_peg_d / 2 > 3, "the pinion's peg pocket leaves too little gear");
assert(pinion_c[1] - tip_r(pinion_z) - tray_gap - cover_wall > floor_t / 2 + m5_head_d / 2, "the pinion crowds its cover's floor screw");
assert(box_d - flange_len - flange_h >= front_y1, "the front flange runs into the front plates");
assert(abs(seat_zs[0] - door_side_zs[0]) > m5_head_d + 2, "the plates' screws crowd the door screws");
assert(kit_top - radio_room[1] > mot_top + 2 || room_y0 > plate_t + mot_d + 2, "no room left on the right wall for a 1 W module");
assert(boost_pocket[3] + rim_w < ceiling, "the front door's boards don't fit");
assert(plate_t + mot_d + 1 < cell_c[1] - cell_r, "the motors run into the cell");
assert(box_h - kit_pocket[1] < 152 - 60, "radio kit is out of the 6\" pigtail's reach");
assert(bulkhead_bottom > cell_z0 + cell_len + end_clear, "the bulkhead's body hangs into the cell");
assert(antenna_x - solar_c[0] > nut_r + 12 && antenna_x + n_body_d / 2 < in_half - radio_room[2], "the bulkhead crowds the solar connector or the radio's room");
assert(cheek_z0 > shaft_z + sqrt(max(0, pow(spool_od / 2, 2) - pow(cheek_x0s[0] + cage_t - spool_x, 2))) + 2, "the inner cheek runs into the reel");
assert(cheek_x0s[0] + cage_t < lower_c[0][0] - roller_d / 2 - 0.3 || cheek_z0 > fl_za + roller_d / 2 + 0.3, "the inner cheek runs into a lower roller");
assert(win_x1 - min(seat_x0, spool_x - ring_r1) <= 220 && win_z1 - strip_z0 <= 220, "a holder plate is bigger than 220 x 220");
assert(floor_t > pilot_depth + 2, "floor too thin for the spine's pilots");
assert(pbar_cs[0][1] + pbar_w / 2 < -flange_h - 2, "the panel's top bar runs into the box's flanges");
// Sun from the panel's side at 45° must pass under the box.
panel_hi = [panel_y, panel_cz] + panel_h / 2 * panel_u;
assert(panel_side > 0 ? panel_hi[0] - panel_hi[1] - flange_h > box_d + cover_t : panel_hi[0] + panel_hi[1] + flange_h < -cover_t, "the box shades the panel");
assert(gear_helix <= 45, "herringbone flanks would overhang past 45°");
assert(front_journal_d < spigot_af - 0.5, "the front journal must fit inside the spigot's flats");
assert(rear_brg[4] / 2 + 6 < ring_r0 - 2, "the rear bearing's boss runs into the ring");
assert(pip_hub_r - pip_b - pip_c - axle_d / 2 >= 1.4 && rb_d / 2 - pip_ro - pip_b >= 1.4, "the roller bearing's races are too thin");
assert(2 * PI * pip_rc / pip_n > 2 * (pip_rn + pip_b) + 0.6, "too many pins for the roller bearing's circle");
assert(roller_d / 2 - rb_d / 2 - rb_press >= 2.5, "the roller's wall round its bearings is too thin");
assert(stem_y1 - stem_y0 >= stem_len, "the antenna's stem is too short for its 45° front edge");
for (p = cover_screws, z = seat_zs) assert(abs(p[1] - z) > m5_pilot_d + 1 || abs(p[0]) > seat_x0 + 4, "a cover screw crowds a holder plate's bolt");
for (z = seat_zs) assert(bolt45_p(rail_ycs[0], z)[0] - pilot_depth / sqrt(2) - m5_pilot_d / 2 / sqrt(2) > in_half + 2, "a plate's bolt pilot breaks through the box's wall");

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

// Involute spur gear profile, gear_m module, 20° pressure angle, a little backlash.
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

// Herringbone gear at [x, z] in the gear plane, turned psi at its mid-plane,
// each half twisting `hand` (+1 or -1) by the helix angle at its pitch
// circle. Meshing gears take opposite hands.
module herringbone(c, z, psi, hand) {
  half = gear_w / 2;
  tw = hand * half * tan(gear_helix) / pitch_r(z) * 180 / PI;
  translate([c[0], gear_y0 + half, c[1]]) rotate([90, 0, 0])
    for (m = [0, 1]) mirror([0, 0, m]) linear_extrude(half, twist = tw, slices = 8) rotate(psi) gear_2d(z);
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

// The box seen from the front, the flanges round it, the doors' outline
// (out over the plates' seats at the sides), and the seal's band round its rim.
module box_outline_2d() { rounded_rect([-box_half, 0], [box_half, box_h], box_corner_r); }
module flange_outline_2d() { offset(flange_h) box_outline_2d(); }
module door_outline_2d() { offset(-0.5) flange_outline_2d(); }
module seal_band(w) {
  difference() {
    offset(w / 2) offset(-wall / 2) box_outline_2d();
    offset(-w / 2) offset(-wall / 2) box_outline_2d();
  }
}

// The back slab seen from behind: the box, and a lobe each side round the
// gear train out to the reel's axis, and a flange round them for the
// covers' screws, stopping short at the lobes' ends.
module lobe_2d() {
  hull() for (i = [0 : 2]) translate(lobe_cs[i]) circle(r = lobe_rs[i], $fn = 64);
}
module tray_outline_2d() {
  offset(-6) offset(6) union() {
    offset(wall / 2 - tray_wall / 2) box_outline_2d();
    lobe_2d();
    mirror([1, 0]) lobe_2d();
  }
}
module slab_2d() {
  intersection() {
    offset(flange_h) tray_outline_2d();
    translate([-lobe_x1, -500]) square([2 * lobe_x1, 1000]);
  }
}

// The flanges and the plates' channels. At the back, a slab over the back
// wall and both lobes, for the covers' screws, the output hubs' lip seals,
// and the rear plates to seat on. Each side, a rib the front plate seats on, with a lip behind
// it; and a flange round the front opening. The box prints back face down,
// so the rib and the front flange taper out at 45° from below.
module flanges() {
  xz_extrude(0, flange_len) difference() { slab_2d(); box_outline_2d(); }
  for (sx = [-1, 1]) mirror([sx < 0 ? 1 : 0, 0, 0]) {
    for (yc = rail_ycs) rail(yc);
  }
  hull() {
    xz_extrude(box_d - flange_len, box_d) flange_outline_2d();
    xz_extrude(box_d - flange_len - flange_h, box_d - flange_len) box_outline_2d();
  }
}

// The little channel up the box's right side for a plate centred at yc: a
// base off the wall, a low lip either side of the plate's edge, and two
// square blocks that index notches in the edge. Under the rear lip it
// tapers into the wall at 45°, so it prints (back face down) without a shelf.
module rail(yc) {
  h = box_h - strip_z0;
  y0 = yc - cage_t / 2 - 0.2 - ch_lip_t;
  y1 = yc + cage_t / 2 + 0.2 + ch_lip_t;
  translate([0, 0, strip_z0]) {
    hull() {
      translate([box_half - 0.01, y0, 0]) cube([ch_base + ch_lip_h + 0.01, ch_lip_t, h]);
      translate([box_half - 0.01, y0 - ch_base - ch_lip_h, 0]) cube([0.01, ch_base + ch_lip_h, h]);
    }
    translate([box_half - 0.01, y0, 0]) cube([ch_base + 0.01, y1 - y0, h]);
    translate([seat_x0 - 0.01, y1 - ch_lip_t, 0]) cube([ch_lip_h + 0.01, ch_lip_t, h]);
  }
  for (z = idx_zs) translate([seat_x0 - 0.01, y0, z - idx_len / 2]) cube([idx_d + 0.01, y1 - y0, idx_len]);
}
// The bolt through a plate's edge into the channel's base at height z: at
// 45°, its thread leaving the plate's edge face behind the plate's middle.
function bolt45_p(yc, z) = [seat_x0, yc - 2, z];
module bolt45(yc, z, pilot = false) {
  translate(bolt45_p(yc, z)) rotate([0, 0, 45]) rotate([0, 90, 0])
    if (pilot) translate([0, 0, -pilot_depth]) cylinder(d = m5_pilot_d, h = pilot_depth + 0.5, $fn = 24);
    else { translate([0, 0, -1]) cylinder(d = m5_clear_d, h = 14, $fn = 32); translate([0, 0, under_head]) cylinder(d = m5_head_d, h = 14, $fn = 32); }
}

// The antenna's stem on the box's top, beside the antenna, its front edge at
// 45° so it prints (back face down) without a shelf; zip-tie slots through it.
module stem() {
  difference() {
    yz_extrude(stem_x0, stem_x0 + wall)
      polygon([[stem_y0, box_h - 0.01], [stem_y1, box_h - 0.01], [stem_y1, box_h + stem_len], [stem_y0 + stem_len, box_h + stem_len]]);
    for (z = [box_h + stem_len - 18, box_h + stem_len - 6], dy = [-9, 9])
      translate([stem_x0 - 1, antenna_y + dy - tie_t / 2, z - tie_w / 2]) cube([wall + 2, tie_t, tie_w]);
  }
}

// The motors stand on the back wall side by side between rims above and
// below (the side walls hold them across); the charge board over them. All
// grow off the back wall, so they print.
module motor_seats() {
  for (z = [mot_z0 - pocket_clear - rim_w, mot_top + pocket_clear])
    xz_extrude(plate_t - 0.01, plate_t + rim_h + 4) translate([-mot_x0 - mot_h, z]) square([2 * (mot_x0 + mot_h), rim_w]);
  xz_extrude(plate_t - 0.01, plate_t + rim_h) pocket_rim_2d(charge_pocket);
}

// The kit's pocket on the right wall: rims along Y only, which print as walls.
module wall_rims(p) {
  for (z = [p[1] - rim_w, p[3]]) translate([in_half - rim_h, p[0] - rim_w, z]) cube([rim_h + 0.01, p[2] - p[0] + 2 * rim_w, rim_w]);
}

module frame() {
  difference() {
    union() {
      xz_extrude(0, box_d) box_outline_2d();
      flanges();
      wall_rims(kit_pocket);
      stem();
      motor_seats();
    }
    translate([-in_half, plate_t, floor_t]) cube([box_in_w, box_d, ceiling - floor_t]);
    // The front door's groove and screws' pilots; the covers' screws' pilots in the slab.
    xz_extrude(box_d - groove_depth, box_d + 1) seal_band(groove_w);
    for (p = door_screws) y_cyl(p, box_d - pilot_depth, box_d + 1, m5_pilot_d, 24);
    for (sx = [-1, 1], p = cover_screws) y_cyl([sx * p[0], p[1]], -1, pilot_depth, m5_pilot_d, 24);
    // The pinions' hubs through the back wall: a tight hole, so the TPU seals round them.
    for (sx = [-1, 1]) y_cyl([sx * pinion_c[0], pinion_c[1]], -1, plate_t + 1, hub_d - hub_seal, 48);
    // Sockets for the idlers' pins, so each idler is held both sides.
    for (sx = [-1, 1], c = idlers_c) y_cyl([sx * c[0], c[1]], -1, pin_socket, gear_pin_d + 0.4, 32);
    // The output gears' hubs through the slab: a tight hole, so the TPU seals round them.
    for (sx = [-1, 1]) y_cyl([sx * ring_c[0], ring_c[1]], -1, flange_len + 1, out_hub_d - hub_seal, 48);
    // The plates' own screws into their seats.
    for (sx = [-1, 1], yc = rail_ycs, z = seat_zs) mirror([sx < 0 ? 1 : 0, 0, 0]) bolt45(yc, z, true);
    // Bulkhead through the top, relieved from inside down to bulkhead_wall_t;
    // the solar connector beside it.
    translate([antenna_x, antenna_y, ceiling - 1]) cylinder(d = n_hole_d, h = top_t + 2, $fn = 64);
    translate([antenna_x, antenna_y, ceiling - 1]) cylinder(d = n_body_d, h = top_t - bulkhead_wall_t + 1, $fn = 64);
    translate([solar_c[0], solar_c[1], ceiling - 1]) cylinder(d = solar_hole_d, h = top_t + 2, $fn = 64);
    // Pilots up into the floor for the panel's spine.
    for (y = pp_screw_ys) translate([0, y, -1]) cylinder(d = m5_pilot_d, h = pilot_depth + 1, $fn = 24);
  }
}

// The tongue's tip starts narrower than the groove and widens to full width
// over tongue_lead, in steps, so it leads itself in. Drawn from y = 0 into
// -y; the caller places it.
module tongue() {
  steps = 4;
  xz_extrude(-(tongue_len - tongue_lead), 0.01) seal_band(tongue_w);
  for (i = [0 : steps - 1])
    xz_extrude(-tongue_len + tongue_lead * i / steps, -tongue_len + tongue_lead * (i + 1) / steps + 0.01)
      seal_band(groove_w - 0.2 + (tongue_w - groove_w + 0.2) * i / steps);
}

module pocket_rim_2d(p) {
  difference() {
    translate([p[0] - rim_w, p[1] - rim_w]) square([p[2] - p[0] + 2 * rim_w, p[3] - p[1] + 2 * rim_w]);
    translate([p[0], p[1]]) square([p[2] - p[0], p[3] - p[1]]);
  }
}

// A door, drawn as the front one: the outline, the tongue into the rim's
// groove, the screws, and whatever it carries inside (in -y).
module door_plate() {
  difference() {
    union() {
      xz_extrude(0, cover_t) door_outline_2d();
      tongue();
      children();
    }
    for (p = door_screws) plate_screw([p[0], 0, p[1]], [0, 1, 0], cover_t);
  }
}

// Front door: the protection board, the winch XIAO and the driver, and two
// saddles that hold the cell.
module front_door() {
  translate([0, box_d, 0])
    door_plate() {
      xz_extrude(-rim_h, 0.01) for (p = front_pockets) pocket_rim_2d(p);
      for (z = saddle_zs)
        translate([0, 0, z - 4]) linear_extrude(8) difference() {
          translate([-in_half + 1, cell_c[1] - box_d + cell_r * 0.5]) square([2 * cell_r - 2, box_d - cell_c[1] - cell_r * 0.5 + 0.01]);
          translate([cell_c[0], cell_c[1] - box_d]) circle(r = cell_r + 0.3, $fn = 96);
        }
    }
}

// Gear cover (s = +1 right, -1 left, a mirror image), the user's small
// bolt-on one: a floor and a rim round one gear train, clipped at the
// middle where the two meet, bosses round its screws into the back slab,
// and pins in its floor: the idlers' run on into sockets in the slab, the
// output gear's into its rear, and a peg into the pinion's back, so every
// gear is held both sides. It doesn't
// seal: the box is sealed at the back wall and the slab.
module cover_hull_2d() {
  hull() {
    translate(pinion_c) circle(r = tip_r(pinion_z) + tray_gap + cover_wall, $fn = 48);
    for (c = idlers_c) translate(c) circle(r = tip_r(idler_z) + tray_gap + cover_wall, $fn = 64);
    translate(ring_c) circle(r = tip_r(out_z) + tray_gap + cover_wall, $fn = 64);
  }
}
module gear_cover(s = 1) {
  mirror([s < 0 ? 1 : 0, 0, 0])
    difference() {
      union() {
        xz_extrude(cover_y0, cover_y0 + cover_floor) intersection() { cover_hull_2d(); translate([0.25, -500]) square([1000, 1000]); }
        xz_extrude(cover_y0, -0.5) difference() {
          intersection() { cover_hull_2d(); translate([0.25, -500]) square([1000, 1000]); }
          intersection() { offset(-cover_wall) cover_hull_2d(); translate([-1, -500]) square([1000, 1000]); }
        }
        // Each screw's boss, solid round the shank, blended into the rim.
        for (p = cover_screws) let(d = cover_boss_d, inward = p[1] < pinion_c[1] - tip_r(pinion_z) ? [0, 1] : (lobe_z_at(p[0]) > p[1] ? gear_n : -gear_n))
          hull() {
            y_cyl(p, cover_y0, -0.5, p[1] < pinion_c[1] - tip_r(pinion_z) ? 16 : d);
            for (t = [-1, 1]) y_cyl(p + (d / 2 - 2) * inward + t * (d / 2 - 2) * [inward[1], -inward[0]], cover_y0, -0.5, 2);
          }
        for (c = idlers_c) y_cyl(c, cover_y0 + 0.01, pin_socket - 0.3, gear_pin_d, 32);
        y_cyl(ring_c, cover_y0 + 0.01, gear_y1 - 0.3, out_pin_d, 32);
        y_cyl(pinion_c, cover_y0 + 0.01, gear_y0 + pinion_peg_len - 0.3, pinion_peg_d, 32);
      }
      // M5 x 25s, their heads in a shallow counterbore at the back.
      for (p = cover_screws) {
        y_cyl(p, cover_y0 - 1, 0.5, m5_clear_d, 32);
        y_cyl(p, cover_y0 - 1, cover_y0 + 3, m5_head_d, 32);
      }
    }
}

// The reel's hub: its journal turns in the rear plate's bearing bore, its
// hex key goes into the reel's rear, and the output gear's hex tip into it.
module reel_hub() {
  difference() {
    union() {
      y_cyl(ring_c, rear_y0 + 0.5, rflange_y0 + 0.01, spool_core_d, 96);
      xz_extrude(rflange_y0, rflange_y0 + 12) translate(ring_c) circle(d = spigot_af / cos(30), $fn = 6);
    }
    xz_extrude(rear_y0, rear_y0 + 12.5) translate(ring_c) circle(d = (out_hex + 0.4) / cos(30), $fn = 6);
  }
}

// Reel (right side), axis Y at ring_c: its rear flange, the drum, and a
// hex spigot at the front that the separate front flange keys onto, and a
// journal on past it into the front plate's bearing. The reel's hub keys
// into a hex socket in its rear (its roof a 45° cone, as it prints rear
// down). The line's end wedges into a V jam cleat at the core's front end,
// under the flange.
module spool() {
  difference() {
    union() {
      xz_extrude(rflange_y0, drum_y0) translate(ring_c) circle(d = spool_od, $fn = 128);
      y_cyl(ring_c, drum_y0 - 0.01, drum_y1, spool_core_d, 64);
      xz_extrude(drum_y1 - 0.01, drum_y1 + spool_flange_t - 0.2) translate(ring_c) circle(d = spigot_af / cos(30), $fn = 6);
      y_cyl(ring_c, drum_y1 + spool_flange_t - 0.21, front_y1 - 0.3, front_journal_d, 96);
    }
    xz_extrude(rflange_y0 - 1, rflange_y0 + 12.3) translate(ring_c) circle(d = (spigot_af + 0.4) / cos(30), $fn = 6);
    translate([ring_c[0], rflange_y0 + 12.29, ring_c[1]]) rotate([-90, 0, 0]) cylinder(d1 = (spigot_af + 0.4) / cos(30), d2 = 0, h = (spigot_af + 0.4) / cos(30) / 2, $fn = 6);
    xz_extrude(drum_y1 - cleat_len, drum_y1 + spool_flange_t + 1) translate(ring_c)
      polygon([[spool_core_d / 2 + 1, -cleat_mouth / 2], [spool_core_d / 2 + 1, cleat_mouth / 2],
               [spool_core_d / 2 - cleat_depth, cleat_throat / 2], [spool_core_d / 2 - cleat_depth, -cleat_throat / 2]]);
  }
}

module reel_flange() {
  xz_extrude(drum_y1, drum_y1 + spool_flange_t) translate(ring_c)
    difference() {
      circle(d = spool_od, $fn = 128);
      circle(d = spigot_af / cos(30) + 0.5, $fn = 6);
    }
}

// Pinion on the motor's D-shaft, behind the back wall, its hub through the
// wall's lip seal, its back on the cover's peg. An M3 grub screw from the root between two teeth, at the
// gear's mid-plane, on the shaft's flat, holds it and pulls the motor onto
// the back wall.
module pinion() {
  grub = 180 / pinion_z;
  difference() {
    union() {
      herringbone(pinion_c, pinion_z, pinion_psi, 1);
      y_cyl(pinion_c, gear_y1 - 0.01, plate_t - 0.5, hub_d);
    }
    xz_extrude(gear_y0 - 1, plate_t) translate(pinion_c) rotate(pinion_psi + grub)
      intersection() {
        circle(d = shaft_d + 0.15, $fn = 32);
        translate([-shaft_d / 2 - 0.1, -shaft_d]) square([shaft_flat + 0.15, 2 * shaft_d]);
      }
    translate([pinion_c[0], (gear_y0 + gear_y1) / 2, pinion_c[1]]) rotate([0, -(pinion_psi + grub), 0]) rotate([0, 90, 0]) cylinder(d = 2.5, h = pitch_r(pinion_z) + 2, $fn = 16);
    // Its back rides on the cover's peg.
    y_cyl(pinion_c, gear_y0 - 1, gear_y0 + pinion_peg_len, pinion_peg_d + 0.4, 32);
  }
}

// Idlers (i = 0, 1): a herringbone with a print-in-place roller bearing in
// its hub (the user's), printed in one piece: the gear is the outer race,
// the hub goes on the cover's pin, and pip_n pins with a 45° collar run in V
// grooves in both. A herringbone turned over is the other hand, so all four
// are one part.
module idler(i = 0) {
  c = idlers_c[i];
  hr = idler_hub_r;
  place = [c[0], gear_y0, c[1]];
  difference() {
    union() {
      difference() {
        herringbone(c, idler_z, idler_psis[i], i == 0 ? -1 : 1);
        y_cyl(c, gear_y0 - 1, gear_y1 + 1, 2 * pipr_o(hr), 96);
      }
      y_cyl(c, gear_y0, gear_y1, 2 * hr, 48);
    }
    y_cyl(c, gear_y0 - 1, gear_y1 + 1, gear_pin_d + 0.3, 32);
    translate(place) rotate([-90, 0, 0]) rotate_extrude($fn = 96) intersection() {
      offset(delta = pip_c) translate([pipr_c(hr), 0]) union() { pin_2d(gear_w); mirror([1, 0]) pin_2d(gear_w); }
      translate([0, -1]) square([pitch_r(idler_z), gear_w + 2]);
    }
  }
  translate(place) rotate([-90, 0, 0]) for (k = [0 : pip_n - 1]) rotate(k * 360 / pip_n) translate([pipr_c(hr), 0, 0])
    rotate_extrude($fn = 24) intersection() { pin_2d(gear_w); square([pip_rn + pip_b, gear_w - 0.4]); }
}

// Output gear, on the reel's axis: on its pin in the cover (with silicone
// oil; it's too small for a bearing inside its teeth), its hub out through
// the slab's lip seal, its hex tip into the reel's hub.
module output_gear() {
  difference() {
    union() {
      herringbone(ring_c, out_z, out_psi, -1);
      y_cyl(ring_c, gear_y1 - 0.01, rear_y0, out_hub_d, 48);
      xz_extrude(rear_y0 - 0.01, rear_y0 + 12) translate(ring_c) circle(d = out_hex / cos(30), $fn = 6);
    }
    y_cyl(ring_c, gear_y0 - 1, gear_y1 - 0.3, out_pin_d + 0.4, 32);
  }
}

// Crossmembers round each reel's ring: [x, z, a], a the angle out from the
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

// A crossmember in its own frame: x radial (0 its inner face, xbar_t its
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
module lock_screw_local(at_front, t = cage_t - dv_depth) {
  translate([xbar_t / 2, 0, 0])
    if (at_front) plate_screw([0, xbar_total, 0], [0, 1, 0], t);
    else plate_screw([0, 0, 0], [0, -1, 0], t);
}

// The cheeks' frame (right reel): a cheek's inner face at x0, the frame's
// origin at the rear plate's front face less dv_depth, as for a bar.
module place_cheek(x0) { translate([x0, rear_y1 - dv_depth, 0]) children(); }

// What both holder plates share (right reel): a ring all the way round the
// reel with a bar across it at the axle round a boss and four spokes; the
// flat outer part, up the ring's outer side to the roller window on top;
// the flat inner edge that seats in the box's channel; and members from the
// ring's top and bottom, and the roller window's top, to that edge's ends.
module holder_2d() {
  translate(ring_c) {
    difference() { circle(r = ring_r1, $fn = 128); circle(r = ring_r0, $fn = 128); }
    circle(d = rear_brg[4] + 12, $fn = 96);
    translate([-ring_r0 - 1, -bar_w / 2]) square([2 * ring_r0 + 2, bar_w]);
    for (a = [45, 135, 225, 315]) rotate(a) translate([0, -bar_w / 2]) square([ring_r0 + 1, bar_w]);
  }
  difference() {
    hull() {
      for (p = lower_c) translate(p) circle(r = roller_boss_r, $fn = 48);
      translate([win_x0, cheek_z0]) square([win_x1 - win_x0, win_z1 - cheek_z0]);
      translate(ring_c) for (a = [-15, 75]) rotate(a) translate([ring_r0, -1]) square([ring_w, 2]);
    }
    translate(ring_c) circle(r = ring_r0, $fn = 128);
    // Lighten the tower, keeping solid bosses round the lower rollers' bolts.
    difference() {
      offset(-bar_w) hull() {
        for (p = lower_c) translate(p) circle(r = roller_boss_r, $fn = 48);
        translate(ring_c) for (a = [-15, 75]) rotate(a) translate([ring_r1, -1]) square([0.01, 2]);
      }
      for (p = lower_c) translate(p) circle(r = roller_boss_r - 4, $fn = 48);
      hull() for (p = lower_c) translate(p) circle(r = bar_w, $fn = 32);
    }
  }
  hull() {
    translate([seat_x0, strip_z0]) square([seat_x1 - seat_x0, box_h - strip_z0]);
    translate(ring_c) for (a = [165, 195]) rotate(a) translate([ring_r0, -1]) square([ring_w, 2]);
  }
  // Crossmembers from the ring's top and bottom to the mounting face's top
  // and bottom ends (the user's), tying the ring to the box both ways.
  for (top = [true, false]) hull() {
    translate(ring_c + [0, top ? ring_r1 - bar_w / 2 : -ring_r1 + bar_w / 2]) circle(d = bar_w, $fn = 32);
    translate([seat_x0, top ? box_h - bar_w : strip_z0]) square([seat_x1 - seat_x0, bar_w]);
  }
  // And from the roller window's top to the mounting face's top.
  hull() {
    translate([win_x0, win_z1 - bar_w]) square([bar_w, bar_w]);
    translate([seat_x0, box_h - bar_w]) square([seat_x1 - seat_x0, bar_w]);
  }
}

// What a plate's inner edge loses to its channel: the indexing notches and the bolts' holes.
module plate_edge(yc) {
  for (z = idx_zs) translate([seat_x0 - 1, yc - cage_t, z - idx_len / 2 - 0.2]) cube([idx_d + 1.3, 2 * cage_t, idx_len + 0.4]);
  for (z = seat_zs) bolt45(yc, z);
}

// Everything a holder plate takes from the bars and the cheeks.
module plate_joints(at_front) {
  for (b = xbars()) if (b[0] > 0) place_xbar(b) { socket_local(at_front); lock_screw_local(at_front); }
  for (x = cheek_x0s, z = cheek_tenon_zs) place_cheek(x) translate([0, 0, z]) {
    socket_local(at_front, win_x1 + 10 - x);
    lock_screw_local(at_front);
  }
}

// Front plate (s = +1 right, -1 left, a mirror image): its inner edge on the
// front rib, behind the lip. It carries the reel's front axle and the lower
// rollers' threaded ends.
module front_plate(s = 1) {
  mirror([s < 0 ? 1 : 0, 0, 0])
    difference() {
      xz_extrude(front_y0, front_y1) holder_2d();
      y_cyl(ring_c, front_y0 - 1, front_y1 + 1, front_brg[4] - 2 * rb_press, 128);
      for (p = lower_c) y_cyl(p, front_y0 - 1, front_y1 + 1, m5_pilot_d, 24);
      plate_edge(rail_ycs[1]);
      plate_joints(true);
    }
}

// Rear plate (s as above): its inner edge on the back slab. The reel's hub
// runs in its bearing bore; it carries the lower rollers' bolt heads.
module rear_plate(s = 1) {
  mirror([s < 0 ? 1 : 0, 0, 0])
    difference() {
      xz_extrude(rear_y0, rear_y1) holder_2d();
      y_cyl(ring_c, rear_y0 - 1, rear_y1 + 1, rear_brg[4] - 2 * rb_press, 128);
      for (p = lower_c) plate_screw([p[0], rear_y1, p[1]], [0, -1, 0]);
      plate_edge(rail_ycs[0]);
      plate_joints(false);
    }
}

// Fairlead cheek (right reel), in the bar frame: a plate between the two
// holder plates' towers, two tenons into each. outer: the outboard cheek,
// the upper rollers' bolt heads on its outside; the inboard one takes their threads.
module cheek_local(outer) {
  yc = xbar_total / 2;
  difference() {
    union() {
      translate([0, dv_depth, 0]) rotate([90, 0, 90]) linear_extrude(cage_t)
        rounded_rect([0, cheek_z0], [xbar_len, cheek_z1], corner_r);
      for (z = cheek_tenon_zs) translate([0, 0, z]) {
        translate([0, dv_depth, 0]) mirror([0, 1, 0]) dovetail(cage_t);
        translate([0, dv_depth + xbar_len, 0]) dovetail(cage_t);
      }
    }
    for (z = cheek_tenon_zs, y = [-0.01, xbar_total - pilot_depth + 0.01])
      translate([cage_t / 2, y, z]) rotate([-90, 0, 0]) cylinder(d = m5_pilot_d, h = pilot_depth, $fn = 24);
    for (dy = [-roff, roff])
      if (outer) plate_screw([0, yc + dy, fl_zb], [1, 0, 0], cage_t);
      else translate([-1, yc + dy, fl_zb]) rotate([0, 90, 0]) cylinder(d = m5_pilot_d, h = cage_t + 2, $fn = 24);
  }
}

module cheeks(s = 1) {
  mirror([s < 0 ? 1 : 0, 0, 0]) for (i = [0, 1]) place_cheek(cheek_x0s[i]) cheek_local(i == 1);
}

// Print-in-place roller bearing for one end of a roller whose supports are
// span apart, standing on its outer face at z = 0: the hub, up to the
// roller's middle; the race, rb_h tall; and pip_n pins between with a 45°
// collar at mid height running in V grooves in both. All three start on
// the bed.
module pinp_2d(h, rn, b, grow = 0) {
  polygon([[0, -1], [rn + grow, -1], [rn + grow, h / 2 - b - grow], [rn + b + grow, h / 2],
           [rn + grow, h / 2 + b + grow], [rn + grow, h + 1], [0, h + 1]]);
}
module pin_2d(h, grow = 0) {
  polygon([[0, -1], [pip_rn + grow, -1], [pip_rn + grow, h / 2 - pip_b - grow], [pip_rn + pip_b + grow, h / 2],
           [pip_rn + grow, h / 2 + pip_b + grow], [pip_rn + grow, h + 1], [0, h + 1]]);
}
// A reel's bearing (g = front_brg or rear_brg), a plate thick, standing on
// z = 0: the inner race on the journal, the outer race pressed into the
// plate, and pins between with a 45° collar running in V grooves in both.
module reel_bearing(g) {
  h = cage_t;
  n = floor(2 * PI * g[2] / (2 * (rbp_rn + rbp_b) + 1.2));
  difference() {
    union() {
      difference() { cylinder(r = g[1], h = h, $fn = 96); translate([0, 0, -1]) cylinder(d = g[0], h = h + 2, $fn = 96); }
      difference() { cylinder(d = g[4], h = h, $fn = 128); translate([0, 0, -1]) cylinder(r = g[3], h = h + 2, $fn = 128); }
    }
    rotate_extrude($fn = 128) intersection() {
      offset(delta = rbp_c) translate([g[2], 0]) union() { pinp_2d(h, rbp_rn, rbp_b); mirror([1, 0]) pinp_2d(h, rbp_rn, rbp_b); }
      translate([0, -1]) square([g[4], h + 2]);
    }
  }
  for (k = [0 : n - 1]) rotate(k * 360 / n) translate([g[2], 0, 0])
    rotate_extrude($fn = 24) intersection() { pinp_2d(h, rbp_rn, rbp_b); square([rbp_rn + rbp_b, h - 0.4]); }
}
module reel_bearings() {
  y_place(front_y0) reel_bearing(front_brg);
  y_place(rear_y0) reel_bearing(rear_brg);
}
// A shape built along +z placed on the reel's axis from y.
module y_place(y) { translate([ring_c[0], y, ring_c[1]]) rotate([-90, 0, 0]) children(); }

module roller_bearing(span) {
  hub_h = span / 2 - washer_t - 0.15;
  difference() {
    union() {
      cylinder(r = pip_hub_r, h = hub_h, $fn = 48);
      difference() {
        cylinder(d = rb_d, h = rb_h, $fn = 96);
        translate([0, 0, -1]) cylinder(r = pip_ro, h = rb_h + 2, $fn = 96);
      }
    }
    translate([0, 0, -1]) cylinder(d = axle_d, h = hub_h + 2, $fn = 32);
    rotate_extrude($fn = 96) intersection() {
      offset(delta = pip_c) translate([pip_rc, 0]) union() { pin_2d(rb_h); mirror([1, 0]) pin_2d(rb_h); }
      translate([0, -1]) square([rb_d, rb_h + 2]);
    }
  }
  for (k = [0 : pip_n - 1]) rotate(k * 360 / pip_n) translate([pip_rc, 0, 0])
    rotate_extrude($fn = 24) intersection() { pin_2d(rb_h); square([pip_rn + pip_b, rb_h - 0.4]); }
}

// The roller's sleeve for supports span apart, standing on z = 0: the outer
// sleeve, ribs and an inner tube clear of the hubs, a seat at each end for a
// bearing (a press fit), each seat's floor a 45° cone so it prints on end.
module roller_sleeve(span) {
  h = span - 2 * washer_t;
  in_r = pip_hub_r + 0.5;
  difference() {
    union() {
      difference() {
        cylinder(d = roller_d, h = h, $fn = 96);
        translate([0, 0, -1]) cylinder(d = roller_d - 2 * roller_wall, h = h + 2, $fn = 96);
      }
      cylinder(r = in_r + 2, h = h, $fn = 48);
      for (k = [0 : roller_ribs - 1]) rotate(k * 360 / roller_ribs) translate([0, -roller_rib_t / 2, 0]) cube([roller_d / 2 - roller_wall / 2, roller_rib_t, h]);
      for (z = [0, h - rb_h - rb_d / 2]) translate([0, 0, z]) cylinder(d = roller_d - 0.01, h = rb_h + rb_d / 2, $fn = 96);
    }
    translate([0, 0, -1]) cylinder(r = in_r, h = h + 2, $fn = 48);
    for (m = [0, 1]) translate([0, 0, m * h]) mirror([0, 0, m]) {
      translate([0, 0, -1]) cylinder(d = rb_d - rb_press * 2, h = rb_h + 1, $fn = 96);
      translate([0, 0, rb_h - 0.01]) cylinder(d1 = rb_d - rb_press * 2, d2 = 2 * in_r, h = (rb_d / 2 - in_r), $fn = 96);
    }
  }
}

// A roller assembled between supports span apart, from z = 0: washer gap,
// bearing, sleeve, bearing, washer gap.
module roller(span) {
  translate([0, 0, washer_t]) roller_sleeve(span);
  translate([0, 0, washer_t]) roller_bearing(span);
  translate([0, 0, span - washer_t]) mirror([0, 0, 1]) roller_bearing(span);
}

// The four rollers round each window: the lower pair front to back, plate to
// plate; the upper pair across, cheek to cheek.
module rollers(s = 1) {
  mirror([s < 0 ? 1 : 0, 0, 0]) {
    for (p = lower_c) translate([p[0], rear_y1, p[1]]) rotate([-90, 0, 0]) roller(xbar_len);
    for (dy = [-roff, roff]) translate([fl_xc - upper_len / 2, line_y + dy, fl_zb]) rotate([0, 90, 0]) roller(upper_len);
  }
}

// Place a shape drawn in the panel's plane, centred on the panel: x across,
// y up its slope (toward the box), z through it.
module on_panel() {
  translate(panel_c) rotate([panel_rot, 0, 0]) children();
}

// A bar along a panel edge (s = +1 the top edge, -1 the bottom: the same
// piece turned round), its groove holding the panel's edge. The bars pass
// through the spine's slots and the panel slides into their grooves from
// the side; a zip tie round each bar and the spine keeps them there.
module panel_bar(s = 1) {
  difference() {
    on_panel() translate([-panel_w / 2 - 4, s > 0 ? panel_h / 2 - pp_groove : -panel_h / 2 + pp_groove - pbar_w, -pbar_t / 2]) cube([panel_w + 8, pbar_w, pbar_t]);
    on_panel() cube([panel_w + 20, panel_h + 0.6, panel_t + 0.4], center = true);
  }
}

// Spine under the box, in the middle: a top member screwed up into the
// floor, a leg from its end nearer the panel to the top bar, a member behind
// the panel to the bottom bar, and a diagonal from its other end to the
// bottom bar. Both bars pass through it in slots.
module spine() {
  difference() {
    union() {
      yz_extrude(-cage_t / 2, cage_t / 2) {
        translate([pp_ya, -pp_t]) square([pp_yb - pp_ya, pp_t]);
        hull() { translate([panel_side > 0 ? pp_yb - pp_t : pp_ya, -pp_t]) square([pp_t, pp_t - flange_h - 0.5]); translate(pp_pts[0]) circle(d = pp_t, $fn = 32); }
        hull() for (p = pp_pts) translate(p) circle(d = pp_t, $fn = 32);
        hull() { translate([panel_side > 0 ? pp_ya : pp_yb - pp_t, -pp_t]) square([pp_t, pp_t]); translate(pp_pts[1]) circle(d = pp_t, $fn = 32); }
        for (c = pbar_cs) translate(c) rotate(panel_rot) square([pbar_w + 12, pbar_t + 12], center = true);
      }
    }
    for (s = [1, -1]) on_panel() translate([0, s * pbar_off, 0]) cube([cage_t + 2, pbar_w + 0.5, pbar_t + 0.5], center = true);
    on_panel() cube([panel_w + 20, panel_h + 0.6, panel_t + 0.4], center = true);
    for (y = pp_screw_ys) plate_screw([0, y, 0], [0, 0, -1], pp_t);
  }
}

// Print orientations.
// The box prints back face down; the doors outer face down.
module frame_print() { rotate([90, 0, 0]) frame(); }
module front_door_print() { translate([0, 0, box_d + cover_t]) rotate([-90, 0, 0]) front_door(); }
module gear_cover_print(s = 1) { rotate([90, 0, 0]) translate([0, -cover_y0, 0]) gear_cover(s); }
// Gears and reels print on a face: the reel on its rear flange, its hub on its key.
module spool_print() { rotate([90, 0, 0]) translate([-ring_c[0], -rflange_y0, -ring_c[1]]) spool(); }
module reel_bearing_print(front = true) { reel_bearing(front ? front_brg : rear_brg); }
module reel_hub_print() { translate([0, 0, rflange_y0 + 12]) rotate([-90, 0, 0]) translate([-ring_c[0], 0, -ring_c[1]]) reel_hub(); }
// The left output gear is the right one's mirror image (its hub is on one
// side, so it can't just be turned over the way the idlers and pinions can).
module output_gear_print(s = 1) { mirror([s < 0 ? 1 : 0, 0, 0]) rotate([90, 0, 0]) translate([-ring_c[0], -gear_y0, -ring_c[1]]) output_gear(); }
module reel_flange_print() { rotate([90, 0, 0]) translate([-ring_c[0], -drum_y1, -ring_c[1]]) reel_flange(); }
module pinion_print() { rotate([90, 0, 0]) translate([-pinion_c[0], -gear_y0, -pinion_c[1]]) pinion(); }
module idler_print() { rotate([90, 0, 0]) translate([-idlers_c[0][0], -gear_y0, -idlers_c[0][1]]) idler(0); }
// Holder plates print flat, sockets up.
module front_plate_print(s = 1) { rotate([-90, 0, 0]) translate([0, -front_y1, 0]) front_plate(s); }
module rear_plate_print(s = 1) { rotate([90, 0, 0]) translate([0, -rear_y0, 0]) rear_plate(s); }
// Crossmembers and cheeks lie on a face, so their dovetails' outlines are in the bed's plane.
module xbar_print() { rotate([0, -90, 0]) xbar_local(); }
module cheek_print(outer) {
  if (outer) translate([0, 0, cage_t]) rotate([0, 90, 0]) translate([0, 0, -cheek_z0]) cheek_local(true);
  else rotate([0, -90, 0]) translate([0, 0, -cheek_z0]) cheek_local(false);
}
module roller_print(long = true) { roller_sleeve(long ? xbar_len : upper_len); }
module roller_bearing_print(long = true) { roller_bearing(long ? xbar_len : upper_len); }
module spine_print() { translate([0, 0, cage_t / 2]) rotate([0, 90, 0]) spine(); }
module panel_bar_print(s = 1) { translate([0, 0, pbar_t / 2]) rotate([-panel_rot, 0, 0]) translate(-panel_c) panel_bar(s); }

// Reference hardware, not printed.
module cell() {
  translate([cell_c[0], cell_c[1], cell_z0]) cylinder(d = cell_d, h = cell_len, $fn = 64);
}

module antenna() {
  translate([antenna_x, antenna_y, box_h]) {
    cylinder(r = nut_r, h = 4, $fn = 6);
    translate([0, 0, 4]) cylinder(d = antenna_nut_d, h = antenna_nut_len, $fn = 48);
    translate([0, 0, 4 + antenna_nut_len]) cylinder(d = antenna_d, h = antenna_len, $fn = 48);
  }
  translate([antenna_x, antenna_y, bulkhead_bottom]) cylinder(r = nut_r, h = n_body_len, $fn = 6);
}

module boards() {
  translate([charge_pocket[0] + pocket_clear, plate_t, charge_pocket[1] + pocket_clear]) cube([board_dims[0], board_dims[2], board_dims[1]]);
  for (i = [0 : len(front_pockets) - 1])
    translate([front_pockets[i][0] + pocket_clear, box_d - front_dims[i][2], front_pockets[i][1] + pocket_clear]) cube([front_dims[i][0], front_dims[i][2], front_dims[i][1]]);
  translate([in_half - kit_t, kit_pocket[0] + pocket_clear, kit_pocket[1] + pocket_clear]) cube([kit_t, kit_w, kit_h]);
}

// The room kept on the right wall for a 1 W module, in the kit's place.
module radio_room() {
  translate([in_half - radio_room[2], room_y0, kit_top - radio_room[1]]) cube([radio_room[2], radio_room[0], radio_room[1]]);
}

module motors() {
  for (s = [-1, 1]) mirror([s < 0 ? 1 : 0, 0, 0]) {
    translate([mot_x0, plate_t, mot_z0]) cube([mot_h, mot_d, mot_encoder + mot_len]);
    y_cyl(pinion_c, plate_t - shaft_len, plate_t, shaft_d, 24);
  }
}

module panel() {
  on_panel() cube([panel_w, panel_h, panel_t], center = true);
}

module solar_connector() {
  translate([solar_c[0], solar_c[1], box_h]) cylinder(d = 22, h = 3, $fn = 6);
}

// Assembly groups, both sides.
module doors() { front_door(); }
module covers() { gear_cover(1); gear_cover(-1); }
module drive() { for (m = [0, 1]) mirror([m, 0, 0]) { pinion(); idler(0); idler(1); output_gear(); } }
module reels() { for (m = [0, 1]) mirror([m, 0, 0]) { spool(); reel_flange(); reel_hub(); reel_bearings(); } }
module holders() { for (s = [-1, 1]) { front_plate(s); rear_plate(s); } for (b = xbars()) xbar(b); }
module fairleads() { cheeks(1); cheeks(-1); }
module all_rollers() { rollers(1); rollers(-1); }
module panel_mount() { spine(); panel_bar(1); panel_bar(-1); }
