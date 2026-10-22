// Hanging solar node: a frame that a small solar panel slides into, hung from
// a tree by a loop on its back. Everything mounts to the frame first; the
// panel slides in last.
//
// Frame: +X across the panel, +Y up as it hangs, +Z out of the panel's back
// toward the frame's back. Z = 0 is the panel's back face; the panel's face
// is at Z = -panel_t. The origin is the panel's centre.
//
// The panel is captive: the left, right and top walls run forward past it
// into a channel, and it slides up into it from the open bottom. Behind it a
// ledge just inside the walls is what its back runs on; in front, a lip over
// its border keeps it in. The lip's inner face is 45 deg so the frame prints
// on its back, and it meets the panel's face at its edge. Adhesive in the
// channel seals it. Nothing reaches in front of the panel's back, so the
// panel passes everything on its way in.
//
// Behind the panel are two compartments. The main one is sealed, with tie
// anchors in a grid all over its back wall; the XIAO nRF52840 + Wio-SX1262
// sits at its centre, tied through the anchors either side. Below it the
// bottom is open, and what's there faces down, recessed into it. From the
// right edge in:
// - the antenna: the main compartment drops nearly to the panel's bottom edge
//   in a column just wide enough for the SMA bulkhead, which sits in its
//   floor over a hex pocket for its inside nut, so the antenna hangs straight
//   down at the frame's bottom corner. The floor sits col_raise up, behind
//   the panel where its rounded corner would otherwise show the inside;
// - the TP4056, inside the main compartment, standing on end with its flat
//   back to the 18650 on the step wall, tied to it through two slots; its
//   USB-C comes down through a slot in the floor;
// - the 18650 holder, open side down. It drops straight down from inside,
//   before the panel goes in, between two walls, one at each end, each an L
//   whose foot catches only the holder's 1 mm end wall, where the terminals
//   are, so it's captive: it can't fall out, and the cell comes out from
//   below, between the feet. A notch at the top of each wall lets its wires
//   through. A bar along the back wall over its top back edge stops it
//   lifting: it goes down a little proud at the front, pushes back under the
//   bar, and the panel then closes it in. The frame is just deep enough for
//   it. Fill the notches and the seam round its floor with adhesive.
// Everything ends on one flat face, recess up inside the bottom edge: the
// floor either side of the holder, the L's feet and the USB-C's floor. Only
// the antenna column goes lower. The walls run on below that face, so rain
// blowing in under the node has to come up into the recess to reach it.
// Where the main compartment's floors and walls meet the panel's back, a
// bead run from below seals them.
//
// The loop is a tab standing up from the back above the top wall, with a
// gusset down its front to the full depth of the frame.
//
// Prints: the frame on its back.

// BEGIN_PARAMS
// Panel width (measured)
panel_w = 122;

// Panel height
panel_h = 160;

// Panel corner radius
panel_r = 10;

// Panel thickness (measured)
panel_t = 1.7;

// Gap between the panel's edge and the channel's wall, per side
glue_gap = 0.4;

// Gap in front of the panel's face in the channel
face_clear = 0.3;

// How deep the lip in front of the panel is; it reaches this, less glue_gap,
// over the panel's border
lip_d = 3;

// Frame wall: 3 perimeters of a 0.4 nozzle
wall = 1.2;

// Frame back
back_t = 1.0;

// How far the ledge the panel's back runs on reaches in from the panel's edge
lip_w = 1.5;

// The ledge's thickness at its inner edge
lip_t = 1.2;

// 18650 holder: length, width, height (measured)
holder_l = 78.3;
holder_w = 20.8;
holder_h = 20;

// The holder's end walls, which the L's feet catch, and the feet's thickness
holder_end_t = 1;
ledge_t = 1.5;

// How far the flat bottom face (the floors, the L's feet, the USB-C's floor)
// sits up inside the bottom edge
recess = 22;

// Hanging loop: hole, the rim round it, and the tab's thickness off the back
loop_hole = 10;
loop_rim = 7;
loop_t = 6;

// The panel's own hole, at the top, centred: an M5x10 screw goes through it
// into a boss in the frame. Its centre down from the panel's top edge
panel_hole_from_top = 6;
// END_PARAMS

eps = 0.01;
clear = 0.3;

// TP4056 USB-C module, standing on end with its USB-C at the bottom: width,
// length, board thickness; the USB-C's width, height off the board, and how far
// it overhangs the board's end
tp = [17.5, 28, 1.6];
usb = [9.2, 3.4, 1];
tp_room = 10;
floor_t = 1.2;

// XIAO nRF52840 on a Wio-SX1262, standing on its pins on the back wall
xiao = [17.8, 21, 18];
xiao_c = [0, 0];

