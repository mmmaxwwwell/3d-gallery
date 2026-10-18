# meshtastic-drybag-node

A Meshtastic node in a sealed box that winches itself up into a tree and stays there for years. Printed parts:
- the body: TPU 64D
- everything else (end doors, tower cap and stem, reels and their flanges, gears, cradle plates, bars, fairleads, rollers, panel plates): PCTG

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
- said v2's fairlead would snap ("needs to be smoother, have actual rollers and be better supported") and that it wasn't space-optimized: "the spool holder and the body could be more tightly integrated, the box could open from both ends and it doesn't have to be wider than the spools". Then "if we're doing the rollers then we need to have that truss thing all the way around each of the spools", and print-in-place bearings with silicone oil rather than bought ones. That is v3, the current layout.

The user wants independent control of the reels with an IMU to level the node ("stepper motors or independent control somehow like have an accelerometer"). I chose self-locking worm gearmotors, because a stepper needs holding current to hang on the line for years.

## Frames

- **Use frame:** X across, Z up as it hangs, Y forward. z = 0 is the body's bottom, y = 0 its back. The gears and rear plates are at y < 0; the front plates at y > `front_y`.
- Each part's `*_print()` puts it in its print orientation. Every hole is round, no teardrops (the user's call).
- Right-side pieces are built at +x; the left ones are `mirror([1, 0, 0])`. The cradle plates, panel plates and end doors are chiral or differ, so they have `-left` parts. The bars, cheeks, spacers, rollers, reels and gears are the same piece both sides, because the fairlead is symmetric about `line_y` and `fl_xc`.

## Load-bearing choices

- **Balance first.** The node hangs from the two fairleads, at `line_y` front to back. Everything heavy (motors, cell, panel) sits low, placed so the centre of mass falls under them. `panel_y` is the trim. Re-run the mass estimate after moving anything heavy (see Checks).
- **Body** (`tube()`): a tube along X (`end_outline_2d()`, y 0..`front_y`, z 0..`cup_top`) plus the tower (`tower_outline_2d()`), with fillets where they meet.
  - `front_y` is the reel's own length (gear ring to front flange). The front plate lies flat on the body's front face, so the body is exactly as deep as the reels: the user's "more tightly integrated".
  - `cup_half` (133) keeps it inside the reels' span and on the U1's bed (asserted).
  - `cup_in_h` is whatever the motors and the cell need. The floor (`floor_t`) and top band (`top_t`) are solid the full depth, so every cradle and panel screw has a blind pilot in them.
- **Openings: both ends and the tower's top** (the user: "the box could open from both ends").
  - Each seals on a tongue (`tongue_z()`, `tongue_w`) 0.3 mm a side wider than the groove (`groove_w`, `seal_band_of()`), stopping short of the groove's floor, its tip leading in over `tongue_lead`.
  - Screws sit in flanges outside the seal: along each end's top and bottom (`end_flanges_2d()`, `end_screws`), and along the tower's two sides (`tower_flanges_2d()`, `cap_screws`). A flange runs the body's full depth, because the body prints back face down and a short ear would print as a shelf. Its outer corners are cut at 45° for the same reason.
  - There are no screws up the openings' other edges: a flange there would print as a shelf, or would stand where the cradle plates go. The tongue's grip is the seal, and the screws only hold the doors on.
  - The doors carry the boards. The motors and the cell slide in from the ends:
    - The motor slides in with its shaft clear of the back wall (asserted), then back onto the pinion's hub. Its grub screw holds it on the wall, and a pad and an inner-end rim stop it turning.
    - The cell slides in from the right against a stop hanging from the top band at the left (`cell_cradles()`), above where the left motor passes. The right door's post (`post_c`) holds it there.
  - The tower cap carries the bulkhead and the sled (`sled_*`), so the radio and charge board lift out with it and the pigtail never stretches. `radio_room` must fit on the sled's back face (asserted).
  - The antenna stem (`stem()`) can't be part of the cap: the cap prints upside down. It's its own flat part, its feet held by the cap's screws at `stem_screw_y` (M5 × 16 there).
