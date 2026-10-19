# kobo-meshcore-case

A sealed grip a Kobo Clara HD slots into to become a MeshCore handheld (three Seeed XIAOs: nRF + two SX1262), with a 2.13" e-paper in front. devOnly, unprinted.

## The user's brief (2026-10-19)

- **Layout**
  - Landscape, the thick part on the right; the front flush with the cylinder's front, so it stands out at the back.
  - An 18650 (with wire leads) in the cylinder.
  - The cylinder's depth carries on inward behind the Kobo, the whole height, with no sharp edge at its inner end.
  - "a handheld device that the kobo slots into to hold, and is detachable and unmodified": the Kobo's chin slides into a slot in the grip.
- **Electronics**
  - Three XIAOs, one under another. Two SX1262 radios, one with an internal strip antenna.
  - A second SMA "on the other rounded top part of the case".
- **First round of changes**
  - "get rid of the hole in the front" (the power button trough).
  - "add a retention tab so the kobo locks in" (now a TPU pad; see below).
  - "add a back cover".
  - "add a microusb so when the kobo is plugged in it charges through usb".
  - "add a usbc charger" (TP4056 USB-C boards, the user's own). It "should come in the side of the device underneath the first antenna".
- **Grip and mounting**
  - "round all the edges on the grip and add like 15mm section indents going up it".
  - "make the other side grippy as well": indents on the inner end too.
  - Support the charger more; "add a spot to zip-tie everything in place".
- **E-paper**: a 2.13" e-paper HAT (LAFVIN, Waveshare 2.13 clone) "into the front".
  - The user's layout: move the XIAOs back toward the back cover, the Kobo back (deeper), and the display in front of the chin.
  - "is there a tray that gets sandwiched over it?": the bezel.
  - "i need a hole for the wires to go out the back into the body": the wire channel.
- **Durability and sealing**: "screws in all the corners this needs to be durable and waterproof as much as possible". Use the waterproof guidance from the dry-bag node session.
  - Body PCTG, seals in a softer TPU (the user has down to 70A; "you pick").
  - For the second SMA's clash with the seal: "just add a little cylinder bumpout there where you need it, smooth".
- **Earlier lessons**: the user rejected a split cover as "doing bad", and wants simplicity where sealing allows.

## Frames

- **Depth frame**: X along the device (cylinder at +X), Y up as held (SMA at +Y), z = depth behind the front face.
  - The Kobo's top edge is at x = 0 and its bottom edge (the chin's end) at `pocket_x1`.
  - The parts are modelled here: `grip_shape()`, `cover_shape()`, `bezel_shape()`, `back_gasket()`, `bezel_gasket()`.
- **Print frames**:
  - `grip()` stands on its bottom end (y → Z), front face toward -Y.
  - `cover()` and `bezel()` lie outer face down.
  - The TPU parts are flat.
- **Assembly**: `*_assembled()` mirror the depth frame so the front faces +Z. The preview explodes the cover back 30 mm and the bezel forward 20 mm. `upright()` stands the assembly up.

## Depth stack, front to back

1. Bezel, `bezel_gasket` (squeezed), then the display (panel, PCB, `display_parts`, 0.3 clear), ending at `display_back_z`.
2. `display_wall`, then the Kobo slot (`kobo_front_z`…`kobo_back_z`).
3. The floor, then the XIAOs (`xiao_height`) and a tie over them, up to `split_z`.
4. The cover (`cover_thickness` = head counterbore + floor).

`split_z` is the deepest of three things: the cylinder, the XIAO stack, and the second SMA's boss fitting under the cover with `seal_wall` to spare.

## Sealing: the rules

These come from memory `seal-screws-through-tpu-failed` and the meshtastic-drybag-node design:
- side-squeeze tongue in groove;
- screws outside the seal;
- never screws through a squeezed bead.

