// Kobo Clara HD MeshCore handheld: a grip the Kobo slots into, used in
// landscape with the grip on the right, built to keep water out. The Kobo
// stays whole: its chin (the wide bezel at its bottom edge) slides sideways
// into a slot in the grip, onto a micro USB plug that charges it, and a soft
// TPU pad in the slot's floor holds it. It comes out again as it went in.
//
// - The grip is an 18650 cylinder, flush with the front and standing out at
//   the back, whose depth carries on inward behind the Kobo to a rounded
//   inner end. A back cover closes it; inside are the cell, three Seeed
//   XIAOs, a TP4056 USB-C charger board and two SMA bulkheads.
// - A 2.13" e-paper stands in front of the Kobo's chin, under a bezel.
// - The slot: the display's wall in front, the tub's floor behind, and the
//   grip's top and bottom walls at its ends.
//
// Sealing (the rules from the dry-bag node and the failed screw-through-bead
// seal): the body and lids are PCTG; seals are soft TPU, squeezed from the
// side, never face-clamped by screws, and every screw sits outside its seal.
// - Back cover: a U-section TPU 85A gasket lies in a groove round the grip's
//   back rim; the cover's tongue, wider than the gasket's slot, presses into
//   it from the side. Outside the groove, a lane of screws runs round the
//   whole edge, about every screw_pitch. Where the second SMA's hole comes close under
//   the groove, a smooth boss lifts the groove over it, into a pocket in
//   the cover.
// - Bezel: a TPU 70A frame between the bezel and the panel's border.
// - Through-holes: the SMAs seal under their nuts on TPU washers; the USB-C
//   takes a TPU plug; the micro USB plug's pocket and the display's wire
//   channel are potted once wired.
//
// Assembly frame: X along the device (cylinder at +X), Y up the device as
// it's held (SMA at +Y), Z out of the screen. The parts are modelled in the
// "depth frame": X and Y as above, z = depth behind the front face. The Kobo's
// top edge is at x = 0, its bottom edge (the chin's end) at pocket_x1.
//
// The grip prints standing on its bottom end: every wall runs along Y, so
// it only bridges short spans, and anything hung under a wall rises at 45°.
// Lying face down it couldn't print: the floor would span the slot in
// mid-air. The cover and bezel print outer face down; the TPU parts flat.

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
// How far short of the screen the grip's front starts
window_margin = 2;
// Where the power button and the micro USB port sit along the Kobo's bottom
// edge, measured from the Kobo's lower edge as it's held (estimated from
// Kobo's drawing)
power_button_y = 55;
usb_y = 34;
// Gap round the Kobo in the slot, per side and over its thickness
tolerance = 0.3;
// 2.13" e-paper HAT (with its 40-pin header and JST removed; wired to its
// row of 8 holes), standing portrait in front of the Kobo's chin: the
// board's outline (along Y, along X), the panel and board thicknesses, the
// tallest part left on its back, and how far the panel's ribbon loops past
// the board's end (at the top)
display_length = 65;
display_width = 30.2;
display_panel = 1.05;
display_pcb = 1.6;
display_parts = 3;
display_fpc = 2;
// The panel's active area (along Y, along X), assumed centred on the board,
// and the window's margin round it
display_view_length = 48.55;
display_view_width = 23.71;
display_view_margin = 0.5;
// The bezel over the display: thickness, the shoulder it rests on round
// the pocket, how far it reaches past the pocket's ends for its screws, its
// corner radius, and the wall behind the display that the Kobo slides on
bezel_thickness = 1.2;
bezel_shoulder = 1.5;
bezel_end = 9;
bezel_round = 2;
display_wall = 0.8;
// The TPU 70A gasket between the bezel and the panel's border: its
// thickness squeezed, and its width round the window
bezel_gasket = 0.5;
bezel_gasket_free = 0.8;
// Where the board's bottom sits, above the slot's bottom
display_y_in_slot = 19;
// The bezel's M2 cap screws: pilot, clearance, counterbore, and the floor
// left under it
bezel_pilot_d = 1.6;
bezel_clear_d = 2.4;
bezel_head_d = 4.2;
bezel_head_depth = 2.2;
bezel_head_floor = 0.8;
// The grip's walls, and its bottom wall, thick enough for the cover's
// corner screws to clear the cell
wall = 3;
bottom_wall = 11.5;
// The tub's floor behind the Kobo
floor_thickness = 2;
// How far the boards stand off the floor, USB-C included (the XIAOs lie
// under the cover, with room for a zip tie over them)
xiao_height = 4.6;
tie_thickness = 1.5;
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
// TPU 70A pad in the slot's floor that holds the Kobo: length, width,
// thickness, how deep it sits in the floor, and where (above the slot's
// bottom)
kobo_pad_length = 22;
kobo_pad_width = 12;
kobo_pad_t = 1.8;
kobo_pad_recess = 1;
kobo_pad_y_in_slot = 19;
// The back cover's seal: PCTG either side of the groove, the gasket's walls
// and slot, the groove's depth and the gasket's floor, the tongue's width
// and length, and the side squeeze (per side)
seal_wall = 1.2;
gasket_wall = 1.2;
gasket_slot = 1.2;
groove_depth = 2.5;
gasket_floor = 0.4;
tongue_len = 2;
seal_squeeze = 0.2;
// Chamfer round the cover's outer edge
cover_chamfer = 1;
// TPU USB-C plug: its fit in the opening, how deep it goes in, and its
// flange and pull tab
usbc_plug_fit = 0.3;
usbc_plug_depth = 3;
usbc_plug_flange = 1.5;
usbc_plug_flange_t = 1.2;
// TPU washers under the SMAs' outer nuts
sma_washer_od = 11;
sma_washer_t = 1.2;
// Rounding on the grip's outside edges; the bottom edges' rounds turn into
// 45° at the bed. The lip's end and the floor's front edge get a smaller one.
edge_round = 3;
lip_round = 1.5;
// Finger indents up both sides: pitch, flat between indents, depth
indent_pitch = 15;
indent_land = 2;
indent_depth = 1.5;
// Zip-tie bars: the tie's slot (width, thickness), the bar over it, and its
// length along the tie
tie_w = 4;
tie_t = 2;
tie_roof = 1.5;
tie_bar = 4;
// Room above the top tie bar for the tie to turn
tie_turn = 2.5;
// M3 cap screws: pilot for self-tapping, clearance, counterbore
pilot_d = 2.5;
clear_d = 3.4;
head_d = 6.2;
head_depth = 3.2;
// Material left under a counterbore
head_floor = 1.3;
// The cover's screws are M3x8: how deep their pilots go below its inner
// face, how far in from the edges they sit, and their spacing round the
// edge
screw_depth = 7.2;
screw_inset = 4.1;
screw_pitch = 20;
// END_PARAMS

