include <../lib/filament-spool-roller-lib.scad>;
$fn = 40;

// Fit test: every mating feature at full size on one throwaway plate.
color("#ffd60a") plate_fit_walls();
color("#ff6b00") plate_fit_roller();
color("#39ff14") plate_fit_beam();
color("#c0c4cc") plate_fit_small();
color("#ff17c7") plate_fit_peg();
color("#00eaff") plate_fit_dovetail();
