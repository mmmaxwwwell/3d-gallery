# meshtastic-drybag-node

A Meshtastic node in a sealed box, standing antenna up in a tree for years. Two printed parts:
- the body: TPU 64D
- the door (`cover()`): PCTG

devOnly, unprinted.

How the user's layout got here:
- It started from a photo of the parts laid out as a T.
- The boards were turned flat, perpendicular to the antenna, and the whole thing was flipped: "the top is really the antenna".
- The boards moved onto the battery, the cell was enclosed against knocks, and the T's inside corners were filled with slopes.
- The protection board was rotated to lie along the cell.
- The electronics got a cover.
- The seal was replaced (below).

## Frames

- **Use frame:** X along the cell, Z up as it hangs (antenna up), Y out of the front face. z = 0 is the box's bottom, y = 0 its back.
- `frame_print()` puts the body back face down (+Y up). Holes along Z are horizontal as it prints, so they're `tear_2d()`, peaked toward +Y, except the solar connector's hole: the user asked for it round. `cover_print()` puts the door front face down.

## Load-bearing choices

- **The seal is a tongue in a groove, gripped from the sides.** The user's earlier build used a squeezed TPU bead with screws through the seal. The cover wouldn't close, it leaked, and the screws through the seal were a problem. Their replacement: M5 × 10 straight into a TPU 64D body, and a PCTG door. So:
  - The body's rim has a `groove_w` groove, `groove_depth` deep, centred in the `wall`.
  - The door's tongue is `tongue_w`, 0.3 mm a side wider than the groove, and stops short of the groove's floor.
  - The TPU walls either side flex out and grip it. That's where the seal is, so it doesn't depend on screw force.
  - The tip starts narrower than the groove and widens over `tongue_lead` in steps, so it leads itself in.
- **Screws are outside the seal**, in ears. M5 × 10 thread straight into `m5_pilot_d` pilots in the TPU.
  - **Placement:** a pair sits either side of every corner, where its curve starts. The user asked for them "immediately on both sides of every corner". Two more go along the top and two along the bottom (`screw_xs`). `ear_groups` holds them, and each corner pair shares one ear.
  - **Shape:** each ear is its boss (`ear_r`, centre `ear_out` past the wall) hulled into an `ear_base`-wide strip on the wall, so it blends in. The user said the round ears were "too round", and asked for more meat round each screw.
  - **Depth:** ears run `ear_len` back from the front, then taper into the wall at 45° (their underside as the body prints).
  - The solar connector sits low in its wall (`solar_y`) so its nut clears those tapers (asserted). `pilot_depth` comes from the screw length and `cover_t`. The heads sit on the door; the user gave no head type, so there are no counterbores.
- **One door over the battery and the electronics.** The cell drops into a half-round seat from the front, and ribs on the door (`cell_rib_xs`) hold it. The cell's leads go up through `lead_x`, a hole in the shelf beside the protection board. The shelf is an internal floor and isn't sealed.
- **Boards lie flat in pockets** on the shelf, perpendicular to the antenna, dropped in from above and held with foam tape:
  - left: the protection board (`bms_*`), lying along the cell
  - right: the kit, then the charge board, its ports facing the right end and the solar connector
  - The middle (`mid_gap`) is clear for the jack's body.
  - The front rim's underside is chamfered 45°.
- **Bulkhead through the roof.** The roof is relieved from inside to `bulkhead_wall_t` (4 mm, user confirmed) round `n_body_d`. The jack's O-ring seals on the relief's floor, and the panel nut is on top.
- **Solar:** the user's own 5/8" watertight connector, in a plain round `solar_hole_d` through the right end wall, as the user asked. `solar_nut_d` (not measured) is its outside nut or flange.
- **The stem is short** (`stem_len` 26, the user asked for about 1/3 of the earlier 70). It has a saddle in the middle and a pair of zip-tie slots below and above it (`tie_zs`).
- **The back plate slopes** straight from the box's top corners in to the stem's top.
- **`stem_rib()`** is a quarter-round fillet (`rib_r`) along the foot of the plate where it meets the roof, notched round the bulkhead's nut and the antenna (`rib_notch`). The user asked for "a rounded rib there to add strength".
- Reference geometry (`cell()`, `antenna()`, `boards()`, `solar_connector()`) is preview only.

## Checks worth re-running after a change

Intersect the body with the door. The only overlap should be the tongue's side squeeze, about 0.6 × the loop length × the tongue's depth in the groove (around 790 mm³ at the defaults). Anything else is a collision.

## Unmeasured

- `board_w`/`board_d`: from the photo, scaled off the cell's 32 mm. The Kingboss 15000 mAh LiFePO4 bank's 150 × 40 × 50 case bounds the board at about 37 × 47.
- `board_t`
- `bms_*`: a typical 1S 24 A board
- `kit_t`
- `rear_gap`
- `end_clear`
- `n_body_d`
- the 5/8" connector's panel range against the 6 mm wall
- the tongue's interference, which needs a test print in the actual TPU 64D
