# meshtastic-drybag-node

A Meshtastic node in a sealed box that winches itself up into a tree and stays there for years. Printed parts:
- the box and the two shaft grommets: TPU 64D
- everything else (doors, reels and their flanges, gears, holder plates, side plates, bridges, crossmembers, rollers, panel mount): PCTG

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
- said v3's split rollers were "meh" and asked for "one box in the center with both sides that open up, and then you have the spool holder, it's the circle with crossmembers and the flat outer part of the frame for the roller thing at once". They chose front and back doors, with the motors on the back door and their shafts sealed through it. That is v4, the current layout.

The user wants independent control of the reels with an IMU to level the node ("stepper motors or independent control somehow like have an accelerometer"). I chose self-locking worm gearmotors, because a stepper needs holding current to hang on the line for years.

## Frames

- **Use frame:** X across, Z up as it hangs, Y forward. z = 0 is the box's bottom, y = 0 its back face. The back door, gears and rear plates are at y < 0; the front door and front plates beyond `box_d`.
- Each part's `*_print()` puts it in its print orientation. Every hole is round, no teardrops (the user's call).
- Right-side pieces are built at +x; the left ones are `mirror([1, 0, 0])`. The holder plates and side plates are chiral, so they have `-left` parts. Crossmembers, rollers, reels, gears and grommets are the same piece both sides.

## Load-bearing choices

