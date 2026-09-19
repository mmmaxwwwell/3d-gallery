// XYZ test cube — small calibration/diagnostic cube with the letters X, Y,
// and Z engraved on the +X, +Y, and +Z faces respectively. Great for a
// first slice-and-print sanity check because you can immediately verify the
// printer's coordinate system by looking at which face landed where.

// BEGIN_PARAMS
// Outer edge length of the cube (mm).
cube_size = 30;

// Engraving depth (mm) — how deep the letters cut into the cube face.
letter_depth = 1.5;

// Font size for the letters (mm).
letter_size = 16;

// Optional chamfer on top+bottom edges (mm). Set to 0 for a hard cube.
edge_chamfer = 0.8;
// END_PARAMS

$fn = 40;

module _cube_with_chamfer() {
  if (edge_chamfer <= 0) {
    cube(cube_size, center = true);
  } else {
    minkowski() {
      cube(cube_size - 2 * edge_chamfer, center = true);
      sphere(r = edge_chamfer);
    }
  }
}

module _letter(char, face_offset, rot) {
  // linear_extrude a bit deeper than letter_depth so the boolean cleanly
  // exits the far face and doesn't leave a paper-thin skin.
  translate(face_offset)
    rotate(rot)
      linear_extrude(height = letter_depth + 0.5, center = false)
        text(char,
             size = letter_size,
             halign = "center",
             valign = "center",
             font = "Liberation Sans:style=Bold");
}

module test_cube_xyz() {
  difference() {
    _cube_with_chamfer();

    // X on the +X face — extrude along Z, then rotate so the extrusion axis
    // ends up pointing along +X.
    _letter("X",
            [cube_size / 2 - letter_depth, 0, 0],
            [90, 0, 90]);

    // Y on the +Y face — rotate so extrusion axis ends up along +Y.
    _letter("Y",
            [0, cube_size / 2 - letter_depth, 0],
            [90, 0, 0]);

    // Z on the +Z face — no rotation needed, native linear_extrude direction.
    _letter("Z",
            [0, 0, cube_size / 2 - letter_depth],
            [0, 0, 0]);
  }
}
