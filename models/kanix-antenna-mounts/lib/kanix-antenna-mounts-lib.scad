// Kanix antenna mounts: a bulkhead RF jack (an SMA or N extension cable's
// far end) held facing up on a Kanix bolt grid, so the antenna stands on it.
//
// A pad carries the bolt grid, drilled blind from Z = 0 (the clip side). A
// shelf runs across the pad's top end (+Y), standing out from the pad face
// (+Z), and the bulkhead goes through it along Y. The nut tightens on top;
// the jack's body and its cable hang below the shelf, in front of the pad,
// in a slot between two side gussets that tie the shelf to the pad.
//
// X is across the clip, +Y the way the connector faces, Z out of the pad.
// Prints as modelled, pad down, no supports: the shelf and gussets are
// walls, and the holes through the shelf peak at 45° up the print.

// BEGIN_PARAMS
// Which jack the shelf takes
connector = "sma"; // [sma, n]

// Kanix plate bolt grid: columns across
kanix_cols = 1;

// and rows up
kanix_rows = 2;

// Pad face margin outside the outer bolt holes, each side
kanix_margin = 7;

// SMA female bulkhead, 1/4"-36 thread: hole through the shelf
sma_hole = 6.6;

// The jack's own hex, across flats with clearance, pocketed into the
// shelf's underside so the jack can't turn while the nut is tightened
sma_hex = 8.3;

// How deep that pocket goes
sma_hex_depth = 3;

// Shelf left above the pocket: the panel the jack clamps
sma_panel = 2.5;

// The panel nut on top, across flats
sma_nut_af = 8;

// The nut's height (reference only)
sma_nut_h = 2;

// The jack's body below its hex
sma_body_d = 6;

// Each side gusset's thickness; the slot between them must pass the hex
sma_gusset = 2.5;

// N female bulkhead, 5/8"-24 UNEF thread
n_thread_d = 15.9;

// Clearance on the thread through the shelf
n_hole_clear = 0.5;

// Shelf under the nut: the panel the bulkhead clamps
n_panel = 4;

// The 3/4" hex panel nut on top, across flats
n_nut_af = 19.05;

// The nut's height (reference only)
n_nut_h = 5;

// The body below the shelf, with its O-ring
n_body_d = 24;

// The body's length below the shelf (reference only)
n_body_len = 15;

// Each side gusset's thickness
n_gusset = 4;

// The jack's body (or the SMA's hex pocket) clears the pad face by this
body_clear = 1;

// Shelf beyond the nut's corners and the holes' peaks
shelf_rim = 2;

// Round on every edge but the bed face's
round_r = 1.5;

// Fillet where the gussets meet the pad and the shelf
fillet_r = 2;

// Zip-tie tunnel across the pad for the cable's strain relief: tie width
// it takes
tie_w = 4;

// and thickness
tie_t = 2;

// Pad left under the tunnel
tie_floor = 2;

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

// Reference Kanix MOLLE clip, 1x4 wide: width
molle_clip_w = 26.4;

// Its plate's thickness
molle_clip_t = 4;

// END_PARAMS

assert(connector == "sma" || connector == "n", "connector must be \"sma\" or \"n\"");
is_n = connector == "n";

// Kanix plate mount, as the Meshology L1 holster's: the Kanix bolt grid (M5
// self-tapping, 19.05 mm pitch, 4.2 mm pilots), drilled blind from the clip
// side. An M5x10 through a MOLLE clip (4 mm plate, 2 mm under the head)
// reaches 8 mm in, the longest of the Kanix clips (the 3x2 belt clip's 5 mm
// plate and 2.4 mm counterbore leave 7.4), so the pilots go 8 plus a little.
kanix_pitch = 19.05;
kanix_pilot = 4.2;
kanix_screw_reach = 10 - 2;
kanix_pilot_depth = kanix_screw_reach + 0.6;
// Pad above the pilots' ends. The holster's 0.8 only had to stop a screw;
// this skin also carries the antenna's leverage into the gussets.
kanix_skin = 1.5;
// A 45° chamfer at each pilot's mouth, so a screw starts square.
kanix_pilot_chamfer = 0.8;
kanix_face_w = kanix_pitch * (kanix_cols - 1) + 2 * kanix_margin;
// Kanix plates are as tall as their belt: 38 mm for 2 rows, 52 for 3.
kanix_face_h = kanix_rows == 2 ? 38 : kanix_pitch * (kanix_rows - 1) + 2 * kanix_margin;

