// E-ink dual-LoRa handheld: the Meshnology N37's shape (rounded body, a
// wing at the top left, an antenna bump at the top right), 3 mm taller so a
// 2.13" e-paper HAT stands portrait down the left of the front.
// Behind the display, two sealed box switches press through waterproof TPU
// buttons in the left side. In the right column a XIAO Sense faces the front
// (its mic through a port) above a front-facing speaker in the bottom right
// corner; the speaker's I2C amp lies on the back wall behind it. One SX1262
// sits behind the XIAO, the other in the wing. Between the XIAO and the
// speaker, where the N37 has its joystick, an optical mouse sensor looks out
// through a sealed window to read swipes.
// Laid out with X right as seen from the front, Y up, and Z depth (0 the
// front face, case_t the back face). With Z running away from a viewer in
// front, that frame is a mirror image, so the `*_part` modules and the
// previews mirror X once to bring the parts out the right way round. The
// front cover prints face down; the tub (sides and back) back face down.

// BEGIN_PARAMS
// Body seen from the front: the N37's 66 x 78, 3 mm taller so the 65 mm HAT
// and its ribbon fold fit between the top and bottom walls
case_w = 66;
case_h = 81;
// Front to back: the N37's 24.3 plus 2, so the switch boxes fit behind the
// display
case_t = 26.3;
// Body corners seen from the front (the N37's, measured on the L1 holster)
corner_r = 11;
// 45° chamfer round the front and back faces
edge_chamfer = 2;
// Side walls, front wall (the display looks through it) and back wall
wall = 1.8;
front_wall = 1.6;
back_wall = 1.8;
// The front cover's seam: this far back from the front face
cover_depth = 3.6;
// Wing at the top left: width, height above the body, top corner radius
wing_w = 25;
wing_h = 32;
wing_r = 5;
// Antenna bump at the top right: width at its base and at its top, height,
// and where its middle sits
bump_w = 27;
bump_top_w = 13;
bump_h = 7;
bump_x = 18;
// Radius of the inside corners where the wing and bump meet the body
fillet_r = 3;
// 2.13" e-paper HAT (Waveshare clone), standing portrait: board outline,
// panel and board thickness, tallest part on its back, and how far its
// ribbon folds out past the board's top end
disp_l = 65;
disp_w = 30.2;
disp_panel = 1.05;
disp_pcb = 1.6;
disp_parts = 2.2;
disp_fpc = 1.2;
// The panel's active area, assumed centred on the board, and the window's
// margin round it
disp_view_l = 48.55;
disp_view_w = 23.71;
disp_view_margin = 0.5;
// Midframe: the plate behind the display and the XIAO
midframe_t = 2;
// XIAO Sense and the two SX1262 boards (XIAO-size, assumed): outline, the
// XIAO's PCB and its USB-C's height above it
board_l = 21;
board_w = 17.8;
xiao_pcb = 1.2;
xiao_usb_h = 3.2;
radio_h = 4;
// The XIAO Sense's microphone: from the board's middle along it (away from
// the USB-C is -), its height on the board, and the port through the front
mic_offset = -6;
xiao_mic_h = 1;
mic_port = 1.5;
// Optical mouse sensor for swipes (a placeholder until it's bought, sized for
// a standard mouse lens): lens footprint, PCB outline and thickness, and the
// distance from the tracking surface to the PCB's underside and to the
// lens's reference plane (its underside). The finger
// slides on a clear disc sealed into a pocket behind the window: window
// diameter, disc diameter and thickness
sns_lens = [21.3, 19.3];
sns_pcb = [22, 20];
sns_pcb_t = 1.6;
sns_surface_to_pcb = 7.4;
sns_surface_to_lens = 2.4;
sns_window = 8;
sns_disc_d = 12;
sns_disc_t = 1;
// Speaker box: across, up, front to back; and its grille's diameter, hole
// size and pitch
spk_w = 28;
spk_h = 31;
spk_t = 15.2;
grille_d = 22;
grille_hole = 1.6;
grille_pitch = 2.8;
// I2C amp board, on the back wall behind the speaker: outline and height
// with its parts
amp_w = 22.5;
amp_l = 38.6;
amp_h = 4.2;
// LiPo behind the display, under the switches (a 103030 pack)
batt_w = 30;
batt_l = 30;
batt_t = 10;
// SMA bulkheads: hole, the jack's hex across corners, and their axis depth
sma_hole = 6.6;
sma_hex = 8.3;
sma_z = 16;
// M3 cap screws from the back into the front cover: length under the head,
// pilot, clearance, counterbore, boss radius, how far each corner screw sits
// from its corner arc's centre, and the skin left in front of the tips
screw_len = 20;
pilot_d = 2.5;
clear_d = 3.4;
cbore_d = 6;
boss_r = 4;
screw_corner_d = 5;
screw_skin = 1;
// Sealed box switches in the left side, behind the display: their heights,
// the box across (Y) and through the case (Z), its length into the case,
// how far its plunger stands out of its face, and its throw
btn_y = [31, 12.4];
sw_y = 12.8;
sw_z = 12.5;
sw_l = 15.3;
sw_plunger_out = 2;
sw_throw = 4;
// Cradle round each switch: wall, and how hard its ring squeezes the boot's
// flange against the case wall
cradle_wall = 1.2;
flange_squeeze = 0.3;
// TPU boot: flange diameter and thickness, sleeve outside diameter and wall,
// roof thickness; PETG plunger inside it: stem and head diameter
boot_flange_d = 14;
boot_flange_t = 1.2;
boot_od = 9;
boot_wall = 0.8;
boot_roof = 1;
stem_d = 5;
stem_head_d = 6.6;
// USB-C opening in the right side
usb_w = 10;
usb_h = 5;
// Grip grooves up the left side below the buttons: first and last height,
// pitch, groove height and depth
grip_y0 = -26;
grip_y1 = -2;
grip_pitch = 4;
grip_groove = 1.6;
grip_depth = 0.6;
// Decorative grooves on the front, round the window and the right-hand panel
face_groove = 0.8;
face_groove_depth = 0.5;
// END_PARAMS

