# kobo-meshcore-case

A grip a Kobo Clara HD slots into to become a MeshCore handheld (three Seeed XIAOs: nRF + two SX1262). devOnly, unprinted.

## The user's brief (2026-10-19)

- Landscape, the thick part on the right; the front flush with the cylinder's front, so it stands out at the back.
- An 18650 (with wire leads) in the cylinder, in and out from the back. Micro USB: "forget it exists".
- The cylinder's depth carries on inward behind the Kobo, the whole height, with no sharp edge at its inner end.
- Latest: "a handheld device that the kobo slots into to hold, and is detachable and unmodified. The bottom 'chin' of the ereader that the xiao modules are behind, that slots into the case we have and that's it, it just sits there and is usable."
  - So the frame round the Kobo and the back plate are gone. The grip is the old thick part with a slot for the chin.
- Three XIAOs ("add another xiao module right underneath the last module"). There are two SX1262 radios, one with an internal strip antenna.
- A second SMA "on the other rounded top part of the case": the top of the rounded inner end.
- Earlier lessons: the user rejected a split cover as "doing bad", and wants open-tub simplicity. Keep parts few and plain.

## Frames

- **Depth frame**: X along the device (cylinder at +X), Y up as held (SMA at +Y), z = depth behind the front face. The Kobo's top edge is at x = 0 and its bottom edge (the chin's end) at `pocket_x1`. `grip_shape()` is modelled here.
- `grip()` is the print frame: standing on its bottom end (y → Z), front face toward -Y, the inner end at x = 0.
- `grip_assembled()` mirrors the depth frame so the front faces +Z. `upright()` stands the assembly up for the preview.

## Load-bearing choices (mine)

- **Printed standing up.** Lying face down, the floor would span the slot in mid-air. Standing, everything is extruded along Y.
  - So anything that bridges across Y needs a 45° underside: `hung_block()` for the SMA mounts, `octagon()` for the bottom plan corners, the trough's gabled top, and the cell stop's cone.
  - Keep new features extruded along Y, or give them the same treatment.
- **Slot** (`grip_outline_2d`): the lip runs from `lip_x0` (screen edge + `window_margin`) to the chin's end. The floor reaches further in, to `thick_x0`; in front of it, left of the lip, the grip is notched away.
  - The slot is square-cornered: rounded corners would overhang standing up.
  - Nothing retains the Kobo but the fit (`tolerance`). If it slides out, tighten the fit before adding anything snap-like (the user rejects snap fingers).
- **Tub** (`tub_2d`): open at the back. The inner end is a `wall`-thick quarter round. It's open over the cell above its axis.
- **SMA 1** (`sma1_block`): hung off the right wall, the hex through it, so the jack goes up the bore from below.
- **SMA 2** (`sma2_block`): hung off the inner end's round. The hex channel and the top-wall slot are open to the back, so the jack slides in from behind.
  - Its hex has a flat facing the round, and a corner 1 mm off the floor: the tub is only `end_r` (9.75) deep there.
- **XIAOs**: `xiao_count` boards on the floor against the ledge, stacked down from `hex_y1`. There's nothing locating them; the user wires and sticks them.
- **Strip antenna**: no geometry yet. Its home is the inside of the inner end below SMA 2's block. Ask its size before adding a seat.
- **Power button**: a 45° trough through the front at the chin's end. Its top end is gabled so it prints standing.

## Unmeasured

- From Kobo's drawing in the user guide, ±2 mm: `screen_*` (this sets where the lip stops), `kobo_corner_radius`, `power_button_y`.
- Also unmeasured: the XIAO outline (21 × 17.8, Seeed's spec), the pigtail's hex size and thread length (top wall 3 mm), the cell's length with tabs, and the strip antenna.
