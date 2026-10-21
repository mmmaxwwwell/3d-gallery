// HT-HC33 LiPo case: a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), a Heltec
// WiFi LoRa 32 V4, a 103665 LiPo pouch cell and a USB-C TP4056 charger
// board, stacked face to face like a stack of cards in a case that stands
// on end. The HC33's and V4's USB-Cs come out of the bottom, the TP4056's
// out of the right side, and two SMA bulkheads out of the top at opposite
// corners.
//
// Two pieces:
// - the carriage: an L of the top (the SMAs' plate) and the left face (the
//   door face), with everything inside hung on it. Fins between the layers
//   make the chambers; each board's left edge sits in a slotted rib on the
//   door face and its top edge in a slotted tab off the next fin; the
//   TP4056 is held top and bottom by slotted bars; the cell sits between
//   two fins on a floor plate under two roofs.
// - the body: bottom, back, front and right walls, open at the top and on
//   the left. The carriage slides in from the left. Its fins and the cell's
//   floor plate run in channels in the floor and grooves in the right wall,
//   the top's tongues run in grooves along the back and front walls' tops,
//   a nib under the top's right edge hooks into a groove in the right wall,
//   and each board's right edge slides into a slotted rail on the right
//   wall. Two M3x10 cap screws through the door face into bosses on the
//   back and front walls hold it in.
//
// Stack, back to front: TP4056 (parts to the front, its USB-C end to the
// right), HC33 (top face to the front), cell, V4 (top face, with its
// screen, to the front).
//
// Seen from the top the outline is a rounded rectangle whose left and
// right faces lead into the corners at 45°. The top edge is rounded the
// same way. Rings 15 mm tall run round the case, plain and inset in turn;
// an inset ring is sunk grip_inset with 45° chamfers top and bottom, and
// diamond knurled on the body.
//
// Frame: origin at the cavity's centre in plan, z = 0 on the bottom face.
// X across (the door face at -X), Y through the stack (+Y the front), Z up
// the case. The body prints standing on its bottom (`body()`), the carriage
// on its door face (`carriage_print()`).

// BEGIN_PARAMS
// 103665 LiPo pouch, protection board included: thickness, width, length
// (nominal, unmeasured)
cell_t = 10;
cell_w = 36;
cell_l = 65;

// Clearance round the cell per side
cell_fit = 0.5;

// Heltec HT-HC33: length, width, PCB thickness, the tallest part behind
// the PCB and in front of it
hc_l = 60;
hc_w = 33.5;
hc_pcb = 1.5;
hc_under = 3.6;
hc_over = 3.3;

// How far the HC33's USB-C sticks out past the board's end, and its
// centre in front of the PCB's top face
hc_usb_overhang = 1.54;
hc_usb_y = 0.3;

// Heltec WiFi LoRa 32 V4: length, width, PCB thickness, thickness over
// its parts, the tallest part behind the PCB; its USB-C's centre in front
// of the PCB's top face, and how far it sticks out past the board's end
// (PCB, the split either side of it and the USB-C unmeasured)
v4_l = 51.7;
v4_w = 25.4;
v4_pcb = 1;
v4_t = 10.7;
v4_under = 2.5;
v4_usb_y = 1.6;
v4_usb_overhang = 0.5;

// TP4056 USB-C charger board, lying with its USB-C end to the right:
// PCB length (along X) and width (up the case), PCB thickness, the solder
// behind it, the receptacle's height in front of it, its width, and how
// far it sticks out past the board's end (unmeasured)
tp_l = 28;
tp_w = 17.5;
tp_pcb = 1.6;
tp_back = 0.5;
tp_usb_h = 3.2;
tp_usb_w = 9;
tp_usb_overhang = 0.6;

// The bar the TP4056 stands on
tp_floor = 1.5;

// Gap between neighbours in the stack (a fin runs down the middle of
// each), and in front of the V4
layer_gap = 2.4;
front_gap = 0.5;

// The carriage's fins between the layers
divider_t = 1.2;

// Board slots: how far each board's edge goes into its slot, the slot's
// clearance over the PCB's thickness and past its edge, the rail's wall
// either side of the slot, the gap over a board's top edge and the roof
// over it
slot_engage = 1.25;
slot_fit = 0.4;
slot_side_fit = 0.3;
rail_wall = 1.2;
roof_fit = 0.3;
roof_t = 1.5;

// How long each tab holding a board's top edge is, at the board
board_tab_l = 6;

// How far each roof over the cell's top end reaches in from its side
cell_roof_reach = 6;

