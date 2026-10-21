// Solar node: a slim sealed box under a salvaged 240 x 168 mm solar panel.
//
// Three rigid pieces and a gasket, top to bottom:
// - Bezel: a flat ring over the panel's border, clamping it down.
// - Frame: the panel drops into a pocket in its top onto a ledge carrying a
//   bead of construction adhesive. The bezel squeezes the bead to
//   `glue_gap` thick, which leaves the panel's top flush with the frame's.
// - Tray: floor and walls, holding the electronics. Its top wall carries a
//   tongue that side-squeezes a U-section TPU gasket in a groove under the
//   frame (memory: never screws through a squeezed bead).
// One ring of M3 cap screws, outside the seal, runs down through bezel and
// frame into a flange round the tray's rim. Undoing them lifts the frame
// with the glued panel and the bezel off the tray in one; the bezel never
// has to come off the panel.
//
// It hangs with a long side down, +Y up, the winch behind it. The box is a
// wedge: its back hangs plumb against the winch deck, and the lid (frame,
// panel and bezel) slopes forward to `panel_tilt` from horizontal. The walls
// stand square to the lid, so the seal and screw ring are as on a flat box;
// the back and a flat bottom close the wedge.
//
// Inside, low and centred on the back: the LP1260110 LiPo pouch (10 Ah), and
// over it a carrier plate on four posts holding the Heltec V3, the Heltec
// HT-HC33, the TP4056 charger and a 5 V buck-boost. Each sits between corner
// brackets (stick them down with foam tape).
//
// The antennas are at the top of a 3 m carbon-fibre pole standing in a
// socket on the top wall, midway between the two cables; crossmembers along
// the cables hold it upright. Their coax comes down the pole to the N (for
// the V3) and SMA (for the HC33) bulkheads in the top wall either side of it.
//
// Winch: two spools of 1/32" stainless cable side by side in the upper half,
// behind the tray on a deck screwed to its back.
// Each turns on a 608 skateboard bearing on a post from the deck and has
// teeth round its lower flange, driven by a pinion on a JGY-370 worm
// gearmotor lying inside the box, output shaft down through a TPU lip seal
// on the pinion's hub. The two trains mirror each other, so the spools turn
// opposite ways to reel in. The cable runs only on stainless 608s: past
// each spool it turns on an upright guide bearing, rides over one lying
// over the back's top edge, and leaves through a throat between two more in
// a horn standing up behind the sloping top, at the depth of the node's
// centre of mass so it hangs upright. Each throat sits at its top corner, as
// far apart as the box allows.
//
// Two frames. The hanging frame: X along the panel, Y up, Z out from the
// back, origin at the middle of the back's outside face. The lid's frame
// (`lid_frame()`): Y along the panel's width, Z out of the panel, z = 0 where
// a flat tray's floor would be; the frame, bezel, gasket, panel, walls,
// tongue and bulkheads are modelled in it. Every piece prints as modelled
// (the tray back down) except the gasket, which `gasket_print()` turns
// floor-down. The footprint needs a 270 mm bed (Q2, U1).

// BEGIN_PARAMS
// The solar panel: length, width, thickness (thickness unmeasured)
panel_l = 240;
panel_w = 168;
panel_t = 3;

// Clearance round the panel in its pocket, per side
panel_clear = 0.5;

// The ledge the panel rests on (the adhesive's land), how far it reaches
// in under the panel and how thick it is
ledge_w = 6;
ledge_t = 3;

// Construction adhesive under the panel once the bezel is screwed down
glue_gap = 1;

// Frame rim outside the panel's pocket: screws and the seal's groove
rim_w = 11;

// How far the bezel reaches in over the panel's border, and its thickness
bezel_overlap = 4;
bezel_t = 5;

// Outside corner radius
corner_r = 4;

// Tray: back and bottom thickness, the walls' height under the lid at the
// rim (sized for the N bulkhead), wall
tray_floor = 2.5;
tray_inside_h = 26;
tray_wall = 4;

// The panel's tilt from horizontal. The back hangs plumb, so the wedge's
// top and bottom walls run back from the lid square to it, this far from the
// frame's underside at the outer edge (the top wall carries the bulkheads
// and the pole's socket; the bottom sets the back's height for the winch)
panel_tilt = 50;
top_depth = 40;
bottom_depth = 50;

// How far the tray's wall sits in from the frame's edge (the flange the
// screws go into stands out to the edge), and the flange's depth under the
// frame before its underside chamfers 45° back to the wall
tray_inset = 5.5;
flange_h = 11;

// M3 cap screws: inset from the outside, most spacing allowed, pilot for
// self-tapping, clearance, counterbore diameter and depth; the deck's pillars'
// diameter
screw_e = 3.5;
screw_pitch = 32;
pilot_d = 2.5;
clear_d = 3.4;
cbore_d = 6;
cbore_h = 3.2;
column_d = 7;

// How deep the pilots go into the tray (M3x16: 1.8 bezel + frame + the rest)
pilot_depth = 9;

// Seal: groove inset from the outside, depth; the TPU gasket's walls, slot
// and floor; side squeeze per side
groove_e = 6.4;
groove_depth = 3;
gasket_wall = 1.2;
gasket_slot = 1.2;
gasket_floor = 0.4;
seal_squeeze = 0.2;

// N female bulkhead, 5/8"-24 thread: hole, its body/flange outside, its
// panel nut across flats, the most panel it clamps, and how far its back
// (with the pigtail's crimp) reaches in from the wall
n_thread_d = 15.9;
n_hole_clear = 0.5;
n_body_d = 24;
n_nut_af = 19.05;
n_panel = 4;
n_back_len = 15;

// LP1260110 LiPo pouch: length, width, thickness
bat_l = 110;
bat_w = 60;
bat_t = 12;

// Heltec WiFi LoRa 32 V3: length, width, height with the OLED
heltec_l = 50.2;
heltec_w = 25.5;
heltec_h = 10.2;

// TP4056 module (USB-C version) and the 5 V buck-boost (size a guess)
charger_l = 28;
charger_w = 17.5;
buck_l = 30;
buck_w = 20;

// Corner brackets that place each part on the floor: wall, leg, height,
// clearance round the part; the battery's are taller
bracket_wall = 1.2;
bracket_leg = 8;
bracket_h = 3;
bat_bracket_h = 6;
bracket_clear = 0.5;

// The carrier plate over the battery: thickness, gap above the pouch (room
// for the zip ties' straps under the plate), its posts' diameter, and the
// M3 that holds it to each post (pilot depth for an M3x8)
shelf_t = 2;
shelf_gap = 3;
post_d = 7;
shelf_pilot_depth = 7;
// Zip ties hold each board down, through slots in the plate either side of
// it: the widest tie and its thickness the slots take
tie_w = 3.6;
tie_t = 1.1;
// Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), on the carrier plate: board
// length, width, thickness, room under and over it
hc33_l = 60;
hc33_w = 33.5;
hc33_t = 1.5;
hc33_under = 4.2;
hc33_over = 4.5;


// ---- winch: two spools of 1/32" stainless cable behind the tray, side by
// side in its upper half.

// Cable: diameter, length on each spool, and the spare room the spool
// keeps for uneven winding (no level-wind)
cable_d = 0.794;
cable_len = 60960;
wind_margin = 1.15;

// Spool gear (teeth round the spool's lower flange): module, teeth, face
// width; the pinion's teeth and the gap round every turning part
gear_m = 1.5;
spool_z = 74;
pinion_z = 12;
spool_gear_w = 5;
spin_gap = 1;
// Gap between the two spools' teeth
spool_gap = 4;

// The cable's channel: width between the flanges, the top flange's
// thickness, the core ring's wall, how far the cable stays below the top
// flange's rim
bay_w = 8;
cap_t = 1.2;
core_wall = 6;
fill_margin = 2;

// The spool's web from hub to gear ring, and its hub round the bearing
web_t = 2;
hub_wall = 3;

// 608 skateboard bearing: bore, outside, width; press fit in the hub
brg_bore = 8;
brg_od = 22;
brg_w = 7;
brg_press = 0.1;
// Posts carry each bearing on a shoulder narrower than its inner race
brg_shoulder_d = 12;
// The spacer from the bearing's inner race up to the tray's underside
spacer_d = 11;

// The deck behind the tray: thickness, the band its screws go through; and the M3s
// that hold it to the tray's back (length under the head)
deck_t = 8;
deck_screw_l = 25;
deck_band = 12;

// The cable runs on stainless 608s (`brg_*`) from the spool to where it
// leaves: its x past the spool (the throat's, set so the guide bearing fits
// inside the enclosure on the back). The upright guide bearing that turns it
// stands as high as the enclosure allows, and turns on an M8x20 hex bolt up
// through the deck, threaded into the deck's pad.
throat_x = 98;

