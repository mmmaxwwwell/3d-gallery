// BEGIN_DESCRIPTION
// A four-lane filament spool roller stand for a dry box, sized around
// the Bambu Lab 200 mm spool and a 300 x 200 x 240 mm interior.
//
// Every lane runs its own pair of rollers on its own pegs, so four
// spools unwind independently. The walls between lanes do the work the
// standups used to: a 608 is pressed into each end of a roller, a peg
// through the wall carries the rollers either side of it, and a shoulder
// on the peg holds each roller off the flat wall.
//
// The roller spacing is solved, not chosen. Given a spool diameter and
// how high off the floor you want the spool to sit, there is exactly one
// roller separation that puts it there, so the stance comes out as wide
// as the geometry allows.
//
// Filament leaves the bottom of a spool into a PTFE tube whose mouth is
// held by a clip just behind the spool, clear of it, and runs straight
// back along a groove through loops, under the back roller, to a second
// clip behind it, where it leaves the tile for a push-fit bulkhead in the
// back wall of the box. A drilling template marks the four bulkhead
// holes at the lane centres.
//
// The floor splits into one dovetailed tile per lane so it fits a
// 220 mm bed, and screw pads through the lattice let the whole stand be
// fixed down.
// END_DESCRIPTION

// BEGIN_PARAMS
// Outer diameter of the spool's flanges (mm). A Bambu Lab spool is 200.
spool_diameter = 200;

// Overall width of the spool across both flanges (mm).
spool_width = 60;

// How far the lowest point of the spool sits above the floor (mm). This
// is what sets the roller spacing: the lower you ask for, the wider the
// rollers have to stand, and the deeper the stand gets.
ground_clearance = 8;

// Lanes in the stand. One spool, two rollers and one floor tile each.
lanes = 4;

// Side-to-side slack between a spool and the wall of its lane (mm). The
// roller flange's taper fills exactly this gap, so a spool dropped in
// meets a slope toward the middle rather than a gap beside the roller.
// It also sets how tall the flange can be — see flange_taper_angle.
lane_slack = 2;

// Thickness of a wall between lanes (mm). It carries the pegs, the beam
// joint and the floor joint.
wall_thickness = 8;

// How far a peg's shoulder holds each bearing off the wall face (mm). It
// bears on the bearing's inner race only, so the roller turns clear of the
// flat wall beside it.
peg_shoulder = 0.5;

// How high the front of a wall reaches, as a fraction of the spool
// diameter above the spool's lowest point. It catches a spool coming
// down from the front. The back has no setting: it rises as far as the
// beam it carries, and the beam goes wherever it clears a seated spool.
wall_front_fraction = 0.35;

// Height of the low point between the front and back of a wall, above
// the floor tiles (mm). The middle needs no guiding; this ties the two
// ends together along the floor.
wall_trough_height = 30;

// Diameter of the roller's running surface (mm) — the part the spool
// sits on. It has to clear the bearing pocket, so it cannot go much
// under the bearing's outer diameter plus 8.
roller_diameter = 30;

// Angle of the flange taper off the roller's axis (degrees). Rollers
// print on end, so this is the overhang the top flange prints at, measured
// from vertical — keep it at or under about 45. The taper runs across
// lane_slack, so the flange stands lane_slack * tan(angle) proud of the
// running surface: a taller flange needs a wider lane.
flange_taper_angle = 40;

// Gap between the lowest point of a roller — the underside of its
// flanges — and the top of the floor (mm). The whole roller clears the
// tile, so the tile needs no relief cut for it.
roller_clearance = 2;

// Thickness of the floor tiles (mm).
base_height = 5;

// Depth of the stand, front to back (mm). Has to clear the rollers and
// fit the box.
base_depth = 196;

// Across-flats size of one lattice cell (mm). Used by the tiles and the
// walls.
hex_size = 12;

// Wall left between neighbouring lattice cells (mm).
hex_wall = 2;

// Clearance kept between the spool and the top of the lattice floor
// (mm). Anything the spool would come closer than this to is opened up
// as a slot, which at the default ride height means nothing is.
panel_clearance = 2;

// Outer diameter of the bearings (mm). 608 = 8 x 22 x 7.
bearing_outer_diameter = 22;

// Bore of the bearings (mm), which is also the peg diameter.
bearing_inner_diameter = 8;

// Width of the bearings (mm).
bearing_width = 7;

// Interference on the bearing pocket in the roller (mm). The pocket is
// cut this much under the bearing's outer diameter, so the bearing
// presses in. Raise it if yours drop in loose.
bearing_fit = 0.1;

// Clearance on a peg where it enters a bearing bore (mm).
peg_fit = 0.1;

// Interference on the peg hole through a wall (mm), cut under the peg
// diameter so the peg presses in and stays put.
peg_press = 0.15;

// How far a dovetail tail reaches out of the side of a tile (mm).
dovetail_length = 8;

// Width of a dovetail tail at its root (mm) — the narrow end.
dovetail_root_width = 12;

// Width of a dovetail tail at its tip (mm) — the wide end, which is what
// stops two tiles pulling apart.
dovetail_tip_width = 18;

// Per-face clearance in the dovetail socket (mm).
dovetail_clearance = 0.25;

// Distance from the middle of a tile to each dovetail (mm). There are
// two per joint, one either side of centre.
dovetail_offset = 55;

// Length of the M3 cap screws that come up through the floor into each
// wall (mm), under the head — one at the front, one in the middle, one at
// the back. A head sinks into the floor, so what's left of the floor above
// the counterbore is the floor's share and the rest bites into the wall —
// 8 gives about 6 mm of bite. Under a centre wall the two tiles lap at
// each screw, half the floor's thickness each.
base_screw_length = 8;

// Length of the M3 cap screw that locks each wall to the beams in it
// (mm), under the head. It goes in from the back edge of the wall and
// has to reach through both hex ends.
lock_screw_length = 25;

// Where along the wall the middle floor screw goes, from the middle (mm).
base_screw_x = 0;

// Height of the V ridges along the bottom of a wall (mm). One rides in a
// groove in each tile the wall stands on, keeping the long run aligned.
wall_ridge_height = 1.2;

// Per-face clearance everywhere a wall meets the floor — the ridges and
// the laps under the floor screws (mm).
joint_fit = 0.2;

// Outer diameter of the PTFE tube (mm).
ptfe_od = 4;

// Clearance on the PTFE slot (mm).
ptfe_fit = 0.4;

// Loops holding the tube in its groove, per tile, spread between the
// back roller and the front end clip.
ptfe_clips = 3;

// Across-flats size of the hex spigot at the bottom of a beam (mm). The
// socket at the top of the next beam takes it, so the beams nest wall to
// wall into one bar across the top back of the stand.
beam_hex = 12;

// Wall thickness of the socket at the top of a beam (mm). The socket's
// outside is also the beam's outside, and what sits in the wall.
beam_socket_wall = 2.4;

// Per-face clearance in every hex fit — spigot in socket, beam in wall
// (mm).
beam_fit = 0.2;

// How far the flange at the socket end stands proud of the beam (mm).
// It sits in a 45-degree countersink in the far face of the wall, flush,
// and indexes the wall along the beam; the lock screw holds it there.
beam_flange = 3;

// Gap between a seated spool and the beam (mm).
beam_clearance = 3;

// Diameter of the locking hole through the back of each wall and both
// hex ends it passes (mm). 2.8 lets an M3 screw self-tap the whole way;
// the printed lock pin pushes in instead.
lock_hole_diameter = 2.8;

// Diameter of a screw-down hole through a tile (mm). 4.2 clears an M4.
screw_hole_diameter = 4.2;

// Diameter of the solid pad the screw hole sits in (mm).
screw_pad_diameter = 12;

// Build volume the print plates are laid out for: a cube this size (mm).
print_bed = 220;

// Interior of the dry box: width, depth, height (mm). Reference only —
// nothing is printed from these, but the stand is checked against them.
box_width = 300;
box_depth = 200;
box_height = 240;

// Thickness of the box wall, for the reference view (mm).
box_wall = 3;

// Diameter to mark for a push-fit bulkhead in the back wall (mm).
bulkhead_hole_diameter = 10;

// Height above the box floor to mark the bulkhead holes at (mm).
bulkhead_height = 25;
// END_PARAMS

// --- fixed detail dimensions, not worth a customizer slider ---

