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
wall = 2.4;
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
// Neighbouring tabs share a slit, so they sit a tab and a slit apart.
tab_pitch = tab_width + slit_width;
function tab_x(i) = (i - (tabs - 1) / 2) * tab_pitch;
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
}

// The raised back over the back wall only. The ball rolls along an arc an
// edge-radius inside the face's corner, so the rounded top lands on it. From
// the corner where the side slope arrives, a straight ramp runs up into the
// arc, tangent to it, so the rim keeps climbing with no level step.
module under_back_rise() {
  e = cutout_edge_radius;
  r = radio_corner_radius - e;
  p = [front_face_x, rim_back_z - e];
  c = [back_corner_x, back_corner_z];
  d = norm(p - c);
  assert(d > r, "back corner inside the face's corner arc");
  a0 = atan2(p[1] - c[1], p[0] - c[0]) + acos(r / d);
  steps = 24;
  arc = [for (i = [0 : steps]) let (a = a0 + (90 - a0) * i / steps)
    c + r * [cos(a), sin(a)]];
  translate([0, 2 * radio_thickness, 0]) rotate([90, 0, 0])
    linear_extrude(2 * radio_thickness)
      polygon(concat(
        [[-p[0], 0], [-p[0], p[1]]],
        [for (i = [0 : steps]) [-arc[i][0], arc[i][1]]],
        [for (i = [steps : -1 : 0]) arc[i]],
        [p, [p[0], 0]]
      ));
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
    translate([-fx, -fy, 0]) cube([2 * fx, 2 * fy, 0.01]);
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
      translate([0, 0, z_lo]) linear_extrude(back_top_z - z_lo)
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

// The tab seen from the side, in (y, z): the back wall carried up to a
// tolerance above the radio's top back edge, then bent forward over the
// bevel, a wall thick. It bends at 45° rather than along the 32.5° bevel,
// which would overhang, so it catches the edge and prints without
// supports. Its end faces up and forward at 45°: the radio, coming down,
// pushes it back.
module tab_profile() {
  yi = radio_thickness / 2 + tolerance;
  yo = yi + wall;
  zc = back_top_z + tolerance;
  base = back_top_z - 2 * wall;
  k = wall / sqrt(2);
  tip = [yi - tab_reach, zc + tab_reach];
  polygon([
    [yo, base], [yi, base], [yi, zc], tip, tip + [k, k],
    [yo, zc + 2 * k - wall]
  ]);
}

tab_edge_radius = 0.6;

module tabs() {
  r = tab_edge_radius;
  for (i = [0 : tabs - 1])
    translate([tab_x(i), 0, 0]) minkowski() {
      rotate([90, 0, 90]) linear_extrude(tab_width - 2 * r, center = true)
        offset(delta = -r) tab_profile();
      sphere(r = r);
    }
}

// Cut down from above the back wall's top, round-bottomed so they don't
// tear: one either side of every tab, shared between neighbours.
module slits() {
  for (i = [0 : tabs]) let (x = tab_x(i) - tab_pitch / 2)
    translate([x, radio_thickness / 2, back_top_z - slit_length]) {
      rotate([-90, 0, 0]) cylinder(d = slit_width, h = tolerance + wall + 1);
      translate([-slit_width / 2, 0, 0]) cube([slit_width, tolerance + wall + 1, slit_length + 2 * wall]);
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
    walls();
    pocket();
    front_cutout();
    slits();
    drain_holes();
  }
  tabs();
}

// Reference body for the preview: the radio seated on the floor.
module radio() {
  translate([0, 0, wall + tolerance]) radio_body();
}
