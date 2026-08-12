include <../lib/ryobi-drill-holder-lib.scad>;
$fn = 64;

// SOLID 3-post row — one continuous, NON-extendable plate (plain outer
// edges, no puzzle connectors), three posts. This is the "print it as one
// rigid bar" option. Plate blue; posts two-tone to show the split.

n = 3;

color("#3a7ad9") solid_row_plate(n);

for (i = [0 : n - 1])
    translate([(i - (n - 1) / 2) * section_width, 0, 0]) {
        color("#5fb3d6") post_half_A();
        color("#d65f9a") post_half_B();
    }