_eps = 0.01;
// How far a bearing sits below the end face of its roller.
bearing_recess = 0.2;
// Clearance on the peg where it passes through the roller's core.
peg_clearance = 0.6;
// A peg is fatter through the wall than where it carries a bearing, so
// the step between them stops the bearing's inner race, and fatter again
// at its flange, so it seats against the wall. Both land on a 608's inner
// race and stay clear of the shield.
peg_body_diameter = 10;
peg_flange_diameter = 11;
// Lead-in on the end of a peg's body, the end pushed through the wall.
peg_lead = 0.4;
// The flat rim at the very end of a roller, before the flange tapers.
// It is what keeps the flange's edge from being a knife edge.
flange_rim = 0.6;
// M3 screw holes: a pilot the screw threads into, and the clearance it
// passes through.
m3_pilot_diameter = 2.5;
m3_clearance_diameter = 3.2;
// Width along the wall of the lap where two tiles share a floor screw.
base_scarf_width = 10;
// How far the front and back floor screws sit in from the ends of a wall,
// far enough that their laps stay inside the tiles.
corner_screw_inset = 8;
// Solid margin around the lattice inside a wall, and the solid pad left
// round each peg for the roller end to run against.
wall_frame = 6;
// Radius of the rounded tip on the front of a wall. The back tip is
// sized by the beam it carries.
wall_front_tip_r = 8;
// Radius on the corners of every hex — beams and the holes they sit in.
hex_corner_r = 1.5;
// Counterbore for every M3 socket-head cap screw: a 5.5 mm head, 3 mm
// tall, sunk flush.
m3_counterbore_diameter = 6;
m3_counterbore_depth = 3.2;
// Clearance on the printed lock pin in its hole.
lock_pin_fit = 0.15;
// Reference-only spool detail: the hub tube and the flange plates.
spool_hub_diameter = 60;
spool_hub_wall = 2;
spool_flange_thickness = 2;
// How far each horn's inner edge leans in toward the middle before it
// turns down, as a fraction of the gap between the horns. Higher gives
// fatter roots.
wall_horn_spread = 0.2;
// Fillet in the inside corners of a wall's outline, and the rounding on
// its outside corners.
wall_fillet = 10;
wall_round = 3;
// The PTFE loops: wall round the tube, and length along it.
ptfe_loop_wall = 1.2;
ptfe_loop_length = 3;
// The end clips hold the tube's two ends: longer than a loop and flared
// wider at the foot. The front one is set back until its top clears the
// spool by this much, the back one tucked behind the back roller until
// it clears that by the same.
ptfe_end_clip_length = 8;
ptfe_end_clip_flare = 1.5;
ptfe_clip_clearance = 0.5;
// Thickness of the drilling templates — a sheet thin enough to lie flat
// and mark through — and the height and lip of the bulkhead one.
template_thickness = 0.5;
template_height = 50;
template_lip = 12;

// --- solved geometry ---

spool_r = spool_diameter / 2;
roller_r = roller_diameter / 2;
// A roller's end face runs this far off the wall: the peg's shoulder, less
// how far the bearing sits below the end face.
roller_end_gap = peg_shoulder - bearing_recess;
// The flange fills the lane slack beside the roller: the end gap, then
// its flat rim, then the taper running in to the edge of the spool, so
// the spool's rims land on the flat.
flange_taper = lane_slack - roller_end_gap - flange_rim;
flange_height = flange_taper * tan(flange_taper_angle);
flange_r = roller_r + flange_height;
flange_diameter = 2 * flange_r;

lane_clear = spool_width + 2 * lane_slack;
lane_pitch = lane_clear + wall_thickness;
roller_length = lane_clear - 2 * roller_end_gap;

assert(roller_end_gap >= 0.2,
       "filament-spool-roller: the roller would rub the wall — raise peg_shoulder");
assert(flange_taper > 0.5,
       "filament-spool-roller: no room left for the flange taper — raise lane_slack or cut flange_rim");
assert(roller_r > (bearing_outer_diameter - bearing_fit) / 2 + 2,
       "filament-spool-roller: no wall left around the bearing pocket — raise roller_diameter");

// Height of the peg axis. The flanges are the lowest thing on a roller,
// so they are what the clearance is measured from.
peg_z = base_height + roller_clearance + flange_r;
spool_z = ground_clearance + spool_r;

// A spool resting on two rollers has its centre (spool_r + roller_r)
// from each roller axis. That distance and the height difference fix the
// third side of the triangle, which is how far out each roller stands.
_hyp = spool_r + roller_r;
_rise = spool_z - peg_z;
assert(_rise > 0,
       "filament-spool-roller: the spool centre must sit above the peg axis — raise ground_clearance or lower the rollers");
assert(_rise < _hyp,
       "filament-spool-roller: the spool cannot sit that high on rollers this size — lower ground_clearance");
roller_x = sqrt(_hyp * _hyp - _rise * _rise);
assert(roller_x > flange_r,
       "filament-spool-roller: the rollers would overlap at the centre — lower ground_clearance");
assert(base_depth >= 2 * (roller_x + flange_r),
       "filament-spool-roller: the flanges hang off the ends of the floor — raise base_depth or ground_clearance");

// A tile gives up half a wall to each neighbour it meets and a whole one
// to each open end, so the two end tiles come out wider.
function tile_margin(share) = share ? wall_thickness / 2 : wall_thickness;
function tile_width(sm, sp) = lane_clear + tile_margin(sm) + tile_margin(sp);
// The lane is not centred in an end tile, because its two margins
// differ. Everything that has to land under the spool goes through here.
function tile_lane_y(sm, sp) = (tile_margin(sm) - tile_margin(sp)) / 2;

function tile_w(i) = tile_width(i > 0, i < lanes - 1);
function tile_offset(i) = (i == 0) ? 0 : tile_offset(i - 1) + tile_w(i - 1);

stand_width = tile_offset(lanes - 1) + tile_w(lanes - 1);

function tile_y(i) = tile_offset(i) + tile_w(i) / 2 - stand_width / 2;
function lane_y(i) = tile_y(i) + tile_lane_y(i > 0, i < lanes - 1);
function wall_y(j) = (j == 0) ? -stand_width / 2 + wall_thickness / 2
                   : (j == lanes) ? stand_width / 2 - wall_thickness / 2
                   : -stand_width / 2 + tile_offset(j);

assert(stand_width <= box_width,
       "filament-spool-roller: the stand is wider than the box — cut lane_slack, wall_thickness or lanes");
assert(base_depth <= box_depth,
       "filament-spool-roller: the stand is deeper than the box — cut base_depth");
assert(spool_z + spool_r <= box_height,
       "filament-spool-roller: the spool is taller than the box");

// Half-width of the floor slot: outside this the spool clears the
// lattice by panel_clearance, inside it does not. Zero when the spool
// never dips that low, which is the case at the default ride height.
_reach = spool_z - base_height - panel_clearance;
slot_half = (_reach >= spool_r) ? 0 : sqrt(spool_r * spool_r - _reach * _reach);

bearing_pocket_r = (bearing_outer_diameter - bearing_fit) / 2;
bearing_pocket_depth = bearing_width + bearing_recess;

// --- beams ---

function _hex_r(af) = af / sqrt(3);

beam_socket_af = beam_hex + 2 * beam_fit;
beam_af = beam_socket_af + 2 * beam_socket_wall;
beam_flange_af = beam_af + 2 * beam_flange;
// The left end wall holds only a spigot; every other wall holds a socket,
// with the next beam's spigot inside it.
beam_hole_spigot_af = beam_hex + 2 * beam_fit;
beam_hole_socket_af = beam_af + 2 * beam_fit;
// The flange cone rises as far as it steps out at the corners, so it
// stays at 45 degrees where the step is widest.
beam_flange_rise = _hex_r(beam_flange_af) - _hex_r(beam_af);
beam_length = 2 * wall_thickness + lane_clear;

assert(base_screw_length > base_height - m3_counterbore_depth + 3,
       "filament-spool-roller: the base screw would barely reach the wall — raise base_screw_length");

assert(beam_flange_rise < wall_thickness / 2,
       "filament-spool-roller: the flange countersink would reach the lock hole — cut beam_flange");

// The back tip of a wall is a circle around the beam hole with a frame's
// width of wall round it, tangent to the back edge.
wall_back_tip_r = _hex_r(beam_hole_socket_af) + wall_frame;
beam_x = -base_depth / 2 + wall_back_tip_r;
// The flange sits inside a wall, so the bar is the fattest thing on a
// beam in a lane. Stand it off a seated spool by beam_clearance and that
// fixes how high the beam goes.
_beam_reach = spool_r + beam_clearance + _hex_r(beam_af);
assert(_beam_reach > -beam_x,
       "filament-spool-roller: the beam can't clear the spool from the back of the stand — raise base_depth");
beam_z = spool_z + sqrt(_beam_reach * _beam_reach - beam_x * beam_x);

// The lock hole runs in from the back edge of the wall — counterbore,
// then the screw's length — through both hex ends across flats.
lock_hole_length = m3_counterbore_depth + lock_screw_length + 0.5;

assert(lock_hole_length > wall_back_tip_r + beam_hole_socket_af / 2,
       "filament-spool-roller: the lock screw stops short of the far side of the beam — raise lock_screw_length");
assert(lock_hole_length < 2 * wall_back_tip_r - 1,
       "filament-spool-roller: the lock screw would come out of the far side of the wall — cut lock_screw_length");

// Wall heights, measured up from the top of the floor tiles, which is
// where the wall's own frame starts.
wall_beam_y = beam_z - base_height;
wall_back_top = wall_beam_y + wall_back_tip_r;
wall_front_top = ground_clearance + wall_front_fraction * spool_diameter - base_height;
wall_peg_y = peg_z - base_height;
assert(wall_front_top > wall_peg_y + flange_r + wall_frame,
       "filament-spool-roller: the front of the wall would not clear the roller — raise wall_front_fraction");
assert(wall_back_top + base_height <= box_height,
       "filament-spool-roller: the beam would sit above the box — raise box_height or cut beam_clearance");

assert(base_depth <= print_bed && wall_back_top + base_height <= print_bed,
       "filament-spool-roller: a wall won't fit the print bed");

// A peg reaches out of the wall past its shoulder and through the bearing
// to the bearing's far face.
peg_reach = peg_shoulder + bearing_width;
peg_diameter = bearing_inner_diameter - peg_fit;
assert(peg_body_diameter > bearing_inner_diameter + 1,
       "filament-spool-roller: the peg's shoulder is too narrow to stop a bearing — raise peg_body_diameter");
assert(peg_flange_diameter > peg_body_diameter + 0.5,
       "filament-spool-roller: the peg's flange is too narrow to seat on the wall — raise peg_flange_diameter");
// Pegs print lying on a flat this far below the axis: the nearest it can
// come while the bearing shaft's underside stays within 45 degrees.
_peg_flat = peg_diameter / 2 * cos(45);

