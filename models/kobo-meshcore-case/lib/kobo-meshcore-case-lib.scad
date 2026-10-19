// Kobo Clara HD MeshCore case: a slim frame round the Kobo, used in
// landscape, with a cylinder up its right side sized for an 18650. The
// cylinder's depth carries on inward behind the Kobo as a hollow cover for
// two Seeed XIAO boards, the case's whole height, its inner end rounded down
// to the back plate.
//
// - The cylinder splits at its axis: the front half is part of the frame,
//   the back half part of the cover. With the cover off, the cell (with
//   leads) lifts out of the back, and the SMA bulkhead's jack drops in.
// - The cylinder stops short of the case's top, and its end is a hex mount:
//   the jack's hex sits in a pocket under the end panel, the nut tightens on
//   top, and the antenna stands in the open on the cylinder's axis. The
//   cylinder's top end is rounded, as is the cover's edge beside the antenna.
// - The XIAOs lie flat on the back plate near the top, located by corner
//   posts, and posts inside the cover hold them down.
//
// Assembly frame: X along the device (cylinder at +X), Y up the device as
// it's held (SMA at +Y), Z out of the screen. Every part is modelled in the
// "depth frame": X and Y as above, z = depth behind the front face. That is
// the frame's print frame: it prints front face down, every wall rising off
// the bed. The *_assembled() wrappers mirror into the assembly frame; the
// *_print() wrappers put the other parts on their print faces.
//
// The front face is one plane across frame and cylinder; the cylinder is
// thicker than the Kobo's frame, so it stands proud at the back.
//
// The Kobo goes in with its bottom edge against the cylinder, its power
// button at the bottom of a 45° trough cut down through the front. Its micro
// USB is never used (the user's call), so nothing reaches it.

// BEGIN_PARAMS
// Kobo Clara HD, long side (Kobo spec)
kobo_length = 159.6;
// Kobo short side (Kobo spec)
kobo_width = 110;
// Kobo thickness (Kobo spec)
kobo_thickness = 8.35;
// Kobo corner radius seen from the front (estimated from Kobo's drawing)
kobo_corner_radius = 6;
// Screen, landscape: width along X and height along Y (6" 4:3, estimated)
screen_width = 122;
screen_height = 91;
// Screen's offset from the Kobo's left edge (its top bezel) and its lower
// edge (a side bezel), estimated from Kobo's drawing
screen_left = 10.5;
screen_bottom = 9.5;
// How far the front window reaches past the screen on every side
window_margin = 2;
// Where the power button sits along the Kobo's bottom edge, measured from
// the Kobo's lower edge as it's held: mid-edge per Kobo's drawing
power_button_y = 55;
// Gap round the Kobo, per side and over its thickness
tolerance = 0.3;
// Front lip over the Kobo's bezel
front_thickness = 2;
// Walls along the long sides
wall = 3;
// Wall at the Kobo's left end; it takes the back plate's screws
left_wall = 6;
// Solid strip between the Kobo and the cell's bore; it takes the cover's
// right-hand screws
right_ledge = 8;
// 18650 bore (cell plus clearance)
cell_bore = 18.8;
// Cell bay length, above the cylinder's solid bottom: a 65 mm cell with its
// leads' tabs
cell_bay_length = 67;
// Solid block at the cylinder's bottom, which takes a screw
end_block = 7.5;
// Half-ring in the frame's half above the bay that stops the cell sliding
// up: its thickness, and its inner radius (the leads pass inside it)
cell_stop = 2;
cell_stop_r = 6;
// Cylinder wall round the cell
tube_wall = 1.8;
// The cylinder ends this far below the top of the case
tube_short = 25;
// Rounding round the cylinder's top end
end_round = 2;
// Rounding on the cover's edge and corner beside the antenna
notch_round = 3;
// End panel the SMA's thread passes through (1/4"-36), nut on top
sma_panel = 2;
sma_hole = 6.6;
// Hex pocket under the panel that holds the jack's hex body from inside:
// across flats (8 mm plus clearance) and depth
sma_hex = 8.3;
sma_hex_depth = 3;
// Back plate thickness
plate_thickness = 2;
// Electronics cover: how far it reaches in from the back plate's right edge
// behind the Kobo. It is as deep as the cylinder, and its inner end is
// rounded down to the back plate
cover_width = 48.2;
cover_wall = 1.6;
// Its end walls, top and bottom
cover_end = 2;
// Bosses on the back plate for the cover's inner screws
cover_boss_d = 7;
cover_boss_h = 5;
// Ribs inside the cover the screws run through
rib_width = 7;
// Seeed XIAO boards (no headers): outline, PCB thickness, height to the top
// of the USB-C connector, and the gap round each in its pocket
xiao_length = 21;
xiao_width = 17.8;
xiao_pcb = 1.2;
xiao_height = 3.5;
xiao_clearance = 0.3;
// Corner posts locating each board: leg length, thickness, height
xiao_post_leg = 3;
xiao_post_wall = 1.2;
xiao_post_h = 2.5;
// Gap between the two boards' pockets
xiao_gap = 3;
// Outside corner radius at the left end, seen from the front
corner_radius = 6;
// 45° chamfer round the front face's outer edge
front_chamfer = 1;
// Power button trough: along Y, and how deep its bottom edge sits into the
// Kobo's thickness
button_trough = 22;
button_depth_fraction = 0.75;
// M3 cap screws: pilot for self-tapping, clearance, counterbore
pilot_d = 2.5;
clear_d = 3.4;
head_d = 6.2;
head_depth = 3.2;
// Material left under a counterbore
head_floor = 1.3;
// END_PARAMS