eps = 0.01;
top = case_h / 2;
inner_x = case_w / 2 - wall;
inner_y = top - wall;
inner_back_z = case_t - back_wall;
split_z = cover_depth;
disp_back_z = front_wall + disp_panel + disp_pcb;
mid_z0 = disp_back_z + disp_parts + 0.2;
mid_z1 = mid_z0 + midframe_t;

wing_x0 = -case_w / 2;
wing_cx = wing_x0 + wing_w / 2;
wing_top = top + wing_h;

// The HAT stands portrait at the top left: disp_w across, disp_l up, its
// ribbon folding round the top end into the wing.
disp_x0 = -inner_x + 0.2;
disp_y0 = inner_y - disp_fpc - 0.2 - disp_l;
disp_cx = disp_x0 + disp_w / 2;
disp_cy = disp_y0 + disp_l / 2;
disp_x1 = disp_x0 + disp_w;
view = [disp_view_w + 2 * disp_view_margin, disp_view_l + 2 * disp_view_margin];

// Inside corner arcs (centres, radius)
corner_c = [case_w / 2 - corner_r, top - corner_r];
inner_corner_r = corner_r - wall;

// Screws, free-standing bosses (no top right one: the XIAO fills that corner) on the front cover, clear of the walls:
// [position, direction the tub's boss leans into the wall].
corner_screw = corner_c + [1, 1] * screw_corner_d / sqrt(2);
screws = [
  [[wing_cx + 5.5, wing_top - wall - boss_r - 0.5], [1, 1]],
  [[3.5, inner_y - boss_r - 0.3], [0, 1]],
  [[inner_x - boss_r - 0.3, 2], [1, 0]],
  [[-corner_screw.x, -corner_screw.y], [-1, -1]],
  [[-6, -inner_y + boss_r + 0.3], [0, -1]],
];
screw_tip_z = screw_skin;
screw_head_z = screw_tip_z + screw_len;