// Gap between each USB-C's face and the wall it comes through
usb_gap = 0.3;

// USB-C openings, sized for a plug's overmold: long side, short side,
// corner radius
usb_open_w = 13;
usb_open_h = 7;
usb_open_r = 1;

// SMA bulkheads (1/4-36) through the top: in from the cavity's back and
// front walls (far enough that the outer nut sits on the flat of the
// top), the hole, the inner nut across corners, and how far the
// connector's back and the pigtail's bend reach down from the top
sma_in_y = 5.6;
sma_hole_d = 6.6;
sma_nut_d = 9.2;
sma_behind = 12;

// Walls: the right wall and the door face; the back and front; the bottom;
// the top (the SMAs' plate)
side_wall = 6;
end_wall = 6;
bottom_t = 2.5;
top_t = 3;

// Corner radius seen from the top, and the top edge's radius
profile_r = 10;
top_r = 4;

// Clearance where the carriage slides along the body
slide_fit = 0.2;

// The carriage's mating features: how deep the fins and the cell's floor
// plate sit in the floor and the fins in the right wall; the top's tongues
// along the back and front walls (width, depth); the hook under the top's
// right edge (its height under the top, and the nib's reach and height)
floor_channel_d = 1.2;
wall_groove_d = 1;
tongue_w = 1.2;
tongue_h = 1.5;
hook_h = 4;
nib_l = 1.2;
nib_h = 1.2;

// Door-face screws: M3 cap screws through the door face into bosses on the
// back and front walls. Their heights (back, front), the axis's distance
// in from the wall, the clearance hole and the pilot, the counterbore
// (head diameter and how deep it sinks into the door face), the boss's
// wall round the pilot, and the screw's length under the head
door_screw_z = [39.5, 65];
door_screw_in = 3.15;
m3_clear_d = 3.4;
m3_pilot_d = 2.5;
m3_cbore_d = 6;
m3_cbore_h = 3.2;
m3_wall = 1.6;
m3_len = 10;

// Grip rings: height, how far an inset ring is sunk, the knurl's pitch and
// depth, and the plain margin at the bottom and under the top edge
band_h = 15;
grip_inset = 2;
knurl_pitch = 2;
knurl_d = 0.8;
band_margin = 2;
// END_PARAMS

eps = 0.01;

hx = cell_w / 2 + cell_fit;
ex = hx + side_wall;

// Through the stack, from the back wall's inner face. The TP4056 sits far
// enough off the back wall for its holders' rail_wall behind its slot.
tp_y = slide_fit + rail_wall + slot_fit / 2 - tp_back;
tp_depth = tp_back + tp_pcb + tp_usb_h;
hc_y = tp_y + tp_depth + layer_gap;
hc_depth = hc_under + hc_pcb + hc_over;
cell_y = hc_y + hc_depth + layer_gap;
cell_depth = cell_t + 2 * cell_fit;
v4_y = cell_y + cell_depth + layer_gap;
v4_over = v4_t - v4_under - v4_pcb;
depth = v4_y + v4_t + front_gap;
hy = depth / 2;
ey = hy + end_wall;
// From the back face onto the frame
yb = -hy;
// Fins, centred in the gaps: TP4056 | HC33 | cell | V4
dividers = [hc_y - layer_gap / 2, cell_y - layer_gap / 2, v4_y - layer_gap / 2];

// HC33 and V4: [width, PCB's back face, PCB thickness, length, USB-C
// overhang, USB-C centre]. Each PCB lands on its slot's floor, so the
// USB-C's face is usb_gap off the bottom.
hc_board = [hc_w, hc_y + hc_under, hc_pcb, hc_l, hc_usb_overhang, hc_y + hc_under + hc_pcb + hc_usb_y];
v4_board = [v4_w, v4_y + v4_under, v4_pcb, v4_l, v4_usb_overhang, v4_y + v4_under + v4_pcb + v4_usb_y];
boards = [hc_board, v4_board];
function board_z0(b) = bottom_t + usb_gap + b[4];
function board_z1(b) = board_z0(b) + b[3];

// TP4056: PCB from tp_x0 to tp_x1, standing on its bar
tp_pcb_y = tp_y + tp_back;
tp_x1 = hx - usb_gap - tp_usb_overhang;
tp_x0 = tp_x1 - tp_l;
tp_z0 = bottom_t + slide_fit + tp_floor;
tp_z1 = tp_z0 + tp_w;
tp_usb_cy = tp_pcb_y + tp_pcb + tp_usb_h / 2;
tp_usb_cz = tp_z0 + tp_w / 2;

