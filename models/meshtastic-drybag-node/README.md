# Meshtastic Dry-Bag Node

A cheap Meshtastic/MeshCore repeater in a sealed, screw-together box that stands antenna up in a tree for years. It's built from a Kingboss 15000 mAh LiFePO4 power bank taken apart, and made for a Snapmaker U1. Three printed parts:
- the frame, in PETG
- its seal, in TPU, printed in place in the same print
- the cover, in PETG

## Layout

- **Bottom:** the 32140 LiFePO4 cell (3.2 V, 15 Ah), in a half-round seat across the box. Three ribs on the cover hold it there. The heavy end is down.
- **On a shelf over the cell:** pockets that the boards drop into, flat, perpendicular to the antenna, each on a square of foam tape:
  - left: the KOOBOOK LiFePO4 protection board, lying along the cell
  - right: the XIAO nRF52840 + Wio-SX1262 kit, then the power bank's charge board, with its USB ports facing the right end
  - The cell's leads come up through a hole beside the protection board.
- **Roof:** the Superbat pigtail's N female bulkhead goes up through it. Its O-ring seals on the inside, and its panel nut is on top. The jack's body and the coax hang into the space above the boards, and the U.FL clips onto the Wio-SX1262.
- **Above:** the ALFA AOA-915-5ACM screws onto the bulkhead and stands straight up. The back plate slopes up from the box's top corners to a stem 70 mm up the antenna, with a saddle and a zip tie.
- **Right end:** a PG7 cable gland for the solar panel's cable, beside the charge board's ports.

The cell crosses the antenna at right angles, below its feed, and every board's ground plane is perpendicular to it. That keeps metal out of the antenna's near field.

## How it seals

It's the usual recipe for printed waterproof boxes: a TPU gasket in a groove round the rim, squeezed 15–25% by a lid clamped evenly all round.

- **Groove:** 3 mm wide and 2.5 mm deep, round the middle of the frame's 9 mm rim.
- **TPU bead:** 1.6 mm wide, printed into the groove in the same print as the frame, standing 0.5 mm proud. When the cover goes down flat on the rim, it squeezes the bead about 17%. The bead is narrower than the groove so the squeezed TPU has room to spread. TPU doesn't compress in volume, so a groove filled solid would stop the cover closing.
- **Screws:** ten M3 × 12 cap screws run down the middle of the seal, four along the top, four along the bottom and one in each end, in counterbores in the cover. Round each one, the bead widens into a disc that the screw threads through on its way into a blind pilot, so the squeezed disc seals the screw's own hole.
- **Antenna:** the bulkhead's own O-ring seals the roof.
- **Solar cable:** the PG7 gland (IP68) seals round it. Its plug won't go through the gland. Cut the plug off, pass the cable through, and solder it to the charge board's input, or fit a new plug inside.

With the box sealed, the dry bag is optional. It's still a cheap outer layer over the gland and the antenna's joint.

## Printing (Snapmaker U1)

- **Frame + seal:** one print, back face down. PETG for `frame.stl`, TPU for `frame-gasket.stl`, loaded as one object with a part per filament. They're already in the same place.
  - Print the TPU at 100% infill with concentric lines. Infill gaps in a gasket are leak paths.
  - Any TPU from 85A to 95A works. Softer squeezes easier, and 95A prints cleanest.
  - The frame walls are 9 mm; give it 4+ walls and solid infill near the rim so the screws have plastic to bite.
- **Cover:** PETG, front face down. The counterbores are on the bed side.
- No supports anywhere. The shelf, end walls and roof print as upright walls. The cell seat opens upward. The roof's bulkhead hole, the gland hole, their reliefs and the lead hole are all peaked at 45°, and so is the underside of each pocket's front rim.

## Assembly

1. Solder the leads to the cell's tabs, lay the cell in its seat, and bring the leads up through the hole in the shelf.
2. Wire the cell to the protection board's B+/B−. P+/P− go to the XIAO's battery pads and the charge board's battery pads.
3. Push the bulkhead up through the roof from inside and tighten its nut on top. Clip the U.FL on.
4. Fit the gland in the right end wall, feed the solar cable through it and wire it to the charge board. Tighten the gland's cap.
5. Drop the boards into their pockets on foam tape.
6. Put the cover on and tighten the ten screws a little at a time, round and round, until the cover sits flat on the rim all the way round.
7. Screw the antenna on and zip-tie it to the stem's saddle.

## Wiring

The XIAO's own charger charges to 4.2 V, which is too high for LiFePO4 (3.65 V max). It only runs while the XIAO's USB-C is powered, so unplug the cell, or check that the protection board cuts off at the LiFePO4 limit, before plugging into the XIAO to flash or configure it. The Kingboss board is made for LiFePO4, so the solar input charges the cell correctly. A full LiFePO4 cell (3.2–3.6 V) is within what the XIAO and the SX1262 run on directly.

## Size

The box is 174 × 82 × 57 mm with the cover on, and the stem takes the frame to 152 mm tall. With the antenna fitted, the node is about 286 mm tall.

## Not measured yet

- **Charge board:** its size is read off a photo (39 × 44 mm). The Kingboss's case is 150 × 40 × 50 mm, with the board standing across one end, so the board can't be much over about 37 × 47. Its parts are assumed to stand 9 mm tall.
- **Protection board:** sized as a typical 1S 24 A board (50 × 25 × 4 mm).
- **Cell ends:** 3 mm is left past each end for the tabs.
- **Above the boards:** 28 mm for the jack's body and the coax's bend.
- **Bulkhead:** the body/O-ring relief is 24 mm across. The thread is taken as standard N (5/8-24, 3/4" nut), and the 4 mm roof under it leaves the antenna enough thread.
- **Gland:** the PG7's thread is assumed to take a 4 mm panel.

## Parts

Every bought part has its Amazon link in the parts list:
- Kingboss 15000 mAh LiFePO4 power bank: the cell and the charge board
- Seeed XIAO nRF52840 & Wio-SX1262 kit
- Superbat N female bulkhead to U.FL pigtail
- ALFA AOA-915-5ACM antenna
- KOOBOOK LiFePO4 protection board
- 5 V 3 W solar panel
- PG7 cable gland
- Zanhour 2 L dry bag (optional)

Plus ten M3 × 12 cap screws, a zip tie, and foam tape.
