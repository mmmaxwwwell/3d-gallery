# Kobo Clara HD MeshCore Grip

A sealed handheld grip that turns a Kobo Clara HD into a MeshCore device without modifying it. 80 × 125 × 30.3 mm.

- **Printed parts:** grip, back cover and bezel in PCTG; seals in soft TPU (85A and 70A).
- **Hardware:** twenty M3x8 and four M2x5 cap screws, two zip ties.

## What it does

- **The Kobo stays whole.** Hold it in landscape and slide its chin (the wide bezel at its bottom edge) sideways into the grip's slot. It slides out the same way.
  - A 90° micro USB plug in the slot's end goes into the Kobo's port, so the Kobo charges while it's in.
  - A soft TPU 70A pad in the slot's floor holds the Kobo.
  - The slot's end wall is relieved over the power button so it isn't held down. The button is covered.
- **E-paper.** A 2.13" e-paper module stands in front of the Kobo's chin, under a screwed-on bezel.
  - The module drops into its pocket from the front, and the bezel holds it with four M2 screws in its corners.
  - A 0.8 mm wall behind the module keeps the Kobo off its parts.
  - Its wires run out of the pocket's bottom end, back through the solid strip beside the Kobo's end, into the electronics bay.
  - **Take the 40-pin header and the white JST connector off the module first.** There's no room for them. Solder wires to its row of 8 holes (VCC GND DIN CLK CS DC RST BUSY).
- **Cylinder.** An 18650 (with wire leads) lies in a cylinder up the right side, flush with the front and standing out at the back.
- **Electronics bay**, behind the Kobo, closed by the back cover:
  - A **TP4056 USB-C charger** sits just above the cell, its USB-C through the right side under the first antenna.
  - Three **Seeed XIAO boards** (an nRF and two SX1262 radios) stand on end, one under the other, right under the cover.
  - Zip-tie bars hold the boards: one tie runs over all three XIAOs, one across the charger.
- **Two SMA bulkheads** stand in the top wall, over the cylinder and at the top left. Each jack goes up into its hex hole from inside, and its nut tightens on top.
- **Strip antenna.** One radio can use an internal strip antenna instead, stuck inside the rounded inner end.
- **Grip.** Every outside edge is rounded, and finger indents run up both sides every 15 mm.

## Sealing

These follow the rules learned on the dry-bag node:
- The body and lids are rigid PCTG.
- The seals are soft TPU, squeezed from the side, never clamped flat by screws.
- Every screw sits outside its seal.

| Joint | Seal |
|---|---|
| Back cover | A U-section **TPU 85A gasket** lies in a groove round the grip's back rim. The cover's tongue is 0.4 mm wider than the gasket's slot and presses into it from the side, so the seal doesn't depend on how tight the screws are. Outside the groove, **twenty M3 screws** run in a lane round the whole edge: every corner and about every 20 mm down each side, along the bottom and either side of the second SMA along the top. They clear the USB-C's opening. The cover's middle has none: a hole there would open into the sealed bay, and the side-squeeze seal doesn't need clamping. |
| Second SMA | Its hole would cut the groove, so a smooth 45° boss lifts the seal over it. The boss sits in a pocket inside the cover, so the outside stays flat. |
| SMAs | A **TPU 85A washer** under each outer nut. |
| USB-C | A **TPU 85A plug**, 0.3 mm oversize, with a pull tab. |
| Bezel | A **TPU 70A frame** between the bezel and the panel's border. |
| Micro USB plug and display wires | **Pot them** with neutral-cure silicone or epoxy where they pass into the bay. Do this once they're wired and tested. |
| Kobo pad | Sits in a recess. Nothing goes through the floor. |

The Kobo itself and the display's front sit outside the seal; the bay behind the cover is the dry space. The gasket prints flat. Over the second SMA's boss it stretches up the 45° flanks, about 2.7 mm longer there.

**None of this has been tested.** Check it in a sink before trusting it.

## Assembly order

1. Push both SMA jacks up into their hex holes from inside, then fit washers and nuts on top. Do this before the XIAOs: the left jack needs room below its hole.
2. Fit the cell, the charger, then the XIAOs, and zip-tie them.
3. Fit the micro USB plug into its pocket from the bay side.
4. Fit the display from the front, its wires through the channel, then its gasket and bezel.
5. Wire and test everything, then pot the plug's pocket and the wire channel.
6. Press the gasket into the groove, then screw on the cover.

## Estimates to measure

- **From Kobo's drawing:** the screen's position (sets where the grip's front starts), the power button, and the micro USB port. A fixed plug has to line up with the port within about 0.3 mm.
- **Display module:** 65 × 30.2 mm. The panel's view area is assumed centred.
- **TP4056 board:** 28 × 17.5 mm.

## Printing

| Plate | Material | Pieces |
|---|---|---|
| 1 | PCTG | grip, standing on its bottom end |
| 2 | PCTG | back cover and bezel, outer faces down |
| 3 | TPU 85A | back gasket, USB-C plug, 2 SMA washers |
| 4 | TPU 70A | bezel gasket, Kobo pad |

No supports:
- Every wall of the grip runs straight up. Anything hung under a wall rises at 45°.
- The slot's top end and the display pocket's top end are short bridges.
- The bottom corners and screw seats are octagonal or 45°.
