# Spool Dry Box Module

A sealed dry box for one 200 mm spool, printed in pieces on a Snapmaker U1
with 75A TPU gaskets printed in place. Two round side walls with curved
panels between them. Going round from the top:

1. hold-down spring module
2. lid
3. front panel
4. front roller module
5. underneath panel
6. rear roller module
7. back panel

**Work in progress.** The three modules bolt between the walls but aren't
drawn yet, so their places are gaps. Walls and panels are 3 mm and will
be reinforced later.

Walls: **215 mm across**, module 70 mm wide.

## Print plates (Snapmaker U1, 270 mm)

| Plate | What's on it | Materials |
|-------|--------------|-----------|
| 1 | Left wall on its outside face, gasket in | PETG + TPU 75A |
| 2 | Right wall on its outside face, gasket in | PETG + TPU 75A |
| 3 | All four panels standing on end, nested, seam gaskets in | PETG + TPU 75A |

Each gasket STL shares its part's frame, so it drops onto the part as a
second object in the slicer.

## Hardware

- 36 × M3 × 12 socket-head cap screws, 18 through each wall into the
  panels' edges

## How it seals

A rib runs round the inside of each wall under the panels' edges, with a
groove full of TPU in its face. Each panel flares at its edges to carry a
ridge that presses 1 mm into that TPU. The screws go through the wall
straight down the middle of the TPU channel into a boss in the panel. The
TPU widens round each screw, and the screw threads through it and seals.
Where a panel meets a module or the next panel, a TPU strip printed into
its end stands 1 mm proud and presses on its neighbour.
