// HT-HC33 LiPo case: a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), a Heltec
// WiFi LoRa 32 V4, a 103665 LiPo pouch cell and a USB-C TP4056 charger
// board, stacked face to face like a stack of cards in a case that stands
// on end. The bottom is flat: the HC33 and V4 are flashed over the air.
// The TP4056's USB-C comes out of the right side, and two SMA bulkheads
// out of the top at opposite corners.
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
//   wall. M3 cap screws through the door face and down through the top
//   thread into the thick back and front walls, outside the seals.
//
// It is sealed. PCTG lips on the carriage press into grooves in TPU Air
// channels on the body: up the back and front walls' ends and across the
// floor's end for the door face, and round the back, front and right
// walls' tops (on a ridge over the ceiling) for the top. The back and front
// top lips slide home along their grooves; the rest press in at the end of
// the slide. TPU Air washers seal the SMAs' outer nuts, and a PCTG door in a dovetail track on the right face slides shut over the
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

// The side USB-C opening, sized for a plug's overmold: long side, short
// side, corner radius; and a USB-C receptacle's width, which the bars under
// the HC33's and V4's bottom edges stop either side of
usb_open_w = 13;
usb_open_h = 7;
usb_open_r = 1;
usbc_w = 9;

// SMA bulkheads (1/4-36) through the top: in from the cavity's back and
// front walls (far enough that the outer nut sits on the flat of the
// top), the hole, the inner nut across corners, and how far the
// connector's back and the pigtail's bend reach down from the top
sma_in_y = 5.6;
sma_hole_d = 6.6;
sma_nut_d = 9.2;
sma_behind = 12;

// Walls: the door face; the right wall (thick enough for the top's right
// row of screws); the back and front; the bottom (over the TPU base, deep
// enough for the door face's bottom row of screws under the floor's seal
// channel, under the fins' channels); the top (the SMAs' plate, over the
// top seal)
side_wall = 6;
right_wall = 9.3;
end_wall = 9.3;
bottom_t = 9.8;
top_t = 5;

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

// TPU Air washers under the SMAs' outer nuts: how thick, how far proud of
// their seats
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
// The ridge you push it by: how far it stands proud of the door, its width
// and its distance in from the door's front end
side_door_grip_h = 1.5;
side_door_grip_w = 2.4;
side_door_grip_in = 2;

// The TPU Air base under the whole case, printed in place under the body
// and the door face on the U1: its thickness; the keys it carries up into
// the body's walls
// (diameter at the base, how far up, how much wider at the top), and how
// far apart they are along the walls
base_t = 1.5;
key_d = 2.2;
key_h = 1.5;
key_flare = 0.4;
key_pitch = 10;

// Corner radius seen from the top, and the top edge's radius: small, so
// the faces stay flat out to the screws' heads
profile_r = 2;
top_r = 1.5;

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

// M3 socket-head cap screws, counterbored: clearance hole, pilot, the
// counterbore (head's diameter and height), and the length under the head
m3_clear_d = 3.4;
m3_pilot_d = 2.5;
m3_cbore_d = 6.2;
m3_cbore_h = 3.2;
screw_len = 10;

// Every screw threads into a wall or the floor, outside the seals: the
// axes' distance out from the cavity's face; how many go up each side of
// the door face (evenly, corner to corner), across its bottom between
// them, along the top's back and front edges, and along its right edge
// between those
screw_in = 4.5;
door_screws_per_side = 7;
door_screws_bottom = 3;
top_screws_per_wall = 3;
top_screws_right = 3;

// The skin: everything outside the PCTG core, grip_inset thick, is TPU,
// round the sides and over the top: orange TPU 75A knurled grip rings and,
// between them and over the top, smooth TPU Air. The rings' height, the
// skin's thickness, the knurl's pitch and depth, the margin under the top
// edge, and the least height of the short rings at the bottom (on the
// base) and at the top (up to the top's seam)
band_h = 14;
grip_inset = 2;
knurl_pitch = 2;
knurl_d = 0.8;
band_margin = 2;
band_end_min = 6;

