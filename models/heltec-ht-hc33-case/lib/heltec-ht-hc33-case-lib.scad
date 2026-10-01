// Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow) waterproof case in three stacked
// pieces: an 18650 case at the bottom, the MCU plate the board sits on, and
// the cover. The SMA antenna comes out of one end face and the USB-C out of
// the other, behind a hinged door that plugs into it. Every joint is sealed
// by TPU printed in place. M3 cap screws run up from below and only ever
// thread into the cover.
//
// Assembly frame: origin at the footprint's centre, z = 0 on the battery
// case's bottom face. USB-C at -X, SMA at +X. Board figures are from the
// HT-HC33 datasheet Rev 1.0 §7.1 and measurements of a board.

include <BOSL2/std.scad>;

// ---- Board ---------------------------------------------------------------
board_l = 60;
board_w = 33.5;
board_t = 1.5;
board_hole_inset = 2;
// The receptacle sticks out past the board edge by this much.
usb_overhang = 1.54;
// Receptacle centre above the PCB's top face. Unmeasured; the opening is
// sized for a plug's overmold, which covers a millimetre either way.
usb_z_above_pcb = 0.3;
// Clearance under the board: its tallest part underneath is the battery
// socket, 3.6, behind the USB-C.
under_board = 4.2;
// Headroom over the board's top face: its tallest part is 3.3.
over_board = 4.5;
// The micro-SD holder, on the underside at the far end, overhangs the
// board's edge by about this much.
sd_overhang = 2;

// ---- SMA bulkhead (U.FL pigtail to SMA female, 1/4-36 thread) --------------
// Straight out of the +X end face. The inner nut sits in a hex pocket deep
// in the wall so the connector can't turn; the wall in front of it is the
// panel the two nuts clamp.
sma_thread_d = 6.35;
sma_nut_af = 8;
sma_nut_h = 2;
sma_panel_t = 2.5;
// The TPU washer on the panel's inner face, under the inner nut: how thick,
// how far it stands into the pocket for the nut to squeeze, and how much
// smaller its hole is than the thread, so it grips it.
sma_washer_t = 1.2;
sma_washer_proud = 0.3;
sma_washer_grip = 0.5;
// The connector's back behind the inner nut, and the pigtail's bend.
sma_behind = 10;

// ---- 18650 cell -------------------------------------------------------------
cell_d = 18.6;
// Bare flat-top cell. The spring contact takes up the rest.
cell_l = 65;
// Room the spring contact needs, compressed, plus the flat contact.
contact_gap = 4;
contact_w = 12;
contact_slot_t = 0.9;
// Channel beside the cell that carries the far contact's lead.
lead_channel_w = 2.5;
// Wall round the cell and its contact slots.
cell_wall = 1.6;

// ---- Power hole through the MCU plate --------------------------------------
// Under the board's battery socket, at the USB end, so the lead plugs in
// before the board goes down onto its standoffs.
power_hole = [10, 11];

// ---- Enclosure --------------------------------------------------------------
fit = 0.5;
usb_gap = 0.3;
// Past the board's far end: the micro-SD overhang and the pigtail.
bay = 10;
floor_t = 1.6;
top_t = 2.4;
corner_r = 6;
// A 45° chamfer round the cover's top edge, so it doesn't cut into things.
// The cover prints top down, so it's the edge on the bed.
top_chamfer = 1.5;
inner_r = 1;
usb_open_w = 13.5;
usb_open_h = 7;
// The USB opening's corners are 45° chamfers: its lower edge prints as a
// ceiling, and the door's plug seals against the same outline.
usb_open_chamfer = 1.5;
// The opening's mouth flares out at 45° by this much, and the plug sleeve's
// outer lip flares to fill it, so the lip is pressed into the mouth as well.
usb_flare = 0.8;

