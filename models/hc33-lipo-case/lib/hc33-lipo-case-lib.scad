// HT-HC33 LiPo case: a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), a Heltec
// WiFi LoRa 32 V4, a 103665 LiPo pouch cell and a USB-C TP4056 charger
// board, stacked face to face like a stack of cards in a case that stands
// on end. The HC33's and V4's USB-Cs come out of the bottom, the TP4056's
// out of the right side, and two SMA bulkheads out of the top at opposite
// corners. The left side is a door, hinged along its bottom edge, so the
// whole stack is open from the side. Dividers keep each piece in a
// chamber of its own; the space under the top is open across them for
// the wires.
//
// Two pieces:
// - the body: bottom, top, back, front and right walls. Each board's right
//   edge sits in a slot in a rail on the right wall, closed top and bottom,
//   and the HC33's and V4's slots have floors that put the USB-C over its
//   opening. Dividers run between the layers, and a roof stops the cell's
//   right end riding up.
// - the door: the left wall. Ribs on its inside hold each board's left
//   edge in a slot with a roof over it, and a roof stops the cell's left
//   end. It swings down on a hinge along the bottom edge (knuckles round a
//   1.75 mm filament pin). A groove across its top takes a fingernail to
//   pull it open.
// - the bolt: a rod under the top, across the opening (along Y). It slides
//   in a guide on the body into a keeper on the door, so the door can't
//   swing. A knob on it comes up through a slot in the top to work it with
//   a fingertip. At the locked end the slot doglegs: the rod turns in its
//   holes to tip the knob into it, and then the bolt can't slide.
// With the door open, everything slides out to the left.
//
// Stack, back to front: TP4056 (parts to the front, its USB-C end to the
// right), HC33 (top face to the front), cell, V4 (top face, with its
// screen, to the front).
//
// Seen from the top the outline is a rounded rectangle whose left and
// right faces lead into the corners at 45°, so each piece prints on that
// face with no overhang past 45°. The top edge is rounded the same way.
// The front and back faces carry 15 mm bands, diamond knurled and plain in
// turn, all the way up.
//
// Frame: origin at the cavity's centre in plan, z = 0 on the bottom face.
// X across (the door at -X), Y through the stack (+Y the front), Z up the
// case. The body prints on its right face (`body_print()`), the door on its
// outer face (`door_print()`).

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

// Gap between neighbours in the stack (a divider runs down the middle of
// each), and in front of the V4
layer_gap = 2.4;
front_gap = 0.5;

// Dividers between the layers
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

// How far the roofs over the cell's ends reach in from the right wall
// and the door
cell_roof_reach = 3;

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

// Walls: the right wall and the door; the back and front; the bottom; the
// top (the SMAs' panel)
side_wall = 6;
end_wall = 4;
bottom_t = 2.5;
top_t = 3;

// Corner radius seen from the top, and the top edge's radius
profile_r = 10;
top_r = 4;

// Gap between the door and the body
door_fit = 0.2;

// Hinge: 1.75 mm filament pin, snug in the body's knuckles and loose in
// the door's; how many knuckles; the gap between them; the clearance
// round each knuckle as it turns
pin_d = 1.75;
pin_snug = 0.05;
pin_loose = 0.3;
knuckles = 5;
knuckle_gap = 0.4;
hinge_clear = 0.3;

// Door bolt: the rod's diameter and its clearance in the guide and the
// keeper, the wall round it, how far into the cavity from the door frame
// its axis runs, the guide's and the keeper's spans along Y, and how far
// the tip goes into the keeper
bolt_d = 4;
bolt_fit = 0.3;
bolt_wall = 2;
bolt_x = 4.5;
guide_y = [-10, -2];
keeper_y = [1, 8];
bolt_engage = 4;

// The bolt's knob: across (X) and along (Y), how far it stands over the
// top, the slot's clearance round it, and how far the dogleg at the locked
// end reaches (+X)
knob_w = 3.6;
knob_l = 6;
knob_h = 5;
knob_fit = 0.4;
dogleg = 4.5;

// Fingernail groove across the door's outer face near the top: depth
// (a 90° V), and its centre below the top
pull_d = 1.5;
pull_z = 8;

