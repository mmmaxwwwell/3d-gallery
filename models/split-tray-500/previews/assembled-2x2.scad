include <../lib/split-tray-500-lib.scad>;
$fn = 40;

color("#00eaff") cell(0, 0);
color("#39ff14") cell(1, 0);
color("#ff6b00") cell(0, 1);
color("#ff2e6e") cell(1, 1);

// Preview-local override — the customizer parses these too, so the
// preview always renders 2×2 regardless of the split value the user
// has picked in the UI. Users switch previews to swap N.
split = 2;
