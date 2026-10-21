# hc33-lipo-case

Case for a Heltec HT-HC33, a Heltec WiFi LoRa 32 V4, a 103665 LiPo, a USB-C TP4056 board and two SMA bulkheads. devOnly, unprinted.

## The user's brief (2026-10-21)

- "a 3d printed case for a 103665 battery, a heltec ht-hc33, two sma antenna mounts on top, and a 4056 charger".
- "It also has a held tick v4 in it" (voice dictation: a Heltec V4).
- "everything stacked like a stack of credit cards vertically with the antennas at the top on the two opposite corners and the usb ports on the bottom". This replaced a two-column, two-layer box.

## My picks (not the user's)

- **"Opposite corners" = diagonal**: front-left and back-right of the top face. Over the thin outer layers that's also the farthest apart they can be.
- **Stack order**, back to front: TP4056, cell, HC33, V4. The V4's screen faces the front wall, but there's no window: nobody asked for one.
- **A sleeve and a top cap.** Boards slide down into side-wall rails onto slot floors (`board_z0`) that put each USB-C over its opening. The sleeve prints standing up, so the rails, fins and floor holes need no overhangs, and the cap's SMA holes are vertical.
- **Fingers under the cap** stop everything `finger_gap` short, in place of foam tape. The cell's pair stand `cell_finger_x` either side of the middle, clear of its tabs and of the back SMA's body (asserted).
- **Not sealed.** If the user wants it waterproof, read [[seal-screws-through-tpu-failed]] in memory first.
- **Screws in corner towers** on the corners' diagonals (`screw_d`), running the sleeve's full height, outside the cavity.

## Frame

Origin at the cavity's centre in plan, z = 0 on the bottom face. X across, Y through the stack (+Y front), Z up. Layer positions (`tp_y`, `cell_y`, `hc_y`, `v4_y`) run from the back wall's inner face; `yb` shifts them onto the origin. Each board is a vector `[width, PCB back face, PCB thickness, length, USB overhang, USB centre]` in `boards`; `rails()` and `ref_board()` take one. `rim` (the sleeve's top) is the tallest part plus `finger_gap` plus `sma_behind`.

## Checked

- Zero-volume intersections (faces touching at most): sleeve × cap, each piece × every reference part, every pair of reference parts.
- Overhang scan of both print-oriented STLs: none past 45°.
- Renders through the forge (`buildModel`): sleeve, cap, assembled, closed, print plate.
