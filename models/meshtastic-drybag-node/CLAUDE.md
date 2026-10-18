# meshtastic-drybag-node

A Meshtastic node in a sealed box that winches itself up into a tree and stays there for years. Printed parts:
- the body: TPU 64D
- the door (`cover()`), two battery straps, two reels, and the rear frame: PCTG

devOnly, unprinted.

## How the user's design got here

It started as a flat T frame in a dry bag, from a photo of the parts laid out. Along the way the user:
- turned the boards and flipped the node antenna-up
- put the cell in a housing and added slopes to the stem
- sealed the box. The first seal (a TPU bead with screws through it) is the layout that had failed on an earlier build. It became M5 screws straight into a TPU 64D body with a PCTG door ([[seal-screws-through-tpu-failed]] in memory).
- shortened the stem, added zip-tie slots and a rib, and blended the ears
- asked for a winch: "toss a line over some branches, tie both ends into the spools and it reels each in at the same time, pulling itself into the tree without having a tie line down"
- asked for reels square to the pull and far out to the side, holding 150–200 ft each, with the motor shafts out the back
- asked for no guides over the reels, just "a plate linking the spool free ends together and with the solar panel"
- asked for M5 × 10 screws with 8 mm of thread
- asked for a screwed battery retainer, the panel facing the other way, and the reels higher ("just flip the motors around")

The user wants independent control of the reels with an IMU to level the node ("stepper motors or independent control somehow like have an accelerometer"). I chose self-locking worm gearmotors, because a stepper needs holding current to hang on the line for years.

## Frames

- **Use frame:** X along the cell, Z up as it hangs, Y out of the front face. z = 0 is the box's bottom, y = 0 its back (the reels and rear frame are at y < 0).
- Each part's `*_print()` puts it in its print orientation. Holes along Z in the body are horizontal as it prints, so they're `tear_2d()`, peaked toward +Y. The solar connector's hole is round: the user asked.

## Load-bearing choices

- **Seal: a tongue in a groove, gripped from the sides.** The door's tongue (`tongue_w`) is 0.3 mm a side wider than the groove (`groove_w`) round the TPU rim, and stops short of the groove's floor. Its tip leads in narrower over `tongue_lead`. The screws only hold the door on.
- **Screws:** M5 × 10 everywhere, with `thread_len` (8, the user's) of thread.
  - Every part a screw passes through is counterbored to leave `under_head` (2) under the cap head.
  - Every pilot is `pilot_depth` (9) deep.
  - The door's screws sit in ears outside the seal (`ear_groups`): a pair either side of each corner sharing one hulled ear, one mid-height in each end, and `screw_xs_top` / `screw_xs_bottom`. Each ear is its boss hulled into an `ear_base` strip on the wall, `ear_len` deep, then tapering at 45°.
- **Battery:** the cell's back half sits in `cell_seat()`. The seat carries solid strips `strap_lug_h` tall above and below the cell. Two PCTG straps (`strap_xs`) cup the cell's front, 0.1 mm tighter than the seat, and screw into those strips at both ends.
- **Boards:** they stand flat on the back wall in rimmed pockets and go straight in from the front, on foam tape. There are two rows between the motors:
  - lower row: the radio kit, then the charge board, its ports facing +X into the open space before the right motor (asserted ≥ 20 mm)
  - upper row: the protection board, the DRV8833, and the winch XIAO Sense
  - The bulkhead's body hangs `n_body_len` from the roof above them.
- **Winch:**
  - **Motors:** the JGY-370 worm motors stand inside each end, gearbox up (`mot_shaft_down`) so the reels sit high. Each one's mounting face is on a boss (`boss_d`, `boss_t`) round its shaft hole in the back wall.
  - **Reels:** each reel's hub goes through that hole, 0.4 mm tight in the TPU as a lip seal, onto the motor's D-shaft. The drums run along Y behind the box (`drum_y0`..`drum_y1`), so the line comes straight up off them with no guide (the user's call). `spool_x` keeps the two 120 mm reels clear across the middle and sets the box's width.
  - **Capacity:** 0.57 L of winding space each, about 56 m (185 ft) of 1/8" line.
- **Rear frame:** one PCTG part.
  - **Upright:** it sits `rear_gap` behind the reels, `rear_t` (9) thick and flat behind so it prints on its back. Each reel's outer axle is an M5 × 25 threaded 8 mm into it, and the reel turns on the shank.
  - **Floor:** it runs under the box and screws to the bottom, into pilots under the cell's seat. Gussets join it to the upright, clear of the reels.
  - **Solar panel:** it hangs from the upright's foot at `panel_tilt`, facing back and up (the user asked to flip it). Its frame's top edge meets the upright (`panel_y` is derived from that), so the frame climbs from the upright at 45° as the part prints. Side plates join the frame to the floor.
- **Bulkhead** through the roof, relieved from inside to `bulkhead_wall_t` (4 mm, user confirmed) round `n_body_d`. The panel nut is on top.
- **Stem:** it's short (`stem_len` 26) with a saddle and zip-tie slots at two heights (`tie_zs`). The back plate's slopes run from the stem's top to `slope_foot_x`, with a quarter-round fillet rib (`stem_rib()`) along their foot.

## Checks worth re-running after a change

Intersect each pair of parts and reference parts; the scratch loop in this model's history does it.
- **Body ∩ door:** this should be the tongue's side squeeze only, about 0.6 × the loop length × its depth (~1130 mm³).
- **Body ∩ reel:** this should be the hub's lip seal only (~80 mm³).
- **Everything else** should be clear: straps, cell, boards, motors, rear frame, reels, panel.

## Open, unmeasured

- **Mass and torque:** the parts come to about 1.6 kg at 100% infill. At full radius a reel needs about 7 kg·cm to lift a 2.4 kg node. JGY-370s probably need 6–12 V for that, more than the 3.2 V cell gives, so a boost converter is likely. The motor's ratio and voltage aren't chosen.
- **Pitch:** the line pulls behind the box's centre of mass, so the node will hang pitched until the reels' weight balances it. The rear frame and panel are the ballast behind.
- **Not measured:** every board's size, the JGY-370's envelope and shaft, the solar panel (`panel_w`/`panel_h`), `n_body_d`/`n_body_len`, and the 5/8" connector's panel range.
