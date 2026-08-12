include <../lib/ryobi-drill-holder-lib.scad>;
$fn = 64;

// One base plate (identical on all edges) with its Ryobi post and a bowtie
// key dropped into EACH of the four dovetail slots — the loose parts the
// user prints and combines. Plate blue; post two-tone; keys orange.

color("#3a7ad9") base_section();          // plate
color("#5fb3d6") post_half_A();           // post half (cyan)
color("#d65f9a") post_half_B();           // post half (pink)
color("#e8a33d") keys_for_plate_at(0);    // bowtie keys in all 4 slots
