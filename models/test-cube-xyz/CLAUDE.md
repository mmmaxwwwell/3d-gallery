# XYZ test cube — agent notes

Diagnostic model. Single STL part; no multicolor preview.

- Origin is the cube's centroid (`center = true` on the cube). This is deliberate: the print sits centered on `(0, 0, 0)`, which matches OrcaSlicer's default object placement and stresses the slicer's coordinate handling.
- Letter placement is inside the boolean subtraction — `_letter()` extrudes the glyph a tiny bit deeper than `letter_depth` so the boolean cleanly exits the far face. Don't reduce that safety margin.
- If the letters ever render as slabs sticking out of the cube, the sign of `face_offset` in one of the `_letter()` calls is wrong. The offset should be inside the cube by `letter_depth` — the extrusion adds the depth back going outward.
- `edge_chamfer` uses `minkowski()` with a sphere — slow at high `$fn`. If a customizer version is ever needed, lower `$fn` for the sphere or replace with a `hull()` of cubes.
- No `customizable: true` in the manifest — this is a static diagnostic, not user-tuned.
