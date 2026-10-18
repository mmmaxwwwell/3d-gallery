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
- asked to cut the wind area and move the panel behind the reels, high under them, three quarters of the way out
- asked for the reels' line holes to become rope-wedging cleats
- asked for a cage that holds the reels close, as flat-pack slotted pieces
- asked for more door screws (five a side), sealed screw posts, and the boards rearranged round them

The user wants independent control of the reels with an IMU to level the node ("stepper motors or independent control somehow like have an accelerometer"). I chose self-locking worm gearmotors, because a stepper needs holding current to hang on the line for years.

## Frames

- **Use frame:** X along the cell, Z up as it hangs, Y out of the front face. z = 0 is the box's bottom, y = 0 its back (the reels and rear frame are at y < 0).
- Each part's `*_print()` puts it in its print orientation. Holes along Z in the body are horizontal as it prints, so they're `tear_2d()`, peaked toward +Y. The solar connector's hole is round: the user asked.

## Load-bearing choices

- **Seal: a tongue in a groove, gripped from the sides.** The door's tongue (`tongue_w`) is 0.3 mm a side wider than the groove (`groove_w`) round the TPU rim, and stops short of the groove's floor. Its tip leads in narrower over `tongue_lead`. The screws only hold the door on.
- **Screws:** M5 × 10 everywhere, with `thread_len` (8, the user's) of thread.
  - Every part a screw passes through is counterbored to leave `under_head` (2) under the cap head.
  - Every pilot is `pilot_depth` (9) deep.
  - The door's screws sit in ears outside the seal (`ear_groups`): a pair either side of each corner sharing one hulled ear, `end_screws` (3) evenly up each end, and `screw_xs_top` / `screw_xs_bottom`. That makes five along the top (counting the top post), five along the bottom, and five up each end, as the user asked. Each ear is its boss hulled into an `ear_base` strip on the wall, `ear_len` deep, then tapering at 45°.
- **Battery:** the cell's back half sits in `cell_seat()`. The seat carries solid strips `strap_lug_h` tall above and below the cell. Two PCTG straps (`strap_xs`) cup the cell's front, 0.1 mm tighter than the seat, and screw into those strips at both ends.
- **Boards:** they stand flat on the back wall in rimmed pockets and go straight in from the front, on foam tape. They sit between the motors, above the line of posts:
  - along the bottom: the protection board, then the radio kit
  - over them: the charge board, standing with its ports up into `port_room` under the roof; then the top post; then the winch XIAO, with the DRV8833 above it
  - The bulkhead's body hangs `n_body_len` from the roof.
- **Winch:**
  - **Motors:** the JGY-370 worm motors stand inside each end, gearbox up (`mot_shaft_down`) so the reels sit high. Each one's mounting face is on a boss (`boss_d`, `boss_t`) round its shaft hole in the back wall.
  - **Reels:** each reel's hub goes through that hole, 0.4 mm tight in the TPU as a lip seal, onto the motor's D-shaft. The drums run along Y behind the box (`drum_y0`..`drum_y1`), so the line comes straight up off them with no guide (the user's call). `spool_x` keeps the two 120 mm reels clear across the middle and sets the box's width.
  - **Capacity:** 0.57 L of winding space each, about 56 m (185 ft) of 1/8" line.
- **Cage: flat-pack**, the user's idea: "print a series of flat pieces that go together like those cardboard 3D cutouts... and we use the strong axis". Every piece is `cage_t` (9) PCTG, printed flat. The user wanted the reels held "closer to the reel, around the sides and the bottom".
  - **Pieces:**
    - `front_plate()` sits flat on the box's back, screwed into the solid strips round the cell and the motors' bosses (`front_screw_points()`).
    - `rear_plate()` carries the reels' outer axles, M5 × 25 threaded 8 mm into it.
    - Both share `cage_frame_2d()`: a perimeter frame, a middle bar, and a ring round each reel.
    - Three identical `rib()`s run between them: outboard of each reel and in the middle.
    - `bottom_plate()` sits under the reels.
  - **Joints:** tabs through slots (`slot_clear`) locate every joint. An M5 × 10 through the slotted piece (`plate_screw()`, counterbored to `under_head`) threads 8 mm into a pilot in the other piece's edge (`edge_pilot()`).
  - **Line clearance:** the line leaves the drum's top between the flanges, so it never meets the plates. The tops of the rings are fine.
  - **Assembly order:** the front plate, ribs and bottom plate go together first (front-face screws), then onto the box (back-face screws). The reels go onto their shafts, and the rear plate goes on last.
  - **Bed fit:** every piece fits the U1's 270 mm bed. That's why the reels are 112 mm (72 mm long) and `spool_mid_gap` is 12.
- **Solar panel:** it sits behind the reels, on the far side from the antenna and battery (the user's call). Its frame's top edge is `panel_gap` under the bottom plate, with `panel_out` (¾, the user's) of its depth behind the rear plate. It faces back and up at `panel_tilt`.
  - `solar_mount()` is flat. Its tabs pass through slanted slots in two `panel_rib()`s that hang from the bottom plate, and a zip tie through each tab's end holds it.
- **Sealed screw posts** (`post_points`), the user's ask: TPU posts from the back wall to the door. Each is `post_squeeze` proud, so the door presses its end round the screw's hole.
  - There's a line of three over the battery between its straps (`low_post_xs`), and one at the top under the bulkhead (`top_post_x`, just right of the charge board).
  - The top post is the top run's middle screw, because the bulkhead's nut is on the roof there.
- **Reel's line anchor:** a V jam cleat (`cleat_*`) cut into the core by the inner flange. Its walls run along the axis, so they print upright. The throat is narrower than the line, so the line's end wedges in. The user asked for it to replace the small cross hole: "more like those crevices they wedge ropes into".
- **Bulkhead** through the roof, relieved from inside to `bulkhead_wall_t` (4 mm, user confirmed) round `n_body_d`. The panel nut is on top.
- **Stem:** it's short (`stem_len` 26) with a saddle and zip-tie slots at two heights (`tie_zs`). The back plate's slopes run from the stem's top to `slope_foot_x`, with a quarter-round fillet rib (`stem_rib()`) along their foot.

## Checks worth re-running after a change

Intersect each pair of parts and reference parts.
- **Body ∩ door:** this should be the tongue's side squeeze only, about 0.6 × the loop length × its depth (~1130 mm³).
- **Body ∩ reels:** this should be the hubs' lip seals only (~160 mm³ for both).
- **Body ∩ door** also includes the posts' squeeze.
- **Everything else** should be clear, cage pieces with each other included: tabs sit in slots with clearance.

## Open, unmeasured

- **Mass and torque:** the parts come to about 1.5 kg at 100% infill. At full radius a reel needs about 7 kg·cm to lift a 2.4 kg node. JGY-370s probably need 6–12 V for that, more than the 3.2 V cell gives, so a boost converter is likely. The motor's ratio and voltage aren't chosen.
- **Pitch:** the line pulls behind the box's centre of mass, so the node will hang pitched until the reels' weight balances it. The reels, line and panel are the weight behind.
- **Not measured:** every board's size, the JGY-370's envelope and shaft, the solar panel (`panel_w`/`panel_h`), `n_body_d`/`n_body_len`, and the 5/8" connector's panel range.
