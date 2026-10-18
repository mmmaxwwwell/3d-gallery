# Meshtastic Dry-Bag Node

A Meshtastic/MeshCore repeater in a sealed box that winches itself up into a tree. Throw a line over a branch or two and tie both ends to the node's reels. Each reel winds its end in, and the node climbs the line, with no tie line left hanging down. It's built from a Kingboss 15000 mAh LiFePO4 power bank taken apart.

## Layout

- **Box (TPU 64D, PCTG door):**
  - **Posts:** four sealed screw posts take door screws, three in a line over the battery cup and one at the top.
  - **Boards:** they stand flat on the back wall in pockets above the posts, going straight in from the front:
    - along the bottom: the protection board and the XIAO nRF52840 + Wio-SX1262 radio
    - over them: the charge board, standing with its USB ports up into open space; then a XIAO nRF52840 Sense, which runs the winch and levels the node with its IMU, with a DRV8833 motor driver above it
  - **Motors:** a worm gearmotor stands in each end.
- **Reels:** two, behind the box, one at each end, as far out to the sides as they go. Each holds 150–200 ft (about 56 m) of 1/8" Dacron on a 112 mm reel. The line's end wedges into a V jam cleat in the drum's core. The drums run front to back, square to the line's pull, so the line comes straight up off them. Each is driven by its own motor through the back wall. Worm gears can't be back-driven, so the node holds its height with the power off.
- **Cage (PCTG, flat-pack):** it cradles each reel's lower half, following its curve. Every piece prints flat, loaded along its strong axis:
  - a back plate screwed flat to the box's back
  - an outside plate behind the reels carrying their outer axles, both as half rings round the reels
  - five linking bars between the plates, tying the cradles' corners

  Each bar's ends are dovetails that slide into sockets in the plates, locked with a screw.
- **Panel plates:** under each reel, a panel plate fills the rectangle between the two cage plates as that reel's bottom crossmember. Behind, it comes out as a truss: a top member, a member along the panel, and a diagonal crossmember.
- **Solar panel:** its edges sit in grooves cut into the two panel plates, behind the reels, facing back and up at 45°. The plates are just outside its edges, so nothing shades it.
- **Battery cup:** the 32140 LiFePO4 cell sits in a cup on the box's back, under the reels. The cup is printed on its own and is open toward the box. Its rim seals into a groove round the back wall the same way the door does, with screws in ears outside the seal. The cell's leads come straight into the box through a window in the back wall.
- **Antenna:** it stands on a PCTG mast 100 mm above the roof, with the N bulkhead clamped through the mast's top. The mast's flange seals to the roof with a tongue ring and four screws, and the back plate's stem braces it with two zip ties. The pigtail needs to be the 12" one.
- **Solar:** your 5/8" watertight connector goes in the door, in front of the charge board.

## How it seals

- **Door:** a tongue round its back is 0.6 mm wider than the groove round the TPU rim, so the TPU grips it from both sides. The seal doesn't depend on screw force. Nineteen M5 × 10 screws in ears outside the seal hold the door on: five up each end, five along the bottom, and four along the top. The top's middle screw goes into the top post. Four more go into the sealed posts inside, and each post's end is squeezed by the door round its own screw.
- **Reel shafts:** each reel's hub goes through a hole in the TPU back wall that's 0.4 mm tight, lengthened by a boss inside.
- **Antenna:** the bulkhead's O-ring seals the roof.
- **Solar connector:** it seals the door.

## Screws

Every M5 × 10 gets 8 mm of thread. Each part it goes through is counterbored to leave 2 mm under the cap head, and every pilot is 9 mm deep. The reels' outer axles are M5 × 25 bolts, threaded 8 mm into the cage's outside plate. Each reel turns on its bolt's shank.

## Printing

No supports. Every hole is round, with no teardrops, so the body's sideways holes (the reel hubs, the cup window, the screw pilots) print with a little sag at their tops.

| Part | Material | Orientation | Qty |
|---|---|---|---|
| Body | TPU 64D | back face down | 1 |
| Door | PCTG | front face down | 1 |
| Reel | PCTG | on its outer flange | 2 |
| Cage back plate, outside plate | PCTG | flat, sockets up | 1 each |
| Linking bar | PCTG | flat | 5 |
| Battery cup | PCTG | rim up | 1 |
| Antenna mast | PCTG | upside down | 1 |
| Panel plate | PCTG | flat, groove up | 2 (one flipped) |

Every piece fits a 270 mm bed.

## Wiring

The XIAO's own charger charges to 4.2 V, which is too high for LiFePO4 (3.65 V max). It only runs while the XIAO's USB-C is powered, so unplug the cell, or check that the protection board cuts off at the LiFePO4 limit, before plugging into the XIAO. The Kingboss board is made for LiFePO4, so the solar input charges the cell correctly.

## Not settled yet

- **Motors:** a full reel needs about 7 kg·cm to lift the node. JGY-370 worm motors can do that, but probably at 6–12 V, not the cell's 3.2 V, so expect a boost converter. The ratio and voltage aren't picked.
- **Weight:** the printed parts come to about 1.5 kg at 100% infill.
- **Pitch:** with the cell in the cup, the node hangs tipped forward about 20–25°. The panel isn't heavy enough to level it.
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
- fifty-five M5 × 10 cap screws and two M5 × 25 bolts
- two zip ties and foam tape