// ---- Seals (TPU 75A printed in place) ---------------------------------------
// A ridge presses into a groove whose floor is a channel of TPU, with a
// column standing seal_squeeze into the ridge's path. Where the upper part
// prints flat side down (the MCU plate over the battery case), there is no
// ridge: the column presses on the flat face.
seal_ridge_h = 1;
seal_ridge_tip = 1;
seal_squeeze = 0.6;
seal_channel_w = 2;
seal_channel_d = 1.4;
seal_fit = 0.2;
// PETG between a seal and anything else.
seal_margin = 0.8;
// The loop's corner radius, on its centreline.
seal_r = 3;
// The screws run down the middle of the seal. Round each one the TPU
// channel widens to a pad, its column to a disc, and the cover's ridge to a
// disc that presses it, so the pilot's mouth is ringed by pressed TPU. The
// screw threads through the TPU, which seals round it.
seal_pad_r = 2.8;
seal_disc_r = 2.2;
// PETG between a screw's head and the TPU over it.
seal_skin = 1.2;

// ---- USB-C door ------------------------------------------------------------------
// The door carries a plug that pushes into the USB opening. The plug is a
// PETG core in a TPU sleeve, oversize by plug_squeeze all round, with ribs
// that pop into matching grooves in the opening's walls. The seal presses
// on the opening, not the hinge, and the ribs in their grooves hold it
// shut. A groove is larger than its rib, so the squeezed TPU has somewhere
// to go.
door_t = 2.4;
plug_d = 5;
plug_sleeve_t = 1.8;
plug_squeeze = 0.3;
plug_rib = 0.6;
plug_groove = 1;
// Deep enough that the first groove clears the mouth's flare.
plug_ribs = [-2, -4];
// PETG round the opening under the door, and the finger tab past it.
door_margin = 1.5;
door_tab = 3;
// Hinge: a 1.75 mm filament offcut through two door knuckles and the
// cover's one, snug in the cover's.
knuckle_r = 3;
pin_d = 1.75;
// How far outside the cover's face the hinge axis sits.
hinge_w = 1.5;
hinge_fit = 0.4;

// ---- M3 cap screws, up from below -----------------------------------------
// Every one on the seal's line, head up in the battery case's flange,
// through both seals, threading only into the cover.
m3_clear_d = 3.4;
m3_pilot_d = 2.5;
m3_head_d = 6.2;
m3_head_h = 3.2;
screw_len = 16;
// Along each long side.
side_screw_x = [-20, 0, 20];
// In each end wall, either side of the USB-C and the SMA.
end_screw_y = 15.8;

// ---- Derived ---------------------------------------------------------------
_eps = 0.01;
ridge_base = seal_ridge_tip + 2 * seal_ridge_h;

in_hx = (usb_gap + board_l + bay) / 2;
in_hy = board_w / 2 + fit;
seal_hx = in_hx + seal_margin + ridge_base / 2;
seal_hy = in_hy + seal_margin + ridge_base / 2;
screws = concat([for (x = side_screw_x, sy = [-1, 1]) [x, sy * seal_hy]],
                [for (sx = [-1, 1], sy = [-1, 1]) [sx * seal_hx, sy * end_screw_y]]);
// What reaches furthest out from the seal's line: a screw's counterbore,
// or the groove's widest round a screw.
seal_reach = max(m3_head_d / 2, seal_disc_r + seal_fit + seal_ridge_h + seal_fit) + seal_margin;
out_hy = seal_hy + seal_reach;

board_x0 = -in_hx + usb_gap;
power_x = board_x0 + power_hole[0] / 2;
board_holes = [for (sx = [0, 1], sy = [-1, 1])
    [board_x0 + board_hole_inset + sx * (board_l - 2 * board_hole_inset),
     sy * (board_w / 2 - board_hole_inset)]];

// 18650 case: the cell's pocket wrapped in cell_wall, flaring at no more
// than 45° to the sealing flange along the top.
cell_axis_z = floor_t + cell_d / 2 + 0.3;
core_r = cell_d / 2 + 0.3 + cell_wall;
case_h = floor_t + cell_d + 0.6;
pocket_hl = (cell_l + contact_gap) / 2;
body_hl = pocket_hl + contact_slot_t + cell_wall;
// Where the flange's outer edge starts: on the 45° line from the flat along
// the bottom (the cell wall's lower tangent), plus a little for the corners.
flange_z = out_hy - core_r * (sqrt(2) - 1) + 0.6;
screw_seat = case_h - seal_channel_d - seal_skin;

