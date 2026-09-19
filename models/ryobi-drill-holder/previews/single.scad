include <../lib/ryobi-drill-holder-lib.scad>;
$fn = 64;

// One base plate (identical on all edges) with its Ryobi post and a bowtie
// key dropped into EACH of the four dovetail slots — the loose parts the
// user prints and combines. Plate blue; post two-tone; keys orange.

color("#00eaff") base_section();          // plate
color("#39ff14") post_half_A();           // post half (cyan)
color("#ff17c7") post_half_B();           // post half (pink)
color("#ffd60a") keys_for_plate_at(0);    // bowtie keys in all 4 slots
