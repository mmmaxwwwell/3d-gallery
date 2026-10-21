# Solar LoRa Node

A sealed box under a 240 × 168 mm solar panel salvaged from a Home Depot solar LED lamp. It holds a Heltec V3 LoRa node, a Heltec HT-HC33 HaLow board, a battery and solar charging. It hangs on two stainless cables and winches itself up.

It hangs with a long side down and the winch behind it. The box is a wedge: its back hangs plumb against the winch, and the panel sits on the sloping front at 50° from horizontal (`panel_tilt`). The antennas are at the top of a 3 m, 20 mm carbon-fibre pole that stands in a socket on top of the box, between the two cables. In the files, +Y is up.

## Pieces

| Piece | Material | Prints |
|---|---|---|
| Tray | PETG | back down |
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
| Shroud seal | TPU 85A | flat |

Assembled it's 263 mm wide, 186 mm tall from the bottom to the bezel's top edge (the horns and the socket stand 36 mm higher), and 184 mm deep: the 163 mm wedge plus the 21 mm winch deck behind it. The tray prints back down, 263 × 219 × 154 mm, socket included. The deck prints 267 × 222 × 79, so it needs a 270 mm bed (Q2, U1).

## The wedge

- The walls stand square to the panel, as on a flat box, so the gasket and tongue are unchanged. They run back to the plumb back, and a flat bottom closes the wedge.
- **Flange.** The lid's 28 screws go into a solid flange round the rim, 11 mm deep. Its underside chamfers 45° back to the wall, because flat it would overhang 50° when printed back down.
- The top wall runs 40 mm back from the frame (`top_depth`). The bottom wall runs 50 mm (`bottom_depth`), which sets the back's height (153 mm) for the spools.
- The top wall is solid out to the edge, all the way back. The deck's top screws go into it, and the bulkheads sit in recesses down to a 4 mm wall.

## Inside

All the electronics sit low and centred on the back:
- the LP1260110 lies along the bottom;
- a carrier plate on four posts over it holds the HT-HC33 and the TP4056 in the lower row, and the buck-boost and the V3 in the upper row.
- **Zip ties** hold every board down. They go through slots in the plate either side of each board: two ties across the HC33 and the V3, one across the charger and the buck-boost. The slots take ties up to 3.6 mm wide.
- The plate sits 3 mm above the pouch, which leaves room for the ties' straps underneath. The pouch can't lift out of its 6 mm brackets under the plate.

The two motors stand either side of the battery stack.

## Antenna pole

- **The socket.** It stands on the top wall's outside, plumb, in the middle, so the pole stands midway between the two cables.
  - Its bore is 20.4 mm and 50 mm deep, and stops above the wall, so the box stays sealed.
  - An M4 bolt goes across socket and pole, 12 mm above the bore's floor. Drill the pole for it.
- **Coax.** The N and SMA antennas sit at the pole's top, and their coax runs down inside it.
  - Drill an exit hole in the pole just above the socket.
  - From there, short pigtails go to the N (V3) and SMA (HC33) bulkheads in the top wall, 48 mm either side of the socket. Each bulkhead is midway between two screws and points up and back, square to the wall.
- **Keeping it upright.** For the first metre or so, horizontal crossmembers along the two cables hold the pole aligned, like a fishing rod's guides. The last 2 m stand free above the canopy.
  - The pole's axis is 14 mm in front of the back, and the cables are 32 mm, so each crossmember's pole clamp sits 18 mm behind the line between the cables.

## Assembly

1. **Battery and plate.**
   - Stick the battery down between its corner brackets with foam tape.
   - Set the HC33, V3, charger and buck-boost in their brackets on the plate, and zip-tie each one down through its slots, heads on top. Then screw the plate onto its four posts with M3x8s.
   - Fit the N and SMA bulkheads out through the top wall, nuts inside, and run their pigtails.
2. **Motors.** For each one:
   1. Press a shaft seal into the pocket in its seat.
   2. From below, push a pinion's hub up through the seal.
   3. Set the motor on its seat, its D-shaft in the pinion's bore (glue it), and tape it between its brackets.
3. **Panel.** Run a bead of construction adhesive round the frame's ledge. Lay the panel in, with its leads down through the opening.
4. **Close the box.** Put the bezel on and drive the 28 M3x16s through bezel and frame. Do this on the tray, with the gasket in the frame's groove, so the screws thread into the tray's flange. The bezel squeezes the bead to 1 mm. Leave it to cure.
5. **Opening it later.** Undo the 28 screws and lift the frame, panel and bezel off together.
6. **Pole.** Run the coax down the pole and out of its exit hole. Push the pole into the socket and bolt it with an M4. Then connect the pigtails to the bulkheads.

## Winch

- **The spools:**
  - two 116 mm spools sit side by side in the upper half, on a deck behind the tray;
  - each holds 200 ft of 1/32" stainless cable in an 8 mm channel: 10 turns across, 29 layers, about 233 ft if wound evenly;
  - that leaves 15% spare, because nothing guides the cable on evenly.
