# 500 mm Split Tray (Qidi Q2)

A 500 × 500 mm parts tray with a 10 mm base and 25 mm thick outer walls,
rounded on every visible edge. Back, left, and right walls are 75 mm
tall. The **whole front side (500 mm across) drops to 25 mm** for easy
reach-in, corners short too, with rounded transitions everywhere.

Splits into four 250 × 250 mm quadrants that each fit inside a ~250 mm
build volume (Qidi Q2 class), held together by two independent joint
systems:

- A **full-length sliding dovetail** in every seam holds the pieces
  together lengthwise as they're slid into position.
- **Twelve bowtie / dovetail keys** (3 per seam × 4 seams) inserted
  from underneath after the tray is assembled and flipped lock the
  seams laterally and prevent back-sliding.

## Parts

| File | What / how many |
| --- | --- |
| `quadrant-fl.stl` | Front-left quadrant (×1) |
| `quadrant-fr.stl` | Front-right quadrant (×1) |
| `quadrant-bl.stl` | Back-left quadrant (×1) |
| `quadrant-br.stl` | Back-right quadrant (×1) |
| `bowtie-key.stl` | Bowtie / dovetail key — **print 12** |

Quadrants print base-down, no supports. Bowtie keys are small
(≈30 × 14 × 5 mm); batch all 12 on one plate.

## Assembly

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

1. **Sub-assemble the front pair.** Set FL on the bench. Slide FR onto
   FL along −Y (FR approaches from behind at Y > qy, sliding forward).
   The full-length dovetail tongue on FL's right edge enters the groove
   on FR's left edge and locks the two pieces together lengthwise.
2. **Sub-assemble the back pair.** Same idea: BR slides onto BL along
   −Y.
3. **Join the pairs.** Place the front pair on the bench in position.
   Bring the back pair up with its front edge lined up on the front
   pair's back edge, shifted +X off the right end. Slide the back pair
   in −X across the front pair's back tongues; both 250 mm Y = qy
   dovetails engage in one motion. The tray is now assembled flat but
   not yet locked laterally — it will hold shape from friction but
   can be pulled apart by force.
4. **Flip the assembly upside down** and push **twelve bowtie keys**
   up into the slots on the bottom of the base (3 slots visible per
   seam, 4 seams). Each key's narrow waist crosses one seam, and the
   two wide flare ends land in the adjacent quadrants — the seam is
   now mechanically locked. Push keys in with your thumb until flush
   with the bottom of the base.
5. **Flip right-side up.** The tray is now a single rigid 500 × 500 mm
   assembly.

To disassemble (e.g., for flat storage): flip upside down, push each
of the 12 keys back out (a rod through the small gap above the key
works), then slide the pairs apart in the reverse of the assembly.

## Print notes

- Base-down, no supports.
- Recommended: 4 perimeters, 20 % infill, 0.2 mm layers. Each quadrant
  is substantial — plan ~6–10 h and ~400–500 g of filament per part.
- Bowtie keys print fast; 3 perimeters, 30 % infill is plenty.
- If the sliding dovetail is tight, reduce `dt_clr` in the lib and
  reprint. If bowtie keys are loose, reduce `key_clr`.
- The interior wall-to-floor fillet is 12.5 mm — very smooth; no
  bridging or supports needed.

## Assembled dimensions

- Footprint: 500 × 500 mm
- Height: 85 mm on the back, left, and right; 35 mm across the front
- Interior floor: ~425 × 425 mm of flat usable area
- Base: 10 mm thick everywhere, so the bowtie slots (5 mm deep) have
  the dovetail band above them (Z = 6 → 9 mm) with a 1 mm bridge to
  the interior floor and no overlap between the two joint systems
