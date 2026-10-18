# Meshtastic Dry-Bag Node

A Meshtastic/MeshCore repeater in a sealed box that winches itself up into a tree. Throw a line over a branch or two and tie both ends to the node's reels. Each reel winds its end in, and the node climbs the line, with no tie line left hanging down. It's built from a Kingboss 15000 mAh LiFePO4 power bank taken apart.

## Layout

Everything heavy is in the box, low between the two points the lines pull from, and the panel hangs where it levels the node.

- **Box (TPU 64D):** one box in the middle, between the reels. It's as deep as the reels plus a little in front, and opens front and back.
  - **Back door:** the two worm gearmotors stand on it side by side, their shafts out through TPU grommets to the gears. The charge board sits over them.
  - **Front door:** the protection board, the winch XIAO nRF52840 Sense and the DRV8833. Two saddles hold the 32140 cell standing up against it.
  - **Right wall:** the XIAO nRF52840 + Wio-SX1262 radio, just under the N bulkhead in the box's top, well inside the pigtail's 6". The space under it (40 × 70 × 18 mm) is kept free, so a 1 W module can go in instead.
  - **Top:** the bulkhead, your 5/8" solar connector beside it, and the antenna's stem, which is part of the box.
- **Reels:** one either side of the box. Each holds 150–200 ft (about 56 m) of 1/8" Dacron. The line's end wedges into a V jam cleat at the core's front end, under the front flange.
- **Drive:** behind the back door, under a shroud on each side. Each motor's pinion drives an idler, which drives a gear ring that is the reel's rear flange (4.7:1). They're 12 mm wide 30° herringbones. Worm gears can't be back-driven, so the node holds its height with the power off.
- **Reel holders (PCTG):** two big flat skeleton plates per reel, each inside 220 × 220 mm. Each is a ring round the reel with spokes, and its flat outer part rises over the reel's outer edge to carry the rollers. Members run from the ring's top and bottom, and from the roller window's top, to the top and bottom of the plate's mounting edge, so each plate is braced against the box. Five crossmembers tie the two rings round the reel, their dovetailed ends locked with a screw.
  - **Channels:** each plate's inner edge sits in a channel on the box's side and screws in. The rear plate seats on the back flange's front face, the front plate on a rib, each against a lip.
  - **Bearings:** the reel's core turns in a bearing bore in the rear plate, its front axle in the front plate, and its rear axle in the shroud.
- **Rollers:** four on each reel's outer edge, round a square window the line runs through, so it's held both ways.
  - The lower pair runs front to back from plate to plate and holds the line side to side.
  - The upper pair runs across between two cheeks dovetailed into the plates, and holds it front to back.
  - Each roller is one print-in-place roller bearing its whole length on an M5 bolt that clamps its hub. Give each a drop of silicone oil.
- **Solar panel:** it hangs under the front of the box at 45°, facing forward and up, clear of the box's shade. The gears, shrouds and motors are all behind the lines, and the panel in front is what levels the node. Its top and bottom edges sit in grooved bars through a spine screwed up into the floor. `panel_side` hangs it behind instead.

## How it seals

- **Doors:** each door has a tongue round it that's 0.6 mm wider than the groove round the TPU rim, so the TPU grips it from both sides. The seal doesn't depend on screw force. Fourteen M5 screws per door, in flanges outside the seal, hold it on.
- **Motor shafts:** each pinion's hub runs in a TPU grommet pressed into the back door, 0.4 mm tight on the hub.
- **Antenna:** the bulkhead's O-ring seals the box's top.
- **Solar connector:** it seals the box's top.

The plates and the panel spine screw into blind pilots in the flanges, the ribs and the floor. Nothing else goes through the box.

## Screws

Every M5 × 10 gets 8 mm of thread. Each part it goes through is counterbored to leave 2 mm under the cap head, and every pilot is 9 mm deep.

Longer bolts:
- **Reel axles:** M5 × 25s threaded into the front plates, and M5 × 20s into the shrouds at the back.
- **Idlers:** each turns on an M5 × 20 threaded into its shroud.
- **Lower rollers:** M5 × 90s, rear plate to front plate.
- **Upper rollers:** M5 × 80s, outer cheek to inner cheek.
- **Shroud pads:** an M5 × 16 through each pad and the back door into the flange.
- **Pinions:** an M3 grub screw on the shaft's flat holds each one, and pulls its motor onto the back door.

## Printing

No supports. Every hole is round, with no teardrops.
- **Box:** it prints back face down. The rib under each front plate and the front flange taper out at 45°, and nothing inside starts as a shelf.
- **Gears:** they print gear face down. The herringbone's 30° flanks stay inside 45°.
- **Rollers:** each prints standing up in one piece. The hub, the sleeve and seven pins all start on the bed with 0.25 mm between them, and the pins' two 45° collars run in V grooves in both. Work them free, then oil them.

| Part | Material | Orientation | Qty |
|---|---|---|---|
| Box | TPU 64D | back face down | 1 |
| Shaft grommet | TPU 64D | lip down | 2 |
| Front door, back door | PCTG | outer face down | 1 each |
| Gear shroud | PCTG | back plate down | 1 right, 1 left |
| Reel | PCTG | on its gear ring | 2 |
| Reel front flange | PCTG | flat | 2 |
| Pinion | PCTG | gear down | 2 |
| Idler | PCTG | flat | 2 |
| Front holder plate | PCTG | flat, sockets up | 1 right, 1 left |
| Rear holder plate | PCTG | flat, sockets up | 1 right, 1 left |
| Crossmember | PCTG | flat | 10 |
| Roller cheek | PCTG | flat | 2 outer, 2 inner |
| Lower roller | PCTG | on end | 4 |
| Upper roller | PCTG | on end | 4 |
| Panel spine | PCTG | flat | 1 |
| Panel bar | PCTG | flat | 2 |

The holder plates are 173 × 216 mm. The box is the biggest piece at 118 × 236 mm on the bed, 132 tall. Everything fits the U1.

## Wiring

The XIAO's own charger charges to 4.2 V, which is too high for LiFePO4 (3.65 V max). It only runs while the XIAO's USB-C is powered, so unplug the cell, or check that the protection board cuts off at the LiFePO4 limit, before plugging into the XIAO. The Kingboss board is made for LiFePO4, so the solar input charges the cell correctly.

## Not settled yet

- **Motors:** a full reel needs about 7 kg·cm at the drum to lift the node; the gears take 4.7× off the motor. JGY-370 worm motors probably need 6–12 V for it, not the cell's 3.2 V, so expect a boost converter. The ratio and voltage aren't picked.
- **Weight and level:** about 2.9 kg at 60% infill with the bought parts' guessed weights, 3.6 kg with both reels full. Its centre of mass comes out about 2 mm in front of the lines and 85 mm below the rollers, so it should hang within about 2° of level. `panel_y` trims it.
- **Roller bearings:** printed at 0.25 mm, from what people print these at (0.2–0.3 mm). The rollers' pins run their whole length (78 and 66 mm), and PCTG on the U1 at that gap is untested. If they fuse, open up `pip_c`.
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
- ninety-one M5 × 10 cap screws, two M5 × 16s, four M5 × 20s, two M5 × 25s, four M5 × 80s, four M5 × 90s and two M3 grub screws
- silicone oil for the rollers
- two zip ties and foam tape