cell_z1 = bottom_t + cell_l;

tallest = max(cell_z1, tp_z1, max([for (b = boards) board_z1(b)]));
// The fins stop at the roofs; above them the wires cross between chambers
divider_z1 = tallest + roof_fit + roof_t;
// The fin between the TP4056 and the HC33 stops just over the TP4056's
// bar, which leaves the space above the TP4056 open to the HC33's chamber
// for its antenna
tp_divider_z1 = tp_z1 + roof_fit + roof_t;
divider_tops = [tp_divider_z1, divider_z1, divider_z1];
ceiling = max(tallest + sma_behind, divider_z1 + 0.5);
total_h = ceiling + top_t;
// The top edge: a 45° lead from the sides onto a top_r arc
top_lead = (sqrt(2) - 1) / sqrt(2) * top_r;
top_z0 = total_h - top_r + top_r / sqrt(2) - top_lead;

// Outline: corner arcs about (±arc_x, ±arc_y), and 45° lead-ins from the
// arcs onto the left and right faces
arc_x = ex - profile_r;
arc_y = ey - profile_r;
lead_y = arc_y + (sqrt(2) - 1) * profile_r;

// SMAs over the front-left and back-right corners, the inner nut just
// clear of the walls
sma_e = sma_nut_d / 2 + 0.5;
smas = [[-(hx - sma_e), hy - sma_in_y], [hx - sma_e, -(hy - sma_in_y)]];
// How far each SMA's connector reaches down from the top
sma_low = ceiling - (sma_behind - 2);

// The fins and the cell's floor plate: their bottom, in the floor's channels
fin_z0 = bottom_t - floor_channel_d + slide_fit;

// The cavity's right corners' radius
cavity_r = 1;

// The hook under the top's right edge spans the top's length clear of the
// back-right SMA's nut and the cavity's front-right corner
hook_y0 = smas[1][1] + sma_nut_d / 2 + 0.5;
hook_y1 = hy - cavity_r - slide_fit;

// Door-face screws: [y, z] of each, the boss's radius and length, and how
// far each screw reaches into its boss
door_screws = [[-(hy - door_screw_in), door_screw_z[0]], [hy - door_screw_in, door_screw_z[1]]];
m3_boss_r = m3_pilot_d / 2 + m3_wall;
m3_engage = m3_len - (side_wall - m3_cbore_h);
m3_boss_l = m3_engage + 1.5;
// A boss's lowest point: its underside runs 45° down to the wall
function boss_z0(s) = s[1] - door_screw_in - m3_boss_r * sqrt(2);

// Grip rings from the bottom up; the odd ones are inset
band_top = top_z0 - band_margin;
band_n = ceil((band_top - band_margin) / band_h);
function band_z0(i) = band_margin + i * band_h;
function band_z1(i) = min(band_margin + (i + 1) * band_h, band_top);
function band_of(z) = floor((z - band_margin) / band_h);
function inset_band(i) = i % 2 == 1 && band_z1(i) - band_z0(i) >= 2 * grip_inset + 2;

function slot_y0(b) = b[1] - slot_fit / 2;
function slot_y1(b) = b[1] + b[2] + slot_fit / 2;
function rail_y0(b) = slot_y0(b) - rail_wall;
function rail_y1(b) = slot_y1(b) + rail_wall;
tp_b = [0, tp_pcb_y, tp_pcb];