// Then over an edge bearing lying across above the back's top edge, and up
// into a horn: a throat between two more bearings, at the depth of the
// node's centre of mass, so it hangs upright. That depth (estimated in front
// of the back; see the README), the gap every bearing and the cable keep
// from the box's sloping top, the throat's gap, the cheeks' thickness, the
// gap between a cheek and a bearing's outer race (under the cable's
// diameter, so it can't walk off the race), and the bridge's thickness. The
// horn bearings turn on M8x35 hex bolts with nylocs. Between the cheeks,
// under the cable, the horn is solid up to `web_gap` below the cable.
hang_z = 24.5;
horn_clear = 3;
horn_gap = 1.5;
cheek_t = 10;
race_gap = 0.5;
horn_wall = 8;
web_gap = 2;
guide_pilot_d = 7;
// Each horn is its own part. It is held by two M5x30 up through the deck's
// top band, the horn's foot and into the tray's solid top band, and by four
// M5x16 through two feet lying on the box's sloping top into its solid top
// wall: the feet's width beside each cheek, thickness, and the bolts' lid z
horn_bolt_clear = 5.5;
horn_pilot_d = 4.2;
foot_w = 8;
foot_t = 8;
foot_bolt_zl = [-1, 13];

// The enclosure on the back: a plain wall, part of the deck, round the
// spools, pinions and guide bearings, up to the tray's back. Gap inside it
// round them, wall thickness; the TPU 85A strip in a groove on its top
// (groove width and depth, strip height, how much the deck's screws squeeze
// it); the hole each cable leaves through, in its top wall; a drain at the
// bottom under each spool. Keeps out debris and splashes; not watertight.
shroud_gap = 2;
shroud_wall = 2.5;
shroud_groove_w = 2;
shroud_groove_d = 1.2;
shroud_seal_h = 2;
shroud_squeeze = 0.3;
cable_hole_d = 4;
drain_d = 3;

// An access door over each spool in the deck's outer face, to thread the
// cable onto it: the window's width and height and its centre (right spool;
// the left mirrors it), how far the door laps past the window, the door's
// thickness and clearance. The door slides down in 45° dovetails to open,
// into a plain pocket it lifts out of; a lip over its top sheds rain onto
// its face, and water in its side joints runs down the pocket and out. An
// M3x6 through its foot holds it shut.
door_w = 27;
door_h = 36;
door_c = [78.5, 37];
door_lap = 5;
door_t = 3;
door_clear = 0.3;

// The cable's anchor on each spool, reached through the door: a hole down
// through the gear ring beside the core, and an M3x6 and washer beside it
// on the ring's deck face clamping the cable's end; its angle on the spool
anchor_a = 50;
guide_head_cbore = 2;

// JGY-370 worm gearmotor (as in meshtastic-drybag-node, unmeasured): lying
// on the floor output shaft down, length, width, height from its output
// face, shaft from the gearbox's end; D-shaft diameter and length
mot_len = 75;
mot_w = 32;
mot_h = 26;
mot_shaft_in = 16;
shaft_d = 6;
shaft_len = 14;
// A pad the motor sits on, carrying the shaft seal's pocket
seat_h = 3;

// Pinion hub through the floor and its TPU lip seal: hub diameter, the
// seal's outside diameter, height and squeeze per side
pinion_hub_d = 10;
seal_od = 16;
seal_h = 2.5;
shaft_seal_squeeze = 0.4;
// Pin under each pinion into the deck: diameter and depth
pinion_pin_d = 6;
pinion_pin_len = 3.5;

// The antenna pole: 20 mm carbon fibre, its clearance in the socket, the
// socket's wall and depth, and the M4 bolt across socket and pole (its
// diameter and height over the bore's floor)
pole_d = 20;
pole_clear = 0.4;
socket_wall = 4;
socket_depth = 50;
pole_bolt_d = 4.4;
pole_bolt_up = 40;
// A buttress each side of the socket, from its wall out along the top: how
// far out, how tall at the socket, how deep (from the back); zip-tie slots
// through it in pairs (each pair anchors a tie across the socket's back)
buttress_w = 13;
buttress_h = 40;
buttress_d = 20;

// A hood over each antenna connector, screwed to the top wall: room inside
// round the bulkhead and its plug (radius, length out from the wall), wall,
// and its two feet's M3 (thickness under the head)
hood_r = 15;
hood_len = 53;
hood_wall = 2.5;
hood_foot_t = 3;
// END_PARAMS

eps = 0.01;

outer_l = panel_l + 2 * (panel_clear + rim_w);
outer_w = panel_w + 2 * (panel_clear + rim_w);
frame_t = ledge_t + glue_gap + panel_t;
tray_h = tray_floor + tray_inside_h;
groove_w = 2 * gasket_wall + gasket_slot;
tongue_e = groove_e + gasket_wall - seal_squeeze;
tongue_w = gasket_slot + 2 * seal_squeeze;
tongue_len = groove_depth - gasket_floor - 0.3;
pocket_e = rim_w;
opening_e = rim_w + panel_clear + ledge_w;
bezel_e = rim_w + panel_clear + bezel_overlap;
tray_in_e = tray_inset + tray_wall;
inside_l = outer_l - 2 * tray_in_e;
inside_w = outer_w - 2 * tray_in_e;

lane_x = outer_l / 2 - screw_e;
lane_y = outer_w / 2 - screw_e;
screw_nx = ceil(2 * lane_x / screw_pitch);
screw_ny = ceil(2 * lane_y / screw_pitch);
pitch_x = 2 * lane_x / screw_nx;
lane_xs = [for (i = [0:screw_nx]) -lane_x + i * pitch_x];
screws = concat(
  [for (x = lane_xs, s = [-1, 1]) [x, s * lane_y]],
  [for (j = [1:screw_ny - 1], s = [-1, 1]) [s * lane_x, -lane_y + j * 2 * lane_y / screw_ny]]
);

// The wedge, in the lid's frame (y_l, z_l) and the hanging frame (y, z).
// The top wall's outer corner on the back is at the lid's (outer_w / 2,
// tray_h - top_depth); the back is centred on y = 0.
lid_t = 90 - panel_tilt;
lc = cos(lid_t);
ls = sin(lid_t);
back_h = lc * outer_w + ls * (bottom_depth - top_depth);
back_top = back_h / 2;
back_bot = -back_h / 2;
lid_oy = back_top - lc * outer_w / 2 - ls * (tray_h - top_depth);
lid_oz = ls * outer_w / 2 - lc * (tray_h - top_depth);
module lid_frame() {
  translate([0, lid_oy, lid_oz]) rotate([-lid_t, 0, 0]) children();
}
function to_lid(y, z) = [lc * (y - lid_oy) - ls * (z - lid_oz), ls * (y - lid_oy) + lc * (z - lid_oz)];
function from_lid(yl, zl) = [lc * yl + ls * zl + lid_oy, -ls * yl + lc * zl + lid_oz];
// How far (y, z) stands out past the plane of the box's top (the lid's top
// edge, the flange, the top wall), and the y at height z that is g past it
function top_gap(y, z) = to_lid(y, z)[0] - outer_w / 2;
function y_past_top(z, g) = lid_oy + (outer_w / 2 + g + ls * (z - lid_oz)) / lc;
big = 600;

// M3s up through the deck's bands: along the top into the top wall's solid
// band, along the bottom into bosses on the back (clear of the end walls)
deck_pilot = 8;
deck_screw_top = 3.5;
deck_screw_bot = 6;
deck_boss_d = 8;
// (none under a horn's cheeks)
deck_screws = concat(
  [for (x = lane_xs) if (abs(abs(x) - throat_x) >= (brg_w + 2 * race_gap) / 2 + 2 * cheek_t + column_d / 2 + 0.5) [x, back_top - deck_screw_top]],
  [for (x = lane_xs) if (abs(x) < lane_x - 1) [x, back_bot + deck_screw_bot]]
);

// Two N bulkheads (V3 at +x, HC33 at -x) point up out of the top wall either side of the pole,
// each midway between two long-side screws, at the midpoint nearest a third
// of the way along, so the two are spaced evenly; their bodies just under the
// frame. The top wall is solid out to the edge, so each sits in a recess
// down to a wall it can clamp.
ant_x = -lane_x + (round((outer_l / 6 + lane_x) / pitch_x - 0.5) + 0.5) * pitch_x;
n_z = tray_h - n_body_d / 2 - 1.5;
n_hole_d = n_thread_d + n_hole_clear;
// A zip-tie slot: along the tie's width, across its thickness
tie_slot = [tie_w + 0.6, tie_t + 0.9];
top_wall_y = outer_w / 2 - tray_in_e + tray_wall / 2;

assert(groove_e - screw_e >= clear_d / 2 + 1, "groove too close to the screws");
assert(groove_e + groove_w <= pocket_e - 0.5, "groove runs into the panel pocket");
assert(groove_depth <= frame_t - 2, "groove leaves too little frame above it");
assert(tongue_e >= tray_inset + 0.5 && tongue_e + tongue_w <= tray_in_e - 0.5, "tongue doesn't sit on the tray wall");
assert(n_z + n_body_d / 2 <= tray_h, "bulkhead's body hits the frame");
n_recess_d = n_body_d + 2;
assert(from_lid(outer_w / 2 - tray_inset, n_z - n_recess_d / 2)[1] >= 1, "a bulkhead's recess runs out past the back");
assert(from_lid(outer_w / 2 - tray_in_e - n_back_len, n_z - n_thread_d / 2)[1] >= tray_floor + 1, "bulkhead's back hits the back");
assert(sqrt(2) * n_hole_d / 2 < n_body_d / 2, "hole's 45° peak shows past the bulkhead");
assert(tray_wall <= n_panel, "wall too thick for the bulkhead");
assert(pitch_x / 2 - pilot_d / 2 - 1 >= n_recess_d / 2, "a bulkhead's recess runs into a screw's pilot");
assert(flange_h >= pilot_depth + 1.5, "the flange is too shallow for the pilots");
assert(lane_x * 2 / screw_nx <= screw_pitch && lane_y * 2 / screw_ny <= screw_pitch);

