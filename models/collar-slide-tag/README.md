Slide-On Collar Tag
===================

A pet nameplate that threads onto the collar itself. The strap passes
through a slot in the tag, so there's no split ring, nothing dangling,
and nothing to jingle against a water bowl at 3am.

The tag sizes itself. Tell it how wide and thick your strap is and it
wraps around that; type a name and the plate grows to fit the letters.
The name is recessed into the top face and every edge is rounded, so
nothing catches on fur.

Measure your collar first
-------------------------

Measure the **strap**, not the buckle, and not the label on the packet.
`collar_width` is how tall the webbing is; `collar_thickness` is how
thick. The tag adds a 0.6 mm slip fit on each so it still slides after
printing.

| Collar | `collar_width` | `collar_thickness` |
|--------|---------------:|-------------------:|
| 1 in nylon / biothane (large dog) | 25 | 3 |
| 3/4 in nylon (medium dog) | 19 | 2.5 |
| 5/8 in webbing (small dog / cat) | 16 | 1.5 |

Parameters
----------

- **name** — what goes on the tag (`Name` default). The tag's *length*
  grows to fit it; a one-letter name still gets a tag at least as long
  as the strap is wide.
- **font_style** — `Sans Bold` (default), `Sans`, `Serif Bold`,
  `Serif`, `Mono Bold`, or `Mono`. The tag re-measures itself for
  whichever you pick, and the letters stay the same height across all
  six, so switching fonts changes the look and the tag's length — never
  how big the name reads.
- **collar_width** / **collar_thickness** — your strap, in mm
  (25 / 3 default). These set the tag's face height and total
  thickness; you don't set those directly.
- **wall_thickness** — material each side of the slot, in mm (3
  default). Doubles as the end margin around the name.
- **top_thickness** / **bottom_thickness** — material above and below
  the slot, in mm (1.6 / 1.6 default). The top is the face the name is
  cut into, so keep it thicker than `text_thickness`.
- **text_thickness** — how deep the name is recessed, in mm (0.6
  default). On the multicolor version this is also the inlay height,
  so keep it a whole multiple of your layer height.
- **edge_rounding** — diameter of the rounded edges, in mm (3
  default) — a CSS border-radius, applied to every edge of the tag.
  Clamped to whatever the tag's smallest dimension can take.

At the defaults the tag comes out 62.3 x 31.6 x 6.8 mm. Only the
length changes with the name and font; the other two are set by your
strap.

Parts
-----

| File | Description | Material |
|------|-------------|----------|
| `multicolor.3mf` | Tag body + name inlay, flush | Two filaments — body + accent |
| `single.stl` | Same tag, name engraved | One filament |

Both are the complete tag — pick one, not both.

Printing
--------

Prints flat on the bed, name up, no supports. The slot ceiling is a
bridge the width of your strap (25.6 mm at the defaults), which any
printer handles, but a slow first bridging layer gives a cleaner
channel.

On the multicolor version the filament swap happens `text_thickness`
below the top surface, so keep that a whole multiple of your layer
height (0.6 mm = 3 layers at 0.2 mm) and the swap lands on a clean
layer boundary. The inlay's top face is exactly flush with the plate —
run a finger across the finished tag and you feel one smooth surface.

Hardware
--------

None. Thread the collar through before you buckle it on.

Library
-------

`lib/collar-slide-tag-lib.scad` holds all geometry and parameters, and
has no external dependencies — plain OpenSCAD, no BOSL2.
