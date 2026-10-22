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
- **Open bottom**, below the partition. Everything here faces down, recessed into the
  bottom so the walls shelter it:
  - the 18650 holder (78.3 × 20.8 × 20) hangs open side down under the partition,
    between two strips along its sides, on one screw up through the hole in its floor
    into a blind boss. Its open face is 30 mm up inside the bottom edge, and the cell
    comes out from below;
  - the TP4056 slides up between two rails until it meets the partition, its USB-C
    facing down 22 mm up inside;
  - the SMA bulkhead sits in the partition, so the antenna hangs straight down.

  The partition lets only wires through: a 4 mm hole past each end of the holder and
  one over the TP4056. Fill them with construction adhesive once the wires are in.
- **Loop**: a 6 mm tab standing up from the back above the top wall, with a 10 mm hole
  and a gusset down its front through the frame's full depth.

It keeps rain out hanging upright; it isn't sealed upside down. The cell is held by the
holder's springs alone, and the TP4056 by its rails: a dab of hot glue keeps the board
from creeping down.

## Assembly

1. Tie and glue the XIAO to the anchors in the main compartment. Fit the SMA bulkhead
   in the partition and plug its pigtail into the Wio.
2. Screw the holder up under the partition. Run its two wires and the TP4056's wires up
   through the partition's holes, then fill the holes with construction adhesive.
3. Wire the panel's leads (through the blocking diode) into the main compartment.
4. Run adhesive along the channel and slide the panel up into it, face out. From below,
   run a bead along the partition's front edge where it meets the panel's back.
5. Slide the TP4056 up its rails, put the cell in, and screw on the antenna.

## Printing

PETG. The frame on its back; no supports. About 65 g.
