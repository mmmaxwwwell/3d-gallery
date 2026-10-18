# Meshtastic Dry-Bag Node

A Meshtastic/MeshCore repeater in a sealed box that winches itself up into a tree. Throw a line over a branch or two and tie both ends to the node's reels. Each reel winds its end in, and the node climbs the line, with no tie line left hanging down. It's built from a Kingboss 15000 mAh LiFePO4 power bank taken apart.

## Layout

Everything heavy is in the box, low between the two points the lines pull from, so the node hangs level.

- **Box (TPU 64D):** one box in the middle, between the reels. It opens front and back.
  - **Back door:** the two worm gearmotors stand on it side by side, their shafts out through TPU grommets. The charge board sits over them. Take the door off and the motors come with it.
  - **Front door:** the protection board, the winch XIAO nRF52840 Sense and the DRV8833. Two saddles hold the 32140 cell standing up in front of the left motor.
  - **Right wall:** the XIAO nRF52840 + Wio-SX1262 radio, just under the N bulkhead in the box's top, well inside the pigtail's 6". The space under it (40 × 70 × 18 mm) is kept free, so a 1 W module can go in instead.
  - **Top:** the bulkhead, and your 5/8" solar connector beside it.
- **Reels:** one either side of the box. Each holds 150–200 ft (about 56 m) of 1/8" Dacron. The line's end wedges into a V jam cleat at the core's front end, under the front flange.
- **Drive:** each motor's shaft drives a pinion, which drives an idler, which drives a gear ring that is the reel's rear flange (4.7:1), all behind the back door. Worm gears can't be back-driven, so the node holds its height with the power off.
- **Reel holders (PCTG, flat-pack):** every piece prints flat, loaded along its strong axis.
  - Each reel turns on M5 axles between a front plate and a rear plate. Each plate is a ring round the reel with spokes; its flat outer part rises over the reel's outer edge and carries the rollers.
  - Five crossmembers tie the two rings all the way round, except on the box's side. Their ends are dovetails that slide into sockets in the plates, locked with a screw.
  - A side plate bolts flat to the box's side flanges. The front plate slides onto its front edge, and the rear plate screws onto its back edge.
  - Two bridges over the box tie the two side plates together. The front one rises into the antenna's stem, with zip-tie slots.
- **Rollers:** two on each reel's outer edge, either side of the line, running front to back from plate to plate. The line runs between them and can move along them as it winds across the drum. Each roller is one print-in-place roller bearing its whole length on an M5 bolt that clamps its hub between the plates. Give each a drop of silicone oil.
- **Solar panel:** it hangs under the box at 45°, facing back and up. Its top and bottom edges sit in grooved bars that pass through a spine screwed up into the box's floor. Where it sits front to back (`panel_y`) is what levels the node.

## How it seals

- **Doors:** each door has a tongue round it that's 0.6 mm wider than the groove round the TPU rim, so the TPU grips it from both sides. The seal doesn't depend on screw force. Fourteen M5 × 10 screws per door, in flanges outside the seal, hold it on.
- **Motor shafts:** each pinion's hub runs in a TPU grommet pressed into the back door, 0.4 mm tight on the hub.
- **Antenna:** the bulkhead's O-ring seals the box's top.
- **Solar connector:** it seals the box's top.

The side plates and the panel spine screw into blind pilots in the flanges and the floor. Nothing else goes through the box.

## Screws

Every M5 × 10 gets 8 mm of thread. Each part it goes through is counterbored to leave 2 mm under the cap head, and every pilot is 9 mm deep.

Longer bolts:
- **Reel axles:** M5 × 25s threaded 8 mm into each holder plate. Each reel turns on their shanks.
- **Rollers:** M5 × 100s from the rear plate, through each roller's hub, threaded into the front plate.
- **Idlers:** each turns on an M5 × 16 threaded through the rear plate.
- **Pinions:** an M3 grub screw on the shaft's flat holds each one, and pulls its motor onto the back door.

## Printing

No supports. Every hole is round, with no teardrops.
- **Box:** it prints back face down. The front flange tapers out at 45°, and nothing inside starts as a shelf.
- **Rollers:** each prints standing up in one piece. The hub, the sleeve and seven pins all start on the bed with 0.25 mm between them, and the pins' two 45° collars run in V grooves in both. Work them free, then oil them.

| Part | Material | Orientation | Qty |
|---|---|---|---|
| Box | TPU 64D | back face down | 1 |
| Shaft grommet | TPU 64D | lip down | 2 |
| Front door, back door | PCTG | outer face down | 1 each |
| Reel | PCTG | on its gear ring | 2 |
| Reel front flange | PCTG | flat | 2 |
| Pinion | PCTG | gear down | 2 |
| Idler | PCTG | flat | 2 |
| Front holder plate | PCTG | flat, sockets up | 1 right, 1 left |
| Rear holder plate | PCTG | flat, sockets up | 1 right, 1 left |
| Side plate | PCTG | flat, counterbores up | 1 right, 1 left |
| Bridge, antenna bridge | PCTG | flat | 1 each |
| Crossmember | PCTG | flat | 10 |
| Roller | PCTG | on end | 4 |
| Panel spine | PCTG | flat | 1 |
| Panel bar | PCTG | flat | 2 |

Every piece fits a 270 mm bed. The box is the tallest piece at 206 mm with its flanges.

## Wiring

The XIAO's own charger charges to 4.2 V, which is too high for LiFePO4 (3.65 V max). It only runs while the XIAO's USB-C is powered, so unplug the cell, or check that the protection board cuts off at the LiFePO4 limit, before plugging into the XIAO. The Kingboss board is made for LiFePO4, so the solar input charges the cell correctly.

## Not settled yet

- **Motors:** a full reel needs about 7 kg·cm at the drum to lift the node; the gears take 4.7× off the motor. JGY-370 worm motors probably need 6–12 V for it, not the cell's 3.2 V, so expect a boost converter. The ratio and voltage aren't picked.
- **Weight and level:** about 2.3 kg at 60% infill with the bought parts' guessed weights, 2.9 kg with both reels full. Its centre of mass comes out about 2 mm behind the lines and 80 mm below the rollers, so it should hang within about 2° of level. `panel_y` trims it, but moving the panel forward would put it in the box's shade.
- **Roller bearings:** printed at 0.25 mm, from what people print these at (0.2–0.3 mm). The rollers' pins are 84 mm tall and 5 mm thick, and PCTG on the U1 at that gap is untested. If they fuse, open up `pip_c`.
- **Not measured:** every board, the motors (envelope, shaft position, and whether the shaft is centred across the gearbox), the solar panel (145 × 120 mm assumed), the bulkhead's body, and your connector's panel range.

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
- eighty-seven M5 × 10 cap screws, four M5 × 25s, four M5 × 100s, two M5 × 16s and two M3 grub screws
- silicone oil for the rollers
- two zip ties and foam tape
