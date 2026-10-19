# kobo-meshcore-case

Prototype case for a Kobo Clara HD turned MeshCore device (nRF MCU + LoRa radio). devOnly, unprinted.

User's brief (2026-10-19), in order:
1. Landscape, thick part on the right, SMA pigtail vertical on top of that side ("wrap the kobo … let's go from there").
2. "Way more slim": only a 15 mm cylinder up the Kobo's right side, the bulkhead 25 mm from the top of the case, front face flush with the cylinder's front so it sticks out the back.
3. "I don't want the antenna hidden, the cylinder should come to an end with a hex mount". Then: "the hex is on the wrong side of that hole, it needs to be on the back": the hex pocket is under the end panel (the jack's hex from inside), the nut on top.
4. An extra 18650 "aligned with the original cylinder, face equal with the front … grow the object to have the 18650 holder space go the entire way up, but the original cylinder is in a cutout, so the antenna is mounted there". Read as: the cylinder is 18650-sized for its whole length, still ending `tube_short` below the top where the antenna mounts.
5. Micro USB: "no plug connection ever, forget it exists". Radio + MCU "sit right behind the thick edge of the kobo at the top" (first built as a box pod).
6. "Have the 18650 depth continue inward for exactly the length you have that box … make it the whole height and don't have a sharp edge at the end": the electronics cover.

## Frames

- **Depth frame**: X along the device (cylinder at +X), Y up as held (SMA at +Y), z = depth behind the front face. Every part is modelled here. It is the frame's print frame.
- **Assembly** = depth frame mirrored in Z (`*_assembled()`).
- **Print**: `back_plate_print()` is the plate's own frame. `electronics_cover_print()` stands the cover on its bottom end. `end_cap_print()` turns the cap inner face down.

## Load-bearing choices (mine unless noted)

- **Kobo bottom edge toward the cylinder** (mine, kept): the power button in a 45° trough (`button_trough_cut`).
- **Cylinder** (`tube_profile`): `cell_bore` + 2 × `tube_wall`, front tangent at z = 0, with a 45° tangent flat at its front-right so it doesn't overhang the bed. It's hulled back to `plate_x1` (its leftmost point) at the back plate's outer-face height, so the plate butts into a vertical face. `right_ledge` (8) separates the pocket from the bore. That's sized so the right screw heads clear the cylinder (asserted), and it keeps the trough and lead groove apart.
- **Cell access from the bottom** via `end_cap` (one M3x10 along Y into the ledge). The user said "back panel area"; a bottom cap was simpler to retain. Change it if they ask for a back door.
- **Bores** (`bore_2d`): 45° teardrops flat-topped at `bore_top_z`. The cell's bay runs `cell_bay_length` above the cap. Above it the 10 mm pigtail bore runs to the hex pocket; the jack goes up through the empty bay.
- **Electronics cover** (`electronics_cover`):
  - Shape: the outline `cover_outline_2d` is a `cover_r` round end sitting on the plate, hulled to a flat back at `tube_d`. It reaches `cover_width` in from `plate_x1` and runs the full height.
  - Fit: it stays `cover_gap` off the cylinder. The cylinder's profile carries a seam from (`plate_x1`, plate face) leaning `seam_lean` out to its back, so cover and cylinder meet on one straight line. `seam_lean` is held by the 1.5 mm wall over the cell (`seam_wall`, asserted). The seam recedes as the frame prints.
  - Printing: it prints standing on its bottom end, so the profile is extruded vertically, needs no supports, and the top end wall is a short bridge. Screw holes are teardrops peaked +Y.
  - Fixing: a right rib takes M3x16 through it and the plate into the ledge pilots, which replaced the plate's own right screws. A left rib, over `cover_boss_h` bosses on the plate, takes M3x6.
  - The hole from the cylinder (`pod_hole_cut`) carries on through the cover's seam wall.
- **Lead groove** at 225° on the bore (`groove_2d`), clear of the trough and the front (asserted); the cap has a matching notch.
- The SMA hole through the panel is round (a 6.6 mm hole in a 2 mm panel).

## Unmeasured

- From Kobo's drawing in the user guide, ±2 mm: `screen_*`, `kobo_corner_radius`, `power_button_y`.
- Also unknown: the user's boards (cover inside ~45 × 8 mm × full height), the pigtail's hex size and thread length (panel 2 mm), the cell's real length (protected cells run to ~69 mm; the bay is 72), and the cell contacts. Nothing holds contacts yet.
