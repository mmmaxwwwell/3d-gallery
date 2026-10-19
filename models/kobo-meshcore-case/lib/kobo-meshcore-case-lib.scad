// Kobo Clara HD MeshCore handheld: a grip the Kobo slots into, used in
// landscape with the grip on the right. The Kobo stays whole: its chin (the
// wide bezel at its bottom edge) slides sideways into a slot in the grip,
// onto a micro USB plug that charges it, and a tab in the slot's floor
// presses it home. It comes out again as it went in.
//
// - The grip is an 18650 cylinder, flush with the front and standing out at
//   the back, whose depth carries on inward behind the Kobo to a rounded
//   inner end. Its back is a cover held by three M3 cap screws; inside are
//   the cell, three Seeed XIAOs, a TP4056 USB-C charger board and two SMA
//   bulkheads.
// - The slot: a lip over the chin in front (stopping short of the screen),
//   the tub's floor behind, and the grip's top and bottom walls at its ends.
//   The floor reaches further in than the lip.
// - The micro USB plug (a 90° one, its cable leaving toward the back) sits
//   in a pocket in the slot's end wall, its shell through a window to meet
//   the Kobo's port. The end wall clears the power button, which is covered.
// - The charger lies on the floor under the first SMA, its USB-C through
//   the right side, above the cell.
// - The XIAOs (nRF + two SX1262 radios) stand on end, stacked down the floor
//   behind the chin, left of the charger.
// - Two SMA bulkheads in the top wall: one over the cylinder, its jack pushed
//   up the cylinder from below; one in the top of the rounded inner end, its
//   jack slid in from behind before the cover goes on. One radio's antenna
//   may be an internal strip instead, stuck inside the inner end.
//
// Assembly frame: X along the device (cylinder at +X), Y up the device as
// it's held (SMA at +Y), Z out of the screen. The parts are modelled in the
// "depth frame": X and Y as above, z = depth behind the front face. The Kobo's
// top edge is at x = 0, its bottom edge (the chin's end) at pocket_x1.
//
// The grip prints standing on its bottom end: every wall runs along Y, so
// it only bridges short spans, and the SMAs' undersides rise at 45°. Lying
// face down it couldn't print: the floor would span the slot in mid-air.
// The cover prints outer face down, its edges 45° chamfers.

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
// How far short of the screen the lip over the chin stops
window_margin = 2;
// Where the power button and the micro USB port sit along the Kobo's bottom
// edge, measured from the Kobo's lower edge as it's held (estimated from
// Kobo's drawing)
power_button_y = 55;
usb_y = 34;
// Gap round the Kobo in the slot, per side and over its thickness
tolerance = 0.3;
// The lip over the chin
front_thickness = 2;
// The grip's walls
wall = 3;
// The tub's floor behind the Kobo
floor_thickness = 2;
// Solid strip between the slot's end and the cell's bore; it holds the
// micro USB plug
right_ledge = 10;
// 18650 bore (cell plus clearance)
cell_bore = 18.8;
// Cell bay length above the bottom wall: a 65 mm cell with its leads' tabs
cell_bay_length = 67;
// Half-ring over the bay that stops the cell sliding up: thickness, and
// inner radius (the leads pass inside it)
cell_stop = 2;
cell_stop_r = 6;
// Cylinder wall round the cell
tube_wall = 1.8;
// How far the grip reaches in behind the Kobo from the cylinder's leftmost
// point
thick_width = 48.2;
// The grip's corners seen from the front: at the inner end, and at the right
corner_radius = 6;
corner_round_right = 3;
// SMA bulkheads (1/4"-36): hole through the top wall, the jack's hex (8 mm
// plus clearance, across flats), and how far below the top wall each mount's
// 45° underside starts
sma_hole = 6.6;
sma_hex = 8.3;
sma_hex_depth = 3;
// Seeed XIAO boards, standing on end: how many, their outline (length
// along Y), and the gap round and between them
xiao_count = 3;
xiao_length = 21;
xiao_width = 17.8;
xiao_margin = 1.5;
// TP4056 USB-C charger board: outline (length toward its USB-C), PCB
// thickness, and the plug's opening through the side (overmold plus play)
charger_length = 28;
charger_width = 17.5;
charger_pcb = 1.6;
charger_port_w = 12.5;
charger_port_h = 7;
// 90° micro USB plug: the shell's window through the end wall, the end
// wall's thickness, and the overmold's pocket behind it (along Y, along X,
// and how far it reaches below the shell's axis)
usb_shell_w = 7.4;
usb_shell_h = 2.4;
usb_end_wall = 1;
usb_body_w = 11.5;
usb_body_t = 7;
usb_body_below = 3.5;
// Relief in the slot's end wall over the power button, so it isn't pressed
button_relief = 12;
button_relief_depth = 1.5;
// Retention tab in the floor: width, length, the slot round it, and how far
// its bump stands into the slot
tab_width = 12;
tab_length = 22;
tab_slot = 1;
tab_bump = 0.8;
// Where the tab sits, from the grip's bottom
tab_y = 26;
// Back cover thickness
cover_thickness = 2;
// 45° chamfer round the front face's outer edge
front_chamfer = 1;
// M3 cap screws: pilot for self-tapping, clearance, counterbore
pilot_d = 2.5;
clear_d = 3.4;
head_d = 6.2;
head_depth = 3.2;
// Material left under a counterbore
head_floor = 1.3;
// END_PARAMS

