# kobo-meshcore-case

Prototype case for a Kobo Clara HD turned MeshCore device (two Seeed XIAOs: nRF + LoRa). devOnly, unprinted.

## The user's brief (2026-10-19)

- Landscape, the thick part on the right, an SMA pigtail vertical at its top.
- The front flush with the cylinder's front, so it stands out at the back.
- An 18650 (with wire leads) in the cylinder; it must come in and out from the back. Micro USB: "forget it exists".
- The cylinder's depth carries on inward behind the Kobo, the whole height, with no sharp edge at its inner end.
- Two XIAOs (no pins) flat against the Kobo's back, near the antenna, at the top, "a space specifically" for them.

The latest structure (the user's words): "just make 1 back plate to get back to the thicker part then stop. let the thicker part be the only outer wall. drop the teardrop holes. the radio sma mount will have to be moved to the top of the object, it needs the distance. the back plate shouldn't be part of the sma mount ring, but it should expose it."
- Asked which way, the user picked the open tub: the frame is the thick part's wall, the back is open, and the plate covers the Kobo only.
- They rejected an earlier split design (a cover carrying the cylinder's back half) as "doing bad". Keep it simple.

## Frames

- **Depth frame**: X along the device (cylinder at +X), Y up as held (SMA at +Y), z = depth behind the front face. Every part is modelled here. It's the frame's print frame (face down).
- `back_plate()` is in its own print frame (z = 0 on its inner face). `back_plate_assembled()` puts it on the Kobo.

## Load-bearing choices (mine)

- **Thick part** (`thick_outline_2d`, `tub_cuts`):
  - Its outline is the cylinder with a 45° front-right flat, a vertical right side with `rim_round` on top, and a flat back rim at `tube_d`. The inner end is a quarter round of `end_r` from the plate face up to the rim.
  - `tub_cuts` opens everything above the Kobo frame between the end walls, and above the cell's axis, plus the bore.
  - The frame keeps the long walls (on the Kobo frame's long walls, so they print) and the right wall.
- **The tub's inner end is on the back plate**: over the Kobo the frame would print it in mid-air. It's a solid quarter round, straight up inside, so it prints.
- **The plate's strips** across the Kobo reach `strip_x1` on the ledge for the right screws.
  - XIAO windows (`xiao_y0s`) are cut in the top strip. The boards rest on the Kobo's back in a 2 mm window, 0.2 clear.
  - Nothing holds them in from behind: the user wires them. If they ask for retention, a strap or tape before anything snap-like (they reject snap fingers).
- **SMA** (`sma_block`, `sma_cuts`): a solid block across the cylinder under the top wall, up to `sma_block_top`, with the hex pocket (flats top/bottom as printed) and the round hole through the top wall.
- **Cell**: bay `cell_bay_length` above the bottom wall, then the `cell_stop` half-ring. The cell isn't held in from behind (the back is open).

## Unmeasured

- From Kobo's drawing in the user guide, ±2 mm: `screen_*`, `kobo_corner_radius`, `power_button_y`.
- The XIAO outline (21 × 17.8 from Seeed's spec), the pigtail's hex size and thread length (top wall 3 mm), and the cell's length with tabs.