eps = 0.01;

// The slot, over the Kobo's whole outline (only the chin's end is in the grip)
pocket_l = kobo_length + 2 * tolerance;
pocket_w = kobo_width + 2 * tolerance;
pocket_t = kobo_thickness + tolerance;
pocket_x1 = pocket_l;
pocket_y0 = bottom_wall;

// Depths from the front face: the skin, the display, the Kobo, the floor
display_back_z = bezel_thickness + bezel_gasket + display_panel + display_pcb + display_parts + 0.3;
kobo_front_z = display_back_z + display_wall;
kobo_back_z = kobo_front_z + pocket_t;
floor_back_z = kobo_back_z + floor_thickness;

case_w = pocket_w + wall + bottom_wall;
display_y = pocket_y0 + display_y_in_slot;

// The grip's front, over the chin, starts window_margin short of the screen
lip_x0 = tolerance + screen_left + screen_width + window_margin;

// The display's pocket: in front of the chin, a wall between it and the
// Kobo. The display goes in from the front and a bezel screws on over it.
display_x0 = lip_x0 + 3;
display_x1 = display_x0 + display_width + 0.4;
display_y1 = display_y + display_length + display_fpc + 0.4;
bezel_x0 = display_x0 - bezel_shoulder;
bezel_x1 = display_x1 + bezel_shoulder;
bezel_y0 = display_y - bezel_end;
bezel_y1 = display_y1 + bezel_end;
// Its screws, one in each corner, above and below the pocket; each head
// sinks into a pad behind the bezel, on a seat cut into the grip
bezel_pad_h = bezel_head_floor + bezel_head_depth;
bezel_pad_d = bezel_head_d + 3;
bezel_screws = [for (x = [bezel_x0 + bezel_pad_d / 2 + 0.5, bezel_x1 - bezel_pad_d / 2 - 0.5],
                     y = [bezel_y0 + bezel_end / 2, bezel_y1 - bezel_end / 2]) [x, y]];
bezel_screw_depth = kobo_front_z - 0.5 - bezel_pad_h - bezel_gasket;

