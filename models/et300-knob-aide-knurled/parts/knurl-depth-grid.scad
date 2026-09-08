include <../lib/et300-knob-aide-knurled-lib.scad>;
$fn = 40;

// Print-in-place comparison plate: seven copies of tactile_aide() with
// knurl_depth swept from 2.0 → 5.0 in 0.5 mm steps. Same footprint for
// each (outer_diameter is unchanged), laid out on a 4×2 grid centered
// on the origin with one empty slot.
_depths = [2, 2.5, 3, 3.5, 4, 4.5, 5];
_pitch  = outer_diameter + 4;   // 4 mm gap between adjacent parts
_cols   = 4;
_rows   = ceil(len(_depths) / _cols);

for (i = [0 : len(_depths) - 1]) {
    row = floor(i / _cols);
    col = i % _cols;
    x = (col - (_cols - 1) / 2) * _pitch;
    y = ((_rows - 1) / 2 - row) * _pitch;
    translate([x, y, 0])
        tactile_aide(kd = _depths[i]);
}
