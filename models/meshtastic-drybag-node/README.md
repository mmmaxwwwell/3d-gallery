# Meshtastic Dry-Bag Node

A Meshtastic/MeshCore repeater in a sealed box that winches itself up into a tree. Throw a line over a branch or two and tie both ends to the node's reels. Each reel winds its end in, and the node climbs the line, with no tie line left hanging down. It's built from a Kingboss 15000 mAh LiFePO4 power bank taken apart.

## Layout

- **Box (TPU 64D, PCTG door):**
  - **Cell:** the 32140 LiFePO4 cell lies along the bottom in a seat. Two screwed PCTG straps lock it in place before the door goes on.
  - **Boards:** they stand flat on the back wall in two rows above the cell, each in a pocket, going straight in from the front:
    - lower row: the XIAO nRF52840 + Wio-SX1262 radio, then the charge board, its USB ports facing open space
    - upper row: the protection board, a DRV8833 motor driver, and a XIAO nRF52840 Sense, which runs the winch and levels the node with its IMU
  - **Motors:** a worm gearmotor stands in each end.
- **Reels:** two, behind the box, one at each end, as far out to the sides as they go. Each holds 150–200 ft (about 56 m) of 1/8" Dacron. The drums run front to back, square to the line's pull, so the line comes straight up off them. Each is driven by its own motor through the back wall. Worm gears can't be back-driven, so the node holds its height with the power off.
- **Rear frame (PCTG):** an upright behind the reels carries their outer axles, and a floor under the box screws to its bottom. The solar panel hangs from the upright at 45°, facing back and up. The battery and the panel are the ballast.
- **Antenna:** the N bulkhead clamps through the roof, and the ALFA AOA-915-5ACM stands up from it, zip-tied at two heights to a short stem. The back plate slopes up to the stem with a rounded rib at its foot.
- **Solar:** your 5/8" watertight connector goes in the door, in front of the charge board.

## How it seals

- **Door:** a tongue round its back is 0.6 mm wider than the groove round the TPU rim, so the TPU grips it from both sides. The seal doesn't depend on screw force. Fourteen M5 × 10 screws in ears outside the seal hold the door on: a pair either side of every corner, one mid-height in each end, two along the top and two along the bottom.
- **Reel shafts:** each reel's hub goes through a hole in the TPU back wall that's 0.4 mm tight, lengthened by a boss inside.
- **Antenna:** the bulkhead's O-ring seals the roof.
- **Solar connector:** it seals the door.

## Screws

Every M5 × 10 gets 8 mm of thread. Each part it goes through is counterbored to leave 2 mm under the cap head, and every pilot is 9 mm deep. The reels' outer axles are M5 × 25 bolts, threaded 8 mm into the rear frame. Each reel turns on its bolt's shank.

## Printing

No supports anywhere.

| Part | Material | Orientation | Qty |
|---|---|---|---|
| Body | TPU 64D | back face down | 1 |
| Door | PCTG | front face down | 1 |
| Battery strap | PCTG | front face down | 2 |
| Reel | PCTG | on its outer flange | 2 |
| Rear frame | PCTG | on the upright's back face | 1 |

On the rear frame, the floor, gussets and side plates rise as walls, and the panel's frame climbs from the upright at 45°.

## Wiring

The XIAO's own charger charges to 4.2 V, which is too high for LiFePO4 (3.65 V max). It only runs while the XIAO's USB-C is powered, so unplug the cell, or check that the protection board cuts off at the LiFePO4 limit, before plugging into the XIAO. The Kingboss board is made for LiFePO4, so the solar input charges the cell correctly.

## Not settled yet

- **Motors:** a full reel needs about 7 kg·cm to lift the node. JGY-370 worm motors can do that, but probably at 6–12 V, not the cell's 3.2 V, so expect a boost converter. The ratio and voltage aren't picked.
- **Weight:** the printed parts come to about 1.6 kg at 100% infill. The rear frame and the reels are the heavy ones; they could be lightened with cut-outs.
- **Pitch:** the line pulls from behind the box, so the node will hang tilted back until the weight behind balances it.
- **Not measured:** every board, the motors, the solar panel (145 × 120 mm assumed), the bulkhead's body, and your connector's panel range.

## Parts

Every bought part has its Amazon link in the parts list where there is one:
- Kingboss 15000 mAh LiFePO4 power bank: the cell and the charge board
- XIAO nRF52840 & Wio-SX1262 kit
- Superbat N bulkhead pigtail
- ALFA AOA-915-5ACM antenna
- KOOBOOK LiFePO4 protection board
- 5 V 3 W solar panel
- Zanhour dry bag (optional now)

Plus:
- two JGY-370 worm motors, a XIAO nRF52840 Sense and a DRV8833
- two 50–60 m lengths of 1/8" Dacron
- your 5/8" connector
- twenty M5 × 10 cap screws and two M5 × 25 bolts
- two zip ties and foam tape
