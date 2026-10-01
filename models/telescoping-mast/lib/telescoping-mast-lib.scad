// BEGIN_DESCRIPTION
// A print-in-place telescoping mast for a small antenna. Five thin round
// tubes print nested on the bed. Pull a section out to its stop, twist
// it 60°, and let go: three lugs drop into dips in three teeth, and the
// section holds its weight. The outer tube's foot is a 45° thread, and
// so is the inner tube's top, so two prints join end to end with a coupler.
// END_DESCRIPTION

include <BOSL2/std.scad>;
include <BOSL2/threading.scad>;

// BEGIN_PARAMS
// Number of nested tubes in one print.
sections = 5;

// Height of every tube (mm). The nest prints standing, so this is the
// print height: the Qidi Q2 takes 256.
section_length = 250;

// Outside diameter of the outer tube (mm), not counting its foot thread.
outer_diameter = 46;

// Wall of a plain tube (mm): three 0.42 mm lines.
wall = 1.26;

// Radial air gap between neighbouring tubes (mm). This is what keeps
// them from fusing as they print, and it sets the wobble at each joint.
gap = 0.4;

// How far a lug or shoulder overlaps a tooth, radially (mm).
catch_depth = 1.2;

// Length of the thick foot on every inner tube (mm). It rides in the
// bore of the tube outside it, so it is also the bearing length of the
// joint: longer is stiffer and costs height.
skirt_length = 30;

// Number of teeth at the top of a tube, and of lugs on the next one in.
lock_count = 3;

// Arc of one tooth (degrees): a post, the dip, and another post.
tooth_span = 52;

// Arc of one post at a tooth's end (degrees). A post stands
// lock_drop higher than the dip, so a seated lug can't turn out
// until it is lifted.
post_span = 11;

// Arc of one lug (degrees). Must fit the dip with room to spare.
lug_span = 24;

// Vertical flat at a tooth's tip and a lug's face (mm).
tip_flat = 1;

// How far a section drops into its lock after the twist (mm).
lock_drop = 1.5;

// Vertical clearance between a lug and the posts as it turns at the stop (mm).
turn_clearance = 0.6;

// Bottom-edge chamfer that keeps first-layer squish from fusing the tubes (mm).
foot_chamfer = 0.4;

// Pitch of both joint threads (mm). Their flanks are 45°.
thread_pitch = 3;

// Depth of both joint threads (mm).
thread_depth = 1.2;

// Length of both joint threads (mm).
thread_length = 15;

// Clearance the coupler's female threads add (mm).
thread_slop = 0.25;

// Wall left under the root of a thread (mm).
thread_wall = 1.6;

// Coupler wall outside its female threads (mm).
coupler_wall = 2.4;

// Facets on every round surface. The gaps are tenths of a millimetre,
// so the polygons have to be fine.
facets = 160;
// END_PARAMS

reach = gap + catch_depth;
tube_step = wall + 2 * gap + catch_depth;
function tube_r(i) = outer_diameter / 2 - i * tube_step;
function bore_r(i) = tube_r(i) - wall;
// The skirt and lugs of tube i fill tube i-1's bore to within the gap.
function skirt_r(i) = tube_r(i) + reach;

last = sections - 1;

// Teeth sit at the top of a tube; tooth_z is where a tooth's underside leaves the bore.
tooth_z = section_length - (2 * reach + tip_flat + lock_drop);
// Lug bottom, measured from the bottom of its own tube: at the stop it clears the posts by turn_clearance.
lug_z = skirt_length + reach + tip_flat + lock_drop + turn_clearance - 2 * gap;
// How far each locked section stands above the one outside it.
lock_rise = tooth_z + gap - skirt_length - lock_drop - turn_clearance;
stop_rise = tooth_z + gap - skirt_length;
overlap = section_length - lock_rise;

// Teeth sit at 0°, 120°, …; lugs print in the gaps between them, 60° round.
lock_pitch = 360 / lock_count;
lock_turn = lock_pitch / 2;

