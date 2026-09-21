# collar-slide-tag

A slide-on pet nameplate: a rounded rectangular block with a
through-slot that the collar strap threads into. The name is recessed
into the top face. Distinct from `collar-tag`, which is the *dangling*
split-ring tag — these two share no geometry.

## File layout

```
lib/
  collar-slide-tag-lib.scad   all geometry + every shared parameter
previews/
  multicolor.scad             body + flush inlay → multicolor 3MF
  single.scad                 body with the name engraved → single-color STL
```

There is **no `parts/` directory**. Each preview *is* a complete
printable tag — `multicolor.3mf` for two filaments, `single.stl` for
one. Same lib, same parameters.

## Axes

**X runs along the strap, Y across it, Z through it**, and `z = 0` is
the bottom of the tag (it prints face up, no translation needed in the
previews). Every module in the lib assumes this. The name reads along
X, which is why X is the dimension that auto-sizes.

## Nothing is set directly except the strap

Two of the three outer dimensions are fully derived:

```
tag_w = collar_width + slot_clearance + 2 * wall_thickness
tag_h = bottom_thickness + collar_thickness + slot_clearance + top_thickness
tag_l = max(name_adv() * text_size + 2 * wall_thickness, collar_width)
```

There is deliberately **no `tag_length` / `tag_width` / `tag_height`
parameter.** The tag is a shell wrapped around the strap, so its size
falls out of the strap plus the wall thicknesses. If you add an
explicit size param you have to decide what happens when it conflicts
with the slot, and every combination that loses that fight renders a
severed tag.

`wall_thickness` does double duty: side material beside the slot *and*
the end margin around the name. That's why X uses it too.

## Text width is baked, not measured

`tag_l` has to know how wide the name renders, and OpenSCAD's
`textmetrics()` needs `--enable=textmetrics`, which the WASM customizer
does not ship. So `glyph_adv_by_font` is a baked table of per-glyph
advance widths (as a multiple of `size`) for printable ASCII 32–126,
indexed `[font_index][ord(c) - 32]`.

- **One table per face is not redundancy.** `Name` is 3.78 em in Sans
  Bold but 3.32 in Serif — sharing a table would size the plate wrong
  by up to 12%. `font_names`, `font_cap`, and `glyph_adv_by_font` are
  three parallel arrays in `font_style` enum order; **adding a font
  means adding a row to all three**, plus a branch in `font_index` and
  a label in the enum comment.
- Regenerate by echoing
  `textmetrics(chr(i), size=1000, font=f).advance[0] / 1000` for
  `i = 32..126`, and `textmetrics("H", size=1000, font=f).size[1]/1000`
  for `font_cap`.
- Only expose faces that are in **both** the Nix devshell and
  `packages/model-forge/assets/openscad.fonts.js` (the WASM bundle), or
  the CLI and customizer outputs diverge. That bundle currently ships
  Liberation Sans/Serif/Mono in regular, bold, italic and bold-italic;
  the enum exposes the six non-italic faces.
- A fixed per-character factor does **not** work here — measured
  advance ranges from 0.309 (`l` in Sans) to 1.354 (`@`). An earlier
  cut of this model used one and clipped `Name` off the end of its own
  tag.
- Kerning pairs are not applied, so `name_adv()` runs a hair wide. That
  is the safe direction; don't "fix" it.
- `text_size` divides by `font_cap[font_index]`, which is what makes
  `text_height_frac` a true fraction of the face height in every font.
  Without it a Serif tag's letters would render ~5% smaller than a Sans
  tag's for the same setting.

Out-of-range characters fall back to the nearest table entry rather
than erroring.

## Recess, not relief — and how the two colors split

The name is a **pocket**, not an emboss. `name_prism()` builds the
letters as a prism standing on the pocket floor and punching up through
the crown; the three public modules are all boolean ops against it:

| Module | Op | Result |
|---|---|---|
| `single()` | `shell() - name_prism(0)` | engraved pocket, one filament |
| `body()` | `shell() - name_prism(inlay_clearance)` | pocket opened by 0.15 mm |
| `inlay()` | `shell() ∩ name_prism(0)` | the letters that fill it |

The prism overshoots the top by `rounding + 1` **on purpose** — the top
face is rounded, not flat, so both the pocket and the inlay have to be
clipped by the shell to follow that curve. Don't replace the
intersection in `inlay()` with a flat `linear_extrude(text_thickness)`;
it would float above the crown at the edges.

`inlay_clearance` exists because the pocket walls and inlay walls are
otherwise coincident, which makes OpenSCAD drop faces. A multi-material
slicer closes the gap. Same rationale as `property-sign`.

## Edge rounding

`edge_rounding` is a **diameter** (CSS border-radius framing, as
requested) — the lib halves it into `rounding`. The blank is the hull
of eight spheres inset from the bounding-box corners, so all twelve
edges round and the outer dimensions stay exact. No BOSL2, no
`minkowski()` (which would grow the part).

`rounding` is clamped to `[0.01, min(tag_l, tag_w, tag_h)/2 - 0.01]`.
Both ends matter: `sphere(r = 0)` is degenerate, and anything past half
the smallest dimension inverts the hull. The spheres carry their own
`$fn = rounding_fn` so the previews' global `$fn = 72` doesn't make the
hull expensive.

## No external dependencies

Plain OpenSCAD — no BOSL2, no `import()`, no SVG. Keep it that way; it
means the CLI build and the WASM customizer can't diverge, and there's
nothing to keep in sync across the two font/library injection paths.

## `include` vs `use`

Consumers use `include <../lib/collar-slide-tag-lib.scad>;` — the lib
has top-level parameters the customizer must see in the consumer's
scope, and no top-level render calls, so `include` is safe.

## Editing rules

- **Don't redefine lib parameters in the previews.** Customizer values
  live in the lib's `BEGIN_PARAMS` block.
- **Don't `translate()` in the previews.** `body()` and `inlay()` are
  already registered against each other and sit on `z = 0`.
- **Don't add an explicit tag-size parameter** — see above.
- **`text_thickness > top_thickness` breaks the letters through into
  the slot.** This is documented in the param comment rather than
  clamped, so the user sees what they asked for. If you clamp it, say
  so in the UI.
- A long name grows the tag without bound; there is no print-bed clamp.

## Build / render

```bash
# single-color preview in the OpenSCAD GUI
openscad models/collar-slide-tag/previews/single.scad

# check the derived sizes for a parameter set
openscad -D 'name="Bella"' --enable=textmetrics \
  -o /dev/null --export-format=echo models/collar-slide-tag/previews/single.scad
```

`scripts/build-models.mjs` renders `single.stl` directly and runs
`scripts/build-multicolor-3mf.mjs` for `multicolor.3mf`, which scans
the top-level `color()` calls in `previews/multicolor.scad` and emits
one mesh per color.