eps = 0.01;

// The slot, over the Kobo's whole outline (only the chin's end is in the grip)
pocket_l = kobo_length + 2 * tolerance;
pocket_w = kobo_width + 2 * tolerance;
pocket_t = kobo_thickness + tolerance;
pocket_x1 = pocket_l;
pocket_y0 = wall;

// Depths from the front face
kobo_back_z = front_thickness + pocket_t;
floor_back_z = kobo_back_z + floor_thickness;

case_w = pocket_w + 2 * wall;

// The lip over the chin ends window_margin short of the screen
lip_x0 = tolerance + screen_left + screen_width + window_margin;

tube_d = cell_bore + 2 * tube_wall;
ledge_x = pocket_x1 + right_ledge;          // the cell's bore starts here
tube_x = ledge_x + cell_bore / 2;
tube_z = tube_d / 2;
case_l = tube_x + tube_d / 2;
split_z = tube_d;                           // the grip's back, the cover's inner face
back_z = split_z + cover_thickness;

// The grip's inner end: a quarter round from the floor up to its back
thick_x0 = tube_x - tube_d / 2 - thick_width;
end_r = split_z - floor_back_z;

// SMA mounts: the jack's hex under the top wall, the nut on top
hex_r = sma_hex / 2 / cos(30);
hex_y1 = case_w - wall;
hex_y0 = hex_y1 - sma_hex_depth;
cell_y1 = wall + cell_bay_length;
cone_h = cell_bore / 2 - cell_stop_r;

// The second SMA, in the top of the inner end: flats facing the round and
// the tub, its channel 1 mm clear of the round where that is widest (at
// the back), its front corner on the floor
sma2_x = thick_x0 + end_r + 1 + sma_hex / 2;
sma2_z = floor_back_z + hex_r;
sma2_block_x1 = sma2_x + sma_hex / 2 + 2;

// The charger: on the floor, its USB-C end against the right wall, just
// above the cell
charger_x1 = ledge_x + cell_bore;
charger_x0 = charger_x1 - charger_length;
charger_y0 = cell_y1 + 1.5;
charger_port_z = floor_back_z + charger_pcb + 1.6;
// A rib on the floor behind it takes the plug's push
charger_stop = 1.2;

// XIAOs stand on end on the floor behind the chin, left of the charger,
// stacked down from under the second SMA's mount
xiao_x1 = charger_x0 - charger_stop - xiao_margin;
xiao_x0 = xiao_x1 - xiao_width;
xiao_top = hex_y0 - max(0, sma2_block_x1 - xiao_x0) - xiao_margin;
xiao_y0s = [for (i = [1 : xiao_count]) xiao_top - i * xiao_length - (i - 1) * xiao_margin];

