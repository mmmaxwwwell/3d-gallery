// Kobo Clara HD MeshCore case: a slim frame round the Kobo, used in
// landscape, with a cylinder up its right side sized for an 18650. The
// cylinder's depth carries on inward behind the Kobo as a hollow cover for the
// radio and MCU, the case's whole height, its inner end rounded down to the
// back plate.
//
// - The cell slides up into the cylinder from the bottom, behind a screwed
//   end cap.
// - The cylinder stops short of the case's top, and its end is a hex mount
//   for an SMA bulkhead: the jack's hex sits in a pocket under the end panel,
//   the nut tightens on top, and the antenna stands in the open on the
//   cylinder's axis.
// - Between the cell and the SMA, a hole leads into the cover: the pigtail's
//   cable and the cell's leads go through it.
//
// Assembly frame: X along the device (cylinder at +X), Y up the device as
// it's held (SMA at +Y), Z out of the screen. Every part is modelled in the
// "depth frame": X and Y as above, z = depth behind the front face. That is
// the frame's print frame: it prints front face down, every wall rising off
// the bed and the cylinder lying along it. The *_assembled() wrappers mirror
// into the assembly frame; the *_print() wrappers put the other parts on
// their print faces.
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
// Solid strip between the Kobo and the cell's bore; it takes the back
// plate's right-hand screws and the end cap's screw
right_ledge = 8;
// 18650 bore (cell plus clearance), and how far up from the end cap it runs:
// a 65 mm cell plus room for its contacts
cell_bore = 18.8;
cell_bay_length = 72;
// Cylinder wall round the cell
tube_wall = 1.8;
// The cylinder ends this far below the top of the case
tube_short = 25;
// End panel the SMA's thread passes through (1/4"-36), nut on top
sma_panel = 2;
sma_hole = 6.6;
// Hex pocket under the panel that holds the jack's hex body from inside:
// across flats (8 mm plus clearance) and depth
sma_hex = 8.3;
sma_hex_depth = 3;
// Bore from the cell's bay up to the hex pocket: the pigtail's jack is pushed
// up it (cell out) until its hex seats in the pocket
pigtail_bore = 10;
// Hole from that bore into the electronics cover, for the pigtail's cable
// and the cell's leads
pod_hole = 5;
// Groove beside the cell for its bottom lead, from the end cap up
lead_groove = 2;
// Material kept over a bore's flat top, at the cylinder's back
bore_skin = 1.5;
// End cap at the cylinder's bottom, flush with the case's lower edge
cap_thickness = 4.5;
// Back plate thickness
plate_thickness = 2;
// Electronics cover: how far it reaches in from the back plate's right edge
// behind the Kobo. It is as deep as the cylinder, and its inner end is
// rounded down to the back plate
cover_width = 48.2;
cover_wall = 1.6;
// Its end walls, top and bottom
cover_end = 2;
// The cylinder's back leans this far toward the cover over its height
// above the back plate, so the two meet on one straight seam
seam_lean = 4;
// Gap between cover and cylinder
cover_gap = 0.2;
// Bosses on the back plate for the cover's inner screws
cover_boss_d = 7;
cover_boss_h = 5;
// Ribs inside the cover the screws run through
rib_width = 7;
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
// The back plate runs to the cylinder's leftmost point, where the cylinder's
// fairing meets it
plate_x1 = tube_x - tube_d / 2;

// Bores' flat tops
bore_top_z = tube_d - bore_skin;

pad_h = head_floor + head_depth;          // plate + pad under a screw head
pad_d = head_d + 4;

tube_y1 = case_w - tube_short;              // the cylinder's end face
panel_y0 = tube_y1 - sma_panel;
hex_y0 = panel_y0 - sma_hex_depth;
cell_y1 = cap_thickness + cell_bay_length;
pod_hole_y = (cell_y1 + hex_y0) / 2;
pod_hole_z = plate_back_z + pod_hole / 2 + 1;

// Electronics cover
cover_x0 = plate_x1 - cover_width;
cover_r = tube_d - plate_back_z;            // its inner end's radius
seam_x = plate_x1 + seam_lean;
left_rib_x = cover_x0 + cover_r;
right_screw_x = pocket_x1 + 2.75;
screw_ys = [18, case_w - 15];

// Left pair: through padded counterbores into the left wall. Right pair:
// through the cover's right rib and the plate into the ledge. Inner pair:
// through the cover's left rib into the plate's bosses.
left_screws = [for (y = [15, case_w - 15]) [left_wall / 2, y]];
right_screws = [for (y = screw_ys) [right_screw_x, y]];
boss_screws = [for (y = screw_ys) [left_rib_x, y]];

