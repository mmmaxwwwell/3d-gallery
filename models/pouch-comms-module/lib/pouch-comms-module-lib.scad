// Pouch comms module: a box that rides in a backpack side pouch, holding a
// power bank, a Franklin T9 hotspot, and three boards: a Raspberry Pi Zero
// 2 W, a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow) and a Heltec WiFi LoRa 32
// V4, plus two FR120N MOSFET modules that switch LED loads.
//
// Pieces:
// - the box: floor and walls;
// - a flat lid on a ring of M3 cap screws. A tongue on top of the walls and
//   the divider drops into a groove under the lid, so the lid only goes on
//   one way and can't shift;
// - two clamps, one over each end of the T9, each screwed onto two pillars,
//   that hold it down.
//
// The T9's power button is centred on its +X side. An M3 set screw through
// the right wall, threaded through a nut in a block inside it, holds the
// button in, so the T9 always starts when it gets power. A hex key reaches
// it through the wall with the lid on.
//
// Plan, looking down on the open box, +Y up (the end that sticks out of
// the pouch):
//   - left column: the power bank lying flat, ports toward +Y, held between
//     the left wall's screw bosses and a full-height divider. A rib at its
//     -Y end stops it, and two posts catch the corners of its port end.
//   - above the bank: an open bay for its plugs and the cables. The divider
//     stops at the bank's end, so the bay opens into the right column. Two
//     SMA bulkheads go through the +Y wall over it, for the HC33's HaLow
//     and the V4's LoRa antennas on U.FL pigtails.
//   - right column: the T9 at -Y, face up, between corner brackets, with its
//     micro-USB end toward +Y. A clamp over each end sits on two pillars,
//     the +Y pair either side of the plug. Past them, beside the bank, the
//     three boards stand on edge in slots, packed against the divider, long
//     side along Y, ends against the +Y wall. Each slides down into a groove
//     in the floor between two slotted posts: a full-height one at its +Y
//     end, cut away where that end has parts, and a low one at its -Y end
//     (the HC33's and V4's USB-C, the Pi's micro-SD) that stays under the
//     parts there. The Pi's ports face up. The shortest board (V4) takes the
//     slot nearest the T9's plug. Past the boards, toward the right wall,
//     the FR120Ns lie on the floor in rails, terminals up.
//
// Frame: origin at the box's outer -X -Y bottom corner, X across, Y along,
// Z up. Box, lid and clamps print as modelled, bottom face down.

// BEGIN_PARAMS
// Outer size across (X) and along (Y); the height follows from the bank
outer_w = 140;
outer_l = 190;

// Walls, floor and lid
wall = 5;

// Outside corner radius
corner_r = 6;

// Power bank lying flat: across, along, height
bank_w = 44.5;
bank_l = 145;
bank_h = 36.5;

// Clearance round the bank per side, and over its top under the lid
bank_fit = 0.5;
bank_head = 1;

// Rib that stops the bank at its -Y end, and its height
bank_stop_h = 10;

// Posts that catch the bank's port-end corners: how far each reaches in
// from the side, and its thickness along Y. The middle of the end stays
// clear for the ports
bank_post_reach = 5;
bank_post_t = 3;

// Divider between the bank and the electronics
divider_t = 2;

// Franklin T9: across, along, height
t9_w = 67;
t9_l = 94;
t9_h = 14;

// The T9's micro-USB is centred on its +Y end and its power button centred
// on its +X side, both across and up.

// Room the micro-USB plug and its cable's bend need past the T9's end
t9_plug_room = 25;
// Half the plug's width plus clearance, either side of the T9's centre
t9_plug_half = 8;

// Corner brackets that place the T9: wall, leg, height, clearance
bracket_wall = 1.2;
bracket_leg = 10;
bracket_h = 4;
bracket_clear = 0.5;

// Clamps: pillar size, the plate's thickness, how far it reaches over the
// T9's end, and how far the pillars stop under the T9's face, so the
// screws draw the clamp down onto the T9
pillar_s = 8;
clamp_t = 6;
clamp_lap = 6;
clamp_squeeze = 0.5;