- **The drive:**
  - each spool turns on a 608 bearing on a post from the deck;
  - a pinion drives the teeth round each spool's lower flange at 6.2:1, from a JGY-370 worm gearmotor standing inside the box, shaft out through the back;
  - the worm holds the load when the motor stops.
- **Shroud:** a wall round both spools and both pinions rises from the deck to the back, so the gears run in a closed bay.
  - A TPU 85A strip in a groove on its top is squeezed 0.3 mm against the tray by the deck's screws, which sit outside it.
  - Each cable leaves through a slot cut where its path from the spool to its guide bearing crosses the wall: from the core out to a full spool, at the channel's depth.
  - A 3 mm drain at the bottom of each spool's bay lets water out.
  - This keeps debris and splashes off the gears; it isn't watertight. The guide, edge and throat bearings stay outside it, being stainless.
  - Wind each spool so the cable leaves from its outer side, toward its slot.
- **Direction:** the two drives are mirror images, so the spools turn opposite ways to reel in.
- **Cable exit:** the cable runs only on stainless 608 skateboard bearings, four per corner. Each cable leaves its top corner, 218 mm from the other.
  1. Past its spool, it turns straight up on an upright **guide bearing** standing on the deck, outboard of the cable.
  2. It climbs the back of an **edge bearing** lying across above the back's top edge, and turns forward over it.
  3. It climbs forward into a **horn**: two cheeks standing up behind the box's sloping top, with a bridge across their front. Every bearing, and the cable, keeps 3 mm off the plane of the box's top (`horn_clear`).
  4. It leaves straight up through the horn's **throat**: a 1.5 mm gap between two more bearings, 32 mm in front of the back and 55 mm above its top edge.
- **Keeping the cable on the races:** the horn's bearings turn on M8x25 bolts, clamped by their inner races between bosses on the cheeks. Each cheek is 0.5 mm from its bearing's outer race, which is less than the cable is thick, so the cable can't walk off a race. The guide bearing has the tray 0.7 mm above it and a pad 0.5 mm below.
- **Why the horns:** the throat is at the estimated depth of the node's centre of mass, so the node hangs with its back plumb.
  - The estimate weighs the modelled parts: PETG at 70–85% fill, a 300 g glass panel, the 190 g pouch, 2 × 110 g motors, 45 g of boards, the bearings and bolts, and 100 g of cable. It also counts 450 g for the pole with its antennas and coax.
  - That gives about 2.7 kg, with the centre of mass 31–33 mm in front of the back as the cable pays out. A 350–600 g pole moves it by about 1 mm.
  - To trim the hang after weighing a built one, change `hang_z`.
- **Assembly:**
  1. Press a bearing into each spool body from below.
  2. Screw on the cap with 6 M3x6.
  3. Thread the cable's end through the hole in the core and stop it inside.
  4. Wind each spool, then drop it onto its post with a spacer on top.
  5. Drop a 608 onto each corner's guide post.
  6. Lead each cable round the inboard side of its guide bearing. Then fit the horn's three bearings on M8x25 bolts, so the cable goes over the edge bearing, over the rear throat bearing and under the front one.
  7. Lift the deck up against the back. The spool pins go into their sockets and the pinion pins go into the pinions.
  8. Screw the deck to the back with 16 M3x25: 9 along the top into the solid top wall, 7 along the bottom into bosses.

## Motor speed

The spool turns 12/74 of the motor's speed (6.17:1). The cable sits 27.5 mm from the axle on an empty spool and 50.6 mm on a full one, so the same motor speed reels in faster as the spool fills.

| Line speed | Spool rpm (full – empty) | Motor rpm (full – empty) |
|---|---|---|
| 1 m/min | 3.1 – 5.8 | 19 – 36 |
| 2 m/min | 6.3 – 11.6 | 39 – 71 |
| 3 m/min | 9.4 – 17.4 | 58 – 107 |
| 5 m/min | 15.7 – 28.9 | 97 – 178 |

**Load.** For a 2.7 kg node (pole included) on two lines, each line holds 13 N hanging straight, or 19 N at 45°. On a full spool, through the gears at 80% efficiency, that needs about 1.4–2.0 kg·cm at the motor. Allow 3× for jerks and stalls: about 6 kg·cm.

## Power

Panel → 5 V buck-boost → TP4056 → LP1260110 (10 Ah). The Heltec runs from the cell or from the 5 V rail.

If the cell goes on the Heltec's own battery connector, the Heltec's charger also charges it whenever the board has 5 V. Feed it from only one side.

## Unmeasured

- Panel thickness (`panel_t`, 3 mm assumed).
- The buck-boost board's size.
- The JGY-370's size and where its shaft is (`mot_*`, copied unmeasured from meshtastic-drybag-node).
- Motor torque is unchecked. The motor has to lift the node on a 27–51 mm cable radius through 6.2:1.
- The node's real weight and balance. The horns' throat depth (`hang_z`) is set from an estimate.
- The pole's weight, with its antennas, coax and crossmembers (450 g assumed).
- How far the panel's cells come to its edge. The bezel covers 4 mm of the border (`bezel_overlap`).
