# hc33-lipo-case

Case for a Heltec HT-HC33, a Heltec WiFi LoRa 32 V4, a 103665 LiPo, a USB-C TP4056 board and two SMA bulkheads. Two pieces: a carriage (top + door face, everything hung on it) and a body it slides into. devOnly, unprinted.

## The user's brief (2026-10-21)

- "a 3d printed case for a 103665 battery, a heltec ht-hc33, two sma antenna mounts on top, and a 4056 charger".
- "It also has a held tick v4 in it" (voice dictation: a Heltec V4).
- "everything stacked like a stack of credit cards vertically with the antennas at the top on the two opposite corners and the usb ports on the bottom".
- "can we turn the charging circuit so it comes out the side? can we hae a smooth rounded profile when we look at it from the top? add grip indexing like 15cm indents alternating the corners". I read 15cm as 15 mm: the case is 82.5 tall.
- "i want one of the sides to be a a hinge like a door style so that we can open the side up and have easy access to add or remove anything we need". This replaced the sleeve and top cap.
- "the indentation to make it easier to hold, can we make that like a ribbing? 15cm bands all the way down alternating, when its on its diamond knurling"; "i want a toolless way to open and close the door"; "the different items in there need more separation like mostly separate chambers except for somewhere to route the wires"; "the battery and the green board have to swap" (green = the HC33 in the renders, so the cell is middle-left seen from the front-left); "i want that top edge rounded too".
- "i need something that like locks the door in place and then i can undo with my fingers, maybe a latch at the top or something?" Then "I don't think that latch works the way you think it does", and then "give up on that. forget the toolless entry. put m5x10 screws at the top 2 of them".
  - What went wrong, for next time: the first slide bolt (guide on the body, knob through the top) couldn't be fitted. The rod was too long to thread through its guide in the room behind it, and the knob end couldn't pass the guide hole.
  - The redesign moved the bolt onto the door with a peg knob that swings down into a notch. That checks out geometrically, but the user stopped it.
  - Before claiming a mechanism works, check that it can be put together and what each motion sweeps through.
- Then the hinged door went: "the electronics and antenna mounts need to be on a L shaped carrige that has the top antenna mounts and all of the electroincs secured and then it slides ito the case and gets screwed in. the carrige should be the top faces and the door face. its one piece with holders for all the boards with the antenna plate, and theres receiving and mating channels for everything. I want to have screws on the door face going into the body to secure it in place."
- And the grip: "15cm alternating rings of diamond knurling, with the diamond knurling faces inset 2mm with a 45 degree chamfer on the transition." 15 mm again. Rings go all the way round.
- "I like the overall outer shape": kept the outline, the rounded top and the SMA corners.
- Then: "i want six screws in the back and make them m5x10 bhcs"; "you got the dimensions for the heltec v4 wrong"; "the boards need more support on the top"; "and support on the bottom to they need to slide in snug"; "can we add a couple screws in the top to really seal it in there".
  - Six door-face M5s need ~14 mm back and front walls (case ~73 deep), because the door face's flat only covers the cavity and the cavity is the carriage's sweep. Asked; the user picked "keep size, fewer/smaller". So: 2 × M5 + 1 × M3 through the door face, 2 × M5 through the top. All button heads.
- Then: "the knurling is going over the usb port on the door" (the TP4056's side opening; the first TPU ring crossed its top 4 mm, and the door screws' seats sat in TPU); "can we have that little TPU lip thats on the body on the bottom, can that be printed on the door"; "vertical gussets to reinforce the locking tab on the top front of the carrige" (the hook).
- Then: "can we switch to all m3 screws and make the seals watertight? do print in place plugs for the bottom ports and then the side usb charging port we have a sliding door thats made of PCTG that slides into a seal thing made of TPU. I have TPU air in slot 1 in black, maybe we can use that for the gasket seals? I think we should use the extending lip method but have the slot it presses into be printed in TPU with a little squish factor in TPU air or something".
- Then: "you know just make the bottom flat i can flash wirelessly"; "also add that little band of tpu knurling at the bottom liek the top"; "also there need to be more screws, its non-negotiable to have this be watertight. m3 shcs.if it has to be a little bigger fine".
- Then: "another screw hole on the door on each side one more each side on the top and bottom ... close to the corners"; "on the carrige on the bottom, there should be a row of screws there holding oressure on that bottom lip"; "a row of screws on the far edge of the carrige top facing down. that edge needs to be sealed"; "space the screws on the side evenly"; "you don't have to add a ringof PETG around the screw heads whenere theres tpu keep the knurling going"; "keep the tpu inlay going all the way to the edge between the carrige we don't need a petg lip theere either".
- Earlier: "can we put a tpu base on it with the snapmaker"; then "make the base the orange TPU, and then have the body be black PCTG, and then have the knurling have the same depth but stick out far enough to match the exterior depth too, but the knurling is the orange 75a tpu"; "make sure the knurling and everything extends to the door as well".