// M3 set screw on the button: its length, the nut's across flats,
// thickness and its slot's clearance, and the block's width along Y and
// its gap to the T9's side
button_screw_l = 10;
nut_af = 5.5;
nut_h = 2.4;
nut_fit = 0.3;
button_block_w = 11;
button_block_gap = 0.5;

// The boards stand on edge, top face toward +X. Each is its length and
// height as it stands, PCB thickness, and how far its parts stand over the
// top face and under the bottom face.

// Heltec HT-HC33, from its datasheet (Rev 1.0 §7.1), thickness and parts
// measured. Its micro-SD socket sticks 1.54 out of the +Y end
hc_l = 60;
hc_w = 33.5;
hc_pcb = 1.5;
hc_over = 3.3;
hc_under = 3.6;

// Heltec WiFi LoRa 32 V4, from its datasheet (Rev 1.4 §5): 51.69 to the
// tip of its chamfered antenna end, the USB-C 1.1 past the other; the OLED
// stands 5.5 over, the battery and solar sockets 3.6 under. Header pins
// not fitted
v4_l = 51.69;
v4_w = 25.4;
v4_pcb = 1.6;
v4_over = 5.5;
v4_under = 3.6;

// Raspberry Pi Zero 2 W, from its mechanical drawing (65 x 30). PCB and
// parts' heights unmeasured; 5 overall. No GPIO header fitted
pi_l = 65;
pi_w = 30;
pi_pcb = 1;
pi_over = 3;
pi_under = 1;

// How high each board's low post grips, up from the board's bottom edge:
// under the HC33's buttons (7.1 up), the V4's buttons (3.0) and the Pi's
// micro-SD socket (7.1)
hc_low = 6.5;
v4_low = 2.8;
pi_low = 6.5;

// Bands of each board's +Y end, up from its bottom edge, where its high
// post is cut away: the HC33's micro-SD and U.FL, the V4's LoRa U.FL, the
// Pi's camera connector
hc_gaps = [[8.5, 25]];
v4_gaps = [[8, 17.4]];
pi_gaps = [[6.4, 23.2]];

// Gap between neighbouring boards' parts, and from the last board to the
// FR120Ns' rails
board_gap = 4;

// Board slots: clearance over the PCB's thickness, depth of the groove in
// the floor, the posts' wall either side of the slot, how far a post's
// slot reaches over the board's end
slot_fit = 0.4;
floor_slot = 1.5;
guide_wall = 1.5;
guide_engage = 2.5;

// FR120N MOSFET modules (DIYables), lying on the floor past the boards,
// screw terminals up: count, length and width, PCB, the terminals' height
// over it, and the solder tails under it (the last two unmeasured)
fr_n = 2;
fr_l = 33.5;
fr_w = 16.5;
fr_pcb = 1.6;
fr_h = 10;
fr_tails = 2;

// Wire room past each module's ends, the rails' ledge under each long
// edge and their wall, and the modules' fit
fr_wire_room = 8;
rail_ledge = 1.2;
rail_wall = 1.6;
fr_fit = 0.3;

// SMA bulkheads (1/4-36): their X positions over the bay, hole through
// the end wall, the inner nut across corners, and how far the connector's
// back and the pigtail's bend reach in from the wall
sma_xs = [17, 40];
sma_hole_d = 6.6;
sma_nut_d = 9.2;
sma_behind = 12;

// M3 cap screws through the lid: distance in from the outside, most
// spacing allowed, boss diameter, pilot and its depth, clearance hole,
// counterbore diameter and depth. The clamps' screws use the same holes
screw_e = 4.5;
screw_pitch = 33;
boss_d = 7;
pilot_d = 2.5;
pilot_depth = 10;
clear_d = 3.4;
cbore_d = 6;
cbore_h = 3;

