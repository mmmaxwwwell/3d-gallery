// MOLLE 18650 holder: a row of 18650 cells standing upright in one piece
// with a MOLLE stick weave on its back. It mounts to PALS webbing with
// BigFootPL's Molle sticks (library/molle-stick), like a MOLLE pouch.
//
// Frame: +X across, +Y up, +Z away from the pack. Z = 0 is the back that
// lies on the pack; Y = 0 is the plate's bottom edge.
//
// The back, from the pack outwards: a block in every PALS gap the plate
// covers, a stick slot running up through each block, room for the band
// lifted over the stick, then the plate the cells stand on. Over the bands
// only the plate exists, so the bands and their bar tacks cross freely, and
// each stick weaves block, band, block, band the whole way up. The stick's
// tip rests on a floor in the bottom block; its hook snaps over the top
// block's back wall.
//
// The cells drop in from the top and stand on a floor. The pockets sit flush
// with the plate's top; a bevel down the front of the top opens each pocket's
// front, so a cell's top is there to grip. Below the cells the front tapers
// at 45 deg down to the plate. Two short crush ribs per pocket press the cell
// against the pocket's back, so it doesn't rattle or fall out.
//
// Print it front face down: the pockets' backs and the stick slots' back
// walls bridge, and both tapers rise from the bed at 45 deg.

include <BOSL2/std.scad>

// BEGIN_PARAMS
// How many cells stand side by side
cells = 4;

// Cell diameter: an 18650 is 18.5 nominal
cell_d = 18.5;

// Cell length: a flat-top 18650 is 65, a protected or button-top one up to 69
cell_len = 65.5;

// Clearance round each cell, per side
cell_clear = 0.3;

// How far past the cell each crush rib reaches
rib_squeeze = 0.15;

// MOLLE stick length in inches: 4 spans two PALS bands, 6 three. The 3", 5"
// and 7" end in the middle of a band, so they don't fit
stick_inches = 4;

// Plate behind the cells, in front of the webbing
plate_t = 2;

// Front wall in front of the cells
front_wall = 2;

// Outer side walls
side_wall = 2.4;

// Between neighbouring cells
divider = 1.6;

// Floor under each cell
floor_t = 2;

// How far down the front the top bevel opens each pocket
grip = 12;

// Drain and push-out hole under each cell, out through the bottom taper
drain_d = 5;
// END_PARAMS

// ----- PALS (A-A-55301 Type III webbing, Natick's PALS layout) -----
pals_band_w    = 25.4;   // 1" band
pals_band_gap  = 25.4;   // 1" of backing between bands
pals_row_pitch = pals_band_w + pals_band_gap;
pals_col       = 38.1;   // bar tacks every 1.5" across a band
pals_col_min   = 35;     // 35-40 mm accepted
pals_webbing_t = 1.35;   // .053" max

// ----- BigFootPL's Molle stick (measured off library/molle-stick) -----
stick_w         = 25;    // blade width
stick_t         = 3;     // blade thickness
stick_hook_drop = 20.3;  // hook pocket's top down to the bottom of its outer leaf
// Tip to the top of the hook's pocket; each size is 25 mm longer, not 25.4.
function stick_len(inches) = 103 + 25 * (inches - 4);

// ----- The weave -----
back_wall  = 1.6;   // behind the stick; the hook's pinch clamps it
slot_gap   = 0.5;   // stick clearance through its thickness
slot_side  = 0.6;   // stick clearance across its width
webbing_room = 2.5; // a lifted band's room between stick and plate
band_clear = 1;     // each side of a band window
hook_clear = 0.5;   // plate top below the hook pocket's top
min_tip    = 2;     // stick the bottom block must hold
min_side   = 2.4;   // plate outside the outer slots
ease       = 1;     // chamfer where the stick enters and leaves a block
rib_w      = 1.6;   // crush rib's width round the pocket
rib_len    = 20;    // crush ribs run this far up from just above the floor
rib_angle  = 70;    // crush ribs' angle either side of the pocket's front
eps        = 0.01;

