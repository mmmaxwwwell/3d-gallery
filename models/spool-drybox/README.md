# Spool Dry Box Module

A sealed dry box for one 200 mm spool, printed in pieces on a Snapmaker U1
with 75A TPU gaskets printed in place. Two round side walls with curved
panels between them. The spool sits on two rollers, as on the filament
spool roller. Each runs in an ear that bulges out of the bottom of both
walls, on 608 bearings over pegs moulded into the walls, and an ear plate
closes the ear round. A third roller sits in an ear at the top and rests on
the spool.

The lid is the top and front half. It's cut off on a diagonal through the
spool's axis, from just past the front roller up to the back, so the whole
spool lifts out. It hinges at the back, and a draw latch at the front pulls
it down onto its gasket. Going round from the top:

1. top ear (lid)
2. lid front panel (lid), then the cut and latch
3. front ear
4. underneath panel
5. rear ear
6. back panel, then the cut and hinge
7. lid back panel (lid)

**Work in progress.** The top roller has no spring yet. A tensioner to
cinch the spool down will go in its ear. Walls and panels are 3 mm and will
be reinforced later.

Walls: **216 × 251 mm** with the top ear. Module 76 mm wide.

## Print plates (Snapmaker U1, 270 mm)

| Plate | What's on it | Materials |
|-------|--------------|-----------|
| 1 | Left wall, base and lid halves, on their outside faces, gaskets in | PETG + TPU 75A |
| 2 | Right wall, the same | PETG + TPU 75A |
| 3 | Lid front and back panels standing on end, nested, seam gaskets in | PETG + TPU 75A |
| 4 | Back and underneath panels and the front ear plate on end, gaskets in | PETG + TPU 75A |
| 5 | Top and back ear plates, three rollers, latch lever and link | PETG |

Each gasket STL shares its part's frame, so it drops onto the part as a
second object in the slicer. The lid back panel prints upside down, so its
hinge knuckle starts on the bed.

## Hardware

- 50 × M3 × 12 socket-head cap screws: through the walls into the panels'
  and ear plates' edges
- 2 × M3 × 12: the latch lever's pivot and the link's pin
- 1 × M3 × 40: the hinge pin
- 6 × 608 bearings, two pressed into each roller

## Assembly

Build the base and the lid separately. Each goes together like the old box:
lay a wall half on its outside face, press the bearings into the roller and
drop it onto its peg, stand the panels and ear plates in the groove, lower
the other wall half on, and screw both halves on. Set the lid on the base,
and run the M3 × 40 down through the lid's hinge knuckle into the base's.
Screw the lever onto the lug beside the front ear, and the link onto the
lever.

## How it seals

A rib runs round the inside of each wall under the panels' edges, with a
groove full of TPU in its face. Each panel flares at its edges to carry a
ridge that presses 1 mm into that TPU. The screws go through the wall
straight down the middle of the TPU channel into a boss in the panel. The
TPU widens round each screw, and the screw threads through it and seals.
Where a panel meets an ear plate, a TPU strip printed into its end stands
1 mm proud and presses on it.

The lid's cut uses the same ridge and TPU with no screws. A groove runs
round the base's side of the cut: across the back panel's and front ear
plate's ends, and along a lip each wall carries inward. The lid carries the
ridge. The hinge and the latch hold it down.
