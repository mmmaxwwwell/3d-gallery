# XYZ test cube

A 30 mm cube with the letters **X**, **Y**, and **Z** engraved on the +X, +Y, and +Z faces. Purpose:

- Sanity-check a fresh slicer/printer setup end-to-end.
- Verify coordinate system on a printer you just re-flashed or moved.
- Test print supports, first-layer adhesion, temperature calibration in one go.

## Orientation

- **X** — engraved on the face whose normal points along +X (the "right" face when looking at the printer from the front, on most Cartesian/CoreXY machines).
- **Y** — engraved on the face whose normal points along +Y (the "back" face).
- **Z** — engraved on the top face.

Print it as-is (no rotation) and the letter you see on top after printing should be **Z**. Peel it off, look at the two remaining upright faces: one should say **X** and one should say **Y**. If those don't line up with what your slicer showed in preview, your coordinate system is mismatched — one of the axes is flipped or the origin is in the wrong corner.

## Parameters

- `cube_size` (30 mm) — outer edge length.
- `letter_depth` (1.5 mm) — engraving depth. Deeper is more visible; shallower prints faster.
- `letter_size` (16 mm) — font size.
- `edge_chamfer` (0.8 mm) — softens the top+bottom edges. Set to `0` for a hard cube.

## Print notes

- Fits on any bed ≥ 40 mm. No supports needed at defaults.
- Fine for 0.2 or 0.28 layer height; for a sharper Z letter, try 0.12 or 0.16.
- Small enough (~20 min at 0.2 mm) that it's a fast diagnostic — good for iterating on start-gcode / temperature / adhesion.
