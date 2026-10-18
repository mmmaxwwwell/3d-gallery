// Meshology L1 holster: a TPU channel the radio slides down into.
// X is side to side, Y front (-) to back (+), Z up. The holster prints
// standing on its floor, open top up, so every wall is vertical.

// BEGIN_PARAMS
// Radio, front face to back face
radio_thickness = 24.3;
// Radio, side to side
radio_width = 66;
// Radio body height, bottom to top
radio_height = 78;
// Inside angle between the front face and a diagonal face (degrees)
radio_corner_angle = 122.5;
// How far each diagonal face reaches front-to-back (not measured yet).
// The front and back faces are bevelled the same way on all four edges.
radio_chamfer_depth = 6;
// Radius of the body's four corners seen from the front; the front and
// back faces' corners share their centres
radio_corner_radius = 11;
// Gap between radio and holster, per side
tolerance = 0.3;
// Wall, back and floor thickness
wall = 3;
// The rim slopes down from back to front at this angle (degrees). At the
// back wall it's level with the back face's top corner centres, where the
// raised back's curve starts
rim_angle = 43.8;
// How far the front walls reach in from the radio's sides
front_lip = 8;
// Front wall left standing above the floor
front_sill = 8;
// Radius of the front cutout's lower corners, matching the radio's
cutout_corner_radius = 11;
// Locking tabs across the top of the back wall: how many
tabs = 3;
// Tab places left without a tab, counted from -x: something on the radio is
// in the way at the +x one (the user's left). That side's guard runs flat
// across the gap instead.
tabs_left_out = [2];
// and how wide each is
tab_width = 10;
// How far the tab bends forward over the radio's top back bevel
tab_reach = 2;
// The slits either side of the tab: how far down from the back wall's top
slit_length = 20;
// and how wide
slit_width = 1.5;
// Drainage holes through the floor: how many, in a row side to side
drain_holes = 4;
// their diameter
drain_hole_diameter = 5;
// and their spacing
drain_hole_spacing = 12;
// Kanix plate bolt grid on the back: columns across, rows up
kanix_cols = 3;
kanix_rows = 2;
// USB-C plug opening in the -x side (the user's right): its centre above the
// radio's bottom face and back from its front face, and its size, standing
// upright (the side between the bevels is too narrow for it lying down)
usb_z = 38;
usb_y = 7;
usb_width = 8;
usb_height = 14;
// Desk stand: how far the radio leans back from upright (degrees)
stand_angle = 15;
// and how far up the radio the cradle reaches, from its bottom face
stand_depth = 24;
// END_PARAMS

// The diagonal face rises radio_chamfer_depth over this much width.
radio_chamfer_width = radio_chamfer_depth / tan(180 - radio_corner_angle);

assert(radio_chamfer_depth * 2 < radio_thickness, "diagonal faces would meet front to back");
assert(radio_chamfer_width * 2 < radio_width, "diagonal faces would meet side to side");
assert(radio_corner_radius > radio_chamfer_width, "face corners would be sharper than a point");
assert(radio_corner_radius * 2 < radio_width - 2 * radio_chamfer_width, "face corners would meet side to side");
assert(front_lip > radio_chamfer_width, "front lip must reach past the diagonal face onto the front face");
assert(front_lip * 2 < radio_width, "front lips would close the front");

module radio_outline() {
  w = radio_width / 2;
  t = radio_thickness / 2;
  cw = radio_chamfer_width;
  c = radio_chamfer_depth;
  polygon([
    [-w + cw, -t], [w - cw, -t], [w, -t + c], [w, t - c],
    [w - cw, t], [-w + cw, t], [-w, t - c], [-w, -t + c]
  ]);
}

module pocket_outline() {
  offset(delta = tolerance) radio_outline();
}

// [width, depth] of a bevel after its body grows by d on every face.
function grown_bevel(cw, c, d) =
  let (a = atan(c / cw), e = cw * sin(a) + d * (sin(a) + cos(a) - 1))
  [e / sin(a), e / cos(a)];

