// Antenna mounts: a bulkhead RF jack (an SMA or N extension cable's far end)
// held facing up on a plate that bolts to MOLLE clips on the Kanix bolt
// grid, so the antenna stands on top.
//
// The plate carries the bolt grid, drilled blind from Z = 0 (the clip side).
// A shroud runs the plate's whole length: seen down the antenna, a half
// circle round the jack's axis running straight back to the plate, with a
// rounded flange where it meets it. The jack goes through the shroud's
// closed top; its body and the cable run down inside and out the open
// bottom. Pairs of slots through the shroud tie the cable down inside.
//
// X is across the clip, +Y the way the connector faces, Z out of the plate.
// Prints as modelled, plate down, no supports: the bore and the holes
// through the top peak at 45° up the print.

// BEGIN_PARAMS
// Which jack it takes
connector = "sma"; // [sma, n]

// Kanix bolt grid: columns across
kanix_cols = 1;

// and rows up. One cable tie per row: at the bottom end, the rest spread up
// to below the jack's body
kanix_rows = 2;

// Plate margin above and below the outer bolt holes
kanix_margin = 7;

// MOLLE clip width; the plate is as wide as the clips it covers
molle_clip_w = 26.4;

// MOLLE clip plate thickness (reference only)
molle_clip_t = 4;

// SMA female bulkhead, 1/4"-36 thread: hole through the top
sma_hole = 6.6;

// The jack's own hex, across flats with clearance, pocketed into the top's
// underside so the jack can't turn while the nut is tightened
sma_hex = 8.3;

// How deep that pocket goes
sma_hex_depth = 3;

// Top left above the pocket: the panel the jack clamps
sma_panel = 2.5;

// The panel nut on top, across flats
sma_nut_af = 8;

// The nut's height (reference only)
sma_nut_h = 2;

// The jack's body below its hex, and its crimp
sma_body_d = 6;

// Their length below the top
sma_body_len = 12;

// The cable
sma_cable_d = 3;

// Bore up the shroud: the jack's hex and the cable's far-end plug pass up it
sma_bore_d = 10.5;

// Shroud wall
sma_wall = 3;

// Fillet where the shroud meets the plate
sma_flange = 3;

// N female bulkhead, 5/8"-24 UNEF thread
n_thread_d = 15.9;

// Clearance on the thread through the top
n_hole_clear = 0.5;

// Top under the nut: the panel the bulkhead clamps
n_panel = 4;

// The 3/4" hex panel nut on top, across flats
n_nut_af = 19.05;

// The nut's height (reference only)
n_nut_h = 5;

// The body below the top, with its O-ring
n_body_d = 24;

// Its length below the top
n_body_len = 15;

// The cable
n_cable_d = 7;

// Bore up the shroud: the body passes up it
n_bore_d = 26;

// Shroud wall
n_wall = 5;

// Fillet where the shroud meets the plate
n_flange = 8;

// Round on every edge but the bed face's
round_r = 1.5;

// 45° chamfer round the bore's mouth at the bottom
mouth_chamfer = 1.5;

// Cable-tie slots: tie width they take
tie_w = 4.5;

// and thickness
tie_t = 2.2;

// Reference antenna on an SMA jack: a generic stub, coupling nut then whip
sma_antenna_nut_d = 9;

// Its coupling nut's length
sma_antenna_nut_len = 8;

// Its whip's diameter
sma_antenna_d = 10;

// and length
sma_antenna_len = 100;

// Reference antenna on an N jack: ALFA AOA-915-5ACM, as the drybag node's
n_antenna_nut_d = 21.5;

// Its coupling nut's length
n_antenna_nut_len = 20;

// Its radome's diameter
n_antenna_d = 22;

// and length
n_antenna_len = 180;

// END_PARAMS

assert(connector == "sma" || connector == "n", "connector must be \"sma\" or \"n\"");
is_n = connector == "n";

// The Kanix bolt grid, as the Meshology L1 holster's pad: M5 self-tapping,
// 19.05 mm pitch, 4.2 mm pilots, drilled blind from the clip side. An M5x10
// through a MOLLE clip (4 mm plate, 2 mm under the head) reaches 8 mm in, the
// longest of the Kanix clips (the 3x2 belt clip's 5 mm plate and 2.4 mm
// counterbore leave 7.4), so the pilots go 8 plus a little.
kanix_pitch = 19.05;
kanix_pilot = 4.2;
kanix_screw_reach = 10 - 2;
kanix_pilot_depth = kanix_screw_reach + 0.6;
// Plate above the pilots' ends, under the bore.
kanix_skin = 1.5;
// A 45° chamfer at each pilot's mouth, so a screw starts square.
kanix_pilot_chamfer = 0.8;
// Kanix plates are as tall as their belt: 38 mm for 2 rows, 52 for 3.
kanix_face_h = kanix_rows == 2 ? 38 : kanix_pitch * (kanix_rows - 1) + 2 * kanix_margin;

