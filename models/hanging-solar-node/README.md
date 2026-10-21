# Hanging Solar Node

A Meshtastic node built onto the back of a small solar panel (about 116 × 156 mm),
hung from a tree through the panel's own hole.

- **Shroud** — a thin cup over the panel's back. The panel drops in face out onto a
  1.5 mm lip just inside the walls; adhesive on the lip and up the 0.5 mm gap round
  the panel's edge seals it. A tube round the panel's hanging hole runs through to the
  shroud's back and is glued to the panel round the hole, so the hanging cord goes
  through both.
- **Card** — rests on the panel's back inside the lip. It carries the XIAO nRF52840 +
  Wio-SX1262, the 18650 holder along the bottom and the TP4056, each zip-tied through
  a slot pair (the tie runs in a groove under the card). A window leaves the panel's
  solder tabs and the blocking diode free. Three posts reach the shroud's back, and an
  M3x8 cap screw through each from outside holds the card.
- The antenna screws onto an SMA bulkhead in the bottom wall and hangs down. A 2 mm
  breather beside it lets condensation out.

It keeps rain out hanging upright; it isn't sealed upside down.

## Assembly

1. Tie and stick the boards to the card; solder the diode on the panel's + tab and
   wire the panel to the TP4056, the TP4056 to the holder and the XIAO.
2. Fit the SMA bulkhead in the bottom wall and plug its pigtail into the Wio.
3. Lay the card in the shroud and drive the three M3x8 screws from outside, a dab of
   sealant under each head.
4. Run a bead round the lip and the end of the hanging tube, press the panel in face
   out, and fill the edge gap. Let it cure hanging.

## Printing

PETG. Shroud on its back, card on its underside, both on one plate; no supports.
About 51 g + 14 g.

## Unmeasured

The panel's outline, hole and tab positions were read off a photo against a ruler, and
its thickness (2.5) is a guess: measure them and change `panel_*`, `hang_from_top`
and `tabs_from_top` in the lib. The holder is taken as 78 × 21 × 21 tall with its cell.
