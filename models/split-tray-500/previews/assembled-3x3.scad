include <../lib/split-tray-500-lib.scad>;
$fn = 40;

color("#00eaff") cell(0, 0);
color("#00ffa3") cell(1, 0);
color("#39ff14") cell(2, 0);
color("#a021ff") cell(0, 1);
// center cell (1, 1) is empty unless a base is used
color("#ffd60a") cell(2, 1);
color("#ff2d55") cell(0, 2);
color("#ff6b00") cell(1, 2);
color("#ff17c7") cell(2, 2);

// Preview-local override — see assembled-2x2.scad. Users switch
// previews to swap N.
split = 3;
