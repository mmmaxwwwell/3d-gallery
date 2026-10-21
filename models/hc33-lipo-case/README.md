# HT-HC33 LiPo Case

A case that stands on end, with everything stacked face to face inside it like a stack of cards, each in a chamber of its own. Back to front:
1. a USB-C TP4056 charger board, parts to the front, its USB-C end to the right;
2. a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), top face to the front;
3. a 103665 LiPo pouch cell (10 × 36 × 65);
4. a Heltec WiFi LoRa 32 V4, top face (with its screen) to the front.

The HC33's and V4's USB-Cs come out of the bottom, the TP4056's out of the right side. Two SMA bulkheads come out of the top at opposite corners: front-left and back-right.

49 × 56.1 × 84.1 mm. Not printed yet.

## Pieces

| Piece | Material | Prints |
|---|---|---|
| Body | black PCTG, with its base and grip rings in orange TPU 75A (`body-tpu.stl`) printed in place | standing on its bottom |
| Carriage | black PCTG, with its share of the grip rings in orange TPU 75A (`carriage-tpu.stl`) printed in place | on its door face |

Both go on one Snapmaker U1 bed, `print.3mf`: PCTG from head 3, TPU from head 4 (the plate pins the colours to those heads).

- **Carriage.** One L-shaped piece: the top, with the SMA holes, and the left face, the door face. Everything inside hangs on it, so the whole stack comes out together.
- **Body.** The bottom and the back, front and right walls. It is open at the top and on the left, and the carriage slides in from the left.

Seen from the top, the case is a rounded rectangle (10 mm corners). The left and right faces run into the corners at 45°, and the top edge is rounded (4 mm) with the same 45° lead.

## Grip and base

- **Rings.** 15 mm rings run round the case, PCTG and TPU in turn, from a PCTG one at the bottom. Each TPU ring fills a recess sunk 2 mm into the PCTG with 45° chamfers top and bottom. Its outside is flush with the PCTG rings and knurled 0.8 mm deep:
  - round the body, diamond pyramids 2 mm apart at ±45°;
  - on the door face, 90° V-grooves at ±45°, 2 mm apart. The door face is the carriage's print bed, and V-groove walls print at 45° there where pyramids wouldn't;
  - on the door face's 45° lead-ins into the corners, smooth: knurl there would face down past 45°.
  - The rings stop 1.5 mm short of the TP4056's side USB-C opening and of the door screws' heads, leaving flush PCTG round each, so no TPU crosses a hole.
- **Base.** 1.6 mm of TPU under the whole case, with the bottom USB-C openings through it. The strip under the door face prints with the carriage; the rest with the body. Twelve keys rise 1.5 mm from it into the body's walls, flaring 0.4 mm, so the PCTG printed over them holds them as well as the bond does.

## How it goes together

- **Chambers.** The carriage's 1.2 mm fins run between the layers, from the floor up to just over the tallest part. The 10 mm under the top is open across all four chambers: that's where the wires and the SMA pigtails cross. The fin between the TP4056 and the HC33 stops just over the TP4056 (23.5 mm up), so the HC33's chamber takes in the space above the charger, where its antenna goes.
- **HC33 and V4.** Each board is held on all four edges, snug: 0.2 mm over the PCB's thickness, 0.15 mm over its top edge.
  - Its left edge sits in a slotted rib on the door face. With the carriage in, its right edge sits in a slotted rail on the body's right wall. The V4's corners are chamfered (3.81 mm at the top, 2.16 mm at the USB-C end), and those slots' floors and roofs follow the chamfers, so its corners are held too. That works because a board only ever passes a slot moving one way.
  - A slotted bar off the next fin runs along its top edge. The V4's is split for 6 mm over the LoRa IPEX on its nose.
  - Slotted bars under its bottom edge carry it either side of the USB-C, leaving the plug's opening clear. They reach only 0.9 mm up the board's faces, clear of the V4's buttons and connectors. They put the USB-C 0.3 mm over its opening in the bottom.
- **TP4056.** It stands on a slotted bar and has another slotted bar over its top edge, both on the carriage. Its left end sits in a rib on the door face. Its USB-C end slides into the body's rails either side of the opening in the right wall.
- **Cell.** It sits between two fins, on a floor plate joining them, under a roof at each end of its top. The wires come out between the roofs.
- **Mating.**
  - The fins and the cell's floor plate run in channels in the floor, 1.2 mm deep, and the fins run in grooves up the right wall.
  - Two tongues under the top run in grooves along the back and front walls' tops.
  - A hook under the top's right edge has a nib that slides into a groove in the right wall, so the top's far end can't lift. Four vertical gussets, 1.6 mm thick and 8 mm long, tie the hook back into the top.
- **Screws.** Five button-head cap screws hold it in, each threading 6–7 mm into a boss on the body.
  - Through the door face: two M5x10 into bosses on the back wall (39.5 and 54.5 mm up) and one M3x10 into a boss on the front wall (67 up), over the V4. Each head sits 2 mm into the face, on the flat of a plain ring or an inset ring's floor.
  - Through the top: two M5x10 along the front edge into bosses hanging off the front wall.
  - Each boss sits where nothing on the carriage passes as it slides in. Those spots set how many fit: there is no room inside this size for more door-face M5s.

It isn't sealed: the USB-C openings are open.

## Assembly

1. Fit the SMA bulkheads through the top, nuts inside.
2. Slide each piece onto the carriage from the right, toward the door face: the TP4056 between its bars, the HC33 and V4 along their bars into their ribs, the cell between its fins. A dab of foam tape keeps the cell from sliding back out before the carriage goes in.
3. Wire the cell to the TP4056 and to the boards' battery inputs, over the fins, and plug the pigtails in: the back-right SMA to the HC33, the front-left one to the V4.
4. Slide the carriage into the body from the left until the door face meets it. Each board's right edge goes into its rail as it does.
5. Put in the screws: the two M5x10s and the M3x10 through the door face, then the two M5x10s down through the top.

## Unmeasured

- **The cell.** 103665 is nominal 10 × 36 × 65 with its protection board. Real cells run a millimetre or two over (`cell_t`, `cell_w`, `cell_l`).
- **The V4.** Taken from Heltec's drawing and STEP model (V4.3.1):
  - 51.69 × 25.4 overall;
  - PCB 1.56 thick;
  - 3.6 behind the PCB (the GNSS connector) and 5.54 in front (the OLED bracket);
  - the USB-C 1.25 over the PCB, sticking out 0.97.

  Not yet checked against a board in hand. The STEP model has no OLED, so the 5.54 comes from the drawing's 15.6 overall height with headers. The IPEX's place on the nose is read off the drawing (`v4_ipex_gap`). Pin headers aren't allowed for.
- **The TP4056 board.** Taken as 28 × 17.5, 1.6 thick, a 9 × 3.2 receptacle sticking out 0.6 (`tp_*`). Boards vary.
- **The HC33's USB-C height** over its PCB (`hc_usb_y`), as in the other HC33 case.
- **Board edges.** The side and top slots assume each board's outer 1.25 mm is clear of parts, and the bottom bars its outer 0.9 mm. True for the V4 by its model except the IPEX, which its top bar is split round; unknown for the HC33.
