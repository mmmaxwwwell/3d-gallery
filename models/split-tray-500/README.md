# 500 mm Split Tray (Qidi Q2)

A 500 × 500 mm parts tray with a 10 mm base and 25 mm thick outer walls,
rounded on every visible edge. Back, left, and right walls are 75 mm
tall. The **whole front side (500 mm across) drops to 25 mm** for easy
reach-in, corners short too, with rounded transitions everywhere.

Splits into four 250 × 250 mm quadrants that each fit inside a ~250 mm
build volume (Qidi Q2 class). Each seam has three joints:

- A **base sliding dovetail** running most of the seam length at
  Z = 1–4 mm (buried inside the 10 mm base) — the pieces engage as
  they slide together.
- **Two base bowtie keys per seam** dropped in from **above** through
  slots in the tray floor — locks the sliding axis (8 keys total).
- A **wall bowtie key per wall-seam crossing** — every wall carries a
  bowtie-shaped vertical channel where a seam crosses it; the two
  wall halves each hold half of the channel, and a taller bowtie key
  dropped from the top of the wall locks the halves against pulling
  apart (4 keys total).

No flipping — do the whole thing right-side up.

## Parts

| File | What / how many |
| --- | --- |
| `quadrant-fl.stl` | Front-left quadrant (×1) |
| `quadrant-fr.stl` | Front-right quadrant (×1) |
| `quadrant-bl.stl` | Back-left quadrant (×1) |
| `quadrant-br.stl` | Back-right quadrant (×1) |
| `bowtie-key.stl` | Base bowtie key — **print 8** (5 mm tall) |
| `wall-bowtie-key.stl` | Wall bowtie key — **print 4** (20 mm tall) |

Quadrants print base-down, no supports. Both key types share the
same bowtie footprint (30 × 14 mm); only the extruded height differs.
Batch all 12 keys on one plate.

## Assembly (no flipping)

```
     top view

           +---- back wall 75 mm ----+
           |                         |
           |    BL       |    BR     |
      75mm |             |           | 75mm
     left  |-------------+-----------|  right
           |             |           |
           |    FL       |    FR     |
           |                         |
           +--- front lip 25 mm -----+
             (whole front side, corners short too)
```

Each pair-join is **slide, then tack** — done right-side up.

1. **Front pair.** Set FL on the bench. Slide FR onto FL along −Y.
   The base sliding dovetail engages. Drop **2 base bowties** into
   the two floor slots along the FL–FR seam, and **1 wall bowtie**
   into the pocket at the top of the front wall where the seam
   crosses it.
2. **Back pair.** Same idea: slide BR onto BL along −Y. Drop **2
   base bowties** into the BL–BR floor slots, and **1 wall bowtie**
   into the pocket at the top of the back wall.
3. **Join the pairs.** Position the front pair on the bench. Bring
   the back pair up with its front edge aligned on the front pair's
   back edge, shifted +X off the right end. Slide the back pair in
   −X across the front pair (both Y = qy base dovetails engage).
   Drop **4 base bowties** into the four Y = qy floor slots and **2
   wall bowties** into the pockets at the tops of the left and right
   walls.

The tray is now a rigid 500 × 500 mm assembly.

To disassemble: lift each of the 12 keys out of its slot (fingernail
or a probe), then slide the joints apart in reverse.

## Print notes

- Base-down, no supports.
- Recommended for quadrants: 4 perimeters, 20 % infill, 0.2 mm layers.
  Each quadrant is substantial — plan ~6–10 h and ~400–500 g of
  filament per part.
- Bowtie keys: 3 perimeters, 30 % infill.
- If a sliding dovetail is tight, reduce `dt_clr` in the lib and
  reprint. If a bowtie key is loose, reduce `key_clr`.
- The wall bowtie pocket is visible as a small bowtie-shaped opening
  at the top of each seam-crossing wall — the key drops in flush.

## Assembled dimensions

- Footprint: 500 × 500 mm
- Height: 85 mm on the back, left, and right; 35 mm across the front
- Interior floor: ~425 × 425 mm of flat usable area
- Base Z-zoning: 0–1 solid, 1–4 dovetail band, 4–5 solid bridge,
  5–10 base-bowtie pocket (opens at the tray floor).
- Wall bowtie pocket: 20 mm deep from the top of each seam-crossing
  wall (Z = 15–35 in the front wall, Z = 65–85 in the tall walls).