eps = 0.01;

// Kobo pocket
pocket_l = kobo_length + 2 * tolerance;
pocket_w = kobo_width + 2 * tolerance;
pocket_t = kobo_thickness + tolerance;
pocket_r = kobo_corner_radius + tolerance;
pocket_x0 = left_wall;
pocket_x1 = pocket_x0 + pocket_l;
pocket_y0 = wall;

// Depths from the front face
kobo_back_z = front_thickness + pocket_t;   // frame's back face behind the Kobo
plate_back_z = kobo_back_z + plate_thickness;

case_w = pocket_w + 2 * wall;

tube_d = cell_bore + 2 * tube_wall;
ledge_x = pocket_x1 + right_ledge;          // the cell's bore starts here
tube_x = ledge_x + cell_bore / 2;
tube_z = tube_d / 2;                        // also where frame and cover split
case_l = tube_x + tube_d / 2;
// The back plate runs to the cylinder's leftmost point
plate_x1 = tube_x - tube_d / 2;

pad_h = head_floor + head_depth;          // plate + pad under a screw head
pad_d = head_d + 4;

tube_y1 = case_w - tube_short;              // the cylinder's end face
panel_y0 = tube_y1 - sma_panel;
hex_y0 = panel_y0 - sma_hex_depth;
hex_r = sma_hex / 2 / cos(30);
// The bore narrows at 45° to the hex pocket, so the block over it prints
cone_y0 = hex_y0 - (cell_bore / 2 - hex_r);
cell_y1 = end_block + cell_bay_length;

// Electronics cover
cover_x0 = plate_x1 - cover_width;
cover_r = tube_d - plate_back_z;            // its inner end's radius
cover_roof_z = tube_d - cover_wall;         // inside of its back
left_rib_x = cover_x0 + cover_r;
right_screw_x = pocket_x1 + 2.75;
// The cover's cavity stops at its right rib; the rib runs on to the bore
cavity_x1 = right_screw_x - rib_width / 2;
screw_ys = [18, case_w - 15];

// Left pair: through padded counterbores in the plate into the left wall.
// Right pair: through the cover's right rib and the plate into the ledge.
// Inner pair: through the cover's left rib into the plate's bosses. One
// through the cylinder's halves at its bottom block; at the top, the SMA's
// nut clamps the two halves of the split end panel.
left_screws = [for (y = [15, case_w - 15]) [left_wall / 2, y]];
right_screws = [for (y = screw_ys) [right_screw_x, y]];
boss_screws = [for (y = screw_ys) [left_rib_x, y]];
block_screw_dx = (hex_r + cell_bore / 2) / 2 + 0.5;
block_screws = [[tube_x + block_screw_dx, end_block / 2]];

// Wire window through the cover's right rib, from above the cell to the
// cavity
window_y0 = cell_y1 + cell_stop;
window_y1 = cone_y0;