// The PCTG left bare round the side door's track, its housing
ring_margin = 1.5;
// END_PARAMS

eps = 0.01;

hx = cell_w / 2 + cell_fit;
// The floor's top
floor_z = base_t + bottom_t;
// The door face's and the right face's distance out from the cavity's
// centre; the outline is centred on xo, half as wide as both
ex_l = hx + side_wall;
ex_r = hx + right_wall;
xo = (right_wall - side_wall) / 2;
exw = hx + (side_wall + right_wall) / 2;

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

// Outline: corner arcs about (xo ± arc_x, ±arc_y), and 45° lead-ins from
// the arcs onto the left and right faces
arc_x = exw - profile_r;
arc_y = ey - profile_r;
lead_y = arc_y + (sqrt(2) - 1) * profile_r;

// Whether a disc of radius rad centred at (x, y) sits on the flat of the
// top: inside the outline, its corners and lead-ins, inset by top_r + rad
function on_top_flat(x, y, rad) = let(xr = abs(x - xo), yr = abs(y), d = top_r + rad, rp = max(profile_r - d, 0),
                                      cx = exw - d - rp, cy = ey - d - rp)
  norm([max(xr - cx, 0), max(yr - cy, 0)]) <= rp + 1e-6 && xr + yr <= exw + lead_y - d * sqrt(2) + 1e-6;
// The farthest x right of xo a disc of radius rad at y can go on the flat
function top_flat_x(y, rad) = let(yr = abs(y), d = top_r + rad, rp = max(profile_r - d, 0), cx = exw - d - rp, cy = ey - d - rp)
  xo + min(yr <= cy ? cx + rp : cx + sqrt(max(rp * rp - pow(yr - cy, 2), 0)), exw + lead_y - d * sqrt(2) - yr);

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

// How far each screw threads into its wall past its counterbore
door_engage = screw_len - (side_wall - m3_cbore_h);
top_engage = screw_len - (top_t - m3_cbore_h);
screw_y = hy + screw_in;

// The door face's lowest screws, as low as their counterbores clear the
// TPU foot
door_z_low = base_t + m3_cbore_d / 2 + 0.5;
// The seals: the floor's channel over the lowest screws; the centre lines
// across the floor's end and round the top
seal_floor_z0 = door_z_low + m3_pilot_d / 2 + 0.8;
seal_z_bottom = seal_floor_z0 + seal_w / 2;
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
sd_floor = ex_r - side_door_t - (side_gasket_proud - side_door_squish);
sd_x_shut = ex_r - side_door_t;
sd_x_open = sd_floor + side_gasket_proud + side_door_fit;
sd_travel = sd_dy + sd_oy + 0.5;

// The hook under the top's right edge spans the top's length clear of the
// back-right SMA's nut and the cavity's front-right corner
hook_y0 = smas[1][1] + sma_nut_d / 2 + 0.5;
hook_y1 = hy - cavity_r - slide_fit;

// Grip rings from the bottom up, [z0, z1, inset]: a short TPU ring from the
// bottom, an odd number of band_h rings starting and ending plain, and a
// short TPU ring up to the top's seam, the two short ones the same height
band_top = min(top_z0 - band_margin, ceiling + seal_w);
band_mid = let(n = floor((band_top - 2 * band_end_min) / band_h)) n % 2 == 1 ? n : n - 1;
band_end = (band_top - band_mid * band_h) / 2;
bands = concat([[0, band_end, true]],
               [for (k = [0:band_mid - 1]) [band_end + k * band_h, band_end + (k + 1) * band_h, k % 2 == 1]],
               [[band_top - band_end, band_top, true]]);
band_n = len(bands);
function band_z0(i) = bands[i][0];
function band_z1(i) = bands[i][1];
function band_of(z) = [for (i = [0:band_n - 1]) if (z >= bands[i][0] && z < bands[i][1]) i][0];
function inset_band(i) = i != undef && bands[i][2];

