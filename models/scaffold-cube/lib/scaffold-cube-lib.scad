// BEGIN_DESCRIPTION
// The 1U cube of a printed building-block system. A 200 mm cube — the
// largest square that fits a Flashforge Adventurer 5M bed — built from
// 6 independently-typed wall panels and 12 independently-typed edge
// braces. Each wall is solid, empty, a hex lattice, or a hex lattice
// crossed by a solid X; each edge is bare or carries a right-triangle
// brace whose two legs are equal.
// Mix the 18 types to get an open frame, a closed box, a tray, a
// chimney, or anything between.
// END_DESCRIPTION

// BEGIN_PARAMS
// Outer edge length of the cube (mm). 1U = 200 mm. Every wall sits
// flush with this envelope and every brace is inside it, so a block
// never exceeds this bounding box and units stack face to face.
size = 200;

// Thickness of every wall panel (mm). Measured inward from the cube's
// outer surface.
wall_thickness = 8;

// Width of the solid border left around a "hexagon" wall (mm). The
// lattice is cut only inside this margin, so the panel keeps an
// unbroken perimeter to join its neighbours and carry the edge braces.
// Also the width of the X on a "hexagon_x" wall.
hex_frame = 25;

// Flat-to-flat width of one hex cell in a "hexagon" wall (mm).
// Smaller = denser lattice, more cells, longer render.
hex_size = 15;

// Material left between neighbouring hex cells (mm).
hex_wall = 3;

// Leg length of a "triangle" edge brace (mm). The brace is a prism
// whose cross-section is a right triangle with both legs this long —
// one running along each of the two walls meeting at that edge, right
// angle in the corner. Set to 0 to suppress every brace at once.
edge_leg = 25;

// Total length of a bowtie key measured across the seam (mm). Half of
// it lands in each of the two blocks, so keep it under 2 * hex_frame
// or the pocket breaks out of a lattice wall's solid border.
join_len = 36;

// Width of a bowtie key at its two flared ends (mm). The flare is
// what stops the blocks pulling apart; the wider it runs against the
// waist, the steeper the dovetail.
join_end = 18;

// Width of a bowtie key at its waist (mm) — the narrow middle that
// straddles the seam.
join_waist = 9;

// Depth a bowtie pocket is sunk below the wall's outer surface (mm).
// Keep it under wall_thickness so the pocket keeps a floor for the
// key to seat against.
join_depth = 5;

// Gap between a bowtie key and its pocket, per side (mm). Taken out
// of the key and never out of the pocket, so two blocks still meet
// flush no matter how loose the key is.
join_clearance = 0.2;

// Number of bowtie pockets along each `size`-long span of seam.
join_count = 3;

// Bottom wall, the Z=0 face.
wall_bottom = "solid"; // [solid, empty, hexagon, hexagon_x]

// Top wall, the Z=size face. A lattice rather than a solid slab, so
// the ceiling is a field of short bridges over hex cells instead of
// one 200 mm span — but the hex_frame border around it is still a
// full-width bridge, so this face wants support.
wall_top = "hexagon"; // [solid, empty, hexagon, hexagon_x]

// Front wall, the Y=0 face.
wall_front = "hexagon"; // [solid, empty, hexagon, hexagon_x]

// Back wall, the Y=size face.
wall_back = "hexagon"; // [solid, empty, hexagon, hexagon_x]

// Left wall, the X=0 face.
wall_left = "hexagon"; // [solid, empty, hexagon, hexagon_x]

// Right wall, the X=size face.
wall_right = "hexagon"; // [solid, empty, hexagon, hexagon_x]

// Vertical edge where the front and left walls meet.
edge_vert_front_left = "triangle"; // [none, triangle]

// Vertical edge where the front and right walls meet.
edge_vert_front_right = "triangle"; // [none, triangle]

// Vertical edge where the back and left walls meet.
edge_vert_back_left = "triangle"; // [none, triangle]

// Vertical edge where the back and right walls meet.
edge_vert_back_right = "triangle"; // [none, triangle]

// Bottom edge where the bottom and front walls meet.
edge_bottom_front = "triangle"; // [none, triangle]

// Bottom edge where the bottom and back walls meet.
edge_bottom_back = "triangle"; // [none, triangle]

// Bottom edge where the bottom and left walls meet.
edge_bottom_left = "triangle"; // [none, triangle]

// Bottom edge where the bottom and right walls meet.
edge_bottom_right = "triangle"; // [none, triangle]