// Indexing tongue on the walls and divider: distance in from the outside,
// width, height; the lid's groove clearance per side
tongue_e = 1.6;
tongue_w = 1.2;
tongue_h = 1.5;
groove_fit = 0.2;
// END_PARAMS

eps = 0.01;

inner_h = bank_h + bank_head;
box_h = wall + inner_h;
total_h = box_h + wall;

y_in0 = wall;
y_in1 = outer_l - wall;
// Inside the screw bosses
clear_e = screw_e + boss_d / 2;

function fill(a, b, p) = let(n = ceil((b - a) / p)) [for (i = [0:n]) a + i * (b - a) / n];

// Bank pocket, between the left bosses and the divider
bank_x0 = clear_e;
bank_x1 = bank_x0 + bank_w + 2 * bank_fit;
bank_y0 = clear_e + bank_fit;
bank_y1 = bank_y0 + bank_l + 2 * bank_fit;
div_x0 = bank_x1;
div_x1 = bank_x1 + divider_t;
div_y1 = bank_y1 + bank_post_t;
div_cx = (div_x0 + div_x1) / 2;

col_x0 = div_x1;
col_x1 = outer_w - clear_e;
col_cx = (col_x0 + col_x1) / 2;

// T9 pocket; its micro-USB end is +Y. The -Y clamp's pillars stand
// between it and the end wall's bosses
t9_y0 = clear_e + 0.5 + pillar_s + bracket_clear;
t9_cy = t9_y0 + t9_l / 2;
t9_y1 = t9_y0 + t9_l;
t9_top = wall + t9_h;
t9_bracket_y1 = t9_y1 + bracket_clear + bracket_wall;

// Clamp pillars, a pair past each end of the T9, either side of its
// centre: at +Y, either side of the plug. They miss the corner brackets'
// legs, so they sit just clear of the T9's ends
pillar_dx = t9_plug_half + pillar_s / 2;
pillar_dy = t9_l / 2 + bracket_clear + pillar_s / 2;
pillars = [for (sy = [-1, 1], sx = [-1, 1]) [col_cx + sx * pillar_dx, t9_cy + sy * pillar_dy]];
pillar_y1 = t9_cy + pillar_dy + pillar_s / 2;
pillar_top = t9_top - clamp_squeeze;
t9_x1 = col_cx + t9_w / 2;
button_z = wall + t9_h / 2;
button_block_x0 = t9_x1 + button_block_gap;
button_block_x1 = outer_w - wall;
button_nut_x = (button_block_x0 + button_block_x1) / 2;
clamp_half_w = pillar_dx + pillar_s / 2;

// Boards, from the divider out: [length, height, pcb, over, under, low
// post's grip, high post's gaps], packed board_gap apart from 1 mm off
// the divider
boards = [
  [hc_l, hc_w, hc_pcb, hc_over, hc_under, hc_low, hc_gaps],
  [pi_l, pi_w, pi_pcb, pi_over, pi_under, pi_low, pi_gaps],
  [v4_l, v4_w, v4_pcb, v4_over, v4_under, v4_low, v4_gaps]
];
function board_t(b) = b[2] + b[3] + b[4];
function rack_x(i) = i == 0 ? col_x0 + 1 : rack_x(i - 1) + board_t(boards[i - 1]) + board_gap;
rack_x1 = rack_x(len(boards) - 1) + board_t(boards[len(boards) - 1]);
// The PCB's centre
function slot_x(i) = let(b = boards[i]) rack_x(i) + b[4] + b[2] / 2;
function slot_w(b) = b[2] + slot_fit;
function guide_wide(b) = slot_w(b) + 2 * guide_wall;
// Every board's +Y end sits board_back short of the wall, clear of the
// wall's screw bosses: room for the HC33's micro-SD
board_back = 3.5;
board_y1 = y_in1 - board_back;
board_z0 = wall - floor_slot;
// Where a board's low post starts
function low_y0(b) = board_y1 - b[0] - 2;

