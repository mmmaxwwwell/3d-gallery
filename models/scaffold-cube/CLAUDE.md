# scaffold-cube

The 1U cube of a printed building-block system, plus the assemblies built from it. One printable part, 18 type params (6 walls + 12 edges) on top of 6 dimension params. Fully customizable via the WASM customizer.

Currently `devOnly: true` in `models/manifest.json` — it renders in `npm run dev` but is never built, mirrored, published, or fingerprinted. Drop the flag to ship it, and only then seed a baseline.

## File layout

```
lib/
  scaffold-cube-lib.scad    all params + geometry modules, no top-level render
parts/
  block.scad                include + $fn + block()   → block.stl
previews/
  unit-1u.scad              one block                 → unit-1u.3mf
  stack-3x3.scad            nine blocks, fronts open  → stack-3x3.3mf
  closet.scad               5x5, interior 3x3 backs   → closet.3mf
```

**One part, many assemblies.** `block.stl` is the only thing anyone prints; every assembly is a preview showing how N of it go together. Adding an assembly means a lib module + a preview file + a manifest preview entry + a `CUSTOMIZABLE_SOURCES` key — never a new part.

## Coordinate system

Positive octant, `X/Y/Z = [0, size]`. X: left→right. Y: front→back. Z: bottom→top. **A block's bounding box is exactly `size³` for every combination of types** — walls are flush with the outer surface, braces point inward. Blocks are meant to stack and abut, so nothing may ever poke outside that envelope. Any new wall or edge type has to respect it; assemblies rely on it to place blocks at plain `size` multiples with no fudge factor.

## Public modules

- **`block(bottom, top, front, back, left, right, edges)`** — one 1U block. Each wall argument is an optional per-instance override of that wall's type, and `edges` overrides all twelve edge types at once; `undef` (the default) falls through to the corresponding `wall_*` / `edge_*` param. **This is the only supported way to vary a block by position** — never override a `wall_*` or `edge_*` param in a preview file to do it, or the customizer's dropdown for that param silently stops working on that preview.
- **`stack_3x3(parity)`** — the 3×3 assembly: 3 wide (X), 3 tall (Z), one deep, every front open.
- **`closet(parity)`** — the closet: a 5×5 grid of fronts-open blocks whose interior 3×3 carries nothing but `wall_back`. It owns its loop rather than calling `_grid_xz()`, because the interior/perimeter split is per-cell. Keep it that way — don't parameterise `_grid_xz()` (or `stack_3x3`) into serving both.

Both take `parity` (0 or 1) to select one diagonal of the checkerboard so the multicolor preview can tint neighbouring blocks differently; `undef` gives the whole grid.

Internal helpers (leading underscore — not stable API):

- **`_walls(bottom, top, front, back, left, right)`** — places one `_panel()` per face. Takes the six resolved types; does not read the globals itself.
- **`_panel(type)`** — one wall in the canonical pose `X=[0,size], Y=[0,size], Z=[0,wall_thickness]`. All six faces come from this same module; `_walls()` rotates a copy onto each.
- **`_x_brace(w)`** — the diagonal X of a `hexagon_x` wall.
- **`_braces(edges)`** / **`_brace(type, corner, base, spin)`** — the edge braces. `_braces()` reads the twelve `edge_*` globals and resolves each through `_edge()`, so a non-undef `edges` replaces the lot. That blanket form is all any assembly has needed; if one ever wants a single named edge overridden, add it the same shape as the wall overrides.
- **`_grid_xz(cols, rows, parity)`** — a `cols`×`rows` grid of fronts-open blocks standing in the XZ plane, one deep; `stack_3x3` is just a call to it. A new assembly whose cells are all alike is a named module calling this, not a re-implemented loop.
- **`_hex_grid(...)` / `_hex_prism(...)`** — the honeycomb cutter.

## How the 6 walls are placed

`_panel()` builds every wall lying flat in the canonical pose, and `_walls()` applies one rigid transform per face:

| Face     | Transform                                    |
|----------|----------------------------------------------|
| bottom   | identity                                     |
| top      | `translate([0,0,size-t])`                    |
| front    | `translate([0,t,0]) rotate([90,0,0])`        |
| back     | `translate([0,size,0]) rotate([90,0,0])`     |
| left     | `translate([0,0,size]) rotate([0,90,0])`     |
| right    | `translate([size-t,0,size]) rotate([0,90,0])`|

Add a wall type by adding a branch to `_panel()` and an option to all six `// [solid, empty, hexagon, hexagon_x]` inline comments. Nothing in `_walls()` changes.

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

## Assemblies

An assembly is a lib module that instances `block()` at `size` multiples, plus a thin preview file holding the top-level `color()` calls. Blocks butt directly together — no gap, no dedup of the shared faces. That is deliberate: the preview shows N separately printed blocks stacked, which is what you actually build.

Adding one means a lib module + `previews/<name>.scad` + a manifest preview entry (`"module"` = the lib module) + a `CUSTOMIZABLE_SOURCES["scaffold-cube"].previews` key — never a new part.

An assembly may drop walls its neighbours already provide — the closet's interior 3×3 keeps only `wall_back`. Pass `edges = "none"` along with the empty walls when you do, or the block's braces are left floating off walls that no longer exist.

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
- **Don't** add a part per assembly. There is one printable part; assemblies are previews of it.
- **Do** keep `_panel()` the single source of wall geometry and the `_braces()` table the single source of edge placement. A type is a branch, never a new placement path.
- When adding a type, update the inline `// [...]` enum on **every** affected param — the customizer builds its dropdowns from those comments, one param at a time, and will silently offer a stale list otherwise.
