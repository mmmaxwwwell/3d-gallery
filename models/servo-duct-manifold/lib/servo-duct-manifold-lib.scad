// BEGIN_DESCRIPTION
// A kit of airflow modules for 100 mm (4") dryer duct that all join the
// same way: a twist joint, where a plug turns 20° into a socket, a ramp
// pulls it in onto a TPU seal printed into the socket, and a key drops
// in to hold it shut. Eight optional M3 cap screws can clamp it too.
// Modules: straight tubes, 45° elbows, duct adapters, a socket coupler,
// servo butterfly valves, manifolds, and sensor sections. Manifolds come
// two ways: polar (a trunk with branches leaning out round it) and cubic
// (unit cubes laid out cell by cell, with a port on any face).
// END_DESCRIPTION

// BEGIN_PARAMS
// Outside diameter of every tube (mm). The duct slips over a spigot this
// size and a hose clamp holds it, so it is the duct's inside diameter
// less a little: 100 suits 4" foil or vinyl dryer duct.
duct_d = 100;

// Wall thickness of every tube (mm). The bore is duct_d less twice this.
wall = 3;

// How the pieces join. twist: a plug turns into a socket and locks, with
// a TPU seal (every module). bolt: the original flat flange with four M3s
// (the hub, butterfly valve and spigot adapter only).
joint = "twist"; // [twist, bolt]

// How far a plug turns in its socket from going in to locked (degrees).
// Over the turn its lugs ride a ramp that pulls it in onto the seal.
twist_angle = 20;

// How far the plug's tip presses into the socket's TPU seal once locked
// (mm).
gasket_squeeze = 0.5;

// What the optional M3 cap screws round a twist joint bite into on the
// plug side. thread: a 2.5 mm pilot the screw cuts its own thread in.
// nut: a clearance hole with an M3 nut in a hex pocket behind it.
m3_grip = "thread"; // [thread, nut]

// Thickness of a bolt flange (mm). Two flanges and an M3 nut make up the
// M3 x 10 bolt, so keep 7 unless the bolt length changes too.
flange_thickness = 7;

// Across-flats width of the hex pocket at each flange bolt (mm). One
// flange of a joint takes the M3 nut in it, the other the cap-screw
// head, so it is a nut's 5.5 plus clearance.
nut_af = 5.8;

// Depth of the hex pocket at each flange bolt (mm). Deep enough to seat
// a cap-screw head (3) or a nut (2.4).
pocket_depth = 3.2;

// Length of the spigot the duct slides over (mm), from the end of the
// part back to the flange or servo bracket that stops the duct.
spigot_length = 45;

// How far the retaining bead near a spigot's end stands proud (mm). The
// hose clamp goes on behind it, so the duct can't pull off over it.
bead = 1.5;

// Length of a straight tube, joint face to joint face (mm).
tube_length = 100;

// Number of ports on the polar hub: one trunk pointing down, the rest
// branches leaning out from it and spread evenly round it.
ports = 3;

// How many of the hub's ports carry a valve in the assembly preview.
// Branches take them first and the trunk last; every port without one
// gets a spigot adapter.
valved_ports = 2;

// How far each hub branch leans from vertical (degrees). The hub prints
// trunk-down with no supports, so every surface overhangs by at most
// this: keep it at or under 45.
branch_tilt = 45;

// Cells of the cubic manifold, as boxes: every six numbers are one box's
// opposite corners [x0, y0, z0, x1, y1, z1], counted in cells. The cells
// have to form a tree (no 2 x 2 block), because each one twists onto the
// one before it.
cubic_cells = [0, 0, 0, 0, 3, 0];

// Ports on the cubic manifold: every five numbers are one port,
// [x, y, z, face, plug]. x, y, z is the cell; face is 1 for +x, -1 for
// -x, 2 for +y, -2 for -y, 3 for +z, -3 for -z; plug is 1 for a plug, 0
// for a socket.
cubic_ports = [0, 0, 0, -2, 0, 0, 0, 0, 3, 1, 0, 1, 0, 3, 1, 0, 2, 0, 3, 1, 0, 3, 0, 3, 1];

// Thickness of the butterfly disc (mm).
disc_thickness = 3;

// Gap between the disc and the bore, all round (mm). The disc can swing
// freely inside a sphere this much smaller than the bore.
disc_clearance = 0.5;

// Width of the rib the disc turns on (mm). It runs across the disc's
// top face and holds the drive socket and the pivot pin.
hub_width = 12;

// Side of the square key on the drive coupler (mm). It drops into a
// matching socket in the disc's rib, set diamond-wise so it prints
// without support.
key_size = 4;

// Clearance on printed fits: key in socket, coupler in its bore, horn in
// its pocket, plug in socket (mm, per side).
fit = 0.2;

// SG90 body length (mm), along the servo's long axis.
servo_body_length = 22.8;

// SG90 body width (mm).
servo_body_width = 12.4;

// Distance from the servo's output shaft to the nearer end of its body
// (mm).
servo_shaft_offset = 5.9;

// Centre-to-centre distance between the servo's two mounting-tab holes
// (mm).
servo_tab_holes = 27.8;

// Distance from the face of the servo's mounting tabs (the side the
// shaft sticks out of) to the far face of the horn once it is pressed
// on (mm). Datasheets disagree by about 1.5 mm, so measure yours: the
// horn pocket takes up to 2 mm less than this, not more.
servo_horn_face = 12;

// Length of the servo's straight two-arm horn, tip to tip (mm).
horn_length = 34;

// Width of the horn across its widest point, at the hub (mm).
horn_width = 7.2;

// Thickness of the horn's arms (mm).
horn_thickness = 1.6;

// How far open the discs are drawn in the assembly preview (degrees;
// 0 is shut, 90 is wide open).
preview_open = 35;

// Size of the print bed (mm). Every part has to fit on it and under
// the same height.
print_bed = 220;
// END_PARAMS

// ---------------------------------------------------------------------
// Derived

R = duct_d / 2;
r = R - wall;

hex_r = nut_af / sqrt(3);
bolt_r = R + hex_r + 1.2;
flange_r = bolt_r + hex_r + 2.5;
// On the diagonals, clear of the servo bracket (+x) and the pivot boss
// (-x), so a hex key comes straight down on every bolt.
bolt_angles = [45, 135, 225, 315];
bolt_hole = 3.4;
cb_d = 6.4;
cb_depth = 3.2;