// One clip per column on MOLLE, so the plate covers every column's clip.
w = kanix_pitch * (kanix_cols - 1) + molle_clip_w;
h = kanix_face_h;
pad_t = kanix_pilot_depth + kanix_skin;

hole_d = is_n ? n_thread_d + n_hole_clear : sma_hole;
cap_t = is_n ? n_panel : sma_panel + sma_hex_depth;
hex_af = is_n ? 0 : sma_hex;
hex_depth = is_n ? 0 : sma_hex_depth;
nut_af = is_n ? n_nut_af : sma_nut_af;
body_len = is_n ? n_body_len : sma_body_len;
cable_d = is_n ? n_cable_d : sma_cable_d;
bore_r = (is_n ? n_bore_d : sma_bore_d) / 2;
wall = is_n ? n_wall : sma_wall;
flange = is_n ? n_flange : sma_flange;

hex_r = hex_af / sqrt(3);
// A corner-up hex's roof is 30° off flat, so the pocket's roof is peaked at
// 45° from its side corners instead: this high over the axis.
hex_peak = hex_af > 0 ? hex_r / 2 + hex_af / 2 : 0;
// The bore sits on the plate's face; the shroud's half circle is round it.
axis_z = pad_t + bore_r;
shroud_r = bore_r + wall;
// The bore's 45° roof, flattened (a short bridge) where it would thin the
// top of the shroud below a wall, but never lower than 1 over the circle.
bore_roof = min(bore_r * sqrt(2), max(bore_r + 1, shroud_r - wall));
cap_y = h / 2 - cap_t;

// Cable-tie stations: one at the bottom end, the rest spread up to below
// the jack's body. Each is a pair of slots through the top of the shroud, a
// tie's thickness either side of the cable: down one, under the cable along
// the bore's floor, up the other, and cinched on top.
tie_y0 = -h / 2 + tie_w / 2 + 3;
tie_y1 = cap_y - body_len - tie_w / 2 - 1;
tie_ys = kanix_rows == 1 ? [tie_y0] : [for (k = [0 : kanix_rows - 1]) tie_y0 + k * (tie_y1 - tie_y0) / (kanix_rows - 1)];
tie_x = cable_d / 2 + 0.5 + tie_t / 2;

assert(bore_r > hex_r + 0.3, "the bore won't pass the jack's hex");
assert(bore_r > cable_d / 2 + 0.5 + tie_t, "the bore won't take the cable and a tie");
assert(hole_d / 2 * sqrt(2) < shroud_r - 1.5 && nut_af / sqrt(3) < shroud_r, "the top won't carry the jack's hole and nut");
assert(hex_peak < shroud_r - 1.5, "the hex pocket breaks through the top");
assert(shroud_r + flange + round_r <= w / 2, "the shroud and its flange are wider than the plate");
assert(kanix_rows == 1 || tie_y1 - tie_y0 >= (kanix_rows - 1) * (tie_w + 3), "no room for the cable ties below the jack's body");
assert(tie_x + tie_t / 2 < bore_r, "the tie slots miss the bore");

module mount() {
  difference() {
    body();
    kanix_pilots();
    // The bore, from the top's underside out the bottom end.
    translate([0, cap_y, axis_z]) rotate([90, 0, 0])
      linear_extrude(h) bore2d();
    translate([0, -h / 2 + mouth_chamfer, axis_z]) rotate([90, 0, 0])
      linear_extrude(mouth_chamfer + 0.01, scale = (bore_r + mouth_chamfer) / bore_r) circle(r = bore_r, $fn = 96);
    // Thread clearance through the top.
    translate([0, h / 2 + 1, axis_z]) rotate([90, 0, 0])
      linear_extrude(cap_t + 2) peaked_hole2d(hole_d / 2);
    // The jack's hex, up into the top from below, a corner up the print.
    if (hex_af > 0)
      translate([0, cap_y + hex_depth, axis_z]) rotate([90, 0, 0])
        linear_extrude(hex_depth + 1) hex_pocket2d();
    tie_slots();
  }
}

// Seen down the antenna: the plate, the shroud's half circle squared back to
// it, and the flange's fillets. Run below the bed by round_r, so the bed face
// stays whole once it's rounded and trimmed.
module profile2d() {
  translate([-w / 2, -round_r]) square([w, pad_t + round_r]);
  hull() {
    translate([0, axis_z]) circle(r = shroud_r, $fn = 96);
    translate([-shroud_r, -round_r]) square([2 * shroud_r, 1]);
  }
  for (m = [0, 1]) mirror([m, 0])
    difference() {
      translate([shroud_r - 0.01, pad_t - 0.01]) square(flange + 0.01);
      translate([shroud_r + flange, pad_t + flange]) circle(r = flange, $fn = 64);
    }
}

// The profile run the plate's length, every edge rounded: eroded by round_r
// (which also grows the fillets by it), then grown back with a sphere.
module body() {
  intersection() {
    minkowski() {
      translate([0, h / 2 - round_r, 0]) rotate([90, 0, 0])
        linear_extrude(h - 2 * round_r) offset(r = -round_r) profile2d();
      sphere(r = round_r, $fn = 24);
    }
    translate([-w, -h, 0]) cube([2 * w, 2 * h, axis_z + shroud_r + 1]);
  }
}

