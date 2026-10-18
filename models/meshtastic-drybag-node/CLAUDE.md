# meshtastic-drybag-node

One PETG frame, a flat T, that carries a Meshtastic node inside a 2 L dry bag hung in a tree. The user's layout, from a photo of the parts laid out: the 32140 cell across the top, the antenna hanging straight down from under its middle, the XIAO kit to the left and the charge board to the right. The user then had the boards turned flat, perpendicular to the antenna, in the same places. devOnly, unprinted.

## Frames

- **Use frame:** X along the cell, Z up as it hangs, Y out of the front face. z = 0 is the bulkhead wall's underside, where the N bulkhead's panel nut seats.
- `frame_print()` rotates the frame back face down (+Y up). Holes along Z are horizontal as it prints, so they're `tear_2d()`, peaked toward +Y.

## Load-bearing choices

- **The bulkhead clamps through a thin wall on its panel nut** (Superbat B08ZYK5SL9: N female, hex nut and O-ring, not a flange). The nut is underneath and the jack's body and the coax are in `rear_gap` under the cell. `bulkhead_wall_t` is kept thin so the nut leaves thread for the antenna's coupling nut; the user confirmed 4 mm. `antenna_y` clears the nut's corners as it turns.
- **Saddles stop at the centreline** (no wrap, no snap), and zip ties do the holding. The user rejects snap fingers.
- **Boards lie flat on shelves** (`shelf_t`, normal along Z) under the cell, either side of the bulkhead wall, so their ground planes are perpendicular to the antenna. That's the user's call: they first asked to keep the boards away from the antenna, then said to keep them in place and just turn them. A board's size is `_w` along the cell and `_d` out from the plate, and `_t` is how tall it stands. It has to fit under the cell (asserted). The charge board's ports face +X. Each shelf has a pair of tie slots outside the board.
- Reference geometry (`cell()`, `antenna()`, `boards()`) is preview only.

## Unmeasured

`board_w`/`board_d` (from the photo, scaled off the cell's 32 mm; the Kingboss 15000 mAh LiFePO4 bank's 150 × 40 × 50 case bounds the board at about 37 × 47, standing across one end. Err wide: a board wider than `board_w` covers the outboard tie slot), `board_t`, `rear_gap`, `kit_t`, and the Zanhour 2 L bag's size.