// FR120N rails on the floor, board_gap past the last board, the modules
// side by side, long side along Y, their +Y ends wire room short of the
// boards' ends
fr_bay = fr_w + 2 * fr_fit;
fr_rack_w = fr_n * fr_bay + (fr_n + 1) * rail_wall;
fr_rack_x0 = rack_x1 + board_gap;
fr_z0 = wall + fr_tails;
function fr_x0(i) = fr_rack_x0 + rail_wall + i * (fr_bay + rail_wall) + fr_fit;
fr_y0 = board_y1 - fr_wire_room - fr_l;

sma_z = wall + inner_h / 2;

// The right wall's screws are placed round the button's block
button_keep = button_block_w / 2 + boss_d / 2 + 0.5;
screws = let(
  side = fill(screw_e, outer_l - screw_e, screw_pitch),
  right = concat(fill(screw_e, t9_cy - button_keep, screw_pitch), fill(t9_cy + button_keep, outer_l - screw_e, screw_pitch)),
  bottom = fill(screw_e, outer_w - screw_e, screw_pitch),
  top = concat([screw_e, (sma_xs[0] + sma_xs[1]) / 2], fill(div_cx, outer_w - screw_e, screw_pitch))
) concat(
  [for (y = side) [screw_e, y]],
  [for (y = right) [outer_w - screw_e, y]],
  [for (x = bottom) if (x > screw_e + 1 && x < outer_w - screw_e - 1) [x, screw_e]],
  [for (x = top) if (x > screw_e + 1 && x < outer_w - screw_e - 1) [x, outer_l - screw_e]]
);

// The lid's groove stops short of each counterbore, and the tongue short
// of the groove's end
groove_break = cbore_d / 2 + 0.6;
tongue_break = groove_break + 0.5;

assert(bank_w - 2 * bank_post_reach >= 30, "the posts cover the bank's ports");
assert(div_y1 <= y_in1 - sma_behind, "the SMAs' backs run into the bank's posts");
assert(t9_w + 2 * (bracket_clear + bracket_wall) <= col_x1 - col_x0, "T9 doesn't fit across the column");
assert(pilot_depth < box_h - wall, "pilot breaks through the floor");
assert(tongue_h + 0.3 <= wall - cbore_h, "the groove runs up into the counterbores' floor");
assert(t9_top + clamp_t <= box_h - 1, "the clamps reach the lid");
assert(t9_cy - pillar_dy - pillar_s / 2 >= clear_e + 0.5, "the -Y clamp runs into the end wall's bosses");
assert(clamp_lap < t9_l / 2, "the clamps' laps meet over the T9");
// Backed off until its tip clears the T9, the set screw still holds in its
// nut and stays inside the wall
assert(t9_x1 + button_screw_l >= button_nut_x + nut_h / 2 + 1, "the button's set screw can't reach through its nut");
assert(t9_x1 + button_screw_l <= outer_w - 1, "the button's set screw sticks out of the wall");
assert(button_block_x1 - button_block_x0 >= nut_h + nut_fit + 3, "the button's block is too thin for its nut");
for (p = screws) if (p[0] > outer_w / 2)
  assert(abs(p[1] - t9_cy) >= button_block_w / 2 + boss_d / 2, "the button's block hits a screw boss");
assert(fr_z0 + fr_pcb + fr_h <= box_h - 1, "the FR120Ns' terminals reach the lid");
assert(fr_rack_x0 + fr_rack_w <= col_x1, "the FR120Ns' rails run into the right wall's bosses");
assert(fr_y0 - fr_wire_room >= pillar_y1 + 1, "the FR120Ns' wires run into the clamp's pillars");
if (fr_rack_x0 < col_cx + t9_plug_half)
  assert(fr_y0 >= t9_y1 + t9_plug_room, "the FR120Ns' rails leave the T9's plug no room");
