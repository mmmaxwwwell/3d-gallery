// BEGIN_DESCRIPTION
// A modular cord protector for the underside of a desk. The
// cross-section drops straight down from the desk, then wraps
// around the OUTSIDE of a 6 in circle for 135 deg (90 + 45), so
// cords leaving the desk are cradled instead of kinked over an
// edge. Each segment covers 150 mm of desk width and interlocks
// with the next through a rib-and-groove joint that follows the
// full profile — print as many as your desk is wide.
//
// The screws pass up through the vertical wall itself, into the
// desktop. Each sits in a round recess bored in from the cord
// side and leaning toward the arc centre, so the outside face of
// the wall stays solid and a driver still comes in on the screw's
// own axis. The head bears on the 2 mm of plastic left between
// the recess and the desk face.
//
// Print standing on the grooved end, extrusion axis vertical.
// Every layer is identical, so it needs no supports.
// END_DESCRIPTION

// BEGIN_PARAMS

// Length of one segment along the desk width (mm). This is the
// joint-to-joint pitch — segments chain end to end at exactly
// this spacing.
segment_length = 150;

// Material thickness of the shell, constant everywhere (mm).
material_thickness = 8;

// Length of the straight vertical section, from the desk
// underside to where the curve begins (mm). Default is 3 in.
drop_height = 76.2;

// Diameter of the circle the curve wraps around (mm). Material
// sits on the OUTSIDE of this circle, so this is the inside
// face of the curve — the surface cords actually rest on.
// Default is 6 in.
arc_inner_diameter = 152.4;

// How far the curve sweeps, in degrees, measured from the end of
// the straight drop. 90 brings the profile to horizontal; the
// remaining 45 turns the tip back upward.
arc_sweep = 135;

// Screws per segment. The outer two sit 15 mm in from the segment
// ends and any others space evenly between them, so 3 gives one
// near each end and one in the middle.
screws_per_segment = 3; // [1, 2, 3, 4]

// Interlocking rib and groove on the segment's two ends. Turn them off
// for a segment that chains to nothing.
end_joints = true;

// END_PARAMS

// ── Fixed geometry (change the model, not the print) ───────────────

// #6 wood screw: ~3.5 mm shank, ~6.9 mm pan head.
screw_clearance_d = 3.8;  // mm — shank clears, so the screw pulls the part tight
screw_head_d      = 7.4;  // mm — head recess, sized for a 6-7 mm head
screw_head_grip   = 2;    // mm — thinnest plastic between the recess and the desk face
screw_recess_h    = 18;   // mm — bore length past the seat; only has to break out
screw_tilt        = 20;   // deg — lean toward the arc centre, so the bore stays blind
screw_edge_inset  = 15;   // mm — end screws sit this far in from the segment ends

joint_clearance = 0.2;  // mm — per side, rib to groove
rib_width       = 3;    // mm — rib cross-section, centred in the shell
rib_height      = 4;    // mm — how far the rib stands proud of the end face
rib_lead        = 0.8;  // mm — stepped lead-in on the rib tip
rib_lead_relief = 0.5;  // mm — how much narrower that lead-in step is

arc_facets = 96;  // polygon steps across the full sweep

// The optional prop finishes the half circle the cradle starts, then runs
// straight up to the desk. It bolts to the cradle's own shell with M5 button
// heads driven into the plastic — no inserts, no nuts, no snap fit.
prop_beam_width  = 15;   // mm — Z width of the narrow prop
prop_bolt_inset  = 15;   // mm — how far back from the tip the joint sits
prop_lap_clr     = 0.15; // mm — radial gap between the two halves
prop_join_gap    = 0.3;  // mm — gap along the interlocking honeycomb edge
prop_m5_clear    = 5.4;  // mm — M5 clearance through the prop's half
prop_m5_pilot    = 4.2;  // mm — M5 thread root: the screw cuts its own thread
prop_screen_flat = 14;   // mm — nominal across-flats; the lattice rounds it to
                         //      land rows on the screw lines
prop_screen_wall = 3;    // mm — material left between openings

eps = 0.01;

// ── Derived ───────────────────────────────────────────────────────

_t    = material_thickness;
_r_in = arc_inner_diameter / 2;
_r_c  = _r_in + _t / 2;   // shell centreline radius