usb_case_y = pocket_y0 + tolerance + usb_y;
usb_z = front_thickness + kobo_thickness / 2;
button_case_y = pocket_y0 + tolerance + power_button_y;

tab_x0 = thick_x0 + wall + tab_slot;

// The cover's screws: one in the first SMA's mount, two in bosses at the
// bottom. Each head sits in a pad under the cover, on a seat cut that far
// into the grip.
pad_h = head_floor + head_depth;
pad_d = head_d + 4;
pad_drop = pad_h - cover_thickness;
seat_z = split_z - pad_drop;
screws = [[ledge_x + cell_bore - 1.6, case_w - 6.1],
          [thick_x0 + end_r + pad_d / 2, 6.1],
          [ledge_x - pad_d / 2 - 1, 6.1]];
screw_depth = 8;

assert(sma2_z + hex_r <= split_z, "the second SMA's hex stands out of the grip's back");
assert(xiao_y0s[xiao_count - 1] >= tab_y + tab_width + tab_slot + 1, "the XIAO stack runs into the retention tab");
assert(charger_y0 + charger_width <= hex_y0 - cell_bore - 0.5, "the charger runs into the first SMA's mount");
assert(charger_port_z + charger_port_h / 2 <= split_z, "the charger's port breaks into the cover");
assert(ledge_x - (pocket_x1 + usb_end_wall + usb_body_t) >= 1.5, "the micro USB pocket breaks into the cell's bore");
assert(abs(usb_case_y - button_case_y) >= (usb_body_w + button_relief) / 2 + 1, "the micro USB plug runs into the power button");
assert(tab_x0 + tab_length + tab_slot <= pocket_x1 - 5, "the retention tab runs into the slot's end");
assert(thick_x0 < lip_x0, "the floor behind the Kobo must reach further in than the lip");
assert(hex_y0 - cell_bore - cell_y1 - cone_h - cell_stop >= 10,
       "no room above the cell for the first SMA's pigtail");
assert(screw_depth <= seat_z - kobo_back_z, "the cover's screws break into the slot");

// An octagon with a flat at the bottom and top: a round that prints standing
// up, its overhangs no steeper than 45°
module octagon(r) { rotate(22.5) circle(r = r / cos(22.5), $fn = 8); }

module case_plan() {
  hull() {
    translate([thick_x0 + corner_radius, case_w - corner_radius]) circle(r = corner_radius);
    translate([case_l - corner_round_right, case_w - corner_round_right]) circle(r = corner_round_right);
    translate([thick_x0 + corner_radius, corner_radius]) octagon(corner_radius);
    translate([case_l - corner_round_right, corner_round_right]) octagon(corner_round_right);
  }
}

// Clips a solid to the grip's plan with the front chamfer round its edge
module chamfered_plan(h) {
  hull() {
    linear_extrude(eps) offset(delta = -front_chamfer) case_plan();
    translate([0, 0, front_chamfer]) linear_extrude(h - front_chamfer) case_plan();
  }
}

// Extrude a (x, depth) profile along Y from y0 to y1
module along_y(y0, y1) {
  translate([0, y1, 0]) rotate([90, 0, 0]) linear_extrude(y1 - y0) children();
}

// The grip's outline in (x, depth), before the Kobo's notch: its inner end
// a quarter round from the floor up to the back, a flat back, the right side
// straight up from the cylinder's widest point, and the cylinder's
// front-right quarter a 45° flat
module thick_outline_2d() {
  hull() {
    translate([thick_x0 + end_r, floor_back_z]) intersection() {
      circle(r = end_r);
      translate([-end_r, -end_r]) square([2 * end_r, 2 * end_r - eps]);
    }
    translate([thick_x0, 0]) square([eps, floor_back_z]);
    translate([tube_x, tube_z]) circle(d = tube_d);
    translate([tube_x + tube_d / 2 * (sqrt(2) - 1), 0]) square(eps);
    translate([case_l - eps, split_z - eps]) square(eps);
  }
}

