# Parametric Shelf

An open-frame shelf printed as a single piece: two side walls capped by a solid top plate, open at the front, back, and bottom. Each side wall has solid support columns at its four corners with a hexagon-lattice window between them. Triangular gussets brace each of the four internal top corners where the side walls meet the top plate.

## Parameters (customizable)

| Param             | Meaning                                                                | Default |
|-------------------|------------------------------------------------------------------------|---------|
| `hex_size`        | Flat-to-flat width of a hex cell (mm)                                  | 15      |
| `height`          | Overall outer height (mm)                                              | 100     |
| `width`           | Overall outer width — the shelf's long horizontal "length" (mm)        | 200     |
| `depth`           | Front-to-back depth (mm)                                               | 100     |
| `top_thickness`   | Thickness of the solid top plate (mm)                                  | 5       |
| `wall_thickness`  | Thickness of each side wall — hex face and corner columns (mm)         | 5       |
| `gusset_length`   | Leg length of the internal corner support gussets (mm); 0 disables     | 20      |

Fixed in the lib (change there to tweak the design itself):

- `column_size = 12` — width of the solid corner columns / frame around the hex window
- `hex_wall = 2` — wall thickness between hex cells

## One piece, one STL

The whole shelf is a single connected part — `shelf.stl`. No separate pieces to glue, no hardware. Orient in your slicer however suits your printer (top plate face-down on the bed is usually the cleanest — the hex-lattice through-holes become short horizontal bridges in the vertical walls, and the gussets sit as small triangular fins on the bed).
