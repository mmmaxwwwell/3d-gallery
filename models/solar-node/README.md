# Solar LoRa Node

A slim sealed box under a 240 × 168 mm solar panel salvaged from a Home Depot solar LED lamp, holding a Heltec V3 LoRa node, its battery and its solar charging.

## Pieces

| Piece | Material | Prints |
|---|---|---|
| Tray | PETG | floor down |
| Shelf | PETG | flat, brackets up |
| Frame | PETG | bottom down (groove on the bed) |
| Bezel | PETG | bottom down |
| Gasket | TPU 85A | floor down, slot up |

The footprint is 263 × 191 mm, so it needs a 270 mm bed (Q2, U1). Height assembled is 40.5 mm. The battery with the shelf and the Heltec over it sets the inside height, with the N bulkhead's flange and nut only 1 mm behind.

## Assembly

1. Stick the battery down between its corner brackets along the −Y wall with foam tape. Screw the shelf onto its four posts over it with M3x8s, then tape the Heltec, charger and buck-boost into their brackets on the shelf. Fit the N bulkhead through the +X end wall, nut inside, and run the pigtail to the Heltec.
2. Run a bead of construction adhesive round the frame's ledge. Lay the panel in, with its leads down through the opening.
3. Put the bezel on and drive the 24 M3x16 screws through bezel and frame. Do this on the tray, with the gasket in the frame's groove, so the screws thread into the tray's columns. The bezel squeezes the bead to 1 mm. Leave it to cure.
4. To open the box later, undo the 24 screws and lift the frame, panel and bezel off together.

Everything inside sits along the −Y edge. Mount the box with that edge lowest, so the heavy cell sits at the bottom.

## Power

Panel → 5 V buck-boost → TP4056 → LP1260110 (10 Ah). The Heltec runs from the cell or from the 5 V rail.

If the cell goes on the Heltec's own battery connector, the Heltec's charger also charges it whenever the board has 5 V. Feed it from only one side.

## Unmeasured

- Panel thickness (`panel_t`, 3 mm assumed).
- The buck-boost board's size.
- How far the panel's cells come to its edge. The bezel covers 4 mm of the border (`bezel_overlap`).