// How far the antenna column's floor sits up from the bottom edge: the panel's
// rounded bottom corner leaves a gap in front of the column's foot
col_raise = 5;

// SMA bulkhead in the antenna column's floor; the column is this wide inside
sma_hole = 6.6;
sma_nut = 9.2;
// The floor the SMA's thread passes through, and the hex pocket behind it its
// inside nut sits in, so the bulkhead can't turn
sma_floor = 2.4;
hex_pocket = [8 + 0.3, 2.2];
col_w = 11.2;

// Room beyond the holder's right-hand wall, before the TP4056's
wire_gap = 6;

// The notch at the top of each of the holder's walls for its wires: width
// (front to back), depth
wire_notch = [4, 5];

// The bar over the holder's top back edge: height, and how far it reaches
// over the holder
bar = [1.5, 5];

// M5x10 through the panel's hole: the boss's pilot (self-tapping), the boss,
// and the cap head the top lip is notched round
m5_pilot = 4.2;
m5_boss = 10;
m5_head = [8.5, 5];

// Zip-tie anchors: a tunnel for the tie in a block on the back wall
tie_tunnel = [4.6, 1.8];
anchor = [6, 8, 4];

// Tie anchors everywhere in the main compartment, a symmetric grid on the
// back wall; the XIAO sits in the gap at its centre, tied through the anchors
// either side of it
anchor_xs = [-48, -32, -16, 0, 16, 32, 48];
anchor_ys = [-20, 0, 20, 40, 60];

// Tie slots through the step wall, either side of the TP4056
tie_slot = [4.4, 1.6];

pocket_x = panel_w / 2 + glue_gap;
pocket_y = panel_h / 2 + glue_gap;
z_in = holder_w + 2 * clear;
z_out = z_in + back_t;
channel_z = -(panel_t + face_clear);
front_z = channel_z - lip_d;
bottom_y = -pocket_y;
base_y = bottom_y + recess;
face_y = base_y + ledge_t;
col_y = bottom_y + col_raise;
col_x0 = pocket_x - col_w;
step_x = col_x0 - wall - tp_room;
zc = z_in / 2;
sma = [(col_x0 + pocket_x) / 2, zc];
screw_y = panel_h / 2 - panel_hole_from_top;
usb_x = step_x + tp.z + usb.y / 2;
top_y = pocket_y + wall;
loop_y = top_y + loop_rim + loop_hole / 2;
outer = [2 * (pocket_x + wall), loop_y + loop_hole / 2 + loop_rim - bottom_y];
holder_x0 = step_x - wall - wire_gap - wall - clear - holder_l;
holder_top = face_y + holder_h;
holder_z0 = clear;
holder_y0 = face_y;
tp_y0 = base_y + floor_t;
anchors = [for (x = anchor_xs, y = anchor_ys) if (abs(x - xiao_c.x) > xiao.x / 2 + anchor.x / 2 || abs(y - xiao_c.y) > xiao.y / 2 + anchor.y / 2) [x, y]];
// Two in the antenna column, for the SMA's pigtail.
col_anchors = [for (dy = [12, 30]) [sma.x, col_y + sma_floor + hex_pocket.y + dy]];

assert(xiao_c.y - xiao.y / 2 > holder_top + bar.x, "the XIAO runs into the holder");
assert(min(anchor_ys) - anchor.y / 2 > tp_y0 + tp.y, "a tie anchor runs into the TP4056");
assert(max(anchor_xs) + anchor.x / 2 < pocket_x - lip_w - glue_gap, "a tie anchor runs into the ledge");
assert(col_w >= anchor.x + 2, "the antenna column is too narrow for its tie anchors");
assert(zc + tp.x / 2 + 0.2 + tie_slot.y < z_in, "the TP4056's back tie slot runs into the back wall");
assert(col_w >= hex_pocket.x / cos(30) + 1, "the antenna column is too narrow for the SMA's hex pocket");
assert(screw_y + m5_boss / 2 <= pocket_y + eps, "the screw boss pokes through the top wall");
assert(tp_room >= tp.z + usb.y + 1, "the TP4056 doesn't fit between the step and the antenna column");
assert(tp.x + 2 < z_in, "the TP4056 is wider than the frame is deep");
assert(holder_x0 - wire_gap - wall > -pocket_x + lip_w + glue_gap, "the holder's slot runs into the side wall");
assert(tp_y0 + tp.y < xiao_c.y - xiao.y / 2, "the TP4056 runs into the XIAO");

module rrect(size, r) {
    offset(r = r) square([size.x - 2 * r, size.y - 2 * r], center = true);
}

