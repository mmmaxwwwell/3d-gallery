// BEGIN_DESCRIPTION
// One sealed dry-box module for a single 200 mm spool, printed in pieces
// on a Snapmaker U1 with 75A TPU gaskets printed in place.
//
// Two round side walls, the spool's diameter plus a little clearance and
// wall, with curved panels between them. The spool sits on two rollers,
// as on filament-spool-roller, each in an ear that bulges out of the
// bottom of both walls with its axle moulded into them, closed round by
// an ear plate. A third rides on top of the spool in an ear in the lid.
//
// The lid is the top and front half, cut off on a plane through the axis
// from just past the front roller to the back. It hinges at the back and
// an over-centre draw latch pulls it shut at the front. The cut is sealed
// like every other joint, with no screws: a ridge on the lid presses into
// a TPU bead round the base's side, and the walls carry a lip inward along
// the cut to hold it.
//
// Every panel edge is a ridge pressing into a TPU bead in a groove in the
// wall, squeezed by M3 cap screws that run straight down the middle of the
// TPU channel into the panel's edge. Where a panel meets an ear plate, a
// TPU strip printed into its end presses on it.
// END_DESCRIPTION

// BEGIN_PARAMS
// Outer diameter of the spool's flanges (mm). A Bambu Lab spool is 200.
spool_diameter = 200;

// Overall width of the spool across both flanges (mm).
spool_width = 60;

// Gap between the spool's rim and the inside of the panels (mm).
spool_clearance = 2;

// Side-to-side slack between a spool and each wall (mm).
lane_slack = 2;

// Thickness of the walls and panels (mm). Each flares out to what its
// seal and screws need at its edges.
wall_thickness = 3;

// Where the two rollers the spool sits on are, each this far round from
// the bottom (degrees). A third rides on the top of the spool, in the lid.
roller_angle = 40;

// Diameter of a roller's running surface (mm).
roller_diameter = 30;

// Gap between a roller's flanges and the inside of its ear (mm).
roller_clearance = 2;

// Radius of the fillets where an ear leaves the ring (mm).
ear_fillet = 10;

// Height of a seal ridge (mm), and the width of its flat tip. The panels
// flare to the ridge's base at their edges.
seal_ridge_height = 1.5;
seal_ridge_tip = 1.2;

// How far the TPU stands into the path of whatever presses on it (mm).
gasket_squeeze = 1;

// Depth and width of a TPU-filled channel (mm).
gasket_depth = 2;
gasket_width = 2.4;

// Radius the wall's TPU channel widens to round each screw (mm). The screw
// threads through the TPU, which seals round it.
seal_pad_r = 2.5;

// Per-face clearance everywhere two printed parts meet (mm).
joint_fit = 0.2;

// Most arc between screws along a panel's edge (mm).
screw_spacing = 40;

// Length under the head of the M3s through the walls into the panels (mm).
screw_length = 12;

// Build volume the print plates are laid out for (mm). Snapmaker U1.
print_bed = 270;
// END_PARAMS

// --- fixed detail dimensions ---

_eps = 0.01;
m3_pilot_diameter = 2.5;
m3_clearance_diameter = 3.2;
m3_counterbore_diameter = 6;
m3_counterbore_depth = 3.2;
// PETG between a screw head's counterbore and the TPU under it.
seal_skin = 1.2;
// Wall left inside the groove and pads, toward the lane.
seal_lip = 0.6;
// How far a panel stays at full seal width past its edge before it
// tapers, at 45°, back to wall_thickness.
flare_land = 1;
// Wall round a screw's pilot in a panel's boss.
boss_wall = 1.6;
// Closest a screw comes to a panel's end, along the seal (mm).
screw_end_margin = 10;
// 608 bearings, two to a roller.
bearing_outer_diameter = 22;
bearing_inner_diameter = 8;
bearing_width = 7;
// Interference on the bearing pocket in the roller (mm).
bearing_fit = 0.1;
// Clearance on a peg in a bearing's bore, and on the bore through the
// roller between its bearings (mm).
peg_fit = 0.1;
peg_clearance = 0.6;
// How far a peg's shoulder holds the bearing's inner race off the wall,
// and how far the bearing sits into the roller's end.
peg_shoulder = 0.5;
bearing_recess = 0.2;
// The shoulder bears on the inner race only.
peg_body_diameter = 10;
// Angle of the flange taper off the roller's axis, and the flat rim past it.
flange_taper_angle = 40;
flange_rim = 0.6;
spool_hub_diameter = 60;
spool_hub_wall = 2;
spool_flange_thickness = 2;
// Facets round the full circle for the ring's surfaces.
_ring_fn = 720;
// Hinge knuckles, round an M3 that the lid turns on.
knuckle_r = 4.5;
hinge_screw_length = 40;
// The draw latch: a lever pivoting on the base and a link from it to a
// keeper on the lid, each on an M3. Thicknesses along the axis, the
// lever's width, and how far past dead centre it closes (degrees).
lever_thickness = 8;
link_thickness = 5;
lever_width = 8;
lever_length = 24;
lever_throw = 9;
lever_overcentre = 8;
keeper_r = 4;
link_hook_width = 4;
// Clearance between the latch's moving parts, along the axis and round
// its pins (mm).
latch_gap = 0.4;

// --- solved geometry ---
//
// Y is the spool's axis, lane centred on y = 0; X is depth, front +X; Z up.
// Round the axis, `a` is measured from straight up toward the front.

spool_r = spool_diameter / 2;
lane_clear = spool_width + 2 * lane_slack;

// Inside of the panels.
ring_r = spool_r + spool_clearance;

// A panel's edge is as wide as a ridge's base, and the seal runs down its
// middle.
seal_land = seal_ridge_tip + 2 * seal_ridge_height;
seal_r = ring_r + seal_land / 2;
assert(seal_land > wall_thickness, "spool-drybox: the ridge fits a plain wall — the flares aren't needed");

_gland_depth = seal_ridge_height + joint_fit + gasket_depth;
// Half the groove's width where it opens.
_groove_half = seal_ridge_tip / 2 + seal_ridge_height + joint_fit * sqrt(2);

