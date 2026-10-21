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
// frame into columns on the tray's outside. Undoing them lifts the frame
// with the glued panel and the bezel off the tray in one; the bezel never
// has to come off the panel.
//
// It hangs with a long side down: +Y is up, the panel faces out (+Z) and
// the winch is behind it.
//
// Inside, low and centred: the LP1260110 LiPo pouch (10 Ah) flat on the
// floor along the bottom, and over it a carrier plate on four posts holding
// the Heltec V3, the Heltec HT-HC33, the TP4056 charger and a 5 V
// buck-boost. Each sits between corner brackets (stick them down with foam
// tape). The N (for the V3) and the SMA (for the HC33) point down out of the
// bottom wall, spaced evenly, each midway between two screw columns.
//
// Winch: two spools of 1/32" stainless cable side by side in the upper half,
// behind the tray on a deck that hangs from its long-side screw columns.
// Each turns on a 608 skateboard bearing on a post from the deck and has
// teeth round its lower flange, driven by a pinion on a JGY-370 worm
// gearmotor lying inside the box, output shaft down through a TPU lip seal
// on the pinion's hub. The two trains mirror each other, so the spools turn
// opposite ways to reel in. Each cable leaves through a two-roller throat at
// its top corner, as far apart as the box allows.
//
// Frame: X along the panel, Y across, Z up, origin at the middle of the
// tray's underside. Every piece prints as modelled (bottom face down) except
// the gasket, which `gasket_print()` turns floor-down. The footprint needs a
// 270 mm bed (Q2, U1).

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

// Tray: floor, height inside (sized for the N bulkhead's panel nut), wall
tray_floor = 2.5;
tray_inside_h = 26;
tray_wall = 4;

// How far the tray's wall sits in from the frame's edge (the screw columns
// stand out to the edge)
tray_inset = 5.5;

// M3 cap screws: inset from the outside, most spacing allowed, pilot for
// self-tapping, clearance, counterbore diameter and depth, column diameter
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

// The carrier plate over the battery: thickness, gap above the pouch, its
// posts' diameter, and the M3 that holds it to each post (pilot depth for
// an M3x8)
shelf_t = 2;
shelf_gap = 0.5;
post_d = 7;
shelf_pilot_depth = 7;
// Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), on the carrier plate: board
// length, width, thickness, room under and over it
hc33_l = 60;
hc33_w = 33.5;
hc33_t = 1.5;
hc33_under = 4.2;
hc33_over = 4.5;

// SMA female bulkhead through the bottom wall beside the N: hole, panel nut
// across flats, the most panel it clamps
sma_hole = 6.6;
sma_nut_af = 8;
sma_panel = 5;

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

// The deck behind the tray: thickness, edge band, bar width; and the M3s
// it hangs on from the tray's long-side columns (length under the head)
deck_t = 5;
deck_screw_l = 25;
deck_band = 12;
deck_bar = 20;

// Corner rollers: each cable leaves through a throat between two rollers
// at its top corner. Roller and pin diameters, the throat's width, and how
// far in from the top edge the rollers stand
roller_d = 10;
roller_pin_d = 5;
roller_throat = 3;
roller_in = 8;

// Horns: past each corner's rollers the cable climbs forward to a throat
// between two horizontal rollers standing out past the top edge, at the
// depth of the node's centre of mass, so it hangs upright. That depth
// (estimated 12-15 mm in front of the tray's underside, depending on how
// much cable is wound on), how far out past the edge the throat is, the
// throat's gap, the rollers' diameter, the room between the cheeks, and the
// cheeks' and bridge's thickness. The rollers turn on M3x20s with nuts.
hang_z = 13;
horn_out = 10;
horn_gap = 1.5;
horn_roller_d = 8;
horn_w = 12;
cheek_t = 5;
horn_wall = 3;

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
screws = concat(
  [for (i = [0:screw_nx], s = [-1, 1]) [-lane_x + i * 2 * lane_x / screw_nx, s * lane_y]],
  [for (j = [1:screw_ny - 1], s = [-1, 1]) [s * lane_x, -lane_y + j * 2 * lane_y / screw_ny]]
);

// The N and the SMA point down out of the bottom (-Y) wall, each midway
// between two long-side screw columns, at the midpoint nearest a third of the
// way along, so the two are spaced evenly; low enough that the N's body
// clears the frame's underside.
pitch_x = 2 * lane_x / screw_nx;
ant_x = -lane_x + (round((outer_l / 6 + lane_x) / pitch_x - 0.5) + 0.5) * pitch_x;
n_z = tray_floor + n_body_d / 2 + 0.5;
n_hole_d = n_thread_d + n_hole_clear;
bottom_wall_y = -(outer_w / 2 - tray_in_e + tray_wall / 2);

