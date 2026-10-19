// Kobo Clara HD MeshCore case: a slim frame round the Kobo, used in
// landscape, with a thick part up its right side: an 18650 cylinder, flush
// with the front and standing out at the back, whose depth carries on inward
// behind the Kobo. The thick part is an open tub: its outer wall is the
// frame's, and its back is open, so the cell, two Seeed XIAOs and the SMA
// bulkhead are all reached from behind.
//
// - One back plate covers the Kobo and stops where the thick part starts.
//   It carries the tub's rounded inner end (the frame can't: it would float
//   over the Kobo as the frame prints), and two strips reach across the Kobo
//   to screw down beside the cylinder. The top strip has a window for each
//   XIAO, so the boards lie flat on the Kobo's back near the antenna.
// - The SMA bulkhead mounts in the cylinder's top end, at the top of the
//   case: the jack's hex sits in a pocket under the end wall, the nut
//   tightens on top. The mount is all frame.
//
// Assembly frame: X along the device (cylinder at +X), Y up the device as
// it's held (SMA at +Y), Z out of the screen. Every part is modelled in the
// "depth frame": X and Y as above, z = depth behind the front face. That is
// the frame's print frame: it prints front face down, every wall rising off
// the bed. The *_assembled() wrappers mirror into the assembly frame.
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
// Walls along the long sides, and the tub's ends
wall = 3;
// Wall at the Kobo's left end; it takes the back plate's screws
left_wall = 6;
// Solid strip between the Kobo and the cell's bore; it takes the back
// plate's right-hand screws
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
// How far the thick part reaches in behind the Kobo from the cylinder's
// leftmost point
thick_width = 48.2;
// Rounding on the tub's outer top edge at the right, and its corners in plan
rim_round = 2;
corner_round_right = 3;
// SMA bulkhead (1/4"-36): hole through the top wall, and the hex pocket
// under it that holds the jack's hex body (8 mm plus clearance, across flats)
sma_hole = 6.6;
sma_hex = 8.3;
sma_hex_depth = 3;
// Back plate thickness
plate_thickness = 2;
// Strips of the back plate reaching across the Kobo to the ledge: the
// bottom one's height (the top one holds the XIAO windows)
bottom_strip = 27;
// Seeed XIAO boards (no headers): outline, and the gap round each in its
// window
xiao_length = 21;
xiao_width = 17.8;
xiao_clearance = 0.2;
// Material round and between the windows
xiao_margin = 1.5;
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
tube_z = tube_d / 2;
case_l = tube_x + tube_d / 2;
back_z = tube_d;                            // the thick part's back rim

// The thick part's inner end: the back plate's wall, a quarter round from
// the plate up to the rim
thick_x0 = tube_x - tube_d / 2 - thick_width;
end_r = back_z - plate_back_z;

pad_h = head_floor + head_depth;          // plate + pad under a screw head
pad_d = head_d + 4;

// SMA mount: the top wall is its panel, the hex pocket under it, all in a
// solid block across the cylinder
hex_r = sma_hex / 2 / cos(30);
hex_y1 = case_w - wall;
hex_y0 = hex_y1 - sma_hex_depth;
sma_block_top = tube_z + hex_r + 2;
cell_y1 = wall + cell_bay_length;

// Strips of the back plate across the Kobo, ending on the ledge
strip_x1 = ledge_x - 0.5;
right_screw_x = pocket_x1 + 2.75;
left_screws = [for (y = [15, case_w - 15]) [left_wall / 2, y]];
right_screws = [[right_screw_x, wall + bottom_strip / 2], [right_screw_x, case_w - 15]];

// XIAO windows in the top strip, one above the other, clear of the right
// screw's pad
xiao_wl = xiao_length + 2 * xiao_clearance;
xiao_ww = xiao_width + 2 * xiao_clearance;
xiao_x1 = right_screw_x - pad_d / 2 - xiao_margin;
xiao_x0 = xiao_x1 - xiao_wl;
xiao_y0s = [for (i = [0, 1]) case_w - wall - xiao_margin - xiao_ww - i * (xiao_ww + xiao_margin)];
top_strip_y0 = xiao_y0s[1] - xiao_margin;

