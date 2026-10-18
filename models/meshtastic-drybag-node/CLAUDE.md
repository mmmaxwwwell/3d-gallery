# meshtastic-drybag-node

One PETG frame, a flat T, that carries a Meshtastic node inside a 2 L dry bag hung in a tree. The user's layout, from a photo of the parts laid out: the 32140 cell across the top, the antenna hanging straight down from under its middle, the XIAO kit to the left and the charge board to the right. devOnly, unprinted.

## Frames

- **Use frame:** X along the cell, Z up as it hangs, Y out of the front face. z = 0 is the bulkhead wall's underside, where the N bulkhead's panel nut seats.
- `frame_print()` rotates the frame back face down (+Y up). Holes along Z are horizontal as it prints, so they're `tear_2d()`, peaked toward +Y.

## Load-bearing choices

- **The bulkhead clamps through a thin wall on its panel nut** (Superbat B08ZYK5SL9: N female, hex nut and O-ring, not a flange). The nut is underneath and the jack's body and the coax are in `rear_gap` under the cell. `bulkhead_wall_t` is kept thin so the nut leaves thread for the antenna's coupling nut; the user confirmed 4 mm. `antenna_y` clears the nut's corners as it turns.
- **Saddles stop at the centreline** (no wrap, no snap), and zip ties do the holding. The user rejects snap fingers.
- **Boards stand on ledges** along their bottom edge (their weight as it hangs) and inboard edge; their outboard edge is open, since the charge board's USB ports are there.
- Reference geometry (`cell()`, `antenna()`, `boards()`) is preview only.

## Unmeasured

`board_w`/`board_h` (from the photo, scaled off the cell's 32 mm; the Kingboss 15000 mAh LiFePO4 bank's 150 × 40 × 50 case bounds the board at about 37 × 47, standing across one end. Err wide: a board wider than `board_w` covers the outboard tie slot), `rear_gap`, `kit_t`, and the Zanhour 2 L bag's size.
