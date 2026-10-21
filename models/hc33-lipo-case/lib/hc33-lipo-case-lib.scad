// HT-HC33 LiPo case: a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), a Heltec
// WiFi LoRa 32 V4, a 103665 LiPo pouch cell and a USB-C TP4056 charger
// board, stacked face to face like a stack of cards in a case that stands
// on end. The USB-Cs come out of the bottom, and two SMA bulkheads come
// out of the top at opposite corners.
//
// Two pieces:
// - the sleeve: the bottom, the four walls and the screw towers, open at
//   the top. Each board slides down into a pair of slotted rails, one on
//   each side wall, until its PCB lands on the slot's floor with its USB-C
//   over an opening in the bottom. The cell slides down between pairs of
//   fins onto the bottom.
// - the cap: the top. Its SMA holes sit over the front-left and back-right
//   corners. A finger hangs down over each board and the cell and stops
//   just short of it, so nothing can ride up out of its slot.
// M3 cap screws go down through the cap into the sleeve's corner towers. A
// tongue round the sleeve's rim drops into a groove under the cap.
//
// Stack, back to front: TP4056 (parts to the front), cell, HC33 (top face
// to the front), V4 (top face, with its screen, to the front).
//
// Frame: origin at the cavity's centre in plan, z = 0 on the bottom face.
// X across, Y through the stack (+Y the front), Z up the case. The sleeve
// prints as modelled, bottom down; the cap prints top face down
// (`cap_print()`).

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

// TP4056 USB-C charger board: PCB length and width, PCB thickness, the
// solder behind it, the receptacle's height in front of it and how far it
// sticks out past the board's end (unmeasured)
tp_l = 28;
tp_w = 17.5;
tp_pcb = 1.6;
tp_back = 0.5;
tp_usb_h = 3.2;
tp_usb_overhang = 0.6;

// Gap between neighbours in the stack, and in front of the V4
layer_gap = 1.5;
front_gap = 0.5;

// Board rails: how far each board's edge goes into its slot, the slot's
// clearance over the PCB's thickness and past its edge, and the rail's
// wall either side of the slot
slot_engage = 1.25;
slot_fit = 0.4;
slot_side_fit = 0.3;
rail_wall = 1.2;

// Fins either side of the cell: thickness, and how far in from the wall
cell_fin_t = 1.2;
cell_fin_reach = 3;

// Gap between each USB-C's face and the bottom
usb_gap = 0.3;

// USB-C openings through the bottom, sized for a plug's overmold:
// across, through the stack, corner radius
usb_open_w = 13;
usb_open_h = 7;
usb_open_r = 1;

// SMA bulkheads (1/4-36) through the cap: the hole, the inner nut across
// corners, and how far the connector's back and the pigtail's bend reach
// down from the cap
sma_hole_d = 6.6;
sma_nut_d = 9.2;
sma_behind = 12;

// Fingers under the cap: width across, gap over what they stop, the
// least thickness; the cell's pair stand this far either side of the
// centre, clear of its tabs
finger_w = 6;
finger_gap = 0.3;
finger_t_min = 1.6;
cell_finger_x = 6.5;

// Walls and bottom, and the cap (the SMAs' panel)
wall = 2.5;
cap_t = 5;

// Outside corner radius
corner_r = 4;

// M3 cap screws through the corner towers: clearance hole, pilot,
// counterbore diameter and depth, the plastic round them, and the
// screw's length under the head
clear_d = 3.4;
pilot_d = 2.5;
cbore_d = 6;
cbore_h = 3.2;
screw_skin = 1.2;
screw_len = 10;

// Indexing tongue round the sleeve's rim: in from the cavity, width,
// height; the cap's groove clearance per side
tongue_e = 0.65;
tongue_w = 1.2;
tongue_h = 1.5;
groove_fit = 0.2;
// END_PARAMS

eps = 0.01;

hx = cell_w / 2 + cell_fit;
inner_r = max(corner_r - wall, 0.5);

// Through the stack, from the back wall's inner face
tp_y = 0;
tp_depth = tp_back + tp_pcb + tp_usb_h;
cell_y = tp_y + tp_depth + layer_gap;
cell_depth = cell_t + 2 * cell_fit;
hc_y = cell_y + cell_depth + layer_gap;
hc_depth = hc_under + hc_pcb + hc_over;
v4_y = hc_y + hc_depth + layer_gap;
v4_over = v4_t - v4_under - v4_pcb;
depth = v4_y + v4_t + front_gap;
hy = depth / 2;
// From the back face onto the frame
yb = -hy;