collar_root_r = bore_r(0) + thread_wall;
collar_major_d = 2 * (collar_root_r + thread_depth);
top_bore_r = tube_r(last) - thread_depth - thread_wall;

assert(lug_span + 4 < tooth_span - 2 * post_span, "lug_span must leave clearance inside the dip");
assert(lug_span + 4 < lock_pitch - tooth_span, "lug_span must pass between the teeth");
assert(bore_r(last) > top_bore_r + 1, "too many sections for outer_diameter: the inner tube has no room for its thread");
assert(section_length - overlap > skirt_length, "section_length too short for the lock");

module ring(r_in, r_out, h) {
    difference() {
        cylinder(r = r_out, h = h, $fn = facets);
        translate([0, 0, -0.01]) cylinder(r = r_in, h = h + 0.02, $fn = facets);
    }
}

module arc_profile(span, at) {
    rotate([0, 0, at - span / 2])
        rotate_extrude(angle = span, $fn = facets) children();
}

// Three teeth at the top of tube i, reaching in from its bore.
module teeth(i) {
    rb = bore_r(i) + 0.01;
    tip = bore_r(i) - reach;
    z = tooth_z;
    dip = [[rb, z], [tip, z + reach], [tip, z + reach + tip_flat], [rb, z + 2 * reach + tip_flat]];
    post = [[rb, z], [tip, z + reach], [tip, z + reach + tip_flat + lock_drop],
            [rb, z + 2 * reach + tip_flat + lock_drop]];
    for (k = [0 : lock_count - 1]) {
        a = k * lock_pitch;
        arc_profile(tooth_span - 2 * post_span + 0.02, a) polygon(dip);
        for (s = [-1, 1])
            arc_profile(post_span, a + s * (tooth_span - post_span) / 2) polygon(post);
    }
}

// Tube i's foot: thick enough to fill the next tube out's bore, ending in a 45° shoulder that stops on its teeth.
module skirt(i) {
    rotate_extrude($fn = facets) polygon([
        [tube_r(i) - 0.01, 0], [skirt_r(i) - foot_chamfer, 0], [skirt_r(i), foot_chamfer],
        [skirt_r(i), skirt_length], [tube_r(i) - 0.01, skirt_length + reach]]);
}

module lugs(i) {
    r = tube_r(i) - 0.01;
    z = lug_z;
    for (k = [0 : lock_count - 1])
        arc_profile(lug_span, lock_turn + k * lock_pitch) polygon([
            [r, z], [skirt_r(i), z + reach - 0.01], [skirt_r(i), z + reach + tip_flat],
            [r, z + 2 * reach + tip_flat]]);
}

// The outer tube's foot: a male thread that screws into the coupler or a base.
module foot_thread() {
    trapezoidal_threaded_rod(d = collar_major_d, l = thread_length, pitch = thread_pitch,
        thread_angle = 90, thread_depth = thread_depth, bevel = true, anchor = BOTTOM, $fn = facets);
    translate([0, 0, thread_length - 0.01])
        cylinder(r1 = collar_root_r, r2 = tube_r(0) - 0.01, h = collar_root_r - tube_r(0), $fn = facets);
}

// The inner tube's top: a male thread flush with its outside, cut into a wall thickened inward.
module top_thread() {
    z = section_length - thread_length;
    translate([0, 0, z])
        trapezoidal_threaded_rod(d = 2 * tube_r(last), l = thread_length, pitch = thread_pitch,
            thread_angle = 90, thread_depth = thread_depth, bevel2 = true, anchor = BOTTOM, $fn = facets);
    taper = bore_r(last) - top_bore_r;
    translate([0, 0, z - taper])
        ring(0, tube_r(last) - 0.01, taper + 0.01);
}

