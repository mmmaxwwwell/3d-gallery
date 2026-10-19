# meshtastic-drybag-node

A Meshtastic node in a sealed box that winches itself up into a tree and stays there for years. Printed parts:
- the box: TPU 64D
- everything else (front door, gear covers, reels and their flanges and hubs, gears, holder plates, crossmembers, roller cheeks, rollers and their bearings, panel mount): PCTG

devOnly, unprinted.

## How the user's design got here

It started as a flat T frame in a dry bag, from a photo of the parts laid out. Along the way the user:
- turned the boards and flipped the node antenna-up
- put the cell in a housing and added slopes to the stem
- sealed the box. The first seal (a TPU bead with screws through it) is the layout that had failed on an earlier build. It became M5 screws straight into a TPU 64D body with a PCTG door ([[seal-screws-through-tpu-failed]] in memory).
- shortened the stem, added zip-tie slots and a rib, and blended the ears
- asked for a winch: "toss a line over some branches, tie both ends into the spools and it reels each in at the same time, pulling itself into the tree without having a tie line down"
- asked for reels square to the pull and far out to the side, holding 150–200 ft each, with the motor shafts out the back
- asked for no guides over the reels, just "a plate linking the spool free ends together and with the solar panel"
- asked for M5 × 10 screws with 8 mm of thread
- asked for a screwed battery retainer, the panel facing the other way, and the reels higher ("just flip the motors around")
- asked to cut the wind area and move the panel behind the reels, high under them, three quarters of the way out
- asked for the reels' line holes to become rope-wedging cleats
- asked for a cage that holds the reels close, as flat-pack slotted pieces; then thinner, following the reels' curve, only halfway up, corners tied first, dovetail joints with screws
- asked for the panel to sit in two plates that double as the reels' bottom crossmembers, and to balance the box. The cell moved to a sealed cup on the box's back under the reels (not a separate pod), the antenna went up 2" on a tower that's part of the box (after a 4" mast the user didn't want), and teardrops went out.
- asked for more door screws (five a side), sealed screw posts, and the boards rearranged round them

- asked to put the motors, battery and solar "balanced underneath", the reels "a little farther apart" with the antenna and radio coming up between them, room for a 1 W module, and "rollers holding the cord in the center out at the edge of the spool". That was v2: a cup under the reels plus a tower between them, a gear drive (the user approved it), and roller fairleads.
- said v2's fairlead would snap ("needs to be smoother, have actual rollers and be better supported") and that it wasn't space-optimized: "the spool holder and the body could be more tightly integrated, the box could open from both ends and it doesn't have to be wider than the spools". Then "if we're doing the rollers then we need to have that truss thing all the way around each of the spools", and print-in-place bearings with silicone oil rather than bought ones. That was v3.
- said v3's split rollers were "meh" and asked for "one box in the center with both sides that open up, and then you have the spool holder, it's the circle with crossmembers and the flat outer part of the frame for the roller thing at once". They chose front and back doors, with the motors on the back door and their shafts sealed through it. That was v4.
- v5 (the current layout) came from four asks:
  - "there doesn't need to be a plate between the spool holder and the case; the spool holder should fit into channels and get screwed in"
  - "add the 2nd set of rollers so we have two axis control"
  - "the box needs to be as wide as the spool", then "you can make the box a little larger on one side"
  - "less parts, 220x220 mm flat large skeleton pieces and then a body with gearset (add shroud for gears)", and "thicker herringbone gears"
- v6 (the current layout) came from:
  - "move the gears and motors back towards the center and contour out the case to fit it and still be watertight". They chose a sealed gear tray over a tighter external cover.
  - "the bottom two rollers aren't mounted in anything" (the tower's lightening had cut their bosses away)
  - "print in place bearings for those rollers but print the rollers and bearings separate and assemble"
  - "the bolt come in at a 45 with holes, and indexing in and out deviations along the length of it ... get rid of that bulky backing on the inside of the rail"
  - then: "just do a little channel with a couple indexing squares and the 45 degree screws"; the gearbox cover "doesn't need the vertical part ... two separate parts to keep the size down"; "remove a crossmember from the spool holder right under the rollers"; "the herringbone gears need print in place bearings on them if possible"; and "everything needs to be oversized ... we need low torque on the 3d printed parts"

The user wants independent control of the reels with an IMU to level the node ("stepper motors or independent control somehow like have an accelerometer"). I chose self-locking worm gearmotors, because a stepper needs holding current to hang on the line for years.

## Frames

- **Use frame:** X across, Z up as it hangs, Y forward. z = 0 is the box's bottom, y = 0 its back face. The back door, gears and shrouds are at y < 0.
- Each part's `*_print()` puts it in its print orientation. Every hole is round, no teardrops (the user's call).
- Right-side pieces are built at +x; the left ones are `mirror([1, 0, 0])`. The holder plates and shrouds are chiral, so they have `-left` parts. Crossmembers, cheeks, rollers, reels, gears and grommets are the same piece both sides.