// Twist joint, in a port frame: joint face at z = 0, +z out of the part.
// The plug's spigot carries two lugs at +-y. The socket's L-slots take
// them in at twist_angle round from there and ramp them `draw` deeper
// on the way to lock, so the spigot's chamfered tip bites into the TPU
// liner in the socket's 45° floor.
spigot_r = r + 2.5;
lug_h = 2;
lug_arc = 10;
// The hook face is 50° off the joint plane, the top 55°: an upright plug
// prints its hooks at 40°, and an on-bed socket its slot roofs at 35°.
hook_rise = lug_h * tan(50);
top_rise = lug_h * tan(55);
lug_flat = 1;
draw = gasket_squeeze + 0.3;
// The ledge over the lug keeps 3.5 mm at the entry end of the ramp.
lug_z = 3.5 + draw;
spigot_len = lug_z + hook_rise + lug_flat + top_rise + 2.5;
socket_r = spigot_r + fit;
slot_r = spigot_r + lug_h + fit;
socket_wall_r = slot_r + 3;
gasket_t = 1.2;
// The PETG floor sits this far past the spigot tip's cone along z, and
// the liner stands gasket_squeeze proud of where the tip ends up.
cone_off = (gasket_t - gasket_squeeze) * sqrt(2);
socket_depth = spigot_len + cone_off;
socket_t = 6;
plug_t = 8;
screw_r = socket_wall_r + cb_d / 2 + 0.8;
joint_r = screw_r + cb_d / 2 + 2;
// Off the lugs (+-y) and the key notch (+x).
m3_spots = [for (k = [0 : 7]) 22.5 + 45 * k];
pilot_d = 2.5;
notch_w = 4;
notch_d = 3;
notch_in = screw_r - 1;
// A cap head seats 3.2 into the socket; the screw then reaches this far
// into the plug.
m3_len = m3_grip == "nut" ? 12 : 10;

// What the hub and the valve see of whichever joint is in use.
end_r = joint == "bolt" ? flange_r : joint_r;
end_screw_r = joint == "bolt" ? bolt_r : screw_r;
end_socket_t = joint == "bolt" ? flange_thickness : socket_t;
end_plug_t = joint == "bolt" ? flange_thickness : plug_t;

// Disc and its rib. The rib's axis sits hub_axis above the disc's bed
// face, just high enough to hold the diamond socket over a 1.2 floor.
disc_r = r - disc_clearance;
key_hole = key_size + 2 * fit;
hub_axis = key_hole * sqrt(2) / 2 + 1.2;
key_depth = 7;

// Drive coupler: a head with the horn pocket, a shaft through the wall,
// the key into the rib. Printed head-down, so the pocket's floor is a
// 45° gable over the horn instead of a bridge.
shaft_d = 8;
head_len = horn_length + 4;
head_w = horn_width + 2 * fit + 2.4;
horn_pocket = horn_thickness + 2.4;
head_t = horn_pocket + (horn_width + 2 * fit) / 2 + 1.5;
sweep_r = norm([head_len / 2, head_w / 2]) + 1;

// Radial stations out from the valve axis on the servo side.
boss_face = R + 1.5;
head_inner = boss_face + 0.5;
head_face = head_inner + head_t;
plate_t = 4;
plate_out = head_face - horn_pocket + servo_horn_face;
plate_in = plate_out - plate_t;

// Servo: long axis across the tube (y), body reaching toward -y.
// The cavity is shallower than the coupler is long, so the coupler goes
// in through a notch cut down the plate on the shaft line: lowered in
// with its head still out through the plate, it slides in until the key
// is flush with the bore, and the rest of the way once the disc is in.
servo_mid = servo_body_length / 2 - servo_shaft_offset;
tab_y = [-servo_mid - servo_tab_holes / 2, -servo_mid + servo_tab_holes / 2];
notch_w_plate = head_w + 2 * fit + 0.6;
bracket_y = max(sweep_r, -tab_y[0] + 2.5, tab_y[1] + 2.5) + 3;
bracket_z = sweep_r + 3;
notch_bottom = -head_len / 2 - 1;

// Valve section heights, bottom joint face at z = 0. With a twist joint
// the disc clears the socket below it and a plug tops the section; its
// flange flares out of the tube at 45° right over the coupler cavity,
// with a slot through it for the coupler to go in by.
valve_base = joint == "bolt" ? flange_thickness : socket_depth + 1.5;
pivot_z = valve_base + r + 3;
bracket_top = pivot_z + bracket_z;
body_h = joint == "bolt" ? bracket_top + spigot_length : bracket_top + (joint_r - R) + plug_t;
coupler_slot_w = max(head_w, shaft_d) + 2 * fit + 1;

// Idle pivot: an M3 cap screw through a counterbored boss threads into
// the wall and runs in a plain hole in the rib.
boss_len = 9;
boss_d = 12;
pin_thread = R + boss_len - cb_depth - r;
pin_len = [for (l = [12, 16, 20, 25]) if (l >= pin_thread + disc_clearance + 5) l][0];
pin_socket = pin_len - pin_thread - disc_clearance + 1;

// Hub. The trunk stands on its joint; the branches start from its axis
// at junction_z. That height leaves a hex key 25 mm above every trunk
// screw before the branches' undersides; the branch length keeps each
// branch's joint 20 mm of key room clear of its neighbour's tube.
branches = ports - 1;
branch_gap = acos(pow(cos(branch_tilt), 2) + pow(sin(branch_tilt), 2) * cos(360 / branches));
// A branch's underside runs z = junction_z + (x - R cos t) cot t - R sin t
// at distance x out from the trunk axis; hold it 25 over the screws.
junction_z = max(end_socket_t + 10,
                 joint == "bolt" ? 0 : socket_depth + 2,
                 end_socket_t + 25 + R * sin(branch_tilt)
                 - (end_screw_r - R * cos(branch_tilt)) / tan(branch_tilt));
port_len = end_plug_t + 20 + (R + 2 + end_screw_r * max(0, cos(branch_gap))) / sin(branch_gap);

// Straight and bent modules.
elbow_bend_r = duct_d * 0.75;
elbow_foot = socket_depth + 3;
elbow_reach = plug_t + 2;

