// BEGIN_DESCRIPTION
// A tapered antenna mast printed in segments: 100 mm at the foot, 15 mm
// at the top, 2 m tall. The outside is a plain cone (bar the screw heads) and the wall an open
// honeycomb whose cells follow the taper. Each segment's top carries a
// solid sleeve, one hexagon tall, inside the next one's solid foot ring:
// push the upper segment down, turn it a little along a 45° channel to
// its stop, and M3 cap screws, clamping the foot onto the sleeve, lock it.
// END_DESCRIPTION

include <BOSL2/std.scad>;

// BEGIN_PARAMS
// Outside diameter at the foot (mm).
bottom_diameter = 100;

// Outside diameter at the top (mm). The outside tapers in a straight line
// from the foot to here.
top_diameter = 15;

// Length of the whole mast, foot to top (mm).
mast_length = 2000;

// Wall thickness (mm), the sleeves' included. The honeycomb is cut through it.
wall = 3.5;

// Tallest a segment may print (mm), sleeve included. The mast splits into
// as few equal segments as fit. The Adventurer 5M builds 220.
section_height = 215;

// Target spacing of the honeycomb cells around the outside (mm). Each
// segment rounds it to a whole number of cells.
cell_pitch = 12;

// Width of a honeycomb rib at the outside (mm).
rib = 2;

// Solid band between the honeycomb and a segment's top (mm).
rim = 2;

// How far a lock screw's head face sits below the outside (mm). The rest
// of the foot ring's wall is left under the head, and the screw clamps it
// onto the sleeve; the head stands proud by its height less this.
head_seat = 1.5;

// Straight run of a sleeve's bore below the joint, before it flares out
// at 45° to the wall (mm). The flare sits inside the bore, and the cells
// cut through it, so the ribs there are as deep as wall and flare together.
neck_length = 8;

// Radius of the rounding on both edges of a sleeve's top (mm): a lead-in
// for the next segment's foot.
sleeve_round = 1.5;

// Radial clearance between a sleeve and the bore around it (mm).
fit_slop = 0.25;

// How far a channel lug stands out from the sleeve (mm).
lug_depth = 0.7;

// Width of a channel lug round the sleeve (mm).
lug_width = 2.5;

// How far past touching the channel's floor bears down on the lug at the
// stop (mm): the twist draws the foot tight onto the joint face.
twist_preload = 0.1;

// How much narrower than a lug its channel pinches, just short of the
// stop (mm). The lug squeezes through and pops into the full-size stop.
twist_snap = 0.3;

// Length of a channel's level run, after its 45° climb and before the
// stop (mm): the joint has seated and keeps turning, then pops in.
twist_lateral = 4;

// Facets on every round surface.
facets = 120;
// END_PARAMS

m3_head_r = 3;
m3_head_h = 3;
m3_pilot_r = 1.25;
m3_clear_r = 1.7;
lug_flat = 0.6;

diameter_profile = [[0, bottom_diameter], [mast_length, top_diameter]];
// A sleeve is one hexagon, 1.5 row pitches, and a row pitch never exceeds cell_pitch + 1 for 6+ cells.
segments = ceil(mast_length / (section_height - 1.5 * (cell_pitch + 1)));
seg_len = mast_length / segments;
last = segments - 1;

function outer_r(z) = lookup(z, diameter_profile) / 2;
function bore_r(z) = outer_r(z) - wall;
function profile_keys(a, b) = [for (p = diameter_profile) if (p[0] > a && p[0] < b) p[0]];

// Honeycomb grid of segment k: cells around, and the row pitch (one cell width at mid height).
function cells_around(k) = max(6, round(2 * PI * outer_r(joint_z(k) + seg_len / 2) / cell_pitch));
function row_pitch(k) = 2 * PI * outer_r(joint_z(k) + seg_len / 2) / cells_around(k);
function hole_half(n, py, ro) = py / 2 + PI * ro / n / 2 - rib / sqrt(2);

// Joint j is at the foot of segment j. Its overlap is one hexagon of segment j's grid tall: segment
// j's foot is a solid ring that high, and segment j-1's top carries a solid sleeve of the same
// height inside it. The honeycomb stops at the joint plane below and starts at the ring's top above.
function joint_z(j) = j * seg_len;
function sleeve_h(j) = 1.5 * row_pitch(j);
function sleeve_out(j) = bore_r(joint_z(j) + sleeve_h(j)) - fit_slop;
function sleeve_in(j) = sleeve_out(j) - wall;
// High in the ring, so the channels run underneath the screw heads.
function screw_z(j) = sleeve_h(j) - m3_head_r - 1.5;
// Where segment j-1's bore starts flaring in to the sleeve, below the joint plane.
function flare_z(j) = joint_z(j) - neck_length - (bore_r(joint_z(j)) - sleeve_in(j));
function screw_floor_r(j) = outer_r(joint_z(j) + screw_z(j)) - head_seat;