// The Kobo in front of the floor, left of the lip, isn't the grip's
module grip_outline_2d() {
  difference() {
    thick_outline_2d();
    translate([thick_x0 - 1, -1]) square([lip_x0 - thick_x0 + 1, kobo_back_z + 1]);
  }
}

// The tub's inside: behind the floor, a wall in from the inner end's round,
// open at the back; over the cell above its axis; and the cell's bore
module tub_2d() {
  intersection() {
    offset(delta = -wall) thick_outline_2d();
    translate([0, floor_back_z]) square([ledge_x, split_z]);
  }
  translate([thick_x0 + end_r, floor_back_z]) square([ledge_x - thick_x0 - end_r, split_z]);
  translate([ledge_x - eps, tube_z]) square([cell_bore + eps, split_z]);
  translate([tube_x, tube_z]) circle(d = cell_bore);
}

// A solid under the top wall that hangs off one wall, its underside rising
// at 45° from it so the grip prints standing up. children(0): its section;
// children(1): a sliver of the section along that wall; reach: how far the
// section runs from that wall
module hung_block(reach) {
  hull() {
    along_y(hex_y0, case_w) children(0);
    along_y(hex_y0 - reach, hex_y0) children(1);
  }
}

// The first SMA: a block over the cylinder hung off the right wall, the hex
// through it so the jack goes up the bore from below
module sma1_block() {
  hung_block(cell_bore) {
    intersection() { thick_outline_2d(); translate([ledge_x, 0]) square([case_l, split_z]); }
    intersection() { thick_outline_2d(); translate([ledge_x + cell_bore, 0]) square([case_l, split_z]); }
  }
}

module sma1_cuts() {
  along_y(hex_y0 - cell_bore - 1, hex_y1) translate([tube_x, tube_z]) circle(r = hex_r, $fn = 6);
  along_y(hex_y1 - 1, case_w + 1) translate([tube_x, tube_z]) circle(d = sma_hole);
}

// The second SMA: a block in the inner end hung off its round, with a hex
// channel and a slot through the top wall, both open to the back, so the
// jack slides in from behind
module sma2_block() {
  hung_block(sma2_block_x1 - thick_x0) {
    intersection() {
      thick_outline_2d();
      translate([thick_x0, floor_back_z]) square([sma2_block_x1 - thick_x0, split_z]);
    }
    intersection() {
      thick_outline_2d();
      translate([thick_x0, floor_back_z]) square([wall, split_z]);
    }
  }
}

module sma2_cuts() {
  along_y(hex_y0 - (sma2_block_x1 - thick_x0) - 1, hex_y1) hull() {
    translate([sma2_x, sma2_z]) rotate(90) circle(r = hex_r, $fn = 6);
    translate([sma2_x - sma_hex / 2, sma2_z]) square([sma_hex, split_z]);
  }
  along_y(hex_y1 - 1, case_w + 1) hull() {
    translate([sma2_x, sma2_z]) circle(d = sma_hole);
    translate([sma2_x - sma_hole / 2, sma2_z]) square([sma_hole, split_z]);
  }
}

// Over the cell's top, its underside a 45° cone; the leads pass inside it
module cell_stop() {
  intersection() {
    translate([tube_x, cell_y1, tube_z]) rotate([-90, 0, 0]) difference() {
      cylinder(d = cell_bore + 1, h = cone_h + cell_stop);
      translate([0, 0, -eps]) cylinder(r1 = cell_bore / 2, r2 = cell_stop_r, h = cone_h + eps);
      translate([0, 0, cone_h - eps]) cylinder(r = cell_stop_r, h = cell_stop + 1);
    }
    translate([0, 0, -1]) cube([case_l, case_w, tube_z + 1]);
  }
}