- **Screws:** M5 × 10 everywhere, with `thread_len` (8, the user's) of thread, counterbored to leave `under_head` (2) under the head, pilots `pilot_depth` (9) deep. Nothing goes through the body except the pinion hubs (lip seals), the bulkhead (in the PCTG cap) and the solar connector.
- **Gear drive** (`gear_2d()`, an involute with a little backlash; no BOSL2): pinion (`pinion_z`) on the JGY-370's D-shaft → idler (`idler_z`) → the reel's ring (`ring_z`), in a vertical line behind the back wall, in the plane `gear_y0..gear_y1`. Centre distances come from the pitch radii, so `shaft_z` follows from the motor's shaft height.
  - Tooth phase: each gear has a tooth on its +x axis, and with 12/14/56 teeth the teeth facing each other fall tooth-to-gap without rotation. Don't add a phase rotation without re-checking the mesh.
  - The pinion's grub screw comes in from the root between two teeth, where the D-flat faces (`grub`).
  - The idler turns on an M5 × 16 threaded through the rear plate, cantilevered; it never touches the body.
- **Reels:** the rear flange is the gear ring. The front flange (`reel_flange()`) is a separate disc keyed on a hex spigot at the core's end, trapped by the front plate, so the reel prints on its ring with no overhang. The V jam cleat (`cleat_*`) runs out through the spigot's end. The reels turn on M5 × 25 axles threaded into both cradle plates.
- **Cradles: flat-pack**, the user's idea ("cardboard 3D cutouts... we use the strong axis"). Every piece is `cage_t` PCTG, printed flat.
  - Both plates share `cradle_2d()`: a full ring round the reel, a bar across at the axle round a boss, four spokes, and a tower from the ring's outer top quarter up to the fairlead box.
  - `front_plate(s)` adds a frame over the body's front face, screwed into its floor and top band (`face_screws`).
  - `rear_plate(s)` adds a web over the gear train, on four posts (`standoff_pts`, `standoff_dx`) into the back wall at the floor and the top band. The posts clear the idler's tips (asserted).
  - Linking bars (`xbars()`, `xbar_angles`) go all the way round, except on the tower's side, where a bar would run into the tower. Their ends are dovetails sliding into sockets open outward, each locked with a screw: the user's "dovetail... snap with screw".
- **Fairleads:** a four-roller box (the user: "smoother, actual rollers, better supported"), round a window at [`fl_xc`, `line_y`], `fl_in` in from the reel's edge.
  - **Lower rollers:** a pair at `fl_za`, axes along X, `roff` either side of `line_y`. They centre the line front to back, between the two cheeks (`cheek_local()`).
  - **Upper rollers:** a pair at `fl_zb`, axes along Y. They hold it side to side, between the two spacers (`spacer()`).
  - **Cheeks:** each dovetails into both plates' towers at both roller heights (`plate_joints()`). The inner cheek slides in first, along the same grooves as the outer, then the spacers screw between them.
  - **Load path:** the towers take the line's sideways pull in their own plane (their strong axis); the cheeks and spacers make it a box.
- **Rollers: print-in-place roller bearings** (`roller_half()`; the user: "look up how to do print in place bearings, we can add some silicone oil").
  - Each roller is two halves back to back on an M5 × 70, which clamps the two hubs between the walls; the sleeves are 0.6 mm short so they don't rub.
  - Each half is a hub, the sleeve, and `pip_n` pins between them. All three start on the bed. The pins' 45° collar (`pip_b`) runs in a V groove in both races, which keeps them captive and keeps every overhang at 45°.
  - The gap is `pip_c` (0.25). Printables and MakerWorld designs print these at 0.2–0.3 mm: under 0.1 fuses, over 0.3 lets the rollers jam.
- **Panel plates** (`panel_plate(s)`): trusses under the floor. Each has a top member screwed up into the floor (`pp_screw_ys`), a member along the panel with its groove, a leg to the panel's high edge, and a diagonal to its low edge. The panel faces back and up at `panel_tilt`, behind the body, so the body never shades it.

## Checks worth re-running after a change

Intersect each pair of assembly groups: `frame`, `doors`, `stem`, `reels`, `drive`, `cradles`, `fairlead_sets`, `all_rollers`, each panel plate, and the references `cell`, `motors`, `boards`, `antenna`, `panel`.
- **Body ∩ doors:** this should be the tongues' side squeeze only (~1230 mm³).
- **Body ∩ drive:** this should be the pinion hubs' lip seals only (~80 mm³).
- **Drive ∩ motors:** this should be the reference shaft in the pinion's D-bore only.
- **Everything else** should be empty, the pinion against the idler and the idler against the reel's ring included. Render `pinion()` and `idler()` separately to check the mesh.

**Balance:** take each group's volume and centroid × density (PCTG 1.27, TPU 1.21) × 0.6 infill. Add the guessed hardware:
- cell 280 g
- motors 2 × 100 g
- antenna and bulkhead 130 g
- panel 110 g
- boards ~65 g
- bolts 90 g

Compare the centre of mass's y against `line_y`. v3 came out 3 mm behind, about 1° of tilt, with or without full reels.

## Open, unmeasured

- **Motors:** a reel needs about 7 kg·cm at full radius to lift 3.2 kg; the gears give 4.7:1. JGY-370s probably need 6–12 V for that, more than the 3.2 V cell, so a boost converter is likely. The ratio and voltage aren't chosen. The motor's real shaft height on the gearbox sets `pinion_c`, and everything above follows from it.
- **Roller bearings:** `pip_c` 0.25 is untested in PCTG on the U1.
- **Not measured:** every board's size, the JGY-370's envelope and shaft, the solar panel (`panel_w`/`panel_h`), `n_body_d`/`n_body_len`, and the 5/8" connector's panel range.
- The 12/14-tooth undercut is ignored (involute from the base circle, radial below it). It's slight at those counts.