// The lid opens on a plane through the axis, sealed like everything else:
// the base holds the groove and its TPU, the lid a ridge. Where it crosses
// the walls, each wall carries a lip inward wide enough for the groove, so
// the walls sit that much further out than the lane.
_cut_face = 2 * (_groove_half + seal_lip);
_lip_depth = _gland_depth + seal_skin;
wall_in = lane_clear / 2 + _cut_face - wall_thickness;

// Under the panels' edges each wall steps in to a rib deep enough for the
// groove, the PETG under it and a screw's counterbore from outside. The rib
// starts just inside the panels, clear of the spool's rim; the lane between
// the walls is untouched inside it.
rib_height = _gland_depth + seal_skin + m3_counterbore_depth - wall_thickness;
rib_r = seal_r - max(_groove_half, seal_pad_r) - seal_lip;
disc_r = max(seal_r + max(_groove_half, seal_pad_r, m3_counterbore_diameter / 2) + seal_lip, ring_r + _cut_face);
// The rib's face, where the panels' edges seal.
seal_y = wall_in - rib_height;
_ridge_reach = seal_y + seal_ridge_height;
assert(rib_height > 0);
assert(rib_r >= spool_r + 0.8, "spool-drybox: a wall's rib comes within 0.8 mm of the spool's rim — raise spool_clearance");


boss_r = m3_pilot_diameter / 2 + boss_wall;
// How far a screw reaches past the rib's face into a panel's edge.
_pilot_depth = screw_length - (wall_thickness + rib_height - m3_counterbore_depth) + 0.5;
_boss_length = _pilot_depth + 1.5;

function _deg(mm, r = ring_r) = mm / r * 180 / PI;
function _dir(a) = [cos(a), sin(a)];
function _ang(v) = atan2(v[1], v[0]);
// a moved by whole turns to just below, or just above, ref.
function _below(a, ref) = a - 360 * ceil((a - ref) / 360);
function _above(a, ref) = a + 360 * ceil((ref - a) / 360);

// --- rollers and ears ---

roller_r = roller_diameter / 2;
roller_end_gap = peg_shoulder - bearing_recess;
flange_taper = lane_slack - roller_end_gap - flange_rim;
flange_r = roller_r + flange_taper * tan(flange_taper_angle);
roller_length = lane_clear - 2 * roller_end_gap;
// The walls stand _cut_face - wall_thickness further out than the lane, so
// each peg's shoulder is that much longer.
peg_body = peg_shoulder + wall_in - lane_clear / 2;
peg_reach = peg_body + bearing_width;
peg_diameter = bearing_inner_diameter - peg_fit;
bearing_pocket_r = (bearing_outer_diameter - bearing_fit) / 2;
bearing_pocket_depth = bearing_width + bearing_recess;
assert(roller_end_gap >= 0.2, "spool-drybox: the roller would rub the wall — raise peg_shoulder");
assert(flange_taper > 0.5, "spool-drybox: no room for the flange taper — raise lane_slack");
assert(roller_r > bearing_pocket_r + 2, "spool-drybox: no wall left round the bearing pocket — raise roller_diameter");

// The spool sits on both rollers' running surfaces, centred on the axis.
roller_d = spool_r + roller_r;
// The inside of an ear, round its roller.
ear_r = flange_r + roller_clearance;

// How far the walls' rib reaches inside the panels, and their rim outside.
_rib_in = ring_r - rib_r;
_rim_out = disc_r - ring_r;
assert(ear_r - _rib_in >= flange_r + 0.8, "spool-drybox: a wall's rib comes within 0.8 mm of a roller's flange — raise roller_clearance");
assert(ear_fillet > _rim_out + 1, "spool-drybox: ear_fillet is too tight for the walls' rim");

// A fillet circle touches the ring and the ear from outside; ear_psi is
// its angle off the ear's, round the axis, which is also where it meets
// the ring.
_fR = ring_r + ear_fillet;
_fE = ear_r + ear_fillet;
_cos_psi = (_fR * _fR + roller_d * roller_d - _fE * _fE) / (2 * _fR * roller_d);
assert(abs(_cos_psi) < 1, "spool-drybox: an ear can't be filleted into the ring");
ear_psi = acos(_cos_psi);

// Each ear plate runs on round the ring past its fillets far enough for
// its ends' flares, so its ends are square to the ring like the panels'
// ends they meet.
ear_half = ear_psi + _deg(flare_land + seal_land);
ear_angles = [0, 180 - roller_angle, 180 + roller_angle];
_ear_phis = [for (a = ear_angles) a - 90];

function _ear_centre(phi) = roller_d * _dir(phi);

// The outline is a chain of arcs, [centre, radius, from, to, side], run
// anticlockwise round the inside of the panels in the ring's frame. Side
// +1 has the inside toward the centre; -1 is a fillet, the inside away
// from it. Offsetting the chain is changing each radius by side * o.
function _ear_arcs(phi) =
    let (e = _ear_centre(phi),
         fm = _fR * _dir(phi - ear_psi),
         fp = _fR * _dir(phi + ear_psi),
         a_fm = phi - ear_psi + 180,
         a_em = _ang(fm - e),
         a_fp = _ang(e - fp))
        [[fm, ear_fillet, a_fm, _below(_ang(e - fm), a_fm), -1],
         [e, ear_r, a_em, _above(_ang(fp - e), a_em), 1],
         [fp, ear_fillet, a_fp, _below(phi + ear_psi + 180, a_fp), -1]];

_wall_chain = [for (i = [0 : len(_ear_phis) - 1])
    let (p = _ear_phis[i],
         q = i + 1 < len(_ear_phis) ? _ear_phis[i + 1] : _ear_phis[0] + 360)
        each concat(_ear_arcs(p), [[[0, 0], ring_r, p + ear_psi, q - ear_psi, 1]])];

function _arc_pts(arc, o) =
    let (n = max(2, ceil(abs(arc[3] - arc[2]) / 0.5)),
         r = arc[1] + arc[4] * o)
        [for (i = [0 : n - 1]) arc[0] + r * _dir(arc[2] + (arc[3] - arc[2]) * i / n)];

function _outline(o) = [for (arc = _wall_chain) each _arc_pts(arc, o)];