// Top edge where the top and front walls meet.
edge_top_front = "triangle"; // [none, triangle]

// Top edge where the top and back walls meet.
edge_top_back = "triangle"; // [none, triangle]

// Top edge where the top and left walls meet.
edge_top_left = "triangle"; // [none, triangle]

// Top edge where the top and right walls meet.
edge_top_right = "triangle"; // [none, triangle]

// Bowtie pockets on the bottom wall, the Z=0 face. A wall set to
// "empty" carries none of them whatever this says.
join_bottom = "bowtie"; // [none, bowtie]

// Bowtie pockets on the top wall, the Z=size face.
join_top = "bowtie"; // [none, bowtie]

// Bowtie pockets on the front wall, the Y=0 face.
join_front = "bowtie"; // [none, bowtie]

// Bowtie pockets on the back wall, the Y=size face.
join_back = "bowtie"; // [none, bowtie]

// Bowtie pockets on the left wall, the X=0 face.
join_left = "bowtie"; // [none, bowtie]

// Bowtie pockets on the right wall, the X=size face.
join_right = "bowtie"; // [none, bowtie]
// END_PARAMS

_eps = 0.01;

// Base orientations for the edge braces. Each maps the prism's local
// frame — legs on +X/+Y, extrusion on +Z — onto one cube axis:
//   _BASE_X: extrude along +X, legs on +Y / +Z
//   _BASE_Y: extrude along +Y, legs on +Z / +X
//   _BASE_Z: extrude along +Z, legs on +X / +Y
_BASE_X = [90, 0, 90];
_BASE_Y = [0, -90, -90];
_BASE_Z = [0, 0, 0];

// ── Helpers ────────────────────────────────────────────────────────

function _hex_r(s) = s / sqrt(3);

// Resolve one edge's type: `override` wins when an assembly passed a
// blanket type for the whole block, otherwise the edge keeps its param.
function _edge(type, override) = is_undef(override) ? type : override;

// Pointy-top hex prism, flat-to-flat width `s`, extruded +Z to `h`.
module _hex_prism(s, h) {
    linear_extrude(h)
        rotate([0, 0, 30])
            circle(r = _hex_r(s), $fn = 6);
}

// Honeycomb of hex prisms covering [0,w] x [0,h], each `depth` tall.
// Over-generated by a ring in every direction and centred on the area,
// so clipping it to the panel window truncates cells evenly on
// opposite sides instead of eating one edge and leaving the other.
module _hex_grid(w, h, depth, s, wall) {
    pitch_x = s + wall;
    pitch_y = pitch_x * sqrt(3) / 2;
    nx = ceil(w / pitch_x) + 2;
    ny = ceil(h / pitch_y) + 2;
    ox = (w - (nx - 1) * pitch_x) / 2;
    oy = (h - (ny - 1) * pitch_y) / 2;
    for (j = [0 : ny - 1]) {
        row_shift = (j % 2 == 0) ? 0 : pitch_x / 2;
        for (i = [0 : nx - 1])
            translate([ox + i * pitch_x + row_shift, oy + j * pitch_y, 0])
                _hex_prism(s, depth);
    }
}

// The solid X of a "hexagon_x" wall: two bars `w` wide running corner
// to corner, so both land on the panel's frame at each end. Subtracted
// from the lattice cutter rather than added to the panel, so the X is
// simply material the honeycomb does not get to eat.
module _x_brace(w) {
    for (a = [45, -45])
        translate([size / 2, size / 2, wall_thickness / 2])
            rotate([0, 0, a])
                cube([size * sqrt(2), w, wall_thickness + 4 * _eps],
                     center = true);
}

// One wall in the canonical pose: X=[0,size], Y=[0,size],
// Z=[0,wall_thickness]. `_walls()` rotates a copy onto each face.
module _panel(type) {
    assert(type == "solid" || type == "empty"
        || type == "hexagon" || type == "hexagon_x",
           str("scaffold-cube: unknown wall type \"", type, "\""));
    if (type == "solid") {
        cube([size, size, wall_thickness]);
    } else if (type == "hexagon" || type == "hexagon_x") {
        difference() {
            cube([size, size, wall_thickness]);
            difference() {
                intersection() {
                    translate([hex_frame, hex_frame, -_eps])
                        cube([size - 2 * hex_frame,
                              size - 2 * hex_frame,
                              wall_thickness + 2 * _eps]);
                    translate([0, 0, -_eps])
                        _hex_grid(size, size, wall_thickness + 2 * _eps,
                                  hex_size, hex_wall);
                }
                if (type == "hexagon_x") _x_brace(hex_frame);
            }
        }
    }
}