// The radio grown by d on every face, bottom at z = 0. Seen from the front
// its outline and its front and back faces are rounded rectangles whose
// corners share centres, so the bevel is the same width all round. It's a
// hull of one cylinder per corner: the outline's spanning the full-width
// band, and a thin one at each face. stretch lifts the top corners, to
// open a channel above the radio.
module radio_body(d = 0, stretch = 0) {
  r = radio_corner_radius;
  cw = radio_chamfer_width;
  bev = grown_bevel(cw, radio_chamfer_depth, d);
  t = radio_thickness / 2 + d;
  face_r = r + d + cw - bev[0];
  band = 2 * (t - bev[1]);
  hull() {
    for (sx = [-1, 1], z = [r, radio_height - r + stretch]) {
      translate([sx * (radio_width / 2 - r), -band / 2, z])
        rotate([-90, 0, 0]) cylinder(r = r + d, h = band);
    }
    for (sx = [-1, 1], z = [cw + r, radio_height - cw - r + stretch], y = [-t, t - 0.01]) {
      translate([sx * (radio_width / 2 - cw - r), y, z])
        rotate([-90, 0, 0]) cylinder(r = face_r, h = 0.01);
    }
  }
}

// Grown down by the clearance too, so the floor sits tolerance under
// the radio; the top runs past the rim so the channel stays open.
module pocket() {
  translate([0, 0, wall + tolerance])
    radio_body(tolerance, radio_height);
}

cutout_half = radio_width / 2 - front_lip;
cutout_bottom = wall + front_sill;
cutout_top = wall + 2 * radio_height;
// Mid-plane of the flat front wall, where the cutout's edge runs.
front_wall_mid = -(radio_thickness / 2 + tolerance + wall / 2);
// The cutout's edge and the rim are rounded in a full half-round across the wall.
cutout_edge_radius = wall / 2;

// The rim's top along the wall's mid-line is a plane sloping up front to back.
wall_mid_y = radio_thickness / 2 + tolerance + wall / 2;
radio_bottom_z = wall + tolerance;
rim_back_z = radio_bottom_z + radio_height - radio_chamfer_width - radio_corner_radius;
rim_front_z = rim_back_z - 2 * wall_mid_y * tan(rim_angle);
rim_slope = rim_angle;
// Where the front wall's flat face ends at the corner, on its mid-line. The
// lips' tops keep sloping down from there toward the opening at rim_angle.
front_face_x = radio_width / 2 - radio_chamfer_width + tolerance * tan((180 - radio_corner_angle) / 2);
function lip_rim_z(x) = rim_front_z - (front_face_x - abs(x)) * tan(rim_angle);

assert(cutout_bottom + cutout_corner_radius < lip_rim_z(cutout_half) - cutout_edge_radius, "cutout corner taller than the front lips");
assert((drain_holes - 1) * drain_hole_spacing / 2 + drain_hole_diameter / 2 < radio_width / 2 - radio_corner_radius, "drain holes reach the floor's curved corners");
assert(drain_hole_diameter / 2 < radio_thickness / 2 - radio_chamfer_depth, "drain holes reach the floor's bevel ramps");

// The back wall rises over the radio's back face: level until it meets the
// face's rounded outline, then along that outline to the face's top edge.
back_top_z = radio_bottom_z + radio_height - radio_chamfer_width;
back_corner_x = radio_width / 2 - radio_chamfer_width - radio_corner_radius;
back_corner_z = back_top_z - radio_corner_radius;
// The radio's top bevel rises at this angle off horizontal, front to back.
bevel_angle = atan(radio_chamfer_width / radio_chamfer_depth);
// Where each tab's bend starts on the back wall's inner face: a tolerance
// off the bevel, measured square to it.
tab_bend_z = back_top_z + tolerance * (1 / cos(bevel_angle) - tan(bevel_angle));
// The top of each tab's bend, where it ends a wall thick over the bevel.
tab_top_z = tab_bend_z + tab_reach * tan(bevel_angle) + wall * cos(bevel_angle);
// Neighbouring tabs share a slit, so they sit a tab and a slit apart.
tab_pitch = tab_width + slit_width;
function tab_x(i) = (i - (tabs - 1) / 2) * tab_pitch;
tab_places = [for (i = [0 : tabs - 1]) if (len(search(i, tabs_left_out)) == 0) i];
assert(back_corner_x >= tab_x(tabs - 1) + tab_width / 2 + slit_width, "back wall's flat top too narrow for the tabs and slits");