tube_d = cell_bore + 2 * tube_wall;
ledge_x = pocket_x1 + right_ledge;          // the cell's bore starts here
tube_x = ledge_x + cell_bore / 2;
tube_z = tube_d / 2;
// The back cover's seal band, in from the grip's back edge: the groove, its
// walls, the gasket's slot, and the tongue
groove_w = 2 * gasket_wall + gasket_slot;
// The screws' lane, then the groove: the rim round the back is the lane,
// the groove and a wall either side of it
seal_lane = screw_inset + pilot_d / 2;
rim_w = seal_lane + 2 * seal_wall + groove_w;
tongue_in = seal_wall + gasket_wall - seal_squeeze;
tongue_w = gasket_slot + 2 * seal_squeeze;
cover_thickness = head_floor + head_depth;
// The right side stands off from the bore by the seal's rim
case_l = ledge_x + cell_bore + rim_w;
side_out = case_l - tube_x - tube_d / 2;

// The second SMA, behind the Kobo near the top-left corner; its hex sinks
// into the floor, 0.4 mm off the Kobo, flats front and back
hex_r = sma_hex / 2 / cos(30);
sma2_z = kobo_back_z + 0.4 + sma_hex / 2;
// Where its hex comes under the back's seal band, a boss lifts the band
// clear: up to the hex's top plus a wall and the groove. The cover keeps
// seal_wall over the boss.
sma2_lift = sma2_z + sma_hex / 2 + 0.8 + groove_depth;

// The grip's back, the cover's inner face: deep enough for the cylinder,
// the XIAOs and a tie over them, and the second SMA's boss under the cover
split_z = max(tube_d, floor_back_z + xiao_height + tie_thickness,
              sma2_lift - (cover_thickness - seal_wall));
back_z = split_z + cover_thickness;
sma2_bump_h = max(0, sma2_lift - split_z);

// The grip's inner end: a quarter round from the floor up to its back, then
// the seal's rim, solid
thick_x0 = tube_x - tube_d / 2 - thick_width;
end_r = split_z - floor_back_z;
back_x0 = thick_x0 + end_r;               // where the back face starts
tub_x0 = back_x0 + rim_w;

// SMA mounts: the jack's hex under the top wall, the nut on top
hex_y1 = case_w - wall;
hex_y0 = hex_y1 - sma_hex_depth;
cell_y1 = bottom_wall + cell_bay_length;
cone_h = cell_bore / 2 - cell_stop_r;

// The second SMA sits right of the top-left screw: its boss clears the
// screw's head. The jack goes up through its block from below.
sma2_x = back_x0 + screw_inset + head_d / 2 + 0.5 + sma2_bump_h + 1 + hex_r;
sma2_block_x1 = sma2_x + hex_r + 2;

// The charger: in a pocket in the ledge, its USB-C end against the right
// wall, just above the cell. It sits low enough that its port's opening
// stays clear of the back's seal.
charger_x1 = ledge_x + cell_bore;
charger_x0 = charger_x1 - charger_length;
charger_y0 = cell_y1 + 1.5;
charger_port_z = split_z - groove_depth - seal_wall - charger_port_h / 2;
charger_z = charger_port_z - 1.6 - charger_pcb;
// The pocket's end wall takes the plug's push
charger_stop = charger_x0 - pocket_x1;
// A tie across it, where it lies on the floor
charger_tie_x = (charger_x0 + ledge_x) / 2;

// The cover's screws: a lane round the whole edge, outside the seal, about
// screw_pitch apart, corners included. They keep clear of the second SMA's
// boss (the cover is thin over it) and of the USB-C's opening. Each head
// sinks into the cover.
function spaced(a, b) = let (n = max(1, ceil((b - a) / screw_pitch))) [for (i = [0 : n]) a + (b - a) * i / n];
s_i = screw_inset;
screw_xl = back_x0 + s_i;
screw_xr = case_l - s_i;
sma2_clear = hex_r + 1 + sma2_bump_h + head_d / 2 + 0.5;
port_clear = charger_port_w / 2 + usbc_plug_flange + pilot_d / 2 + 1;
port_y = charger_y0 + charger_width / 2;
screws = concat(
  [for (y = spaced(s_i, case_w - s_i)) [screw_xl, y]],
  [for (y = concat(spaced(s_i, port_y - port_clear), spaced(port_y + port_clear, case_w - s_i))) [screw_xr, y]],
  [for (x = spaced(screw_xl, screw_xr)) if (x > screw_xl + 1 && x < screw_xr - 1) [x, s_i]],
  [for (x = concat(spaced(screw_xl, sma2_x - sma2_clear), spaced(sma2_x + sma2_clear, screw_xr)))
    if (x > screw_xl + 1 && x < screw_xr - 1) [x, case_w - s_i]]);
tie_top_y = case_w - rim_w - (split_z - floor_back_z) - tie_turn - tie_bar;