// Speaker in the bottom right corner, its outer corner on the inside arc.
spk_x1 = corner_c.x + inner_corner_r / sqrt(2) - 0.1;
spk_y0 = -corner_c.y - inner_corner_r / sqrt(2) + 0.1;
spk_c = [spk_x1 - spk_w / 2, spk_y0 + spk_h / 2];
// Amp on the back wall behind it
amp_c = [spk_x1 - 6.5 - amp_w / 2, spk_y0 + amp_l / 2];
// Mouse sensor above the speaker; the finger's surface is the disc's front.
sns_c = [11.5, spk_y0 + spk_h + 0.5 + sns_pcb.y / 2];
sns_surface_z = front_wall - sns_disc_t;
sns_pcb_z0 = sns_surface_z + sns_surface_to_pcb;
sns_lens_z0 = sns_surface_z + sns_surface_to_lens;
// XIAO Sense above the sensor on the midframe's front, facing forward,
// USB-C to the right; radio 1 behind the midframe behind it; radio 2
// standing in the wing.
xiao_c = [inner_x - 1.2 - board_l / 2, sns_c.y + sns_pcb.y / 2 + 0.3 + board_w / 2];
xiao_pcb_z0 = mid_z0 - xiao_pcb;
usb_z = xiao_pcb_z0 - xiao_usb_h / 2;
mic = [xiao_c.x + mic_offset, xiao_c.y];
radio1_c = [inner_x - 2.2 - board_l / 2, xiao_c.y];
radio2_c = [wing_cx, top + 10.6];
batt_c = [disp_x0 + batt_w / 2, (btn_y[1] - 9.3 - 0.5) - batt_l / 2];
sma1 = [bump_x, top + bump_h];
sma2 = [wing_cx - 3.5, wing_top];

// Switches, from the left wall in: the boot's flange against the wall, the
// cradle's ring squeezing it, the box behind the ring with its plunger
// through it, the pocket's back wall behind the box. Modelled against the
// +x wall and mirrored onto the left.
btn_z = mid_z1 + cradle_wall + sw_z / 2;
ring_front_x = inner_x - boot_flange_t + flange_squeeze;
sw_face_x = ring_front_x - sw_plunger_out;
sw_back_x = sw_face_x - sw_l;
cradle = [ring_front_x - sw_back_x, sw_y + 2 * cradle_wall, sw_z + 2 * cradle_wall];
pocket_back_x = sw_back_x - 2;
btn_hole = boot_od + 0.6;

assert(disp_y0 > -corner_screw.y + boss_r + 0.3, "the display runs into the bottom left screw");
assert(disp_x1 + 0.2 < 3.5 - boss_r, "the display runs into the top middle screw");
assert(spk_x1 - spk_w > disp_x1 + 0.5, "the speaker runs into the display");
assert(spk_y0 + spk_h < 2 - boss_r - 0.5, "the speaker runs into the right screw");
assert(norm([xiao_c.x + board_l / 2, xiao_c.y + board_w / 2] - corner_c) < inner_corner_r - 0.1, "the XIAO's corner runs into the top right corner");
assert(xiao_c.y - board_w / 2 > sns_c.y + sns_pcb.y / 2, "the XIAO runs into the mouse sensor");
assert(sns_c.x + max(sns_pcb.x, sns_lens.x) / 2 < inner_x - 2 * boss_r - 0.6, "the mouse sensor runs into the right screw");
assert(sns_c.x - max(sns_pcb.x, sns_lens.x) / 2 > disp_x1 + 0.5, "the mouse sensor runs into the display");
assert(sns_c.y - max(sns_pcb.y, sns_lens.y) / 2 > spk_y0 + spk_h, "the mouse sensor runs into the speaker");
assert(sns_pcb_z0 > mid_z0 - 0.01 - midframe_t, "the mouse sensor's PCB is in front of the XIAO's layer");
assert(sns_pcb_z0 + sns_pcb_t + 4 < inner_back_z, "the mouse sensor doesn't fit under the back");
assert(xiao_c.x - board_l / 2 > disp_x1 + 1, "the XIAO runs into the display");
assert(xiao_pcb_z0 - xiao_usb_h > front_wall, "the XIAO doesn't fit in front of the midframe");
assert(radio2_c.y + board_l / 2 < screws[0][0].y - boss_r, "radio 2 runs into the wing screw");
assert(radio2_c.y - board_l / 2 > top - 0.5, "radio 2 hangs down onto the display");
assert(mid_z1 + radio_h < inner_back_z, "radio 1 doesn't fit behind the midframe");
assert(front_wall + spk_t + 0.3 < inner_back_z - amp_h, "the speaker runs into the amp");
assert(amp_c.x - amp_w / 2 > -6 + boss_r, "the amp runs into the bottom middle screw");
assert(mid_z1 + cradle.z < inner_back_z - 0.3, "the switch cradles don't fit behind the midframe");
assert(btn_z - boot_flange_d / 2 > split_z + 2, "the boot's flange runs onto the front cover's seam");
assert(btn_z + boot_flange_d / 2 < inner_back_z, "the boot's flange runs into the back wall");
assert(cradle.z >= boot_flange_d && cradle.y >= boot_flange_d - 1, "the cradle's ring doesn't cover the boot's flange");
assert(btn_y[0] - btn_y[1] >= cradle.y + 3.4, "the switch pockets overlap");
assert(stem_head_d < boot_od - 2 * boot_wall, "the plunger's head rubs the boot's sleeve");
assert(-pocket_back_x < -1, "the switch pockets reach across the middle");
assert(batt_c.y - batt_l / 2 > -corner_screw.y + boss_r + 0.3, "the battery runs into the bottom left screw");
assert(mid_z1 + batt_t + 0.3 < inner_back_z, "the battery doesn't fit behind the midframe");
assert(sma_z - sma_hex / 2 > mid_z1 + 0.3, "the SMA jacks run into the midframe");
assert(screw_head_z < case_t - 3, "the screw heads stand proud of the back");

