# Meshtastic Dry-Bag Node

A Meshtastic/MeshCore repeater in a sealed box that winches itself up into a tree. Throw a line over a branch or two and tie both ends to the node's reels. Each reel winds its end in, and the node climbs the line, with no tie line left hanging down. It's built from a Kingboss 15000 mAh LiFePO4 power bank taken apart.

## Layout

Everything heavy is in the box, low between the two points the lines pull from, and the panel hangs where it levels the node.

- **Box (TPU 64D):** one box in the middle, between the reels, a little deeper than they are. Its back is a solid wall; it opens at the front.
  - **Front door:** the protection board, the winch XIAO nRF52840 Sense, two DRV8871 motor drivers and a U3V40F12 12 V boost. Two saddles hold the 32140 cell standing up, back from the door.
  - **Right wall:** the XIAO nRF52840 + Wio-SX1262 radio, just under the N bulkhead in the box's top, well inside the pigtail's 6". The space under it (40 × 70 × 18 mm) is kept free, so a 1 W module can go in instead.
  - **Top:** the bulkhead, your 5/8" solar connector beside it, and the antenna's stem, which is part of the box.
- **Drive:** the motors (JGY-370s with Hall encoders) stand gearbox-down on the back wall inside, with the charge board above them.
  - **Shafts:** each pinion's hub goes out through a tight TPU lip seal in the back wall.
  - **Gear train:** behind the wall, each pinion drives two idlers onto an output gear on the reel's axis. The idlers turn on print-in-place roller bearings in their hubs.
  - **Output:** each output gear's hub goes out through a lip seal in the box's back slab into a hex in the reel's hub.
  - **Gear size:** module 2.25 and 16 mm wide 30° herringbones, sized up so the printed parts run at low stress.
  - **Covers:** a small bolt-on cover each side (130 × 99 mm) protects the gears, on six M5 × 25s through solid 18 mm bosses. The box is sealed at its wall and slab, so the covers don't need to seal.
  - **Support:** every gear is held both sides. The idlers' pins run from the cover into sockets in the slab, the output gear sits on its pin behind with its hub in the slab in front, and the pinion's back rides on a peg in the cover.
- **Reels:** one either side of the box. Each holds 150–200 ft (about 56 m) of 1/8" Dacron. The line's end wedges into a V jam cleat at the core's front end, under the front flange.
  - **Support:** each reel's hub turns in a bearing bore in its rear plate, and its front axle in the front plate.
- **Reel holders (PCTG):** two big flat skeleton plates per reel, each inside 220 × 220 mm.
  - **Shape:** each is a ring round the reel with spokes, and its flat outer part rises over the reel's outer edge to carry the rollers.
  - **Braces:** members run from the ring's top and bottom, and from the roller window's top, to the plate's inner edge.
  - **Crossmembers:** four tie the two rings round the reel, none right under the rollers, their dovetailed ends locked with a screw.
  - **Channel:** each plate's inner edge sits in a little channel on the box's side, on a base between two low lips. Two square blocks in it index notches in the edge, and four bolts go in at 45° through the edge into the base.
- **Rollers:** four on each reel's outer edge, round a square window the line runs through, so it's held both ways.
  - The lower pair runs front to back from plate to plate and holds the line side to side.
  - The upper pair runs across between two cheeks dovetailed into the plates, and holds it front to back.
  - Each roller is a printed sleeve with a print-in-place roller bearing pressed into each end, printed separately. The two bearings' hubs meet in the roller's middle, so its bolt clamps only the hubs, with a washer each end.
- **Solar panel:** it hangs under the front of the box at 45°, facing forward and up, clear of the box's shade. Its top and bottom edges sit in grooved bars through a spine screwed up into the floor. `panel_side` hangs it behind instead.

## How it seals

- **Front door:** a tongue round it is 0.6 mm wider than the groove round the TPU rim, so the TPU grips it from both sides. The seal doesn't depend on screw force. Fourteen M5 screws outside the seal hold it on.
- **Shafts:** each pinion's hub and each output gear's hub runs in a hole in the TPU that's 0.4 mm tight.
- **Antenna:** the bulkhead's O-ring seals the box's top.
- **Solar connector:** it seals the box's top.

