Private Property Sign
=====================

A three-color property warning sign. A white rounded plate carries five
stacked messages — "Private Property" and "No Trespassing" in red, then
"No Soliciting" (with its qualifier), "Dogs on Premises", and "Audio and
Video Recording in Use" in black.

The text is **flush** with the plate: it is recessed into the top face and
then filled back in with colored inlays whose top surface is exactly
coplanar with the plate. There is no relief — run a finger across the sign
and plate, red, and black all sit in one smooth plane. Print on a
multi-material printer (or with manual filament swaps), no glue, no
assembly.

Auto-sizing
-----------

The plate **sizes itself to the text**. Set `base_size` (the base font
height) and `margin`; the plate grows to the widest line plus the stacked
height of all lines, so editing the copy never leaves the text cramped or
the plate oversized. Larger `base_size` ⇒ bigger sign.

At the default `base_size = 13`, the plate is about 242 × 163 mm. Lower
`base_size` if you need it to fit a smaller bed.

Parts
-----

| File | Description | Material |
|------|-------------|----------|
| `assembled.3mf` | Three-color sign (plate + red + black inlays) | Three filaments — white plate, red headline, black body |

Hardware
--------

None — single print.

Library
-------

`property-sign-lib.scad` holds all geometry and parameters. It depends on
[BOSL2](https://github.com/BelfrySCAD/BOSL2) and on OpenSCAD's
`textmetrics()` built-in, which the gallery build enables via
`--enable=textmetrics`. This requires a recent OpenSCAD (the devshell pins
`openscad-unstable`); the 2021.01 stable release does not support it.

See [CLAUDE.md](CLAUDE.md) for conventions and editing rules.
