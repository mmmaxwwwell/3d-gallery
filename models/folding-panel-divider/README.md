# Folding Panel Divider

A room divider that prints in one piece, already folded. Panels are joined edge to edge by interlocking knuckle hinges with the pin printed straight through the bore — the strip leaves the bed hinged, with no assembly step and no hardware.

Consecutive panels carry their knuckles on opposite faces, so the run zig-zags open accordion-style and folds back down to the width of a single panel.

## Dimensions

At the defaults — 8 panels, 240 × 240 mm each, 7 mm thick:

| | |
| --- | --- |
| Printed envelope, one strip | 55.3 × 244 × 242.9 mm |
| Printed envelope, a stacking pair | 118.3 × 244 × 242.9 mm |
| Unfolded span | 1920 mm (8 × 240) |
| Standing height, one strip | 240 mm |
| Folded thickness | 56 mm (8 × 7) |

The 244 mm and 242.9 mm figures include the knuckles and the snap joiners, which sit slightly proud of the panel faces and edges.

## Parameters

| Param | Meaning | Default |
| --- | --- | --- |
| `panel_height` | Panel dimension along the hinge lines — how tall the divider stands, and how tall it prints | 240 |
| `panel_width` | Panel dimension across the fold — the span added per panel when unfolded | 240 |
| `panel_thickness` | Panel thickness, and so the fold pitch | 7 |
| `num_panels` | Panels in one strip | 8 |
| `hinge_segments` | Knuckle segments per hinge, both halves counted | 40 |
| `corner_radius` | Rounding on every panel edge (mm) | 1 |
| `clearance` | Running clearance in the hinges (mm) | 0.35 |
| `top_joiners` | Snap joiners on the top edge | `true` |
| `bottom_joiners` | Snap joiners on the bottom edge | `false` |
| `explode` | Spread the panels apart to see into the hinges — inspection only, not printable | `false` |

`hinge_segments` has a ceiling. Each knuckle is `panel_height / hinge_segments` long and the pin sits half that off the panel face, so pushing the count too high drops the pin inside the knuckle barrel and OpenSCAD stops on a BOSL2 assertion. At `panel_height = 240` the limit is 60 segments.

## How the hinge works

Each joint is a BOSL2 `knuckle_hinge` split into two interleaved halves, one on each of the two panels it joins, with a 1.65 mm pin modelled through the shared bore.

The two halves bore differently on purpose:

- The **fixed** half bores 1.5 mm — narrower than the pin, so the two fuse into one solid piece as they print.
- The **free** half bores 2.0 mm — wider than the pin, leaving 0.175 mm of clearance all round so it can still turn.

That is what makes the joint work straight off the bed: the pin is welded to one panel and rides free in the other. The three diameters only work as a set, so they are lib constants rather than parameters.

Each hinged edge is also scalloped by a cylinder of `knuckle_pitch / 3 + clearance`, so a panel swings clear of its neighbour's knuckles rather than binding on them.

## Stacking

240 mm is short for a room divider, so strips stack. Snap joiners (BOSL2 `half_joiner` / `half_joiner2`) run along the top and bottom edges — five of them per panel at the defaults, spaced three joiner lengths apart.

Print one strip with `top_joiners` and its mate with `bottom_joiners`, and the second sits on the first. A strip with **both** set is a middle course for a three-high stack; a strip with **neither** is a standalone screen.

The `plate.3mf` preview is exactly that pair, laid out 7 mm apart on one bed.

## Printing

Print it **standing on end**, which is the orientation the model already comes in — do not lay it down. Standing, every hinge bore runs vertically, so the bores print as clean round holes with no bridging and no support anywhere in the model. Laid flat, every bore becomes a horizontal hole over a 240 mm span.

It is a 243 mm-tall print of a 56 mm-wide slab, so it wants a well-stuck first layer and no draughts. A brim helps.

Free the hinges after printing by working each joint back and forth a few times — the printed-in clearance is 0.175 mm on the free half, enough to break loose but tight enough that the panels do not flop.