w = kanix_face_w;
h = kanix_face_h;
pad_t = kanix_pilot_depth + kanix_skin;

hole_d = is_n ? n_thread_d + n_hole_clear : sma_hole;
panel = is_n ? n_panel : sma_panel;
hex_af = is_n ? 0 : sma_hex;
hex_depth = is_n ? 0 : sma_hex_depth;
nut_af = is_n ? n_nut_af : sma_nut_af;
body_d = is_n ? n_body_d : sma_body_d;
gusset = is_n ? n_gusset : sma_gusset;

hex_r = hex_af / sqrt(3);
// A corner-up hex's roof is 30° off flat, so the pocket's roof is peaked at
// 45° from its side corners instead: this high over the axis.
hex_peak = hex_af > 0 ? hex_r / 2 + hex_af / 2 : 0;
shelf_t = panel + hex_depth;
shelf_y = h / 2 - shelf_t;
slot_w = w - 2 * gusset;
axis_z = pad_t + max(body_d / 2, hex_r) + body_clear;
tip_z = axis_z + max(nut_af / sqrt(3), hole_d / 2 * sqrt(2), hex_peak) + shelf_rim;

// The tie tunnel sits below the bottom row of pilots where the pad's margin
// has room (2-row plates are 38 tall, more than the grid needs), else
// between the bottom two rows.
grid_y0 = -kanix_pitch * (kanix_rows - 1) / 2;
tie_low = -h / 2 + round_r + 1 + tie_w / 2;
tie_y = tie_low + tie_w / 2 + 1 <= grid_y0 - kanix_pilot / 2 ? tie_low : grid_y0 + kanix_pitch / 2;
tie_top = tie_floor + tie_t + tie_w / 2;

assert(kanix_rows >= 2 || tie_y == tie_low, "a 1-row grid has no rows to put the tie tunnel between");
assert(slot_w >= body_d + 2 * body_clear, "gussets too thick: no room for the jack's body");
assert(slot_w >= hex_af + 0.5, "gussets too thick: the jack's hex can't pass between them");
assert(tie_top < pad_t - 2, "the tie tunnel runs too near the pad's face");
assert(abs(tie_y - grid_y0) - tie_w / 2 >= kanix_pilot / 2 + 1, "the tie tunnel runs into a pilot");

module mount() {
  difference() {
    intersection() {
      minkowski() {
        body_core();
        sphere(r = round_r, $fn = 24);
      }
      translate([-w, -h, 0]) cube([2 * w, 2 * h, tip_z + 2]);
    }
    kanix_pilots();
    // Thread clearance through the shelf.
    translate([0, h / 2 + 1, axis_z]) rotate([90, 0, 0])
      linear_extrude(shelf_t + 2) peaked_hole2d(hole_d / 2);
    // The jack's hex, up into the shelf from below, a corner up the print.
    // It starts fillet_r under the shelf so the fillets don't catch it.
    if (hex_af > 0)
      translate([0, shelf_y + hex_depth, axis_z]) rotate([90, 0, 0])
        linear_extrude(hex_depth + fillet_r) hex_pocket2d();
    tie_tunnel();
  }
}