plate_t = seal_ridge_h + seal_fit + seal_channel_d + 1.6;
plate_z = case_h;
cover_z = plate_z + plate_t;
pcb_bot = cover_z + under_board;
pcb_top = pcb_bot + board_t;
cover_top = pcb_top + over_board + top_t;
usb_z = pcb_top + usb_z_above_pcb;

screw_tip = screw_seat + screw_len;

// SMA, through the +X end wall: panel at the outer face, the nut's hex
// pocket behind it, and a cavity from inside to put the nut in.
sma_nut_r = (sma_nut_af + 0.4) / sqrt(3);
sma_cavity_r = sma_nut_r + 0.15;
// Centred between the cover's seal ridge (with 1.2 of PETG over it) and
// 1 short of its top.
sma_z = (cover_z + 1.2 + cover_top - 1) / 2;
// The ends are as long as the seal, the SMA's nut and the room behind it,
// and the door's plug need.
out_hx = max(seal_hx + seal_reach,
             board_x0 + board_l + sd_overhang + sma_behind + sma_nut_h + 0.4 + sma_panel_t,
             in_hx + (usb_overhang - usb_gap) + 1 + plug_d);
sma_pocket_x = out_hx - sma_panel_t;
sma_nut_x = sma_pocket_x - sma_nut_h - 0.4;

// Door, in the cover's -X face frame (see face_frame()): u across the face
// (toward -Y), v up from the USB's centre, w out of the face.
face_x = -out_hx;
hinge_u = -(usb_open_w / 2 + 1 + knuckle_r + hinge_fit);
door_u1 = usb_open_w / 2 + door_margin + door_tab;
v_bot = cover_z - usb_z;
v_top = cover_top - usb_z;
kb0 = v_bot + 0.3 + hinge_fit;
kb1 = kb0 + 3;
kc0 = kb1 + hinge_fit;
kc1 = kc0 + 3;
kt0 = kc1 + hinge_fit;
kt1 = v_top - 0.6;
cone_h = knuckle_r - pin_d / 2;
// The plug's PETG core stays inside this radius of the hinge axis, so it
// swings past the opening's far wall; the TPU sleeve gives the rest.
far_wall = usb_open_w / 2 - hinge_u;
core_r_max = sqrt(pow(far_wall - plug_sleeve_t - 0.2, 2) + pow(hinge_w, 2));

assert(pocket_hl + contact_slot_t + seal_margin <= seal_hx - seal_channel_w / 2,
       "the contact slots run into the battery case's seal channel");
assert(screw_tip - cover_z >= 6, str("the screws bite only ", screw_tip - cover_z, " mm into the cover"));
assert(screw_tip + 1 < cover_top - 1, "a pilot breaks through the cover's top");
assert(flange_z < case_h - 0.8, "the flange's edge is too thin: the footprint is too wide for a 45° flare");
assert(max([for (x = side_screw_x) abs(x)]) <= seal_hx - seal_r && end_screw_y <= seal_hy - seal_r,
       "a screw is off the seal's straight runs");
assert(end_screw_y - m3_head_d / 2 >= cell_d / 2 + 0.3 + lead_channel_w + 0.3,
       "an end screw's counterbore runs into the cell's pocket");
assert(end_screw_y - m3_pilot_d / 2 - 1 > sma_cavity_r, "an end screw runs into the SMA's cavity");
assert(seal_hy - seal_disc_r >= in_hy && seal_hx - seal_disc_r >= in_hx,
       "a ridge disc's tip overhangs the cover's inside");
assert(power_x + power_hole[0] / 2 < 0 && power_x - power_hole[0] / 2 >= -in_hx,
       "the power hole leaves the sealed interior");
assert(sma_z - sma_cavity_r >= cover_z + 1.2 - _eps,
       "the SMA's cavity runs down into the cover's seal ridge");
assert(sma_z + sma_cavity_r <= cover_top - 1 + _eps, "the SMA's cavity breaks through the cover's top");
assert(sma_panel_t - (sma_washer_t - sma_washer_proud) >= 1.2,
       "the SMA washer's recess leaves the panel too thin");
