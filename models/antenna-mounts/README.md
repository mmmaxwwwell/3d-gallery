# Antenna Mounts

Mounts that hold the bulkhead jack at the end of an antenna extension cable facing up on a pack's MOLLE, so the antenna stands on top of it. A rounded shroud runs the length of a plate that bolts to MOLLE clips. Seen from above, the shroud is a half circle round the antenna, squared back to the plate, with a big rounded flange where it meets it. The jack goes through the shroud's closed top, its nut on top. Its body and the cable run down inside the shroud and out a hole at the bottom, so the cable's end is covered.

Cable ties hold the cable down inside. Each tie goes down one slot in the top of the shroud, under the cable along the bore's floor, and up the slot beside it, and you cinch it on top. There's one pair of slots at the bottom end, and the rest are spread up to just below the jack's body: two pairs on the 1×2 and the N, three on the 1×3.

Three builds:

- **SMA 1×2** (default): one column of two bolt holes, on a wide 1×2 Kanix MOLLE clip or two of a 1×4 clip's four holes. 26.4 × 38 mm, as wide as the clip.
- **SMA 1×3**: one column of three, on a 1×3 or a 1×4 clip. 26.4 × 52 mm.
- **N 3×2**: the 3×2 Kanix bolt pattern. On MOLLE it takes two 1×4 MOLLE clips on its outer two columns, 38.1 mm apart, exactly one PALS channel, each clip on two of its four holes. The plate covers both clips: 64.5 × 38 mm. It also bolts onto a 3×2 Kanix belt clip. Its shroud is bigger, with 5 mm walls.

The SMA's hex sits in a pocket in the underside of the top, so the jack can't turn while you tighten the nut. The N has no pocket.

It's customizable: the bore (which the jack and the cable's far-end plug pass up), the walls, the flange, the cable and the connector sizes.

## Fitting it

Thread the ties through their slots loosely first. Push the jack up the bore from the bottom, through the tie loops, up through the top, and put the nut on. Then pull the ties tight.

## Printing

- PCTG, one piece, plate down. No supports. The bore and the holes through the top peak at 45° up the print. The bore's roof is flattened into a short bridge (2.3 mm on the SMA, 8.8 mm on the N) so the top of the shroud stays thick. The blind screw holes' tops bridge too.
- 6 walls, 40% gyroid: these will be knocked about.
- Every edge is rounded except the bed face.

## Mounting

M5x10 screws through the clip into 4.2 mm pilot holes, drilled blind from the clip side. Through a MOLLE clip an M5x10 reaches 8 mm in; through the 3×2 belt clip, 7.4. The pilots go 8.6 deep with 1.5 mm of plate over them under the bore. Each pilot's mouth has a 0.8 mm chamfer so the screw starts square.

The clips are printed from the Kanix repo: `scad/plates/molle_clip_1x2_60x2_wide.scad`, `molle_clip_1x3_60x2_wide.scad` or `molle_clip_1x4_60x2.scad`.

## Check before printing

The connector sizes come from other gallery models (`kobo-meshcore-case` and `heltec-ht-hc33-case` for the SMA; `apache-case-modules` and `meshtastic-drybag-node` for the N). They have not been measured on these extension cables. Check:

- SMA: thread hole 6.6, hex 8 mm (8.3 pocket, 3 deep), 2.5 mm panel over the pocket, so a 5.5 mm top. That needs about 7.5 mm of thread with the 2 mm nut. The body and crimp are taken as 12 mm long, the cable 3 mm, the far-end plug under 10.5 mm across.
- N: 15.9 mm thread (16.4 hole), 3/4" nut, 24 mm body 15 long with its O-ring, 4 mm panel, 7 mm cable. If the bulkhead's thread has a flat (a D-hole), the round hole won't stop it turning.
