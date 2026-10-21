# solar-node

A sealed box under a salvaged 240 × 168 mm solar panel. devOnly, unprinted.

## The user's brief (2026-10-20)

- A frame the panel sits in, with a bead of construction adhesive. A cover screwed over it sandwiches the panel and the adhesive.
- "a slim ish box".
- Parts:
  - 10 Ah LP1260110 LiPo pouch (12 × 60 × 110);
  - N-type pigtail antenna connector;
  - Heltec V3;
  - TP4056.
- Power: panel → 5 V buck-boost → TP4056 → battery. The Heltec runs from the battery or from 5 V.

## My picks (not the user's)

- **Box below the panel.** Since the panel is glued in, the box opens by lifting the whole frame (panel and bezel with it) off the tray. One ring of M3 cap screws runs through bezel and frame into the tray, so the bezel never has to come off.
- **Seal.** A U-section TPU 85A gasket sits in a groove under the frame. The tray's tongue is wider than the gasket's slot and squeezes it from the sides. The screws are outside the seal (memory: seal-screws-through-tpu-failed).
- **Height.** The N's 24 mm body needs `tray_inside_h` ≥ 24.5. The stack needs 26: battery, 0.5 gap, 2 mm plate, a board's 10.2, then 1 mm under the frame's ledge.
- **Orientation** (user, 2026-10-21: "lets rotate this 90 degrees, put the antenna facing downwards along the long faces").
  - It hangs with a long side down: +Y is up, the panel faces out (+Z), and the winch is behind it (−Z).
  - "Top" and "bottom" in earlier notes meant ±X ends. Since this change they mean ±Y.
- **Electronics** (user: "move all the eelectronics evenly balanced to the bottom hear the antennas").
  - The pouch lies along X, centred, its stack's lower edge just above the bulkheads' backs (`stack_y`).
  - The carrier plate (`shelf()`, u = X, v = Y via `at_stack()`) is wider than the pouch, to take two rows:
    - row A, toward the bottom: the HC33 (on the SMA's side) and the TP4056;
    - row B: the buck-boost and the V3 (on the N's side).
  - The HC33 moved onto the plate.
- **Antennas.** The N is at +`ant_x`, the SMA at −`ant_x`, both down through the bottom wall.
  - Each sits midway between two long-side screw columns, at the midpoint nearest a third of the way along. That's 48 mm with `screw_pitch` 32: 28 bezel screws and 18 deck screws.
  - The N body's 24 mm needs half a pitch clear of each column.
- **Winch** (user, 2026-10-21).
  - The first brief: two gearmotors ("the same gear motors" as the other build: JGY-370 from meshtastic-drybag-node), two semi-internal spools of 1/32" stainless, "bigger and thinner", overlapping, "driven by a gear on the edge", skateboard (608) bearings, the overlapping pair spinning opposite ways.
  - Then 200 ft each, and "move the spools to not on top of each other anymore, and have rollers set up in the corner to have the cables exit as far apart as possible".
  - Spools sit side by side at (±`spool_x`, `spool_y`), as high as the deck's band allows, with 74 teeth. Each holds 200 ft in an 8 mm channel (10 wraps). The capacity count is whole wraps × whole layers; the core is solved for `cable_len × wind_margin`.
  - Each pinion is below its spool on the outer side. Each motor stands along Y with its gearbox toward −Y, as far out as the frame's ledge allows (its top is 3 mm above `tray_h`). The two trains mirror through x = 0, so the spools turn opposite ways.
  - **Corner exits.** First printed roller pairs, now 608s (below). `throat_x` keeps the cable between the two outermost deck pillars at the top.
  - **Horns** (user, relayed by session 3d-gallery-a2 on 2026-10-21: "can we somehow draw the line forward so the node hangs more upright?").
    - Each cable leaves its top corner through a horn on the deck that stands out past the top edge. The horn's throat is at `hang_z`, the depth of the centre of mass.
    - My estimate is in z, from the tray's underside: z ≈ 12–15 as the cable goes from fully paid out to full. It counts the printed parts at 0.5–0.8 fill, a 300 g glass panel, a 190 g pouch, 2 × 110 g motors and 45 g of boards. The node previously tipped back about 12°.
  - **Stainless 608s for the cable** (user, relayed by session 3d-gallery-05: "use stainless skateboard bearings to hold the wire").
    - Every guide the cable touches is a 608. Per corner there are four: the upright `guide_c` on a deck post (it turns the cable to +Y, outboard of it at `throat_x`), the `edge_c` lying across past the top edge (top 0.5 under the tray, hanging through a deck slot), and the throat pair `horn_cs`.
    - The horn's bearings are on M8x25 bolts, their inner races clamped by cheek bosses; `race_gap` (0.5) is less than the cable's diameter.
    - The printed rollers were dropped. `throat_x` moved from 112 to 109 so the guide bearing fits inside the end.
    - `ref_cable_runs()` straightens the path, so it cuts the races' curves by about 5 mm³ where the real cable wraps them.
  - **Preview:** the assembled preview hangs upright with the antennas down (user: "can we have the assembled view be upright with the antennas facing down"). It's `rotate([90, 0, 0])` of the model frame, with the lid pulled 40 mm forward.
  - **Superseded history:** a coaxial stack ("exactly overlapping"), and before that an offset pair overlapping 29 mm. My first capacity formula held only about 85 ft of a claimed 100.
  - **Deck.** It hangs from the tray's long-side columns on M3x25, with pilots from below. It has `deck_band` edges, bars under the posts and pinions, pads under the guide bearings, the horns, and slots for the edge bearings.
- **Rejected layouts:**
  - everything along −Y on a shelf;
  - everything in one flat row along +Y;
  - the stack at the +X end with the HC33 at −X (before the rotation);
  - offset and then coaxial spools.
- **Corner brackets, foam tape.** Each part sits between corner brackets and is held with foam tape. There are no straps or ties through the floor.
- **No vent.** It hangs from the two winch cables; there's no other mount.

## Frame

- X runs along the panel, Y across (+Y is up when hung), Z out of the panel. z = 0 is the tray's underside, and the deck is at negative z.
- `*_in_place(lift)` places each lid piece in the assembly. The preview lifts them 40 mm.
- Distances in from the outer edge (the `_e` params) set out each band:
  - screws at 3.5;
  - tray wall 5.5–9.5;
  - groove 6.4–10;
  - panel pocket from 11;
  - ledge to 17.5;
  - bezel to 15.5.

## Checked

- Rotated layout (2026-10-21): none of these intersect, beyond faces touching: spools, pinions, deck (with horns), tray, the 608s, spacers, motors, the battery, plate and boards, the frame and bezel, and the N and SMA. The reference cable path clears the tray, frame, bezel and deck. Two intended overlaps: each seal grips its hub (≈24 mm³), and each bearing's press fit in its hub (≈21 mm³).

- The pieces' rigid parts don't intersect.
- gasket ∩ tray ≈ 606 mm³, which is the tongue's side squeeze. Re-check this if the seal changes.
- The plate meets the posts and the boards meet the plate face to face only. The battery, boards and plate clear the tray, the frame and both bulkheads.
