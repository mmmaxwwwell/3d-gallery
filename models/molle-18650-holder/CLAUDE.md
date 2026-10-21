# molle-18650-holder — agent notes

- **Frame:** +X across, +Y up, +Z away from the pack. Z = 0 lies on the pack,
  Y = 0 is the plate's bottom edge. Print pose (`print_pose()`) is front face
  down.
- **The weave is the Kanix MOLLE stick plate's idea, written fresh.** Kanix
  code is off limits (CC BY-NC-ND); only interface numbers are shared: PALS
  spacing (A-A-55301 / Natick layout) and the stick's measurements (measured
  off `library/molle-stick`: 25 wide, 3 thick, tip to hook pocket
  103 + 25 × (inches − 4), hook drop 20.3).
- **Plate height comes from the stick:** `floor_t + stick_len − hook_clear`.
  The bands that fit set the windows. Equal end blocks centre them. The
  asserts refuse a stick that ends inside a band (3", 5", 7"); only the 4" and 6" fit.
- **Stick count comes from the width:** as many 1.5" PALS columns as fit
  `plate_w` with `min_side` outside the outer slots, centred.
- **Cells sit flush with the plate's top** so they load from the top with
  nothing over them; the top "taper" is the `grip` bevel, which also opens the
  pocket fronts. The bottom taper is 45° (printable front-down) and stops at
  the plate, leaving a flat ledge over the bottom block on the 4" stick.
- **Pocket back is a truncated teardrop** onto a flat at `plate_z`, so it
  bridges front-face-down. Don't make it round.
- Unprinted. Open guesses: `cell_clear` 0.3, `rib_squeeze` 0.15, the slot
  clearances (borrowed from the stick plate, untested here).
