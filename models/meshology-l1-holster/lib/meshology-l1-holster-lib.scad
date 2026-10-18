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
tolerance = 0.1;
// Wall, back and floor thickness
wall = 4;
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
tabs = 2;
// Where the row starts: this far in from the radio's +x side (the user's
// left, seen from the back). It runs from there to the -x corner
tab_start = 23;
// and this far round that corner's curve (degrees), the last tab following it
tab_wrap = 70;
// How far the tab bends forward over the radio's top back bevel, front to
// back: three quarters of the bevel's depth
tab_reach = 4.5;
// How far above the radio's top back edge each tab's bend starts
tab_lift = 3;
// On the +x side (the user's left, seen from the back) the radio's top back
// edge runs straight this much further before its corner curves down, so
// that corner is this much tighter than radio_corner_radius
back_edge_extra = 7;
// The +x guard's outer top corner is cut off at 45°, this far along each leg
guard_chamfer = 10;
// A hole through that guard, above the radio, to tie a bungee to and loop
// over the radio's GPS antenna wing: its diameter
bungee_hole = 5;
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
// its cradle's wall thickness (the holster's is `wall`)
stand_wall = 3;
// and how far up the radio the cradle reaches, from its bottom face
stand_depth = 24;
// and how far the base reaches back behind the radio's bottom, so the
// antenna on top can't tip it over backwards
stand_base_back = 45;
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
// Per side: sx = -1 or 1.
function back_corner_radius(sx) = radio_corner_radius - (sx > 0 ? back_edge_extra : 0);
function back_corner_x(sx) = radio_width / 2 - radio_chamfer_width - back_corner_radius(sx);
function back_corner_z(sx) = back_top_z - back_corner_radius(sx);
assert(back_corner_radius(1) > cutout_edge_radius, "back's +x corner tighter than the rim's round");
// The radio's top bevel rises at this angle off horizontal, front to back.
bevel_angle = atan(radio_chamfer_width / radio_chamfer_depth);
// Where each tab's bend starts on the back wall's inner face: a tolerance
// off the bevel, measured square to it.
tab_bend_z = back_top_z + tab_lift + tolerance * (1 / cos(bevel_angle) - tan(bevel_angle));
// The top of each tab's bend, where it ends a wall thick over the bevel.
tab_top_z = tab_bend_z + tab_reach * tan(bevel_angle) + wall * cos(bevel_angle);
// The row, slits at both ends included, from tab_start in on +x to tab_wrap
// round the -x corner. Neighbouring tabs share a slit.
tab_row_hi = radio_width / 2 - tab_start;
tab_row_lo = -(back_corner_x(-1) + radio_corner_radius * sin(tab_wrap));
tab_pitch = (tab_row_hi - tab_row_lo - slit_width) / tabs;
tab_width = tab_pitch - slit_width;
// Slit k's centre, k = 0 at +x; tab i sits between slits i and i + 1.
function slit_x(k) = tab_row_hi - slit_width / 2 - k * tab_pitch;
function tab_x(i) = slit_x(i) - tab_pitch / 2;
assert(tab_row_hi + slit_width + 2 * wall < back_corner_x(1), "tab row starts past the back's straight top edge");

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
// Its front side is a straight ramp down from the side rim's front corner,
// so the rim only falls from the front into the notch instead of rising
// first (the user's ask).
module usb_notch(g) {
  r = usb_width / 2;
  mirror([1, 0, 0]) rotate([90, 0, 90]) linear_extrude(2 * radio_width)
    hull() {
      translate([usb_notch_y, usb_notch_bottom + r]) circle(r = r + g);
      translate([usb_notch_y - r - g, usb_notch_bottom + r]) square([2 * (r + g), 2 * radio_height]);
      translate([-wall_mid_y, rim_front_z - cutout_edge_radius]) square(0.01);
    }
}