// Cubic manifold: one cell per print, a cube a joint fits on the face of.
cube_u = ceil((2 * joint_r + 4) / 5) * 5;
cube_wall = 4;
cube_chamfer = 6;

assert(branch_tilt > 0 && branch_tilt <= 45,
       str("branch_tilt ", branch_tilt, " must be in (0, 45]: the hub prints trunk-down without supports"));
assert(ports >= 3, "ports must be at least 3: a trunk and two branches");
assert(valved_ports >= 0 && valved_ports <= ports, "valved_ports must be between 0 and ports");
assert(plate_in > head_face + 1,
       str("servo_horn_face ", servo_horn_face, " leaves the servo plate inside the coupler head; it must be at least ",
           horn_pocket + plate_t + 1));
assert(notch_w_plate / 2 + 2.1 <= min(-tab_y[0], tab_y[1]),
       "the coupler notch in the servo plate runs into a tab hole: horn_width is too wide for the servo");
assert(notch_bottom > 3 - bracket_z, "the coupler notch would cut the servo plate in two");
assert(pin_socket < disc_r / 2, "the pivot pin's socket runs past the middle of the disc");
assert(pivot_z + disc_r < body_h + (joint == "bolt" ? 0 : spigot_len),
       "the open disc would stand out of the valve's top: lengthen spigot_length");
assert(body_h <= print_bed, str("the valve section is ", body_h, " mm tall, over print_bed ", print_bed));
assert(2 * max(flange_r, joint_r) <= print_bed, "a flange is wider than print_bed");
assert(twist_angle >= 10 && twist_angle <= 30, "twist_angle must be between 10 and 30");
assert(gasket_squeeze > 0 && gasket_squeeze < gasket_t, str("gasket_squeeze must be under the liner's ", gasket_t, " mm"));
assert(tube_length >= socket_depth + 1.5 + plug_t + joint_r - R,
       str("tube_length must be at least ", socket_depth + 1.5 + plug_t + joint_r - R, " to hold both joints"));

echo(pin_screw = str("M3 x ", pin_len, " SHCS"), joint_screw = str("M3 x ", m3_len, " SHCS"),
     valve_height = body_h, hub_port_length = port_len, cube_unit = cube_u);

// ---------------------------------------------------------------------
// 2D helpers

// A hole of diameter d with a 45° peak on top (+y), for holes printed
// with their axis horizontal.
module teardrop(d) {
  circle(d = d);
  rotate(45) square(d / 2);
}

// Extrudes a 2D profile drawn in (y, z) along +x.
module along_x(len, center = false) {
  rotate([90, 0, 90]) linear_extrude(len, center = center) children();
}

// ---------------------------------------------------------------------
// Frames. A frame is a 4x4 rigid matrix: origin p, +z along d, +y along
// the lug axis (made square to d), +x = y x z.

function unit(v) = v / norm(v);

function frame(p, d, lug = [0, 1, 0]) =
  let (z = unit(d),
       l = norm(cross(lug, z)) > 1e-6 ? lug : [1, 0, 0],
       y = unit(l - (l * z) * z),
       x = cross(y, z))
  [[x.x, y.x, z.x, p.x], [x.y, y.y, z.y, p.y], [x.z, y.z, z.z, p.z], [0, 0, 0, 1]];

// The level direction square to d. A port tilted in the print pose puts
// its lugs this way, the only place they print within 45°.
function level_lug(d) = norm(cross([0, 0, 1], d)) > 1e-6 ? cross([0, 0, 1], d) : [0, 1, 0];

function rigid_inv(m) =
  let (t = [m[0][3], m[1][3], m[2][3]],
       c = [for (i = [0 : 2]) [m[0][i], m[1][i], m[2][i]]])
  [[c[0][0], c[0][1], c[0][2], -(c[0] * t)],
   [c[1][0], c[1][1], c[1][2], -(c[1] * t)],
   [c[2][0], c[2][1], c[2][2], -(c[2] * t)],
   [0, 0, 0, 1]];

flip_x = [[1, 0, 0, 0], [0, -1, 0, 0], [0, 0, -1, 0], [0, 0, 0, 1]];

// Places a child part so its frame f (in the child's own coordinates)
// meets frame m face to face, locked.
module mate(m, f) {
  multmatrix(m * flip_x * rigid_inv(f)) children();
}

// ---------------------------------------------------------------------
// Twist joint. Every module draws these in its port frames. `back` is
// the flange's far side: "flat" for a joint on the bed or tilted 45°,
// "cone" for one facing up (its flange would overhang), "none" inside a
// cube wall.

module _lug_2d() {
  polygon([[spigot_r - 1, lug_z - tan(50)], [spigot_r, lug_z],
           [spigot_r + lug_h, lug_z + hook_rise],
           [spigot_r + lug_h, lug_z + hook_rise + lug_flat],
           [spigot_r, lug_z + hook_rise + lug_flat + top_rise],
           [spigot_r - 1, lug_z + hook_rise + lug_flat + top_rise + tan(55)]]);
}

// The lug grown by fit on every face but the hook, which stays where the
// lug's is so a locked joint is drawn tight. In the socket's frame.
// Only its part in the socket wall matters, so it stops at the bore.
module _slot_2d() {
  intersection() {
    mirror([0, 1]) translate([0, fit / cos(50)]) offset(delta = fit) _lug_2d();
    translate([socket_r - 0.01, -spigot_len - 5]) square([lug_h + 5, spigot_len + 10]);
  }
}

_slot_arc = lug_arc + 2 * fit / socket_r * 180 / PI;

function _ramp(a) = a <= 4 ? 0 : (a - 4) / (twist_angle - 4);

module _slot_at(a, dz) {
  rotate(a) translate([0, 0, dz]) rotate(-_slot_arc / 2)
    rotate_extrude(angle = _slot_arc) _slot_2d();
}

// Lock is at +-y; the lugs go in twist_angle further round and ramp
// draw deeper on the way back.
module _socket_slots() {
  steps = ceil(twist_angle / 2);
  for (base = [90, 270]) {
    for (k = [0 : steps - 1]) {
      a0 = k * twist_angle / steps;
      a1 = (k + 1) * twist_angle / steps;
      hull() {
        _slot_at(base + a0, draw * _ramp(a0));
        _slot_at(base + a1, draw * _ramp(a1));
      }
    }
    hull() {
      _slot_at(base + twist_angle, draw);
      _slot_at(base + twist_angle, spigot_len + 2);
    }
  }
}

