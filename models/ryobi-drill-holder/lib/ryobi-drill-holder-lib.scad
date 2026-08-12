include <BOSL2/std.scad>
include <BOSL2/gears.scad>

// BEGIN_DESCRIPTION
// A parametric, chainable Ryobi ONE+ drill/tool holder. Each base-plate
// section carries one Ryobi-style mounting post and a recessed battery
// landing on top. Sections are joined side-to-side by double-locking
// dovetail puzzle connectors: a dovetail tongue slides in vertically and
// a drop-lock detent stops it sliding back out (two locks — one
// horizontal from the dovetail, one vertical from the detent). Enable a
// connector independently on the left and/or right edge so you can chain
// as many sections as you like, or cap a run with a plain endcap edge.
//
// The post is a cylinder capped by a sphere (27mm diameter, 30mm tall),
// matching the Ryobi battery cradle. Because the post carries weight it
// is split vertically into two D-shaped halves that print lying on their
// flat split face, so the layer lines run along the load path. The two
// halves meet over a flared, gear-splined collar that drops up through a
// matching gear-toothed hole in the base plate from underneath; the
// flare seats against the plate and the teeth resist rotation.
//
// Every section has four M5 button-head cap screw holes with recessed
// counterbores for the heads, for screwing the holder down to a wall or
// bench. All geometry is parametric — see the params block.
// END_DESCRIPTION

// BEGIN_PARAMS
// Width of one base-plate section along the chaining axis (X), in mm.
// This is the slot pitch — the default 90mm matches a standard spacing.
section_width = 90;

// Center-to-center post spacing along the chain (post-to-post pitch), mm.
// Equals the section width — each plate is one 90mm slot.
post_spacing = 90;

// Base-plate depth (front-to-back, Y), in mm.
plate_depth = 135;

// Base-plate thickness (Z), in mm.
plate_thickness = 5;

// Gap from the plate's TOP (+Y) edge to the top edge of the battery boss,
// in mm. Positions the boss (and, via it, the post) toward the top edge.
boss_top_gap = 22;

// Ryobi post outer diameter (cylinder + sphere), in mm.
post_diameter = 27;

// Ryobi post total height above the plate (cylinder + sphere), in mm.
post_height = 30;

// Battery landing pocket width (X) on top of the plate, in mm.
battery_width = 61;

// Battery landing pocket depth (Y) on top of the plate, in mm.
battery_depth = 59;

// Battery landing pocket raised-rim height (Z) on top of the plate, in mm.
battery_height = 8.5;

// Mounting screw nominal diameter (M5 button-head cap screw), in mm.
screw_d = 5;

// Number of mounting screw holes per section.
screw_count = 4;
// END_PARAMS

// ============================================================
// Fixed / derived constants
// ============================================================

// --- fit clearances -------------------------------------------------
// Gap applied wherever two printed parts interface (dovetail socket, the
// gear-splined post seat, the battery pocket, the split between post
// halves). 0.25mm is a firm slide fit on a well-tuned FDM printer.
fit_clearance   = 0.25;

// --- boss / post Y placement ----------------------------------------
// The boss top (+Y) edge sits boss_top_gap from the plate top edge.
// boss_y = center of the battery boss along Y.
boss_y = plate_depth / 2 - boss_top_gap - battery_depth / 2;
// The post's top (+Y) edge aligns with the boss top edge, so the post
// center is one radius in from that edge.
post_y = (plate_depth / 2 - boss_top_gap) - post_diameter / 2;

// --- M5 mounting hole (self-tapping, no head recess) -----------------
// The mounting holes are sized as a self-tapping pilot so an M5 screw
// BITES into the plastic and holds without a nut. There is NO head
// counterbore — the button head bears flat on the top surface. The pilot
// is the M5 thread MINOR (root) diameter so the major thread cuts in.
// M5 coarse minor diameter ≈ 4.13mm; round to 4.2 for a clean FDM bore.
screw_pilot_d = 4.2;
screw_hole_d  = screw_pilot_d;   // alias kept for readability

// --- edge rounding ---------------------------------------------------
plate_round = 2;     // mm rounding on the plate's vertical edges
post_base_round = 1; // mm fillet where the post meets the plate

// --- post seat (gear-splined flared collar) --------------------------
// The collar is a short BOSL2 spur gear extruded below the plate. Its
// flare (a larger lip) seats up against the plate underside; the toothed
// body keys into a matching toothed hole so the post can't spin.
post_collar_teeth   = 12;   // spline tooth count
post_collar_module  = 1.4;  // gear module (tooth size)
post_collar_h       = plate_thickness; // toothed length = plate thickness
post_flare_h        = 2.5;  // flare lip height below the plate
post_flare_extra_r  = 2.5;  // how far the flare lip overhangs the teeth