// End cap screw: along Y into the ledge, at mid-depth
cap_screw = [pocket_x1 + right_ledge / 2, kobo_back_z / 2];

button_apex_z = front_thickness + button_depth_fraction * pocket_t;
button_case_y = pocket_y0 + tolerance + power_button_y;

// The lead groove sits low on the cylinder's Kobo side (225°), clear of the
// trough and the back
groove_r = cell_bore / 2 + lead_groove / 2 - 0.5;
groove_c = [tube_x - groove_r / sqrt(2), tube_z - groove_r / sqrt(2)];

// The trough's 45° side is the line x + z = pocket_x1 + button_apex_z
function to_trough(p) = (p[0] + p[1] - pocket_x1 - button_apex_z) / sqrt(2);

assert(to_trough([tube_x, tube_z]) - cell_bore / 2 >= 1.2,
       "the button trough comes too close to the cell's bore");
assert(to_trough(groove_c) - lead_groove / 2 >= 1.2,
       "the button trough comes too close to the lead groove");
assert(groove_c[1] - lead_groove / 2 >= 1.5, "the lead groove breaks out the front");
assert(right_screw_x + rib_width / 2 <= seam_x,
       "the cover's right rib runs past the seam");
assert(ledge_x - (right_screw_x + pilot_d / 2) >= 1,
       "the right-hand pilots break into the cell's bore");
assert(cell_y1 + 8 < hex_y0, "no room between the cell's bay and the SMA for the pigtail's jack");
assert(pod_hole < hex_y0 - cell_y1, "the pod hole doesn't fit between the cell's bay and the SMA");
// The seam's distance from the cell's axis, less the bore: the wall left
seam_wall = abs((tube_x - plate_x1) * cover_r - (tube_z - plate_back_z) * seam_lean)
            / norm([seam_lean, cover_r]) - cell_bore / 2;
assert(seam_wall >= 1.5, str("the seam leaves ", seam_wall, " mm over the cell"));
assert(tube_d - plate_back_z - cover_boss_h - head_depth >= 1.5,
       "no floor under the inner screws' counterbores");
assert(cap_thickness + 10 < 18 - pilot_d / 2,
       "the end cap's pilot runs into the back plate's lower right pilot");
assert(sma_hex / cos(30) < 2 * (bore_top_z - tube_z), "the SMA hex pocket breaks out the back");
assert(case_l <= 218, str("case is ", case_l, " mm long: too long for a 220 mm bed"));
assert(plate_thickness < pad_h, "the counterbore needs a pad under it");

module rounded_rect(l, w, r) {
  translate([r, r]) offset(r) square([l - 2 * r, w - 2 * r]);
}

// Frame outline, seen from the front: rounded at the left, square where the
// cylinder takes over
module frame_outline(x1) {
  intersection() {
    rounded_rect(x1 + corner_radius, case_w, corner_radius);
    square([x1, case_w]);
  }
}

// Clips a solid to y0..y1 with the front chamfer on both ends
module front_chamfer_ends(x0, x1, y0, y1, h) {
  hull() {
    translate([x0, y0 + front_chamfer, 0]) cube([x1 - x0, y1 - y0 - 2 * front_chamfer, eps]);
    translate([x0, y0, front_chamfer]) cube([x1 - x0, y1 - y0, h]);
  }
}

module frame_body() {
  hull() {
    linear_extrude(eps) offset(delta = -front_chamfer) frame_outline(plate_x1 + front_chamfer);
    translate([0, 0, front_chamfer]) linear_extrude(kobo_back_z - front_chamfer)
      frame_outline(plate_x1 + front_chamfer);
  }
}

// Cylinder cross-section in (x, depth): the circle, a 45° flat where its
// front-right quarter would overhang the bed, a fairing back to the back
// plate's edge at the plate's outer face, so the plate butts into it, and
// from there the seam with the cover, leaning out to the cylinder's back.
// The seam recedes as the frame prints, so it doesn't overhang
module tube_profile() {
  hull() {
    translate([tube_x, tube_z]) circle(d = tube_d);
    // 45° tangent from the circle's lower right to the bed
    translate([tube_x + tube_d / 2 * (sqrt(2) - 1), 0]) square(eps);
    translate([plate_x1 - eps, 0]) square([eps, plate_back_z]);
    translate([seam_x, tube_d - eps]) square(eps);
  }
}

// Everything from the Kobo's edge rightwards, in (x, depth): the end cap's
// outline
module right_end_profile() {
  union() {
    translate([pocket_x1, 0]) square([plate_x1 + front_chamfer - pocket_x1, kobo_back_z]);
    tube_profile();
  }
}