// Lock screws round the ring, about one per three cells, 2 to 7.
function screw_count(j) = min(7, max(2, round(cells_around(j) / 3)));
function screw_angle(j, m) = m * 360 / screw_count(j);
// One lug between each pair of screws.
function lug_count(j) = screw_count(j);
function lug_angle(j, i) = screw_angle(j, i) + 180 / screw_count(j);
// A lug is a block lug_width long round the sleeve, centred halfway between the joint plane and
// the bottom of the screw holes. It grows from the sleeve to lug_depth past the upper segment's
// bore at its height: the bore tapers, so it stands further off the sleeve there than at the
// sleeve's top. (Its height barely changes with that taper, so the centre uses the nominal one.)
function lug_height(j) = 2 * (bore_r(joint_z(j) + screw_z(j) / 2) + lug_depth - sleeve_out(j)) + lug_flat;
function lug_bottom(j) = (screw_z(j) - m3_head_r) / 2 - lug_height(j) / 2;
function lug_tip(j) = bore_r(joint_z(j) + lug_bottom(j)) + lug_depth;
// A channel, in segment j's foot frame, by where the lug's centre is (x, mm round from the stop):
// level at the seated height for twist_lateral, then climbing down 45° to below the foot face.
function lug_z(j, x) = lug_bottom(j) - max(0, x - twist_lateral);
// How far round the sleeve the joint turns, from the lug meeting the foot face to the stop (mm).
function twist_travel(j) = twist_lateral + lug_bottom(j) + lug_height(j);
function twist_angle(j) = twist_travel(j) / sleeve_out(j) * 180 / PI;

assert(bore_r(mast_length) > 1, "wall leaves no bore at the top");
for (j = [1 : last]) {
    assert(screw_floor_r(j) - (sleeve_out(j) + fit_slop) >= 1.5, str("joint ", j, ": under 1.5 mm of foot under a lock screw's head"));
    assert(screw_z(j) + m3_head_r + 1 < sleeve_h(j), str("joint ", j, ": a lock screw doesn't fit in the ring"));
    assert(lug_bottom(j) + lug_height(j) + fit_slop + 0.5 < screw_z(j) - m3_head_r,
           str("joint ", j, ": the channels don't pass under the lock screws"));
    assert((lug_width + fit_slop + twist_travel(j) + 1) / sleeve_out(j) * 180 / PI < 360 / screw_count(j),
           str("joint ", j, ": a channel runs into the next one"));
    assert(seg_len + sleeve_h(j) <= section_height, str("segment ", j - 1, " is taller than section_height"));
    assert(sleeve_in(j) > 1, str("joint ", j, ": no bore left inside the sleeve"));
}

echo(segments = segments, segment_length = seg_len, print_height = [for (j = [1 : last]) seg_len + sleeve_h(j)],
     screws = [for (j = [1 : last]) screw_count(j)], total_screws = sum([for (j = [1 : last]) screw_count(j)]));

module radial_hole(r, from_r, to_r, z) {
    translate([0, 0, z]) rotate([0, 90, 0]) translate([0, 0, from_r])
        cylinder(r = r, h = to_r - from_r, $fn = 32);
}

// One honeycomb cell, cut radially from the axis so it keeps its angular width through the wall
// and through anything inside it: at a joint's flare, the ribs run the flare's full depth.
// Its roof and floor are 45° at the outside and steeper further in.
module cell(n, py, angle, z, ro) {
    w = 2 * PI * ro / n;
    roof = w / 2;
    side = py - roof;
    rotate([0, 0, angle]) hull()
        for (x = [1, ro + 1])
            translate([x, 0, z]) scale([1, x / ro, 1]) rotate([90, 0, 90])
                linear_extrude(0.01, center = true) offset(delta = -rib / 2) polygon([
                    [0, side / 2 + roof], [w / 2, side / 2], [w / 2, -side / 2],
                    [0, -side / 2 - roof], [-w / 2, -side / 2], [-w / 2, side / 2]]);
}