// Raw profile frame: desk underside at y = 0, part hanging into -y.
// Wall inner face at x = 0, material occupying x = [-_t, 0]. The arc
// centre sits one inner-radius inboard of the tangent point, so the
// straight drop runs tangent into the curve with no kink.
_arc_c  = [_r_in, -drop_height];
_arc_a0 = 180;
_arc_a1 = 180 + arc_sweep;

function _arc_pt(i, r) =
    let (a = _arc_a0 + (_arc_a1 - _arc_a0) * i / arc_facets)
    [_arc_c[0] + r * cos(a), _arc_c[1] + r * sin(a)];

_outer_pts = [for (i = [0 : arc_facets]) _arc_pt(i, _r_in + _t)];
_inner_pts = [for (i = [arc_facets : -1 : 0]) _arc_pt(i, _r_in)];

// Free end is capped with a half-round, centred mid-thickness.
_tip_c = [_arc_c[0] + (_r_in + _t / 2) * cos(_arc_a1),
          _arc_c[1] + (_r_in + _t / 2) * sin(_arc_a1)];

part_height = -min(min([for (p = _outer_pts) p[1]]), _tip_c[1] - _t / 2);
part_depth  = max(max([for (p = _outer_pts) p[0]]), _tip_c[0] + _t / 2) + _t;

_rib_inset    = (_t - rib_width) / 2;
_groove_inset = _rib_inset - joint_clearance;
_groove_depth = rib_height + 0.5;

// Axis crosses the top face on the wall centreline and leans inboard from
// there, which is what keeps the outside face solid.
_screw_x = -_t / 2;
// Seat is square to the axis so the head bears flat. Sink it far enough that
// the uphill edge of the seat still leaves screw_head_grip of plastic.
_seat_axial = (screw_head_grip + screw_head_d / 2 * sin(screw_tilt)) / cos(screw_tilt);

// Hold the recess clear of the groove at the -Z end (and, by symmetry, the
// rib at the +Z end) however short the segment gets.
_screw_z_min = _groove_depth + screw_head_d / 2 + 1;
_screw_inset = min(max(screw_edge_inset, _screw_z_min), segment_length / 2);

function _screw_z(i) =
    screws_per_segment < 2
        ? segment_length / 2
        : _screw_inset
          + (segment_length - 2 * _screw_inset) * i / (screws_per_segment - 1);

// ── Prop: derived ─────────────────────────────────────────────────

// Carry the sweep on to 360 deg — the cradle starts at 180, so that lands the
// pair on a true half circle — and go straight up from there. At 360 the shell
// is already running vertically, so the riser leaves the curve tangentially.
_prop_a1 = 360;
_prop_top_x = _arc_c[0] + _r_in + _t;
// Desk screws sit in the riser exactly as they sit in the wall, leaning the
// same way — which on this side of the tube points at the outside face.
_prop_screw_x = _prop_top_x - _t / 2;

// One unrolled coordinate for the whole tube: down the wall, round the arc,
// then up the riser. Both parts place their openings on it, so the pattern
// runs through the joint without a seam.
_u_wall = drop_height;
_u_tip  = _u_wall + _r_c * (_arc_a1 - _arc_a0) * PI / 180;
_u_360  = _u_wall + _r_c * (360 - _arc_a0) * PI / 180;
_u_top  = _u_360 + drop_height;


// Rows land on the screw lines. Forcing an EVEN number of rows between screws
// keeps every screw row on the same side of the stagger, so the bolts all sit
// in a filled cell of the lattice rather than in a web.
_screw_dz    = screws_per_segment < 2
    ? segment_length
    : (segment_length - 2 * _screw_inset) / (screws_per_segment - 1);
_hex_row_nom = (prop_screen_flat + prop_screen_wall) * sqrt(3) / 2;
_hex_rows_dz = max(2, 2 * round(_screw_dz / (2 * _hex_row_nom)));
_hex_row     = _screw_dz / _hex_rows_dz;
_hex_pitch   = _hex_row * 2 / sqrt(3);
_hex_flat    = _hex_pitch - prop_screen_wall;

// Keep the pattern off whichever end carries a desk screw recess, and off the
// rib and groove.
_hex_half    = _hex_flat / cos(30) / 2;   // half the opening, along u and z
// Edge limits for the pattern, measured to the material's edge. The grid only
// places whole cells inside them, so every run of openings ends on a solid bar
// rather than a clipped one — a partial cell would leave a sliver standing up
// the print with nothing either side of it.
_hex_end_gap = screw_head_grip + screw_recess_h * cos(screw_tilt) + prop_screen_wall;
// Grown cells tile exactly at the nominal pitch; nudge them past each other so
// neighbouring cuts overlap instead of meeting on a shared face.
_hex_weld    = 0.1;
// A prismatic cell spans less arc at the outer face than at the centreline it
// was sized on; this is that shortfall, and bands carry it so they still tile
// where it matters.
_hex_arc_grow = _hex_pitch * ((_r_in + _t) / _r_c - 1);

