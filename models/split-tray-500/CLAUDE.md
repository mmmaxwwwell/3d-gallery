# split-tray-500

A 500 × 500 mm tray with a 10 mm base and 25 mm thick outer walls,
rounded on every accessible edge, split into 2 × 2 quadrants so each
part fits in a ~250 mm build volume (Qidi Q2 class). Not customizable.

Renders as 4 quadrant STLs + 2 key STLs (short base key ×8, tall wall
key ×4).

Three joints per seam:
- **Base sliding dovetail** at Z = 1-4 running most of the seam length.
- **Two base bowties per seam segment**, dropped in from ABOVE through
  slots in the tray floor (Z = 5-10, opens at Z = 10 / tray floor).
- **One wall bowtie key per wall-seam crossing** — the two mating
  wall halves each carry half of a bowtie-shaped vertical channel;
  the key drops in from the top of the wall (Z-down) and locks the
  halves against pulling apart. No sliding-dovetail in the walls
  (the earlier attempt required a visible through-slot in the wall
  face — this pocket design is cleaner and only exposes a small
  bowtie hole at the very top of each seam-crossing wall).

## File layout

```
lib/
  split-tray-500-lib.scad     all params + geometry, no top-level render
parts/
  quadrant-fl.scad            quadrant(0, 0)     → quadrant-fl.stl
  quadrant-fr.scad            quadrant(1, 0)     → quadrant-fr.stl
  quadrant-bl.scad            quadrant(0, 1)     → quadrant-bl.stl
  quadrant-br.scad            quadrant(1, 1)     → quadrant-br.stl
  bowtie-key.scad             bowtie_key()       → bowtie-key.stl (print 8)
  wall-bowtie-key.scad        wall_bowtie_key()  → wall-bowtie-key.stl (print 4)
previews/
  assembled.scad              tray()             → assembled.3mf (monolithic view)
```

## Corner bar cutouts

Full-height 20 × 20 mm square vertical channels at the front-right
(x = tray_x, y = 0) and rear-right (x = tray_x, y = tray_y) corners.
The tray drops down over pre-existing vertical bars at those positions.
`corner_cut = 20`. Only the FR and BR quadrants carry material at those
corners so only those STLs shrink; FL / BL are unaffected. `tray()` also
subtracts them so the preview matches the assembled printed geometry.

## Public modules

- **`quadrant(xi, yi)`** — one tray corner in world coords.
- **`bowtie_key()`** — 5 mm-tall bowtie key for the base slots.
- **`wall_bowtie_key()`** — 20 mm-tall bowtie key for the wall pockets.
- **`tray()`** — full monolithic reference shell (no split, no joints).

Both keys use the same bowtie polygon (`key_len = 30`, `key_flare = 14`,
`key_waist = 6`); only the extrusion height differs (`key_depth = 5` vs
`wall_key_depth = 20`).

## Joint A — base sliding dovetail (Z = 1-4)

Trapezoidal tongue-and-groove in the XZ (or YZ) plane, wider at the
bottom (`dt_bot_w = 8`) narrowing to the top (`dt_top_w = 4`). Runs
along the seam for `qy - 2*dt_end_clr = 190 mm`, sliding in from the
far end. Ownership unchanged from the original design:

| Piece | X = qx seam | Y = qy seam |
| --- | --- | --- |
| FL (0,0) | tongue right (front half) | tongue back (left half) |
| FR (1,0) | groove left (front half)  | tongue back (right half) |
| BL (0,1) | tongue right (back half)  | groove front (left half) |
| BR (1,1) | groove left (back half)   | groove front (right half) |

Grooves extend the FULL Y (or X) range of the mating quadrant so
sliding from either direction never collides.

## Joint B — base bowties (Z = 5-10, open at top)

`n_keys = 2` slots per 250 mm seam segment. Each slot is a bowtie-
shaped cavity cut into the top of the base from Z = 5 up to Z = 10
(tray floor). Key drops in from above and sits flush with the floor.
Long axis of the polygon is PERPENDICULAR TO THE SEAM (waist crosses
the seam, flare captured in adjacent quadrants). `rot = 0` for X = qx
seams, `rot = 90` for Y = qy seams.