// Staggered rows of grid g's cells filling local heights a to b: the row pitch
// stretches so whole rows end on a and b, rather than leaving a solid band.
// z_base is the mast height of local 0, which sets the cells' outside radius.
// phase 1 staggers the first row, to carry on from a row below it.
module honeycomb(g, z_base, a, b, phase = 0) {
    n = cells_around(g);
    w = 2 * PI * outer_r(z_base + a) / n;
    fill = b - a - w / 2 + sqrt(2) * rib;
    rows = max(1, round(fill / row_pitch(g)));
    py = fill / rows;
    z0 = a + py / 2 + w / 4 - rib / sqrt(2);
    for (i = [0 : rows - 1], c = [0 : n - 1])
        cell(n, py, (c + ((i + phase) % 2) / 2) * 360 / n, z0 + i * py, outer_r(z_base + z0 + i * py));
}


// Segment k's wall as one profile: a plain tapered tube, a 45° flare and a straight neck
// stepping in to the sleeve, and the sleeve one hexagon above the top, its top edges rounded.
module segment_body(k) {
    z0 = joint_z(k);
    rr = sleeve_round;
    arc = function(cx, cz, a0, a1) [for (i = [0 : 8]) let(a = a0 + (a1 - a0) * i / 8) [cx + rr * cos(a), cz + rr * sin(a)]];
    top = k < last ? let(j = k + 1, h = seg_len + sleeve_h(j), ro = sleeve_out(j), ri = sleeve_in(j))
        concat([[ro, seg_len]], arc(ro - rr, h - rr, 0, 90), arc(ri + rr, h - rr, 90, 180),
               [[ri, seg_len - neck_length], [bore_r(flare_z(j)), flare_z(j) - z0]])
        : [[bore_r(z0 + seg_len), seg_len]];
    inner_from = top[len(top) - 1][1];
    keys = profile_keys(z0, z0 + inner_from);
    rotate_extrude($fn = facets) polygon(concat(
        [[bore_r(z0), 0], [outer_r(z0), 0]],
        [for (z = profile_keys(z0, z0 + seg_len)) [outer_r(z), z - z0]],
        [[outer_r(z0 + seg_len), seg_len]],
        top,
        [for (i = [len(keys) - 1 : -1 : 0]) if (len(keys) > 0) [bore_r(keys[i]), keys[i] - z0]]));
}

module tangential(angle, z, width) {
    rotate([0, 0, angle]) translate([0, 0, z]) rotate([90, 0, 0])
        linear_extrude(width, center = true) children();
}

// Joint j's lug cross-section in (radius, height): from the sleeve out to lug_tip, 45° below and above.
function lug_points(j) = let(r0 = sleeve_out(j) - 0.01, rt = lug_tip(j), d = rt - r0)
    [[r0, 0], [rt, d], [rt, d + lug_flat], [r0, 2 * d + lug_flat]];

module lug_section(j) {
    polygon(concat([[sleeve_out(j) - 1, 0]], lug_points(j), [[sleeve_out(j) - 1, lug_height(j)]]));
}

// Joint j's lugs on segment j-1's sleeve, one between each pair of screws, seated at the stop.
module lugs(j, z_base) {
    for (i = [0 : lug_count(j) - 1])
        tangential(lug_angle(j, i), joint_z(j) - z_base + lug_bottom(j), lug_width) lug_section(j);
}

// Joint j's channels in segment j's foot ring, an L each, in three parts as the joint goes on:
// - diagonal: from below the foot face, 45° up and round to the lug's height. The lug cams the
//   foot down until it lands on the joint face;
// - lateral: level for twist_lateral, the joint seated and still turning. The floor bears on
//   the lug by twist_preload, so it stays drawn tight;
// - pop: just short of the stop the channel pinches twist_snap narrower than the lug, floor and
//   ceiling both. The lug squeezes through and pops into the full-size stop, screw holes in line.
// Built from thin slices round the channel, each covering every height the lug passes through
// there, with its own floor rise and ceiling drop. Seating turns segment j by -twist_angle.
module channels(j) {
    c = fit_slop;
    c2 = c * sqrt(2);
    w = lug_width / 2;
    x0 = -w - c;
    p0 = w + 0.05;
    p1 = p0 + 0.5;
    x1 = twist_lateral + twist_travel(j) + w + 1;
    squeeze = c2 + twist_snap / 2;
    // [floor rise, ceiling drop] at x: preload to the corner, the pinch, and the stop pocket.
    fit = function(x) x < p0 ? [c2 + twist_preload, 0]
        : x < p1 ? [squeeze, squeeze]
        : x < twist_lateral + w ? [c2 + twist_preload, 0]
        : [0, 0];
    span = function(a, b) let(n = max(1, ceil((b - a) / 0.4))) [for (i = [0 : n - 1]) a + (b - a) * i / n];
    // The steps into and out of the pinch are 0.01 mm wide: the pop is the step on the stop side.
    stations = concat(span(x0, p0 - 0.01), span(p0 - 0.01, p0), span(p0, p1), span(p1, p1 + 0.5),
                      span(p1 + 0.5, x1), [x1]);
    for (i = [0 : lug_count(j) - 1]) {
        a = lug_angle(j, i);
        for (k = [0 : len(stations) - 2]) hull() for (x = [stations[k], stations[k + 1]])
            channel_slice(j, a, x, fit(x));
    }
}