// The lattice's phase in u is set by the desk end, not the joint: the first
// column sits as close under the desk face as `prop_screen_wall` of rail
// allows, so the pattern runs almost to the top. The bolt then takes the
// nearest column to `prop_bolt_inset` — its exact position is the flexible
// one, the rail is not.
_u_first = prop_screen_wall + _hex_half;
// ...but never so far out that the cradle's own teeth would run past its tip
// and get clipped: the furthest one reaches half a column plus half a grown
// cell beyond the bolt, and there has to be shell under all of it.
_u_bolt_max = _u_tip - _hex_pitch / 2
            - (_hex_pitch + _hex_arc_grow + _hex_weld + prop_join_gap) / 2;
_u_bolt  = _u_first + _hex_pitch
         * min(round((_u_tip - prop_bolt_inset - _u_first) / _hex_pitch),
               floor((_u_bolt_max - _u_first) / _hex_pitch));
// A cell this close to either desk face would run into a screw recess, so on a
// screw line it is left filled instead.
_hex_recess_u = screw_head_grip + screw_recess_h * cos(screw_tilt) + _hex_half;
_hex_z_edge  = _groove_depth + _hex_half;

// The joint is one column of the lattice, centred on the bolt: the two parts
// swap halves of the shell across it and each one ends on the honeycomb rather
// than on a straight line, so nothing is ever cut into a sliver.
_prop_bolt_a  = _arc_a0 + (_u_bolt - _u_wall) / _r_c * 180 / PI;
_prop_a0      = _arc_a0 + (_u_bolt - 2 * _hex_pitch - _u_wall) / _r_c * 180 / PI;

function _prop_screw_z(i, n, width) = n < 2 ? width / 2 : _screw_z(i);

function _prop_pt(i, r) =
    let (a = _prop_a0 + (_prop_a1 - _prop_a0) * i / arc_facets)
    [_arc_c[0] + r * cos(a), _arc_c[1] + r * sin(a)];

// ── 2D profile ────────────────────────────────────────────────────

// Annular sector of the shell's own circle, between two radii.
module _profile_2d() {
    // The square runs a hair past the tangent line so the union with
    // the sector is an overlap rather than a shared edge.
    translate([-_t, -drop_height - eps]) square([_t, drop_height + eps]);
    polygon(concat(_outer_pts, _inner_pts));
    translate(_tip_c) circle(d = _t);
}

// ── 3D ────────────────────────────────────────────────────────────

// A cut of diameter `d` on a screw axis through `xc`, from `from` to
// `from + len` measured down that axis from where it crosses the top face.
module _screw_axis_cut(xc, zc, from, len, d) {
    translate([xc, 0, zc])
        rotate([0, 0, screw_tilt])
            rotate([90, 0, 0])
                translate([0, 0, from])
                    cylinder(h = len, d = d);
}

// Head recess: an angled bore in from the cord side. The tilt is what makes
// it fit — square to the desk a 6-7 mm head would eat the whole 8 mm wall,
// leaning it inboard keeps the outside face solid. It breaks out of the
// inside face a couple of mm below the seat, so the head drops in from there
// and the bore doubles as the driver's path.
module _screw_recess(xc, zc) {
    _screw_axis_cut(xc, zc, _seat_axial, screw_recess_h, screw_head_d);
}

module _screw_hole(xc, zc) {
    _screw_axis_cut(xc, zc, -1, _seat_axial + 1 + eps, screw_clearance_d);
}

// Pilot through the tongue, where an M5 button head bolts a prop on. Same Z as
// the wall screws, so a full-width prop's three bolts, the wall's three screws
// and the honeycomb's rows all line up.
module _prop_pilot(zc) {
    translate([_arc_c[0], _arc_c[1], zc])
        rotate([0, 0, _prop_bolt_a])
            translate([_r_c + eps, 0, 0])
                rotate([0, -90, 0])
                    cylinder(h = _t / 2 + 2 * eps, d = prop_m5_pilot);
}