// Screws round an ear plate, as angles round its roller from the ear's
// own angle.
_ear_seal_r = ear_r + seal_land / 2;
ear_screw_angles =
    let (arc = _ear_arcs(0)[1],
         m = _deg(screw_end_margin, _ear_seal_r),
         run = (arc[3] - arc[2] - 2 * m) * PI / 180 * _ear_seal_r)
        _spread(arc[2] + m, arc[3] - m, max(2, 1 + ceil(run / screw_spacing)));

// The module stands on the lowest of its walls' rims — the ears, when the
// rollers sit low. Local +Y is down.
axis_z = max([for (p = _outline(_rim_out)) p[1]]);

// --- the lid's cut ---
//
// The lid opens on a plane through the axis, from where the front ear's
// fillet meets the ring, just past the front roller, to the back. The lid
// is everything on the top and front of it: both walls' tops, the top ear
// and its roller, and the panels between. It hinges at the back end and a
// draw latch holds it at the front end.
cut_angle = ear_angles[1] - ear_psi;
_cut_phi = cut_angle - 90;
// In the ring's frame: s along the cut toward the front end, t across it
// toward the lid.
_cut_d = _dir(_cut_phi);
_cut_n = _dir(_cut_phi - 90);
function _cut_st(p) = [p * _cut_d, p * _cut_n];

assert(_cut_st(_ear_centre(_ear_phis[0]))[1] - ear_r - _rim_out >= _lip_depth + 1,
       "spool-drybox: the top ear reaches the lid's cut");
assert(-_cut_st(_ear_centre(_ear_phis[1]))[1] - ear_r >= _lip_depth + 1,
       "spool-drybox: the front ear reaches the lid's cut");

// The panels round the ring: [name, a0, a1, a0's end, a1's end, half].
// An end is "seam", facing an ear plate, and holds a TPU strip so the ear
// plates can have plain ends; or "cut", on the lid's cut. The half is the
// side of the cut it's on: +1 lid, -1 base.
panels = [
    ["lid-back", cut_angle - 180, ear_angles[0] - ear_half, "cut", "seam", 1],
    ["lid-front", ear_angles[0] + ear_half, cut_angle, "seam", "cut", 1],
    ["under", ear_angles[1] + ear_half, ear_angles[2] - ear_half, "seam", "seam", -1],
    ["back", ear_angles[2] + ear_half, cut_angle + 180, "seam", "cut", -1],
];

function _panel(name) = [for (p = panels) if (p[0] == name) p][0];

// Each end is trimmed half a joint_fit off its seam.
_trim = _deg(joint_fit / 2, seal_r);
function _panel_a0(p) = p[1] + _trim;
function _panel_span(p) = p[2] - p[1] - 2 * _trim;

function _spread(a, b, n) = n == 1 ? [(a + b) / 2] : [for (i = [0 : n - 1]) a + (b - a) * i / (n - 1)];

// A panel's screws, as angles from its own a0 end.
function _panel_screws(p) =
    let (span = _panel_span(p),
         m = _deg(screw_end_margin, seal_r),
         run = (span - 2 * m) * PI / 180 * seal_r)
        _spread(m, span - m, max(2, 1 + ceil(run / screw_spacing)));

_short = [for (p = panels) if (_panel_span(p) * PI / 180 * seal_r < 2 * screw_end_margin) p[0]];
assert(len(_short) == 0, str("spool-drybox: too short to take its screws: ", _short));

// Every screw round a wall, in the ring's frame.
screw_angles = [for (p = panels, f = _panel_screws(p)) _panel_a0(p) + f];
wall_screws = concat([for (a = screw_angles) seal_r * _dir(a - 90)],
                     [for (p = _ear_phis, t = ear_screw_angles) _ear_centre(p) + _ear_seal_r * _dir(p + t)]);

_wall_x = [for (p = _outline(_rim_out)) p[0]];
_wall_y = [for (p = _outline(_rim_out)) p[1]];
assert(max(max(_wall_x) - min(_wall_x), max(_wall_y) - min(_wall_y)) <= print_bed - 10,
       "spool-drybox: a wall won't fit the print bed");

echo(str("spool-drybox: walls ", max(_wall_x) - min(_wall_x), " × ", max(_wall_y) - min(_wall_y),
         " mm, module ", 2 * (wall_in + wall_thickness), " mm wide; ", len(wall_screws),
         " screws per wall, ", len(ear_screw_angles), " per ear plate per side"));

// --- frames ---

// Local frame of the ring: Z along the spool's axis (world +Y), angle phi
// from local +X, so phi = a - 90.
module _on_axis() {
    translate([0, 0, axis_z]) rotate([-90, 0, 0]) children();
}

// --- seals ---
//
// One cross-section, drawn once in its own frame: u across the seal line,
// v out of the face of the part that holds the TPU, that part on v < 0.
// A ridge on the other part presses into a groove; under the groove a
// channel full of TPU, and a column of it standing gasket_squeeze into the
// ridge's path. The ridge's flanks leave room beside the column for the
// TPU it displaces. The walls hold the TPU; the panels carry the ridges.

module _ridge_2d(grow, top) {
    h = seal_ridge_height;
    w = seal_ridge_tip / 2;
    offset(delta = grow)
        polygon([[-w - h - top, top], [w + h + top, top], [w, -h], [-w, -h]]);
}

module _groove_2d() {
    _ridge_2d(joint_fit, 1);
    translate([-gasket_width / 2, -_gland_depth])
        square([gasket_width, gasket_depth + _eps]);
}

module _gasket_2d() {
    translate([-gasket_width / 2, -_gland_depth])
        square([gasket_width, gasket_depth]);
    translate([-seal_ridge_tip / 2, -seal_ridge_height - joint_fit - _eps])
        square([seal_ridge_tip, joint_fit + gasket_squeeze + _eps]);
}

module _seal_2d(kind) {
    if (kind == "ridge") _ridge_2d(0, _eps);
    else if (kind == "groove") _groove_2d();
    else _gasket_2d();
}

// The section on the +Y wall's rib face, u out from the inside of the
// panels.
module _seal_u(kind) {
    translate([seal_land / 2, seal_y]) scale([1, -1]) _seal_2d(kind);
}

