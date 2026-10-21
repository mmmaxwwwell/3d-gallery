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
  (XIAO on `tie_anchor`s). Below it the bay is open at the bottom: the user wants the
  18650 holder, the TP4056 and the antenna "available to be removed from the bottom
  without being disassembled" and "a separate compartment that only lets the wires
  through"; they block the holes with construction adhesive. The SMA sits in the
  partition, so the bulkhead is the seal and the antenna hangs down through the cover.
  The partition's front edge meets the panel's back: sealed by a bead run from the bay.
- **The cover** (my pick, for retention) screws up into `screw_blocks` on the back wall
  and runs under the panel's bottom edge, so it also keeps the panel in. The blocks sit
  behind the holder's open side (holder floor to the panel), which keeps the cell in;
  that sets the depth: `z_in = clear + holder_h + clear + block depth`.
- **TP4056 rails** lip over only the middle third of the board's long edges: the pads
  (IN by the USB-C, OUT and B± at the far end) sit at the ends.
- **Loop**: tab flush with the back (prints flat on the bed, load in-plane) plus a
  gusset fin down its front through the full depth into the top wall.
- **History the user rejected:** a cup the panel dropped into and was glued to; hanging
  through the panel's own hole; a separate card for the boards; a window for the
  panel's solder tabs ("forget about the hole and the solder").
- **Measured:** panel 122 × 160, r10, 1.7 thick; holder 78.3 × 20.8 × 20. TP4056 and XIAO
  sizes are nominal.
