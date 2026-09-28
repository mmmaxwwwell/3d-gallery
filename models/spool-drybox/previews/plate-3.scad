include <../lib/spool-drybox-lib.scad>;
$fn = 40;

// Plate 3: the lid's two panels standing on end, nested, their seam
// gaskets printed in.
color("#51ff30") plate_lid_panels("panels");
color("#ff7fe0") plate_lid_panels("gaskets");