// Grip bands on the front and back faces: height, the knurl's pitch and
// depth (90° V-grooves at ±45°), and the plain margin at the bottom and
// under the top edge
band_h = 15;
knurl_pitch = 2;
knurl_d = 0.8;
band_margin = 2;
// END_PARAMS

eps = 0.01;

hx = cell_w / 2 + cell_fit;
ex = hx + side_wall;

// Through the stack, from the back wall's inner face
tp_y = 0;
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
// Dividers, centred in the gaps: TP4056 | HC33 | cell | V4
dividers = [hc_y - layer_gap / 2, cell_y - layer_gap / 2, v4_y - layer_gap / 2];

// HC33 and V4: [width, PCB's back face, PCB thickness, length, USB-C
// overhang, USB-C centre]. Each PCB lands on its slot's floor, so the
// USB-C's face is usb_gap off the bottom.
hc_board = [hc_w, hc_y + hc_under, hc_pcb, hc_l, hc_usb_overhang, hc_y + hc_under + hc_pcb + hc_usb_y];
v4_board = [v4_w, v4_y + v4_under, v4_pcb, v4_l, v4_usb_overhang, v4_y + v4_under + v4_pcb + v4_usb_y];
boards = [hc_board, v4_board];
function board_z0(b) = bottom_t + usb_gap + b[4];
function board_z1(b) = board_z0(b) + b[3];

// TP4056: PCB from tp_x0 to tp_x1, standing on the bottom
tp_pcb_y = tp_y + tp_back;
tp_x1 = hx - usb_gap - tp_usb_overhang;
tp_x0 = tp_x1 - tp_l;
tp_z1 = bottom_t + tp_w;
tp_usb_cy = tp_pcb_y + tp_pcb + tp_usb_h / 2;
tp_usb_cz = bottom_t + tp_w / 2;

cell_z1 = bottom_t + cell_l;

tallest = max(cell_z1, tp_z1, max([for (b = boards) board_z1(b)]));
// The dividers stop at the roofs; above them the wires cross between
// chambers
divider_z1 = tallest + roof_fit + roof_t;
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

// Hinge axis along Y at the door's bottom edge. The knuckles' radius keeps
// them out of the cavity.
hinge_r = (side_wall - door_fit) / 2;
hinge = [-ex + hinge_r, hinge_r];
knuckle_l = 2 * ey / knuckles;
function knuckle_y0(i) = -ey + i * knuckle_l;
// Even knuckles are the body's, odd ones the door's
function body_knuckle(i) = i % 2 == 0;

// Door bolt. The keeper stays 1.5 under the top: the door's swing lifts
// its far edge as it goes out.
bolt_r = bolt_d / 2;
bolt_hole_r = bolt_r + bolt_fit / 2;
bolt_cx = -hx + bolt_x;
bolt_z = ceiling - 1.5 - bolt_wall - bolt_r;
bolt_house_r = bolt_r + bolt_wall;
bolt_travel = bolt_engage + 0.5;
// The rod, locked: from its knob end, just short of the guide, to its tip
// in the keeper
rod_y0 = guide_y[0] - 0.3 - knob_l;
rod_y1 = keeper_y[0] + bolt_engage;

// Grip bands from the bottom up; the even ones are knurled
band_top = top_z0 - band_margin;
band_n = ceil((band_top - band_margin) / band_h);
function band_z0(i) = band_margin + i * band_h;
function band_z1(i) = min(band_margin + (i + 1) * band_h, band_top);

function slot_y0(b) = b[1] - slot_fit / 2;
function slot_y1(b) = b[1] + b[2] + slot_fit / 2;
function rail_y0(b) = slot_y0(b) - rail_wall;
function rail_y1(b) = slot_y1(b) + rail_wall;
tp_b = [0, tp_pcb_y, tp_pcb];

