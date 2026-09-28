// BEGIN_DESCRIPTION
// A holder that carries a round metal ID tag flat against a biothane
// collar. The collar threads through the holder behind the tag, so the
// tag can't jingle, dangle or be pulled off.
//
// The collar runs in a channel along the back, enclosed at both ends. The
// tag presses in through an opening in the back, past a small catch
// beside the strap, and seats flat against a lip that overlaps its front edge;
// the front window leaves the engraving readable. Pressing the collar in
// behind it holds the tag there.
// Print it in TPU: the catch is an interference fit on the tag, and the
// filament's give is what lets it past.
// END_DESCRIPTION

// BEGIN_PARAMS
// Diameter of the metal tag (mm).
tag_diameter = 32;

// Thickness of the metal tag (mm).
tag_thickness = 1.3;

// How far the front lip overlaps the tag's edge (mm). The readable window
// is the tag diameter less twice this.
tag_overlap = 2;

// Width of the collar strap (mm). 25 is 1 in biothane.
collar_width = 25;

// Thickness of the collar strap (mm). The channel is cut to exactly this,
// so the strap presses in and pins the tag against the lip.
collar_thickness = 2.5;

// How far the holder runs past the tag at each end of the strap (mm): the
// strip where the back is closed and the strap is fully enclosed. This is
// what holds the collar on. The holder is round, so it runs this far past
// the tag all the way round.
capture_length = 6;

// Wall around the tag and the strap, and the front lip (mm).
wall = 2;
// END_PARAMS

// Diametral slip on the tag's pocket.
tag_clearance = 0.3;

// Extra depth on the tag pocket. Kept small so the strap, not the pocket,
// is what stops the tag rattling.
tag_depth_clearance = 0.1;

// Beside the strap, a flat ledge this wide at the tag's back face, inside the
// pocket wall. The tag snaps past it going in and it catches the tag's edge.
tag_catch = 0.75;

// Across the strap only — its thickness is left exact for the press fit.
collar_clearance = 0.3;

// Thickness of the back, behind the strap, against the dog.
lip_height = 1.2;

// Round on the back's outer edge, the side against the dog.
back_round_r = 1.5;

// Round on the back opening's rim, also against the dog.
opening_round_r = 0.5;

// Round on the front's outer edge. It meets the bed in a 45° chamfer, since
// a full round there would start as a flat overhang.
front_round_r = 1.5;

// Chamfer on the window's rim. It sits on the bed, where a round would
// overhang.
window_chamfer = 0.5;

// 45° chamfer on the channel's four edges where it leaves the rim,
// so the strap never bends over a square edge.
channel_chamfer = 0.6;

// How far one cut runs into the next, so two cuts never meet on a shared
// plane and leave a film between them.
cut_overlap = 1;

_eps = 0.01;

// X runs along the collar, Y across it, Z from the back (z = 0, against
// the dog) out to the front face.
pocket_r = (tag_diameter + tag_clearance) / 2;
pocket_depth = tag_thickness + tag_depth_clearance;
window_r = tag_diameter / 2 - tag_overlap;

channel_w = collar_width + collar_clearance;
channel_z0 = lip_height;
channel_z1 = channel_z0 + collar_thickness;
pocket_z1 = channel_z1 + pocket_depth;
body_h = pocket_z1 + wall;

body_r = pocket_r + capture_length;
// Beside the strap the space behind the tag is filled in, its face a 45°
// cone out to the pocket wall at the tag's back: printed face down, a flat
// ring there would overhang. This is its radius where it meets the back.
fill_r0 = pocket_r - tag_catch - collar_thickness;

assert(window_r > 0, "tag_overlap leaves no window");
assert(fill_r0 > channel_w / 2, "the strap is too wide for the fill beside it to hold the tag");
assert(back_round_r < lip_height + collar_thickness && front_round_r < wall,
       "edge rounds must stay clear of the channel and the pocket");
assert(channel_chamfer < lip_height, "channel_chamfer would break through the back");