module rrect(w, h, r, c = [0, 0]) {
  translate(c) offset(r = r) square([w - 2 * r, h - 2 * r], center = true);
}

module outline() {
  offset(r = -fillet_r) offset(r = fillet_r) union() {
    rrect(case_w, case_h, corner_r);
    hull() {
      translate([wing_x0, top - 20]) square([wing_w, 1]);
      for (x = [wing_x0 + wing_r, wing_x0 + wing_w - wing_r])
        translate([x, wing_top - wing_r]) circle(r = wing_r);
    }
    offset(r = 2) offset(delta = -2) polygon([
      [bump_x - bump_w / 2, top - 4], [bump_x + bump_w / 2, top - 4],
      [bump_x + bump_top_w / 2, top + bump_h], [bump_x - bump_top_w / 2, top + bump_h]
    ]);
  }
}

module cavity_outline() { offset(delta = -wall) outline(); }

module bicone(c) {
  cylinder(h = c, r1 = c, r2 = 0, $fn = 16);
  mirror([0, 0, 1]) cylinder(h = c, r1 = c, r2 = 0, $fn = 16);
}

module solid_body() {
  minkowski() {
    translate([0, 0, edge_chamfer])
      linear_extrude(case_t - 2 * edge_chamfer) offset(delta = -edge_chamfer) outline();
    bicone(edge_chamfer);
  }
}

module cavity() {
  translate([0, 0, front_wall]) linear_extrude(inner_back_z - front_wall) cavity_outline();
}

// A hole through a side or top wall, its axis level, peaked at 45° toward the
// front so it prints in the tub (back face down). The peak stops at `clip`.
module side_hole_2d(d, clip) {
  intersection() {
    hull() {
      circle(d = d);
      translate([-d / 2 / sqrt(2), -d / 2 / sqrt(2)]) rotate(45) square(d / 2);
    }
    circle(r = clip);
  }
}

// The window opens out at 45° toward the front face.
module window() {
  translate([disp_cx, disp_cy, 0]) hull() {
    translate([0, 0, front_wall - eps]) linear_extrude(2 * eps) square(view, center = true);
    translate([0, 0, -eps]) linear_extrude(2 * eps) offset(delta = front_wall) square(view, center = true);
  }
}

plaque_x0 = disp_cx + view.x / 2 + 3 + face_groove + 3;
plaque = [case_w / 2 - 5 - plaque_x0, case_h - 14];
plaque_c = [plaque_x0 + plaque.x / 2, 0];

module face_grooves() {
  translate([0, 0, -eps]) linear_extrude(face_groove_depth + eps) {
    translate([disp_cx, disp_cy]) difference() {
      offset(r = 3 + face_groove) square(view, center = true);
      offset(r = 3) square(view, center = true);
    }
    difference() {
      rrect(plaque.x, plaque.y, 5, plaque_c);
      rrect(plaque.x - 2 * face_groove, plaque.y - 2 * face_groove, 5 - face_groove, plaque_c);
    }
  }
}

module grille() {
  n = ceil(grille_d / grille_pitch);
  translate([spk_c.x, spk_c.y, -1]) linear_extrude(front_wall + 2)
    for (i = [-n : n], j = [-n : n]) let (p = [i * grille_pitch + (j % 2) * grille_pitch / 2, j * grille_pitch * sqrt(3) / 2])
      if (norm(p) <= (grille_d - grille_hole) / 2) translate(p) circle(d = grille_hole, $fn = 12);
}