// A section in (u, z) swept along one arc of the outline.
module _arc_sweep(arc) {
    translate(arc[0]) rotate([0, 0, min(arc[2], arc[3])])
        rotate_extrude(angle = abs(arc[3] - arc[2]), $fn = _ring_fn)
            translate([arc[1], 0]) scale([arc[4], 1]) children();
}

module _chain_sweep() {
    for (arc = _wall_chain) _arc_sweep(arc) children();
}

// --- the cut's seal ---
//
// The same section again, run round a loop on the cut: a rectangle in
// (s, z) whose short sides cross the panels' ends down the middle of their
// lands and whose long sides run along the walls' lips. The base's face is
// half a joint_fit below the cut and the lid's half a joint_fit above, so
// the ridge grows by a joint_fit to reach from the lid's face.

// The cut's plane coordinates (s, t, z) in the ring's frame.
module _in_cut() {
    multmatrix([[_cut_d[0], _cut_n[0], 0, 0], [_cut_d[1], _cut_n[1], 0, 0], [0, 0, 1, 0]]) children();
}

_loop_s = ring_r + _cut_face / 2;
_loop_z = wall_in + wall_thickness - _cut_face / 2;
_loop_rc = 4;

module _loop_2d(o) {
    offset(r = _loop_rc + o) square([2 * (_loop_s - _loop_rc), 2 * (_loop_z - _loop_rc)], center = true);
}

// The section as trapezoids symmetric about the loop, [v0, half0, v1,
// half1], v out of the base's face.
function _loop_layers(kind) =
    let (h = seal_ridge_height, w = seal_ridge_tip / 2, g = joint_fit, r2 = sqrt(2))
        kind == "ridge" ? [[-h, w, g + _eps, w + h + g + _eps]]
      : kind == "groove" ? [[-h - g, w - g + g * r2, 1 + g, w + h + 1 + g + g * r2],
                            [-_gland_depth, gasket_width / 2, -_gland_depth + gasket_depth + _eps, gasket_width / 2]]
      : [[-_gland_depth, gasket_width / 2, -_gland_depth + gasket_depth, gasket_width / 2],
         [-h - g - _eps, w, -h + gasket_squeeze, w]];

module _loop_band(l) {
    difference() {
        hull() for (k = [0, 1]) translate([0, 0, l[2 * k]]) linear_extrude(_eps) _loop_2d(l[2 * k + 1]);
        hull() for (k = [0, 1]) translate([0, 0, l[2 * k]]) linear_extrude(_eps) _loop_2d(-l[2 * k + 1]);
    }
}

// e = +1 or -1 keeps only that end of the cut's short sides.
module _cut_seal(kind, e = 0) {
    intersection() {
        _in_cut() multmatrix([[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0]])
            translate([0, 0, -joint_fit / 2]) for (l = _loop_layers(kind)) _loop_band(l);
        if (e != 0) _in_cut() scale([e, 1, 1]) translate([0, -500, -500]) cube(1000);
    }
}

// One side of the cut, clear of it by half a joint_fit: +1 the lid, -1 the
// base.
module _half(side) {
    _in_cut() translate([-500, side > 0 ? joint_fit / 2 : -500 - joint_fit / 2, -500]) cube([1000, 500, 1000]);
}

// Where along the axis the walls hold the seal, and where the panels do.
module _wall_zone() { translate([-500, -500, seal_y]) cube([1000, 1000, 500]); }
module _panel_zone() { translate([-500, -500, -seal_y]) cube([1000, 1000, 2 * seal_y]); }

// A panel's end on the cut, e = +1 at its front end, -1 at the back: the
// panel stays _cut_face wide for _lip_depth off the cut, then comes back to
// wall_thickness at 45°.
module _cut_land(e, side) {
    _in_cut() scale([e, side, 1]) translate([0, joint_fit / 2, 0]) hull() {
        translate([ring_r, 0, -seal_y]) cube([_cut_face, _lip_depth, 2 * seal_y]);
        translate([ring_r, 0, -seal_y]) cube([wall_thickness, _lip_depth + _cut_face - wall_thickness, 2 * seal_y]);
    }
}

// What the hinge and latch keep out of: the walls' outline wherever the
// walls are, coming in at 45° to the panels' outside toward the middle,
// so anything standing out of a panel starts clear of the walls and grows
// into its panel without overhanging.
module _wall_clear() {
    step = 0.5;
    n = ceil((_rim_out + step - wall_thickness) / step);
    for (m = [0, 1]) mirror([0, 0, m])
        for (i = [0 : n])
            translate([0, 0, seal_y - step - i * step]) linear_extrude(100)
                polygon(_outline(max(wall_thickness, _rim_out + step - i * step)));
}

// --- walls ---

// The TPU channel widened to a disc round a screw.
module _seal_pad() {
    translate([0, 0, seal_y + _gland_depth - gasket_depth]) cylinder(h = gasket_depth + _eps, r = seal_pad_r);
}

// A roller's axle, standing out of a wall's inside face: a shoulder that
// holds the bearing's inner race off the wall, then the shaft through it.
// It prints standing up, off the wall's inside face.
module _peg() {
    rs = peg_diameter / 2;
    rb = peg_body_diameter / 2;
    c = 0.8;
    rotate_extrude()
        polygon([[0, 0], [rb, 0], [rb, peg_body], [rs, peg_body],
                 [rs, peg_reach - c], [rs - c, peg_reach], [0, peg_reach]]);
}

module _disc_body() {
    translate([0, 0, wall_in]) linear_extrude(wall_thickness) polygon(_outline(_rim_out));
    translate([0, 0, seal_y]) linear_extrude(rib_height + _eps)
        difference() {
            polygon(_outline(_rim_out));
            polygon(_outline(-_rib_in));
        }
    for (p = _ear_phis)
        translate(concat(_ear_centre(p), [wall_in])) mirror([0, 0, 1]) _peg();
}

// A wall's lip along the cut, inward to the lane on its side of the cut.
module _wall_lip(side) {
    intersection() {
        _in_cut() scale([1, side, 1]) translate([-disc_r - 1, joint_fit / 2, lane_clear / 2])
            cube([2 * disc_r + 2, _lip_depth, wall_in - lane_clear / 2 + _eps]);
        linear_extrude(100) polygon(_outline(_rim_out));
    }
}

