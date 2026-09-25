# scaffold-cube

The 1U cube of a printed building-block system, plus the assemblies built from it. Two printable parts, 24 type params (6 walls + 12 edges + 6 joins) on top of 12 dimension params. Fully customizable via the WASM customizer.

Currently `devOnly: true` in `models/manifest.json` — it renders in `npm run dev` but is never built, mirrored, published, or fingerprinted. Drop the flag to ship it, and only then seed a baseline.

## File layout

```
lib/
  scaffold-cube-lib.scad    all params + geometry modules, no top-level render
parts/
  block.scad                include + $fn + block()   → block.stl
  bowtie.scad               include + $fn + bowtie()  → bowtie.stl
previews/
  unit-1u.scad              one block                 → unit-1u.3mf
  stack-3x3.scad            nine blocks, fronts open  → stack-3x3.3mf
  closet.scad               5x5, interior 3x3 backs   → closet.3mf
```

**One block, many assemblies.** `block.stl` is the only *cube* anyone prints; every assembly is a preview showing how N of it go together. Adding an assembly means a lib module + a preview file + a manifest preview entry + a `CUSTOMIZABLE_SOURCES` key — never a new part.

`bowtie.stl` is the one exception to "one part": it is not an assembly, it is the loose key that ties two blocks together, and it has no place inside `block()` because it is a separate piece of filament. Anything else that joins blocks belongs with it — a second cube-shaped part does not.

## Coordinate system

Positive octant, `X/Y/Z = [0, size]`. X: left→right. Y: front→back. Z: bottom→top. **A block's bounding box is exactly `size³` for every combination of types** — walls are flush with the outer surface, braces point inward, joins are cut inward. Blocks are meant to stack and abut, so nothing may ever poke outside that envelope. Any new wall, edge, or join type has to respect it; assemblies rely on it to place blocks at plain `size` multiples with no fudge factor.

That envelope is also why the blocks are keyed with a loose bowtie rather than an integral peg: a peg would have to stick out past `size`, and every assembly and every stacking assumption would have to grow a fudge factor to match.

## Public modules

- **`block(bottom, top, front, back, left, right, edges, joins)`** — one 1U block. Each wall argument is an optional per-instance override of that wall's type; `edges` overrides all twelve edge types at once and `joins` all six join types; `undef` (the default) falls through to the corresponding `wall_*` / `edge_*` / `join_*` param. **This is the only supported way to vary a block by position** — never override a `wall_*`, `edge_*`, or `join_*` param in a preview file to do it, or the customizer's dropdown for that param silently stops working on that preview.
- **`bowtie()`** — the loose key, printed flat, that locks two abutting blocks together across a seam. Lives in the XY plane about the origin, long axis on X, extruded `join_depth - join_clearance` along +Z.
- **`stack_3x3(parity)`** — the 3×3 assembly: 3 wide (X), 3 tall (Z), one deep, every front open.
- **`closet(parity)`** — the closet: a 5×5 grid of fronts-open blocks whose interior 3×3 carries nothing but `wall_back`. It owns its loop rather than calling `_grid_xz()`, because the interior/perimeter split is per-cell. Keep it that way — don't parameterise `_grid_xz()` (or `stack_3x3`) into serving both.

Both take `parity` (0 or 1) to select one diagonal of the checkerboard so the multicolor preview can tint neighbouring blocks differently; `undef` gives the whole grid.

Internal helpers (leading underscore — not stable API):

- **`_on_face(i)`** — puts its children in face `i`'s pose, faces ordered `[bottom, top, front, back, left, right]`. `_walls()` and `_joins()` both place through it, so the six transforms exist once and a wall can never drift away from its own pockets. `_FACE_OUTER` sits beside it and records, per face, which end of the canonical slab points out of the block.
- **`_walls(types)`** — places one `_panel()` per face. Takes the six resolved types as a vector in `_on_face()` order; does not read the globals itself.
- **`_panel(type)`** — one wall in the canonical pose `X=[0,size], Y=[0,size], Z=[0,wall_thickness]`. All six faces come from this same module; `_walls()` rotates a copy onto each.
- **`_x_brace(w)`** — the diagonal X of a `hexagon_x` wall.
- **`_braces(edges)`** / **`_brace(type, corner, base, spin)`** — the edge braces. `_braces()` reads the twelve `edge_*` globals and resolves each through `_edge()`, so a non-undef `edges` replaces the lot. That blanket form is all any assembly has needed; if one ever wants a single named edge overridden, add it the same shape as the wall overrides.
- **`_joins(types, joins)`** / **`_join_field(type, outer)`** / **`_bowtie_prism(h)`** / **`_bowtie_profile()`** — the bowtie pockets. `_joins()` reads the six `join_*` globals, so a non-undef `joins` replaces the lot, and it skips any face whose wall is `"empty"`. `_bowtie_profile()` is the single source of the key's outline: the pocket extrudes it as-is, `bowtie()` extrudes it inset by `join_clearance`.
- **`_grid_xz(cols, rows, parity)`** — a `cols`×`rows` grid of fronts-open blocks standing in the XZ plane, one deep; `stack_3x3` is just a call to it. A new assembly whose cells are all alike is a named module calling this, not a re-implemented loop.
- **`_hex_grid(...)` / `_hex_prism(...)`** — the honeycomb cutter.