ptfe_slot_width = ptfe_od + ptfe_fit;
ptfe_r = ptfe_slot_width / 2;
// The groove is sunk half the tile's thickness, so it breaks only the top
// half of the back border and the tube stands proud under its loops.
ptfe_floor_z = base_height / 2;
ptfe_z = ptfe_floor_z + ptfe_r;
ptfe_loop_r = ptfe_r + ptfe_loop_wall;
// A teardrop's point, so the loop's ceiling closes at 45 degrees.
ptfe_loop_top = ptfe_z + ptfe_r * sqrt(2) + ptfe_loop_wall;
// A clip's top is a half-round of the loop's own radius; its centre has
// to sit on or above the tile for the sides below it to stay vertical.
_ptfe_crown_z = ptfe_loop_top - ptfe_loop_r;
assert(_ptfe_crown_z >= base_height,
       "filament-spool-roller: the clip's rounded top would dip into the tile — cut ptfe_loop_wall");

// How far along X from a cylinder's axis a clip's top first clears it:
// the cylinder's radius and its axis height.
function _ptfe_clip_clear_dx(r, axis_z) =
    let (gap = axis_z - ptfe_loop_top - ptfe_clip_clearance)
    assert(gap < r, "filament-spool-roller: an end clip clears its cylinder anywhere — nothing to tuck it against")
    sqrt(r * r - gap * gap);

// The tube's two ends are the outer faces of the end clips: the front
// as far forward as a clip that tall can go and still clear the spool's
// cylinder, the back as close behind the back roller as clears that.
ptfe_end_x = -_ptfe_clip_clear_dx(spool_r, spool_z);
ptfe_back_x = -roller_x - _ptfe_clip_clear_dx(roller_r, peg_z) - ptfe_end_clip_length;
_ptfe_end_mid = ptfe_end_x - ptfe_end_clip_length / 2;
_ptfe_back_mid = ptfe_back_x + ptfe_end_clip_length / 2;

// The flat loops stay out from under the back roller, whose running
// surface drops lower than any loop top, and share the run from there
// to the front end clip evenly.
_roller_bottom = peg_z - roller_r;
_ptfe_run_lo = -roller_x + roller_r + ptfe_loop_length / 2 + 1;
_ptfe_loop_pitch = (_ptfe_end_mid - _ptfe_run_lo) / ptfe_clips;
ptfe_loop_xs = [for (i = [0 : ptfe_clips - 1]) _ptfe_run_lo + i * _ptfe_loop_pitch];

assert(ptfe_z + ptfe_r < _roller_bottom - 1,
       "filament-spool-roller: the PTFE tube would rub the back roller — raise roller_clearance or cut ptfe_od");
assert(_ptfe_loop_pitch > ptfe_loop_length + (ptfe_end_clip_length - ptfe_loop_length) / 2 + 1,
       "filament-spool-roller: no room for the PTFE loops between the back roller and the end clip — cut ptfe_clips");

echo(str("filament-spool-roller: stand ", stand_width, " x ", base_depth,
         " mm in a ", box_width, " x ", box_depth, " box; rollers ",
         2 * roller_x, " mm apart, contact ", atan(roller_x / _rise),
         " deg off vertical"));
echo(str("filament-spool-roller: ", lanes, " lanes at ", lane_pitch,
         " mm pitch, rollers ", roller_length, " mm long, spool tops out at ",
         spool_z + spool_r, " mm"));
echo(str("filament-spool-roller: PTFE tube runs ", ptfe_back_x, " to ", ptfe_end_x,
         " mm from the spool centre, clips top out ", ptfe_loop_top,
         " mm above the box floor"));
echo(str("filament-spool-roller: ", 4 * lanes, "x 608 bearings, ",
         2 * (lanes + 1), "x pegs, ", lanes - 1, "x centre walls + 2 end walls"));

// --- lattice ---

// Honeycomb covering [0,w] x [0,h], flat. Over-generated by a ring in
// every direction and centred on the area, so clipping it to a window
// truncates cells evenly instead of eating one edge.
function _hex_centres(w, h, s, wall) =
    let (pitch_x = s + wall,
         pitch_y = pitch_x * sqrt(3) / 2,
         nx = ceil(w / pitch_x) + 2,
         ny = ceil(h / pitch_y) + 2,
         ox = (w - (nx - 1) * pitch_x) / 2,
         oy = (h - (ny - 1) * pitch_y) / 2)
    [for (j = [0 : ny - 1], i = [0 : nx - 1])
        [ox + i * pitch_x + ((j % 2 == 0) ? 0 : pitch_x / 2), oy + j * pitch_y]];

module _hex_cell(c, s) {
    translate(c) rotate(30) circle(r = _hex_r(s), $fn = 6);
}

module _hex_grid_2d(w, h, s, wall) {
    for (c = _hex_centres(w, h, s, wall)) _hex_cell(c, s);
}

module _hex_grid(w, h, depth, s, wall) {
    linear_extrude(depth) _hex_grid_2d(w, h, s, wall);
}

// A lattice cutter filling [w x h x depth], centred on the origin in X
// and Y with its Z running from 0.
module _lattice(w, h, depth) {
    intersection() {
        linear_extrude(depth) square([w, h], center = true);
        translate([-w / 2, -h / 2, 0]) _hex_grid(w, h, depth, hex_size, hex_wall);
    }
}

// The cells of that lattice in the row nearest its centre line that
// reach into [x0, x1], as centres in the lattice's centred frame. Two
// rows straddle the line when the grid has an even count, and then it
// takes both.
function _lattice_row_cells(w, h, x0, x1) =
    let (pitch_y = (hex_size + hex_wall) * sqrt(3) / 2)
    [for (c = _hex_centres(w, h, hex_size, hex_wall))
        let (x = c.x - w / 2, y = c.y - h / 2)
            if (abs(y) < pitch_y / 2 + _eps
                && x + hex_size / 2 > x0 && x - hex_size / 2 < x1) [x, y]];

// Those cells, whole, so the PTFE channel takes the one row it runs down
// instead of leaving slivers either side of it.
module _lattice_row_over(w, h, depth, x0, x1) {
    linear_extrude(depth)
        for (c = _lattice_row_cells(w, h, x0, x1)) _hex_cell(c, hex_size);
}

// --- dovetails ---

// Tail profile in plan, root on y = 0 and tip at y = dovetail_length.
// `grow` fattens it by a clearance to make the socket. Both the tail and
// the socket come from here, so the fit can only be tuned in one place.
module _dovetail_profile(grow) {
    rw = dovetail_root_width / 2 + grow;
    tw = dovetail_tip_width / 2 + grow;
    l = dovetail_length + grow;
    polygon([[-rw, -_eps], [rw, -_eps], [tw, l], [-tw, l]]);
}

module _tails(w) {
    for (s = [-1, 1])
        translate([s * dovetail_offset, w / 2, 0])
            linear_extrude(base_height)
                _dovetail_profile(0);
}

// Sockets cut inward from the -Y face to receive the previous tile's
// tails. The profile is used as-is — narrow at the face, wide inside,
// the same way round as the tail that lands in it.
module _sockets(w) {
    for (s = [-1, 1])
        translate([s * dovetail_offset, -w / 2, -_eps])
            linear_extrude(base_height + 2 * _eps)
                _dovetail_profile(dovetail_clearance);
}

// The solid round each socket that the lattice does not get to eat. A
// socket runs deeper than the border between the tile's edge and its
// lattice window, so without this its wide end opens into a cell and the
// tail has nothing to pull against.
module _socket_pads(w) {
    for (s = [-1, 1])
        translate([s * dovetail_offset, -w / 2, -2 * _eps])
            linear_extrude(base_height + 4 * _eps)
                offset(delta = hex_wall) _dovetail_profile(dovetail_clearance);
}

// --- tile features ---

// The tile's lattice window, the same in every tile.
_lattice_w = base_depth - 2 * wall_thickness;
_lattice_h = lane_clear - wall_thickness;

// The groove's section: a round floor under the tube, open to the top.
module _ptfe_groove_2d() {
    hull() {
        translate([0, ptfe_z]) circle(r = ptfe_r);
        translate([-ptfe_r, ptfe_z]) square([ptfe_slot_width, base_height - ptfe_z + _eps]);
    }
}

// Any bend the tube or the filament takes at the tile: an arc tangent to
// the groove floor that turns 45 degrees in the floor's thickness below
// it. The front scoop lifts the filament out of the mouth along it, and
// the drop takes the tube down through the floor along it.
_ptfe_45_r = ptfe_floor_z / (1 - cos(45));
_ptfe_45_run = _ptfe_45_r * sin(45);

// The back scoop is shorter and steeper: it rises to the tile top in the
// run from the mouth to the next open cell ahead of it, which is what fits
// between the back clip and the back face.
_ptfe_scoop_end = max([for (c = _lattice_row_cells(_lattice_w, _lattice_h,
                                                  -base_depth / 2, ptfe_end_x + 1))
                        c.x + hex_size / 2]) + hex_wall;
_ptfe_scoop_run = _ptfe_scoop_end - ptfe_end_x;
_ptfe_scoop_rise = base_height - ptfe_floor_z;
_ptfe_scoop_r = (_ptfe_scoop_run * _ptfe_scoop_run + _ptfe_scoop_rise * _ptfe_scoop_rise)
              / (2 * _ptfe_scoop_rise);
_ptfe_scoop_angle = asin(_ptfe_scoop_run / _ptfe_scoop_r);

