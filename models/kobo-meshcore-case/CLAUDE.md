# kobo-meshcore-case

Prototype case for a Kobo Clara HD turned MeshCore device (nRF MCU + LoRa radio). devOnly, unprinted.

User's brief (2026-10-19), in order:
1. Landscape, thick part on the right, SMA pigtail vertical on top of that side ("wrap the kobo … let's go from there").
2. Then "way more slim": only a 15 mm tube running vertically on the Kobo's right side. The bulkhead mount is 25 mm down from the top of the case, so the antenna is recessed and centred on the tube. The case's front face is flush with the tube's front, so the tube sticks out the back.

The first draft's 38 mm electronics bay and its lid are gone. Where the MCU, radio and battery go is open.

## Frames

- **Assembly frame**: X along the device (tube at +X), Y up as held (SMA at +Y), Z out of the screen, z = 0 on the front face, the case at negative Z.
- **Print frame** = assembly mirrored in Z. `shell()` and `back_plate()` are in print orientation; the `*_assembled()` wrappers mirror them back. The tube lies along the bed as the frame prints.

## Load-bearing choices

- **Kobo bottom edge toward the tube.** That was mine; the user liked the button trough and corrected the USB's side (USB below the mid-edge button, 34 mm along the edge; Kobo's drawing is mirrored). With no bay, the USB window runs right through the tube, so a cable plugs in from the right.
- **Tube profile** (`tube_profile`): circle + a 45° tangent flat at its front-right so it doesn't overhang the bed, hulled back to `ledge_x` at the back plate's outer face height, so the plate butts into a vertical step.
- **Bores** (`bore()`): 45° teardrops flat-topped at `bore_top_z` (`bore_skin` under the tube's back). The pigtail goes in from the bottom end (`pigtail_bore` 10 clears an 8 mm hex), so the bore runs the tube's length below the panel. The SMA hole through the panel is round.
- **Screws**: 4 × M3x8 through counterbored pads on the back plate; left pair in the 6 mm left wall, right pair in `right_ledge` beside the tube. The top-right one sits below the panel, clear of the recess.
- **Asserts**: the trough's 45° side stays ≥ 1.2 mm off the pigtail bore (that's why `tube_offset` is 10, not less, and `button_depth_fraction` 0.75); the right pilots keep 1 mm to the bore; the case fits a 220 bed.

## Unmeasured (from Kobo's drawing in the user guide, ±2 mm)

`screen_*`, `kobo_corner_radius`, `power_button_y`, `usb_y`. Also unknown: the user's boards and battery, the pigtail's jack size and thread length (the panel is 2 mm), and the antenna base's diameter (the recess is 11 mm).