// The micro USB plug: its overmold in a pocket in the ledge, open to the tub
// so it goes in from behind, its shell through a window in the end wall
module usb_cuts() {
  translate([pocket_x1 + usb_end_wall, usb_case_y - usb_body_w / 2, usb_z - usb_body_below])
    cube([usb_body_t, usb_body_w, split_z]);
  translate([pocket_x1 - 1, usb_case_y - usb_shell_w / 2, usb_z - usb_shell_h / 2])
    cube([usb_end_wall + 2, usb_shell_w, usb_shell_h]);
}

module button_relief_cut() {
  translate([pocket_x1 - eps, button_case_y - button_relief / 2, front_thickness + 1])
    cube([button_relief_depth, button_relief, pocket_t - 2]);
}

// The charger's USB-C through the right side
module charger_port_cut() {
  translate([charger_x1 - 1, charger_y0 + charger_width / 2, charger_port_z])
    rotate([0, 90, 0]) linear_extrude(case_l - charger_x1 + 2)
      offset(r = 2) offset(delta = -2) square([charger_port_h, charger_port_w], center = true);
}

module charger_stop_rib() {
  translate([charger_x0 - charger_stop, charger_y0, floor_back_z - eps])
    cube([charger_stop, charger_width, 2.5]);
}

// A tongue cut free of the floor on three sides, its free end toward the
// slot's mouth, with a ridge across it that presses the Kobo into the lip
module tab_cuts() {
  translate([tab_x0 - tab_slot, tab_y - tab_slot, kobo_back_z - 1]) difference() {
    cube([tab_length + tab_slot, tab_width + 2 * tab_slot, floor_thickness + 2]);
    translate([tab_slot, tab_slot, -1]) cube([tab_length + 1, tab_width, floor_thickness + 4]);
  }
}

module tab_bump() {
  r = 1.5;
  intersection() {
    along_y(tab_y, tab_y + tab_width) translate([tab_x0 + 3, kobo_back_z + r - tab_bump]) circle(r = r);
    translate([0, 0, -1]) cube([case_l, case_w, kobo_back_z + 1]);
  }
}

// Bosses for the bottom screws, standing on the bottom wall
module screw_bosses() {
  for (p = [screws[1], screws[2]])
    intersection() {
      translate([p[0] - pad_d / 2 - 1.5, 0, floor_back_z - eps])
        cube([pad_d + 3, p[1] + pad_d / 2 + 1.5, split_z]);
      along_y(0, case_w) thick_outline_2d();
    }
}

module screw_cuts() {
  for (p = screws) {
    translate([p[0], p[1], seat_z]) linear_extrude(split_z) octagon(pad_d / 2 + 0.3);
    translate([p[0], p[1], seat_z - screw_depth]) cylinder(d = pilot_d, h = screw_depth + 1);
  }
}

// The grip in the depth frame
module grip_shape() {
  difference() {
    intersection() {
      union() {
        difference() {
          along_y(0, case_w) grip_outline_2d();
          along_y(wall, case_w - wall) tub_2d();
        }
        sma1_block();
        sma2_block();
        screw_bosses();
        charger_stop_rib();
      }
      chamfered_plan(split_z);
    }
    // the slot the Kobo's chin slides into
    translate([-1, pocket_y0, front_thickness]) cube([pocket_x1 + 1, pocket_w, pocket_t]);
    sma1_cuts();
    sma2_cuts();
    usb_cuts();
    button_relief_cut();
    charger_port_cut();
    tab_cuts();
    screw_cuts();
  }
  cell_stop();
  tab_bump();
}

// The cover's plan: the grip's back, from where the inner end's round
// meets it
module cover_plan() {
  intersection() {
    case_plan();
    translate([thick_x0 + end_r, -1]) square([case_l, case_w + 2]);
  }
}

