// Kobo Clara HD MeshCore case: a frame round the Kobo, used in landscape,
// with a grip-sized bay on the right for the radio, MCU and battery, and an
// SMA bulkhead standing up out of the bay's top wall.
//
// Assembly frame: X along the device (bay at +X), Y up the device as it's
// held (SMA at +Y), Z out of the screen. z = 0 is the front face, so the case
// lies at negative Z. The shell prints front face down: its print frame is
// the assembly frame mirrored in Z, so every wall rises off the bed.
//
// The Kobo goes in with its bottom edge (power button, micro USB) toward the
// bay: the micro USB opens into the bay through a window in the divider, and
// the power button sits in a 45° trough cut down through the front.

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
// measured up from the case's lower edge (= from the Kobo's left edge seen in
// portrait), estimated from Kobo's drawing
power_button_y = 55;
usb_y = 76;
// Gap round the Kobo, per side and over its thickness
tolerance = 0.3;
// Front lip over the Kobo's bezel
front_thickness = 2;
// Walls along the long sides and the bay's outer end
wall = 3;
// Wall at the Kobo's left end; it takes the back plate's screws
left_wall = 6;
// Wall between the Kobo and the bay: a ledge for the back plate's screws on
// the Kobo side, then the bay's own wall
divider_ledge = 6.5;
divider_wall = 2.5;
// Bay inside width along X
bay_width = 38;
// Total thickness at the bay, front face to the lid's back
bay_thickness = 24;
// Back plate and bay lid thickness
plate_thickness = 2;
lid_thickness = 2.5;
// Outside corner radius seen from the front
corner_radius = 6;
// 45° chamfer round the front face's outer edge
front_chamfer = 1;
// SMA bulkhead hole through the bay's top wall (1/4"-36 thread)
sma_hole = 6.6;
// SMA position along the bay, measured from the bay's outer end
sma_from_end = 19;
// Micro USB window through the divider: along Y
usb_window = 13;
// Power button trough: along Y, and how deep its bottom edge sits into the
// Kobo's thickness
button_trough = 22;
button_depth_fraction = 0.8;
// M3 cap screws: pilot for self-tapping, clearance, counterbore
pilot_d = 2.5;
clear_d = 3.4;
head_d = 6.2;
head_depth = 3.2;
// Material left under a counterbore
head_floor = 1.3;
// Boss in each bay corner for the lid's screws
boss_d = 7;
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
kobo_back_z = front_thickness + pocket_t;   // shell's back face over the Kobo
bay_back_z = bay_thickness - lid_thickness; // shell's back face over the bay

case_l = left_wall + pocket_l + divider_ledge + divider_wall + bay_width + wall;
case_w = pocket_w + 2 * wall;

// Where the back plate stops and the bay's walls start
bay_wall_x = pocket_x1 + divider_ledge;
bay_x0 = bay_wall_x + divider_wall;
bay_x1 = bay_x0 + bay_width;

pad_h = head_floor + head_depth;          // plate + pad under a screw head
pad_d = head_d + 4;

back_screws = [for (x = [left_wall / 2, pocket_x1 + divider_ledge / 2])
               for (y = [15, case_w - 15]) [x, y]];
lid_screws = [for (x = [bay_x0 + boss_d / 2 - 0.5, bay_x1 - boss_d / 2 + 0.5])
              for (y = [wall + boss_d / 2 - 0.5, case_w - wall - boss_d / 2 + 0.5]) [x, y]];

sma_x = bay_x1 - sma_from_end;
sma_z = (front_thickness + bay_back_z) / 2;

button_apex_z = front_thickness + button_depth_fraction * pocket_t;

assert(button_apex_z - front_thickness < divider_ledge + divider_wall - 1.5,
       "the button trough's 45° side would break into the bay");
assert(abs(power_button_y - usb_y) > (button_trough + usb_window) / 2 + 2,
       "the button trough and the USB window overlap");
assert(case_l <= 218, str("case is ", case_l, " mm long: too long for a 220 mm bed"));
assert(plate_thickness < pad_h, "the counterbore needs a pad under it");

module rounded_rect(l, w, r) {
  translate([r, r]) offset(r) square([l - 2 * r, w - 2 * r]);
}

module outline() { rounded_rect(case_l, case_w, corner_radius); }

// Outline cut at x0..x1, keeping the outside corners that fall inside it
module outline_span(x0, x1) {
  intersection() {
    outline();
    translate([x0, -1]) square([x1 - x0, case_w + 2]);
  }
}

// The outline from x0 to x1 and z = 0 to z1, chamfered 45° round the front face
module body(x0, x1, z1) {
  intersection() {
    hull() {
      linear_extrude(eps) offset(delta = -front_chamfer) outline();
      translate([0, 0, front_chamfer]) linear_extrude(z1 - front_chamfer) outline();
    }
    translate([x0, -1, -1]) cube([x1 - x0, case_w + 2, z1 + 2]);
  }
}

