// BEGIN_DESCRIPTION
// One sealed dry-box module for a single 200 mm spool, printed in pieces
// on a Snapmaker U1 with 75A TPU gaskets printed in place.
//
// Two round side walls, the spool's diameter plus a little clearance and
// wall, with curved panels between them. Going round from the top: the
// hold-down spring module, the lid, the front panel, the front roller
// module, the underneath panel, the rear roller module and the back panel.
// The three modules are separate pieces that bolt between the walls; they
// aren't drawn yet, so their places are gaps.
//
// Every panel edge is a ridge pressing into a TPU bead in a groove in the
// wall, squeezed by M3 cap screws that run straight down the middle of the
// TPU channel into the panel's edge. Where a panel meets a module or
// another panel, a TPU strip printed into its end presses on its
// neighbour.
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

// Where the two roller modules sit, each this far round from the bottom
// (degrees). The spring module sits at the top.
roller_angle = 40;

// Arc each module takes up along the panels' inside (mm).
module_arc = 40;

// Where the lid meets the front panel, round from the top (degrees).
lid_seam_angle = 90;

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
spool_hub_diameter = 60;
spool_hub_wall = 2;
spool_flange_thickness = 2;
// Facets round the full circle for the ring's surfaces.
_ring_fn = 720;

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

// Under the panels' edges each wall steps in to a rib deep enough for the
// groove, the PETG under it and a screw's counterbore from outside. The rib
// starts just inside the panels, clear of the spool's rim; the lane between
// the walls is untouched inside it.
rib_height = _gland_depth + seal_skin + m3_counterbore_depth - wall_thickness;
rib_r = seal_r - max(_groove_half, seal_pad_r) - seal_lip;
disc_r = seal_r + max(_groove_half, seal_pad_r, m3_counterbore_diameter / 2) + seal_lip;
// The rib's face, where the panels' edges seal.
seal_y = lane_clear / 2 - rib_height;
assert(rib_height > 0);
assert(rib_r >= spool_r + 0.8, "spool-drybox: a wall's rib comes within 0.8 mm of the spool's rim — raise spool_clearance");

// The module stands on its walls' rims.
axis_z = disc_r;

boss_r = m3_pilot_diameter / 2 + boss_wall;
// How far a screw reaches past the rib's face into a panel's edge.
_pilot_depth = screw_length - (wall_thickness + rib_height - m3_counterbore_depth) + 0.5;
_boss_length = _pilot_depth + 1.5;

function _deg(mm, r = ring_r) = mm / r * 180 / PI;

module_half = _deg(module_arc / 2);
module_angles = [0, 180 - roller_angle, 180 + roller_angle];

assert(lid_seam_angle > module_half + 10 && lid_seam_angle < 180 - roller_angle - module_half - 10,
       "spool-drybox: the lid seam runs into a module");
assert(roller_angle > module_half + 5, "spool-drybox: the roller modules overlap under the spool");

