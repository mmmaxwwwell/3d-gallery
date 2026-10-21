// HT-HC33 LiPo case: a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), a Heltec
// WiFi LoRa 32 V4, a 103665 LiPo pouch cell and a USB-C TP4056 charger
// board, stacked face to face like a stack of cards in a case that stands
// on end. The HC33's and V4's USB-Cs come out of the bottom, the TP4056's
// out of the right side, and two SMA bulkheads out of the top at opposite
// corners.
//
// Two pieces, each black PCTG with orange TPU 75A and black TPU Air
// printed in place on a Snapmaker U1:
// - the carriage: an L of the top (the SMAs' plate) and the left face (the
//   door face), with everything inside hung on it. Fins between the layers
//   make the chambers; each board sits in slotted holders on all four
//   edges; the TP4056 is held top and bottom by slotted bars; the cell sits
//   between two fins on a floor plate under two roofs.
// - the body: bottom, back, front and right walls, open at the top and on
//   the left. The carriage slides in from the left. Its fins and the cell's
//   floor plate run in channels in the floor and grooves in the right wall,
//   a nib under the top's right edge hooks into a groove in the right wall,
//   and each board's right edge slides into a slotted rail on the right
//   wall. Four M3x10 button-head screws through the door face and two down
//   through the top hold it in.
//
// It is sealed. PCTG lips on the carriage press into grooves in TPU Air
// channels on the body: up the back and front walls' ends and across the
// floor's end for the door face, and round the back, front and right
// walls' tops (on a ridge over the ceiling) for the top. The back and front
// top lips slide home along their grooves; the rest press in at the end of
// the slide. TPU Air washers seal the screw heads and the SMAs' outer nuts,
// orange TPU plugs on straps from the base close the bottom ports, and a
// PCTG door in a dovetail track on the right face slides shut over the
// side port onto a TPU Air gasket, its track wedging it in.
//
// Stack, back to front: TP4056 (parts to the front, its USB-C end to the
// right), HC33 (top face to the front), cell, V4 (top face, with its
// screen, to the front).
//
// Seen from the top the outline is a rounded rectangle whose left and
// right faces lead into the corners at 45°. The top edge is rounded the
// same way. Rings 15 mm tall run round the case, PCTG and TPU in turn: a
// TPU ring fills a recess sunk grip_inset with 45° chamfers, flush, and is
// knurled.
//
// Frame: origin at the cavity's centre in plan, z = 0 on the bottom face.
// X across (the door face at -X), Y through the stack (+Y the front), Z up
// the case. The body prints standing on its bottom (`body()`), the carriage
// on its door face (`carriage_print()`).

// BEGIN_PARAMS
// 103665 LiPo pouch, protection board included: thickness, width, length
// (nominal, unmeasured)
cell_t = 10;
cell_w = 36;
cell_l = 65;

// Clearance round the cell per side
cell_fit = 0.5;

// Heltec HT-HC33: length, width, PCB thickness, the tallest part behind
// the PCB and in front of it
hc_l = 60;
hc_w = 33.5;
hc_pcb = 1.5;
hc_under = 3.6;
hc_over = 3.3;

// How far the HC33's USB-C sticks out past the board's end, and its
// centre in front of the PCB's top face
hc_usb_overhang = 1.54;
hc_usb_y = 0.3;

// Heltec WiFi LoRa 32 V4 (V4.3.1, from Heltec's drawing and STEP model,
// headers not fitted): length with the nose, width, PCB thickness,
// thickness over its parts, the tallest part behind the PCB (the GNSS
// connector); its USB-C's centre in front of the PCB's top face, and how
// far it sticks out past the board's end
v4_l = 51.69;
v4_w = 25.4;
v4_pcb = 1.56;
v4_t = 10.7;
v4_under = 3.6;
v4_usb_y = 1.25;
v4_usb_overhang = 0.97;

// The V4's outline: the 45° chamfers at the corners of its top end (the
// nose) and of its USB-C end, and the gap its top bar leaves over the
// LoRa IPEX on the nose
v4_nose = 3.81;
v4_foot = 2.16;
v4_ipex_gap = 6;

// TP4056 USB-C charger board, lying with its USB-C end to the right:
// PCB length (along X) and width (up the case), PCB thickness, the solder
// behind it, the receptacle's height in front of it, its width, and how
// far it sticks out past the board's end (unmeasured)
tp_l = 28;
tp_w = 17.5;
tp_pcb = 1.6;
tp_back = 0.5;
tp_usb_h = 3.2;
tp_usb_w = 9;
tp_usb_overhang = 0.6;

// The bar the TP4056 stands on
tp_floor = 1.5;

// Gap between neighbours in the stack (a fin runs down the middle of
// each), and in front of the V4
layer_gap = 2.4;
front_gap = 0.5;

// The carriage's fins between the layers
divider_t = 1.2;

// Board slots: how far each board's edge goes into its slot, the slot's
// clearance over the PCB's thickness and past its edge, the rail's wall
// either side of the slot, the gap over a board's top edge and the roof
// over it
slot_engage = 1.25;
slot_fit = 0.2;
slot_side_fit = 0.2;
rail_wall = 1.2;
roof_fit = 0.15;
roof_t = 1.5;

// How far the bars under each board's bottom edge reach up its faces: less
// than slot_engage, clear of the parts near the edge
bottom_engage = 0.9;

// How far each roof over the cell's top end reaches in from its side
cell_roof_reach = 6;

// Gap between each USB-C's face and the wall it comes through
usb_gap = 0.3;

// USB-C openings, sized for a plug's overmold: long side, short side,
// corner radius
usb_open_w = 13;
usb_open_h = 7;
usb_open_r = 1;

// SMA bulkheads (1/4-36) through the top: in from the cavity's back and
// front walls (far enough that the outer nut sits on the flat of the
// top), the hole, the inner nut across corners, and how far the
// connector's back and the pigtail's bend reach down from the top
sma_in_y = 5.6;
sma_hole_d = 6.6;
sma_nut_d = 9.2;
sma_behind = 12;

// Walls: the right wall and the door face; the back and front; the bottom
// (over the TPU base, deep enough for the floor's seal channel under the
// fins' channels); the top (the SMAs' plate, over the top seal)
side_wall = 6;
end_wall = 6;
bottom_t = 4.2;
top_t = 3;

// Watertight joints: PCTG lips on the carriage pressed into channels of
// TPU Air printed in place on the body, all the way round the joint. A
// channel's TPU: how wide across its lip and how deep along it; the lip's
// thickness and reach; how much narrower the groove is than the lip, each
// side; the flared mouth where a lip slides into a groove end-on
seal_w = 2.4;
seal_d = 2.4;
lip_t = 1;
lip_l = 1.4;
seal_squish = 0.15;
seal_lead = 1.5;

// TPU Air washers under the screw heads and the SMAs' outer nuts: how
// thick, how far proud of their seats
washer_t = 0.8;
washer_proud = 0.3;

// The sliding door over the TP4056's side opening, PCTG, printed in place
// in its track on the right face: its thickness; the TPU Air gasket round
// the opening (its margin from the opening, width, how far it stands proud
// of the track's floor) and how far the door squeezes it; how far past the
// gasket the door reaches; the run over which the track wedges the door
// shut; the clearance round the door; the break-off ties that hold it as
// it prints (width, how many)
side_door_t = 2;
side_gasket_margin = 0.6;
side_gasket_w = 1.2;
side_gasket_proud = 0.6;
side_door_squish = 0.3;
side_door_overlap = 0.8;
side_door_wedge = 3;
side_door_fit = 0.3;
side_door_tie_w = 0.8;
side_door_ties = 3;

// The bottom ports' plugs, TPU 75A, printed in place on straps from the
// base's edge: the flange's margin round the port and its thickness, the
// strap's width and thickness, how much bigger than the port the plug's
// stem is, and how far short of the floor's top it stops
plug_margin = 2;
plug_flange_t = 0.8;
plug_strap_w = 5;
plug_strap_t = 0.6;
plug_fit = 0.1;
plug_short = 0.3;