// ----- Derived -----
L        = stick_len(stick_inches);
slot_w   = stick_w + 2 * slot_side;
slot_z0  = back_wall;
slot_z1  = slot_z0 + stick_t + slot_gap;
front_z  = slot_z1 + webbing_room;   // plate's back
plate_z  = front_z + plate_t;        // plate's front: the pockets' backs
pocket_r = cell_d / 2 + cell_clear;
cell_z   = plate_z + pocket_r;       // pocket axis
body_z   = cell_z + pocket_r + front_wall;  // the front face
pitch    = 2 * pocket_r + divider;
plate_w  = cells * 2 * pocket_r + (cells - 1) * divider + 2 * side_wall;

// The plate holds the whole stick: floor_t under its tip, the hook's pocket
// at the top, and the bands that fit between.
plate_h  = floor_t + L - hook_clear;
tip_y    = floor_t;
bands    = floor((plate_h - tip_y - min_tip - 2 * band_clear + pals_band_gap) / pals_row_pitch);
win_h    = bands * pals_row_pitch - pals_band_gap + 2 * band_clear;
end_h    = (plate_h - win_h) / 2;   // equal end blocks centre the bands
// [y0, y1] of each band window, bottom up.
windows  = [for (k = [0 : bands - 1])
               let (y0 = end_h + k * pals_row_pitch) [y0, y0 + pals_band_w + 2 * band_clear]];

n_sticks = floor((plate_w - slot_w - 2 * min_side) / pals_col) + 1;
stick_xs = [for (i = [0 : n_sticks - 1]) (i - (n_sticks - 1) / 2) * pals_col];
cell_xs  = [for (i = [0 : cells - 1]) (i - (cells - 1) / 2) * pitch];

body_h   = floor_t + cell_len + 2 * cell_clear;
body_y0  = plate_h - body_h;        // underside of the floor
pocket_y0 = body_y0 + floor_t;
taper    = body_z - plate_z;        // the bottom taper's run at 45 deg

assert(stick_w < pals_col_min, "stick won't pass between the bar tacks");
assert(bands >= 1, "stick too short to span a band");
assert(end_h <= pals_band_gap - 2 * band_clear, "end blocks won't fit a PALS gap; the stick ends inside a band");
assert(end_h - tip_y >= min_tip, "bottom block holds too little stick");
assert(n_sticks >= 1, "plate too narrow for a stick");
assert(body_y0 >= 0, "the cells are taller than the plate: take a longer stick");
assert(grip < cell_len / 2, "the top bevel opens more than half the pocket");
assert(rib_squeeze < cell_clear + 1, "crush ribs reach too far into the cell");

// Side view (Y, Z): the plate, the cell body flush with its top, the 45 deg
// bottom taper, and the top bevel.
function side_profile() = [
    [0, 0],
    [plate_h, 0],
    [plate_h, body_z - grip],
    [plate_h - grip, body_z],
    [body_y0, body_z],
    [max(0, body_y0 - taper), body_y0 >= taper ? plate_z : plate_z + taper - body_y0],
    [0, body_y0 >= taper ? plate_z : plate_z + taper - body_y0],
];

module outer() {
    // Front side edges chamfered (they meet the bed), back ones rounded.
    intersection() {
        rotate([90, 0, 90]) translate([0, 0, -plate_w / 2 - 1])
            linear_extrude(plate_w + 2) polygon(side_profile());
        rotate([-90, 0, 0]) translate([0, 0, -1])
            linear_extrude(plate_h + 2) mirror([0, 1, 0])
                cross_section();
    }
}

// (X, Z) with Z drawn as 2D y.
module cross_section() {
    c = 1.5;
    r = 2;
    hull() {
        translate([-plate_w / 2 + r, r]) circle(r = r, $fn = 24);
        translate([plate_w / 2 - r, r]) circle(r = r, $fn = 24);
        translate([-plate_w / 2, body_z - c]) square([plate_w, eps]);
        translate([-plate_w / 2 + c, body_z - eps]) square([plate_w - 2 * c, eps]);
    }
}