// The panel's outline, and the frame's: rounded at the top like the panel,
// square at the bottom, where the bay is.
module panel_2d() rrect([panel_w, panel_h], panel_r);
module squared(o) {
    offset(r = o) panel_2d();
    translate([-panel_w / 2 - o, -panel_h / 2 - o]) square([panel_w + 2 * o, panel_h / 2 + o]);
}
module pocket_2d() squared(glue_gap);
module outer_2d() squared(glue_gap + wall);
module opening_2d() offset(delta = -lip_w) panel_2d();

// A shape and everything below it: the path the panel takes sliding in.
module swept_down(d = panel_h) hull() { children(); translate([0, -d]) children(); }

module slab(z0, z1) translate([0, 0, z0]) linear_extrude(z1 - z0) children();

module ledge() {
    chamf = lip_w + glue_gap;
    difference() {
        slab(0, lip_t + chamf) pocket_2d();
        slab(-1, lip_t + eps) swept_down() opening_2d();
        hull() {
            slab(lip_t, lip_t + eps) swept_down() opening_2d();
            slab(lip_t + chamf, lip_t + chamf + eps) swept_down() offset(r = chamf) opening_2d();
        }
    }
}

module loop() {
    r = loop_hole / 2 + loop_rim;
    difference() {
        union() {
            hull() {
                translate([0, loop_y, z_out - loop_t]) cylinder(d = 2 * r, h = loop_t);
                translate([-r, top_y - wall, z_out - loop_t]) cube([2 * r, wall, loop_t]);
            }
            // Gusset: the tab's root runs the frame's full depth.
            hull() {
                translate([-loop_t / 2, top_y - wall, front_z]) cube([loop_t, wall, z_out - front_z]);
                translate([-loop_t / 2, loop_y - loop_hole / 2 - 2, z_out - loop_t]) cube([loop_t, eps, loop_t]);
            }
        }
        translate([0, loop_y, front_z - 1]) cylinder(d = loop_hole, h = z_out - front_z + 2);
    }
}

// The main compartment's floor: flat at base_y either side of the holder and
// under the TP4056, the step wall the TP4056's back lies on, and a wall down
// to the antenna column's floor.
module floors() {
    x1 = holder_x0 + holder_l;
    translate([-pocket_x, base_y, 0]) cube([pocket_x + holder_x0 - clear - wall + eps, floor_t, z_in + eps]);
    translate([x1 + clear + wall - eps, base_y, 0]) cube([col_x0 - x1 - clear - wall + eps, floor_t, z_in + eps]);
    translate([step_x - wall, base_y, 0]) cube([wall, tp_y0 + tp.y - base_y, z_in + eps]);
    translate([col_x0 - wall, col_y, 0]) cube([wall, base_y + floor_t - col_y, z_in + eps]);
    translate([col_x0 - wall, col_y, 0]) cube([col_w + wall + eps, sma_floor + hex_pocket.y, z_in + eps]);
}

// A wall at each end of the holder, an L whose foot reaches under the
// holder's end wall; a bar on the back wall over its top back edge stops it
// lifting.
module holder_pocket() {
    x1 = holder_x0 + holder_l;
    for (sd = [-1, 1]) {
        wx = sd < 0 ? holder_x0 - clear - wall : x1 + clear;
        translate([wx, base_y, 0]) cube([wall, holder_top - base_y, z_in + eps]);
        translate([sd < 0 ? wx : x1 - holder_end_t, base_y, 0]) cube([wall + clear + holder_end_t, ledge_t, z_in + eps]);
    }
    translate([holder_x0, holder_top + clear, z_in - clear - bar.y]) cube([holder_l, bar.x, clear + bar.y + eps]);
}

module tie_anchor(p) {
    translate([p.x, p.y, z_in - anchor.z]) difference() {
        translate([-anchor.x / 2, -anchor.y / 2, 0]) cube([anchor.x, anchor.y, anchor.z + eps]);
        translate([0, 0, anchor.z - 1.2 - tie_tunnel.y / 2]) cube([anchor.x + 2, tie_tunnel.x, tie_tunnel.y], center = true);
    }
}