// The back end scoops up the same way, so the tube can leave the tile
// behind the back roller; it has to end short of the back face.
assert(ptfe_back_x - _ptfe_scoop_run > -base_depth / 2 + 1,
       "filament-spool-roller: the back scoop runs out of the tile — raise base_depth");

// Every tile carries two routes from the one mouth, and the tube takes
// whichever suits: flat along the groove to the back, or down through the
// floor right behind the front clip, for something built underneath the
// stand. The drop's slot passes under the flat groove there, which the
// back-route tube simply spans. Its far side leaves the underside a
// slot's width behind the ramp.
_ptfe_drop_x = ptfe_end_x - ptfe_end_clip_length;
_ptfe_drop_reach = _ptfe_45_run + ptfe_slot_width * sqrt(2);

// The arc's axis runs along Y, a scoop radius above the groove floor and
// so above the tile top: sweeping the groove section out from the axis
// takes everything over the arc, and the arc ends on the tile top. It
// starts at x and runs toward +X for dir = 1, -X for dir = -1, on an arc
// of radius r through `angle` degrees.
module _ptfe_scoop_cut(y_mid, x, dir, r, angle) {
    translate([x, y_mid, ptfe_floor_z + r])
        mirror([dir < 0 ? 1 : 0, 0, 0])
            rotate([90, 0, 0])
                rotate([0, 0, -90])
                    rotate_extrude(angle = angle)
                        hull() {
                            translate([0, -ptfe_r]) square([_eps, ptfe_slot_width]);
                            translate([r - ptfe_r, 0]) circle(r = ptfe_r);
                        }
}

// The drop through the floor, in side view: open from the tile top down
// to a floor that bends from the groove's into a 45-degree ramp, and
// bounded behind by the tube's far side, a 45-degree face over it. Slot
// wide across, so nothing overhangs past 45 degrees.
module _ptfe_drop_cut(y_mid) {
    top = base_height + 1;
    far = _ptfe_drop_reach;
    knee = [for (i = [0 : 12]) let (a = 45 * i / 12)
                [-_ptfe_45_r * sin(a), ptfe_floor_z - _ptfe_45_r * (1 - cos(a))]];
    translate([_ptfe_drop_x, y_mid + ptfe_slot_width / 2, 0])
        rotate([90, 0, 0])
            linear_extrude(ptfe_slot_width)
                polygon(concat([[_eps, top], [_eps, ptfe_floor_z]], knee,
                               [[-_ptfe_45_run - 1, -1],
                                [-far - 1, -1],
                                [-far + top, top]]));
}

// The PTFE run, cut between the end clips' outer faces: a groove half
// the tile deep with a round floor under the tube, and a teardrop bore
// along it through the loops. The groove stops at the tile top so it
// never bridges a loop; the bore does the rest. Past the front end it
// scoops up to the tile top at 45 degrees and past the back one it scoops
// up behind the back clip. The drop through the floor is cut as well.
module _ptfe_run_cut(y_mid) {
    translate([ptfe_back_x, y_mid, 0])
        rotate([90, 0, 90])
            linear_extrude(ptfe_end_x - ptfe_back_x) {
                _ptfe_groove_2d();
                hull() {
                    translate([0, ptfe_z]) circle(r = ptfe_r);
                    translate([0, ptfe_z + ptfe_r * sqrt(2) - _eps]) square(2 * _eps, center = true);
                }
            }
    _ptfe_scoop_cut(y_mid, ptfe_end_x, 1, _ptfe_45_r, 45);
    _ptfe_scoop_cut(y_mid, ptfe_back_x, -1, _ptfe_scoop_r, _ptfe_scoop_angle);
    _ptfe_drop_cut(y_mid);
}

// A clip's section across the tube: vertical sides from the tile, a
// half-round top, and a foot `flare` wider each side.
module _ptfe_clip_2d(flare) {
    hull() {
        translate([-ptfe_loop_r - flare, base_height - _eps])
            square([2 * (ptfe_loop_r + flare), _eps]);
        translate([-ptfe_loop_r, base_height - _eps])
            square([2 * ptfe_loop_r, _ptfe_crown_z - base_height + _eps]);
        translate([0, _ptfe_crown_z]) circle(r = ptfe_loop_r);
    }
}

module _ptfe_clip(y_mid, x, length, flare) {
    translate([x - length / 2, y_mid, 0])
        rotate([90, 0, 90])
            linear_extrude(length) _ptfe_clip_2d(flare);
}

// The loops over the flat run, and the end clips at the tube's ends.
module _ptfe_loops(y_mid) {
    for (x = ptfe_loop_xs)
        _ptfe_clip(y_mid, x, ptfe_loop_length, 0);
    for (x = [_ptfe_back_mid, _ptfe_end_mid])
        _ptfe_clip(y_mid, x, ptfe_end_clip_length, ptfe_end_clip_flare);
}

// Where a tile is screwed down. The pads are solid islands in the
// lattice; the holes are drilled through them afterwards.
function _screw_xy(y_mid) = [
    for (x = [-1, 1], y = [-1, 1])
        [x * (base_depth / 2 - screw_pad_diameter),
         y_mid + y * (lane_clear / 2 - screw_pad_diameter / 2 - 2)]
];

module _screw_pads(y_mid) {
    for (p = _screw_xy(y_mid))
        translate([p[0], p[1], base_height / 2])
            cylinder(h = base_height + 4 * _eps, d = screw_pad_diameter,
                     center = true);
}

module _screw_holes(y_mid) {
    for (p = _screw_xy(y_mid))
        translate([p[0], p[1], -_eps])
            cylinder(h = base_height + 2 * _eps, d = screw_hole_diameter);
}

// --- wall-to-floor joint ---
//
// Drawn once, in its own frame: X along the wall as everywhere else, the
// wall's centre line on y = 0, the box floor on z = 0. The tiles and the
// wall each take their share of it — what their role adds, and what the
// other roles' shares cut out of them — so the parts can't disagree.
//
// Roles: under a centre wall, "minus" and "plus" are the tiles either side
// of the seam and "wall" is the wall; under an end wall the one tile is
// "tile".
//
// Three M3s come up through the floor into the wall at _floor_screw_xs;
// under a centre wall the two tiles lap at each one.
_floor_screw_xs = [-(base_depth / 2 - corner_screw_inset), base_screw_x,
                   base_depth / 2 - corner_screw_inset];

// A prism along X from x0 to x1 with a cross-section drawn in (y, z).
module _yz_prism(x0, x1) {
    translate([x0, 0, 0]) rotate([90, 0, 90]) linear_extrude(x1 - x0) children();
}

// The V ridges: one over each tile the wall stands on, the full depth.
function _ridge_ys(share) = share ? [-wall_thickness / 4, wall_thickness / 4] : [0];

module _ridge_2d(y, grow) {
    h = wall_ridge_height;
    // Only a cut overshoots the floor's top face; a ridge stops on it.
    top = base_height + (grow > 0 ? _eps : 0);
    offset(delta = grow)
        polygon([[y - h, top], [y + h, top], [y, base_height - h]]);
}

// The lap under a floor screw: the two tiles split the floor's
// thickness along a 45-degree plane through the screw's axis, so the
// screw passes through both and each one's share prints without support.
module _scarf_2d(role, grow) {
    h = base_height;
    g = grow * sqrt(2);
    // Only a cut overshoots the floor's faces; a share stops on them.
    e = grow > 0 ? _eps : 0;
    // Grown shares move the 45-degree face out by `grow` square to it,
    // which is g along z, and the face at the seam out by `grow`.
    if (role == "minus")
        polygon([[-grow, -e], [h / 2 + g + e, -e], [-grow, h / 2 + grow + g]]);
    else
        polygon([[grow, h + e], [-h / 2 - g - e, h + e], [grow, h / 2 - grow - g]]);
}

module _joint_add(role, share) {
    if (role == "wall")
        for (y = _ridge_ys(share))
            _yz_prism(-base_depth / 2, base_depth / 2) _ridge_2d(y, 0);
    if (share && role != "wall")
        for (x = _floor_screw_xs)
            _yz_prism(x - base_scarf_width / 2, x + base_scarf_width / 2)
                _scarf_2d(role, 0);
}

module _joint_cut(role, share) {
    if (role != "wall")
        for (y = _ridge_ys(share))
            _yz_prism(-base_depth / 2 - _eps, base_depth / 2 + _eps) _ridge_2d(y, joint_fit);
    if (share && role != "wall")
        for (x = _floor_screw_xs)
            _yz_prism(x - base_scarf_width / 2 - joint_fit, x + base_scarf_width / 2 + joint_fit)
                _scarf_2d(role == "minus" ? "plus" : "minus", joint_fit);
    // The floor screws: head sunk in the floor, clear through the rest of
    // it, pilot into the wall.
    for (x = _floor_screw_xs) translate([x, 0, 0]) {
        if (role == "wall")
            translate([0, 0, -_eps])
                cylinder(h = m3_counterbore_depth + base_screw_length + 0.5,
                         d = m3_pilot_diameter);
        else
            _m3_cap_hole(base_height - m3_counterbore_depth + _eps,
                         m3_clearance_diameter);
    }
}

// An M3 cap-screw hole running up +Z from z = 0: the head's counterbore,
// then `depth` more of a hole of diameter `d` for the thread.
module _m3_cap_hole(depth, d) {
    translate([0, 0, -_eps]) {
        cylinder(h = m3_counterbore_depth + depth + _eps, d = d);
        cylinder(h = m3_counterbore_depth + _eps, d = m3_counterbore_diameter);
    }
}

// --- public modules ---

