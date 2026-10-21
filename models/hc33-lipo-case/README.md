# HT-HC33 LiPo Case

A sealed case that stands on end, with everything stacked face to face inside it like a stack of cards, each in a chamber of its own. Back to front:
1. a USB-C TP4056 charger board, parts to the front, its USB-C end to the right;
2. a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), top face to the front;
3. a 103665 LiPo pouch cell (10 × 36 × 65);
4. a Heltec WiFi LoRa 32 V4, top face (with its screen) to the front.

The bottom is flat: the HC33 and V4 are flashed over the air. The TP4056's USB-C comes out of the right side. Two SMA bulkheads come out of the top at opposite corners: front-left and back-right.

54.6 × 71.1 × 95.8 mm. Not printed yet.

## Pieces

| Piece | Material | Prints |
|---|---|---|
| Body | black PCTG with the side door printed in its track (`body.stl`); orange TPU 75A base and grip rings (`body-tpu.stl`); black TPU Air seal channels and side-door gasket (`body-seal.stl`) | standing on its bottom |
| Carriage | black PCTG (`carriage.stl`); orange TPU 75A grip rings and the base's strip under the door face (`carriage-tpu.stl`); black TPU Air washers for the SMAs (`carriage-seal.stl`) | on its door face |

Both go on one Snapmaker U1 bed, `print.3mf`, every TPU printed in place: TPU Air from head 1, PCTG from head 3, TPU 75A from head 4 (the plate pins the colours to those heads).

