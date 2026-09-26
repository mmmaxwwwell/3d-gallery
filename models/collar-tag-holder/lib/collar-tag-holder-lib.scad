// BEGIN_DESCRIPTION
// A holder that carries a round metal ID tag flat against a biothane
// collar. The collar threads through the holder behind the tag, so the
// tag can't jingle, dangle or be pulled off.
//
// The collar runs in a channel along the back, enclosed at both ends. The
// tag presses in through a round opening in the back, a little smaller
// than the tag, and seats flat against a lip that overlaps its front edge;
// the front window leaves the engraving readable. Pressing the collar in
// behind it holds the tag there.
// Print it in TPU: the back opening is an interference fit on the tag,
// and the filament's give is what lets it past.
// END_DESCRIPTION

// BEGIN_PARAMS
// Diameter of the metal tag (mm).
tag_diameter = 32;

// Thickness of the metal tag (mm).
tag_thickness = 1.3;

// How far the front lip overlaps the tag's edge (mm). The readable window
// is the tag diameter less twice this.
tag_overlap = 2;

// How far the back opening overlaps the tag's edge (mm). The tag is
// pressed past it to go in, and it keeps the tag in beside the strap.
// Raise it to grip harder, lower it for an easier fit.
back_overlap = 1;

// Width of the collar strap (mm). 25 is 1 in biothane.
collar_width = 25;

// Thickness of the collar strap (mm). The channel is cut to exactly this,
// so the strap presses in and pins the tag against the lip.
collar_thickness = 2.5;

// How long the solid strip at each end is (mm): the stretch past the tag
// where the back is closed and the strap is fully enclosed. This is what
// holds the collar on.
capture_length = 6;

// Wall around the tag and the strap, and the front lip (mm).
wall = 2;
// END_PARAMS

// Diametral slip on the tag's pocket.
tag_clearance = 0.3;

// Extra depth on the tag pocket. Kept small so the strap, not the pocket,
// is what stops the tag rattling.
tag_depth_clearance = 0.1;

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

// 45° chamfer on the channel's four edges where it leaves each end face,
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
opening_r = tag_diameter / 2 - back_overlap;
// Beside the strap, the back lip's inner face is a 45° cone out to the
// pocket wall: printed face down, a flat ring there would overhang.
opening_cone_h = pocket_r - opening_r;

channel_w = collar_width + collar_clearance;
channel_z0 = lip_height;
channel_z1 = channel_z0 + collar_thickness;
pocket_z1 = channel_z1 + pocket_depth;
body_h = pocket_z1 + wall;

body_l = 2 * (pocket_r + capture_length);
body_w = 2 * (pocket_r + wall);
// Leaves each end face flat across the channel and a wall either side of it.
body_corner_r = pocket_r - channel_w / 2;

assert(window_r > 0, "tag_overlap leaves no window");
assert(back_overlap > tag_clearance / 2, "back_overlap is inside the pocket's slip, so it holds nothing");
assert(channel_z0 + opening_cone_h <= channel_z1, "back_overlap is too deep for the strap channel");
assert(body_corner_r > 0, "the strap must be narrower than the tag");
assert(back_round_r < lip_height + collar_thickness && front_round_r < wall,
       "edge rounds must stay clear of the channel and the pocket");
assert(channel_chamfer < lip_height, "channel_chamfer would break through the back");

module _plan() {
    offset(r = body_corner_r)
        square([body_l - 2 * body_corner_r, body_w - 2 * body_corner_r], center = true);
}

module _slice(inset, z) {
    translate([0, 0, z]) linear_extrude(_eps) offset(delta = -inset) _plan();
}

// The plan is convex, so the rounded body is the hull of inset slices.
module _body() {
    steps = 8;
    rb = back_round_r;
    rf = front_round_r;
    hull() {
        for (i = [0 : steps]) {
            a = 90 * i / steps;
            _slice(rb - rb * cos(a), rb - rb * sin(a));
        }
        for (i = [0 : steps]) {
            a = 45 * i / steps;
            _slice(rf - rf * cos(a), body_h - rf + rf * sin(a));
        }
        _slice(rf * (2 - sqrt(2)), body_h - _eps);
    }
}

// Full length, so it bores through both end strips. Exactly collar_thickness
// tall: slack here shows up as a loose strap in the end strips.
module _channel() {
    translate([0, 0, channel_z0 + collar_thickness / 2]) {
        cube([body_l + 2, channel_w, collar_thickness], center = true);
        for (s = [0, 1])
            mirror([s, 0, 0])
                hull() {
                    translate([body_l / 2 - channel_chamfer, 0, 0])
                        cube([_eps, channel_w, collar_thickness], center = true);
                    translate([body_l / 2 + 0.5, 0, 0])
                        cube([1, channel_w + 2 * (channel_chamfer + 0.5),
                              collar_thickness + 2 * (channel_chamfer + 0.5)], center = true);
                }
    }
}

// Back opening, pocket and window, as one (r, z) section. The pocket runs
// down past the strap to the back lip, so the tag's edge has nothing but
// the lip to get past on its way in.
module _pocket() {
    rotate_extrude() {
        polygon([
            [0, -1],
            [opening_r, -1],
            [opening_r, channel_z0],
            [pocket_r, channel_z0 + opening_cone_h],
            [pocket_r, pocket_z1],
            [window_r, pocket_z1],
            [window_r, body_h - window_chamfer],
            [window_r + window_chamfer + _eps, body_h + _eps],
            [0, body_h + _eps],
        ]);
        difference() {
            translate([opening_r - _eps, -_eps]) square(opening_round_r + _eps);
            translate([opening_r + opening_round_r, opening_round_r])
                circle(r = opening_round_r);
        }
    }
}

// Assembled pose: back at z = 0.
module holder_body() {
    difference() {
        _body();
        _channel();
        _pocket();
    }
}

// Print pose: face down, so the tag's lip sits on the bed. The back's
// only unsupported spans are the channel roof, bridging the strap's width.
module holder() {
    translate([0, 0, body_h]) mirror([0, 0, 1]) holder_body();
}