// Extrude a (x, depth) profile along Y from y0 to y1
module along_y(y0, y1) {
  translate([0, y1, 0]) rotate([90, 0, 0]) linear_extrude(y1 - y0) children();
}

module tube_body() {
  intersection() {
    along_y(0, case_w) tube_profile();
    front_chamfer_ends(plate_x1 - 1, case_l + 1, 0, tube_y1, tube_d);
  }
}

// 45° teardrop peaked toward the back (up as the frame prints), flat-topped
// at bore_top_z so the cylinder's back keeps its skin
module bore_2d(d) {
  intersection() {
    hull() {
      translate([tube_x, tube_z]) circle(d = d);
      translate([tube_x, tube_z + d / 2 * sqrt(2)]) square(eps, center = true);
    }
    translate([tube_x - d, 0]) square([2 * d, bore_top_z]);
  }
}

// The lead groove, hulled into the bore so its roof is 45°
module groove_2d() {
  hull() {
    translate(groove_c) circle(d = lead_groove);
    translate([tube_x, tube_z]) circle(d = lead_groove);
  }
}

module sma_mount_cut() {
  // Hex flats top and bottom as it prints: a short flat bridge, not a 30° roof
  translate([tube_x, hex_y0 - eps, tube_z]) rotate([-90, 0, 0])
    cylinder(d = sma_hex / cos(30), h = sma_hex_depth + eps, $fn = 6);
  translate([tube_x, panel_y0 - 1, tube_z]) rotate([-90, 0, 0])
    cylinder(d = sma_hole, h = sma_panel + 2);
}

// From the pigtail bore out through the cylinder's seam into the cover: a
// teardrop peaked toward the back (up as the frame prints)
module pod_hole_cut() {
  translate([tube_x, pod_hole_y, pod_hole_z]) rotate([0, -90, 0])
    linear_extrude(tube_x - plate_x1 + 1)
      hull() {
        circle(d = pod_hole);
        translate([pod_hole / 2 * sqrt(2), 0]) square(eps, center = true);
      }
}