// Outline inset e from the outer edge
module plan(e) {
  r = max(corner_r - e, 0.5);
  offset(r) square([outer_l - 2 * e - 2 * r, outer_w - 2 * e - 2 * r], center = true);
}

module band(e0, e1) {
  difference() {
    plan(e0);
    plan(e1);
  }
}

// Panel-sized outline grown by g each side
module panel_plan(g) {
  square([panel_l + 2 * g, panel_w + 2 * g], center = true);
}

// A horizontal hole along +X, peaked at 45° up the print with its tip cut
// to a short bridge.
module teardrop_x(d, len) {
  rotate([0, 90, 0]) linear_extrude(len, center = true) rotate(90) intersection() {
    hull() {
      circle(d = d);
      rotate(45) square(d / 2);
    }
    translate([-d, -d]) square([d / 2 + 0.5 + d, 2 * d]);
  }
}

// ---- tray: walls square to the lid, run back to the plumb back and the
// flat bottom, under a flange round the rim for the lid's screws. The
// flange's underside chamfers 45° back to the wall, since flat it would
// overhang 50° as printed back down. The top wall is solid out to the edge
// all the way back, which takes the deck's top screws.

// The hanging frame's half-space in front of the back and above the bottom
module box_clip() {
  translate([-big, back_bot, 0]) cube(2 * big);
}

// What lies under the lid's outline e in from its edge, down to the back
module under_lid(e) {
  lid_frame() translate([0, 0, -big]) linear_extrude(big + tray_h) plan(e);
}

module tray() {
  difference() {
    union() {
      intersection() {
        box_clip();
        union() {
          lid_frame() {
            translate([0, 0, -big]) linear_extrude(big + tray_h) band(tray_inset, tray_in_e);
            difference() {
              hull() {
                translate([0, 0, tray_h - flange_h]) linear_extrude(flange_h) plan(0);
                translate([0, 0, tray_h - flange_h - tray_inset]) linear_extrude(eps) plan(tray_inset);
              }
              translate([0, 0, -1]) linear_extrude(tray_h + 2) plan(tray_in_e);
            }
          }
          intersection() {
            under_lid(tray_inset);
            union() {
              cube([2 * big, 2 * big, 2 * tray_floor], center = true);
              translate([-big, back_bot, 0]) cube([2 * big, tray_floor, big]);
            }
          }
          lid_frame() translate([0, 0, -big]) linear_extrude(big + tray_h) intersection() {
            plan(0);
            translate([-big, outer_w / 2 - tray_in_e]) square(2 * big);
          }
        }
      }
      // tongue, its tip narrowed to lead it into the gasket
      lid_frame() translate([0, 0, tray_h - eps]) {
        linear_extrude(tongue_len - 0.5 + eps) band(tongue_e, tongue_e + tongue_w);
        translate([0, 0, tongue_len - 0.5]) linear_extrude(0.5) band(tongue_e + 0.25, tongue_e + tongue_w - 0.25);
      }
      translate([0, 0, tray_floor - eps]) brackets();
      for (p = shelf_posts) translate([p[0], p[1], tray_floor - eps]) cylinder(d = post_d, h = post_h + eps);
      for (k = [0, 1]) motor_seat(k);
      for (p = deck_screws) if (p[1] < 0) translate([p[0], p[1], tray_floor - eps]) cylinder(d = deck_boss_d, h = deck_pilot + 1.5 - tray_floor + eps, $fn = 32);
      pole_socket();
    }
    for (k = [0, 1]) motor_seat_cut(k);
    for (c = spool_c) translate([c[0], c[1], -1]) cylinder(d = brg_bore + 0.3, h = pin_socket + 1, $fn = 32);
    for (p = deck_screws) translate([p[0], p[1], -1]) cylinder(d = pilot_d, h = deck_pilot + 1);
    lid_frame() {
      for (x = [-ant_x, ant_x]) {
        translate([x, top_wall_y, n_z]) rotate(90) teardrop_x(n_hole_d, tray_wall + 2);
        translate([x, outer_w / 2 - tray_inset / 2 + 0.5, n_z]) rotate(90) teardrop_x(n_recess_d, tray_inset + 1);
      }
      for (p = screws) translate([p[0], p[1], tray_h - pilot_depth]) cylinder(d = pilot_d, h = pilot_depth + 1);
    }
    for (k = [0, 1], z = hood_feet_z) at_hood(k) translate([hood_foot_x, -7, z]) rotate([-90, 0, 0]) cylinder(d = pilot_d, h = 8);
    for (p = shelf_posts) translate([p[0], p[1], shelf_z - shelf_pilot_depth]) cylinder(d = pilot_d, h = shelf_pilot_depth + 1);
    pole_bore();
    for (m = [0, 1], x = horn_feet_x, zl = foot_bolt_zl) mirror([m, 0, 0]) lid_frame() translate([x, outer_w / 2 - 7.5, zl]) rotate([-90, 0, 0]) cylinder(d = horn_pilot_d, h = 8.5, $fn = 20);
    for (p = horn_bolts) translate([p[0], p[1], -1]) cylinder(d = horn_pilot_d, h = 8, $fn = 20);
  }
}

// ---- the pole's socket: standing on the top wall's outside face, its axis
// plumb at x = 0, between the cables. Printed with the tray (back down) it
// lies along the bed, so it's flat underneath down to the bed and peaked on
// top, trimmed under the frame. The bore stops above the face, so the box
// stays sealed; the coax leaves the pole above the socket for the bulkheads.
pole_r = (pole_d + pole_clear) / 2;
socket_r = pole_r + socket_wall;
pole_z = socket_r;
// Where the top wall's outside face is at height z
function top_face_y(z) = y_past_top(z, 0);
bore_bot = top_face_y(pole_z + pole_r) + 3;
socket_top = bore_bot + socket_depth;
frame_rear_z = from_lid(outer_w / 2, tray_h)[1];

module pole_profile(r, z_max, to_bed) {
  intersection() {
    hull() {
      translate([0, pole_z]) circle(r = r, $fn = 64);
      translate([0, pole_z]) rotate(45) square(r);
      if (to_bed) translate([-r, 0]) square([2 * r, pole_z]);
    }
    translate([-big, 0]) square([2 * big, z_max]);
  }
}

// The buttresses' top at the socket, and each zip-tie slot pair's height
buttress_top = top_face_y(buttress_d) + buttress_h;
tie_xs = [socket_r + 3.5, socket_r + buttress_w - 3.5];
tie_ys = [for (y = [top_face_y(buttress_d) + 4 : 10 : buttress_top]) if (y + tie_slot[0] / 2 + 2 <= buttress_top - (tie_xs[1] - socket_r + 1)) y];

module pole_socket() {
  intersection() {
    union() {
      translate([0, socket_top, 0]) rotate([90, 0, 0]) linear_extrude(socket_top - top_face_y(0) + 1) pole_profile(socket_r, frame_rear_z - 1, true);
      for (m = [0, 1]) mirror([m, 0, 0]) linear_extrude(buttress_d) polygon([
        [socket_r - 1, top_face_y(0) - 1], [socket_r + buttress_w, top_face_y(0) - 1],
        [socket_r + buttress_w, buttress_top - buttress_w - 1], [socket_r - 1, buttress_top]]);
    }
    lid_frame() translate([-big, outer_w / 2 - eps, -big]) cube(2 * big);
  }
}

module pole_tie_slots() {
  for (m = [0, 1], x = tie_xs, y = tie_ys) mirror([m, 0, 0]) translate([x, y, -1]) linear_extrude(buttress_d + 2) offset(0.5) offset(-0.5) square([tie_slot[1], tie_slot[0]], center = true);
}

module pole_bore() {
  translate([0, socket_top + 1, 0]) rotate([90, 0, 0]) linear_extrude(socket_depth + 1) pole_profile(pole_r, pole_z + pole_r + 2, false);
  translate([0, bore_bot + pole_bolt_up, pole_z]) teardrop_x(pole_bolt_d, 2 * socket_r + 2);
  pole_tie_slots();
}

assert(bore_bot + pole_bolt_up - pole_bolt_d / 2 > buttress_top + 1, "the pole's bolt runs into a buttress");
assert(bore_bot + pole_bolt_up + pole_bolt_d < socket_top - 5, "the pole's bolt is too near the socket's top");
assert(buttress_d < frame_rear_z - 1, "a buttress runs into the frame");
assert(len(tie_ys) >= 2, "no room for the socket's zip-tie slots");

// ---- connector hoods: a box over each bulkhead and its plug, open toward
// the wall and down the back (both face down as it hangs), its end and front
// faces roofing it. Modelled at the connector (x = 0, axis along +y from the
// wall's face). Two feet on the outboard side take M3s into the top wall.
// It reaches past the lid's top edge, resting on the frame's back face
// without fixing to it, so the lid still lifts off. Printed open face down.
hood_feet_z = [-10, 8];
hood_foot_x = hood_r + hood_wall + 4;

