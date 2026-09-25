# filament-spool-roller

A spool roller stand for a dry box, published as two builds (see *Builds*
below): four lanes and one. Currently `devOnly: true` in
`models/manifest.json` — it renders under `npm run dev` but is never built,
mirrored, published or fingerprinted. Drop the flag to ship it, and only then
seed a baseline.

## File layout

```
lib/
  filament-spool-roller-lib.scad   all params + geometry, no top-level render
parts/
  tile-{left,middle,right}.scad    floor tiles, one per lane
  tile-single.scad                 the one-lane stand's tile, open both sides
  wall-{left,center,right}.scad    crescent walls — carry the pegs and beams
  beam.scad                        hex beam, one per lane, prints on its flange
  lock-pin.scad                    printed stand-in for the M3 lock screw
  roller.scad                      one roller, on end
  peg-{inner,end}.scad             pegs
  template-{left,right}.scad       bulkhead drilling template
  floor-template-{left,right}.scad floor drilling template for the tile screw holes
  template.scad, floor-template.scad  the same templates whole (one lane)
previews/
  assembled.scad                   the whole stand with spools seated
  box.scad                         reference: spools inside the dry box
  lane-{left,mid,right}.scad       one bay each
  plate-{1..12}.scad               the four-lane print plates, one per bed
  plate-1x-{1..6}.scad             the one-lane print plates
  plate-fit.scad                   throwaway fit-test coupons
```

## Builds

The manifest entry has `builds` rather than top-level `previews`/`parts`/
`hardware` (repo CLAUDE.md, *Manifest schema*): `4x` (`lanes = 4`, the
default) and `1x` (`lanes = 1`). The lib is the generator; a build is one
lane count plus the entries, BOM, instance ids and hardware counts that go
with it. The gallery shows a `4× | 1×` switch beside the title.

- `assembled`, `box`, `plate-fit` and the single parts that exist at both
  counts (walls, roller, peg-end, beam, lock pin) are shared files. They are
  lane-generic, so keep them that way — a shared name must mean the same file
  and module in both builds (validation enforces it).
- The plate files are **not** shared: each build has its own numbered set,
  because a plate hard-codes which wall or tile it holds. The one-lane plates
  use `plate_wall(lanes)` for the right wall and `plate_templates(s)` to put
  both whole templates on one bed.
- Another lane count is another build: its own plate files, its own
  instance ids from `stand_instances()` at that count, and its own hardware
  quantities. Nothing is derived from `lanes` in the manifest.

## What is derived, not authored

**Never hard-code a roller spacing, a lane position or a tile width.** Four
things are solved in the lib and everything else reads them:

```
peg_z    = base_height + roller_clearance + flange_r
spool_z  = ground_clearance + spool_r
roller_x = sqrt((spool_r + roller_r)² − (spool_z − peg_z)²)
```

A spool sitting on two rollers has its centre `spool_r + roller_r` from each
axis; that distance and the height difference fix the third side. The two
assertions either side of the `sqrt` are what stop an impossible ask rendering
as a silently wrong stand, and a third catches the flanges hanging off the ends
of the floor.

The clearance is measured from `flange_r`, not `roller_r`, because the flanges
are the lowest thing on a roller. That is what keeps the whole roller off the
tile and is why the tile carries no flange relief cut. Raising the peg axis
pushes the rollers apart, so `ground_clearance` has to come up with it or the
flanges overhang `base_depth` — the assert will say so.

`slot_half` falls out the same way — the half-width of the region where the
spool would come within `panel_clearance` of the lattice, zero whenever the
spool never dips that low. At the default 8 mm ride height it *is* zero, so the
floor renders unbroken; don't delete the branch, it comes back the moment
anyone lowers the spool.

## Lane and tile arithmetic

The stand is `lanes` lanes and `lanes + 1` walls. A tile carries **half** a
wall's footprint at each edge it shares and a **whole** one at each open end,
so the two end tiles come out wider than the middles and the lane is not
centred in them. That asymmetry lives in three functions and nowhere else:

- `tile_margin(share)` — half a wall or a whole one
- `tile_width(sm, sp)` — the tile's width
- `tile_lane_y(sm, sp)` — where the lane sits inside the tile