// The cover in the depth frame: a plate on the grip's back, its outer edges
// 45° chamfers, with a pad under each screw head
module cover_shape() {
  difference() {
    union() {
      hull() {
        translate([0, 0, split_z]) linear_extrude(eps) cover_plan();
        translate([0, 0, back_z - eps]) linear_extrude(eps) offset(delta = -cover_thickness) cover_plan();
      }
      intersection() {
        for (p = screws) translate([p[0], p[1], seat_z]) linear_extrude(pad_drop + eps) octagon(pad_d / 2);
        along_y(0, case_w) thick_outline_2d();
        linear_extrude(back_z) case_plan();
      }
    }
    for (p = screws) translate([p[0], p[1], 0]) {
      cylinder(d = clear_d, h = back_z + 1);
      translate([0, 0, back_z - head_depth]) cylinder(d = head_d, h = head_depth + 1);
    }
  }
}

// Print frames. The grip stands on its bottom end, front face toward -Y;
// the cover lies outer face down, pads up.
module grip() { rotate([90, 0, 0]) translate([-thick_x0, 0, 0]) grip_shape(); }
module cover() { translate([-thick_x0, 0, back_z]) mirror([0, 0, 1]) cover_shape(); }

// Assembly: the depth frame mirrored in Z, so the front face is at z = 0,
// facing +Z. The cover can stand off behind (explode) to show the inside.
module grip_assembled() { mirror([0, 0, 1]) grip_shape(); }
module cover_assembled(explode = 0) { translate([0, 0, -explode]) mirror([0, 0, 1]) cover_shape(); }

// The assembly stood up for the preview: antenna up (+Z), screen facing -Y
module upright() { rotate([90, 0, 0]) children(); }

module rounded_rect(l, w, r) {
  translate([r, r]) offset(r) square([l - 2 * r, w - 2 * r]);
}

// Reference: the Kobo, an 18650, the boards, the plug, and the SMA
// bulkheads with a stub of antenna each
module kobo() {
  translate([tolerance, pocket_y0 + tolerance, -front_thickness - kobo_thickness])
    linear_extrude(kobo_thickness)
      rounded_rect(kobo_length, kobo_width, kobo_corner_radius);
}

module kobo_screen() {
  translate([tolerance + screen_left, pocket_y0 + tolerance + screen_bottom, -front_thickness])
    cube([screen_width, screen_height, 0.2]);
}

module cell() {
  translate([tube_x, wall + 1, -tube_z]) rotate([-90, 0, 0]) cylinder(d = 18.4, h = 65);
}

module xiaos() {
  for (y0 = xiao_y0s)
    translate([xiao_x0, y0, -floor_back_z - 1.2]) {
      cube([xiao_width, xiao_length, 1.2]);
      translate([2, 1, -2.3]) cube([xiao_width - 4, xiao_length - 6, 2.3]);
    }
}

module charger() {
  translate([charger_x0, charger_y0, -floor_back_z - charger_pcb]) {
    cube([charger_length, charger_width, charger_pcb]);
    translate([charger_length - 7.5, charger_width / 2 - 4.5, -3.2]) cube([8, 9, 3.2]);
  }
}

module usb_plug() {
  translate([pocket_x1 + usb_end_wall + 0.25, usb_case_y - usb_body_w / 2 + 0.25, -split_z])
    cube([usb_body_t - 0.5, usb_body_w - 0.5, split_z - usb_z + usb_body_below]);
  translate([pocket_x1 - 5.5, usb_case_y - 3.4, -usb_z - 0.9]) cube([5.5 + usb_end_wall, 6.8, 1.8]);
}

module sma_antenna(x, z) {
  translate([x, hex_y0, -z]) rotate([-90, 0, 0]) {
    cylinder(r = 8 / 2 / cos(30), h = sma_hex_depth, $fn = 6);
    cylinder(d = 6.35, h = sma_hex_depth + wall + 8);
    translate([0, 0, sma_hex_depth + wall]) cylinder(r = 8 / 2 / cos(30), h = 2.5, $fn = 6);
    translate([0, 0, sma_hex_depth + wall + 4]) cylinder(d = 9.5, h = 60);
  }
}

module sma_antennas() {
  sma_antenna(tube_x, tube_z);
  sma_antenna(sma2_x, sma2_z);
}
