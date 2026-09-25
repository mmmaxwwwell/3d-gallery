# Scaffold Cube (1U)

The base unit of a printed building-block system: a 200 mm cube — the largest square that fits a Flashforge Adventurer 5M bed, so **1U = 200 mm**.

One block is described by 24 independent type choices:

- **6 walls**, one per cube face — `solid`, `empty`, `hexagon`, or `hexagon_x`.
- **12 edges**, one per cube edge — `none` or `triangle`.
- **6 joins**, one per cube face — `none` or `bowtie`.

Everything else (thickness, lattice pitch, brace size, key size) is shared across the whole block. Mixing the 24 types gives an open frame, a closed box, an open-top tray, a chimney, a corner piece, or anything in between — all from the one generator.

Blocks are then arranged into **assemblies** and pinned to each other with **bowtie keys**. Each assembly is a preview you can select in the gallery; the printable parts are the 1U block and the key.

## Coordinate system

A block sits in the positive octant, `X/Y/Z = [0, size]`, and never leaves it. Walls are flush with the outer surface, braces point inward, and join pockets are cut inward, so the bounding box is exactly `size³` no matter which types you pick — which is what lets units stack and abut face to face.

That is also why blocks are pinned with a loose key instead of a moulded-in peg: a peg would stick out past `size` and every stack would have to allow for it.

| Axis | 0 end  | `size` end |
|------|--------|------------|
| X    | left   | right      |
| Y    | front  | back       |
| Z    | bottom | top        |

## Parameters

| Param            | Meaning                                                        | Default |
|------------------|----------------------------------------------------------------|---------|
| `size`           | Outer edge length (mm). 1U = 200                               | 200     |
| `wall_thickness` | Thickness of every wall panel (mm)                             | 8       |
| `hex_frame`      | Solid border around a lattice wall, and the width of the X (mm)| 25      |
| `hex_size`       | Flat-to-flat width of one hex cell (mm)                        | 15      |
| `hex_wall`       | Material between neighbouring hex cells (mm)                   | 3       |
| `edge_leg`       | Leg length of a `triangle` brace (mm); 0 suppresses all braces | 25      |
| `join_len`       | Length of a bowtie key across the seam (mm)                    | 36      |
| `join_end`       | Width of a bowtie key at its flared ends (mm)                  | 18      |
| `join_waist`     | Width of a bowtie key at its waist (mm)                        | 9       |
| `join_depth`     | Depth a pocket is sunk below the wall's outer face (mm)        | 5       |
| `join_clearance` | Gap between key and pocket, per side (mm)                      | 0.2     |
| `join_count`     | Bowtie pockets per `size`-long span of seam                    | 3       |

### Wall types

| Type        | Result                                                                                 |
|-------------|-----------------------------------------------------------------------------------------|
| `solid`     | Full `size × size × wall_thickness` panel                                                |
| `empty`     | Nothing — the face is open                                                               |
| `hexagon`   | Panel with a honeycomb cut through it, keeping a solid `hex_frame` border                |
| `hexagon_x` | Same, plus a solid X `hex_frame` wide running corner to corner across the lattice        |

Wall params: `wall_bottom`, `wall_top`, `wall_front`, `wall_back`, `wall_left`, `wall_right`.

`hexagon_x` shares `hex_frame` for the X's width for now — both ends of each diagonal land on the border, so one width keeps them flush. If the X ever wants to be thicker or thinner than the border, it gets its own param.

### Edge types

| Type       | Result                                                                                      |
|------------|---------------------------------------------------------------------------------------------|
| `none`     | Bare edge                                                                                    |
| `triangle` | Prism running the full edge; cross-section is a right triangle with both legs `edge_leg` long |

The triangle's right angle sits on the cube edge and each leg runs inward along one of the two walls meeting there, so the hypotenuse cuts the corner at 45°.

Edge params, named for the two walls they join:

- Vertical (along Z): `edge_vert_front_left`, `edge_vert_front_right`, `edge_vert_back_left`, `edge_vert_back_right`
- Bottom (on the Z=0 face): `edge_bottom_front`, `edge_bottom_back`, `edge_bottom_left`, `edge_bottom_right`
- Top (on the Z=size face): `edge_top_front`, `edge_top_back`, `edge_top_left`, `edge_top_right`

### Join types

| Type     | Result                                                                          |
|----------|---------------------------------------------------------------------------------|
| `none`   | Plain face                                                                        |
| `bowtie` | Half-pockets for bowtie keys, `join_count` along each of the face's four borders  |

Join params: `join_bottom`, `join_top`, `join_front`, `join_back`, `join_left`, `join_right`.

A face set to `empty` never gets pockets, whatever its join param says — there would be nothing to key to.

## Linking blocks edge to edge

