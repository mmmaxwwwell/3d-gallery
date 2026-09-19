include <../lib/under-desk-cord-protector-lib.scad>;
$fn = 40;

// Three segments as installed, one for each optional prop: the solid panel,
// the hex screen, and a row of narrow beams. The middle segment is the
// screened cradle, so the hex pair reads together. color() stays at the top
// level so the multicolor 3MF builder can split per filament.

color("#00eaff") rotate([90, 0, 0]) segment();
color("#2b5cff") rotate([90, 0, 0]) translate([0, 0, segment_length]) segment_screen();
color("#00eaff") rotate([90, 0, 0]) translate([0, 0, 2 * segment_length]) segment();

color("#ff6b00") rotate([90, 0, 0]) prop_panel();
color("#39ff14") rotate([90, 0, 0]) translate([0, 0, segment_length]) prop_screen();

// Beams sit centred on the cradle's bolt pilots.
color("#a021ff") rotate([90, 0, 0])
    translate([0, 0, 2 * segment_length + 15 - prop_beam_width / 2]) prop_beam();
color("#a021ff") rotate([90, 0, 0])
    translate([0, 0, 2 * segment_length + 75 - prop_beam_width / 2]) prop_beam();
color("#a021ff") rotate([90, 0, 0])
    translate([0, 0, 2 * segment_length + 135 - prop_beam_width / 2]) prop_beam();
