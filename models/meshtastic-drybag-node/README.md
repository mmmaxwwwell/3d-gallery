# Meshtastic Dry-Bag Node

A frame for a cheap Meshtastic/MeshCore repeater, built from a Kingboss 15000 mAh LiFePO4 power bank taken apart, that goes inside a 2 L dry bag and gets hoisted into a tree. It's a flat T:

- **Crossbar:** a 32140 LiFePO4 cell (3.2 V, 15 Ah), lying across the top in two saddles and held by two zip ties.
- **Middle:** an N female 4-hole-flange bulkhead pigtail (Superbat, 6" RG178 to U.FL) screws to a wall under the cell with four M3 × 10 cap screws. The ALFA AOA-915-5ACM screws onto it and points straight down. A saddle and a zip tie at the bottom of the stem keep the antenna in line.
- **Left of the bulkhead:** the XIAO nRF52840 + Wio-SX1262 kit. **Right:** the power bank's charge board, with its USB ports facing the end of the crossbar so the 5 V solar panel's cable plugs in. Each board stands on a ledge and is held by one zip tie (or foam tape).
- **Above the cell:** a 6 mm cord hole. Tie a cord here and run it out through the roll-top with the solar cable, so the frame hangs from the cord rather than resting on the antenna's tip.

The cell crosses the antenna at right angles, above its feed, which keeps the metal can out of the antenna's near field far better than a cell running alongside the antenna would.

## Size

The frame is 140 × 151 × 30 mm. With the antenna fitted, the whole thing is about 145 mm wide and 285 mm tall. Check that against your bag, leaving room for the roll-top's three folds.

## Printing

PETG, one piece, back face down. No supports: the saddles stop at the cell's and the antenna's centrelines, and the holes through the flange wall are peaked at 45°.

## Wiring

The XIAO's own charger charges to 4.2 V, which is too high for LiFePO4 (3.65 V max). It only runs while the XIAO's USB-C is powered, so unplug the cell, or check that the protection board cuts off at the LiFePO4 limit, before plugging into the XIAO to flash or configure it. The Kingboss board is made for LiFePO4, so the solar input charges the cell correctly. A full LiFePO4 cell (3.2–3.6 V) is within what the XIAO and the SX1262 run on directly.


Cell → protection board → charge board's battery pads; the kit's battery pads go to the cell through the same protection board. The pigtail's U.FL clips onto the Wio-SX1262. The protection board isn't held by the frame: heat-shrink it onto the cell's lead.

## Not measured yet

The charge board's size is read off a photo (39 × 44 mm). The Kingboss's case is 150 × 40 × 50 mm, with the board standing across one end behind the ports, so the board can't be much over about 37 × 47. The frame takes that: the outboard tie slot is placed for 39 wide, and 3 mm of `board_gap` under the cell covers up to 47 tall. The bulkhead's rear body (13 mm) and the room above the flange wall for it and the coax's bend (22 mm) are guesses. The flange is the standard 25.4 mm square, holes on 18.2 mm.
