# 500 mm Split Tray (Qidi Q2)

A 500 × 500 mm parts tray — **walls only, no base** — with 25 mm
thick outer walls rounded on every visible edge. Back, left, and
right walls are 75 mm tall. The **whole front side (500 mm across)
drops to 25 mm** for easy reach-in, corners short too, with rounded
transitions everywhere.

Splits into four 250 × 250 mm quadrants that each fit inside a
~250 mm build volume (Qidi Q2 class). Every wall-seam crossing is
a **vertical sliding dovetail**:

- One quadrant carries a trapezoidal tongue on the seam face — narrow
  at the seam plane, wide at the tip.
- The mating quadrant has a matching blind pocket (closed at the top,
  open at the bottom of the wall).
- The wide tip can't pass through the narrow opening → the joint has
  **positive retention** against horizontal separation.
- A small horizontal clearance gives **press-fit friction** on the
  vertical slide axis.

Every quadrant is **pressed straight DOWN** to seat and **pulled
straight UP** to release. No horizontal sliding, no drop-in keys,
no flipping.

## Parts

| File | What / how many |
| --- | --- |
| `quadrant-fl.stl` | Front-left quadrant (×1) |
| `quadrant-fr.stl` | Front-right quadrant (×1) |
| `quadrant-bl.stl` | Back-left quadrant (×1) |
| `quadrant-br.stl` | Back-right quadrant (×1) |

Print flat side down (each quadrant's outer footprint is flat).
No supports.

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

Ownership (T = tongue owner, G = groove owner):

| Seam / crossing | Tongue on | Groove on |
| --- | --- | --- |
| X=qx, front wall (short) | FL | FR |
| X=qx, back  wall (tall)  | BL | BR |
| Y=qy, left  wall (tall)  | FL | BL |
| Y=qy, right wall (tall)  | FR | BR |

FL carries two tongues. BR carries two grooves. FR and BL each
carry one of each.

Assembly order (all straight-down presses):

1. Place **FL** on the bench.
2. Lift **FR** above the front-wall tongue on FL, align its left
   groove above FL's right tongue, press straight down until FR's
   bottom sits on the bench.
3. Lift **BL** above the left-wall tongue on FL, align its front
   groove above FL's back tongue, press straight down.
4. Lift **BR** and press it straight down onto both BL's right
   tongue and FR's back tongue simultaneously.

The tray is now a rigid 500 × 500 mm open frame.

To disassemble: pull each quadrant straight up in reverse order.
No horizontal wiggle needed (or possible).

## Print notes

- Flat side down, no supports.
- Recommended: 4 perimeters, 20 % infill, 0.2 mm layers. Each
  quadrant is substantial — plan ~6–10 h and ~400–500 g of filament
  per part.
- If the joint binds during assembly, raise `vdt_clr` in the lib
  and reprint the mating pair.
- If the joint rattles, lower `vdt_clr` and reprint.
- The groove has a tent-shaped roof at its top so the pocket
  ceiling is self-supporting — prints upright with no support.
- The interior wall-to-ground fillet is a 12.5 mm concave bead
  around the inside base of every wall (helps bed adhesion and
  gives the tray a clean interior).

## Assembled dimensions

- Footprint: 500 × 500 mm
- Wall height: 75 mm on the back, left, and right; 25 mm across the front
- No base — the tray is an open frame; it drops onto whatever
  surface (or pre-existing corner bars on the +X side) is underneath.
- Vertical dovetail: 15 mm tall on the short front wall, 55 mm on
  the tall back / left / right walls, plus a 6 mm tent cap above
  the groove for printability.