## Load-bearing choices

- **Balance first.** The node hangs from the two roller windows, at `line_y` (the drum's middle) front to back. The gears and motors are behind it. Three things bring the centre of mass under it:
  - the box running `box_front_extra` past the front plates (at least 24, or the front flange hits the front plates; asserted)
  - the cell standing `cell_back` back from the front door
  - the panel hanging in front (`panel_side` = +1, `panel_y`, the nearest the box's shade allows; asserted)

  Re-run the mass estimate after any change to them (see Checks).
- **Box** (`frame()`): a tube along Y, `box_in_w` wide inside, `box_d` deep, `box_h` tall (set by the cell standing up plus the bulkhead's body over it).
  - **Back:** a solid wall (`plate_t`), and a slab (`slab_2d()`, `flange_len` deep) over it and both lobes. The slab takes the covers' screws (`cover_screws`), the output hubs' lip seals, and the rear plates' seats. Both print on the bed.
  - **Front:** it opens only at the front; the door seals on a tongue (`tongue()`) 0.3 mm a side wider than the groove (`seal_band()`).
- **Motors** (`motor_seats()`): gearbox down on the back wall inside, between rims above and below, with the encoders (`mot_encoder`) on top and the charge board above. The motors go in through the front door. Each pinion's hub (`hub_d`) runs through a lip seal in the back wall, and its grub screw on the shaft's flat pulls the motor onto the wall.
- **Gears:** herringbones (`herringbone()`), oversized (the user: "low torque on the 3d printed parts"): module `gear_m` 2.25, `gear_w` 16 wide, `gear_helix` 30°.
  - **Train:** pinion (`pinion_z`) → idler → idler (`idler_z`) → output (`out_z`), in a straight line from the motor's shaft to the reel's axis. `shaft_z` is wherever that line's length puts the reel. Neighbouring gears take opposite hands, and `mesh_phase()` turns each at the mid-plane so facing teeth meet gaps.
  - **Ratio:** 12:12, so the reduction is all the worm motor's.
  - **Fit:** the module and tooth counts are held by the bed: the slab is `2 * lobe_x1` wide (asserted), and the two pinions must clear each other at the middle.
  - **Idler bearings:** each idler carries a print-in-place roller bearing in its hub (`idler()`, hub `idler_hub_r`, on the cover's `gear_pin_d` pin), printed in one piece.
  - **Output gear:** too small for a bearing inside its teeth, it turns on an `out_pin_d` pin. Its hub goes out through the slab into the reel's hub.
  - **Parts:** a herringbone turned over is the other hand, so the idlers and pinions are one part each. The output gears carry a hub on one side, so there's a right and a left.
  - **Check the mesh** by rendering `pinion()`, `idler(0)`, `idler(1)` and `output_gear()` separately: they must not intersect.
- **Gear covers** (`gear_cover(s)`, the user's "two separate parts"): a floor and rim round each train, clipped at the middle where the two meet. They don't seal: the box is sealed at its wall and slab.
  - **Screws:** six M5 × 25s in solid `cover_boss_d` bosses (the user asked twice for them "more meaty"), heads in shallow counterbores at the back. They sit `cover_screw_out` past the lobe's edge, and each boss is unioned into the rim before the gears' pocket is cut, so it fills the rim without reaching the teeth.
  - **Slab pads:** `slab_2d()` grows a `cover_boss_d` pad under each screw, so its pilot has solid TPU all round (on the plain slab it was 0.9 mm from the edge).
  - **Support both sides** (the user's): the idlers' pins run on into `pin_socket`-deep sockets in the slab, the output gear rides its pin with its hub in the slab's seal, and the pinion's rear pocket rides the cover's `pinion_peg_d` peg.
- **Reel:** `spool()` has an integral rear flange and a hex spigot at the front for `reel_flange()`. Its rear has a hex socket (45° cone roof) for `reel_hub()`. The output gear's hex tip goes into the hub.
  - **Bearings** (`reel_bearing(g)`, the user's "generously sized print in place bearings that are pressed into place"): the reel's front journal (`front_journal_d`, inside the spigot's flats, asserted) turns in `front_brg`, pressed into the front plate; the hub's journal in `rear_brg`, pressed into the rear plate. `reel_brg(bore)` derives each from `rbp_rn`/`rbp_b`/`rbp_c`/`rbp_wall`. They're a plate (`cage_t`) thick and press `rb_press` tight. The axle boss in `holder_2d()` is sized to the rear one. There's no front axle bolt any more.
- **Holder plates** (`holder_2d()`, the user's "220x220 flat large skeleton pieces"). Each fits inside 220 × 220 (asserted).
  - **Shape:** a ring round the reel with a bar across at the axle round a boss, four spokes, the flat outer part up to the roller window, and the flat inner edge.
  - **Braces:** members from the ring's top and bottom, and the window's top, to that edge's ends.
  - **Lower rollers' bosses:** they stay solid when the tower is lightened (the user caught them floating).
  - **Crossmembers** (`xbars()`, `xbar_angles`) go round the ring, except on the box's side and right under the rollers (the user had that one taken out).
- **Channels** (`rail()`, `plate_edge()`, the user's "little channel with a couple indexing squares and the 45 degree screws"):
  - **Seat:** each plate's inner edge sits on a base `ch_base` off the wall, between two low lips.
  - **Indexing:** two square blocks (`idx_zs`) drop into notches in the edge.
  - **Bolts:** four bolts (`bolt45()`, at `seat_zs`) go in at 45° through the edge into the base. Their pilots end in solid TPU without breaking through the wall (asserted).
  - **Printing:** the base tapers into the wall at 45° under the rear lip, so it prints.
- **Rollers, two axes:**
  - **Window:** at [`fl_xc`, `line_y`].
  - **Lower pair** (`lower_c`): axes along Y, plate to plate. They hold the line side to side.
  - **Upper pair:** axes along X, between two dovetailed cheeks. They hold it front to back.
  - **Construction:** each roller (`roller()`) is a sleeve (`roller_sleeve()`) with a print-in-place bearing (`roller_bearing()`) pressed into each end, printed separately (the user's). Each bearing's hub reaches the roller's middle and meets the other's, so the bolt clamps the hubs (with an M5 washer each end) and never the pins.
  - **Bearing:** `pip_n` pins of `pip_rn`, a 45° collar at mid height in V grooves in both races, `pip_c` 0.25 gap (published print-in-place designs use 0.2–0.3 mm).
- **Panel mount** (`spine()`, `panel_bar()`):
  - **Facing:** the panel faces away from the box, `panel_side` choosing which side, and the box mustn't shade it (asserted for 45° sun).
  - **Spine:** its top member sits between the bottom flanges, screwed up into the floor.
  - **Panel:** its top and bottom edges sit in the bars' grooves, and the bars pass through slots in the spine.

## Checks worth re-running after a change

Intersect each pair of assembly groups: `frame`, `front_door`, `covers`, `reels`, `drive`, `holders`, `fairleads`, `all_rollers`, `panel_mount`, and the references `cell`, `motors`, `boards`, `antenna`, `panel`.
- **Box ∩ front door:** this should be the tongue's side squeeze only (~860 mm³).
- **Box ∩ drive:** this should be the pinion and output hubs' lip seals only (~360 mm³).
- **Drive ∩ motors:** this should be the reference shaft in the pinion's D-bore only.
- **Everything else** should be empty, the gears against each other included.

**Balance:** take each group's volume and centroid × density (PCTG 1.27, TPU 1.21) × 0.6 infill. Add the guessed hardware:
- cell 280 g
- motors with encoders 2 × 115 g
- antenna and bulkhead 130 g
- panel 110 g
- boards ~75 g
- bolts 110 g

Compare the centre of mass's y against `line_y`. v6 came out 0.7 mm forward, about 0.4° of tilt. The 22 mm cover bosses and slab pads add about 37 g behind the lines, about 0.8 mm back by their volume change alone, so it's now within about 0.1 mm (not re-run in full).

## Open, unmeasured

- **Motors:** the drive is 1:1, so the JGY-370's own worm ratio does all the work. A reel needs about 7 kg·cm at full radius (homelab-39 has 19 kg·cm worst case at the drum). JGY-370s need 12 V, hence the U3V40F12 boost. The ratio and rpm aren't chosen. The motor's real shaft position sets `pinion_c`, and the reels' height follows from it.
- **Print-in-place bearings** (rollers and idlers): `pip_c` 0.25 is untested in PCTG on the U1.
- **Not measured:** every board's size (the DRV8871 and U3V40F12 are homelab-39's ~25 × 20 and ~25 × 13), the JGY-370's envelope, shaft and encoder, the solar panel (`panel_w`/`panel_h`), `n_body_d`/`n_body_len`, and the 5/8" connector's panel range.
- The 12/16-tooth undercut is ignored (involute from the base circle, radial below it).