assert(sma_washer_proud < sma_pocket_x - sma_nut_x - sma_nut_h + _eps,
       "the SMA washer stands into the pocket further than the nut's clearance");
assert(sma_nut_x - sma_behind >= board_x0 + board_l + sd_overhang,
       "the SMA's back runs into the board or the micro-SD holder");
assert(usb_z - usb_open_h / 2 > cover_z + 1, "the USB opening cuts into the cover's sealing rim");
assert(kt1 - kt0 >= cone_h + hinge_fit + 1.5, "no room for the hinge's top knuckle");
assert(hinge_u + knuckle_r + hinge_fit <= -usb_open_w / 2 - 0.6, "the hinge's clearance runs into the USB opening");
assert(plug_d <= out_hx - in_hx - (usb_overhang - usb_gap) - 1 + _eps, "the plug reaches the USB receptacle");
assert(max(plug_ribs) + plug_groove <= -usb_flare - 0.2, "a rib's groove runs into the opening's flared mouth");
assert(hinge_u + knuckle_r + hinge_fit <= -usb_open_w / 2 - usb_flare - 0.2,
       "the opening's flared mouth runs into the hinge's clearance");
assert(corner_r > top_chamfer, "the top chamfer is wider than the corners' radius");

echo(str("footprint ", 2 * out_hx, " x ", 2 * out_hy, ", height ", cover_top,
         " (battery ", case_h, ", plate ", plate_t, ", cover ", cover_top - cover_z,
         "); ", len(screws), " M3 x ", screw_len, " biting ", screw_tip - cover_z,
         "; hinge pin ", pin_d, " x ", kt1 - kb0));

// ---- Outline ----------------------------------------------------------------------
module footprint(h, chamfer = 0) {
    module outline() rect([2 * out_hx, 2 * out_hy], rounding = corner_r);
    hull() {
        linear_extrude(h - chamfer) outline();
        if (chamfer > 0) linear_extrude(h) offset(delta = -chamfer) outline();
    }
}

// ---- Loops ------------------------------------------------------------------------
// A loop between offsets a (inside) and b (outside) of a convex 2D outline,
// from z0 to z1. The offsets may change linearly up the loop, for 45°
// flanks. Every offset is convex, so hulls give exact frustums.
module offset_loop(z0, z1, a0, b0, a1 = undef, b1 = undef) {
    a1 = is_undef(a1) ? a0 : a1;
    b1 = is_undef(b1) ? b0 : b1;
    module ring(z, d) translate([0, 0, z]) linear_extrude(_eps) offset(r = d, $fn = 48) children();
    difference() {
        hull() { ring(z0, b0) children(); ring(z1 - _eps, b1) children(); }
        hull() { ring(z0 - _eps, a0) children(); ring(z1, a1) children(); }
    }
}

// The outline swept by the seal's centreline.
module seal_path() { square([2 * (seal_hx - seal_r), 2 * (seal_hy - seal_r)], center = true); }

// At every screw, children stood on it.
module at_screws() { for (s = screws) translate([s[0], s[1], 0]) children(); }

// The cut in the part that holds the TPU, whose face is at z = face.
module seal_groove(face, ridged) {
    h = ridged ? seal_ridge_h + seal_fit : 0;
    w = seal_ridge_tip / 2 + seal_fit;
    wd = seal_disc_r + seal_fit;
    if (ridged) {
        offset_loop(face - h, face + 1, seal_r - w, seal_r + w, seal_r - w - h - 1, seal_r + w + h + 1) seal_path();
        at_screws() translate([0, 0, face - h]) cylinder(r1 = wd, r2 = wd + h + 1, h = h + 1, $fn = 40);
    }
    offset_loop(face - h - seal_channel_d, face - h + _eps, seal_r - seal_channel_w / 2, seal_r + seal_channel_w / 2) seal_path();
    at_screws() translate([0, 0, face - h - seal_channel_d]) cylinder(r = seal_pad_r, h = seal_channel_d + _eps, $fn = 40);
}

