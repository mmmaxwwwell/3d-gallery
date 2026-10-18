# meshtastic-drybag-node

A Meshtastic node in a sealed box, standing antenna up in a tree for years. Three printed parts:
- the frame (PETG)
- its seal (TPU, printed in place with the frame)
- the cover (PETG)

It's made for the user's Snapmaker U1, a 4-toolhead printer, so the TPU prints into the frame in the same print. devOnly, unprinted.

How the user's layout got here:
- It started from a photo of the parts laid out as a T.
- The boards were turned flat, perpendicular to the antenna.
- The whole thing was flipped: "the top is really the antenna".
- The boards moved onto the battery, "installed from the top".
- The cell was enclosed against "hits and banging around in a tree for a few years".
- The T's inside corners were filled with slopes.
- The widest board was rotated, and the electronics got a cover.
- Last: "figure out how people are printing waterproof screw-together containers and make it happen".

## Frames

- **Use frame:** X along the cell, Z up as it hangs (antenna up), Y out of the front face. z = 0 is the box's bottom, y = 0 its back.
- `frame_print()` and `frame_gasket_print()` put the frame and its TPU back face down (+Y up), in the same place, so their STLs overlay in the slicer. Keep them paired. Holes along Z and X are horizontal as the frame prints, so they're `tear_2d()`, peaked toward +Y. `cover_print()` puts the cover front face down.

## Load-bearing choices

- **The seal is the common printed-enclosure recipe:** a groove in the rim with a TPU gasket in it (2–2.5 mm deep), squeezed 15–25%, with clamping all round. Here:
  - The groove is `groove_w` × `groove_depth`, centred in the wall.
  - The TPU bead stands in it, `bead_w` wide and `bead_proud` above the rim, so the flat cover squeezes it about 17%.
  - The bead is narrower than the groove on purpose: TPU doesn't compress in volume, so it needs side room to spread into. With no room, the cover can't close.
- **Screws run down the middle of the seal** (the user's preference from the heltec case), on `screw_points`: four along the top, four along the bottom, one in the middle of each end.
  - Round each one, the groove widens to `screw_pocket_d` and the bead to a `screw_disc_d` disc. The screw threads through the disc into a blind pilot, so the squeezed disc seals its own hole.
  - `wall` (9) is set by the pocket plus PETG either side. It's also what takes the knocks.
  - Screw length, counterbore and pilot depth are tied together (`pilot_depth`, asserted).
- **One cover over the battery and the electronics.** The user asked for an electronics cover "like the battery has". One seal loop instead of two means fewer joints to leak. The cell drops into a half-round seat from the front, and ribs on the cover (`cell_rib_xs`) hold it there. The cell's leads go up through `lead_x`, a hole in the shelf beside the protection board. The shelf is an internal floor and isn't sealed.
- **Boards lie flat in pockets** on the shelf, perpendicular to the antenna, dropped in from above and held with foam tape:
  - left: the protection board (`bms_*`), lying along the cell. The user asked to rotate it so it's "less wide": it was 50 deep.
  - right: the kit, then the charge board, its ports facing the right end and the gland.
  - The middle (`mid_gap`) is clear for the jack's body.
  - The front rim's underside is chamfered 45°.
- **Bulkhead through the roof.** The roof is relieved from inside to `bulkhead_wall_t` (4 mm, user confirmed) round `n_body_d`. The jack's O-ring seals on the relief's floor, and the panel nut is on top, outside.
- **The PG7 gland** goes through the right end wall at `gland_z`, relieved from inside to `gland_panel_t`. Its locknut sits in the relief, outboard of the charge board.
- **The back plate slopes** straight from the box's top corners in to the stem's top. The user asked for this: "instead of a pole sticking up its a slope up and a slope down".
- Reference geometry (`cell()`, `antenna()`, `boards()`, `gland()`) is preview only.

## Checks worth re-running after a change

- Intersect the frame with its gasket: 0 volume.
- Intersect the gasket with the cover: that's the squeeze, `bead_proud` deep.
- Check that each screw's disc and pocket stay inside the wall.

## Unmeasured

- `board_w`/`board_d`: from the photo, scaled off the cell's 32 mm. The Kingboss 15000 mAh LiFePO4 bank's 150 × 40 × 50 case bounds the board at about 37 × 47.
- `board_t`
- `bms_*`: a typical 1S 24 A board
- `kit_t`
- `rear_gap`
- `end_clear`
- `n_body_d`
- the PG7's actual thread length against `gland_panel_t`
- the Zanhour bag (now optional)