assert(groove_e - screw_e >= clear_d / 2 + 1, "groove too close to the screws");
assert(groove_e + groove_w <= pocket_e - 0.5, "groove runs into the panel pocket");
assert(groove_depth <= frame_t - 2, "groove leaves too little frame above it");
assert(tongue_e >= tray_inset + 0.5 && tongue_e + tongue_w <= tray_in_e - 0.5, "tongue doesn't sit on the tray wall");
assert(n_z + n_body_d / 2 <= tray_h, "bulkhead's body hits the frame");
assert(n_z - n_body_d / 2 >= tray_floor, "bulkhead's body hits the floor");
assert(sqrt(2) * n_hole_d / 2 < n_body_d / 2, "hole's 45° peak shows past the bulkhead");
assert(tray_wall <= n_panel, "wall too thick for the bulkhead");
assert(pitch_x / 2 - column_d / 2 >= n_body_d / 2, "bulkhead hits a screw column");
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

// ---- tray

module tray() {
  difference() {
    union() {
      linear_extrude(tray_floor) plan(tray_inset);
      linear_extrude(tray_h) band(tray_inset, tray_in_e);
      for (p = screws) translate([p[0], p[1], 0]) cylinder(d = column_d, h = tray_h);
      // tongue, its tip narrowed to lead it into the gasket
      translate([0, 0, tray_h - eps]) {
        linear_extrude(tongue_len - 0.5 + eps) band(tongue_e, tongue_e + tongue_w);
        translate([0, 0, tongue_len - 0.5]) linear_extrude(0.5) band(tongue_e + 0.25, tongue_e + tongue_w - 0.25);
      }
      translate([0, 0, tray_floor - eps]) brackets();
      for (p = shelf_posts) translate([p[0], p[1], tray_floor - eps]) cylinder(d = post_d, h = post_h + eps);
      for (k = [0, 1]) motor_seat(k);
    }
    for (k = [0, 1]) motor_seat_cut(k);
    for (c = spool_c) translate([c[0], c[1], -1]) cylinder(d = brg_bore + 0.3, h = pin_socket + 1, $fn = 32);
    for (p = screws) if (abs(p[1]) > lane_y - 1) translate([p[0], p[1], -1]) cylinder(d = pilot_d, h = deck_pilot + 1);
    translate([ant_x, bottom_wall_y, n_z]) rotate(90) teardrop_x(n_hole_d, tray_wall + 2);
    translate([-ant_x, bottom_wall_y, n_z]) rotate(90) teardrop_x(sma_hole, tray_wall + 2);
    for (p = screws) translate([p[0], p[1], tray_h - pilot_depth]) cylinder(d = pilot_d, h = pilot_depth + 1);
    for (p = shelf_posts) translate([p[0], p[1], shelf_z - shelf_pilot_depth]) cylinder(d = pilot_d, h = shelf_pilot_depth + 1);
  }
}

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

// The stack lies along the bottom, centred: u along X, v along Y, its
// lower edge just above the bulkheads' backs. On the plate, between the
// posts' bosses, the row nearer the bottom holds the HC33 (on the SMA's side)
// and the charger; the upper row the buck-boost and the V3 (on the N's side).
shelf_boss_d = cbore_d + 2.4;
board_gap = 2;
shelf_l = bat_l + 2 * (bracket_out + post_d);
shelf_w = max(bat_w + 2 * (bracket_out + 0.5), hc33_w + heltec_w + 4 * bracket_out + board_gap + 2.5);
stack_y = -inside_w / 2 + n_back_len + 2 + shelf_w / 2;
shelf_z = tray_floor + bat_t + shelf_gap;
post_h = shelf_z - tray_floor;
post_uv = [for (su = [-1, 1], sv = [-1, 1]) [su * (bat_l / 2 + bracket_out + post_d / 2), sv * (bat_w / 2 - 8)]];
shelf_posts = [for (q = post_uv) [q[0], stack_y + q[1]]];

module at_stack() {
  translate([0, stack_y, 0]) children();
}

