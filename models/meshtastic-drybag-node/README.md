# Meshtastic Dry-Bag Node

A Meshtastic/MeshCore repeater in a sealed box that winches itself up into a tree. Throw a line over a branch or two and tie both ends to the node's reels. Each reel winds its end in, and the node climbs the line, with no tie line left hanging down. It's built from a Kingboss 15000 mAh LiFePO4 power bank taken apart.

## Layout

Everything heavy is in the box, low between the two points the lines pull from, and the panel hangs where it levels the node.

- **Box (TPU 64D):** one box in the middle, between the reels, a little deeper than they are.
  - **Front door:** the protection board, the winch XIAO nRF52840 Sense, two DRV8871 motor drivers and a U3V40F12 12 V boost. Two saddles hold the 32140 cell standing up, back from the door.
  - **Right wall:** the XIAO nRF52840 + Wio-SX1262 radio, just under the N bulkhead in the box's top, well inside the pigtail's 6". The space under it (40 × 70 × 18 mm) is kept free, so a 1 W module can go in instead.
  - **Top:** the bulkhead, your 5/8" solar connector beside it, and the antenna's stem, which is part of the box.
- **Gear tray (the back of the box):** a sealed PCTG tray contoured round both gear trains out to each reel's axis. It seals onto a solid slab the box grows behind each reel, the same way the front door seals.
  - **Gears:** in each lobe, the motor's pinion drives two idlers onto an output gear on the reel's axis. They're all 12 mm 30° herringbones, run dry inside the seal on pins in the tray's floor, with silicone oil.
  - **Output:** each output gear's hub goes out through a lip seal in the slab into a hex in the reel's hub. That's the only shaft through the seal.
  - **Motors:** the JGY-370s, with their Hall encoders, stand gearbox-down on a motor plate screwed onto the tray, with the charge board above them. Unscrew the tray and the motors and gears come out together.
- **Reels:** one either side of the box. Each holds 150–200 ft (about 56 m) of 1/8" Dacron. The line's end wedges into a V jam cleat at the core's front end, under the front flange.
  - **Support:** each reel's hub turns in a bearing bore in its rear plate, and its front axle in the front plate.
- **Reel holders (PCTG):** two big flat skeleton plates per reel, each inside 220 × 220 mm.
  - **Shape:** each is a ring round the reel with spokes, and its flat outer part rises over the reel's outer edge to carry the rollers.
  - **Braces:** members run from the ring's top and bottom, and from the roller window's top, to the plate's inner edge.
  - **Crossmembers:** five tie the two rings round the reel, their dovetailed ends locked with a screw.
  - **Channel:** each plate's inner edge is bevelled 45° both sides and sits in a V channel between two 45° TPU lips on the box's side. Bolts go in at 45° through the edge into the rear lip. The edge and the channel step in and out along their length, so the plate indexes.
- **Rollers:** four on each reel's outer edge, round a square window the line runs through, so it's held both ways.
  - The lower pair runs front to back from plate to plate and holds the line side to side.
  - The upper pair runs across between two cheeks dovetailed into the plates, and holds it front to back.
  - Each roller is a printed sleeve with a print-in-place roller bearing pressed into each end, printed separately. The two bearings' hubs meet in the roller's middle, so its bolt clamps only the hubs, with a washer each end.
- **Solar panel:** it hangs under the front of the box at 45°, facing forward and up, clear of the box's shade. Its top and bottom edges sit in grooved bars through a spine screwed up into the floor. `panel_side` hangs it behind instead.

## How it seals

- **Front door and gear tray:** each has a tongue round it that's 0.6 mm wider than the groove round its TPU rim, so the TPU grips it from both sides. The seal doesn't depend on screw force. M5 screws outside the seal hold them on: 14 for the door, 22 round the tray.
- **Reel drives:** each output gear's hub runs in a hole in the TPU slab that's 0.4 mm tight.
- **Antenna:** the bulkhead's O-ring seals the box's top.
- **Solar connector:** it seals the box's top.

The holder plates and the panel spine bolt into blind pilots in the lips and the floor. Nothing else goes through the box.