## How the 6 walls are placed

`_panel()` builds every wall lying flat in the canonical pose, and `_on_face()` applies one rigid transform per face:

| Face     | Transform                                    |
|----------|----------------------------------------------|
| bottom   | identity                                     |
| top      | `translate([0,0,size-t])`                    |
| front    | `translate([0,t,0]) rotate([90,0,0])`        |
| back     | `translate([0,size,0]) rotate([90,0,0])`     |
| left     | `translate([0,0,size]) rotate([0,90,0])`     |
| right    | `translate([size-t,0,size]) rotate([0,90,0])`|

Add a wall type by adding a branch to `_panel()` and an option to all six `// [solid, empty, hexagon, hexagon_x]` inline comments. Nothing in `_walls()` or `_on_face()` changes.

This table is also what places the join pockets, so it now has two callers. Changing a row moves a wall *and* its pockets together, which is the point — a pocket that no longer sits on its wall's border keys nothing.

`hexagon` and `hexagon_x` share one branch. The lattice cutter is `intersection(window, hex_grid)`, and `hexagon_x` simply subtracts `_x_brace()` from that cutter — the X is material the honeycomb does not get to eat, not material added back. Building it as an addition instead would leave a seam where the bar meets the frame.

The X uses `hex_frame` as its width so both ends land flush on the border. If it ever needs its own width, give it a param rather than decoupling the two by arithmetic.

## How the 12 edges are placed

`_brace()` extrudes a right-triangle polygon `[[0,0],[leg,0],[0,leg]]` along local +Z — right angle at the local origin, legs on local +X and +Y. Placement is `translate(corner) rotate(spin) rotate(base)`:

- **`base`** aims the extrusion down one cube axis. The three constants are exact axis permutations, verified by rendering each brace alone and checking its bounding box:
  - `_BASE_X = [90,0,90]` — extrude +X, legs on +Y / +Z
  - `_BASE_Y = [0,-90,-90]` — extrude +Y, legs on +Z / +X
  - `_BASE_Z = [0,0,0]` — extrude +Z, legs on +X / +Y
- **`spin`** is a multiple of 90° **about that same world axis**, which is why it can be applied after `base` without disturbing the extrusion direction. It rolls the prism until both legs point into the cube.
- **`corner`** is the cube vertex the edge starts from.

Don't reorder `rotate(spin) rotate(base)` — `spin` is defined in world space and only commutes with `base` in this order.

Add an edge type by adding a branch to `_brace()` and an option to all twelve `// [none, triangle]` inline comments. The corner/base/spin table in `_braces()` doesn't change.

## How the joins are placed

A bowtie key is a butterfly inlay: wide at both ends, pinched at the waist. Sink the waist into the seam between two blocks and the two flares — one in each block — stop the pair pulling apart. `_join_field()` centres a pocket on each of its panel's four borders, `join_count` of them per border, at `size * (i + 0.5) / join_count` along it. A panel border *is* a cube edge, so:

- The half of the pocket that falls outside the block cuts nothing, and the abutting block's matching half completes the cavity. Blocks are identical and identically oriented, so the two halves always line up — **any change to the position formula has to stay a function of `size` alone**, or two blocks stop agreeing on where the pocket is.
- **Pockets are cut from the finished block, not from inside `_panel()`.** At a border a panel shares its space with the perpendicular wall and with an edge brace; cut inside `_panel()` and that other material fills the pocket straight back in, leaving nowhere for the key. Hence the `difference()` wrapping the `union()` in `block()`.

