include <../lib/meshtastic-drybag-node-lib.scad>;
$fn = 40;
color("#2f3542") frame();
color("#eccc68") for (x = strap_xs) battery_strap(x);
color("#747d8c") cover();
color("#ffa502") { spool(); spool_left(); }
color("#a4b0be") { front_plate(); rear_plate(); bottom_plate(); }
color("#ced6e0") { for (x = rib_xs) rib(x); panel_rib(1); panel_rib(-1); }
color("#dfe4ea") solar_mount();
color("#3742fa") panel();
color("#57606f") antenna();
color("#f1f2f6") solar_connector();
