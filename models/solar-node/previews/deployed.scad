include <../lib/solar-node-lib.scad>;
$fn = 40;
// Deployed: hanging on its cables with the lid shut, the mast run out to
// 3 m with its stabilising bars, LMR-400 up to two N omnis at the top.
module upright() { rotate([90, 0, 0]) children(); }
upright() {
  color("#3d4a3a") { tray(); bezel_in_place(); }
  color("#c08a3e") frame_in_place();
  color("#1b2a4a") ref_panel();
  color("#4a6a8a") { deck_in_place(); for (k = [0, 1]) hood_in_place(k); for (m = [0, 1]) door_in_place(m); }
  color("#6a8aaa") for (m = [0, 1]) horn_in_place(m);
  color("#555555") ref_guide_bearings();
  color("#8a8f94") { ref_cable_runs(); ref_cables_up(); }
  color("#222222") ref_mast();
  color("#b0b0b0") ref_bars();
  color("#111111") ref_lmr400();
  color("#e8e8e8") ref_antennas();
}