`_FACE_OUTER` decides which side of the slab the pocket opens on, because `_on_face()` flips three of the six panels. Get it wrong and the pocket opens into the block's interior where no key can reach it.

**The two faces at a cube edge never fight**, even though their pockets land at the same positions and merge into one cavity wrapping the corner. Take the front face's `X=0` border and the left face's `Y=0` border. The front pocket keys a −X neighbour, and the front face is only reachable when there is no −Y neighbour. The left pocket keys a −Y neighbour, and is only reachable when there is no −X neighbour. Those conditions are mutually exclusive — whenever one key is usable the other is both unnecessary and buried. This is what buys the simple symmetric position formula; a scheme that staggered the faces apart would need three phases (three faces meet pairwise at every corner) and would crowd `join_len` down to nothing.

Two geometric budgets bound the dimension params:

- `join_len / 2 <= hex_frame` — half a pocket reaches that far in from the border, and past `hex_frame` it breaks out of a lattice wall's solid rim into the honeycomb.
- `(join_len + join_end) / 2 < size / (2 * join_count)` — the clearance between a face's own perpendicular borders. At the defaults that is `27 < 33.3`.

`join_depth < wall_thickness` keeps a floor under the key. `join_clearance` comes off the key via `offset(delta = -join_clearance)` and never off the pocket, so the fit can be tuned without two blocks stopping short of flush.

Add a join type by adding a branch to `_join_field()` and an option to all six `// [none, bowtie]` inline comments. The border loop doesn't change.

## Assemblies

An assembly is a lib module that instances `block()` at `size` multiples, plus a thin preview file holding the top-level `color()` calls. Blocks butt directly together — no gap, no dedup of the shared faces. That is deliberate: the preview shows N separately printed blocks stacked, which is what you actually build.

Adding one means a lib module + `previews/<name>.scad` + a manifest preview entry (`"module"` = the lib module) + a `CUSTOMIZABLE_SOURCES["scaffold-cube"].previews` key — never a new part.

An assembly may drop walls its neighbours already provide — the closet's interior 3×3 keeps only `wall_back`. Pass `edges = "none"` along with the empty walls when you do, or the block's braces are left floating off walls that no longer exist. The joins need no such care: `_joins()` already skips any face whose wall is `"empty"`, because a pocket there would key nothing and would only gnaw at the walls and braces around it.

The multicolor split is by checkerboard parity, not by row or column, so every block differs in colour from all four of its neighbours. Coincident faces between blocks have opposing normals, so the two colour groups don't z-fight.

**Preview colour calls must be top-level text in `previews/*.scad`** — the CLI 3MF builder finds the palette by regex over the preview source, so a `color()` buried in a lib module is invisible to it. Keep the previews as `color(...) module();` one-liners.

## Overhang rules baked into the defaults

The default block is closed and braced on all twelve edges, so it wants support on the top face. Two facts govern any change here:

- A `solid`, `hexagon`, or `hexagon_x` `wall_top` bridges. `hexagon` — the default — breaks the ceiling into short spans over the hex cells, but the `hex_frame` border ringing that lattice is still a `size`-long bridge. `empty` is the only support-free top.
- A top edge brace is self-supporting — its hypotenuse is a 45° slope — **but only if the vertical wall it leans on exists**. All four top edges default to `triangle`, and the four side walls they lean on default to `hexagon`, so they build off real material.

Hex through-holes are only `wall_thickness` long, so they bridge cleanly in any orientation.

## Editing rules

- **Don't** redefine any param in consumers — the lib owns them. `parts/block.scad` stays three lines, and previews stay `color()` calls.
- **Don't** let geometry escape `[0,size]³` per block. Braces go inward, walls stay flush.
- **Don't** hardcode a wall thickness or a leg length anywhere but the param block.
- **Don't** add a part per assembly. There are two printable parts — the block and the key — and assemblies are previews of them.
- **Don't** make a pocket position depend on anything but `size` and `join_count`. Two abutting blocks agree on where the cavity is only because both compute it the same way from constants they share.
- **Do** keep `_panel()` the single source of wall geometry, the `_braces()` table the single source of edge placement, `_on_face()` the single source of the six face poses, and `_bowtie_profile()` the single source of the key's outline. A type is a branch, never a new placement path.
- When adding a type, update the inline `// [...]` enum on **every** affected param — the customizer builds its dropdowns from those comments, one param at a time, and will silently offer a stale list otherwise.
