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
// Behind the panel are two compartments. The main one, above a partition,
// is sealed: the XIAO nRF52840 + Wio-SX1262 is zip-tied to anchors on the
// back wall. Below the partition the bay is open at the bottom, and what's
// in it faces down, recessed into it: the 18650 holder hangs open side down
// under the partition, in a pocket and on one screw up through its floor
// into a blind boss, so the cell comes out from below; the TP4056 slides up
// between two rails until it meets the partition, its USB-C facing down;
// and the SMA bulkhead sits in the partition, so the antenna hangs straight
// down. The frame's walls run on below them, so rain blowing in under the
// node has to come up into the bay to reach them. The partition lets only
// wires through, by holes past each end of the holder and over the TP4056,
// to be filled with adhesive; its front edge meets the panel's back, sealed
// by a bead run along it from the bay.
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

// How far the TP4056's USB-C sits up inside the open bottom; the bay is this
// plus the TP4056 standing on end, and the holder's open face sits higher
recess = 22;

// Partition between the bay and the main compartment
partition_t = 2.4;

// Hanging loop: hole, the rim round it, and the tab's thickness off the back
loop_hole = 10;
loop_rim = 7;
loop_t = 6;
// END_PARAMS

eps = 0.01;
clear = 0.3;

// TP4056 USB-C module, standing on end with its USB-C at the bottom
tp = [17.5, 28, 1.6];
tp_x = 51.5;
usb = [9.2, 3.4];

// XIAO nRF52840 on a Wio-SX1262, standing on its pins on the back wall
xiao = [17.8, 21, 18];
xiao_c = [12, 0];

// SMA bulkhead in the partition, and where it sits
sma_hole = 6.6;
sma_x = 33;
sma_z = 12;

// The holder's pocket: a strip along each long side under the partition
pocket_strip = [1.2, 3];

// The holder's screw, up through the hole in its floor into a blind boss
holder_screw_dx = 0;
boss = [8, 6];
pilot_d = 2.5;

// Zip-tie anchors: a tunnel for the tie in a block on the back wall
tie_tunnel = [4.6, 1.8];
anchor = [6, 8, 4];

wire_hole = 4;

pocket_x = panel_w / 2 + glue_gap;
pocket_y = panel_h / 2 + glue_gap;
z_in = 24;
z_out = z_in + back_t;
channel_z = -(panel_t + face_clear);
front_z = channel_z - lip_d;
bottom_y = -pocket_y;
bay_h = recess + tp.y;
partition_y = bottom_y + bay_h;
top_y = pocket_y + wall;
loop_y = top_y + loop_rim + loop_hole / 2;
outer = [2 * (pocket_x + wall), loop_y + loop_hole / 2 + loop_rim - bottom_y];
holder_x0 = -57;
holder_z0 = (z_in - holder_w) / 2;
holder_y0 = partition_y - holder_h;
holder_screw = [holder_x0 + holder_l / 2 + holder_screw_dx, z_in / 2];
tp_y0 = partition_y - tp.y;
tp_face_z = z_in - tp.z - clear;
xiao_anchor_xs = [xiao_c.x - xiao.x / 2 - anchor.x / 2 - 0.5, xiao_c.x + xiao.x / 2 + anchor.x / 2 + 0.5];
wire_holes = [[holder_x0 - 2, z_in / 2], [holder_x0 + holder_l + 2.5, z_in / 2], [tp_x, tp_face_z - 6]];

assert(holder_z0 - clear - pocket_strip[0] > 0, "the holder's pocket runs into the panel");
assert(xiao_c.y - xiao.y / 2 > partition_y + partition_t + boss[1], "the XIAO runs into the partition");
assert(holder_h < bay_h, "the holder doesn't fit in the bay");
assert(holder_x0 + holder_l + 2.5 + wire_hole / 2 < sma_x - 4.6, "the holder's wire hole runs into the SMA");
assert(tp_x - tp.x / 2 - 1.5 > sma_x + 4.6, "the TP4056's rail runs into the SMA");
assert(tp_x + tp.x / 2 + clear <= pocket_x, "the TP4056 doesn't fit against the right wall");
assert(holder_x0 - 2 - wire_hole / 2 > -pocket_x, "the holder's wire hole runs into the wall");

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

