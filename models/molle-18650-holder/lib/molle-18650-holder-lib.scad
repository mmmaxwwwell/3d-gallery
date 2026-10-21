// MOLLE 18650 holder: a row of 18650 cells standing upright, each in a thin
// tube of its own, the tubes fused side by side onto a MOLLE stick weave. It
// mounts to PALS webbing with BigFootPL's Molle sticks (library/molle-stick),
// like a MOLLE pouch.
//
// Frame: +X across, +Y up, +Z away from the pack. Z = 0 is the back that
// lies on the pack; Y = 0 is the bottom, which is also the print bed.
//
// The back, from the pack outwards: a block in every PALS gap the plate
// covers, a stick slot up through each block, room for the band lifted over
// the stick, then the tubes. Over the bands only the tubes' backs exist, so
// the bands and their bar tacks cross freely and each stick weaves block,
// band, block. The slots run out through the bottom, so any length of stick
// fits, a longer one poking out below. The hook springs over the top block's
// back wall, and the bulge on the hook's outer leaf clicks into a groove
// across the wall's back. Nothing stands above the plate but the stick's own
// head. A web fills the grooves between the tubes' backs, so the tubes and
// blocks are one body with a flat back over the bands.
//
// Each tube ends below in a 45 deg cone; the cell seats on the cone's
// inside, and the cone's tip is left open as a drain. The cones, the bottom
// block and the space between them are hulled into one solid bottom, its
// top sloping up into the grooves between the tubes so nothing catches.
// A slit runs down the middle of each tube's front, to slide the cell out
// with a finger. Either side of it the wall is a spring clip, freed by a
// notch where the tubes meet, with a lip over the cell's top edge: ramped on top so the
// cell snaps in past it, and 45 deg underneath so a firm push up the slit
// springs it out again. Two short crush ribs per tube press the cell back.
// Every outside edge is rounded: the tubes' rims are half-round and their
// cones run into them on a fillet, and the blocks are swept with a ball.
//
// Print it standing on its bottom: the tubes and slots run straight up, the
// cones grow at 45 deg, and each block's underside over a band is 45 deg.

include <BOSL2/std.scad>
include <molle-stick-profile.scad>

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

// The MOLLE stick the holder is sized for, in inches: 3 spans one PALS band,
// 4 and 5 two, 6 and 7 three. A longer stick fits too, poking out below
stick_inches = 3;

// Tube wall, shared between neighbouring cells: 4 perimeters of a 0.4 nozzle
wall = 1.6;

// Slit down each tube's front, to slide the cell out with a finger
finger_w = 10;

// Spring clips either side of the finger slit: how long they are
clip_len = 18;

// How far each clip's lip reaches over the cell's top edge
lip_reach = 1;

// Drain hole at the tip of each tube's cone
drain_d = 3;
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
// The traced 3" outline (molle-stick-profile.scad), its blade stretched to
// this size below the hook.
function stick_outline(inches) =
    [for (p = molle_stick_outline) p[1] < -22 ? [p[0], p[1] - 25 * (inches - 3)] : p];
// The head, in the outline's frame: from the blade's front face back to the
// leaf's, and up from the hook's pocket top; the lanyard hole's centre.
// How far the hook's outer leaf bulges in towards the blade (its pinch),
// in the outline's frame: u = 0 is the blade's back.
stick_pinch_u = max([for (p = molle_stick_outline) if (p[1] < -5 && p[0] < -0.05) p[0]]);

