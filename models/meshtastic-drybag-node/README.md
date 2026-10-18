# Meshtastic Dry-Bag Node

A cheap Meshtastic/MeshCore repeater in a sealed, screw-together box that stands antenna up in a tree for years. It's built from a Kingboss 15000 mAh LiFePO4 power bank taken apart. Two printed parts:
- the body, in TPU 64D
- the door, in PCTG

## Layout

- **Bottom:** the 32140 LiFePO4 cell (3.2 V, 15 Ah), in a half-round seat across the box. Three ribs on the door hold it there. The heavy end is down.
- **On a shelf over the cell:** pockets that the boards drop into, flat, perpendicular to the antenna, each on a square of foam tape:
  - left: the KOOBOOK LiFePO4 protection board, lying along the cell
  - right: the XIAO nRF52840 + Wio-SX1262 kit, then the power bank's charge board, its USB ports facing the right end
  - The cell's leads come up through a hole beside the protection board.
- **Roof:** the Superbat pigtail's N female bulkhead goes up through it. Its O-ring seals on the inside, and its panel nut is on top. The U.FL clips onto the Wio-SX1262.
- **Above:** the ALFA AOA-915-5ACM screws onto the bulkhead and stands straight up. It's zip-tied at two heights to a short stem, with a saddle between the ties. The back plate slopes up to the stem from the box's top corners, with a rounded rib along its foot for strength.
- **Right end:** your 5/8" watertight connector for the solar panel, in a plain round hole beside the charge board's ports.

The cell crosses the antenna at right angles, below its feed, and every board's ground plane is perpendicular to it. That keeps metal out of the antenna's near field.

## How it seals

- **Tongue in a groove:** the door has a tongue running round its back. It's 2.2 mm wide, and it goes into a 1.6 mm groove round the TPU body's rim. The TPU either side of the groove flexes out and grips the tongue from both sides, so the seal doesn't depend on how hard the screws are tightened. The tongue's tip is narrower than the groove, so it leads itself in, and it stops short of the groove's floor.
- **Screws:** twelve M5 × 10 screws thread straight into the TPU, in ears outside the seal. They only hold the door on; water reaching a screw is outside the seal. Each ear flares into the wall instead of standing off it, for plenty of TPU round each screw. There's a pair either side of every corner, sharing one solid corner block, plus two along the top and two along the bottom.
- **Antenna:** the bulkhead's own O-ring seals the roof.
- **Solar:** your 5/8" watertight connector seals the end wall.

With the box sealed, the dry bag is optional. It's still a cheap outer layer over the connectors.

## Printing

- **Body:** TPU 64D, back face down. The stiffer TPU is what lets the screws bite and the groove grip. Give it 4+ walls and solid infill round the rim and the ears.
- **Door:** PCTG, front face down, tongue up.
- No supports. The shelf, end walls and roof print as upright walls. The cell seat opens upward. The roof's bulkhead hole, its relief and the lead hole are peaked at 45°, and so is the underside of each pocket's front rim. The solar connector's hole is round, as asked.

## Assembly

1. Solder the leads to the cell's tabs, lay the cell in its seat, and bring the leads up through the hole in the shelf.
2. Wire the cell to the protection board's B+/B−. P+/P− go to the XIAO's battery pads and the charge board's battery pads.
3. Push the bulkhead up through the roof from inside and tighten its nut on top. Clip the U.FL on.
4. Fit the solar connector in the right end wall and wire it to the charge board's input.
5. Drop the boards into their pockets on foam tape.
6. Press the door on, so the tongue goes into the groove all the way round, and drive the twelve screws.
7. Screw the antenna on and zip-tie it to the stem.

## Wiring

The XIAO's own charger charges to 4.2 V, which is too high for LiFePO4 (3.65 V max). It only runs while the XIAO's USB-C is powered, so unplug the cell, or check that the protection board cuts off at the LiFePO4 limit, before plugging into the XIAO to flash or configure it. The Kingboss board is made for LiFePO4, so the solar input charges the cell correctly. A full LiFePO4 cell (3.2–3.6 V) is within what the XIAO and the SX1262 run on directly.

## Size

The box is 168 × 76 × 55 mm with the door on, and 185 mm wide across the screw ears. The stem takes the body to 110 mm tall overall. With the antenna fitted, the node is about 280 mm tall.

## Not measured yet

- **Charge board:** its size is read off a photo (39 × 44 mm). The Kingboss's case is 150 × 40 × 50 mm, with the board standing across one end, so the board can't be much over about 37 × 47. Its parts are assumed to stand 9 mm tall.
- **Protection board:** sized as a typical 1S 24 A board (50 × 25 × 4 mm).
- **Cell ends:** 3 mm is left past each end for the tabs.
- **Above the boards:** 28 mm for the jack's body and the coax's bend.
- **Seal:** the tongue's 0.3 mm a side of grip needs a test print in your TPU 64D.
- **Bulkhead:** the body/O-ring relief is 24 mm across. The thread is taken as standard N (5/8-24, 3/4" nut), and the 4 mm roof under it leaves the antenna enough thread.
- **Solar connector:** the hole is 5/8" plus 0.4 mm, through a 6 mm wall; check your connector's panel range.

## Parts

Every bought part has its Amazon link in the parts list:
- Kingboss 15000 mAh LiFePO4 power bank: the cell and the charge board
- Seeed XIAO nRF52840 & Wio-SX1262 kit
- Superbat N female bulkhead to U.FL pigtail
- ALFA AOA-915-5ACM antenna
- KOOBOOK LiFePO4 protection board
- 5 V 3 W solar panel
- Zanhour 2 L dry bag (optional)

Plus your 5/8" watertight connector, twelve M5 × 10 screws, two zip ties, and foam tape.