// XIAO pockets, one above the other near the top, right ends by the rib.
// USB-C at the left (-X) end
xiao_pl = xiao_length + 2 * xiao_clearance;
xiao_pw = xiao_width + 2 * xiao_clearance;
xiao_x1 = cavity_x1 - xiao_post_wall - 1;
xiao_x0 = xiao_x1 - xiao_pl;
xiao_y0s = [for (i = [0, 1]) case_w - cover_end - xiao_post_wall - 1 - xiao_pw - i * (xiao_pw + xiao_gap)];

button_apex_z = front_thickness + button_depth_fraction * pocket_t;
button_case_y = pocket_y0 + tolerance + power_button_y;

// The trough's 45° side is the line x + z = pocket_x1 + button_apex_z
function to_trough(p) = (p[0] + p[1] - pocket_x1 - button_apex_z) / sqrt(2);
// The cylinder's back surface depth at x
function tube_back_z(x) = tube_z + sqrt(pow(tube_d / 2, 2) - pow(x - tube_x, 2));

assert(to_trough([tube_x, tube_z]) - cell_bore / 2 >= 1.2,
       "the button trough comes too close to the cell's bore");
assert(right_screw_x + rib_width / 2 <= ledge_x, "the cover's right rib runs into the bore");
assert(ledge_x - (right_screw_x + pilot_d / 2) >= 1,
       "the right-hand pilots break into the cell's bore");
assert(block_screw_dx - pilot_d / 2 >= hex_r + 1 && block_screw_dx + pilot_d / 2 <= cell_bore / 2 + tube_wall - 1,
       "the block screws don't fit between the hex pocket and the cylinder's outside");
assert(end_block >= head_d + 1, "the bottom block's counterbore breaks out of the block");
assert(cone_y0 - window_y0 >= 5, "no room above the cell for the pigtail's jack and the wires");
assert(xiao_x0 - xiao_post_wall > left_rib_x + rib_width / 2 + 1,
       "the XIAO pockets run into the cover's left rib");
assert(xiao_height < cover_roof_z - plate_back_z - 1, "the XIAOs don't fit under the cover");
assert(tube_d - plate_back_z - cover_boss_h - head_depth >= 1.5,
       "no floor under the inner screws' counterbores");
assert(case_l <= 218, str("case is ", case_l, " mm long: too long for a 220 mm bed"));
assert(plate_thickness < pad_h, "the counterbore needs a pad under it");

module rounded_rect(l, w, r) {
  translate([r, r]) offset(r) square([l - 2 * r, w - 2 * r]);
}

// Plan outline from x = 0 to x1: rounded at the left, square at the right,
// its top right corner rounded by r_tr
module plan_outline(x1, r_tr = 0) {
  difference() {
    intersection() {
      rounded_rect(x1 + corner_radius, case_w, corner_radius);
      square([x1, case_w]);
    }
    if (r_tr > 0) translate([x1 - r_tr, case_w - r_tr]) difference() {
      square(r_tr + 1);
      circle(r = r_tr);
    }
  }
}

// Clips a solid to y0..y1 with the front chamfer on both ends
module front_chamfer_ends(x0, x1, y0, y1, h) {
  hull() {
    translate([x0, y0 + front_chamfer, 0]) cube([x1 - x0, y1 - y0 - 2 * front_chamfer, eps]);
    translate([x0, y0, front_chamfer]) cube([x1 - x0, y1 - y0, h]);
  }
}

module chamfered_slab(x1, r_tr) {
  hull() {
    linear_extrude(eps) offset(delta = -front_chamfer) plan_outline(x1, r_tr);
    translate([0, 0, front_chamfer]) linear_extrude(kobo_back_z - front_chamfer)
      plan_outline(x1, r_tr);
  }
}

// Under the cylinder the frame runs into it; above, beside the antenna, it
// stops at the plate's edge with its corner rounded
module frame_body() {
  intersection() {
    chamfered_slab(plate_x1 + front_chamfer, 0);
    translate([-1, -1, -1]) cube([case_l, tube_y1 + 1, tube_d]);
  }
  intersection() {
    chamfered_slab(plate_x1, notch_round);
    translate([-1, tube_y1 - eps, -1]) cube([case_l, case_w, tube_d]);
  }
}

// Extrude a (x, depth) profile along Y from y0 to y1
module along_y(y0, y1) {
  translate([0, y1, 0]) rotate([90, 0, 0]) linear_extrude(y1 - y0) children();
}