module seal_gasket(face, ridged) {
    h = ridged ? seal_ridge_h + seal_fit : 0;
    top = face - (ridged ? seal_ridge_h : 0) + seal_squeeze;
    difference() {
        union() {
            offset_loop(face - h - seal_channel_d, face - h, seal_r - seal_channel_w / 2, seal_r + seal_channel_w / 2) seal_path();
            offset_loop(face - h - _eps, top, seal_r - seal_ridge_tip / 2, seal_r + seal_ridge_tip / 2) seal_path();
            at_screws() {
                translate([0, 0, face - h - seal_channel_d]) cylinder(r = seal_pad_r, h = seal_channel_d, $fn = 40);
                translate([0, 0, face - h - _eps]) cylinder(r = seal_disc_r, h = top - face + h + _eps, $fn = 40);
            }
        }
        at_screws() translate([0, 0, face - 5]) cylinder(d = m3_pilot_d, h = 10, $fn = 20);
    }
}

// On the underside of a part whose bottom face is at z = face.
module seal_ridge(face) {
    w = seal_ridge_tip / 2;
    offset_loop(face - seal_ridge_h, face + _eps, seal_r - w, seal_r + w,
                seal_r - w - seal_ridge_h, seal_r + w + seal_ridge_h) seal_path();
    // Trimmed to the wall: the flare would hang over the inside.
    difference() {
        at_screws() translate([0, 0, face - seal_ridge_h])
            cylinder(r1 = seal_disc_r, r2 = seal_disc_r + seal_ridge_h, h = seal_ridge_h + _eps, $fn = 40);
        translate([0, 0, face - seal_ridge_h - 1]) linear_extrude(seal_ridge_h + 2)
            rect([2 * in_hx, 2 * in_hy], rounding = inner_r);
    }
}

module screw_holes(z0, z1) {
    at_screws() translate([0, 0, z0 - 1]) cylinder(d = m3_clear_d, h = z1 - z0 + 2, $fn = 24);
}

// ---- 1: battery case ----------------------------------------------------
// Printed floor down. The cell's wall, a flat along the bottom, and the
// flange: hulled, so the only overhangs are the 45° tangents off the cell,
// and the flange rests on them. The corner screws' heads sit up in it.
module battery_case() {
    difference() {
        intersection() {
            translate([-100, -100, 0]) cube([200, 200, case_h]);
            hull() {
                translate([-body_hl, 0, cell_axis_z]) rotate([0, 90, 0])
                    cylinder(r = core_r, h = 2 * body_hl, $fn = 96);
                translate([-body_hl, -core_r * (sqrt(2) - 1), 0])
                    cube([2 * body_hl, 2 * core_r * (sqrt(2) - 1), _eps]);
                translate([0, 0, flange_z]) footprint(case_h - flange_z);
            }
        }
        battery_pocket();
        seal_groove(case_h, false);
        screw_holes(0, case_h);
        at_screws() translate([0, 0, -1]) cylinder(d = m3_head_d, h = screw_seat + 1, $fn = 32);
    }
}

// The cell drops in from the top onto a round floor. A contact plate
// stands in a slot at each end, and the far one's lead runs back along a
// channel beside the cell to the power hole.
module battery_pocket() {
    r = cell_d / 2 + 0.3;
    translate([-pocket_hl, 0, cell_axis_z]) rotate([0, 90, 0])
        cylinder(r = r, h = 2 * pocket_hl, $fn = 96);
    translate([-pocket_hl, -r, cell_axis_z]) cube([2 * pocket_hl, 2 * r, case_h]);
    translate([-pocket_hl, -r - lead_channel_w, cell_axis_z])
        cube([2 * pocket_hl, lead_channel_w + _eps, case_h]);
    for (s = [-1, 1])
        translate([s > 0 ? pocket_hl - _eps : -pocket_hl - contact_slot_t + _eps,
                   -(contact_w + 0.4) / 2, cell_axis_z - contact_w / 2 - 0.4])
            cube([contact_slot_t, contact_w + 0.4, case_h]);
}

module battery_case_gasket() { seal_gasket(case_h, false); }

