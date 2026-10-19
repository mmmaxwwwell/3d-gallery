# apache-case-modules

A modular insert for Harbor Freight Apache cases. The first build is a portable MeshCore repeater in an Apache 1800 (small, HF 64550). devOnly, unprinted.

## The user's brief (2026-10-19)

- "a modular system for filling the inside of the harbor freight apache cases", interior foam removed, "printing a portable meshcore repeater into it".
- Their answers:
  - radio: XIAO nRF52840 + Wio-SX1262
  - power: "32140 cylindrical tabbed cell with charging board" (the same parts as meshtastic-drybag-node)
  - antenna: bulkhead drilled through the case wall
  - modular style: a screw-grid baseplate, not Gridfinity, not stacked trays

## Frame and placement

- X runs along the case, with the bulkhead end at +X. Y runs across it (+Y toward the hinge). z = 0 is the case's inside floor, and the plate is centred on the origin.
- Each module is modelled with its first screw hole at its origin. `at(i, j)` places it on grid point (i, j), counted from the -X, -Y corner.
- The layout is `saddle_at`, `charge_at` and `kit_at`.
- A new module only needs its holes on multiples of `pitch`. `hole_span()` rounds a pocket up to the next pitch with the counterbores clear of the rim.

## Load-bearing choices (mine)

- **Fixings**: screws thread into bare 2.5 mm pilots in the 6 mm plate. No nuts or inserts. Module bases are 6 mm with 3.2 mm counterbores, so M3x8 leaves 0.8 mm short of the plate's bottom.
- **Saddle**: its flange holes lie under the cell's axis, so the saddle footprint stays narrow and the cell can sit near the back wall. The saddles go in before the cell.
- **Strap**: its bore drops `strap_drop` below the seat's axis. The top bears on the cell with a `strap_squeeze` of 0.3 without pinching the sides. It prints on its side, so its screw holes print horizontal. It has no counterbore, because the 5 mm ear is too thin for one.
- **Trays**: the -Y side has no rim (connectors, assumed). Zip-tie slots sit just outside the rim, joined by an underside groove.
- **Bulkhead**: on the right end wall at z = 45, y = 0. That choice is mine. The lid top would point the antenna up when the case lies flat, but the pigtail would then cross the hinge.
- **Reference case**: in the preview, the front and left walls are cut away. The walls taper linearly from `case_floor` to `case_rim`.

## Open, unmeasured

- The case: the floor and rim size, the corner radius, any ribs or bosses on the floor, and how flat the end wall is where the bulkhead goes.
- `charge_dims` and `kit_dims` are the drybag node's guesses. Which side each board's connectors face decides the trays' `open_side`.
- Nothing yet charges the cell with the case closed. A solar or USB gland through the wall is the obvious next module.
