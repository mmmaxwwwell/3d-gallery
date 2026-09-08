# split-tray-500

A 500 × 500 mm tray with a 10 mm base and 25 mm thick outer walls,
rounded on every accessible edge, split into 2 × 2 quadrants so each
part fits in a ~250 mm build volume (Qidi Q2 class). Not customizable.
Renders as four quadrant STLs plus one bowtie-key STL (print 12).

Two independent joint systems in one design:
- **Sliding dovetail** (lengthwise) — pieces held together as they're
  slid into place.
- **Bowtie / dovetail keys** (perpendicular, inserted from below) —
  lock the assembly after all four quadrants are joined and flipped.

## File layout

```
lib/
  split-tray-500-lib.scad    all params + geometry, no top-level render
parts/
  quadrant-fl.scad           quadrant(0, 0) → quadrant-fl.stl
  quadrant-fr.scad           quadrant(1, 0) → quadrant-fr.stl
  quadrant-bl.scad           quadrant(0, 1) → quadrant-bl.stl
  quadrant-br.scad           quadrant(1, 1) → quadrant-br.stl
  bowtie-key.scad            bowtie_key()   → bowtie-key.stl (print 12)
```

## Public modules

- **`quadrant(xi, yi)`** — one tray corner in world coords. Union of
  all four reproduces the full tray.
- **`bowtie_key()`** — one printable dovetail key. 12 needed per tray.

Internal helpers (leading `_`): `_full_shell`, `_clipped_shell`,
`_outer_envelope`, `_interior_cavity`, `_front_cut`,
`_bowtie_polygon`, `_dovetail_tongues`, `_dovetail_grooves`,
`_tongue_x_seam`, `_groove_x_seam`, `_tongue_y_seam`, `_groove_y_seam`,
`_bowtie_slot`, `_bowtie_slot_cavities`, `_bowtie_slots_on_x_seam`,
`_bowtie_slots_on_y_seam`.

## Geometry — "rounded on every edge"

Same shell approach as before: BOSL2 `cuboid(..., rounding=edge_r, ...)`
composed as outer envelope minus interior cavity minus front cut.
All edges rounded to r = wall_thickness / 2 = 12.5 mm except the four
exterior bottom edges (kept sharp so the tray sits flat on the bed).

Front-cut edges rounded: `BOT+BACK` (interior lip fillet),
`BOT+LEFT`/`BOT+RIGHT` (fillets where short-front top blends into
tall-side exterior), `BACK+LEFT`/`BACK+RIGHT` (rounded vertical
corners softening the step at (X = 0 or 500, Y = 25)).

**Whole front side is 25 mm tall**, corners included. Left/right
walls do not extend to Y = 0 as tall columns — the front cut removes
material above Z = 35 across the full X extent.

## Joint system A — sliding dovetail (lengthwise)

Each internal seam has a continuous dovetail tongue-and-groove
running the full seam length minus `dt_end_clr = 30 mm` at each end.
Cross-section is a trapezoid, **wider at the bottom** (`dt_bot_w = 8`)
narrowing to the top (`dt_top_w = 4`), 3 mm tall (Z = 6 → 9 mm inside
the 10 mm base).

Ownership (male tongue vs. female groove):

| Piece | X = qx seam | Y = qy seam |
| --- | --- | --- |
| FL (0,0) | tongue right (front half) | tongue back (left half) |
| FR (1,0) | groove left (front half)  | tongue back (right half) |
| BL (0,1) | tongue right (back half)  | groove front (left half) |
| BR (1,1) | groove left (back half)   | groove front (right half) |

Grooves extend the FULL Y (or X) range of the mating quadrant (open
at both ends), so the tongue can slide in from either direction during
assembly without collision.

The wider-at-bottom dovetail cross-section locks against Z-lift (the
tongue's wide base is trapped under the mating piece's material at
Z = 9 → 10 mm). It does NOT lock lateral pull-apart — that's what the
bowtie keys are for.

Modules `_tongue_*_seam` and `_groove_*_seam` are built as
`hull()` of two thin (0.001 mm) slabs at Z = dt_z_bot and Z = dt_z_top
to get the sloped trapezoidal sides.

## Joint system B — bowtie keys (inserted from below)

Every seam segment (250 mm long) hosts `n_keys = 3` bowtie slots at
`i / (n_keys + 1)` fractions. Each slot is a bowtie-shaped hole cut
from Z = 0 up to `key_depth = 5 mm`, leaving 1 mm of solid base
between the top of the slot (Z = 5) and the bottom of the dovetail
band (Z = 6), then 1 mm of solid base at the very top (Z = 9 → 10)
as a bridge to the interior floor. **The two joint systems never
overlap in Z.**

The bowtie polygon has its LONG AXIS PERPENDICULAR TO THE SEAM (this
is different from a naïve orientation). Placed at (qx, y_c) with
`rot = 0` for X = qx seams: long axis along X, waist at X = qx
crossing the seam, wide flare ends at X = qx ± 15 mm captured in FL
and FR. Placed at (x_c, qy) with `rot = 90` for Y = qy seams.

Key dimensions:
- `key_len   = 30` (perpendicular to seam)
- `key_flare = 14` (parallel to seam, at wide ends)
- `key_waist = 6`  (parallel to seam, at middle — crosses the seam)
- `key_depth = 5`  (Z; slot is `key_depth + 0.1` for clean subtraction)

A single `bowtie_key()` STL prints all 12 keys — the user rotates the
key 90° in hand when going from an X = qx seam to a Y = qy seam.

## Assembly order (important — the dovetails are sliding)

1. Sub-assemble front pair: FR slides onto FL along −Y (X = qx
   dovetail engages).
2. Sub-assemble back pair: BR slides onto BL along −Y (X = qx
   dovetail engages).
3. Slide the back pair in −X across the front pair's back edge; both
   Y = qy dovetails engage in one motion.
4. Flip upside down. Push 12 bowtie keys up into their slots.
5. Flip right-side up.

## Editing rules

- Don't add a `BEGIN_PARAMS` block (not customizable).
- Don't add geometry to `parts/*.scad` — tunable dimensions live in
  the lib's top-level `=` bindings.
- **`dt_z_bot`/`dt_z_top` and `key_depth` must not overlap in Z.**
  Currently: bowtie slot Z = [0, 5], dovetail band Z = [6, 9], with
  1 mm gaps on both sides. If you increase `key_depth`, decrease
  `dt_z_bot` in lockstep to keep them separated.
- The `hull()` construction for the dovetail rails uses 0.001 mm thin
  slabs — don't inflate that or the shape breaks.
- `dt_end_clr = 30` is larger than `wall_thickness = 25` on purpose,
  so the dovetail tongue starts past the outer front wall and doesn't
  punch through it. If you narrow the walls, adjust `dt_end_clr` too.
- The bowtie polygon's LONG AXIS IS PERPENDICULAR TO THE SEAM. If you
  swap the `rot` values in `_bowtie_slots_on_*_seam` back to the
  "wrong" orientation (long axis parallel to seam), the bowtie no
  longer crosses the seam and won't lock anything. Don't do that.
- If a bowtie key fits too loose, reprint keys only with a smaller
  `key_clr` in the lib. Quadrants don't need re-rendering — the slot
  is sized from the same `key_clr` but with tolerance built in.
