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

## My picks (not the user's)

- **"Opposite corners" = diagonal**: front-left and back-right of the top.
- **Stack order**, back to front: TP4056, HC33, cell, V4 (the user's swap). No window for the V4's screen.
- **The carriage slides in along +X** (from the left), not down from the top. The TP4056's USB-C lands against its side opening either way, but sliding sideways lets a nib under the top hook the right wall and lets the door face close the opening. Everything on the carriage sweeps through every x left of where it ends up, so **a body feature inside the cavity may only sit where no carriage part's YZ section passes**. The asserts at the bottom of the lib's checks spell this out for the bosses. Re-run the sweep check (Checked, below) after moving anything inside.
- **Split**: carriage = shell ∩ (x ≤ -hx ∪ z ≥ `ceiling`); body = shell ∩ (x ≥ -hx, z ≤ `ceiling`). The faces meet at those two planes, touching.
- **Mating features** (the user's "receiving and mating channels"):
  - the fins' bottoms and the cell's floor plate sit in floor channels (`floor_channel_d`), and the fins' right edges in grooves up the right wall (`wall_groove_d`);
  - tongues under the top run in grooves on the back and front walls' tops (`tongue_*`);
  - a hook under the top's right edge (`hook_*`, `nib_*`, `top_mates()`) has a nib into a groove in the right wall, so the far end can't lift. Its groove roof is at 45° for the upright body print. It spans y between the back-right SMA's nut and the cavity's front-right corner (`cavity_r`).
- **Board holders**:
  - the HC33 and V4 are held on all four edges.
    - Side slots: a left rib (`left_rib()`) and the body's right rail (`right_rail()`). Their section (`side_slot()`) has a floor and roof that follow the board's corner chamfers (`hc_board`/`v4_board` entries 6, 7). A board passes a slot only moving one way (onto the carriage: −X past the rib; into the body: +X into the rail), so no point of it ever meets a lower roof or a higher floor.
    - Top and bottom bars off the next fin (`board_bars()`, `edge_bar()`): the top one split round `top_gap()` (the V4's IPEX), the bottom ones either side of the USB-C's opening. Each stops short of the body's rail.
    - A bar starting at the door face stands on the carriage's bed; one starting clear of it hull-leans 45° back to the fin.
    - Bottom bars reach `bottom_engage` (0.9) up the faces: the V4's buttons and connectors start 1.06 from that edge. The fits are snug at the user's ask (`slot_fit` 0.2, `slot_side_fit` 0.2, `roof_fit` 0.15);
  - the TP4056 stands on a slotted bar and has a slotted bar over its top edge (`tp_bars()`), both stopping short of the body's TP rails. That raised it by `slide_fit + tp_floor`, and the stack starts `tp_y` off the back wall so its bars have a back wall;
  - the cell: fins either side, a floor plate between them in a floor channel, two end roofs (`cell_cradle()`), the wires between them. Nothing holds it in X while the carriage is out: foam tape, noted in the README.
- **Screws** (`door_screws`, `top_screw_*`, all button heads, `screw_len` 10). Everything on the carriage sweeps every x left of where it ends up, so the bosses live in the few YZ spots nothing passes.
  - Door face: back-wall zone y < `hc_y`, z between the TP4056's fin and the back-right SMA: M5 at 39.5 and 54.5. Front zone over the V4's holders, under the front-left SMA: M3 only, at 65.5.
  - Each head is seated `grip_inset` deep. It sits on the flat of a plain ring or of an inset ring's floor, inside the door face's flat (`lead_y`); all asserted. M5 heads clear `lead_y` by 0.07, which is what fixes their 4.68 axis.
  - Top: M5 bosses hang off the front wall right of the front-left SMA's sweep (x ≥ smas[0] + nut), down to 64.3, over the V4's holders. The hook now stops short of them (`hook_y1`). Heads sit on the top's flat (asserted).
  - Six door-face M5s would need ~14 mm back/front walls; the user chose to keep the size.
- **Grip** (`grip_cut()`, `knurl_core()`):
  - The rings start plain at the bottom. That puts both counterbores in plain rings; the other phase can't fit the front boss.
  - The knurl is a polyhedron heightfield over `outline_pts()`, which samples every inset of the outline at matching points, so peak and valley rows line up. It is square pyramids on a ±45° grid, `knurl_d` deep, with the top and bottom rows held at the inset face so they meet the chamfers flush. Facets are ≤ 39° off vertical as the body prints.
  - The door face's rings are inset but smooth: it is the carriage's bed. Those recesses print as 11 mm bridges 2 mm up.
- **Walls**: `end_wall` went 4 → 6 so the cavity's corners keep 1.5 mm behind the knurl's valleys (asserted). That made the case 5.1 mm deeper (with the TP4056's `tp_y`). `side_wall` stays 6.
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
- Overhang scan of the print-oriented STLs. Body: only slot and groove roofs, the 2 mm underside of the TP4056's upper rail, the TP4056 opening's 7 mm bridge, and the tops of round holes; nothing from the knurl. Carriage: the door face's ring recesses (bridges), the counterbore steps, and the SMA holes' tops.
- Renders through the forge (`buildModel`): body, carriage, assembled, closed, print plate.
