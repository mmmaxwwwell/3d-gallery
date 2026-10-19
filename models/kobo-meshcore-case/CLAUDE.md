# kobo-meshcore-case

A grip a Kobo Clara HD slots into to become a MeshCore handheld (three Seeed XIAOs: nRF + two SX1262). devOnly, unprinted.

## The user's brief (2026-10-19)

- Landscape, the thick part on the right; the front flush with the cylinder's front, so it stands out at the back.
- An 18650 (with wire leads) in the cylinder.
- The cylinder's depth carries on inward behind the Kobo, the whole height, with no sharp edge at its inner end.
- "a handheld device that the kobo slots into to hold, and is detachable and unmodified": the Kobo's chin slides into a slot in the grip.
- Three XIAOs, one under another. Two SX1262 radios, one with an internal strip antenna.
- A second SMA "on the other rounded top part of the case": the top of the rounded inner end.
- Then: "get rid of the hole in the front" (the power button trough), "add a retention tab so the kobo locks in", "add a back cover", "add a microusb so when the kobo is plugged in it charges through usb", "add a usbc charger" (TP4056 USB-C 18650 boards, the user's own).
  - "the usbc should come in the side of the device underneath the first antenna": the right side, under the SMA over the cylinder.
- Earlier lessons: the user rejected a split cover as "doing bad", and wants simplicity. Keep parts few and plain.

## Frames

- **Depth frame**: X along the device (cylinder at +X), Y up as held (SMA at +Y), z = depth behind the front face. The Kobo's top edge is at x = 0 and its bottom edge (the chin's end) at `pocket_x1`. `grip_shape()` and `cover_shape()` are modelled here.
- **Print frames**:
  - `grip()` stands on its bottom end (y → Z), front face toward -Y.
  - `cover()` lies outer face down, pads up.
- `*_assembled()` mirror the depth frame so the front faces +Z. `cover_assembled(explode)` stands the cover off behind; the preview uses 30 mm so the inside shows. `upright()` stands the assembly up.

## Load-bearing choices (mine)

- **The grip prints standing up.** Lying face down, the floor would span the slot in mid-air. Standing, everything is extruded along Y.
  - So anything that bridges across Y needs a 45° underside: `hung_block()` for the SMA mounts, `octagon()` for the bottom plan corners and the screw seats, and the cell stop's cone.
  - Keep new features extruded along Y, or give them the same treatment.
- **Slot** (`grip_outline_2d`): the lip runs from `lip_x0` (screen edge + `window_margin`) to the chin's end. The floor reaches further in, to `thick_x0`; in front of it, left of the lip, the grip is notched away. The slot is square-cornered.
- **Retention** (`tab_cuts`, `tab_bump`): a tongue cut free of the floor on three sides, its free end toward the mouth, with a half-round ridge `tab_bump` into the slot.
  - It presses the Kobo into the lip. It can't catch anything: the Kobo has no feature to hook on its back or sides.
  - What resists pulling out is the ridge's friction plus the micro USB plug's grip.
  - If the user wants a positive lock, ask what on the Kobo it may catch. They reject snap fingers.
- **Micro USB** (`usb_cuts`): a 90° plug (cable toward the back). Its overmold drops into a pocket in the ledge from behind, and its shell pokes through a window in a 1 mm end wall that keeps it from pulling out with the Kobo.
  - `usb_y` is an estimate from Kobo's drawing; the plug needs it within ~0.3 mm.
  - Power to the plug is the user's wiring. The TP4056's OUT is the cell's voltage, not 5 V; 5 V needs the USB-C input or a boost board.
- **Power button**: no front access any more (the user asked to remove the trough). `button_relief_cut` keeps the end wall off it.
- **Charger**: on the floor with its USB-C end against the right wall's inside. `charger_y0` sits just above the cell bay, under the first SMA's mount (asserted). The board reaches over the open bore; `charger_stop_rib` behind it takes the plug's push.
- **XIAOs**: they stand on end (long side along Y) so three fit left of the charger. Their stack starts under the second SMA's 45° block.
- **Tub** (`tub_2d`): the inner end is a `wall`-thick quarter round, and the tub is open over the cell above its axis.
- **Cover**: a plate on the grip's back at `split_z` (= the cylinder's diameter), from where the inner end's round meets the back. 45° chamfered edges.
  - Three screws (`screws`): one in the first SMA's block, two in bosses on the bottom wall.
  - Each head is counterbored in a pad under the cover, which sits in an octagonal seat cut `pad_drop` into the grip.
  - There's no top-left screw: the second SMA's channel and the XIAOs leave no room.
- **SMA 1** (`sma1_block`): hung off the right wall, the hex through it, so the jack goes up the bore from below.
- **SMA 2** (`sma2_block`): hung off the inner end's round. The hex channel and the top-wall slot are open to the back, so the jack slides in from behind, and the cover then closes over it.
  - Flats face the round and the tub, and its front corner is on the floor. Its top corner is 0.2 mm under `split_z`.
- **Strip antenna**: no geometry yet. Its home is the inside of the inner end below SMA 2's block. Ask its size before adding a seat.

## Unmeasured

- From Kobo's drawing in the user guide, ±2 mm: `screen_*` (sets where the lip stops), `kobo_corner_radius`, `power_button_y`, `usb_y`.
- The 90° micro USB plug's overmold (`usb_body_*`).
- The TP4056 board (28 × 17.5 assumed) and its USB-C height.
- The XIAO outline (21 × 17.8, Seeed's spec).
- The pigtail's hex size and thread length (top wall 3 mm).
- The cell's length with tabs, and the strip antenna.