assert(len(sma_xs) == 2);
for (s = sma_xs) {
  assert(s - sma_nut_d / 2 >= clear_e && s + sma_nut_d / 2 <= div_x0, "an SMA's nut leaves the bay");
  for (p = screws) if (p[1] > outer_l / 2)
    assert(abs(p[0] - s) >= sma_nut_d / 2 + boss_d / 2 + 0.5, "an SMA's nut hits a screw boss");
}
for (i = [0:len(boards) - 1]) let(b = boards[i], x = slot_x(i), gw = guide_wide(b)) {
  if (i > 0) let(a = boards[i - 1], xa = slot_x(i - 1))
    assert(x - gw / 2 >= xa + guide_wide(a) / 2, "boards' posts run into each other");
  assert(board_z0 + b[1] <= box_h - 1, "a board stands up into the lid");
  assert(b[5] < b[1], "a low post grips over the board");
  for (g = b[6]) assert(g[0] < g[1] && g[1] < b[1], "a high post's gap leaves the board");
  // Its low post clears the clamp's pillars, and the plug's room
  for (p = pillars) if (abs(p[0] - x) < gw / 2 + pillar_s / 2)
    assert(low_y0(b) >= pillar_y1 + 1, "a board's low post runs into a clamp pillar");
  if (abs(x - col_cx) < gw / 2 + t9_plug_half)
    assert(low_y0(b) >= t9_y1 + t9_plug_room, "a board's low post leaves the T9's plug no room");
  assert(low_y0(b) >= t9_bracket_y1 + 1, "a board's low post runs into the T9's brackets");
  for (p = screws) if (p[1] > outer_l / 2 && abs(p[0] - x) < gw / 2 + boss_d / 2)
    assert(board_y1 <= p[1] - boss_d / 2, "a board's end runs into a screw boss");
}

// Outline inset e from the outer edge
module plan(e = 0) {
  r = max(corner_r - e, 0.5);
  translate([e + r, e + r]) offset(r) square([outer_w - 2 * e - 2 * r, outer_l - 2 * e - 2 * r]);
}

module band(e0, e1) {
  difference() {
    plan(e0);
    plan(e1);
  }
}

// Horizontal hole along Y, peaked at 45° up the print, tip cut to a short
// bridge.
module teardrop_y(d, len) {
  rotate([90, 0, 0]) linear_extrude(len, center = true) intersection() {
    hull() {
      circle(d = d);
      rotate(45) square(d / 2);
    }
    translate([-d, -d]) square([2 * d, d / 2 + 0.5 + d]);
  }
}

// Along X, peaked the same way.
module teardrop_x(d, len) {
  rotate([0, 0, 90]) teardrop_y(d, len);
}

// L-shaped corner brackets round a part w x l centred at (x, y)
module corner_brackets(x, y, w, l, h) {
  gw = w / 2 + bracket_clear;
  gl = l / 2 + bracket_clear;
  translate([x, y, 0]) for (sx = [-1, 1], sy = [-1, 1]) scale([sx, sy, 1]) translate([gw, gl, 0]) {
    translate([-bracket_leg, 0, 0]) cube([bracket_leg + bracket_wall, bracket_wall, h]);
    translate([0, -bracket_leg, 0]) cube([bracket_wall, bracket_leg + bracket_wall, h]);
  }
}

// Tongue in plan: round the walls and along the divider, broken round the
// screws. Grown by the groove's fit, it is the lid's groove.
module tongue_plan(grow = 0) {
  difference() {
    union() {
      band(tongue_e - grow, tongue_e + tongue_w + grow);
      translate([div_cx - tongue_w / 2 - grow, y_in0 - 1]) square([tongue_w + 2 * grow, div_y1 - y_in0 + 1]);
    }
    for (p = screws) translate(p) circle(r = grow > 0 ? groove_break : tongue_break);
  }
}

// ---- box