**Body and lids:**
- The grip, cover and bezel are PCTG (the user's call).
- Seals are separate TPU parts: 85A where they're squeezed from the side, 70A for the soft ones (my picks).

**Back seal.**
- **Plan geometry:**
  - `seal_plan()` is the grip's back face (`cover_plan()`, the projection of `grip_body`) with a keyhole bite from each screw out to the edge.
  - So `seal_band(in0, in1)` bands turn in round every screw.
  - The groove is `seal_wall`…`seal_wall + groove_w`.
  - The gasket is a U-section: walls `gasket_wall`, slot `gasket_slot`.
  - The cover's tongue is `tongue_w = slot + 2·seal_squeeze` wide, `tongue_len` long, with a 0.5 mm lead-in.
- **Following the boss:** groove and tongue run along `back_region(d)`, the back face d out, including the SMA boss. So both follow the boss.
- **Measured fit:**
  - grip ∩ cover = 0.
  - gasket ∩ grip = 0.
  - gasket ∩ tongue ≈ 200 mm³ away from the boss: the side squeeze.
  - Re-check these if the seal changes.
- **Rim.** `rim_2d()` is solid from the floor to the back.
  - Its top band hangs off the floor at 45° (`seal_rim`).
  - The screws' bosses (`screw_bosses`, `boss_half`) cover the bites.
  - The inner end is filled to `tub_x0`.
  - The right side stands off the bore by `rim_w` (`case_l`).
  - The bottom wall (`bottom_wall`) is thick enough for the bottom corner screws' bites to clear the cell.
- **Screws.** Seven M3x8 (`screws`, each with its outward direction for the bite): the four corners, top middle, bottom middle, middle left.
  - The right side is the cylinder, so there's no middle-right screw.
  - Heads counterbore into the 4.5 mm cover. No pads.
- **Second SMA boss** (`sma2_bump`): its hole and hex come within the groove's depth under the top band, so a 45°-flanked boss lifts the back face there by `sma2_bump_h`.
  - The cover keeps `seal_wall` over it, so its outside is flat and it prints face down.
  - The user asked for a smooth cylinder. Flanks are 45° rather than round so the cover's pocket and the grip both print.
  - The flat-printed gasket stretches up the flanks.
- **Charger**: it sits in a pocket in the ledge (`charger_z`), low enough that its USB-C opening stays under the groove.
- **Other seals:**
  - SMAs: TPU washers under the outer nuts.
  - USB-C: `usbc_plug`.
  - Bezel: `bezel_gasket`, a face seal on the panel border, with the screws outside it.
  - Micro USB pocket and display wire channel: potted (documented, not modelled).
  - The old floor tab cut through the floor and leaked, so it was replaced by `kobo_pad` in a blind recess.
- **Indents** stop `groove_depth + seal_wall` short of the back so they don't reach the groove.

## Other load-bearing choices (mine)

- **Rounded body** (`grip_body`): the convex outline ∩ plan, shrunk by `edge_round` and grown back by `minkowski` with `rounding_tool`.
  - The tool is a half ball with no reach behind (+z), so the back meets the cover square.
  - Its 45° cone below (-y) lets the bottom edges print standing up.
- **The grip prints standing up.** Anything that bridges across Y needs a 45° underside: `hung_block()`, bosses, tie bars, the rim's top band, octagons, the cell stop's cone.
- **Display.**
  - The pocket is closed behind by `display_wall`, so the module goes in from the front and the bezel (four M2x5 in its corners, heads sunk in pads into seats) holds it.
  - The wire channel runs from behind the board's bottom end, back through the ledge to the tub.
  - The 40-pin header and JST must come off: there's no depth for them.
- **SMA 2**: right of the top-left corner screw (clearing its head), behind the Kobo.
  - Its hex sinks into the floor 0.4 mm off the Kobo. The jack goes up through its block from below.
  - Fit it before the XIAOs.
- **XIAOs**: they stand on end under the cover, their stack under SMA 2's block and the top-middle screw's boss.
- **Micro USB**: a 90° plug in a pocket in the ledge, its shell through a 1 mm end wall. `usb_y` is an estimate; the plug needs it within ~0.3 mm.
  - Power for the Kobo is the user's wiring. TP4056 OUT is cell voltage, not 5 V.
- **Strip antenna**: no geometry. Its home is inside the filled inner end, on the tub side.

## Unmeasured

- **From Kobo's drawing, ±2 mm:** `screen_*`, `power_button_y`, `usb_y`, `kobo_corner_radius`.
- **The display module:** 65 × 30.2, panel view area assumed centred, `display_parts` 3 mm.
- **Other boards:** the TP4056 (28 × 17.5) and the XIAOs (21 × 17.8, `xiao_height` 4.6).
- **Connectors:** the plug overmolds, and the SMA hex and thread length.
- **The seal:** untested. The squeeze, the gasket durometer and the boss stretch are first guesses.