// The right (+Y) wall's half on one side of the cut, in the ring's frame:
// plate, rib, the groove round the rib's face, a counterbored hole at every
// screw from outside, and a peg in each ear. The base's half takes the
// cut's groove along its lip, the lid's the ridge.
module _disc(side) {
    top = wall_in + wall_thickness;
    difference() {
        intersection() {
            union() { _disc_body(); _wall_lip(side); }
            _half(side);
        }
        _chain_sweep() _seal_u("groove");
        if (side < 0) _cut_seal("groove");
        for (p = wall_screws) translate(p) {
            _seal_pad();
            translate([0, 0, seal_y - _eps]) cylinder(h = top - seal_y + 2 * _eps, d = m3_clearance_diameter);
            translate([0, 0, top - m3_counterbore_depth]) cylinder(h = m3_counterbore_depth + _eps, d = m3_counterbore_diameter);
        }
    }
    if (side > 0) intersection() { _cut_seal("ridge"); _wall_zone(); }
}

// The screw threads through the TPU, so the hole in it is pilot-sized.
module _disc_gasket(side) {
    intersection() {
        difference() {
            union() {
                _chain_sweep() _seal_u("gasket");
                for (p = wall_screws) translate(p) _seal_pad();
            }
            for (p = wall_screws) translate(p)
                translate([0, 0, seal_y]) cylinder(h = _gland_depth + 1, d = m3_pilot_diameter);
        }
        _half(side);
    }
    if (side < 0) intersection() { _cut_seal("gasket"); _wall_zone(); }
}

// The walls lie on their outside face to print, rib up. The left wall is
// the right one's mirror image.
module _disc_print(s) {
    mirror([0, s < 0 ? 1 : 0, 0])
        translate([0, 0, wall_in + wall_thickness]) rotate([180, 0, 0]) children();
}

module wall_right() { _disc_print(1) _disc(-1); }
module wall_left() { _disc_print(-1) _disc(-1); }
module wall_right_gasket() { _disc_print(1) _disc_gasket(-1); }
module wall_left_gasket() { _disc_print(-1) _disc_gasket(-1); }
module lid_wall_right() { _disc_print(1) _disc(1); }
module lid_wall_left() { _disc_print(-1) _disc(1); }
module lid_wall_right_gasket() { _disc_print(1) _disc_gasket(1); }
module lid_wall_left_gasket() { _disc_print(-1) _disc_gasket(1); }

// --- hinge ---
//
// At the cut's back end, on its line just outside the walls: a knuckle
// off the back panel from the base's side, and one off the lid's back
// panel above it, each tied into its panel's land by a web on its own side
// of the cut. An M3 from the lid's end runs through the lid's knuckle and
// threads into the base's. Each knuckle starts on the bed as its panel
// prints; the lid's panel prints upside down.

hinge_s = -(disc_r + 1 + knuckle_r);
_hinge_z = [_ridge_reach, joint_fit];

module _hinge_body(side) {
    z0 = side > 0 ? _hinge_z[1] : -_hinge_z[0];
    z1 = side > 0 ? _hinge_z[0] : -_hinge_z[1];
    difference() {
        _in_cut() translate([0, 0, z0]) linear_extrude(z1 - z0) {
            translate([hinge_s, 0]) circle(r = knuckle_r);
            scale([1, side]) intersection() {
                hull() {
                    translate([hinge_s, 0]) circle(r = knuckle_r);
                    translate([-ring_r - _cut_face, joint_fit / 2]) square([_cut_face - 1, _lip_depth]);
                }
                translate([-500, joint_fit / 2]) square([1000, 500]);
            }
        }
        _wall_clear();
    }
}

module _hinge_holes(side) {
    _in_cut() translate([hinge_s, 0, 0])
        if (side > 0) {
            cylinder(h = 3 * _ridge_reach, d = m3_clearance_diameter, center = true);
            translate([0, 0, _ridge_reach - m3_counterbore_depth]) cylinder(h = m3_counterbore_depth + 1, d = m3_counterbore_diameter);
        } else
            cylinder(h = 3 * _ridge_reach, d = m3_pilot_diameter, center = true);
}

assert(hinge_screw_length - (_ridge_reach - m3_counterbore_depth - _hinge_z[1]) >= 8,
       "spool-drybox: the hinge screw barely reaches the base's knuckle");
assert(_ridge_reach - m3_counterbore_depth + _hinge_z[1] - hinge_screw_length >= -_ridge_reach + 1,
       "spool-drybox: the hinge screw comes out of the base's knuckle");

// --- latch ---
//
// At the cut's front end, beside the front ear. A lever pivots on a lug off
// the front ear plate and lies down the ear's outside when shut, against a
// post standing up off the lug. A link pinned to the lever hooks over a
// keeper off the lid's front panel. Shut, the link's pin sits lever_overcentre past the line from
// the lever's pivot to the keeper, so the link's pull holds it shut. All
// three are profiles in (s, t) stood up along the axis; the lever and link
// print flat. The lug is under the lever, the link over it.

_front_ear = _cut_st(_ear_centre(_ear_phis[1]));
_lever_boss = lever_width / 2 + 1.5;
_lever_z = [-lever_thickness / 2, lever_thickness / 2];
_link_z = [_lever_z[1] + latch_gap, _lever_z[1] + latch_gap + link_thickness];
// The lever's closed centreline runs past the ear's outside, lever_width /
// 2 and a gap off it.
_lever_rest = ear_r + wall_thickness + 0.5 + lever_width / 2;
_lever_dir = [-sin(lever_overcentre), -cos(lever_overcentre)];
latch_pivot_t = -(_lever_boss + 1);
latch_s = _front_ear[0] + (_lever_rest - sin(lever_overcentre) * (_front_ear[1] - latch_pivot_t)) / cos(lever_overcentre);
latch_pivot = [latch_s, latch_pivot_t];
latch_pin = latch_pivot + lever_throw * _lever_dir;
keeper = [latch_s, keeper_r + 0.5];

assert(latch_pivot_t + _lever_boss <= -joint_fit, "spool-drybox: the lever's pivot reaches past the cut");
// The post the lever rests on shut, beside its tip on the ear's side.
_stop_r = 2.5;
latch_stop = latch_pivot + (lever_length - lever_width / 2 - _stop_r) * _lever_dir
           + (lever_width / 2 + latch_gap + _stop_r) * [-cos(lever_overcentre), sin(lever_overcentre)];
