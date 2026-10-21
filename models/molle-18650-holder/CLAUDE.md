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
  circles, plus their hull with the backs moved to `plate_z`, cut at the
  axes: the solid between tubes and MOLLE back) minus pockets and finger
  slots is `wall_2d()`, and minus the slots run `finger_under` past the axes
  is `floor_2d()`; `round_2d()` rounds every corner, so each slot edge up
  the tube and through the floor is round. `body()` extrudes the floor
  (bed edge stepped in by `edge_r` over three layers) and the walls up to
  `collar_y`; `body_top()` is each tube's revolved `tube_band()` (collar,
  rim, lead-in) and the solid behind, slot cut square there. The user asked
  for plain cylinders on a flat floor after a cone bottom with a hulled
  fill (a cavity under the cell, a lump out the front, sharp slot edges);
  a full-width bevel there was rejected as less protective.
- **Blocks are swept with a ball** (`rounded_extrusion`),
  so their outlines are exact and every edge is round. Only the stick slots'
  mouths are chamfered.
- **The stick is held by its hook's leaf, not its head.** The leaf's bulge
  (`stick_pinch_u`, 1.42 into the back wall) clicks into `leaf_groove()`,
  0.8 deep (the back wall is 1.6), so it still presses 0.6: tight. The user
  rejected a cradle round the head with domes in its lanyard hole ("we
  don't want to extend"): nothing stands above the plate.
- Unprinted. Open guesses: `cell_clear` 0.3, `rib_squeeze` 0.15, the slot
  clearances (0.5 / 0.6; the user found 0.3 / 0.4 too tight), `webbing_room` 1.8, the leaf's 0.8 click, the
  levers' 1 mm bump and 0.5 mm spare swing.
