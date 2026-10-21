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
- **Height.** The N's 24 mm body needs `tray_inside_h` ≥ 24.5 (the walls' height under the lid at the rim). Before the wedge, the stack set it at 26; now the lid is the ceiling, and asserts check the stack and motors against it.
- **Orientation** (user, 2026-10-21: "lets rotate this 90 degrees, put the antenna facing downwards along the long faces").
  - It hangs with a long side down: +Y is up, the back is at z = 0 with the box in front (+Z) and the winch behind it (−Z).
  - "Top" and "bottom" in earlier notes meant ±X ends. Since this change they mean ±Y.
- **Electronics** (user: "move all the eelectronics evenly balanced to the bottom hear the antennas").
  - The pouch lies along X, centred on the back, its stack's lower edge just above the deck's bottom bosses (`stack_y`).
  - The carrier plate (`shelf()`, u = X, v = Y via `at_stack()`) is wider than the pouch, to take two rows:
    - row A, toward the bottom: the HC33 (on the SMA's side) and the TP4056;
    - row B: the buck-boost and the V3 (on the N's side).
  - The HC33 moved onto the plate.
- **Wedge, 50° panel** (user, 2026-10-21: "have the solar panel at like a 50 degree angle and still have it hang straight"; picked "Wedge box, hangs plumb" over tilting the whole node).
  - The back hangs plumb against the deck, and the lid slopes to `panel_tilt` (50) from horizontal.
  - The walls stay square to the lid, so the seal, tongue and screw ring are unchanged. They are modelled in `lid_frame()` and clipped to the back (z ≥ 0) and a flat bottom (y ≥ `back_bot`).
  - `top_depth` and `bottom_depth` are how far the top and bottom walls run back from the frame's underside at the outer edge. `bottom_depth` sets `back_h` for the spools and motors.
  - `to_lid()`, `from_lid()`, `top_gap()` and `y_past_top()` convert between the frames and measure clearance from the plane of the box's top (lid y = `outer_w / 2`).
- **Antenna pole** (user, same day: "a 3 meter carbon fiber pole with guide wires thats going to be fastened into a cylinder in the unit"; antennas at its top; "the antenna sits between the two steel cables, and there is a horizontal crossmembers like a fishing pole keeping it aligned for the first meter or so for stability then the last 2 meters hopefully gets us above the cannopy"; 20 mm OD).
  - The socket stands plumb on the top wall's outside at x = 0.
  - It is D-shaped down to `z = 0` and peaked on top, because the tray prints back down and the socket lies along the bed. It is trimmed 1 mm under the frame's rearmost point (`frame_rear_z`), which caps `pole_z` at about 15. Mine: `pole_z = socket_r`.
  - The bore is blind, so the box stays sealed. An M4 cross-bolt holds the pole (my pick, not the user's). The coax leaves the pole above the socket.
  - **Buttresses and tie anchors** (user, relayed by 3d-gallery-f7: "we're going to add a bunch of spots for ziptie connectors on the back of the carbon fiber pole mount, and that needs to be way stronger reinforced ribbed everything").
    - A buttress either side of the socket (`buttress_w`, `buttress_h`, `buttress_d`), clipped to the top face like the socket.
    - Three pairs of zip-tie slots go through each, front to back (`tie_xs`, `tie_ys`). A tie loops through a pair round whatever lies on the socket's back.
    - The M4 cross-bolt moved up to 40 mm (`pole_bolt_up`), above the buttresses.
  - Rejected for now: a pole in the cable plane. At z ≈ 32 it would run through the frame. The crossmembers' clamps sit 18 mm behind the cable line instead.
- **Antennas.** The N is at +`ant_x` and the SMA at −`ant_x`, both in the top wall, square to it, either side of the socket.
  - Each sits midway between two long-side screws, at the midpoint nearest a third of the way along: 48 mm with `screw_pitch` 32.
  - The top wall is solid to the edge, so each sits in a teardrop recess (`n_recess_d`, `sma_recess_d`) down to the 4 mm wall.
  - Before the pole, they pointed down out of the bottom wall.
  - Both are N (user: "two lr400 extension cables and a two ntype antennas"); the HC33's was an SMA. LMR-400 (10.3 mm) can't go inside a 20 mm tube, so it runs up the outside of the mast.
  - **Hoods** (user, relayed by 3d-gallery-f7: "can we add a little 3d printed roof or shroud over the antenna connectors so that they aren't exposed to the elements directly?").
    - `hood()` is a box in the connector's frame: `hood_r` round the axis, `hood_len` out from the wall. It is closed on its end and front (the faces that look up as it hangs) and on both sides, and open toward the wall and down the back.
    - It is screwed by two outboard feet (M3x10) into pilots in the solid top wall. Its front overhangs the lid's back face without fixing to it, so the lid still lifts off.
    - One part, printed twice (`at_hood(k)` mirrors it so the feet stay outboard).
- **Winch** (user, 2026-10-21).
  - The first brief: two gearmotors ("the same gear motors" as the other build: JGY-370 from meshtastic-drybag-node), two semi-internal spools of 1/32" stainless, "bigger and thinner", overlapping, "driven by a gear on the edge", skateboard (608) bearings, the overlapping pair spinning opposite ways.
  - Then 200 ft each, and "move the spools to not on top of each other anymore, and have rollers set up in the corner to have the cables exit as far apart as possible".
  - Spools sit side by side at (±`spool_x`, `spool_y`), as high as the deck's band and the guide bearings allow (`spool_y`), with 74 teeth. Each holds 200 ft in an 8 mm channel (10 wraps). The capacity count is whole wraps × whole layers; the core is solved for `cable_len × wind_margin`.
  - Each pinion is below its spool on the outer side. Each motor stands along Y with its gearbox toward −Y, as far out as the end walls allow. The two trains mirror through x = 0, so the spools turn opposite ways.
  - **Corner exits.** First printed roller pairs, now 608s (below). `throat_x` (98) is set so each guide bearing fits inside the enclosure, within the back's face (asserted). The cables leave 196 mm apart; before the enclosure it was 218.
  - **Horns** (user, relayed by session 3d-gallery-a2 on 2026-10-21: "can we somehow draw the line forward so the node hangs more upright?").
    - Each cable leaves its top corner through a horn on the deck that stands up past the back's top edge, behind the box's sloping top. The horn's throat is at `hang_z`, the depth of the centre of mass.
    - My estimate is z ≈ 24–25 in front of the back, from full to paid out, so `hang_z` = 24.5. I got it by weighing each part's in-place STL: PETG at 0.7–0.9 fill, a 300 g panel, 190 g pouch, 2 × 110 g motors, 45 g of boards, 120 g of bearings, the M8s and M5s, 100 g of cable, and 1.4 kg of mast rig at z ≈ 12 (mast, 2 × 3.2 m LMR-400 at 68 g/m, two 250 g N omnis, crossarm, bars). That's about 4.0 kg. Re-run it after anything heavy moves; before the mast rig it was 31, before the wedge 12–15.
    - **Reinforced** (user, relayed by session 3d-gallery-f7 on 2026-10-21: "the ears and bearings holding the wires need to be really reinforced"). The cheeks are 8 mm (`cheek_t`), the bridge 5 (`horn_wall`), and the horn is solid between the cheeks up to `web_gap` under the cable. The guide bearings turn on M8x20 bolts threaded into the deck's pads (`guide_pilot_d`), not printed pins. Two top deck screws near the cheeks were dropped (14 deck screws).
    - **Separate parts, extremely reinforced** (user, 2026-10-21: "the ears that hold the steel cable - those need to be extremely reinforced", "the back plate and the ears should be separate parts").
      - `horn()` is its own part in the hanging frame, printed standing, its bottom at `deck_z1`. It stands on the deck's top band from `horn_y0` (clear of the enclosure) and is trimmed 0.3 mm off the box: off its back below the top edge, off the top's plane above it.
      - The cheeks are 10 mm and the bridge 8 mm.
      - Two M5x30 (`horn_bolts`) go up through the deck, the horn and into pilots in the tray's solid top band.
      - Two feet (`foot_w` × `foot_t`) lie on the sloping top beside the cheeks, with four M5x16 into the solid top wall (`foot_bolt_zl`, lid z). The cable's pull goes into the tray, not through the deck's M3s.
      - The horn is symmetric about `throat_x`, so one part is printed twice.
  - **Stainless 608s for the cable** (user, relayed by session 3d-gallery-05: "use stainless skateboard bearings to hold the wire").
    - Every guide the cable touches is a 608. Per corner there are four: the upright `guide_c` on a deck post (it turns the cable to +Y, outboard of it at `throat_x`), the `edge_c` lying across above the back's top edge (the cable climbs its back and turns forward over it), and the throat pair `horn_cs`.
    - Every bearing and the cable keep `horn_clear` off the box's top plane. The cheeks are trimmed 1 mm behind that plane. The cable from `edge_c` to the throat must climb steeper than the top slopes (asserted).
    - The horn's bearings are on M8x35 bolts, their inner races clamped by cheek bosses; `race_gap` (0.5) is less than the cable's diameter.
    - The printed rollers were dropped. `throat_x` moved from 112 to 109 so the guide bearing fits inside the end.
    - `ref_cable_runs()` straightens the path, so it cuts the races' curves by about 5 mm³ where the real cable wraps them.
  - **Enclosure** (user: "can we make the back with the gears enclosed so we dont get moisture or debris in there?", then, relayed by 3d-gallery-f7: "the back with the motors needs to be fully enclosed it doesn't have to be fancy like that").
    - A plain rectangular wall (`shroud_inside()`: `encl_x`, `encl_y0`, `encl_y1`) round both spools, both pinions and both guide bearings plus `shroud_gap` stands on the deck up to `shroud_top`. A TPU 85A strip in a groove on its top is squeezed `shroud_squeeze` against the back, by the deck's screws outside it.
    - It sits within the back's face (x ≤ the side walls' outer face). The guide bearing's height (`guide_y`) is set by the top deck pillars above the enclosure.
    - Each cable leaves through a `cable_hole_d` hole in its top wall at `throat_x`, at the channel's depth. There's a drain under each spool.
    - It's debris- and splash-proof, not sealed. The edge and horn bearings stay outside.
    - The deck plate is solid under the whole back (`back_plan(0)`), 8 mm (`deck_t`) for the doors' recesses. Its screws' counterbores are `deck_cbore_h` deep, so they stay M3x25.
  - **Access doors** (user: "we need a way to get easy access to the spools in the back because when we start this bad boy we have to thread the steel cable into the spools. there should be like a sliding access door or something thats designed so rain doesnt enter when wet").
    - The window is `door_w` × `door_h` at `door_c`, one per spool, in the deck's outer face, inside the enclosure.
    - The door slides down in 45° dovetails (`door_recess()`) into a plain pocket and lifts out. A lip over its top sheds rain onto its face (shingle order), side joints drain down the pocket and out of a ramp at its foot, and the window flares 45° so its edge prints from the bed. One M3x6 at the foot (`door_latch`) holds it shut.
    - The deck prints outer face down, so nothing can stand proud of that face; the recess is why the deck went to 8 mm.
    - **Cable anchor:** the spool's gear ring is solid on the deck side, so the anchor is there. A 1.6 mm hole runs down through the ring at the channel's floor (`anchor_r`), with an M3 pilot 5 mm out for a clamp screw and washer, at `anchor_a`. The old radial core hole was unreachable and is gone.
    - The left spool is drawn turned 16 teeth (`spool_turn`) so both anchors show in their doors; that keeps its mesh.
  - **Motor speed** (user: "how many rpm do i need each gear motor"): see the README's table. My suggestion is a 12 V JGY-370 at about 50–60 rpm with at least 3 kg·cm, which climbs at about 1.5–3 m/min. With the mast rig the node is about 4.0 kg, so that is now about 9 kg·cm.
  - **Deployed view** (user: "a "deployed" view where we have the thing hanging with steel cable, the telescoping rod exteneded to 3 meters, with later stabilization bars with the mast to the wire ever y1/3 of a meter for one meter then two meters of carbon fiber telescoping mast with two lr400 extension cables and a two ntype antennas up there").
    - `previews/deployed.scad`: lid shut, `ref_cables_up()`, `ref_mast()` (three sections of `mast_ds`, top at `mast_top`, with a crossarm), `ref_bars()` (at `bar_ys` above the socket, in the cable plane, with an eye round each cable and a clamp back to the mast), `ref_lmr400()` and `ref_antennas()`.
    - All of these are reference shapes, not printed parts. The bars and crossarm are my guess at the user's description.
  - **Preview:** the assembled preview hangs upright (user: "can we have the assembled view be upright with the antennas facing down"). It's `rotate([90, 0, 0])` of the hanging frame, with the lid pulled 40 mm off along its normal and the pole's foot cut to 250 mm.
  - **Superseded history:** a coaxial stack ("exactly overlapping"), and before that an offset pair overlapping 29 mm. My first capacity formula held only about 85 ft of a claimed 100.
  - **Deck.** A solid plate over the back's outline (`back_plan`), screwed to it on 14 M3x25. The top 7 go into the solid top wall and the bottom 7 into bosses on the back. It carries the spool posts, pinion pins, guide pads, the enclosure and the horns.
- **Rejected layouts:**
  - everything along −Y on a shelf;
  - everything in one flat row along +Y;
  - the stack at the +X end with the HC33 at −X (before the rotation);
  - offset and then coaxial spools.
- **Corner brackets, foam tape.** Each part sits between corner brackets and is held with foam tape. There are no straps or ties through the floor (the back).
- **Zip ties on the plate** (user, 2026-10-21: "all the chips need something screwed over them to hold them down, everything needs to be secure", then "forget the cages, add ziptie connection points everywhere. just add a little to the platform and add them there as cutouts in the platform", and "we should probably have the platform a little away from the battery").
  - Each board has a slot either side, outside its brackets, in a `tie_band` beside its long sides. Boards over 40 mm long get two ties, at ±l/4.
  - `shelf_gap` went from 0.5 to 3 for the straps under the plate. The pouch is held by its 6 mm brackets under the plate.
- **Flange, not columns** (user: "the box body, just make the flange thicker instead of doing the screw cylinders like that").
  - The lid screws go into a solid flange `flange_h` (11) deep. Its underside chamfers 45° to the wall: flat, it overhangs 50° as printed back down.
  - The top wall is solid to the edge, all the way back. With the columns gone, the top middle screw is back (28).
- **No vent.** It hangs from the two winch cables; there's no other mount.

## Frame

- **Hanging frame:** X runs along the panel, Y is up, and Z points out from the back. z = 0 is the back's outside, y = 0 is the back's middle, and the deck is at negative z. The internals, deck, winch and socket are modelled here.
- **Lid frame (`lid_frame()`):** Y runs across the panel and Z out of it. z = 0 is where a flat tray's floor would be (the frame sits at `tray_h`). The frame, bezel, gasket, panel, walls, flange, tongue and bulkheads are modelled here.
- `*_in_place(lift)` places each lid piece in the hanging frame. The preview lifts them 40 mm along the lid's normal.
- Distances in from the outer edge (the `_e` params) set out each band:
  - screws at 3.5;
  - tray wall 5.5–9.5;
  - groove 6.4–10;
  - panel pocket from 11;
  - ledge to 17.5;
  - bezel to 15.5.

## Checked

- Wedge with separate horns, doors, enclosure, socket buttresses, hoods and zip-tie plate (2026-10-21): every pair of the tray, plate, frame, bezel, gasket, deck, horns, doors, spools, pinions, spacers, seals, the 608s, motors, battery, boards, panel, bulkheads, pole, hoods and the reference cable path, and the two horns against each other. Nothing intersects beyond faces touching, except the intended squeezes: gasket ∩ tray ≈ 607 mm³, enclosure strip ∩ tray ≈ 440, shaft seals ∩ pinions ≈ 48, bearings ∩ spools ≈ 42.

- Rotated layout (2026-10-21): none of these intersect, beyond faces touching: spools, pinions, deck (with horns and shroud), tray, the 608s, spacers, motors, the battery, plate and boards, the frame and bezel, and the N and SMA. The reference cable path clears the tray, frame, bezel and deck. Three intended overlaps: each shaft seal grips its hub (≈24 mm³), each bearing's press fit in its hub (≈21 mm³), and the shroud strip's squeeze on the tray (≈448 mm³).

- The pieces' rigid parts don't intersect.
- gasket ∩ tray ≈ 606 mm³, which is the tongue's side squeeze. Re-check this if the seal changes.
- The plate meets the posts and the boards meet the plate face to face only. The battery, boards and plate clear the tray, the frame and both bulkheads.
