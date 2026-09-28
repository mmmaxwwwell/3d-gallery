include <../lib/spool-drybox-lib.scad>;
$fn = 40;

// Plate 4: the base's back and underneath panels standing on end, nested,
// and the front ear plate, their gaskets printed in.
color("#51ff30") plate_base_panels("panels");
color("#ff7fe0") plate_base_panels("gaskets");
