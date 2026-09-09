# split-tray-500

A 500 × 500 mm parts tray — **walls only, no base** — with 25 mm
thick bullnose outer walls, rounded on every accessible edge, split
into 2 × 2 quadrants so each part fits in a ~250 mm build volume
(Qidi Q2 class). Not customizable.

Renders as 4 quadrant STLs. No separate keys.

## Joint

**One joint type: a vertical sliding dovetail** at every wall-seam
crossing (4 total — front short wall, back tall wall, left tall
wall, right tall wall). Trapezoidal tongue on one quadrant, matching
blind pocket on the other. Narrow at the seam plane, wide at the tip
→ positive-retention capture against horizontal separation. Slight
horizontal clearance (`vdt_clr`) gives press-fit friction on the
vertical slide axis.

**Every quadrant is pressed straight down to seat and pulled straight
up to release.** No horizontal sliding, no drop-in keys.

## File layout

```
lib/
  split-tray-500-lib.scad     all params + geometry, no top-level render
parts/
  quadrant-fl.scad            quadrant(0, 0)  → quadrant-fl.stl
  quadrant-fr.scad            quadrant(1, 0)  → quadrant-fr.stl
  quadrant-bl.scad            quadrant(0, 1)  → quadrant-bl.stl
  quadrant-br.scad            quadrant(1, 1)  → quadrant-br.stl
previews/
  assembled.scad              tray()          → assembled.3mf (monolithic view)
```

## Corner bar cutouts

Full-height 20 × 20 mm square vertical channels at the front-right
(x = tray_x, y = 0) and rear-right (x = tray_x, y = tray_y) corners.
The tray drops down over pre-existing vertical bars at those positions.
`corner_cut = 20`. Only the FR and BR quadrants carry material at those
corners so only those STLs shrink; FL / BL are unaffected. `tray()` also
subtracts them so the preview matches the assembled printed geometry.

## Public modules

- **`quadrant(xi, yi)`** — one printable quadrant with vertical
  dovetail tongue and/or groove on its interior-facing seams.
- **`tray()`** — full monolithic reference shell (no split, no joints).

## Vertical dovetail geometry

- Trapezoid in the XY plane, extruded in Z:
  - narrow edge (`vdt_narrow = 6`) at the seam plane
  - wide edge (`vdt_wide = 10`) at `vdt_depth = 8` mm past the seam
  - extruded from Z = 0 up to Z = `vdt_height_short = 15` on the
    25 mm front wall, and up to `vdt_height_tall = 55` on the 75 mm
    back / left / right walls (more retention area on the tall walls)
- Groove is the same shape, expanded by `vdt_clr = 0.15` on every
  side. It extends from Z = −1 (cleanly punches through the wall
  bottom) up to Z = `height + vdt_clr + vdt_cap_h` where the top
  `vdt_cap_h = 6 mm` is a tent-shaped cap that tapers the pocket's
  Y-width to a line at the peak. That makes the pocket ceiling
  self-supporting (~40° overhang from vertical at the widest edge)
  so it prints without support material.
- Groove peak stays well below the wall top in every wall — the
  pocket is a blind, self-closing cavity with no visible opening
  from above.

## Ownership

| Seam / crossing | Tongue owner | Groove owner |
| --- | --- | --- |
| X=qx front-wall (short, 25 mm) | FL | FR |
| X=qx back-wall  (tall,  75 mm) | BL | BR |
| Y=qy left-wall  (tall,  75 mm) | FL | BL |
| Y=qy right-wall (tall,  75 mm) | FR | BR |

FL carries two tongues (front + left). BR carries two grooves
(back + right). FR and BL each carry one of each.

## Assembly order (all straight-down presses, no flipping)

1. Place FL on the bench.
2. Press FR straight down onto FL's right (front-wall) tongue.
3. Press BL straight down onto FL's back (left-wall) tongue.
4. Press BR straight down — its two grooves engage FR's back
   tongue and BL's right tongue simultaneously.

Removal is the reverse — pull each quadrant straight up.

## Editing rules

- Don't add a `BEGIN_PARAMS` block (not customizable).
- Don't add geometry to `parts/*.scad` — tunable dimensions live in
  the lib's top-level `=` bindings.
- Don't reintroduce a base, drop-in keys, or horizontal-slide joints
  — the whole point of this design is that every part is press-fit
  vertically. If the joint isn't strong enough, thicken the dovetail
  or lengthen `vdt_height`; don't add a second joint system.
- The tongue is anchored at its narrow base (at the seam plane) —
  keep `vdt_narrow` chunky enough for shear strength (≥ 5 mm).
- The tongue tip must fit inside the mating wall's cross-section.
  `vdt_wide / 2` plus its Y offset must stay inside
  `wall_thickness` — currently `vdt_wide = 10` in a 25 mm wall,
  centered → 7.5 mm of clearance on each side. Do not raise
  `vdt_wide` past ~20 without also thickening the wall.
- The tongue extends `vdt_depth` past the seam plane into the
  mating quadrant. Keep it well below `qx / 2` (or `qy / 2`) so
  it never intrudes into a non-neighbor quadrant's zone.
- The groove ceiling sits at `vdt_height + vdt_clr + vdt_cap_h`.
  Keep that below every wall's top (short front wall is the
  tightest constraint at 25 mm — currently 15 + 0.15 + 6 = 21.15
  mm, leaving ~3.85 mm of wall above the peak).
- If you raise `vdt_wide`, either raise `vdt_cap_h` in proportion
  (keep `vdt_cap_h ≥ vdt_wide / 2` for a self-supporting 45°
  overhang) or accept that the ceiling will need bridging /
  support material.
- If the joint binds, raise `vdt_clr` (the same value sizes every
  quadrant's groove — increase it and reprint the mates).