// One floor tile.
//
//   share_minus / share_plus — whether that face meets another tile.
//   A shared face gives up half a wall channel and carries a dovetail;
//   an open end carries a whole channel and no dovetail.
//
// The tile that meets a neighbour on +Y grows the tails; the one that
// meets it on -Y carries the sockets.
module tile(share_minus = true, share_plus = true) {
    w = tile_width(share_minus, share_plus);
    y_mid = tile_lane_y(share_minus, share_plus);
    difference() {
        union() {
            difference() {
                linear_extrude(base_height)
                    square([base_depth, w], center = true);
                if (slot_half > 0)
                    translate([0, y_mid, -_eps])
                        linear_extrude(base_height + 2 * _eps)
                            square([2 * slot_half, lane_clear], center = true);
                // The same window in every tile, centred on the lane with
                // a full wall channel's border either side, so the left,
                // middle and right tiles carry an identical honeycomb.
                difference() {
                    translate([0, y_mid, -_eps])
                        _lattice(_lattice_w, _lattice_h,
                                 base_height + 2 * _eps);
                    _screw_pads(y_mid);
                    if (share_minus) _socket_pads(w);
                    translate([0, y_mid, -2 * _eps])
                        _lattice_row_over(_lattice_w, _lattice_h,
                                          base_height + 4 * _eps,
                                          ptfe_back_x - 1, ptfe_end_x + _ptfe_45_run + 1);
                }
            }
            if (share_plus) _tails(w);
            _ptfe_loops(y_mid);
            for (s = [-1, 1])
                _tile_joint(s, s < 0 ? share_minus : share_plus, w)
                    _joint_add(_tile_role(s, s < 0 ? share_minus : share_plus),
                               s < 0 ? share_minus : share_plus);
        }
        if (share_minus) _sockets(w);
        _ptfe_run_cut(y_mid);
        _screw_holes(y_mid);
        for (s = [-1, 1])
            _tile_joint(s, s < 0 ? share_minus : share_plus, w)
                _joint_cut(_tile_role(s, s < 0 ? share_minus : share_plus),
                           s < 0 ? share_minus : share_plus);
    }
}

// Where the wall on side `s` of a tile of width `w` stands: straddling
// the edge when the next tile shares it, a whole wall inside the edge at
// an open end.
module _tile_joint(s, share, w) {
    translate([0, s * (w / 2 - (share ? 0 : wall_thickness / 2)), 0])
        children();
}

// Which part of that joint this tile is. Under a shared wall it is the
// tile on one side or the other; under an end wall it is the only one.
function _tile_role(s, share) = share ? (s < 0 ? "plus" : "minus") : "tile";

// With the channel's row of cells filled, the tile is solid out to the
// points of the next row's cells; every clip's foot has to land inside
// that band or it would overhang a cell.
assert(ptfe_loop_r + ptfe_end_clip_flare
           <= (hex_size + hex_wall) * sqrt(3) / 2 - _hex_r(hex_size),
       "filament-spool-roller: the end clip's foot overhangs the lattice — cut ptfe_end_clip_flare");

module tile_left()   { tile(share_minus = false, share_plus = true); }
module tile_middle() { tile(share_minus = true,  share_plus = true); }
module tile_right()  { tile(share_minus = true,  share_plus = false); }
// A one-lane stand's only tile: open at both edges, a whole wall's
// footprint at each.
module tile_single() { tile(share_minus = false, share_plus = false); }

// The side profile of a wall, in its own frame: X is depth (front at
// +X, where the operator stands), Y is height above the floor tiles.
//
// A crescent opening up and toward the front. The back rises tall to
// square a spool up as it goes in, the middle drops to a low strip along
// the floor because nothing there needs guiding, and the front rises
// again to catch a spool coming down from the front. The bottom edge runs
// the full depth so the floor joint and both pegs have a wall round
// them.
module _wall_profile() {
    d = base_depth;
    back_c = [-d / 2 + wall_back_tip_r, wall_back_top - wall_back_tip_r];
    front_c = [d / 2 - wall_front_tip_r, wall_front_top - wall_front_tip_r];
    // The inner edge of the crescent leaves each horn from the inside of
    // its tip and sweeps down through the trough. The two middle control
    // points sit low enough that the curve bottoms out at
    // wall_trough_height; pulling them in from the ends is what widens
    // each horn toward its root.
    a = [back_c[0] + wall_back_tip_r, back_c[1]];
    c = [front_c[0] - wall_front_tip_r, front_c[1]];
    low = (8 * wall_trough_height - a[1] - c[1]) / 6;
    reach = (c[0] - a[0]) * wall_horn_spread;
    inner = _bezier(a, [a[0] + reach, low], [c[0] - reach, low], c, 48);
    intersection() {
        // Concave corners filleted, then the convex ones softened.
        offset(r = wall_round) offset(delta = -wall_round)
            offset(r = -wall_fillet) offset(delta = wall_fillet)
                union() {
                    polygon(concat([[-d / 2, 0], [d / 2, 0], [d / 2, front_c[1]]],
                                   [for (k = [len(inner) - 1 : -1 : 0]) inner[k]],
                                   [[-d / 2, back_c[1]]]));
                    translate(back_c) circle(r = wall_back_tip_r);
                    translate(front_c) circle(r = wall_front_tip_r);
                    for (x = [-roller_x, roller_x])
                        translate([x, wall_peg_y]) circle(r = flange_r + wall_frame);
                    translate([-d / 2, 0])
                        square([d, wall_trough_height]);
                }
        // Rounding pulls the bottom corners in; the floor edge has to
        // run the full depth, so it is clipped square instead.
        translate([-d / 2, 0]) square([d, wall_back_top]);
    }
    translate([-d / 2, 0]) square([d, min(wall_trough_height, wall_round)]);
}

function _bezier(p0, p1, p2, p3, n) = [
    for (i = [0 : n]) let (t = i / n, u = 1 - t)
        u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
];

// One wall, lying flat ready to print: its profile in XY, its thickness
// on Z, floor edge along -Y. It carries the pegs, sits on the floor and
// is the whole height in one piece. Both faces are flat — a roller runs
// off the face on its pegs' shoulders rather than in a pocket — so it
// prints flat with nothing to bridge.
//
//   lane_minus / lane_plus — whether that side of the wall meets a lane.
//   The wall stands with its local +Z toward -Y, so the z = 0 face is the
//   wall's +Y side and z = t its -Y side.
//
// End walls are mirror images of each other, which is why there are
// three of these and not two.
module wall_support(lane_minus = true, lane_plus = true) {
    t = wall_thickness;
    difference() {
        union() {
            difference() {
                linear_extrude(t) _wall_profile();
                // The lattice stays a frame's width inside the outline
                // and off the solid pad each roller end runs against.
                translate([0, 0, -_eps])
                    linear_extrude(t + 2 * _eps)
                        difference() {
                            intersection() {
                                offset(delta = -wall_frame) _wall_profile();
                                translate([-base_depth / 2, 0])
                                    _hex_grid_2d(base_depth, wall_back_top,
                                                 hex_size, hex_wall);
                            }
                            for (x = [-roller_x, roller_x])
                                translate([x, wall_peg_y])
                                    circle(r = flange_r + wall_frame);
                            translate([beam_x, wall_beam_y])
                                circle(r = wall_back_tip_r);
                        }
            }
            _wall_joint() _joint_add("wall", lane_minus && lane_plus);
        }
        // The peg presses into this.
        for (x = [-roller_x, roller_x])
            translate([x, wall_peg_y, -_eps])
                cylinder(h = t + 2 * _eps, d = peg_body_diameter - peg_press);
        // The beam hole. A wall with a lane on its -Y side takes the end
        // of that lane's beam — a socket, with the next spigot inside it.
        // The left end wall has no beam arriving, only one leaving.
        translate([beam_x, wall_beam_y, -_eps])
            _hex_prism(lane_minus ? beam_hole_socket_af : beam_hole_spigot_af,
                       t + 2 * _eps);
        // The left end wall holds a spigot but no socket, so the wall
        // itself takes the step up to the bar, on its +Y face — z = 0.
        if (!lane_minus)
            translate([beam_x, wall_beam_y, 0])
                hull() {
                    translate([0, 0, -_eps])
                        _hex_prism(beam_af + 2 * beam_fit, _eps);
                    translate([0, 0, _hex_r(beam_af) - _hex_r(beam_hex)])
                        _hex_prism(beam_hole_spigot_af, _eps);
                }
        // The countersink the socket's flange sits in, on the +Y face —
        // z = 0.
        if (lane_minus)
            translate([beam_x, wall_beam_y, 0])
                hull() {
                    translate([0, 0, -_eps])
                        _hex_prism(beam_flange_af + 2 * beam_fit, _eps);
                    translate([0, 0, beam_flange_rise])
                        _hex_prism(beam_hole_socket_af, _eps);
                }
        _lock_hole(t);
        _wall_joint() _joint_cut("wall", lane_minus && lane_plus);
    }
}

// The joint's frame inside a wall's own print frame. The joint is drawn
// with the wall's centre line on y = 0 and the box floor on z = 0; the
// wall stands with local +Z toward -Y and its local y = 0 on the top of
// the floor.
module _wall_joint() {
    translate([0, -base_height, wall_thickness / 2])
        rotate([-90, 0, 0])
            children();
}

// A hex with its flats square to X, so the lock hole along X goes
// through flats rather than corners — in the walls and the beams alike,
// which is what makes the holes line up. Every hex shares one corner
// radius, so a bigger one always clears a smaller one at the corners as
// well as the flats.
module _hex_2d(af) {
    offset(r = hex_corner_r) offset(delta = -hex_corner_r)
        rotate(30) circle(r = _hex_r(af), $fn = 6);
}

