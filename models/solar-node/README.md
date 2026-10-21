# Solar LoRa Node

A sealed box under a 240 × 168 mm solar panel salvaged from a Home Depot solar LED lamp. It holds a Heltec V3 LoRa node, a Heltec HT-HC33 HaLow board, a battery and solar charging. It hangs on two stainless cables and winches itself up.

It hangs with a long side down. The panel faces out, and the winch is behind it. In the files, +Y is up.

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
| Pinion ×2 | PETG | teeth down |
| Spacer ×2 | PETG | on end |
| Shaft seal ×2 | TPU 85A | flat |

The footprint is 263 × 191 mm, plus the horns: the deck prints 263 × 222, so it needs a 270 mm bed (Q2, U1). Height assembled is 62 mm: the 40.5 mm box plus the 21.2 mm winch deck behind it.

## Inside

All the electronics sit low and centred, so it hangs level:
- the LP1260110 lies along the bottom;
- a carrier plate on four posts over it holds the HT-HC33 and the TP4056 in the lower row, and the buck-boost and the V3 in the upper row.

The N (for the V3) and the SMA (for the HC33) point down out of the bottom wall, 48 mm each side of centre. Each sits midway between two screw columns, which splits the wall about evenly. The two motors stand either side of the battery stack.

## Assembly

1. **Battery and plate.**
   - Stick the battery down between its corner brackets with foam tape.
   - Screw the carrier plate onto its four posts with M3x8s.
   - Tape the HC33, V3, charger and buck-boost into their brackets on the plate.
   - Fit the N and SMA bulkheads up through the bottom wall, nuts inside, and run their pigtails.
2. **Motors.** For each one:
   1. Press a shaft seal into the pocket in its seat.
   2. From below, push a pinion's hub up through the seal.
   3. Set the motor on its seat, its D-shaft in the pinion's bore (glue it), and tape it between its brackets.
3. **Panel.** Run a bead of construction adhesive round the frame's ledge. Lay the panel in, with its leads down through the opening.
4. **Close the box.** Put the bezel on and drive the 28 M3x16s through bezel and frame. Do this on the tray, with the gasket in the frame's groove, so the screws thread into the tray's columns. The bezel squeezes the bead to 1 mm. Leave it to cure.
5. **Opening it later.** Undo the 28 screws and lift the frame, panel and bezel off together.

## Winch

- **The spools:**
  - two 116 mm spools sit side by side in the upper half, on a deck behind the tray;
  - each holds 200 ft of 1/32" stainless cable in an 8 mm channel: 10 turns across, 29 layers, about 233 ft if wound evenly;
  - that leaves 15% spare, because nothing guides the cable on evenly.
- **The drive:**
  - each spool turns on a 608 bearing on a post from the deck;
  - a pinion drives the teeth round each spool's lower flange at 6.2:1, from a JGY-370 worm gearmotor standing inside the box, shaft down through the floor;
  - the worm holds the load when the motor stops.
- **Direction:** the two drives are mirror images, so the spools turn opposite ways to reel in.
- **Cable exit:** the cable runs only on stainless 608 skateboard bearings, four per corner. Each cable leaves its top corner, 218 mm from the other.
  1. Past its spool, it turns straight up on an upright **guide bearing** standing on the deck, outboard of the cable.
  2. It rides over an **edge bearing** lying across just past the tray's top edge. The edge bearing's top sits half a millimetre under the tray, so the cable never touches the tray's corner. It hangs through a slot in the deck.
  3. It climbs forward into a **horn**: two cheeks standing out past the edge, with a bridge across their top.
  4. It leaves straight up through the horn's **throat**: a 1.5 mm gap between two more bearings, 13 mm in front of the tray's underside.
- **Keeping the cable on the races:** the horn's bearings turn on M8x25 bolts, clamped by their inner races between bosses on the cheeks. Each cheek is 0.5 mm from its bearing's outer race, which is less than the cable is thick, so the cable can't walk off a race. The guide bearing has the tray 0.7 mm above it and a pad 0.5 mm below.
- **Why the horns:** the throat is at the estimated depth of the node's centre of mass, which moves between 12 and 15 mm in front of the tray's underside as the spools fill. So the node hangs upright. Leaving at the deck, 8 mm behind the tray, it tipped back about 12°. To trim the hang after weighing a built one, change `hang_z`.
- **Assembly:**
  1. Press a bearing into each spool body from below.
  2. Screw on the cap with 6 M3x6.
  3. Thread the cable's end through the hole in the core and stop it inside.
  4. Wind each spool, then drop it onto its post with a spacer on top.
  5. Drop a 608 onto each corner's guide post.
  6. Lead each cable round the inboard side of its guide bearing. Then fit the horn's three bearings on M8x25 bolts, so the cable goes over the edge bearing, over the rear throat bearing and under the front one.
  7. Lift the deck up under the tray. The spool pins go into their sockets and the pinion pins go into the pinions.
  8. Screw the deck into the long-side columns with 18 M3x25.

## Power

Panel → 5 V buck-boost → TP4056 → LP1260110 (10 Ah). The Heltec runs from the cell or from the 5 V rail.

If the cell goes on the Heltec's own battery connector, the Heltec's charger also charges it whenever the board has 5 V. Feed it from only one side.

## Unmeasured

- Panel thickness (`panel_t`, 3 mm assumed).
- The buck-boost board's size.
- The JGY-370's size and where its shaft is (`mot_*`, copied unmeasured from meshtastic-drybag-node).
- Motor torque is unchecked. The motor has to lift the node on a 27–51 mm cable radius through 6.2:1.
- The node's real weight and balance. The horns' throat depth (`hang_z`) is set from an estimate.
- How far the panel's cells come to its edge. The bezel covers 4 mm of the border (`bezel_overlap`).
