// Kobo Clara HD MeshCore handheld: a grip the Kobo slots into, used in
// landscape with the grip on the right. The Kobo stays whole: its chin (the
// wide bezel at its bottom edge) slides sideways into a slot in the grip and
// just sits there, so it comes out again as it went in. Nothing screws to it.
//
// - The grip is an 18650 cylinder, flush with the front and standing out at
//   the back, whose depth carries on inward behind the Kobo to a rounded
//   inner end. It's an open tub: the cell, three Seeed XIAOs and two SMA
//   bulkheads are all reached from behind.
// - The slot: a lip over the chin in front (stopping short of the screen),
//   the tub's floor behind, and the grip's top and bottom walls at its ends.
//   The floor reaches further in than the lip, so the Kobo is held over more
//   of its back than of its front.
// - The XIAOs (nRF + two SX1262 radios) lie flat on the floor behind the
//   chin, stacked down from the top wall.
// - Two SMA bulkheads in the top wall: one over the cylinder, its jack pushed
//   up the cylinder from below; one in the top of the rounded inner end, its
//   jack slid in from behind. One radio's antenna may be an internal strip
//   instead, stuck inside the inner end below the second SMA.
//
// Assembly frame: X along the device (cylinder at +X), Y up the device as
// it's held (SMA at +Y), Z out of the screen. The grip is modelled in the
// "depth frame": X and Y as above, z = depth behind the front face. The Kobo's
// top edge is at x = 0, its bottom edge (the chin's end) at pocket_x1.
//
// The grip prints standing on its bottom end: every wall runs along Y, so
// it only bridges the slot's top end and the SMAs' undersides, which rise at
// 45°. Lying face down it couldn't print: the floor would span the slot in
// mid-air.
//
// The Kobo's power button, at the middle of its bottom edge, sits at the
// bottom of a 45° trough cut down through the front.

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
// How far short of the screen the lip over the chin stops
window_margin = 2;
// Where the power button sits along the Kobo's bottom edge, measured from
// the Kobo's lower edge as it's held: mid-edge per Kobo's drawing
power_button_y = 55;
// Gap round the Kobo in the slot, per side and over its thickness
tolerance = 0.3;
// The lip over the chin
front_thickness = 2;
// The grip's walls
wall = 3;
// The tub's floor behind the Kobo
floor_thickness = 2;
// Solid strip between the slot's end and the cell's bore
right_ledge = 8;
// 18650 bore (cell plus clearance)
cell_bore = 18.8;
// Cell bay length above the bottom wall: a 65 mm cell with its leads' tabs
cell_bay_length = 67;
// Half-ring over the bay that stops the cell sliding up: thickness, and
// inner radius (the leads pass inside it)
cell_stop = 2;
cell_stop_r = 6;
// Cylinder wall round the cell
tube_wall = 1.8;
// How far the grip reaches in behind the Kobo from the cylinder's leftmost
// point
thick_width = 48.2;
// Rounding on the back's outer edge at the right
rim_round = 2;
// The grip's corners seen from the front: at the inner end, and at the right
corner_radius = 6;
corner_round_right = 3;
// SMA bulkheads (1/4"-36): hole through the top wall, the jack's hex (8 mm
// plus clearance, across flats), and how far below the top wall each mount's
// 45° underside starts
sma_hole = 6.6;
sma_hex = 8.3;
sma_hex_depth = 3;
// Seeed XIAO boards: how many, their outline, and the gap round and between
// them
xiao_count = 3;
xiao_length = 21;
xiao_width = 17.8;
xiao_margin = 1.5;
// 45° chamfer round the front face's outer edge
front_chamfer = 1;
// Power button trough: along Y, and how deep its bottom edge sits into the
// Kobo's thickness
button_trough = 22;
button_depth_fraction = 0.75;
// END_PARAMS

eps = 0.01;

// The slot, over the Kobo's whole outline (only the chin's end is in the grip)
pocket_l = kobo_length + 2 * tolerance;
pocket_w = kobo_width + 2 * tolerance;
pocket_t = kobo_thickness + tolerance;
pocket_x1 = pocket_l;
pocket_y0 = wall;

