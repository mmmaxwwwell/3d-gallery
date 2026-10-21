include <../lib/solar-node-lib.scad>;
$fn = 40;
// Hanging upright, panel toward the viewer, antennas down, cables leaving
// the horns at the top. The frame, with the panel glued in and the bezel
// on, pulled 40 mm forward off the tray so the inside shows; the winch deck
// behind.
lift = 40;
module upright() { rotate([90, 0, 0]) children(); }
upright() {
  color("#3d4a3a") tray();
  color("#5f7a5a") shelf_in_place();
  color("#c08a3e") frame_in_place(lift);
  color("#3d4a3a") bezel_in_place(lift);
  color("#e07b39") gasket_in_place(lift);
  color("#1b2a4a") ref_panel(lift);
  color("#d9d9d9") ref_glue(lift);
  color("#e8c547") ref_battery();
  color("#7a3fb0") ref_boards();
  color("#c9a227") { ref_bulkhead(); ref_sma(); }
  color("#222222") ref_pole();
  color("#4a6a8a") for (k = [0, 1]) hood_in_place(k);
  color("#4a6a8a") deck_in_place();
  color("#d0d0d0") for (k = [0, 1]) spool_in_place(k);
  color("#b8862e") for (k = [0, 1]) pinion_in_place(k);
  color("#e07b39") { for (k = [0, 1]) shaft_seal_in_place(k); shroud_seal_in_place(); }
  color("#708090") ref_motors();
  color("#555555") { ref_bearings(); ref_guide_bearings(); for (k = [0, 1]) spacer_in_place(k); }
  color("#8a8f94") { ref_cable(); ref_cable_runs(); }
}