// Each board: [width, PCB's back face, PCB thickness, length, USB-C
// overhang, USB-C centre]
tp_board = [tp_w, tp_y + tp_back, tp_pcb, tp_l, tp_usb_overhang, tp_y + tp_back + tp_pcb + tp_usb_h / 2];
hc_board = [hc_w, hc_y + hc_under, hc_pcb, hc_l, hc_usb_overhang, hc_y + hc_under + hc_pcb + hc_usb_y];
v4_board = [v4_w, v4_y + v4_under, v4_pcb, v4_l, v4_usb_overhang, v4_y + v4_under + v4_pcb + v4_usb_y];
boards = [tp_board, hc_board, v4_board];
// Each board's PCB lands on its slot's floor, so the USB-C's face is
// usb_gap off the bottom
function board_z0(b) = wall + usb_gap + b[4];
function board_z1(b) = board_z0(b) + b[3];
cell_z1 = wall + cell_l;

top = max(cell_z1, max([for (b = boards) board_z1(b)])) + finger_gap;
// The cavity's top, the sleeve's rim: room for the SMAs' backs over everything
rim = top + sma_behind;
total_h = rim + cap_t;

// SMAs over the front-left and back-right corners, the inner nut just
// clear of the walls
sma_e = sma_nut_d / 2 + 0.5;
smas = [[-(hx - sma_e), hy - sma_e], [hx - sma_e, -(hy - sma_e)]];

// Screws on the corners' diagonals, far enough out that the clearance
// hole clears the side walls' faces and the counterbore the cavity's corner
screw_d = max(clear_d / 2 + screw_skin,
              ((cbore_d / 2 + 0.8 + inner_r) / sqrt(2)) - inner_r);
tower_r = cbore_d / 2 + screw_skin;
screws = [for (sx = [-1, 1], sy = [-1, 1]) [sx * (hx + screw_d), sy * (hy + screw_d)]];
screw_engage = screw_len - (cap_t - cbore_h);
pilot_depth = screw_engage + 1;

function slot_y0(b) = b[1] - slot_fit / 2;
function slot_y1(b) = b[1] + b[2] + slot_fit / 2;
function rail_y0(b) = slot_y0(b) - rail_wall;
function rail_y1(b) = slot_y1(b) + rail_wall;

for (b = boards) assert(b[0] / 2 + slot_side_fit <= hx, "a board is wider than the cavity");
// The outermost rails may run into the back and front walls; their slots may not
assert(slot_y0(tp_board) >= 0, "the TP4056's slot runs into the back wall");
assert(rail_y1(tp_board) <= cell_y - cell_fin_t, "the TP4056's rail runs into the cell's fins");
assert(rail_y0(hc_board) >= cell_y + cell_depth + cell_fin_t, "the HC33's rail runs into the cell's fins");
assert(rail_y1(hc_board) <= rail_y0(v4_board), "the HC33's and the V4's rails run together");
assert(slot_y1(v4_board) <= depth, "the V4's slot runs into the front wall");
assert(cell_fin_t <= layer_gap, "the cell's fins run into its neighbours");
// Openings through the bottom keep a web between them
for (i = [0:len(boards) - 2])
  assert(boards[i + 1][5] - boards[i][5] >= usb_open_h + 1.2, "two USB-C openings run together");
assert(boards[0][5] - usb_open_h / 2 >= -wall + 1, "the TP4056's opening breaks out of the back");
assert(boards[2][5] + usb_open_h / 2 <= depth + wall - 1, "the V4's opening breaks out of the front");
assert(cell_finger_x + finger_w / 2 + 0.5 <= hx - sma_e - 6.35 / 2, "the cell's fingers hit an SMA's back");
// The outer nuts sit on the cap beside the corner towers
for (p = smas, q = screws) assert(norm(p - q) >= tower_r + sma_nut_d / 2 + 0.3, "an SMA's outer nut hits a screw tower");
assert(screw_engage >= 6, "the screws barely reach into the sleeve");
assert(cap_t - cbore_h >= 1.5, "too little cap under the screw heads");
assert(tongue_e + tongue_w + groove_fit + 0.4 <= wall, "the groove breaks out of the wall");
assert(tongue_h + 0.3 <= cap_t - 1.2, "the groove runs up through the cap");

// Footprint: the rounded body and the four screw towers
module outline() {
  r = corner_r;
  translate([-(hx + wall) + r, -(hy + wall) + r]) offset(r) square([2 * (hx + wall - r), 2 * (hy + wall - r)]);
  for (p = screws) translate(p) circle(r = tower_r);
}

module cavity(grow = 0) {
  r = inner_r + grow;
  translate([-hx - grow + r, -hy - grow + r]) offset(r) square([2 * (hx + grow - r), 2 * (hy + grow - r)]);
}

module tongue_plan(grow = 0) {
  difference() {
    cavity(tongue_e + tongue_w + grow);
    cavity(tongue_e - grow);
  }
}

// ---- sleeve

