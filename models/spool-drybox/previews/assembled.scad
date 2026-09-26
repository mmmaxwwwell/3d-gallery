include <../lib/spool-drybox-lib.scad>;
$fn = 40;

// One module with a spool seated, the lid lifted clear. The gaps at the
// top and under the spool are where the spring and roller modules go.
color("#ffdb27") module_walls();
color("#51ff30") module_panels(lid_lift = 40);
color("#ff33ce") module_wall_gaskets();
color("#ff7fe0") module_panel_gaskets(lid_lift = 40);
color("#8a8f98") spool();