// XIAOs stand on end on the floor behind the chin, left of the charger,
// stacked down from under the second SMA's mount
xiao_x1 = charger_x0 - charger_stop - xiao_margin;
xiao_x0 = xiao_x1 - xiao_width;
xiao_xc = (xiao_x0 + xiao_x1) / 2;
// Tie bars above and below the stack; the top one under the top-middle
// screw's boss
tie_h = tie_t + tie_roof;
xiao_top = min(hex_y0 - max(0, sma2_block_x1 - xiao_x0) - xiao_margin, tie_top_y - 0.5);
xiao_y0s = [for (i = [1 : xiao_count]) xiao_top - i * xiao_length - (i - 1) * xiao_margin];

// Zip-tie bars: [x of the slot's centre, y of the bar's bottom]. A tie runs
// under a pair of bars and over what lies between them.
tie_bars = [[xiao_xc, xiao_y0s[xiao_count - 1] - 0.5 - tie_bar],
            [xiao_xc, tie_top_y],
            [charger_tie_x, charger_y0 - 0.5 - tie_bar],
            [charger_tie_x, charger_y0 + charger_width + 0.5]];

usb_case_y = pocket_y0 + tolerance + usb_y;
kobo_pad_x0 = thick_x0 + 4;
kobo_pad_y0 = pocket_y0 + kobo_pad_y_in_slot;
usb_z = kobo_front_z + kobo_thickness / 2;
button_case_y = pocket_y0 + tolerance + power_button_y;


assert(sma2_z + sma_hex / 2 <= split_z + 0.01, "the second SMA's hex stands out of the grip's back");
assert(sma2_bump_h <= cover_thickness - seal_wall + 0.01, "the second SMA's boss comes through the cover");
assert(charger_z >= tube_z + 1, "the charger sits too low for its platform");
assert(floor_thickness - kobo_pad_recess >= 0.8, "the Kobo pad's recess leaves too thin a floor");
assert(screw_depth <= split_z - kobo_back_z - 0.5, "the cover's screws break into the slot");
assert(bottom_wall >= rim_w, "the bottom wall is thinner than the seal's rim");
assert(tie_bars[0][1] >= bottom_wall + 1, "the XIAO stack runs into the bottom wall");
assert(display_x1 + 1 <= ledge_x, "the display runs into the cylinder");
assert(bezel_y0 >= edge_round && bezel_y1 <= case_w - edge_round, "the bezel runs onto the grip's rounded ends");
assert(bezel_x0 >= lip_x0 + lip_round, "the bezel runs onto the rounded edge by the screen");
assert(bezel_screw_depth >= 4, "the bezel's screws have too little to bite");
assert(display_y + 8 <= usb_case_y - usb_body_w / 2 - 0.5, "the display's wire channel runs into the micro USB plug");
assert(charger_tie_x - tie_w / 2 - 2 >= xiao_x1 + charger_stop, "the charger's tie bars run into the XIAOs");
assert(charger_tie_x + tie_w / 2 + 2 <= ledge_x, "the charger's tie bars run into the cell's bore");
assert(tie_bar >= tie_h, "a tie bar's underside is steeper than 45°");
assert(charger_y0 + charger_width <= hex_y0 - cell_bore - 0.5, "the charger runs into the first SMA's mount");
assert(ledge_x - (pocket_x1 + usb_end_wall + usb_body_t) >= 1.5, "the micro USB pocket breaks into the cell's bore");
assert(abs(usb_case_y - button_case_y) >= (usb_body_w + button_relief) / 2 + 1, "the micro USB plug runs into the power button");
assert(thick_x0 < lip_x0, "the floor behind the Kobo must reach further in than the lip");
assert(hex_y0 - cell_bore - cell_y1 - cone_h - cell_stop >= 10,
       "no room above the cell for the first SMA's pigtail");


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
    translate([tube_x + side_out, tube_z]) circle(d = tube_d);
    translate([tube_x + side_out + tube_d / 2 * (sqrt(2) - 1), 0]) square(eps);
    translate([case_l - eps, split_z - eps]) square(eps);
  }
}

// The grip's outside before the Kobo's notch: the outline and plan shrunk
// by edge_round (except at the back), then grown again by a round tool. The
// tool is a half ball with no reach behind, so the back meets the cover
// square, and with a 45° cone below, so the bottom edges print.
module rounding_tool() {
  hull() {
    intersection() {
      sphere(r = edge_round, $fn = 24);
      translate([-edge_round, -edge_round, -edge_round]) cube([2 * edge_round, 2 * edge_round, edge_round]);
    }
    translate([0, -edge_round * sqrt(2), -eps]) cube(eps, center = true);
  }
}

