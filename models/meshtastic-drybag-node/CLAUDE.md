# meshtastic-drybag-node

A Meshtastic node in a sealed box that winches itself up into a tree and stays there for years. Printed parts:
- the box and the two shaft grommets: TPU 64D
- everything else (doors, gear shrouds, reels and their flanges, gears, holder plates, crossmembers, roller cheeks, rollers, panel mount): PCTG

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

The user wants independent control of the reels with an IMU to level the node ("stepper motors or independent control somehow like have an accelerometer"). I chose self-locking worm gearmotors, because a stepper needs holding current to hang on the line for years.

## Frames

- **Use frame:** X across, Z up as it hangs, Y forward. z = 0 is the box's bottom, y = 0 its back face. The back door, gears and shrouds are at y < 0.
- Each part's `*_print()` puts it in its print orientation. Every hole is round, no teardrops (the user's call).
- Right-side pieces are built at +x; the left ones are `mirror([1, 0, 0])`. The holder plates and shrouds are chiral, so they have `-left` parts. Crossmembers, cheeks, rollers, reels, gears and grommets are the same piece both sides.

## Load-bearing choices

- **Balance first.** The node hangs from the two roller windows, at `line_y` (the drum's middle) front to back. The gears, shrouds and motors are all behind it. Three things bring the centre of mass back under it:
  - the cell at the front door
  - the box running `box_front_extra` past the front plates (the user allowed "a little larger on one side")
  - the panel hanging in front (`panel_side` = +1, `panel_y`)

  Lighter gears or shrouds move it forward again. Re-run the mass estimate after any change to them (see Checks).
- **Box** (`frame()`): a tube along Y, `box_in_w` wide inside, `box_d` deep, `box_h` tall (set by the cell standing up plus the bulkhead's body over it).
  - **Openings:** both, front and back. Each seals on a tongue (`tongue()`, `tongue_w`) 0.3 mm a side wider than the groove (`groove_w`, `seal_band()`), stopping short of the groove's floor, its tip leading in over `tongue_lead`.
  - **Flanges:** the door screws (`door_screws`) sit in flanges round both openings (`flanges()`). The box prints back face down, so the front flange tapers out at 45°.
- **Channels** (the user: "fit into channels and get screwed in"; no plate between holder and box):
  - Each plate's inner edge strip (`seat_x0`..`seat_x1`, from `strip_z0` up the box) sits on a TPU face against a lip (`lip_w`), and screws into it at `seat_zs`, between the door screws.
  - The rear plate seats on the back flange's front face; the back flange runs out to `seat_x1` at the sides for it.
  - The front plate seats on a rib (`rib_y0`..`front_y0`) that tapers out at 45° below it, so it prints.
  - The plates' inner edges never sit under a flange: a flange over a slot would print as a shelf.
- **Inside:**
  - **Motors:** they stand on the back door side by side (`mot_x0`, `mot_h`), between rims above and below; the side walls hold them across. Each pinion's grub screw on its shaft's flat pulls its motor onto the door. The shafts go out through TPU grommets (`grommet()`, lip outside so the motor's face is flat on the door).
  - **Cell:** it stands at the front (`cell_c`), held against the front door by its saddles (`saddle_zs`).
  - **Boards:** the charge board is on the back door over the motors; the protection board is on the front door between the saddles; the XIAO and the driver are to its right.
  - **Radio:** the kit is on the right wall, just under the bulkhead's level (`kit_pocket`). `radio_room` is kept free below it (asserted).
  - **Bulkhead:** it clamps through the top at `antenna_x`/`antenna_y`, relieved to `bulkhead_wall_t`, its body over the cell, with the solar connector beside it.
  - **Stem:** the antenna's stem (`stem()`) is part of the box. It's a TPU plate beside the antenna with a 45° front edge so it prints; zip ties go through its slots.
- **Screws:** M5 × 10 everywhere, with `thread_len` (8, the user's) of thread, counterbored to leave `under_head` (2) under the head, pilots `pilot_depth` (9) deep.
- **Gear drive:** herringbones (`herringbone()`: each half a twisted extrusion of `gear_2d()`, mirrored about the mid-plane). They're `gear_w` wide at `gear_helix` 30°, behind the back door in `gear_y0..gear_y1`. The user asked for thicker herringbones.
  - **Train:** pinion (`pinion_z`, hand +1) → idler (`idler_z`, hand −1) → the reel's ring (`ring_z`, hand +1); meshing gears take opposite hands. `shaft_z` puts the ring as close to a straight reach as the meshes allow, and `idler_c` is the triangle's lower vertex.
  - **Tooth phase:** `mesh_phase()` turns the idler and the ring at the mid-plane so the facing teeth meet gaps.
  - **Orientation:** `herringbone()` uses `rotate([90, 0, 0])`; the 2D profile's +y must map to world +z, or every phase flips. Check the mesh by rendering `pinion()`, `idler()` and `spool()` separately: they must not intersect.
  - The ring's web is spoked, for weight at the back.
- **Shrouds** (`shroud(s)`): one per side, clipped at the middle where they meet and open inside there. Each has a 3 mm back plate with bosses where the idler's and the reel's rear bolts thread in, and a rim forward to the back door. Posts reach on to the rear plate, which screws into them. One pad sits on a back door screw clear of the gears (`shroud_pads`, M5 × 16).
- **Reels:** the rear flange is the herringbone ring. The core runs on through the rear plate's bearing bore (`journal_clear`) to the drum. The front flange (`reel_flange()`) is a separate disc keyed on a hex spigot, trapped by the front plate. The V jam cleat runs out through the spigot's end.
- **Holder plates** (`holder_2d()`, the user's "220x220 flat large skeleton pieces"). Each fits inside 220 × 220 (asserted).
  - **Shape:** a ring round the reel with a bar across at the axle round a boss, four spokes, the flat outer part up to the roller window, and the flat inner edge for the channel.
  - **Crossmembers** (`xbars()`, `xbar_angles`) go all the way round, except on the box's side; dovetailed ends, each locked with a screw.
- **Rollers, two axes** (the user: "the 2nd set of rollers so we have two axis control"):
  - **Window:** at [`fl_xc`, `line_y`], `fl_in` in from the reel's edge.
  - **Lower pair** (`lower_c`, at `fl_za`): axes along Y, plate to plate, `roff` either side of `fl_xc`. They hold the line side to side.
  - **Upper pair** (at `fl_zb`): axes along X, `roff` either side of `line_y`, between two cheeks (`cheek_local()`) dovetailed into both plates at `cheek_tenon_zs`. They hold it front to back.
  - **Construction:** each roller (`roller(len)`) is one print-in-place roller bearing. The hub is clamped by its bolt, the sleeve is 0.6 short, and `pip_n` pins of `pip_rn` have 45° collars at a quarter and three quarters of the length. The gap is `pip_c` (0.25), from published print-in-place designs (0.2–0.3 mm).
- **Panel mount** (`spine()`, `panel_bar()`):
  - **Facing:** the panel faces away from the box, `panel_side` choosing which side, and the box mustn't shade it (asserted for 45° sun).
  - **Spine:** its top member sits between the bottom flanges, screwed up into the floor. A leg from its end nearer the panel reaches the top bar, and a diagonal from its other end reaches the bottom bar. The bars pass through slots in it.
  - **Panel:** its top and bottom edges sit in the bars' grooves.

## Checks worth re-running after a change

Intersect each pair of assembly groups: `frame`, `doors`, `grommets`, `reels`, `drive`, `shrouds`, `holders`, `fairleads`, `all_rollers`, `panel_mount`, and the references `cell`, `motors`, `boards`, `antenna`, `panel`.
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
- bolts 110 g

Compare the centre of mass's y against `line_y`. v5 came out about 2.4 mm forward, about 1.5° of tilt. Before the box grew forward and the panel moved to the front it was 15–20 mm behind, about 10–14°.

## Open, unmeasured

- **Motors:** a reel needs about 7 kg·cm at full radius to lift 3.6 kg; the gears give 4.7:1. JGY-370s probably need 6–12 V for that, more than the 3.2 V cell, so a boost converter is likely. The ratio and voltage aren't chosen. Everything about their mounting is a guess: the shaft's position across and along the gearbox sets `pinion_c`, and the reels' height follows from it.
- **Roller bearings:** `pip_c` 0.25 with full-length pins (78 and 66 mm) is untested in PCTG on the U1.
- **Not measured:** every board's size, the JGY-370's envelope and shaft, the solar panel (`panel_w`/`panel_h`), `n_body_d`/`n_body_len`, and the 5/8" connector's panel range.
- The 12/20-tooth undercut is ignored (involute from the base circle, radial below it). It's slight at those counts.