// A channel at x: every lug position covering x lies between the lug's height at x + w (lowest)
// and at x - w (highest). Grown by fit_slop, then the floor raised and the ceiling lowered.
module channel_slice(j, a, x, f) {
    w = lug_width / 2;
    lo = lug_z(j, x + w);
    hi = lug_z(j, max(x - w, 0));
    tangential(a + x / sleeve_out(j) * 180 / PI, 0, 0.01)
        intersection() {
            hull() { translate([0, lo + f[0]]) offset(delta = fit_slop) lug_section(j); translate([0, hi + 50]) offset(delta = fit_slop) lug_section(j); }
            hull() { translate([0, lo - 50]) offset(delta = fit_slop) lug_section(j); translate([0, hi - f[1]]) offset(delta = fit_slop) lug_section(j); }
        }
}

// The head seats head_seat into the foot ring and clamps the rest of it; the screw passes it
// clear and threads into the sleeve's full thickness.
module screw_pockets(j, z) {
    for (m = [0 : screw_count(j) - 1])
        rotate([0, 0, screw_angle(j, m)]) {
            radial_hole(m3_head_r, screw_floor_r(j), outer_r(joint_z(j)) + 1, z);
            radial_hole(m3_clear_r, sleeve_out(j) + 0.01, screw_floor_r(j) + 0.01, z);
            radial_hole(m3_pilot_r, sleeve_in(j) - 1, sleeve_out(j) + 0.02, z);
        }
}

// Segment k, as printed: solid foot ring on the bed, solid sleeve on top. The top segment ends in a plain rim.
module mast_segment(k) {
    assert(k >= 0 && k < segments, str("segment ", k + 1, " doesn't exist: these settings make ", segments, " segments"));
    z0 = joint_z(k);
    difference() {
        union() {
            segment_body(k);
            if (k < last) lugs(k + 1, z0);
        }
        channels(k);
        screw_pockets(k, screw_z(k));
        honeycomb(k, z0, sleeve_h(k), k < last ? seg_len : seg_len - rim);
        if (k < last) screw_pockets(k + 1, seg_len + screw_z(k + 1));
    }
}

// The part files, one per segment: the customizer renders a part by a module that takes no arguments.
module segment_01() mast_segment(0);
module segment_02() mast_segment(1);
module segment_03() mast_segment(2);
module segment_04() mast_segment(3);
module segment_05() mast_segment(4);
module segment_06() mast_segment(5);
module segment_07() mast_segment(6);
module segment_08() mast_segment(7);
module segment_09() mast_segment(8);
module segment_10() mast_segment(9);
module segment_11() mast_segment(10);

// Every other segment, seated; parity picks which half, so the preview can shade them apart.
module mast_assembled(parity) {
    for (k = [parity : 2 : last])
        translate([0, 0, joint_z(k)]) mast_segment(k);
}

// Joint j's lock screws, seated, drawn for reference.
module lock_screws(j, length = 6) {
    for (m = [0 : screw_count(j) - 1])
        rotate([0, 0, screw_angle(j, m)])
            translate([0, 0, joint_z(j) + screw_z(j)]) rotate([0, 90, 0]) {
                translate([0, 0, screw_floor_r(j)]) cylinder(r = 2.75, h = 3, $fn = 32);
                translate([0, 0, screw_floor_r(j) - length]) cylinder(r = 1.5, h = length + 0.01, $fn = 32);
            }
}

// Joint j's segments, cut in half and trimmed to the joint.
module joint_cutaway(k, j) {
    r = outer_r(joint_z(j - 1)) + 2;
    intersection() {
        translate([0, 0, joint_z(k)]) mast_segment(k);
        translate([-r, 0, joint_z(j) - 30]) cube([2 * r, r, sleeve_h(j) + 60]);
    }
}
