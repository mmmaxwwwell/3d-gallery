# kobo-meshcore-case

Prototype case for a Kobo Clara HD turned MeshCore device (nRF MCU + LoRa radio). devOnly, unprinted.

User's brief (2026-10-19), in order:
1. Landscape, thick part on the right, SMA pigtail vertical on top of that side ("wrap the kobo … let's go from there").
2. Then "way more slim": only a 15 mm tube running vertically on the Kobo's right side. The bulkhead mount is 25 mm down from the top of the case, so the antenna is recessed and centred on the tube. The case's front face is flush with the tube's front, so the tube sticks out the back.
3. Then: "I don't want the antenna hidden, the cylinder should come to an end with a hex mount". I read it as: the tube stops `tube_short` (25) below the case's top, its end face a hex pocket that captures the SMA nut, the antenna in the open above it.

The first draft's 38 mm electronics bay and its lid are gone. Where the MCU, radio and battery go is open.

## Frames

- **Assembly frame**: X along the device (tube at +X), Y up as held (SMA at +Y), Z out of the screen, z = 0 on the front face, the case at negative Z.
- **Print frame** = assembly mirrored in Z. `shell()` and `back_plate()` are in print orientation; the `*_assembled()` wrappers mirror them back. The tube lies along the bed as the frame prints.

## Load-bearing choices

- **Kobo bottom edge toward the tube.** That was mine; the user liked the button trough and corrected the USB's side (USB below the mid-edge button, 34 mm along the edge; Kobo's drawing is mirrored). With no bay, the USB window runs right through the tube, so a cable plugs in from the right.
- **Tube profile** (`tube_profile`): circle + a 45° tangent flat at its front-right so it doesn't overhang the bed, hulled back to `ledge_x` at the back plate's outer face height, so the plate butts into a vertical step.
- **Hex mount**: `sma_hex` pocket (8 mm nut + 0.3) `sma_hex_depth` deep in the tube's end face, flats top and bottom as it prints (a hex with a vertex up has 30° roofs), over `sma_panel` with the round `sma_hole`. The nut is captured; the jack threads up into it from below.
- **Bore** (`bore()`): a 45° teardrop flat-topped at `bore_top_z` (`bore_skin` under the tube's back). The pigtail goes in from the bottom end (`pigtail_bore` 10 clears the jack's 8 mm hex), so the bore runs the tube's length below the panel.
- **Screws**: 4 × M3x8 through counterbored pads on the back plate; left pair in the 6 mm left wall, right pair in `right_ledge` beside the tube. The top-right one is above the tube's end, in the frame's strip.
- **Asserts**: the trough's 45° side stays ≥ 1.2 mm off the pigtail bore (that's why `tube_offset` is 10, not less, and `button_depth_fraction` 0.75); the right pilots keep 1 mm to the bore; the case fits a 220 bed.

## Unmeasured (from Kobo's drawing in the user guide, ±2 mm)

`screen_*`, `kobo_corner_radius`, `power_button_y`, `usb_y`. Also unknown: the user's boards and battery, the pigtail's nut size (8 mm assumed) and thread length (pocket 3 + floor 2 mm).
