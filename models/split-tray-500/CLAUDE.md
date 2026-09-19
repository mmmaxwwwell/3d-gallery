# split-tray-500

A parametric parts tray — bullnose walls forming an open (or
based) frame — split into an N×N grid so each piece fits in a
small build volume (Qidi Q2 class at the 500 × 500 mm default).
Fully customizable via the WASM customizer.

The only printable output is `piece.stl` — a single parametric
cell. Users pick which cell of the grid to render by setting
`piece_i` / `piece_j` in the customizer, then re-generate for
each piece they need to print.

## Parameters (BEGIN_PARAMS)

| Param            | Default | Notes |
| ---------------- | ------- | ----- |
| `length`         | 500     | Outer X (mm). |
| `width`          | 500     | Outer Y (mm). |
| `wall_diameter`  | 25      | Bullnose wall cross-section diameter (mm). Edge radius = half. |
| `wall_height`    | 75      | Back / left / right wall height (mm). Front lip auto-caps at `min(25, wall_height)`. |
| `base_thickness` | 0       | Base plate thickness (mm). `0` = open frame. When > 0 grooves punch through the base at seams so tongues enter from below. |
| `split`          | 2       | `[2, 3]` — 2×2 (4 pieces) or 3×3 (8 pieces; center cell is empty). |
| `piece_i`        | 0       | `[0, 1, 2]` — cell index along X for the piece() module. |
| `piece_j`        | 0       | `[0, 1, 2]` — cell index along Y for the piece() module. |

The dovetail cross-section (`vdt_narrow`, `vdt_wide`, `vdt_depth`)
and cap height (`vdt_cap_h`) scale off `wall_diameter` so the
joint stays proportional. Dovetail vertical extent is derived from
the corresponding wall height minus cap + a few mm of headroom.

## Joint

**One joint type: a vertical sliding dovetail** at every wall-seam
crossing. Trapezoidal tongue on one piece, matching blind pocket
on the mate. Narrow at the seam plane, wide at the tip → positive
retention against horizontal separation. Slight horizontal
clearance (`vdt_clr`) gives press-fit friction on the vertical
slide axis.

Every piece is **pressed straight DOWN to seat and pulled straight
UP to release**. No horizontal sliding, no drop-in keys.

For an **N×N split**, seam crossings at each interior seam line:

- Front wall (yi=0) X-seams at `x=k*qx`, k=1..N-1.
- Back wall (yi=N-1) X-seams.
- Left wall (xi=0) Y-seams at `y=k*qy`.
- Right wall (xi=N-1) Y-seams.

Total: `4*(N-1)` joints — 4 for 2×2, 8 for 3×3.

**Ownership rule** (generalized): tongue on the -side cell, groove
on the +side cell for each seam. So cell `(xi, yi)` owns:

- Front-wall tongue at `x=(xi+1)*qx` if `yi=0` and `xi<N-1`.
- Front-wall groove at `x=xi*qx` if `yi=0` and `xi>0`.
- (Analogous for back / left / right walls.)

## Base plate

When `base_thickness > 0`, a `length × width × base_thickness`
slab sits at Z=0..base_thickness with the walls stacked on top.
Grooves extrude from Z=-1 all the way through the base into the
wall, so during assembly the tongue enters cell B via a small slot
punched through B's base at the seam.

Base pieces butt at the seams (no interlock). The walls above them
are dovetailed together, so the base plates are held in position
by the wall assembly.

## File layout

```
lib/
  split-tray-500-lib.scad     all params + geometry, no top-level render
parts/
  piece.scad                  → piece() → cell(piece_i, piece_j)
previews/
  assembled.scad              → tray()  → assembled.3mf (monolithic view)
```

## Public modules

- **`cell(xi, yi)`** — one printable cell of the current grid.
  Renders empty if the cell has no wall material and no base
  (i.e. interior cells of a 3×3 with `base_thickness=0`).
- **`piece()`** — thin no-arg wrapper around `cell(piece_i, piece_j)`
  so the customizer can render an arbitrary cell without needing
  one manifest entry per (i, j).
- **`tray()`** — monolithic reference shell (no split, no joints).

## Corner bar cutouts

Full-height 20 × 20 mm square vertical channels at the FR corner
(x = length, y = 0) and BR corner (x = length, y = width). The
tray drops down over pre-existing vertical bars at those positions.
Only cells that own the +X-edge material carry those cutouts.

## Ownership table (2×2 default)

| Seam / crossing | Tongue owner | Groove owner |
| --- | --- | --- |
| X=qx front-wall (short) | FL (0,0) | FR (1,0) |
| X=qx back-wall  (tall)  | BL (0,1) | BR (1,1) |
| Y=qy left-wall  (tall)  | FL (0,0) | BL (0,1) |
| Y=qy right-wall (tall)  | FR (1,0) | BR (1,1) |

FL carries two tongues, BR two grooves, FR and BL one of each.

## Assembly order (2×2, all straight-down presses)

1. Place FL `(0,0)` on the bench.
2. Press FR `(1,0)` straight down onto FL's front-wall tongue.
3. Press BL `(0,1)` straight down onto FL's left-wall tongue.
4. Press BR `(1,1)` straight down — its two grooves engage FR's
   back tongue and BL's right tongue simultaneously.

For 3×3, the analogous rule holds — build up from the -X, -Y
corner cell outward, with each newly placed cell engaging one or
two tongues on already-placed neighbors.

## Editing rules

- The `BEGIN_PARAMS` block is the customizer's contract. Add new
  params inside it (with `//` help comments above each one);
  computed / derived values live below the block.
- `parts/piece.scad` is a three-line thin wrapper — don't put
  geometry in it; edit the lib.
- Don't reintroduce drop-in keys or horizontal-slide joints — the
  whole point is that every piece is press-fit vertically.
- The tongue tip must fit inside the mating wall's cross-section.
  `vdt_wide/2` plus its offset must stay inside `wall_thickness`.
  With the scaled defaults (`vdt_wide = 0.4 * wall_diameter`),
  the tongue never bumps against the wall's outer face.
- Groove peak sits at `base_thickness + vdt_height + vdt_clr + vdt_cap_h`.
  Keep it below the top of the wall it lives in. `vdt_height_short`
  and `vdt_height_tall` are derived from wall height minus cap +
  headroom, so this constraint is preserved automatically down to
  reasonably tiny walls.
- If the joint binds, raise `vdt_clr` and reprint the mates.
