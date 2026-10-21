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
// Each tube is a plain cylinder standing on a flat floor, and the cell
// stands on the floor. A slot runs down the middle of each tube's front and
// on through the floor, past the cell's middle, to push the cell up and out
// with a finger; water runs out of it too.
// The cell is held by a lever in the back of its tube: a strip of the wall
// freed by a slit either side, with a bump at its top end over the cell's
// top edge, ramped on top so the cell snaps in past it and 45 deg underneath
// so a firm push from below springs it out again. Behind the lever, inside
// the solid between the tubes and the MOLLE back, a pocket lets it swing
// clear of the cell and stops it there. Lever and pocket stop under a ring
// of whole wall, so a cell thrown in hits the ring, not the bump; above the
// ring each tube's mouth flares on a round to guide the cell in. Two short
// crush ribs per tube press the cell back.
// The tubes, the solid between them and the MOLLE back, and the slots are
// one horizontal cross-section, rounded in 2D, so every slot edge up the
// tubes and through the floor is round; the bed edge is chamfered in layer
// steps. The rims are round, and the blocks are swept with a ball.
//
// Print it standing on its bottom: the tubes and slots run straight up, and
// each block's underside over a band is 45 deg.

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

// Slot down each tube's front and through the floor, to push the cell out
finger_w = 13;

// Retention lever in the back of each tube: how long it is
clip_len = 40;

// The lever's width, as an arc of the tube in degrees
clip_arc = 45;

// How far the lever's bump reaches over the cell's top edge
lip_reach = 1;

// Floor under each cell
cell_floor = 2;
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
slot_gap     = 0.5;  // stick clearance through its thickness
slot_side    = 0.6;  // stick clearance across its width
webbing_room = 1.8;  // a lifted band's room between stick and tubes
band_clear   = 0.5;  // each side of a band window
hook_clear   = 0.5;  // plate top below the hook pocket's top
stick_floor  = 2;    // the sized stick's tip stops this far above the bottom
min_tip      = 2;    // stick the bottom block must hold
block_side   = 2.4;  // block outside the outer slots
block_r      = 1.5;  // blocks' rounded edges
edge_r       = 0.6;  // the cross-section's rounded edges, and the bed chamfer
// The bottom block's back edge is chamfered this far, so where a stick runs
// the plate a little past its PALS gap, the edge rides over the next band.
// The top end needs none: the stick's hook leaf lies behind it.
end_relief   = 3;
ease         = 1;    // chamfer where the stick enters a block from below
rib_w        = 1.6;  // crush rib's width round the pocket
rib_len      = 20;   // crush ribs run this far up from the cell's bottom
rib_angle    = 70;   // crush ribs' angle either side of the tube's front
lip_tip      = 0.6;  // the bump's flat inner face, top to bottom
finger_under = 3;    // the finger slot runs this far past the cell's middle through the floor
clip_slit    = 0.8;  // the slits either side of the lever
clip_swing   = 0.5;  // the lever's pocket is this much deeper than the bump needs
clip_skin    = 0.8;  // between the lever's pocket and the band or stick behind it
ceiling_h    = 3;    // the ring of whole wall over the lever, mouth included
lead_r       = 2;    // the mouth's rounded flare
rim_r        = 0.5;  // the rim's outer round
// The mouth's flare is wider than the wall, so the tube's outside flares
// out at 45 deg to keep a rim.
collar       = lead_r + rim_r - wall;
ridge        = 0.4;  // each mouth's flare stops this far short of the line between two tubes
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
plate_z  = slot_z1 + webbing_room;   // the face the bands lie under
// The lever's pocket: as deep as the bump has to move, and some. The tubes
// stand off the plate by that, the space filled solid round the pocket.
clip_pocket = lip_reach + cell_clear + clip_swing;
front_z  = plate_z + clip_pocket + clip_skin;   // the tubes' backs
pocket_r = cell_d / 2 + cell_clear;
tube_r   = pocket_r + wall;
cell_z   = front_z + tube_r;          // tube axis
body_z   = cell_z + tube_r;           // the front
pitch    = 2 * pocket_r + wall;
cell_xs  = [for (i = [0 : cells - 1]) (i - (cells - 1) / 2) * pitch];
body_w   = (cells - 1) * pitch + 2 * tube_r;