module _segment_raw() {
    difference() {
        union() {
            linear_extrude(segment_length) _profile_2d();

            if (end_joints) {
                translate([0, 0, segment_length])
                    linear_extrude(rib_height - rib_lead)
                        offset(delta = -_rib_inset) _profile_2d();
                translate([0, 0, segment_length + rib_height - rib_lead])
                    linear_extrude(rib_lead)
                        offset(delta = -_rib_inset - rib_lead_relief) _profile_2d();
            }
        }

        if (end_joints)
            translate([0, 0, -eps])
                linear_extrude(_groove_depth + eps)
                    offset(delta = -_groove_inset) _profile_2d();

        for (i = [0 : screws_per_segment - 1]) {
            _screw_recess(_screw_x, _screw_z(i));
            _screw_hole(_screw_x, _screw_z(i));
            _prop_pilot(_screw_z(i));
        }

        // The joint. Past the bolt column the cradle stops altogether, and
        // across the bolt column it gives up its outer half; both boundaries
        // are the honeycomb's own, so the cradle ends on whole cells.
        _hex_band(_screw_z(0), 1, 2, segment_length, _hex_weld + prop_join_gap);
        _hex_band(_screw_z(0), 0, 0, segment_length, _hex_weld + prop_join_gap,
                  0, _t / 2 + 3);
    }
}

// ── Public ────────────────────────────────────────────────────────

// One printable segment, sitting in the +X/+Y/+Z octant in print
// orientation: Z runs along the desk width (and is the print-up
// axis), Y is vertical as installed, X is depth out from the wall.
module segment() {
    translate([_t, part_height, 0]) _segment_raw();
}

// The same segment with the prop's honeycomb run over its shell.
module segment_screen() {
    translate([_t, part_height, 0])
        difference() {
            _segment_raw();
            // Stop one column short of the joint: that column is where the two
            // parts divide, and a cell opened there would leave each of them
            // about a millimetre of wall to stand on.
            _hex_grid(_screw_z(0), _u_first, _u_bolt, segment_length, -999, -1);
        }
}

// `n` segments chained along Z, as they sit on the desk.
module run(n = 3) {
    for (i = [0 : n - 1])
        translate([0, 0, i * segment_length]) segment();
}

// ── Prop: geometry ────────────────────────────────────────────────

// Full thickness the whole way — the joint is cut in 3D, where the honeycomb
// lives. The sweep starts back under the cradle so there is material to trim
// the interlocking edge out of.
module _prop_profile_2d() {
    polygon(concat(
        [for (i = [0 : arc_facets]) _prop_pt(i, _r_in + _t)],
        [for (i = [arc_facets : -1 : 0]) _prop_pt(i, _r_in)]));
    // Straight up from there to the desk face.
    translate([_arc_c[0] + _r_in, _arc_c[1]]) square([_t, -_arc_c[1]]);
}



// One opening at unrolled distance `u`: down the wall, round the arc, then up
// the riser. Each stretch cuts along its own outward normal and the handovers
// are tangential, so a hole either side of one still sits square to the
// surface. `u` is shared by both parts, which is what carries the pattern
// through the joint unbroken.
// `flat` is across-flats; `from`/`len` slice it radially, measured out from the
// shell centreline, so the same cell can cut a hole, the outer half or the
// inner half. The local +Z of the prism always points out of the tube.
module _hex_at_u(u, z, flat = 0, from = 0, len = 0, rad = true) {
    f = flat > 0 ? flat : _hex_flat;
    a = from != 0 || len != 0 ? from : -(_t / 2 + 2);
    h = len > 0 ? len : _t + 4;
    if (u <= _u_wall)
        translate([-_t / 2, -u, z]) rotate([0, -90, 0]) _hex_slice(f, a, h, false);
    else if (u <= _u_360)
        translate([_arc_c[0], _arc_c[1], z])
            rotate([0, 0, _arc_a0 + (u - _u_wall) / _r_c * 180 / PI])
                translate([_r_c, 0, 0]) rotate([0, 90, 0]) _hex_slice(f, a, h, rad);
    else
        translate([_arc_c[0] + _r_c, _arc_c[1] + u - _u_360, z])
            rotate([0, 90, 0]) _hex_slice(f, a, h, false);
}