for (b = boards) assert(b[0] / 2 + slot_side_fit <= hx, "a board is wider than the cavity");
assert(slot_y0(tp_b) >= 0, "the TP4056's slot runs into the back wall");
assert(rail_y1(tp_b) <= dividers[0] - divider_t / 2, "the TP4056's rails run into a divider");
assert(rail_y0(hc_board) >= dividers[0] + divider_t / 2, "the HC33's rails run into a divider");
assert(rail_y1(hc_board) <= dividers[1] - divider_t / 2, "the HC33's rails run into a divider");
assert(rail_y0(v4_board) >= dividers[2] + divider_t / 2, "the V4's rails run into a divider");
assert(slot_y1(v4_board) <= depth, "the V4's slot runs into the front wall");
assert(divider_t + 0.6 <= layer_gap, "the dividers leave their neighbours no room");
assert(v4_board[5] - hc_board[5] >= usb_open_h + 1.2, "the two bottom USB-C openings run together");
assert(tp_x0 - slot_side_fit - rail_wall >= -hx + 2, "the TP4056 doesn't fit across");
assert(tp_usb_cy - usb_open_h / 2 >= -1, "the TP4056's opening runs into the back wall");
assert(tp_usb_cz - usb_open_w / 2 >= bottom_t, "the TP4056's opening runs into the bottom");
assert(hinge[0] + hinge_r + door_fit <= -hx + eps, "the hinge's knuckles reach into the cavity");
assert(hinge_r - (pin_d + pin_loose) / 2 >= 1.2, "too little knuckle round the pin");
assert(lead_y >= arc_y && arc_x > 0 && arc_y > 0, "the corner radius is too big for the outline");
// The cavity's corner keeps a wall
assert(profile_r - norm([profile_r - side_wall, profile_r - end_wall]) >= 2, "the corners are too thin");
for (p = smas) {
  // The bolt's guide, keeper, rod and knob stay clear of each SMA's nut
  assert(p[0] - sma_nut_d / 2 >= bolt_cx + bolt_house_r + dogleg + 1
         || p[1] - sma_nut_d / 2 >= keeper_y[1] + 0.5
         || p[1] + sma_nut_d / 2 <= rod_y0 - bolt_travel - knob_fit - 0.5, "an SMA's nut hits the door bolt");
  assert(abs(p[1]) + sma_nut_d / 2 <= hy - 0.3, "an SMA's inner nut hits the back or front wall");
  // The outer nut sits on the flat of the top: inside the outline inset by top_r
  assert(norm([max(abs(p[0]) - arc_x, 0), max(abs(p[1]) - arc_y, 0)]) + sma_nut_d / 2 <= profile_r - top_r,
         "an SMA's outer nut runs onto the rounded top edge");
}
assert(bolt_z - bolt_house_r >= divider_z1 + 0.3, "the bolt's keeper hangs into the chambers");
assert(bolt_cx - bolt_house_r >= -hx, "the bolt's guide runs into the door");
// Drawn, the tip sits 0.5 short of the keeper and still spans the gap
assert(rod_y1 - bolt_travel >= guide_y[1] + 0.5, "the drawn bolt's tip pulls back into its guide");
assert(top_r < profile_r, "the top edge's radius is bigger than the corners'");
assert(total_h - pull_z + pull_d <= top_z0, "the pull groove runs into the top edge");

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

module cavity() {
  r = 1;
  translate([0, 0, bottom_t]) linear_extrude(ceiling - bottom_t) hull() {
    for (sy = [-1, 1]) translate([hx - r, sy * (hy - r)]) circle(r = r);
    translate([-hx - door_fit / 2, -hy]) square([eps, 2 * hy]);
  }
}

// ---- hinge

// The knuckles' section in XZ about the hinge axis. A 45° chamfer takes off
// the outer bottom edge, which the door prints on.
module knuckle_2d() {
  translate(hinge) intersection() {
    circle(r = hinge_r);
    rotate(45) translate([-hinge_r / sqrt(2), -2 * hinge_r]) square(4 * hinge_r);
  }
}

module along_y(y0, y1) {
  translate([0, y1, 0]) rotate([90, 0, 0]) linear_extrude(y1 - y0) children();
}

module knuckle_span(i, trim = true) {
  g = trim ? knuckle_gap / 2 : 0;
  along_y(knuckle_y0(i) + (i == 0 ? -1 : g), knuckle_y0(i + 1) - (i == knuckles - 1 ? -1 : g)) children();
}

module pin_hole(d) {
  translate([hinge[0], 0, hinge[1]]) rotate([90, 0, 0]) cylinder(d = d, h = 2 * ey + 2, center = true);
}

// ---- body