seat_y   = cell_floor;   // the cell's bottom
// The cell's top, and the lip over it: its 45 deg underside passes through
// the cell's top edge, a flat inner face, a 45 deg ramp up to the rim.
cell_top = seat_y + cell_len + cell_clear;
lip_r    = cell_d / 2 - lip_reach;
lip_y1   = cell_top + lip_reach + lip_tip;   // top of the lip's inner face
lever_top = lip_y1 + (pocket_r - lip_r) + 0.3;   // the bump's top, and a little
tube_top = lever_top + clip_slit + ceiling_h;
collar_y = tube_top - rim_r - collar - 0.5;      // where the outside starts to flare

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
assert(cell_top <= plate_h + eps, "the cells are taller than the plate: take a longer stick");
assert(clip_len < cell_len - 10, "the lever is nearly as long as the tube");
assert(ceiling_h >= lead_r + 1, "the ring over the lever is all flare");
assert(collar >= 0, "the wall is thicker than the mouth's flare");
assert(clip_arc + 2 * clip_slit / tube_r * 180 / PI < 90, "the lever is wider than the tube's back");
assert(finger_w < cell_d - 4, "the finger slot is too wide to keep the cell in");
assert(wall > 2 * edge_r, "the wall is too thin for its rounded edges");
assert(cell_floor > 3 * 0.2, "the floor is thinner than its bed chamfer");
assert(back_wall - leaf_groove >= 0.8, "the leaf's groove leaves too little back wall");
assert(pinch_z > leaf_groove, "the leaf's groove is deeper than the leaf presses");
assert(rib_squeeze < cell_clear + 1, "crush ribs reach too far into the cell");
for (b = blocks) assert(b[1] - b[0] > block_z, "a block is too short for its 45 deg underside");

// A solid of revolution about a tube's axis, from a profile [[r, y], ...].
module about_axis(x, profile) {
    translate([x, 0, cell_z]) rotate([-90, 0, 0]) rotate_extrude($fn = 72) polygon(profile);
}

function arc(c, r, a0, a1, n = 8) = [for (i = [0 : n]) let (a = a0 + (a1 - a0) * i / n) c + r * [cos(a), sin(a)]];

// The mouth's rounded flare, from the top down into the pocket.
function mouth() = arc([pocket_r + lead_r, tube_top - lead_r], lead_r, 90, 180, 8);

// A tube's top band, (r, y): the outside flaring into the collar, over the
// rim and down the mouth's flare into the bore.
module tube_band(x) {
    about_axis(x, concat([[pocket_r, collar_y - 1], [tube_r, collar_y - 1], [tube_r, collar_y],
                          [tube_r + collar, collar_y + collar]],
                         arc([tube_r + collar - rim_r, tube_top - rim_r], rim_r, 0, 90, 4),
                         mouth()));
}

// A 2D cross-section (X, Z drawn as 2D y) stood up and run from y0 for h.
module extrude_y(y0, h) {
    translate([0, y0, 0]) rotate([-90, 0, 0]) linear_extrude(h) mirror([0, 1, 0]) children();
}

// Every corner rounded by r, inside and out.
module round_2d(r) {
    offset(r = -r) offset(delta = r) offset(r = r) offset(delta = -r) children();
}

// The cross-section's pieces. The tubes and the solid behind them: their
// hull, with the tubes' backs moved back to the plate's face, cut at the
// tubes' axes.
module tubes_2d() {
    for (x = cell_xs) translate([x, cell_z]) circle(r = tube_r, $fn = 96);
    intersection() {
        hull() for (x = cell_xs, dz = [0, front_z - plate_z]) translate([x, cell_z - dz]) circle(r = tube_r, $fn = 96);
        translate([-body_w, plate_z]) square([2 * body_w, cell_z - plate_z]);
    }
}

module pockets_2d() {
    for (x = cell_xs) translate([x, cell_z]) circle(r = pocket_r, $fn = 96);
}

// The finger slots, from depth z0 out through the front.
module slots_2d(z0) {
    for (x = cell_xs) translate([x - finger_w / 2, z0]) square([finger_w, body_z]);
}

// The walls: tubes, solid behind, the pockets and the front slots out.
module wall_2d() {
    round_2d(edge_r) difference() { tubes_2d(); pockets_2d(); slots_2d(cell_z); }
}

// The floor: all of it but the slots, which run on past the cells' middles.
module floor_2d() {
    round_2d(edge_r) difference() { tubes_2d(); slots_2d(cell_z - finger_under); }
}