module _body() {
    steps = 8;
    rb = back_round_r;
    rf = front_round_r;
    rotate_extrude()
        polygon(concat(
            [[0, 0]],
            [for (i = [steps : -1 : 0]) let(a = 90 * i / steps)
                [body_r - rb + rb * cos(a), rb - rb * sin(a)]],
            [for (i = [0 : steps]) let(a = 45 * i / steps)
                [body_r - rf + rf * cos(a), body_h - rf + rf * sin(a)]],
            [[body_r - rf * (2 - sqrt(2)), body_h], [0, body_h]]
        ));
}

// Full length, so it bores through both end strips. Exactly collar_thickness
// tall: slack here shows up as a loose strap in the end strips.
module _channel() {
    zc = channel_z0 + collar_thickness / 2;
    translate([0, 0, zc]) cube([2 * body_r + 2, channel_w, collar_thickness], center = true);
    _channel_flare(zc);
}

// The exit chamfer on a round rim: the channel's cross-section widens 45°
// with radius from body_r - channel_chamfer. The rotated profile flares it
// in Z; the plan region, |y| - channel_w / 2 <= r - (body_r - channel_chamfer),
// flares it in Y.
module _channel_flare(zc) {
    c = channel_chamfer;
    r0 = body_r - c;
    k = r0 - channel_w / 2;
    y_max = channel_w / 2 + c + 2;
    n = 20;
    intersection() {
        rotate_extrude()
            polygon([
                [r0 - collar_thickness / 2, zc],
                [body_r + 2, zc - collar_thickness / 2 - c - 2],
                [body_r + 2, zc + collar_thickness / 2 + c + 2],
            ]);
        linear_extrude(body_h)
            for (s = [0, 1])
                mirror([s, 0])
                    polygon(concat(
                        [[body_r + 3, -y_max]],
                        [for (i = [-n : n]) let(y = y_max * i / n)
                            [sqrt(pow(abs(y) + k, 2) - y * y), y]],
                        [[body_r + 3, y_max]]
                    ));
    }
}

// Pocket and window, as one (r, z) section. Below the tag the pocket is
// the fill's cone; the channel cut clears it across the strap.
module _pocket() {
    rotate_extrude()
        polygon([
            [0, channel_z0],
            [fill_r0, channel_z0],
            [pocket_r - tag_catch, channel_z1],
            [pocket_r, channel_z1],
            [pocket_r, pocket_z1],
            [window_r, pocket_z1],
            [window_r, body_h - window_chamfer],
            [window_r + window_chamfer + _eps, body_h + _eps],
            [0, body_h + _eps],
        ]);
}

module _opening_plan() {
    intersection() {
        circle(r = pocket_r);
        square([2 * pocket_r + 2, channel_w], center = true);
    }
}

// Through the back, the pocket's full width along the strap and clipped to
// the strap's width across it, so only the catch beside the strap holds the tag.
// It runs on past the tag's back face: the channel's top and the catch's step
// share that plane, and would leave a film across the strap there. Its rim against the dog
// is rounded; the round is concave, so it's a union of hulls, not one hull.
module _opening() {
    steps = 8;
    rr = opening_round_r;
    function e(i) = rr - rr * cos(90 * i / steps);
    function z(i) = rr - rr * sin(90 * i / steps);
    module slice(grow, z) {
        translate([0, 0, z]) linear_extrude(_eps) offset(r = grow) _opening_plan();
    }
    for (i = [0 : steps - 1])
        hull() {
            slice(e(i), z(i));
            slice(e(i + 1), z(i + 1));
        }
    translate([0, 0, -1]) linear_extrude(channel_z1 + cut_overlap + 1) _opening_plan();
    translate([0, 0, -1]) linear_extrude(1 + _eps) offset(r = rr) _opening_plan();
}

// Assembled pose: back at z = 0.
module holder_body() {
    difference() {
        _body();
        _channel();
        _pocket();
        _opening();
    }
}

// Print pose: face down, so the tag's lip sits on the bed. The back's
// only unsupported spans are the channel roof, bridging the strap's width.
module holder() {
    translate([0, 0, body_h]) mirror([0, 0, 1]) holder_body();
}