## Screws

Every M5 × 10 gets 8 mm of thread. Each part it goes through is counterbored to leave 2 mm under the cap head, and every pilot is 9 mm deep.

Longer bolts:
- **Reel axles:** M5 × 25s threaded into the front plates.
- **Lower rollers:** M5 × 90s, rear plate to front plate.
- **Upper rollers:** M5 × 75s, outer cheek to inner cheek.
- **Pinions:** an M3 grub screw on the shaft's flat holds each one, and pulls its motor onto the motor plate.

## Printing

No supports. Every hole is round, with no teardrops.
- **Box:** it prints back face down, its slab and lobes on the bed. The V channels' lips are 45° each way, and the front flange tapers out at 45°.
- **Tray:** it prints floor down. Its flange steps out at 45° under itself.
- **Gears:** they print gear face down. The herringbones' 30° flanks stay inside 45°. A herringbone turned over is the other hand, so all four idlers are one part.
- **Roller bearings:** each prints race down in one piece. The hub, the race and eight pins all start on the bed with 0.25 mm between them, and the pins' 45° collars run in V grooves in both. Work them free, oil them, and press one into each end of a sleeve.

| Part | Material | Orientation | Qty |
|---|---|---|---|
| Box | TPU 64D | back face down | 1 |
| Front door | PCTG | outer face down | 1 |
| Gear tray | PCTG | floor down | 1 |
| Motor plate | PCTG | flat | 1 |
| Reel | PCTG | on its rear flange | 2 |
| Reel front flange | PCTG | flat | 2 |
| Reel hub | PCTG | on its hex key | 2 |
| Pinion | PCTG | flat | 2 |
| Idler | PCTG | flat | 4 |
| Output gear | PCTG | gear down | 1 right, 1 left |
| Front holder plate | PCTG | flat, sockets up | 1 right, 1 left |
| Rear holder plate | PCTG | flat, sockets up | 1 right, 1 left |
| Crossmember | PCTG | flat | 10 |
| Roller cheek | PCTG | flat | 2 outer, 2 inner |
| Lower roller sleeve | PCTG | on end | 4 |
| Upper roller sleeve | PCTG | on end | 4 |
| Lower roller bearing | PCTG | race down | 8 |
| Upper roller bearing | PCTG | race down | 8 |
| Panel spine | PCTG | flat | 1 |
| Panel bar | PCTG | flat | 2 |

The holder plates are 163 × 201 mm. The box and the tray are the widest pieces, 266 mm across the gear lobes, just inside the U1's 270.

## Wiring

The XIAO's own charger charges to 4.2 V, which is too high for LiFePO4 (3.65 V max). It only runs while the XIAO's USB-C is powered, so unplug the cell, or check that the protection board cuts off at the LiFePO4 limit, before plugging into the XIAO. The Kingboss board is made for LiFePO4, so the solar input charges the cell correctly.

## Not settled yet

- **Motors:** the drive is now only 1.17:1 (a 12-tooth pinion onto a 14-tooth output), so nearly all the reduction has to come from the JGY-370's own worm. A full reel needs about 7 kg·cm at the drum; homelab-39's worst case is 19 kg·cm. The motor's ratio and rpm aren't picked.
- **Weight and level:** about 2.9 kg at 60% infill with the bought parts' guessed weights. Its centre of mass comes out level with the lines (0.3 mm off) and 60 mm below the rollers. `cell_back` and `panel_y` trim it.
- **Roller bearings:** printed at 0.25 mm, from what people print these at (0.2–0.3 mm). PCTG on the U1 at that gap is untested. If they fuse, open up `pip_c`.
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
- two JGY-370 12 V worm motors with Hall encoders, two DRV8871 drivers, a Pololu U3V40F12 boost, and a XIAO nRF52840 Sense
- two 50–60 m lengths of 1/8" Dacron
- your 5/8" connector
- ninety-six M5 × 10 cap screws, two M5 × 25s, four M5 × 75s, four M5 × 90s, sixteen M5 washers and two M3 grub screws
- silicone oil, four zip ties and foam tape
