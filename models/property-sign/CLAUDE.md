# property-sign

A three-color, flush-inlay property warning sign. White rounded plate;
"Private Property" / "No Trespassing" in red; the rest in black. The plate
auto-sizes to the text.

## File layout

```
lib/
  property-sign-lib.scad   all geometry + every shared parameter + the copy
previews/
  assembled.scad           colored plate + red + black inlays → multicolor 3MF
```

There is **no `parts/` directory**. The sign is a single multi-material
print; the three colors interlock in X/Y, so splitting into per-color STLs
would lose the flush registration. The only build output is `assembled.3mf`.

## Flush three-color split (X/Y, not Z)

Unlike qr-sign (which stacks colors in Z so the QR rises proud), this sign
has **no relief**. The split is in X/Y and every color is coplanar at the
top face:

- **`plate_with_pocket()`** — the white plate with the union of all text cut
  as a recess `text_h` deep into the top face.
- **`red_inlay()` / `black_inlay()`** — the letters of each color, extruded
  to exactly fill the recess so their top face is flush with the plate top.

`text_h` (default 1.2 mm) is the recess depth = the color depth. Keep it a
clean multiple of your layer height so the multi-material swap lands on a
layer boundary.

## Auto-sizing (textmetrics)

The plate footprint is computed, not fixed:

- `base_size` is the base font height; each line is `base_size * rel_size`.
- `line_w(i)` measures each line's real glyph width with `textmetrics()`.
- `block_w` = widest line; `block_h` = summed line heights + gaps.
- `plate_w = block_w + 2*margin`, `plate_d = block_h + 2*margin`. No clamp.

Because widths scale linearly with `base_size`, changing the font size (or
the `margin`) rescales the plate correctly with no other edits.

### textmetrics requires a recent OpenSCAD

`textmetrics()` is gated behind `--enable=textmetrics` and only exists in
post-2021 OpenSCAD. The gallery build passes the flag (see
`scripts/build-models.mjs` and `scripts/build-multicolor-3mf.mjs`), and the
devshell pins `openscad-unstable` in `flake.nix`. The 2021.01 stable
release silently treats `textmetrics` as an unknown function (width →
`undef`), which breaks auto-sizing — do not downgrade.

## Editing the copy

The five messages live in the `lines` array in the lib:

```
lines = [ ["text", "red"|"black", rel_size], ... ];
```

- Add/remove/reword lines freely — the plate re-fits automatically.
- `rel_size` scales a line relative to `base_size` (headlines are 1.55, the
  small qualifier line is 0.60).
- Use only `"red"` or `"black"` as the color — those are the two inlay
  meshes the preview emits. Adding a third color name means adding a matching
  `color(...) inlay(...)` line to the preview and a legend entry in the
  manifest.

## Editing rules

- **Don't redefine lib parameters in `previews/assembled.scad`.** Customizer
  values live in the lib's `BEGIN_PARAMS` block.
- **Don't `translate()` in the preview.** The inlays are already registered
  in Z (their top face is flush with the plate top).
- **Keep the inlay and pocket depth identical (`text_h`).** If they diverge
  the inlay either floats above or sinks below the surface — the whole point
  is that it's flush.

## Build / render

```bash
# full preview (single-color, for a quick GUI check)
openscad --enable=textmetrics -o build/assembled.stl previews/assembled.scad
```

The gallery's `build-models.mjs` runs `build-multicolor-3mf.mjs` for the
`assembled.3mf` entry, which scans top-level `color()` calls and emits one
mesh per color into a single multicolor 3MF.