// The door-face screws, [y, z]: up each wall's end, evenly from the bottom
// corner to the top one (as high as the pilot stays in the wall), and
// across the bottom between them into the floor's end, under its seal
door_z_high = ceiling + seal_w - m3_pilot_d / 2 - 0.8;
door_screws = concat(
  [for (sy = [-1, 1], k = [0:door_screws_per_side - 1])
     [sy * screw_y, door_z_low + (door_z_high - door_z_low) * k / (door_screws_per_side - 1)]],
  [for (k = [1:door_screws_bottom]) [-screw_y + 2 * screw_y * k / (door_screws_bottom + 1), door_z_low]]);
// The top screws, [x, y]: along the back and front walls' tops, from clear
// of the door screws at the left to the rounded corner at the right; and
// down the right wall's top between those, evenly
top_x0 = -hx + door_engage + 4;
top_x1 = top_flat_x(screw_y, m3_cbore_d / 2 + 0.2);
top_screws = concat(
  [for (sy = [-1, 1], k = [0:top_screws_per_wall - 1])
     [top_x0 + (top_x1 - top_x0) * k / (top_screws_per_wall - 1), sy * screw_y]],
  [for (k = [1:top_screws_right]) [hx + screw_in, -screw_y + 2 * screw_y * k / (top_screws_right + 1)]]);

// The base's keys, under the middle of the back and front walls and of the
// right wall outside the fins' grooves
function spread(a, b, pitch = key_pitch) = let(n = max(1, floor((b - a) / pitch))) [for (i = [0:n]) a + (b - a) * i / n];
base_keys = concat(
  [for (sy = [-1, 1], x = spread(-hx + seal_d + key_d + 1, hx - key_d)) [x, sy * (hy + end_wall / 2)]],
  [for (y = spread(-hy + key_d, hy - key_d)) [hx + wall_groove_d + 3.5, y]]);

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
assert(tp_x0 - slot_side_fit - rail_wall >= -hx + 2, "the TP4056 doesn't fit across");
assert(tp_usb_cy - usb_open_h / 2 >= -1, "the TP4056's opening runs into the back wall");
assert(tp_usb_cz - usb_open_w / 2 >= floor_z, "the TP4056's opening runs into the bottom");
for (b = boards) assert(board_z0(b) - (floor_z + slide_fit) >= 0.6 - eps, "a board's rib has no floor under its slot");
assert(floor_channel_d <= bottom_t - 1, "the floor's channels leave too little floor");
// Each key keeps 1 mm of wall either side at its widest; the right wall's
// sit outside the fins' grooves
assert((end_wall - key_d - 2 * key_flare) / 2 >= 1 && 3.5 - key_d / 2 - key_flare >= 1 - eps,
       "the base's keys leave the walls too thin");