// ---- 2: MCU plate ----------------------------------------------------------
module mcu_plate() {
    difference() {
        union() {
            translate([0, 0, plate_z]) footprint(plate_t);
            for (h = board_holes) translate([h[0], h[1], cover_z - _eps]) {
                cylinder(d = 4.5, h = under_board + _eps, $fn = 32);
                cylinder(d = 1.7, h = under_board + board_t - 0.2, $fn = 20);
            }
        }
        seal_groove(cover_z, true);
        screw_holes(plate_z, cover_z);
        translate([power_x, 0, plate_z - 1])
            linear_extrude(plate_t + 2) rect(power_hole, rounding = 1.5);
    }
}

module mcu_plate_gasket() { seal_gasket(cover_z, true); }

// ---- 3: cover ------------------------------------------------------------------
module cover() {
    h = cover_top - cover_z;
    difference() {
        union() {
            difference() {
                translate([0, 0, cover_z]) footprint(h, top_chamfer);
                translate([0, 0, cover_z - 1])
                    linear_extrude(h - top_t + 1)
                        rect([2 * in_hx, 2 * in_hy], rounding = inner_r);
                face_frame() door_cuts();
            }
            seal_ridge(cover_z);
            face_frame() cover_knuckle();
        }
        at_screws() translate([0, 0, cover_z - seal_ridge_h - 1])
            cylinder(d = m3_pilot_d, h = screw_tip - cover_z + seal_ridge_h + 2, $fn = 20);
        // USB-C: through for a plug's overmold, and the door's plug.
        translate([-out_hx - 1, 0, usb_z]) rotate([0, 90, 0]) rotate([0, 0, 90])
            linear_extrude(out_hx - in_hx + 2) usb_open_2d();
        sma_mount();
        sma_seal(false);
    }
}

// The thread's hole through the panel is round: it bridges only its own 6.8 mm,
// and the user prefers it round. The pocket and the cavity behind it print with
// a 45° roof, tips down in assembly, which is up as the cover prints top down.
module sma_mount() {
    translate([0, 0, sma_z]) rotate([0, 90, 0]) rotate([0, 0, -90]) {
        translate([0, 0, sma_nut_x - 1]) linear_extrude(out_hx - sma_nut_x + 2)
            circle(d = sma_thread_d + 0.45, $fn = 48);
        // A hexagon's roof is only 30° off flat, so it peaks at 45°, capped
        // as a short bridge above the seal ridge.
        translate([0, 0, sma_nut_x]) linear_extrude(sma_pocket_x - sma_nut_x)
            intersection() {
                hull() {
                    hexagon(or = sma_nut_r, spin = 90);
                    translate([0, sma_nut_r * (1 + sqrt(3)) / 2]) square(0.01, center = true);
                }
                translate([-2 * sma_nut_r, -2 * sma_nut_r]) square([4 * sma_nut_r, 2 * sma_nut_r + sma_cavity_r]);
            }
        translate([0, 0, in_hx - 1]) linear_extrude(sma_nut_x - in_hx + 1 + _eps)
            tear_2d(2 * sma_cavity_r, flat = sma_cavity_r);
    }
}

// Tip toward +Y, and cut flat at `flat` from the centre if given.
module tear_2d(d, flat) {
    intersection() {
        hull() {
            circle(d = d, $fn = 48);
            translate([0, d / 2 * sqrt(2)]) square(0.01, center = true);
        }
        if (!is_undef(flat)) translate([-d, -d]) square([2 * d, d + flat]);
    }
}

// A TPU washer on the panel's inner face, inside the nut's pocket: the inner
// nut tightens onto it. It fills a hex recess in the panel and stands
// `sma_washer_proud` into the pocket. Its hole is `sma_washer_grip` under the
// thread, so the TPU grips it.
module sma_seal(gasket) {
    x0 = sma_pocket_x - sma_washer_proud;
    translate([0, 0, sma_z]) rotate([0, 90, 0]) rotate([0, 0, -90])
        translate([0, 0, x0 - (gasket ? 0 : 1)])
            linear_extrude(sma_washer_t + (gasket ? 0 : 1)) difference() {
                hexagon(or = sma_nut_r, spin = 90);
                if (gasket) circle(d = sma_thread_d - sma_washer_grip, $fn = 48);
            }
}

