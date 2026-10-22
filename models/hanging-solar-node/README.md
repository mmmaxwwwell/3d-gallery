# Hanging Solar Node

A Meshtastic node in a light frame that a 122 × 160 mm solar panel slides into, hung
from a tree by a rounded three-hole tab on top. Everything mounts to the frame first; the panel
slides in last.

- **Panel channel.** The left, right and top walls run forward past the panel. The
  panel slides up into them from the open bottom, its back on a 1.5 mm ledge and a
  45° lip over its border in front (the lip stands 3 mm proud of the face).
  Construction adhesive in the channel seals it.
- **Main compartment** (sealed): zip-tie anchors in a symmetric grid all over the
  back wall, 16 mm apart across and 20 mm up. The XIAO nRF52840 + Wio-SX1262 sits at
  the centre, tied through the anchors either side.
- **Open bottom**, below the main compartment. What's there faces down, recessed into
  the bottom so the walls shelter it. From the right edge in:
  - the antenna: the main compartment drops nearly to the panel's bottom edge in a
    column just wide enough for the SMA bulkhead, which sits in its floor with its
    inside nut in a hex pocket so it can't turn. Two tie anchors in the column hold the
    pigtail. The floor is 5 mm up, behind the
    panel, so the panel's rounded corner doesn't show the inside. The antenna hangs
    straight down from the frame's bottom corner;
  - the sensor chamber: a small box walled off from the main compartment, its floor
    flush with the flat bottom face and slit twice so air and humidity get in and out.
    A temperature/humidity board (AHT20, BME280, or the 15.2 × 12 GY-BME/PMP280 if it
    really carries a BME280) is tied flat to an anchor on its right wall. Solder its
    wires straight on, not to the pin header: straight pins don't fit. The wires go up
    through a hole in the chamber's ceiling;
  - the 18650 holder (78.3 × 20.8 × 20), open side down. It drops straight down from
    inside, before the panel goes in, between two L-shaped walls whose feet catch only
    its 1 mm end walls where the terminals are, so it's captive. The cell comes out
    from below, between the feet. A notch at the top of each wall lets its wires
    through, and a bar along the back wall reaching 5 mm over its top back edge stops
    it lifting;
  - the TP4056 against the left wall, inside the main compartment, standing on end with
    its flat back to the 18650, tied to its wall through two slots. Its USB-C comes
    down through a slot in the floor.

  Everything ends on one flat face 22 mm up inside the bottom edge: the floors either
  side of the holder, the L's feet, the USB-C's floor and the sensor chamber's. Only the antenna column goes
  lower. Fill the wire notches and the seam round the holder with construction
  adhesive.
- **Panel screw**: an M5x10 cap screw through the panel's own hole (centred, 6 mm down
  from its top edge) into a boss in the frame. The top lip is notched round its head.
- **Hanging tab**: a solid tab 54 mm wide standing 18 mm above the top wall through the
  frame's full depth, with three 6 mm holes front to back. Every edge is rounded (3 mm),
  and both ends of each hole (1.5 mm). The cord bears either side of the node's centre
  of mass, so it hangs flat.

It keeps rain out hanging upright; it isn't sealed upside down. The cell is held by the
holder's springs alone. The TP4056 is tied to its wall, its USB-C in the floor's slot;
a dab of adhesive seals round the port.

## Assembly

1. Tie and glue the XIAO to the anchors either side of it. Fit the SMA bulkhead in the
   antenna column's floor (inside nut in the hex pocket), tie its pigtail to the
   column's anchors and run it up to the Wio.
2. Tie the sensor board flat to the anchor in the sensor chamber, components out, its
   wires up through the hole in the chamber's ceiling. Seal the hole round them.
3. Put the TP4056 in: USB-C down through the floor's slot, its back on the wall, a tie
   round it through the wall's two slots. Seal round the port.
4. Drop the holder down between its walls, open side down, wires through the notches
   at the top of the walls, with its front edge a little proud; push it back under the
   bar onto the L's feet (the panel closes it in). Fill the gaps and the seam round it with construction
   adhesive.
5. Wire the panel's leads (through the blocking diode) into the main compartment.
6. Run adhesive along the channel and slide the panel up into it, face out. From below,
   run a bead wherever the main compartment's floors and walls meet the panel's back.
7. Screw the M5x10 through the panel's hole into the boss.
8. Put the cell in and screw on the antenna.

## Printing

PETG. The frame on its back; no supports. About 93 g.
