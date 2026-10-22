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
- **Two compartments.** The main one is sealed. Tie anchors everywhere (user: "make it
  symmetrical, just put them everywhere"): `anchor_xs` × `anchor_ys` on the back wall,
  the XIAO at the centre gap, tied through the anchors either side; `col_anchors` in
  the antenna column for the pigtail; the TP4056 ties to the step wall through two
  `tie_slot`s hugging its edges (only ~2 mm behind it before the back wall). Below it the
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
  - sensor chamber (user, 2026-10-22: "a little vented portion at the bottom near the
    battery and the charger"; "the front of it is even with the bottom face"; "a
    couple slits"; zip-tied): `sensor_chamber()`, between the holder's right L wall
    and its own right wall in line with the column's (`ch_x0`..`ch_x1`), floor =
    floors()' at `base_y`, cut by `vent_slit`s, ceiling at `ch_y1` kept under the
    holder's right wire notch (that notch is cut only through the wall, so it opens
    into the main compartment above the ceiling, never into the chamber). The board
    (`sensor`, sized for the biggest breakout, 15.2 × 12; one size for all, user's
    pick) stands flat on an anchor block on the right wall, tunnel front to back,
    45° underside; wires up through `sensor_wire_hole`. Straight pin headers don't
    fit: wires soldered on;
  - the holder, open side down, drops straight down from inside between two L-shaped
    walls (`holder_pocket`), each a wall at its end with a foot under its
    `holder_end_t` end wall (user: "should just be a L" — an earlier ledge + upstand +
    separate wall read as a T); a notch at each wall's top passes its wires; a `bar`
    on the back wall reaching 5 mm over its top back edge stops it lifting. It goes
    down a little proud at the front and pushes back under the bar; the panel closes
    it in. No partition: the holder and its walls are the main compartment's floor
    there, sealed with adhesive. `z_in = holder_w + 2·clear`.
  - TP4056 against the left wall (user, 2026-10-22: "move the charging port all the
    way to the opposite side away from the antenna, and then move the battery next to
    the charging port"), inside the main compartment, back on the step wall's left
    face at `step_x` (`tp_room` from the left wall), USB-C toward the wall, tied
    through two `tie_slot`s, USB-C through a slot in the floor at `base_y`;
  Everything below ends on one flat face at `base_y` (user: "a single flat face on the
  bottom for everything. Minus the antenna that sticks down more"): the floors either
  side of the holder, the L's feet, the USB-C's floor, the sensor chamber's; the holder's face sits
  `ledge_t` up on its feet. `floors()` builds it.
- **Panel screw** (user): an M5x10 through the panel's own hole, centred, its centre
  `panel_hole_from_top` (6) down, into a boss (`m5_boss`, 4.2 pilot, face at z = 0 so the
  panel slides past it); the top lip is notched round the head.
- **Depth** is set by the holder: `z_in = holder_w + 2·clear` (21.4).
- **TP4056 rails** lip over only the middle third of the board's long edges: the pads
  (IN by the USB-C, OUT and B± at the far end) sit at the ends.
- **Hanging tab** (user: three holes, "way more reinforced", "no sharp edges on the
  inside or outside of that hole", "like pillows", holes smaller; then "hang it so
  that it's centered, so it hangs flat"): one `pillow()` (hull of spheres, `loop_r`)
  through the full depth, clipped at the top wall's inside so it can't reach the
  panel's channel; three `rounded_hole()`s front to back with `loop_hole_r` fillets.
  Full depth because a plate at mid-depth would overhang printing on the back, and so
  the holes span the centre of mass (≈ z 8.5 estimated; mid-depth 8.7).
- **History the user rejected:** a cup the panel dropped into and was glued to; hanging
  through the panel's own hole; a separate card for the boards; a window for the
  panel's solder tabs ("forget about the hole and the solder").
- **Measured:** panel 122 × 160, r10, 1.7 thick; holder 78.3 × 20.8 × 20. TP4056 and XIAO
  sizes are nominal.
