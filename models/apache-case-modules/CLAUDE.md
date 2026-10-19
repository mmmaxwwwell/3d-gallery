# apache-case-modules

A modular insert for Harbor Freight Apache cases. The first build is a portable MeshCore repeater in an Apache 1800 (small, HF 64550). devOnly, unprinted.

## The user's brief (2026-10-19)

- "a modular system for filling the inside of the harbor freight apache cases", interior foam removed, "printing a portable meshcore repeater into it".
- Their answers:
  - radio: at first "XIAO nRF52840 + Wio-SX1262". Then: "the radio is a ebyte e22 something … its a 1w module, we should have an xiao sx1262 and a nrf54… for chips". From an earlier conversation (the drybag node's parts list), that is the E22P-915M30S (SX1262, 38.5 x 24, U.FL, 5 V for the full watt) on a XIAO nRF54LM20A, with a Pololu U3V40F5 boost. My reading is that the SX1262 is the chip inside the E22P, so there's no separate Wio-SX1262.
  - power: "32140 cylindrical tabbed cell with charging board" (the same parts as meshtastic-drybag-node)
  - antenna: bulkhead drilled through the case wall
  - modular style: a screw-grid baseplate, not Gridfinity, not stacked trays

## Case size

- The user measured it on 2026-10-19: inside 214 x 150, 76 tall in the base, the lid the same size inside and 18 tall, every corner about r 5.
- They gave one size, so the walls are modelled straight (`case_floor` = `case_rim`). Harbor Freight lists 206 x 143. If the plate won't drop in, the walls taper: ask for the size at the floor.

## Frame and placement

- X runs along the case, with the cell's end at +X and the bulkhead's at -X. Y runs across it (+Y toward the hinge). z = 0 is the case's inside floor, and the plate is centred on the origin.
- Each module is modelled with its first screw hole at its origin. `at(i, j)` places it on grid point (i, j), counted from the -X, -Y corner.
- The layout is `saddle_at`, `charge_at` and `kit_at`.
- A new module only needs its holes on multiples of `pitch`. `hole_span()` rounds a pocket up to the next pitch with the counterbores clear of the rim.

## Load-bearing choices (mine)

- **Fixings**: screws thread into bare 2.5 mm pilots in the 6 mm plate. No nuts or inserts. Module bases are 6 mm with 3.2 mm counterbores, so M3x8 leaves 0.8 mm short of the plate's bottom.
- **Saddle**: its flange holes lie under the cell's axis, so the saddle footprint stays narrow and the cell can sit close to the right end wall. The saddles are turned 90° (`saddles_placed`), so their holes run along Y. The saddles go in before the cell.
- **Strap**: its bore drops `strap_drop` below the seat's axis. The top bears on the cell with a `strap_squeeze` of 0.3 without pinching the sides. It prints on its side, so its screw holes print horizontal. It has no counterbore, because the 5 mm ear is too thin for one.
- **Trays**: the -Y side has no rim (connectors, assumed). Zip-tie slots sit just outside the rim, joined by an underside groove. The four screws sit at the X ends, `pitch` apart, so a tray is only as deep as its board plus the ties. The board rests on a `ledge_w` ledge over a `relief_depth` relief for solder tails.
- **Carrier**: a 50 x 70 perfboard (my pick of size) holds the E22P, the XIAO and the boost. The E22P sits at the bulkhead end, the XIAO's USB-C at the open front edge.
- **Cell** (user, 2026-10-19: "put the battery vertical along the right side"): it runs front to back (along Y) at the right end, axis x = 70. Standing on end can't fit, since 140 is more than the 94 the closed case gives (76 + 18). Read "vertical" as seen from above. It leaves about 5 mm past each end for the tabs.
- **Bulkhead**: on the left end wall at z = 45, y = 0, next to the carrier's E22P. It moved off the right end because the cell is there now. The lid top would point the antenna up when the case lies flat, but the pigtail would then cross the hinge.
- **Reference case**: in the preview, the front and left walls are cut away. The walls taper linearly from `case_floor` to `case_rim`.

## Open, unmeasured

- The case: any ribs or bosses on the floor, and how flat the end wall is where the bulkhead goes.
- `charge_dims` is the drybag node's guess. Which side each board's connectors face decides the trays' `open_side`.
- The XIAO nRF54LM20A's Bluetooth needs an antenna on its IPEX4 socket; there's no seat for one yet.
- MeshCore doesn't run on the nRF54 family yet (from the earlier conversation); it needs a port.
- Nothing yet charges the cell with the case closed. A solar or USB gland through the wall is the obvious next module.
