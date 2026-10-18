# Meshtastic Dry-Bag Node

A frame for a cheap Meshtastic/MeshCore repeater, built from a Kingboss 15000 mAh LiFePO4 power bank taken apart, that goes inside a 2 L dry bag and gets hoisted into a tree. It's a flat T:

- **Crossbar:** a 32140 LiFePO4 cell (3.2 V, 15 Ah), lying across the top in two saddles and held by two zip ties.
- **Middle:** the Superbat pigtail's N female bulkhead (6" RG178 to U.FL) goes up through a 4 mm wall under the cell and clamps on its own panel nut, so the jack's body and the coax sit in the gap under the cell. The ALFA AOA-915-5ACM screws onto the thread below the nut and points straight down. A saddle and a zip tie at the bottom of the stem keep the antenna in line.
- **Either side of the bulkhead, under the cell:** shelves that stick straight out from the plate. On the left one, the XIAO nRF52840 + Wio-SX1262 kit lies flat, with the LiFePO4 protection board beside it, outboard. The power bank's charge board lies flat on the right one, so both boards are perpendicular to the antenna rather than lying along it. The charge board's USB ports face the end of the crossbar, where the 5 V solar panel's cable plugs in. A zip tie through each shelf goes across each board (or use foam tape).
- **Above the cell:** a 6 mm cord hole. Tie a cord here and run it out through the roll-top with the solar cable, so the frame hangs from the cord rather than resting on the antenna's tip.

The cell crosses the antenna at right angles, above its feed, which keeps the metal can out of the antenna's near field far better than a cell running alongside the antenna would.

## Size

The frame is 158 × 147 × 55 mm. The protection board's shelf sets the depth, and the kit and protection board side by side set the width. With the antenna fitted, the whole thing is about 145 mm wide and 280 mm tall. Check that against the dry bag, leaving room for the roll-top's three folds.

## Printing

PETG, one piece, back face down. No supports: the shelves and the bulkhead wall print as upright walls, the saddles stop at the cell's and the antenna's centrelines, and the bulkhead's hole is peaked at 45°.

## Wiring

The XIAO's own charger charges to 4.2 V, which is too high for LiFePO4 (3.65 V max). It only runs while the XIAO's USB-C is powered, so unplug the cell, or check that the protection board cuts off at the LiFePO4 limit, before plugging into the XIAO to flash or configure it. The Kingboss board is made for LiFePO4, so the solar input charges the cell correctly. A full LiFePO4 cell (3.2–3.6 V) is within what the XIAO and the SX1262 run on directly.


Cell → protection board → charge board's battery pads; the kit's battery pads go to the cell through the same protection board. The pigtail's U.FL clips onto the Wio-SX1262. The protection board (KOOBOOK 3.2 V LiFePO4) sits on the left shelf: B+/B− to the cell, P+/P− to the XIAO's battery pads. The solar panel's USB cable runs in through the roll-top to the charge board.

## Not measured yet

The charge board's size is read off a photo (39 × 44 mm). The Kingboss's case is 150 × 40 × 50 mm, with the board standing across one end behind the ports, so the board can't be much over about 37 × 47. The frame takes that: the outboard tie slot is placed for 39 wide, and the shelf is 2 mm deeper than 44. How tall the board's parts stand isn't measured (9 mm assumed); there's 23 mm under the cell. The bulkhead is taken as standard N: 5/8-24 thread through a 16.4 mm hole, 3/4" hex nut. The 4 mm wall is checked against the pigtail: it leaves the antenna enough thread. The protection board is sized as a typical 1S 24 A board (50 × 25 × 4 mm), not measured. Not measured either: the room under the cell for the jack's body and the coax's bend (22 mm).

## Parts

Every part has its Amazon link in the parts list. The power bank (Kingboss 15000 mAh LiFePO4) supplies both the cell and the charge board. The radio is the Seeed XIAO nRF52840 & Wio-SX1262 kit. The coax is a Superbat N female bulkhead to U.FL pigtail. The antenna is the ALFA AOA-915-5ACM. The rest: a KOOBOOK LiFePO4 protection board, a 5 V 3 W solar panel, a Zanhour 2 L dry bag, and six zip ties.