module _hex_prism(af, h) {
    linear_extrude(h) _hex_2d(af);
}

// The lock hole, drilled in from the back edge of a wall of thickness t
// on the beam's centre line, counterbored for an M3 cap head.
module _lock_hole(t) {
    translate([-base_depth / 2, wall_beam_y, t / 2])
        rotate([0, 90, 0])
            _m3_cap_hole(lock_hole_length - m3_counterbore_depth, lock_hole_diameter);
}

module wall_left()   { wall_support(lane_minus = false, lane_plus = true); }
module wall_center() { wall_support(lane_minus = true,  lane_plus = true); }
module wall_right()  { wall_support(lane_minus = true,  lane_plus = false); }

// One beam, drawn spigot first along Z: spigot, then the bar across one
// lane, then the socket. This is the assembly frame; `beam()` turns it
// over to print.
//
// The spigot sits in the wall on the beam's -Y side, inside the socket of
// the beam before it. The socket sits in the wall on its +Y side, with the
// next spigot inside it, and flares at 45 degrees into a flange sunk flush
// in that wall's far face. The flange indexes the wall along the beam and
// the lock screw through wall, socket and spigot holds everything. One
// shoulder per wall is all a beam can have and still go through the hole.
module _beam_body() {
    t = wall_thickness;
    l = beam_length;
    // Every change of size rises as far as it steps out at the corners,
    // where the step is widest, so nothing overhangs more than 45 degrees
    // off vertical as printed.
    step = _hex_r(beam_af) - _hex_r(beam_hex);
    difference() {
        union() {
            // The step up to the bar happens inside the wall, in the
            // mouth of the socket it sits in, so the bar runs full size
            // right to the wall face.
            _hex_prism(beam_hex, t - step + _eps);
            translate([0, 0, t - step])
                hull() {
                    _hex_prism(beam_hex, _eps);
                    translate([0, 0, step]) _hex_prism(beam_af, _eps);
                }
            translate([0, 0, t])
                _hex_prism(beam_af, l - t - beam_flange_rise);
            translate([0, 0, l - beam_flange_rise])
                hull() {
                    _hex_prism(beam_af, _eps);
                    translate([0, 0, beam_flange_rise - _eps])
                        _hex_prism(beam_flange_af, _eps);
                }
        }
        translate([0, 0, l - t])
            _hex_prism(beam_socket_af, t + _eps);
        // The socket prints opening onto the bed, so its far end is a 45-
        // degree roof rather than a flat ceiling. The spigot stops short of
        // it.
        translate([0, 0, l - t])
            hull() {
                _hex_prism(beam_socket_af, _eps);
                translate([0, 0, -_hex_r(beam_socket_af)]) cylinder(h = _eps, r = _eps);
            }
        // The mouth of the socket funnels out at 45 degrees to take the
        // next beam's step.
        translate([0, 0, l - step])
            hull() {
                _hex_prism(beam_socket_af, _eps);
                translate([0, 0, step]) _hex_prism(beam_af + 2 * beam_fit, _eps);
            }
        // Lock holes through both ends, across flats, on the mid-plane of
        // each wall — the same line as the hole in the wall.
        for (z = [t / 2, l - t / 2])
            translate([-beam_af, 0, z])
                rotate([0, 90, 0])
                    cylinder(h = 2 * beam_af, d = lock_hole_diameter);
    }
}

// One beam, ready to print: stood on its socket end, the big end, so it
// narrows all the way up — flange, bar, the step down to the spigot — and
// nothing overhangs.
module beam() {
    translate([0, 0, beam_length]) mirror([0, 0, 1]) _beam_body();
}

// The printed alternative to the lock screw: a D-section pin that pushes
// into a lock hole, flush with the floor of the counterbore. Lies on its
// flat.
module lock_pin() {
    d = lock_hole_diameter - 2 * lock_pin_fit;
    flat = d * 0.15;
    // Laid along X, local +X turns to -Z, so the flat cut on +X lands on
    // the bed.
    translate([0, 0, d / 2 - flat])
        rotate([0, 90, 0])
            intersection() {
                cylinder(h = lock_hole_length - m3_counterbore_depth, d = d);
                translate([-d / 2, -d / 2, 0])
                    cube([d - flat, d, lock_hole_length - m3_counterbore_depth]);
            }
}

// One roller, standing on its end ready to print. A 608 presses into
// each end; the core between them is clearance for the peg. Each flange
// is a short flat rim at the end, then a taper down to the running
// surface, so the only slope a spool meets points it at the middle of the
// lane. Standing on end, the top taper is an overhang at
// flange_taper_angle off vertical.
module roller(l = roller_length) {
    t = flange_taper;
    fw = flange_rim;
    difference() {
        rotate_extrude()
            polygon([[0, 0],
                     [flange_r, 0],
                     [flange_r, fw], [roller_r, fw + t],
                     [roller_r, l - fw - t], [flange_r, l - fw],
                     [flange_r, l],
                     [0, l]]);
        translate([0, 0, -_eps])
            cylinder(h = l + 2 * _eps, d = peg_diameter + peg_clearance);
        translate([0, 0, -_eps])
            cylinder(h = bearing_pocket_depth + _eps, r = bearing_pocket_r);
        translate([0, 0, l - bearing_pocket_depth])
            cylinder(h = bearing_pocket_depth + _eps, r = bearing_pocket_r);
    }
}

// A peg, drawn along Z from the end of its bearing shaft on the flange
// side. `faces` matches the wall it goes through: 2 carries a roller on
// each side, 1 only into the lane.
//
// Shaft, flange, then the body through the wall, pushed in body first
// until the flange seats on the face — nothing wider than the body goes
// through the hole, so it installs. The flange spaces the bearing on its
// side. An inner peg's body runs a shoulder's width past the far face and
// steps down to the second shaft, which spaces that bearing the same
// way; an end peg's body stops flush with the outer face.
function _peg_length(faces) = wall_thickness + faces * peg_reach;

module peg(faces = 2) {
    rs = peg_diameter / 2;
    rb = peg_body_diameter / 2;
    rf = peg_flange_diameter / 2;
    c = 0.8;
    b0 = bearing_width + peg_shoulder;
    b1 = b0 + wall_thickness + (faces == 2 ? peg_shoulder : 0);
    l = _peg_length(faces);
    lead = [[rb, b1 - peg_lead], [rb - peg_lead, b1]];
    far = faces == 2 ? [[rs, b1], [rs, l - c], [rs - c, l], [0, l]] : [[0, b1]];
    intersection() {
        rotate_extrude()
            polygon(concat([[0, 0], [rs - c, 0], [rs, c], [rs, bearing_width],
                            [rf, bearing_width], [rf, b0], [rb, b0]],
                           lead, far));
        translate([-rf, -_peg_flat, -_eps]) cube([2 * rf, rf + _peg_flat, l + 2 * _eps]);
    }
}

// A peg lying on its flat, centred on the origin, ready to print. Standing,
// every step would be a flat overhang; lying down they are all walls.
module _peg_print(faces) {
    translate([0, _peg_length(faces) / 2, _peg_flat])
        rotate([90, 0, 0])
            peg(faces);
}

module peg_inner() { _peg_print(2); }
module peg_end()   { _peg_print(1); }

// The joint splitting the template in two, so each half fits the bed.
// Same profile as the tile dovetails, turned into the template's plane.
module _template_joint(grow) {
    for (h = [0.35, 0.75])
        translate([0, h * template_height, 0])
            rotate([0, 0, -90])
                linear_extrude(template_thickness)
                    _dovetail_profile(grow);
}

// The drilling template for the bulkhead holes: a flat strip that
// stands against the back wall of the box with its lip hooked over the
// stand, marking one hole behind each lane centre. Four lanes wide it
// is wider than a bed, so it prints as two halves that dovetail at the
// middle — `half` is -1 or 1 for those, 0 for the whole thing, which is
// what a one-lane stand prints.
module template(half = 0) {
    difference() {
        union() {
            translate([0, template_height / 2, template_thickness / 2])
                cube([stand_width, template_height, template_thickness],
                     center = true);
            translate([0, -template_lip / 2, template_thickness / 2])
                cube([stand_width, template_lip, template_thickness],
                     center = true);
        }
        for (i = [0 : lanes - 1])
            translate([lane_y(i), bulkhead_height, -_eps])
                cylinder(h = template_thickness + 2 * _eps,
                         d = bulkhead_hole_diameter);
        // A notch per lane in the lip, so the template drops over the
        // walls and cannot slide sideways while it is marked.
        for (j = [0 : lanes])
            translate([wall_y(j), -template_lip, -_eps])
                cube([wall_thickness + joint_fit, template_lip,
                      template_thickness + 2 * _eps]);
        if (half != 0) {
            // Trim to one side of the split, then open the socket on the
            // half that receives the tail.
            translate([half > 0 ? -stand_width : 0, -template_lip - _eps, -_eps])
                cube([stand_width, template_height + template_lip + 2 * _eps,
                      template_thickness + 2 * _eps]);
            if (half > 0) _template_joint(dovetail_clearance);
        }
    }
    if (half < 0) _template_joint(0);
}

module template_left()  { template(half = -1); }
module template_right() { template(half =  1); }