// A pattern cell opens out with the radius, so the hole is a true radial one
// and the webs come out even through the thickness. A *band* must not: its
// cells have to tile, and a cone tiles in u at every radius but in z only at
// the one it was drawn for. Bands stay prismatic and take `_hex_arc_grow`
// instead, which is the tangential shortfall at the outer face.
module _hex_slice(flat, from, len, rad) {
    d  = flat / cos(30);
    d1 = rad ? d * (_r_c + from) / _r_c : d;
    d2 = rad ? d * (_r_c + from + len) / _r_c : d;
    translate([0, 0, from]) cylinder(h = len, d1 = d1, d2 = d2, $fn = 6);
}

// A run of lattice cells grown to the full pitch. Grown that far they tile with
// no wall left between them, so the boundary of the run follows the honeycomb —
// which is what lets a part end on the pattern instead of across it.
module _hex_band(za, k0, k1, width, grow = 0, from = 0, len = 0) {
    for (j = [floor(-za / _hex_row) - 2 : ceil((width - za) / _hex_row) + 2],
         k = [k0 : k1])
        _hex_at_u(_u_bolt + (j % 2 == 0 ? 0 : _hex_pitch / 2) + k * _hex_pitch,
                  za + j * _hex_row, _hex_pitch + _hex_arc_grow + grow,
                  from, len, false);
}

// Honeycomb over the cells whose centres fall in [u0, u1], bounded by column
// index as well so the joint column can be left out wholesale. The lattice is
// anchored on the bolt — rows on the screw lines, one column dead on the bolt —
// and that cell is left out, so what shows there is the screw's own circle.
module _hex_grid(za, u0, u1, width, kmin = -999, kmax = 999) {
    j0 = ceil((_hex_z_edge - za) / _hex_row);
    j1 = floor((width - _hex_z_edge - za) / _hex_row);

    for (j = [j0 : j1]) {
        ua = _u_bolt + (j % 2 == 0 ? 0 : _hex_pitch / 2);
        k0 = max(ceil((u0 - ua) / _hex_pitch), kmin);
        k1 = min(floor((u1 - ua) / _hex_pitch), kmax);
        for (k = [k0 : k1]) {
            u = ua + k * _hex_pitch;
            // Filled cells: the three that carry a bolt, and the three at each
            // desk face that carry a screw recess. Everything else is open.
            filled = (j % _hex_rows_dz) == 0
                     && (k == 0 || u < _hex_recess_u || u > _u_top - _hex_recess_u);
            if (!filled) _hex_at_u(u, za + j * _hex_row);
        }
    }
}

// M5 clearance through the lap. The screw carries on into the cradle's pilot
// and cuts its own thread there.
module _prop_bolt_hole(zc) {
    translate([_arc_c[0], _arc_c[1], zc])
        rotate([0, 0, _prop_bolt_a])
            translate([_r_in + _t + 1, 0, 0])
                rotate([0, -90, 0])
                    cylinder(h = _t / 2 + 2, d = prop_m5_clear);
}

module _prop_raw(width, screws, screened) {
    // A narrow prop is its own lattice: anchored on the one bolt it carries, so
    // it still lines up wherever along a segment you hang it.
    za = _prop_screw_z(0, screws, width);
    difference() {
        linear_extrude(width) _prop_profile_2d();
        for (i = [0 : screws - 1]) {
            _screw_recess(_prop_screw_x, _prop_screw_z(i, screws, width));
            _screw_hole(_prop_screw_x, _prop_screw_z(i, screws, width));
            _prop_bolt_hole(_prop_screw_z(i, screws, width));
        }

        // The other side of the joint: nothing before the bolt column, and only
        // the outer half across it. The cradle's cuts are the same bands grown
        // by `prop_join_gap`, which is the clearance between the two.
        _hex_band(za, -2, -1, width, _hex_weld);
        _hex_band(za, 0, 0, width, _hex_weld, -(_t / 2 + 3),
                  _t / 2 + 3 + prop_lap_clr);

        if (screened)
            _hex_grid(za, _u_bolt, _u_top - _u_first, width, 1, 999);
    }
}

// All three props sit in the same frame as `segment()`, in the position they
// are installed in: saddle over the cradle's tip, pad under the desk face.
module prop_beam() {
    translate([_t, part_height, 0]) _prop_raw(prop_beam_width, 1, false);
}

module prop_panel() {
    translate([_t, part_height, 0]) _prop_raw(segment_length, screws_per_segment, false);
}

module prop_screen() {
    translate([_t, part_height, 0]) _prop_raw(segment_length, screws_per_segment, true);
}