board_end = bat_l / 2 + post_d / 2 - shelf_boss_d / 2 - 1;
row_a = -shelf_w / 2 + 1 + bracket_out;
row_b = shelf_w / 2 - 1 - bracket_out;
hc33_u = -board_end + hc33_l / 2;
hc33_v = row_a + hc33_w / 2;
charger_u = board_end - charger_l / 2;
charger_v = row_a + charger_w / 2;
heltec_u = board_end - heltec_l / 2;
heltec_v = row_b - heltec_w / 2;
buck_u = -board_end + buck_l / 2;
buck_v = row_b - buck_w / 2;

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
assert(max(hc33_v + hc33_w / 2, charger_v + charger_w / 2) + 2 * bracket_out + board_gap <= min(heltec_v - heltec_w / 2, buck_v - buck_w / 2), "the plate's rows overlap");
// Under the frame's ledge the ceiling is the tray's top
assert(shelf_z + shelf_t + max(heltec_h, hc33_under + hc33_t + hc33_over) + 1 <= tray_h, "a board on the plate hits the frame");

// ---- carrier plate: on the four posts, printed as modelled; its screws sit
// in counterbored bosses

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
  }
}

module shelf_in_place() {
  translate([0, 0, shelf_z]) shelf();
}

// ---- SMA

assert(tray_wall <= sma_panel, "wall too thick for the SMA");
assert(sqrt(2) * sma_hole / 2 < sma_nut_af / 2 + 1, "SMA hole's peak shows past its nut");

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
// deck's band allows.
spool_x = spool_tip + spool_gap / 2;
spool_y = outer_w / 2 - deck_band - 2 - spool_tip;
spool_c = [[-spool_x, spool_y], [spool_x, spool_y]];
z_s0 = -spin_gap - level_h;
level_z0 = [z_s0, z_s0];
deck_z1 = z_s0 - spin_gap;
deck_z0 = deck_z1 - deck_t;

// Pinions below each spool on its outer side. Each motor lies along Y,
// gearbox end toward -Y, as far out as the frame's ledge allows (its top is
// above the ledge's underside). The two trains mirror each other.
mesh_d = spool_rg + pitch_r(pinion_z);
pin_x = outer_l / 2 - opening_e - 1 - mot_w / 2;
pin_y = spool_y - sqrt(mesh_d * mesh_d - pow(pin_x - spool_x, 2));
pinion_c = [[-pin_x, pin_y], [pin_x, pin_y]];
pinion_post_d = 12;
// Each pinion turned so its teeth fall between the spool's (spool at 0°)
function mesh_phase(psi_a, za, zb, th) = th + 180 - 180 / zb - (psi_a - th) * za / zb;
pinion_th = [for (k = [0, 1]) let(d = pinion_c[k] - spool_c[k]) atan2(d[1], d[0])];
pinion_psi = [for (k = [0, 1]) mesh_phase(0, spool_z, pinion_z, pinion_th[k])];
mot_face_z = tray_floor + seat_h;

// Corner rollers: each throat midway between the two outermost long-side
// columns at the top, roller_in down from the edge.
throat_x = lane_x - pitch_x / 2;
roller_y = outer_w / 2 - roller_in;
roller_cs = [for (s = [-1, 1], t = [-1, 1]) [s * throat_x + t * (roller_d + roller_throat) / 2, roller_y]];

// Horn (right corner; the left is its mirror): the throat's y, its two
// rollers' centres [y, z], each cheek's x, and the horn's extent.
horn_y = outer_w / 2 + horn_out;
horn_rollers = [for (t = [-1, 1]) [horn_y, hang_z + t * (horn_gap + horn_roller_d) / 2]];
cheek_x = [for (t = [-1, 1]) throat_x + t * (horn_w + cheek_t) / 2];
horn_y0 = roller_y + roller_d / 2 + 1;
horn_y_up = outer_w / 2 + 1;
horn_y1 = horn_y + horn_roller_d / 2 + horn_wall;
horn_z1 = hang_z + horn_gap / 2 + horn_roller_d + horn_wall;

// M3s up through the deck's band into the long-side columns
deck_pilot = 8;
deck_screws = [for (p = screws) if (abs(p[1]) > lane_y - 1) p];