module grip_core() {
  intersection() {
    along_y(edge_round * sqrt(2), case_w - edge_round) intersection() {
      offset(delta = -edge_round) hull() {
        thick_outline_2d();
        translate([0, edge_round]) thick_outline_2d();
      }
      translate([-1, -1]) square([case_l + 2, split_z + 1]);
    }
    translate([0, 0, -1]) linear_extrude(split_z + 2) offset(delta = -edge_round) case_plan();
  }
}

module grip_body() { minkowski() { grip_core(); rounding_tool(); } }

// The Kobo in front of the floor, left of the lip, isn't the grip's. The
// lip's end and the floor's front edge are rounded.
module notch_2d() {
  translate([thick_x0 - 1, -1]) square([lip_x0 - thick_x0 + 1, kobo_back_z + 1]);
  translate([lip_x0 - eps, -1]) difference() {
    square([lip_round + eps, lip_round + 1]);
    translate([lip_round + eps, lip_round + 1]) circle(r = lip_round);
  }
  translate([thick_x0 - 1, kobo_back_z - eps]) difference() {
    square([lip_round + 1, lip_round + eps]);
    translate([lip_round + 1, lip_round + eps]) circle(r = lip_round);
  }
}

// Finger indents up both sides: shallow scallops across the right side's
// depth, and across the inner end where the fingertips reach round it. They
// stop short of the back's seal.
module indent_cuts() {
  n = floor((case_w - 2 * edge_round) / indent_pitch);
  y0 = (case_w - n * indent_pitch) / 2;
  c = indent_pitch - indent_land;
  r = (c * c / 4 + indent_depth * indent_depth) / (2 * indent_depth);
  for (i = [0 : n - 1], x = [case_l + r - indent_depth, thick_x0 - r + indent_depth])
    translate([x, y0 + (i + 0.5) * indent_pitch, -1])
      cylinder(r = r, h = split_z - groove_depth - seal_wall + 1, $fn = 180);
}

