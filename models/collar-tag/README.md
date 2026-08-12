Pet Collar Tag
==============

A two-color pet collar tag — pick a body shape, type a name, and print.
Runs as a single multi-material job on any two-color printer (or with a
manual filament swap at `thickness` mm), so there's no glue, no
assembly, and the text can't wear off.

Set the parameters in the customizer:

- **shape** — `circle`, `hexagon`, or `bean`.
- **tag_text** — the name. Keep it short (3–6 chars fit best); longer
  strings shrink to stay inside the border.
- **size_mult** — scales the body up or down (1.0 default). The ring
  stays fixed so it still fits a standard split ring.
- **thickness** — body thickness in mm (2.5 default).
- **emboss_height** — how far the text + edge rise in the accent color
  (0.6 default; keep it a whole multiple of your layer height).
- **ring_od** / **ring_id** — outer / inner diameter of the attachment
  ring in mm (10 / 5 default).

Parts
-----

| File | Description | Material |
|------|-------------|----------|
| `assembled.3mf` | Two-color tag (body + embossed name & edge) | Two filaments — body + accent |

Hardware
--------

- 1× split ring or S-hook (sized to your `ring_id`) to attach the tag
  to a collar.

Library
-------

`collar-tag-lib.scad` holds all geometry and parameters. It depends on
[BOSL2](https://github.com/BelfrySCAD/BOSL2) via `include <>`. Install
into your OpenSCAD library path before rendering locally.

See [CLAUDE.md](CLAUDE.md) for the two-color split, shape system, and
editing rules.
