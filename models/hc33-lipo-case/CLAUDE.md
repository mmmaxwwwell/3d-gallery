# hc33-lipo-case

Case for a Heltec HT-HC33, a Heltec WiFi LoRa 32 V4, a 103665 LiPo, a USB-C TP4056 board and two SMA bulkheads. devOnly, unprinted.

## The user's brief (2026-10-21)

- "a 3d printed case for a 103665 battery, a heltec ht-hc33, two sma antenna mounts on top, and a 4056 charger".
- "It also has a held tick v4 in it" (voice dictation: a Heltec V4).
- "everything stacked like a stack of credit cards vertically with the antennas at the top on the two opposite corners and the usb ports on the bottom".
- "can we turn the charging circuit so it comes out the side? can we hae a smooth rounded profile when we look at it from the top? add grip indexing like 15cm indents alternating the corners". I read 15cm as 15 mm: the case is 82.5 tall.
- "i want one of the sides to be a a hinge like a door style so that we can open the side up and have easy access to add or remove anything we need". This replaced the sleeve and top cap.

## My picks (not the user's)

- **"Opposite corners" = diagonal**: front-left and back-right of the top.
- **Stack order**, back to front: TP4056, cell, HC33, V4. No window for the V4's screen.
- **The door is the left wall, hinged along its bottom edge.** A vertical hinge would put knuckles in the top-view outline, and its pivot can't sit at a 10 mm corner's centre without the door sweeping through the cavity's corner. The bottom edge keeps the outline smooth. The hinge axis is `hinge_r` in from the outer face and the bottom (`hinge`), and `hinge_r` is half the door's thickness, so the knuckles stay out of the cavity (asserted).
- **Knuckles**: even ones are the body's, odd ones the door's (`body_knuckle()`).
  - The body's knuckle is the knuckle plus a square down to the bottom, with a 45° chord on top toward the cavity, since the body prints with that side up.
  - Each piece is cut round the other's knuckles, `hinge_clear` wide. The door's cut is a teardrop peaked toward the cavity, the way the door prints.
  - The outer bottom edge of every knuckle is a 45° chamfer (`knuckle_2d()`).
- **Slots**:
  - The right wall's rails have floors and roofs: boards slide in sideways at their final height.
  - The door's ribs have roofs only. Checked by swinging the door: a floor would rise into the PCB's corner as the door opens.
  - The door's ribs are clamped to the cavity in Y (`door_rib()`), so the outermost ones don't hit the body's back and front walls.
- **Outline** (`outline()`): a hull of four `profile_r` circles plus points where 45° tangents from them meet the left and right faces (`lead_y`). The body prints on its right face and the door on its outer face, so those faces' corners are the ones that need the 45° lead-in.
- **Grip scoops** are on the front and back faces at the corners, not on the corners' diagonals. As the body prints on its side, a concave scoop on a corner's diagonal faces down past 45°. On the front and back faces their walls stay within 45° (scoop radius 8, depth 1.5: 36°).
- **Walls**: `side_wall` 6 (set by the hinge), `end_wall` 4 (the corners keep 2 mm, asserted).
- **Not sealed.** If the user wants it waterproof, read [[seal-screws-through-tpu-failed]] in memory first.

## Frame

Origin at the cavity's centre in plan, z = 0 on the bottom face. X across (door at -X), Y through the stack (+Y front), Z up. Layer positions (`tp_y`, `cell_y`, `hc_y`, `v4_y`) run from the back wall's inner face; `yb` shifts them onto the origin. `boards` holds the HC33 and V4 as `[width, PCB back face, PCB thickness, length, USB overhang, USB centre]`. The TP4056 lies along X (`tp_x0`..`tp_x1`) and has its own rails (`tp_right_rails()`). `door_open(a)` swings the door about the hinge.

## Checked

- Zero-volume intersections (faces touching at most):
  - body × door;
  - each piece × every reference part (TP4056, cell, HC33, V4, SMAs, pin);
  - the door at 5°, 15°, 30°, 60° and 90° × the body and × every board and the cell.
- Positive controls: each board or the cell nudged 0.5 mm (sideways, up or down) hits its slot, floor or roof.
- Overhang scan of both print-oriented STLs: only the tops of the round SMA and pin holes.
- Renders through the forge (`buildModel`): body, door, assembled, closed, print plate.
