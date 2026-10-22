# Hanging Solar Node

A Meshtastic node in a light frame that a 122 × 160 mm solar panel slides into, hung
from a tree by a loop on its back. Everything mounts to the frame first; the panel
slides in last.

- **Panel channel.** The left, right and top walls run forward past the panel. The
  panel slides up into them from the open bottom, its back on a 1.5 mm ledge and a
  45° lip over its border in front (the lip stands 3 mm proud of the face).
  Construction adhesive in the channel seals it.
- **Main compartment** (sealed), above a partition: the XIAO nRF52840 + Wio-SX1262,
  zip-tied to two anchors on the back wall.
- **Open bottom**, below the main compartment. What's there faces down, recessed into
  the bottom so the walls shelter it. From the right edge in:
  - the antenna: the main compartment drops to the panel's bottom edge in a column just
    wide enough for the SMA bulkhead, which sits in its floor, so the antenna hangs
    straight down from the frame's bottom corner;
  - the TP4056, inside the main compartment, standing on end with its flat back
    against the wall next to the 18650. Its USB-C comes down through a slot in a floor
    level with the holder's open face, 22 mm up inside the bottom edge;
  - the 18650 holder (78.3 × 20.8 × 20), open side down under the partition. It pushes
    in from the back through an opening in the back wall, onto two ledges that catch
    only its 1 mm end walls where the terminals are, up to a stop strip at the front.
    One screw up through the hole in its floor into a blind boss holds it. The cell
    comes out from below, between the ledges.

  The partition over the holder lets only its two wires through: a 4 mm hole past each
  end. Fill them with construction adhesive once the wires are in.
- **Loop**: a 6 mm tab standing up from the back above the top wall, with a 10 mm hole
  and a gusset down its front through the frame's full depth.

It keeps rain out hanging upright; it isn't sealed upside down. The cell is held by the
holder's springs alone. The TP4056 lies on the wall with its back edge in a guide and
its USB-C in the floor's slot; a dab of adhesive holds it and seals round the port.

## Assembly

1. Tie and glue the XIAO to the anchors in the main compartment. Fit the SMA bulkhead
   in the antenna column's floor and run its pigtail up to the Wio.
2. Put the TP4056 in: USB-C down through the floor's slot, its back on the wall, its
   back edge in the guide. Glue it and seal round the port.
3. Push the holder in from the back onto its ledges and screw it up under the
   partition. Run its two wires up through the partition's holes, then fill the holes with construction adhesive.
4. Wire the panel's leads (through the blocking diode) into the main compartment.
5. Run adhesive along the channel and slide the panel up into it, face out. From below,
   run a bead wherever the main compartment's floors and walls meet the panel's back.
6. Put the cell in and screw on the antenna.

## Printing

PETG. The frame on its back; no supports. About 65 g.