module cover_gasket() { sma_seal(true); }

// ---- USB-C door ------------------------------------------------------------------
// The opening's outline, u across and v up.
module usb_open_2d() {
    rect([usb_open_w, usb_open_h], chamfer = usb_open_chamfer);
}

// The cover's -X face, with u across it (toward -Y), v up from the USB's
// centre and w out of the face.
module face_frame() {
    multmatrix([[0, 0, -1, face_x], [-1, 0, 0, 0], [0, 1, 0, usb_z], [0, 0, 0, 1]]) children();
}

// Children stretched h along +v from (u, v0) at depth w: for cylinders.
module along_v(u, w, v0, h) {
    translate([u, v0, w]) rotate([-90, 0, 0]) scale([1, 1, h]) children();
}

// A solid of revolution round the hinge axis, from a profile of
// [radius, v] points. Everything that turns with the door, or clears it,
// is one of these.
module round_hinge(profile) {
    along_v(hinge_u, hinge_w, 0, 1) rotate_extrude($fn = 48) polygon(profile);
}

// A diamond-section loop round the opening at depth w, reaching d out from
// its edge: the grooves in the opening and the ribs on the plug.
module plug_diamond(w, d) {
    module ring(z, o) translate([0, 0, z]) linear_extrude(_eps) offset(r = o, $fn = 32) usb_open_2d();
    hull() { ring(w - d, 0); ring(w, d); ring(w + d - _eps, 0); }
}

// Cut from the cover's face: the opening's flared mouth, the grooves the
// plug's ribs pop into, and room for the door's knuckles.
module door_cuts() {
    plug_flare(0);
    for (w = plug_ribs) plug_diamond(w, plug_groove);
    rc = knuckle_r + hinge_fit;
    top = v_top + 1;
    // Round the lower door knuckle: its floor cones up at 45° from where the
    // face is, so it prints as a supported ceiling.
    round_hinge([[0, kb0 - hinge_fit], [hinge_w, kb0 - hinge_fit],
                 [rc, kb0 - hinge_fit + rc - hinge_w], [rc, kb1 + hinge_fit], [0, kb1 + hinge_fit]]);
    // Round the upper one: the floor is the cover knuckle's cone.
    round_hinge([[0, kc1 + knuckle_r], [rc, kc1 - hinge_fit], [rc, top], [0, top]]);
}

// The cover's knuckle, between the door's two. Its top is a 45° cone, the
// supported underside when the cover prints top down; the door's upper
// knuckle has the matching recess. The pin is snug in it.
module cover_knuckle() {
    difference() {
        intersection() {
            round_hinge([[0, kc0], [knuckle_r, kc0], [knuckle_r, kc1], [0, kc1 + knuckle_r]]);
            translate([-100, -100, -100]) cube([200, 200, 100 + door_t]);
        }
        along_v(hinge_u, hinge_w, kc0 - 1, kc1 - kc0 + knuckle_r + 2)
            cylinder(d = pin_d + 0.05, h = 1, $fn = 20);
    }
}

module door() {
    rk = knuckle_r;
    u0 = hinge_u;
    difference() {
        union() {
            // The plate, from the hinge to the finger tab.
            translate([u0, kb0, 0]) cube([door_u1 - u0, kt1 - kb0, door_t]);
            intersection() {
                union() {
                    // Its end cones in at 45° where it runs into the cover.
                    round_hinge([[0, kb0], [hinge_w, kb0], [rk, kb0 + rk - hinge_w], [rk, kb1], [0, kb1]]);
                    round_hinge([[0, kt0], [rk, kt0], [rk, kt1], [0, kt1]]);
                }
                translate([-100, -100, -100]) cube([200, 200, 100 + door_t]);
            }
            plug_core();
        }
        // Clear of the cover's knuckle and its cone.
        round_hinge([[0, kb1], [rk + hinge_fit, kb1], [rk + hinge_fit, kt0], [0, kt0 + rk + hinge_fit]]);
        along_v(hinge_u, hinge_w, kb0 - 1, kt1 - kb0 + 2) linear_extrude(1) tear_2d(pin_d + 0.35);
        // A 45° bevel under the tab for a fingernail.
        translate([0, kb0 - 1, 0]) rotate([-90, 0, 0]) linear_extrude(kt1 - kb0 + 2) {
            u = usb_open_w / 2 + door_margin;
            polygon([[u, 1], [u, 0], [u + door_t / 2, -door_t / 2], [u + 2 * door_tab, -door_t / 2], [u + 2 * door_tab, 1]]);
        }
    }
}