// Window over the mouse sensor's lens, with a pocket behind it the clear disc
// is sealed into.
module sensor_window() {
  translate([sns_c.x, sns_c.y, -1]) cylinder(d = sns_window, h = front_wall + 2, $fn = 40);
  translate([sns_c.x, sns_c.y, sns_surface_z]) cylinder(d = sns_disc_d + 0.3, h = sns_disc_t + 1, $fn = 48);
}

module mic_hole() {
  translate([mic.x, mic.y, -1]) cylinder(d = mic_port, h = front_wall + 2, $fn = 16);
}

module grip_grooves() {
  for (y = [grip_y0 : grip_pitch : grip_y1])
    translate([-(case_w / 2 - grip_depth / 2), y, case_t / 2])
      cube([grip_depth + 2 * eps, grip_groove, case_t - 8], center = true);
}

module usb_opening() {
  translate([inner_x - 1, xiao_c.y, usb_z]) rotate([0, 90, 0])
    linear_extrude(wall + 2) offset(r = 1) square([usb_h - 2, usb_w - 2], center = true);
}

module button_holes() {
  for (y = btn_y) translate([-inner_x + 1, y, btn_z]) rotate([0, -90, 0]) rotate(180)
    linear_extrude(wall + 2) side_hole_2d(btn_hole, btn_hole / 2 + 0.4);
}

module sma_holes() {
  for (p = [sma1, sma2]) translate([p.x, p.y + 1, sma_z]) rotate([90, 0, 0]) rotate(-90)
    linear_extrude(wall + 2) side_hole_2d(sma_hole, sma_hole / 2 + 0.6);
}

module case_shell() {
  difference() {
    solid_body();
    cavity();
    window();
    face_grooves();
    grille();
    mic_hole();
    sensor_window();
    grip_grooves();
    usb_opening();
    button_holes();
    sma_holes();
  }
}

module boss_2d(s) {
  intersection() {
    hull() {
      translate(s[0]) circle(r = boss_r);
      translate(s[0] + s[1] * 8) circle(r = boss_r);
    }
    offset(delta = -wall / 2) outline();
  }
}

// The cover's tongue is the inner half of its wall carried back into the
// tub's matching rebate.
tongue_h = 1.5;
module wall_band(a, b) { difference() { offset(delta = -a) outline(); offset(delta = -b) outline(); } }

// Half-round bead round each button hole on the wall's inside, pressed into
// the boot's flange.
module seal_beads() {
  for (y = btn_y) translate([-inner_x - eps, y, btn_z]) rotate([0, 90, 0])
    rotate_extrude($fn = 48) translate([(btn_hole / 2 + 0.4 + boot_flange_d / 2) / 2, 0]) circle(r = 0.4, $fn = 12);
}

// Pocket each cradle drops into from the front, on the left: ribs either
// side and a back wall that holds the switch toward the side wall, slotted
// for its leads. Rises from the back wall to the midframe.
module switch_pockets() {
  h = inner_back_z - mid_z1;
  for (y = btn_y) mirror([1, 0, 0]) translate([0, y, mid_z1]) difference() {
    union() {
      for (s = [-1, 1]) translate([pocket_back_x, s * (cradle.y / 2 + 0.2) + (s > 0 ? 0 : -1.5), 0])
        cube([inner_x - pocket_back_x + eps, 1.5, h + eps]);
      translate([pocket_back_x, -cradle.y / 2 - 1.7, 0]) cube([2, cradle.y + 3.4, h + eps]);
    }
    // open to the front so it has no roof as the tub prints
    translate([pocket_back_x - 1, -4, -1]) cube([4, 8, cradle_wall + sw_z]);
  }
}