// The cutout seen from the front, in (x, z), grown by g.
module cutout_profile(g = 0) {
  r = cutout_corner_radius;
  hull() {
    for (x = [-cutout_half + r, cutout_half - r]) translate([x, cutout_bottom + r]) circle(r = r + g);
    translate([-cutout_half - g, cutout_bottom + r]) square([2 * (cutout_half + g), cutout_top - cutout_bottom - r]);
  }
}

// Cut from outside the front wall back to y_end, toward the back.
module cutout_through(g, y_end) {
  y0 = -radio_thickness / 2 - tolerance - wall - 1;
  translate([0, y_end, 0]) rotate([90, 0, 0]) linear_extrude(y_end - y0) cutout_profile(g);
}

// A round rod along the cutout's edge, one edge-radius in from it, in the
// wall's mid-plane: what the edge rounds to.
module cutout_edge_rod() {
  r = cutout_corner_radius;
  e = cutout_edge_radius;
  cz = cutout_bottom + r;
  for (sx = [-1, 1]) {
    // Up to the rim's round, where a ball turns it into the rim's.
    translate([sx * (cutout_half + e), front_wall_mid, cz]) {
      cylinder(r = e, h = lip_rim_z(cutout_half + e) - e - cz);
      translate([0, 0, lip_rim_z(cutout_half + e) - e - cz]) sphere(r = e);
    }
    translate([sx * (cutout_half - r), front_wall_mid, cz])
      rotate([90, 0, 0]) rotate([0, 0, sx < 0 ? 180 : 270])
        rotate_extrude(angle = 90) translate([r + e, 0]) circle(r = e);
  }
  translate([-(cutout_half - r), front_wall_mid, cutout_bottom - e])
    rotate([0, 90, 0]) cylinder(r = e, h = 2 * (cutout_half - r));
}

module front_cutout() {
  cutout_through(0, radio_thickness / 2);
  // The band within an edge-radius of the opening, through the wall,
  // less the rod it rounds to.
  difference() {
    cutout_through(cutout_edge_radius, -radio_thickness / 2 - tolerance + 0.5);
    cutout_edge_rod();
  }
}

// Everything one edge-radius under the rim: the plane sloping up to the
// back, and across the front face the lips sloping down toward the opening.
module under_rim() {
  big = 4 * radio_height;
  e = cutout_edge_radius;
  difference() {
  intersection() {
    translate([0, -wall_mid_y, rim_front_z - e]) rotate([rim_slope, 0, 0])
      translate([-big / 2, -big / 2, -big]) cube(big);
    union() {
      for (sx = [-1, 1])
        intersection() {
          translate([sx * front_face_x, 0, rim_front_z - e]) rotate([0, -sx * rim_angle, 0])
            translate([-big / 2, -big / 2, -big]) cube(big);
          translate([sx > 0 ? 0 : -front_face_x, -big, -big]) cube([front_face_x, big, 2 * big]);
        }
      // The rest of the walls: the sides, the corners and the back.
      difference() {
        translate([-big / 2, -big / 2, -big]) cube(2 * big);
        translate([-front_face_x, -big, -big]) cube([2 * front_face_x, big, 2 * big]);
      }
    }
  }
  usb_notch(e);
  }
}

