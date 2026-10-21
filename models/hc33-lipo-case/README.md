# HT-HC33 LiPo Case

A case that stands on end, with everything stacked face to face inside it like a stack of cards, each in a chamber of its own. Back to front:
1. a USB-C TP4056 charger board, parts to the front, its USB-C end to the right;
2. a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow), top face to the front;
3. a 103665 LiPo pouch cell (10 × 36 × 65);
4. a Heltec WiFi LoRa 32 V4, top face (with its screen) to the front.

The HC33's and V4's USB-Cs come out of the bottom, the TP4056's out of the right side. Two SMA bulkheads come out of the top at opposite corners: front-left and back-right. The left side is a door.

49 × 51.1 × 82.5 mm. Not printed yet.

## Pieces

| Piece | Material | Prints |
|---|---|---|
| Body | PETG | on its right face |
| Door | PETG | on its outer face |

Both fit on one bed: `print.3mf` is that plate. Seen from the top, the case is a rounded rectangle (10 mm corners). The left and right faces run into the corners at 45°, which is what lets each piece print on one of them. The top edge is rounded (4 mm) and leads in at 45° the same way. The only overhangs past 45° are the tops of the round holes: the SMA holes and the hinge pin's.

## How it goes together

- **Door.** The whole left wall swings down on a hinge along its bottom edge: five knuckles round a 1.75 mm filament pin, the body's snug on it and the door's loose. Opened 90°, it lies flat on the table. Two M5x10 cap screws near the top hold it shut. They sit in counterbores 3 mm deep in the door and thread 7.2 mm into bosses under the case's top.
- **Chambers.** A 1.2 mm divider runs between each pair of layers, from the bottom up to just over the tallest part. The 10 mm under the top is open across all four chambers: that's where the wires and the SMA pigtails cross. The one between the TP4056 and the HC33 stops just over the TP4056 (21.8 mm up), so the HC33's chamber takes in the space above the charger, where its antenna goes.
- **Boards.** Each board's right edge sits in a slot in a rail on the right wall, and its left edge in a slot in a rib on the door. The slots have roofs over the boards' top edges, so nothing rides up. The HC33's and V4's slots on the right wall also have floors, which put each USB-C 0.3 mm over its opening in the bottom. The door's ribs have no floors, because the door's swing would lift a floor into the board.
- **TP4056.** It stands on the bottom with its USB-C end against the right wall, through an opening there. Its rail on the right wall comes in two parts, one under the receptacle and one over it.
- **Cell.** It stands on the bottom in its chamber, with a roof over each end.
- **Grip.** The front and back faces carry 15 mm bands up the whole case, diamond knurled and plain in turn: 90° V-grooves 0.8 mm deep at ±45°, 2 mm apart. Each knurled band's ends lead in at 45°, so it prints on the body's side.

It isn't sealed: the USB-C openings are open.

## Assembly

1. Fit the SMA bulkheads through the top, nuts inside.
2. Push the hinge pin (45 mm of 1.75 mm filament) through the knuckles, and melt or glue its ends.
3. Wire the cell to the TP4056 and to the boards' battery inputs.
4. With the door open, slide each piece into its chamber from the left, at the height it sits at, until its right edge is home: the TP4056 at the back, then the HC33, the cell and the V4. Run the wires over the dividers.
5. Plug the pigtails into the HC33 (from the back-right SMA) and the V4 (from the front-left one).
6. Close the door and put in the two M5x10s.

## Unmeasured

- **The cell.** 103665 is nominal 10 × 36 × 65 with its protection board; real cells run a millimetre or two over (`cell_t`, `cell_w`, `cell_l`).
- **The V4.** 51.7 × 25.4 × 10.7 is from Heltec's page. Its PCB thickness (`v4_pcb`, 1), how its parts split either side (`v4_under`, 2.5 behind) and where its USB-C sits (`v4_usb_y`, `v4_usb_overhang`) are guesses. Pin headers aren't allowed for.
- **The TP4056 board.** Taken as 28 × 17.5, 1.6 thick, a 9 × 3.2 receptacle sticking out 0.6 (`tp_*`). Boards vary.
- **The HC33's USB-C height** over its PCB (`hc_usb_y`), as in the other HC33 case.
- **Board edges.** The slots assume each board's outer 1.25 mm is clear of parts.
