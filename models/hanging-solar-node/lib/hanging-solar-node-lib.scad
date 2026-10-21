// Hanging solar node: a small solar panel with a light shroud bonded over its
// back, hung from a tree through the panel's own hole at the top. Inside, a
// card carries a XIAO nRF52840 + Wio-SX1262, an 18650 in its holder, a TP4056
// charger and the blocking diode on the panel's tabs. The antenna screws onto
// an SMA bulkhead in the bottom wall and hangs down.
//
// Frame: +X across the panel, +Y up as it hangs, +Z out of the panel's back
// toward the shroud's back. Z = 0 is the panel's back face; the panel's face
// is at Z = -panel_t. The origin is the panel's centre.
//
// The shroud is a cup over the panel's back. Its walls run forward round the
// panel's edge to its face, with a gap for adhesive, and a lip just inside
// them is the face the panel's back sits on: a bead on the lip and up the
// gap seals the panel in. A tube round the panel's hole runs through to the
// shroud's back and seats on the panel round the hole too, so the hanging
// cord goes through panel and shroud and holds them both.
//
// The card rests on the panel's back, inside the lip. Posts rise from it to
// cups on the shroud's back, and an M3 cap screw through each cup, from
// outside, pulls the card up against them: the card is held at the top and
// the bottom by the shroud alone. A window over the panel's tabs leaves room
// for the solder joints, the diode and the glue on them. Each board is
// zip-tied through a slot pair, the tie running in a groove under the card so
// the card still sits flat.
//
// Prints: the shroud on its back (the lip's underside is a 45 deg chamfer),
// the card on its underside with the posts up.

// BEGIN_PARAMS
// Panel width (measured)
panel_w = 122;

// Panel height
panel_h = 160;

// Panel corner radius
panel_r = 10;

// Panel thickness (measured)
panel_t = 1.7;

// The panel's hanging hole, read off a photo: diameter
hang_d = 5.8;

// The hanging hole's centre, down from the panel's top edge
hang_from_top = 6.5;

// The panel's two solder tabs, read off a photo: centre, down from the top edge
tabs_from_top = 119;

// Adhesive gap between the panel's edge and the shroud's wall, per side
glue_gap = 0.5;

// Shroud wall: 3 perimeters of a 0.4 nozzle
wall = 1.2;

// Shroud back
back_t = 1.0;

// How far the lip the panel sits on reaches in from the panel's edge
lip_w = 1.5;

// The lip's thickness at its inner edge
lip_t = 1.2;

// Card thickness
card_t = 2;

// The card's gap inside the lip, per side
card_clear = 1;

// Tallest thing on the card (the 18650 holder with its cell in)
stack_h = 21;

// Room between the tallest thing and the shroud's back
top_clear = 1;

// SMA bulkhead hole and where it sits along the bottom wall
sma_hole = 6.6;
sma_x = -48;
sma_z = 13;

// Breather/drain in the bottom wall, against condensation; 0 for none
vent_d = 2;
vent_x = 20;
// END_PARAMS

// 18650 holder, length x width
holder = [78, 21];
holder_c = [0, -65];

// TP4056 USB-C module, lying along X
tp = [28, 17.5, 5];
tp_c = [36, -41.25];

// XIAO nRF52840 on a Wio-SX1262, standing on its pins
xiao = [17.8, 21, 18];
xiao_c = [-35.1, -37.5];

// Window over the panel's tabs and the glue on them
window = [36, 26];

// Top edge of the card's main block; a stem carries it up to the top post
card_top = -24;

// Card posts: one at the bottom right, one at the left, one at the top
posts = [[48, -68], [-50, -50], [0, -18]];
post_d = 7;
pilot_d = 2.5;
pilot_depth = 9;

// The screw cups on the shroud's back
cup_d = 9;
cb_d = 6.2;
cb_depth = 3.2;
cb_floor = 1.2;
screw_hole = 3.4;
post_gap = 0.2;