// Puts the children in face `i`'s pose, the faces ordered
// [bottom, top, front, back, left, right]. Both `_walls()` and
// `_joins()` place through this, so the six transforms live in one
// table and a wall and its pockets can never drift apart.
module _on_face(i) {
    t = wall_thickness;
    if (i == 0)      children();
    else if (i == 1) translate([0, 0, size - t])                       children();
    else if (i == 2) translate([0, t, 0])           rotate([90, 0, 0]) children();
    else if (i == 3) translate([0, size, 0])        rotate([90, 0, 0]) children();
    else if (i == 4) translate([0, 0, size])        rotate([0, 90, 0]) children();
    else             translate([size - t, 0, size]) rotate([0, 90, 0]) children();
}

// Which end of the canonical panel slab faces out of the block, per
// face: 0 = the Z=0 end, 1 = the Z=wall_thickness end. `_on_face()`
// flips three of the six, and a pocket has to open outward.
_FACE_OUTER = [0, 1, 1, 0, 0, 1];

// `types` is the six resolved wall types in `_on_face()` order.
module _walls(types) {
    for (i = [0 : 5]) _on_face(i) _panel(types[i]);
}

// One edge brace. `corner` is the cube vertex the edge starts from,
// `base` aims the extrusion down the edge axis, and `spin` rolls the
// prism about that same axis until both legs point into the cube.
module _brace(type, corner, base, spin) {
    assert(type == "none" || type == "triangle",
           str("scaffold-cube: unknown edge type \"", type, "\""));
    if (type == "triangle" && edge_leg > 0)
        translate(corner)
            rotate(spin)
                rotate(base)
                    linear_extrude(size)
                        polygon([[0, 0], [edge_leg, 0], [0, edge_leg]]);
}

// `edges` overrides every edge's type for this instance at once;
// undef leaves each edge on its own `edge_*` param.
module _braces(edges = undef) {
    s = size;
    e = edges;
    _brace(_edge(edge_vert_front_left, e),  [0, 0, 0], _BASE_Z, [0, 0, 0]);
    _brace(_edge(edge_vert_front_right, e), [s, 0, 0], _BASE_Z, [0, 0, 90]);
    _brace(_edge(edge_vert_back_right, e),  [s, s, 0], _BASE_Z, [0, 0, 180]);
    _brace(_edge(edge_vert_back_left, e),   [0, s, 0], _BASE_Z, [0, 0, 270]);

    _brace(_edge(edge_bottom_front, e), [0, 0, 0], _BASE_X, [0, 0, 0]);
    _brace(_edge(edge_bottom_back, e),  [0, s, 0], _BASE_X, [90, 0, 0]);
    _brace(_edge(edge_top_back, e),     [0, s, s], _BASE_X, [180, 0, 0]);
    _brace(_edge(edge_top_front, e),    [0, 0, s], _BASE_X, [270, 0, 0]);

    _brace(_edge(edge_bottom_left, e),  [0, 0, 0], _BASE_Y, [0, 0, 0]);
    _brace(_edge(edge_bottom_right, e), [s, 0, 0], _BASE_Y, [0, 270, 0]);
    _brace(_edge(edge_top_right, e),    [s, 0, s], _BASE_Y, [0, 180, 0]);
    _brace(_edge(edge_top_left, e),     [0, 0, s], _BASE_Y, [0, 90, 0]);
}

// A butterfly key seen face on: flared to `join_end` at both ends,
// pinched to `join_waist` at x=0. Laid out about the origin with its
// long axis on X, so a pocket centred on a seam puts the waist on the
// seam and one flare in each block.
function _bowtie_profile() = [
    [-join_len / 2,  join_end / 2],
    [            0,  join_waist / 2],
    [ join_len / 2,  join_end / 2],
    [ join_len / 2, -join_end / 2],
    [            0, -join_waist / 2],
    [-join_len / 2, -join_end / 2],
];

module _bowtie_prism(h) {
    linear_extrude(h) polygon(_bowtie_profile());
}

