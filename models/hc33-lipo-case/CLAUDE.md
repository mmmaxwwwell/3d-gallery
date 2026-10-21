# hc33-lipo-case

Two-piece case for a Heltec HT-HC33, a Heltec WiFi LoRa 32 V4, a 103665 LiPo, a USB-C TP4056 board and two SMA bulkheads. devOnly, unprinted.

## The user's brief (2026-10-21)

- "a 3d printed case for a 103665 battery, a heltec ht-hc33, two sma antenna mounts on top, and a 4056 charger".
- Then: "It also has a held tick v4 in it" (voice dictation: a Heltec V4).

## My picks (not the user's)

- **"On top" = the top end face.** The case stands on end like a handheld node: SMAs out of the +Y end, all three USB-Cs out of the -Y end.
- **Not sealed.** Plain PETG, tongue and groove for indexing only. If the user wants it waterproof, read [[seal-screws-through-tpu-failed]] in memory first: TPU 64D body with M5s, rigid lid, side-squeeze seal, screws outside it.
- **Two columns, two layers.** Base: V4 (-X) and cell (+X) side by side, a divider between. Lid: TP4056 over the V4, HC33 over the cell. This keeps every USB-C on the bottom wall; stacking the V4 as a third layer made it ~37 thick, and putting it end to end left its USB-C facing the SMAs.
  - The HC33 hangs from the lid on M2 posts at its holes: posts from the base can't reach them, the cell is under all four.
  - The TP4056 hangs upside down on a pad (`tp_lift`) so its receptacle, which is then under its PCB, has the plug's overmold room below the lid's face.
- **SMAs over the V4's column**, shifted `sma_shift` toward the cell so the left outer nut clears the corner tower (asserted). The HC33 runs almost to the top wall, so there's no room for an SMA's back over it.
- **Screws in corner towers** on the corners' diagonals (`screw_d`), outside the cavity, so nothing inside has to dodge bosses.
- **Split at the taller of the cell and the V4** (`split`). The V4's opening is in the base; the HC33's, the TP4056's and the SMAs' are in the lid, each kept clear of the groove (asserted).
- **SMA holes are round,** not teardropped, as the user asked for on the other HC33 case. They're the only overhang past 45° (the top arc of a 6.6 hole as the lid prints).
- Cell, V4 and TP4056 held by brackets, the divider, the lid's ribs and foam tape.

## Frame

Origin at the cavity's centre in plan, z = 0 on the back face. Y up the case, X across, Z out the front. The cavity runs `y0`..`y1` from the bottom wall's inner face; `ys` shifts that onto the origin. Each board's USB-C face is `usb_gap` off the bottom wall; its PCB starts the overhang further in (`*_pcb_y0`). `ceiling` (the lid's inner face) is the highest of what the HC33's opening, its top parts and the hanging TP4056 need; `sma_z` hangs the SMAs' inner nuts just under it.

## Checked

- Zero-volume intersections (faces touching at most): base × lid, each piece × every reference part, every pair of reference parts.
- Overhang scan of both print-oriented STLs: only the SMA holes' top arcs.
- Renders through the forge (`buildModel`): base, lid, assembled, closed, print plate.