// Front cover: fence along the HAT's right edge, a fence round the speaker,
// the mic's duct down to the XIAO.
module cover_fittings() {
  translate([0, 0, front_wall - eps]) {
    linear_extrude(disp_back_z - front_wall + eps)
      translate([disp_x1 + 0.2, disp_y0 + 6]) square([1, disp_l - 12]);
    // (none along its top, where the mouse sensor's lens sits)
    linear_extrude(2 + eps) translate(spk_c) {
      for (s = [-1, 1]) translate([s * (spk_w / 2 + 0.7), 0]) square([1, spk_h * 0.6], center = true);
      translate([0, -(spk_h / 2 + 0.7)]) square([spk_w * 0.6, 1], center = true);
    }
    translate(mic) cylinder(d = mic_port + 2.4, h = xiao_pcb_z0 - xiao_mic_h - 0.3 - front_wall + eps, $fn = 24);
    // Pads under the lens's corners setting its reference plane at the focal
    // distance from the disc's face; the sensor's PCB clips onto the lens
    for (sx = [-1, 1], sy = [-1, 1])
      translate([sns_c.x + sx * (sns_lens.x / 2 - 1.5), sns_c.y + sy * (sns_lens.y / 2 - 1.5), 0])
        cube([3, 3, 2 * (sns_lens_z0 - front_wall + eps)], center = true);
  }
}

module front_cover() {
  difference() {
    union() {
      intersection() {
        case_shell();
        translate([-100, -100, -1]) cube([200, 200, split_z + 1]);
      }
      translate([0, 0, split_z - eps]) linear_extrude(tongue_h + eps) wall_band(wall / 2 + 0.15, wall);
      for (s = screws) translate([s[0].x, s[0].y, front_wall - eps]) cylinder(r = boss_r, h = mid_z0 - front_wall + eps);
      cover_fittings();
    }
    for (s = screws) translate([s[0].x, s[0].y, screw_tip_z]) cylinder(d = pilot_d, h = case_t);
    window();
    grille();
    mic_hole();
    sensor_window();
    usb_opening();
  }
}

// Tub: the sides and back. Bosses from the back wall forward to the
// midframe, clamping it onto the cover's; posts holding the speaker and the
// battery forward; fences round the amp.
module tub_fittings() {
  translate([0, 0, mid_z1]) linear_extrude(inner_back_z - mid_z1 + eps) for (s = screws) boss_2d(s);
  for (p = [[spk_x1 - 3, spk_y0 + 4], [spk_x1 - 3, spk_y0 + spk_h - 4]])
    translate([p.x - 1.5, p.y - 1.5, front_wall + spk_t + 0.1]) cube([3, 3, inner_back_z - front_wall - spk_t - 0.1 + eps]);
  translate([batt_c.x, batt_c.y, mid_z1 + batt_t + 0.3]) linear_extrude(inner_back_z - mid_z1 - batt_t - 0.3 + eps)
    for (sx = [-1, 1], sy = [-1, 1]) translate([sx * batt_w / 4 - 1.5, sy * batt_l / 4 - 1.5]) square(3);
  translate([amp_c.x, amp_c.y, inner_back_z - 2]) linear_extrude(2 + eps) for (s = [-1, 1]) {
    translate([s * (amp_w / 2 + 0.7), 0]) square([1, amp_l * 0.5], center = true);
    translate([0, s * (amp_l / 2 + 0.7)]) square([amp_w * 0.5, 1], center = true);
  }
}

module tub() {
  difference() {
    union() {
      intersection() {
        case_shell();
        translate([-100, -100, split_z]) cube([200, 200, case_t]);
      }
      tub_fittings();
      switch_pockets();
      seal_beads();
    }
    translate([0, 0, split_z - 1]) linear_extrude(tongue_h + 1.1) wall_band(wall / 2, wall + 1);
    for (s = screws) translate([s[0].x, s[0].y, 0]) {
      translate([0, 0, mid_z1 - 1]) cylinder(d = clear_d, h = case_t);
      translate([0, 0, screw_head_z]) cylinder(d = cbore_d, h = case_t);
    }
    button_holes();
    usb_opening();
    sma_holes();
  }
}

// Tub flipped to print back face down.
module tub_print() { translate([0, 0, case_t]) mirror([0, 0, 1]) tub(); }

// Midframe: behind the display and the XIAO, in front of the switches,
// battery and radio 1; clear of the speaker. Everything it carries is on its
// front, so it prints back face down.
// `sides` picks the edges fenced: [left, right, bottom, top].
module board_fence(c, size, sides = [1, 1, 1, 1]) {
  translate([c.x, c.y, mid_z0 - 2]) linear_extrude(2 + eps) for (s = [-1, 1]) {
    if (sides[(s + 1) / 2]) translate([s * (size.x / 2 + 0.7), 0]) square([1, size.y * 0.6], center = true);
    if (sides[2 + (s + 1) / 2]) translate([0, s * (size.y / 2 + 0.7)]) square([size.x * 0.6, 1], center = true);
  }
}

