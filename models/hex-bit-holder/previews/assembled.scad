include <../lib/hex-bit-holder-lib.scad>;
$fn = 100;

// Show one of each size (3–10 bits) spaced along Y.
module _holder_row(count) {
    _length = (count - 1) * hole_spacing + 2 * end_margin;
    difference() {
        _rounded_box(_length, block_depth, block_height, _r);
        for (j = [0 : count - 1])
            translate([-_length/2 + end_margin + j * hole_spacing, 0, 0])
                _hex_hole();
    }
    for (j = [0 : count - 1])
        translate([-_length/2 + end_margin + j * hole_spacing, 0, 0])
            _hex_detents();
}

spacing_y = block_depth + 5;

for (idx = [0:7])
    translate([0, idx * spacing_y, 0])
        color("#3a7ad9") _holder_row(idx + 3);
