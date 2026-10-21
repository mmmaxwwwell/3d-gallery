# pouch-comms-module

A box for a backpack side pouch: power bank, Franklin T9, Pi Zero 2 W, Heltec HT-HC33, Heltec V4, two FR120N MOSFET modules. devOnly, unprinted.

## The user's brief (2026-10-20)

- "a holder for some electronics to fit inside a side pouch on my backpack", "a handheld telecommunications/electronics module".
- Overall size 30 × 140 × 190.
- Contents:
  - one power bank, 44.5 × 36.5 × 145;
  - Franklin T9, 94 × 67 × 14;
  - Pi Zero 2 W;
  - HT-HC33.
- The bank doesn't fit inside 30. Asked about it, the user said: "do 5mm walls however thick". So `wall` = 5 everywhere, and the height follows from the bank: 5 + 36.5 + 1 + 5 = 47.5.

## Later asks (2026-10-21)

- "the power bank needs something holding it back on the right edge when looking down at it". The divider already held the long right side, so I read this as the port end, where nothing stopped the bank sliding into the bay. Two full-height posts, `bank_post_reach` × `bank_post_t`, now sit at its corners.
- An exploded view: `previews/exploded.scad`.
- "the top should have a ton more screws and indexing features": 21 screws, no more than `screw_pitch` apart, plus the tongue and groove.
- "we also have to add a haltec v4": a Heltec WiFi LoRa 32 V4, 51.7 × 25.4 × 10.7 (Heltec's page).
- "the 3 boards need to slide into slots vertically next to the power bank".
- The Franklin "has a microusb sticking out the top of it, and needs to have its power button held … a cage with a m3 set screw".
- "really look at each of the circuit board modules and get the exact dimensions right so everything fits", and add "FR120N MOSFET Module Optocoupler Isolation Transistor Switch 100V 9.4A … 5 Pack switch on/off LED loads". Asked how many go in the box, the user said 2.

## Where the board figures come from (2026-10-21)

- **HT-HC33**: Heltec datasheet Rev 1.0 §7.1, 60 × 33.5, M2 holes 2 in from each edge (56 × 29.53). The USB-C is flush with its end; the 61.54 overall is the micro-SD socket, 1.54 past the other end, across 9.2–24 of the height. Buttons at the USB end sit 7.1–10.5 in from each long edge. U.FL near the micro-SD end, about central. Thickness 1.5 / 3.6 under / 3.3 over is the user's own measurement (the datasheet says 7.1 overall).
- **Heltec V4**: datasheet Rev 1.4 §5 (Aug 2025), 51.69 to the tip of the chamfered antenna end (3.81 × 45°), USB-C ≈1.1 past the other end (measured off the drawing), 25.4 high, headers on 22.86 centres. Side view: OLED 5.5 over, PCB 1.6, sockets 3.6 under (10.7), pins 15.6 if fitted. Buttons at the USB-end corners 3.0–6.5 in (top), SH1.25 sockets from 4.33 (bottom). LoRa U.FL on top, central, ≈2 from the tip. No corner holes: only the OLED bracket's two M2 screws.
- **Pi Zero 2 W**: mechanical drawing RP-008358, 65 × 30, M2.5 holes 3.5 in. Ports on one long edge (mini-HDMI at 12.4, micro-USBs at 41.4 and 54). The micro-SD socket spans 7.1–19 from the GPIO edge at one end, the card ≈2 past it. The camera connector spans 6.9–22.7 at the other. PCB 1.0 and parts 3 over / 1 under are unmeasured (5 overall per the product brief).
- **FR120N (DIYables 5-pack)**: 33.5 × 16.5 from the listing. A 3-way screw terminal at one end and a 2-way at the other, both facing outward. PCB 1.6, terminal height 10 and solder tails 2 are guesses.

## My picks (not the user's)

- **Bank lies 36.5 up, 44.5 across.** This is the thinner way up. Its ports face +Y, into the bay rather than out of a window.
- **Screws.** The lane is `screw_e` = 4.5 in from the outside, with bosses `boss_d` = 7 that swell 3 mm into the box. A 5 mm wall is too thin for a counterbore on its centreline.
  - The bank and the T9 start at `clear_e`, inside the bosses. The left bosses locate the bank's side.
  - The +Y wall's screws are placed round the SMAs: one between them, and the rest filled from the divider. An assert keeps each SMA nut off the bosses.
- **Indexing.** A tongue on the box, a groove in the lid, so both print without supports. The groove is `groove_break` short of each counterbore, and the tongue is `tongue_break` short of the screws. There's no lip into the box, since it would hit the bank's top edge.
- **Board rack.** There's only ~6 mm across between the bank and the T9, so the rack is beside the bank past the T9.
  - Each board is long side along Y, PCB in a YZ plane.
  - Ends are 2 mm short of the +Y wall, with the high post merged into the wall.
  - Each board's -Y end (HC33 and V4: the USB-C; Pi: the micro-SD) has a low post that grips only up to `*_low` over the board's bottom edge, under the buttons and sockets there.
  - The +Y high post is cut through (`*_gaps`) where that end has parts: the HC33's micro-SD and U.FL, the V4's U.FL, the Pi's camera connector. The HC33's micro-SD overhang fits in `board_back`.
  - Every board's top face is +X. Each one's parts span (under + PCB + over) is centred in an equal share of the column, in the order HC33, V4, Pi. That leaves about 16 mm between neighbours for the U.FL plugs.
  - No headers fitted on any board. The V4's soldered pins would hit the floor groove, and a Pi header would too.
  - **The Pi stands ports up**, about 9 mm under the lid. Plan: power it through GPIO 5 V / GND (pins 2 and 6), not the micro-USB.
- **FR120N shelf.** The cage plate carries on toward -Y over the T9 as a `shelf_t` shelf, 1.5 over the T9's face, with no feet (it would land on the T9 if pushed).
  - The two modules lie side by side, long side along Y, in rails: a wall either side plus a `rail_ledge` that holds the PCB edge `fr_tails` clear of the shelf.
  - `fr_wire_room` is left at both ends for the terminals' wires. Nothing stops the modules sliding along the rails but their wires.
  - Terminals top out at 37.1, under the lid's 42.5.
- **Antennas.** The HC33 (HaLow) and V4 (LoRa) each get an SMA bulkhead in the +Y wall over the bay. The Pi and T9 keep their internal antennas.
- **T9 power button on the front face.** This is from the Franklin user manual (ManualsLib); its exact spot is unmeasured.
  - The micro-USB is on an end, which I take to be the "top" the user meant, and it faces +Y.
  - The cage is a plate over that end, on two pillars `pillar_dx` either side of the plug, M3x10 cap screws counterbored. The set screw goes through a hex nut pocket over the button.
  - It prints as it sits, plate down. The counterbores and nut pocket open upward, their floors on solid plate, so nothing bridges. An earlier version printed it top down, which put those floors over air.
- No vents, no lid window, no external charging port. These are open questions in the README.

## Frame

- Origin is the outer -X -Y bottom corner. X runs across (140), Y along (190), Z up.
- Plan from -X: wall, screw bosses (to `clear_e`), bank pocket, divider, then the right column (`col_x0`..`col_x1`, 76.5 wide).
- `boards` is the rack's order, each `[length, height, pcb, over, under, low grip, gaps]`. `slot_x(i)` is the PCB's centre, and `low_y0(b)` places each low post.
- The shelf runs `shelf_x0`..+`shelf_w` and `shelf_y0`..`shelf_y1` (= `cage_y0`). `fr_x0(i)`, `fr_y0` and `fr_z0` place each module.

## Checked

- `exploded.3mf` lifts the bank, T9 and boards 60 up, the cage 96, the FR120Ns 114 and the lid 132, and pulls the SMAs 30 out.
- These all intersect in zero volume (faces touching at most):
  - box with each reference part (bank, T9, boards, SMAs), the lid (tongue in groove) and the cage;
  - cage with the T9, the boards, the FR120Ns and the lid;
  - FR120Ns with the box, the T9, the boards and the lid;
  - boards with the bank and the T9.
- Renders through the dev server's forge (devOnly, so `npm run build:model` skips it), and each part renders on its own with OpenSCAD (Manifold).
