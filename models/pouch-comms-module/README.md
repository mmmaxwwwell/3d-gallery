# Pouch Comms Module

A box for a backpack side pouch that carries:
- a power bank;
- a Franklin T9 hotspot;
- three boards: a Raspberry Pi Zero 2 W, a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow) and a Heltec WiFi LoRa 32 V4;
- two FR120N MOSFET modules (DIYables) that switch LED loads.

## Pieces

| Piece | Material | Prints |
|---|---|---|
| Box | PETG | floor down |
| Lid | PETG | flat, counterbores up |
| T9 cage and FR120N shelf | PETG | as it sits, plate down |

The box is 140 × 190 mm and 47.5 mm tall with the lid on. The walls, floor and lid are all 5 mm. The bank's 36.5 mm height sets the depth.

## Layout

The +Y end (the SMA end) is the end that sticks out of the pouch.

- **Power bank.** It lies along the left side, between the left wall's screw bosses and a full-height divider, with its ports toward +Y.
  - A rib stops it at the -Y end.
  - At the port end, two posts catch its corners. They reach 5 mm in from each side, which leaves the middle 34.5 mm clear for the ports.
- **Bay.** The open space above the bank holds its plugs and the cables. It opens into the right side past the end of the divider.
- **SMA bulkheads.** Two go through the +Y wall over the bay, for the HC33's HaLow antenna and the V4's LoRa antenna, each on a U.FL pigtail.
- **Franklin T9.**
  - It lies face up at the -Y end of the right side, between corner brackets, with its micro-USB end toward +Y.
  - Its plug has 27 mm of room in front of it before the next post.
  - The **cage** is a plate over the T9's port end, screwed onto two pillars that stand either side of the plug. An M3 set screw through a captive nut in the plate holds the power button down, so the T9 starts whenever it gets power.
- **FR120N shelf.** The cage plate carries on over the T9 as a shelf. The two FR120Ns lie on it side by side in rails, screw terminals up, with 8 mm at each end for the wires.
- **Boards.** Beside the bank, past the T9, the HC33, V4 and Pi stand on edge in slots, in that order out from the divider. Every board's component side faces the right wall.
  - Each slides down into a groove in the floor, between a full-height slotted post at its +Y end and a low one at its -Y end.
  - The low post only grips the bottom few mm of the board's end (6.5 for the HC33 and Pi, 2.8 for the V4), so it stays under the buttons and sockets there.
  - The high post is cut away where that end has parts: the HC33's micro-SD and U.FL, the V4's LoRa U.FL, the Pi's camera connector.
  - The HC33 and V4 have their USB-C at the -Y end; the Pi has its micro-SD there, and its ports face up.
  - The V4 is the shortest, so it takes the middle slot, in line with the T9's plug.
  - Sizes come from Heltec's datasheets (HC33 Rev 1.0, V4 Rev 1.4) and the Pi Zero 2 W mechanical drawing.
- **Lid.** 21 M3 cap screws hold it on, in bosses along every wall. A 1.2 mm tongue round the top of the walls and along the divider drops into a groove under the lid, so the lid only goes on one way.

## Assembly

1. Fit the SMA bulkheads through the end wall, nuts inside.
2. Stick the T9 down between its brackets, face up, port end toward the boards. Plug its micro-USB in.
3. Put the M3 nut in the cage's pocket and thread the set screw through it. Slide the two FR120Ns into the shelf's rails and wire them. Screw the cage onto its pillars with 2 M3x10.
4. Turn the set screw down until the T9's button stays pressed.
5. Stick the bank down and plug it in.
6. Slide the boards down into their slots, USB end toward the T9.
7. Put the lid on with 21 M3x10 cap screws.

## Unmeasured

- **The T9's power button.** It's somewhere on the front face; the cage assumes it's centred, 15 mm in from the micro-USB end (`t9_button`).
- **The Pi.** PCB 1 mm and parts 3 over / 1 under are taken from its 5 mm overall (`pi_pcb`, `pi_over`, `pi_under`). Each slot is 0.4 wider than its PCB.
- **The FR120Ns.** 33.5 × 16.5 is from the listing. The terminals' height (10), the PCB (1.6) and the solder tails under it (2) are guesses (`fr_h`, `fr_pcb`, `fr_tails`).
- **Header pins.** None are fitted on any board. A V4 with its pins soldered won't go into the floor groove.
- **The bank's ports.** The posts assume they sit within the middle 34.5 mm of its end.

## Open questions

- **The Pi's ports.** Its micro-USB and mini-HDMI ports face up, 9 mm under the lid. A straight micro-USB plug won't fit there. The plan is to power it through GPIO 5 V and GND (pins 2 and 6) instead.
- **The LED loads' wires.** Nothing yet takes them out of the box.
- **Charging.** The bank's ports face into the box, so it charges with the lid off.
- **Heat.** The box has no vents.