// The TPU base under the whole case, printed in place under the body on
// the U1: its thickness; the keys it carries up into the body's walls
// (diameter at the base, how far up, how much wider at the top), and how
// far apart they are along the walls
base_t = 1.6;
key_d = 2.2;
key_h = 1.5;
key_flare = 0.4;
key_pitch = 10;

// Corner radius seen from the top, and the top edge's radius
profile_r = 10;
top_r = 4;

// Clearance where the carriage slides along the body
slide_fit = 0.2;

// The carriage's mating features: how deep the fins and the cell's floor
// plate sit in the floor and the fins in the right wall; the hook under the
// top's right edge (its height under the top, and the nib's reach and
// height)
floor_channel_d = 1.2;
wall_groove_d = 1;
hook_h = 4;
nib_l = 1.2;
nib_h = 1.2;

// Gussets tying the hook back into the top's underside: thickness, reach
// along the top, and spacing along the hook
hook_gusset_t = 1.6;
hook_gusset_l = 8;
hook_gusset_pitch = 8;

// M3 button-head screws: clearance hole, pilot, head diameter; the boss's
// wall round the pilot, and the screws' length under the head
m3_clear_d = 3.4;
m3_pilot_d = 2.5;
m3_head_d = 5.7;
boss_wall = 1.6;
screw_len = 10;

// Door-face screws into bosses on the back and front walls, each [wall
// (-1 back, 1 front), height, axis's distance in from the wall], and how
// deep each head's seat is in the door face
door_screws = [[-1, 39.5, 3.15], [-1, 54.5, 3.15], [-1, 66, 3.15], [1, 68.5, 3.15]];
door_seat = 2.5;

// Screws down through the top into bosses on the front wall: across, the
// axis's distance in from the wall, and how deep each head's seat is
top_screw_x = [-3, 12];
top_screw_in = 3;
top_seat = 2.4;

// Grip rings: height, how far an inset ring is sunk into the PCTG (the TPU
// fills it flush), the knurl's pitch and depth in the TPU, and the plain
// margin at the bottom and under the top edge
band_h = 15;
grip_inset = 2;
knurl_pitch = 2;
knurl_d = 0.8;
band_margin = 2;

// The PCTG left flush round the side door's track, the door screws' heads,
// and the door face's seam, where they cross a TPU ring
ring_margin = 1.5;
// END_PARAMS

eps = 0.01;

hx = cell_w / 2 + cell_fit;
// The floor's top
floor_z = base_t + bottom_t;
ex = hx + side_wall;

// Through the stack, from the back wall's inner face. The TP4056 sits far
// enough off the back wall for its holders' rail_wall behind its slot.
tp_y = slide_fit + rail_wall + slot_fit / 2 - tp_back;
tp_depth = tp_back + tp_pcb + tp_usb_h;
hc_y = tp_y + tp_depth + layer_gap;
hc_depth = hc_under + hc_pcb + hc_over;
cell_y = hc_y + hc_depth + layer_gap;
cell_depth = cell_t + 2 * cell_fit;
v4_y = cell_y + cell_depth + layer_gap;
v4_over = v4_t - v4_under - v4_pcb;
depth = v4_y + v4_t + front_gap;
hy = depth / 2;
ey = hy + end_wall;
// From the back face onto the frame
yb = -hy;
// Fins, centred in the gaps: TP4056 | HC33 | cell | V4
dividers = [hc_y - layer_gap / 2, cell_y - layer_gap / 2, v4_y - layer_gap / 2];

// HC33 and V4: [width, PCB's back face, PCB thickness, length, USB-C
// overhang, USB-C centre]. Each PCB lands on its slot's floor, so the
// USB-C's face is usb_gap off the bottom.
// Then the chamfers at the top and bottom corners, and the gap in the bar
// over the top edge.
hc_board = [hc_w, hc_y + hc_under, hc_pcb, hc_l, hc_usb_overhang, hc_y + hc_under + hc_pcb + hc_usb_y, 0, 0, 0];
v4_board = [v4_w, v4_y + v4_under, v4_pcb, v4_l, v4_usb_overhang, v4_y + v4_under + v4_pcb + v4_usb_y, v4_nose, v4_foot, v4_ipex_gap];
boards = [hc_board, v4_board];
function board_z0(b) = floor_z + usb_gap + b[4];
function board_z1(b) = board_z0(b) + b[3];

// TP4056: PCB from tp_x0 to tp_x1, standing on its bar
tp_pcb_y = tp_y + tp_back;
tp_x1 = hx - usb_gap - tp_usb_overhang;
tp_x0 = tp_x1 - tp_l;
tp_z0 = floor_z + slide_fit + tp_floor;
tp_z1 = tp_z0 + tp_w;
tp_usb_cy = tp_pcb_y + tp_pcb + tp_usb_h / 2;
tp_usb_cz = tp_z0 + tp_w / 2;

cell_z1 = floor_z + cell_l;

tallest = max(cell_z1, tp_z1, max([for (b = boards) board_z1(b)]));
// The fins stop at the roofs; above them the wires cross between chambers
divider_z1 = tallest + roof_fit + roof_t;
// The fin between the TP4056 and the HC33 stops just over the TP4056's
// bar, which leaves the space above the TP4056 open to the HC33's chamber
// for its antenna
tp_divider_z1 = tp_z1 + roof_fit + roof_t;
divider_tops = [tp_divider_z1, divider_z1, divider_z1];
ceiling = max(tallest + sma_behind, divider_z1 + 0.5);
// The top seal sits on the walls over the ceiling, under the top proper
total_h = ceiling + seal_w + top_t;
// The top edge: a 45° lead from the sides onto a top_r arc
top_lead = (sqrt(2) - 1) / sqrt(2) * top_r;
top_z0 = total_h - top_r + top_r / sqrt(2) - top_lead;

// Outline: corner arcs about (±arc_x, ±arc_y), and 45° lead-ins from the
// arcs onto the left and right faces
arc_x = ex - profile_r;
arc_y = ey - profile_r;
lead_y = arc_y + (sqrt(2) - 1) * profile_r;

// SMAs over the front-left and back-right corners, the inner nut just
// clear of the walls
sma_e = sma_nut_d / 2 + 0.5;
smas = [[-(hx - sma_e), hy - sma_in_y], [hx - sma_e, -(hy - sma_in_y)]];
// How far each SMA's connector reaches down from the top
sma_low = ceiling - (sma_behind - 2);

// The fins and the cell's floor plate: their bottom, in the floor's channels
fin_z0 = floor_z - floor_channel_d + slide_fit;

// The cavity's right corners' radius
cavity_r = 1;

boss_r = m3_pilot_d / 2 + boss_wall;
// A screw head's seat and its washer
seat_d = m3_head_d + 0.5;

// Door-face screws: each reaches screw_len past its seat; its boss's
// underside runs 45° down to the wall
door_engage = screw_len - (side_wall - door_seat);
door_boss_l = door_engage + 1.5;
function ds_y(s) = s[0] * (hy - s[2]);
function ds_z0(s) = s[1] - s[2] - boss_r * sqrt(2);

// Top screws: through the top and the seal under it into bosses hanging
// from the ceiling, their undersides 45° down to the front wall
top_engage = screw_len - (total_h - top_seat - ceiling);
top_boss_z0 = ceiling - top_engage - 1.5;
top_boss_low = top_boss_z0 - top_screw_in - boss_r;
top_screw_y = hy - top_screw_in;

// The seals' centre lines: across the floor's end, and round the top
seal_z_bottom = base_t + seal_w / 2;
seal_z_top = ceiling + seal_w / 2;
// A seal's groove, narrower than its lip, and deeper than the lip reaches
groove_w = lip_t - 2 * seal_squish;
groove_d = lip_l + 0.2;

// The side door: the opening's centre and half-size (y across, z up), the
// gasket's and the door's half-sizes on the right face, the track's floor,
// the door's inner face shut and open, and how far it slides to open
sd_y = tp_usb_cy - hy;
sd_z = tp_usb_cz;
sd_oy = usb_open_h / 2;
sd_oz = usb_open_w / 2;
sd_gy = sd_oy + side_gasket_margin + side_gasket_w;
sd_gz = sd_oz + side_gasket_margin + side_gasket_w;
sd_dy = sd_gy + side_door_overlap;
sd_dz = sd_gz + side_door_overlap;
sd_floor = ex - side_door_t - (side_gasket_proud - side_door_squish);
sd_x_shut = ex - side_door_t;
sd_x_open = sd_floor + side_gasket_proud + side_door_fit;
sd_travel = sd_dy + sd_oy + 0.5;