for (b = boards) assert(b[0] / 2 + slot_side_fit <= hx, "a board is wider than the cavity");
assert(tp_y >= 0, "the TP4056's back is thicker than its holders' rail wall");
assert(rail_y1(tp_b) <= dividers[0] - divider_t / 2, "the TP4056's rails run into a fin");
assert(rail_y0(hc_board) >= dividers[0] + divider_t / 2, "the HC33's rails run into a fin");
assert(rail_y1(hc_board) <= dividers[1] - divider_t / 2, "the HC33's rails run into a fin");
assert(rail_y0(v4_board) >= dividers[2] + divider_t / 2, "the V4's rails run into a fin");
assert(rail_y1(v4_board) <= depth - slide_fit, "the V4's rails run into the front wall");
assert(divider_t + 0.6 <= layer_gap, "the fins leave their neighbours no room");
assert(v4_board[5] - hc_board[5] >= usb_open_h + 1.2, "the two bottom USB-C openings run together");
assert(tp_x0 - slot_side_fit - rail_wall >= -hx + 2, "the TP4056 doesn't fit across");
assert(tp_usb_cy - usb_open_h / 2 >= -1, "the TP4056's opening runs into the back wall");
assert(tp_usb_cz - usb_open_w / 2 >= bottom_t, "the TP4056's opening runs into the bottom");
for (b = boards) assert(board_z0(b) - (bottom_t + slide_fit) >= 0.6 - eps, "a board's rib has no floor under its slot");
assert(floor_channel_d <= bottom_t - 1, "the floor's channels leave too little floor");
assert(lead_y >= arc_y && arc_x > 0 && arc_y > 0, "the corner radius is too big for the outline");
// The cavity's corner keeps a wall behind an inset ring's knurl
assert(profile_r - norm([profile_r - side_wall, profile_r - end_wall]) - grip_inset - knurl_d >= 1.2, "the corners are too thin");
assert(end_wall - grip_inset - knurl_d >= 1.2, "the back and front walls are too thin behind the grip");
assert(side_wall - grip_inset - knurl_d - wall_groove_d >= 1.2, "the right wall is too thin behind the grip");
assert(ceiling - hook_h - nib_h >= divider_z1 + 0.3, "the top's hook runs into the fins");
assert(hook_y1 > hook_y0 + 5, "the back-right SMA leaves no room for the top's hook");
assert(nib_l + slide_fit <= side_wall - 2, "the hook's groove cuts through the right wall");
for (p = smas) {
  assert(abs(p[1]) + sma_nut_d / 2 <= hy - 0.3, "an SMA's inner nut hits the back or front wall");
  // The outer nut sits on the flat of the top: inside the outline inset by top_r
  assert(norm([max(abs(p[0]) - arc_x, 0), max(abs(p[1]) - arc_y, 0)]) + sma_nut_d / 2 <= profile_r - top_r,
         "an SMA's outer nut runs onto the rounded top edge");
}
assert(top_r < profile_r, "the top edge's radius is bigger than the corners'");
// The carriage slides in along +X, so a boss on the body may only sit where
// nothing on the carriage passes. The back one sits over the TP4056's bar
// and behind the HC33's parts, under the back-right SMA; the front one sits
// in front of the V4's rail, over the V4, under the front-left SMA.
assert(boss_z0(door_screws[0]) >= tp_divider_z1 + 0.5, "the back door-screw boss hits the TP4056's holders");
assert(door_screws[0][1] + m3_boss_r <= sma_low - 0.5, "the back door-screw boss hits the back-right SMA");
assert(door_screw_in + m3_boss_r <= hc_y - 0.3, "the back door-screw boss hits the HC33");
assert(depth - door_screw_in - m3_boss_r >= rail_y1(v4_board) + 0.3, "the front door-screw boss hits the V4's holders");
assert(boss_z0(door_screws[1]) >= board_z1(v4_board) + roof_fit + roof_t + 0.5, "the front door-screw boss hits the V4");
assert(door_screws[1][1] + m3_boss_r <= sma_low - 0.5, "the front door-screw boss hits the front-left SMA");
for (s = door_screws) {
  assert(band_of(s[1] - m3_cbore_d / 2) == band_of(s[1] + m3_cbore_d / 2) && band_of(s[1]) % 2 == 0,
         "a door screw's counterbore runs into an inset ring");
  assert(abs(s[0]) + m3_cbore_d / 2 <= lead_y, "a door screw's counterbore runs off the flat of the door face");
}
assert(m3_engage >= 6, "the door screws barely reach into their bosses");


// ---- outline and cavity

module outline() {
  hull() {
    for (sx = [-1, 1], sy = [-1, 1]) {
      translate([sx * arc_x, sy * arc_y]) circle(r = profile_r, $fn = 96);
      translate([sx * ex - (sx > 0 ? eps : 0), sy * lead_y - (sy > 0 ? eps : 0)]) square(eps);
    }
  }
}

// The outline inset by e, at height z
module slice(e, z) {
  translate([0, 0, z]) linear_extrude(eps) offset(delta = -e) outline();
}

// The outline extruded, its top edge a 45° lead onto a top_r arc
module shell(z0 = 0, z1 = total_h) {
  steps = 8;
  intersection() {
    union() {
      translate([0, 0, -1]) linear_extrude(top_z0 + 1) outline();
      hull() {
        slice(0, top_z0 - eps);
        for (i = [0:steps]) let(a = 45 + 45 * i / steps)
          slice(top_r * (1 - cos(a)), total_h - top_r + top_r * sin(a) - (i == steps ? eps : 0));
      }
    }
    translate([-ex - 1, -ey - 1, z0]) cube([2 * ex + 2, 2 * ey + 2, z1 - z0]);
  }
}