module hood() {
  difference() {
    union() {
      translate([-hood_r - hood_wall, 0, -hood_r - hood_wall]) cube([2 * (hood_r + hood_wall), hood_len + hood_wall, 2 * (hood_r + hood_wall)]);
      for (z = hood_feet_z) translate([hood_r + hood_wall - eps, 0, z - 4]) cube([8 + eps, hood_foot_t, 8]);
    }
    translate([-hood_r, -1, -hood_r - hood_wall - 1]) cube([2 * hood_r, hood_len + 1, 2 * hood_r + hood_wall + 1]);
    for (z = hood_feet_z) translate([hood_foot_x, -1, z]) rotate([-90, 0, 0]) cylinder(d = clear_d, h = hood_foot_t + 2);
  }
}

module hood_print() {
  rotate([90, 0, 0]) hood();
}

// k = 0 over the N, 1 over the SMA; each hood's feet outboard
module at_hood(k) {
  lid_frame() translate([(1 - 2 * k) * ant_x, outer_w / 2, n_z]) mirror([k, 0, 0]) children();
}

module hood_in_place(k) {
  at_hood(k) hood();
}

for (z = hood_feet_z) assert(n_z + z + 4 < tray_h - 1, "a hood's foot runs onto the lid");
assert(ant_x - hood_r - hood_wall > socket_r + buttress_w + 1, "a hood runs into the socket's buttress");
assert(n_z - hood_r - hood_wall > tray_h - top_depth, "a hood runs past the back");
for (x = lane_xs) assert(abs(ant_x + hood_foot_x - abs(x)) >= pilot_d + 1, "a hood's foot pilot runs into a lid screw's");

assert(ant_x - n_body_d / 2 >= socket_r + 1, "the pole's socket runs into a bulkhead");

// L-shaped corner brackets round a part of size l x w centred at (x, y)
module corner_brackets(x, y, l, w, h) {
  gl = l / 2 + bracket_clear;
  gw = w / 2 + bracket_clear;
  translate([x, y, 0]) for (sx = [-1, 1], sy = [-1, 1]) scale([sx, sy, 1]) translate([gl, gw, 0]) {
    translate([-bracket_leg, 0, 0]) cube([bracket_leg + bracket_wall, bracket_wall, h]);
    translate([0, -bracket_leg, 0]) cube([bracket_wall, bracket_leg + bracket_wall, h]);
  }
}

// Half the room a part takes between its brackets, beyond its own half size
bracket_out = bracket_clear + bracket_wall;

// The stack lies along the bottom of the back, centred: u along X, v along
// Y, its lower edge just above the deck's bottom bosses. On the plate, between the
// posts' bosses, the row nearer the bottom holds the HC33 (on the SMA's side)
// and the charger; the upper row the buck-boost and the V3 (on the N's side).
// Each board has a band beside each long side, outside its brackets, for its
// zip ties' slots.
shelf_boss_d = cbore_d + 2.4;
board_gap = 2;
tie_band = 0.3 + tie_slot[1] + 1.5;
shelf_l = bat_l + 2 * (bracket_out + post_d);
shelf_w = max(bat_w + 2 * (bracket_out + 0.5), hc33_w + heltec_w + 4 * (bracket_out + tie_band));
stack_y = back_bot + deck_screw_bot + deck_boss_d / 2 + 1 + shelf_w / 2;
shelf_z = tray_floor + bat_t + shelf_gap;
post_h = shelf_z - tray_floor;
post_uv = [for (su = [-1, 1], sv = [-1, 1]) [su * (bat_l / 2 + bracket_out + post_d / 2), sv * (bat_w / 2 - 8)]];
shelf_posts = [for (q = post_uv) [q[0], stack_y + q[1]]];

module at_stack() {
  translate([0, stack_y, 0]) children();
}

board_end = bat_l / 2 + post_d / 2 - shelf_boss_d / 2 - 1;
row_a = -shelf_w / 2 + tie_band + bracket_out;
row_b = shelf_w / 2 - tie_band - bracket_out;
hc33_u = -board_end + hc33_l / 2;
hc33_v = row_a + hc33_w / 2;
charger_u = board_end - charger_l / 2;
charger_v = row_a + charger_w / 2;
heltec_u = board_end - heltec_l / 2;
heltec_v = row_b - heltec_w / 2;
buck_u = -board_end + buck_l / 2;
buck_v = row_b - buck_w / 2;
// [u, v, length, width] of each board on the plate
boards = [[hc33_u, hc33_v, hc33_l, hc33_w], [charger_u, charger_v, charger_l, charger_w], [heltec_u, heltec_v, heltec_l, heltec_w], [buck_u, buck_v, buck_l, buck_w]];
// Two ties across a long board, one across a short one
function tie_us(u, l) = l > 40 ? [u - l / 4, u + l / 4] : [u];

module tie_slots() {
  for (b = boards, tu = tie_us(b[0], b[2]), sv = [-1, 1])
    translate([tu, b[1] + sv * (b[3] / 2 + bracket_out + 0.3 + tie_slot[1] / 2)]) offset(0.5) offset(-0.5) square(tie_slot, center = true);
}

module brackets() {
  at_stack() corner_brackets(0, 0, bat_l, bat_w, bat_bracket_h);
}

module shelf_brackets() {
  corner_brackets(hc33_u, hc33_v, hc33_l, hc33_w, bracket_h);
  corner_brackets(charger_u, charger_v, charger_l, charger_w, bracket_h);
  corner_brackets(heltec_u, heltec_v, heltec_l, heltec_w, bracket_h);
  corner_brackets(buck_u, buck_v, buck_l, buck_w, bracket_h);
}

assert(shelf_l / 2 < inside_l / 2 - 1, "plate runs into the end walls");
assert(hc33_u + hc33_l / 2 + 2 * bracket_out + board_gap <= charger_u - charger_l / 2, "HC33 and charger overlap");
assert(buck_u + buck_l / 2 + 2 * bracket_out + board_gap <= heltec_u - heltec_l / 2, "buck-boost and V3 overlap");
assert(max(hc33_v + hc33_w / 2, charger_v + charger_w / 2) + 2 * (bracket_out + tie_band) <= min(heltec_v - heltec_w / 2, buck_v - buck_w / 2), "the plate's rows' tie slots overlap");
for (b = boards, tu = tie_us(b[0], b[2])) assert(abs(tu - b[0]) + tie_slot[0] / 2 < b[2] / 2 - bracket_leg - 1, "a tie slot runs into its board's brackets");
// The lid is the ceiling
assert(to_lid(stack_y + shelf_w / 2, shelf_z + shelf_t + max(heltec_h, hc33_under + hc33_t + hc33_over))[1] + 1 <= tray_h, "a board on the plate hits the lid");

// ---- carrier plate: on the four posts, printed as modelled; its screws sit
// in counterbored bosses, and zip-tie slots go through it beside each board

module shelf() {
  at_stack() difference() {
    union() {
      linear_extrude(shelf_t) offset(2) offset(-2) square([shelf_l, shelf_w], center = true);
      for (q = post_uv) translate([q[0], q[1], 0]) cylinder(d = shelf_boss_d, h = shelf_t + cbore_h);
      translate([0, 0, shelf_t - eps]) shelf_brackets();
    }
    for (q = post_uv) translate([q[0], q[1], 0]) {
      translate([0, 0, -1]) cylinder(d = clear_d, h = shelf_t + cbore_h + 2);
      translate([0, 0, shelf_t]) cylinder(d = cbore_d, h = cbore_h + 1);
    }
    translate([0, 0, -1]) linear_extrude(shelf_t + 2) tie_slots();
  }
}

module shelf_in_place() {
  translate([0, 0, shelf_z]) shelf();
}


// ---- winch

function pitch_r(z) = gear_m * z / 2;
function tip_r(z) = gear_m * (z + 2) / 2;
function root_r(z) = pitch_r(z) - 1.25 * gear_m;

spool_rg = pitch_r(spool_z);
spool_tip = tip_r(spool_z);
flange_r = root_r(spool_z) - 1;
fill_r = flange_r - fill_margin;
hub_r = brg_od / 2 + hub_wall;
// Whole turns side by side in the channel, whole layers from the core out to
// fill_r; the core is the largest (in 0.5 mm steps) that still takes
// cable_len x wind_margin wound in even layers.
wraps = floor(bay_w / cable_d);
function layers(r0) = floor((fill_r - r0) / cable_d);
function capacity(r0) = let(n = layers(r0)) wraps * 2 * PI * n * (r0 + n * cable_d / 2);
core_r = max([for (r = [hub_r + core_wall + 4 : 0.5 : fill_r]) if (capacity(r) >= cable_len * wind_margin) r]);
assert(capacity(hub_r + core_wall + 4) >= cable_len * wind_margin, "the spool can't hold the cable");
level_h = spool_gear_w + bay_w + cap_t;