module partition() translate([-pocket_x, partition_y, 0]) cube([2 * pocket_x, partition_t, z_in + eps]);

// The TP4056 slides up between two rails to the partition: a stop at each
// long edge, and a lip over the edge's middle third, clear of the pads at
// either end.
module tp_rails() {
    for (sd = [-1, 1]) {
        edge = tp_x + sd * (tp.x + clear) / 2;
        translate([sd < 0 ? edge - 1.5 : edge, tp_y0 - 2, tp_face_z - 1.2]) cube([1.5, partition_y - tp_y0 + 2 + eps, z_in - tp_face_z + 1.2 + eps]);
        translate([sd < 0 ? edge - 1.5 : edge - 1, tp_y0 + tp.y / 3, tp_face_z - 1.2]) cube([2.5, tp.y / 3, 1.2]);
    }
}

// The holder hangs under the partition between two strips along its long
// sides, on a screw into a boss over the partition.
module holder_pocket() {
    for (z = [holder_z0 - clear - pocket_strip[0], holder_z0 + holder_w + clear])
        translate([holder_x0, partition_y - pocket_strip[1], z]) cube([holder_l, pocket_strip[1] + eps, pocket_strip[0]]);
    translate([holder_screw.x - boss.x / 2, partition_y + partition_t - eps, holder_screw.y - boss.x / 2])
        cube([boss.x, boss[1], z_in - holder_screw.y + boss.x / 2 + eps]);
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
            partition();
            tp_rails();
            holder_pocket();
            for (x = xiao_anchor_xs) tie_anchor([x, xiao_c.y]);
            loop();
        }
        // The bay is open at the bottom: no bottom wall.
        translate([-outer.x, bottom_y - 50, front_z - 1]) cube([2 * outer.x, 50, z_out - front_z + 2]);
        translate([holder_screw.x, partition_y - 1, holder_screw.y]) rotate([-90, 0, 0]) cylinder(d = pilot_d, h = 1 + partition_t + boss[1] - 1);
        translate([sma_x, partition_y - 1, sma_z]) rotate([-90, 0, 0]) cylinder(d = sma_hole, h = partition_t + 2);
        for (h = wire_holes) translate([h.x, partition_y - 1, h.y]) rotate([-90, 0, 0]) cylinder(d = wire_hole, h = partition_t + 2);
    }
}

// --- reference hardware, for the previews ---

module ref_panel_face() slab(-panel_t, -panel_t + 0.3) offset(delta = -3) panel_2d();
module ref_panel() slab(-panel_t, 0) panel_2d();

// The holder hangs with its floor to the partition, its open side down.
module ref_holder() translate([holder_x0, holder_y0, holder_z0]) difference() {
    cube([holder_l, holder_h, holder_w]);
    translate([2, -1, 1]) cube([holder_l - 4, holder_h, holder_w - 2]);
}
module ref_cell() translate([holder_x0 + holder_l / 2, partition_y - 1 - 9.25, z_in / 2]) rotate([0, 90, 0]) cylinder(d = 18.5, h = 65, center = true);

module ref_tp4056() translate([tp_x, tp_y0, tp_face_z + clear]) {
    translate([-tp.x / 2, 0, 0]) cube(tp);
    translate([-usb.x / 2, -0.5, -usb.y]) cube([usb.x, 7.5, usb.y]);
}

module ref_xiao() translate([xiao_c.x, xiao_c.y, z_in - xiao.z / 2]) cube(xiao, center = true);

module ref_sma() translate([sma_x, partition_y, sma_z]) rotate([-90, 0, 0]) {
    translate([0, 0, -10]) cylinder(d = 6.35, h = 10 + partition_t + 8);
    translate([0, 0, -2]) cylinder(d = 9.2, h = 2, $fn = 6);
    translate([0, 0, partition_t]) cylinder(d = 9.2, h = 2, $fn = 6);
}
module ref_antenna() translate([sma_x, partition_y - 10, sma_z]) rotate([90, 0, 0]) {
    cylinder(d = 10, h = 30);
    cylinder(d = 8, h = 200);
}

// Hanging, Y up.
module in_use() rotate([90, 0, 0]) children();

// The frame on its back.
module frame_print() translate([0, 0, z_out]) mirror([0, 0, 1]) frame();

module plate() frame_print();