// The key notch at +x, open out to `out`, pointed at its bottom so it
// prints on the bed, upright or tilted.
module _key_notch(out) {
  translate([notch_in, 0, 0]) along_x(out - notch_in)
    polygon([[-notch_w / 2, 1], [notch_w / 2, 1], [notch_w / 2, -notch_d],
             [0, -notch_d - notch_w / 2], [-notch_w / 2, -notch_d]]);
}

// A pocket for a screw head or nut, `depth` deep toward -z from `top`,
// its roof coned at 45° (measured at the corners) when it prints facing
// down.
module _pocket(d, top, depth, sides, coned) {
  translate([0, 0, top - depth]) cylinder(d = d, h = depth, $fn = sides);
  if (coned) translate([0, 0, top - 0.01])
    cylinder(d1 = d, d2 = bolt_hole, h = (d - bolt_hole) / 2, $fn = sides);
}

module plug(back = "cone") {
  translate([0, 0, -plug_t]) cylinder(r = joint_r, h = plug_t);
  if (back == "cone") translate([0, 0, -plug_t - (joint_r - R)])
    cylinder(r1 = R, r2 = joint_r, h = joint_r - R);
  rotate_extrude() polygon([[r, -1], [spigot_r, -1], [spigot_r, spigot_len - (spigot_r - r)], [r, spigot_len]]);
  for (a = [90, 270]) rotate(a - lug_arc / 2) rotate_extrude(angle = lug_arc) _lug_2d();
}

module plug_cuts(back = "cone", notch_out = joint_r + 1, spots = m3_spots) {
  translate([0, 0, -plug_t - (joint_r - R) - 1]) cylinder(r = r, h = plug_t + joint_r - R + spigot_len + 2);
  _key_notch(notch_out);
  for (a = spots) rotate(a) translate([screw_r, 0, 0]) {
    if (m3_grip == "thread") translate([0, 0, -plug_t + 1]) cylinder(d = pilot_d, h = plug_t, $fn = 16);
    else {
      translate([0, 0, -plug_t - 1]) cylinder(d = bolt_hole, h = plug_t + 2, $fn = 16);
      _pocket(nut_af / cos(30), -plug_t + 2.6, 3.6 + (back == "cone" ? joint_r - R : 0), 6, back == "cone");
    }
  }
}

module socket(back = "flat") {
  translate([0, 0, -socket_t]) cylinder(r = joint_r, h = socket_t);
  translate([0, 0, -socket_depth - 1.5]) cylinder(r = socket_wall_r, h = socket_depth + 1.5);
  if (back == "cone") translate([0, 0, -socket_t - (joint_r - socket_wall_r)])
    cylinder(r1 = socket_wall_r, r2 = joint_r, h = joint_r - socket_wall_r);
}

// z of the socket's PETG floor cone at radius x.
function _floor_z(x) = x - r - spigot_len - cone_off;

module socket_cuts(back = "flat", notch_out = joint_r + 1, spots = m3_spots) {
  rotate_extrude() polygon([[0, 1], [socket_r, 1], [socket_r, _floor_z(socket_r)],
                            [r, _floor_z(r)], [r, _floor_z(r) - 2], [0, _floor_z(r) - 2]]);
  _socket_slots();
  _key_notch(notch_out);
  for (a = spots) rotate(a) translate([screw_r, 0, 0]) {
    translate([0, 0, -socket_t - 1]) cylinder(d = bolt_hole, h = socket_t + 2, $fn = 16);
    _pocket(cb_d, -socket_t + cb_depth, cb_depth + 1 + (back == "cone" ? joint_r - socket_wall_r : 0), 32, back == "cone");
  }
}

// The TPU liner on the socket's floor cone: from the PETG out to
// gasket_squeeze short of where the spigot's tip ends up.
module socket_gasket() {
  c0 = r + spigot_len;
  rotate_extrude() polygon([[r, r - c0 - cone_off], [socket_r, socket_r - c0 - cone_off],
                            [socket_r, socket_r - c0 + gasket_squeeze * sqrt(2)],
                            [r, r - c0 + gasket_squeeze * sqrt(2)]]);
}

// The key that holds a locked joint: it drops into the two notches,
// which only line up once the plug has turned home. Printed on its side.
module clip() {
  len = cube_u / 2 + 3 - notch_in;
  w = notch_w - 0.1;
  e = notch_d - 0.1;
  translate([0, 0, w / 2]) rotate([-90, 0, 0])
    along_x(len) polygon([[-w / 2, -e], [0, -e - w / 2], [w / 2, -e], [w / 2, e], [0, e + w / 2], [-w / 2, e]]);
}

// ---------------------------------------------------------------------
// Legacy bolt flange, in a frame with the joint face at z = 0 and the
// part running up +z. Bores are cut by the caller.

module flange() {
  difference() {
    cylinder(r = flange_r, h = flange_thickness);
    for (a = bolt_angles) rotate(a) translate([bolt_r, 0, 0]) {
      translate([0, 0, -1]) cylinder(d = bolt_hole, h = flange_thickness + 2, $fn = 16);
      translate([0, 0, flange_thickness - pocket_depth])
        cylinder(r = hex_r, h = pocket_depth + 1, $fn = 6);
    }
  }
}

// Bead on a spigot, 8 mm in from its end at z = top, 45° both sides.
module spigot_bead(top) {
  zb = top - 8;
  rotate_extrude() polygon([
    [R - 0.01, zb - bead - 1], [R + bead, zb - 1],
    [R + bead, zb + 1], [R - 0.01, zb + bead + 1]]);
}

// ---------------------------------------------------------------------
// Straight pieces. Each stands on its bottom joint face.

bottom_socket = frame([0, 0, 0], [0, 0, -1]);
function top_plug(h) = frame([0, 0, h], [0, 0, 1]);

module tube() {
  difference() {
    union() {
      multmatrix(bottom_socket) socket();
      cylinder(r = R, h = tube_length - plug_t);
      multmatrix(top_plug(tube_length)) plug();
    }
    translate([0, 0, -1]) cylinder(r = r, h = tube_length + 2);
    multmatrix(bottom_socket) socket_cuts();
    multmatrix(top_plug(tube_length)) plug_cuts();
  }
}
module tube_gasket() { multmatrix(bottom_socket) socket_gasket(); }

