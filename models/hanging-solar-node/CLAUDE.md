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
- **Two compartments.** The main one is sealed (XIAO on `tie_anchor`s). Below it the
  bottom is open, no cover (user, 2026-10-21: open bottom, 18650 and USB-C charger
  facing down, recessed 2–3 cm). Layout from the right edge in (user: "the antenna
  should be on the outer edge, at the bottom of the solar panel. the enclosure should
  stick all the way down for the antenna, but just enough for the antenna. next to
  the antenna the usb charging port rolls 90 degrees so the flat side is next to the
  18650. theres a surface flat with the top of the 18650 holder and thats where the
  usbc port is. then you have the 18650 holder"):
  - antenna column: `col_w` inside, its floor at `bottom_y` carries the SMA;
  - TP4056 inside the main compartment, back on the step wall at `step_x`, back edge
    in `tp_guide`, USB-C through a slot in the floor at `face_y` (`recess` up);
  - the holder hangs from the partition (`partition_y = face_y + holder_h`), open
    side down, its face level with that floor.
  `floors()` is the stepped floor. The skin-cut past the bottom edge stops short of the
  column so its floor survives. Seal: bead from below wherever floors and walls meet
  the panel's back.
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