- **Carriage.** One L-shaped piece: the top, with the SMA holes, and the left face, the door face. Everything inside hangs on it, so the whole stack comes out together.
- **Body.** The bottom (9.8 mm, for the door face's bottom screws under its seal), the back and front walls (13.5 mm), and the right wall (11.6 mm), all thick for the screws. It is open at the top and on the left, and the carriage slides in from the left.

Seen from the top, the case is a rounded rectangle (10 mm corners). The left and right faces run into the corners at 45°, and the top edge is rounded (4 mm) with the same 45° lead.

## Grip and base

- **Rings.** Rings run round the case, PCTG and TPU in turn: a short TPU ring (10.4 mm) from the bottom, on the base; five 14 mm rings from PCTG to PCTG; and a short TPU ring under the top. The rings are 14 mm, not 15, so both short rings fit. The knurl runs right up to the screw heads and the door face's seam. Each TPU ring fills a recess sunk 2 mm into the PCTG with 45° chamfers top and bottom. Its outside is flush with the PCTG rings and knurled 0.8 mm deep:
  - round the body, diamond pyramids 2 mm apart at ±45°;
  - on the door face, 90° V-grooves at ±45°, 2 mm apart. The door face is the carriage's print bed, and V-groove walls print at 45° there where pyramids wouldn't;
  - round the corners and the door face's 45° lead-ins, the body's diamond knurl carries on unbroken. As the carriage prints on its door face, some facets there face down past 45°, so expect them a little rough.
  - The rings stop 1.5 mm short of the side door's track only.
- **Base.** 1.6 mm of orange TPU under the whole case, flat; the bottom TPU ring stands on it. The strip under the door face prints with the carriage; the rest with the body. Twelve keys rise 1.5 mm from it into the body's walls, flaring 0.4 mm, so the PCTG printed over them holds them as well as the bond does.

## How it goes together

- **Chambers.** The carriage's 1.2 mm fins run between the layers, from the floor up to just over the tallest part. The 10 mm under the top is open across all four chambers: that's where the wires and the SMA pigtails cross. The fin between the TP4056 and the HC33 stops just over the TP4056 (23.5 mm up), so the HC33's chamber takes in the space above the charger, where its antenna goes.
- **HC33 and V4.** Each board is held on all four edges, snug: 0.2 mm over the PCB's thickness, 0.15 mm over its top edge.
  - Its left edge sits in a slotted rib on the door face. With the carriage in, its right edge sits in a slotted rail on the body's right wall. The V4's corners are chamfered (3.81 mm at the top, 2.16 mm at the USB-C end), and those slots' floors and roofs follow the chamfers, so its corners are held too. That works because a board only ever passes a slot moving one way.
  - A slotted bar off the next fin runs along its top edge. The V4's is split for 6 mm over the LoRa IPEX on its nose.
  - Slotted bars under its bottom edge carry it either side of the USB-C, from 0.5 mm off the receptacle. They reach only 0.9 mm up the board's faces, clear of the V4's buttons and connectors.
- **TP4056.** It stands on a slotted bar and has another slotted bar over its top edge, both on the carriage. Its left end sits in a rib on the door face. Its USB-C end slides into the body's rails either side of the opening in the right wall.
- **Cell.** It sits between two fins, on a floor plate joining them, under a roof at each end of its top. The wires come out between the roofs.
- **Mating.**
  - The fins and the cell's floor plate run in channels in the floor, 1.2 mm deep, and the fins run in grooves up the right wall.
  - A hook under the top's right edge has a nib that slides into a groove in the right wall, so the top's far end can't lift. Four vertical gussets, 1.6 mm thick and 8 mm long, tie the hook back into the top.
- **Screws.** Twenty-six M3x10 socket-head cap screws hold it in, counterbored flush (through the TPU where they cross a ring). All of them thread into the walls and floor, 4.5 mm out from the cavity, outside the seals, so no screw hole goes through the sealed space.
  - Through the door face (17): seven evenly up each side from corner to corner (5.2 to 88.75 mm up), threading 7.2 mm into the walls' ends, and three across the bottom between them, into the floor's end under the floor's seal channel, pressing the door face's bottom lip.
  - Through the top (9): three along each of the back and front edges and three along the right edge, threading 8.2 mm into the walls. The top is 5 mm thick for their counterbores.

## Sealing

- **The joint.** Black TPU Air channels are printed in place on the body, each 2.4 × 2.4 with a groove 0.7 wide and 1.6 deep. PCTG lips on the carriage, 1 mm thick, reach 1.4 mm into the grooves, squeezing each groove wall 0.15 mm. They go all the way round:
  - up the back and front walls' ends and across the floor's end, for the door face. Those lips press in as the carriage reaches home, and the door screws hold them there;
  - round the back, front and right walls' tops, on a 2.4 mm ridge over the cavity, for the top. The back and front lips slide in along their grooves from the left, through flared mouths. The right one presses in at the end of the slide.
- **Screws.** They all sit outside the seal line, so they need no washers. The seventeen round the door face press its lips into their channels; the right edge's three hold the top's right lip down.
- **SMAs.** A TPU Air washer sits under each SMA's outer nut, 0.3 mm proud of its seat.
- **Bottom.** No openings.
- **Side port.** A PCTG door slides along a dovetail track in the right face. It prints in the track, open, held by three small ties under its lower edge: slide it once to break them. Slid shut toward the back, the track wedges it 0.6 mm inward over the last 3 mm, onto a TPU Air gasket round the opening that stands 0.6 proud, squeezing it 0.3. A ridge 1.5 mm proud near its front end is what you push it shut and pull it open by.

## Assembly

1. Break the side door's ties by sliding it shut and open once.
2. Fit the SMA bulkheads through the top, nuts inside, the outer nuts on their TPU washers. The top is 7.4 mm thick there, so they need long-thread bulkheads.
3. Slide each piece onto the carriage from the right, toward the door face: the TP4056 between its bars, the HC33 and V4 along their bars into their ribs, the cell between its fins. A dab of foam tape keeps the cell from sliding back out before the carriage goes in.
4. Wire the cell to the TP4056 and to the boards' battery inputs, over the fins, and plug the pigtails in: the back-right SMA to the HC33, the front-left one to the V4.
5. Slide the carriage into the body from the left until the door face meets it. Each board's right edge goes into its rail as it does, and the top's back and front lips run along their seal grooves; push firmly at the end so the door face's and the right lip's seals seat.
6. Put in the twenty-six M3x10 SHCS: the seventeen through the door face first, working round it, then the nine through the top.

## Unmeasured

- **The cell.** 103665 is nominal 10 × 36 × 65 with its protection board. Real cells run a millimetre or two over (`cell_t`, `cell_w`, `cell_l`).
- **The V4.** Taken from Heltec's drawing and STEP model (V4.3.1):
  - 51.69 × 25.4 overall;
  - PCB 1.56 thick;
  - 3.6 behind the PCB (the GNSS connector) and 5.54 in front (the OLED bracket);
  - the USB-C 1.25 over the PCB, sticking out 0.97.

  Not yet checked against a board in hand. The STEP model has no OLED, so the 5.54 comes from the drawing's 15.6 overall height with headers. The IPEX's place on the nose is read off the drawing (`v4_ipex_gap`). Pin headers aren't allowed for.
- **The TP4056 board.** Taken as 28 × 17.5, 1.6 thick, a 9 × 3.2 receptacle sticking out 0.6 (`tp_*`). Boards vary.
- **The seals.** The squish (0.15 a side on the lips, 0.3 on the side door's gasket and the SMA washers) is a first guess for TPU Air, untested. The top's back and front lips drag through their grooves for the whole slide.
- **The HC33's USB-C height** over its PCB (`hc_usb_y`), as in the other HC33 case.
- **Board edges.** The side and top slots assume each board's outer 1.25 mm is clear of parts, and the bottom bars its outer 0.9 mm. True for the V4 by its model except the IPEX, which its top bar is split round; unknown for the HC33.