// A socket with a duct spigot above it (bolt: a flange instead).
module spigot_adapter() {
  h = end_socket_t + spigot_length;
  difference() {
    union() {
      if (joint == "bolt") flange(); else multmatrix(bottom_socket) socket();
      cylinder(r = R, h = h);
      spigot_bead(h);
    }
    translate([0, 0, -1]) cylinder(r = r, h = h + 2);
    if (joint != "bolt") multmatrix(bottom_socket) socket_cuts();
  }
}
module spigot_adapter_gasket() { multmatrix(bottom_socket) socket_gasket(); }
function spigot_adapter_socket() = bottom_socket;

// A duct spigot standing on its end with a plug above it.
duct_plug_h = spigot_length + joint_r - R + plug_t;
module duct_plug() {
  difference() {
    union() {
      cylinder(r = R, h = duct_plug_h - plug_t);
      mirror([0, 0, 1]) spigot_bead(0);
      multmatrix(top_plug(duct_plug_h)) plug();
    }
    translate([0, 0, -1]) cylinder(r = r, h = duct_plug_h + 2);
    multmatrix(top_plug(duct_plug_h)) plug_cuts();
  }
}
function duct_plug_frame() = top_plug(duct_plug_h);

// Two sockets back to back, to join two plugs.
coupler_h = 2 * (socket_depth + 1.5);
module socket_coupler() {
  top = frame([0, 0, coupler_h], [0, 0, 1]);
  difference() {
    union() {
      multmatrix(bottom_socket) socket();
      cylinder(r = socket_wall_r, h = coupler_h);
      multmatrix(top) socket(back = "cone");
    }
    translate([0, 0, -1]) cylinder(r = r, h = coupler_h + 2);
    multmatrix(bottom_socket) socket_cuts();
    multmatrix(top) socket_cuts(back = "cone");
  }
}
module socket_coupler_gasket() {
  multmatrix(bottom_socket) socket_gasket();
  multmatrix(frame([0, 0, coupler_h], [0, 0, 1])) socket_gasket();
}

// 45° elbow: up off its socket, bending over toward +x to a plug tilted
// 45°, which prints within 45° with its lugs level. Two make a 90°.
elbow_end = [elbow_bend_r * (1 - cos(45)), 0, elbow_foot + elbow_bend_r * sin(45)];
elbow_dir = [sin(45), 0, cos(45)];
elbow_plug = frame(elbow_end + elbow_reach * elbow_dir, elbow_dir, level_lug(elbow_dir));

module _elbow_path(rad) {
  cylinder(r = rad, h = elbow_foot + 0.01);
  multmatrix([[-1, 0, 0, elbow_bend_r], [0, 0, 1, 0], [0, 1, 0, elbow_foot], [0, 0, 0, 1]])
    rotate_extrude(angle = 45) translate([elbow_bend_r, 0]) circle(r = rad);
  multmatrix(frame(elbow_end, elbow_dir)) translate([0, 0, -0.01]) cylinder(r = rad, h = elbow_reach + 0.02);
}

module elbow_45() {
  difference() {
    union() {
      multmatrix(bottom_socket) socket();
      _elbow_path(R);
      multmatrix(elbow_plug) plug(back = "flat");
    }
    _elbow_path(r);
    translate([0, 0, -1]) cylinder(r = r, h = 2);
    multmatrix(bottom_socket) socket_cuts();
    multmatrix(elbow_plug) plug_cuts(back = "flat");
  }
}
module elbow_45_gasket() { multmatrix(bottom_socket) socket_gasket(); }

// ---------------------------------------------------------------------
// Butterfly valve section. Bottom joint on the bed, disc axis along x at
// pivot_z, servo on +x, pivot boss on -x, a plug (bolt: a duct spigot)
// on top. Its joints put their lugs along x, so valves stack servo over
// servo.

valve_socket = frame([0, 0, 0], [0, 0, -1], [1, 0, 0]);
valve_plug = frame([0, 0, body_h], [0, 0, 1], [1, 0, 0]);
// Screws whose hex key would come down on the servo bracket are left
// out. In the socket's frame the servo side is +y.
valve_socket_spots = [for (a = m3_spots) if (abs(a - 90) > 30) a];

module _servo_bracket() {
  x0 = R - 8;
  hull() {
    translate([x0, -bracket_y, pivot_z - bracket_z])
      cube([plate_out - x0, 2 * bracket_y, 2 * bracket_z]);
    // 45° underside, running back down into the tube.
    translate([x0, -bracket_y, pivot_z - bracket_z - (plate_out - x0)])
      cube([0.01, 2 * bracket_y, 1]);
  }
}

module _pivot_boss() {
  hull() {
    translate([-(R + boss_len), 0, pivot_z])
      along_x(0.01) mirror([0, 1]) teardrop(boss_d);
    translate([-(R - 2), 0, pivot_z - (boss_len + 2)])
      along_x(0.01) mirror([0, 1]) teardrop(boss_d);
  }
}

module _servo_bracket_cuts() {
  // Room for the coupler head to swing, open at the top so the coupler
  // drops in; its floor is flat, so it prints as a floor.
  translate([boss_face, -sweep_r, pivot_z - sweep_r])
    cube([plate_in - boss_face, 2 * sweep_r, bracket_z + sweep_r + 1]);
  translate([plate_in - 1, -servo_mid, pivot_z]) along_x(plate_t + 2) {
    // Servo body through the plate, peaked at 45° instead of bridged.
    w = servo_body_width + 2 * fit;
    l = servo_body_length + 2 * fit;
    translate([-l / 2, -w / 2]) square([l, w]);
    translate([0, w / 2 - l / 2]) rotate(45) square(l / sqrt(2));
  }
  translate([plate_in - 1, 0, pivot_z]) along_x(plate_t + 2)
    translate([-notch_w_plate / 2, notch_bottom]) square([notch_w_plate, bracket_z - notch_bottom + 1]);
  // Tab screw pilots for the servo's own screws.
  for (y = tab_y) translate([plate_in - 1, y, pivot_z])
    along_x(plate_t + 2) teardrop(1.8, $fn = 12);
  // Coupler shaft through the wall.
  translate([r - 1, 0, pivot_z]) along_x(boss_face - r + 2) teardrop(shaft_d + 2 * fit);
}

