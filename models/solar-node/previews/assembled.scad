include <../lib/solar-node-lib.scad>;
$fn = 40;
// The frame, with the panel glued in and the bezel on, lifted 40 mm off the
// tray so the inside shows.
lift = 40;
color("#3d4a3a") tray();
color("#5f7a5a") shelf_in_place();
color("#c08a3e") frame_in_place(lift);
color("#3d4a3a") bezel_in_place(lift);
color("#e07b39") gasket_in_place(lift);
color("#1b2a4a") ref_panel(lift);
color("#d9d9d9") ref_glue(lift);
color("#e8c547") ref_battery();
color("#7a3fb0") ref_boards();
color("#c9a227") ref_bulkhead();
