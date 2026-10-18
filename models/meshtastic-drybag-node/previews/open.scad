include <../lib/meshtastic-drybag-node-lib.scad>;
$fn = 40;
color("#2f3542") frame();
color("#eccc68") for (x = strap_xs) battery_strap(x);
color("#7bed9f") cell();
color("#57606f") antenna();
color("#2ed573") boards();
color("#ff6348") motors();
color("#ffa502") { spool(); spool_left(); }
color("#a4b0be") { front_plate(); rear_plate(); }
color("#ced6e0") { for (b = xbars()) xbar(b); panel_rib(1); panel_rib(-1); }
