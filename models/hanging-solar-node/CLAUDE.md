# hanging-solar-node — agent notes

- **Frame:** +X across the panel, +Y up as it hangs, +Z out of the panel's back.
  Z = 0 is the panel's back face, the panel's face is at Z = −`panel_t`, origin at the
  panel's centre. `in_use()` turns Y up for the previews.
- **Everything mounts to the frame; the panel slides in last** (user, 2026-10-21). No
  card. The panel is captive in a channel on the left, right and top walls (the user:
  "this design only works if there's a guided slot that the solar panel slides into").
  Behind it the ledge (`lip_w`, z ≥ 0); in front a lip whose inner face is 45° (`lip_d`)
  so the frame prints on its back, meeting the panel's face at its edge (≈0.7 play,
  filled by adhesive). Everything in z < 0 is cut along `swept_down()`, and the ledge
  is open at the bottom, so nothing stops the panel.
- **Two compartments.** Above the partition (`partition_y`) the main one is sealed
  (XIAO on `tie_anchor`s). Below it the bottom is open, no cover (user via peer b9,
  2026-10-21: "i want the bottom to be open with the 18650 there with the usbc charger
  right there too facing down. these should be recessed into the bottom like 2-3cm").
  The holder hangs open side down under the partition (`holder_pocket`: two strips
  along its sides plus a blind boss over the partition for one screw through its
  floor; `holder_screw_dx` if its hole is off-centre). The TP4056 slides up its rails
  to the partition, USB-C down. `recess` (22) is how far the USB-C sits up inside the
  bottom; the bay is `recess + tp.y`, which puts the holder's face 30 up. The SMA is in
  the partition, so the bulkhead is the seal and the antenna hangs down. The partition
  only passes wires (holes filled with construction adhesive); its front edge meets
  the panel's back, sealed by a bead from below. Earlier the user wanted these three
  removable from the bottom; a screwed cover did that and was dropped for this.
- **Depth** is `z_in = 24`: the holder's 20.8 across, the XIAO's 18 standing.
- **TP4056 rails** lip over only the middle third of the board's long edges: the pads
  (IN by the USB-C, OUT and B± at the far end) sit at the ends.
- **Loop**: tab flush with the back (prints flat on the bed, load in-plane) plus a
  gusset fin down its front through the full depth into the top wall.
- **History the user rejected:** a cup the panel dropped into and was glued to; hanging
  through the panel's own hole; a separate card for the boards; a window for the
  panel's solder tabs ("forget about the hole and the solder").
- **Measured:** panel 122 × 160, r10, 1.7 thick; holder 78.3 × 20.8 × 20. TP4056 and XIAO
  sizes are nominal.
