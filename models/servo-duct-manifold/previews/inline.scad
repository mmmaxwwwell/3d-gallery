include <../lib/servo-duct-manifold-lib.scad>;
$fn = 96;

// One valve section with a spigot adapter bolted under it; the servo is a stand-in.
color("#ffdb27") valve_body();
color("#ff7d1f") valve_disc_placed(preview_open);
color("#ff33ce") valve_coupler_placed(preview_open);
color("#51ff30") inline_adapter();
color("#8a8f98") sg90(preview_open);