// The USB-C opening would reach above the rim where it sits, so it's a
// U-notch down from the rim, its round bottom where the opening's bottom
// would be. It's cut from the rim's ball path grown by g, so the rolled
// rim rounds its edges like the rest.
usb_notch_y = -radio_thickness / 2 + usb_y;
usb_notch_bottom = radio_bottom_z + usb_z - usb_height / 2;
assert(usb_notch_bottom - cutout_edge_radius > lip_rim_z(cutout_half) - cutout_edge_radius - 2, "USB notch reaches below the rolled walls");
module usb_notch(g) {
  r = usb_width / 2;
  mirror([1, 0, 0]) rotate([90, 0, 90]) linear_extrude(2 * radio_width)
    hull() {
      translate([usb_notch_y, usb_notch_bottom + r]) circle(r = r + g);
      translate([usb_notch_y - r - g, usb_notch_bottom + r]) square([2 * (r + g), 2 * radio_height]);
    }
}

// The raised back over the back wall only. The ball rolls along an arc an
// edge-radius inside the face's corner, so the rounded top lands on it. From
// the corner where the side slope arrives, a straight ramp runs up into the
// arc, tangent to it, so the rim keeps climbing with no level step. Beside
// the tabs the arc leaves along a tangent and climbs on, to a guard a wall
// wide that stands just above the tabs' tops so they don't snag.
module under_back_rise() {
  e = cutout_edge_radius;
  r = radio_corner_radius - e;
  c = [back_corner_x, back_corner_z];
  function tangent_angle(q, side) =
    atan2(q[1] - c[1], q[0] - c[0]) + side * acos(r / norm(q - c));
  p = [front_face_x, rim_back_z - e];
  // The guard's top is round, radius `wall`, level with the tabs'. Its
  // outer end sits where the outer slit of a full row of tabs would be; on
  // a side whose outer tab is left out it runs flat in to the slit of the
  // nearest tab. The climb runs along the line tangent to both the corner
  // arc and the guard's outer round.
  full_slit_outer = tab_x(tabs - 1) + tab_width / 2 + slit_width;
  function slit_inner(sx) =
    max([for (i = tab_places) sx * tab_x(i) + tab_width / 2 + slit_width]);
  rg = wall - e;
  steps = 16;
  function guard_side(sx) = let (
      go = [full_slit_outer + wall, tab_top_z - wall],
      gi = [slit_inner(sx) + wall, tab_top_z - wall],
      a0 = tangent_angle(p, 1),
      a1 = atan2(go[1] - c[1], go[0] - c[0]) - acos((r - rg) / norm(go - c)),
      arc = [for (i = [0 : steps]) let (a = a0 + (a1 - a0) * i / steps) c + r * [cos(a), sin(a)]],
      cap_o = [for (i = [0 : steps]) let (a = a1 + (90 - a1) * i / steps) go + rg * [cos(a), sin(a)]],
      cap_i = [for (i = [0 : steps]) let (a = 90 + 90 * i / steps) gi + rg * [cos(a), sin(a)]]
    )
    assert(norm(p - c) > r && a1 > a0, "back guard doesn't fit the face's corner arc")
    concat(arc, cap_o, cap_i, [[gi[0] - rg, back_top_z - e]]);
  right = guard_side(1);
  left = guard_side(-1);
  translate([0, 2 * radio_thickness, 0]) rotate([90, 0, 0])
    linear_extrude(2 * radio_thickness)
      polygon(concat(
        [[-p[0], 0], [-p[0], p[1]]],
        [for (pt = left) [-pt[0], pt[1]]],
        [for (i = [len(right) - 1 : -1 : 0]) right[i]],
        [p, [p[0], 0]]
      ));
}

