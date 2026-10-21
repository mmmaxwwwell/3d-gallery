# Solar LoRa Node

A sealed box under a 240 × 168 mm solar panel salvaged from a Home Depot solar LED lamp. It holds a Heltec V3 LoRa node, a Heltec HT-HC33 HaLow board, a battery and solar charging. It hangs on two stainless cables and winches itself up.

It hangs with a long side down and the winch behind it. The box is a wedge: its back hangs plumb against the winch, and the panel sits on the sloping front at 50° from horizontal (`panel_tilt`). The antennas are at the top of a 3 m telescoping carbon-fibre mast that stands in a socket on top of the box, between the two cables. In the files, +Y is up.

Two views: **Assembled**, with the lid pulled off, and **Deployed**.

**Deployed** shows it winched up to the highest limb of a tree. The cables run up the limb's back and over it, and the 1 m bar ends up just under the limb. The last 2 m of mast rise behind the limb and hold the two N omnis above the canopy. The limb has to run across both cables, so the mast, 10 mm behind them, clears its back.

## Pieces

| Piece | Material | Prints |
|---|---|---|
| Tray | PETG | back down |
| Carrier plate | PETG | flat, brackets up |
| Frame | PETG | bottom down (groove on the bed) |
| Bezel | PETG | bottom down |
| Gasket | TPU 85A | floor down, slot up |
| Winch deck | PETG | plate down |
| Horn ×2 | PETG | standing, as it hangs (foot on the bed) |
| Access door ×2 | PETG | inner face down |
| Spool body ×2 | PETG | gear down |
| Spool cap ×2 | PETG | flange down |
| Pinion ×2 | PETG | teeth down |
| Spacer ×2 | PETG | on end |
| Shaft seal ×2 | TPU 85A | flat |
| Shroud seal | TPU 85A | flat |
| Connector hood ×2 | PETG | open side down, feet on the bed |

Assembled it's 263 mm wide, 186 mm tall from the bottom to the bezel's top edge (the horns stand 34 mm higher, the socket 40 mm), and 187 mm deep: the 163 mm wedge plus the 24 mm winch deck behind it. The tray prints back down, 263 × 219 × 154 mm, socket included. The deck prints 263 × 153 × 25 and each horn 44 × 75 × 72. The tray and deck need a 270 mm bed (Q2, U1).

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
  - An M4x35 bolt goes across socket and pole, 40 mm above the bore's floor. Drill the pole for it.
  - A buttress either side braces the socket against the top wall.
  - **Zip-tie anchors:** each buttress has three pairs of slots through it, front to back, for ties up to 3.6 mm wide. A tie goes in through one slot of a pair and out through the other, round anything laid along the socket's back (the coax, a crossmember's line).
- **Coax.** Two N-type omni antennas sit on a short crossarm at the mast's top. Two LMR-400 runs come down to them: too thick (10.3 mm) to go inside the mast, so they run down its back, tied to it, and down the socket's back over its tie slots.
  - Each run drops out of its hood's open back in a drip loop to an N bulkhead in the top wall (V3 at +x, HC33 at −x, 48 mm either side of the socket).
  - Each bulkhead is midway between two screws and points up and back, square to the wall. Both are N now; it was an SMA for the HC33 before the LMR-400.
- **Connector hoods.** A printed hood screws over each bulkhead and its plug, on two M3x10s into the top wall.
  - It is closed on the two faces that look up (its end and its front) and on both sides. It is open toward the wall and down the back, so it drains, and the pigtail leaves through that opening.
  - Its front reaches past the lid's top edge, resting on the frame's back face without being fixed to it, so the lid still lifts off.
  - It covers a plug up to 24 mm across and 50 mm long.
- **Keeping it upright.** Stabilising bars across the two cables, every third of a metre for the first metre (three bars), hold the mast to the cables, like a fishing rod's guides. Each slides on the cables through an eye at each end. The last 2 m stand free above the canopy.
  - The mast's axis is 14 mm in front of the back, and the cables are 24.5 mm, so each bar's clamp to the mast sits 10 mm behind the line between the cables.
  - The deployed view draws the bars, the mast in three telescoping sections (20, 16 and 12 mm), the LMR-400 and the antennas as references; none of them is a printed part yet.