// The spools side by side, k = 0 at -X and k = 1 at +X, as high as the
// deck's band and the guide bearings above their outer sides allow.
spool_x = spool_tip + spool_gap / 2;
guide_x = throat_x + cable_d / 2 + brg_od / 2;
guide_y = back_top - deck_screw_top - column_d / 2 - 1 - shroud_wall - shroud_gap - brg_od / 2;
spool_y = min(back_top - deck_band - 2 - spool_tip, guide_y - sqrt(pow(spool_tip + brg_od / 2 + spin_gap, 2) - pow(guide_x - spool_x, 2)));
spool_c = [[-spool_x, spool_y], [spool_x, spool_y]];
z_s0 = -spin_gap - level_h;
level_z0 = [z_s0, z_s0];
deck_z1 = z_s0 - spin_gap;
deck_z0 = deck_z1 - deck_t;

// Pinions below each spool on its outer side. Each motor lies along Y,
// gearbox end toward -Y, as far out as the end walls allow. The two trains
// mirror each other.
mesh_d = spool_rg + pitch_r(pinion_z);
pin_x = inside_l / 2 - bracket_out - 1 - mot_w / 2;
pin_y = spool_y - sqrt(mesh_d * mesh_d - pow(pin_x - spool_x, 2));
pinion_c = [[-pin_x, pin_y], [pin_x, pin_y]];
pinion_post_d = 12;
// Each pinion turned so its teeth fall between the spool's (spool at 0°)
function mesh_phase(psi_a, za, zb, th) = th + 180 - 180 / zb - (psi_a - th) * za / zb;
pinion_th = [for (k = [0, 1]) let(d = pinion_c[k] - spool_c[k]) atan2(d[1], d[0])];
pinion_psi = [for (k = [0, 1]) mesh_phase(0, spool_z, pinion_z, pinion_th[k])];
mot_face_z = tray_floor + seat_h;

// The cable's guides, right corner (the left mirrors it): the upright guide
// bearing beside the cable, outboard; the edge bearing [y, z] the cable
// climbs the back of and turns forward over, just clear of the box's top;
// the horn's two throat bearings [y, z], as low as clearing the top lets
// them; each cheek's x, and the horn's extent.
guide_c = [guide_x, guide_y];
guide_z0 = -0.7 - brg_w;
cable_z = z_s0 + spool_gear_w + bay_w / 2;
cable_rr = brg_od / 2 + cable_d / 2;
edge_c = [y_past_top(cable_z + cable_rr, cable_rr + horn_clear), cable_z + cable_rr];
horn_y = y_past_top(hang_z + horn_gap / 2 + brg_od / 2, brg_od / 2 + horn_clear);
horn_cs = [[horn_y, hang_z - horn_gap / 2 - brg_od / 2], [horn_y, hang_z + horn_gap / 2 + brg_od / 2]];
horn_w = brg_w + 2 * race_gap;
cheek_x = [for (t = [-1, 1]) throat_x + t * (horn_w + cheek_t) / 2];
horn_y0 = guide_y + brg_od / 2 + shroud_gap + shroud_wall + 0.5;
// The horn's two bolts through the deck, one up each cheek
horn_bolts = [for (m = [-1, 1], x = cheek_x) [m * x, (horn_y0 + back_top) / 2]];
horn_y1 = horn_y + brg_od / 2 + horn_wall;
horn_z1 = horn_cs[1][1] + brg_od / 2 + horn_wall;

assert(core_r - core_wall > hub_r + 4, "no room for the web between hub and core");
assert(spool_x + spool_tip <= outer_l / 2 - deck_band - spin_gap, "spools run into the deck's end bands");
assert(abs(pin_x - spool_x) < mesh_d, "the pinion can't reach its spool");
assert(pin_x - mot_w / 2 - bracket_out - 1 > shelf_l / 2, "a motor runs into the battery stack");
assert(pin_y - mot_shaft_in - bracket_out - 0.5 > back_bot + deck_screw_bot + deck_boss_d / 2, "a motor runs into the deck's bottom bosses");
mot_top_y = pin_y + mot_len - mot_shaft_in + bracket_out;
assert(to_lid(mot_top_y, mot_face_z)[0] < outer_w / 2 - tray_in_e - 1, "a motor runs into the top wall");
assert(to_lid(mot_top_y, mot_face_z + mot_h)[1] < tray_h - 1, "a motor hits the lid");
assert(norm(guide_c - spool_c[1]) >= spool_tip + brg_od / 2 + spin_gap, "the guide bearing runs into a spool");
for (p = deck_screws) assert(norm(guide_c - p) >= brg_od / 2 + column_d / 2 + 1, "the guide bearing runs into a deck pillar");
assert(guide_c[0] + brg_od / 2 <= outer_l / 2, "the guide bearing sticks out past the end");
assert(guide_c[1] + brg_od / 2 + 1 <= horn_y0, "the guide bearing runs into the horn");
assert(guide_z0 - 0.5 > deck_z1 + 1, "no room under the guide bearing");
assert(edge_c[1] - brg_od / 2 > deck_z1 + 1, "the edge bearing runs into the deck");
// The cable climbs from the edge bearing to the throat steeper than the top slopes
assert((horn_cs[0][0] - edge_c[0]) * lc > (horn_cs[0][1] - edge_c[1]) * ls, "the cable to the throat runs into the box's top");
for (p = deck_screws, x = cheek_x) assert(p[1] < 0 || abs(abs(p[0]) - x) >= cheek_t / 2 + column_d / 2 + 0.5 || p[1] + column_d / 2 < horn_y0, "a cheek runs into a deck pillar");
for (x = cheek_x) assert(abs(x) + cheek_t / 2 < outer_l / 2, "a horn sticks out past the end");
assert(back_top - deck_band - spool_tip - spool_y > spin_gap, "spools run into the deck screws' band");
assert(shaft_len > mot_face_z + spin_gap, "the motor shaft doesn't reach below the floor");
assert(pitch_r(pinion_z) - 1.25 * gear_m > pinion_pin_d / 2 + 1.5, "pinion too small for its pin");

// Involute spur gear, 20° pressure angle, a little backlash.
module gear_2d(z) {
  rp = pitch_r(z);
  rb = rp * cos(20);
  ra = tip_r(z);
  up = sqrt(pow(rp / rb, 2) - 1);
  ua = sqrt(pow(ra / rb, 2) - 1);
  half = 90 / z + (up * 180 / PI - atan(up)) - 0.08 / rp * 180 / PI;
  n = 6;
  flank = [for (i = [0 : n]) let(u = ua * i / n, a = half - (u * 180 / PI - atan(u))) rb * sqrt(1 + u * u) * [cos(a), sin(a)]];
  circle(r = root_r(z), $fn = 4 * z);
  for (k = [0 : z - 1]) rotate(k * 360 / z)
    polygon(concat([[0, 0]], flank, [for (i = [n : -1 : 0]) [flank[i][0], -flank[i][1]]]));
}

// Spool body, printed gear down: the toothed ring, a web to the hub, the
// hub with the bearing pressed in from below under a 45° lip. Six M3x6 up
// through the gear ring hold the cap.
cap_screw_r = core_r - core_wall / 2;
module spool_body() {
  difference() {
    union() {
      linear_extrude(spool_gear_w) difference() {
        gear_2d(spool_z);
        circle(r = core_r - core_wall, $fn = 180);
      }
      cylinder(r = core_r - core_wall + eps, h = web_t, $fn = 180);
      cylinder(r = hub_r, h = level_h - 0.5, $fn = 64);
    }
    translate([0, 0, -1]) cylinder(d = brg_od - brg_press, h = brg_w + 1, $fn = 64);
    translate([0, 0, brg_w - eps]) cylinder(d1 = brg_od - brg_press, d2 = brg_shoulder_d + 6, h = (brg_od - brg_shoulder_d - 6) / 2, $fn = 64);
    cylinder(d = brg_shoulder_d + 6, h = level_h, $fn = 64);
    for (a = [0 : 60 : 300]) rotate(a) translate([cap_screw_r, 0, 0]) {
      translate([0, 0, -1]) cylinder(d = clear_d, h = spool_gear_w + 2);
      translate([0, 0, -1]) cylinder(d = cbore_d, h = 1 + spool_gear_w - 1.8);
    }
    // the cable's anchor: down through the ring at the channel's floor, and
    // the clamp screw's pilot beside it, from below
    rotate(anchor_a) {
      translate([anchor_r, 0, -1]) cylinder(d = 1.6, h = spool_gear_w + 2, $fn = 12);
      translate([anchor_r + 5, 0, -1]) cylinder(d = pilot_d, h = spool_gear_w, $fn = 16);
    }
  }
}
anchor_r = core_r + cable_d / 2 + 0.4;

// Spool cap, modelled in place on the body (print it flipped, flange down):
// the core ring the cable winds on, and the top flange. A hole through the
// core takes the cable's end.
module spool_cap() {
  difference() {
    union() {
      translate([0, 0, spool_gear_w]) linear_extrude(bay_w + eps) difference() {
        circle(r = core_r, $fn = 180);
        circle(r = core_r - core_wall, $fn = 180);
      }
      translate([0, 0, spool_gear_w + bay_w]) linear_extrude(cap_t) difference() {
        circle(r = flange_r, $fn = 180);
        circle(r = core_r - core_wall, $fn = 180);
      }
    }
    for (a = [0 : 60 : 300]) rotate(a) translate([cap_screw_r, 0, spool_gear_w - 1]) cylinder(d = pilot_d, h = bay_w + cap_t);
  }
}