// Zip ties: slot pairs, each tie running from one slot to the other under
// the card
tie_w = 4.4;
tie_t = 1.8;
groove_w = 5;
groove_d = 1.2;
ties = [
    [[-41, holder_c.y], [41, holder_c.y]],                  // round the holder's length, over the cell
    [[tp_c.x, tp_c.y - 10.75], [tp_c.x, tp_c.y + 10.75]],   // across the TP4056
    [[-46, xiao_c.y], [-24.2, xiao_c.y]],                   // across the XIAO
];

eps = 0.01;

hang_y = panel_h / 2 - hang_from_top;
tabs_y = panel_h / 2 - tabs_from_top;
z_in = card_t + stack_h + top_clear;
z_out = z_in + back_t;
post_top = z_out - cb_depth - cb_floor - post_gap;
tube_d = hang_d + 2 * wall;
depth = z_out + panel_t;
outer = [panel_w + 2 * (glue_gap + wall), panel_h + 2 * (glue_gap + wall)];

assert(hang_y + tube_d / 2 <= panel_h / 2 + glue_gap, "the hanging tube pokes through the top wall");
assert(lip_t + lip_w + glue_gap < card_t + stack_h, "the lip's chamfer runs into the components");
assert(post_top - card_t > pilot_depth, "the posts are too short for their pilot holes");
assert(abs(tabs_y - (card_top - window[1] / 2 - 2)) < window[1] / 2, "the window misses the panel's tabs");

module rrect(size, r) {
    offset(r = r) square([size.x - 2 * r, size.y - 2 * r], center = true);
}

module panel_2d() rrect([panel_w, panel_h], panel_r);
module pocket_2d() offset(r = glue_gap) panel_2d();
module outer_2d() offset(r = glue_gap + wall) panel_2d();
module opening_2d() offset(delta = -lip_w) panel_2d();

module slab(z0, z1) translate([0, 0, z0]) linear_extrude(z1 - z0) children();

module lip() {
    chamf = lip_w + glue_gap;
    difference() {
        slab(0, lip_t + chamf) pocket_2d();
        slab(-1, lip_t + eps) opening_2d();
        hull() {
            slab(lip_t, lip_t + eps) opening_2d();
            slab(lip_t + chamf, lip_t + chamf + eps) offset(r = chamf) opening_2d();
        }
    }
}

module shroud() {
    difference() {
        union() {
            difference() {
                slab(-panel_t, z_out) outer_2d();
                slab(-panel_t - 1, z_in) pocket_2d();
            }
            lip();
            translate([0, hang_y, 0]) cylinder(d = tube_d, h = z_in + eps);
            translate([-tube_d / 2, hang_y, 0]) cube([tube_d, panel_h / 2 + glue_gap - hang_y + eps, z_in + eps]);
            for (p = posts) translate([p.x, p.y, z_out - cb_depth - cb_floor]) cylinder(d = cup_d, h = cb_depth + cb_floor);
        }
        translate([0, hang_y, -1]) cylinder(d = hang_d + 0.2, h = z_out + 2);
        for (p = posts) translate([p.x, p.y, 0]) {
            translate([0, 0, z_out - cb_depth]) cylinder(d = cb_d, h = cb_depth + 1);
            translate([0, 0, post_top - 1]) cylinder(d = screw_hole, h = z_out);
        }
        translate([sma_x, -panel_h / 2, sma_z]) rotate([90, 0, 0]) cylinder(d = sma_hole, h = 2 * (glue_gap + wall) + 2, center = true);
        if (vent_d > 0)
            translate([vent_x, -panel_h / 2, sma_z]) rotate([90, 0, 0]) cylinder(d = vent_d, h = 2 * (glue_gap + wall) + 2, center = true, $fn = 16);
    }
}