// Pitch radius of the spline (BOSL2 spur_gear: pr = module*teeth/2).
post_collar_pr = post_collar_module * post_collar_teeth / 2;
// Outer (tip) radius ~ pitch radius + module.
post_collar_or = post_collar_pr + post_collar_module;

// (Bowtie-key connector dimensions are defined further down, next to the
// bowtie geometry modules.)

// --- geometry tolerances ---------------------------------------------
eps = 0.01;          // small overlap to avoid coplanar faces
big = 1000;          // large number for cut volumes

// ============================================================
// Helper modules
// ============================================================

// A rounded base-plate block: section_width (X) by plate_depth (Y) by
// plate_thickness (Z), vertical edges rounded, sitting on z=0 (bottom at
// z=0, top at z=plate_thickness). Centered in X and Y.
module _plate_block() {
    translate([0, 0, plate_thickness / 2])
        cuboid([section_width, plate_depth, plate_thickness],
               rounding = plate_round, edges = "Z", $fn = 32);
}

// The raised battery landing rim on top of the plate. A shallow open
// pocket sized to cradle a Ryobi battery foot: outer wall around a
// battery_width x battery_depth footprint, battery_height tall.
module _battery_landing() {
    wall = 3;
    translate([0, boss_y, plate_thickness]) {
        difference() {
            // outer raised block
            translate([0, 0, battery_height / 2])
                cuboid([battery_width + 2 * wall, battery_depth + 2 * wall, battery_height],
                       rounding = 2, edges = "Z", $fn = 32);
            // pocket the battery foot drops into (open top)
            translate([0, 0, battery_height / 2 + wall])
                cuboid([battery_width + fit_clearance, battery_depth + fit_clearance, battery_height],
                       rounding = 1.5, edges = "Z", $fn = 24);
        }
    }
}

// One M5 self-tapping mounting hole, axis along Z, at the origin. A plain
// pilot bore straight through the plate — NO head counterbore. The M5
// thread bites into the plastic; the button head bears on the top face.
module _screw_hole() {
    translate([0, 0, -eps])
        cylinder(d = screw_pilot_d, h = plate_thickness + 2 * eps, $fn = 30);
}

// children()-iterator placing screw holes. For 4 screws they sit at the
// four corners of an inset rectangle; the inset keeps clear of the
// battery landing and the plate edge rounding.
module _screw_positions() {
    // inset enough to leave a solid boss of plastic around each pilot for
    // the thread to bite into, clear of the plate edge rounding.
    edge_inset = screw_pilot_d / 2 + 4;
    inset_x = section_width / 2 - edge_inset;
    inset_y = plate_depth / 2 - edge_inset;
    if (screw_count == 4) {
        for (x = [-inset_x, inset_x], y = [-inset_y, inset_y])
            translate([x, y, 0]) children();
    } else {
        // even spread along X at both Y edges, fallback for other counts
        n = max(1, floor(screw_count / 2));
        for (y = [-inset_y, inset_y])
            xcopies(l = 2 * inset_x, n = n)
                translate([0, y, 0]) children();
    }
}

// ============================================================
// Post (cylinder + sphere), split vertically into D-halves
// ============================================================

// The solid Ryobi post sitting on the plate top: a cylinder of
// post_diameter, capped with a hemisphere, total post_height tall.
// Bottom at z=plate_thickness (sits on the plate). A small fillet skirt
// blends the base to the plate.
module _post_solid() {
    r = post_diameter / 2;
    cyl_h = post_height - r;   // cylinder portion; sphere adds the top r
    translate([0, 0, plate_thickness]) {
        // base fillet skirt
        rotate_extrude($fn = 64)
            translate([r, 0, 0])
                difference() {
                    square([post_base_round, post_base_round]);
                    translate([post_base_round, post_base_round])
                        circle(r = post_base_round, $fn = 24);
                }
        // cylinder shaft
        cylinder(h = cyl_h, r = r, $fn = 64);
        // spherical cap
        translate([0, 0, cyl_h])
            sphere(r = r, $fn = 64);
    }
}

// The gear-splined flared collar hanging BELOW the plate. The toothed
// section keys into the matching hole through the plate; the flare lip at
// the very bottom is wider so it seats up against the plate underside and
// stops the assembled post pulling up through the hole.
module _post_collar() {
    translate([0, 0, 0]) {
        // toothed body spanning the plate thickness (z 0..plate_thickness)
        spur_gear(mod = post_collar_module, teeth = post_collar_teeth,
                  thickness = post_collar_h, gear_spin = 0, $fn = 48,
                  anchor = BOTTOM);
        // flare lip below the plate
        translate([0, 0, -post_flare_h])
            cylinder(h = post_flare_h + eps,
                     r1 = post_collar_or + post_flare_extra_r,
                     r2 = post_collar_or + post_flare_extra_r * 0.4,
                     $fn = 48);
    }
}