// The floor drilling template: the stand's footprint, with a hole at
// every tile's screw-down point, for marking the box floor. Four lanes
// wide it is wider than a bed, so it splits across the middle into
// halves that dovetail together — `half` is -1 or 1 for those, 0 for
// the whole thing, which is what a one-lane stand prints. The hole
// pattern is the same turned end for end, so it goes down either way.
module floor_template(half = 0) {
    t = template_thickness;
    difference() {
        union() {
            translate([-base_depth / 2,
                       half > 0 ? 0 : -stand_width / 2, 0])
                cube([base_depth, half == 0 ? stand_width : stand_width / 2, t]);
            if (half < 0)
                for (s = [-1, 1])
                    translate([s * dovetail_offset, 0, 0])
                        linear_extrude(t) _dovetail_profile(0);
        }
        for (i = [0 : lanes - 1],
             p = _screw_xy(tile_lane_y(i > 0, i < lanes - 1)))
            translate([p[0], tile_y(i) + p[1], -_eps])
                cylinder(h = t + 2 * _eps, d = screw_hole_diameter);
        if (half > 0)
            for (s = [-1, 1])
                translate([s * dovetail_offset, 0, -_eps])
                    linear_extrude(t + 2 * _eps) _dovetail_profile(dovetail_clearance);
    }
}

module floor_template_left()  { floor_template(half = -1); }
module floor_template_right() { floor_template(half =  1); }

// --- assembly ---

// A support wall standing in the channel, centred on `y`. Local Z
// becomes global -Y under the rotation, so the translate has to start
// half a thickness high for the wall to straddle `y`.
module wall_at(y, lane_minus, lane_plus) {
    translate([0, y + wall_thickness / 2, base_height])
        rotate([90, 0, 0])
            wall_support(lane_minus, lane_plus);
}

// The two rollers of lane `i`, in their running position.
module lane_rollers(i, parity = undef) {
    for (k = [0, 1]) if (_shade(parity, i + k))
        translate([k == 0 ? -roller_x : roller_x, lane_y(i) - roller_length / 2, peg_z])
            rotate([-90, 0, 0])
                roller();
}

// One lane on its own, in the tile's own frame — the tile, the two
// walls either side of it and its pair of rollers. What the left, middle
// and right bay views are made of.
module bay_walls(sm = true, sp = true) {
    y_mid = tile_lane_y(sm, sp);
    half = (lane_clear + wall_thickness) / 2;
    wall_at(y_mid - half, sm, true);
    wall_at(y_mid + half, true, sp);
}

module bay_rollers(sm = true, sp = true) {
    y_mid = tile_lane_y(sm, sp);
    for (x = [-roller_x, roller_x])
        translate([x, y_mid - roller_length / 2, peg_z])
            rotate([-90, 0, 0])
                roller();
}

// Every stand_* module below takes `parity`: 0 or 1 draws only the pieces
// whose index has that parity, undef draws them all. A preview colours the
// two halves in two shades of one hue, so neighbouring copies of a part —
// the touching tiles above all — never share a shade, and so never fuse
// into one solid in the preview's colour pass.
function _shade(parity, n) = is_undef(parity) || n % 2 == parity;

module stand_tiles(parity = undef) {
    for (i = [0 : lanes - 1]) if (_shade(parity, i))
        translate([0, tile_y(i), 0])
            tile(share_minus = i > 0, share_plus = i < lanes - 1);
}

module stand_walls(parity = undef) {
    for (j = [0 : lanes]) if (_shade(parity, j))
        wall_at(wall_y(j), j > 0, j < lanes);
}

// Chequered, so a roller differs from both the other one in its lane and
// the one beside it in the next.
module stand_rollers(parity = undef) {
    for (i = [0 : lanes - 1]) lane_rollers(i, parity);
}

// The pegs, pressed through every wall at both roller axes, flange on
// the wall's -Y face. The left end wall's lane is on its +Y side, so its
// pegs point the other way, flange still on the lane side.
module stand_pegs(parity = undef) {
    for (j = [0 : lanes], k = [0, 1]) if (_shade(parity, j + k)) {
        x = k == 0 ? -roller_x : roller_x;
        faces = (j == 0 || j == lanes) ? 1 : 2;
        d = j == 0 ? -1 : 1;
        translate([x, wall_y(j) - d * (wall_thickness / 2 + peg_reach), peg_z])
            rotate([d * -90, 0, 0])
                peg(faces);
    }
}

// Reference only: the 608s, pressed into both ends of every roller.
module stand_bearings() {
    for (i = [0 : lanes - 1], x = [-roller_x, roller_x],
         z = [bearing_recess, roller_length - bearing_recess - bearing_width])
        translate([x, lane_y(i) - roller_length / 2 + z, peg_z])
            rotate([-90, 0, 0])
                difference() {
                    cylinder(h = bearing_width, d = bearing_outer_diameter);
                    translate([0, 0, -_eps])
                        cylinder(h = bearing_width + 2 * _eps,
                                 d = bearing_inner_diameter);
                }
}

// Beam i runs from the wall on the -Y side of lane i, spigot first.
module stand_beams(parity = undef) {
    for (i = [0 : lanes - 1]) if (_shade(parity, i))
        translate([beam_x, wall_y(i) - wall_thickness / 2, beam_z])
            rotate([-90, 0, 0])
                _beam_body();
}

// Where each named piece of the stand sits — the ids the manifest's
// components list — for a preview to echo as gallery_instances. Each
// point is near the middle of its piece, so the gallery can tell B1 from
// B2 in one merged colour. Front is +X: the beams and the PTFE's back
// clip are on -X.
function stand_instances() = concat(
    [for (i = [0 : lanes - 1])
        [str("T", i + 1), [0, tile_y(i), base_height / 2]]],
    [for (j = [0 : lanes])
        [str("W", j + 1), [0, wall_y(j), base_height]]],
    [for (i = [0 : lanes - 1], s = ["F", "B"])
        [str("R", i + 1, s), [s == "F" ? roller_x : -roller_x, lane_y(i), peg_z]]],
    [for (j = [0 : lanes], s = ["F", "B"])
        [str("P", j + 1, s), [s == "F" ? roller_x : -roller_x, wall_y(j), peg_z]]],
    [for (i = [0 : lanes - 1])
        [str("B", i + 1), [beam_x, wall_y(i) - wall_thickness / 2 + beam_length / 2, beam_z]]]
);

// Reference only: the PTFE tube down the middle of a lane, both ways it
// can go — x along the lane, y = 0 its centre line. Each runs from the
// front clip's mouth along the groove, then either round the back scoop
// and on up, or round the drop's knee and on down at 45 degrees, for
// _ptfe_tail past the tile. The bends are the cuts' own arcs, offset to
// the tube's axis: out from the drop's centre below, in toward the
// scoop's centre above.
_ptfe_tail = 30;

function _ptfe_tube_path(down) =
    let (bend = down
             ? [for (i = [0 : 12]) let (a = 45 * i / 12, r = _ptfe_45_r + ptfe_r)
                   [_ptfe_drop_x - r * sin(a), ptfe_floor_z - _ptfe_45_r + r * cos(a)]]
             : [for (i = [0 : 12]) let (a = _ptfe_scoop_angle * i / 12, r = _ptfe_scoop_r - ptfe_r)
                   [ptfe_back_x - r * sin(a), ptfe_floor_z + _ptfe_scoop_r - r * cos(a)]],
         a_end = down ? -45 : _ptfe_scoop_angle,
         last = bend[len(bend) - 1])
    concat([[ptfe_end_x, ptfe_z]], bend, [last + _ptfe_tail * [-cos(a_end), sin(a_end)]]);

module ptfe_tube(y_mid) {
    for (down = [false, true])
        let (path = _ptfe_tube_path(down))
            for (i = [0 : len(path) - 2])
                hull()
                    for (q = [path[i], path[i + 1]])
                        translate([q[0], y_mid, q[1]]) sphere(d = ptfe_od);
}

module stand_ptfe() {
    for (i = [0 : lanes - 1]) ptfe_tube(lane_y(i));
}

module bay_ptfe(sm = true, sp = true) {
    ptfe_tube(tile_lane_y(sm, sp));
}

// Reference only: one spool — a hub tube between two flange plates —
// centred on the origin with its axis on Z.
module spool() {
    h = spool_width;
    f = spool_flange_thickness;
    difference() {
        union() {
            cylinder(h = h, d = spool_hub_diameter + 2 * spool_hub_wall,
                     center = true);
            for (s = [-1, 1])
                translate([0, 0, s * (h - f) / 2])
                    cylinder(h = f, d = spool_diameter, center = true);
        }
        cylinder(h = h + 2 * _eps, d = spool_hub_diameter, center = true);
    }
}

// Reference only: a spool seated in every lane.
module spools() {
    for (i = [0 : lanes - 1])
        translate([0, lane_y(i), spool_z])
            rotate([90, 0, 0])
                spool();
}

// Reference only: the dry box, drawn as an edge frame so the stand
// inside it stays visible, plus a ring on the back wall where each
// bulkhead lands.
module box() {
    d = box_depth; w = box_width; h = box_height; b = box_wall;
    module beam(len, axis) {
        if (axis == 0) cube([len, b, b]);
        else if (axis == 1) cube([b, len, b]);
        else cube([b, b, len]);
    }
    for (yy = [-w / 2 - b, w / 2], zz = [-b, h])
        translate([-d / 2 - b, yy, zz]) beam(d + 2 * b, 0);
    for (xx = [-d / 2 - b, d / 2], zz = [-b, h])
        translate([xx, -w / 2 - b, zz]) beam(w + 2 * b, 1);
    for (xx = [-d / 2 - b, d / 2], yy = [-w / 2 - b, w / 2])
        translate([xx, yy, -b]) beam(h + b, 2);
    // Where the bulkheads land in the back wall.
    for (i = [0 : lanes - 1])
        translate([-d / 2 - b, lane_y(i), bulkhead_height])
            rotate([0, 90, 0])
                difference() {
                    cylinder(h = b, d = bulkhead_hole_diameter + 2 * b);
                    translate([0, 0, -_eps])
                        cylinder(h = b + 2 * _eps, d = bulkhead_hole_diameter);
                }
}