Everything that has to land under a spool — the PTFE slot, the screw pads, the
bay previews, and the tile lattice window, which is the same size in every tile so all three carry an identical honeycomb — goes through `tile_lane_y()`. Anything that
positions a whole tile or wall in the stand goes through `tile_y()`,
`lane_y()` or `wall_y()`, which are built on `tile_offset()`'s running sum.
Adding a lane is a param change; it must never need a new constant.

## Coordinate system

X is depth (front to back, `±base_depth/2`; the PTFE tubes exit at −X), Y is
width along the roller axes, Z is up. A tile is drawn centred on its own
origin and placed by `stand_tiles()`.

Walls are authored **lying flat, ready to print** — profile in XY, thickness
on Z, floor edge along −Y — and `wall_at()` rotates them upright. Under `rotate([90,0,0])` local +Z becomes global −Y, so the placement
translate starts half a thickness high for the wall to straddle its centre
line. Getting that backwards shifts every wall by 4 mm and quietly drives them
into the spools; it is worth re-running the interference check after touching
either module.

## Public modules

- **`tile(share_minus, share_plus)`** — one floor tile. The share flags say
  whether that face meets another tile: a shared face carries half a wall's
  footprint and a dovetail, an open end a whole wall's footprint and no
  dovetail. `tile_left/middle/right` are the only intended combinations, and
  they exist because the manifest's `module` field takes a zero-arg name.
- **`wall_support(lane_minus, lane_plus)`** — the wall that carries the
  pegs and ships with the holder. The flags say whether that side meets a
  lane, exactly parallel to `tile()`'s share flags. **Both faces are flat —
  no roller pockets.** The user asked for that so the walls print with
  nothing to bridge; rollers run off the face on the pegs' shoulders instead.
  `wall_left`/`wall_center`/`wall_right` are the zero-arg forms, and the two
  ends are **mirror images, not one part turned round** — the wall stands with
  its local +Z toward −Y, so the `z = 0` face is the wall's +Y side. Get that
  backwards and an end wall's beam joint faces out of the stand.
- **`_beam_body()` / `beam()`** — one hex beam. `_beam_body()` is the
  assembly frame, spigot at z = 0: spigot, 45° step, bar, socket flaring at
  45° into a flange; `stand_beams()` places it with its spigot in wall i and
  its socket in wall i+1. `beam()` is the print pose — the body turned over
  onto its flange end, which the user asked for (big end down) and which
  leaves nothing overhanging. The socket's far end is a 45° roof for the
  same reason; don't flatten it back into a ceiling.
- **`lock_pin()`** — D-section pin for the lock hole, lying on its flat.
- **`ptfe_tube()` / `stand_ptfe()` / `bay_ptfe()`** — reference only: the
  tube from the front clip's mouth, drawn both ways it can go — along the
  groove and up the back scoop, and down the drop — each `_ptfe_tail` past
  the tile. Its bends are the cuts' own arcs offset by `ptfe_r`, so it can't
  drift from the slot.
- **`spool()` / `spools()`** — reference only: a hub tube between two flange
  plates, ported from the user's own `printer/openscad/mmu/spool.scad`. Don't
  swap in the Bambu 3MF from `../3d` — it is CC BY-NC.
- **`roller()`** — one roller standing on its end, ready to print. The flange
  profile runs at `flange_r` out to the end face and tapers back to `roller_r`
  over `flange_taper`, so the only slope a spool meets points at the middle of
  the lane. Don't chamfer the outer edge back on: that slope would point the
  other way, at the gap between the roller and the wall. `roller_flat_length`
  subtracts both the flat tip and the taper, and the assert on it is what keeps
  the spool sitting on the flat rather than wedged between two cones.
- **`peg(faces)`** — matches the wall it goes through; assembly frame,
  along Z. Shaft, flange, body through the wall, and on an inner peg the
  body runs `peg_shoulder` past the far face before stepping down to the
  second shaft. The flange spaces the bearing on the side it goes in from,
  and that step spaces the other. **It must stay installable:** nothing wider than
  the body may sit past the flange, since the body goes through the hole
  first. The user asked for this in place of loose race spacers; don't add
  a second flange. `peg_inner`/`peg_end` are the print pose, lying on a flat
  at `_peg_flat` — the deepest cut that keeps the shaft's underside at 45°,
  because standing up the flange and shoulder are flat overhangs.
