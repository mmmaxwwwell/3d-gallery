# ff5m-filament-sensor

Two-piece (body + cap) ball-plunger filament runout sensor for the
Flashforge Adventurer 5M, both parts in 64D TPU.

## File layout

```
lib/
  ff5m-filament-sensor-lib.scad   all params + geometry, no top-level render
parts/
  body.scad                        include + $fn + body()
  cap.scad                         include + $fn + cap()
```

No `previews/`: both parts are single-color TPU, so a multicolor 3MF
preview would only duplicate the STL.

## Public modules

- **`body()`** — sleeve with grip cavity, filament bore, PTFE receiver
  + 45° funnel, ball cavity, radial M3 pilot, and a rectangular boss
  along the pocket axis that terminates in a flat mount face with two
  M2 pilots for the cap.
- **`cap()`** — rectangular block with the D2F pocket, plunger clearance
  hole, and two M2 through-holes matching the body pilots and the
  D2F-01F mount-hole spacing.

Internal helpers (leading underscore):

- `_at_pocket() { ... }` — the pocket local-frame placer. Any child
  placed inside is translated to `crossing_z`, rotated by
  `pocket_azimuth_deg` around the ring, then tilted `pocket_angle`
  off the filament axis.
- `_sensor_local()` — ball cavity (hull of two spheres) + outward
  plunger-access channel, in pocket-local coords.
- `_boss_local()` — rectangular mount-boss along the pocket axis.
- `_m2_pilots_local()` — pair of M2 pilots at the mount face.
- `_m3_screw_hole()` — radial M3 pilot through the grip wall.
- `_ptfe_receiver_neg()` — 45° funnel + straight PTFE bore, subtracted
  from the top of the body.

## Customization

Only `ball_diameter` is exposed in `BEGIN_PARAMS`. Everything else
lives in the "Fixed geometry" block at the top of the lib. All
derived cavity dimensions (`ball_r`, `cavity_r`, `ball_perp_*`,
`ball_along_*`, `mount_face_z`) scale from `ball_diameter`, so
changing the ball size keeps the geometry internally consistent.

## The 40° vs 14° call

The original spec named `pocket_angle` twice — 40° in the "Fixed
values" block, 14° in a follow-up message. Kept at 40°; 14° would
land the mount face nearly on top of the print head and put the
along-axis stroke way past the D2F max. Change one constant if you
disagree.

## `switch_stroke` = along-axis, not perpendicular

`switch_stroke` is the ball's travel projected onto the pocket axis
— that's what the D2F plunger actually sees. The original prompt
gave the same 0.65 mm number for both the plunger stroke *and* the
perpendicular delta between the ball centers, which is only
self-consistent at pocket_angle = 90°. At 40° they differ by
1/sin(40°) ≈ 1.56×. Using it as along-axis keeps the switch inside
its 0.75 mm travel budget; using it perpendicular would over-travel
by 0.26 mm and destroy the switch. Ball intrusion into the bore
drops from 0.825 mm (perp interpretation) to ~0.59 mm — still well
over the 0.175 mm needed to block a 1.75 mm filament.

## `mount_face_z` is derived from the plunger

`mount_face_z` is set so the D2F plunger tip lands on the ball
outer face at the released position (zero preload), and at the
present position the plunger is compressed by exactly
`switch_stroke`. The formula:
`ball_along_absent + ball_r - cap_inner_wall + d2f_plunger_extension`
keeps a constant 0.23 mm of solid material between the outer sphere
face and the mount face regardless of ball size.

## Vertical layout

Bottom to top along Z (see the `z_*` derived vars):

- `[0, z_grip_top]` — 7 mm-ID printer-boss grip.
- `[z_grip_top, z_sensor_top]` — straight 2.1 mm filament bore; the
  ball cavity lives here, punched into the surrounding wall material
  by `_at_pocket() _sensor_local()`.
- `[z_sensor_top, z_funnel_top]` — 45° cone from 2.1 mm to 4 mm.
- `[z_funnel_top, z_top]` — 12 mm straight 4 mm-ID PTFE receiver.

`crossing_z` (where the pocket and filament axes cross) sits 2 mm
above the top of the grip so the cavity clears the grip cavity wall.

## `include` vs `use`

Both `parts/body.scad` and `parts/cap.scad` use
`include <../lib/ff5m-filament-sensor-lib.scad>;` so the lib's
top-level params land in the consumer's scope. The WASM customizer
relies on this too.

## Editing rules

- **Don't** redefine `ball_diameter` in consumers — the lib owns it.
- **Don't** add top-level geometry in `parts/*.scad`; keep them three
  lines.
- **Don't** cut the ball cavity as `hull() + separate aperture`. The
  hull *is* the aperture; splitting them breaks the retention
  invariant.
- **Don't** change `bore_diameter` below ~2.0 mm — filament will jam.
- If you re-angle the pocket or change `switch_stroke` /
  `d2f_plunger_extension`, re-check that `mount_face_z` still clears
  the outer sphere face (`ball_along_present + cavity_r`) with a
  margin of at least 0.1 mm — otherwise the mount face lands inside
  the ball cavity.