module shell() {
  difference() {
    union() {
      frame_body();
      tube_body();
    }
    // Kobo pocket
    translate([pocket_x0, pocket_y0, front_thickness])
      linear_extrude(pocket_t + 1) rounded_rect(pocket_l, pocket_w, pocket_r);
    // Front window
    translate([pocket_x0 + tolerance + screen_left - window_margin,
               pocket_y0 + tolerance + screen_bottom - window_margin, -1])
      cube([screen_width + 2 * window_margin, screen_height + 2 * window_margin,
            front_thickness + 2]);
    // The end cap's place
    translate([pocket_x1, -1, -1]) cube([case_l - pocket_x1 + 1, cap_thickness + 1, tube_d + 2]);
    along_y(cap_thickness - 1, cell_y1) { bore_2d(cell_bore); groove_2d(); }
    along_y(cell_y1 - eps, hex_y0) bore_2d(pigtail_bore);
    sma_mount_cut();
    pod_hole_cut();
    button_trough_cut();
    for (p = concat(left_screws, right_screws)) translate([p[0], p[1], kobo_back_z - 9])
      cylinder(d = pilot_d, h = 10);
    translate([cap_screw[0], cap_thickness - 1, cap_screw[1]]) rotate([-90, 0, 0])
      cylinder(d = pilot_d, h = 11);
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

// End cap, in the depth frame: y = 0..cap_thickness under the cylinder and
// the ledge, with a notch for the cell's bottom lead
module end_cap() {
  difference() {
    along_y(0, cap_thickness) difference() {
      right_end_profile();
      groove_2d();
    }
    // counterbored from the outside (y = 0)
    translate([cap_screw[0], -1, cap_screw[1]]) rotate([-90, 0, 0]) {
      cylinder(d = clear_d, h = cap_thickness + 2);
      cylinder(d = head_d, h = 1 + head_depth);
    }
  }
}

module counterbored_holes(points, h) {
  for (p = points) translate([p[0], p[1], -1]) {
    cylinder(d = clear_d, h = h + 2);
    translate([0, 0, 1 + h - head_depth]) cylinder(d = head_d, h = head_depth + 1);
  }
}

// Print frame: inner face on the bed; the left screws' pads and the
// cover's bosses up
module back_plate() {
  difference() {
    union() {
      linear_extrude(plate_thickness) frame_outline(plate_x1);
      linear_extrude(pad_h) intersection() {
        frame_outline(plate_x1);
        for (p = left_screws) translate(p) circle(d = pad_d);
      }
      for (p = boss_screws) translate(p)
        cylinder(d = cover_boss_d, h = plate_thickness + cover_boss_h);
    }
    counterbored_holes(left_screws, pad_h);
    for (p = right_screws) translate([p[0], p[1], -1]) cylinder(d = clear_d, h = plate_thickness + 2);
    for (p = boss_screws) translate([p[0], p[1], 0.6])
      cylinder(d = pilot_d, h = plate_thickness + cover_boss_h);
  }
}

// The cover's outside in (x, depth): a round end on the plate hulled to a
// flat back level with the cylinder's, clear of the cylinder by cover_gap.
// below > 0 carries it on under the plate, for cutting the open floor
module cover_outline_2d(below = 0) {
  difference() {
    intersection() {
      hull() {
        translate([cover_x0 + cover_r, plate_back_z]) circle(r = cover_r);
        translate([seam_x, plate_back_z - cover_r]) square([eps, 2 * cover_r]);
      }
      translate([cover_x0 - 1, plate_back_z - below]) square([case_l, cover_r + below]);
    }
    offset(delta = cover_gap) tube_profile();
  }
}

module cover_cavity_2d() {
  difference() {
    offset(delta = -cover_wall) cover_outline_2d(below = cover_r);
    translate([right_screw_x - rib_width / 2, 0]) square([rib_width, tube_d + 1]);
    translate([left_rib_x - rib_width / 2, plate_back_z + cover_boss_h])
      square([rib_width, tube_d]);
  }
}

// Screw hole along depth through the cover, counterbored from its back: a
// teardrop peaked +Y, which is up as the cover prints
module cover_screw_hole(p, z0) {
  module tear(d) hull() { circle(d = d); translate([0, d / 2 * sqrt(2)]) square(eps, center = true); }
  translate([p[0], p[1], z0 - 1]) {
    linear_extrude(tube_d) tear(clear_d);
    translate([0, 0, 1 + tube_d - z0 - head_depth]) linear_extrude(head_depth + 1) tear(head_d);
  }
}

// Electronics cover, in the depth frame: open floor on the back plate,
// closed ends, ribs for its screws, and the hole from the cylinder
module electronics_cover() {
  difference() {
    along_y(0, case_w) cover_outline_2d();
    along_y(cover_end, case_w - cover_end) cover_cavity_2d();
    for (p = right_screws) cover_screw_hole(p, plate_back_z);
    for (p = boss_screws) cover_screw_hole(p, plate_back_z + cover_boss_h);
    // the cylinder's hole carries on through the cover's seam wall, peaked +Y
    translate([seam_x + 1, pod_hole_y, pod_hole_z]) rotate([0, -90, 0])
      linear_extrude(seam_x - plate_x1 + cover_wall + 3)
        hull() {
          circle(d = pod_hole);
          translate([0, pod_hole / 2 * sqrt(2)]) square(eps, center = true);
        }
  }
}

// Print orientations
module back_plate_print() { back_plate(); }
// standing on its bottom end, so its round end and ribs print as walls
module electronics_cover_print() { translate([0, tube_d, 0]) rotate([90, 0, 0]) electronics_cover(); }
module end_cap_print() {
  // inner face (y = cap_thickness) down, counterbore up
  multmatrix([[1, 0, 0, 0], [0, 0, 1, 0], [0, -1, 0, cap_thickness]]) end_cap();
}

// Assembly: the depth frame mirrored in Z, so the front face is at z = 0,
// facing +Z
module shell_assembled() { mirror([0, 0, 1]) shell(); }
module back_plate_assembled() { translate([0, 0, -kobo_back_z]) mirror([0, 0, 1]) back_plate(); }
module electronics_cover_assembled() { mirror([0, 0, 1]) electronics_cover(); }
module end_cap_assembled() { mirror([0, 0, 1]) end_cap(); }

// Every printed piece but the frame, on one bed
module covers_layout() {
  back_plate_print();
  translate([-cover_x0, case_w + 5, 0]) electronics_cover_print();
  translate([seam_x - cover_x0 + 10 - pocket_x1, case_w + 5, 0]) end_cap_print();
}

// Reference: the Kobo, an 18650, and an SMA bulkhead with a stub of antenna
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
  translate([tube_x, cap_thickness + 3, -tube_z]) rotate([-90, 0, 0]) cylinder(d = 18.4, h = 65);
}

module sma_antenna() {
  translate([tube_x, hex_y0, -tube_z]) rotate([-90, 0, 0]) {
    cylinder(d = 8 / cos(30), h = sma_hex_depth, $fn = 6);
    cylinder(d = 6.35, h = sma_hex_depth + sma_panel + 8);
    translate([0, 0, sma_hex_depth + sma_panel]) cylinder(d = 8 / cos(30), h = 2.5, $fn = 6);
    translate([0, 0, sma_hex_depth + sma_panel + 4]) cylinder(d = 9.5, h = 60);
  }
}
