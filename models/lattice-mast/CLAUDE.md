# lattice-mast

A tapered mast in segments, with an open honeycomb wall. Published, though no joint pair has been printed and tried yet.

## Rules from the user

- **The outside is a perfect cone.** Anything a joint needs goes on the inside. Check: no STL vertex lies outside `outer_r(z)`. The protruding screw heads are the one exception.
- **Joints don't thin the wall.** The upper segment stays a full-thickness tube. The lower segment's sleeve is a full `wall` thick, set inside the bore.
- **Joint shape.** The overlap is ONE hexagon (`sleeve_h = 1.5 · row_pitch`, a cell's full height). Both rings there are solid, with no cells. There are 2 to 7 screws per joint, evenly spread.
- **Screw holes are plain round holes, not teardrops.** The user's call, overriding the 45° rule for these holes.
- **Seating.** A short 45° turn to a backstop, where the screw holes line up.
- **Screw heads.** The head face seats `head_seat` (1.5 mm) into the 3.5 mm foot ring, so 2 mm of foot sits under the head and is clamped onto the sleeve. The head stands 1.5 mm proud; the user chose that over a perfectly clean cone.
- **No supports.** Every overhang is 45° or steeper, measured as printed.

## Geometry

- **Customizable.** `bottom_diameter`, `top_diameter`, `mast_length`, `wall` and `section_height` are what the user asked to set; the rest of `BEGIN_PARAMS` comes along. `schema.ts` must name every param. The customizer can't parse a nested list, which is why the taper is two diameters, not a `[height, diameter]` profile.
- **Taper.** `outer_r(z)` comes from `lookup()` on `diameter_profile`, built from the two diameters; `bore_r(z)` is `wall` inside it.
- **Segments.** `segments = ceil(mast_length / (section_height - 1.5·(cell_pitch + 1)))`, all equal (`seg_len`). A sleeve is 1.5 row pitches. Each `parts/segment-NN.scad` calls `segment_NN()` (the customizer needs a module with no arguments), which is `mast_segment(NN-1)`. The part files are fixed at 11: fewer segments make the extra parts fail their assert, more are only in the assembly.
- **Joint j** is at the foot of segment j.
  - **Upper segment's foot:** a solid ring `sleeve_h(j)` tall, at full wall.
  - **Lower segment's top:** a solid sleeve of the same height, from `sleeve_in` to `sleeve_out`, with both top edges rounded by `sleeve_round` as a lead-in. Its outside is `fit_slop` inside the upper segment's bore at the sleeve's top.
  - **The flare:** the sleeve's bore runs `neck_length` below the joint plane, then flares out at 45° to the wall (`flare_z`). All of this is in `segment_body`'s profile. The flare is inside the bore, and the cells are cut from the axis right through it, so the top rows' ribs are as deep as wall plus flare. That's what the user wants: beefier supports there. The user also wants the cells left where they are, so make the flare bigger inward, never by moving the honeycomb. If cells ever stop at the bore instead, cut past it, because the faceted bore leaves 0.01 mm skins over them.
  - **Honeycomb:** segment j's starts at the ring's top. Segment j-1's runs up to the joint plane.
- **Body cells.** `honeycomb()` stretches row pitch to fill its window.
- **Lock screws.**
  - `screw_count(j) = clamp(round(n/3), 2, 7)`, evenly round the ring, at mid-ring height.
  - Each pocket's floor is `screw_floor_r` = outside − `head_seat`, which is in the foot ring. Below it is an M3 clearance hole through the rest of the foot, then a pilot through the whole sleeve. The screw is an M3 × 6, which comes out flush with the sleeve's bore.
  - An assert keeps at least 1.5 mm of foot under the head.
- **Twist lock.** The user's spec is three parts: diagonal (pull together), lateral (seated, keeps turning), pop (snaps into place a couple of mm later).
  - **Lugs:** `lug_count(j) = screw_count(j)`, one midway between each pair of screws. Each is a block `lug_width` long round the sleeve, with a 45° diamond radial profile. It is centred halfway between the joint plane and the bottom of the screw holes (`lug_bottom`), which is the user's placement and also sets how long the diagonal is. It reaches `lug_depth` past the upper segment's bore at its own height: the bore tapers, so it stands further off the sleeve there than `fit_slop`.
  - **Screws:** these sit high in the ring (`screw_z`), so the channels run underneath them (asserted).
  - **Channel:** an L in the foot ring, with `lug_z(x)` the lug's height by where its centre is round from the stop. It's level for `twist_lateral`, then climbs down at 45° past the foot face. It's swept from thin slices (`channel_slice`). Each slice covers every height a lug centred within ±w passes through there, then raises its floor and lowers its ceiling per `fit(x)`:
    - **Floor:** up by clearance·√2 + `twist_preload` from the corner to the stop, so the joint is held tight through the lateral run and at the stop.
    - **Pinch:** 0.5 mm long, just past the seated lug, with floor and ceiling each in by clearance·√2 + `twist_snap`/2. The step back out, on the stop side, is 0.01 mm wide: that's the pop.
  - **What not to do:**
    - Don't sweep whole lug-sized blocks: overlapping blocks erase any raised floor.
    - Don't shape the lug to the 45° path: it has to run level too.
  - **Turn:** seating turns segment j by −`twist_angle(j)`, all but `twist_lateral` of it while dropping.
## Checking

Fingerprinted in `tests/build/baseline.json`. Render with `openscad --backend=Manifold`. To check a joint, intersect `translate([0,0,joint_z(k)]) mast_segment(k)` with `translate([0,0,joint_z(k+1) + max(0, s - twist_lateral)]) rotate([0,0,-s/sleeve_out(j)·180/π]) mast_segment(k+1)`, with s the lug's distance round from the stop. A failed render leaves no STL, so tell a render error apart from an empty result.

These held for joint 1 (7 lugs) on 2026-10-01:
- **s ≥ 7:** empty, a free entry.
- **s ≈ 4–6:** contact starts as the floor pulls the foot down.
- **s 2–4:** preload, about 1.4 mm³ in total.
- **s 0.2–2:** the pinch, about 1.7 mm³.
- **s = 0:** back to the preload, the pop.
- **Should clash:** turning 1° past the stop, lifting 0.5 mm in the level run, and dropping straight down in the diagonal.

Joint 10 showed the same pattern.