// The body's knuckle: the knuckle and the square down to the bottom, its
// top 45° off the axis toward the cavity, so it prints over the cavity
module body_knuckle_2d() {
  intersection() {
    union() {
      knuckle_2d();
      translate([hinge[0], 0]) square([-hx - hinge[0], hinge[1]]);
    }
    translate(hinge) rotate(45) translate([-4 * hinge_r, -4 * hinge_r]) square([4 * hinge_r + hinge_r / sqrt(2), 8 * hinge_r]);
  }
}

// A board's rail on the right wall: a block from the wall to past the
// board's edge, slotted for the PCB between its floor and its roof.
module right_rail(b) {
  difference() {
    translate([b[0] / 2 - slot_engage, yb + rail_y0(b), bottom_t - eps])
      cube([hx - b[0] / 2 + slot_engage + eps, rail_y1(b) - rail_y0(b), board_z1(b) + roof_fit + roof_t - bottom_t + eps]);
    translate([b[0] / 2 - slot_engage - 1, yb + slot_y0(b), board_z0(b)])
      cube([slot_engage + 1 + slot_side_fit, slot_y1(b) - slot_y0(b), b[3] + roof_fit]);
  }
}

// The TP4056's rails at its USB-C end: below and above the receptacle,
// the upper one roofed
module tp_right_rails() {
  zr0 = tp_usb_cz - tp_usb_w / 2 - 0.5;
  zr1 = tp_usb_cz + tp_usb_w / 2 + 0.5;
  for (z = [[bottom_t, zr0], [zr1, tp_z1 + roof_fit + roof_t]]) difference() {
    translate([tp_x1 - slot_engage, yb + rail_y0(tp_b), z[0] - eps])
      cube([hx - tp_x1 + slot_engage + eps, rail_y1(tp_b) - rail_y0(tp_b), z[1] - z[0] + eps]);
    translate([tp_x1 - slot_engage - 1, yb + slot_y0(tp_b), bottom_t - 1])
      cube([slot_engage + 1 + slot_side_fit, slot_y1(tp_b) - slot_y0(tp_b), tp_z1 + roof_fit - bottom_t + 1]);
  }
}

// A roof over the cell's end, reaching in from x0 to x1
module cell_roof(x0, x1) {
  translate([x0, yb + cell_y - eps, cell_z1 + roof_fit]) cube([x1 - x0, cell_depth + 2 * eps, roof_t]);
}

module dividers() {
  for (y = dividers) translate([-hx, yb + y - divider_t / 2, bottom_t - eps])
    cube([2 * hx + eps, divider_t, divider_z1 - bottom_t + eps]);
}

// The bolt's hole along Y over y0..y1, a teardrop peaked toward dir (±1
// in X), the way the piece prints
module bolt_hole(y0, y1, dir) {
  translate([bolt_cx, y1, bolt_z]) rotate([90, 0, 0]) linear_extrude(y1 - y0) hull() {
    circle(r = bolt_hole_r);
    translate([dir * bolt_hole_r * sqrt(2), 0]) circle(r = 0.1);
  }
}

// Under the top, its far side 45° up to the top so it prints
module bolt_guide() {
  difference() {
    hull() {
      translate([bolt_cx, guide_y[1], bolt_z]) rotate([90, 0, 0]) cylinder(r = bolt_house_r, h = guide_y[1] - guide_y[0]);
      // out to where the 45° tangent off the housing meets the top
      translate([bolt_cx - bolt_house_r, guide_y[0], ceiling - eps])
        cube([bolt_house_r * (1 + sqrt(2)) + (ceiling - bolt_z) + 0.2, guide_y[1] - guide_y[0], eps]);
    }
    bolt_hole(guide_y[0] - 1, guide_y[1] + 1, -1);
  }
}

// On the door's inner face
module bolt_keeper() {
  difference() {
    hull() {
      translate([bolt_cx, keeper_y[1], bolt_z]) rotate([90, 0, 0]) cylinder(r = bolt_house_r, h = keeper_y[1] - keeper_y[0]);
      translate([-hx - door_fit - eps, keeper_y[0], bolt_z - bolt_house_r])
        cube([eps, keeper_y[1] - keeper_y[0], 2 * bolt_house_r]);
    }
    bolt_hole(keeper_y[0] - 1, keeper_y[1] + 1, 1);
  }
}

