// Kobo Clara HD MeshCore case: a slim frame round the Kobo, used in
// landscape, with a 15 mm tube standing up its right side. The tube stops
// short of the case's top, and its end face is a hex mount for an SMA
// bulkhead, so the antenna stands in the open on the tube's axis.
//
// Assembly frame: X along the device (tube at +X), Y up the device as it's
// held (SMA at +Y), Z out of the screen. z = 0 is the front face, so the case
// lies at negative Z. The frame prints front face down: its print frame is
// the assembly frame mirrored in Z, so every wall rises off the bed and the
// tube lies along the bed.
//
// The front face is one plane across frame and tube; the tube is thicker than
// the Kobo's frame, so it stands proud at the back.
//
// The Kobo goes in with its bottom edge (power button, micro USB) against the
// tube: the micro USB comes out through a window across the tube, and the
// power button sits in a 45° trough cut down through the front.

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
// Where the power button and micro USB sit along the Kobo's bottom edge,
// measured from the Kobo's lower edge as it's held (its left edge seen from
// the front in portrait). The button is mid-edge per Kobo's drawing; the USB
// is below it, which the user corrected (the drawing is mirrored)
power_button_y = 55;
usb_y = 34;
// Gap round the Kobo, per side and over its thickness
tolerance = 0.3;
// Front lip over the Kobo's bezel
front_thickness = 2;
// Walls along the long sides
wall = 3;
// Wall at the Kobo's left end; it takes the back plate's screws
left_wall = 6;
// Solid strip between the Kobo and the tube's bore; it takes the back
// plate's right-hand screws
right_ledge = 5;
// Tube outside diameter
tube_d = 15;
// Tube axis, this far right of the Kobo pocket's edge
tube_offset = 10;
// The tube ends this far below the top of the case
tube_short = 25;
// Hex pocket in the tube's end face that holds the SMA bulkhead's nut:
// across flats (8 mm nut plus clearance) and depth
sma_hex = 8.3;
sma_hex_depth = 3;
// Material under the hex pocket, and the hole through it (1/4"-36 thread)
sma_panel = 2;
sma_hole = 6.6;
// Bore under the panel, up which the pigtail's jack is pushed from the
// tube's bottom end, to thread into the captured nut
pigtail_bore = 10;
// Material kept over a bore's flat top, at the tube's back
bore_skin = 1.5;
// Back plate thickness
plate_thickness = 2;
// Outside corner radius at the left end, seen from the front
corner_radius = 6;
// 45° chamfer round the front face's outer edge
front_chamfer = 1;
// Micro USB window, along Y
usb_window = 13;
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

// The frame's back face runs to ledge_x; from there the tube's fairing starts
ledge_x = pocket_x1 + right_ledge;
tube_x = pocket_x1 + tube_offset;
tube_z = tube_d / 2;
case_l = tube_x + tube_d / 2;

// Bores' flat tops, as the frame prints
bore_top_z = tube_d - bore_skin;

pad_h = head_floor + head_depth;          // plate + pad under a screw head
pad_d = head_d + 4;

back_screws = [[left_wall / 2, 15], [left_wall / 2, case_w - 15],
               [pocket_x1 + right_ledge / 2, 18],
               [pocket_x1 + right_ledge / 2, case_w - 15]];

tube_y1 = case_w - tube_short;              // the tube's end face
hex_y0 = tube_y1 - sma_hex_depth;
panel_y0 = hex_y0 - sma_panel;

button_apex_z = front_thickness + button_depth_fraction * pocket_t;
button_case_y = pocket_y0 + tolerance + power_button_y;
usb_case_y = pocket_y0 + tolerance + usb_y;

// The trough's 45° side is the line x + z = pocket_x1 + button_apex_z
trough_to_bore = (tube_x + tube_z - pocket_x1 - button_apex_z) / sqrt(2) - pigtail_bore / 2;

assert(trough_to_bore >= 1.2,
       str("the button trough comes within ", trough_to_bore, " mm of the pigtail bore"));
assert(tube_x - pigtail_bore / 2 - (pocket_x1 + right_ledge / 2 + pilot_d / 2) >= 1,
       "the right-hand screws' pilots break into the tube's bore");
assert(sma_hex / cos(30) < 2 * (bore_top_z - tube_z),
       "the SMA hex pocket breaks through the tube's back");
assert(tube_d > plate_back_z, "the tube should stand proud of the back plate");
assert(abs(power_button_y - usb_y) > (button_trough + usb_window) / 2 + 2,
       "the button trough and the USB window overlap");
assert(case_l <= 218, str("case is ", case_l, " mm long: too long for a 220 mm bed"));
assert(plate_thickness < pad_h, "the counterbore needs a pad under it");