- **`floor_template(half)`** — the stand's footprint with a hole at every
  tile's screw-down point, built from the same `_screw_xy()` the tiles use,
  so the two can't drift apart. Split and dovetailed like the bulkhead one.
- **`template(half)`** — the drilling template; four lanes wide it is wider
  than a bed, so `template_left/right` dovetail together. One lane prints
  both templates whole, side by side, via `plate_templates(s)`, which asserts
  they fit.
- **`stand_*()` / `bay_*()`** — assembly modules the previews call. Previews
  never re-implement a placement loop.
- **`spools()` / `box()`** — reference geometry, not printed. `box()` draws an
  edge frame rather than a shell so the stand stays visible inside it.

## Conventions that bite

- **`_dovetail_profile(grow)` is the single source of every dovetail.** Tails
  extrude it at `grow = 0`, sockets at `grow = dovetail_clearance`, and the
  template joint reuses it rotated into its own plane. Two polygons would drift
  the moment anyone tuned the fit.
- **Lattices are cut, not built.** `tile()` intersects the honeycomb with the
  floor window and *subtracts* the screw pads and the PTFE pad from that
  cutter, so a pad is material the lattice does not get to eat. Adding it back
  on top would leave a seam. The PTFE channel fills the one row of cells it
  runs down (`_lattice_row_over()`), whole cells so no slivers are left; the
  end clip's foot is sized to land inside that solid band, which an assert
  checks.
- **The PTFE loops are added, then bored.** `tile()` unions the loops and
  the end clip in, then `_ptfe_run_cut()` takes out the groove (round-floored,
  tile top down to half depth, never higher, or it would bridge a loop) and a
  teardrop bore along it. The teardrop is what keeps each loop's ceiling at
  45°; a round bore there would bridge. Every clip has vertical sides and a
  half-round top (`_ptfe_clip_2d()`). The flat loops skip the back roller's
  footprint — its running surface sits below a loop top.
- **No PTFE inside the spool's cylinder.** The tube runs flat between two
  end clips. The front one's outer face, `ptfe_end_x`, is where a clip's top
  clears the spool by `ptfe_clip_clearance`; the back one's, `ptfe_back_x`, is
  a clip's length behind where it clears the back roller by the same — both
  from `_ptfe_clip_clear_dx()`. The user rejected a rise toward the spool — at
  any angle it runs straight into the spool's circle. The flat loops share the
  run from the back roller to the front clip evenly. Past each end the groove
  scoops up (`_ptfe_scoop_cut(y, x, dir, r, angle)`), on an arc tangent to its
  floor. The front one turns a full 45° (`_ptfe_45_r`, the radius that does it
  in the floor under the groove), and the filled row runs a cell further so
  it reaches the tile top. The back one is shorter and steeper
  (`_ptfe_scoop_r`), because 45° won't fit between the back clip and the back
  face, and it lands in the solid border.
- **Two routes, both always cut.** The user wanted the tube to be able to
  drop through the floor to something built under the stand as well as run
  to the back, and asked for both in the same tile, not an option.
  `_ptfe_drop_cut()` is a slot right behind the front clip
  (`_ptfe_drop_x`). Its floor bends from the groove floor into 45° on
  `_ptfe_45_r`, reaching 45° exactly at the underside. Behind it is a 45° face
  over the tube's far side. The slot is open from the top on purpose, because a
  closed bore at under 45° would have a ceiling that overhangs. It passes under
  the flat groove for ~12 mm, which the back-route tube spans; the loop over
  it still stands on tile either side of the slot.
- **The lattice may not eat a socket.** A socket runs 8.25 mm in and a tile's
  border before the lattice is 8 mm, so `_socket_pads()` keeps a `hex_wall`
  of solid round each socket, cut from the lattice cutter like the screw
  pads. Without it the socket's wide end opened into a cell.
- **The flange lives in the lane slack.** `roller_end_gap` (shoulder less
  `bearing_recess`), `flange_rim` and `flange_taper` add up to exactly
  `lane_slack`, so the spool's rims land on the flat; the taper is whatever is
  left, and the flange height follows from `flange_taper_angle`. Widening
  `lane_slack` spends the 4 mm the width budget has spare.
