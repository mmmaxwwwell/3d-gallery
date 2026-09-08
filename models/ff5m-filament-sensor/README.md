# Flashforge Adventurer 5M Filament Sensor

A two-piece ball-plunger filament runout sensor, both parts printed in
64D TPU:

- **body** — slips over the 7 mm plastic boss on top of the print head,
  held by one M3 self-tapping screw. Houses the ball cavity. Accepts a
  4 mm-OD PTFE tube on top, with a 45° funnel down to the 1.75 mm
  filament bore.
- **cap** — mounts against the body's flat pocket face with two M2
  screws that also fasten the D2F-01F pin-plunger microswitch through
  its own mount holes. The switch body's face registers against the
  mount face, so the plunger depth is set automatically; the M2 hole
  spacing indexes the button onto the ball's pocket axis translated
  to the mount face.

## The sensing geometry (why one hull())

A ball bearing (default ~4 mm) sits in a pocket tilted 40° off the
filament axis. Two positions along that pocket:

- **Present (switch actuated):** ball center on the pocket axis at
  `(filament_radius + ball_radius) / sin(40°)` from the axis-crossing
  point. Ball rides tangent to the 1.75 mm filament surface.
- **Absent (switch released):** ball moved back along the pocket axis
  by `switch_stroke = 0.65 mm`. This *is* the plunger stroke — 0.5 mm
  D2F pretravel + 0.15 mm past, stopping 0.10 mm short of the 0.75 mm
  max travel.

The cavity is `hull()` of an `R = ball_radius + 0.119 mm` sphere at
each center — a capsule. Where the capsule crosses the bore wall you
get a lens-shaped opening automatically, and the ball can't escape
through it: the capsule surface is only 0.119 mm proud of the ball
everywhere, so laterally the ball is held to 0.119 mm while axially
it's free to travel the full 0.65 mm. **One boolean operation, both
constraints.**

**Sanity check:** at the absent position the ball's inner surface
protrudes ~0.6 mm into the 2.1 mm bore, leaving ~1.5 mm of free
diameter — less than the 1.75 mm filament, so the filament physically
cannot pass without displacing the ball. If that inequality fails
(e.g. after changing `pocket_angle` or `switch_stroke`), the sensor
does nothing.

## Parts

| File                        | Description         | Material |
|-----------------------------|---------------------|----------|
| `parts/body.scad` → `body.stl` | Sensor body      | TPU 64D  |
| `parts/cap.scad` → `cap.stl`   | Microswitch cap  | TPU 64D  |

## Hardware

- 1 × ball bearing, ~4 mm dia (e.g. from a 608 skateboard bearing — **measure yours**)
- 1 × D2F-01F pin-plunger microswitch (Omron)
- 1 × M3 × 8 self-tapping screw (body to printer boss)
- 2 × M2 × 10 self-tapping screw (cap + switch to body)
- 1 × PTFE tube, 4 mm OD × 2 mm ID (any length)

## Assembly

1. Slip the body over the 7 mm print-head boss.
2. Drive the M3 self-tapper radially through the wall.
3. Push the PTFE tube down into the top of the body until it seats.
4. Snap the ball into the cavity through the access channel — TPU
   flexes just enough to admit it.
5. Drop the D2F-01F into the cap pocket (plunger side toward the
   body).
6. Fit the cap onto the body's flat mount face and drive the two M2
   self-tappers through the cap, through the switch's mount holes,
   and into the body pilots. The switch face registers against the
   body flat, so the button depth self-aligns.

## Customization

The customizer exposes a **single parameter**: `ball_diameter`.
Everything else (clearance, pocket angle, switch stroke, filament
radius, boss diameter, wall thickness, PTFE OD, cone angle, cap
footprint) is a fixed constant at the top of
`lib/ff5m-filament-sensor-lib.scad`. Edit the lib if you need to
change them.

See [CLAUDE.md](CLAUDE.md) for the file layout and editing rules.