module kanix_pilots() {
  for (i = [0 : kanix_cols - 1], j = [0 : kanix_rows - 1])
    translate([(i - (kanix_cols - 1) / 2) * kanix_pitch, (j - (kanix_rows - 1) / 2) * kanix_pitch, -1]) {
      cylinder(d = kanix_pilot, h = kanix_pilot_depth + 1);
      cylinder(r1 = kanix_pilot / 2 + kanix_pilot_chamfer + 1, r2 = kanix_pilot / 2, h = kanix_pilot_chamfer + 1);
    }
}

// A round hole whose top is peaked at 45° (2D +y is up the print).
module peaked_hole2d(r) {
  hull() {
    circle(r = r, $fn = 64);
    polygon([[-r / sqrt(2), r / sqrt(2)], [r / sqrt(2), r / sqrt(2)], [0, r * sqrt(2)]]);
  }
}

module bore2d() {
  intersection() {
    peaked_hole2d(bore_r);
    translate([-bore_r, -bore_r]) square([2 * bore_r, bore_r + bore_roof]);
  }
}

module hex_pocket2d() {
  hull() {
    rotate(90) circle(r = hex_r, $fn = 6);
    polygon([[-hex_af / 2, hex_r / 2], [hex_af / 2, hex_r / 2], [0, hex_peak]]);
  }
}

module tie_slots() {
  for (y = tie_ys, sx = [-1, 1])
    translate([sx * tie_x - tie_t / 2, y - tie_w / 2, axis_z]) cube([tie_t, tie_w, shroud_r + 1]);
}

// Reference hardware, not printed.

// Along +Y from y0, on the jack's axis.
module on_axis(y0) {
  translate([0, y0, axis_z]) rotate([-90, 0, 0]) children();
}

module jack() {
  cable_len = h + 30;
  if (is_n) {
    on_axis(cap_y - 4) cylinder(d = n_thread_d, h = cap_t + n_nut_h + 8, $fn = 48);
    on_axis(h / 2) rotate(30) cylinder(r = n_nut_af / sqrt(3), h = n_nut_h, $fn = 6);
    on_axis(cap_y - n_body_len) cylinder(d = n_body_d, h = n_body_len, $fn = 48);
    on_axis(cap_y - n_body_len - cable_len) cylinder(d = n_cable_d, h = cable_len, $fn = 24);
  } else {
    on_axis(cap_y) cylinder(d = 6.35, h = cap_t + sma_nut_h + 4, $fn = 32);
    on_axis(h / 2) rotate(30) cylinder(r = sma_nut_af / sqrt(3), h = sma_nut_h, $fn = 6);
    on_axis(cap_y) rotate(90) cylinder(r = (sma_hex - 0.3) / sqrt(3), h = sma_hex_depth, $fn = 6);
    on_axis(cap_y - sma_body_len) cylinder(d = sma_body_d - 1, h = sma_body_len, $fn = 24);
    on_axis(cap_y - sma_body_len - cable_len) cylinder(d = sma_cable_d, h = cable_len, $fn = 16);
  }
}

module antenna() {
  nut_top = h / 2 + (is_n ? n_nut_h : sma_nut_h);
  nut_d = is_n ? n_antenna_nut_d : sma_antenna_nut_d;
  nut_len = is_n ? n_antenna_nut_len : sma_antenna_nut_len;
  on_axis(nut_top + 1) {
    cylinder(d = nut_d, h = nut_len, $fn = 48);
    translate([0, 0, nut_len]) cylinder(d = is_n ? n_antenna_d : sma_antenna_d, h = is_n ? n_antenna_len : sma_antenna_len, $fn = 48);
  }
}

// One Kanix 1x4 MOLLE clip's plate under each outer bolt column, the mount
// on its top two holes. Only the plate is drawn, not the clip's hooks.
module molle_clips() {
  clip_h = kanix_pitch * 3 + 2 * kanix_margin;
  top_row = kanix_pitch * (kanix_rows - 1) / 2;
  for (sx = [-1, 1])
    translate([sx * kanix_pitch * (kanix_cols - 1) / 2, top_row + kanix_margin - clip_h / 2, -molle_clip_t / 2])
      difference() {
        hull() for (x = [-1, 1], y = [-1, 1])
          translate([x * (molle_clip_w / 2 - 2), y * (clip_h / 2 - 2), 0]) cylinder(r = 2, h = molle_clip_t, center = true, $fn = 24);
        for (j = [0 : 3]) translate([0, (j - 1.5) * kanix_pitch, 0]) cylinder(d = 5.5, h = molle_clip_t + 2, center = true, $fn = 24);
      }
}

// The way it's worn: plate against the pack, the connector up.
module in_use() {
  rotate([90, 0, 0]) children();
}