The holder plates, the gear covers and the panel spine bolt into blind pilots in the channels, the slab and the floor. Nothing else goes through the box.

## Screws

Every M5 × 10 gets 8 mm of thread. Each part it goes through is counterbored to leave 2 mm under the cap head, and every pilot is 9 mm deep.

Longer bolts:
- **Reel axles:** M5 × 25s threaded into the front plates.
- **Lower rollers:** M5 × 90s, rear plate to front plate.
- **Upper rollers:** M5 × 75s, outer cheek to inner cheek.
- **Pinions:** an M3 grub screw on the shaft's flat holds each one, and pulls its motor onto the back wall.

## Printing

No supports. Every hole is round, with no teardrops.
- **Box:** it prints back face down, its back wall and slab on the bed. The channels' bases taper into the wall at 45° under them, and the front flange tapers out at 45°.
- **Gear covers:** they print floor down.
- **Gears:** they print gear face down. The herringbones' 30° flanks stay inside 45°. Each idler prints in one piece with its bearing (the gear is the bearing's outer race). A herringbone turned over is the other hand, so all four idlers are one part.
- **Roller bearings:** each prints race down in one piece. The hub, the race and eight pins all start on the bed with 0.25 mm between them, and the pins' 45° collars run in V grooves in both. Work them free, oil them, and press one into each end of a sleeve.

| Part | Material | Orientation | Qty |
|---|---|---|---|
| Box | TPU 64D | back face down | 1 |
| Front door | PCTG | outer face down | 1 |
| Gear cover | PCTG | floor down | 1 right, 1 left |
| Reel | PCTG | on its rear flange | 2 |
| Reel front flange | PCTG | flat | 2 |
| Reel hub | PCTG | on its hex key | 2 |
| Pinion | PCTG | flat | 2 |
| Idler | PCTG | flat | 4 |
| Output gear | PCTG | gear down | 1 right, 1 left |
| Front holder plate | PCTG | flat, sockets up | 1 right, 1 left |
| Rear holder plate | PCTG | flat, sockets up | 1 right, 1 left |
| Crossmember | PCTG | flat | 8 |
| Roller cheek | PCTG | flat | 2 outer, 2 inner |
| Lower roller sleeve | PCTG | on end | 4 |
| Upper roller sleeve | PCTG | on end | 4 |
| Lower roller bearing | PCTG | race down | 8 |
| Upper roller bearing | PCTG | race down | 8 |
| Panel spine | PCTG | flat | 1 |
| Panel bar | PCTG | flat | 2 |

The holder plates are 161 × 201 mm and the gear covers 130 × 99. The box is the widest piece, 264 mm across its back slab, just inside the U1's 270.

## Wiring

The XIAO's own charger charges to 4.2 V, which is too high for LiFePO4 (3.65 V max). It only runs while the XIAO's USB-C is powered, so unplug the cell, or check that the protection board cuts off at the LiFePO4 limit, before plugging into the XIAO. The Kingboss board is made for LiFePO4, so the solar input charges the cell correctly.

## Not settled yet

- **Motors:** the drive is 1:1 (a 12-tooth pinion onto a 12-tooth output), so all the reduction comes from the JGY-370's own worm. A full reel needs about 7 kg·cm at the drum; homelab-39's worst case is 19 kg·cm. The motor's ratio and rpm aren't picked.
- **Weight and level:** about 2.9 kg at 60% infill with the bought parts' guessed weights. Its centre of mass comes out within 0.7 mm of the lines and about 70 mm below the rollers. `cell_back` and `panel_y` trim it.
- **Print-in-place bearings (rollers and idlers):** printed at 0.25 mm, from what people print these at (0.2–0.3 mm). PCTG on the U1 at that gap is untested. If they fuse, open up `pip_c`.
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
- sixty-five M5 × 10 cap screws, fourteen M5 × 25s, four M5 × 75s, four M5 × 90s, sixteen M5 washers and two M3 grub screws
- silicone oil, four zip ties and foam tape