// Depths from the front face
kobo_back_z = front_thickness + pocket_t;
floor_back_z = kobo_back_z + floor_thickness;

case_w = pocket_w + 2 * wall;

// The lip over the chin ends window_margin short of the screen
lip_x0 = tolerance + screen_left + screen_width + window_margin;

tube_d = cell_bore + 2 * tube_wall;
ledge_x = pocket_x1 + right_ledge;          // the cell's bore starts here
tube_x = ledge_x + cell_bore / 2;
tube_z = tube_d / 2;
case_l = tube_x + tube_d / 2;
back_z = tube_d;                            // the back rim

// The grip's inner end: a quarter round from the floor up to the rim
thick_x0 = tube_x - tube_d / 2 - thick_width;
end_r = back_z - floor_back_z;

// SMA mounts: the jack's hex under the top wall, the nut on top
hex_r = sma_hex / 2 / cos(30);
hex_y1 = case_w - wall;
hex_y0 = hex_y1 - sma_hex_depth;
cell_y1 = wall + cell_bay_length;
cone_h = cell_bore / 2 - cell_stop_r;

// The second SMA, in the top of the inner end: its hex's front corner 1 mm
// off the floor, a flat facing the round
sma2_x = thick_x0 + end_r + 2;
sma2_z = floor_back_z + 1 + hex_r;
sma2_block_x1 = sma2_x + sma_hex / 2 + wall;

// XIAOs on the floor behind the chin, against the ledge, stacked down from
// the top wall
xiao_x1 = ledge_x - xiao_margin;
xiao_x0 = xiao_x1 - xiao_length;
xiao_y0s = [for (i = [0 : xiao_count - 1])
  hex_y1 - xiao_margin - xiao_width - i * (xiao_width + xiao_margin)];

button_apex_z = front_thickness + button_depth_fraction * pocket_t;
button_case_y = pocket_y0 + tolerance + power_button_y;

// The trough's 45° side is the line x + z = pocket_x1 + button_apex_z
function to_trough(p) = (p[0] + p[1] - pocket_x1 - button_apex_z) / sqrt(2);

assert(to_trough([tube_x, tube_z]) - cell_bore / 2 >= 1.2,
       "the button trough comes too close to the cell's bore");
assert(thick_x0 < lip_x0, "the floor behind the Kobo must reach further in than the lip");
assert(sma2_x - sma_hex / 2 - thick_x0 >= wall, "the second SMA's hex breaks into the inner end's round");
assert(xiao_x0 - sma2_block_x1 >= 1, "the XIAOs run into the second SMA's mount");
assert(xiao_y0s[xiao_count - 1] >= wall, "the XIAO stack runs off the bottom of the grip");
assert(hex_y0 - cell_bore - cell_y1 - cone_h - cell_stop >= 10,
       "no room above the cell for the first SMA's pigtail");

// An octagon with a flat at the bottom: a round corner that prints standing
// up, its underside no steeper than 45°
module octagon(r) { rotate(22.5) circle(r = r / cos(22.5), $fn = 8); }

module case_plan() {
  hull() {
    translate([thick_x0 + corner_radius, case_w - corner_radius]) circle(r = corner_radius);
    translate([case_l - corner_round_right, case_w - corner_round_right]) circle(r = corner_round_right);
    translate([thick_x0 + corner_radius, corner_radius]) octagon(corner_radius);
    translate([case_l - corner_round_right, corner_round_right]) octagon(corner_round_right);
  }
}

// Clips a solid to the grip's plan with the front chamfer round its edge
module chamfered_plan(h) {
  hull() {
    linear_extrude(eps) offset(delta = -front_chamfer) case_plan();
    translate([0, 0, front_chamfer]) linear_extrude(h - front_chamfer) case_plan();
  }
}

// Extrude a (x, depth) profile along Y from y0 to y1
module along_y(y0, y1) {
  translate([0, y1, 0]) rotate([90, 0, 0]) linear_extrude(y1 - y0) children();
}