// Open on the left and at the top
module cavity() {
  translate([0, 0, bottom_t]) linear_extrude(ceiling - bottom_t + 1) hull() {
    for (sy = [-1, 1]) translate([hx - cavity_r, sy * (hy - cavity_r)]) circle(r = cavity_r);
    translate([-hx - 1, -hy]) square([eps, 2 * hy]);
  }
}

// ---- grip rings

function arc_pts(cx, cy, r, a0, n) = [for (i = [0:n]) [cx + r * cos(a0 + 45 * i / n), cy + r * sin(a0 + 45 * i / n)]];

// The outline inset by e as points, counter-clockwise from the middle of
// the right face. Every inset gives the same points at the same places
// along their segments, so one inset's points map onto another's.
function outline_pts(e, n = 12) = let(r = profile_r - e, x = ex - e, ly = arc_y + r * (sqrt(2) - 1))
  concat([[x, 0], [x, ly]], arc_pts(arc_x, arc_y, r, 45, n), arc_pts(-arc_x, arc_y, r, 90, n),
         [[-x, ly], [-x, -ly]], arc_pts(-arc_x, -arc_y, r, 225, n), arc_pts(arc_x, -arc_y, r, 270, n),
         [[x, -ly], [x, 0]]);

function cumlen(p) = [for (i = 0, s = 0; i < len(p); s = s + (i + 1 < len(p) ? norm(p[i + 1] - p[i]) : 0), i = i + 1) s];

// The solid inside an inset ring's knurled face, from za to zb: square
// pyramids on a grid at ±45°, their tips on the ring's inset face and the
// grooves between them knurl_d deeper. The top and bottom rows stay on the
// inset face so the knurl meets the chamfers flush.
module knurl_core(za, zb) {
  pe = outline_pts(grip_inset);
  pv = outline_pts(grip_inset + knurl_d);
  pin = outline_pts(grip_inset + knurl_d + 1);
  s = cumlen(pe);
  L = s[len(s) - 1];
  q = knurl_pitch / sqrt(2);
  n = 2 * max(2, round(L / q / 2));
  m = max(2, round((zb - za) / q));
  tab = function(p, k) [for (i = [0:len(p) - 1]) [s[i], p[i][k]]];
  ex_ = tab(pe, 0); ey_ = tab(pe, 1);
  vx = tab(pv, 0); vy = tab(pv, 1);
  ix = tab(pin, 0); iy = tab(pin, 1);
  outer = [for (j = [0:m], i = [0:n - 1]) let(t = i * L / n, z = za + (zb - za) * j / m,
                                            v = j > 0 && j < m && (i + j) % 2 == 0,
                                            p = v ? [lookup(t, vx), lookup(t, vy)] : [lookup(t, ex_), lookup(t, ey_)])
           [p[0], p[1], z]];
  inner = [for (z = [za, zb], i = [0:n - 1]) let(t = i * L / n) [lookup(t, ix), lookup(t, iy), z]];
  function o(i, j) = j * n + (i % n);
  function ib(i) = (m + 1) * n + (i % n);
  function it(i) = (m + 2) * n + (i % n);
  faces = concat(
    [for (j = [0:m - 1], i = [0:n - 1]) each ((i + j) % 2 == 0
      ? [[o(i, j), o(i, j + 1), o(i + 1, j + 1)], [o(i, j), o(i + 1, j + 1), o(i + 1, j)]]
      : [[o(i, j), o(i, j + 1), o(i + 1, j)], [o(i, j + 1), o(i + 1, j + 1), o(i + 1, j)]])],
    [for (i = [0:n - 1]) [o(i, 0), o(i + 1, 0), ib(i + 1), ib(i)]],
    [for (i = [0:n - 1]) [o(i, m), it(i), it(i + 1), o(i + 1, m)]],
    [for (i = [0:n - 1]) [ib(i), ib(i + 1), it(i + 1), it(i)]]);
  polyhedron(concat(outer, inner), faces);
}

