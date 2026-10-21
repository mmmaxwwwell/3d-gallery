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
- **N bulkhead.** It goes through the +X end wall, between two screw columns. Its 24 mm body needs `tray_inside_h` ≥ 24.5. The stack needs 26: battery, 0.5 gap, 2 mm plate, the Heltec's 10.2, then 1 mm under the frame's ledge.
- **Stack at the +X end** (user, 2026-10-21): "the long side of the battery needs to be in the center of the short side of the box, and the electronics need to be on the carrier plate on top of the battery again".
  - The pouch's long axis runs across the box (along Y), centred.
  - The carrier plate (`shelf()`) screws down onto four posts over the pouch.
  - The Heltec is along the plate's edge nearest the bulkhead; the charger and buck-boost are along the other edge.
  - `stack_x` puts the stack as near +X as the bulkhead's back allows.
  - The stack is laid out in its own u/v frame, which `at_stack()` places. u is along the battery (global +Y); +v points away from the bulkhead (global −X).
  - My reading: "top" (from the user's earlier "horizontal and at the top") is the +X end, where the antenna is.
- **HT-HC33 and SMA** (user, 2026-10-21: "add a ht-hc33 board and sma mounted antenna to the bottom, space the antennas evenly").
  - "Bottom" is the −X end, opposite the top end that has the stack and the N.
  - The board lies flat on the floor, centred, 14 mm from the −X wall for the pigtail.
  - The SMA goes through the −X wall at y = 0, `n_z` high, so the two antennas mirror each other end to end.
- **Winch** (user, 2026-10-21).
  - The user's words: two gearmotors ("the same gear motors" as the other build: JGY-370 from meshtastic-drybag-node), two semi-internal spools of 100 ft of 1/32" stainless, "bigger and thinner", overlapping, "driven by a gear on the edge", skateboard (608) bearings, the overlapping pair spinning opposite ways.
  - My reading of "semi-internal": the spools sit on a deck under the sealed tray and stick out past its ends, where the cable comes off. Nothing on the winch is sealed except the motors' shafts, which go through TPU lip seals on the pinion hubs.
  - Two levels: U (upper, toward −X) and L (lower, toward +X). Each spool's teeth are on its lower flange, so a pinion boss never sits under the other flange.
  - The two trains are point-symmetric through the centre, which is where the opposite spin comes from.
  - 100 ft each is my reading; the user said "100 feet". The cable channel is `bay_w`; `core_r` is solved from `cable_len`.
  - The overlap is limited by L's pinion hub, which must pass outside U at U's level. L's motor lies along Y between the battery stack (x ≥ 40.6) and the frame's ledge (its top is 3 mm above `tray_h`, so it stays inside the opening), which caps `pin_y` at 61. The lib's asserts check every one of these.
  - The deck hangs from the tray's long-side screw columns. It has pilots from below and is `deck_band` wide on the edges, with bars under each post and pin.
- **Rejected layouts:** everything along −Y on a shelf; everything in one flat row along +Y.
- **Corner brackets, foam tape.** Each part sits between corner brackets and is held with foam tape. There are no straps or ties through the floor.
- **No mount and no vent.** The user hasn't said how it hangs.

## Frame

- X runs along the panel (the bulkhead at +X), Y across, Z up. z = 0 is the tray's underside.
- `*_in_place(lift)` places each lid piece in the assembly. The preview lifts them 40 mm.
- Distances in from the outer edge (the `_e` params) set out each band:
  - screws at 3.5;
  - tray wall 5.5–9.5;
  - groove 6.4–10;
  - panel pocket from 11;
  - ledge to 17.5;
  - bezel to 15.5.

## Checked

- Winch (2026-10-21): none of these intersect, beyond faces touching: spools, pinions, deck, tray, spacers, motors, the stack, the HC33 and the frame. Each seal grips its hub (≈24 mm³).

- The pieces' rigid parts don't intersect.
- gasket ∩ tray ≈ 606 mm³, which is the tongue's side squeeze. Re-check this if the seal changes.
- The plate meets the posts and the boards meet the plate face to face only. The battery, boards and plate clear the tray, the frame and the bulkhead.