button_apex_z = front_thickness + button_depth_fraction * pocket_t;
button_case_y = pocket_y0 + tolerance + power_button_y;

// The trough's 45° side is the line x + z = pocket_x1 + button_apex_z
function to_trough(p) = (p[0] + p[1] - pocket_x1 - button_apex_z) / sqrt(2);

assert(to_trough([tube_x, tube_z]) - cell_bore / 2 >= 1.2,
       "the button trough comes too close to the cell's bore");
assert(ledge_x - (right_screw_x + pilot_d / 2) >= 1,
       "the right-hand pilots break into the cell's bore");
assert(xiao_x0 - xiao_margin >= thick_x0 + end_r, "the XIAO windows run into the tub's inner end");
assert(xiao_x1 <= pocket_x1, "the XIAO windows run off the Kobo's back");
assert(hex_y0 - cell_y1 - cell_stop >= 20, "no room above the cell for the pigtail's jack");
assert(case_l <= 218, str("case is ", case_l, " mm long: too long for a 220 mm bed"));
assert(plate_thickness < pad_h, "the counterbore needs a pad under it");

module rounded_rect(l, w, r) {
  translate([r, r]) offset(r) square([l - 2 * r, w - 2 * r]);
}

// The case's plan: corner_radius at the left, corner_round_right at the right
module case_plan() {
  hull() {
    for (y = [corner_radius, case_w - corner_radius]) translate([corner_radius, y]) circle(r = corner_radius);
    for (y = [corner_round_right, case_w - corner_round_right])
      translate([case_l - corner_round_right, y]) circle(r = corner_round_right);
  }
}

// Clips a solid to the case's plan with the front chamfer round its edge
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

// The thick part's outline in (x, depth): its inner end a quarter round from
// the plate up to the rim, a flat back, the right side straight up from the
// cylinder's widest point with its top edge rounded, and the cylinder's
// front-right quarter a 45° flat so it doesn't overhang the bed
module thick_outline_2d() {
  intersection() {
    hull() {
      translate([thick_x0 + end_r, plate_back_z]) circle(r = end_r);
      translate([thick_x0, 0]) square([eps, plate_back_z]);
      translate([tube_x, tube_z]) circle(d = tube_d);
      translate([tube_x + tube_d / 2 * (sqrt(2) - 1), 0]) square(eps);
      translate([case_l - rim_round, back_z - rim_round]) circle(r = rim_round);
    }
    square([case_l + 1, back_z]);
  }
}

// The tub's inside: open behind the Kobo and the ledge above the frame, and
// over the cell above its axis, plus the cell's bore
module tub_cuts() {
  along_y(wall, case_w - wall) {
    translate([thick_x0 - 1, kobo_back_z]) square([ledge_x - thick_x0 + 1, back_z]);
    translate([ledge_x - eps, tube_z]) square([cell_bore + eps, back_z]);
    translate([tube_x, tube_z]) circle(d = cell_bore);
  }
}

// The SMA mount: a solid block across the cylinder under the top wall, with
// the hex pocket (flats top and bottom as it prints) and the hole up through
// the top wall
module sma_block() {
  intersection() {
    along_y(hex_y0, case_w) thick_outline_2d();
    translate([ledge_x, hex_y0, 0]) cube([case_l, case_w, sma_block_top]);
  }
}

module sma_cuts() {
  translate([tube_x, hex_y0 - eps, tube_z]) rotate([-90, 0, 0])
    cylinder(r = hex_r, h = sma_hex_depth + eps, $fn = 6);
  translate([tube_x, hex_y1 - 1, tube_z]) rotate([-90, 0, 0]) cylinder(d = sma_hole, h = wall + 2);
}

