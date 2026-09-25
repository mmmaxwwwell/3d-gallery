// BEGIN_DESCRIPTION
// A holder that carries a round metal ID tag flat against a biothane
// collar. The collar threads through the holder behind the tag, so the
// tag can't jingle, dangle or be pulled off.
//
// The tag drops into the holder from the back and seats against a lip
// that overlaps its edge; the front window leaves the engraving readable.
// Threading the collar through then closes the back, so the tag has no
// way out until the collar comes out again.
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

// Wall around the tag and the strap, and the backing behind the strap (mm).
wall = 2;
// END_PARAMS

// Diametral slip on the tag, so it drops in and out freely.
tag_clearance = 0.3;

// Extra depth on the tag pocket. Kept small so the strap, not the pocket,
// is what stops the tag rattling.
tag_depth_clearance = 0.1;

// Across the strap only — its thickness is left exact for the press fit.
collar_clearance = 0.3;

// Round on the back's outer edge, the side against the dog. Kept under
// `wall` so it stays out of the channel.
back_round_r = 1.5;

// Round on the pocket's rim at the back, also against the dog.
pocket_round_r = 0.5;

// Round on the front's outer edge. It meets the bed in a 45° chamfer, since
// a full round there would start as a flat overhang.
front_round_r = 1.5;

// Chamfer on the window's rim. It sits on the bed, where a round would
// overhang.
window_chamfer = 0.5;

// Round on the strap's exit corners, where the channel breaks the rim. Both
// sides of a 2 mm wall, so it has to stay under half of `wall`.
channel_round_r = 0.8;

_eps = 0.01;

// X runs along the collar, Y across it, Z from the back (z = 0, against
// the dog) out to the front face.
pocket_r = (tag_diameter + tag_clearance) / 2;
pocket_depth = tag_thickness + tag_depth_clearance;
window_r = tag_diameter / 2 - tag_overlap;
body_r = pocket_r + wall;

channel_w = collar_width + collar_clearance;
channel_z0 = wall;
channel_z1 = channel_z0 + collar_thickness;
pocket_z1 = channel_z1 + pocket_depth;
body_h = pocket_z1 + wall;

assert(window_r > 0, "tag_overlap leaves no window");
assert(channel_w / 2 < pocket_r,
       "the strap must be narrower than the tag or it can't hold it in");
assert(back_round_r < wall && front_round_r < wall,
       "edge rounds must stay inside the wall");
assert(channel_round_r < wall / 2, "channel_round_r would erase the wall");

// (r, z) half-section of the uncut body.
module _profile() {
    fc = [body_r - front_round_r, body_h - front_round_r];
    hull() {
        square([body_r - back_round_r, body_h]);
        translate([body_r - back_round_r, back_round_r]) circle(r = back_round_r);
        translate(fc) circle(r = front_round_r);
        translate([fc[0] + front_round_r * (sqrt(2) - 1) - _eps, body_h - _eps])
            square(_eps);
    }
}

// The channel layer's plan, with the strap's exit corners opened out.
module _channel_cut() {
    difference() {
        circle(r = body_r + 1);
        offset(r = channel_round_r) offset(delta = -channel_round_r)
            difference() {
                circle(r = body_r);
                circle(r = pocket_r);
                square([2 * body_r + 2, channel_w], center = true);
            }
    }
}

// Assembled pose: back at z = 0.
module holder_body() {
    difference() {
        rotate_extrude() _profile();

        translate([0, 0, channel_z0])
            linear_extrude(collar_thickness) _channel_cut();

        // The tag's way in and out, from the back through to the pocket.
        rotate_extrude() {
            translate([0, -_eps]) square([pocket_r, pocket_z1 + _eps]);
            difference() {
                translate([pocket_r - _eps, -_eps])
                    square(pocket_round_r + _eps);
                translate([pocket_r + pocket_round_r, pocket_round_r])
                    circle(r = pocket_round_r);
            }
        }

        rotate_extrude() polygon([
            [0, pocket_z1 - _eps],
            [window_r, pocket_z1 - _eps],
            [window_r, body_h - window_chamfer],
            [window_r + window_chamfer + _eps, body_h + _eps],
            [0, body_h + _eps],
        ]);
    }
}

// Print pose: face down. Printed back-down, the lip would be a flat 2 mm
// ring overhang; face-down the only unsupported spans are the backing
// bars, which bridge the channel.
module holder() {
    translate([0, 0, body_h]) mirror([0, 0, 1]) holder_body();
}