// One pocket's cross-section, (X, Z) as 2D (x, y): the circle with its back
// drawn out at 45 deg to a flat on the plate, so the back bridges in print.
module pocket_section() {
    k = pocket_r * sqrt(2) / 2;
    intersection() {
        hull() {
            translate([0, cell_z]) circle(r = pocket_r, $fn = 64);
            translate([-k, cell_z - k]) square([2 * k, eps]);
            translate([-(k - (pocket_r - k)), plate_z]) square([2 * (k - (pocket_r - k)), eps]);
        }
        translate([-pocket_r - 1, plate_z]) square([2 * pocket_r + 2, body_z]);
    }
}

module crush_rib(s) {
    reach = pocket_r - (cell_d / 2 - rib_squeeze);
    translate([0, pocket_y0 + 2, cell_z]) rotate([0, s * rib_angle, 0])
        translate([0, 0, pocket_r - reach]) rotate([-90, 0, 0])
            linear_extrude(rib_len) hull() {
                translate([-rib_w / 2, -reach - 1]) square([rib_w, eps]);
                translate([0, 0]) circle(d = min(rib_w, 2 * reach), $fn = 12);
            }
}

module pocket_cut(x) {
    translate([x, 0, 0]) {
        difference() {
            translate([0, pocket_y0, 0]) rotate([-90, 0, 0])
                linear_extrude(plate_h) mirror([0, 1, 0]) pocket_section();
            for (s = [-1, 1]) crush_rib(s);
        }
        // Lead-in where the cell goes in.
        translate([0, plate_h + eps, cell_z]) rotate([90, 0, 0])
            cylinder(r1 = pocket_r + 1, r2 = pocket_r, h = 1, $fn = 64);
        translate([0, body_y0 - taper - 1, cell_z]) rotate([-90, 0, 0])
            cylinder(d = drain_d, h = floor_t + taper + 2, $fn = 24);
    }
}

module stick_slot(x) {
    translate([x, 0, 0]) {
        translate([-slot_w / 2, tip_y, slot_z0]) cube([slot_w, plate_h, slot_z1 - slot_z0]);
        for (w = windows, y = w)
            translate([0, y, (slot_z0 + slot_z1) / 2])
                cuboid([slot_w + 2 * ease, 2 * ease, slot_z1 - slot_z0 + 2 * ease],
                       chamfer = ease, edges = [FRONT, BACK]);
    }
}

module holder() {
    difference() {
        outer();
        for (w = windows)
            translate([-plate_w / 2 - 1, w[0], -1]) cube([plate_w + 2, w[1] - w[0], front_z + 1]);
        for (x = stick_xs) stick_slot(x);
        for (x = cell_xs) pocket_cut(x);
    }
}

// ----- Reference geometry for previews -----

module ref_cells() {
    for (x = cell_xs)
        translate([x, pocket_y0, plate_z + cell_d / 2]) rotate([-90, 0, 0])
            cylinder(d = cell_d, h = cell_len, $fn = 48);
}

// The stick: a blade from the tip to the hook, the hook over the top
// block's back wall, and its outer leaf down behind the plate.
module ref_sticks() {
    for (x = stick_xs) translate([x, 0, 0]) {
        translate([-stick_w / 2, tip_y, slot_z0 + slot_gap / 2])
            cube([stick_w, plate_h - tip_y + hook_clear, stick_t]);
        translate([-stick_w / 2, plate_h + hook_clear, -stick_t])
            cube([stick_w, stick_t, slot_z1 + stick_t]);
        translate([-stick_w / 2, plate_h + hook_clear + stick_t - stick_hook_drop, -stick_t])
            cube([stick_w, stick_hook_drop - stick_t, stick_t]);
    }
}

// PALS bands through the windows, lifted over the sticks.
module ref_bands() {
    for (w = windows)
        translate([-plate_w / 2 - 20, w[0] + band_clear, slot_z1 + 0.2])
            cube([plate_w + 40, pals_band_w, pals_webbing_t]);
}

// Front face down on the bed.
module print_pose() {
    translate([0, 0, body_z]) rotate([180, 0, 0]) translate([0, -plate_h / 2, 0]) children();
}