// The grip's outline in (x, depth), before the Kobo's notch: its inner end
// a quarter round from the floor up to the rim, a flat back, the right side
// straight up from the cylinder's widest point with its top edge rounded,
// and the cylinder's front-right quarter a 45° flat
module thick_outline_2d() {
  intersection() {
    hull() {
      translate([thick_x0 + end_r, floor_back_z]) circle(r = end_r);
      translate([thick_x0, 0]) square([eps, floor_back_z]);
      translate([tube_x, tube_z]) circle(d = tube_d);
      translate([tube_x + tube_d / 2 * (sqrt(2) - 1), 0]) square(eps);
      translate([case_l - rim_round, back_z - rim_round]) circle(r = rim_round);
    }
    square([case_l + 1, back_z]);
  }
}

// The Kobo in front of the floor, left of the lip, isn't the grip's
module grip_outline_2d() {
  difference() {
    thick_outline_2d();
    translate([thick_x0 - 1, -1]) square([lip_x0 - thick_x0 + 1, kobo_back_z + 1]);
  }
}

// The tub's inside: behind the floor, a wall in from the inner end's round,
// open at the back; over the cell above its axis; and the cell's bore
module tub_2d() {
  intersection() {
    offset(delta = -wall) thick_outline_2d();
    translate([0, floor_back_z]) square([ledge_x, back_z]);
  }
  translate([thick_x0 + end_r, floor_back_z]) square([ledge_x - thick_x0 - end_r, back_z]);
  translate([ledge_x - eps, tube_z]) square([cell_bore + eps, back_z]);
  translate([tube_x, tube_z]) circle(d = cell_bore);
}

// A solid under the top wall that hangs off one wall, its underside rising
// at 45° from it so the grip prints standing up. children(0): its section;
// children(1): a sliver of the section along that wall; reach: how far the
// section runs from that wall
module hung_block(reach) {
  hull() {
    along_y(hex_y0, case_w) children(0);
    along_y(hex_y0 - reach, hex_y0) children(1);
  }
}

// The first SMA: a block over the cylinder hung off the right wall, the hex
// through it so the jack goes up the bore from below
module sma1_block() {
  hung_block(cell_bore) {
    intersection() { thick_outline_2d(); translate([ledge_x, 0]) square([case_l, back_z]); }
    intersection() { thick_outline_2d(); translate([ledge_x + cell_bore, 0]) square([case_l, back_z]); }
  }
}

module sma1_cuts() {
  along_y(hex_y0 - cell_bore - 1, hex_y1) translate([tube_x, tube_z]) circle(r = hex_r, $fn = 6);
  along_y(hex_y1 - 1, case_w + 1) translate([tube_x, tube_z]) circle(d = sma_hole);
}

// The second SMA: a block in the inner end hung off its round, with a hex
// channel and a slot through the top wall, both open to the back, so the
// jack slides in from behind
module sma2_block() {
  hung_block(sma2_block_x1 - thick_x0) {
    intersection() {
      thick_outline_2d();
      translate([thick_x0, floor_back_z]) square([sma2_block_x1 - thick_x0, back_z]);
    }
    intersection() {
      thick_outline_2d();
      translate([thick_x0, floor_back_z]) square([wall, back_z]);
    }
  }
}

module sma2_cuts() {
  along_y(hex_y0 - (sma2_block_x1 - thick_x0) - 1, hex_y1) hull() {
    translate([sma2_x, sma2_z]) rotate(90) circle(r = hex_r, $fn = 6);
    translate([sma2_x - sma_hex / 2, sma2_z]) square([sma_hex, back_z]);
  }
  along_y(hex_y1 - 1, case_w + 1) hull() {
    translate([sma2_x, sma2_z]) circle(d = sma_hole);
    translate([sma2_x - sma_hole / 2, sma2_z]) square([sma_hole, back_z]);
  }
}

