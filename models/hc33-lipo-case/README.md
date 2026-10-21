# HT-HC33 LiPo Case

A case that stands on end, with everything stacked face to face inside it like a stack of cards. Back to front:
1. a USB-C TP4056 charger board, parts to the front;
2. a 103665 LiPo pouch cell (10 × 36 × 65);
3. a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), top face to the front;
4. a Heltec WiFi LoRa 32 V4, top face (with its screen) to the front.

All three USB-Cs come out of the bottom. Two SMA bulkheads come out of the top at opposite corners: front-left and back-right.

51 × 55 × 84.8 mm with the corner towers; the body is 42 × 45.4. Not printed yet.

## Pieces

| Piece | Material | Prints |
|---|---|---|
| Sleeve | PETG | standing on its bottom |
| Cap | PETG | top face down |

Both fit on one bed: `print.3mf` is that plate. Neither has an overhang: the sleeve's rails, fins and towers all rise straight up, and the SMA holes go straight through the cap.

## How it goes together

- **Boards in rails.** Each board slides down from the top into a pair of slotted rails, one on each side wall. The slot grips 1.25 mm of the board's edge. The slot has a floor: the PCB lands on it with its USB-C face 0.3 mm off the bottom, over its opening.
- **Cell between fins.** The cell slides down between two pairs of fins, one pair either side, and stands on the bottom.
- **Cap.** It closes the top on four M3 cap screws, down through counterbores into the sleeve's corner towers. A tongue round the sleeve's rim drops into a groove under the cap.
- **Fingers.** Under the cap, a finger hangs down over each board's top edge, and a pair over the cell's top, either side of the middle where its tabs are. Each stops 0.3 mm short, so nothing can ride up out of its slot.
- **SMAs.** The bulkheads go through the 5 mm cap at its front-left and back-right corners, nuts either side. There are 12 mm over the tallest part (the cell) for the connectors' backs and the pigtails.

It isn't sealed: the USB-C openings are open.

## Assembly

1. Fit the SMA bulkheads through the cap, nuts inside.
2. Wire the cell to the TP4056 and to the boards' battery inputs.
3. Slide the TP4056, the cell, the HC33 and the V4 down into their places, USB-Cs first, back to front.
4. Plug the pigtails into the HC33 and the V4.
5. Screw the cap on with 4 M3x10 cap screws.

## Unmeasured

- **The cell.** 103665 is nominal 10 × 36 × 65 with its protection board; real cells run a millimetre or two over (`cell_t`, `cell_w`, `cell_l`).
- **The V4.** 51.7 × 25.4 × 10.7 is from Heltec's page. Its PCB thickness (`v4_pcb`, 1), how its parts split either side (`v4_under`, 2.5 behind) and where its USB-C sits (`v4_usb_y`, `v4_usb_overhang`) are guesses. Pin headers aren't allowed for.
- **The TP4056 board.** Taken as 28 × 17.5, 1.6 thick, a 3.2 mm receptacle sticking out 0.6 (`tp_*`). Boards vary.
- **The HC33's USB-C height** over its PCB (`hc_usb_y`), as in the other HC33 case.
- **Board edges.** The rails assume each board's outer 1.25 mm is clear of parts.
