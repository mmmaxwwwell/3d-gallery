// Hanging solar node: a frame that a small solar panel slides into, hung from
// a tree by a loop on its back. Everything mounts to the frame first; the
// panel slides in last and a bottom cover closes it.
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
// back wall. Below the partition, the bay is open at the bottom and holds
// what should come out without taking the panel out: the 18650 holder, the
// TP4056 (sliding up between two rails, its USB-C facing down) and the SMA
// bulkhead, which sits in the partition with the antenna hanging down. The
// partition lets only wires through, by holes over the holder's ends and
// the TP4056, to be filled with adhesive; the partition's front edge meets
// the panel's back, sealed by a bead run along it from the bay.
//
// A cover screws up under the bay into two blocks on the back wall, with
// holes for the antenna and the USB-C. It runs under the panel's bottom edge
// too, so with it on the panel can't slide out. The blocks stand behind the
// holder's open side, so they also keep the cell in.
//
// The loop is a tab standing up from the back above the top wall, with a
// gusset down its front to the full depth of the frame.
//
// Prints: the frame on its back, the cover on its inside face.

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

// Bay height, from the bottom to the partition: the TP4056 standing on end
bay_h = 30;

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
xiao_c = [12, -30];

// SMA bulkhead in the partition, and where it sits
sma_hole = 6.6;
sma_x = 33;
sma_z = 8;
antenna_hole = 11;

// Cover screws: M3 cap heads up into blocks on the back wall
screw_xs = [-40, sma_x];
block = [8, 7];
pilot_d = 2.5;
pilot_depth = 12;
cover_t = 2;
cb_d = 6.2;
cb_depth = 3.2;
pad_d = 9;
screw_hole = 3.4;

// Zip-tie anchors: a tunnel for the tie in a block on the back wall
tie_tunnel = [4.6, 1.8];
anchor = [6, 8, 4];

wire_hole = 4;

pocket_x = panel_w / 2 + glue_gap;
pocket_y = panel_h / 2 + glue_gap;
z_in = clear + holder_h + clear + block[1];
z_out = z_in + back_t;
channel_z = -(panel_t + face_clear);
front_z = channel_z - lip_d;
bottom_y = -pocket_y;
partition_y = bottom_y + bay_h;
top_y = pocket_y + wall;
loop_y = top_y + loop_rim + loop_hole / 2;
outer = [2 * (pocket_x + wall), loop_y + loop_hole / 2 + loop_rim - bottom_y];
holder_x0 = -54;
holder_z0 = clear;
tp_y0 = bottom_y + 0.5;
tp_face_z = z_in - tp.z - clear;
screw_z = z_in - block[1] / 2;
xiao_anchor_xs = [xiao_c.x - xiao.x / 2 - anchor.x / 2 - 0.5, xiao_c.x + xiao.x / 2 + anchor.x / 2 + 0.5];
wire_holes = [[holder_x0 + 4, 10], [holder_x0 + holder_l - 4, 10], [tp_x, tp_face_z - 6]];

assert(tp_y0 + tp.y < partition_y, "the TP4056 doesn't fit under the partition");
assert(holder_w < bay_h, "the holder doesn't fit in the bay");
assert(holder_x0 + holder_l + clear + 1.5 < sma_x - 4.6, "the holder runs into the SMA");
assert(tp_x - tp.x / 2 - 1.5 > sma_x + 4.6, "the TP4056's rail runs into the SMA");
assert(tp_x + tp.x / 2 + clear <= pocket_x, "the TP4056 doesn't fit against the right wall");
assert(holder_x0 - clear - 1.5 > -pocket_x + lip_w + glue_gap, "the holder's stop runs into the ledge");
assert(holder_z0 + holder_h < z_in - block[1], "the holder runs into the screw blocks");
assert(sma_z + 4.6 < z_in - block[1], "the SMA's nut runs into the screw block");
assert(tp_x - usb.x / 2 > sma_x + pad_d / 2, "the USB-C slot runs into a screw pad");

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