assert(core_r - core_wall > hub_r + 4, "no room for the web between hub and core");
assert(spool_x + spool_tip <= outer_l / 2 - deck_band - spin_gap, "spools run into the deck's end bands");
assert(abs(pin_x - spool_x) < mesh_d, "the pinion can't reach its spool");
assert(pin_x - mot_w / 2 - bracket_out - 1 > shelf_l / 2, "a motor runs into the battery stack");
assert(pin_y - mot_shaft_in - bracket_out > -(outer_w / 2 - opening_e - 1), "a motor runs under the frame's ledge");
assert(pin_y + mot_len - mot_shaft_in + bracket_out < outer_w / 2 - opening_e - 1, "a motor runs under the frame's ledge");
for (c = roller_cs, k = [0, 1]) assert(norm(c - spool_c[k]) >= spool_tip + roller_d / 2 + spin_gap, "a roller runs into a spool");
for (c = roller_cs, p = screws) assert(norm(c - p) >= roller_d / 2 + column_d / 2 + 1, "a roller runs into a screw column");
assert(abs(throat_x) + (roller_d + roller_throat) / 2 + roller_d / 2 < outer_l / 2 - 2, "a roller sticks out past the end");
assert(mot_face_z + mot_h + 1 <= tray_h + ledge_t + glue_gap, "a motor hits the panel");
assert(outer_w / 2 - deck_band - spool_tip - spool_y > spin_gap, "spools run into the deck screws' band");
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
  }
}

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
    rotate(30) translate([core_r - core_wall - 1, 0, spool_gear_w + bay_w / 2]) rotate([0, 90, 0]) cylinder(d = 1.5, h = core_wall + 2, $fn = 12);
  }
}

module spool_cap_print() {
  translate([0, 0, level_h]) mirror([0, 0, 1]) spool_cap();
}

module spool_in_place(k) {
  translate([spool_c[k][0], spool_c[k][1], level_z0[k]]) {
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

// Deck behind the tray, printed plate down: an edge band, a bar under each
// spool's post and each pinion's pin, pads under the corner rollers, the
// posts (a shoulder for the bearing's inner race, then its 8 mm pin up into
// a socket under the tray), the pinions' pins, the rollers' pins, and
// pillars up to the long-side columns.
module deck_plan() {
  difference() {
    plan(0);
    plan(deck_band);
  }
  intersection() {
    plan(0);
    for (x = [-spool_x, spool_x, -pin_x, pin_x]) translate([x - deck_bar / 2, -outer_w / 2]) square([deck_bar, outer_w]);
  }
  for (s = [-1, 1]) hull() for (c = roller_cs) if (sign(c[0]) == s) translate(c) circle(d = roller_d + 4);
  for (s = [-1, 1]) scale([s, 1]) translate([cheek_x[0] - cheek_t / 2, outer_w / 2 - deck_band]) square([horn_w + 2 * cheek_t, horn_y1 - outer_w / 2 + deck_band]);
}

// A horn's cheeks and bridge, in the deck's frame (z from the deck's
// underside), right corner. Each cheek is under the tray only below its
// underside; past the top edge it stands up to the bridge. The rollers'
// screws: head counterbored in the outer cheek, nut in the inner.
module horn() {
  z1 = -deck_z0;
  difference() {
    union() {
      for (x = cheek_x) translate([x - cheek_t / 2, 0, 0]) rotate([90, 0, 90]) linear_extrude(cheek_t) {
        translate([horn_y0, 0]) square([horn_y1 - horn_y0, -0.5 - deck_z0]);
        translate([horn_y_up, 0]) square([horn_y1 - horn_y_up, horn_z1 - deck_z0]);
      }
      translate([cheek_x[0], horn_y_up, horn_z1 - deck_z0 - horn_wall]) cube([cheek_x[1] - cheek_x[0], horn_y1 - horn_y_up, horn_wall]);
    }
    for (r = horn_rollers) translate([throat_x, r[0], r[1] - deck_z0]) {
      teardrop_x(clear_d, horn_w + 2 * cheek_t + 2);
      translate([cheek_x[1] + cheek_t / 2 - cbore_h / 2 + 0.5 - throat_x, 0, 0]) teardrop_x(cbore_d, cbore_h + 1);
      translate([cheek_x[0] - cheek_t / 2 + 1.25 - throat_x, 0, 0]) rotate([0, 90, 0]) cylinder(d = 5.5 / cos(30) + 0.3, h = 2.6, center = true, $fn = 6);
    }
  }
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
      for (c = roller_cs) translate([c[0], c[1], deck_t - eps]) {
        cylinder(d = roller_pin_d + 2, h = 0.5 + eps, $fn = 32);
        cylinder(d = roller_pin_d, h = -deck_z1 - 0.3, $fn = 32);
      }
      for (m = [0, 1]) mirror([m, 0, 0]) horn();
    }
    for (p = deck_screws) translate([p[0], p[1], 0]) {
      translate([0, 0, -1]) cylinder(d = clear_d, h = deck_t - deck_z0 + 2);
      translate([0, 0, -1]) cylinder(d = cbore_d, h = 1 + cbore_h);
    }
  }
}

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