module spool_cap_print() {
  translate([0, 0, level_h]) mirror([0, 0, 1]) spool_cap();
}

// The left spool turned 16 teeth, so as drawn each anchor is in its door
spool_turn = [16 * 360 / spool_z, 0];
module spool_in_place(k) {
  translate([spool_c[k][0], spool_c[k][1], level_z0[k]]) rotate(spool_turn[k]) {
    spool_body();
    spool_cap();
  }
}

// Pinion, printed teeth down: teeth at its spool's gear
// level, hub up through the floor's seal to just under the motor's face,
// D-bore for the shaft, socket below for the deck's pin.
pinion_top = mot_face_z - 0.5;
module pinion() {
  z0 = z_s0;
  difference() {
    union() {
      linear_extrude(spool_gear_w) gear_2d(pinion_z);
      cylinder(d = pinion_hub_d, h = pinion_top - z0, $fn = 48);
    }
    translate([0, 0, pinion_top - z0 - shaft_len - 0.5]) linear_extrude(shaft_len + 1) intersection() {
      circle(d = shaft_d + 0.2, $fn = 32);
      translate([-(shaft_d + 0.2) / 2, -(shaft_d + 0.2) / 2]) square([shaft_d + 0.2, shaft_d - 1 + 0.1]);
    }
    translate([0, 0, -1]) cylinder(d = pinion_pin_d + 0.4, h = pinion_pin_len + 1.5, $fn = 32);
  }
}

module pinion_in_place(k) {
  translate([pinion_c[k][0], pinion_c[k][1], level_z0[k]]) rotate(pinion_psi[k]) pinion();
}

// The shaft seal: TPU, pressed into the pocket in the motor's seat, its
// bore gripping the pinion's hub.
module shaft_seal() {
  difference() {
    cylinder(d = seal_od, h = seal_h, $fn = 64);
    translate([0, 0, -1]) cylinder(d = pinion_hub_d - 2 * shaft_seal_squeeze, h = seal_h + 2, $fn = 48);
  }
}

module shaft_seal_in_place(k) {
  translate([pinion_c[k][0], pinion_c[k][1], mot_face_z - seal_h]) shaft_seal();
}

// Motor k's footprint on the floor: along Y, gearbox end toward -Y.
module motor_plan(k, g = 0) {
  translate(pinion_c[k]) translate([-mot_w / 2 - g, -mot_shaft_in - g]) square([mot_w + 2 * g, mot_len + 2 * g]);
}

// Motor k's centre on the floor
function motor_c(k) = pinion_c[k] + [0, mot_len / 2 - mot_shaft_in];

module motor_seat(k) {
  translate([0, 0, tray_floor - eps]) linear_extrude(seat_h + eps) motor_plan(k, 0.5);
  translate([0, 0, mot_face_z - eps]) corner_brackets(motor_c(k)[0], motor_c(k)[1], mot_w, mot_len, bracket_h + 3);
}

module motor_seat_cut(k) {
  translate([pinion_c[k][0], pinion_c[k][1], mot_face_z - seal_h]) cylinder(d = seal_od, h = seal_h + 1, $fn = 64);
  translate([pinion_c[k][0], pinion_c[k][1], -1]) cylinder(d = pinion_hub_d + 0.6, h = mot_face_z + 1, $fn = 48);
}

// Deck behind the tray, printed plate down: a plate under the whole back,
// the spools' posts (a shoulder for the bearing's inner race, then its 8 mm
// pin up into a socket in the back), the pinions' pins, pads under the guide
// bearings tapped for their M8s, the horns, the enclosure, and pillars up to
// the back.
// The back's outline, e in from its edge
module back_plan(e) {
  r = max(corner_r - e, 0.5);
  offset(r) square([outer_l - 2 * e - 2 * r, back_h - 2 * e - 2 * r], center = true);
}

module deck_plan() {
  back_plan(0);
}

// A horn, right corner, in the hanging frame; its own part. The cheeks stand
// on the deck's top band and rise past the back's top edge, trimmed 0.3 mm
// off the box (its back below the top edge, the plane of its sloping top
// above it). Solid between the cheeks up to just under the cable; the bridge
// joins them in front of the front throat bearing. A foot either side of
// the cheeks lies on the box's sloping top. The three bearings' bolt holes,
// with a boss round each on the cheeks' inner faces that clamps the inner
// race and keeps the outer race off the cheek. Printed as it stands, its
// foot on the bed.
horn_x0 = cheek_x[0] - cheek_t / 2;
horn_x1 = cheek_x[1] + cheek_t / 2;
module horn() {
  difference() {
    intersection() {
      union() {
        for (x = cheek_x) translate([x - cheek_t / 2, horn_y0, deck_z1]) cube([cheek_t, horn_y1 - horn_y0, horn_z1 - deck_z1]);
        translate([cheek_x[0], horn_y0, deck_z1]) cube([cheek_x[1] - cheek_x[0], horn_y1 - horn_y0, cable_z - web_gap - deck_z1]);
        translate([cheek_x[0], horn_y0, horn_z1 - horn_wall]) cube([cheek_x[1] - cheek_x[0], horn_y1 - horn_y0, horn_wall]);
        for (c = concat([edge_c], horn_cs)) translate([throat_x, c[0], c[1]]) rotate([0, 90, 0]) cylinder(d = brg_shoulder_d, h = horn_w + 0.01, center = true, $fn = 32);
        // the feet, on the sloping top
        intersection() {
          lid_frame() for (x = [[horn_x0 - foot_w, horn_x0 + 1], [horn_x1 - 1, horn_x1 + foot_w]]) translate([x[0], outer_w / 2, -big]) cube([x[1] - x[0], foot_t, big + foot_bolt_zl[1] + 6]);
          translate([-big, horn_y0, deck_z1]) cube(2 * big);
        }
      }
      difference() {
        translate([-big, -big, deck_z1]) cube(2 * big);
        intersection() {
          lid_frame() translate([-big, -big, -big]) cube([2 * big, big + outer_w / 2 + 0.3, 2 * big]);
          translate([-big, -big, -0.3]) cube(2 * big);
        }
      }
    }
    for (c = concat([edge_c], horn_cs)) translate([throat_x, c[0], c[1]]) {
      teardrop_x(8.4, horn_w + 2 * cheek_t + 2);
      rotate([0, 90, 0]) cylinder(d = brg_od + 2 * race_gap, h = brg_w, center = true, $fn = 64);
    }
    for (x = cheek_x) translate([x, (horn_y0 + back_top) / 2, deck_z1 - 1]) cylinder(d = horn_bolt_clear, h = -deck_z1 + 2, $fn = 24);
    for (x = horn_feet_x, zl = foot_bolt_zl) lid_frame() translate([x, outer_w / 2 - 1, zl]) rotate([-90, 0, 0]) cylinder(d = horn_bolt_clear, h = foot_t + 2, $fn = 24);
  }
}
horn_feet_x = [horn_x0 - foot_w / 2, horn_x1 + foot_w / 2];

module horn_in_place(m) {
  mirror([m, 0, 0]) horn();
}

module horn_print() {
  translate([-throat_x, -horn_y0, -deck_z1]) horn();
}

assert(horn_y0 >= encl_y1 + shroud_wall + 0.5, "a horn runs into the enclosure");
for (x = horn_feet_x, zl = foot_bolt_zl) assert(from_lid(outer_w / 2 - 7.5, zl - horn_bolt_clear / 2)[1] > tray_floor, "a horn foot's pilot runs past the back");
for (x = horn_feet_x, l = lane_xs) assert(abs(x - abs(l)) > 5 || foot_bolt_zl[1] + 3 < tray_h - pilot_depth, "a horn foot's pilot runs into a lid screw's");
assert(horn_feet_x[0] - foot_w / 2 > ant_x + hood_foot_x + 5, "a horn's foot runs into a hood's foot");
assert(horn_feet_x[1] + foot_w / 2 < outer_l / 2 - 1, "a horn's foot runs off the end");

// ---- shroud: the region it closes round (both spools' and pinions' teeth
// plus shroud_gap), its wall, and the seal strip on the wall's top
shroud_top = -(shroud_seal_h - shroud_groove_d - shroud_squeeze);

encl_x = max(spool_x + spool_tip, guide_c[0] + brg_od / 2) + shroud_gap;
encl_y1 = max(spool_y + spool_tip, guide_c[1] + brg_od / 2) + shroud_gap;
encl_y0 = min(spool_y - spool_tip, pin_y - tip_r(pinion_z)) - shroud_gap;

module shroud_inside() {
  translate([-encl_x, encl_y0]) offset(2) offset(-2) square([2 * encl_x, encl_y1 - encl_y0]);
}

module shroud_wall_2d() {
  difference() {
    offset(r = shroud_wall) shroud_inside();
    shroud_inside();
  }
}

module shroud_seal_2d() {
  difference() {
    offset(r = (shroud_wall + shroud_groove_w) / 2) shroud_inside();
    offset(r = (shroud_wall - shroud_groove_w) / 2) shroud_inside();
  }
}

// The seal strip: TPU 85A, printed flat, laid in the groove.
module shroud_seal() {
  linear_extrude(shroud_seal_h) shroud_seal_2d();
}