// The TP4056 slides up between two rails: a stop at each long edge, and a
// lip over the edge's middle third, clear of the pads at either end.
module tp_rails() {
    for (s = [-1, 1]) {
        edge = tp_x + s * (tp.x + clear) / 2;
        x0 = s < 0 ? edge - 1.5 : edge;
        translate([x0, bottom_y, tp_face_z - 1.2]) cube([1.5, bay_h, z_in - tp_face_z + 1.2 + eps]);
        translate([s < 0 ? edge - 1.5 : edge - 1, tp_y0 + tp.y / 3, tp_face_z - 1.2]) cube([2.5, tp.y / 3, 1.2]);
    }
}

// Stops either end of the holder, standing off the back wall.
module holder_stops() {
    for (x = [holder_x0 - clear - 1.5, holder_x0 + holder_l + clear])
        translate([x, bottom_y, holder_z0 + holder_h - 6]) cube([1.5, bay_h, z_in - (holder_z0 + holder_h - 6) + eps]);
}

module screw_blocks() {
    for (x = screw_xs) translate([x - block.x / 2, bottom_y, z_in - block[1]]) cube([block.x, bay_h, block[1] + eps]);
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
            holder_stops();
            screw_blocks();
            for (x = xiao_anchor_xs) tie_anchor([x, xiao_c.y]);
            loop();
        }
        // The bay is open at the bottom: no bottom wall.
        translate([-outer.x, bottom_y - 50, front_z - 1]) cube([2 * outer.x, 50, z_out - front_z + 2]);
        for (x = screw_xs) translate([x, bottom_y - 1, screw_z]) rotate([-90, 0, 0]) cylinder(d = pilot_d, h = pilot_depth + 1);
        translate([sma_x, partition_y - 1, sma_z]) rotate([-90, 0, 0]) cylinder(d = sma_hole, h = partition_t + 2);
        for (h = wire_holes) translate([h.x, partition_y - 1, h.y]) rotate([-90, 0, 0]) cylinder(d = wire_hole, h = partition_t + 2);
    }
}

module cover() {
    translate([0, bottom_y, 0]) difference() {
        union() {
            translate([-outer.x / 2, -cover_t, front_z]) cube([outer.x, cover_t, z_out - front_z]);
            for (x = screw_xs) translate([x, 0, screw_z]) rotate([90, 0, 0]) cylinder(d = pad_d, h = cover_t + cb_depth);
        }
        for (x = screw_xs) translate([x, 0, screw_z]) rotate([90, 0, 0]) {
            translate([0, 0, -1]) cylinder(d = screw_hole, h = cover_t + cb_depth + 2);
            translate([0, 0, cover_t]) cylinder(d = cb_d, h = cb_depth + 1);
        }
        translate([sma_x, 1, sma_z]) rotate([90, 0, 0]) cylinder(d = antenna_hole, h = cover_t + 2);
        translate([tp_x - usb.x / 2 - 0.5, -cover_t - 1, tp_face_z + clear - usb.y - 0.5]) cube([usb.x + 1, cover_t + 2, usb.y + 1]);
    }
}

// --- reference hardware, for the previews ---

module ref_panel_face() slab(-panel_t, -panel_t + 0.3) offset(delta = -3) panel_2d();
module ref_panel() slab(-panel_t, 0) panel_2d();

// The holder lies with its floor to the panel, its open side to the back.
module ref_holder() translate([holder_x0, bottom_y + (bay_h - holder_w) / 2, holder_z0]) difference() {
    cube([holder_l, holder_w, holder_h]);
    translate([2, 1, 1]) cube([holder_l - 4, holder_w - 2, holder_h]);
}
module ref_cell() translate([holder_x0 + holder_l / 2, bottom_y + bay_h / 2, holder_z0 + 1 + 9.25]) rotate([0, 90, 0]) cylinder(d = 18.5, h = 65, center = true);

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

// The cover on its inside face.
module cover_print() translate([0, 0, bottom_y]) rotate([-90, 0, 0]) cover();

module plate() {
    translate([0, -(outer.y / 2 + bottom_y), 0]) {
        translate([-outer.x / 2 - 3, 0, 0]) frame_print();
        translate([30, 0, 0]) rotate(90) cover_print();
    }
}
