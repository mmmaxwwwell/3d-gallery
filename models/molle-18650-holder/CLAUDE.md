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
  cradle's numbers (`stick_head`, `stick_hole_c`) come from it: head 10 tall
  over the hook's pocket top, 9 deep, hole 6 × 5.4 centred 5.3 up. The
  customizer has no filesystem, so `customizable-sources.ts` prepends that
  file and drops its include; keep BOSL2's include in the lib.
- **Plate height comes from the stick:** `stick_floor + stick_len − hook_clear`.
  End blocks are equal, so on the 3" (and 5") they run 1.15 mm past their
  PALS gaps: the bottom block's back edge is chamfered (`end_relief`) to ride
  over the next band; the hook's leaf covers the top.
- **Tubes are solids of revolution** (`tube_profile()`): 45° cone to a drain,
  fillet into the side, half-round rim. The cell's seat (`seat_y`) is where
  its edge meets the inner cone or fillet. A `web()` (the tubes' hull, cut at
  their axes, pockets removed) fills the grooves behind them.
- **Blocks and cradle pieces are swept with a ball** (`rounded_extrusion`),
  so their outlines are exact and every edge is round. Only the stick slots'
  mouths are chamfered.
- **The cradle's cheeks stand free of the hood** so they spring out; the
  domes engage 0.4 mm (`dome_reach − head_clear`), ~2.9% strain in a 1.6 mm
  PETG cheek. The hook's leaf overlaps the back wall by up to 1.4 mm by
  design: that's the stick's pinch.
- Unprinted. Open guesses: `cell_clear` 0.3, `rib_squeeze` 0.15, the slot
  clearances (0.3 / 0.4), `webbing_room` 1.8, the dome engagement.