assert(lead_y >= arc_y && arc_x > 0 && arc_y > 0, "the corner radius is too big for the outline");
// The corners keep their walls' thickness: the radius is under them
assert(profile_r <= min(side_wall, end_wall, right_wall), "the corners are too thin");
assert(end_wall - grip_inset >= 1.2, "the back and front walls are too thin behind the grip");
assert(knurl_d < grip_inset, "the knurl cuts through the TPU rings");
assert(right_wall - grip_inset - wall_groove_d >= 1.2, "the right wall is too thin behind the grip");
assert(ceiling - hook_h - nib_h >= divider_z1 + 0.3, "the top's hook runs into the fins");
assert(hook_y1 > hook_y0 + 5, "the back-right SMA leaves no room for the top's hook");
assert(nib_l + slide_fit <= right_wall - 2, "the hook's groove cuts through the right wall");
assert(hook_gusset_l >= hook_h, "the hook's gussets would print past 45°");
for (p = smas) {
  assert(abs(p[1]) + sma_nut_d / 2 <= hy - 0.3, "an SMA's inner nut hits the back or front wall");
  assert(on_top_flat(p[0], p[1], sma_nut_d / 2), "an SMA's outer nut runs onto the rounded top edge");
}
assert(top_r < profile_r, "the top edge's radius is bigger than the corners'");
// The screws: in the walls, outside the seal channels and clear of the
// rings; heads on the flats of the door face and the top
assert(screw_in - m3_pilot_d / 2 >= seal_w + 0.8, "the screws run into the seal channels");
assert(end_wall - grip_inset - screw_in - m3_pilot_d / 2 >= 0.8, "the screws run into the grip rings");
assert(screw_y + m3_cbore_d / 2 <= lead_y, "the door screws' heads run off the flat of the door face");
assert(top_x1 - top_x0 >= 10 * (top_screws_per_wall - 1), "the top screws are crowded");
assert(top_t >= m3_cbore_h + 1.2, "the top is too thin for the screws' counterbores");
assert(door_engage >= 6 && top_engage >= 6, "the screws barely reach into the walls");
// The door screws' heads stay on the door face's flat, off its rounded
// top edge, and have room between them; the right row's pilots stay in the
// right wall clear of its rings, its heads on the top's flat
assert(door_z_high + m3_cbore_d / 2 <= top_z0 - 0.3, "the top door screws' heads run onto the rounded top edge");
assert((door_z_high - door_z_low) / (door_screws_per_side - 1) >= m3_cbore_d + 1, "the door screws up the sides are crowded");
assert(2 * screw_y / (door_screws_bottom + 1) >= m3_cbore_d + 1, "the door screws across the bottom are crowded");
assert(right_wall - grip_inset - screw_in - m3_pilot_d / 2 >= 0.8, "the top's right screws run into the grip rings");
for (t = top_screws) assert(on_top_flat(t[0], t[1], m3_cbore_d / 2 + 0.2), "a top screw's head runs onto the rounded top edge");
assert(2 * screw_y / (top_screws_right + 1) >= m3_cbore_d + 1, "the top's right screws are crowded");
// The top screws' pilots stay clear of the door screws' pilots
assert(top_x0 - m3_pilot_d / 2 >= -hx + door_engage + 1 + 1.5, "the top and door screws meet");
// Seals
assert(groove_d < seal_d - 0.5 && groove_w > 0.3 && (seal_w - groove_w) / 2 >= 0.6, "a seal channel's TPU walls are too thin");
assert(floor_z - floor_channel_d >= seal_floor_z0 + seal_w + 0.5, "the floor's seal channel runs into the fins' channels");
assert(seal_w <= end_wall - grip_inset - 1, "the end walls' seal channels leave too little wall");
assert(seal_d + 0.5 <= right_wall - grip_inset, "the top seal's channel cuts through the right wall's ridge");
// The side door
assert(sd_z - sd_dz - side_door_t - side_door_fit >= base_t + 0.8, "the side door's track runs into the base");
assert(sd_floor - 1 >= hx + wall_groove_d + 1, "the side door's gasket groove leaves too little right wall");
assert(sd_y + sd_travel + sd_dy + side_door_fit <= lead_y, "the side door's track runs off the right face");
assert(sd_dz - 1 - side_door_grip_h >= 3, "the side door's grip ridge is too short to push");
// The bars under the boards stay clear of the USB-Cs
assert(usbc_w / 2 + 0.5 <= v4_w / 2 - v4_foot, "the V4's bottom bars have no edge to sit under");


// ---- outline and cavity