// Print frame: front face on the bed, z up = into the device
module shell() {
  difference() {
    union() {
      body(0, bay_wall_x, kobo_back_z);
      body(bay_wall_x, case_l, bay_back_z);
    }
    // Kobo pocket
    translate([pocket_x0, pocket_y0, front_thickness])
      linear_extrude(pocket_t + 1) rounded_rect(pocket_l, pocket_w, pocket_r);
    // Front window
    translate([pocket_x0 + tolerance + screen_left - window_margin,
               pocket_y0 + tolerance + screen_bottom - window_margin, -1])
      cube([screen_width + 2 * window_margin, screen_height + 2 * window_margin,
            front_thickness + 2]);
    bay_cavity();
    usb_window_cut();
    button_trough_cut();
    sma_hole_cut();
    for (p = back_screws) translate([p[0], p[1], kobo_back_z - 9])
      cylinder(d = pilot_d, h = 10);
    for (p = lid_screws) translate([p[0], p[1], bay_back_z - 10])
      cylinder(d = pilot_d, h = 11);
  }
}

module bay_cavity() {
  difference() {
    translate([bay_x0, wall, front_thickness])
      cube([bay_width, case_w - 2 * wall, bay_back_z]);
    for (p = lid_screws) translate([p[0], p[1], 0]) {
      cylinder(d = boss_d, h = bay_back_z + 1);
      // fill the corner behind the boss
      translate([p[0] < (bay_x0 + bay_x1) / 2 ? -boss_d : 0, p[1] < case_w / 2 ? -boss_d : 0, 0])
        cube([boss_d, boss_d, bay_back_z + 1]);
    }
  }
}

// Micro USB window through the divider, roof peaked at 45° for the print
module usb_window_cut() {
  w = usb_window;
  translate([pocket_x1 - 1, usb_y, 0]) rotate([90, 0, 90])
    linear_extrude(divider_ledge + divider_wall + 2)
      hull() {
        translate([-w / 2, front_thickness]) square([w, pocket_t]);
        translate([0, kobo_back_z + w / 2]) square(eps, center = true);
      }
}

// The power button: cut the lip back 3 mm over the Kobo's edge, and slope
// the divider away at 45° from the button down to the front face
module button_trough_cut() {
  a = button_apex_z;
  translate([0, power_button_y + button_trough / 2, 0]) rotate([90, 0, 0])
    linear_extrude(button_trough)
      polygon([[pocket_x1 - 3, -1], [pocket_x1 - 3, front_thickness + eps],
               [pocket_x1, front_thickness + eps], [pocket_x1, a],
               [pocket_x1 + a + 1, -1]]);
}

// Hole along Y through the top wall, a teardrop peaked toward the back
// (up as the shell prints)
module sma_hole_cut() {
  translate([sma_x, case_w - wall - 1, sma_z]) rotate([-90, 0, 0])
    linear_extrude(wall + 2) teardrop_2d(sma_hole / 2);
}

// 2D in the XY of the rotated frame above: rotate([-90,0,0]) sends +Y to -Z,
// so the peak points along -Y here to end up along +Z
module teardrop_2d(r) {
  hull() {
    circle(r);
    translate([0, -r * sqrt(2)]) square(eps, center = true);
  }
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
      linear_extrude(plate_thickness) outline_span(0, bay_wall_x);
      linear_extrude(pad_h) intersection() {
        outline_span(0, bay_wall_x);
        for (p = back_screws) translate(p) circle(d = pad_d);
      }
    }
    counterbored_holes(back_screws, pad_h);
  }
}

module bay_lid() {
  difference() {
    union() {
      linear_extrude(lid_thickness) outline_span(bay_wall_x, case_l);
      linear_extrude(pad_h) intersection() {
        outline_span(bay_wall_x, case_l);
        for (p = lid_screws) translate(p) circle(d = pad_d);
      }
    }
    counterbored_holes(lid_screws, pad_h);
  }
}

// Assembly: print frame mirrored in Z, so the front face is at z = 0, facing +Z
module shell_assembled() { mirror([0, 0, 1]) shell(); }
module back_plate_assembled() { translate([0, 0, -kobo_back_z]) mirror([0, 0, 1]) back_plate(); }
module bay_lid_assembled() { translate([0, 0, -bay_back_z]) mirror([0, 0, 1]) bay_lid(); }

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
  translate([sma_x, case_w - wall - 6, -sma_z]) rotate([-90, 0, 0]) {
    cylinder(d = 6.35, h = 6 + wall + 8);
    translate([0, 0, 6 + wall]) cylinder(d = 9.2, h = 6, $fn = 6);
    translate([0, 0, 6 + wall + 7]) cylinder(d = 10, h = 40);
  }
}

// The back plate and the bay lid in print orientation, side by side on one bed
module covers_layout() {
  back_plate();
  translate([case_w, case_w + 5, 0]) rotate([0, 0, 90])
    translate([-bay_wall_x, 0, 0]) bay_lid();
}