- **Bearing seating is a chain of two numbers**: `peg_shoulder` and
  `bearing_recess`. Their difference is how far the roller's end runs off the
  wall; the asserts keep it at 0.2 mm or more.
- Preview files carry their `color()` calls at the top level, as the repo's
  multicolor 3MF builder scans preview source by regex.

## Checks worth re-running

Intersecting the assembly modules pairwise should give **zero volume** —
coincident faces are fine, volume is not:

```
intersection() { stand_rollers(); stand_walls(); }   // empty
intersection() { stand_walls();   stand_tiles(); }   // 0 mm³
intersection() { spools(); union() { stand_tiles(); stand_walls();
                                     stand_rollers(); stand_beams(); } }  // empty
```

Bounding boxes of every part must stay inside 220 mm on all three axes.

## The wall shape

`_wall_profile()` is the crescent: a full-depth floor edge, a back horn up to
the beam, a trough at `wall_trough_height`, and a front horn at
`wall_front_fraction`. The inner edge is one cubic Bézier between the inside
of the two horn tips, whose middle control points sit low enough to bottom
out at the trough height; `wall_horn_spread` pulls them in from the ends to
fatten the horn roots. Concave corners are filleted and convex ones rounded
with offset pairs, then the floor edge is clipped square so it still runs the
full depth. The lattice is the same profile inset by `wall_frame`, kept off
the pads round the pegs and the beam tip.

**The back height is solved, not set.** `beam_z` is the lowest the beam's bar
can sit and still clear a seated spool by `beam_clearance`, with the beam
tucked against the back edge; the back horn is a circle of `wall_back_tip_r`
round the beam hole. Change the spool or the stand depth and the back of the
wall follows.

## Beams

- **One shoulder per wall per beam.** The socket's flange sits in a countersink
  on the wall's far face and indexes it; the M3 lock screw does the holding.
  A second rigid shoulder on the near face would trap the wall and the beam
  could never be pushed through. The user rejected snap fingers — don't
  reintroduce them.
- **The flange lives inside the wall**, so the bar (`beam_af`), not the
  flange, is what `beam_z` clears the spool with.
- **Hex fits share one corner radius** (`hex_corner_r`), so a bigger hex always
  clears a smaller one at the corners as well as the flats. Flats face ±X in
  every hex, walls and beams alike, so the lock hole along X lines up through
  flats.
- **45° is measured at the corners.** Every cone on a beam and the wall's
  countersink rises by the change in circumradius, not across flats — across
  flats would put the corners at 49°.
- **The left wall's hole is spigot-sized**; every wall with a lane on its −Y
  side takes a socket and gets the countersink (`lane_minus`).

## Wall-to-floor joint

Drawn once in its own frame by `_joint_add(role, share)` and
`_joint_cut(role, share)` — wall centre line on y = 0, box floor on z = 0 —
and placed into each part by `_tile_joint()` / `_wall_joint()`. A part takes
what its role adds and loses what every other role adds, grown by
`joint_fit`, so the tiles and walls can't disagree. **Change the joint there,
never in `tile()` or `wall_support()`.**

- Roles: `"minus"`, `"wall"`, `"plus"` under a centre wall, `"tile"`,
  `"wall"` under an end wall.
- **Every wall screw comes up through the floor**, at `_floor_screw_xs`: the
  middle (`base_screw_x`) and `corner_screw_inset` in from each end. The user
  asked for this over the old horizontal corner screws through knuckles,
  which are gone. Each is `base_screw_length` (8) — head in the floor, about
  6 mm of bite in the wall. Under a centre wall the tiles lap at each one,
  half the floor each.
- All the M3s are socket-head cap screws in counterbores (`_m3_cap_hole`),
  never countersunk — the user's hardware is cap heads. Screw lengths are
  under-head lengths, so every thread starts at `m3_counterbore_depth`.
- The lap is a 45° scarf through the screw's axis, not a step: a stepped lap
  would leave the upper tile's share as a flat overhang. The upper share
  reaches `base_height / 2` past a tile's −Y edge, which `_tile_lo()` counts
  for the tile plates.