// The panels round the ring: [name, a0, a1, TPU at a0's end, TPU at a1's
// end]. Every end facing a module holds TPU, so the modules can have plain
// ends; at the lid seam the front panel holds it.
panels = [
    ["lid", module_half, lid_seam_angle, true, false],
    ["front", lid_seam_angle, 180 - roller_angle - module_half, true, true],
    ["under", 180 - roller_angle + module_half, 180 + roller_angle - module_half, true, true],
    ["back", 180 + roller_angle + module_half, 360 - module_half, true, true],
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

// Every screw round a wall, as a.
screw_angles = [for (p = panels, f = _panel_screws(p)) _panel_a0(p) + f];

assert(2 * disc_r <= print_bed - 10, "spool-drybox: a wall won't fit the print bed");

echo(str("spool-drybox: walls ", 2 * disc_r, " mm across, module ",
         lane_clear + 2 * wall_thickness, " mm wide; ", len(screw_angles), " screws per wall"));

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

// The section placed on the +Y wall's rib face, in the ring's (r, z) plane.
module _seal_at_rib(kind) {
    translate([seal_r, seal_y]) scale([1, -1]) _seal_2d(kind);
}

// --- walls ---

// At angle a, on the seal circle, in the ring's frame.
module _at_screw(a) {
    rotate([0, 0, a - 90]) translate([seal_r, 0, 0]) children();
}

// The TPU channel widened to a disc round a screw.
module _seal_pad() {
    translate([0, 0, seal_y + _gland_depth - gasket_depth]) cylinder(h = gasket_depth + _eps, r = seal_pad_r);
}

module _disc_body() {
    translate([0, 0, lane_clear / 2]) cylinder(h = wall_thickness, r = disc_r, $fn = _ring_fn);
    translate([0, 0, seal_y])
        difference() {
            cylinder(h = rib_height + _eps, r = disc_r, $fn = _ring_fn);
            translate([0, 0, -_eps]) cylinder(h = rib_height + 3 * _eps, r = rib_r, $fn = _ring_fn);
        }
}

// The right (+Y) wall in the ring's frame: plate, rib, the groove round
// the rib's face, and a counterbored hole at every screw from outside.
module _disc() {
    top = lane_clear / 2 + wall_thickness;
    difference() {
        _disc_body();
        rotate_extrude($fn = _ring_fn) _seal_at_rib("groove");
        for (a = screw_angles) _at_screw(a) {
            _seal_pad();
            translate([0, 0, seal_y - _eps]) cylinder(h = top - seal_y + 2 * _eps, d = m3_clearance_diameter);
            translate([0, 0, top - m3_counterbore_depth]) cylinder(h = m3_counterbore_depth + _eps, d = m3_counterbore_diameter);
        }
    }
}

// The screw threads through the TPU, so the hole in it is pilot-sized.
module _disc_gasket() {
    difference() {
        union() {
            rotate_extrude($fn = _ring_fn) _seal_at_rib("gasket");
            for (a = screw_angles) _at_screw(a) _seal_pad();
        }
        for (a = screw_angles) _at_screw(a)
            translate([0, 0, seal_y]) cylinder(h = _gland_depth + 1, d = m3_pilot_diameter);
    }
}

// The walls lie on their outside face to print, rib up. The left wall is
// the right one's mirror image.
module _disc_print(s) {
    mirror([0, s < 0 ? 1 : 0, 0])
        translate([0, 0, lane_clear / 2 + wall_thickness]) rotate([180, 0, 0]) children();
}

module wall_right() { _disc_print(1) _disc(); }
module wall_left() { _disc_print(-1) _disc(); }
module wall_right_gasket() { _disc_print(1) _disc_gasket(); }
module wall_left_gasket() { _disc_print(-1) _disc_gasket(); }

// --- panels ---
//
// A panel is drawn in the ring's frame from phi = 0 round to its span,
// standing on its -Z edge — also its print pose. It's wall_thickness
// thick, flaring at 45° to seal_land at every edge, with a ridge along both
// long edges and a boss round each screw.

_ridge_reach = seal_y + seal_ridge_height;

// The panel's section across the ring, t thick between the flares.
module _panel_profile(t) {
    e = seal_land;
    f = flare_land;
    polygon([[ring_r, -seal_y], [ring_r + e, -seal_y], [ring_r + e, -seal_y + f],
             [ring_r + t, -seal_y + f + e - t], [ring_r + t, seal_y - f - (e - t)],
             [ring_r + e, seal_y - f], [ring_r + e, seal_y], [ring_r, seal_y]]);
    for (s = [-1, 1])
        translate([seal_r, s * seal_y]) scale([1, -s]) _ridge_2d(0, _eps);
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

// A screw boss up from each edge, coned off at 45°, kept out of the lane.
module _boss() {
    difference() {
        for (s = [-1, 1])
            scale([1, 1, s]) translate([0, 0, seal_y - _boss_length]) {
                cylinder(h = _boss_length, r = boss_r);
                translate([0, 0, -boss_r]) cylinder(h = boss_r, r1 = 0, r2 = boss_r);
            }
        rotate([0, 0, 180]) translate([seal_r, 0, 0])
            cylinder(h = 3 * seal_y, r = ring_r, center = true, $fn = _ring_fn);
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

module _panel_local(p) {
    A = _panel_span(p);
    difference() {
        union() {
            rotate_extrude(angle = A, $fn = _ring_fn) _panel_profile(wall_thickness);
            for (end = [0, 1]) _at_end(A, end) _end_flare();
            for (f = _panel_screws(p)) rotate([0, 0, f]) translate([seal_r, 0, 0]) _boss();
        }
        for (f = _panel_screws(p)) rotate([0, 0, f]) translate([seal_r, 0, 0])
            for (s = [-1, 1]) scale([1, 1, s])
                translate([0, 0, seal_y - _pilot_depth]) cylinder(h = _pilot_depth + seal_ridge_height + 1, d = m3_pilot_diameter);
        for (end = [0, 1]) if (p[3 + end]) _at_end(A, end) _seam_channel();
    }
}

module _panel_gasket_local(p) {
    for (end = [0, 1]) if (p[3 + end]) _at_end(_panel_span(p), end) _seam_gasket();
}

// A panel or its gasket in place round the ring, `lift` mm out from the
// axis.
module _panel_in_place(p, lift = 0) {
    mid = _panel_a0(p) + _panel_span(p) / 2;
    translate(lift * [sin(mid), 0, cos(mid)])
        _on_axis() rotate([0, 0, _panel_a0(p) - 90]) children();
}

// Standing on end to print.
module _panel_print() {
    translate([0, 0, _ridge_reach]) children();
}

module panel(name) { _panel_print() _panel_local(_panel(name)); }
module panel_gasket(name) { _panel_print() _panel_gasket_local(_panel(name)); }

// --- assembly ---

module module_walls() {
    _on_axis() _disc();
    mirror([0, 1, 0]) _on_axis() _disc();
}

module module_wall_gaskets() {
    _on_axis() _disc_gasket();
    mirror([0, 1, 0]) _on_axis() _disc_gasket();
}

module module_panels(lid_lift = 0) {
    for (p = panels) _panel_in_place(p, p[0] == "lid" ? lid_lift : 0) _panel_local(p);
}

module module_panel_gaskets(lid_lift = 0) {
    for (p = panels) _panel_in_place(p, p[0] == "lid" ? lid_lift : 0) _panel_gasket_local(p);
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

// All four panels standing on end, nested arc in arc, widest innermost.
function _sorted_by_span(ps) =
    len(ps) <= 1 ? ps
  : let (pivot = _panel_span(ps[0]),
         rest = [for (i = [1 : len(ps) - 1]) ps[i]])
        concat(_sorted_by_span([for (p = rest) if (_panel_span(p) > pivot) p]), [ps[0]],
               _sorted_by_span([for (p = rest) if (_panel_span(p) <= pivot) p]));

_plate_order = _sorted_by_span(panels);
_plate_r_out = seal_r + boss_r;

// How far out the next arc, of half-span b, must sit to clear this one.
function _nest_step(b) =
    sqrt(_plate_r_out * _plate_r_out - pow(ring_r * sin(b), 2)) - ring_r * cos(b) + _plate_gap;

function _nest_offsets(i = 0, acc = 0) =
    i >= len(_plate_order) ? []
  : concat([acc], _nest_offsets(i + 1, i + 1 < len(_plate_order)
                                        ? acc + _nest_step(_panel_span(_plate_order[i + 1]) / 2) : acc));

_plate_offsets = _nest_offsets();
_plate_y_min = ring_r * cos(_panel_span(_plate_order[0]) / 2);
_plate_y_max = _plate_offsets[len(_plate_offsets) - 1] + _plate_r_out;
assert(_plate_y_max - _plate_y_min <= print_bed - 10 && 2 * _plate_r_out <= print_bed - 10,
       "spool-drybox: the panels won't nest on one plate");

module plate_panels(part) {
    for (i = [0 : len(_plate_order) - 1]) {
        p = _plate_order[i];
        translate([0, _plate_offsets[i] - (_plate_y_min + _plate_y_max) / 2, 0])
            rotate([0, 0, 90 - _panel_span(p) / 2])
                _panel_print() {
                    if (part == "panels") _panel_local(p);
                    else _panel_gasket_local(p);
                }
    }
}
