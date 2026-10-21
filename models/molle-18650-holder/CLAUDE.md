# molle-18650-holder — agent notes

- **Frame:** +X across, +Y up, +Z away from the pack. Z = 0 lies on the pack,
  Y = 0 is the bottom and the print bed. It prints standing up
  (`print_pose()`), so every downward face is 45° or steeper: the tubes'
  cones, the top block's underside over the band, the cheeks' back undersides.
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
- **Tubes are solids of revolution** (`tube_profile()`): 45° cone to a drain,
  fillet into the side, half-round rim. The cell's seat (`seat_y`) is where
  its edge meets the inner cone or fillet. A `web()` (the tubes' hull, cut at
  their axes, pockets removed) fills the grooves behind them, and
  `bottom_fill()` hulls the cones with the bottom block up to a plane that
  rises 45° into the front grooves (the user disliked the catchy pockets
  under the cell ends). The tubes' tops stand 1.1 mm above the plate.
- **Finger slot and lever.** `finger_slot()` cuts `finger_w` down each
  tube's front and on under the cell's end to `finger_under` past its axis
  (the user: wrap round the end, at least half way under). The cell is held
  by a lever in the tube's *back* (`clip_arc` 45° = the user's "1/8 of a
  circle", `clip_len` 40): `lever_cut()` cuts its side slits, the slit over
  its end, and the pocket behind it; `lever_bump()` is the 45°/45° bump
  over the cell's top edge. The pocket sits in the solid between tubes and
  MOLLE back: `front_z` stands the tubes `clip_pocket + clip_skin` off
  `plate_z` (the bands' face) for it, and its back wall is the lever's stop.
  The lever ends under `ceiling_h` of whole wall (the user: a ceiling so a
  careless cell can't slam or over-move it), above which the mouth flares
  on `lead_r`; `collar` flares the outside 45° to keep a rim. Front clips
  with lips and slits beside them came before this and were dropped.
- `back_sector()` works in `in_tube()`'s frame, where the back is +Y.
- **Preview pose:** the viewer is Z-up, so `assembled` is wrapped in
  `in_use()` (open tops up); `plate` in `print_pose()`.
- **Blocks are swept with a ball** (`rounded_extrusion`),
  so their outlines are exact and every edge is round. Only the stick slots'
  mouths are chamfered.
- **The stick is held by its hook's leaf, not its head.** The leaf's bulge
  (`stick_pinch_u`, 1.42 into the back wall) clicks into `leaf_groove()`,
  0.8 deep (the back wall is 1.6), so it still presses 0.6: tight. The user
  rejected a cradle round the head with domes in its lanyard hole ("we
  don't want to extend"): nothing stands above the plate.
- Unprinted. Open guesses: `cell_clear` 0.3, `rib_squeeze` 0.15, the slot
  clearances (0.3 / 0.4), `webbing_room` 1.8, the leaf's 0.8 click, the
  levers' 1 mm bump and 0.5 mm spare swing.