module tube(i) {
    difference() {
        union() {
            cylinder(r = tube_r(i), h = i == last ? section_length - thread_length : section_length, $fn = facets);
            if (i > 0) { skirt(i); lugs(i); }
            if (i == 0) foot_thread();
            if (i == last) top_thread();
        }
        translate([0, 0, -0.01]) cylinder(r = i == last ? top_bore_r : bore_r(i), h = section_length + 0.02, $fn = facets);
        if (i == last) {
            taper = bore_r(last) - top_bore_r;
            translate([0, 0, -0.01])
                cylinder(r = bore_r(i), h = section_length - thread_length - taper + 0.01, $fn = facets);
            translate([0, 0, section_length - thread_length - taper])
                cylinder(r1 = bore_r(i), r2 = top_bore_r, h = taper, $fn = facets);
        }
        if (i < last)
            rotate_extrude($fn = facets)
                polygon([[bore_r(i) - 1, -0.01], [bore_r(i) + foot_chamfer, -0.01], [bore_r(i) - 1, 1 + foot_chamfer]]);
    }
    if (i < last) teeth(i);
}

// The whole print: every tube nested and collapsed, lugs between the teeth.
module mast_section() {
    for (i = [0 : last]) tube(i);
}

// Tube i placed `rise` above and turned `turn` from tube i-1, cumulatively.
module tube_at(i, rise, turn) {
    translate([0, 0, i * rise]) rotate([0, 0, i * turn]) tube(i);
}

module mast_extended() {
    for (i = [0 : last]) tube_at(i, lock_rise, -lock_turn);
}

coupler_small_r = tube_r(last) + thread_slop + coupler_wall;
coupler_big_r = collar_major_d / 2 + thread_slop + coupler_wall;
coupler_flare_z = thread_length + 1;
coupler_floor_z = coupler_flare_z + coupler_big_r - coupler_small_r;
coupler_height = coupler_floor_z + thread_length + 1;

// Joins two prints: the lower one's top thread from below, the upper one's foot thread from above. Prints small end down.
module coupler() {
    difference() {
        rotate_extrude($fn = facets) polygon([
            [0, 0], [coupler_small_r, 0], [coupler_small_r, coupler_flare_z],
            [coupler_big_r, coupler_floor_z], [coupler_big_r, coupler_height], [0, coupler_height]]);
        translate([0, 0, -0.01])
            trapezoidal_threaded_rod(d = 2 * tube_r(last), l = thread_length + 1.01, pitch = thread_pitch,
                thread_angle = 90, thread_depth = thread_depth, internal = true, bevel1 = true,
                anchor = BOTTOM, $slop = thread_slop, $fn = facets);
        cone_r = tube_r(last) + thread_slop;
        translate([0, 0, thread_length + 1])
            cylinder(r1 = cone_r, r2 = top_bore_r, h = cone_r - top_bore_r, $fn = facets);
        cylinder(r = top_bore_r, h = coupler_height, $fn = facets);
        translate([0, 0, coupler_floor_z])
            trapezoidal_threaded_rod(d = collar_major_d, l = thread_length + 1.01, pitch = thread_pitch,
                thread_angle = 90, thread_depth = thread_depth, internal = true, bevel2 = true,
                anchor = BOTTOM, $slop = thread_slop, $fn = facets);
    }
}

// How far the upper print's foot sits above the lower print's top once both are screwed home.
coupler_seat = coupler_floor_z - (thread_length + 1);

module mast_pair_extended() {
    top = last * lock_rise + section_length;
    mast_extended();
    translate([0, 0, top + coupler_seat]) mast_extended();
}

module coupler_on_pair() {
    translate([0, 0, last * lock_rise + section_length - (thread_length + 1)])
        coupler();
}

// Half the collapsed nest, cut along the lugs, to show how the tubes sit.
module mast_cutaway() {
    difference() {
        mast_section();
        rotate([0, 0, lock_turn]) translate([-100, 0, -1]) cube([200, 100, section_length + 2]);
    }
}
