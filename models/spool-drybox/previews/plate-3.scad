include <../lib/spool-drybox-lib.scad>;
$fn = 40;

// Plate 3: all four panels standing on end, nested, their seam gaskets
// printed in.
color("#51ff30") plate_panels("panels");
color("#ff7fe0") plate_panels("gaskets");