// Kanix plate mount: a pad hulled onto the back with the Kanix bolt grid
// (M5 self-tapping, 19.05 mm pitch, 4.2 mm pilots), drilled blind from the
// clip side. An M5x10 through the clip (5 mm plate, 2.4 mm head
// counterbore) reaches 7.4 mm into the pad; the pilots go a little past
// that, and the pad is sized to leave a skin before the pocket, so no screw
// reaches the radio. The pad's face is the Kanix plate's size; its flanks
// spread into the back wall, at 45° underneath so it prints without
// overhangs, and only a rounding's width at the sides and top, so it fits
// the back's flat and stays below the slits, where the tabs still flex.
kanix_pitch = 19.05;
kanix_pilot = 4.2;
kanix_margin = 7;
kanix_screw_reach = 10 - (5 - 2.4);
kanix_pilot_depth = kanix_screw_reach + 0.6;
kanix_skin = 0.8;
kanix_pad = kanix_pilot_depth + kanix_skin - wall;
kanix_face_w = kanix_pitch * (kanix_cols - 1) + 2 * kanix_margin;
// Kanix plates are as tall as their belt: 38 mm for 2 rows, 52 for 3.
kanix_face_h = kanix_rows == 2 ? 38 : kanix_pitch * (kanix_rows - 1) + 2 * kanix_margin;
kanix_pad_round = 2;
// Below the slits' rounded edges.
kanix_pad_top = back_top_z - slit_length - slit_width / 2 - cutout_edge_radius - 0.5;
kanix_face_top = kanix_pad_top - kanix_pad_round;
kanix_grid_z = kanix_face_top - kanix_face_h / 2;
back_outer_y = radio_thickness / 2 + tolerance + wall;
assert(kanix_grid_z - kanix_pitch * (kanix_rows - 1) / 2 - kanix_pilot > wall, "Kanix grid runs into the floor");
assert(kanix_face_w / 2 + kanix_pad_round < radio_width / 2 - radio_chamfer_width, "Kanix pad wider than the back's flat");

module kanix_pad() {
  r = kanix_pad_round;
  t = kanix_pad;
  y_face = back_outer_y + t - r;
  y_base = back_outer_y - wall / 2;
  fw = kanix_face_w / 2 - r;
  bw = fw + r;
  f_top = kanix_face_top - r;
  f_bot = kanix_face_top - kanix_face_h + r;
  intersection() {
    hull() {
      for (sx = [-1, 1]) {
        for (z = [f_bot, f_top]) translate([sx * fw, y_face, z]) sphere(r = r);
        for (z = [f_bot - t, kanix_pad_top - r]) translate([sx * bw, y_base, z]) sphere(r = r);
      }
    }
    translate([-radio_width, 0, 0]) cube([2 * radio_width, 2 * radio_width, radio_height]);
  }
}

module kanix_pilots() {
  for (i = [0 : kanix_cols - 1], j = [0 : kanix_rows - 1])
    translate([(i - (kanix_cols - 1) / 2) * kanix_pitch,
               back_outer_y + kanix_pad + 1,
               kanix_grid_z + (j - (kanix_rows - 1) / 2) * kanix_pitch])
      rotate([90, 0, 0]) cylinder(d = kanix_pilot, h = kanix_pilot_depth + 1);
}

// The radio's shape grown by tolerance + wall: the holster's outside, a
// wall thick everywhere. Printed standing, its underside would overhang
// under the bottom corners and bevels, so it's hulled to a footprint set
// back just far enough that the skirt there rises at 45°: under the R11
// corners, where a 45° line touches their arc; under the bevels, where it
// touches the round over the bevel's top edge.
module outside() {
  ro = radio_corner_radius + tolerance + wall;
  bevel = grown_bevel(radio_chamfer_width, radio_chamfer_depth, tolerance);
  fx = radio_width / 2 + tolerance + wall - ro * (2 - sqrt(2));
  fy = radio_thickness / 2 + tolerance + wall - (bevel[0] + wall * (2 - sqrt(2)));
  hull() {
    translate([0, 0, wall + tolerance]) minkowski() {
      radio_body(tolerance);
      sphere(r = wall);
    }
    // Rounded so the skirt sweeps round the bottom's corners.
    linear_extrude(0.01) offset(r = 5) offset(delta = -5) square([2 * fx, 2 * fy], center = true);
  }
}