// The tubes, floor and solid between, up to the collar: the floor stepped in
// at the bed in layers, a chamfer that prints.
module body() {
    steps = 3;
    for (i = [0 : steps - 1])
        extrude_y(i * edge_r / steps, edge_r / steps + eps)
            offset(delta = -(edge_r - i * edge_r / steps)) floor_2d();
    extrude_y(edge_r, cell_floor - edge_r + eps) floor_2d();
    extrude_y(cell_floor, collar_y - cell_floor + eps) wall_2d();
}

// Over the collar: each tube's band, the solid behind them to the top, and
// the slot on up through the rim.
module body_top() {
    difference() {
        union() {
            for (x = cell_xs) tube_band(x);
            extrude_y(collar_y - eps, tube_top - rim_r - collar_y)
                difference() { tubes_2d(); pockets_2d(); }
        }
        for (x = cell_xs) translate([x - finger_w / 2, collar_y - 1, cell_z]) cube([finger_w, tube_top, body_z]);
    }
}

// In a tube's own frame: z along its axis from y = 0, the back (world -Z)
// at +Y.
module in_tube(x) {
    translate([x, 0, cell_z]) rotate([-90, 0, 0]) children();
}

// A sector of the tube's cross-section about its back: r0 to r1, a0 to a1
// degrees either way of the back, from y0 to y1.
module back_sector(x, r0, r1, a0, a1, y0, y1) {
    in_tube(x) translate([0, 0, y0]) linear_extrude(y1 - y0)
        for (s = [-1, 1])
            polygon(concat([for (a = [a0 : (a1 - a0) / 8 : a1]) r0 * [cos(90 + s * a), sin(90 + s * a)]],
                           [for (a = [a1 : -(a1 - a0) / 8 : a0]) r1 * [cos(90 + s * a), sin(90 + s * a)]]));
}

// The bump at the top of a tube's lever, over the cell's top edge.
module lever_bump(x) {
    intersection() {
        about_axis(x, [[pocket_r + 0.5, cell_top - (pocket_r - cell_d / 2) - 0.5],
                       [lip_r, cell_top + lip_reach], [lip_r, lip_y1],
                       [pocket_r + 0.5, lip_y1 + pocket_r - lip_r + 0.5]]);
        back_sector(x, 0.1, tube_r, 0, clip_arc / 2, cell_top - 5, lever_top);
    }
}

// Tube i's mouth, cut after the tubes are joined so no neighbour's rim or
// collar stands in it: the bore, and the flare, which stops ridge short of
// the line between two tubes so neighbouring mouths meet on a ridge.
module mouth_cut(i) {
    x = cell_xs[i];
    y0 = collar_y - 1;
    about_axis(x, [[0, y0], [pocket_r, y0], [pocket_r, tube_top + 1], [0, tube_top + 1]]);
    intersection() {
        about_axis(x, concat([[0, y0], [pocket_r, y0]],
                             [for (j = [len(mouth()) - 1 : -1 : 0]) mouth()[j]],
                             [[pocket_r + lead_r, tube_top + 1], [0, tube_top + 1]]));
        xl = i > 0 ? x - pitch / 2 + ridge : x - tube_r - 2;
        xr = i < cells - 1 ? x + pitch / 2 - ridge : x + tube_r + 2;
        translate([xl, y0 - 1, -1]) cube([xr - xl, tube_top, body_z + 2]);
    }
}

// The lever's slits, either side and over its end, and its pocket behind
// it; all of it under the ring.
module lever_cut(x) {
    slit_a = clip_slit / pocket_r * 180 / PI;
    a1 = clip_arc / 2 + slit_a;
    y0 = lever_top - clip_len;
    y1 = lever_top + clip_slit;
    back_sector(x, pocket_r - 1, tube_r + clip_pocket, clip_arc / 2, a1, y0, y1);
    back_sector(x, pocket_r - 1, tube_r + clip_pocket, 0, a1, lever_top, y1);
    back_sector(x, tube_r - eps, tube_r + clip_pocket, 0, a1, y0, y1);
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
            body();
            body_top();
            for (x = cell_xs) lever_bump(x);
            for (x = cell_xs, s = [-1, 1]) crush_rib(x, s);
            for (k = [0 : len(blocks) - 1]) block(blocks[k], k);
        }
        for (x = stick_xs) { stick_slot(x); leaf_groove(x); }
        for (x = cell_xs) lever_cut(x);
        for (i = [0 : cells - 1]) mouth_cut(i);
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