// Full assembled post: the upper post solid plus the collar below the
// plate, as one solid (used for previews / as the union the plate hole
// must clear around).
module _post_full() {
    _post_solid();
    _post_collar();
}

// The hole the post seats into, cut from the plate (+ battery landing).
// Two stacked bores at post_y:
//   1. Through the PLATE thickness: the toothed spur-gear profile that the
//      collar keys into — same profile as the collar grown by fit_clearance
//      all round (radial scale + tooth backlash) for a 0.25mm interface gap.
//   2. Through the battery LANDING above the plate: a plain round clearance
//      bore for the post shaft, so the post passes up through the boss
//      instead of being capped by it. Sized to the post diameter + clearance.
// Without (2) the raised battery landing seals over the gear hole and the
// post has nowhere to emerge — the boss must have a hole for the post.
module _post_hole() {
    grow = (post_collar_or + fit_clearance) / post_collar_or; // radial scale
    translate([0, post_y, 0]) {
        // (1) toothed bore through the plate
        translate([0, 0, -eps])
            scale([grow, grow, 1])
                spur_gear(mod = post_collar_module, teeth = post_collar_teeth,
                          thickness = plate_thickness + 2 * eps, gear_spin = 0,
                          backlash = fit_clearance, $fn = 48, anchor = BOTTOM);
        // (2) round post-shaft clearance bore through the battery landing
        translate([0, 0, plate_thickness - eps])
            cylinder(d = post_diameter + fit_clearance,
                     h = battery_height + 2 * eps, $fn = 64);
    }
}

// One half of the post (and its collar) cut for printing on its side.
// `side` = +1 keeps the +X half, -1 keeps the -X half. The split plane is
// X=0 (the post's vertical axis), so each half is a D shape that lays flat
// on its split face — layer lines run vertically along the load.
module post_half(side = 1) {
    intersection() {
        _post_full();
        // split plane offset by half the interface gap so the two printed
        // halves meet with a 0.25mm total gap (0.125 each side).
        translate([side * (big / 2 + fit_clearance / 2), 0, big / 2 - plate_thickness])
            cube([big, big, big + 2 * plate_thickness], center = true);
    }
}

// post_half oriented for PRINTING: laid on its flat split face, on z=0.
// Rotate the kept half so the split plane (X=0) becomes the bed (z=0).
module post_half_printable(side = 1) {
    // Move the post so its overall center is at origin, then lay it down.
    rotate([0, side * 90, 0])
        translate([0, 0, 0])
            post_half(side);
}

// ============================================================
// Bowtie key connectors (separate parts; bolt-captured)
// ============================================================
// Adjacent plates are joined by separate "bowtie" (double-dovetail) keys.
// Every plate edge carries TWO bowtie sockets. A key straddles the seam
// between two plates — one lobe in each plate's edge socket — and locks
// them together in X/Y. Each key is also tapered 30° through the plate
// thickness (wider at the BOTTOM), so a key dropped UP from the underside
// wedges and cannot pull out the top. With the holder bolted down through
// the M5 holes, the backing surface then traps the keys from below too.

// --- bowtie dimensions (the SOCKET; key is this minus clearance) ------
bowtie_end    = 14;   // wide width at each lobe end (X across the seam), mm
bowtie_waist  = 8;    // pinched middle width, mm
bowtie_span   = 22;   // total length across the seam (X), mm
bowtie_ylen   = 12;   // bowtie depth along the edge (Y), mm
bowtie_taper  = 30;   // dovetail-in-Z taper angle per the brief, degrees
// the two sockets on each edge sit this far either side of the boss line
bowtie_y_off  = 38;   // |Y| offset of each of the two sockets from y=0, mm

// 2D bowtie (hourglass) profile centered at origin, long axis along X
// (across the seam), depth along Y. Wide lobes at ±X, pinched at center.
module _bowtie_profile(span, end_w, waist_w, ylen) {
    hw = ylen / 2;
    polygon([
        [-span/2,  end_w/2], [-span/2, -end_w/2],
        [-span/6, -waist_w/2], [ span/6, -waist_w/2],
        [ span/2, -end_w/2], [ span/2,  end_w/2],
        [ span/6,  waist_w/2], [-span/6,  waist_w/2],
    ]);
}