// The lever's tip stays off the table the module stands on.
_lever_tip = latch_pivot + lever_length * _lever_dir;
assert(axis_z - (_lever_tip[0] * _cut_d + _lever_tip[1] * _cut_n)[1] >= lever_width / 2 + 2,
       "spool-drybox: the latch lever reaches the table");

module _lever_2d() {
    difference() {
        hull() {
            translate(latch_pivot) circle(r = _lever_boss);
            translate(latch_pivot + lever_length * _lever_dir) circle(r = lever_width / 2);
        }
        translate(latch_pivot) circle(d = m3_clearance_diameter);
        translate(latch_pin) circle(d = m3_pilot_diameter);
    }
}

module _link_2d() {
    r_in = keeper_r + latch_gap;
    r_out = r_in + link_hook_width;
    difference() {
        union() {
            hull() {
                translate(latch_pin) circle(r = _lever_boss - 1);
                translate(keeper + [r_in, 0]) square([link_hook_width, _eps]);
            }
            translate(keeper) intersection() {
                circle(r = r_out);
                translate([-r_out, 0]) square([2 * r_out, r_out]);
            }
        }
        translate(keeper) circle(r = r_in);
        translate(latch_pin) circle(d = m3_clearance_diameter);
    }
}

// The lever and link in place, shut, in the ring's frame.
module _lever_in_place() {
    difference() {
        _in_cut() translate([0, 0, _lever_z[0]]) linear_extrude(lever_thickness) _lever_2d();
        _in_cut() translate(concat(latch_pivot, [_lever_z[1] - m3_counterbore_depth]))
            cylinder(h = m3_counterbore_depth + 1, d = m3_counterbore_diameter);
    }
}

module _link_in_place() {
    _in_cut() translate([0, 0, _link_z[0]]) linear_extrude(link_thickness) _link_2d();
}

// The lug under the lever's pivot, off the front ear plate, from the bed
// up to the lever.
module _latch_lug() {
    e = _front_ear;
    difference() {
        _in_cut() translate([0, 0, -_ridge_reach]) linear_extrude(_lever_z[0] - latch_gap + _ridge_reach)
            intersection() {
                hull() {
                    translate(latch_pivot) circle(r = _lever_boss);
                    translate(latch_stop) circle(r = _stop_r);
                    translate(e) circle(r = ear_r + wall_thickness - 1);
                }
                translate([-500, -500]) square([1000, 500 - joint_fit / 2]);
            }
        linear_extrude(100, center = true) polygon(_outline(0));
        _wall_clear();
        _in_cut() translate(latch_pivot) cylinder(h = 100, d = m3_pilot_diameter, center = true);
    }
    _in_cut() translate(concat(latch_stop, [_lever_z[0] - latch_gap - _eps]))
        cylinder(h = lever_thickness + latch_gap + _eps, r = _stop_r);
}

// The keeper off the lid's front panel: a round bar for the link's hook,
// on a web that deepens toward the panel, full height.
module _keeper() {
    difference() {
        _in_cut() translate([0, 0, -_ridge_reach]) linear_extrude(2 * _ridge_reach) {
            // The web's top stays under the tip of the link's hook.
            t0 = joint_fit / 2 + 0.5;
            top = keeper[1] - 0.5;
            tip = keeper[0] - keeper_r - latch_gap - link_hook_width - 1;
            translate(keeper) circle(r = keeper_r);
            translate([ring_r, t0]) square([keeper[0] - ring_r, top - t0]);
            hull() {
                translate([ring_r, t0]) square([tip - ring_r, top - t0]);
                translate([ring_r, t0]) square([1, 20]);
            }
        }
        linear_extrude(100, center = true) polygon(_outline(0));
        _wall_clear();
    }
}

// --- panels ---
//
// A panel is drawn in the ring's frame from phi = 0 round to its span,
// standing on its -Z edge — also its print pose. It's wall_thickness
// thick, flaring at 45° to seal_land at every edge, with a ridge along both
// long edges and a boss round each screw.

// The panel's section, u out from its inside face, t thick between the
// flares.
module _panel_section(t) {
    e = seal_land;
    f = flare_land;
    polygon([[0, -seal_y], [e, -seal_y], [e, -seal_y + f],
             [t, -seal_y + f + e - t], [t, seal_y - f - (e - t)],
             [e, seal_y - f], [e, seal_y], [0, seal_y]]);
    for (s = [-1, 1])
        translate([e / 2, s * seal_y]) scale([1, -s]) _ridge_2d(0, _eps);
}

// The same across the ring.
module _panel_profile(t) {
    translate([ring_r, 0]) _panel_section(t);
}

// A thin slice of the band outside wall_thickness, x thick, at phi = 0.
module _flare_slice(x) {
    rotate([90, 0, 0]) linear_extrude(_eps, center = true)
        translate([ring_r + wall_thickness - 0.05, -seal_y]) square([x - wall_thickness + 0.05, 2 * seal_y]);
}

// The flare at the phi = 0 end: full seal width for flare_land, then 45°
// back down.
module _end_flare() {
    rotate_extrude(angle = _deg(flare_land), $fn = _ring_fn) _panel_profile(seal_land);
    hull() {
        rotate([0, 0, _deg(flare_land)]) _flare_slice(seal_land);
        rotate([0, 0, _deg(flare_land + seal_land - wall_thickness)]) _flare_slice(wall_thickness);
    }
}

// A screw boss up from each edge, coned off at 45°, kept out of the lane:
// clear of the circle of radius cav_r the panel's inside runs round.
module _boss(cav_r = ring_r) {
    difference() {
        for (s = [-1, 1])
            scale([1, 1, s]) translate([0, 0, seal_y - _boss_length]) {
                cylinder(h = _boss_length, r = boss_r);
                translate([0, 0, -boss_r]) cylinder(h = boss_r, r1 = 0, r2 = boss_r);
            }
        translate([-(cav_r + seal_land / 2), 0, 0])
            cylinder(h = 3 * seal_y, r = cav_r, center = true, $fn = _ring_fn);
    }
}