module rounded_rect(l, w, r) {
  translate([r, r]) offset(r) square([l - 2 * r, w - 2 * r]);
}

// Frame outline, seen from the front: rounded at the left, square where the
// tube takes over
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
    linear_extrude(eps) offset(delta = -front_chamfer) frame_outline(ledge_x + front_chamfer);
    translate([0, 0, front_chamfer]) linear_extrude(kobo_back_z - front_chamfer)
      frame_outline(ledge_x + front_chamfer);
  }
}

// Tube cross-section in XZ (print frame): the circle, a 45° flat where its
// front-right quarter would overhang the bed, and a fairing back to the
// ledge, level with the back plate's outer face so the plate butts into it
module tube_profile() {
  hull() {
    translate([tube_x, tube_z]) circle(d = tube_d);
    // 45° tangent from the circle's lower right to the bed
    translate([tube_x + tube_d / 2 * (sqrt(2) - 1), 0]) square(eps);
    translate([ledge_x - eps, 0]) square([eps, plate_back_z]);
  }
}

module tube_body() {
  intersection() {
    rotate([90, 0, 0]) translate([0, 0, -case_w]) linear_extrude(case_w) tube_profile();
    front_chamfer_ends(ledge_x - 1, case_l + 1, 0, tube_y1, tube_d);
  }
}

// Bore along Y, a teardrop peaked toward the back (up as the frame prints),
// flat-topped at bore_top_z so the tube's back keeps its skin
module bore(d, y0, y1) {
  translate([tube_x, y1, 0]) rotate([90, 0, 0]) linear_extrude(y1 - y0)
    intersection() {
      hull() {
        translate([0, tube_z]) circle(d = d);
        translate([0, tube_z + d / 2 * sqrt(2)]) square(eps, center = true);
      }
      translate([-d, 0]) square([2 * d, bore_top_z]);
    }
}

// Print frame: front face on the bed, z up = into the device
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
    // Hex flats top and bottom as it prints: a short flat bridge, not a
    // 30° roof
    translate([tube_x, hex_y0, tube_z]) rotate([-90, 0, 0])
      cylinder(d = sma_hex / cos(30), h = sma_hex_depth + 1, $fn = 6);
    translate([tube_x, panel_y0 - 1, tube_z]) rotate([-90, 0, 0])
      cylinder(d = sma_hole, h = sma_panel + 2);
    bore(pigtail_bore, -1, panel_y0);
    usb_window_cut();
    button_trough_cut();
    for (p = back_screws) translate([p[0], p[1], kobo_back_z - 9])
      cylinder(d = pilot_d, h = 10);
  }
}

// Micro USB window from the Kobo's edge out through the tube's right side.
// Its roof peaks at 45° for the print, flat-topped under the tube's skin
module usb_window_cut() {
  w = usb_window;
  translate([pocket_x1 - 1, usb_case_y, 0]) rotate([90, 0, 90])
    linear_extrude(case_l - pocket_x1 + 2)
      intersection() {
        hull() {
          translate([-w / 2, front_thickness]) square([w, pocket_t]);
          translate([0, kobo_back_z + w / 2]) square(eps, center = true);
        }
        translate([-w, 0]) square([2 * w, bore_top_z]);
      }
}

// The power button: cut the lip back 3 mm over the Kobo's edge, and slope
// the frame away at 45° from the button down to the front face
module button_trough_cut() {
  a = button_apex_z;
  translate([0, button_case_y + button_trough / 2, 0]) rotate([90, 0, 0])
    linear_extrude(button_trough)
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

// Print frame: inner face on the bed, screw pads up
module back_plate() {
  difference() {
    union() {
      linear_extrude(plate_thickness) frame_outline(ledge_x);
      linear_extrude(pad_h) intersection() {
        frame_outline(ledge_x);
        for (p = back_screws) translate(p) circle(d = pad_d);
      }
    }
    counterbored_holes(back_screws, pad_h);
  }
}

// Assembly: print frame mirrored in Z, so the front face is at z = 0, facing +Z
module shell_assembled() { mirror([0, 0, 1]) shell(); }
module back_plate_assembled() { translate([0, 0, -kobo_back_z]) mirror([0, 0, 1]) back_plate(); }

// Reference: the Kobo and an SMA bulkhead with a stub of antenna
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

module sma_antenna() {
  translate([tube_x, panel_y0 - 8, -tube_z]) rotate([-90, 0, 0]) {
    cylinder(d = 6.35, h = 8 + sma_panel + sma_hex_depth + 5);
    translate([0, 0, 8 + sma_panel]) cylinder(d = 8 / cos(30), h = 2.5, $fn = 6);
    translate([0, 0, 8 + sma_panel + sma_hex_depth + 2]) cylinder(d = 9.5, h = 60);
  }
}
