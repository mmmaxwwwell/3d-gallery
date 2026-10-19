# kobo-meshcore-case

Prototype case for a Kobo Clara HD turned MeshCore device (nRF MCU + LoRa radio in a side bay). User's brief (2026-10-19): landscape, thick part on the right, an SMA pigtail mounted vertically on the top of that right side, room there to grip and hide electronics; "wrap the kobo … and let's go from there". devOnly, unprinted.

## Frames

- **Assembly frame**: X along the device (bay at +X), Y up as held (SMA at +Y), Z out of the screen, z = 0 on the front face, the case at negative Z.
- **Print frame** = assembly mirrored in Z. `shell()`, `back_plate()`, `bay_lid()` are in print orientation; the `*_assembled()` wrappers mirror them back.

## Load-bearing choices (mine, not the user's)

- **Kobo bottom edge toward the bay**, so the micro USB opens into the bay (OTG serial to the MCU; the Clara HD has no Bluetooth). It costs the power button: it is reached through the 45° trough (`button_trough_cut`). If the user wants the button exposed on an edge instead, flip the Kobo (bottom to the left) and move the USB/button cuts to the left wall.
- **Three pieces** so everything prints without supports: frame face down (two wall heights: `kobo_back_z` over the Kobo, `bay_back_z` over the bay), and two flat covers. A single stepped back cover can't print flat.
- Screws: back plate into the 6 mm left wall and the 6.5 mm divider ledge, lid into corner bosses. M3 cap heads in counterbores on pads (`pad_h`), per the user's M3 rule.
- `case_l` is asserted ≤ 218 for a 220 bed (it's 216.2): widening the bay or walls trips it.

## Unmeasured (from Kobo's drawing in the user guide, ±2 mm)

`screen_*`, `kobo_corner_radius`, `power_button_y`, `usb_y`. The guide's bottom-edge view is mirrored: the user said the USB cutout was on the wrong side (2026-10-19), so the USB now sits below the mid-edge button as held. Also unknown: the user's MCU/radio boards, battery, and the SMA's thread length (wall at the hole is 3 mm).