- Added shapes stop exactly on the floor's faces; only cuts overshoot by
  `_eps`. An `_eps` on an added shape shows up as a 0.01 mm interference in
  the checks.
- The ridges run the full depth; the tiles' grooves run out through the end
  faces.

Interference checks now also want the walls and tiles to meet only on
z = base_height, and neighbouring tiles only on their seams.

## Print plates

`plate-1` … `plate-12` are one print job each, laid out for a `print_bed`
cube: one per wall (`plate_wall(k)`), every roller and beam
(`plate_rollers()`, `plate_beams()`), every peg (`plate_pegs()`) — the user
prints pegs in **TPU**, so they stay on a plate of their own — the tiles two to
a plate (`plate_tile(p, s)`), the bulkhead template (`plate_template(s)`),
and the floor template halves (`plate_floor_template(half)`).
`plate-1x-1` … `plate-1x-6` are the one-lane set: the two end walls, both
rollers and the beam, the four pegs, the tile, and both whole templates.

- **The plates between them must print exactly one stand.** Sum the plates'
  `components` in the manifest and compare with the assembly's plus the
  template — they must match part for part.
- Checks per plate: its bbox must sit inside ±`print_bed`/2 in X and Y and
  under `print_bed` in Z, and every pair of parts on it, each grown by 1 mm
  in projection, must not intersect (≥ 2 mm apart). OpenSCAD reports a small
  non-empty 3D result as "Triangles", not "Facets" — test for "empty".
- Every part is also its own STL in `parts/`, in its print pose, for
  printing one at a time — keep those in step with the plates.
- Each build's plate previews hard-code plate indices for its lane count.
  That is why a lane count is a build with its own plate files, not a
  customizer setting — see *Builds*.


## Fit test plate

`plate-fit` is a throwaway coupon plate: every mating feature at full size,
the spans between them cut out. It is **not** part of the stand, so its
manifest entry has a legend but no `components`, which keeps the "plates
print exactly one stand" sum intact. Every coupon is either cut from the real
part (`fit_wall_*` intersect `wall_support()`, `fit_beam_*` slice `beam()`),
the real module shortened (`roller(fit_roller_length)`), or built from the
same helper (`_dovetail_profile()`), so a fit tuned in the params moves the
coupon with it. Never model a coupon's interface on its own. The peg disc is
clipped clear of the back floor screw's pilot. The plate carries one inner
peg in its own colour, so the slicer can give it TPU.

## Instance ids in the manifest

Each build's main assembly names every piece — at four lanes tiles `T1–T4`,
walls `W1–W5`, rollers `R1F…R4B` (lane, front/back), pegs `P1F…P5B` (after the
wall they pass through), beams `B1–B4`; at one lane `T1`, `W1–W2`, `R1F/R1B`,
`P1F…P2B`, `B1` — and `hardware[].usedBy` hangs the screws, bearings and PTFE
off them. They are written per build, so changing a build's `lanes` means
regenerating them along with the `qty` values.

`stand_instances()` in the lib gives each of those ids a point near the middle
of its piece, and `assembled.scad` and `box.scad` echo it as
`gallery_instances` so the gallery can point at one piece (see the repo
CLAUDE.md). Its ids must match the manifest's, and front is +X.

## Alternating shades

Every printed group in `assembled.scad` and `box.scad` comes in two shades
of its hue, both lightened from the neon base so they read on the dark
viewer: 12% and 45% of the way to white. Tiles `#1fedff`/`#73f3ff`, walls
`#ffdb27`/`#ffe878`, rollers `#ff7d1f`/`#ffae73`, pegs `#ff33ce`/`#ff7fe0`,
beams `#51ff30`/`#92ff7e`. The legend entry's `color` is the first,
`shades` the second.
The `stand_*` modules take `parity` (0, 1, or undef for all) and the preview
calls each twice. Tiles, walls and beams alternate by index; rollers and pegs
chequer by index plus side, so a piece never shares a shade with the one in
front, behind or beside it. That matters beyond looks: the tiles touch along
their joints, so drawn in one colour they fuse into one solid and T1–T4
can't be told apart. The second tile and beam shades are guarded by
`lanes > 1` — at one lane they would draw nothing, and an empty colour pass
fails the 3MF build. Bearings and spools are reference geometry and stay one
colour.