// Cylinder outline in (x, depth): the circle, a 45° flat where its front
// right quarter would overhang the bed, a flat back level with its top, and
// a straight run in past the plate's edge so rounding its end leaves no
// groove where it meets frame and cover. below carries it under the bed,
// for the same reason at the front
module cylinder_outline_2d(below = 0) {
  hull() {
    translate([tube_x, tube_z]) circle(d = tube_d);
    translate([tube_x + tube_d / 2 * (sqrt(2) - 1), -below]) square(eps);
    translate([plate_x1 - 5, -below]) square([eps, tube_d + below]);
  }
}

// The cylinder from its bottom to tube_y1, its top end rounded by end_round
module cylinder_solid() {
  steps = 6;
  along_y(0, tube_y1 - end_round) cylinder_outline_2d(5);
  for (i = [0 : steps - 1]) hull() for (a = [i, i + 1] * 90 / steps)
    translate([0, tube_y1 - end_round + end_round * sin(a), 0])
      along_y(0, eps) offset(delta = -end_round * (1 - cos(a))) cylinder_outline_2d(5);
}

// Kept for the frame's half: front of the split, right of the plate's edge,
// front edges chamfered
module cylinder_front_half() {
  intersection() {
    cylinder_solid();
    translate([plate_x1, -1, 0]) cube([case_l, case_w + 2, tube_z]);
    front_chamfer_ends(plate_x1 - 1, case_l + 1, 0, tube_y1, tube_d);
  }
}

// The back half reaches in over the plate too, so it fills the rounded
// corner the cover's part over the plate has beside the antenna
module cylinder_back_half() {
  intersection() {
    cylinder_solid();
    union() {
      translate([plate_x1, -1, tube_z]) cube([case_l, case_w + 2, tube_d]);
      translate([plate_x1 - notch_round - 1, -1, plate_back_z]) cube([case_l, case_w + 2, tube_d]);
    }
  }
}

// Cell bay, the bore narrowing at 45° to the hex pocket, the pocket and the
// panel's hole: cut from both halves
module cylinder_cuts() {
  translate([tube_x, end_block, tube_z]) rotate([-90, 0, 0]) {
    cylinder(d = cell_bore, h = cone_y0 - end_block + eps);
    translate([0, 0, cone_y0 - end_block]) cylinder(r1 = cell_bore / 2, r2 = hex_r, h = hex_y0 - cone_y0);
  }
  // hex vertices on the split, so each half holds half the pocket
  translate([tube_x, hex_y0 - eps, tube_z]) rotate([-90, 0, 0])
    cylinder(r = hex_r, h = sma_hex_depth + eps, $fn = 6);
  translate([tube_x, panel_y0 - 1, tube_z]) rotate([-90, 0, 0])
    cylinder(d = sma_hole, h = sma_panel + 2);
}

module shell() {
  difference() {
    union() {
      frame_body();
      cylinder_front_half();
    }
    // Kobo pocket
    translate([pocket_x0, pocket_y0, front_thickness])
      linear_extrude(pocket_t + 1) rounded_rect(pocket_l, pocket_w, pocket_r);
    // Front window
    translate([pocket_x0 + tolerance + screen_left - window_margin,
               pocket_y0 + tolerance + screen_bottom - window_margin, -1])
      cube([screen_width + 2 * window_margin, screen_height + 2 * window_margin,
            front_thickness + 2]);
    cylinder_cuts();
    button_trough_cut();
    for (p = concat(left_screws, right_screws)) translate([p[0], p[1], kobo_back_z - 9])
      cylinder(d = pilot_d, h = 10);
    for (p = block_screws) translate([p[0], p[1], tube_z - 7]) cylinder(d = pilot_d, h = 8);
  }
  // stop over the cell's top, leads passing inside it
  intersection() {
    translate([tube_x, cell_y1, tube_z]) rotate([-90, 0, 0]) difference() {
      cylinder(d = cell_bore + 1, h = cell_stop);
      translate([0, 0, -1]) cylinder(r = cell_stop_r, h = cell_stop + 2);
    }
    translate([0, 0, -1]) cube([case_l, case_w, tube_z + 1]);
  }
}