// A board's rail on each side wall: a block from the wall to past the
// board's edge, slotted for the PCB from its floor up.
module rails(b) {
  for (sx = [-1, 1]) scale([sx, 1, 1]) difference() {
    translate([b[0] / 2 - slot_engage, yb + rail_y0(b), wall - eps])
      cube([hx - b[0] / 2 + slot_engage + eps, rail_y1(b) - rail_y0(b), board_z1(b) - wall + eps]);
    translate([b[0] / 2 - slot_engage - 1, yb + slot_y0(b), board_z0(b)])
      cube([slot_engage + 1 + slot_side_fit, slot_y1(b) - slot_y0(b), b[3] + 1]);
  }
}

module cell_fins() {
  for (sx = [-1, 1], y = [cell_y - cell_fin_t, cell_y + cell_depth]) scale([sx, 1, 1])
    translate([hx - cell_fin_reach, yb + y, wall - eps]) cube([cell_fin_reach + eps, cell_fin_t, cell_l + eps]);
}

module sleeve() {
  difference() {
    union() {
      linear_extrude(rim) outline();
      translate([0, 0, rim - eps]) linear_extrude(tongue_h + eps) tongue_plan();
    }
    translate([0, 0, wall]) linear_extrude(rim) cavity();
    for (p = screws) translate([p[0], p[1], rim - pilot_depth]) cylinder(d = pilot_d, h = pilot_depth + 1);
    for (b = boards) translate([0, yb + b[5], -1]) linear_extrude(wall + 2)
      offset(usb_open_r) square([usb_open_w - 2 * usb_open_r, usb_open_h - 2 * usb_open_r], center = true);
  }
  for (b = boards) rails(b);
  cell_fins();
}

// ---- cap, modelled in place

module cap() {
  difference() {
    union() {
      translate([0, 0, rim]) linear_extrude(cap_t) outline();
      for (b = boards) let(t = max(b[2], finger_t_min))
        translate([-finger_w / 2, yb + b[1] + b[2] / 2 - t / 2, board_z1(b) + finger_gap])
          cube([finger_w, t, rim - board_z1(b) - finger_gap + eps]);
      for (sx = [-1, 1])
        translate([sx * cell_finger_x - finger_w / 2, yb + cell_y + cell_fit + 1, cell_z1 + finger_gap])
          cube([finger_w, cell_t - 2, rim - cell_z1 - finger_gap + eps]);
    }
    translate([0, 0, rim - 1]) linear_extrude(tongue_h + 0.3 + 1) tongue_plan(groove_fit);
    for (p = screws) translate([p[0], p[1], rim - 1]) {
      cylinder(d = clear_d, h = cap_t + 2);
      translate([0, 0, cap_t + 1 - cbore_h]) cylinder(d = cbore_d, h = cbore_h + 1);
    }
    for (p = smas) translate([p[0], p[1], rim - 1]) cylinder(d = sma_hole_d, h = cap_t + 2);
  }
}

module cap_in_place(lift = 0) {
  translate([0, 0, lift]) cap();
}

// Top face down, so the counterbores' floors are short bridges and the
// fingers stand up off it.
module cap_print() {
  translate([0, 0, total_h]) mirror([0, 0, 1]) cap();
}

// ---- reference parts

module ref_cell() {
  translate([-cell_w / 2, yb + cell_y + cell_fit, wall]) cube([cell_w, cell_t, cell_l]);
}

// A board as its PCB, its parts as blocks either side, clear of the
// edges the rails hold, and its USB-C. back/front: the tallest parts
// behind and in front of the PCB
module ref_board(b, back, front) {
  z0 = board_z0(b);
  e = slot_engage + 1;
  translate([-b[0] / 2, yb + b[1], z0]) cube([b[0], b[2], b[3]]);
  if (back > 0) translate([-b[0] / 2 + e, yb + b[1] - back, z0 + 3]) cube([b[0] - 2 * e, back, b[3] - 6]);
  translate([-b[0] / 2 + e, yb + b[1] + b[2], z0 + 3]) cube([b[0] - 2 * e, front, b[3] - 6]);
  translate([-4.5, yb + b[5] - 1.6, wall + usb_gap]) cube([9, 3.2, b[4] + 7]);
}

module ref_tp() { ref_board(tp_board, 0, tp_usb_h); }
module ref_hc() { ref_board(hc_board, hc_under, hc_over); }
module ref_v4() { ref_board(v4_board, v4_under, v4_over); }

module ref_sma(lift = 0) {
  for (p = smas) translate([p[0], p[1], rim + lift]) {
    translate([0, 0, -(sma_behind - 2)]) cylinder(d = 6.35, h = sma_behind - 2 + cap_t + 8);
    translate([0, 0, -2]) cylinder(d = sma_nut_d, h = 2, $fn = 6);
    translate([0, 0, cap_t]) cylinder(d = sma_nut_d, h = 2, $fn = 6);
  }
}