// ----- The weave -----
back_wall    = 1.6;  // behind the stick; the hook's pinch clamps it
slot_gap     = 0.3;  // stick clearance through its thickness
slot_side    = 0.4;  // stick clearance across its width
webbing_room = 1.8;  // a lifted band's room between stick and tubes
band_clear   = 0.5;  // each side of a band window
hook_clear   = 0.5;  // plate top below the hook pocket's top
stick_floor  = 2;    // the sized stick's tip stops this far above the bottom
min_tip      = 2;    // stick the bottom block must hold
block_side   = 2.4;  // block outside the outer slots
block_r      = 1.5;  // blocks' rounded edges
fillet_r     = 3;    // where a tube's cone meets its side, outside
// The bottom block's back edge is chamfered this far, so where a stick runs
// the plate a little past its PALS gap, the edge rides over the next band.
// The top end needs none: the stick's hook leaf lies behind it.
end_relief   = 3;
ease         = 1;    // chamfer where the stick enters a block from below
rib_w        = 1.6;  // crush rib's width round the pocket
rib_len      = 20;   // crush ribs run this far up from the cell's bottom
rib_angle    = 70;   // crush ribs' angle either side of the tube's front
clip_w       = 3.5;  // each clip's width beside the finger slit
lip_tip      = 0.6;  // the lip's flat inner face, top to bottom
finger_chamfer = 1;  // the finger slit's outer edges
finger_floor = 3;    // the finger slit stops this far above the cell's bottom
// The groove the hook's leaf clicks into: how deep (the back wall is only
// back_wall thick), and its clearance round the leaf.
leaf_groove  = 0.8;
leaf_clear   = 0.15;
eps          = 0.01;

// ----- Derived -----
L        = stick_len(stick_inches);
slot_w   = stick_w + 2 * slot_side;
slot_z0  = back_wall;
slot_z1  = slot_z0 + stick_t + slot_gap;
front_z  = slot_z1 + webbing_room;   // the tubes' backs
pocket_r = cell_d / 2 + cell_clear;
tube_r   = pocket_r + wall;
cell_z   = front_z + tube_r;          // tube axis
body_z   = cell_z + tube_r;           // the front
pitch    = 2 * pocket_r + wall;
cell_xs  = [for (i = [0 : cells - 1]) (i - (cells - 1) / 2) * pitch];
body_w   = (cells - 1) * pitch + 2 * tube_r;

// A tube's cone: on the bed it is a ring round the drain, and it reaches the
// tube's full width at cone_h. The pocket's cone is the same cone moved up
// by the wall's thickness at 45 deg. Both run into the side on arcs about
// one centre, fillet_r outside and fillet_r - wall inside.
foot_r   = drain_d / 2 + wall * sqrt(2);
cone_h   = tube_r - foot_r;
fillet_c = [tube_r - fillet_r, cone_h + fillet_r * (sqrt(2) - 1)];
inner_r  = fillet_r - wall;
// Where the cell's bottom edge sits: on the inner cone, or on its fillet.
seat_y   = cell_d / 2 <= fillet_c[0] + inner_r * sqrt(2) / 2
           ? cell_d / 2 - drain_d / 2
           : fillet_c[1] - sqrt(pow(inner_r, 2) - pow(cell_d / 2 - fillet_c[0], 2));
// The cell's top, and the lip over it: its 45 deg underside passes through
// the cell's top edge, a flat inner face, a 45 deg ramp up to the rim.
cell_top = seat_y + cell_len + cell_clear;
lip_r    = cell_d / 2 - lip_reach;
lip_y1   = cell_top + lip_reach + lip_tip;   // top of the lip's inner face
tube_top = lip_y1 + (pocket_r - lip_r) + wall / 2;
clip_x   = [finger_w / 2, finger_w / 2 + clip_w];  // a clip's span from the tube's axis

// The plate is sized to the stick: stick_floor under its tip, the hook's
// pocket at the top, and the bands that fit between.
plate_h  = stick_floor + L - hook_clear;
tip_y    = stick_floor;
bands    = floor((plate_h - tip_y - min_tip - 2 * band_clear + pals_band_gap) / pals_row_pitch);
win_h    = bands * pals_row_pitch - pals_band_gap + 2 * band_clear;
end_h    = (plate_h - win_h) / 2;   // equal end blocks centre the bands
// [y0, y1] of each band window, bottom up.
windows  = [for (k = [0 : bands - 1])
               let (y0 = end_h + k * pals_row_pitch) [y0, y0 + pals_band_w + 2 * band_clear]];