// The power button: cut the lip back 3 mm over the Kobo's edge, and slope
// the grip away at 45° from the button down to the front face. The trough's
// top end rises at 45° to the sloped side, so it prints standing up.
module button_trough_cut() {
  a = button_apex_z;
  y1 = button_case_y + button_trough / 2;
  hull() {
    along_y(button_case_y - button_trough / 2, y1)
      polygon([[pocket_x1 - 3, -1], [pocket_x1 - 3, front_thickness + eps],
               [pocket_x1, front_thickness + eps], [pocket_x1, a],
               [pocket_x1 + a + 1, -1]]);
    along_y(y1, y1 + (a + 4) / sqrt(2))
      polygon([[pocket_x1 - 0.1, a], [pocket_x1, a],
               [pocket_x1 + a + 1, -1], [pocket_x1 + a + 0.9, -1]]);
  }
}

// Over the cell's top, its underside a 45° cone; the leads pass inside it
module cell_stop() {
  intersection() {
    translate([tube_x, cell_y1, tube_z]) rotate([-90, 0, 0]) difference() {
      cylinder(d = cell_bore + 1, h = cone_h + cell_stop);
      translate([0, 0, -eps]) cylinder(r1 = cell_bore / 2, r2 = cell_stop_r, h = cone_h + eps);
      translate([0, 0, cone_h - eps]) cylinder(r = cell_stop_r, h = cell_stop + 1);
    }
    translate([0, 0, -1]) cube([case_l, case_w, tube_z + 1]);
  }
}

// The grip in the depth frame
module grip_shape() {
  difference() {
    intersection() {
      union() {
        difference() {
          along_y(0, case_w) grip_outline_2d();
          along_y(wall, case_w - wall) tub_2d();
        }
        sma1_block();
        sma2_block();
      }
      chamfered_plan(back_z);
    }
    // the slot the Kobo's chin slides into
    translate([-1, pocket_y0, front_thickness]) cube([pocket_x1 + 1, pocket_w, pocket_t]);
    sma1_cuts();
    sma2_cuts();
    button_trough_cut();
  }
  cell_stop();
}

// Print frame: standing on its bottom end, the front face toward -Y
module grip() { rotate([90, 0, 0]) translate([-thick_x0, 0, 0]) grip_shape(); }

// Assembly: the depth frame mirrored in Z, so the front face is at z = 0,
// facing +Z
module grip_assembled() { mirror([0, 0, 1]) grip_shape(); }

// The assembly stood up for the preview: antenna up (+Z), screen facing -Y
module upright() { rotate([90, 0, 0]) children(); }

module rounded_rect(l, w, r) {
  translate([r, r]) offset(r) square([l - 2 * r, w - 2 * r]);
}

// Reference: the Kobo, an 18650, the XIAOs, and the SMA bulkheads with a
// stub of antenna each
module kobo() {
  translate([tolerance, pocket_y0 + tolerance, -front_thickness - kobo_thickness])
    linear_extrude(kobo_thickness)
      rounded_rect(kobo_length, kobo_width, kobo_corner_radius);
}

module kobo_screen() {
  translate([tolerance + screen_left, pocket_y0 + tolerance + screen_bottom, -front_thickness])
    cube([screen_width, screen_height, 0.2]);
}

module cell() {
  translate([tube_x, wall + 1, -tube_z]) rotate([-90, 0, 0]) cylinder(d = 18.4, h = 65);
}

module xiaos() {
  for (y0 = xiao_y0s)
    translate([xiao_x0, y0, -floor_back_z - 1.2]) {
      cube([xiao_length, xiao_width, 1.2]);
      translate([1, 2, -2.3]) cube([xiao_length - 6, xiao_width - 4, 2.3]);
    }
}

module sma_antenna(x, z) {
  translate([x, hex_y0, -z]) rotate([-90, 0, 0]) {
    cylinder(r = 8 / 2 / cos(30), h = sma_hex_depth, $fn = 6);
    cylinder(d = 6.35, h = sma_hex_depth + wall + 8);
    translate([0, 0, sma_hex_depth + wall]) cylinder(r = 8 / 2 / cos(30), h = 2.5, $fn = 6);
    translate([0, 0, sma_hex_depth + wall + 4]) cylinder(d = 9.5, h = 60);
  }
}

module sma_antennas() {
  sma_antenna(tube_x, tube_z);
  sma_antenna(sma2_x, sma2_z);
}
