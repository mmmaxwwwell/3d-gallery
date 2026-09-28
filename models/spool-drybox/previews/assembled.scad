include <../lib/spool-drybox-lib.scad>;
$fn = 40;

// One module with a spool seated on its rollers, the lid swung open on its
// hinge and the latch lever thrown.
color("#ffdb27") module_walls(open = 70);
color("#51ff30") module_panels(open = 70);
color("#1fedff") module_ear_plates(open = 70);
color("#ff7d1f") module_rollers(open = 70);
color("#9b5cff") module_latch(open = 90);
color("#ff33ce") module_wall_gaskets(open = 70);
color("#ff7fe0") module_panel_gaskets(open = 70);
color("#8a8f98") spool();