Two blocks side by side share a straight seam on each of the four faces they have in common. Every pocket is centred on a face border, so **each block carries half a bowtie and its neighbour carries the other half**; butt them together and the halves make one full bowtie-shaped cavity. Drop a printed key in and its two flares sit in different blocks, so the pair can no longer be pulled apart across the seam. Open the joint even 2 mm and the key jams — that is the dovetail doing its work.

Keys go in from the outside once the blocks are in place, three per 200 mm of seam, and they prise back out again, so a wall can be keyed after it is built and taken apart afterwards.

Only faces you can still reach are worth keying. On a flat grid like the 3×3 stack that is the exposed back, and three keys per seam tie the whole panel into one piece — **36 keys for the 3×3 stack, 120 for the closet**. The perimeter faces around the outside of a grid stay exposed too, if you want more stiffness than that.

Pockets wrap around a cube corner, because the two faces meeting there place theirs at the same three positions. That costs nothing: a pocket on one face only ever keys a neighbour in the direction that buries the other face, so at most one of the two is ever both needed and reachable.

Sizing rules, if you move off the defaults:

- Keep `join_len` at or under `2 × hex_frame` (50 mm as shipped), or a pocket breaks out of a lattice wall's solid rim into the honeycomb.
- Keep `join_depth` under `wall_thickness`, or the pocket loses the floor the key seats on.
- Keep `(join_len + join_end) / 2` under `size / (2 × join_count)` — 27 mm against 33.3 mm as shipped — or the pockets on a face's perpendicular borders run into each other at its corners.
- `join_clearance` comes off the key and never off the pocket, so a loose key still lets two blocks meet flush. Raise it if the keys bind, lower it if they rattle.

## Defaults

Solid floor, five hex walls — the four sides plus the top — a `triangle` brace on all twelve edges, and `bowtie` pockets on all six faces. A closed, fully-braced, fully-keyed box.

That is not the support-free configuration. The hex top breaks the ceiling into short spans over the cells, but the solid `hex_frame` border around that lattice is still a `size`-long bridge. Set `wall_top = "empty"` if you want a block that prints upright with no support.

## Assemblies

| Assembly       | Blocks | Keys | Envelope (mm)     | What it is                                                       |
|----------------|--------|------|-------------------|-------------------------------------------------------------------|
| 1U, single     | 1      | 0    | 200 × 200 × 200   | One block on its own — the base unit                               |
| 3×3 stack      | 9      | 36   | 600 × 200 × 600   | 3 wide × 3 tall × 1 deep, standing on end, every front face open   |
| Closet         | 25     | 120  | 1000 × 200 × 1000 | 5 wide × 5 tall × 1 deep; the interior 3×3 is bare back panels     |

The 3×3 stack is a cubby wall: nine blocks with their fronts opened, butted directly together. A shared face ends up two walls thick — that is simply what you get from stacking nine separately printed blocks, and it is drawn that way rather than pretending interior walls merge. The preview tints neighbouring blocks in two colours so the seams are readable; it is a display device, not a two-filament print.

**Closet** takes that idea to 5×5 and then hollows the middle out. The sixteen perimeter blocks are ordinary fronts-open cubbies; the nine interior blocks keep nothing but their back wall. Every wall those nine would have carried is already supplied by the ring around them, so dropping their own walls and braces merges the middle into one 600 × 600 mm hanging space closed off by a continuous back panel — cubbies around the edge, open wardrobe in the centre.

To build the 3×3 stack, print **nine blocks with `wall_front = "empty"`** and **36 bowtie keys**. The closet wants sixteen of those blocks plus **nine back-only blocks** — every `wall_*` set to `empty` except `wall_back`, and `edge_leg = 0` so no brace is left hanging off a wall that is not there — and **120 keys**. Same two parts throughout; only customizer settings differ.

## Printing

A full 1U block is 200 mm on a side, which fills an Adventurer 5M bed corner to corner — check your slicer's real usable area before committing.

Two overhang rules govern which combinations print upright without support:

- **Any closed `wall_top` bridges.** `solid` is one 200 mm span. `hexagon` (the default) reduces the ceiling to short spans over the hex cells, but the `hex_frame` border ringing that lattice is still a full 200 mm bridge. Print the default with support, or set `wall_top = "empty"`.
- **Top edge braces are free when the wall below them exists.** The brace's hypotenuse is a 45° slope, which prints unsupported — but only if the vertical wall it leans on is there to build from. The four top braces default to `triangle` and the four side walls they lean on default to `hexagon`, so they carry themselves.

Keys print flat on the bed, `join_depth - join_clearance` tall, with no overhangs and no support. They are small and fast, so run off a few spares — a key is the cheapest thing here to lose. The pockets are shallow cuts in an outer face and add no overhang of their own.

Where the honeycomb is clipped — at the `hex_frame` border, and along the X on a `hexagon_x` wall — partly-cut cells leave wedges of material that taper to a point at the cut. They are anchored to the border at their base, so they are cosmetic rather than structural; a slicer drops the sub-nozzle tips. Raising `hex_wall` or nudging `hex_size` shifts where the cells land and shortens them.