module outline() {
  hull() {
    for (sx = [-1, 1], sy = [-1, 1]) {
      translate([xo + sx * arc_x, sy * arc_y]) circle(r = profile_r, $fn = 96);
      translate([xo + sx * exw - (sx > 0 ? eps : 0), sy * lead_y - (sy > 0 ? eps : 0)]) square(eps);
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
    translate([-ex_l - 1, -ey - 1, z0]) cube([ex_l + ex_r + 2, 2 * ey + 2, z1 - z0]);
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
function outline_pts(e, n = 12) = let(r = max(profile_r - e, 0.05), x = exw - e, ly = arc_y + r * (sqrt(2) - 1))
  [for (p = concat([[x, 0], [x, ly]], arc_pts(arc_x, arc_y, r, 45, n), arc_pts(-arc_x, arc_y, r, 90, n),
                   [[-x, ly], [-x, -ly]], arc_pts(-arc_x, -arc_y, r, 225, n), arc_pts(arc_x, -arc_y, r, 270, n),
                   [[x, -ly], [x, 0]])) [p[0] + xo, p[1]]];

function cumlen(p) = [for (i = 0, s = 0; i < len(p); s = s + (i + 1 < len(p) ? norm(p[i + 1] - p[i]) : 0), i = i + 1) s];

// The solid inside a knurled face from za to zb: a diamond knurl of 90°
// V-grooves at ±45°, knurl_pitch apart and knurl_d deep, leaving flat
// diamond lands on the outline inset by e. It is one heightfield round the
// whole perimeter: the grid's step puts every groove bottom and land edge
// on a grid diagonal, each cell is split into four through its centre so
// both diagonals are edges, and the columns are a whole number of groove
// periods, so the pattern meets itself where the perimeter closes. Where
// the band's height isn't a whole number of steps, the rows above and
// below stay on the lands' face.
module knurl_core(za, zb, e = 0) {
  pe = outline_pts(e);
  pv = outline_pts(e + knurl_d);
  pin = outline_pts(e + grip_inset + 0.5);
  s = cumlen(pe);
  L = s[len(s) - 1];
  // groove period along s or z, the steps in one period, and the steps
  // from a groove's bottom to its land's edge
  per = knurl_pitch * sqrt(2);
  k = round(per / (knurl_d * sqrt(2) / 2));
  kd = k * knurl_d / knurl_pitch;
  n = k * round(L / per);
  h = L / n;
  m = floor((zb - za) / h);
  z0 = (za + zb - m * h) / 2;
  tab = function(p, c) [for (i = [0:len(p) - 1]) [s[i], p[i][c]]];
  ex_ = tab(pe, 0); ey_ = tab(pe, 1);
  vx = tab(pv, 0); vy = tab(pv, 1);
  ix = tab(pin, 0); iy = tab(pin, 1);
  // Depth at grid point (a, b), counted in steps: knurl_d at a groove's
  // bottom, falling to nothing at its land's edge, kd steps either side.
  // Grooves run along a + b and a - b, k steps apart, so they sit exactly
  // on the grid.
  function dd(q) = abs(q - k * round(q / k));
  function depth(a, b) = knurl_d * max(0, 1 - min(dd(a + b), dd(a - b)) / kd);
  function pt(a, b) = let(t = a * h, f = depth(a, b) / knurl_d)
    [lookup(t, ex_) + (lookup(t, vx) - lookup(t, ex_)) * f, lookup(t, ey_) + (lookup(t, vy) - lookup(t, ey_)) * f, z0 + b * h];
  corners = [for (j = [0:m], i = [0:n - 1]) pt(i, j)];
  centres = [for (j = [0:m - 1], i = [0:n - 1]) pt(i + 0.5, j + 0.5)];
  ring = function(z) [for (i = [0:n - 1]) let(t = i * h) [lookup(t, ex_), lookup(t, ey_), z]];
  inner = function(z) [for (i = [0:n - 1]) let(t = i * h) [lookup(t, ix), lookup(t, iy), z]];
  // the lands' face below and above the knurl, then the inner wall
  pts = concat(corners, centres, ring(za), ring(zb), inner(za), inner(zb));
  nc = n * (m + 1);
  ncc = n * m;
  function c(i, j) = j * n + (i % n);
  function cc(i, j) = nc + j * n + (i % n);
  function lo(i) = nc + ncc + (i % n);
  function hi(i) = nc + ncc + n + (i % n);
  function ilo(i) = nc + ncc + 2 * n + (i % n);
  function ihi(i) = nc + ncc + 3 * n + (i % n);
  faces = concat(
    [for (j = [0:m - 1], i = [0:n - 1]) each [
      [c(i, j), cc(i, j), c(i + 1, j)],
      [c(i + 1, j), cc(i, j), c(i + 1, j + 1)],
      [c(i + 1, j + 1), cc(i, j), c(i, j + 1)],
      [c(i, j + 1), cc(i, j), c(i, j)]]],
    [for (i = [0:n - 1]) [lo(i), c(i, 0), c(i + 1, 0), lo(i + 1)]],
    [for (i = [0:n - 1]) [c(i, m), hi(i), hi(i + 1), c(i + 1, m)]],
    [for (i = [0:n - 1]) [lo(i), lo(i + 1), ilo(i + 1), ilo(i)]],
    [for (i = [0:n - 1]) [hi(i), ihi(i), ihi(i + 1), hi(i + 1)]],
    [for (i = [0:n - 1]) [ilo(i), ilo(i + 1), ihi(i + 1), ihi(i)]]);
  polyhedron(pts, faces);
}

// Where the rings stop: ring_margin round the side door's track
module ring_keepout() {
  m = ring_margin + side_door_fit + side_door_t;
  translate([hx, sd_y - sd_dy - m, sd_z - sd_dz - m])
    cube([right_wall + 2, 2 * sd_dy + sd_travel + 2 * m, 2 * (sd_dz + m)]);
}

// The case's shell inset by e over its sides and its top, its top edge
// rounded the same way
module shell_inset(e) {
  steps = 8;
  union() {
    translate([0, 0, -1]) linear_extrude(top_z0 + 1) offset(delta = -e) outline();
    hull() {
      slice(e, top_z0 - eps);
      for (i = [0:steps]) let(a = 45 + 45 * i / steps, rr = max(top_r - e, 0.05))
        slice(top_r - rr * cos(a), total_h - top_r + rr * sin(a) - (top_r - rr) - (i == steps ? eps : 0));
    }
  }
}

// The skin: grip_inset thick over the sides and the top, above the base,
// except the side door's housing, which stays PCTG
module skin() {
  difference() {
    intersection() {
      shell();
      translate([-ex_l - 1, -ey - 1, base_t]) cube([ex_l + ex_r + 2, 2 * ey + 2, total_h]);
    }
    shell_inset(grip_inset);
    ring_keepout();
  }
}

module inset_bands() {
  for (i = [0:band_n - 1]) if (inset_band(i))
    translate([-ex_l - 1, -ey - 1, band_z0(i)]) cube([ex_l + ex_r + 2, 2 * ey + 2, band_z1(i) - band_z0(i)]);
}

// What the PCTG gives up to the skin
module grip_cut() {
  skin();
}

// The orange TPU rings, diamond knurled
module grip_rings() {
  intersection() {
    skin();
    inset_bands();
    union() for (i = [0:band_n - 1]) if (inset_band(i)) knurl_core(band_z0(i), band_z1(i));
  }
}

// The TPU Air skin: between the rings and over the top
module air_skin() {
  difference() {
    skin();
    inset_bands();
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

// The screws' pilots in the walls: in from the door face's seam, and down
// from the ridge's top
module screw_pilots() {
  for (s = door_screws) translate([-hx - 1, s[0], s[1]]) rotate([0, 90, 0])
    cylinder(d = m3_pilot_d, h = 1 + door_engage + 1);
  for (t = top_screws) translate([t[0], t[1], ceiling + seal_w - (top_engage - (top_t - m3_cbore_h) + 1)])
    cylinder(d = m3_pilot_d, h = top_engage + 2);
}

module side_opening() {
  translate([hx - 1, sd_y, sd_z]) rotate([0, 90, 0]) linear_extrude(right_wall + 2)
    offset(usb_open_r) square([2 * (sd_oz - usb_open_r), 2 * (sd_oy - usb_open_r)], center = true);
}

// The body, PCTG, with the side door in its track
module body() {
  difference() {
    intersection() {
      shell();
      translate([-hx, -ey - 1, base_t]) cube([ex_r + hx + 1, 2 * ey + 2, ceiling + seal_w - base_t]);
    }
    base_key_shapes();
    cavity();
    fin_channels();
    hook_groove();
    seal_blocks();
    seal_grooves();
    screw_pilots();
    side_track();
    side_gasket(1);
    side_opening();
    grip_cut();
  }
  for (b = boards) right_rail(b);
  tp_right_rails();
  side_door_printed();
}

// ---- seals

// The TPU Air on the body: channels across the floor's end and up the back
// and front walls' ends for the door face's lip, and round the tops of the
// back, front and right walls for the top's
module seal_blocks() {
  for (sy = [-1, 1]) translate([-hx - eps, sy > 0 ? hy : -hy - seal_w, seal_floor_z0])
    cube([seal_d + eps, seal_w, ceiling + seal_w - seal_floor_z0]);
  translate([-hx - eps, -hy - seal_w, seal_floor_z0]) cube([seal_d + eps, 2 * (hy + seal_w), seal_w]);
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

// The body's TPU Air: the seal channels, the side door's gasket, the base
// and its share of the skin
module body_seal() {
  difference() {
    union() {
      seal_blocks();
      side_gasket(0);
      tpu_base();
      intersection() {
        air_skin();
        body_region();
      }
    }
    seal_grooves();
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

// The washers under the SMAs' outer nuts, proud of their seats by
// washer_proud
module washer_at(d_out, d_in) {
  difference() {
    cylinder(d = d_out, h = washer_t);
    translate([0, 0, -1]) cylinder(d = d_in, h = washer_t + 2);
  }
}

// The carriage's TPU Air: the base's strip under the door face, its share
// of the skin, and the SMAs' washers
module carriage_seal() {
  door_foot();
  difference() {
    intersection() {
      air_skin();
      carriage_region();
    }
    screw_holes();
    for (p = smas) translate([p[0], p[1], ceiling]) cylinder(d = sma_hole_d, h = total_h);
  }
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

// The door, shut: trimmed to the case's outline at its back end, with a
// ridge standing out near its front end to push and pull it by. The ridge
// stays inside the door's outer face's height, clear of the track's lips,
// and its ends run 45° into the door so it prints standing up.
module side_door() {
  intersection() {
    side_door_at(0, sd_x_shut);
    translate([0, 0, -1]) linear_extrude(total_h) outline();
  }
  h = side_door_grip_h;
  zh = sd_dz - 1;
  translate([0, sd_y + sd_dy - side_door_grip_in - side_door_grip_w, 0]) rotate([90, 0, 0]) mirror([0, 0, 1])
    linear_extrude(side_door_grip_w)
      polygon([[ex_r - eps, sd_z - zh], [ex_r + h, sd_z - zh + h], [ex_r + h, sd_z + zh - h], [ex_r - eps, sd_z + zh]]);
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

// ---- TPU base

// A key: flaring as it rises into the wall, so the PETG printed over it
// holds it
module base_key_shapes() {
  for (k = base_keys) translate([k[0], k[1], base_t - eps])
    cylinder(d1 = key_d, d2 = key_d + 2 * key_flare, h = key_h + eps);
}

module body_region() {
  translate([-hx, -ey - 1, -1]) cube([ex_r + hx + 1, 2 * ey + 2, ceiling + seal_w + 1]);
}

module carriage_region() {
  translate([-ex_l - 1, -ey - 1, -1]) cube([ex_l - hx + 1, 2 * ey + 2, total_h + 2]);
  translate([-ex_l - 1, -ey - 1, ceiling + seal_w]) cube([ex_l + ex_r + 2, 2 * ey + 2, total_h]);
}

// The body's orange TPU: its share of the knurled rings
module body_tpu() {
  intersection() {
    grip_rings();
    body_region();
  }
}

// The carriage's orange TPU: its share of the rings, the knurl running on
// unbroken from the body's. On the door face, which is the carriage's bed,
// the grooves' walls print at 45°.
module carriage_tpu() {
  difference() {
    intersection() {
      grip_rings();
      carriage_region();
    }
    screw_holes();
  }
}

// The TPU Air base, base_t thick under the whole case: under the body with
// its keys, and under the door face
module tpu_base() {
  intersection() {
    shell();
    translate([-hx, -ey - 1, 0]) cube([ex_r + hx + 1, 2 * ey + 2, base_t]);
  }
  base_key_shapes();
}

module door_foot() {
  intersection() {
    shell();
    translate([-ex_l - 1, -ey - 1, 0]) cube([ex_l - hx + 1, 2 * ey + 2, base_t]);
  }
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
      translate([min(x0 + abs(yo - yn), x1 - eps), yb + yo - eps / 2, z0]) cube([max(x1 - x0 - abs(yo - yn), eps), eps, z1 - z0]);
    }
    translate([x0 - 30, yb + slot_y0(b), zs0]) cube([x1 - x0 + 60, slot_y1(b) - slot_y0(b), zs1 - zs0]);
  }
}

// A board's bars: over its top edge, split round top_gap(b); under its
// bottom edge either side of the USB-C. Each stops
// short of the body's rail.
module board_bars(b, y_fin) {
  x1 = b[0] / 2 - slot_engage - slide_fit;
  z0 = board_z0(b);
  z1 = board_z1(b);
  g = top_gap(b) / 2;
  u = usbc_w / 2 + 0.5;
  for (seg = g > 0 ? [[-hx - eps, -g, true], [g, x1, false]] : [[-hx - eps, x1, true]])
    edge_bar(b, y_fin, seg[0], seg[1], z1 - slot_engage, z1 + roof_fit + roof_t, z1 - slot_engage - 1, z1 + roof_fit, seg[2]);
  // the right one leans back to its fin at 45°, so it starts that far
  // further out
  lean = abs((y_fin > b[1] ? rail_y1(b) : rail_y0(b)) - y_fin);
  for (seg = [[-hx - eps, -u, true], [u + lean, x1, false]])
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
          translate([-ex_l - 1, -ey - 1, base_t]) cube([ex_l - hx + 1, 2 * ey + 2, total_h]);
          translate([-ex_l - 1, -ey - 1, ceiling + seal_w]) cube([ex_l + ex_r + 2, 2 * ey + 2, total_h]);
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
    screw_holes();
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

// The screws' clearance holes and counterbores through the door face and
// the top, through the TPU as well as the PCTG
module screw_holes() {
  for (s = door_screws) translate([-ex_l - 1, s[0], s[1]]) rotate([0, 90, 0]) {
    cylinder(d = m3_clear_d, h = side_wall + 2);
    cylinder(d = m3_cbore_d, h = 1 + m3_cbore_h);
  }
  for (t = top_screws) translate([t[0], t[1], ceiling + seal_w - 1]) {
    cylinder(d = m3_clear_d, h = top_t + 2);
    translate([0, 0, 1 + top_t - m3_cbore_h]) cylinder(d = m3_cbore_d, h = m3_cbore_h + 1);
  }
}

// The carriage drawn out d to the left of where it sits
module carriage_out(d = 0) {
  translate([-d, 0, 0]) children();
}

// ---- print orientations

// On its door face
module carriage_print() {
  translate([0, 0, ex_l]) rotate([0, -90, 0]) carriage();
}

module carriage_tpu_print() {
  translate([0, 0, ex_l]) rotate([0, -90, 0]) carriage_tpu();
}

module carriage_seal_print() {
  translate([0, 0, ex_l]) rotate([0, -90, 0]) carriage_seal();
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
