# Meshtastic Dry-Bag Node

A Meshtastic/MeshCore repeater in a sealed body that winches itself up into a tree. Throw a line over a branch or two and tie both ends to the node's reels. Each reel winds its end in, and the node climbs the line, with no tie line left hanging down. It's built from a Kingboss 15000 mAh LiFePO4 power bank taken apart.

## Layout

Everything heavy hangs underneath the two points the lines pull from, so the node hangs level.

- **Body (TPU 64D):** a tube along the bottom, exactly as deep as the reels and no wider than them, with a narrow tower rising between the reels. It opens at three places: both ends, and the tower's top.
  - **In the tube:** the two worm gearmotors lie across its back and the 32140 cell lies in V cradles across its middle. Both slide in from the ends.
  - **Left end door:** the protection board, on its inside.
  - **Right end door:** the winch XIAO nRF52840 Sense and the DRV8833, beside a post that holds the cell against its stop.
  - **Tower cap:** the N bulkhead clamps through it, and a sled hangs from it into the tower. The sled carries the XIAO nRF52840 + Wio-SX1262 radio at its top, well inside the pigtail's 6", and the charge board at its foot, so they lift out together. The rest of the sled's back face (44 × 70 mm) is kept free, so a 1 W module can go in instead of the kit.
  - **Antenna:** it stands up from the bulkhead, zip-tied to a stem screwed onto the cap.
- **Reels:** one either side of the tower. Each holds 150–200 ft (about 56 m) of 1/8" Dacron. The line's end wedges into a V jam cleat at the core's front end, under the front flange.
- **Drive:** each motor's shaft comes out through the back wall to a pinion, which drives an idler, which drives a gear ring that is the reel's rear flange (4.7:1). Worm gears can't be back-driven, so the node holds its height with the power off.
- **Cradles (PCTG, flat-pack):** each reel turns on M5 axles between its own two plates, each a full ring round the reel. Every piece prints flat, loaded along its strong axis.
  - The front plate screws flat onto the body's front face.
  - The rear plate stands behind the gears on four posts screwed into the back wall, and carries the idler's bolt.
  - Five linking bars tie each ring all the way round, except on the tower's side. Every bar's ends are dovetails that slide into sockets in the plates, locked with a screw.
- **Fairleads:** a box of four rollers sits on top of each reel's outer edge. The line runs through the square window between them: the lower pair holds it centred front to back, the upper pair side to side. It only ever touches rollers.
  - The box's two cheeks dovetail into towers on the front and rear plates, which take the line's sideways pull in their own plane. Two spacers between the cheeks square the box and carry the upper rollers.
  - Each roller is two print-in-place roller bearings back to back on an M5 bolt that clamps their hubs. Give each a drop of silicone oil.
- **Solar panel:** it hangs under the body at 45°, facing back and up, its edges in grooves in two truss plates screwed up into the floor. Where it sits front to back (`panel_y`) is what levels the node.
- **Solar connector:** your 5/8" watertight connector goes through the tower's front wall, above the charge board.

## How it seals

- **Openings:** each end door and the tower cap has a tongue round it that's 0.6 mm wider than the groove round its TPU rim, so the TPU grips it from both sides. The seal doesn't depend on screw force. M5 × 10 screws in flanges outside the seal hold them on: three along each end's top and bottom, four along each side of the tower's top.
- **Motor shafts:** each pinion's hub goes through a hole in the TPU back wall that's 0.4 mm tight.
- **Antenna:** the bulkhead's O-ring seals the cap.
- **Solar connector:** it seals the tower's front wall.

Every cradle and panel screw goes into a blind pilot in the floor, the top band or the flanges. Nothing else goes through the body.

## Screws

Every M5 × 10 gets 8 mm of thread. Each part it goes through is counterbored to leave 2 mm under the cap head, and every pilot is 9 mm deep.

Longer bolts:
- **Reel axles:** M5 × 25s threaded 8 mm into each cradle plate. Each reel turns on their shanks.
- **Rollers:** M5 × 70s clamp each roller's hubs between the cheeks (lower pair) or the spacers (upper pair).
- **Idlers:** each turns on an M5 × 16 threaded through the rear plate.
- **Pinions:** an M3 grub screw on the shaft's flat holds each one, and pulls its motor onto the back wall.

## Printing

No supports. Every hole is round, with no teardrops, so the body's sideways holes (the screw pilots) print with a little sag at their tops.
- **Body:** the cell's cradles are 45° V's, the cell's stop hangs at 45°, and the flanges' corners are cut at 45°, so nothing in it prints as a shelf.
- **Roller halves:** each prints as one piece. The hub, the sleeve and seven pins all start on the bed with 0.25 mm between them, and the pins' 45° collars run in V grooves in both races. Work them free, then oil them.

| Part | Material | Orientation | Qty |
|---|---|---|---|
| Body | TPU 64D | back face down | 1 |
| End door | PCTG | outer face down | 1 right, 1 left |
| Tower cap with sled | PCTG | upside down, sled up | 1 |
| Antenna stem | PCTG | flat | 1 |
| Reel | PCTG | on its gear ring | 2 |
| Reel front flange | PCTG | flat | 2 |
| Pinion | PCTG | gear down | 2 |
| Idler | PCTG | flat | 2 |
| Front cradle plate | PCTG | flat, sockets up | 1 right, 1 left |
| Rear cradle plate | PCTG | flat, posts up | 1 right, 1 left |
| Linking bar | PCTG | flat | 10 |
| Fairlead cheek | PCTG | flat | 2 outer, 2 inner |
| Fairlead spacer | PCTG | flat | 2 front, 2 back |
| Roller half | PCTG | on end | 16 |
| Panel plate | PCTG | flat, groove up | 1 right, 1 left |

Every piece fits a 270 mm bed. The body is the longest at 266 mm; the cradle plates the tallest at 257 mm.

## Wiring

The XIAO's own charger charges to 4.2 V, which is too high for LiFePO4 (3.65 V max). It only runs while the XIAO's USB-C is powered, so unplug the cell, or check that the protection board cuts off at the LiFePO4 limit, before plugging into the XIAO. The Kingboss board is made for LiFePO4, so the solar input charges the cell correctly.

## Not settled yet

- **Motors:** a full reel needs about 7 kg·cm at the drum to lift the node; the gears take 4.7× off the motor. JGY-370 worm motors probably need 6–12 V for it, not the cell's 3.2 V, so expect a boost converter. The ratio and voltage aren't picked.
- **Weight and level:** about 2.5 kg at 60% infill with the bought parts' guessed weights, 3.2 kg with both reels full. Its centre of mass comes out about 3 mm behind the lines and 130 mm below the fairleads, so it should hang within about 1° of level. The panel's position, `panel_y`, trims it, but moving it forward would put it in the body's shade.
- **Roller bearings:** printed at 0.25 mm, from what people print these at (0.2–0.3 mm). PCTG on the U1 at that gap is untested. If they fuse, open `pip_c` up.
- **Not measured:** every board, the motors (envelope, shaft position on the gearbox), the solar panel (145 × 120 mm assumed), the bulkhead's body, and your connector's panel range.

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
- ninety-six M5 × 10 cap screws, four M5 × 25s, eight M5 × 70s, four M5 × 16s and two M3 grub screws
- silicone oil for the rollers
- two zip ties and foam tape