// --- print plates ---
//
// One plate per print job, every part in its print pose, laid out on a
// print_bed square centred on the origin and kept _plate_edge in from
// its rim. A wall fills a bed, and two won't nest — each is an L whose
// arms both run the bed's width — but its crescent leaves the bed's back
// corner free, so a lane's rollers and beam, and the bulkhead template,
// ride on the wall plates. The tiles go two to a plate. The pegs are
// TPU, so they stay on a plate of their own.

_plate_gap = 6;
_plate_edge = 5;
_plate_max = print_bed / 2 - _plate_edge;

module plate_wall(k) {
    translate([0, -(wall_back_top - base_height) / 2, 0])
        wall_support(k > 0, k < lanes);
}

// The bulkhead template (half -1 or 1, or 0 for the whole thing) in the
// back corner of a wall plate, hard against both edges.
module plate_wall_template(half) {
    right = half < 0 ? dovetail_length : stand_width / 2;
    width = right + (half > 0 ? 0 : stand_width / 2);
    assert(width <= 2 * _plate_max,
           "filament-spool-roller: the bulkhead template is too wide for the bed");
    translate([_plate_max - right, _plate_max - template_height, 0])
        template(half);
}

// One lane's rollers on end and its beam on its flange, in a row across
// the same corner, below where the template goes.
_plate_lane_y = _plate_max - template_height - template_lip - _plate_gap - flange_r;
_plate_roller_x = [for (j = [0, 1])
                       _plate_max - flange_r - j * (flange_diameter + _plate_gap)];
_plate_beam_x = _plate_roller_x[1] - flange_r - _plate_gap - _hex_r(beam_flange_af);

module plate_lane_rollers() {
    for (x = _plate_roller_x)
        translate([x, _plate_lane_y, 0]) roller();
}

module plate_lane_beam() {
    translate([_plate_beam_x, _plate_lane_y, 0]) beam();
}

// Every peg, lying on its flat side by side: the inner ones, then the
// end ones.
_plate_peg_pitch = peg_flange_diameter + _plate_gap;

module plate_pegs() {
    n = 2 * (lanes + 1);
    inner = 2 * (lanes - 1);
    for (k = [0 : n - 1])
        translate([(k - (n - 1) / 2) * _plate_peg_pitch, 0, 0])
            _peg_print(k < inner ? 2 : 1);
}

// Tiles two to a plate, stacked across the bed with a gap between them.
// A tile's extent past its body is its dovetail tails on a +Y seam and
// the upper halves of the screw laps on a -Y seam.
function _tile_lo(i) = -tile_w(i) / 2 - (i > 0 ? base_height / 2 : 0);
function _tile_hi(i) = tile_w(i) / 2 + (i < lanes - 1 ? dovetail_length : 0);
module plate_tile(p, s) {
    a = 2 * p;
    b = min(a + 1, lanes - 1);
    total = (_tile_hi(a) - _tile_lo(a))
          + (b > a ? _plate_gap + _tile_hi(b) - _tile_lo(b) : 0);
    ya = -total / 2 - _tile_lo(a);
    yb = ya + _tile_hi(a) + _plate_gap - _tile_lo(b);
    i = a + s;
    if (i <= b)
        translate([0, s == 0 ? ya : yb, 0])
            tile(share_minus = i > 0, share_plus = i < lanes - 1);
}

// A floor template half on its own plate, slid to the middle of the bed.
module plate_floor_template(half) {
    if (half < 0)
        translate([0, stand_width / 4 - dovetail_length / 2, 0]) floor_template_left();
    else
        translate([0, -stand_width / 4, 0]) floor_template_right();
}

// One lane: the tile (s = 0) and the whole floor template (s = 1)
// stacked across one bed. Only a stand narrow enough not to split the
// template fits.
_plate_tile_floor_h = tile_w(0) + _plate_gap + stand_width;
module plate_tile_floor_template(s) {
    assert(lanes == 1 && _plate_tile_floor_h <= 2 * _plate_max,
           "filament-spool-roller: the tile and floor template only share a bed at one lane");
    if (s == 0)
        translate([0, -_plate_tile_floor_h / 2 - _tile_lo(0), 0]) tile_single();
    else
        translate([0, _plate_tile_floor_h / 2 - stand_width / 2, 0]) floor_template();
}

// --- fit test ---
//
// One plate of coupons to print and throw away before committing to the
// real parts: every mating feature at full size, with the stretches
// between features cut out. Each coupon is cut from the real part, or
// built from the same helpers, so a fit that passes here passes there.

// The back tip of a centre wall — beam socket hole, flange countersink
// and lock hole — and the pad round one peg hole, each clipped to the
// wall's floor edge and centred on the hole. The peg pad stops short of
// the back floor screw's pilot, which would otherwise notch its edge.
module fit_wall_beam() {
    _fit_wall_disc([beam_x, wall_beam_y], wall_back_tip_r, -base_depth / 2);
}

module fit_wall_peg() {
    _fit_wall_disc([-roller_x, wall_peg_y], flange_r + wall_frame,
                   _floor_screw_xs[0] + m3_pilot_diameter / 2 + 1);
}

module _fit_wall_disc(c, r, x0) {
    translate([-c[0], -c[1], 0])
        intersection() {
            wall_support(true, true);
            linear_extrude(wall_thickness)
                intersection() {
                    translate(c) circle(r = r);
                    translate([x0, 0]) square([base_depth, wall_back_top]);
                }
        }
}

// A beam's outer thirds as two pieces, both in beam()'s print pose, big
// end down. The socket end goes through fit_wall_beam() and the spigot
// end pushes into it, which is the joint every centre wall makes.
_fit_beam_cut = wall_thickness + lane_clear / 3;

module fit_beam_socket() {
    intersection() {
        beam();
        translate([-beam_af, -beam_af, 0]) cube([2 * beam_af, 2 * beam_af, _fit_beam_cut]);
    }
}

module fit_beam_spigot() {
    translate([0, 0, -(beam_length - _fit_beam_cut)])
        intersection() {
            beam();
            translate([-beam_af, -beam_af, beam_length - _fit_beam_cut])
                cube([2 * beam_af, 2 * beam_af, _fit_beam_cut]);
        }
}

// A roller only as long as its two bearing pockets and flanges need.
fit_roller_length = 2 * (bearing_pocket_depth + flange_rim + flange_taper);

module fit_roller() { roller(fit_roller_length); }

// One tile seam: a strip with a tail, a strip with a socket, the socket
// backed by the same solid pad a real tile keeps round it.
_fit_dovetail_w = dovetail_tip_width + 2 * wall_frame;
_fit_dovetail_d = dovetail_length + dovetail_clearance + 2 * hex_wall;

module fit_dovetail_tail() {
    translate([-_fit_dovetail_w / 2, -_fit_dovetail_d, 0])
        cube([_fit_dovetail_w, _fit_dovetail_d, base_height]);
    linear_extrude(base_height) _dovetail_profile(0);
}

module fit_dovetail_socket() {
    difference() {
        translate([-_fit_dovetail_w / 2, 0, 0])
            cube([_fit_dovetail_w, _fit_dovetail_d, base_height]);
        translate([0, 0, -_eps])
            linear_extrude(base_height + 2 * _eps) _dovetail_profile(dovetail_clearance);
    }
}

// The coupons laid out on one bed, in three rows: the two wall pieces and
// the roller, then the beam ends, lock pin and an inner peg, then the
// dovetail pair. The peg is its own colour so it can be given TPU.
_fit_peg_r = flange_r + wall_frame;
_fit_beam_r = _hex_r(beam_flange_af);
_fit_row1_y = _fit_peg_r;
_fit_row2_y = -_plate_gap - _fit_beam_r;
_fit_row3_y = _fit_row2_y - _fit_beam_r - _plate_gap - dovetail_length;

module plate_fit_walls() {
    translate([-_fit_peg_r - _plate_gap / 2, _fit_row1_y, 0]) fit_wall_peg();
    translate([wall_back_tip_r + _plate_gap / 2, _fit_row1_y, 0]) fit_wall_beam();
}

module plate_fit_roller() {
    translate([2 * wall_back_tip_r + flange_r + 1.5 * _plate_gap, _fit_row1_y, 0])
        fit_roller();
}

module plate_fit_beam() {
    translate([-_fit_beam_r - _plate_gap / 2, _fit_row2_y, 0]) fit_beam_socket();
    translate([_hex_r(beam_af) + _plate_gap / 2, _fit_row2_y, 0]) fit_beam_spigot();
}

module plate_fit_small() {
    x0 = 2 * _hex_r(beam_af) + 1.5 * _plate_gap;
    translate([x0, _fit_row2_y, 0]) lock_pin();
}

// An inner peg: it tests the press into fit_wall_peg() and both ways a
// bearing is spaced off the wall, the flange and the far shoulder.
module plate_fit_peg() {
    translate([2 * _hex_r(beam_af) + 2.5 * _plate_gap + lock_hole_length + peg_flange_diameter / 2,
               _fit_row2_y, 0])
        peg_inner();
}

module plate_fit_dovetail() {
    translate([-_fit_dovetail_w / 2 - _plate_gap / 2, _fit_row3_y, 0]) fit_dovetail_tail();
    translate([_fit_dovetail_w / 2 + _plate_gap / 2, _fit_row3_y - _fit_dovetail_d, 0])
        fit_dovetail_socket();
}