// The tub's inside: behind the floor, in from the seal's rim at the inner
// end, open at the back; over the cell above its axis; and the cell's bore
module tub_2d() {
  translate([tub_x0, floor_back_z]) square([ledge_x - tub_x0, split_z]);
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

// The second SMA: a block hung off the inner end's rim, the hex through it
// so the jack goes up from below
module sma2_block() {
  hung_block(sma2_block_x1 - tub_x0) {
    intersection() {
      thick_outline_2d();
      translate([thick_x0, floor_back_z]) square([sma2_block_x1 - thick_x0, split_z]);
    }
    intersection() {
      thick_outline_2d();
      translate([thick_x0, floor_back_z]) square([tub_x0 - thick_x0, split_z]);
    }
  }
}

module sma2_cuts() {
  along_y(hex_y0 - (sma2_block_x1 - tub_x0) - 1, hex_y1) translate([sma2_x, sma2_z]) circle(r = hex_r, $fn = 6);
  along_y(hex_y1 - 1, case_w + 1) translate([sma2_x, sma2_z]) circle(d = sma_hole);
}

// The boss over the second SMA, its flanks 45°, d out from its surface: the
// top over the hex and a wall either side, from in front of the seal band
// to past the top
module sma2_bump(d = 0) {
  e = d * (sqrt(2) - 1);
  x0 = sma2_x - hex_r - 1;
  x1 = sma2_x + hex_r + 1;
  y0 = case_w - rim_w - 0.5;
  hull() {
    translate([x0 - sma2_bump_h - e, y0 - sma2_bump_h - e, split_z + d - eps])
      cube([x1 - x0 + 2 * (sma2_bump_h + e), case_w + 5 - y0 + sma2_bump_h + e, eps]);
    translate([x0 - e, y0 - e, split_z + sma2_bump_h + d - eps]) cube([x1 - x0 + 2 * e, case_w + 5 - y0 + e, eps]);
  }
}

// Everything in front of the back's seal face, d out from it
module back_region(d = 0) {
  translate([-1, -1, -1]) cube([case_l + 2, case_w + 2, split_z + d + 1]);
  if (sma2_bump_h > 0) sma2_bump(d);
}

// The seal's plan: the grip's back face in from the screws' lane
module seal_plan() { offset(delta = -seal_lane) cover_plan(); }

// A band of the seal's plan from in0 to in1 in from its edge
module seal_band(in0, in1) {
  difference() {
    offset(delta = -in0) seal_plan();
    offset(delta = -in1) seal_plan();
  }
}

// The PCTG rim round the back: the screws' lane and the groove with its walls
module rim_2d() {
  difference() {
    cover_plan();
    offset(delta = -rim_w) cover_plan();
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

module bezel_plan(grow = 0) {
  translate([bezel_x0 - grow, bezel_y0 - grow])
    rounded_rect(bezel_x1 - bezel_x0 + 2 * grow, bezel_y1 - bezel_y0 + 2 * grow, bezel_round + grow);
}

// The bezel's recess and seats, the display's pocket (its top a 30 mm
// bridge as it prints), and a channel at its bottom end, behind the board,
// for its wires: back through the ledge to the tub
module display_cuts() {
  translate([0, 0, -1]) linear_extrude(bezel_thickness + bezel_gasket + 1) bezel_plan(0.2);
  translate([display_x0, display_y, bezel_thickness + bezel_gasket - eps])
    cube([display_x1 - display_x0, display_y1 - display_y, display_back_z - bezel_thickness - bezel_gasket + eps]);
  translate([pocket_x1 + 0.5, display_y + 0.5, display_back_z - display_parts])
    cube([display_x1 - pocket_x1 - 1.5, 7, floor_back_z]);
  for (p = bezel_screws) translate([p[0], p[1], 0]) {
    linear_extrude(bezel_pad_h + bezel_gasket + 0.2) octagon(bezel_pad_d / 2 + 0.3);
    translate([0, 0, bezel_pad_h]) cylinder(d = bezel_pilot_d, h = bezel_screw_depth);
  }
}

// The bezel in the depth frame: a plate over the display's pocket with the
// window over the panel's active area, bevelled out, and a pad behind each
// screw head
module bezel_shape() {
  vl = display_view_length + 2 * display_view_margin;
  vw = display_view_width + 2 * display_view_margin;
  difference() {
    union() {
      linear_extrude(bezel_thickness) bezel_plan();
      for (p = bezel_screws) translate([p[0], p[1], 0]) linear_extrude(bezel_pad_h + bezel_gasket) octagon(bezel_pad_d / 2);
    }
    translate([(display_x0 + display_x1) / 2, (display_y + display_y1 - display_fpc) / 2, 0]) hull() {
      translate([0, 0, bezel_thickness / 2]) cube([vw, vl, bezel_thickness + 2 * eps], center = true);
      translate([0, 0, -eps]) cube([vw + 2 * bezel_thickness, vl + 2 * bezel_thickness, eps], center = true);
    }
    for (p = bezel_screws) translate([p[0], p[1], -1]) {
      cylinder(d = bezel_clear_d, h = bezel_pad_h + 2);
      cylinder(d = bezel_head_d, h = bezel_head_depth + 1);
    }
  }
}

module button_relief_cut() {
  translate([pocket_x1 - eps, button_case_y - button_relief / 2, kobo_front_z + 1])
    cube([button_relief_depth, button_relief, pocket_t - 2]);
}

// The charger's USB-C through the right side
module charger_port_cut() {
  translate([charger_x1 - 1, charger_y0 + charger_width / 2, charger_port_z])
    rotate([0, 90, 0]) linear_extrude(case_l - charger_x1 + 2)
      offset(r = 2) offset(delta = -2) square([charger_port_h, charger_port_w], center = true);
}

// The charger's pocket in the ledge, down to where it sits
module charger_pocket_cut() {
  translate([charger_x0, charger_y0, charger_z]) cube([ledge_x - charger_x0 + eps, charger_width, split_z]);
}

// Under the charger's free end, across the bore: a bridge between the ledge
// and the right wall, its top level with the pocket's floor
module charger_platform() {
  translate([ledge_x - eps, charger_y0, tube_z - 1])
    cube([cell_bore + 2 * eps, charger_width, charger_z - tube_z + 1]);
}

// A bar on the floor with a slot under it for a zip tie. Its underside
// rises at 45°, so it prints standing up; the slot runs straight up.
module tie_bars() {
  for (b = tie_bars)
    translate([b[0] - tie_w / 2 - 2, 0, 0]) rotate([90, 0, 90]) linear_extrude(tie_w + 4)
      polygon([[b[1], floor_back_z - eps], [b[1] + tie_bar, floor_back_z - eps],
               [b[1] + tie_bar, floor_back_z + tie_h], [b[1] + tie_h, floor_back_z + tie_h]]);
}

module tie_slots() {
  for (b = tie_bars)
    translate([b[0] - tie_w / 2, b[1] - 1, floor_back_z - eps]) cube([tie_w, tie_bar + 2, tie_t]);
}

// The Kobo pad's recess in the slot's floor; it doesn't go through, so the
// tub stays sealed
module kobo_pad_cut() {
  translate([kobo_pad_x0 - 0.2, kobo_pad_y0 - 0.2, kobo_back_z - eps])
    cube([kobo_pad_length + 0.4, kobo_pad_width + 0.4, kobo_pad_recess + eps]);
}

module screw_cuts() {
  for (p = screws) translate([p[0], p[1], split_z - screw_depth]) cylinder(d = pilot_d, h = screw_depth + 1);
}

// The back's seal rim, solid from the floor to the back face, its top band
// (under the top wall) hung off the floor at 45°
module seal_rim() {
  h = split_z - floor_back_z;
  translate([0, 0, floor_back_z - eps]) linear_extrude(h + eps) rim_2d();
  intersection() {
    translate([tub_x0, 0, 0]) rotate([90, 0, 90]) linear_extrude(ledge_x - tub_x0)
      polygon([[case_w - rim_w - h, floor_back_z - eps], [case_w - wall, floor_back_z - eps],
               [case_w - wall, split_z], [case_w - rim_w, split_z]]);
    along_y(0, case_w) thick_outline_2d();
  }
}

// The groove for the gasket, following the back face over the SMA's boss
module seal_groove_cut() {
  intersection() {
    translate([0, 0, -1]) linear_extrude(back_z + 10) seal_band(seal_wall, seal_wall + groove_w);
    difference() {
      back_region(eps);
      back_region(-groove_depth);
    }
  }
}

// The grip in the depth frame
module grip_shape() {
  difference() {
    union() {
      intersection() {
        union() {
          difference() {
            grip_body();
            along_y(-1, case_w + 1) notch_2d();
            along_y(bottom_wall, case_w - wall) tub_2d();
          }
          sma1_block();
          sma2_block();
          seal_rim();
          charger_platform();
          tie_bars();
        }
        grip_body();
      }
      if (sma2_bump_h > 0) intersection() {
        sma2_bump();
        translate([0, 0, split_z - eps]) linear_extrude(sma2_bump_h + 1) cover_plan();
      }
    }
    charger_pocket_cut();
    // the slot the Kobo's chin slides into
    translate([-1, pocket_y0, kobo_front_z]) cube([pocket_x1 + 1, pocket_w, pocket_t]);
    display_cuts();
    sma1_cuts();
    sma2_cuts();
    usb_cuts();
    button_relief_cut();
    charger_port_cut();
    kobo_pad_cut();
    screw_cuts();
    tie_slots();
    indent_cuts();
    seal_groove_cut();
  }
  cell_stop();
}

// The cover's plan: the grip's back face
module cover_plan() {
  projection(cut = true) translate([0, 0, -split_z + 0.05]) grip_body();
}

// The cover in the depth frame: a plate on the grip's back with a 45°
// chamfer round its outer edge, a pocket over the SMA's boss, and the
// tongue that presses into the gasket, its tip narrowed to lead it in. Each
// screw head sinks into it.
module cover_shape() {
  difference() {
    union() {
      difference() {
        hull() {
          translate([0, 0, split_z]) linear_extrude(back_z - split_z - cover_chamfer) cover_plan();
          translate([0, 0, back_z - eps]) linear_extrude(eps) offset(delta = -cover_chamfer) cover_plan();
        }
        back_region();
      }
      intersection() {
        translate([0, 0, -1]) linear_extrude(back_z + 10) seal_band(tongue_in, tongue_in + tongue_w);
        difference() { back_region(eps); back_region(-(tongue_len - 0.5)); }
      }
      intersection() {
        translate([0, 0, -1]) linear_extrude(back_z + 10) seal_band(tongue_in + 0.25, tongue_in + tongue_w - 0.25);
        difference() { back_region(eps); back_region(-tongue_len); }
      }
    }
    for (p = screws) translate([p[0], p[1], 0]) {
      cylinder(d = clear_d, h = back_z + 1);
      translate([0, 0, back_z - head_depth]) cylinder(d = head_d, h = head_depth + 1);
    }
  }
}

// The back's gasket: TPU 85A, a U-section ring in the groove, its slot
// narrower than the tongue. Printed flat; over the SMA's boss it stretches
// up the 45° flanks.
module back_gasket() {
  difference() {
    linear_extrude(groove_depth) seal_band(seal_wall + 0.05, seal_wall + groove_w - 0.05);
    translate([0, 0, gasket_floor]) linear_extrude(groove_depth) seal_band(seal_wall + gasket_wall, seal_wall + gasket_wall + gasket_slot);
  }
}

// The bezel's gasket: TPU 70A, a frame between the bezel and the panel's
// border and the pocket's shoulder, inside the bezel's screws
module bezel_gasket() {
  vl = display_view_length + 2 * display_view_margin;
  vw = display_view_width + 2 * display_view_margin;
  linear_extrude(bezel_gasket_free) difference() {
    translate([bezel_x0 + 0.3, display_y - 1.5]) rounded_rect(bezel_x1 - bezel_x0 - 0.6, display_y1 - display_y + 3, 1);
    translate([(display_x0 + display_x1) / 2 - vw / 2 - 0.3, (display_y + display_y1 - display_fpc) / 2 - vl / 2 - 0.3])
      square([vw + 0.6, vl + 0.6]);
  }
}

// TPU 85A plug for the USB-C: a core a fit over the opening, its tip
// narrowed to lead in, a flange outside, and a pull tab
module usbc_plug() {
  module port(grow) offset(r = 2 + grow) offset(delta = -2) square([charger_port_w, charger_port_h], center = true);
  linear_extrude(usbc_plug_flange_t) port(usbc_plug_flange);
  translate([0, 0, usbc_plug_flange_t - eps]) hull() {
    linear_extrude(usbc_plug_depth - 0.5) port(usbc_plug_fit);
    linear_extrude(usbc_plug_depth) port(usbc_plug_fit - 0.5);
  }
  translate([charger_port_w / 2 + usbc_plug_flange - 1, -3, 0]) cube([8, 6, usbc_plug_flange_t]);
}

module sma_washer() {
  linear_extrude(sma_washer_t) difference() { circle(d = sma_washer_od); circle(d = sma_hole); }
}

module kobo_pad() { cube([kobo_pad_length, kobo_pad_width, kobo_pad_t]); }

// Print frames. The grip stands on its bottom end, front face toward -Y;
// the cover lies outer face down, pads up.
module grip() { rotate([90, 0, 0]) translate([-thick_x0, 0, 0]) grip_shape(); }
module cover() { translate([-thick_x0, 0, back_z]) mirror([0, 0, 1]) cover_shape(); }
module bezel() { translate([-bezel_x0, -bezel_y0, 0]) bezel_shape(); }

// Assembly: the depth frame mirrored in Z, so the front face is at z = 0,
// facing +Z. The cover can stand off behind (explode) to show the inside.
module grip_assembled() { mirror([0, 0, 1]) grip_shape(); }
module cover_assembled(explode = 0) { translate([0, 0, -explode]) mirror([0, 0, 1]) cover_shape(); }
module bezel_assembled(explode = 0) { translate([0, 0, explode]) mirror([0, 0, 1]) bezel_shape(); }

// The assembly stood up for the preview: antenna up (+Z), screen facing -Y
module upright() { rotate([90, 0, 0]) children(); }

module rounded_rect(l, w, r) {
  translate([r, r]) offset(r) square([l - 2 * r, w - 2 * r]);
}

// Reference: the Kobo, an 18650, the boards, the plug, and the SMA
// bulkheads with a stub of antenna each
module kobo() {
  translate([tolerance, pocket_y0 + tolerance, -kobo_front_z - kobo_thickness])
    linear_extrude(kobo_thickness)
      rounded_rect(kobo_length, kobo_width, kobo_corner_radius);
}

module kobo_screen() {
  translate([tolerance + screen_left, pocket_y0 + tolerance + screen_bottom, -kobo_front_z])
    cube([screen_width, screen_height, 0.2]);
}

module cell() {
  translate([tube_x, bottom_wall + 1, -tube_z]) rotate([-90, 0, 0]) cylinder(d = 18.4, h = 65);
}

module xiaos() {
  for (y0 = xiao_y0s)
    translate([xiao_x0, y0, -floor_back_z - 1.2]) {
      cube([xiao_width, xiao_length, 1.2]);
      translate([2, 1, -2.3]) cube([xiao_width - 4, xiao_length - 6, 2.3]);
    }
}

module charger() {
  translate([charger_x0, charger_y0, -charger_z - charger_pcb]) {
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

// The e-paper: its board, and the panel on the board's front
module display_board() {
  translate([display_x0 + 0.2, display_y + 0.2, -display_back_z + 0.3])
    cube([display_width, display_length, display_pcb + display_parts]);
}

module display_panel_ref() {
  translate([display_x0 + 0.7, display_y + 0.2 + (display_length - 59.2) / 2, -bezel_thickness - bezel_gasket - display_panel])
    cube([29.2, 59.2, display_panel]);
}

module sma_antennas() {
  sma_antenna(tube_x, tube_z);
  sma_antenna(sma2_x, sma2_z);
}
