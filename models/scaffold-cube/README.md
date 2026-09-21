# Scaffold Cube (1U)

The base unit of a printed building-block system: a 200 mm cube — the largest square that fits a Flashforge Adventurer 5M bed, so **1U = 200 mm**.

One block is described by 18 independent type choices:

- **6 walls**, one per cube face — `solid`, `empty`, `hexagon`, or `hexagon_x`.
- **12 edges**, one per cube edge — `none` or `triangle`.

Everything else (thickness, lattice pitch, brace size) is shared across the whole block. Mixing the 18 types gives an open frame, a closed box, an open-top tray, a chimney, a corner piece, or anything in between — all from the one generator.

Blocks are then arranged into **assemblies**. Each assembly is a preview you can select in the gallery; the printable part is always the same 1U block.

## Coordinate system

A block sits in the positive octant, `X/Y/Z = [0, size]`, and never leaves it. Walls are flush with the outer surface and braces point inward, so the bounding box is exactly `size³` no matter which types you pick — which is what lets units stack and abut face to face.

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

## Defaults

Solid floor, five hex walls — the four sides plus the top — and a `triangle` brace on all twelve edges. A closed, fully-braced box.

That is not the support-free configuration. The hex top breaks the ceiling into short spans over the cells, but the solid `hex_frame` border around that lattice is still a `size`-long bridge. Set `wall_top = "empty"` if you want a block that prints upright with no support.

## Assemblies

| Assembly       | Blocks | Envelope (mm)     | What it is                                                       |
|----------------|--------|-------------------|-------------------------------------------------------------------|
| 1U, single     | 1      | 200 × 200 × 200   | One block on its own — the base unit                               |
| 3×3 stack      | 9      | 600 × 200 × 600   | 3 wide × 3 tall × 1 deep, standing on end, every front face open   |
| Closet         | 25     | 1000 × 200 × 1000 | 5 wide × 5 tall × 1 deep; the interior 3×3 is bare back panels     |

The 3×3 stack is a cubby wall: nine blocks with their fronts opened, butted directly together. A shared face ends up two walls thick — that is simply what you get from stacking nine separately printed blocks, and it is drawn that way rather than pretending interior walls merge. The preview tints neighbouring blocks in two colours so the seams are readable; it is a display device, not a two-filament print.

**Closet** takes that idea to 5×5 and then hollows the middle out. The sixteen perimeter blocks are ordinary fronts-open cubbies; the nine interior blocks keep nothing but their back wall. Every wall those nine would have carried is already supplied by the ring around them, so dropping their own walls and braces merges the middle into one 600 × 600 mm hanging space closed off by a continuous back panel — cubbies around the edge, open wardrobe in the centre.

To build the 3×3 stack, print **nine blocks with `wall_front = "empty"`**. The closet wants sixteen of those plus **nine back-only blocks** — every `wall_*` set to `empty` except `wall_back`, and `edge_leg = 0` so no brace is left hanging off a wall that is not there. Same part throughout; only customizer settings differ.

## Printing

A full 1U block is 200 mm on a side, which fills an Adventurer 5M bed corner to corner — check your slicer's real usable area before committing.

Two overhang rules govern which combinations print upright without support:

- **Any closed `wall_top` bridges.** `solid` is one 200 mm span. `hexagon` (the default) reduces the ceiling to short spans over the hex cells, but the `hex_frame` border ringing that lattice is still a full 200 mm bridge. Print the default with support, or set `wall_top = "empty"`.
- **Top edge braces are free when the wall below them exists.** The brace's hypotenuse is a 45° slope, which prints unsupported — but only if the vertical wall it leans on is there to build from. The four top braces default to `triangle` and the four side walls they lean on default to `hexagon`, so they carry themselves.

Where the honeycomb is clipped — at the `hex_frame` border, and along the X on a `hexagon_x` wall — partly-cut cells leave wedges of material that taper to a point at the cut. They are anchored to the border at their base, so they are cosmetic rather than structural; a slicer drops the sub-nozzle tips. Raising `hex_wall` or nudging `hex_size` shifts where the cells land and shortens them.
