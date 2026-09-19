# Parametric Split Tray

A parts tray with rounded bullnose walls and vertical sliding
dovetail seams — customize the outer size, wall diameter, wall
height, base thickness, and grid split (2×2 or 3×3) in the
customizer, then re-render `piece.stl` once per cell you need to
print. Print flat side down, no supports.

At the 500 × 500 mm default, each piece is 250 × 250 mm — fits
inside a Qidi Q2-class ~250 mm build volume.

## Parameters

| Param            | Default | Meaning |
| ---------------- | ------- | ------- |
| `length`         | 500 mm  | Outer X. |
| `width`          | 500 mm  | Outer Y. |
| `wall_diameter`  | 25 mm   | Bullnose wall diameter — every visible edge radius is half of this. |
| `wall_height`    | 75 mm   | Back, left, right wall height. Front lip auto-caps at `min(25, wall_height)` for reach-in. |
| `base_thickness` | 0 mm    | Base plate thickness — 0 = open frame (walls only), > 0 adds a floor. |
| `split`          | 2       | 2 = 2×2 (4 pieces), 3 = 3×3 (8 pieces — the middle cell is empty for wall-only trays). |
| `piece_i`        | 0       | Cell index along X — which column to render. |
| `piece_j`        | 0       | Cell index along Y — which row to render. |

## How to use

1. Open the customizer and set `length`, `width`, `wall_diameter`,
   `wall_height`, `base_thickness`, `split` to your target
   dimensions.
2. For each cell you need to print, set `piece_i` and `piece_j`
   to the cell's grid coordinates, click **Generate**, and
   download the STL.
3. Repeat until you have every non-empty cell:
   - 2×2 → 4 downloads: `(0,0) (1,0) (0,1) (1,1)`
   - 3×3 → 8 downloads: every combination except the center
     `(1,1)` (which is empty unless `base_thickness > 0`).

The `assembled.3mf` preview shows the whole tray as one piece so
you can see the full frame before generating cells.

## Joint

Every wall seam is a **vertical sliding dovetail**:

- One piece carries a trapezoidal tongue — narrow at the seam
  plane, wide at the tip.
- The mating piece has a matching blind pocket (closed at the
  top by a tent-shaped self-supporting roof).
- The wide tip can't pass through the narrow opening → the joint
  has **positive retention** against horizontal separation.
- A small horizontal clearance (`vdt_clr = 0.15 mm`) gives
  **press-fit friction** on the vertical slide axis.

Every piece is **pressed straight DOWN to seat and pulled
straight UP to release**. No horizontal sliding, no drop-in keys,
no flipping.

When `base_thickness > 0`, the groove punches a small slot
through the mate's base plate so the tongue can enter from below
during assembly. Base plates butt at the seams — the walls above
them hold everything in place.

## Ownership (2×2)

| Seam / crossing | Tongue on | Groove on |
| --- | --- | --- |
| X=qx, front wall (short) | FL `(0,0)` | FR `(1,0)` |
| X=qx, back  wall (tall)  | BL `(0,1)` | BR `(1,1)` |
| Y=qy, left  wall (tall)  | FL `(0,0)` | BL `(0,1)` |
| Y=qy, right wall (tall)  | FR `(1,0)` | BR `(1,1)` |

FL carries two tongues. BR carries two grooves. FR and BL each
carry one of each.

For 3×3, the same rule holds at every interior seam — the tongue
lives on the -side cell.

## Assembly (2×2)

All straight-down presses:

1. Place `(0,0)` on the bench.
2. Press `(1,0)` straight down onto its front-wall tongue.
3. Press `(0,1)` straight down onto its left-wall tongue.
4. Press `(1,1)` straight down — its two grooves engage both
   neighbors' tongues simultaneously.

Disassembly is the reverse — pull each piece straight up.

## Print notes

- Flat side down, no supports.
- Recommended: 4 perimeters, 20 % infill, 0.2 mm layers.
- Each 500 mm quadrant is ~400–500 g of filament and ~6–10 h to
  print. Smaller / thinner trays scale down.
- The groove's tent-shaped roof self-supports (~40° overhang from
  vertical) so the pocket prints upright with no support material.
- If the joint binds during assembly, raise `vdt_clr` in the lib
  and reprint the mating pair. If it rattles, lower `vdt_clr`.

## Assembled dimensions (defaults)

- Footprint: 500 × 500 mm
- Wall height: 75 mm back / left / right; 25 mm front lip
- No base — open frame (unless `base_thickness > 0`)
- Vertical dovetail: 15 mm tall on the front lip, 55 mm on the
  tall walls, plus a 6 mm tent cap above the groove