// The slot in the top the knob runs in, with the dogleg at the locked end
module knob_slot() {
  w = knob_w + 2 * knob_fit;
  translate([0, 0, ceiling - 1]) linear_extrude(top_t + 2) {
    translate([bolt_cx - w / 2, rod_y0 - bolt_travel - knob_fit]) square([w, knob_l + bolt_travel + 2 * knob_fit]);
    translate([bolt_cx - w / 2, rod_y0 - knob_fit]) square([w + dogleg, knob_l + 2 * knob_fit]);
  }
}

// The rod and its knob, locked (drawn: slid back by bolt_travel)
module bolt(drawn = false, tilt = 0) {
  translate([0, drawn ? -bolt_travel : 0, 0]) translate([bolt_cx, 0, bolt_z]) rotate([0, tilt, 0]) translate([-bolt_cx, 0, -bolt_z]) {
    translate([bolt_cx, rod_y1, bolt_z]) rotate([90, 0, 0]) cylinder(r = bolt_r, h = rod_y1 - rod_y0);
    translate([bolt_cx - knob_w / 2, rod_y0, bolt_z]) cube([knob_w, knob_l, total_h + knob_h - bolt_z]);
  }
}

// Standing on its knob end
module bolt_print() {
  translate([0, 0, -rod_y0]) rotate([90, 0, 0]) bolt();
}

// The band's outline on the face: its ends lead in at 45°, so no groove
// ends in a face that prints facing down
module band_region(z0, z1) {
  h = z1 - z0;
  e = min(h / 2, arc_x);
  polygon([[-arc_x + e, z0], [arc_x - e, z0], [arc_x, z0 + e], [arc_x, z1 - e], [arc_x - e, z1],
           [-arc_x + e, z1], [-arc_x, z1 - e], [-arc_x, z0 + e]]);
}

module knurl() {
  for (i = [0:band_n - 1]) if (i % 2 == 0) let(z0 = band_z0(i), z1 = band_z1(i)) if (z1 - z0 > 2)
    for (sy = [-1, 1]) intersection() {
      translate([0, sy * ey, 0]) rotate([90, 0, 0]) linear_extrude(2 * knurl_d + 2, center = true) band_region(z0, z1);
      translate([0, sy * ey, 0]) for (dir = [-1, 1]) knurl_v(z0, z1, dir);
    }
}

// Grooves at 45° (dir ±1) across the face at y = 0, a 90° V knurl_d deep each
module knurl_v(z0, z1, dir) {
  w = 2 * arc_x;
  span = w + (z1 - z0);
  n = ceil(span / (knurl_pitch * sqrt(2)));
  zc = (z0 + z1) / 2;
  s = knurl_d * sqrt(2);
  for (i = [-n:n]) translate([0, 0, zc]) rotate([0, dir * 45, 0]) translate([i * knurl_pitch, 0, 0])
    rotate([0, 0, 45]) cube([s, s, 2 * span], center = true);
}

module bottom_opening(y) {
  // its -X end peaked at 45°, as it prints
  w = usb_open_w / 2;
  h = usb_open_h / 2;
  translate([0, yb + y, -1]) linear_extrude(bottom_t + 2) hull() {
    offset(usb_open_r) square([2 * (w - usb_open_r), 2 * (h - usb_open_r)], center = true);
    translate([-w - h, 0]) circle(r = 0.1);
  }
}

module body() {
  difference() {
    union() {
      intersection() {
        shell();
        translate([-hx, -ey - 1, -1]) cube([ex + hx + 1, 2 * ey + 2, total_h + 2]);
      }
      intersection() {
        shell();
        for (i = [0:knuckles - 1]) if (body_knuckle(i)) knuckle_span(i) body_knuckle_2d();
      }
    }
    cavity();
    // room for the door's knuckles to turn
    for (i = [0:knuckles - 1]) if (!body_knuckle(i))
      knuckle_span(i, false) translate(hinge) circle(r = hinge_r + hinge_clear);
    pin_hole(pin_d + pin_snug);
    for (b = boards) bottom_opening(b[5]);
    translate([hx - 1, yb + tp_usb_cy, tp_usb_cz]) rotate([0, 90, 0]) linear_extrude(side_wall + 2)
      offset(usb_open_r) square([usb_open_w - 2 * usb_open_r, usb_open_h - 2 * usb_open_r], center = true);
    for (p = smas) translate([p[0], p[1], ceiling - 1]) cylinder(d = sma_hole_d, h = top_t + 2);
    knob_slot();
    knurl();
  }
  for (b = boards) right_rail(b);
  tp_right_rails();
  dividers();
  cell_roof(hx - cell_roof_reach, hx + eps);
  bolt_guide();
}