// The power button: cut the lip back 3 mm over the Kobo's edge, and slope
// the frame away at 45° from the button down to the front face
module button_trough_cut() {
  a = button_apex_z;
  along_y(button_case_y - button_trough / 2, button_case_y + button_trough / 2)
    polygon([[pocket_x1 - 3, -1], [pocket_x1 - 3, front_thickness + eps],
             [pocket_x1, front_thickness + eps], [pocket_x1, a],
             [pocket_x1 + a + 1, -1]]);
}

module counterbored_holes(points, h) {
  for (p = points) translate([p[0], p[1], -1]) {
    cylinder(d = clear_d, h = h + 2);
    translate([0, 0, 1 + h - head_depth]) cylinder(d = head_d, h = head_depth + 1);
  }
}

// L posts at a pocket's four corners, outside it
module xiao_corner_posts(x0, y0) {
  for (cx = [0, 1], cy = [0, 1])
    translate([x0 + cx * xiao_pl, y0 + cy * xiao_pw]) mirror([cx, 0]) mirror([0, cy])
      translate([-xiao_post_wall, -xiao_post_wall]) {
        square([xiao_post_leg + xiao_post_wall, xiao_post_wall]);
        square([xiao_post_wall, xiao_post_leg + xiao_post_wall]);
      }
}

// Print frame: inner face on the bed; the left screws' pads, the cover's
// bosses and the XIAOs' corner posts up
module back_plate() {
  difference() {
    union() {
      linear_extrude(plate_thickness) plan_outline(plate_x1, notch_round);
      linear_extrude(pad_h) intersection() {
        plan_outline(plate_x1);
        for (p = left_screws) translate(p) circle(d = pad_d);
      }
      for (p = boss_screws) translate(p)
        cylinder(d = cover_boss_d, h = plate_thickness + cover_boss_h);
      linear_extrude(plate_thickness + xiao_post_h)
        for (y0 = xiao_y0s) xiao_corner_posts(xiao_x0, y0);
    }
    counterbored_holes(left_screws, pad_h);
    for (p = right_screws) translate([p[0], p[1], -1]) cylinder(d = clear_d, h = plate_thickness + 2);
    for (p = boss_screws) translate([p[0], p[1], 0.6])
      cylinder(d = pilot_d, h = plate_thickness + cover_boss_h);
  }
}

// The cover's part over the plate in (x, depth): a round end on the plate
// hulled to a flat back level with the cylinder's, its back right corner
// rounded beside the antenna. below > 0 carries it on under the plate, for
// cutting the open floor
module cover_left_2d(below = 0) {
  r = notch_round;
  intersection() {
    hull() {
      translate([cover_x0 + cover_r, plate_back_z]) circle(r = cover_r);
      translate([plate_x1 - r, tube_d - r]) circle(r = r);
      translate([plate_x1 - eps, plate_back_z - cover_r]) square([eps, cover_r]);
    }
    translate([cover_x0 - 1, plate_back_z - below]) square([plate_x1 - cover_x0 + 1, cover_r + below]);
  }
}

module cover_cavity_2d() {
  difference() {
    intersection() {
      offset(delta = -cover_wall) cover_left_2d(below = cover_r);
      translate([cover_x0, 0]) square([cavity_x1 - cover_x0, tube_d]);
    }
    translate([left_rib_x - rib_width / 2, plate_back_z + cover_boss_h])
      square([rib_width, tube_d]);
  }
}

module tear_2d(d) {
  hull() { circle(d = d); translate([0, d / 2 * sqrt(2)]) square(eps, center = true); }
}

// Screw hole along depth through the cover from z0, counterbored from depth
// top_z: a teardrop peaked +Y, which is up as the cover prints. Where a
// teardrop's peak wouldn't fit, round, its top a short bridge
module cover_screw_hole(p, z0, top_z, tear = true) {
  module hole(d) if (tear) tear_2d(d); else circle(d = d);
  translate([p[0], p[1], z0 - 1]) linear_extrude(tube_d) hole(clear_d);
  translate([p[0], p[1], top_z - head_depth]) linear_extrude(tube_d) hole(head_d);
}

// Hold-down post over a XIAO, from the cover's roof down to depth z_touch.
// Its -Y face slopes at 45°, so it prints standing
module hold_down(x, y, z_touch) {
  s = 3;
  hull() {
    translate([x - s / 2, y - s / 2, z_touch]) cube([s, s, eps]);
    translate([x - s / 2, y - s / 2 - (cover_roof_z - z_touch), cover_roof_z]) cube([s, s + cover_roof_z - z_touch, eps]);
  }
}