module _pivot_boss_cuts() {
  translate([-(R + boss_len) - 1, 0, pivot_z]) {
    along_x(cb_depth + 1) teardrop(cb_d);
    along_x(boss_len + wall + 3) teardrop(2.5, $fn = 12);
  }
}

module valve_body() {
  difference() {
    union() {
      if (joint == "bolt") {
        flange();
        cylinder(r = R, h = body_h);
        spigot_bead(body_h);
      } else {
        multmatrix(valve_socket) socket();
        cylinder(r = R, h = body_h - plug_t);
        multmatrix(valve_plug) plug();
      }
      _servo_bracket();
      _pivot_boss();
    }
    translate([0, 0, -1]) cylinder(r = r, h = body_h + 2);
    _servo_bracket_cuts();
    _pivot_boss_cuts();
    if (joint != "bolt") {
      multmatrix(valve_socket) socket_cuts(spots = valve_socket_spots);
      multmatrix(valve_plug) plug_cuts();
      // The coupler goes down past the top joint's flange.
      translate([R, -coupler_slot_w / 2, bracket_top - 1])
        cube([joint_r - R + 1, coupler_slot_w, body_h - bracket_top + 2]);
    }
  }
}
module valve_body_gasket() { multmatrix(valve_socket) socket_gasket(); }

// Printed flat on its face; the rib runs along x on top with the turning
// axis hub_axis above the bed. The drive socket is at +x.
module valve_disc() {
  difference() {
    intersection() {
      union() {
        cylinder(r = disc_r, h = disc_thickness);
        along_x(2 * disc_r, center = true) polygon([
          [-hub_width / 2, 0], [hub_width / 2, 0], [hub_width / 2, hub_axis],
          [0, hub_axis + hub_width / 2], [-hub_width / 2, hub_axis]]);
      }
      // Anything inside this sphere turns clear of the bore.
      translate([0, 0, hub_axis]) sphere(r = disc_r);
    }
    translate([disc_r - key_depth, 0, hub_axis]) along_x(key_depth + 1)
      rotate(45) square(key_hole, center = true);
    translate([-disc_r - 1, 0, hub_axis]) along_x(pin_socket + 1)
      teardrop(bolt_hole);
  }
}

// Printed head-down, horn pocket on the bed, key pointing up.
module valve_coupler() {
  shaft_len = head_inner - r;
  key_len = disc_clearance + key_depth - 0.5;
  difference() {
    union() {
      translate([-head_len / 2, -head_w / 2, 0]) cube([head_len, head_w, head_t]);
      cylinder(d = shaft_d, h = head_t + shaft_len);
      translate([0, 0, head_t + shaft_len - 0.01])
        linear_extrude(key_len) rotate(45) square(key_size, center = true);
    }
    w = horn_width + 2 * fit;
    along_x(horn_length + 2 * fit, center = true) polygon([
      [-w / 2, -1], [w / 2, -1], [w / 2, horn_pocket],
      [0, horn_pocket + w / 2], [-w / 2, horn_pocket]]);
  }
}

// Stand-in for an SG90 with its horn, in the valve frame at servo angle
// a. Reference only.
module sg90(a = 0) {
  translate([plate_out, 0, pivot_z]) {
    translate([0, -servo_mid - servo_body_length / 2, -servo_body_width / 2])
      cube([16, servo_body_length, servo_body_width]);
    translate([0, -servo_mid - 16, -servo_body_width / 2])
      cube([2.5, 32, servo_body_width]);
    translate([-4.3, -servo_mid - servo_body_length / 2, -servo_body_width / 2])
      cube([4.3, servo_body_length, servo_body_width]);
    rotate([0, -90, 0]) cylinder(d = 11.8, h = servo_horn_face - horn_thickness - 3.5);
    translate([-servo_horn_face, 0, 0]) rotate([a, 0, 0]) {
      translate([0, -horn_width / 2, -horn_length / 2]) cube([horn_thickness, horn_width, horn_length]);
      rotate([0, 90, 0]) cylinder(d = 6.5, h = horn_thickness + 3.5);
    }
  }
}

module valve_disc_placed(a) {
  translate([0, 0, pivot_z]) rotate([a, 0, 0]) translate([0, 0, -hub_axis]) valve_disc();
}

module valve_coupler_placed(a) {
  translate([0, 0, pivot_z]) rotate([a, 0, 0]) translate([head_face, 0, 0])
    rotate([0, -90, 0]) valve_coupler();
}

// A whole valve (body, disc, coupler, servo) in the valve frame; `what`
// picks one colour's worth.
module valve_part(what) {
  if (what == "body") valve_body();
  if (what == "disc") valve_disc_placed(preview_open);
  if (what == "coupler") valve_coupler_placed(preview_open);
  if (what == "servo") sg90(preview_open);
  if (what == "gasket") valve_body_gasket();
}

// ---------------------------------------------------------------------
// Polar manifold. A layout algorithm gives the port directions; the
// generator builds a hub on them. Port 0 is the trunk, pointing down
// with its socket on the bed; the rest are plugs. `polar_cone` is the
// trunk plus branches spread evenly on a cone branch_tilt off vertical.

function polar_cone(n, tilt) = concat([[0, 0, -1]],
  [for (i = [1 : n - 1]) [sin(tilt) * cos(360 * (i - 1) / (n - 1)),
                          sin(tilt) * sin(360 * (i - 1) / (n - 1)), cos(tilt)]]);

polar_dirs = polar_cone(ports, branch_tilt);

function port_dir(i) = polar_dirs[i];

function port_face(i) = i == 0 ? [0, 0, 0] : [0, 0, junction_z] + port_len * port_dir(i);

function port_length(i) = i == 0 ? junction_z : port_len;

function port_m(i) = frame(port_face(i), port_dir(i), level_lug(port_dir(i)));

// Frame at port i: joint face at the origin, +z pointing out of the hub.
module port_out(i) {
  multmatrix(port_m(i)) children();
}

// Same, with +z pointing into the hub: the frame flange() is drawn in.
module port_in(i) {
  port_out(i) rotate([180, 0, 0]) children();
}