// [y0, y1] of each block, bottom up.
blocks   = [for (k = [0 : bands]) [k == 0 ? 0 : windows[k - 1][1], k == bands ? plate_h : windows[k][0]]];
// How far an end block runs past its PALS gap onto the next band.
end_over = end_h - pals_band_gap;

n_sticks = floor((body_w - slot_w - 2 * block_side) / pals_col) + 1;
stick_xs = [for (i = [0 : n_sticks - 1]) (i - (n_sticks - 1) / 2) * pals_col];
block_w  = (n_sticks - 1) * pals_col + slot_w + 2 * block_side;
// Blocks reach a little into the tubes so the two fuse.
block_z  = front_z + 1;
// The stick's frame in the holder's: its blade's back face, and the top of
// its hook's pocket.
stick_z  = slot_z0 + slot_gap / 2;
stick_y  = plate_h + hook_clear;
pinch_z  = stick_z + stick_pinch_u;   // how far into the back wall the leaf presses

assert(stick_w < pals_col_min, "stick won't pass between the bar tacks");
assert(bands >= 1, "stick too short to span a band");
assert(end_over <= end_relief - pals_webbing_t, "the end blocks run too far past their PALS gaps");
assert(end_h - tip_y >= min_tip, "bottom block holds too little stick");
assert(n_sticks >= 1, "too few cells to carry a stick");
assert(tube_top <= plate_h + eps, "the cells are taller than the plate: take a longer stick");
assert(foot_r < tube_r, "the drain is wider than the tube");
assert(clip_x[1] < pocket_r - 0.5, "the clips are too wide to be freed from the tube");
assert(clip_len < cell_len / 2, "the clips are longer than half the tube");
assert(finger_w < cell_d - 4, "the finger slit is too wide to keep the cell in");
assert(inner_r > 0, "fillet_r must be more than the wall");
assert(back_wall - leaf_groove >= 0.8, "the leaf's groove leaves too little back wall");
assert(pinch_z > leaf_groove, "the leaf's groove is deeper than the leaf presses");
assert(rib_squeeze < cell_clear + 1, "crush ribs reach too far into the cell");
for (b = blocks) assert(b[1] - b[0] > block_z, "a block is too short for its 45 deg underside");

// A solid of revolution about a tube's axis, from a profile [[r, y], ...].
module about_axis(x, profile) {
    translate([x, 0, cell_z]) rotate([-90, 0, 0]) rotate_extrude($fn = 72) polygon(profile);
}

function arc(c, r, a0, a1, n = 8) = [for (i = [0 : n]) let (a = a0 + (a1 - a0) * i / n) c + r * [cos(a), sin(a)]];

// The tube's wall, (r, y): up the outside, over the half-round rim, down the
// inside to the drain.
function tube_profile() = concat(
    [[drain_d / 2, 0], [foot_r, 0]],
    arc(fillet_c, fillet_r, -45, 0),
    arc([pocket_r + wall / 2, tube_top - wall / 2], wall / 2, 0, 180, 12),
    arc(fillet_c, inner_r, 0, -45));

module tube(x) {
    about_axis(x, tube_profile());
}

// A tube filled solid, and a pocket: the space inside it.
module tube_solid(x) {
    about_axis(x, concat([[0, 0], [foot_r, 0]], arc(fillet_c, fillet_r, -45, 0),
                         arc([tube_r - wall / 2, tube_top - wall / 2], wall / 2, 0, 90, 6), [[0, tube_top]]));
}

module pocket(x) {
    about_axis(x, concat([[0, -1], [drain_d / 2, -1], [drain_d / 2, 0]], arc(fillet_c, inner_r, -45, 0),
                         [[pocket_r, tube_top + 1], [0, tube_top + 1]]));
}