module shroud_seal_in_place() {
  translate([0, 0, shroud_top - shroud_groove_d]) shroud_seal();
}

module deck() {
  difference() {
    union() {
      linear_extrude(deck_t) deck_plan();
      for (p = deck_screws) translate([p[0], p[1], deck_t - eps]) cylinder(d = column_d, h = -deck_z1 + eps);
      for (c = spool_c) translate([c[0], c[1], deck_t - eps]) {
        cylinder(d = brg_shoulder_d, h = z_s0 - deck_z1 + eps, $fn = 48);
        cylinder(d = brg_bore - 0.15, h = pin_socket - 0.3 - deck_z1, $fn = 32);
      }
      for (c = pinion_c) translate([c[0], c[1], deck_t - eps]) {
        cylinder(d = pinion_post_d, h = z_s0 - 0.5 - deck_z1 + eps, $fn = 32);
        cylinder(d = pinion_pin_d, h = z_s0 - deck_z1 + pinion_pin_len, $fn = 32);
      }
      // Guide bearings: a pad filling under each to half a millimetre from
      // its outer race, and a shoulder for the inner race
      for (m = [0, 1]) mirror([m, 0, 0]) translate([guide_c[0], guide_c[1], deck_t - eps]) {
        cylinder(d = brg_od - 1, h = guide_z0 - 0.5 - deck_z1 + eps, $fn = 64);
        cylinder(d = brg_shoulder_d, h = guide_z0 - deck_z1 + eps, $fn = 48);
      }
      translate([0, 0, deck_t - eps]) linear_extrude(shroud_top - deck_z1 + eps) shroud_wall_2d();
    }
    translate([0, 0, shroud_top - shroud_groove_d - deck_z0]) linear_extrude(shroud_groove_d + 1) shroud_seal_2d();
    for (k = [0, 1]) {
      translate([(2 * k - 1) * throat_x, encl_y1 + shroud_wall / 2, cable_z - deck_z0]) rotate(90) teardrop_x(cable_hole_d, shroud_wall + 2);
      translate([spool_c[k][0], encl_y0 - shroud_wall / 2, deck_t + drain_d / 2 + 0.5]) rotate(90) teardrop_x(drain_d, shroud_wall + 2);
    }
    for (m = [0, 1]) mirror([m, 0, 0]) translate([guide_c[0], guide_c[1], -1]) cylinder(d = guide_pilot_d, h = guide_z0 - deck_z0 + 2, $fn = 32);
    for (p = deck_screws) translate([p[0], p[1], 0]) {
      translate([0, 0, -1]) cylinder(d = clear_d, h = deck_t - deck_z0 + 2);
      translate([0, 0, -1]) cylinder(d = cbore_d, h = 1 + deck_cbore_h);
    }
    for (p = horn_bolts) translate([p[0], p[1], -1]) cylinder(d = horn_bolt_clear, h = deck_t + 2, $fn = 24);
    for (m = [0, 1]) mirror([m, 0, 0]) translate([guide_c[0], guide_c[1], -1]) cylinder(d = 15, h = 1 + guide_head_cbore, $fn = 6);
    for (m = [0, 1]) mirror([m, 0, 0]) door_recess();
  }
}

assert(encl_x + shroud_wall <= outer_l / 2 - tray_inset - 0.5, "the enclosure runs out past the back");
for (p = deck_screws) assert(p[1] - column_d / 2 > encl_y1 + shroud_wall + 0.5 || p[1] + column_d / 2 < encl_y0 - shroud_wall - 0.5, "the enclosure runs into a deck pillar");
assert(cable_z - cable_hole_d / 2 - deck_z1 > 1, "the cable's hole runs into the deck");

// ---- access doors, in the deck's frame (z from its outer face), right
// spool. The recess: the door's dovetailed seat round the window, the plain
// pocket below it the door slides down into (and lifts out of), and a ramp
// out of the pocket's foot that drains it. The window flares 45° toward the
// outer face so its edge prints.
door_x = door_w / 2 + door_lap;
door_y0 = door_c[1] - door_h / 2 - door_lap;
door_y1 = door_c[1] + door_h / 2 + door_lap;
door_rd = door_t + door_clear;
door_travel = door_y1 - (door_c[1] - door_h / 2);
door_park_y0 = door_y0 - door_travel;
door_latch = [door_c[0], door_y0 + door_lap / 2];

module door_recess() {
  translate([door_c[0], 0, 0]) {
    hull() {
      translate([-door_x, door_y0, -1]) cube([2 * door_x, door_y1 - door_y0, 1]);
      translate([-door_x - door_rd, door_y0, door_rd - eps]) cube([2 * (door_x + door_rd), door_y1 + door_rd - door_y0, eps]);
    }
    translate([-door_x - door_rd, door_park_y0, -1]) cube([2 * (door_x + door_rd), door_y0 - door_park_y0 + eps, door_rd + 1]);
    hull() {
      translate([-door_x - door_rd, door_park_y0, -1]) cube([2 * (door_x + door_rd), eps, door_rd + 1]);
      translate([-door_x - door_rd, door_park_y0 - door_rd - 1, -1]) cube([2 * (door_x + door_rd), eps, 1]);
    }
    hull() {
      translate([-door_w / 2, door_c[1] - door_h / 2, deck_t - eps]) cube([door_w, door_h, 1]);
      translate([-door_w / 2 - (deck_t - door_rd), door_c[1] - door_h / 2 - (deck_t - door_rd), door_rd - eps]) cube([door_w + 2 * (deck_t - door_rd), door_h + 2 * (deck_t - door_rd), eps]);
    }
  }
  translate([door_latch[0], door_latch[1], door_rd - eps]) cylinder(d = pilot_d, h = deck_t - door_rd - 0.8, $fn = 16);
}

// The door, outer face at z = 0, shut
module door() {
  translate([door_c[0], 0, 0]) difference() {
    hull() {
      translate([-door_x + door_clear, door_y0, 0]) cube([2 * (door_x - door_clear), door_y1 - door_clear - door_y0, eps]);
      translate([-door_x - door_t + door_clear, door_y0, door_t - eps]) cube([2 * (door_x + door_t - door_clear), door_y1 + door_t - door_clear - door_y0, eps]);
    }
    translate([0, door_latch[1], -1]) cylinder(d = clear_d, h = door_t + 2, $fn = 16);
  }
}

module door_in_place(m) {
  mirror([m, 0, 0]) translate([0, 0, deck_z0]) door();
}

module door_print() {
  translate([-door_c[0], -door_c[1], door_t]) mirror([0, 0, 1]) door();
}

assert(door_c[0] + door_x + door_rd < guide_c[0] - 7.5 - 0.5, "a door's recess runs into a guide bolt's head");
assert(door_c[0] - door_w / 2 - (deck_t - door_rd) > spool_x - 0, "a door's window runs into its spool's post");
assert(door_c[1] + door_h / 2 + (deck_t - door_rd) < encl_y1, "a door's window runs out of the enclosure");
assert(door_park_y0 - door_rd - 1 > pin_y + pinion_post_d / 2 || door_c[0] + door_x + door_rd < pin_x - pinion_post_d / 2, "a door's pocket runs under a pinion's post");
anchor_pts = [for (r = [anchor_r, anchor_r + 5]) [spool_x + r * cos(anchor_a), spool_y + r * sin(anchor_a)] - door_c];
for (q = anchor_pts) assert(abs(q[0]) < door_w / 2 - 3 && abs(q[1]) < door_h / 2 - 3, "the right spool's anchor isn't in its door");

module deck_in_place() {
  translate([0, 0, deck_z0]) deck();
}

// Spacer on each spool's pin, from its bearing's inner race up to the tray.
spacer_h = -(z_s0 + brg_w) - 0.2;
module spacer() {
  difference() {
    cylinder(d = spacer_d, h = spacer_h, $fn = 48);
    translate([0, 0, -1]) cylinder(d = brg_bore + 0.3, h = spacer_h + 2, $fn = 32);
  }
}

module spacer_in_place(k) {
  translate([spool_c[k][0], spool_c[k][1], z_s0 + brg_w]) spacer();
}

// The cable's run (reference): from the guide bearing's inner side at the
// spool channel's depth up the back of the edge bearing, over it, across to
// the front of the rear throat bearing (the tangent crossing between them),
// round it and up through the throat.
function arc(c, a0, a1) = [for (i = [0 : 6]) c + cable_rr * [cos(a0 + (a1 - a0) * i / 6), sin(a0 + (a1 - a0) * i / 6)]];
module ref_cable_runs() {
  e = edge_c;
  r = horn_cs[0];
  mid = (e + r) / 2;
  v = mid - e;
  a1 = atan2(v[1], v[0]) - acos(cable_rr / norm(v));
  a2 = a1 + 180;
  path = concat([[guide_y, cable_z]], arc(e, -90, a1), arc(r, a2, 90), [[horn_y + 40, r[1] + cable_rr]]);
  for (m = [0, 1]) mirror([m, 0, 0]) for (i = [0 : len(path) - 2]) hull() for (q = [path[i], path[i + 1]])
    translate([throat_x, q[0], q[1]]) sphere(d = cable_d, $fn = 8);
}