// A bowtie prism tapered through Z by bowtie_taper degrees (wider at the
// bottom z=0, narrowing toward the top z=plate_thickness). Built centered
// in X/Y, spanning z = 0..plate_thickness. `grow` enlarges the profile
// uniformly (used to make the socket bigger than the key by the fit gap).
module _bowtie_prism(grow = 0) {
    // Taper the whole 2D bowtie linearly through Z so each side wall slopes
    // inward by bowtie_taper degrees — wider at the bottom (z=0), narrower
    // at the top. linear_extrude(scale=) preserves the concave waist (a
    // hull() would bridge it into a convex blob, so we must NOT hull).
    // Top scale chosen so the profile's half-span loses plate_thickness*
    // tan(taper) over the height.
    top_inset = plate_thickness * tan(bowtie_taper);
    topS = (bowtie_span / 2 - top_inset) / (bowtie_span / 2);
    linear_extrude(height = plate_thickness, scale = topS, slices = 1)
        offset(r = grow)
            _bowtie_profile(bowtie_span, bowtie_end, bowtie_waist, bowtie_ylen);
}

// children()-iterator placing the two bowtie sockets on ONE edge.
// `side` = +1 right edge (+X), -1 left edge (-X). Each bowtie is centered
// ON the edge so half its span sits in this plate, half reaches outward to
// the neighbour. The two sockets sit at ±bowtie_y_off in Y.
module _edge_bowtie_positions(side = 1) {
    for (y = [-bowtie_y_off, bowtie_y_off])
        translate([side * section_width / 2, y, 0])
            children();
}

// All four bowtie SOCKET cuts (2 per edge), as solids to subtract from a
// plate. Sized larger than the key by fit_clearance for a slide fit.
module _all_socket_cuts() {
    for (side = [-1, 1])
        _edge_bowtie_positions(side)
            _bowtie_prism(grow = fit_clearance / 2);
}

// The separate bowtie KEY part: full bowtie (both lobes), tapered in Z,
// to drop up into two aligned plate sockets. Bottom on z=0 for printing.
module bowtie_key() {
    _bowtie_prism(grow = 0);
}

// ============================================================
// Section base plate (one slot) with optional connectors + holes
// ============================================================
// All of the modules below are COLORLESS. Color is applied by the
// preview/*.scad consumer files (top-level color() calls), because the
// gallery's multicolor 3MF builder discovers colors by scanning the
// preview .scad text — so color() must be visible there, not buried in
// this lib. The single-color part exports (plate, post halves) are
// likewise colored at the consumer.

// One complete base-plate section: rounded plate, battery landing, four
// screw pilot holes, the splined post seat hole, and the four bowtie
// sockets (two per side). Every plate is identical and chains in either
// direction via separate bowtie keys. No post solids. Bottom on z=0.
module base_section() {
    difference() {
        union() {
            _plate_block();
            _battery_landing();
        }
        _screw_positions() _screw_hole();
        _post_hole();
        _all_socket_cuts();
    }
}

// A continuous (non-extendable) multi-section plate: n sections fused into
// one solid plate with plain outer edges, n posts' seat holes, n battery
// landings, and 4 screws per section. Colorless.
module solid_row_plate(n = 3) {
    difference() {
        union() {
            translate([0, 0, plate_thickness / 2])
                cuboid([n * section_width, plate_depth, plate_thickness],
                       rounding = plate_round, edges = "Z", $fn = 32);
            for (i = [0 : n - 1])
                translate([(i - (n - 1) / 2) * section_width, 0, 0])
                    _battery_landing();
        }
        for (i = [0 : n - 1])
            translate([(i - (n - 1) / 2) * section_width, 0, 0]) {
                _screw_positions() _screw_hole();
                _post_hole();
            }
    }
}

// ============================================================
// Public part modules (single-color STL exports — colored by consumer)
// ============================================================

// Base plate for ONE section: identical on both edges (two bowtie sockets
// per side) plus the post seat hole. Printed flat on z=0. Chain plates
// with separate bowtie_key() parts.
module plate() {
    base_section();
}

// One post half, oriented for printing on its flat split face.
module post_half_part() {
    post_half_printable(1);
}

// ============================================================
// Assembly building blocks (colorless) — consumers add color()
// ============================================================

// The two post halves seated in place on the plate. Call from a consumer
// that wraps each half in its own color() for a two-tone preview, e.g.:
//   color("#5fb3d6") post_half_A();
//   color("#d65f9a") post_half_B();
module post_half_A() { translate([0, post_y, 0]) post_half(1); }
module post_half_B() { translate([0, post_y, 0]) post_half(-1); }

// A bowtie key seated in the socket, sized with the fit gap (so it reads
// as the real, slightly-undersized printed key sitting in the cut).
module _seated_key() {
    _bowtie_prism(grow = -fit_clearance / 2);
}

// Place a key in EACH of the four sockets of a plate whose center is at
// X = px. Used by previews so every dovetail slot shows a key, per spec.
// (Where two plates share a seam the keys overlap into one — that's fine
// for a preview render; they fuse.)
module keys_for_plate_at(px = 0) {
    for (side = [-1, 1], y = [-bowtie_y_off, bowtie_y_off])
        translate([px + side * section_width / 2, y, 0])
            _seated_key();
}