// The bottom ports' plugs: each port's centre across the case, the edge
// its strap runs to (-1 back, 1 front), the flange's half-size, the fold
// where strap meets flange, and the strap's length under the base
plug_ports = [for (b = boards) b[5] - hy];
function plug_s(y) = y < 0 ? -1 : 1;
plug_fx = usb_open_w / 2 + plug_margin;
plug_fy = usb_open_h / 2 + plug_margin;
function plug_join(y) = y - plug_s(y) * plug_fy;
function plug_strap_l(y) = abs(plug_s(y) * ey - plug_join(y));

// The hook under the top's right edge spans the top's length clear of the
// back-right SMA's nut and the top screws' bosses
hook_y0 = smas[1][1] + sma_nut_d / 2 + 0.5;
hook_y1 = top_screw_y - boss_r - 0.3;

// Grip rings from the bottom up; the odd ones are inset
band_top = top_z0 - band_margin;
band_n = ceil((band_top - band_margin) / band_h);
function band_z0(i) = band_margin + i * band_h;
function band_z1(i) = min(band_margin + (i + 1) * band_h, band_top);
function band_of(z) = floor((z - band_margin) / band_h);
function inset_band(i) = i % 2 == 1 && band_z1(i) - band_z0(i) >= 2 * grip_inset + 2;

// The base's keys, under the middle of the back and front walls and of the
// right wall outside the fins' grooves
function spread(a, b, pitch = key_pitch) = let(n = max(1, floor((b - a) / pitch))) [for (i = [0:n]) a + (b - a) * i / n];
base_keys = concat(
  [for (sy = [-1, 1], x = spread(-hx + seal_d + key_d + 1, hx - key_d)) [x, sy * (hy + end_wall / 2)]],
  [for (y = spread(-hy + key_d, hy - key_d)) [hx + wall_groove_d + (side_wall - wall_groove_d) / 2, y]]);

function slot_y0(b) = b[1] - slot_fit / 2;
function chamfer_top(b) = len(b) > 6 ? b[6] : 0;
function chamfer_bottom(b) = len(b) > 7 ? b[7] : 0;
function top_gap(b) = len(b) > 8 ? b[8] : 0;
// A side slot's section in XZ for a board's edge at x_edge, the board on
// the side dir (+1 to its right). Its floor and roof follow the board's
// corner chamfers: a board only ever passes a slot moving one way, so no
// point of it meets a lower roof or a higher floor on the way in.
function side_slot(b, x_edge, dir, z0, z1) = let(
  ct = chamfer_top(b), cb = chamfer_bottom(b), d1 = slot_engage + 1,
  ks = [for (d = [min(cb, ct), max(cb, ct)]) if (d > 0 && d < d1) d],
  dd = concat([-slot_side_fit, 0], len(ks) == 2 && ks[0] == ks[1] ? [ks[0]] : ks, [d1]))
  concat([for (d = dd) [x_edge + dir * d, z0 + max(0, cb - max(d, 0))]],
         [for (k = [len(dd) - 1:-1:0]) let(d = dd[k]) [x_edge + dir * d, z1 + roof_fit - max(0, ct - max(d, 0))]]);
function slot_y1(b) = b[1] + b[2] + slot_fit / 2;
function rail_y0(b) = slot_y0(b) - rail_wall;
function rail_y1(b) = slot_y1(b) + rail_wall;
tp_b = [0, tp_pcb_y, tp_pcb];

for (b = boards) assert(b[0] / 2 + slot_side_fit <= hx, "a board is wider than the cavity");
assert(tp_y >= 0, "the TP4056's back is thicker than its holders' rail wall");
assert(rail_y1(tp_b) <= dividers[0] - divider_t / 2, "the TP4056's rails run into a fin");
assert(rail_y0(hc_board) >= dividers[0] + divider_t / 2, "the HC33's rails run into a fin");
assert(rail_y1(hc_board) <= dividers[1] - divider_t / 2, "the HC33's rails run into a fin");
assert(rail_y0(v4_board) >= dividers[2] + divider_t / 2, "the V4's rails run into a fin");
assert(rail_y1(v4_board) <= depth - slide_fit, "the V4's rails run into the front wall");
assert(divider_t + 0.6 <= layer_gap, "the fins leave their neighbours no room");
assert(v4_board[5] - hc_board[5] >= usb_open_h + 1.2, "the two bottom USB-C openings run together");
assert(tp_x0 - slot_side_fit - rail_wall >= -hx + 2, "the TP4056 doesn't fit across");
assert(tp_usb_cy - usb_open_h / 2 >= -1, "the TP4056's opening runs into the back wall");
assert(tp_usb_cz - usb_open_w / 2 >= floor_z, "the TP4056's opening runs into the bottom");
for (b = boards) assert(board_z0(b) - (floor_z + slide_fit) >= 0.6 - eps, "a board's rib has no floor under its slot");
assert(floor_channel_d <= bottom_t - 1, "the floor's channels leave too little floor");
assert(base_t <= band_margin, "the TPU base runs up into the bottom grip ring");
// Each key keeps 1 mm of wall either side at its widest; the right wall's
// sit outside the fins' grooves
assert((end_wall - key_d - 2 * key_flare) / 2 >= 1 && (side_wall - wall_groove_d - key_d - 2 * key_flare) / 2 >= 1 - eps,
       "the base's keys leave the walls too thin");
assert(key_h <= band_margin + band_h - base_t, "the base's keys reach the first inset ring");
assert(lead_y >= arc_y && arc_x > 0 && arc_y > 0, "the corner radius is too big for the outline");
// The cavity's corner keeps a wall behind an inset ring's knurl
assert(profile_r - norm([profile_r - side_wall, profile_r - end_wall]) - grip_inset >= 1.2, "the corners are too thin");
assert(end_wall - grip_inset >= 1.2, "the back and front walls are too thin behind the grip");
assert(knurl_d < grip_inset, "the knurl cuts through the TPU rings");
assert(side_wall - grip_inset - wall_groove_d >= 1.2, "the right wall is too thin behind the grip");
assert(ceiling - hook_h - nib_h >= divider_z1 + 0.3, "the top's hook runs into the fins");
assert(hook_y1 > hook_y0 + 5, "the back-right SMA leaves no room for the top's hook");
assert(nib_l + slide_fit <= side_wall - 2, "the hook's groove cuts through the right wall");
assert(hook_gusset_l >= hook_h, "the hook's gussets would print past 45°");
for (p = smas) {
  assert(abs(p[1]) + sma_nut_d / 2 <= hy - 0.3, "an SMA's inner nut hits the back or front wall");
  // The outer nut sits on the flat of the top: inside the outline inset by top_r
  assert(norm([max(abs(p[0]) - arc_x, 0), max(abs(p[1]) - arc_y, 0)]) + sma_nut_d / 2 <= profile_r - top_r,
         "an SMA's outer nut runs onto the rounded top edge");
}
assert(top_r < profile_r, "the top edge's radius is bigger than the corners'");
// The carriage slides in along +X, so a boss on the body may only sit where
// nothing on the carriage passes. The back ones sit over the TP4056's bars
// and behind the HC33, under the back-right SMA; the front one sits in
// front of the V4's rail, over the V4's holders, under the front-left SMA.
for (s = door_screws) {
  if (s[0] < 0) {
    assert(ds_z0(s) >= tp_divider_z1 + 0.5, "a back door-screw boss hits the TP4056's holders");
    assert(s[2] + boss_r <= hc_y - 0.3, "a back door-screw boss hits the HC33");
  } else {
    assert(ds_z0(s) >= board_z1(v4_board) + roof_fit + roof_t + 0.3, "the front door-screw boss hits the V4");
  }
  assert(s[1] + boss_r <= sma_low - 0.5, "a door-screw boss hits an SMA");
  // The head sits on the flat of a plain ring, or in its collar on an inset
  // ring's floor
  let(i = band_of(s[1]), h = seat_d / 2 + (inset_band(i) ? ring_margin : 0.25))
    assert(band_of(s[1] - h) == i && band_of(s[1] + h) == i
           && (!inset_band(i) || (s[1] - h >= band_z0(i) + grip_inset && s[1] + h <= band_z1(i) - grip_inset)),
           "a door screw's head runs across a ring's edge");
  assert(abs(ds_y(s)) + seat_d / 2 <= lead_y, "a door screw's head runs off the flat of the door face");
  // Inside the door seal
  assert(abs(ds_y(s)) + seat_d / 2 <= hy + seal_w / 2 - lip_t, "a door screw sits outside the door's seal");
}
for (i = [0:len(door_screws) - 1], j = [0:len(door_screws) - 1]) if (i < j)
  let(a = door_screws[i], b = door_screws[j]) assert(a[0] != b[0] || ds_z0(b) >= a[1] + boss_r || ds_z0(a) >= b[1] + boss_r,
    "two door-screw bosses run into each other");