// The bowtie pockets of one wall, in the canonical panel pose.
// `outer` picks the side of the slab the pockets open on.
//
// Every pocket straddles a panel border, which is a cube edge — so the
// half that falls outside the block cuts nothing, and an abutting
// block's matching half completes the cavity. Pockets are cut from the
// finished block rather than from `_panel()`, because at a border the
// panel shares its space with the perpendicular wall and that wall's
// material would otherwise fill the pocket straight back in.
module _join_field(type, outer) {
    assert(type == "none" || type == "bowtie",
           str("scaffold-cube: unknown join type \"", type, "\""));
    if (type == "bowtie" && join_count > 0 && join_depth > 0) {
        z = (outer == 0) ? -_eps : wall_thickness - join_depth;
        h = join_depth + _eps;
        for (i = [0 : join_count - 1]) {
            p = size * (i + 0.5) / join_count;
            translate([0, p, z])    _bowtie_prism(h);
            translate([size, p, z]) _bowtie_prism(h);
            translate([p, 0, z])    rotate([0, 0, 90]) _bowtie_prism(h);
            translate([p, size, z]) rotate([0, 0, 90]) _bowtie_prism(h);
        }
    }
}

// `joins` overrides every wall's join type for this instance at once;
// undef leaves each on its own `join_*` param. A wall that is not
// there gets no pockets either way — there would be nothing to key to,
// and the cut would only gnaw at the walls and braces around it.
module _joins(types, joins = undef) {
    j = [join_bottom, join_top, join_front, join_back, join_left, join_right];
    for (i = [0 : 5])
        if (types[i] != "empty")
            _on_face(i) _join_field(is_undef(joins) ? j[i] : joins,
                                    _FACE_OUTER[i]);
}

// ── Public ─────────────────────────────────────────────────────────

// One 1U block, occupying X/Y/Z = [0, size].
//
// Each wall argument overrides that wall's type for this instance
// only; `edges` overrides all twelve edge types at once and `joins`
// all six join types; leave one undef to use the corresponding
// `wall_*` / `edge_*` / `join_*` param. That is how an assembly opens
// a face without disturbing the params the customizer shows, and it is
// the only supported way to vary a block by position.
module block(bottom = undef, top = undef, front = undef,
             back = undef, left = undef, right = undef,
             edges = undef, joins = undef) {
    types = [is_undef(bottom) ? wall_bottom : bottom,
             is_undef(top)    ? wall_top    : top,
             is_undef(front)  ? wall_front  : front,
             is_undef(back)   ? wall_back   : back,
             is_undef(left)   ? wall_left   : left,
             is_undef(right)  ? wall_right  : right];
    difference() {
        union() {
            _walls(types);
            _braces(edges);
        }
        _joins(types, joins);
    }
}

// The key that locks two abutting blocks together: one bowtie, printed
// flat, pushed into the pocket their two half-notches form at the
// seam. `join_clearance` comes off the key, never off the pocket.
module bowtie() {
    linear_extrude(join_depth - join_clearance)
        offset(delta = -join_clearance)
            polygon(_bowtie_profile());
}

// ── Assemblies ─────────────────────────────────────────────────────

// A `cols` x `rows` grid of fronts-open blocks standing in the XZ
// plane, one block deep. Blocks
// butt directly against each other, so a shared face is two walls
// thick — that is what you get from stacking separately printed
// blocks.
//
// `parity` picks one diagonal of the checkerboard (0 covers the
// bottom-left block, 1 its neighbours) so a multicolor preview can
// tint adjacent blocks differently and make the seams readable. Leave
// it undef for the whole grid.
module _grid_xz(cols, rows, parity) {
    for (col = [0 : cols - 1], row = [0 : rows - 1])
        if (is_undef(parity) || (col + row) % 2 == parity)
            translate([col * size, 0, row * size])
                block(front = "empty");
}

// A 3x3 stack standing on end: 3 blocks wide (X), 3 tall (Z), one
// deep (Y), every front face open.
module stack_3x3(parity = undef) {
    _grid_xz(3, 3, parity);
}

// The closet: a 5x5 wall of fronts-open blocks whose interior 3x3
// keeps nothing but its back wall. Those nine cells are already walled
// on every side by the ring around them, so dropping their own walls
// and braces merges them into one 3U x 3U hanging space closed off by
// a continuous back panel.
module closet(parity = undef) {
    cols = 5;
    rows = 5;
    for (col = [0 : cols - 1], row = [0 : rows - 1])
        if (is_undef(parity) || (col + row) % 2 == parity)
            translate([col * size, 0, row * size]) {
                if (col > 0 && col < cols - 1
                    && row > 0 && row < rows - 1)
                    block(bottom = "empty", top = "empty",
                          front = "empty", left = "empty",
                          right = "empty", edges = "none");
                else
                    block(front = "empty");
            }
}