module frame() {
    difference() {
        union() {
            difference() {
                slab(front_z, z_out) outer_2d();
                slab(0, z_in) pocket_2d();
                slab(channel_z, eps) swept_down() pocket_2d();
                hull() {
                    slab(channel_z, channel_z + eps) swept_down() pocket_2d();
                    slab(front_z - eps, front_z) swept_down() offset(delta = glue_gap - lip_d) panel_2d();
                }
            }
            ledge();
            // The boss the M5 through the panel's hole screws into.
            translate([0, screw_y, 0]) cylinder(d = m5_boss, h = z_in + eps);
            translate([-m5_boss / 2, screw_y, 0]) cube([m5_boss, pocket_y - screw_y + eps, z_in + eps]);
            floors();
            holder_pocket();
            for (a = anchors) tie_anchor(a);
            for (a = col_anchors) tie_anchor(a);
            loop();
        }
        // The bay is open at the bottom: no bottom wall.
        translate([-outer.x, bottom_y - 50, front_z - 1]) cube([2 * outer.x, 50, z_out - front_z + 2]);
        // The inside runs on past the bottom edge, so no skin is left across the opening.
        translate([-pocket_x, bottom_y - 1, -eps]) cube([2 * pocket_x, 2, z_in + eps]);
        // Tie slots through the step wall either side of the TP4056, so a tie
        // wraps round the board against the wall.
        for (z = [zc - tp.x / 2 - 0.2 - tie_slot.y / 2, zc + tp.x / 2 + 0.2 + tie_slot.y / 2])
            translate([step_x - wall - 1, tp_y0 + tp.y / 2 - tie_slot.x / 2, z - tie_slot.y / 2]) cube([wall + 2, tie_slot.x, tie_slot.y]);
        // The notch at the top of each of the holder's walls, for its wires.
        for (x = [holder_x0 - clear - wall, holder_x0 + holder_l + clear])
            translate([x - 1, holder_top - wire_notch.y, zc - wire_notch.x / 2]) cube([wall + 2, wire_notch.y + 1, wire_notch.x]);
        translate([sma.x, col_y - 1, sma.y]) rotate([-90, 0, 0]) cylinder(d = sma_hole, h = sma_floor + hex_pocket.y + 2);
        // A corner of the hex points along Z, so its top prints at 60 deg.
        translate([sma.x, col_y + sma_floor, sma.y]) rotate([-90, 0, 0]) rotate(30)
            cylinder(d = hex_pocket.x / cos(30), h = hex_pocket.y + 1, $fn = 6);
        translate([0, screw_y, -1]) cylinder(d = m5_pilot, h = 1 + m5_boss);
        translate([0, screw_y, front_z - 1]) cylinder(d = m5_head.x + 1, h = channel_z - front_z + 1);
        translate([usb_x - usb.y / 2 - 0.25, base_y - 1, zc - usb.x / 2 - 0.25]) cube([usb.y + 0.5, floor_t + 2, usb.x + 0.5]);
    }
}

// --- reference hardware, for the previews ---

module ref_panel_face() slab(-panel_t, -panel_t + 0.3) offset(delta = -3) panel_2d();
module ref_panel() difference() {
    slab(-panel_t, 0) panel_2d();
    translate([0, screw_y, -panel_t - 1]) cylinder(d = 5.5, h = panel_t + 2);
}

module ref_screw() translate([0, screw_y, -panel_t]) {
    translate([0, 0, -m5_head.y]) cylinder(d = m5_head.x, h = m5_head.y);
    cylinder(d = 5, h = 10);
}

// The holder sits open side down on its L's feet.
module ref_holder() translate([holder_x0, holder_y0, holder_z0]) difference() {
    cube([holder_l, holder_h, holder_w]);
    translate([holder_end_t, -1, 1]) cube([holder_l - 2 * holder_end_t, holder_h, holder_w - 2]);
}
module ref_cell() translate([holder_x0 + holder_l / 2, holder_y0 + holder_h - 1 - 9.25, holder_z0 + holder_w / 2]) rotate([0, 90, 0]) cylinder(d = 18.5, h = 65, center = true);

// Standing on end, its back on the step wall, its USB-C through the floor.
module ref_tp4056() translate([step_x, tp_y0, zc - tp.x / 2]) {
    cube([tp.z, tp.y, tp.x]);
    translate([tp.z, -usb.z, (tp.x - usb.x) / 2]) cube([usb.y, 7.5, usb.x]);
}

module ref_xiao() translate([xiao_c.x, xiao_c.y, z_in - xiao.z / 2]) cube(xiao, center = true);

module ref_sma() translate([sma.x, col_y, sma.y]) rotate([-90, 0, 0]) {
    translate([0, 0, -8]) cylinder(d = 6.35, h = 8 + sma_floor + hex_pocket.y + 10);
    translate([0, 0, -2]) cylinder(d = sma_nut, h = 2, $fn = 6);
    translate([0, 0, sma_floor]) rotate(30) cylinder(d = sma_nut, h = 2, $fn = 6);
}
module ref_antenna() translate([sma.x, col_y - 8, sma.y]) rotate([90, 0, 0]) {
    cylinder(d = 10, h = 30);
    cylinder(d = 8, h = 200);
}

// Hanging, Y up.
module in_use() rotate([90, 0, 0]) children();

// The frame on its back.
module frame_print() translate([0, 0, z_out]) mirror([0, 0, 1]) frame();

module plate() frame_print();
