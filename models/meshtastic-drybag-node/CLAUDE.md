# meshtastic-drybag-node

A Meshtastic node in a 2 L dry bag, hung in a tree for years, antenna up. Two PETG parts: a flat T frame and a battery lid. devOnly, unprinted.

How the user's layout got here: it started from a photo of the parts laid out as a T. The boards were then turned flat, perpendicular to the antenna, and the whole thing was flipped: "the top is really the antenna". The boards were moved onto the battery, "installed from the top", and the cell is now enclosed because it has to survive "hits and banging around in a tree for a few years".

## Frames

- **Use frame:** X along the cell, Z up as it hangs (antenna up), Y out of the front face. z = 0 is the housing's bottom.
- `frame_print()` puts the frame back face down (+Y up). Holes along Z are horizontal as it prints, so they're `tear_2d()`, peaked toward +Y. `battery_lid_print()` puts the lid front face down.

## Load-bearing choices

- **The cell is shut in a housing**, split at its centreline (`cell_y`): the frame's half (the back plate is its back wall) and `battery_lid()`. Each half's cavity opens upward as it prints, so neither needs supports. Four M3 × 16 cap screws through the lid's end walls (`end_wall`) thread `lid_screw_thread` into the frame; counterbores sized from the screw length (`lid_counterbore`, asserted). The leads leave through holes on the joint at the centreline of each end wall, between the screws.
- **Boards lie flat in pockets on the housing's top** (`shelf`, rims `rim_w` × `rim_h`), so they're next to the cell, drop in from above, and are perpendicular to the antenna. The front rim's underside is chamfered 45° (it's a ledge as the frame prints). Foam tape holds them; there's no tie under the shelf, because the lid is there. Left to right: protection board (`bms_*`), kit, the middle where the jack's body comes down, charge board (ports facing +X). A board's size is `_w` along the cell, `_d` out from the plate, and `_t` tall.
- **The bulkhead clamps through a thin wall on its panel nut** (Superbat B08ZYK5SL9: N female, hex nut and O-ring). The nut is on top, and the jack's body and the coax hang into `rear_gap` above the boards. `bulkhead_wall_t` is 4 mm (user confirmed), thin so the nut leaves thread for the antenna. `antenna_y` clears the nut's corners as it turns. The stem runs `stem_len` up the antenna to a saddle and a zip tie.
- **The back plate slopes** straight from the crossbar's top corners (`bar_half`, `bar_top`) in to the stem's top (`stem_half`, `stem_top`), filling the T's inside corners. The user asked for it, for strength: "instead of a pole sticking up its a slope up and a slope down".
- `bar_half` is the widest of the housing and the pockets, kept symmetric.
- Reference geometry (`cell()`, `antenna()`, `boards()`) is preview only.

## Unmeasured

`board_w`/`board_d` (from the photo, scaled off the cell's 32 mm; the Kingboss 15000 mAh LiFePO4 bank's 150 × 40 × 50 case bounds the board at about 37 × 47), `board_t`, `bms_*` (typical 1S 24 A board), `kit_t`, `rear_gap`, `end_clear` (the cell's tabs and leads), and the Zanhour 2 L bag's size.