// The walls are a ball rolled along a sheet on the wall's mid-line, cut
// to the sloping rim: vertical faces, and the rim a half-round on top of
// them wherever it runs. Below the rim's low point they're a plain shell.
module walls() {
  e = cutout_edge_radius;
  z_lo = lip_rim_z(cutout_half) - e - 2;
  intersection() {
    outside();
    translate([-radio_width, -radio_width, 0]) cube([2 * radio_width, 2 * radio_width, z_lo]);
  }
  minkowski() {
    intersection() {
      translate([0, 0, z_lo]) linear_extrude(max(back_top_z, tab_top_z) - z_lo)
        difference() {
          offset(r = wall / 2 + 0.1) pocket_outline();
          offset(r = wall / 2 - 0.1) pocket_outline();
        }
      union() {
        under_rim();
        under_back_rise();
      }
    }
    sphere(r = e - 0.1);
  }
}

// The tab seen from the side, in (y, z): the back wall carried up to the
// radio's top back edge, then bent forward along the bevel, a tolerance off
// it and a wall thick (the user's "bend with the chamfer"). Its underside
// overhangs 57.5° for tab_reach, past the 45° rule; the user chose the
// bevel's angle. Its end is square to the bend, facing up and forward: the
// radio, coming down, pushes it back.
module tab_profile() {
  yi = radio_thickness / 2 + tolerance;
  yo = yi + wall;
  base = back_top_z - 2 * wall;
  b = bevel_angle;
  tip = [yi - tab_reach, tab_bend_z + tab_reach * tan(b)];
  tip_top = tip + wall * [sin(b), cos(b)];
  polygon([
    [yo, base], [yi, base], [yi, tab_bend_z], tip, tip_top,
    [yo, tip_top[1] - (yo - tip_top[0]) * tan(b)]
  ]);
}

// Nearly a half-round across the wall, so the tabs' sides match the
// slits' rounded edges below them.
tab_edge_radius = cutout_edge_radius - 0.05;

module tabs() {
  r = tab_edge_radius;
  for (i = tab_places)
    translate([tab_x(i), 0, 0]) minkowski() {
      rotate([90, 0, 90]) linear_extrude(tab_width - 2 * r, center = true)
        offset(delta = -r) tab_profile();
      sphere(r = r);
    }
}

// Cut down from above the back wall's top, round-bottomed so they don't
// tear: one either side of every tab, shared between neighbours. Their edges
// are a half-round across the wall like the rim's and the front opening's:
// the band within an edge-radius of each slit is cut through the wall, less
// a rod along its edge in the wall's mid-plane.
slit_bottom_z = back_top_z - slit_length;
slit_top_z = tab_top_z + 2 * wall;

module slit_profile(g) {
  hull() {
    circle(d = slit_width + 2 * g);
    translate([-slit_width / 2 - g, 0]) square([slit_width + 2 * g, slit_top_z - slit_bottom_z]);
  }
}

module slit_edge_rod() {
  e = cutout_edge_radius;
  rr = slit_width / 2 + e;
  for (sx = [-1, 1])
    translate([sx * rr, 0, 0]) cylinder(r = e, h = slit_top_z - slit_bottom_z);
  rotate([90, 0, 0]) rotate([0, 0, 180]) rotate_extrude(angle = 180) translate([rr, 0]) circle(r = e);
}

module slits() {
  e = cutout_edge_radius;
  yi = radio_thickness / 2 + tolerance;
  mid = yi + wall / 2;
  for (i = tab_places, sx = [-1, 1]) let (x = tab_x(i) + sx * tab_pitch / 2)
    translate([x, mid, slit_bottom_z]) {
      rotate([90, 0, 0]) linear_extrude(wall + 2, center = true) slit_profile(0);
      difference() {
        rotate([90, 0, 0]) linear_extrude(wall + 0.02, center = true) slit_profile(e);
        slit_edge_rod();
      }
    }
}

