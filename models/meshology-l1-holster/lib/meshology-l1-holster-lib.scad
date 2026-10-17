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
// Inside depth of the channel, floor to rim
pocket_depth = 65;
// How far the front walls reach in from the radio's sides
front_lip = 8;
// Front wall left standing above the floor
front_sill = 8;
// Radius of the front cutout's lower corners, matching the radio's
cutout_corner_radius = 11;
// END_PARAMS

// The diagonal face rises radio_chamfer_depth over this much width.
radio_chamfer_width = radio_chamfer_depth / tan(180 - radio_corner_angle);

assert(radio_chamfer_depth * 2 < radio_thickness, "diagonal faces would meet front to back");
assert(radio_chamfer_width * 2 < radio_width, "diagonal faces would meet side to side");
assert(radio_corner_radius > radio_chamfer_width, "face corners would be sharper than a point");
assert(radio_corner_radius * 2 < radio_width - 2 * radio_chamfer_width, "face corners would meet side to side");
assert(front_lip > radio_chamfer_width, "front lip must reach past the diagonal face onto the front face");
assert(front_lip * 2 < radio_width, "front lips would close the front");
assert(cutout_corner_radius <= pocket_depth - front_sill, "cutout corner taller than the cutout");

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
    radio_body(tolerance, pocket_depth);
}

cutout_half = radio_width / 2 - front_lip;
cutout_bottom = wall + front_sill;
cutout_top = wall + pocket_depth + 1;
// Mid-plane of the flat front wall, where the cutout's edge runs.
front_wall_mid = -(radio_thickness / 2 + tolerance + wall / 2);
// The cutout's edge is rounded in a full half-round across the wall.
cutout_edge_radius = wall / 2;

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
    translate([sx * (cutout_half + e), front_wall_mid, cz]) cylinder(r = e, h = cutout_top - cz);
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

module holster() {
  difference() {
    linear_extrude(wall + pocket_depth)
      offset(r = wall) pocket_outline();
    pocket();
    front_cutout();
  }
}

// Reference body for the preview: the radio seated on the floor.
module radio() {
  translate([0, 0, wall + tolerance]) radio_body();
}