assert(door_engage >= 6, "the door screws barely reach into their bosses");
assert(door_seat >= washer_t, "the door screws' seats are shallower than their washers");
// The top screws' bosses: clear of the front-left SMA's sweep, over the
// V4's holders, their heads on the flat of the top
for (x = top_screw_x) {
  assert(x - boss_r >= smas[0][0] + sma_nut_d / 2 + 0.5, "a top-screw boss hits the front-left SMA");
  assert(norm([max(abs(x) - arc_x, 0), max(top_screw_y - arc_y, 0)]) + seat_d / 2 <= profile_r - top_r,
         "a top screw's head runs onto the rounded top edge");
  assert(abs(x) + boss_r <= hx - 0.5, "a top-screw boss runs into the side walls");
}
assert(top_boss_low >= board_z1(v4_board) + roof_fit + roof_t + 0.3, "the top screws' bosses hit the V4's holders");
assert(depth - top_screw_in - boss_r >= dividers[2] + divider_t / 2 + 0.3 || top_boss_low >= divider_z1 + 0.3,
       "the top screws' bosses hit the V4's fin");
assert(top_engage >= 6, "the top screws barely reach into their bosses");
// Seals
assert(groove_d < seal_d - 0.5 && groove_w > 0.3 && (seal_w - groove_w) / 2 >= 0.6, "a seal channel's TPU walls are too thin");
assert(floor_z - floor_channel_d >= base_t + seal_w + 0.5, "the floor's seal channel runs into the fins' channels");
assert(seal_w <= end_wall - grip_inset - 1, "the end walls' seal channels leave too little wall");
assert(seal_d + 0.5 <= side_wall - grip_inset, "the top seal's channel cuts through the right wall's ridge");
// The side door
assert(sd_z - sd_dz - side_door_t - side_door_fit >= base_t + 0.8, "the side door's track runs into the base");
assert(sd_floor - 1 >= hx + wall_groove_d + 1, "the side door's gasket groove leaves too little right wall");
assert(sd_y + sd_travel + sd_dy + side_door_fit <= lead_y, "the side door's track runs off the right face");
// The plugs: flange and folded strap fit in the base's thickness
assert(plug_strap_t + plug_flange_t <= base_t - 0.2, "the plugs' flange and strap don't fit under the floor");
// The bars under the boards stay clear of the bottom USB-C plugs
assert(usb_open_w / 2 + 0.5 <= v4_w / 2 - v4_foot, "the V4's bottom bars have no edge to sit under");


// ---- outline and cavity

module outline() {
  hull() {
    for (sx = [-1, 1], sy = [-1, 1]) {
      translate([sx * arc_x, sy * arc_y]) circle(r = profile_r, $fn = 96);
      translate([sx * ex - (sx > 0 ? eps : 0), sy * lead_y - (sy > 0 ? eps : 0)]) square(eps);
    }
  }
}

// The outline inset by e, at height z
module slice(e, z) {
  translate([0, 0, z]) linear_extrude(eps) offset(delta = -e) outline();
}

// The outline extruded, its top edge a 45° lead onto a top_r arc
module shell(z0 = 0, z1 = total_h) {
  steps = 8;
  intersection() {
    union() {
      translate([0, 0, -1]) linear_extrude(top_z0 + 1) outline();
      hull() {
        slice(0, top_z0 - eps);
        for (i = [0:steps]) let(a = 45 + 45 * i / steps)
          slice(top_r * (1 - cos(a)), total_h - top_r + top_r * sin(a) - (i == steps ? eps : 0));
      }
    }
    translate([-ex - 1, -ey - 1, z0]) cube([2 * ex + 2, 2 * ey + 2, z1 - z0]);
  }
}

module cavity_2d() {
  hull() {
    for (sy = [-1, 1]) translate([hx - cavity_r, sy * (hy - cavity_r)]) circle(r = cavity_r);
    translate([-hx - 1, -hy]) square([eps, 2 * hy]);
  }
}

// Open on the left and at the top, and square through the top seal's
// band, where the carriage's top fills it: the top's lips would catch on
// rounded corners there as they slide home
module cavity() {
  translate([0, 0, floor_z]) linear_extrude(ceiling - floor_z + eps) cavity_2d();
  translate([-hx - 1, -hy, ceiling]) cube([2 * hx + 1, 2 * hy, seal_w + 1]);
}

// ---- grip rings

function arc_pts(cx, cy, r, a0, n) = [for (i = [0:n]) [cx + r * cos(a0 + 45 * i / n), cy + r * sin(a0 + 45 * i / n)]];

// The outline inset by e as points, counter-clockwise from the middle of
// the right face. Every inset gives the same points at the same places
// along their segments, so one inset's points map onto another's.
function outline_pts(e, n = 12) = let(r = profile_r - e, x = ex - e, ly = arc_y + r * (sqrt(2) - 1))
  concat([[x, 0], [x, ly]], arc_pts(arc_x, arc_y, r, 45, n), arc_pts(-arc_x, arc_y, r, 90, n),
         [[-x, ly], [-x, -ly]], arc_pts(-arc_x, -arc_y, r, 225, n), arc_pts(arc_x, -arc_y, r, 270, n),
         [[x, -ly], [x, 0]]);

function cumlen(p) = [for (i = 0, s = 0; i < len(p); s = s + (i + 1 < len(p) ? norm(p[i + 1] - p[i]) : 0), i = i + 1) s];

// The solid inside a knurled face from za to zb: square pyramids on a grid
// at ±45°, their tips on the outline inset by e and the grooves between
// them knurl_d deeper. The top and bottom rows stay on the tips' face so
// the knurl meets whatever is above and below it flush.
module knurl_core(za, zb, e = 0) {
  pe = outline_pts(e);
  pv = outline_pts(e + knurl_d);
  pin = outline_pts(e + knurl_d + 1);
  s = cumlen(pe);
  L = s[len(s) - 1];
  q = knurl_pitch / sqrt(2);
  n = 2 * max(2, round(L / q / 2));
  m = max(2, round((zb - za) / q));
  tab = function(p, k) [for (i = [0:len(p) - 1]) [s[i], p[i][k]]];
  ex_ = tab(pe, 0); ey_ = tab(pe, 1);
  vx = tab(pv, 0); vy = tab(pv, 1);
  ix = tab(pin, 0); iy = tab(pin, 1);
  outer = [for (j = [0:m], i = [0:n - 1]) let(t = i * L / n, z = za + (zb - za) * j / m,
                                            v = j > 0 && j < m && (i + j) % 2 == 0,
                                            p = v ? [lookup(t, vx), lookup(t, vy)] : [lookup(t, ex_), lookup(t, ey_)])
           [p[0], p[1], z]];
  inner = [for (z = [za, zb], i = [0:n - 1]) let(t = i * L / n) [lookup(t, ix), lookup(t, iy), z]];
  function o(i, j) = j * n + (i % n);
  function ib(i) = (m + 1) * n + (i % n);
  function it(i) = (m + 2) * n + (i % n);
  faces = concat(
    [for (j = [0:m - 1], i = [0:n - 1]) each ((i + j) % 2 == 0
      ? [[o(i, j), o(i, j + 1), o(i + 1, j + 1)], [o(i, j), o(i + 1, j + 1), o(i + 1, j)]]
      : [[o(i, j), o(i, j + 1), o(i + 1, j)], [o(i, j + 1), o(i + 1, j + 1), o(i + 1, j)]])],
    [for (i = [0:n - 1]) [o(i, 0), o(i + 1, 0), ib(i + 1), ib(i)]],
    [for (i = [0:n - 1]) [o(i, m), it(i), it(i + 1), o(i + 1, m)]],
    [for (i = [0:n - 1]) [ib(i), ib(i + 1), it(i + 1), it(i)]]);
  polyhedron(concat(outer, inner), faces);
}

