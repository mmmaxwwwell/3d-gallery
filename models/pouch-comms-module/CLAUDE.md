# pouch-comms-module

A box for a backpack side pouch: power bank, Franklin T9, Pi Zero 2 W, Heltec HT-HC33. devOnly, unprinted.

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

## My picks (not the user's)

- **Bank lies 36.5 up, 44.5 across.** This is the thinner way up. Its ports face +Y, into the bay rather than out of a window.
- **Screws.** The lane is `screw_e` = 4.5 in from the outside, with bosses `boss_d` = 7 that swell 3 mm into the box. A 5 mm wall is too thin for a counterbore on its centreline.
  - The bank and the T9 start at `clear_e`, inside the bosses. The left bosses locate the bank's side.
  - The +Y wall's screws are placed round the SMAs: one between them, and the rest filled from the divider. An assert keeps each SMA nut off the bosses.
- **Indexing.** A tongue on the box, a groove in the lid, so both print without supports. The groove is `groove_break` short of each counterbore, and the tongue is `tongue_break` short of the screws. There's no lip into the box, since it would hit the bank's top edge.
- **Board rack.** There's only ~6 mm across between the bank and the T9, so the rack is beside the bank past the T9.
  - Each board is long side along Y, PCB in a YZ plane.
  - Ends are 2 mm short of the +Y wall, with the high post merged into the wall.
  - The USB end faces -Y, held by a low post `guide_low_h` over the board's bottom edge, under the USB-C.
  - The slots are evenly spread across the column, in the order HC33, V4, Pi.
- **Antennas.** The HC33 (HaLow) and V4 (LoRa) each get an SMA bulkhead in the +Y wall over the bay. The Pi and T9 keep their internal antennas.
- **T9 power button on the front face.** This is from the Franklin user manual (ManualsLib); its exact spot is unmeasured.
  - The micro-USB is on an end, which I take to be the "top" the user meant, and it faces +Y.
  - The cage is a plate over that end, on two pillars `pillar_dx` either side of the plug, M3x10 cap screws counterbored. The set screw goes through a hex nut pocket over the button.
  - It prints top down, so the pocket's and counterbores' floors are on the bed.
- No vents, no lid window, no external charging port. These are open questions in the README.

## Frame

- Origin is the outer -X -Y bottom corner. X runs across (140), Y along (190), Z up.
- Plan from -X: wall, screw bosses (to `clear_e`), bank pocket, divider, then the right column (`col_x0`..`col_x1`, 76.5 wide).
- `boards` is the rack's order, each `[length, width, pcb, thickness]`. `slot_x(i)`, `low_y0(b)` place each board.

## Checked

- `exploded.3mf` lifts the bank, T9 and boards 60 up, the cage 96 and the lid 132, and pulls the SMAs 30 out.
- These all intersect in zero volume (faces touching at most):
  - box with each reference part (bank, T9, boards, SMAs), the lid (tongue in groove) and the cage;
  - cage with the T9, the boards and the lid;
  - boards with the bank and the T9.
- Renders manifold through the forge (`buildModel`).