// ---- door, modelled closed

// A board's rib on the door: from the door to past the board's edge,
// slotted for the PCB up to its roof. No floor: the door's swing would
// lift it into the PCB's corner.
module door_rib(b, x_edge, z0, z1) {
  x0 = -hx - door_fit - eps;
  // kept inside the cavity, clear of the body's back and front walls
  y0 = max(rail_y0(b), 0);
  y1 = min(rail_y1(b), depth);
  difference() {
    translate([x0, yb + y0, z0]) cube([x_edge + slot_engage - x0, y1 - y0, z1 + roof_fit + roof_t - z0]);
    translate([x_edge - slot_side_fit, yb + slot_y0(b), z0 - 1]) cube([slot_engage + 1 + slot_side_fit, slot_y1(b) - slot_y0(b), z1 + roof_fit - z0 + 1]);
  }
}

module door() {
  x1 = -hx - door_fit;
  difference() {
    union() {
      intersection() {
        shell();
        union() {
          translate([-ex - 1, -ey - 1, hinge[1]]) cube([x1 + ex + 1, 2 * ey + 2, total_h]);
          for (i = [0:knuckles - 1]) if (!body_knuckle(i)) knuckle_span(i) knuckle_2d();
        }
      }
    }
    // room for the body's knuckles: teardrops peaked toward the cavity,
    // the way the door prints
    for (i = [0:knuckles - 1]) if (body_knuckle(i))
      knuckle_span(i, false) translate(hinge) hull() {
        circle(r = hinge_r + hinge_clear);
        translate([(hinge_r + hinge_clear) * sqrt(2), 0]) circle(r = 0.1);
      }
    pin_hole(pin_d + pin_loose);
    // fingernail groove across the outer face, a 90° V
    translate([-ex, 0, total_h - pull_z]) rotate([90, 0, 0]) rotate(45)
      cube([pull_d * sqrt(2), pull_d * sqrt(2), 2 * ey + 2], center = true);
  }
  for (b = boards) door_rib(b, -b[0] / 2, board_z0(b), board_z1(b));
  door_rib(tp_b, tp_x0, bottom_t + 0.3, tp_z1);
  cell_roof(-hx - door_fit - eps, -hx + cell_roof_reach);
  bolt_keeper();
}

// Swung open by a degrees about the hinge
module door_open(a = 0) {
  translate([hinge[0], 0, hinge[1]]) rotate([0, -a, 0]) translate([-hinge[0], 0, -hinge[1]]) door();
}

// ---- print orientations

// On its right face
module body_print() {
  translate([0, 0, ex]) rotate([0, 90, 0]) body();
}

// On its outer face
module door_print() {
  translate([0, 0, ex]) rotate([0, -90, 0]) door();
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
  translate([tp_x0, yb + tp_pcb_y, bottom_t]) cube([tp_l, tp_pcb, tp_w]);
  translate([tp_x1 + tp_usb_overhang - 7.5, yb + tp_pcb_y + tp_pcb, tp_usb_cz - tp_usb_w / 2]) cube([7.5, tp_usb_h, tp_usb_w]);
}

module ref_sma() {
  for (p = smas) translate([p[0], p[1], ceiling]) {
    translate([0, 0, -(sma_behind - 2)]) cylinder(d = 6.35, h = sma_behind - 2 + top_t + 8);
    translate([0, 0, -2]) cylinder(d = sma_nut_d, h = 2, $fn = 6);
    translate([0, 0, top_t]) cylinder(d = sma_nut_d, h = 2, $fn = 6);
  }
}

module ref_pin() {
  translate([hinge[0], 0, hinge[1]]) rotate([90, 0, 0]) cylinder(d = pin_d, h = 2 * ey - 4, center = true);
}