// A branch bore starts on the trunk axis at junction_z, where together
// they cover the whole top of the trunk's bore, so it never has a
// ceiling. Every inner and outer surface then overhangs by branch_tilt.
module hub() {
  difference() {
    union()
      for (i = [0 : ports - 1]) {
        port_in(i) cylinder(r = R, h = port_length(i));
        if (joint == "bolt") port_in(i) flange();
        else if (i == 0) port_out(i) socket();
        else port_out(i) plug(back = "flat");
      }
    for (i = [0 : ports - 1]) {
      port_in(i) translate([0, 0, -1]) cylinder(r = r, h = port_length(i) + 1);
      if (joint == "bolt")
        port_in(i) for (a = bolt_angles) rotate(a) translate([bolt_r, 0, flange_thickness - pocket_depth])
          cylinder(r = hex_r, h = pocket_depth + 1, $fn = 6);
      else if (i == 0) port_out(i) socket_cuts();
      else port_out(i) plug_cuts(back = "flat");
    }
  }
}
module hub_gasket() { port_out(0) socket_gasket(); }

// Hub footprint: every branch joint's horizontal reach.
hub_reach = [for (i = [1 : branches])
  let (c = port_face(i), f = end_r * cos(branch_tilt)) [c.x - f, c.x + f, c.y - f, c.y + f]];
hub_top = junction_z + (port_len + (joint == "bolt" ? 0 : spigot_len)) * cos(branch_tilt) + end_r * sin(branch_tilt);
hub_x = max([end_r, for (h = hub_reach) h[1]]) - min([-end_r, for (h = hub_reach) h[0]]);
hub_y = max([end_r, for (h = hub_reach) h[3]]) - min([-end_r, for (h = hub_reach) h[2]]);
assert(hub_x <= print_bed && hub_y <= print_bed && hub_top <= print_bed,
       str("the hub is ", hub_x, " x ", hub_y, " x ", hub_top, " mm, over print_bed ", print_bed,
           ": fewer ports or more branch_tilt"));

// ---------------------------------------------------------------------
// Polar assemblies

// Branches take valves first, the trunk last.
function port_valved(i) = i == 0 ? valved_ports == ports : i <= valved_ports;

// Valve on port i. On a branch it sits on the plug with its servo off to
// the side; on the trunk (a socket) it hangs upside down on its own plug.
module at_valve(i) {
  if (joint == "bolt") port_out(i) rotate(90) children();
  else if (i == 0) mate(port_m(i), valve_plug) children();
  else mate(port_m(i), valve_socket) children();
}

module hub_valves(what) {
  for (i = [0 : ports - 1]) if (port_valved(i)) at_valve(i) valve_part(what);
}
module hub_adapters() {
  for (i = [0 : ports - 1]) if (!port_valved(i)) {
    if (joint == "bolt") port_out(i) spigot_adapter();
    else if (i == 0) mate(port_m(i), duct_plug_frame()) duct_plug();
    else mate(port_m(i), spigot_adapter_socket()) spigot_adapter();
  }
}

// Inline damper: the valve with an adapter under its bottom joint.
module inline_adapter() {
  if (joint == "bolt") rotate([180, 0, 0]) spigot_adapter();
  else mate(valve_socket, duct_plug_frame()) duct_plug();
}

// ---------------------------------------------------------------------
// Cubic manifold. Cells are cube_u cubes on an integer grid. Each cell
// after the first twists onto the earliest cell it touches (its parent),
// the parent carrying the plug and the cell the socket, so the layout
// has to be a tree. Every cell prints on its own, standing on an edge
// along the one axis no joint uses, so all its joints sit at 45°.

function _box_cells(v) = [for (b = [0 : 6 : len(v) - 6])
  let (lo = [for (a = [0 : 2]) min(v[b + a], v[b + 3 + a])],
       hi = [for (a = [0 : 2]) max(v[b + a], v[b + 3 + a])])
  for (i = [lo.x : hi.x]) for (j = [lo.y : hi.y]) for (k = [lo.z : hi.z]) [i, j, k]];

function _index(l, c) = let (s = [for (n = [0 : len(l) - 1]) if (l[n] == c) n]) len(s) > 0 ? s[0] : -1;

_cells_all = _box_cells(cubic_cells);
cells = [for (n = [0 : len(_cells_all) - 1]) if (_index(_cells_all, _cells_all[n]) == n) _cells_all[n]];
cubic_port_list = [for (b = [0 : 5 : len(cubic_ports) - 5])
  [[cubic_ports[b], cubic_ports[b + 1], cubic_ports[b + 2]], cubic_ports[b + 3], cubic_ports[b + 4]]];

function face_vec(f) = [[1, 0, 0], [0, 1, 0], [0, 0, 1]][abs(f) - 1] * sign(f);
function vec_face(v) = v.x != 0 ? sign(v.x) : v.y != 0 ? 2 * sign(v.y) : 3 * sign(v.z);
function _touch(a, b) = norm(a - b) == 1;

function cell_parent(n) = n == 0 ? -1 :
  let (s = [for (m = [0 : n - 1]) if (_touch(cells[m], cells[n])) m]) len(s) > 0 ? s[0] : undef;

// [face, is_plug] for every joint of cell n.
function cell_joints(n) = concat(
  n > 0 ? [[vec_face(cells[cell_parent(n)] - cells[n]), 0]] : [],
  [for (m = [1 : len(cells) - 1]) if (m < len(cells) && cell_parent(m) == n) [vec_face(cells[m] - cells[n]), 1]],
  [for (p = cubic_port_list) if (p[0] == cells[n]) [p[1], p[2]]]);

_used_axes = [for (n = [0 : len(cells) - 1]) for (j = cell_joints(n)) abs(j[0])];
_free_axes = [for (a = [1 : 3]) if (len([for (u = _used_axes) if (u == a) u]) == 0) a];
// The axis every cell stands along on the bed; every joint's lugs point
// along it.
cube_axis = len(_free_axes) > 0 ? _free_axes[0] : 0;
cube_lug = cube_axis > 0 ? face_vec(cube_axis) : [1, 0, 0];

// Frame of a cell's joint on face f, in the cell's frame (cell centre at
// the origin). Sockets turn their lugs the other way round so a plug's
// key notch and its socket's meet.
function cell_joint_m(f, is_plug) =
  frame(face_vec(f) * cube_u / 2, face_vec(f), is_plug ? cube_lug : -cube_lug);

