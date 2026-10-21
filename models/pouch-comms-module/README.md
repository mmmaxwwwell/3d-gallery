# Pouch Comms Module

A box for a backpack side pouch that carries a power bank, a Franklin T9 hotspot, a Raspberry Pi Zero 2 W and a Heltec HT-HC33 (ESP32-S3 + Wi-Fi HaLow).

## Pieces

| Piece | Material | Prints |
|---|---|---|
| Box | PETG | floor down |
| Lid | PETG | flat, counterbores up |

The box is 140 × 190 mm and 47.5 mm tall with the lid on. The walls, floor and lid are all 5 mm. The bank's 36.5 mm height sets the depth, so the box is thicker than the 30 mm first asked for.

## Layout

The +Y end (the SMA end) is the end that sticks out of the pouch.

- **Power bank**: lies along the left side, between the wall and a full-height divider, with its ports toward +Y. A rib stops it at the -Y end.
- **Bay**: the open space above the bank, about 30 mm, for its plugs and the cables. It opens into the right side past the end of the divider.
- **Franklin T9**: at the -Y end of the right side, between corner brackets.
- **HT-HC33 and Pi Zero 2 W**: above the T9, side by side on standoffs, with a 15 mm cable lane between them. The HC33 is next to the divider and the Pi is next to the right wall.
- **SMA bulkhead**: through the +Y end wall, over the HC33, for the HaLow antenna on a U.FL pigtail.

## Assembly

1. Fit the SMA bulkhead through the end wall, nut inside.
2. Screw the Pi down with M2.5 screws and the HC33 with M2 screws. Both go into pilots in the standoffs.
3. Stick the T9 and the bank down with foam tape and plug the cables in.
4. Put the lid on with 4 M3x10 cap screws.

## Open questions

- **Charging.** The bank's ports face into the box, so it charges with the lid off. A panel-mount USB-C extension through a wall would fix that, but it isn't in yet.
- **T9 screen and buttons.** They sit under the solid lid.
- **Heat.** The box has no vents.
- **Pi height.** The Pi's standoffs are 3 mm tall. That's enough for a bare board, but not for one with a header soldered underneath.