// Where the rings stop: ring_margin round the side door's track and each
// door screw's head seat, and 1 mm short of the door face's seam on the
// body, which keeps PCTG between the rings and the door seal's channels
module ring_keepout() {
  m = ring_margin + side_door_fit + side_door_t;
  translate([hx, sd_y - sd_dy - m, sd_z - sd_dz - m])
    cube([side_wall + 2, 2 * sd_dy + sd_travel + 2 * m, 2 * (sd_dz + m)]);
  for (s = door_screws) translate([-ex - 1, ds_y(s), s[1]]) rotate([0, 90, 0])
    cylinder(d = seat_d + 2 * ring_margin, h = door_seat + 2);
  translate([-hx - eps, -ey - 1, 0]) cube([1 + eps, 2 * ey + 2, total_h]);
}

// An inset ring's recess in the PCTG: sunk grip_inset with 45° chamfers
// into it, stopping at ring_keepout()
module ring_recess(i) {
  z0 = band_z0(i);
  z1 = band_z1(i);
  difference() {
    ring_recess_whole(z0, z1);
    ring_keepout();
  }
}

module ring_recess_whole(z0, z1) {
  difference() {
    translate([0, 0, z0]) linear_extrude(z1 - z0) difference() {
      offset(delta = 1) outline();
      offset(delta = -(grip_inset + 0.5)) outline();
    }
    hull() { slice(0, z0 - eps); slice(grip_inset, z0 + grip_inset); }
    hull() { slice(grip_inset, z1 - grip_inset - eps); slice(0, z1); }
    translate([0, 0, z0 + grip_inset - eps]) linear_extrude(z1 - z0 - 2 * grip_inset + 2 * eps)
      offset(delta = -grip_inset) outline();
  }
}

module grip_cut() {
  for (i = [0:band_n - 1]) if (inset_band(i)) ring_recess(i);
}

// The TPU that fills the recesses, flush with the plain rings: diamond
// knurled knurl_d deep, or smooth where it prints facing the bed
module grip_rings(knurled = true) {
  for (i = [0:band_n - 1]) if (inset_band(i)) intersection() {
    ring_recess(i);
    if (knurled) knurl_core(band_z0(i), band_z1(i));
    else translate([0, 0, band_z0(i) - 1]) linear_extrude(band_z1(i) - band_z0(i) + 2) outline();
  }
}

// ---- body

// A board's rail on the right wall: a block from the wall to past the
// board's edge, slotted for the PCB between its floor and its roof, open
// to the left for the board to slide in.
module right_rail(b) {
  difference() {
    translate([b[0] / 2 - slot_engage, yb + rail_y0(b), floor_z - eps])
      cube([hx - b[0] / 2 + slot_engage + eps, rail_y1(b) - rail_y0(b), board_z1(b) + roof_fit + roof_t - floor_z + eps]);
    translate([0, yb, 0]) along_y(slot_y0(b), slot_y1(b)) polygon(side_slot(b, b[0] / 2, -1, board_z0(b), board_z1(b)));
  }
}

// The TP4056's rails at its USB-C end: below and above the receptacle
module tp_right_rails() {
  zr0 = tp_usb_cz - tp_usb_w / 2 - 0.5;
  zr1 = tp_usb_cz + tp_usb_w / 2 + 0.5;
  for (z = [[floor_z, zr0], [zr1, tp_z1 + roof_fit + roof_t]]) difference() {
    translate([tp_x1 - slot_engage, yb + rail_y0(tp_b), z[0] - eps])
      cube([hx - tp_x1 + slot_engage + eps, rail_y1(tp_b) - rail_y0(tp_b), z[1] - z[0] + eps]);
    translate([tp_x1 - slot_engage - 1, yb + slot_y0(tp_b), tp_z0])
      cube([slot_engage + 1 + slot_side_fit, slot_y1(tp_b) - slot_y0(tp_b), tp_w + roof_fit]);
  }
}

// Each fin's channel in the floor and groove up the right wall, and the
// cell's floor plate's channel, which takes the fins either side of it
module fin_channels() {
  w = divider_t / 2 + slide_fit;
  for (c = [[dividers[0] - w, dividers[0] + w], [dividers[1] - w, dividers[2] + w]])
    translate([-hx - 1, yb + c[0], floor_z - floor_channel_d]) cube([2 * hx + 1, c[1] - c[0], floor_channel_d + eps]);
  for (i = [0:len(dividers) - 1])
    translate([hx - eps, yb + dividers[i] - w, floor_z - floor_channel_d])
      cube([wall_groove_d + eps, 2 * w, divider_tops[i] + slide_fit - floor_z + floor_channel_d]);
}

// The groove in the right wall for the top's hook's nib, its roof at 45°
// so it prints
module hook_groove() {
  z0 = ceiling - hook_h - slide_fit;
  z1 = ceiling - hook_h + nib_h + slide_fit;
  along_y(hook_y0 - slide_fit, hook_y1 + slide_fit)
    polygon([[hx - eps, z0], [hx + nib_l + slide_fit, z0], [hx + nib_l + slide_fit, z1], [hx - eps, z1 + nib_l + slide_fit + eps]]);
}

module along_y(y0, y1) {
  translate([0, y1, 0]) rotate([90, 0, 0]) linear_extrude(y1 - y0) children();
}

// On the back and front walls, their undersides 45° down to the wall so
// they print
module door_screw_bosses() {
  for (s = door_screws) let(y = ds_y(s)) difference() {
    hull() {
      translate([-hx, y, s[1]]) rotate([0, 90, 0]) cylinder(r = boss_r, h = door_boss_l);
      translate([-hx, s[0] > 0 ? hy : -hy - eps, ds_z0(s)]) cube([door_boss_l, eps, s[1] + boss_r - ds_z0(s)]);
    }
    translate([-hx - 1, y, s[1]]) rotate([0, 90, 0]) cylinder(d = m3_pilot_d, h = door_engage + 1.5);
  }
}

// Hanging under the top off the front wall, their undersides 45° down to
// the wall
module top_screw_bosses() {
  for (x = top_screw_x) difference() {
    hull() {
      translate([x, top_screw_y, top_boss_z0]) cylinder(r = boss_r, h = ceiling - top_boss_z0);
      translate([x - boss_r, hy, top_boss_low]) cube([2 * boss_r, eps, ceiling - top_boss_low]);
    }
    translate([x, top_screw_y, ceiling - top_engage - 1]) cylinder(d = m3_pilot_d, h = top_engage + 2);
  }
}

module bottom_opening(y) {
  translate([0, yb + y, -1]) linear_extrude(floor_z + 2)
    offset(usb_open_r) square([usb_open_w - 2 * usb_open_r, usb_open_h - 2 * usb_open_r], center = true);
}

module side_opening() {
  translate([hx - 1, sd_y, sd_z]) rotate([0, 90, 0]) linear_extrude(side_wall + 2)
    offset(usb_open_r) square([2 * (sd_oz - usb_open_r), 2 * (sd_oy - usb_open_r)], center = true);
}

// The body, PCTG, with the side door in its track
module body() {
  difference() {
    intersection() {
      shell();
      translate([-hx, -ey - 1, base_t]) cube([ex + hx + 1, 2 * ey + 2, ceiling + seal_w - base_t]);
    }
    base_key_shapes();
    cavity();
    fin_channels();
    hook_groove();
    seal_blocks();
    seal_grooves();
    for (b = boards) bottom_opening(b[5]);
    side_track();
    side_gasket(1);
    side_opening();
    grip_cut();
  }
  for (b = boards) right_rail(b);
  tp_right_rails();
  door_screw_bosses();
  top_screw_bosses();
  side_door_printed();
}

