# Meshtastic Dry-Bag Node

A cheap Meshtastic/MeshCore repeater that lives in a 2 L dry bag hoisted into a tree, built from a Kingboss 15000 mAh LiFePO4 power bank taken apart. Two printed parts, a flat frame and a battery lid. The frame's back plate is a T with its corners filled in: it slopes straight in from the battery's ends to the top of the antenna's stem, so the stem is braced along its whole length. It stands antenna up:

- **Bottom:** the 32140 LiFePO4 cell (3.2 V, 15 Ah), shut in a housing that takes the knocks. The frame carries one half, and a lid closes it with four M3 × 16 cap screws through its end walls. The cell's leads come out of a hole at each end. The heavy end is at the bottom of the bag.
- **On the housing's top:** three pockets that the boards drop into from above, flat, so they're right next to the cell and perpendicular to the antenna. Left to right: the KOOBOOK LiFePO4 protection board, the XIAO nRF52840 + Wio-SX1262 kit, then a gap in the middle, then the power bank's charge board. The charge board's USB ports face the end, where the 5 V solar panel's cable plugs in. A square of foam tape under each board keeps it in its pocket.
- **Middle:** the Superbat pigtail's N female bulkhead (6" RG178 to U.FL) goes down through a 4 mm wall and clamps on its own panel nut on top. The jack's body and the coax hang into the space above the boards, and the U.FL clips onto the Wio-SX1262.
- **Top:** the ALFA AOA-915-5ACM screws onto the bulkhead and stands straight up. The frame's stem runs 70 mm up it to a saddle and a zip tie.

The cell crosses the antenna at right angles, below its feed, and every board's ground plane is perpendicular to it. That keeps metal out of the antenna's near field far better than anything running alongside it would.

## Size

The frame is 166 × 138 × 56 mm. With the antenna fitted, the node is about 166 mm wide and 272 mm tall. Check that against the dry bag, leaving room for the roll-top's three folds.

## Printing

PETG, no supports.

- **Frame**, back face down. The shelf and the bulkhead wall print as upright walls. The housing's half-cavity opens upward. The bulkhead's hole is peaked at 45°, and so is the underside of each pocket's front rim.
- **Battery lid**, front face down, cavity up. The counterbores are on the bed side.

## Assembly

1. Solder the leads to the cell's tabs, thread them through the end-wall holes, lay the cell in the frame's half, and screw the lid on.
2. Wire the cell's leads to the protection board's B+/B−. P+/P− go to the XIAO's battery pads and the charge board's battery pads.
3. Clamp the bulkhead through the wall, tighten its nut on top, clip the U.FL on, then drop the boards into their pockets on foam tape.
4. Screw the antenna on and zip-tie it to the stem's saddle. Run the solar cable in through the roll-top.

## Wiring

The XIAO's own charger charges to 4.2 V, which is too high for LiFePO4 (3.65 V max). It only runs while the XIAO's USB-C is powered, so unplug the cell, or check that the protection board cuts off at the LiFePO4 limit, before plugging into the XIAO to flash or configure it. The Kingboss board is made for LiFePO4, so the solar input charges the cell correctly. A full LiFePO4 cell (3.2–3.6 V) is within what the XIAO and the SX1262 run on directly.

## Not measured yet

- **Charge board:** its size is read off a photo (39 × 44 mm). The Kingboss's case is 150 × 40 × 50 mm, with the board standing across one end behind the ports, so the board can't be much over about 37 × 47. Its parts are assumed to stand 9 mm tall.
- **Protection board:** sized as a typical 1S 24 A board (50 × 25 × 4 mm).
- **Cell ends:** 3 mm is left past each end for the tabs and leads.
- **Above the boards:** 22 mm of room for the jack's body and the coax's bend.
- **Bulkhead:** taken as standard N, a 5/8-24 thread through a 16.4 mm hole with a 3/4" hex nut. The 4 mm wall leaves the antenna enough thread.

## Parts

Every bought part has its Amazon link in the parts list:
- Kingboss 15000 mAh LiFePO4 power bank: the cell and the charge board
- Seeed XIAO nRF52840 & Wio-SX1262 kit
- Superbat N female bulkhead to U.FL pigtail
- ALFA AOA-915-5ACM antenna
- KOOBOOK LiFePO4 protection board
- 5 V 3 W solar panel
- Zanhour 2 L dry bag

Plus four M3 × 16 cap screws, a zip tie, and foam tape.