## My picks (not the user's)

- **"Opposite corners" = diagonal**: front-left and back-right of the top.
- **Stack order**, back to front: TP4056, HC33, cell, V4 (the user's swap). No window for the V4's screen.
- **The carriage slides in along +X** (from the left), not down from the top. The TP4056's USB-C lands against its side opening either way, but sliding sideways lets a nib under the top hook the right wall and lets the door face close the opening. Everything on the carriage sweeps through every x left of where it ends up, so **a body feature inside the cavity may only sit where no carriage part's YZ section passes**. The asserts at the bottom of the lib's checks spell this out for the bosses. Re-run the sweep check (Checked, below) after moving anything inside.
- **Split**: carriage = shell ∩ (x ≤ -hx, z ≥ `base_t` ∪ z ≥ `ceiling + seal_w` ∪ the cavity's square over the ceiling); body = shell ∩ (x ≥ -hx, `base_t` ≤ z ≤ `ceiling + seal_w`) less the cavity and the seal channels. Rigid faces meet touching; the lips meet the TPU Air with squish.
- **Mating features** (the user's "receiving and mating channels"):
  - the fins' bottoms and the cell's floor plate sit in floor channels (`floor_channel_d`), and the fins' right edges in grooves up the right wall (`wall_groove_d`);
  - the top seal's lips (see Seals) replaced the tongues that ran in grooves along the walls' tops;
  - a hook under the top's right edge (`hook_*`, `nib_*`, `top_mates()`) has a nib into a groove in the right wall, so the far end can't lift. Its groove roof is at 45° for the upright body print. It spans y between the back-right SMA's nut and the cavity's front-right corner (`cavity_r`).
- **Board holders**:
  - the HC33 and V4 are held on all four edges.
    - Side slots: a left rib (`left_rib()`) and the body's right rail (`right_rail()`). Their section (`side_slot()`) has a floor and roof that follow the board's corner chamfers (`hc_board`/`v4_board` entries 6, 7). A board passes a slot only moving one way (onto the carriage: −X past the rib; into the body: +X into the rail), so no point of it ever meets a lower roof or a higher floor.
    - Top and bottom bars off the next fin (`board_bars()`, `edge_bar()`): the top one split round `top_gap()` (the V4's IPEX), the bottom ones either side of the USB-C's opening. Each stops short of the body's rail.
    - A bar starting at the door face stands on the carriage's bed; one starting clear of it hull-leans 45° back to the fin.
    - Bottom bars reach `bottom_engage` (0.9) up the faces: the V4's buttons and connectors start 1.06 from that edge. The fits are snug at the user's ask (`slot_fit` 0.2, `slot_side_fit` 0.2, `roof_fit` 0.15);
  - the TP4056 stands on a slotted bar and has a slotted bar over its top edge (`tp_bars()`), both stopping short of the body's TP rails. That raised it by `slide_fit + tp_floor`, and the stack starts `tp_y` off the back wall so its bars have a back wall;
  - the cell: fins either side, a floor plate between them in a floor channel, two end roofs (`cell_cradle()`), the wires between them. Nothing holds it in X while the carriage is out: foam tape, noted in the README.
- **Screws** (`m3_*`, `screw_in`, `door_screws_*`, `top_screws_*`, `door_screws`, `top_screws`, `screw_pilots()`, `screw_holes()`): twenty-six M3x10 SHCS, counterbored flush, all threading into the walls and floor outside the seals and the carriage's sweep. No washers, no internal bosses.
  - Door face (17): `door_screws_per_side` evenly from `door_z_low` (the counterbore just clears the TPU foot) to `door_z_high` (the pilot just stays in the wall under the seam), plus `door_screws_bottom` across the bottom at `door_z_low`, into the floor's end under the floor seal channel. That channel now starts at `seal_floor_z0` above those pilots, which is why `bottom_t` is 9.8.
  - Top (9): `top_screws_per_wall` along each of the back and front edges from `top_x0` (clear of the door screws' pilots) to `top_x1` (the rounded corner's flat), and `top_screws_right` down the right edge between them. The right row needs `right_wall` 11.6 so its heads sit on the top's flat, so the outline is off-centre: `ex_l`/`ex_r` are the door face's and right face's x, `xo`/`exw` the outline's centre and half-width, and `outline_pts()` shifts by `xo`.
  - `end_wall` 13.5 is set by the door-face heads, which must sit on the flat (`lead_y` = ey − 5.86) with the pilot outside the seal channel.
  - The knurl runs to the heads: `screw_holes()` is cut from the carriage's TPU as well as its PCTG. The rings no longer stop at the seam either.
  - Checked: each pilot grown 0.6 mm stays in PCTG, clear of TPU, cavity, channels, track and outside; no TPU in any hole.
- **Flat bottom**: no bottom USB-C openings or plugs (the user flashes over the air). The bars under the HC33 and V4 now stop `usbc_w`/2 + 0.5 off the receptacle. The right one starts its 45° lean's width further out, so the lean clears the USB-C, and `edge_bar()` clamps a short bar's far edge to its end.
- **Rings** (`bands`): a short TPU ring from z 0 on the base, an odd number of `band_h` (14) rings starting and ending PCTG, and a short TPU ring up to the top's seam (`band_top` ≤ ceiling + seal_w), the two short ones equal. 15 mm didn't leave the short rings their 2 mm chamfers (≥ `band_end_min`).
- **Seals** (`seal_*`, `lip_*`, `seal_blocks()`, `seal_grooves()`, `door_lips()`, `top_lips()`, `body_seal()`). The user's "extending lip" into a TPU Air slot, all round the joint. The carriage moves in +X, which shapes everything:
  - The door face's seal is X-compressed: TPU Air channels in the back and front walls' ends (x ∈ [-hx, -hx+seal_d]) and across the floor's end, with lips on the door face's inner side. The floor channel sits under the fins' floor channels, which is why `bottom_t` went to 4.2 (asserted).
  - The top's seal can't be X-compressed along the back and front, which run parallel to the slide. Those lips slide along their grooves from the left end (flared mouths, `seal_lead`) with the squish the whole way; the right lip presses in at the end.
  - The top seal sits above `ceiling`, on a ridge over the walls (`total_h` = ceiling + seal_w + top_t). Below the ceiling, the right lip's sweep would hit the top-screw bosses. The cavity is square through that band (`cavity()`), since the lips caught on the old corner fillets.
  - Checked: rigid parts zero-volume along the slide; lips × TPU Air at home = 141 mm³, which is the groove walls' squish, and at 5 mm out = 27 mm³ (the sliding back/front lips).
- **Washers** (`carriage_seal()`): TPU Air under the SMAs' outer nuts, `washer_proud` above the seat.
- **Side door** (`sd_*`, `side_door*()`, `side_track()`, `side_gasket()`): PCTG, a dovetail in XZ (wider at its inner face), sliding along Y in the right face.
  - The track is the sweep of the door plus `side_door_fit` along its path. Over the last `side_door_wedge`, the path steps the door 0.6 inward onto the TPU Air gasket (proud 0.6, squeezed 0.3). The sweep's ends are the stops.
  - It prints in the track, open (+Y), clear of the gasket, on three break-off ties under its lower bevel (`side_door_printed()`, part of `body()`).
  - Its back end runs past the right face's flat onto the 45° lead-in, so it's trimmed to the outline there, and so is the track.
  - The rings keep out of the track's area (`ring_keepout()`).
- **Grip** (`ring_recess()`, `grip_cut()`, `grip_rings()`, `knurl_core()`, `door_knurl()`):
  - The rings start PCTG at the bottom. That puts the door screws' heads on plain rings or an inset ring's floor; the other phase can't fit the front boss.
  - The PCTG recess (`ring_recess()`) is smooth. The TPU fills it to the outline, and the knurl is cut into the TPU with its peaks on the outline (`knurl_core(…, e = 0)`). `knurl_d < grip_inset` keeps the grooves in the TPU (asserted). The knurl's top and bottom rows stay on the outline, so grooves die out before the chamfers.
  - The knurl is a polyhedron heightfield over `outline_pts()`, which samples every inset of the outline at matching points, so peak and valley rows line up. It is square pyramids on a ±45° grid; facets are ≤ 39° off vertical as the body prints.
  - The carriage prints on the door face, so the flat of that face (`door_flat_zone()`) gets `door_knurl()`: 90° V-grooves, walls at 45° to the bed. Round the corners and lead-ins the diamond knurl carries on from the body unbroken (the user: "wrap continously around the corners"), accepting facets past 45° there in TPU.
- **Ring keep-outs** (`ring_keepout()`, `ring_margin`): every ring recess stops 1.5 short of the TP4056's side opening and each door screw's head seat, so those holes go through flush PCTG, never TPU. Asserted by test only (Checked).
- **Hook gussets** (`hook_gusset_*`): plates across the hook every ~8 mm, `hook_gusset_l` back along the top. They print standing as the carriage lies; `hook_gusset_l ≥ hook_h` keeps their edge ≥ 45° (asserted). They stay inside the hook's own YZ band, so the slide check is unchanged.
- **Base** (`tpu_base()`, `door_foot()`, `base_t` 1.6): under the whole footprint, split at the seam: `tpu_base()` under the body, `door_foot()` under the door face as part of `carriage_tpu()` (the user's ask). The foot has no keys; it holds by the bond alone. The body's PCTG starts at `base_t` and the carriage's door face sits on the base's strip, so `floor_z` (= `base_t + bottom_t`) is the floor's top everywhere `bottom_t` used to be. Keys (`base_keys`, `base_key_shapes()`) rise into the back, front and right walls, flaring so the PCTG over them locks them. The right wall's keys sit outside the fins' grooves. This made the case 1.6 taller.
- **Walls**: `end_wall` went 4 → 6 so the cavity's corners keep wall behind the ring recesses (asserted). That made the case 5.1 mm deeper (with the TP4056's `tp_y`). `side_wall` stays 6.
- **The TP4056–HC33 fin is short** (`tp_divider_z1`, just over the TP4056's bar). The user asked for it "so i can put the antenna in": the HC33's antenna goes in the space above the charger.
- **Top edge** (`shell()`): a hull of outline slices, a 45° lead (`top_lead`) onto a `top_r` arc, the same in every direction. `sma_in_y` keeps each SMA's outer nut on the flat of the top (asserted).
- **Outline** (`outline()`): a hull of four `profile_r` circles plus points where 45° tangents from them meet the left and right faces (`lead_y`). The door face's corners need the 45° lead-in, since the carriage prints on it.
- **Not sealed.** If the user wants it waterproof, read [[seal-screws-through-tpu-failed]] in memory first.

## Gone, and why

- The bottom-hinged door, its knuckles and filament pin, and the M5x10s into bosses under the top: replaced by the carriage at the user's ask. Before that, two toolless latches (magnets, then a slide bolt) were dropped. The first slide bolt couldn't be fitted: before claiming a mechanism works, check that it can be put together and what each motion sweeps through.

## Frame

Origin at the cavity's centre in plan, z = 0 on the bottom face. X across (door face at -X), Y through the stack (+Y front), Z up.
- `ref_v4()` follows Heltec's drawing; the other refs are boxes.
- Layer positions (`tp_y`, `hc_y`, `cell_y`, `v4_y`) run from the back wall's inner face; `yb` shifts them onto the origin.
- `boards` holds the HC33 and V4 as `[width, PCB back face, PCB thickness, length, USB overhang, USB centre]`.
- The TP4056 lies along X (`tp_x0`..`tp_x1`, `tp_z0`..`tp_z1`).
- `carriage_out(d)` draws the carriage d out to the left.
- `carriage()` is modelled in place; `carriage_print()` lays it on its door face. `body()` is already upright for printing.

## Checked

- Zero-volume intersections (faces touching at most), measured by volume, not just emptiness:
  - body × carriage-with-everything-on-it at 24 points of the slide, from 55 mm out to home (0, 0.1, 0.3, 0.6, 1 … 55);
  - each piece × every reference part at rest.
- Positive controls all collide:
  - the carriage pushed 0.3 further in, lifted 0.3, or moved 0.3 in Y;
  - each board or the TP4056 nudged into its slot walls, floors, roofs or rails: 0.2 up, 0.1 down, 0.25 in Y, 0.3 in X. The V4 lifted 0.2 hits its chamfered shoulder roofs as well as its top bar.
  - The cell has 1.1 mm play a side between its fins, as the old dividers gave it.
- No TPU inside the side door's track or any door screw's seat.
- TPU × PCTG zero-volume, each piece with its own TPU and across (body + TPU vs carriage + TPU), and the slide check above includes both TPU parts.
- Overhang scan of the print-oriented STLs. The TPU parts have none. The carriage's ring recesses now fill with TPU on the bed, so its old 11 mm bridges are gone. Body: only slot and groove roofs, the 2 mm underside of the TP4056's upper rail, the TP4056 opening's 7 mm bridge, and the tops of round holes; nothing from the knurl. Carriage: the counterbore seats and the round holes' tops.
- Renders through the forge (`buildModel`): body, carriage, assembled, closed, print plate.
