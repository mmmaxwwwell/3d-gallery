# heltec-ht-hc33-case

Waterproof three-piece case for the Heltec HT-HC33 and one 18650: SMA out of one end, USB-C out of the other behind a hinged plug door. Published, though not yet printed and fitted. The user's brief: battery case, then MCU plate, then the cover with the SMA; every joint TPU-sealed in place; M3 SHCS into bare plastic. The battery case and the plate never take threads; the cover does.

## File layout

```
lib/heltec-ht-hc33-case-lib.scad    every parameter and module
parts/battery-case.scad             + battery-case-gasket.scad   (TPU)
parts/mcu-plate.scad                + mcu-plate-gasket.scad      (TPU)
parts/cover.scad                    + cover-gasket.scad          (TPU, the SMA washer)
parts/door.scad                     + door-gasket.scad           (TPU, the plug sleeve)
previews/assembled.scad             the stack plus reference board and cell
previews/print.scad                 each piece in print orientation, TPU in place; one colour per material (black PETG, TPU 75A), so its 3MF carries two filaments
```

There's no `plate: true` preview, because a print plate must be one material family and every piece here prints PETG and TPU together.

## Frames

- **Assembly frame**: origin at the footprint's centre, z = 0 on the battery case's bottom face. USB-C at -X, SMA at +X.
- **Face frame** (`face_frame()`), for the door and everything on the cover's -X face: u across the face (toward -Y), v up from the USB's centre, w out of the face. The door, its knuckles, its plug and the cover's cuts for them are all written in this frame.
- **Print wrappers**: every part is modelled in the assembly (or face) frame. The `*_print()` wrappers put it on its print face. A part and its gasket go through the same wrapper, so their STLs overlay in the slicer. Keep them paired.

## Load-bearing choices

- **Seal profile.** It's one cross-section (`seal_groove`/`seal_gasket`/`seal_ridge`), swept round the centreline outline `seal_path()` by `offset_loop()`. A channel of TPU sits under the groove, with a column standing `seal_squeeze` into the ridge's path. `offset_loop()` hulls offsets of a convex outline, so it only works for convex loops.
- **Only the cover has a ridge.** The MCU plate prints flat side down, so its underside is flat and presses straight on the battery case's column (`ridged = false`). The cover prints top down, so its ridge points up at 45°.
- **Screws run down the middle of the seal** (`screws`, on the seal's straight runs; asserted). The user asked for this over screws outside the seal. Round each screw:
  - the TPU channel widens to a pad (`seal_pad_r`)
  - its column widens to a disc (`seal_disc_r`), with a pilot-sized hole the screw threads through
  - the cover's ridge widens to a matching disc, trimmed to the wall, so the pilot's mouth is ringed by pressed TPU. Without the ridge disc, the 2.5 mm pilot would open into the groove on both sides of the ridge's 1 mm tip, and water could run along the threads.
  - On the flat battery/plate joint, the disc stands proud and presses round the plate's clearance hole.
  - Heads sit in counterbores in the battery case (`screw_seat`, `seal_skin` of PETG under the TPU).

  `seal_reach` (counterbore or groove disc, whichever is wider) sets `out_hy`, and the SMA's depth and the door's plug set `out_hx`.
- **The battery case is a hull**: the cell's wall (`core_r`), a flat along the bottom at the 45° tangent width, and the flange rectangle from `flange_z`. It's clipped at `case_h`. `flange_z` comes from the 45° line out of the bottom flat, so widening the footprint raises the flange's outer edge (asserted still at least 0.8 thick). A rounder body would need supports, since it prints floor down and its TPU is on top.
- **The door seals radially.** The plug's TPU sleeve (`plug_sleeve_t`) is `plug_squeeze` oversize against the USB opening's outline (`usb_open_2d()`, chamfered so its lower edge prints). The opening's mouth flares out 45° by `usb_flare` and the sleeve's outer lip flares to fill it (`plug_flare()`), so the ribs sit deeper than the flare (asserted). Diamond ribs pop into larger diamond grooves (`plug_diamond()`), so the squeezed TPU has room. Nothing clamps the door, so the hinge only swings.
- **The plug swings in on an arc.** Its PETG core is trimmed to `core_r_max` about the hinge axis, so it clears the opening's far wall. Only the TPU is squeezed on the way in. Checked: PETG clear of the cover from closed to 120° open; the TPU touches only in the last ~33°.
- **The hinge is all solids of revolution about its axis** (`round_hinge()`). The cover's knuckle has a 45° cone on top, which is its supported underside when the cover prints top down, and the upper door knuckle has the matching recess. The lower knuckle and its clearance cut cone in at 45° where they cross the face. The pin is 1.75 mm filament, snug in the cover's knuckle (`pin_d + 0.05`) and loose in the door's.
- **SMA through the +X wall.** The panel is at the outer face, the hex nut pocket (`sma_nut_x`..`sma_pocket_x`) sits behind it, and an access cavity comes in from the interior. Putting the nut deep in the wall is what gives the connector's back `sma_behind` of clear room before the board's end and the micro-SD overhang. The cavity sits above the cover's seal ridge (asserted). The nut's cavity has a 45° roof (`tear_2d`) pointing down in assembly, which is up when the cover prints, and a hexagon's own roof is 30° off flat, so the nut pocket is peaked too. The thread's hole through the panel is round: the user asked for no teardrop there.
- **The SMA washer is under the inner nut** (`sma_seal`): TPU in a hex recess in the panel's inner face, standing `sma_washer_proud` into the pocket for the nut to squeeze (asserted to leave the nut room, and the panel 1.2 thick). Its round hole is `sma_washer_grip` under the thread so it grips it. The user asked for it there, tight, with no teardrop.
- **Outside edges.** `corner_r` rounds the footprint's vertical corners; `top_chamfer` is a 45° chamfer round the cover's top edge (`footprint(h, chamfer)`), which is on the bed as the cover prints, so it's a 45° overhang.
- **Measured board heights**: `board_t` 1.5, the tallest part underneath is 3.6 (the battery socket, behind the USB-C), the tallest on top is 3.3. The power hole is under that socket, at the USB end.

## Checks worth re-running after a change

- Intersect each part with its gasket: 0 volume.
- Intersect each gasket with the part that presses it: that's the squeeze.
- Intersect the door, and its TPU separately, rotated about the hinge axis (0–120°), with the cover.
- Scan each part fused with its TPU (print-oriented) for downward faces steeper than 45° off the bed. Flat bridges are fine; sloped overhangs aren't.

## Unmeasured

`usb_z_above_pcb`, `sd_overhang`, the SMA nut size and its rear length (`sma_behind`), the contact plates' size and how far the spring compresses (`contact_gap`).