// What comes off the outside for the inset rings: each sunk grip_inset
// with 45° chamfers into it, knurled or smooth
module grip_cut(knurled = true) {
  for (i = [0:band_n - 1]) if (inset_band(i)) let(z0 = band_z0(i), z1 = band_z1(i)) difference() {
    translate([0, 0, z0]) linear_extrude(z1 - z0) difference() {
      offset(delta = 1) outline();
      offset(delta = -(grip_inset + knurl_d + 0.5)) outline();
    }
    hull() { slice(0, z0 - eps); slice(grip_inset, z0 + grip_inset); }
    hull() { slice(grip_inset, z1 - grip_inset - eps); slice(0, z1); }
    if (knurled) knurl_core(z0 + grip_inset, z1 - grip_inset);
    else translate([0, 0, z0 + grip_inset - eps]) linear_extrude(z1 - z0 - 2 * grip_inset + 2 * eps)
      offset(delta = -grip_inset) outline();
  }
}

// ---- body

// A board's rail on the right wall: a block from the wall to past the
// board's edge, slotted for the PCB between its floor and its roof, open
// to the left for the board to slide in.
module right_rail(b) {
  difference() {
    translate([b[0] / 2 - slot_engage, yb + rail_y0(b), bottom_t - eps])
      cube([hx - b[0] / 2 + slot_engage + eps, rail_y1(b) - rail_y0(b), board_z1(b) + roof_fit + roof_t - bottom_t + eps]);
    translate([b[0] / 2 - slot_engage - 1, yb + slot_y0(b), board_z0(b)])
      cube([slot_engage + 1 + slot_side_fit, slot_y1(b) - slot_y0(b), b[3] + roof_fit]);
  }
}

// The TP4056's rails at its USB-C end: below and above the receptacle
module tp_right_rails() {
  zr0 = tp_usb_cz - tp_usb_w / 2 - 0.5;
  zr1 = tp_usb_cz + tp_usb_w / 2 + 0.5;
  for (z = [[bottom_t, zr0], [zr1, tp_z1 + roof_fit + roof_t]]) difference() {
    translate([tp_x1 - slot_engage, yb + rail_y0(tp_b), z[0] - eps])
      cube([hx - tp_x1 + slot_engage + eps, rail_y1(tp_b) - rail_y0(tp_b), z[1] - z[0] + eps]);
    translate([tp_x1 - slot_engage - 1, yb + slot_y0(tp_b), tp_z0])
      cube([slot_engage + 1 + slot_side_fit, slot_y1(tp_b) - slot_y0(tp_b), tp_w + roof_fit]);
  }
}

// Each fin's channel in the floor and groove up the right wall, and the
// cell's floor plate's channel, which takes the fins either side of it
module fin_channels() {
  w = divider_t / 2 + slide_fit;
  for (c = [[dividers[0] - w, dividers[0] + w], [dividers[1] - w, dividers[2] + w]])
    translate([-hx - 1, yb + c[0], bottom_t - floor_channel_d]) cube([2 * hx + 1, c[1] - c[0], floor_channel_d + eps]);
  for (i = [0:len(dividers) - 1])
    translate([hx - eps, yb + dividers[i] - w, bottom_t - floor_channel_d])
      cube([wall_groove_d + eps, 2 * w, divider_tops[i] + slide_fit - bottom_t + floor_channel_d]);
}

// The top's grooves: along the back and front walls' tops for its tongues,
// and in the right wall for its hook's nib, the groove's roof at 45° so it
// prints
module top_grooves() {
  for (sy = [-1, 1]) translate([-hx - 1, sy * (hy + end_wall / 2) - tongue_w / 2 - slide_fit, ceiling - tongue_h - slide_fit])
    cube([2 * hx + 1, tongue_w + 2 * slide_fit, tongue_h + slide_fit + eps]);
  z0 = ceiling - hook_h - slide_fit;
  z1 = ceiling - hook_h + nib_h + slide_fit;
  along_y(hook_y0 - slide_fit, hook_y1 + slide_fit)
    polygon([[hx - eps, z0], [hx + nib_l + slide_fit, z0], [hx + nib_l + slide_fit, z1], [hx - eps, z1 + nib_l + slide_fit + eps]]);
}

module along_y(y0, y1) {
  translate([0, y1, 0]) rotate([90, 0, 0]) linear_extrude(y1 - y0) children();
}

// On the back and front walls, their undersides 45° down to the wall so
// they print
module door_screw_bosses() {
  for (s = door_screws) let(sy = sign(s[0])) difference() {
    hull() {
      translate([-hx, s[0], s[1]]) rotate([0, 90, 0]) cylinder(r = m3_boss_r, h = m3_boss_l);
      translate([-hx, sy > 0 ? hy : -hy - eps, boss_z0(s)]) cube([m3_boss_l, eps, s[1] + m3_boss_r - boss_z0(s)]);
    }
    translate([-hx - 1, s[0], s[1]]) rotate([0, 90, 0]) cylinder(d = m3_pilot_d, h = m3_engage + 1.5);
  }
}