module board_posts(i) {
  b = boards[i];
  gw = guide_wide(b);
  translate([slot_x(i) - gw / 2, 0, 0]) {
    // high post at +Y, into the wall, cut away where the end has parts
    difference() {
      translate([0, board_y1 - guide_engage, 0]) cube([gw, y_in1 - board_y1 + guide_engage + eps, box_h]);
      for (g = b[6]) translate([-1, board_y1 - guide_engage - 1, board_z0 + g[0]]) cube([gw + 2, board_back + guide_engage + 1, g[1] - g[0]]);
    }
    // low post at -Y, under the parts at that end
    translate([0, low_y0(b), 0]) cube([gw, 2 + guide_engage, board_z0 + b[5]]);
  }
}

module board_slot(i) {
  b = boards[i];
  translate([slot_x(i) - slot_w(b) / 2, board_y1 - b[0] - 0.5, board_z0]) cube([slot_w(b), b[0] + 1, box_h]);
}

module box() {
  difference() {
    union() {
      difference() {
        linear_extrude(box_h) plan();
        translate([0, 0, wall]) linear_extrude(box_h) plan(wall);
      }
      intersection() {
        linear_extrude(box_h) plan();
        for (p = screws) translate([p[0], p[1], 0]) cylinder(d = boss_d, h = box_h);
      }
      translate([div_x0, y_in0 - eps, 0]) cube([divider_t, div_y1 - y_in0, box_h]);
      translate([bank_x0 - eps, y_in0 - eps, 0]) cube([bank_x1 - bank_x0 + 2 * eps, bank_y0 - bank_fit - y_in0, wall + bank_stop_h]);
      for (x = [bank_x0 - eps, bank_x1 - bank_post_reach]) translate([x, bank_y1, 0]) cube([bank_post_reach + eps, bank_post_t, box_h]);
      translate([0, 0, wall - eps]) corner_brackets(col_cx, t9_cy, t9_w, t9_l, bracket_h + eps);
      for (p = pillars) translate([p[0] - pillar_s / 2, p[1] - pillar_s / 2, 0]) cube([pillar_s, pillar_s, pillar_top]);
      translate([button_block_x0, t9_cy - button_block_w / 2, 0]) cube([button_block_x1 - button_block_x0 + eps, button_block_w, wall + t9_h]);
      for (i = [0:len(boards) - 1]) board_posts(i);
      translate([0, 0, wall - eps]) fr_rails();
      translate([0, 0, box_h - eps]) linear_extrude(tongue_h + eps) tongue_plan();
    }
    for (p = screws) translate([p[0], p[1], box_h - pilot_depth]) cylinder(d = pilot_d, h = pilot_depth + tongue_h + 1);
    for (p = pillars) translate([p[0], p[1], pillar_top - pilot_depth]) cylinder(d = pilot_d, h = pilot_depth + 1);
    for (s = sma_xs) translate([s, outer_l - wall / 2, sma_z]) teardrop_y(sma_hole_d, wall + 2);
    for (i = [0:len(boards) - 1]) board_slot(i);
    button_screw_way();
  }
}

// The set screw's hole through the right wall and the block, and a slot
// the nut drops into from the block's top, flats against its sides so it
// can't turn.
module button_screw_way() {
  translate([(button_block_x0 + outer_w) / 2, t9_cy, button_z]) teardrop_x(clear_d, outer_w - button_block_x0 + 2);
  slot_w = nut_af + nut_fit;
  translate([button_nut_x - (nut_h + nut_fit) / 2, t9_cy - slot_w / 2, button_z - slot_w / 2 / cos(30)]) cube([nut_h + nut_fit, slot_w, wall + t9_h]);
}

// ---- lid

module lid() {
  difference() {
    linear_extrude(wall) plan();
    for (p = screws) translate([p[0], p[1], 0]) {
      translate([0, 0, -1]) cylinder(d = clear_d, h = wall + 2);
      translate([0, 0, wall - cbore_h]) cylinder(d = cbore_d, h = cbore_h + 1);
    }
    translate([0, 0, -1]) linear_extrude(tongue_h + 0.3 + 1) tongue_plan(groove_fit);
  }
}

