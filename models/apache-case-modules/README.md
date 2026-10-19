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
| Cell saddle | 2 | the 32140 LiFePO4 cell, lying along the back wall |
| Cell strap | 2 | screws over the cell into the saddle, squeezing it 0.3 mm |
| Charge board tray | 1 | the LiFePO4 charge board, 2 zip ties |
| Radio tray | 1 | XIAO nRF52840 + Wio-SX1262 stack, 2 zip ties |

Trays have a rim on three sides; the front side (toward the latches) is open
for the connectors. Each zip tie goes up one slot, over the board, down the
other slot and back along a groove under the tray.

## Antenna

Drill a 16.5 mm hole in the case's **right end wall**, centred across it,
45 mm above the inside floor, for an N female bulkhead (body and O-ring
inside, nut outside). Check that the wall is flat there for the O-ring.

## Printing

PETG, 4 walls, no supports. Plate 1 is the baseplate. Plate 2 has the
saddles, the straps (printed on their sides) and the trays.

## Hardware

- 12 × M3x8 cap screws: saddles and trays into the baseplate
- 4 × M3x12 cap screws: straps into the saddles
- 4 zip ties, up to 3.6 mm wide

## Not measured yet

The case is measured: inside 214 × 150, 76 deep in the base, the lid 18 deep,
corners about r 5. The board sizes are still guesses.
