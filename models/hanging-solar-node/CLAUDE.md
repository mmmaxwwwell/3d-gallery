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
  - antenna column: `col_w` inside, its floor `col_raise` (5) up from the bottom edge
    (user: the panel's rounded corner showed the inside at the column's foot) carries
    the SMA, the inside nut in a hex pocket (`hex_pocket`) so it can't turn;
  - TP4056 inside the main compartment, back on the step wall at `step_x`, back edge
    in `tp_guide`, USB-C through a slot in the floor at `face_y` (`recess` up);
  - the holder, open side down, drops straight down from inside between two L-shaped
    walls (`holder_pocket`), each a wall at its end with a foot under its
    `holder_end_t` end wall (user: "should just be a L" — an earlier ledge + upstand +
    separate wall read as a T); a notch at each wall's top passes its wires; a `bar`
    on the back wall reaching 5 mm over its top back edge stops it lifting. It goes
    down a little proud at the front and pushes back under the bar; the panel closes
    it in. No partition: the holder and its walls are the main compartment's floor
    there, sealed with adhesive. `z_in = holder_w + 2·clear`.
  Everything below ends on one flat face at `base_y` (user: "a single flat face on the
  bottom for everything. Minus the antenna that sticks down more"): the floors either
  side of the holder, the L's feet, the USB-C's floor; the holder's face sits
  `ledge_t` up on its feet. `floors()` builds it.
- **Panel screw** (user): an M5x10 through the panel's own hole, centred, its centre
  `panel_hole_from_top` (6) down, into a boss (`m5_boss`, 4.2 pilot, face at z = 0 so the
  panel slides past it); the top lip is notched round the head.
- **Depth** is set by the holder: `z_in = holder_w + 2·clear` (21.4).
- **TP4056 rails** lip over only the middle third of the board's long edges: the pads
  (IN by the USB-C, OUT and B± at the far end) sit at the ends.
- **Loop**: tab flush with the back (prints flat on the bed, load in-plane) plus a
  gusset fin down its front through the full depth into the top wall.
- **History the user rejected:** a cup the panel dropped into and was glued to; hanging
  through the panel's own hole; a separate card for the boards; a window for the
  panel's solder tabs ("forget about the hole and the solder").
- **Measured:** panel 122 × 160, r10, 1.7 thick; holder 78.3 × 20.8 × 20. TP4056 and XIAO
  sizes are nominal.
