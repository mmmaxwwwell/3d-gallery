# Solar LoRa Node

A sealed box under a 240 × 168 mm solar panel salvaged from a Home Depot solar LED lamp. It holds a Heltec V3 LoRa node, a Heltec HT-HC33 HaLow board, a battery and solar charging, and it winches itself up on two stainless cables.

## Pieces

| Piece | Material | Prints |
|---|---|---|
| Tray | PETG | floor down |
| Carrier plate | PETG | flat, brackets up |
| Frame | PETG | bottom down (groove on the bed) |
| Bezel | PETG | bottom down |
| Gasket | TPU 85A | floor down, slot up |
| Winch deck | PETG | plate down |
| Spool body ×2 | PETG | gear down |
| Spool cap ×2 | PETG | flange down |
| Pinion, upper and lower | PETG | teeth down |
| Spacer, upper and lower | PETG | on end |
| Shaft seal ×2 | TPU 85A | flat |

The footprint is 263 × 191 mm, so it needs a 270 mm bed (Q2, U1). Height assembled is 67 mm: the 40.5 mm box plus the 26.4 mm winch deck under it. The battery, with the carrier plate and the Heltec over it, sets the box's inside height.

## Assembly

1. Stick the battery down between its corner brackets at the +X end with foam tape. Screw the carrier plate onto its four posts over it with M3x8s. Then tape the Heltec, charger and buck-boost into their brackets on the plate. Fit the N bulkhead through the +X end wall, nut inside, and run the pigtail to the Heltec.
2. Run a bead of construction adhesive round the frame's ledge. Lay the panel in, with its leads down through the opening.
3. Put the bezel on and drive the 24 M3x16 screws through bezel and frame. Do this on the tray, with the gasket in the frame's groove, so the screws thread into the tray's columns. The bezel squeezes the bead to 1 mm. Leave it to cure.
4. To open the box later, undo the 24 screws and lift the frame, panel and bezel off together.

Before step 2, fit the rest of the inside:
- Lay the HT-HC33 between its brackets at the −X end, and fit its SMA bulkhead through the −X end wall, nut inside. The N and SMA come out of opposite ends on the centre line, at the same height.
- Fit each motor:
  1. Press a shaft seal into the pocket in its seat.
  2. From below, push the pinion's hub up through the seal.
  3. Set the motor on its seat over the pinion, with its D-shaft in the pinion's bore (glue it), and tape it between its brackets.

## Winch

- **The spools:** two 162 mm spools are stacked on one axis under the middle of the tray. Each holds 100 ft of 1/32" stainless cable in a 3 mm channel: 3 turns across, 30 layers, about 116 ft if wound evenly. That leaves 15% spare, because nothing guides the cable on evenly.
- **The drive:** each spool turns on its own 608 bearing on the deck's centre post, with a spacer between the two bearings and one above. A pinion drives the teeth round each spool's lower flange at 8.8:1, from a JGY-370 worm gearmotor lying inside the box, shaft down through the floor. The worm holds the load when the motor stops.
- **Clearance:** both pinions are on the −X side. Each sits just outside the other spool's teeth, so the lower spool's pinion hub and the upper pinion's post pass the other level with 1.5–2.5 mm to spare.
- **Direction:** wind the two cables on opposite hands, so the spools turn opposite ways to reel in. The motors are independent.
- **Cable exit:** the cable comes off between the deck's pillars.
- **Assembly:**
  1. Press a bearing into each spool body from below.
  2. Screw on the cap with 6 M3x6.
  3. Thread the cable's end through the hole in the core and stop it inside.
  4. On the deck's centre pin, stack the lower spool, the spacer between the bearings, the upper spool, then the top spacer.
  5. Lift the deck up under the tray. The centre pin goes into its socket and the pinion pins go into the pinions.
  6. Screw the deck into the long-side columns with 16 M3x30.

## Power

Panel → 5 V buck-boost → TP4056 → LP1260110 (10 Ah). The Heltec runs from the cell or from the 5 V rail.

If the cell goes on the Heltec's own battery connector, the Heltec's charger also charges it whenever the board has 5 V. Feed it from only one side.

## Unmeasured

- Panel thickness (`panel_t`, 3 mm assumed).
- The buck-boost board's size.
- The JGY-370's size and where its shaft is (`mot_*`, copied unmeasured from meshtastic-drybag-node).
- The motor needs enough torque for the node's weight on a 51–75 mm cable radius through 8.8:1. This is unchecked.
- How far the panel's cells come to its edge. The bezel covers 4 mm of the border (`bezel_overlap`).
