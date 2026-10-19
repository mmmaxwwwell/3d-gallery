# Apache Case Modules: MeshCore Repeater

A modular insert for a Harbor Freight Apache case. The first build is a
portable MeshCore repeater in an **Apache 1800 (small)** with its foam removed.

## How it works

- **Baseplate**: fills the case floor (212 × 148 × 7 mm). It has a 20 mm grid
  of M5 pilot holes, 10 × 7.
- **Modules** screw down onto the grid with **M5x10** cap screws in
  counterbores: 4 mm of the part under the head, 6 mm threaded into the
  plate. Every module's holes are a multiple of 20 mm apart, so any module can
  move to any grid point without reprinting the plate.

## The repeater's modules

| Part | Qty | Holds |
|------|-----|-------|
| Cell bed | 1 | the 32140 LiFePO4 cell, front to back against the right end wall (about 1 mm off it), and its charge board in a slot underneath |
| Cell hook | 2 | screws onto the bed and curls over the cell, pressing it down 0.3 mm |
| Radio carrier tray | 1 | a 50 × 70 perfboard carrier, 2 zip ties |

The bed is open on the wall side; the wall stops the cell rolling out. Its
four screws run down its middle, under the cell.

The charge board drops into the slot across the bed's middle before the
cell goes in. Its USB-C and USB-A face the middle of the case, flush with the
bed's inner face, and its button faces the wall. One zip tie goes up beside
it, over it, down the other side and back under the bed.

The carrier holds the radio stack:

- an Ebyte E22P-915M30S (1 W SX1262 radio, U.FL to the bulkhead's pigtail)
- a Seeed XIAO nRF54LM20A, which runs MeshCore and drives the E22P over SPI
- a Pololu U3V40F5 5 V boost: the E22P needs 5 V for the full watt, and the
  XIAO runs off the same rail

The tray has a rim on three sides; the front side (toward the latches) is
open for the connectors. Each zip tie goes up one slot, over the board, down
the other slot and back along a groove under the tray. The board rests on a
2 mm ledge, over a relief for its solder tails.

## Assembly

1. Screw the bed to the plate (4 × M5x10).
2. Drop in the charge board and tie it.
3. Lay in the cell and screw the hooks on (4 × M5x10).
4. Put the plate in the case.

## Antenna

Drill a 16.5 mm hole in the case's **left end wall**, centred across it,
45 mm above the inside floor, for an N female bulkhead (body and O-ring
inside, nut outside). Check that the wall is flat there for the O-ring.

## Printing

PETG, 4 walls, no supports. Plate 1 is the baseplate. Plate 2 has the bed,
the hooks (printed on their sides) and the tray.

## Hardware

- 12 × M5x10 cap screws
- 3 zip ties, up to 3.6 mm wide
- a 50 × 70 mm perfboard

## Not measured yet

The case is measured: inside 214 × 150, 76 deep in the base, the lid 18 deep,
corners about r 5. The charge board is 33 wide. Its length (40) is scaled
from a photo and its height over the USB-A (9) is a guess.
