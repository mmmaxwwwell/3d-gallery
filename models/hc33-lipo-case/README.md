# HT-HC33 LiPo Case

A two-piece case that stands on end, for:
- a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow);
- a Heltec WiFi LoRa 32 V4;
- a 103665 LiPo pouch cell (10 × 36 × 65);
- a USB-C TP4056 charger board;
- two SMA bulkheads through the top end.

All three USB-Cs come out of the bottom end. 79 × 80 × 27.1 mm with the corner towers; the body is 70 × 71. Not printed yet.

## Pieces

| Piece | Material | Prints |
|---|---|---|
| Base | PETG | back face down |
| Lid | PETG | front face down |

Both fit on one bed: `print.3mf` is that plate.

## Layout

Looking at the front, the SMAs at the top. Two columns, two layers:

| | Left column | Right column |
|---|---|---|
| **Lid** (front) | TP4056, upside down, at the bottom end; the SMAs' backs at the top | HT-HC33 |
| **Base** (back) | Heltec V4 | 103665 cell |

- **Cell.** Flat against the back in the right column, end to end in the cavity. A divider separates it from the V4.
- **V4.** Flat against the back in the left column, between corner brackets. Its USB-C comes through the bottom wall.
- **HT-HC33.** Hangs from the lid on four M2 posts, over the cell, face toward the lid. Its USB-C comes through the bottom wall.
- **TP4056.** Hangs upside down from the lid over the V4's lower end, on a 1 mm pad between corner brackets. Its USB-C comes through the bottom wall above the V4's.
- **Hold-down.** Two ribs from the lid, either side of the HC33, stop 0.3 mm over the cell.
- **SMAs.** Two bulkheads through the top wall over the V4's column, 15 mm apart, past the TP4056's end so the pigtails have room. Tighten the outer nuts with a nut driver: there isn't room for a spanner between them.
- **Closing.** Four M3 cap screws go down through the lid's corner towers into the base's. A tongue round the base's rim drops into a groove under the lid's, so the lid goes on one way and can't shift.

It isn't sealed: the USB-C openings are open.

## Assembly

1. Fit the SMA bulkheads through the lid's top wall, nuts inside.
2. Screw the HC33 onto the lid's posts with 4 M2x5 self-tappers, face toward the lid, USB-C to its opening. Tape the TP4056 onto its pad, components out, USB-C into its opening. Plug the pigtails in.
3. Tape the cell and the V4 into the base, the V4's USB-C into its opening.
4. Wire cell → TP4056 → the boards' battery inputs.
5. Close the lid with 4 M3x18 cap screws.

## Unmeasured

- **The cell.** 103665 is nominal 10 × 36 × 65 with its protection board; real cells run a millimetre or two over (`cell_t`, `cell_w`, `cell_l`).
- **The V4.** 51.7 × 25.4 × 10.7 is from Heltec's page, taken as a solid block lying flat. Where its USB-C sits (`v4_usb_z`, `v4_usb_overhang`) is a guess, and the case ignores pin headers.
- **The TP4056 board.** Taken as 28 × 17.5, 1.6 thick, a 3.2 mm receptacle sticking out 0.6 (`tp_*`). Boards vary.
- **The HC33's mounting holes.** Taken as M2 (`hc_pilot_d` 1.7).
- **The HC33's USB-C height** over its PCB (`hc_usb_z`), as in the other HC33 case.