// ---- seals

// The TPU Air on the body: channels across the floor's end and up the back
// and front walls' ends for the door face's lip, and round the tops of the
// back, front and right walls for the top's
module seal_blocks() {
  for (sy = [-1, 1]) translate([-hx - eps, sy > 0 ? hy : -hy - seal_w, base_t])
    cube([seal_d + eps, seal_w, ceiling + seal_w - base_t]);
  translate([-hx - eps, -hy - seal_w, base_t]) cube([seal_d + eps, 2 * (hy + seal_w), seal_w]);
  for (sy = [-1, 1]) translate([-hx - eps, sy > 0 ? hy : -hy - seal_w, ceiling])
    cube([2 * hx + seal_w + eps, seal_w, seal_w]);
  translate([hx, -hy - seal_w, ceiling]) cube([seal_w, 2 * (hy + seal_w), seal_w]);
}

// The grooves the lips press into. The top's back and front lips slide in
// along their grooves from the left, so those mouths flare.
module seal_grooves() {
  for (sy = [-1, 1]) translate([-hx - 1, sy * (hy + seal_w / 2) - groove_w / 2, seal_z_bottom - groove_w / 2])
    cube([1 + groove_d, groove_w, seal_z_top - seal_z_bottom + groove_w]);
  translate([-hx - 1, -(hy + seal_w / 2) - groove_w / 2, seal_z_bottom - groove_w / 2])
    cube([1 + groove_d, 2 * (hy + seal_w / 2) + groove_w, groove_w]);
  for (sy = [-1, 1]) {
    y0 = sy > 0 ? hy - 1 : -hy - groove_d;
    translate([-hx - 1, y0, seal_z_top - groove_w / 2]) cube([2 * hx + 1 + groove_d, groove_d + 1, groove_w]);
    hull() {
      translate([-hx - 1, y0, seal_z_top - lip_t / 2 - 0.2]) cube([eps, groove_d + 1, lip_t + 0.4]);
      translate([-hx + seal_lead, y0, seal_z_top - groove_w / 2]) cube([eps, groove_d + 1, groove_w]);
    }
  }
  translate([hx - 1, -hy - groove_d, seal_z_top - groove_w / 2]) cube([1 + groove_d, 2 * (hy + groove_d), groove_w]);
}

// The body's TPU Air: the seal channels and the side door's gasket
module body_seal() {
  difference() {
    union() {
      seal_blocks();
      side_gasket(0);
    }
    seal_grooves();
    door_screw_bosses();
  }
}

// The carriage's lips: up the door face's sides and across its foot into
// the end channels, and out round the top into the top's
module door_lips() {
  for (sy = [-1, 1]) translate([-hx - eps, sy * (hy + seal_w / 2) - lip_t / 2, seal_z_bottom - lip_t / 2])
    cube([lip_l + eps, lip_t, seal_z_top - seal_z_bottom + lip_t]);
  translate([-hx - eps, -(hy + seal_w / 2) - lip_t / 2, seal_z_bottom - lip_t / 2])
    cube([lip_l + eps, 2 * (hy + seal_w / 2) + lip_t, lip_t]);
}

module top_lips() {
  for (sy = [-1, 1]) translate([-hx - eps, sy > 0 ? hy - eps : -hy - lip_l, seal_z_top - lip_t / 2])
    cube([2 * hx + lip_l + eps, lip_l + eps, lip_t]);
  translate([hx - eps, -hy - lip_l, seal_z_top - lip_t / 2]) cube([lip_l + eps, 2 * (hy + lip_l), lip_t]);
}

// The washers: under the door screws' and top screws' heads, and the SMAs'
// outer nuts, each proud of its seat by washer_proud
module washer_at(d_out, d_in) {
  difference() {
    cylinder(d = d_out, h = washer_t);
    translate([0, 0, -1]) cylinder(d = d_in, h = washer_t + 2);
  }
}

module carriage_seal() {
  for (s = door_screws) translate([-ex + door_seat - washer_proud, ds_y(s), s[1]]) rotate([0, 90, 0])
    washer_at(seat_d, m3_clear_d);
  for (x = top_screw_x) translate([x, top_screw_y, total_h - top_seat + washer_proud - washer_t])
    washer_at(seat_d, m3_clear_d);
  for (p = smas) translate([p[0], p[1], total_h + washer_proud - washer_t]) washer_at(sma_nut_d + 1, sma_hole_d);
}

// ---- side door

// The door's section in XZ about the opening's centre, its inner face at
// xi: a dovetail, wider at its inner face, so the track holds it
module side_door_2d(xi, grow = 0) {
  offset(delta = grow) polygon([[xi, -sd_dz - side_door_t], [xi + side_door_t, -sd_dz],
                                [xi + side_door_t, sd_dz], [xi, sd_dz + side_door_t]]);
}

module side_door_at(y, xi, grow = 0) {
  along_y(sd_y + y - sd_dy - grow, sd_y + y + sd_dy + grow) translate([0, sd_z]) side_door_2d(xi, grow);
}

// The track: everywhere the door goes with side_door_fit round it, open to
// the face. Over its last side_door_wedge of travel it steps the door in
// onto the gasket.
module side_track() {
  hull() {
    side_door_at(sd_travel, sd_x_open, side_door_fit);
    side_door_at(side_door_wedge, sd_x_open, side_door_fit);
  }
  hull() {
    side_door_at(side_door_wedge, sd_x_open, side_door_fit);
    side_door_at(0, sd_x_shut, side_door_fit);
  }
}

// The gasket round the opening: its groove in the track's floor (cut 1) or
// the TPU Air in it (cut 0), standing side_gasket_proud out of the floor
module side_gasket(cut) {
  translate([sd_floor - 1, sd_y, sd_z]) rotate([0, 90, 0]) linear_extrude(1 + (cut ? eps : side_gasket_proud))
    difference() {
      offset(r = usb_open_r + side_gasket_margin + side_gasket_w) square([2 * (sd_oz - usb_open_r), 2 * (sd_oy - usb_open_r)], center = true);
      offset(r = usb_open_r + side_gasket_margin) square([2 * (sd_oz - usb_open_r), 2 * (sd_oy - usb_open_r)], center = true);
    }
}

// The door, shut: trimmed to the case's outline at its back end, with two
// finger grooves at its front end
module side_door() {
  difference() {
    intersection() {
      side_door_at(0, sd_x_shut);
      translate([0, 0, -1]) linear_extrude(total_h) outline();
    }
    for (k = [0, 1]) translate([ex, sd_y + sd_dy - 1.5 - 2 * k, sd_z]) rotate([0, 0, 45])
      cube([0.8, 0.8, 2 * sd_dz - 2], center = true);
  }
}

// As it prints: open, clear of the gasket, held by break-off ties under
// its lower edge
module side_door_printed() {
  translate([sd_x_open - sd_x_shut, sd_travel, 0]) side_door();
  for (k = [0:side_door_ties - 1]) let(y = sd_y + sd_travel + (k / (side_door_ties - 1) - 0.5) * (2 * sd_dy - 2 * side_door_tie_w))
    intersection() {
      side_door_at(sd_travel, sd_x_open, side_door_fit + eps);
      translate([sd_x_open - 1, y - side_door_tie_w / 2, sd_z - sd_dz - side_door_t - 2])
        cube([side_door_t + 2, side_door_tie_w, 2 + side_door_t - 0.5]);
    }
}

// ---- bottom plugs

// What comes out of the base for a plug: the flange's recess, the whole
// base deep, and the strap's groove out to the edge
module plug_cut(y) {
  s = plug_s(y);
  j = plug_join(y);
  translate([-plug_fx - 0.3, min(j - s * 0.3, j + s * (2 * plug_fy + 0.3)), -1])
    cube([2 * (plug_fx + 0.3), 2 * plug_fy + 0.6, base_t + 1 + eps]);
  translate([-plug_strap_w / 2 - 0.3, min(j, s * (ey + 1)), -1])
    cube([plug_strap_w + 0.6, abs(s * (ey + 1) - j), plug_strap_t + 1.1]);
}

