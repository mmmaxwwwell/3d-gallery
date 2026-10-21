# hc33-lipo-case

Two-piece case for a Heltec HT-HC33, a 103665 LiPo, a USB-C TP4056 board and two SMA bulkheads. devOnly, unprinted.

## The user's brief (2026-10-21)

"a 3d printed case for a 103665 battery, a heltec ht-hc33, two sma antenna mounts on top, and a 4056 charger". Nothing else was said.

## My picks (not the user's)

- **"On top" = the top end face.** The case stands on end like a handheld node: SMAs out of the +Y end, both USB-Cs out of the -Y end.
- **Not sealed.** Plain PETG, tongue and groove for indexing only. If the user wants it waterproof, read [[seal-screws-through-tpu-failed]] in memory first: TPU 64D body with M5s, rigid lid, side-squeeze seal, screws outside it.
- **Stack.** Cell flat on the back; HC33 over it, hung from the lid on four M2 posts at its holes. Posts from the base can't reach the holes: the cell is under all four. The TP4056 sits under the HC33's USB end, below the cell in Y, since that's where the cell isn't.
- **Screws in corner towers** on the corners' diagonals (`screw_d`), outside the cavity, so nothing inside has to dodge bosses. The HC33 is only 1.75 mm narrower than the cavity per side.
- **Split at the cell's top** (`split = cell_top`). The TP4056's opening is in the base, the HC33's and the SMAs' in the lid, each kept clear of the groove (asserted).
- **SMA holes are round,** not teardropped, as the user asked for on the other HC33 case. They're the only overhang past 45° (the top arc of a 6.6 hole as the lid prints).
- Cell and TP4056 held by brackets, stubs, the lid's ribs and foam tape. Nothing grips the TP4056 against a plug being pulled out except the tape.

## Frame

Origin at the cavity's centre in plan, z = 0 on the back face. Y up the case, X across, Z out the front. The cavity runs `y0`..`y1` from the bottom wall's inner face; `ys` shifts that onto the origin. Each board's USB-C face is `usb_gap` off the bottom wall (`tp_y0`, `hc_y0`); its PCB starts the overhang further in (`*_pcb_y0`). `ceiling` (the lid's inner face) is the higher of the HC33's opening and its top parts plus a millimetre; `sma_z` hangs the SMAs' inner nuts just under it.

## Checked

- Zero-volume intersections (faces touching at most): base × lid, base × cell/TP4056, lid × HC33/SMAs, HC33 × cell/TP4056/SMAs.
- Overhang scan of both print-oriented STLs: only the SMA holes' top arcs.
- Renders through the forge (`buildModel`): base, lid, assembled, closed, print plate.