module lid_in_place(lift = 0) {
  translate([0, 0, box_h + lift]) lid();
}

// ---- T9 clamps

// The +Y clamp in place: a plate on its two pillars, reaching clamp_lap
// over the T9's end, its underside on the T9's face. The -Y one is the
// same piece turned round.
module clamp() {
  y0 = t9_y1 - clamp_lap;
  y1 = t9_cy + pillar_dy + pillar_s / 2;
  difference() {
    translate([col_cx - clamp_half_w, y0, t9_top]) cube([2 * clamp_half_w, y1 - y0, clamp_t]);
    for (s = [-1, 1]) translate([col_cx + s * pillar_dx, t9_cy + pillar_dy, t9_top]) {
      translate([0, 0, -1]) cylinder(d = clear_d, h = clamp_t + 2);
      translate([0, 0, clamp_t - cbore_h]) cylinder(d = cbore_d, h = cbore_h + 1);
    }
  }
}

module clamps_in_place(lift = 0) {
  translate([0, 0, lift]) {
    clamp();
    translate([col_cx, t9_cy, 0]) rotate(180) translate([-col_cx, -t9_cy, 0]) clamp();
  }
}

// As it sits: the counterbores open upward, their floors on the plate
// below.
module clamp_print() {
  translate([0, 0, -t9_top]) clamp();
}

// A wall either side of each FR120N, with a ledge under its long edge
// that holds it clear of its solder tails. The ends stay open for the
// terminals' wires.
module fr_rails() {
  for (i = [0:fr_n]) let(x = fr_rack_x0 + i * (fr_bay + rail_wall)) {
    translate([x, fr_y0, 0]) cube([rail_wall, fr_l, fr_tails + fr_pcb + 0.5 + eps]);
    for (s = [-1, 1]) if ((s < 0 && i > 0) || (s > 0 && i < fr_n))
      translate([s < 0 ? x - rail_ledge : x + rail_wall, fr_y0, 0]) cube([rail_ledge, fr_l, fr_tails + eps]);
  }
}

// ---- reference parts

module ref_bank(lift = 0) {
  translate([bank_x0 + bank_fit, bank_y0 + bank_fit, wall + lift]) cube([bank_w, bank_l, bank_h]);
}

module ref_t9(lift = 0) {
  translate([col_cx - t9_w / 2, t9_y0, wall + lift]) cube([t9_w, t9_l, t9_h]);
}

// Each board as its PCB, and its parts as a block over most of each face,
// leaving the edges the slots hold clear.
module ref_boards(lift = 0) {
  for (i = [0:len(boards) - 1]) let(b = boards[i], x = slot_x(i), y0 = board_y1 - b[0])
    translate([0, 0, board_z0 + lift]) {
      translate([x - b[2] / 2, y0, 0]) cube([b[2], b[0], b[1]]);
      translate([x + b[2] / 2, y0 + guide_engage + 1, floor_slot + 1]) cube([b[3], b[0] - 2 * guide_engage - 2, b[1] - floor_slot - 2]);
      translate([x - b[2] / 2 - b[4], y0 + guide_engage + 1, floor_slot + 1]) cube([b[4], b[0] - 2 * guide_engage - 2, b[1] - floor_slot - 2]);
    }
}

// Each FR120N as its PCB on the rails' ledges, and its terminals as a
// block over it.
module ref_fr(lift = 0) {
  for (i = [0:fr_n - 1]) translate([fr_x0(i), fr_y0, fr_z0 + lift]) {
    cube([fr_w, fr_l, fr_pcb]);
    translate([1, 0, fr_pcb]) cube([fr_w - 2, fr_l, fr_h]);
  }
}

module ref_sma(out = 0) {
  for (s = sma_xs) translate([s, outer_l + out, sma_z]) rotate([90, 0, 0]) {
    translate([0, 0, -10]) cylinder(d = 8, h = 10);
    cylinder(d = 6.35, h = wall + sma_behind - 2);
  }
}
