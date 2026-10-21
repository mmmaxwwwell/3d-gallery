# hc33-lipo-case

Case for a Heltec HT-HC33, a Heltec WiFi LoRa 32 V4, a 103665 LiPo, a USB-C TP4056 board and two SMA bulkheads. devOnly, unprinted.

## The user's brief (2026-10-21)

- "a 3d printed case for a 103665 battery, a heltec ht-hc33, two sma antenna mounts on top, and a 4056 charger".
- "It also has a held tick v4 in it" (voice dictation: a Heltec V4).
- "everything stacked like a stack of credit cards vertically with the antennas at the top on the two opposite corners and the usb ports on the bottom".
- "can we turn the charging circuit so it comes out the side? can we hae a smooth rounded profile when we look at it from the top? add grip indexing like 15cm indents alternating the corners". I read 15cm as 15 mm: the case is 82.5 tall.
- "i want one of the sides to be a a hinge like a door style so that we can open the side up and have easy access to add or remove anything we need". This replaced the sleeve and top cap.
- "the indentation to make it easier to hold, can we make that like a ribbing? 15cm bands all the way down alternating, when its on its diamond knurling"; "i want a toolless way to open and close the door"; "the different items in there need more separation like mostly separate chambers except for somewhere to route the wires"; "the battery and the green board have to swap" (green = the HC33 in the renders, so the cell is middle-left seen from the front-left); "i want that top edge rounded too".
- "i need something that like locks the door in place and then i can undo with my fingers, maybe a latch at the top or something?" Then "I don't think that latch works the way you think it does", and then "give up on that. forget the toolless entry. put m5x10 screws at the top 2 of them".
  - What went wrong, for next time: the first slide bolt (guide on the body, knob through the top) couldn't be fitted. The rod was too long to thread through its guide in the room behind it, and the knob end couldn't pass the guide hole.
  - The redesign moved the bolt onto the door with a peg knob that swings down into a notch. That checks out geometrically, but the user stopped it.
  - Before claiming a mechanism works, check that it can be put together and what each motion sweeps through.

## My picks (not the user's)

- **"Opposite corners" = diagonal**: front-left and back-right of the top.
- **Stack order**, back to front: TP4056, HC33, cell, V4 (the user's swap). No window for the V4's screen.
- **Door screws** (`door_screw_*`, `m5_*`): two M5x10 cap screws through counterbores in the door into bosses under the top, each hung on a 45° hull so it prints. The user gave up on a toolless latch (below) and asked for these.
- **The TP4056–HC33 divider is short** (`tp_divider_z1`, just over the TP4056's roof). The user asked for it "so i can put the antenna in": the HC33's antenna goes in the space above the charger.
- **Chambers**: `dividers` sit in the middle of the layer gaps (`layer_gap` 2.4 leaves 0.6 a side) and stop at `divider_z1`. The `sma_behind` head space above them is the shared wire route. The cell's old fins went: the dividers bound it.
- **Knurl bands** (`knurl()`) only on the flat of the front and back faces (|x| ≤ `arc_x`). The faces they'd wrap onto are the bed faces of the two prints. On a vertical face, the grooves' walls are 30° past vertical as the body prints. Each band's ends lead in at 45° (`band_region()`), because a square end on the left would face down.
- **Top edge** (`shell()`): a hull of outline slices, a 45° lead (`top_lead`) onto a `top_r` arc, the same in every direction. `sma_in_y` keeps each SMA's outer nut on the flat of the top (asserted).
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
- **Walls**: `side_wall` 6 (set by the hinge), `end_wall` 4 (the corners keep 2 mm, asserted).
- **Not sealed.** If the user wants it waterproof, read [[seal-screws-through-tpu-failed]] in memory first.

## Frame

Origin at the cavity's centre in plan, z = 0 on the bottom face. X across (door at -X), Y through the stack (+Y front), Z up. Layer positions (`tp_y`, `cell_y`, `hc_y`, `v4_y`) run from the back wall's inner face; `yb` shifts them onto the origin. `boards` holds the HC33 and V4 as `[width, PCB back face, PCB thickness, length, USB overhang, USB centre]`. The TP4056 lies along X (`tp_x0`..`tp_x1`) and has its own rails (`tp_right_rails()`). `door_open(a)` swings the door about the hinge.

## Checked

- Zero-volume intersections (faces touching at most):
  - body × door;
  - each piece × every reference part (TP4056, cell, HC33, V4, SMAs, pin);
  - the door at 5°, 15°, 30°, 60° and 90° × the body and × every board and the cell.
- Positive controls: each board or the cell nudged (sideways, up or down) hits its slot, floor, roof or divider.
- Overhang scan of both print-oriented STLs: only the tops of the round SMA and pin holes, plus 0.8 mm² at a bottom opening's peak. Nothing from the knurl or the rounded top.
- Door screws: a 5 mm rod along each screw's line clears the door's holes and cuts into the bosses' pilots.
- Renders through the forge (`buildModel`): body, door, assembled, closed, print plate.