// Electronics cover, in the depth frame: the back half of the cylinder and
// the hollow part over the plate, with its open floor, closed ends, ribs
// for its screws, the wire window and the XIAOs' hold-downs
module electronics_cover() {
  difference() {
    union() {
      intersection() {
        along_y(0, case_w) cover_left_2d();
        // its top right corner rounded in plan, beside the antenna
        translate([0, 0, -1]) linear_extrude(tube_d + 2) plan_outline(plate_x1, notch_round);
      }
      cylinder_back_half();
    }
    along_y(cover_end, case_w - cover_end) cover_cavity_2d();
    cylinder_cuts();
    // the window from above the cell into the cavity, through the right rib
    translate([cavity_x1 - 1, window_y0, plate_back_z])
      cube([ledge_x - cavity_x1 + 2, window_y1 - window_y0, cover_roof_z - plate_back_z]);
    for (p = right_screws) cover_screw_hole(p, plate_back_z, tube_d);
    for (p = boss_screws) cover_screw_hole(p, plate_back_z + cover_boss_h, tube_d);
    for (p = block_screws) cover_screw_hole(p, tube_z, tube_back_z(p[0]), tear = false);
  }
  for (y0 = xiao_y0s) {
    yc = y0 + xiao_pw / 2;
    // on the USB-C connector at the left end, on the PCB at the right
    hold_down(xiao_x0 + xiao_clearance + 2, yc, plate_back_z + xiao_height);
    hold_down(xiao_x1 - xiao_clearance - 1.5, yc, plate_back_z + xiao_pcb);
  }
}

// Print orientations
module back_plate_print() { back_plate(); }
// standing on its bottom end, so its round end and ribs print as walls
module electronics_cover_print() { translate([0, tube_d, 0]) rotate([90, 0, 0]) electronics_cover(); }

// Assembly: the depth frame mirrored in Z, so the front face is at z = 0,
// facing +Z
module shell_assembled() { mirror([0, 0, 1]) shell(); }
module back_plate_assembled() { translate([0, 0, -kobo_back_z]) mirror([0, 0, 1]) back_plate(); }
module electronics_cover_assembled() { mirror([0, 0, 1]) electronics_cover(); }

// The back plate and the cover on one bed
module covers_layout() {
  back_plate_print();
  translate([-cover_x0, case_w + 5, 0]) electronics_cover_print();
}

// Reference: the Kobo, an 18650, two XIAOs, and an SMA bulkhead with a stub
// of antenna
module kobo() {
  translate([pocket_x0 + tolerance, pocket_y0 + tolerance, -front_thickness - kobo_thickness])
    linear_extrude(kobo_thickness)
      rounded_rect(kobo_length, kobo_width, kobo_corner_radius);
}

module kobo_screen() {
  translate([pocket_x0 + tolerance + screen_left, pocket_y0 + tolerance + screen_bottom,
             -front_thickness])
    cube([screen_width, screen_height, 0.2]);
}

module cell() {
  translate([tube_x, end_block + 1, -tube_z]) rotate([-90, 0, 0]) cylinder(d = 18.4, h = 65);
}

module xiaos() {
  for (y0 = xiao_y0s)
    translate([xiao_x0 + xiao_clearance, y0 + xiao_clearance, -plate_back_z - xiao_pcb]) {
      cube([xiao_length, xiao_width, xiao_pcb]);
      // USB-C at the left end
      translate([-1, xiao_width / 2 - 4.5, -(xiao_height - xiao_pcb)]) cube([7.5, 9, xiao_height - xiao_pcb]);
    }
}

module sma_antenna() {
  translate([tube_x, hex_y0, -tube_z]) rotate([-90, 0, 0]) {
    cylinder(r = 8 / 2 / cos(30), h = sma_hex_depth, $fn = 6);
    cylinder(d = 6.35, h = sma_hex_depth + sma_panel + 8);
    translate([0, 0, sma_hex_depth + sma_panel]) cylinder(r = 8 / 2 / cos(30), h = 2.5, $fn = 6);
    translate([0, 0, sma_hex_depth + sma_panel + 4]) cylinder(d = 9.5, h = 60);
  }
}