drain_hole_chamfer = 0.6;

// In the flat of the floor, clear of the corners and the bevel ramps, with
// both edges chamfered at 45° (the bed side's chamfer is a 45° overhang).
module drain_holes() {
  r = drain_hole_diameter / 2;
  c = drain_hole_chamfer;
  for (i = [0 : drain_holes - 1])
    translate([(i - (drain_holes - 1) / 2) * drain_hole_spacing, 0, 0]) {
      translate([0, 0, -1]) cylinder(r = r, h = wall + 2);
      translate([0, 0, -1]) cylinder(r1 = r + c + 1, r2 = r, h = c + 1);
      translate([0, 0, wall - c]) cylinder(r1 = r, r2 = r + c + 1, h = c + 1);
    }
}

// The tabs go on after the pocket is cut, since their bends reach into it.
module holster() {
  difference() {
    union() {
      walls();
      kanix_pad();
    }
    pocket();
    front_cutout();
    slits();
    drain_holes();
    kanix_pilots();
  }
  tabs();
}

// Reference body for the preview: the radio seated on the floor.
module radio() {
  translate([0, 0, wall + tolerance]) radio_body();
}

// Desk stand: the holster's pocket and front cutout sunk into a block, the
// radio leaning back. The cradle stays below the USB-C port, so a cable
// plugs in while it stands. Rigid filament, printed standing on its base.
stand_round = 1.5;
stand_outer_t = radio_thickness / 2 + tolerance + wall;
stand_outer_w = radio_width / 2 + tolerance + wall;
stand_top_z = radio_bottom_z + stand_depth;
// Lifts the leaning cradle clear of the bed; the hull fills under it.
stand_lift = stand_outer_t * sin(stand_angle) + stand_round;
assert(stand_top_z < usb_notch_bottom - 3, "desk stand cradle reaches the USB-C port");
assert(stand_top_z > cutout_bottom + cutout_corner_radius + cutout_edge_radius, "desk stand cradle lower than the front cutout's corners");

// From the holster's frame (the cradle upright) to the stand's.
module stand_tilt() {
  translate([0, 0, stand_lift]) rotate([-stand_angle, 0, 0]) children();
}

module stand_body() {
  r = stand_round;
  // The cradle's back top edge, which the back of the base drops straight from.
  back_y = stand_outer_t * cos(stand_angle) + stand_top_z * sin(stand_angle);
  front_y = -stand_outer_t * cos(stand_angle);
  module footprint(inset) {
    translate([0, (front_y + back_y) / 2])
      offset(r = 5) offset(delta = -5 - inset) square([2 * stand_outer_w, back_y - front_y], center = true);
  }
  // Rounded everywhere but the bottom edge, which stays square on the bed
  // so its round doesn't overhang.
  hull() {
    minkowski() {
      hull() {
        stand_tilt() intersection() {
          translate([0, 0, wall + tolerance]) radio_body(tolerance + wall - r);
          translate([-radio_width, -radio_width, 0]) cube([2 * radio_width, 2 * radio_width, stand_top_z - r]);
        }
        translate([0, 0, r]) linear_extrude(0.01) footprint(r);
      }
      sphere(r = r);
    }
    linear_extrude(r) footprint(0);
  }
}

// The pocket's mouth flares 45° to the cradle's top, so its inner edge is chamfered.
module stand_mouth() {
  c = cutout_edge_radius;
  hull() {
    translate([0, 0, stand_top_z - c]) linear_extrude(0.01) pocket_outline();
    translate([0, 0, stand_top_z]) linear_extrude(1) offset(delta = c) pocket_outline();
  }
}

module desk_stand() {
  difference() {
    stand_body();
    stand_tilt() {
      pocket();
      front_cutout();
      stand_mouth();
    }
  }
}

// Reference body for the stand's preview: the radio in the cradle.
module desk_stand_radio() {
  stand_tilt() radio();
}
