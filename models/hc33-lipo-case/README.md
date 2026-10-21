# HT-HC33 LiPo Case

A two-piece case that stands on end, for:
- a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow);
- a 103665 LiPo pouch cell (10 × 36 × 65);
- a USB-C TP4056 charger board;
- two SMA bulkheads through the top end.

51 × 112 × 26.4 mm, corner towers included (the body is 42 wide). Not printed yet.

## Pieces

| Piece | Material | Prints |
|---|---|---|
| Base | PETG | back face down |
| Lid | PETG | front face down |

Both fit on one bed: `print.3mf` is that plate.

## Layout

Looking at the front, the SMAs at the top:

- **Cell.** It lies flat against the back, filling the base's width, its upper end against the top wall. Two stubs stop its lower end; the gap between them is for its leads.
- **TP4056.** Below the cell, on a 1 mm pad between corner brackets, its USB-C through the bottom wall.
- **HT-HC33.** It hangs from the lid on four M2 posts, face toward the lid, over the TP4056 and the lower end of the cell. Its USB-C comes through the bottom wall above the TP4056's.
- **Hold-down.** Two ribs down the lid's long walls stop 0.3 mm over the cell, so the lid holds it down. They also run either side of the HC33.
- **SMAs.** Two bulkheads through the top wall, 20 mm apart, in the lid's part of the wall. They sit over the cell's upper end, past the HC33's end, so the pigtails have room.
- **Closing.** Four M3 cap screws go down through the lid's corner towers into the base's. A tongue round the base's rim drops into a groove under the lid's, so the lid goes on one way and can't shift.

It isn't sealed: the USB-C openings are open.

## Assembly

1. Fit the SMA bulkheads through the lid's top wall, nuts inside.
2. Screw the HC33 onto the lid's posts with 4 M2x5 self-tappers, face toward the lid, USB-C to the bottom opening. Plug the pigtails in.
3. Tape the TP4056 onto its pad, USB-C into the bottom opening, and the cell into the base. Wire cell → TP4056 → HC33's battery socket.
4. Close the lid with 4 M3x18 cap screws.

## Unmeasured

- **The cell.** 103665 is nominal 10 × 36 × 65 with its protection board; real cells run a millimetre or two over (`cell_t`, `cell_w`, `cell_l`).
- **The TP4056 board.** Taken as 28 × 17.5, 1.6 thick, a 3.2 mm receptacle sticking out 0.6 (`tp_*`). Boards vary.
- **The HC33's mounting holes.** Taken as M2 (`hc_pilot_d` 1.7).
- **The HC33's USB-C height** over its PCB (`hc_usb_z`), as in the other HC33 case.