## Joint C — wall bowtie pockets (top of every seam-crossing wall)

At each of the 4 wall-seam crossings, a bowtie-shaped cavity is
subtracted from the shell centered on the seam plane, spanning
`wall_key_depth = 20 mm` downward from the top of that wall:

| Wall (crosses seam) | (x_c, y_c) | z_top | rot |
| --- | --- | --- | --- |
| Front (X = qx, short) | (qx, wall_thickness/2) | 35 | 0 |
| Back  (X = qx, tall)  | (qx, tray_y − wall_thickness/2) | 85 | 0 |
| Left  (Y = qy, tall)  | (wall_thickness/2, qy) | 85 | 90 |
| Right (Y = qy, tall)  | (tray_x − wall_thickness/2, qy) | 85 | 90 |

Every quadrant subtracts the two pockets on its shared seams
(`_wall_bowtie_pockets(xi, yi)` handles both). Both sides of the
seam get the identical pocket cut, so the two halves align into a
full pocket when the pieces are joined.

The polygon is placed at `wall_thickness/2` in the direction across
the wall thickness, and `key_flare = 14 mm` fits inside the 25 mm
wall thickness (7 mm clearance to each face). Long axis is aligned
with the wall's length (perpendicular to the seam) so the waist
crosses the seam and the flares are captured in the two quadrants.

## Z-zoning inside the base

```
Z = 0..1    solid bottom
Z = 1..4    base dovetail band
Z = 4..5    solid bridge
Z = 5..10   base-bowtie pocket (open at the top / tray floor)
```

No overlap between the two base joint systems in Z. If you change
`dt_z_bot`/`dt_z_top` or `key_depth`, keep the 1 mm bridges intact.

## Assembly order (no flipping)

1. FR slides onto FL along −Y. Drop 2 base bowties into the FL–FR
   floor slots and 1 wall bowtie into the front-wall top pocket.
2. BR slides onto BL along −Y. Drop 2 base bowties into the BL–BR
   floor slots and 1 wall bowtie into the back-wall top pocket.
3. Back pair slides in −X onto front pair. Drop 4 base bowties into
   the four Y = qy floor slots and 2 wall bowties into the left- and
   right-wall top pockets.

## Editing rules

- Don't add a `BEGIN_PARAMS` block (not customizable).
- Don't add geometry to `parts/*.scad` — tunable dimensions live in
  the lib's top-level `=` bindings.
- **Z-zoning in the base must not overlap.** Currently:
  base-bowtie pocket [5, 10], solid bridge [4, 5], dovetail [1, 4],
  solid bottom [0, 1]. If you enlarge one, shrink another.
- The base bowtie and wall bowtie share `key_len`, `key_flare`,
  `key_waist`, `key_clr`. If you change any of those, both key STLs
  need to be reprinted.
- The wall pocket extrudes `wall_key_depth = 20 mm` down from each
  wall's top face. For the tall walls (top at Z = 85) the pocket
  bottom is at Z = 65 — well above the base and below the top. For
  the short front wall (top at Z = 35) the pocket bottom is at Z = 15
  — 5 mm above the tray floor at Z = 10. Do not increase
  `wall_key_depth` past 25 mm without also raising the short-wall
  height or shifting the pocket to a taller wall only, otherwise the
  front-wall pocket will punch into the base and collide with the
  base dovetail / bowtie zoning.
- The bowtie polygon's LONG AXIS IS PERPENDICULAR TO THE SEAM. This
  applies to BOTH the base bowties (rot = 0 for X = qx seams,
  rot = 90 for Y = qy) AND the wall bowties (same rot values). If
  you swap them, the bowtie no longer crosses the seam and won't
  lock anything.
- If a bowtie key fits too loose, reprint keys only with a smaller
  `key_clr`. Quadrants don't need re-rendering — the slot / pocket
  is sized from the same `key_clr`.
