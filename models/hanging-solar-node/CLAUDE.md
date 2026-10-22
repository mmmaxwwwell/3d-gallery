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
  - the holder, open side down, its face level with that floor, drops straight down
    from inside through a slot in the partition (user: "the 18650 case needs to slide
    straight downwards from the inside of the solar node. So it's captive"; before
    that, "1 millimeter ledge where the positive and negative terminals are"): two
    ledges at `face_y` catch only its `holder_end_t` end walls, an `upstand` at each
    ledge's outer edge locates it along X, and a `bar` on the back wall reaching 5 mm over its
    top back edge stops it lifting (user: "there needs to be a bar like 1 or 2mm high
    that stops the 18650 holder from moving upwards"; the ribs I had on the back wall
    — "a retention clip inside the 18650 holder" — had to go). It goes down a little
    proud at the front, pushes back under the bar; the panel closes it in. `z_in =
    holder_w + 2·clear`; `wire_gap` at each end carries its wires up. No screw. A
    back-wall opening it pushed in through was an earlier version.
  - `exploded.scad`: each part pulled out along the way it goes in.
  Left of the holder the floor is at `face_y` too (user: bring the space beside the
  18650 level with its face and the charging port's), and the spacing was opened up
  to make it easier to work in (`wire_gap` 6, `tp_room` 10).
  `floors()` is the stepped floor. The skin-cut past the bottom edge stops short of the
  column so its floor survives. Seal: bead from below wherever floors and walls meet
  the panel's back.
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
