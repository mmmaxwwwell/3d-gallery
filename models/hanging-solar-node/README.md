# Hanging Solar Node

A Meshtastic node built onto the back of a 122 × 160 mm solar panel (10 mm corners, 1.7 thick),
hung from a tree through the panel's own hole.

- **Shroud** — a thin box over the panel's back that holds the panel captive. Its left,
  right and top walls run forward past the panel into a channel; the panel slides up into
  it from the open bottom, its back running on a 1.5 mm ledge and a 45° lip over its
  border in front (the lip stands 3 mm proud of the face). Adhesive in the channel seals
  it. A tube from the shroud's back ends on the panel's back round its hanging hole, so
  once the panel is home the cord hung through both stops it sliding back out.
- **Card** — held 3 mm off the panel's back on three posts, so the solder blobs on the
  panel's tabs slide under it. It carries the XIAO nRF52840 + Wio-SX1262, the 18650
  holder along the bottom and the TP4056, each zip-tied through a slot pair. A window
  over the tabs leaves room for the joints and the blocking diode. An M3x8 cap screw
  through each post's cup from outside holds it.
- The antenna screws onto an SMA bulkhead in the bottom wall and hangs down. A 2 mm
  breather beside it lets condensation out.

It keeps rain out hanging upright; it isn't sealed upside down.

## Assembly

1. Tie and stick the boards to the card. Solder the diode on the panel's + tab and
   leads to both tabs, long enough to reach the TP4056 with the panel still below the
   shroud (or put a 2-pin plug in them).
2. Fit the SMA bulkhead in the bottom wall and plug its pigtail into the Wio.
3. Screw the card into the shroud with the three M3x8, a dab of sealant under each head.
4. Connect the panel, run adhesive along the channel, and slide the panel up into it,
   face out, until it stops at the top and its hole lines up with the tube. Hang it
   through the hole to cure.

## Printing

PETG. Shroud on its back, card on its underside, both on one plate; no supports.
About 59 g + 16 g.

## Unmeasured

The panel's outline and thickness are measured. Its hanging hole (5.8 mm, centre 6.5 mm
down) and solder tabs (119 mm down) are placed from a photo: check them before printing
(`hang_d`, `hang_from_top`, `tabs_from_top`). The holder is taken as 78 × 21 × 21 tall
with its cell (`stack_h`).