// Corner roller: a sleeve on the deck's pin, riding on its 0.5 mm washer
// ring, held on by the tray above.
roller_h = -deck_z1 - 1;
module roller() {
  difference() {
    cylinder(d = roller_d, h = roller_h, $fn = 48);
    translate([0, 0, -1]) cylinder(d = roller_pin_d + 0.5, h = roller_h + 2, $fn = 32);
  }
}

module rollers_in_place() {
  for (c = roller_cs) translate([c[0], c[1], deck_z1 + 0.5]) roller();
}

// Horn roller: a sleeve on its M3 between the cheeks.
module horn_roller() {
  difference() {
    cylinder(d = horn_roller_d, h = horn_w - 1, $fn = 48);
    translate([0, 0, -1]) cylinder(d = clear_d + 0.2, h = horn_w + 1, $fn = 32);
  }
}

module horn_rollers_in_place() {
  for (m = [0, 1], r = horn_rollers) mirror([m, 0, 0]) translate([throat_x - (horn_w - 1) / 2, r[0], r[1]]) rotate([0, 90, 0]) horn_roller();
}

// The cable's run from a corner's rollers up through its horn's throat
// (reference, straightened): from the spool's channel depth to just short
// of the throat at hang_z, then straight up through it. The real cable bends
// over the rear horn roller and under the front one on the way.
module ref_cable_runs() {
  z0 = z_s0 + spool_gear_w + bay_w / 2;
  y1 = horn_y - horn_roller_d / 2 - 1;
  for (m = [0, 1]) mirror([m, 0, 0]) {
    hull() {
      translate([throat_x, roller_y, z0]) sphere(d = cable_d, $fn = 8);
      translate([throat_x, y1, hang_z]) sphere(d = cable_d, $fn = 8);
    }
    hull() {
      translate([throat_x, y1, hang_z]) sphere(d = cable_d, $fn = 8);
      translate([throat_x, horn_y + 40, hang_z]) sphere(d = cable_d, $fn = 8);
    }
  }
}

assert(horn_y0 >= roller_y + roller_d / 2 + 0.5, "a horn runs into its corner's rollers");
assert(horn_y - horn_roller_d / 2 > horn_y_up, "a horn roller sits over the box");
for (p = deck_screws, x = cheek_x) assert(abs(abs(p[0]) - x) >= cheek_t / 2 + column_d / 2 + 0.5 || abs(p[1]) + column_d / 2 < horn_y0 - 0.5 || p[1] < 0, "a cheek runs into a deck pillar");
assert(cheek_x[1] + cheek_t / 2 < outer_l / 2, "a horn sticks out past the end");

// How deep each spool's pin goes into the tray's underside
pin_socket = 1.5;
assert(tray_floor - pin_socket >= 1, "the pin's socket leaves too little floor");

deck_screw_in = deck_screw_l - (deck_t - cbore_h) + deck_z1;
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

// ---- in place (z = 0 at the tray's underside); `lift` raises the lid

module frame_in_place(lift = 0) {
  translate([0, 0, tray_h + lift]) frame();
}

module gasket_in_place(lift = 0) {
  translate([0, 0, tray_h + lift]) gasket();
}

module bezel_in_place(lift = 0) {
  translate([0, 0, tray_h + frame_t + lift]) bezel();
}

// ---- reference parts

module ref_panel(lift = 0) {
  translate([0, 0, tray_h + ledge_t + glue_gap + lift]) linear_extrude(panel_t) panel_plan(0);
}

module ref_glue(lift = 0) {
  translate([0, 0, tray_h + ledge_t + lift]) linear_extrude(glue_gap) difference() {
    panel_plan(-1.5);
    panel_plan(-ledge_w + 1.5);
  }
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

module ref_sma() {
  translate([-ant_x, -(outer_w / 2 - tray_inset), n_z]) rotate([90, 0, 0]) {
    cylinder(d = 6.35, h = 9, $fn = 24);
    translate([0, 0, 9]) cylinder(d = 10, h = 100, $fn = 24);
    translate([0, 0, -tray_wall - 2]) cylinder(d = sma_nut_af / cos(30), h = 2, $fn = 6);
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
  translate([ant_x, -(outer_w / 2 - tray_inset), n_z]) rotate([90, 0, 0]) {
    cylinder(d = n_body_d, h = 4);
    translate([0, 0, 4]) cylinder(d = 18, h = 16);
    translate([0, 0, -tray_wall - 5]) cylinder(d = n_nut_af / cos(30), h = 5, $fn = 6);
    translate([0, 0, -n_back_len]) cylinder(d = n_thread_d, h = n_back_len);
  }
}
