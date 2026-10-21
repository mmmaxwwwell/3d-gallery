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
- **N bulkhead.** It goes through the +X end wall, between two screw columns. Its 24 mm body needs `tray_inside_h` ≥ 24.5. The stack needs 26: battery, 0.5 gap, 2 mm shelf, the Heltec's 10.2, then 1 mm under the frame's ledge.
- **Everything along the −Y wall (user, 2026-10-21: "pouch low and all chips low").** I read "bottom" as the −Y edge, which is the low edge in the viewer and once the panel is tilted. The pouch lies flat on the floor there. A separate shelf on four posts over it carries the Heltec, the TP4056 and the buck-boost. The shelf screws down with 4 M3x8 into counterbored bosses. `stack_x` slides the stack along X; it now sits at the bulkhead end.
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

- The pieces' rigid parts don't intersect.
- gasket ∩ tray ≈ 606 mm³, which is the tongue's side squeeze. Re-check this if the seal changes.
- The shelf meets the posts and the boards meet the shelf face to face only. The battery, boards and shelf clear the tray, the frame and the bulkhead.
