# Servo Duct Valve Manifold (100 mm)

Servo-driven butterfly valves and manifolds for 100 mm (4") dryer duct. It
pulls exhaust, and a slight vacuum, from a printer enclosure and picks which
run the fan draws on.

Three kinds of piece bolt together on one round flange:

- **Hub** (`hub.stl`): a trunk pointing down and 2–5 branches leaning out
  45° round it. It prints standing on its trunk flange with no supports.
- **Valve section** (`valve-body.stl` + `valve-disc.stl` +
  `valve-coupler.stl`): a tube with a butterfly disc turned directly by an
  SG90 on its shaft axis. It has a flange at the bottom and a duct spigot at
  the top.
- **Spigot adapter** (`spigot-adapter.stl`): a flange with a duct spigot, for
  any port that should be plain duct.

Bolt a valve or an adapter onto each hub port. A valve with an adapter under
its flange is an inline damper.

## Builds

| Build | Pieces |
|---|---|
| 3-port, 2 valves (default) | hub, valves on both branches, adapter on the trunk (to the fan) |
| 3-port, all valved | hub, a valve on every port |
| 4-port, 3 valves | hub, valves on all three branches, adapter on the trunk |
| Inline valve | one valve, one adapter |

## Hardware

Each flange joint takes 4 × M3 × 10 socket-head cap screws and 4 × M3 nuts.
Both flanges have a hex pocket at each bolt: the nut goes in one, the screw
head in the other. Each valve also takes:

- an SG90 or MG90S servo, with its straight two-arm horn and two tab screws
- 1 × M3 × 16 socket-head cap screw as the disc's idle pivot
- a 4" hose clamp per spigot

## Print

PETG, 4 walls, gyroid, no supports, no brim. Every part prints in the
orientation it is exported in:

- hub: on its trunk flange
- valve body and adapter: on their flanges
- disc: flat, rib up
- coupler: head down

Nothing overhangs more than 45°.

## Assembling a valve

1. Lower the **coupler** into the open top of the servo bracket, head facing
   out and long way vertical, so its head passes through the slot in the servo
   plate. Push it in until the square key sits flush with the inside of the
   bore.
2. Slide the **disc** down the bore edge-on, rib toward the servo side, until
   the rib lines up with the key. Push the coupler the rest of the way in so
   the key seats in the rib.
3. Run the **M3 × 16** through the boss opposite the servo. It threads into
   the boss and the wall, and the disc turns on its end.
4. Drive the servo to the angle you want as "shut". Set the horn in the
   coupler's pocket, then press the servo's spline into the horn through the
   plate and screw its tabs to the plate. The horn's centre screw isn't
   needed: the coupler holds the horn on.
5. Bolt the flange to the hub or adapter, then slide the duct over the spigot
   and clamp it behind the bead.

A servo turns the disc 1:1, so 90° of servo travel runs it from shut to fully
open.

## Before you print a batch

`servo_horn_face` is the distance from the face of the servo's mounting tabs
to the far face of the horn once it's pressed on. SG90 datasheets disagree on
it by about 1.5 mm. Measure yours: the horn pocket copes with a servo up to
2 mm shorter than the setting, but not with a longer one. The disc runs
0.5 mm clear of the bore (`disc_clearance`), so a shut valve leaks a little.
That's fine for balancing a fan, but it isn't an airtight seal.
