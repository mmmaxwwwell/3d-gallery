include <../lib/ryobi-drill-holder-lib.scad>;
$fn = 64;

// THREE identical base plates SNAPPED TOGETHER with separate bowtie keys —
// the extendable vision. Each plate is the SAME part; bowtie keys (orange)
// bridge the seams between plates and also fill the outer end slots. The
// user prints N plates + 2N keys + 2N post halves and builds any length.
// Each plate a distinct color so the seams and shared keys are obvious.

plate_colors = ["#3a7ad9", "#5fb3d6", "#d65f9a"];
n = 3;

for (i = [0 : n - 1]) {
    px = (i - (n - 1) / 2) * section_width;
    translate([px, 0, 0]) {
        color(plate_colors[i]) base_section();
        color("#cfcfcf") { post_half_A(); post_half_B(); }
    }
}

// Bowtie keys in every slot across the whole run (seam keys are shared by
// the two plates they join). Drawn once per unique X so they don't double.
for (xc = [ -n * section_width / 2,                       // far-left end
            for (i = [0 : n - 1]) (i - (n - 1) / 2) * section_width + section_width / 2 ]) // each right edge
    for (y = [-bowtie_y_off, bowtie_y_off])
        translate([xc, y, 0])
            color("#e8a33d") _seated_key();