module plug_stem() {
  linear_extrude(floor_z - plug_short - plug_strap_t - plug_flange_t)
    offset(r = usb_open_r + plug_fit) square([usb_open_w - 2 * usb_open_r, usb_open_h - 2 * usb_open_r], center = true);
}

// As it prints, on the bed out past the base's edge: the strap leaves the
// edge over the groove at 45°, so it folds back under into the groove, then
// the flange folds back over the strap's end and the stem goes up the port
module plug_printed(y) {
  s = plug_s(y);
  e = s * ey;
  l = plug_strap_l(y) + 2;
  t = plug_strap_t;
  hull() {
    translate([-plug_strap_w / 2, e - (s > 0 ? 0.5 : 0), t]) cube([plug_strap_w, 0.5, t]);
    translate([-plug_strap_w / 2, e + s * t - (s > 0 ? 0 : eps), 0]) cube([plug_strap_w, eps, t]);
  }
  translate([-plug_strap_w / 2, min(e + s * t, e + s * (t + l)), 0]) cube([plug_strap_w, l, t]);
  f0 = e + s * (t + l);
  translate([-plug_fx, min(f0, f0 + s * 2 * plug_fy) - (s > 0 ? eps : -eps), 0]) cube([2 * plug_fx, 2 * plug_fy, plug_flange_t]);
  translate([0, f0 + s * plug_fy, plug_flange_t]) plug_stem();
}

// In the port, the strap left out
module plug_installed(y) {
  translate([-plug_fx, y - plug_fy, plug_strap_t]) cube([2 * plug_fx, 2 * plug_fy, plug_flange_t]);
  translate([0, y, plug_strap_t + plug_flange_t]) plug_stem();
}

// ---- TPU base

// A key: flaring as it rises into the wall, so the PETG printed over it
// holds it
module base_key_shapes() {
  for (k = base_keys) translate([k[0], k[1], base_t - eps])
    cylinder(d1 = key_d, d2 = key_d + 2 * key_flare, h = key_h + eps);
}

// The body's TPU: the base, its knurled rings and the plugs, as they print
// or in their ports
module body_tpu(plugs_in = false) {
  tpu_base();
  for (y = plug_ports) if (plugs_in) plug_installed(y); else plug_printed(y);
  intersection() {
    grip_rings();
    translate([-hx, -ey - 1, 0]) cube([ex + hx + 1, 2 * ey + 2, ceiling + seal_w]);
  }
}

// The rest of the base, under the door face, printed with the carriage
module door_foot() {
  intersection() {
    shell();
    translate([-ex - 1, -ey - 1, 0]) cube([ex - hx + 1, 2 * ey + 2, base_t]);
  }
}

// The carriage's TPU: its foot, and its share of the rings, flush. The door face is the
// carriage's bed, so its knurl is 90° V-grooves at ±45°, knurl_d deep and
// knurl_pitch apart, whose walls print at 45°; they stop knurl_d short of
// the ring's chamfers and the face's lead-ins. The leads and corners stay
// smooth: knurl there would face down past 45°.
module carriage_tpu() {
  door_foot();
  difference() {
    intersection() {
      grip_rings(false);
      translate([-ex - 1, -ey - 1, 0]) cube([ex - hx + 1, 2 * ey + 2, total_h]);
    }
    for (i = [0:band_n - 1]) if (inset_band(i)) door_knurl(band_z0(i) + knurl_d, band_z1(i) - knurl_d);
  }
}

module door_knurl(z0, z1) {
  yl = lead_y - knurl_d;
  s = knurl_d * sqrt(2);
  span = 2 * yl + (z1 - z0);
  n = ceil(span / knurl_pitch);
  intersection() {
    translate([-ex - 1, -yl, z0]) cube([1 + knurl_d + eps, 2 * yl, z1 - z0]);
    for (dir = [-1, 1], k = [-n:n]) translate([-ex, 0, (z0 + z1) / 2]) rotate([dir * 45, 0, 0])
      translate([0, k * knurl_pitch, 0]) rotate([0, 0, 45]) cube([s, s, 2 * span], center = true);
  }
}

// Under the body, with the bottom USB-C openings through it
module tpu_base() {
  difference() {
    intersection() {
      shell();
      translate([-hx, -ey - 1, 0]) cube([ex + hx + 1, 2 * ey + 2, base_t]);
    }
    for (b = boards) bottom_opening(b[5]);
    for (y = plug_ports) plug_cut(y);
  }
  base_key_shapes();
}

// ---- carriage, modelled in place

// A board's rib on the door face: from the face to past the board's edge,
// slotted for the PCB between a floor and a roof, open to the right for the
// board to slide in. Kept clear of the body's back and front walls.
module left_rib(b, x_edge, z0, z1) {
  x0 = -hx - eps;
  zf = max(floor_z + slide_fit, z0 - roof_t);
  y0 = max(rail_y0(b), slide_fit);
  y1 = min(rail_y1(b), depth - slide_fit);
  difference() {
    translate([x0, yb + y0, zf]) cube([x_edge + slot_engage - x0, y1 - y0, z1 + roof_fit + roof_t - zf]);
    translate([0, yb, 0]) along_y(slot_y0(b), slot_y1(b)) polygon(side_slot(b, x_edge, 1, z0, z1));
  }
}

// A slotted bar along a board's top or bottom edge from x0 to x1, z0 to
// z1, with a web back to the fin at y_fin; the slot runs zs0 to zs1. Off
// the door face it stands on the bed as the carriage prints; a bar that
// starts clear of it runs 45° back to the fin instead.
module edge_bar(b, y_fin, x0, x1, z0, z1, zs0, zs1, on_door) {
  yn = y_fin > b[1] ? rail_y1(b) : rail_y0(b);
  yo = y_fin > b[1] ? rail_y0(b) : rail_y1(b);
  difference() {
    if (on_door) translate([x0, yb + min(y_fin, yo), z0]) cube([x1 - x0, abs(y_fin - yo), z1 - z0]);
    else hull() {
      translate([x0 - abs(yn - y_fin), yb + y_fin - eps / 2, z0]) cube([x1 - x0 + abs(yn - y_fin), eps, z1 - z0]);
      translate([x0 + abs(yo - yn), yb + yo - eps / 2, z0]) cube([max(x1 - x0 - abs(yo - yn), eps), eps, z1 - z0]);
    }
    translate([x0 - 30, yb + slot_y0(b), zs0]) cube([x1 - x0 + 60, slot_y1(b) - slot_y0(b), zs1 - zs0]);
  }
}

// A board's bars: over its top edge, split round top_gap(b); under its
// bottom edge either side of the USB-C and its plug's opening. Each stops
// short of the body's rail.
module board_bars(b, y_fin) {
  x1 = b[0] / 2 - slot_engage - slide_fit;
  z0 = board_z0(b);
  z1 = board_z1(b);
  g = top_gap(b) / 2;
  u = usb_open_w / 2 + 0.5;
  for (seg = g > 0 ? [[-hx - eps, -g, true], [g, x1, false]] : [[-hx - eps, x1, true]])
    edge_bar(b, y_fin, seg[0], seg[1], z1 - slot_engage, z1 + roof_fit + roof_t, z1 - slot_engage - 1, z1 + roof_fit, seg[2]);
  for (seg = [[-hx - eps, -u, true], [u, x1, false]])
    edge_bar(b, y_fin, seg[0], seg[1], floor_z + slide_fit, z0 + bottom_engage, z0, z0 + bottom_engage + 1, seg[2]);
}

// The TP4056's slotted bars along its bottom and top edges, from the door
// face to short of the body's rails, between the back of its slot and its
// fin
module tp_bars() {
  x1 = tp_x1 - slot_engage - slide_fit;
  y0 = rail_y0(tp_b);
  y1 = dividers[0];
  for (z = [[floor_z + slide_fit, tp_z0 + slot_engage, tp_z0, tp_z0 + slot_engage + 1],
            [tp_z1 - slot_engage, tp_z1 + roof_fit + roof_t, tp_z1 - slot_engage - 1, tp_z1 + roof_fit]])
    difference() {
      translate([-hx - eps, yb + y0, z[0]]) cube([x1 + hx + eps, y1 - y0, z[1] - z[0]]);
      translate([-hx - 1, yb + slot_y0(tp_b), z[2]]) cube([x1 + hx + 2, slot_y1(tp_b) - slot_y0(tp_b), z[3] - z[2]]);
    }
}