// The plug's PETG core: the opening's outline inset by the sleeve, trimmed
// to swing past the opening's far wall.
module plug_core() {
    intersection() {
        translate([0, 0, -plug_d]) linear_extrude(plug_d + door_t / 2)
            offset(delta = -plug_sleeve_t) usb_open_2d();
        along_v(hinge_u, hinge_w, -usb_open_h, 2 * usb_open_h) cylinder(r = core_r_max, h = 1, $fn = 120);
    }
}

// The opening's mouth, flaring out at 45° to usb_flare at the face (w = 0),
// grown by o all round: 0 for the cut, plug_squeeze for the sleeve's lip.
module plug_flare(o) {
    module ring(z, d) translate([0, 0, z]) linear_extrude(_eps) offset(r = d, $fn = 32) usb_open_2d();
    hull() { ring(-usb_flare, o); ring(-_eps, usb_flare + o); }
    if (o == 0) hull() { ring(-_eps, usb_flare); ring(1, usb_flare + 1); }
}

// The TPU round the core: squeeze-oversize, a 45° lead-in at the tip, the
// ribs, and the lip flaring out into the opening's mouth.
module plug_sleeve() {
    module ring(z, o) translate([0, 0, z]) linear_extrude(_eps) offset(r = o, $fn = 32) usb_open_2d();
    hull() {
        ring(-plug_d, plug_squeeze - 0.6);
        ring(-plug_d + 0.6, plug_squeeze);
        ring(-_eps, plug_squeeze);
    }
    for (w = plug_ribs) plug_diamond(w, plug_rib + plug_squeeze);
    plug_flare(plug_squeeze);
}

module door_gasket() {
    difference() {
        plug_sleeve();
        plug_core();
    }
}

// ---- Reference (not printed) -----------------------------------------------
module ref_board() {
    translate([board_x0, -board_w / 2, pcb_bot]) cube([board_l, board_w, board_t]);
    translate([board_x0 - usb_overhang, -4.47, usb_z - 1.63]) cube([7.35, 8.94, 3.26]);
    // Underside: the battery socket behind the USB-C, the micro-SD holder
    // overhanging the far end.
    translate([board_x0 + 0.6, -4, pcb_bot - 3.6]) cube([6, 8, 3.6]);
    translate([board_x0 + board_l - 13, -7.5, pcb_bot - 2]) cube([13 + sd_overhang, 15, 2]);
}

module ref_cell() {
    translate([-cell_l / 2, 0, cell_axis_z]) rotate([0, 90, 0])
        cylinder(d = cell_d, h = cell_l, $fn = 64);
}

// ---- Print orientation ----------------------------------------------------
// A part and its gasket share one transform, so their two STLs overlay in the
// slicer as one multi-material object.
module plate_print() { translate([0, 0, -plate_z]) children(); }
module cover_print() { translate([0, 0, cover_top]) rotate([180, 0, 0]) children(); }
// Outer face down, plug up.
module door_print() { translate([0, 0, door_t]) rotate([180, 0, 0]) children(); }

module battery_case_print() { battery_case(); }
module battery_case_gasket_print() { battery_case_gasket(); }
module mcu_plate_print() { plate_print() mcu_plate(); }
module mcu_plate_gasket_print() { plate_print() mcu_plate_gasket(); }
module cover_part_print() { cover_print() cover(); }
module cover_gasket_print() { cover_print() cover_gasket(); }
module door_part_print() { door_print() door(); }
module door_gasket_print() { door_print() door_gasket(); }

// Every piece in print orientation, gaskets in.
module print_layout(i) {
    positions = [[0, -62, 0], [0, 0, 0], [0, 62, 0], [0, 100, 0]];
    translate(positions[i]) children();
}