- **Balance first.** The node hangs from the two roller pairs, at `line_y` front to back. Everything heavy is in the box, low and central. `panel_y` is the trim. Re-run the mass estimate after moving anything heavy (see Checks).
- **Box** (`frame()`): a tube along Y, `box_in_w` wide inside, `box_d` deep (set by the reels' length, so the front plate's back face is just ahead of it), `box_h` tall (set by the cell standing up plus the bulkhead's body over it).
  - **Openings:** both, front and back. Each seals on a tongue (`tongue()`, `tongue_w`) 0.3 mm a side wider than the groove (`groove_w`, `seal_band()`), stopping short of the groove's floor, its tip leading in over `tongue_lead`.
  - **Flanges:** `flanges()` runs round both openings, and the door screws sit in them (`door_screws`). The box prints back face down, so the front flange tapers out at 45°.
  - **Side flanges** also take the side plates' screws (`sp_screws`), between the door screws.
- **Inside** (the user picked front and back doors; the motors go on the back door):
  - **Motors:** they stand on the back door side by side (`mot_x0`, `mot_h`), between rims above and below; the side walls hold them across. Each pinion's grub screw on its shaft's flat pulls its motor onto the door. The shafts go out through TPU grommets (`grommet()`, lip outside so the motor's face is flat on the door).
  - **Cell:** it stands in front of the left motor (`cell_c`), held back by the front door's saddles (`saddle_zs`).
  - **Boards:** the charge board is on the back door over the motors; the protection board is on the front door between the saddles; the XIAO and the driver are to its right.
  - **Radio:** the kit is on the right wall, just under the bulkhead's level (`kit_pocket`). `radio_room` is kept free below it (asserted).
  - **Bulkhead:** it clamps through the top at `antenna_x`/`antenna_y`, relieved to `bulkhead_wall_t`, its body over the cell. The solar connector is beside it.
- **Screws:** M5 × 10 everywhere, with `thread_len` (8, the user's) of thread, counterbored to leave `under_head` (2) under the head, pilots `pilot_depth` (9) deep.
- **Gear drive** (`gear_2d()`, an involute with a little backlash; no BOSL2): pinion (`pinion_z`) on the motor's shaft → idler (`idler_z`) → the reel's ring (`ring_z`), behind the back door in `gear_y0..gear_y1`.
  - **Geometry:** `shaft_z` puts the ring as close to a straight reach as the two meshes allow (`gear_a + gear_b - 2`). `idler_c` is the triangle's lower vertex.
  - **Tooth phase:** `mesh_phase()` turns the idler and the ring so the teeth facing each neighbour meet a gap. Any change to the train goes through it. Check the mesh by rendering `pinion()`, `idler()` and `spool()` separately: they must not intersect.
- **Reels:** the rear flange is the gear ring, turned to `ring_psi`. The front flange (`reel_flange()`) is a separate disc keyed on a hex spigot, trapped by the front plate, so the reel prints on its ring with no overhang. The V jam cleat runs out through the spigot's end.
- **Reel holders** (the user: "the circle with crossmembers and the flat outer part of the frame for the roller thing at once"). Every piece is `cage_t` PCTG, printed flat.
  - Both plates share `holder_2d()`: a ring round the reel, a bar across it at the axle round a boss, four spokes, the flat outer part rising to the two rollers, and the flat inner part along the side plate.
  - **Crossmembers** (`xbars()`, `xbar_angles`) go all the way round, except on the box's side; dovetailed ends, each locked with a screw.
  - **Side plate** (`side_plate(s)`): bolted flat to the side flanges. It runs from the rear plate (notched round the idler behind the back door) to the front plate.
    - The front plate slides onto its front-edge tenons (`sp_tenon_zs`) from outside.
    - The rear plate screws onto its back edge (`rear_screw_zs`, clear of the idler, asserted).
  - **Bridges** (`bridge()`) over the box, above the top flanges, tie the two side plates together. The front one is the antenna's stem.
- **Rollers** (`roller()`, `rollers_c`): two per reel at `fl_z`, `roff` either side of `fl_xc` (`fl_in` in from the reel's edge), axes along Y from plate to plate.
  - **Why one piece:** the user found v3's split rollers "meh", so each is one print-in-place roller bearing `pip_len` long.
  - **Construction:** the hub is clamped by an M5 × 100 between the plates; the sleeve is 0.6 short. There are `pip_n` pins of radius `pip_rn`, with 45° collars at `pip_zs` running in V grooves in both races. The gap is `pip_c` (0.25), from published print-in-place designs (0.2–0.3 mm).
  - **No front-to-back guide:** the line can run anywhere along the rollers, which suits it winding across the drum.
- **Panel mount** (`spine()`, `panel_bar()`):
  - The spine's top member sits between the bottom flanges (`pp_ya`..`pp_yb`), screwed up into the floor.
  - Its members reach anchors behind the two bars (`pp_pts`); the bars pass through slots in it.
  - The panel's top and bottom edges sit in the bars' grooves, and the panel slides in from the side.
  - The panel faces back and up at `panel_tilt`, behind and below the box, so the box doesn't shade it.

## Checks worth re-running after a change

Intersect each pair of assembly groups: `frame`, `doors`, `grommets`, `reels`, `drive`, `holders`, `all_rollers`, `panel_mount`, and the references `cell`, `motors`, `boards`, `antenna`, `panel`.
- **Box ∩ doors:** this should be the two tongues' side squeeze only (~1950 mm³).
- **Doors ∩ grommets:** this should be the press fit (~80 mm³).
- **Grommets ∩ drive:** this should be the lip seals on the pinion hubs (~90 mm³).
- **Drive ∩ motors:** this should be the reference shaft in the pinion's D-bore only.
- **Everything else** should be empty, `pinion()` against `idler()` and `idler()` against `spool()` included.

**Balance:** take each group's volume and centroid × density (PCTG 1.27, TPU 1.21) × 0.6 infill. Add the guessed hardware:
- cell 280 g
- motors 2 × 100 g
- antenna and bulkhead 130 g
- panel 110 g
- boards ~65 g
- bolts 100 g

Compare the centre of mass's y against `line_y`. v4 came out about 2.6 mm behind, under 2° of tilt.

## Open, unmeasured

- **Motors:** a reel needs about 7 kg·cm at full radius to lift 2.9 kg; the gears give 4.7:1. JGY-370s probably need 6–12 V for that, more than the 3.2 V cell, so a boost converter is likely. The ratio and voltage aren't chosen. Everything about their mounting is a guess: the shaft's position across and along the gearbox sets `pinion_c`, and the reels' height follows from it.
- **Roller bearings:** `pip_c` 0.25 with 84 mm pins is untested in PCTG on the U1.
- **Not measured:** every board's size, the JGY-370's envelope and shaft, the solar panel (`panel_w`/`panel_h`), `n_body_d`/`n_body_len`, and the 5/8" connector's panel range.
- The 12/20-tooth undercut is ignored (involute from the base circle, radial below it). It's slight at those counts.