// The seam TPU at the phi = 0 end, which faces -Y locally: a channel down
// the end face, and a column of it standing `proud` past the face.
_seam_proud = joint_fit + gasket_squeeze;

module _seam_channel() {
    translate([seal_r - gasket_width / 2, -_eps, -_ridge_reach - 1])
        cube([gasket_width, gasket_depth + _eps, 2 * _ridge_reach + 2]);
}

module _seam_gasket() {
    intersection() {
        union() {
            _seam_channel();
            translate([seal_r - seal_ridge_tip / 2, -_seam_proud, -_ridge_reach - 1])
                cube([seal_ridge_tip, _seam_proud + _eps, 2 * _ridge_reach + 2]);
        }
        rotate([-90, 0, 0]) translate([0, 0, -_seam_proud])
            linear_extrude(_seam_proud + gasket_depth) mirror([0, 1, 0]) _panel_profile(seal_land);
    }
}

// Both ends of a panel of span A: phi = 0 as drawn, phi = A mirrored onto
// it.
module _at_end(A, end) {
    if (end == 0) children();
    else rotate([0, 0, A]) mirror([0, 1, 0]) children();
}

// A screw's pilot into a boss from each edge.
module _pilots() {
    for (s = [-1, 1]) scale([1, 1, s])
        translate([0, 0, seal_y - _pilot_depth]) cylinder(h = _pilot_depth + seal_ridge_height + 1, d = m3_pilot_diameter);
}

// Which end of the cut a panel's cut end is on: +1 the front, -1 the back.
function _cut_end(p) = cos((p[3] == "cut" ? p[1] : p[2]) - cut_angle) > 0 ? 1 : -1;
function _has_cut(p) = p[3] == "cut" || p[4] == "cut";

// Ring-frame geometry into a panel's own frame.
module _to_panel(p) { rotate([0, 0, 90 - _panel_a0(p)]) children(); }

module _panel_local(p) {
    A = _panel_span(p);
    side = p[5];
    difference() {
        union() {
            rotate_extrude(angle = A, $fn = _ring_fn) _panel_profile(wall_thickness);
            for (end = [0, 1]) if (p[3 + end] == "seam") _at_end(A, end) _end_flare();
            for (f = _panel_screws(p)) rotate([0, 0, f]) translate([seal_r, 0, 0]) _boss();
            if (_has_cut(p)) _to_panel(p) {
                _cut_land(_cut_end(p), side);
                if (_cut_end(p) < 0) _hinge_body(side);
                if (p[0] == "lid-front") _keeper();
            }
        }
        for (f = _panel_screws(p)) rotate([0, 0, f]) translate([seal_r, 0, 0]) _pilots();
        for (end = [0, 1]) if (p[3 + end] == "seam") _at_end(A, end) _seam_channel();
        if (_has_cut(p)) _to_panel(p) {
            if (side < 0) _cut_seal("groove", _cut_end(p));
            if (_cut_end(p) < 0) _hinge_holes(side);
        }
    }
    if (_has_cut(p) && side > 0) _to_panel(p) intersection() { _cut_seal("ridge", _cut_end(p)); _panel_zone(); }
}

module _panel_gasket_local(p) {
    for (end = [0, 1]) if (p[3 + end] == "seam") _at_end(_panel_span(p), end) _seam_gasket();
    if (_has_cut(p) && p[5] < 0) _to_panel(p) intersection() { _cut_seal("gasket", _cut_end(p)); _panel_zone(); }
}

// A panel or its gasket in place round the ring.
module _panel_in_place(p) {
    _on_axis() rotate([0, 0, _panel_a0(p) - 90]) children();
}

// Standing on end to print. The lid's back panel stands on its other end,
// so its hinge knuckle starts on the bed.
module _panel_print(flip = false) {
    translate([0, 0, _ridge_reach]) rotate([flip ? 180 : 0, 0, 0]) children();
}

module panel(name) { _panel_print(name == "lid-back") _panel_local(_panel(name)); }
module panel_gasket(name) { _panel_print(name == "lid-back") _panel_gasket_local(_panel(name)); }

// --- ear plates ---
//
// An ear plate in the ring's frame with its roller on +X: a stub of ring at
// each end, flared and cut square like the panels it meets, then the
// fillets and the ear, all one section swept along the outline. The top
// and back ears take the same plate. The front ear's plate stops at the
// cut where its fillet meets the ring, on a land holding the cut's groove,
// and carries the latch's lug.

module _ear_plate_local() {
    a0 = -ear_half + _trim;
    difference() {
        union() {
            for (m = [0, 1]) mirror([0, m, 0]) rotate([0, 0, a0]) {
                rotate_extrude(angle = -ear_psi - a0, $fn = _ring_fn) _panel_profile(wall_thickness);
                _end_flare();
            }
            for (arc = _ear_arcs(0)) _arc_sweep(arc) _panel_section(wall_thickness);
            for (t = ear_screw_angles)
                translate(_ear_centre(0)) rotate([0, 0, t]) translate([_ear_seal_r, 0, 0]) _boss(ear_r);
        }
        for (t = ear_screw_angles)
            translate(_ear_centre(0)) rotate([0, 0, t]) translate([_ear_seal_r, 0, 0]) _pilots();
    }
}

_front_phi = _ear_phis[1];

module _ear_plate_front_local() {
    difference() {
        union() {
            intersection() { _ear_plate_local(); rotate([0, 0, -_front_phi]) _half(-1); }
            rotate([0, 0, -_front_phi]) { _cut_land(1, -1); _latch_lug(); }
        }
        rotate([0, 0, -_front_phi]) _cut_seal("groove", 1);
    }
}

module _ear_plate_front_gasket_local() {
    rotate([0, 0, -_front_phi]) intersection() { _cut_seal("gasket", 1); _panel_zone(); }
}

// Standing on end to print, its roller's axis on the origin.
module ear_plate() { _panel_print() translate([-roller_d, 0, 0]) _ear_plate_local(); }
module ear_plate_front() { _panel_print() translate([-roller_d, 0, 0]) _ear_plate_front_local(); }
module ear_plate_front_gasket() { _panel_print() translate([-roller_d, 0, 0]) _ear_plate_front_gasket_local(); }

