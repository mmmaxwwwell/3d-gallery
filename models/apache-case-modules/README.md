# Apache Case Modules: MeshCore Repeater

A modular insert for a Harbor Freight Apache case. The first build is a
portable MeshCore repeater in an **Apache 1800 (small)** with its foam removed.

## How it works

- **Baseplate**: fills the case floor (212 × 148 × 6 mm). It has a 20 mm grid
  of M3 pilot holes, 10 × 7.
- **Modules** screw down onto the grid with M3 cap screws in counterbores.
  Every module's holes are a multiple of 20 mm apart, so any module can move
  to any grid point without reprinting the plate.

## The repeater's modules

| Part | Qty | Holds |
|------|-----|-------|
| Cell saddle | 2 | the 32140 LiFePO4 cell, lying front to back along the right end |
| Cell strap | 2 | screws over the cell into the saddle, squeezing it 0.3 mm |
| Charge board tray | 1 | the LiFePO4 charge board, 2 zip ties |
| Radio carrier tray | 1 | a 50 × 70 perfboard carrier, 2 zip ties |

The carrier holds the radio stack:

- an Ebyte E22P-915M30S (1 W SX1262 radio, U.FL to the bulkhead's pigtail)
- a Seeed XIAO nRF54LM20A, which runs MeshCore and drives the E22P over SPI
- a Pololu U3V40F5 5 V boost: the E22P needs 5 V for the full watt, and the
  XIAO runs off the same rail

Trays have a rim on three sides; the front side (toward the latches) is open
for the connectors. Each zip tie goes up one slot, over the board, down the
other slot and back along a groove under the tray. The board rests on a 2 mm ledge, over a
relief for its solder tails.

## Antenna

Drill a 16.5 mm hole in the case's **left end wall**, centred across it,
45 mm above the inside floor, for an N female bulkhead (body and O-ring
inside, nut outside). Check that the wall is flat there for the O-ring.

## Printing

PETG, 4 walls, no supports. Plate 1 is the baseplate. Plate 2 has the
saddles, the straps (printed on their sides) and the trays.

## Hardware

- 12 × M3x8 cap screws: saddles and trays into the baseplate
- 4 × M3x12 cap screws: straps into the saddles
- 4 zip ties, up to 3.6 mm wide
- a 50 × 70 mm perfboard

## Not measured yet

The case is measured: inside 214 × 150, 76 deep in the base, the lid 18 deep,
corners about r 5. The charge board's size is still a guess.
