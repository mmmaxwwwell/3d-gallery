# Hanging Solar Node

A Meshtastic node in a light frame that a 122 × 160 mm solar panel slides into, hung
from a tree by a loop on its back. Everything mounts to the frame first; the panel
slides in last and a bottom cover closes it.

- **Panel channel.** The left, right and top walls run forward past the panel. The
  panel slides up into them from the open bottom, its back on a 1.5 mm ledge and a
  45° lip over its border in front (the lip stands 3 mm proud of the face).
  Construction adhesive in the channel seals it.
- **Main compartment** (sealed), above a partition: the XIAO nRF52840 + Wio-SX1262,
  zip-tied to two anchors on the back wall.
- **Bay** (open at the bottom), below the partition, for what has to come out without
  taking the panel out:
  - the 18650 holder (78.3 × 20.8 × 20), floor to the panel, open side to the back,
    between two stops;
  - the TP4056, sliding up between two rails, USB-C facing down;
  - the SMA bulkhead, in the partition, so the antenna hangs straight down.

  The partition lets only wires through: a 4 mm hole over each end of the holder and
  one over the TP4056. Fill them with construction adhesive once the wires are in.
- **Bottom cover**, two M3x10 cap screws up into blocks on the back wall. The blocks
  stand behind the holder's open side, so they keep the cell in. The cover has holes
  for the antenna and the USB-C, and it runs under the panel's bottom edge, so with it
  on the panel can't slide out.
- **Loop**: a 6 mm tab standing up from the back above the top wall, with a 10 mm hole
  and a gusset down its front through the frame's full depth.

It keeps rain out hanging upright; it isn't sealed upside down.

## Assembly

1. Tie and glue the XIAO to the anchors in the main compartment. Fit the SMA bulkhead
   in the partition and plug its pigtail into the Wio.
2. Run the holder's two wires and the TP4056's wires up through the partition's holes,
   then fill the holes with construction adhesive.
3. Wire the panel's leads (through the blocking diode) into the main compartment.
4. Run adhesive along the channel and slide the panel up into it, face out. From the
   bay, run a bead along the partition's front edge where it meets the panel's back.
5. Slide the holder and the TP4056 up into the bay, screw the cover on, and screw the
   antenna on through the cover's hole.

To change the cell or the TP4056: unscrew the antenna and the two cover screws, and
they slide out of the bottom.

## Printing

PETG. Frame on its back, cover on its inside face, both on one plate; no supports.
About 72 g + 11 g.