// --- latch parts, lying flat to print ---

module latch_lever() {
    translate(-concat(latch_pivot, [0])) difference() {
        linear_extrude(lever_thickness) _lever_2d();
        translate(concat(latch_pivot, [lever_thickness - m3_counterbore_depth]))
            cylinder(h = m3_counterbore_depth + 1, d = m3_counterbore_diameter);
    }
}

module latch_link() { translate(-concat(latch_pin, [0])) linear_extrude(link_thickness) _link_2d(); }

// --- rollers ---

// One roller, standing on its end ready to print. A 608 presses into each
// end; the flanges taper in so a spool is steered to the middle.
module roller() {
    l = roller_length;
    t = flange_taper;
    fw = flange_rim;
    difference() {
        rotate_extrude()
            polygon([[0, 0], [flange_r, 0], [flange_r, fw], [roller_r, fw + t],
                     [roller_r, l - fw - t], [flange_r, l - fw], [flange_r, l], [0, l]]);
        translate([0, 0, -_eps]) cylinder(h = l + 2 * _eps, d = peg_diameter + peg_clearance);
        translate([0, 0, -_eps]) cylinder(h = bearing_pocket_depth + _eps, r = bearing_pocket_r);
        translate([0, 0, l - bearing_pocket_depth]) cylinder(h = bearing_pocket_depth + _eps, r = bearing_pocket_r);
    }
}

// --- assembly ---

// The lid swung open `open` degrees on its hinge, in the ring's frame.
module _lid_swing(open) {
    h = hinge_s * _cut_d;
    translate(h) rotate([0, 0, -open]) translate(-h) children();
}

// The lever swung open about its pivot, away from its post.
module _lever_swing(open) {
    b = latch_pivot[0] * _cut_d + latch_pivot[1] * _cut_n;
    translate(b) rotate([0, 0, -open]) translate(-b) children();
}

module _both_walls() {
    _on_axis() children();
    mirror([0, 1, 0]) _on_axis() children();
}

module module_walls(open = 0) {
    _both_walls() _disc(-1);
    _both_walls() _lid_swing(open) _disc(1);
}

module module_wall_gaskets(open = 0) {
    _both_walls() _disc_gasket(-1);
    _both_walls() _lid_swing(open) _disc_gasket(1);
}

module _panel_swing(p, open) {
    _on_axis() _lid_swing(p[5] > 0 ? open : 0) rotate([0, 0, _panel_a0(p) - 90]) children();
}

module module_panels(open = 0) {
    for (p = panels) _panel_swing(p, open) _panel_local(p);
}

module module_panel_gaskets(open = 0) {
    for (p = panels) _panel_swing(p, open) _panel_gasket_local(p);
    _on_axis() rotate([0, 0, _front_phi]) _ear_plate_front_gasket_local();
}

module module_ear_plates(open = 0) {
    _on_axis() {
        _lid_swing(open) rotate([0, 0, _ear_phis[0]]) _ear_plate_local();
        rotate([0, 0, _ear_phis[1]]) _ear_plate_front_local();
        rotate([0, 0, _ear_phis[2]]) _ear_plate_local();
    }
}

module module_rollers(open = 0) {
    for (i = [0 : len(_ear_phis) - 1])
        _on_axis() _lid_swing(i == 0 ? open : 0)
            translate(concat(_ear_centre(_ear_phis[i]), [-roller_length / 2])) roller();
}

module module_latch(open = 0) {
    _on_axis() _lever_swing(open) { _lever_in_place(); _link_in_place(); }
}

// Reference only: a spool, seated on the axis.
module spool() {
    h = spool_width;
    f = spool_flange_thickness;
    translate([0, 0, axis_z])
        rotate([90, 0, 0])
            difference() {
                union() {
                    cylinder(h = h, d = spool_hub_diameter + 2 * spool_hub_wall, center = true);
                    for (s = [-1, 1])
                        translate([0, 0, s * (h - f) / 2])
                            cylinder(h = f, d = spool_diameter, center = true, $fn = 180);
                }
                cylinder(h = h + 2 * _eps, d = spool_hub_diameter, center = true);
            }
}

// --- print plates ---
//
// Laid out for a print_bed square centred on the origin. The U1 changes
// tools mid-print, so a part and its TPU print together on one plate.

_plate_gap = 3;

// A wall's base and lid halves side by side, as they go together, opened
// out along the cut.
module plate_wall(s, part) {
    translate([0, -s * 16, 0]) _disc_print(s) for (side = [-1, 1]) translate((side > 0 ? 6 : 0) * _cut_n) {
        if (part == "walls") _disc(side);
        else _disc_gasket(side);
    }
}

// A panel standing on end, turned so its middle faces +Y and moved down by
// `drop`: panels nest arc in arc.
module _plate_panel(name, drop, part) {
    p = _panel(name);
    flip = name == "lid-back";
    translate([0, -drop, 0]) rotate([0, 0, flip ? 90 + _panel_span(p) / 2 : 90 - _panel_span(p) / 2])
        _panel_print(flip) {
            if (part == "panels") _panel_local(p);
            else _panel_gasket_local(p);
        }
}

// The lid's two panels, the back one nested inside the front one's curve.
module plate_lid_panels(part) {
    translate([14, -83, 0]) {
        _plate_panel("lid-front", 0, part);
        _plate_panel("lid-back", 26, part);
    }
}

// The base's back and underneath panels nested, the front ear plate below.
module plate_base_panels(part) {
    translate([0, -10, 0]) {
        _plate_panel("back", 0, part);
        _plate_panel("under", 14, part);
    }
    translate([0, -65, 0]) {
        if (part == "panels") ear_plate_front();
        else ear_plate_front_gasket();
    }
}

// The top and back ear plates, the three rollers, and the latch.
module plate_small(part) {
    if (part == "ears") for (s = [-1, 1]) translate([s * 28, 51, 0]) ear_plate();
    if (part == "rollers") for (i = [-1 : 1]) translate([i * (2 * flange_r + _plate_gap), -9, 0]) roller();
    if (part == "latch") {
        translate([-20, -54, 0]) latch_lever();
        translate([20, -54, 0]) latch_link();
    }
}