// The body before rounding: everything shrunk by round_r, the slot grown by
// it, so the minkowski with a sphere of round_r lands on the real size.
// Minkowski only rounds outside edges, so the slot is cut with rounded edges
// of its own: fillet_r + round_r here comes out as fillet_r.
module body_core() {
  r = round_r;
  difference() {
    // The pad, hulled to the shelf at its top end: the front face slopes
    // from the pad's bottom edge to the shelf's tip.
    hull() {
      translate([-w / 2 + r, -h / 2 + r, 0]) cube([w - 2 * r, h - 2 * r, pad_t - r]);
      translate([-w / 2 + r, shelf_y + r, 0]) cube([w - 2 * r, shelf_t - 2 * r, tip_z - r]);
    }
    // The slot between the gussets, under the shelf and out the bottom and
    // front. It runs well past the part at those two ends, so only its edges
    // along the pad and under the shelf land on the body.
    fr = fillet_r + r;
    x1 = slot_w / 2 + r - fr;
    y0 = -h;
    y1 = shelf_y + r - fr;
    z0 = pad_t - r + fr;
    z1 = tip_z + 2 * fr;
    hull() for (x = [-x1, x1], y = [y0, y1], z = [z0, z1])
      translate([x, y, z]) sphere(r = fr, $fn = 24);
  }
}

module kanix_pilots() {
  for (i = [0 : kanix_cols - 1], j = [0 : kanix_rows - 1])
    translate([(i - (kanix_cols - 1) / 2) * kanix_pitch, grid_y0 + j * kanix_pitch, -1]) {
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

module hex_pocket2d() {
  hull() {
    rotate(90) circle(r = hex_r, $fn = 6);
    polygon([[-hex_af / 2, hex_r / 2], [hex_af / 2, hex_r / 2], [0, hex_peak]]);
  }
}

// Across the whole pad under the cable: a tie goes through it and round the
// cable in front. Its roof peaks at 45°.
module tie_tunnel() {
  hull() {
    translate([-w, tie_y - tie_w / 2, tie_floor]) cube([2 * w, tie_w, tie_t]);
    translate([-w, tie_y - 0.01, tie_floor]) cube([2 * w, 0.02, tie_t + tie_w / 2]);
  }
}

// Reference hardware, not printed.

// Along +Y from y0, on the jack's axis.
module on_axis(y0) {
  translate([0, y0, axis_z]) rotate([-90, 0, 0]) children();
}

module jack() {
  if (is_n) {
    on_axis(h / 2 - shelf_t - 4) cylinder(d = n_thread_d, h = shelf_t + n_nut_h + 8, $fn = 48);
    on_axis(h / 2) rotate(30) cylinder(r = n_nut_af / sqrt(3), h = n_nut_h, $fn = 6);
    on_axis(shelf_y - n_body_len) cylinder(d = n_body_d, h = n_body_len, $fn = 48);
    on_axis(shelf_y - n_body_len - 30) cylinder(d = 7, h = 30, $fn = 24);
  } else {
    on_axis(shelf_y) cylinder(d = 6.35, h = shelf_t + sma_nut_h + 4, $fn = 32);
    on_axis(h / 2) rotate(30) cylinder(r = sma_nut_af / sqrt(3), h = sma_nut_h, $fn = 6);
    on_axis(shelf_y) rotate(90) cylinder(r = (sma_hex - 0.3) / sqrt(3), h = sma_hex_depth, $fn = 6);
    on_axis(shelf_y - 10) cylinder(d = sma_body_d - 1, h = 10, $fn = 24);
    on_axis(shelf_y - 40) cylinder(d = 3, h = 30, $fn = 16);
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
  for (sx = [-1, 1])
    translate([sx * kanix_pitch * (kanix_cols - 1) / 2, grid_y0 + kanix_pitch * (kanix_rows - 1) + kanix_margin - clip_h / 2, -molle_clip_t / 2])
      difference() {
        hull() for (x = [-1, 1], y = [-1, 1])
          translate([x * (molle_clip_w / 2 - 2), y * (clip_h / 2 - 2), 0]) cylinder(r = 2, h = molle_clip_t, center = true, $fn = 24);
        for (j = [0 : 3]) translate([0, (j - 1.5) * kanix_pitch, 0]) cylinder(d = 5.5, h = molle_clip_t + 2, center = true, $fn = 24);
      }
}

// The way it's worn: pad against the pack, the connector up.
module in_use() {
  rotate([90, 0, 0]) children();
}
