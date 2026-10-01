# Heltec HT-HC33 Waterproof Case

A waterproof case for the [Heltec HT-HC33](https://heltec.org/project/ht-hc33/) (ESP32-S3 + Wi-Fi HaLow) and one 18650. It's three pieces stacked, 84 × 48 × 38 mm. The antenna comes out of one end and the USB-C out of the other, behind a hinged door.

1. **Battery case** (bottom). The cell drops into a round-bottomed pocket between two contact plates standing in slots: spring at the negative end, flat at the positive. A channel beside the cell carries the far plate's lead back. The case wraps the cell in a 45° teardrop that carries the sealing flange, so it prints floor down with no supports and no pillars. The cell isn't meant to come out: to swap it, you open the case.
2. **MCU plate**. The board sits on four pinned standoffs, clearing its tallest underside part (the battery socket, 3.6 mm). A 10 × 11 mm hole under that socket, at the USB end, passes the battery lead up.
3. **Cover**.
   - **SMA end**: the bulkhead for the 915 MHz antenna comes straight out of the far end face. Its inner nut sits in a hex pocket deep in the wall, behind a 2.5 mm panel, so the connector can't turn while you screw the antenna on. A cavity from the inside lets the nut in, and puts the connector's back well clear of the board and the micro-SD holder.
   - **USB-C end**: a hinged door. It carries a plug that pushes into the USB opening: a PETG core in a TPU sleeve, 0.2 mm oversize all round, with two ribs that pop into matching grooves in the opening's walls. The seal presses on the opening, not the hinge, and the ribs holding in their grooves are the latch. The door's PETG never touches the cover as it swings; the TPU squeezes past the opening's far edge in the last 25° and pops in. The hinge pin is an 11 mm offcut of 1.75 mm filament, snug in the cover's knuckle. There's a bevel under the door's free edge for a fingernail.

**Seals.** TPU 75A is printed in place in every joint:

- **Plate to cover**: a 45° ridge on the cover's rim presses into a TPU bead in a groove in the plate.
- **Battery case to plate**: the plate's flat underside presses on the battery case's bead.
- **SMA**: a TPU washer printed into the end face sits under the SMA's outer nut.
- **USB-C**: the door's plug sleeve.

**Screws.** Ten M3 × 16 socket-head cap screws run straight down the middle of the seal: three along each side and two in each end wall, either side of the USB-C and the SMA. They come up from below with their heads in counterbores in the battery case's flange, pass through both seals, and cut their own threads in the cover, biting 9 mm. Round each screw, the TPU channel widens to a pad that the screw threads through, and the cover's ridge widens to a disc that presses the pad. That keeps the seal unbroken at every screw, and puts the clamping force right on the seal.

## Printing

| Piece | Orientation | Filaments |
|---|---|---|
| Battery case | floor down | PETG + its seal in TPU 75A |
| MCU plate | flat side down | PETG + its seal in TPU 75A |
| Cover | top down | PETG + the SMA washer in TPU 75A |
| USB-C door | outer face down, plug up | PETG + the plug sleeve in TPU 75A |

Each piece and its TPU are two STLs in the same frame. Load both as one multi-material object: they overlay exactly. Nothing needs supports: every overhang is 45° or a short bridge.

## Before you print

This design has not been test-printed. The board outline, holes and USB-C edge are from the HT-HC33 datasheet (Rev 1.0, §7.1). The board thickness and component heights are measured. These are guesses:

- the USB-C receptacle's height (`usb_z_above_pcb`)
- how far the micro-SD holder overhangs the board (`sd_overhang`, 2 mm)
- how much room your SMA's back and pigtail need behind the inner nut (`sma_behind`, 10 mm)
- the SMA's nut (`sma_nut_af` 8 mm, `sma_nut_h` 2 mm) and thread (1/4-36). The panel, a nut each side and the antenna's grip take about 11 mm of thread.
- the cell (`cell_l` 65 mm) and the contact plates (`contact_w` 12 mm)

Change them in `lib/heltec-ht-hc33-case-lib.scad`.

## Assembly

1. Slide the contact plates into their slots, spring at the negative end. Solder the SH1.25 pigtail's leads to their tabs. The far plate's lead runs along the channel beside the cell. Drop the cell in.
2. Feed the lead up through the MCU plate's hole and plug it into the socket under the board. Then set the board on the standoffs, USB-C toward the cover's opening.
3. Put the SMA's inner nut in its hex pocket, from inside the cover. Pass the connector out through it, fit the washer and outer nut, and tighten.
4. Hang the door: line its knuckles up with the cover's and push an 11 mm offcut of 1.75 mm filament down through all three.
5. Plug the U.FL end into the board's HaLow jack. Stack the cover on, and turn the three pieces over.
6. Drive the ten M3 × 16 up through the battery case, working round in a cross pattern, until the faces meet. Each one pushes through the TPU pads on its way.
7. Press the door shut until the plug pops in. Open it to charge: the board charges the cell over USB-C.