module shell() {
  difference() {
    intersection() {
      union() {
        // the Kobo's frame, up to the ledge
        translate([0, -1, 0]) cube([ledge_x, case_w + 2, kobo_back_z]);
        difference() {
          along_y(0, case_w) thick_outline_2d();
          tub_cuts();
        }
        sma_block();
      }
      chamfered_plan(back_z);
    }
    // Kobo pocket
    translate([pocket_x0, pocket_y0, front_thickness])
      linear_extrude(pocket_t + 1) rounded_rect(pocket_l, pocket_w, pocket_r);
    // Front window
    translate([pocket_x0 + tolerance + screen_left - window_margin,
               pocket_y0 + tolerance + screen_bottom - window_margin, -1])
      cube([screen_width + 2 * window_margin, screen_height + 2 * window_margin,
            front_thickness + 2]);
    sma_cuts();
    button_trough_cut();
    for (p = concat(left_screws, right_screws)) translate([p[0], p[1], kobo_back_z - 9])
      cylinder(d = pilot_d, h = 10);
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

// The plate's plan: the Kobo's back up to the thick part, the strip under
// the tub's inner end, and the two strips across to the ledge
module plate_plan() {
  intersection() {
    case_plan();
    union() {
      square([thick_x0, case_w]);
      translate([thick_x0 - eps, wall]) square([end_r + eps, case_w - 2 * wall]);
      translate([thick_x0, wall]) square([strip_x1 - thick_x0, bottom_strip]);
      translate([thick_x0, top_strip_y0]) square([strip_x1 - thick_x0, case_w - wall - top_strip_y0]);
    }
  }
}

// Print frame: inner face (against the Kobo) on the bed. The tub's inner
// end rises from it: a quarter round outside, straight up inside
module back_plate() {
  difference() {
    union() {
      linear_extrude(plate_thickness) plate_plan();
      linear_extrude(pad_h) intersection() {
        plate_plan();
        for (p = concat(left_screws, right_screws)) translate(p) circle(d = pad_d);
      }
      translate([0, 0, -kobo_back_z]) along_y(wall, case_w - wall) intersection() {
        translate([thick_x0 + end_r, plate_back_z]) circle(r = end_r);
        translate([thick_x0, plate_back_z - eps]) square([end_r, end_r + eps]);
      }
    }
    counterbored_holes(concat(left_screws, right_screws), pad_h);
    for (y0 = xiao_y0s) translate([xiao_x0, y0, -1]) cube([xiao_wl, xiao_ww, plate_thickness + 2]);
  }
}

// Assembly: the depth frame mirrored in Z, so the front face is at z = 0,
// facing +Z
module shell_assembled() { mirror([0, 0, 1]) shell(); }
module back_plate_assembled() { translate([0, 0, -kobo_back_z]) mirror([0, 0, 1]) back_plate(); }

// The assembly stood up for the preview: antenna up (+Z), screen facing -Y
module upright() { rotate([90, 0, 0]) children(); }

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
  translate([tube_x, wall + 1, -tube_z]) rotate([-90, 0, 0]) cylinder(d = 18.4, h = 65);
}

module xiaos() {
  for (y0 = xiao_y0s)
    translate([xiao_x0 + xiao_clearance, y0 + xiao_clearance, -kobo_back_z - 1.2]) {
      cube([xiao_length, xiao_width, 1.2]);
      translate([1, 2, -2.3]) cube([xiao_length - 6, xiao_width - 4, 2.3]);
    }
}

module sma_antenna() {
  translate([tube_x, hex_y0, -tube_z]) rotate([-90, 0, 0]) {
    cylinder(r = 8 / 2 / cos(30), h = sma_hex_depth, $fn = 6);
    cylinder(d = 6.35, h = sma_hex_depth + wall + 8);
    translate([0, 0, sma_hex_depth + wall]) cylinder(r = 8 / 2 / cos(30), h = 2.5, $fn = 6);
    translate([0, 0, sma_hex_depth + wall + 4]) cylinder(d = 9.5, h = 60);
  }
}
