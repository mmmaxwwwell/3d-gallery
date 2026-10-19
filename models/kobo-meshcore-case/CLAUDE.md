# kobo-meshcore-case

Prototype case for a Kobo Clara HD turned MeshCore device (two Seeed XIAOs: nRF + LoRa). devOnly, unprinted.

User's brief (2026-10-19), in order:
1. Landscape, thick part on the right, SMA pigtail vertical on top of that side ("wrap the kobo … let's go from there").
2. "Way more slim": a cylinder up the Kobo's right side, the bulkhead 25 mm from the top of the case, the front flush with the cylinder's front so it sticks out the back.
3. "I don't want the antenna hidden, the cylinder should come to an end with a hex mount". Then the hex goes under the end panel (the jack's hex from inside), the nut on top.
4. The cylinder holds an 18650 "the entire way up", still ending in the antenna's cutout. Micro USB: "forget it exists".
5. Electronics sit "right behind the thick edge of the kobo at the top". Then: "have the 18650 depth continue inward for exactly the length you have that box … the whole height and don't have a sharp edge at the end".
6. "Smooth those edges out around the 18650 antenna cutout."
7. "The back cover needs to expose enough to get the 18650 in/out (it has leads) and expose the back of the sma connector … the top near the antenna needs to have two microcontroller chips, Seeed XIAO boards, standard layout no pins … we need to hold them there somehow."

## Frames

- **Depth frame**: X along the device (cylinder at +X), Y up as held (SMA at +Y), z = depth behind the front face. Every part is modelled here. It is the frame's print frame.
- **Assembly** = depth frame mirrored in Z (`*_assembled()`).
- **Print**: `back_plate_print()` is the plate's own frame; `electronics_cover_print()` stands the cover on its bottom end.

## Load-bearing choices (mine unless noted)

- **Split at the cylinder's axis** (`tube_z`). That's the narrowest split that passes the cell (`cell_bore` at its widest) and the jack's hex. The frame keeps the front half (`cylinder_front_half`), the cover the back half (`cylinder_back_half`). `cylinder_cuts()` is cut from both.
- **Cylinder solid** (`cylinder_solid`): `cylinder_outline_2d` stepped through `offset` layers for the `end_round` top end. The outline runs 5 mm in past `plate_x1` and 5 mm under the bed, so the rounding shrinks inside frame/cover and below the bed, not at the seams. The front edge gets the 45° `front_chamfer` instead.
- **Beside the antenna**:
  - The frame above `tube_y1` stops at `plate_x1` with its corner rounded (`frame_body`, two `chamfered_slab`s).
  - The plate and cover share the plan corner round (`plan_outline(…, notch_round)`).
  - The cover's back-right edge is rounded in profile (`cover_left_2d`).
  - The back half reaches 4 mm over the plate to fill that profile round below the cutout. Without it there was a groove the length of the cover.
- **Top end** is held by the SMA nut clamping the split panel. There's no screw: a block screw's counterbore broke out of the rounded end.
- **Cell**: bay `cell_bay_length` above `end_block`, stop half-ring (`cell_stop`, frame only), then the bore narrows at 45° (`cone_y0` to `hex_y0`) to the hex pocket. The window through the cover's right rib (`window_y0`..`window_y1`) carries the leads and pigtail cable to the cavity.
- **XIAOs**:
  - Corner L posts on the back plate (`xiao_corner_posts`), so the castellated edges stay free for wires.
  - `hold_down` posts in the cover touch the USB-C top (`xiao_height`) at the left end and the PCB (`xiao_pcb`) at the right. Their -Y faces slope 45° for the standing print.
  - Long sides along X, two stacked in Y from the top, right ends by the right rib.
- **Screws**: left wall (plate), right rib → ledge (M3x16), left rib → plate bosses (M3x6), bottom block (M3x10, round counterbore, since a teardrop's peak breaks into the bay).

## Unmeasured

- From Kobo's drawing in the user guide, ±2 mm: `screen_*`, `kobo_corner_radius`, `power_button_y`.
- The XIAO's height to the USB-C top (3.5 assumed) and which end the user wants the USB-C. The hold-downs assume it.
- The pigtail's hex size and thread length (panel 2 mm). The cell's length with tabs (bay 67).