// The tubes' cones, the bottom block and the space between, hulled: up to a
// plane that rises at 45 deg from where the tubes reach full width at the
// front, back into the grooves between them.
module bottom_fill() {
    y0 = fillet_c[1];
    difference() {
        intersection() {
            hull() {
                for (x = cell_xs) tube_solid(x);
                block(blocks[0], 0);
            }
            rotate([90, 0, 90]) translate([0, 0, -body_w])
                linear_extrude(2 * body_w)
                    polygon([[-1, -1], [-1, body_z + 1], [y0 - 1, body_z + 1], [y0 + body_z + 1, -1]]);
        }
        for (x = cell_xs) pocket(x);
    }
}

// The lip on top of a clip, as a ring cut to the clip's span.
module lips(x) {
    intersection() {
        about_axis(x, [[pocket_r + 0.5, cell_top - (pocket_r - cell_d / 2) - 0.5],
                       [lip_r, cell_top + lip_reach], [lip_r, lip_y1],
                       [pocket_r + 0.5, lip_y1 + pocket_r - lip_r + 0.5]]);
        for (s = [-1, 1])
            translate([x + s * (clip_x[0] + clip_x[1]) / 2, tube_top - clip_len / 2, cell_z + tube_r / 2])
                cube([clip_x[1] - clip_x[0], clip_len, tube_r], center = true);
    }
}

// A slot cut through the tube's front from y0 up out of the rim, its bottom
// end round, flared at the outside by chamfer.
module front_slit(x, w, y0, chamfer) {
    zo = cell_z + sqrt(pow(tube_r, 2) - pow(w / 2, 2));   // the wall's face at the slit's edge
    for (cz = [[cell_z, zo - chamfer, w], [zo, body_z + 1, w + 2 * chamfer]])
        hull() {
            translate([x, y0 + w / 2, cz[0]]) cylinder(d = cz[2], h = cz[1] - cz[0], $fn = 32);
            translate([x - cz[2] / 2, tube_top, cz[0]]) cube([cz[2], 2, cz[1] - cz[0]]);
        }
    if (chamfer > 0)
        hull() {
            translate([x, y0 + w / 2, zo - chamfer]) cylinder(d1 = w, d2 = w + 2 * chamfer, h = chamfer, $fn = 32);
            translate([x - w / 2 - chamfer, tube_top, zo]) cube([w + 2 * chamfer, 2, eps]);
            translate([x - w / 2, tube_top, zo - chamfer]) cube([w, 2, eps]);
        }
}

// The finger slits, and the notches that free the clips: one where each
// pair of tubes meets, taking the junction with it, and one outside each
// end tube.
module tube_slits() {
    for (x = cell_xs) front_slit(x, finger_w, seat_y + finger_floor, finger_chamfer);
    for (i = [0 : cells - 2])
        front_slit((cell_xs[i] + cell_xs[i + 1]) / 2, pitch - 2 * clip_x[1], tube_top - clip_len, 0);
    for (s = [-1, 1])
        front_slit(s * (body_w / 2 - (tube_r - clip_x[1]) / 2 + 0.5), tube_r - clip_x[1] + 1, tube_top - clip_len, 0);
}

// The grooves between the tubes' backs, filled back to the plate's face.
module web() {
    difference() {
        intersection() {
            hull() for (x = cell_xs) tube_solid(x);
            translate([-body_w, -1, front_z - 1]) cube([2 * body_w, tube_top + 2, cell_z - front_z + 1]);
        }
        for (x = cell_xs) pocket(x);
    }
}

// A rib on the pocket's wall, reaching in past the cell.
module crush_rib(x, s) {
    reach = pocket_r - (cell_d / 2 - rib_squeeze);
    translate([x, seat_y + 2, cell_z]) rotate([0, s * rib_angle, 0])
        translate([0, 0, pocket_r - reach]) rotate([-90, 0, 0])
            linear_extrude(rib_len) hull() {
                translate([-rib_w / 2, -reach - 1]) square([rib_w, eps]);
                circle(d = min(rib_w, 2 * reach), $fn = 12);
            }
}

