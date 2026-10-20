# Kanix Antenna Mounts

Mounts that hold the bulkhead jack at the end of an antenna extension cable facing up on a Kanix clip, so the antenna stands on top of it. The jack goes up through a shelf across the top of a bolt pad, and its nut tightens on top of the shelf. The jack's body and the cable hang below the shelf, in front of the pad, between two gussets that tie the shelf to the pad. A zip tie through a tunnel in the pad holds the cable.

Three builds:

- **SMA 1×2** (default): one column of two bolt holes. It goes on a wide 1×2 Kanix MOLLE clip, or on two of a 1×4 clip's four holes. 14 × 38 mm pad.
- **SMA 1×3**: one column of three. It goes on a 1×3 or a 1×4 clip, not a 1×2. 14 × 52 mm pad.
- **N 3×2**: three columns across, two rows up, the 3×2 Kanix belt clip's pattern. On MOLLE it takes two 1×4 MOLLE clips on its outer two columns. Those are 38.1 mm apart, exactly one PALS channel, and each clip uses two of its four holes. The wide (26.4 mm) clips clear each other at that spacing. It also bolts straight onto a 3×2 Kanix belt clip. 52 × 38 mm pad.

The SMA's hex sits in a pocket in the shelf's underside, so the jack can't turn while you tighten the nut. The N has no pocket; its slot is wide enough to get your fingers on the body.

## Printing

- PCTG, one piece, pad down. No supports. The holes through the shelf peak at 45° up the print, and only the blind screw holes' tops bridge.
- 6 walls, 40% gyroid: the shelf carries an antenna's leverage.
- Every edge is rounded except the bed face, with fillets where the gussets meet the pad and the shelf.

## Mounting

M5x10 screws through the clip into 4.2 mm pilot holes, drilled blind from the clip side. Through a MOLLE clip an M5x10 reaches 8 mm in; through the 3×2 belt clip, 7.4. The pilots go 8.6 deep, and the pad leaves 1.5 mm over them. Each pilot's mouth has a 0.8 mm chamfer so the screw starts square.

The clips are printed from the Kanix repo: `scad/plates/molle_clip_1x2_60x2_wide.scad`, `molle_clip_1x3_60x2_wide.scad` or `molle_clip_1x4_60x2.scad`.

## Check before printing

The connector sizes come from other gallery models (`kobo-meshcore-case` and `heltec-ht-hc33-case` for the SMA; `apache-case-modules` and `meshtastic-drybag-node` for the N). They have not been measured on these extension cables. Check:

- SMA: thread hole 6.6, hex 8 mm (8.3 pocket, 3 deep), 2.5 mm panel over the pocket, so 5.5 mm of shelf. That needs about 7.5 mm of thread with the 2 mm nut.
- N: 15.9 mm thread (16.4 hole), 3/4" nut, 24 mm body with its O-ring, 4 mm panel. If the bulkhead's thread has a flat (a D-hole), the round hole won't stop it turning.