module bottom_opening(y) {
  translate([0, yb + y, -1]) linear_extrude(bottom_t + 2)
    offset(usb_open_r) square([usb_open_w - 2 * usb_open_r, usb_open_h - 2 * usb_open_r], center = true);
}

module body() {
  difference() {
    intersection() {
      shell();
      translate([-hx, -ey - 1, -1]) cube([ex + hx + 1, 2 * ey + 2, ceiling + 1]);
    }
    cavity();
    fin_channels();
    top_grooves();
    for (b = boards) bottom_opening(b[5]);
    translate([hx - 1, yb + tp_usb_cy, tp_usb_cz]) rotate([0, 90, 0]) linear_extrude(side_wall + 2)
      offset(usb_open_r) square([usb_open_w - 2 * usb_open_r, usb_open_h - 2 * usb_open_r], center = true);
    grip_cut();
  }
  for (b = boards) right_rail(b);
  tp_right_rails();
  door_screw_bosses();
}

// ---- carriage, modelled in place

// A board's rib on the door face: from the face to past the board's edge,
// slotted for the PCB between a floor and a roof, open to the right for the
// board to slide in. Kept clear of the body's back and front walls.
module left_rib(b, x_edge, z0, z1) {
  x0 = -hx - eps;
  zf = max(bottom_t + slide_fit, z0 - roof_t);
  y0 = max(rail_y0(b), slide_fit);
  y1 = min(rail_y1(b), depth - slide_fit);
  difference() {
    translate([x0, yb + y0, zf]) cube([x_edge + slot_engage - x0, y1 - y0, z1 + roof_fit + roof_t - zf]);
    translate([x_edge - slot_side_fit, yb + slot_y0(b), z0]) cube([slot_engage + 1 + slot_side_fit, slot_y1(b) - slot_y0(b), z1 + roof_fit - z0]);
  }
}

// A board's top edge in a slot under a tab off the fin at y_fin, near the
// board's right end, stopping short of the body's rail. The tab's left end
// runs 45° back to the fin so it prints.
module board_tab(b, y_fin) {
  x1 = b[0] / 2 - slot_engage - slide_fit;
  x0 = x1 - board_tab_l;
  z0 = board_z1(b) - slot_engage;
  z1 = board_z1(b) + roof_fit + roof_t;
  yf = y_fin;
  yo = yf > b[1] ? rail_y0(b) : rail_y1(b);
  w = abs(yf - yo);
  difference() {
    hull() {
      translate([x0 - w, yb + yf - eps / 2, z0]) cube([x1 - x0 + w, eps, z1 - z0]);
      translate([x0, yb + yo - eps / 2, z0]) cube([x1 - x0, eps, z1 - z0]);
    }
    translate([x0 - w - 1, yb + slot_y0(b), z0 - 1]) cube([x1 - x0 + w + 2, slot_y1(b) - slot_y0(b), board_z1(b) + roof_fit - z0 + 1]);
  }
}

// The TP4056's slotted bars along its bottom and top edges, from the door
// face to short of the body's rails, between the back of its slot and its
// fin
module tp_bars() {
  x1 = tp_x1 - slot_engage - slide_fit;
  y0 = rail_y0(tp_b);
  y1 = dividers[0];
  for (z = [[bottom_t + slide_fit, tp_z0 + slot_engage, tp_z0, tp_z0 + slot_engage + 1],
            [tp_z1 - slot_engage, tp_z1 + roof_fit + roof_t, tp_z1 - slot_engage - 1, tp_z1 + roof_fit]])
    difference() {
      translate([-hx - eps, yb + y0, z[0]]) cube([x1 + hx + eps, y1 - y0, z[1] - z[0]]);
      translate([-hx - 1, yb + slot_y0(tp_b), z[2]]) cube([x1 + hx + 2, slot_y1(tp_b) - slot_y0(tp_b), z[3] - z[2]]);
    }
}

module fins() {
  for (i = [0:len(dividers) - 1]) translate([-hx - eps, yb + dividers[i] - divider_t / 2, fin_z0])
    cube([2 * hx + wall_groove_d - slide_fit + eps, divider_t, divider_tops[i] - fin_z0]);
}