module zip_slots(c, size) {
  for (s = [-1, 1]) translate([c.x + s * (size.x / 2 + 2.5), c.y]) square([1.6, 4], center = true);
}

module midframe() {
  difference() {
    union() {
      translate([0, 0, mid_z0]) linear_extrude(midframe_t) difference() {
        offset(delta = -(wall + 0.3)) outline();
        translate([spk_c.x - spk_w / 2 - 0.5, -case_h]) square([case_w, spk_y0 + spk_h + 0.5 + case_h]);
        translate(sns_c) square(sns_pcb + [1, 1], center = true);
      }
      // Ribs pressing the HAT's board against the front wall, along its long
      // edges, clear of the parts on its back
      translate([0, 0, disp_back_z]) linear_extrude(mid_z0 - disp_back_z + eps)
        for (x = [disp_x0 + 0.2, disp_x1 - 1.4])
          translate([x, disp_y0 + 1.5]) square([1.2, disp_l - 3]);
      // The XIAO's USB-C end and the sensor's lens leave it fenced left and
      // top; radio 2's top runs under the wing screw
      board_fence(xiao_c, [board_l, board_w], [1, 0, 0, 1]);
      board_fence(radio2_c, [board_w, board_l], [1, 1, 1, 0]);
    }
    translate([0, 0, mid_z0 - 3]) linear_extrude(midframe_t + 6) {
      for (s = screws) translate(s[0]) circle(d = clear_d);
      // Battery, radio 1 and the amp's wires to the XIAO's back; the switch
      // leads; radio 2's pigtail
      translate([xiao_c.x - 4, xiao_c.y]) square([8, 5], center = true);
      translate([disp_x1 - 6, (btn_y[0] + btn_y[1]) / 2]) square([4, 8], center = true);
      translate([sma2.x + 6, radio2_c.y - board_l / 2 - 0.2]) square([6, 3], center = true);
      zip_slots(radio1_c, [board_l, board_w]);
      zip_slots(radio2_c, [board_w, board_l]);
    }
  }
}

module midframe_print() { translate([0, 0, mid_z1]) mirror([0, 0, 1]) midframe(); }

// Cradle round a switch box: a sleeve open at the back for its leads, its
// front a ring the plunger passes through. Pushed into its pocket from the
// front, the ring's lead-in rides over the boot's flange and squeezes it.
// Modelled on the +x side at button y = 0; `cradle_in_place` mirrors it left.
module cradle() {
  difference() {
    translate([sw_back_x, -cradle.y / 2, mid_z1]) cube(cradle);
    translate([sw_back_x - 1, -sw_y / 2, mid_z1 + cradle_wall]) cube([sw_l + 1, sw_y, sw_z]);
    translate([sw_face_x - 1, 0, btn_z]) rotate([0, 90, 0]) cylinder(d = stem_d + 1.5, h = sw_plunger_out + 2);
    translate([ring_front_x, 0, mid_z1 + cradle.z]) rotate([0, 45, 0]) cube([1.2, 2 * cradle.y, 1.2], center = true);
  }
}

module cradle_in_place(y) { translate([0, y, 0]) mirror([1, 0, 0]) cradle(); }

// Printed ring face down.
module cradle_print() {
  translate([0, 0, cradle.x]) rotate([0, 90, 0]) translate([-ring_front_x, 0, -btn_z]) cradle();
}

// Waterproof button, two materials, printed flange down: a TPU boot (flange,
// sleeve, roof) and a PETG plunger standing free inside it, fused into the
// roof. Pressed, the sleeve buckles and the plunger drives the switch.
boot_sleeve_h = wall + sw_throw;
module boot_tpu() {
  difference() {
    union() {
      cylinder(d = boot_flange_d, h = boot_flange_t);
      cylinder(d = boot_od, h = boot_flange_t + boot_sleeve_h + boot_roof - 0.5);
      translate([0, 0, boot_flange_t + boot_sleeve_h + boot_roof - 0.5])
        cylinder(d1 = boot_od, d2 = boot_od - 1, h = 0.5);
    }
    translate([0, 0, -eps]) cylinder(d = boot_od - 2 * boot_wall, h = boot_flange_t + boot_sleeve_h + eps);
    boot_stem();
  }
}

