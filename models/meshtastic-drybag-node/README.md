# Meshtastic Dry-Bag Node

A frame for a cheap Meshtastic/MeshCore repeater that goes inside a 2 L dry bag and gets hoisted into a tree. It's a flat T:

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

Cell → protection board → charge board's battery pads; the kit's battery pads go to the cell through the same protection board. The pigtail's U.FL clips onto the Wio-SX1262. The protection board isn't held by the frame: heat-shrink it onto the cell's lead.

## Not measured yet

The charge board's size is read off a photo (39 × 44 mm). The bulkhead's rear body (13 mm) and the room above the flange wall for it and the coax's bend (22 mm) are guesses. The flange is the standard 25.4 mm square, holes on 18.2 mm.