module ref_guide_bearings() {
  for (m = [0, 1]) mirror([m, 0, 0]) {
    translate([guide_c[0], guide_c[1], guide_z0]) bearing_608();
    for (c = concat([edge_c], horn_cs)) translate([throat_x - brg_w / 2, c[0], c[1]]) rotate([0, 90, 0]) bearing_608();
  }
}

module bearing_608() {
  difference() {
    cylinder(d = brg_od, h = brg_w, $fn = 48);
    translate([0, 0, -1]) cylinder(d = brg_bore, h = brg_w + 2, $fn = 32);
  }
}

// How deep each spool's pin goes into the tray's underside
pin_socket = 1.5;
assert(tray_floor - pin_socket >= 1, "the pin's socket leaves too little floor");

deck_cbore_h = deck_t - 1.8;
deck_screw_in = deck_screw_l - (deck_t - deck_cbore_h) + deck_z1;
assert(deck_screw_in >= 5 && deck_screw_in <= deck_pilot - 0.5, "deck screws don't fit the pilots");

// ---- frame

module frame() {
  difference() {
    linear_extrude(frame_t) difference() {
      plan(0);
      panel_plan(panel_clear - ledge_w);
    }
    translate([0, 0, ledge_t]) linear_extrude(frame_t) panel_plan(panel_clear);
    translate([0, 0, -eps]) linear_extrude(groove_depth + eps) band(groove_e, groove_e + groove_w);
    for (p = screws) translate([p[0], p[1], -1]) cylinder(d = clear_d, h = frame_t + 2);
  }
}

// ---- bezel

module bezel() {
  difference() {
    linear_extrude(bezel_t) plan(0);
    // inner edge bevelled 45° so it shades the cells less at low sun
    hull() {
      translate([0, 0, -1]) linear_extrude(1 + eps) panel_plan(-bezel_overlap);
      translate([0, 0, bezel_t]) linear_extrude(eps) panel_plan(-bezel_overlap + bezel_t);
    }
    for (p = screws) translate([p[0], p[1], 0]) {
      translate([0, 0, -1]) cylinder(d = clear_d, h = bezel_t + 2);
      translate([0, 0, bezel_t - cbore_h]) cylinder(d = cbore_d, h = cbore_h + 1);
    }
  }
}

assert(bezel_e < opening_e, "bezel reaches past the ledge");

// ---- gasket: TPU 85A, U-section, modelled as fitted (slot down)

module gasket() {
  difference() {
    linear_extrude(groove_depth) band(groove_e, groove_e + groove_w);
    translate([0, 0, -1]) linear_extrude(groove_depth - gasket_floor + 1) band(groove_e + gasket_wall, groove_e + gasket_wall + gasket_slot);
  }
}

module gasket_print() {
  translate([0, 0, groove_depth]) mirror([0, 0, 1]) gasket();
}

// ---- in place, in the hanging frame; `lift` pulls the lid off along its
// normal

module frame_in_place(lift = 0) {
  lid_frame() translate([0, 0, tray_h + lift]) frame();
}

module gasket_in_place(lift = 0) {
  lid_frame() translate([0, 0, tray_h + lift]) gasket();
}

module bezel_in_place(lift = 0) {
  lid_frame() translate([0, 0, tray_h + frame_t + lift]) bezel();
}

// ---- reference parts

module ref_panel(lift = 0) {
  lid_frame() translate([0, 0, tray_h + ledge_t + glue_gap + lift]) linear_extrude(panel_t) panel_plan(0);
}

module ref_glue(lift = 0) {
  lid_frame() translate([0, 0, tray_h + ledge_t + lift]) linear_extrude(glue_gap) difference() {
    panel_plan(-1.5);
    panel_plan(-ledge_w + 1.5);
  }
}

// The pole's foot, cut short
module ref_pole(len = 250) {
  translate([0, bore_bot, pole_z]) rotate([-90, 0, 0]) cylinder(d = pole_d, h = len, $fn = 48);
}

module ref_battery() {
  at_stack() translate([0, 0, tray_floor + bat_t / 2]) cube([bat_l, bat_w, bat_t], center = true);
}

module ref_boards() {
  z = shelf_z + shelf_t;
  at_stack() {
    translate([heltec_u, heltec_v, z + heltec_h / 2]) cube([heltec_l, heltec_w, heltec_h], center = true);
    translate([hc33_u, hc33_v, z + hc33_under + hc33_t / 2]) cube([hc33_l, hc33_w, hc33_t], center = true);
    translate([charger_u, charger_v, z + 2]) cube([charger_l, charger_w, 4], center = true);
    translate([buck_u, buck_v, z + 2.5]) cube([buck_l, buck_w, 5], center = true);
  }
}


module ref_motors() {
  for (k = [0, 1]) translate([0, 0, mot_face_z]) linear_extrude(mot_h) motor_plan(k);
}

module ref_bearings() {
  for (k = [0, 1]) translate([spool_c[k][0], spool_c[k][1], level_z0[k]]) difference() {
    cylinder(d = brg_od, h = brg_w, $fn = 48);
    translate([0, 0, -1]) cylinder(d = brg_bore, h = brg_w + 2, $fn = 32);
  }
}

module ref_cable() {
  for (k = [0, 1]) translate([spool_c[k][0], spool_c[k][1], level_z0[k] + spool_gear_w + 0.1]) linear_extrude(bay_w - 0.2) difference() {
    circle(r = fill_r, $fn = 120);
    circle(r = core_r, $fn = 120);
  }
}

module ref_bulkhead() {
  for (x = [-ant_x, ant_x]) lid_frame() translate([x, outer_w / 2 - tray_inset, n_z]) rotate([-90, 0, 0]) {
    cylinder(d = n_body_d, h = 4);
    translate([0, 0, 4]) cylinder(d = 18, h = 16);
    translate([0, 0, -tray_wall - 5]) cylinder(d = n_nut_af / cos(30), h = 5, $fn = 6);
    translate([0, 0, -n_back_len]) cylinder(d = n_thread_d, h = n_back_len);
  }
}

// ---- deployed (reference): hanging on its cables, the telescoping carbon
// mast run out to 3 m above the socket, held to the two cables by
// stabilising bars every third of a metre for the first metre, the last two
// metres free above the canopy; two LMR-400 runs from the bulkheads up the
// mast to two N-type omni antennas on a short crossarm at the top.
mast_len = 3000;
mast_ds = [20, 16, 12];
bar_ys = [333, 667, 1000];
bar_w = 12;
bar_t = 8;
lmr_d = 10.3;
ant_len = 600;
ant_d = 25;
crossarm = 360;
cable_show = 3400;
mast_top = socket_top + mast_len;

module ref_mast() {
  n = len(mast_ds);
  seg = (mast_top - bore_bot) / n;
  for (i = [0 : n - 1]) translate([0, bore_bot + i * seg, pole_z]) rotate([-90, 0, 0]) cylinder(d = mast_ds[i], h = seg + (i < n - 1 ? 60 : 0), $fn = 32);
  // crossarm
  translate([0, mast_top - 20, pole_z]) cube([crossarm + 30, 16, 16], center = true);
}

module ref_cables_up() {
  for (m = [-1, 1]) translate([m * throat_x, horn_y, hang_z]) rotate([-90, 0, 0]) cylinder(d = 2, h = cable_show, $fn = 8);
}

// A bar across the cables, an eye round each, and a clamp back to the mast
module ref_bars() {
  for (y = bar_ys) translate([0, socket_top + y, 0]) {
    translate([-throat_x, -bar_w / 2, hang_z - bar_t / 2]) cube([2 * throat_x, bar_w, bar_t]);
    for (m = [-1, 1]) translate([m * throat_x, 0, hang_z]) rotate([90, 0, 0]) difference() {
      cylinder(d = 14, h = bar_w, center = true, $fn = 24);
      cylinder(d = 4, h = bar_w + 2, center = true, $fn = 12);
    }
    translate([-12, -bar_w / 2, pole_z]) cube([24, bar_w, hang_z - pole_z]);
  }
}

module lmr_run(pts) {
  for (i = [0 : len(pts) - 2]) hull() for (q = [pts[i], pts[i + 1]]) translate(q) sphere(d = lmr_d, $fn = 12);
}

// Each run leaves its bulkhead's plug, drops out of the hood's open back in
// a drip loop, climbs the socket's back over its zip-tie slots and the
// mast behind it, then out along the crossarm to its antenna.
module ref_lmr400() {
  for (m = [-1, 1]) {
    a = concat([m * ant_x], from_lid(outer_w / 2 + 40, n_z));
    b = concat([m * ant_x], from_lid(outer_w / 2 + 40, n_z - 30));
    lmr_run([a, b, [m * 21, b[1] - 10, -lmr_d / 2], [m * 21, socket_top, -lmr_d / 2],
      [m * 9, socket_top + 60, pole_z - 14], [m * 9, mast_top - 60, pole_z - 14],
      [m * crossarm / 2, mast_top - 60, pole_z - 14], [m * crossarm / 2, mast_top - 30, pole_z]]);
  }
}

module ref_antennas() {
  for (m = [-1, 1]) translate([m * crossarm / 2, mast_top - 12, pole_z]) rotate([-90, 0, 0]) {
    cylinder(d = 16, h = 30, $fn = 6);
    translate([0, 0, 30]) cylinder(d = ant_d, h = ant_len, $fn = 24);
  }
}