module fins() {
  for (i = [0:len(dividers) - 1]) translate([-hx - eps, yb + dividers[i] - divider_t / 2, fin_z0])
    cube([2 * hx + wall_groove_d - slide_fit + eps, divider_t, divider_tops[i] - fin_z0]);
}

// The cell's floor plate between its fins, and a roof over its top end at
// each side; the wires come out between the roofs
module cell_cradle() {
  y0 = dividers[1] - divider_t / 2;
  y1 = dividers[2] + divider_t / 2;
  translate([-hx - eps, yb + y0, fin_z0]) cube([2 * hx - slide_fit + eps, y1 - y0, floor_z - fin_z0]);
  for (x = [-hx - eps, hx - slide_fit - cell_roof_reach])
    translate([x, yb + y0, cell_z1 + roof_fit]) cube([cell_roof_reach + eps, y1 - y0, roof_t]);
}

// Under the top: the hook at the right edge, its left face 45° up to the
// top so it prints
module top_mates() {
  x = hx - slide_fit;
  zb = ceiling - hook_h;
  along_y(hook_y0, hook_y1)
    polygon([[x - hook_h, ceiling + eps], [x, ceiling + eps], [x, zb + nib_h + nib_l + slide_fit],
             [hx + nib_l, zb + nib_h], [hx + nib_l, zb], [x, zb]]);
  // Its gussets, their lower edges 45° or steeper as the carriage prints
  for (y = spread(hook_y0 + hook_gusset_t / 2, hook_y1 - hook_gusset_t / 2, hook_gusset_pitch))
    along_y(y - hook_gusset_t / 2, y + hook_gusset_t / 2)
      polygon([[x - hook_gusset_l, ceiling + eps], [x, ceiling + eps], [x, zb]]);
}

// The carriage, PCTG: the door face, the top over the seal band, and the
// top's lower part filling the cavity inside the top seal
module carriage() {
  difference() {
    union() {
      intersection() {
        shell();
        union() {
          translate([-ex - 1, -ey - 1, base_t]) cube([ex - hx + 1, 2 * ey + 2, total_h]);
          translate([-ex - 1, -ey - 1, ceiling + seal_w]) cube([2 * ex + 2, 2 * ey + 2, total_h]);
          translate([-hx - 1, -hy, ceiling]) cube([2 * hx + 1, 2 * hy, seal_w + eps]);
        }
      }
      top_mates();
      door_lips();
      top_lips();
    }
    for (p = smas) translate([p[0], p[1], ceiling - 1]) {
      cylinder(d = sma_hole_d, h = total_h - ceiling + 2);
      translate([0, 0, total_h - ceiling + 1 + washer_proud - washer_t]) cylinder(d = sma_nut_d + 1, h = washer_t + 1);
    }
    for (s = door_screws) translate([-ex - 1, ds_y(s), s[1]]) rotate([0, 90, 0]) {
      cylinder(d = m3_clear_d, h = side_wall + 2);
      cylinder(d = seat_d, h = 1 + door_seat - washer_proud + washer_t);
    }
    for (x = top_screw_x) translate([x, top_screw_y, ceiling - 1]) {
      cylinder(d = m3_clear_d, h = total_h - ceiling + 2);
      translate([0, 0, total_h - ceiling + 1 - top_seat + washer_proud - washer_t]) cylinder(d = seat_d, h = top_seat + 1);
    }
    grip_cut();
  }
  fins();
  cell_cradle();
  tp_bars();
  left_rib(tp_b, tp_x0, tp_z0, tp_z1);
  for (b = boards) left_rib(b, -b[0] / 2, board_z0(b), board_z1(b));
  board_bars(hc_board, dividers[1] - divider_t / 2);
  board_bars(v4_board, dividers[2] + divider_t / 2);
}

// The carriage drawn out d to the left of where it sits
module carriage_out(d = 0) {
  translate([-d, 0, 0]) children();
}

// ---- print orientations

// On its door face
module carriage_print() {
  translate([0, 0, ex]) rotate([0, -90, 0]) carriage();
}

module carriage_tpu_print() {
  translate([0, 0, ex]) rotate([0, -90, 0]) carriage_tpu();
}

module carriage_seal_print() {
  translate([0, 0, ex]) rotate([0, -90, 0]) carriage_seal();
}

// ---- reference parts

module ref_cell() {
  translate([-cell_w / 2, yb + cell_y + cell_fit, floor_z]) cube([cell_w, cell_t, cell_l]);
}

// A board as its PCB, its parts as blocks either side, clear of the
// edges the slots hold, and its USB-C. back/front: the tallest parts
// behind and in front of the PCB
module ref_board(b, back, front) {
  z0 = board_z0(b);
  e = slot_engage + 1;
  translate([-b[0] / 2, yb + b[1], z0]) cube([b[0], b[2], b[3]]);
  if (back > 0) translate([-b[0] / 2 + e, yb + b[1] - back, z0 + 3]) cube([b[0] - 2 * e, back, b[3] - 6]);
  translate([-b[0] / 2 + e, yb + b[1] + b[2], z0 + 3]) cube([b[0] - 2 * e, front, b[3] - 6]);
  translate([-4.5, yb + b[5] - 1.6, floor_z + usb_gap]) cube([9, 3.2, b[4] + 7]);
}

module ref_hc() { ref_board(hc_board, hc_under, hc_over); }
// The V4 as Heltec draws it: the PCB with its nose and chamfered USB-C
// end, the OLED and its bracket in front, the GNSS connector and the
// battery and solar connectors behind, the buttons by the USB-C
module ref_v4() {
  b = v4_board;
  z0 = board_z0(b);
  w = b[0] / 2;
  translate([0, yb + b[1] + b[2], 0]) rotate([90, 0, 0]) linear_extrude(b[2])
    polygon([[-w + v4_foot, z0], [w - v4_foot, z0], [w, z0 + v4_foot], [w, z0 + v4_l - v4_nose],
             [w - v4_nose, z0 + v4_l], [-w + v4_nose, z0 + v4_l], [-w, z0 + v4_l - v4_nose], [-w, z0 + v4_foot]]);
  translate([-9.6, yb + b[1] + b[2], z0 + 14.8]) cube([19.2, v4_over, 33]);
  translate([-7.5, yb + b[1] - v4_under, z0 + 37.9]) cube([15, v4_under, 5.3]);
  for (sx = [-1, 1]) translate([sx > 0 ? 2.45 : -6.7, yb + b[1] - 3.4, z0 + 1.06]) cube([4.25, 3.4, 4.2]);
  for (sx = [-1, 1]) translate([sx > 0 ? 6.26 : -9.56, yb + b[1] + b[2], z0 + 1.1]) cube([3.3, 2.52, 4.65]);
  translate([-4.47, yb + b[5] - 1.95, floor_z + usb_gap]) cube([8.94, 3.9, b[4] + 7.6]);
}

module ref_tp() {
  translate([tp_x0, yb + tp_pcb_y, tp_z0]) cube([tp_l, tp_pcb, tp_w]);
  translate([tp_x1 + tp_usb_overhang - 7.5, yb + tp_pcb_y + tp_pcb, tp_usb_cz - tp_usb_w / 2]) cube([7.5, tp_usb_h, tp_usb_w]);
}

module ref_sma() {
  for (p = smas) translate([p[0], p[1], ceiling]) {
    translate([0, 0, -(sma_behind - 2)]) cylinder(d = 6.35, h = sma_behind - 2 + total_h - ceiling + 8);
    translate([0, 0, -2]) cylinder(d = sma_nut_d, h = 2, $fn = 6);
    translate([0, 0, total_h - ceiling + washer_proud]) cylinder(d = sma_nut_d, h = 2, $fn = 6);
  }
}