module card_2d() {
    difference() {
        union() {
            intersection() {
                offset(delta = -card_clear) opening_2d();
                translate([-panel_w, -panel_h]) square([2 * panel_w, panel_h + card_top]);
            }
            hull() {
                translate([-post_d, card_top - 1]) square([2 * post_d, 1]);
                translate(posts[2]) circle(d = post_d + 5);
            }
        }
        translate([0, card_top - 2 - window[1] / 2]) rrect(window, 3);
    }
}

module tie_slot(p, along_x) {
    translate([p.x, p.y, -1]) linear_extrude(card_t + 2)
        square(along_x ? [tie_t, tie_w] : [tie_w, tie_t], center = true);
}

module card() {
    difference() {
        union() {
            linear_extrude(card_t) card_2d();
            for (p = posts) translate([p.x, p.y, 0]) cylinder(d = post_d, h = post_top);
        }
        for (p = posts) translate([p.x, p.y, post_top - pilot_depth]) cylinder(d = pilot_d, h = pilot_depth + 1);
        for (t = ties) {
            along_x = abs(t[1].x - t[0].x) > abs(t[1].y - t[0].y);
            tie_slot(t[0], along_x);
            tie_slot(t[1], along_x);
            hull() for (p = t) translate([p.x, p.y, groove_d / 2 - 1])
                cube([groove_w, groove_w, groove_d + 2], center = true);
        }
    }
}

// --- reference hardware, for the previews ---

module ref_panel_face() slab(-panel_t, -panel_t + 0.3) offset(delta = -3) panel_2d();
module ref_panel() difference() {
    slab(-panel_t, 0) panel_2d();
    translate([0, hang_y, -panel_t - 1]) cylinder(d = hang_d, h = panel_t + 2);
}

module ref_holder() translate([holder_c.x, holder_c.y, card_t]) difference() {
    translate([0, 0, stack_h / 2]) cube([holder.x, holder.y, stack_h], center = true);
    translate([0, 0, stack_h / 2 + 2]) cube([holder.x - 4, holder.y - 2, stack_h], center = true);
}
module ref_cell() translate([holder_c.x, holder_c.y, card_t + 1.5 + 9.25]) rotate([0, 90, 0]) cylinder(d = 18.5, h = 65, center = true);

module ref_tp4056() translate([tp_c.x, tp_c.y, card_t]) {
    translate([0, 0, 0.8]) cube([tp.x, tp.y, 1.6], center = true);
    translate([tp.x / 2 - 3.5, 0, 1.6 + 1.6]) cube([7.5, 9, 3.2], center = true);
}

module ref_xiao() translate([xiao_c.x, xiao_c.y, card_t]) translate([0, 0, xiao.z / 2]) cube(xiao, center = true);

module ref_sma() translate([sma_x, -panel_h / 2 - glue_gap - wall, sma_z]) rotate([90, 0, 0]) {
    translate([0, 0, -wall - glue_gap - 12]) cylinder(d = 6.35, h = 12 + wall + glue_gap + 6);
    translate([0, 0, -wall - glue_gap - 2]) cylinder(d = 9.2, h = 2, $fn = 6);
    cylinder(d = 9.2, h = 2, $fn = 6);
}
module ref_antenna() translate([sma_x, -panel_h / 2 - glue_gap - wall - 6, sma_z]) rotate([90, 0, 0]) {
    cylinder(d = 10, h = 30);
    cylinder(d = 8, h = 180);
}

module ref_diode() translate([0, tabs_y, card_t / 2]) rotate([0, 90, 0]) cylinder(d = 2.7, h = 5.2, center = true);

// Hanging, Y up.
module in_use() rotate([90, 0, 0]) children();

// The shroud on its back.
module shroud_print() translate([0, 0, z_out]) mirror([0, 0, 1]) shroud();

module plate() {
    translate([-outer.x / 2 - 3, 0, 0]) shroud_print();
    translate([60, 0, 0]) rotate(90) translate([0, 47, 0]) card();
}