// The cell's floor plate between its fins, and a roof over its top end at
// each side; the wires come out between the roofs
module cell_cradle() {
  y0 = dividers[1] - divider_t / 2;
  y1 = dividers[2] + divider_t / 2;
  translate([-hx - eps, yb + y0, fin_z0]) cube([2 * hx - slide_fit + eps, y1 - y0, bottom_t - fin_z0]);
  for (x = [-hx - eps, hx - slide_fit - cell_roof_reach])
    translate([x, yb + y0, cell_z1 + roof_fit]) cube([cell_roof_reach + eps, y1 - y0, roof_t]);
}

// Under the top: a tongue along each of the back and front walls, and the
// hook at the right edge, its left face 45° up to the top so it prints
module top_mates() {
  for (sy = [-1, 1]) translate([-hx - eps, sy * (hy + end_wall / 2) - tongue_w / 2, ceiling - tongue_h])
    cube([2 * hx - slide_fit + eps, tongue_w, tongue_h + eps]);
  x = hx - slide_fit;
  zb = ceiling - hook_h;
  along_y(hook_y0, hook_y1)
    polygon([[x - hook_h, ceiling + eps], [x, ceiling + eps], [x, zb + nib_h + nib_l + slide_fit],
             [hx + nib_l, zb + nib_h], [hx + nib_l, zb], [x, zb]]);
}

module carriage() {
  difference() {
    union() {
      intersection() {
        shell();
        union() {
          translate([-ex - 1, -ey - 1, -1]) cube([ex - hx + 1, 2 * ey + 2, total_h + 2]);
          translate([-ex - 1, -ey - 1, ceiling]) cube([2 * ex + 2, 2 * ey + 2, total_h]);
        }
      }
      top_mates();
    }
    for (p = smas) translate([p[0], p[1], ceiling - 1]) cylinder(d = sma_hole_d, h = top_t + 2);
    for (s = door_screws) translate([-ex - 1, s[0], s[1]]) rotate([0, 90, 0]) {
      cylinder(d = m3_clear_d, h = side_wall + 2);
      cylinder(d = m3_cbore_d, h = m3_cbore_h + 1);
    }
    grip_cut(false);
  }
  fins();
  cell_cradle();
  tp_bars();
  left_rib(tp_b, tp_x0, tp_z0, tp_z1);
  for (b = boards) left_rib(b, -b[0] / 2, board_z0(b), board_z1(b));
  board_tab(hc_board, dividers[1] - divider_t / 2);
  board_tab(v4_board, dividers[2] + divider_t / 2);
}

// The carriage drawn out d to the left of where it sits
module carriage_out(d = 0) {
  translate([-d, 0, 0]) children();
}

// ---- print orientations

// On its door face
module carriage_print() {
  translate([0, 0, ex]) rotate([0, -90, 0]) carriage();
}

// ---- reference parts

module ref_cell() {
  translate([-cell_w / 2, yb + cell_y + cell_fit, bottom_t]) cube([cell_w, cell_t, cell_l]);
}

// A board as its PCB, its parts as blocks either side, clear of the
// edges the slots hold, and its USB-C. back/front: the tallest parts
// behind and in front of the PCB
module ref_board(b, back, front) {
  z0 = board_z0(b);
  e = slot_engage + 1;
  translate([-b[0] / 2, yb + b[1], z0]) cube([b[0], b[2], b[3]]);
  if (back > 0) translate([-b[0] / 2 + e, yb + b[1] - back, z0 + 3]) cube([b[0] - 2 * e, back, b[3] - 6]);
  translate([-b[0] / 2 + e, yb + b[1] + b[2], z0 + 3]) cube([b[0] - 2 * e, front, b[3] - 6]);
  translate([-4.5, yb + b[5] - 1.6, bottom_t + usb_gap]) cube([9, 3.2, b[4] + 7]);
}

module ref_hc() { ref_board(hc_board, hc_under, hc_over); }
module ref_v4() { ref_board(v4_board, v4_under, v4_over); }

module ref_tp() {
  translate([tp_x0, yb + tp_pcb_y, tp_z0]) cube([tp_l, tp_pcb, tp_w]);
  translate([tp_x1 + tp_usb_overhang - 7.5, yb + tp_pcb_y + tp_pcb, tp_usb_cz - tp_usb_w / 2]) cube([7.5, tp_usb_h, tp_usb_w]);
}

module ref_sma() {
  for (p = smas) translate([p[0], p[1], ceiling]) {
    translate([0, 0, -(sma_behind - 2)]) cylinder(d = 6.35, h = sma_behind - 2 + top_t + 8);
    translate([0, 0, -2]) cylinder(d = sma_nut_d, h = 2, $fn = 6);
    translate([0, 0, top_t]) cylinder(d = sma_nut_d, h = 2, $fn = 6);
  }
}