// A block's side view (Y, Z): every block above a band slopes up at 45 deg
// underneath; the bottom one's back edge is chamfered by end_relief.
function block_profile(b, k) =
    k == 0 ? [[0, end_relief], [end_relief, 0], [b[1], 0], [b[1], block_z], [0, block_z]]
           : [[b[0], block_z], [b[0] + block_z, 0], [b[1], 0], [b[1], block_z]];

// A side view (Y, Z) extruded across X from x0 to x1, shrunk by r and swept
// with a ball of r: every edge rounded, the outline unchanged.
module rounded_extrusion(x0, x1, profile, r) {
    minkowski() {
        rotate([90, 0, 90]) translate([0, 0, x0 + r])
            linear_extrude(x1 - x0 - 2 * r) offset(delta = -r) polygon(profile);
        sphere(r = r, $fn = 12);
    }
}

// The stick as placed, from its traced outline grown by clear.
module stick_body(x, clear = 0) {
    o = stick_outline(stick_inches);
    translate([x, stick_y, stick_z]) rotate([90, 0, 90]) translate([0, 0, -stick_w / 2 - clear])
        linear_extrude(stick_w + 2 * clear)
            offset(delta = clear)
                polygon(points = [for (p = concat(o, molle_stick_hole)) [p[1], p[0]]],
                        paths = [[for (i = [0 : len(o) - 1]) i],
                                 [for (i = [0 : len(molle_stick_hole) - 1]) len(o) + i]]);
}

// The groove across the top block's back that the leaf's bulge clicks into:
// the leaf's own shape, set back so it cuts leaf_groove deep. The leaf still
// presses the rest of the way, so the stick stays tight.
module leaf_groove(x) {
    intersection() {
        translate([0, 0, -(pinch_z + leaf_clear - leaf_groove)]) stick_body(x, leaf_clear);
        translate([x - stick_w, blocks[len(blocks) - 1][0], -1])
            cube([2 * stick_w, plate_h, leaf_groove + 1]);
    }
}

module block(b, k) {
    rounded_extrusion(-block_w / 2, block_w / 2, block_profile(b, k), block_r);
}

module stick_slot(x) {
    translate([x, 0, 0]) {
        translate([-slot_w / 2, -1, slot_z0]) cube([slot_w, plate_h + 2, slot_z1 - slot_z0]);
        for (y = concat([for (w = windows) w[0]], [plate_h]))
            translate([0, y, (slot_z0 + slot_z1) / 2])
                cuboid([slot_w + 2 * ease, 2 * ease, slot_z1 - slot_z0 + 2 * ease],
                       chamfer = ease, edges = [FRONT, BACK]);
    }
}

module holder() {
    difference() {
        union() {
            for (x = cell_xs) tube(x);
            web();
            bottom_fill();
            for (x = cell_xs) lips(x);
            for (x = cell_xs, s = [-1, 1]) crush_rib(x, s);
            for (k = [0 : len(blocks) - 1]) block(blocks[k], k);
        }
        for (x = stick_xs) { stick_slot(x); leaf_groove(x); }
        tube_slits();
    }
}

// ----- Reference geometry for previews -----

module ref_cells() {
    for (x = cell_xs)
        translate([x, seat_y, cell_z]) rotate([-90, 0, 0])
            cylinder(d = cell_d, h = cell_len, $fn = 48);
}

// The stick as it sits woven in.
module ref_sticks() {
    for (x = stick_xs) stick_body(x);
}

// PALS bands through the windows, lifted over the sticks.
module ref_bands() {
    for (w = windows)
        translate([-body_w / 2 - 20, w[0] + band_clear, slot_z1 + 0.2])
            cube([body_w + 40, pals_band_w, pals_webbing_t]);
}

// As worn, for the viewer (Z up): the open tops up, the front towards -Y.
module in_use() {
    rotate([90, 0, 0]) children();
}

// Standing on its bottom.
module print_pose() {
    rotate([90, 0, 0]) translate([0, 0, -body_z / 2]) children();
}