assert(len(cells) >= 1, "cubic_cells has no cells");
for (n = [1 : len(cells) - 1]) if (n < len(cells))
  assert(cell_parent(n) != undef, str("cubic cell ", cells[n], " touches no earlier cell"));
for (n = [0 : len(cells) - 1]) {
  touching = len([for (m = [0 : len(cells) - 1]) if (_touch(cells[m], cells[n])) m]);
  children_n = len([for (m = [1 : len(cells) - 1]) if (m < len(cells) && cell_parent(m) == n) m]);
  assert(touching == children_n + (n > 0 ? 1 : 0),
         str("cubic cell ", cells[n], " closes a loop: a cell can only touch the cell it twists onto and the ones twisting onto it"));
}
for (p = cubic_port_list) {
  assert(_index(cells, p[0]) >= 0, str("cubic port on ", p[0], ", which isn't a cell"));
  assert(_index(cells, p[0] + face_vec(p[1])) < 0, str("cubic port on ", p[0], " face ", p[1], " faces another cell"));
}
assert(cube_axis > 0,
       "the cubic manifold uses joints along all three axes; its cells print standing on an edge along an unused axis, so keep it to two");

// Cell-frame -> print frame: the cube axis along x, then a 45° roll so
// an edge along it stands on the bed. Of the four edges, the first with
// no plug on either face beside it, since a plug there would stand
// below the edge.
function _to_x(a) = a == 1 ? [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
                  : a == 2 ? [[0, 1, 0], [-1, 0, 0], [0, 0, 1]]
                  : [[0, 0, 1], [0, 1, 0], [-1, 0, 0]];
function _roll(t) = [[1, 0, 0], [0, cos(t), -sin(t)], [0, sin(t), cos(t)]];
function _cell_roll(n) =
  let (ok = [for (k = [0 : 3])
             if (len([for (j = cell_joints(n)) if (j[1] == 1 && (_roll(45 + 90 * k) * _to_x(cube_axis) * face_vec(j[0])).z < 0) j]) == 0) k])
  len(ok) > 0 ? ok[0] : -1;
function _m3(m) = [[m[0][0], m[0][1], m[0][2], 0], [m[1][0], m[1][1], m[1][2], 0], [m[2][0], m[2][1], m[2][2], 0], [0, 0, 0, 1]];

for (n = [0 : len(cells) - 1])
  assert(_cell_roll(n) >= 0, str("cubic cell ", cells[n], " has plugs on opposite faces, so no edge of it can go on the bed"));

// Distance from a cell's centre down to its chamfered edge on the bed.
cube_drop = (cube_u - cube_chamfer) / sqrt(2);

function cell_print_m(n) =
  [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, cube_drop], [0, 0, 0, 1]] * _m3(_roll(45 + 90 * _cell_roll(n)) * _to_x(cube_axis));

function cell_place_m(n) = [[1, 0, 0, cells[n].x * cube_u], [0, 1, 0, cells[n].y * cube_u], [0, 0, 1, cells[n].z * cube_u], [0, 0, 0, 1]];

// The shell: a cube with the four edges along cube_axis chamfered (one
// of them is the foot), hollow inside.
module _cell_shell() {
  difference() {
    intersection() {
      cube(cube_u, center = true);
      multmatrix(rigid_inv(_m3(_to_x(cube_axis)))) rotate([45, 0, 0])
        cube([cube_u + 2, (cube_u - cube_chamfer) * sqrt(2), (cube_u - cube_chamfer) * sqrt(2)], center = true);
    }
    cube(cube_u - 2 * cube_wall, center = true);
  }
}

// Cell n in its own frame. The joint bosses stand inside the shell, and
// a socket in a cube wall has no screws: their heads would be inside.
module cubic_cell_local(n) {
  j = cell_joints(n);
  difference() {
    union() {
      _cell_shell();
      for (e = j) multmatrix(cell_joint_m(e[0], e[1] == 1))
        if (e[1] == 1) plug(back = "none"); else socket(back = "none");
    }
    for (e = j) multmatrix(cell_joint_m(e[0], e[1] == 1)) {
      translate([0, 0, -socket_depth - 3]) cylinder(r = r, h = socket_depth + 4);
      if (e[1] == 1) plug_cuts(back = "none", notch_out = cube_u);
      else socket_cuts(back = "none", notch_out = cube_u, spots = []);
    }
  }
}
module cubic_cell_gasket_local(n) {
  for (e = cell_joints(n)) if (e[1] == 0) multmatrix(cell_joint_m(e[0], false)) socket_gasket();
}

module cubic_cell(n) { multmatrix(cell_print_m(n)) cubic_cell_local(n); }
module cubic_cell_gasket(n) { multmatrix(cell_print_m(n)) cubic_cell_gasket_local(n); }

// Part wrappers: the gallery renders a part by module name alone.
module cubic_cell_1() { cubic_cell(0); }
module cubic_cell_2() { cubic_cell(1); }
module cubic_cell_3() { cubic_cell(2); }
module cubic_cell_4() { cubic_cell(3); }
module cubic_cell_1_gasket() { cubic_cell_gasket(0); }
module cubic_cell_2_gasket() { cubic_cell_gasket(1); }
module cubic_cell_3_gasket() { cubic_cell_gasket(2); }
module cubic_cell_4_gasket() { cubic_cell_gasket(3); }

// The whole manifold in place, and what goes on its ports: a valve on
// every plug, a duct plug in every socket.
module cubic_cells_placed() {
  for (n = [0 : len(cells) - 1]) multmatrix(cell_place_m(n)) cubic_cell_local(n);
}
module cubic_gaskets_placed() {
  for (n = [0 : len(cells) - 1]) multmatrix(cell_place_m(n)) cubic_cell_gasket_local(n);
}
function _port_world(p) = cell_place_m(_index(cells, p[0])) * cell_joint_m(p[1], p[2] == 1);
module cubic_valves(what) {
  for (p = cubic_port_list) if (p[2] == 1) mate(_port_world(p), valve_socket) valve_part(what);
}
module cubic_duct_plugs() {
  for (p = cubic_port_list) if (p[2] == 0) mate(_port_world(p), duct_plug_frame()) duct_plug();
}