// The raised back over the back wall only. The ball rolls along an arc an
// edge-radius inside the face's corner, so the rounded top lands on it. From
// the corner where the side slope arrives, a straight ramp runs up into the
// arc, tangent to it, so the rim keeps climbing with no level step. On -x the
// tab row runs onto the arc, so the wall stays level with the side rim out to
// the row's last slit and follows the arc inside it. On +x the arc leaves along a tangent and climbs to a guard that
// stands just above the tabs' tops, so they don't snag, and runs flat in to
// the row's first slit.
module under_back_rise() {
  e = cutout_edge_radius;
  p = [front_face_x, rim_back_z - e];
  rg = wall - e;
  steps = 16;
  function corner(sx) = let (
      r = back_corner_radius(sx) - e,
      c = [back_corner_x(sx), back_corner_z(sx)]
    )
    assert(norm(p - c) > r, "back rim's ramp doesn't fit the face's corner arc")
    [r, c, atan2(p[1] - c[1], p[0] - c[0]) + acos(r / norm(p - c))];
  // The guard's top is round, radius `wall`, level with the tabs'. Its outer
  // end sits a wall past the corner's centre. The climb runs along the line
  // tangent to both the corner arc and the guard's outer round; a guard tall
  // enough that the climb from p clears the arc gets a straight ramp from p.
  function guard_side() = let (
      k = corner(1), r = k[0], c = k[1], a0 = k[2],
      go = [back_corner_x(1) + wall, tab_top_z - wall],
      gi = [tab_row_hi + wall, tab_top_z - wall],
      a1 = atan2(go[1] - c[1], go[0] - c[0]) - acos((r - rg) / norm(go - c)),
      on_arc = a1 > a0,
      ag = on_arc ? a1 : atan2(p[1] - go[1], p[0] - go[0]) + acos(rg / norm(p - go)),
      arc = on_arc ? [for (i = [0 : steps]) let (a = a0 + (a1 - a0) * i / steps) c + r * [cos(a), sin(a)]] : [],
      cap_o = [for (i = [0 : steps]) let (a = ag + (90 - ag) * i / steps) go + rg * [cos(a), sin(a)]],
      cap_i = [for (i = [0 : steps]) let (a = 90 + 90 * i / steps) gi + rg * [cos(a), sin(a)]]
    )
    concat(arc, cap_o, cap_i, [[gi[0] - rg, back_top_z - e]]);
  // Outside the row's last slit the wall stays at the side rim's height, so
  // no sliver of it stands up beside the slit; inside, it follows the arc.
  function corner_side() = let (
      k = corner(-1), r = k[0], c = k[1],
      // The ball's an edge-radius wide, so the arc starts that far inside
      // the slit's middle; any further out and its round pokes past the
      // slit as a thin fin.
      xs = -slit_x(tabs) - e,
      as = xs - c[0] >= r ? 0 : acos((xs - c[0]) / r)
    )
    concat([[xs + e, p[1]], [xs, p[1]], [xs, c[1] + r * sin(as)]],
      [for (i = [0 : steps]) let (a = as + (90 - as) * i / steps) c + r * [cos(a), sin(a)]]);
  right = guard_side();
  left = corner_side();
  // The guard's chamfer: everything past the 45° line through its top,
  // guard_chamfer in from its outer edge. Only the guard reaches past it.
  big = 4 * radio_height;
  cut = back_corner_x(1) + wall + rg + tab_top_z - wall - guard_chamfer;
  translate([0, 2 * radio_thickness, 0]) rotate([90, 0, 0])
    linear_extrude(2 * radio_thickness)
      intersection() {
        polygon([[-big, -big], [cut + big, -big], [-big, cut + big]]);
        polygon(concat(
        [[-p[0], 0], [-p[0], p[1]]],
        [for (pt = left) [-pt[0], pt[1]]],
        [for (i = [len(right) - 1 : -1 : 0]) right[i]],
        [p, [p[0], 0]]
      ));
      }
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
// A 45° chamfer at each pilot's mouth, so a screw starts square.
kanix_pilot_chamfer = 0.8;
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
      rotate([90, 0, 0]) {
        cylinder(d = kanix_pilot, h = kanix_pilot_depth + 1);
        cylinder(r1 = kanix_pilot / 2 + kanix_pilot_chamfer + 1, r2 = kanix_pilot / 2, h = kanix_pilot_chamfer + 1);
      }
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
      difference() {
        union() {
          under_rim();
          under_back_rise();
        }
        // Outside the row's last slit the wall comes down to the slit's
        // bottom, so the slit opens onto the corner with no nub beside it
        // (the user's ask). Back half only; the ball rolls the rest. The cut
        // reaches a ball's width past the slit into the last tab's side, or
        // the ball rolling that side's full-height wall spills over the slit
        // and leaves a lip; the ball rolls that side back out to the slit.
        big = 4 * radio_width;
        translate([-big + slit_x(tabs) + slit_width / 2 + e - 0.1, 0, slit_bottom_z - e + 0.1]) cube(big);
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

// Each tab is tab_profile() run along the back face's top edge: straight
// across the top, and swept round the -x corner's arc where the row runs
// onto it, so the last tab's bend follows the curved bevel.
module tabs() {
  r = tab_edge_radius;
  big = 2 * radio_width;
  swap = [[0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0]];
  for (i = [0 : tabs - 1])
    minkowski() {
      intersection() {
        translate([tab_x(i) - tab_width / 2 + r, -big, -big]) cube([tab_width - 2 * r, 2 * big, 2 * big]);
        union() {
          translate([-back_corner_x(-1), 0, 0]) rotate([90, 0, 90]) linear_extrude(big)
            offset(delta = -r) tab_profile();
          translate([-back_corner_x(-1), 0, back_corner_z(-1)]) rotate([-90, 0, 0]) rotate([0, 0, 180])
            rotate_extrude(angle = 90, $fn = 360)
              translate([-back_corner_z(-1), 0]) multmatrix(swap) offset(delta = -r) tab_profile();
        }
      }
      // Fine enough that the swept part meets the straight part without a
      // visible seam.
      sphere(r = r, $fn = 32);
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

// low_top: where the -x rod stops, in a ball, for a slit whose outer side
// is wall lower than the slit's top. Without the ball, the rod's round and
// the wall's rolled top cross at a point.
module slit_edge_rod(low_top = undef) {
  e = cutout_edge_radius;
  rr = slit_width / 2 + e;
  for (sx = [-1, 1])
    translate([sx * rr, 0, 0])
      if (sx < 0 && low_top != undef) {
        if (low_top > 0) cylinder(r = e, h = low_top);
        translate([0, 0, low_top]) sphere(r = e);
      } else
        cylinder(r = e, h = slit_top_z - slit_bottom_z);
  rotate([90, 0, 0]) rotate([0, 0, 180]) rotate_extrude(angle = 180) translate([rr, 0]) circle(r = e);
}

module slits() {
  e = cutout_edge_radius;
  yi = radio_thickness / 2 + tolerance;
  mid = yi + wall / 2;
  for (k = [0 : tabs])
    translate([slit_x(k), mid, slit_bottom_z]) {
      rotate([90, 0, 0]) linear_extrude(wall + 2, center = true) slit_profile(0);
      difference() {
        rotate([90, 0, 0]) linear_extrude(wall + 0.02, center = true) slit_profile(e);
        // Outside the last slit the wall comes down to the slit's bottom
        // (walls()), so that side's rod ends there.
        slit_edge_rod(k == tabs ? 0 : undef);
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
// Through the +x guard front to back, centred between the guard's inner face
// and the face's corner, centred in the band of guard between the radio's
// top back edge and the guard's rounded top. Both mouths chamfered at 45° so
// they don't cut the cord.
bungee_hole_x = (tab_row_hi + slit_width + cutout_edge_radius + back_corner_x(1)) / 2;
bungee_hole_z = (back_top_z + tab_top_z - cutout_edge_radius) / 2;
bungee_hole_chamfer = 0.5;
assert(bungee_hole_z - bungee_hole / 2 - bungee_hole_chamfer > back_top_z, "bungee hole runs below the radio's top back edge");
assert(bungee_hole_z + bungee_hole / 2 + bungee_hole_chamfer < tab_top_z - cutout_edge_radius, "bungee hole runs into the guard's rounded top");

module bungee_hole() {
  r = bungee_hole / 2;
  c = bungee_hole_chamfer;
  y0 = radio_thickness / 2 + tolerance;
  translate([bungee_hole_x, 0, bungee_hole_z]) rotate([-90, 0, 0]) {
    translate([0, 0, y0 - 1]) cylinder(r = r, h = wall + 2);
    translate([0, 0, y0 - 1]) cylinder(r1 = r + c + 1, r2 = r, h = c + 1);
    translate([0, 0, y0 + wall - c]) cylinder(r1 = r, r2 = r + c + 1, h = c + 1);
  }
}

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
    bungee_hole();
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
stand_round = 1.2;
stand_outer_t = radio_thickness / 2 + tolerance + stand_wall;
stand_outer_w = radio_width / 2 + tolerance + stand_wall;
stand_top_z = radio_bottom_z + stand_depth;
// Lifts the leaning cradle clear of the bed; the hull fills under it.
stand_lift = stand_outer_t * sin(stand_angle) + stand_round;
assert(stand_top_z < usb_notch_bottom - 3, "desk stand cradle reaches the USB-C port");
assert(stand_top_z > cutout_bottom + cutout_corner_radius + cutout_edge_radius, "desk stand cradle lower than the front cutout's corners");

// From the holster's frame (the cradle upright) to the stand's.
module stand_tilt() {
  translate([0, 0, stand_lift]) rotate([-stand_angle, 0, 0]) children();
}

// The stand shrunk by stand_round all over, its cuts grown by it. Rolling
// a ball over it (desk_stand()) rounds every edge, the bottom one too.
module stand_core() {
  r = stand_round;
  // The cradle's back top edge, or the base's reach if that's further back.
  back_y = max(stand_outer_t * cos(stand_angle) + stand_top_z * sin(stand_angle), stand_base_back);
  front_y = -stand_outer_t * cos(stand_angle);
  difference() {
    hull() {
      stand_tilt() intersection() {
        translate([0, 0, wall + tolerance]) radio_body(tolerance + stand_wall - r);
        translate([-radio_width, -radio_width, 0]) cube([2 * radio_width, 2 * radio_width, stand_top_z - r]);
      }
      translate([0, (front_y + back_y) / 2, r]) linear_extrude(0.01)
        offset(r = 5) offset(delta = -5 - r) square([2 * stand_outer_w, back_y - front_y], center = true);
    }
    stand_tilt() {
      translate([0, 0, wall + tolerance]) radio_body(tolerance + r, radio_height);
      cutout_through(r, radio_thickness / 2);
      stand_front_bevel(r);
    }
  }
}

// The tops of the walls in front of the radio's front and diagonal faces
// are 45° lead-ins, from the outside edge down to the pocket a wall lower,
// so the radio is guided in as it slides down. Mitred where the diagonals
// meet the sides; the side and back walls keep their height. In the
// cradle's frame, the slopes moved d out square to themselves.
module stand_front_bevel(d) {
  w = radio_width / 2 + tolerance;
  vy = -radio_thickness / 2 - tolerance + radio_chamfer_depth;
  diag = [radio_chamfer_width, -radio_chamfer_depth] / norm([radio_chamfer_width, radio_chamfer_depth]);
  bis = ([1, 0] + diag) / norm([1, 0] + diag);
  far = 4 * radio_width;
  z0 = stand_top_z - stand_wall;
  h = stand_wall + 2 * d + 5;
  intersection() {
    hull() {
      translate([0, 0, z0]) linear_extrude(0.01) offset(delta = d * sqrt(2)) pocket_outline();
      translate([0, 0, z0 + h]) linear_extrude(0.01) offset(delta = d * sqrt(2) + h) pocket_outline();
    }
    linear_extrude(far) polygon([
      [-w, vy], [w, vy], [w, vy] + far * bis, [-w, vy] + far * [-bis[0], bis[1]]
    ]);
  }
}

module desk_stand() {
  minkowski() {
    stand_core();
    sphere(r = stand_round, $fn = 16);
  }
}

// Reference body for the stand's preview: the radio in the cradle.
module desk_stand_radio() {
  stand_tilt() radio();
}
