# molle-18650-holder — agent notes

- **Frame:** +X across, +Y up, +Z away from the pack. Z = 0 lies on the pack,
  Y = 0 is the bottom and the print bed. It prints standing up
  (`print_pose()`), so every downward face is 45° or steeper: the top
  block's underside over the band, the levers' bumps, the collar.
- **The weave is the Kanix MOLLE stick plate's idea, written fresh.** Kanix
  code is off limits (CC BY-NC-ND); only interface numbers are shared: PALS
  spacing (A-A-55301 / Natick layout) and the stick.
- **The stick is the real one.** `lib/molle-stick-profile.scad` is the 3"
  stick's side outline and lanyard hole, traced off `library/molle-stick`'s
  STL (it is a straight 25 mm extrusion), CC BY BigFootPL. `stick_outline()`
  stretches its blade for other lengths. The previews draw it, and the
  leaf groove is cut from it. The
  customizer has no filesystem, so `customizable-sources.ts` prepends that
  file and drops its include; keep BOSL2's include in the lib.
- **Stick slots are open at the bottom** (the user: don't limit the stick's
  length). Nothing rests on the tip; the hook and the leaf's click hold it.
- **Plate height comes from the stick:** `stick_floor + stick_len − hook_clear`.
  End blocks are equal, so on the 3" (and 5") they run 1.15 mm past their
  PALS gaps: the bottom block's back edge is chamfered (`end_relief`) to ride
  over the next band; the hook's leaf covers the top.
- **The tubes are one rounded 2D cross-section.** `tubes_2d()` (the tube
  circles, plus `behind_2d()`: their hull with the backs moved to
  `plate_z`, cut at the axes, the solid between tubes and MOLLE back) minus
  pockets and finger slots is `wall_2d()`, and minus the slots run
  `finger_under` past the axes is `floor_2d()`. `round_2d()` rounds outside
  corners by `edge_r` and inside ones by `inner_round` (no points where the
  tubes meet at the front), so each slot edge up the tube and through the
  floor is round. `body()` extrudes the floor (bed edge stepped in by
  `bed_chamfer`, a `layer` at a time) and the walls up to `collar_y`.
  `body_top()` is the top band in `layer`-thick slices of `band_2d(y)`: the
  tubes' outsides at that height (`band_out`: collar, rim), the mouths
  (`mouth_2d`, `band_in`: the lead-in, stopping `ridge` short of the line
  between tubes so neighbouring rims don't run into each other) and the
  slots, rounded the same way. History the user rejected: a cone bottom
  with a hulled fill (a cavity under the cell, a lump out the front, sharp
  slot edges), a full-width front bevel (less protective), a revolved top
  band with the slot cut square (fins and stray faces over the cutout).
- **Finger slot and lever.** The slot runs `finger_w` down each tube's
  front and on through the floor to `finger_under` past its axis (the user:
  wrap round the end, at least half way under). The cell is held by a lever
  in the tube's *back* (`clip_arc` 45° = the user's "1/8 of a circle",
  `clip_len` 40): `lever_cut()` cuts its side slits, the slit over its end,
  and the pocket behind it; `lever_bump()` is the 45°/45° bump over the
  cell's top edge. The pocket sits in the solid between tubes and MOLLE
  back: `front_z` stands the tubes `clip_pocket + clip_skin` off `plate_z`
  (the bands' face) for it, and its back wall is the lever's stop. The
  lever ends under `ceiling_h` of whole wall (the user: a ceiling so a
  careless cell can't slam or over-move it), above which the mouth flares
  on `lead_r`; `collar` flares the outside 45° to keep a rim.
- `back_sector()` works in `in_tube()`'s frame, where the back is +Y.
- **Blocks above a band reach right down to it at the back** (the user:
  "extend downwards more to engage the strap more tightly", top fixed), and
  slope up 45° toward the tubes, which are solid there anyway.
- **Blocks are swept with a ball** (`rounded_extrusion`), so their outlines
  are exact and every edge is round. Only the stick slots' mouths are
  chamfered.
- **The stick is held by its hook's leaf, not its head.** The leaf's bulge
  (`pinch_z`, 1.52 into the back wall) clicks into `leaf_groove()`, 0.8
  deep (the back wall is 1.6), so it still presses 0.7: tight. The user
  rejected a cradle round the head with domes in its lanyard hole ("we
  don't want to extend"): nothing stands above the plate.
- Unprinted. Open guesses: `cell_clear` 0.3, `rib_squeeze` 0.15, the slot
  clearances (0.5 / 0.6; the user found 0.3 / 0.4 too tight),
  `webbing_room` 1.8, the leaf's 0.8 click, the levers' 1 mm bump and
  0.5 mm spare swing.