module boot_stem() {
  head_z = boot_flange_t + boot_sleeve_h;
  cone = (stem_head_d - stem_d) / 2;
  cylinder(d = stem_d, h = head_z - cone - 0.4);
  translate([0, 0, head_z - cone - 0.4]) cylinder(d1 = stem_d, d2 = stem_head_d, h = cone);
  translate([0, 0, head_z - 0.4]) cylinder(d = stem_head_d, h = 0.4 + boot_roof / 2);
}

// A button in place in the left wall, flange against the wall's inside.
module button_in_place(y, part) {
  translate([-ring_front_x, y, btn_z]) rotate([0, -90, 0])
    if (part == "tpu") boot_tpu(); else boot_stem();
}

// ---- References (not printed) ----

module ref_display_board() {
  translate([disp_x0, disp_y0, front_wall + disp_panel]) cube([disp_w, disp_l, disp_pcb]);
}
module ref_display_panel() {
  translate([disp_cx, disp_cy, front_wall + disp_panel / 2]) cube([29.2, 59.2, disp_panel], center = true);
}
module ref_boards() {
  translate([xiao_c.x - board_l / 2, xiao_c.y - board_w / 2, xiao_pcb_z0]) cube([board_l, board_w, xiao_pcb]);
  translate([xiao_c.x + board_l / 2 - 7.5, xiao_c.y - 4.5, xiao_pcb_z0 - xiao_usb_h]) cube([7.5 + 1, 9, xiao_usb_h]);
  translate([mic.x - 1.5, mic.y - 1.5, xiao_pcb_z0 - xiao_mic_h]) cube([3, 3, xiao_mic_h]);
  translate([radio1_c.x, radio1_c.y, mid_z1 + radio_h / 2]) cube([board_l, board_w, radio_h], center = true);
  translate([radio2_c.x, radio2_c.y, mid_z0 - radio_h / 2]) cube([board_w, board_l, radio_h], center = true);
}
module ref_sensor() {
  translate([sns_c.x, sns_c.y, sns_pcb_z0 + sns_pcb_t / 2]) cube([sns_pcb.x, sns_pcb.y, sns_pcb_t], center = true);
  translate([sns_c.x, sns_c.y, (sns_lens_z0 + sns_pcb_z0) / 2]) cube([sns_lens.x, sns_lens.y, sns_pcb_z0 - sns_lens_z0], center = true);
  translate([sns_c.x, sns_c.y, sns_pcb_z0 + sns_pcb_t]) cube([9, 9, 3], center = true);
}
module ref_disc() {
  translate([sns_c.x, sns_c.y, sns_surface_z]) cylinder(d = sns_disc_d, h = sns_disc_t);
}
module ref_speaker() {
  translate([spk_c.x - spk_w / 2, spk_y0, front_wall]) cube([spk_w, spk_h, spk_t]);
}
module ref_amp() {
  translate([amp_c.x, amp_c.y, inner_back_z - amp_h / 2]) cube([amp_w, amp_l, amp_h], center = true);
}
module ref_battery() {
  translate([batt_c.x, batt_c.y, mid_z1 + batt_t / 2 + 0.2]) cube([batt_w, batt_l, batt_t], center = true);
}
module ref_switches() {
  for (y = btn_y) mirror([1, 0, 0]) translate([sw_back_x, y - sw_y / 2, btn_z - sw_z / 2]) {
    cube([sw_l, sw_y, sw_z]);
    translate([sw_l, sw_y / 2, sw_z / 2]) rotate([0, 90, 0]) cylinder(d = 3.5, h = sw_plunger_out, $fn = 20);
  }
}
module ref_smas() {
  for (p = [sma1, sma2]) translate([p.x, p.y, sma_z]) rotate([-90, 0, 0]) {
    translate([0, 0, -10]) cylinder(d = sma_hex, h = 10 - wall, $fn = 6);
    cylinder(d = 6.3, h = 8, $fn = 24);
  }
}

// ---- Parts, mirrored out of the layout frame ----

module front_cover_part() { mirror([1, 0, 0]) front_cover(); }
module tub_part() { mirror([1, 0, 0]) tub_print(); }
module midframe_part() { mirror([1, 0, 0]) midframe_print(); }
module cradle_part() { cradle_print(); }

// Stands a layout-frame model up for the previews: Y up becomes Z up, the
// front faces -Y, and X is mirrored the right way round (see the header).
module upright() { translate([0, 0, top]) rotate([90, 0, 180]) mirror([1, 0, 0]) children(); }