## Assembly

1. **Battery and plate.**
   - Stick the battery down between its corner brackets with foam tape.
   - Set the HC33, V3, charger and buck-boost in their brackets on the plate, and zip-tie each one down through its slots, heads on top. Then screw the plate onto its four posts with M3x8s.
   - Fit the two N bulkheads out through the top wall, nuts inside, and run their pigtails.
2. **Motors.** For each one:
   1. Press a shaft seal into the pocket in its seat.
   2. From below, push a pinion's hub up through the seal.
   3. Set the motor on its seat, its D-shaft in the pinion's bore (glue it), and tape it between its brackets.
3. **Panel.** Run a bead of construction adhesive round the frame's ledge. Lay the panel in, with its leads down through the opening.
4. **Close the box.** Put the bezel on and drive the 28 M3x16s through bezel and frame. Do this on the tray, with the gasket in the frame's groove, so the screws thread into the tray's flange. The bezel squeezes the bead to 1 mm. Leave it to cure.
5. **Opening it later.** Undo the 28 screws and lift the frame, panel and bezel off together.
6. **Mast.** Push the mast into the socket and bolt it with the M4. Screw the hoods on. Run each LMR-400 up from its bulkhead, out of the hood's open back with a drip loop, up the socket's back (tie it through the slots) and up the mast to its antenna.

## Winch

- **The spools:**
  - two 116 mm spools sit side by side in the upper half, on a deck behind the tray;
  - each holds 200 ft of 1/32" stainless cable in an 8 mm channel: 10 turns across, 29 layers, about 233 ft if wound evenly;
  - that leaves 15% spare, because nothing guides the cable on evenly.
- **The drive:**
  - each spool turns on a 608 bearing on a post from the deck;
  - a pinion drives the teeth round each spool's lower flange at 6.2:1, from a JGY-370 worm gearmotor standing inside the box, shaft out through the back;
  - the worm holds the load when the motor stops.
- **Enclosure:** a plain rectangular wall rises from the deck to the back. It goes round both spools, both pinions and both guide bearings, so the whole winch runs in one closed box.
  - A TPU 85A strip in a groove on its top is squeezed 0.3 mm against the back by the deck's screws, which sit outside it.
  - Each cable leaves through a 4 mm hole in its top wall, straight above its guide bearing.
  - A 3 mm drain under each spool lets water out.
  - It keeps debris and splashes off the gears; it isn't watertight. The edge and throat bearings stay outside it, being stainless.
  - Wind each spool so the cable leaves from its outer side, toward its guide bearing.
- **Access doors**, one over each spool in the deck's outer face, for threading the cable on.
  - Undo the M3x6 at its foot and slide the door down: it runs in 45° dovetails down into a plain pocket below the window, and lifts out of the pocket.
  - **Rain.** A lip over the door's top sheds water onto its face, so the joint at the top faces down. The door laps the 27 × 36 mm window by 5 mm all round. Water that gets into the side joints runs down them into the pocket and out of a ramp at its foot.
  - **Anchoring the cable.** The spool's anchor is a 1.6 mm hole down through its gear ring beside the core, at the channel's floor, with an M3 pilot 5 mm further out. Jog the motor until the anchor shows in the window. Then feed the cable in round the guide bearing, into the channel and down the hole, and clamp its end under an M3x6 and washer on the ring's face.
- **Direction:** the two drives are mirror images, so the spools turn opposite ways to reel in.
- **Cable exit:** the cable runs only on stainless 608 skateboard bearings, four per corner. Each cable leaves its top corner, 196 mm from the other.
  1. Past its spool, it turns straight up on an upright **guide bearing** standing on the deck, outboard of the cable. The bearing turns on an M8x20 hex bolt up through the deck, threaded into the pad under it.
  2. It climbs the back of an **edge bearing** lying across above the back's top edge, and turns forward over it.
  3. It climbs forward into a **horn**: its own part, standing up behind the box's sloping top. Every bearing, and the cable, keeps 3 mm off the plane of the box's top (`horn_clear`).
  4. It leaves straight up through the horn's **throat**: a 1.5 mm gap between two more bearings, 24.5 mm in front of the back and 49 mm above its top edge.
