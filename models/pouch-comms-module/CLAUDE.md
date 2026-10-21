# pouch-comms-module

A box for a backpack side pouch: power bank, Franklin T9, Pi Zero 2 W, Heltec HT-HC33. devOnly, unprinted.

## The user's brief (2026-10-20)

- "a holder for some electronics to fit inside a side pouch on my backpack", "a handheld telecommunications/electronics module".
- Overall size 30 × 140 × 190.
- Contents:
  - one power bank, 44.5 × 36.5 × 145;
  - Franklin T9, 94 × 67 × 14;
  - Pi Zero 2 W;
  - HT-HC33.
- The bank doesn't fit inside 30. Asked about it, the user said: "do 5mm walls however thick". So `wall` = 5 everywhere, and the height follows from the bank: 5 + 36.5 + 1 + 5 = 47.5.

## My picks (not the user's)

- **Bank lies 36.5 up, 44.5 across.** This is the thinner way up.
- **Bank ports toward +Y.** They face the bay rather than an outside window, so the cables stay inside.
- **Lid screws.** The lid is flat on 4 M3 cap screws, counterbored, in bosses at the inside corners. A 5 mm wall is too thin for a counterbore on its centreline. The -Y corner boss is why the bank starts `boss_r + 0.5` up from the wall.
- **Bank port-end posts** (2026-10-21). The user asked for "something holding it back on the right edge when looking down at it". The divider already held the long right side, so I read this as the port end, where nothing stopped the bank sliding into the bay. Two full-height posts, `bank_post_reach` × `bank_post_t`, sit at its corners. The divider runs on to the right-hand post.
- **No lid lip.** It would hit the bank's top edge.
- **Board orientation.** The boards are long side along Y, so the Pi's port edge faces the cable lane. The lane is `lane_w` = 15 mm.
- **SMA in the +Y end wall** (memory: heltec-ht-hc33-case uses the same 1/4-36 bulkhead). The wall is 5 mm. Check that the bulkhead's thread is long enough for it.
- No vents, no lid window, no external charging port. These are open questions in the README.

## Frame

- Origin is the outer -X -Y bottom corner. X runs across (140), Y along (190), Z up.
- Plan from -X: wall, bank pocket, divider, then the electronics column (`col_x0`..`col_x1`, 82.5 wide).

## Checked

- `exploded.3mf` lifts the bank, T9 and boards 60 up and the lid 132, and pulls the SMA 30 out.
- Box ∩ each reference part (bank, T9, boards, SMA) and box ∩ lid are all zero volume (only faces touching).
- Renders manifold through the forge (`buildModel`).