- **The horns, reinforced:**
  - two 10 mm cheeks, solid between them below the cable, with an 8 mm bridge across their front;
  - held by two M5x30 up through the deck's top band and the horn's foot into the tray's solid top band;
  - and by four M5x16 through two feet lying on the box's sloping top, beside the cheeks, into its solid top wall.
  - So the cable's pull goes straight into the tray, not through the deck's M3s.
- **Keeping the cable on the races:** the horn's bearings turn on M8x35 bolts, clamped by their inner races between bosses on the cheeks. Each cheek is 0.5 mm from its bearing's outer race, which is less than the cable is thick, so the cable can't walk off a race. The guide bearing has the tray 0.7 mm above it and a pad 0.5 mm below.
- **Why the horns:** the throat is at the estimated depth of the node's centre of mass, so the node hangs with its back plumb.
  - The estimate weighs the modelled parts: PETG at 70–90% fill, a 300 g glass panel, the 190 g pouch, 2 × 110 g motors, 45 g of boards, the bearings and bolts, and 100 g of cable. It also counts 1.4 kg on the socket for the mast rig: a 300 g mast, 2 × 3.2 m of LMR-400 at 68 g/m, two 250 g antennas, the crossarm and the bars.
  - That gives about 4.0 kg, with the centre of mass 24–25 mm in front of the back as the cable pays out. A 1.0–1.8 kg rig moves it between 26 and 23.
  - To trim the hang after weighing a built one, change `hang_z`.
- **Assembly:**
  1. Press a bearing into each spool body from below.
  2. Screw on the cap with 6 M3x6.
  3. Drop each spool onto its post with a spacer on top, and bolt a 608 onto each guide pad with an M8x20 from under the deck.
  4. Lift the deck up against the back. The spool pins go into their sockets and the pinion pins go into the pinions. Screw it to the back with 14 M3x25: 7 along the top into the solid top wall, 7 along the bottom into bosses.
  5. Fit each horn's three bearings on M8x35 bolts. Bolt the horn on: two M5x30 up through the deck into the tray, four M5x16 through its feet.
  6. **Threading** (with the node in place): feed each cable down through its horn's throat, under the front throat bearing and over the rear, over the edge bearing and down through the hole in the enclosure's top. Open the door, lead the cable round the inboard side of its guide bearing and onto the spool, and clamp it at the anchor. Shut the door and reel in.

## Motor speed

The spool turns 12/74 of the motor's speed (6.17:1). The cable sits 27.5 mm from the axle on an empty spool and 50.6 mm on a full one, so the same motor speed reels in faster as the spool fills.

| Line speed | Spool rpm (full – empty) | Motor rpm (full – empty) |
|---|---|---|
| 1 m/min | 3.1 – 5.8 | 19 – 36 |
| 2 m/min | 6.3 – 11.6 | 39 – 71 |
| 3 m/min | 9.4 – 17.4 | 58 – 107 |
| 5 m/min | 15.7 – 28.9 | 97 – 178 |

**Load.** For a 4.0 kg node (mast rig included) on two lines, each line holds 20 N hanging straight, or 28 N at 45°. On a full spool, through the gears at 80% efficiency, that needs about 2.1–2.9 kg·cm at the motor. Allow 3× for jerks and stalls: about 9 kg·cm.

## Power

Panel → 5 V buck-boost → TP4056 → LP1260110 (10 Ah). The Heltec runs from the cell or from the 5 V rail.

If the cell goes on the Heltec's own battery connector, the Heltec's charger also charges it whenever the board has 5 V. Feed it from only one side.

## Unmeasured

- Panel thickness (`panel_t`, 3 mm assumed).
- The buck-boost board's size.
- The JGY-370's size and where its shaft is (`mot_*`, copied unmeasured from meshtastic-drybag-node).
- Motor torque is unchecked. The motor has to lift the node on a 27–51 mm cable radius through 6.2:1.
- The node's real weight and balance. The horns' throat depth (`hang_z`) is set from an estimate.
- The mast rig's weight on the socket: mast, LMR-400, antennas, crossarm and bars (1.4 kg assumed).
- How far the panel's cells come to its edge. The bezel covers 4 mm of the border (`bezel_overlap`).
