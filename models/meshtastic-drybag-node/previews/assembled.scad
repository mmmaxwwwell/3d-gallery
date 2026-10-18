include <../lib/meshtastic-drybag-node-lib.scad>;
$fn = 40;
color("#2f3542") frame();
color("#eccc68") for (x = strap_xs) battery_strap(x);
color("#747d8c") cover();
color("#ffa502") { spool(); spool_left(); }
color("#a4b0be") rear_frame();
color("#57606f") antenna();
color("#3742fa") panel();
color("#ced6e0") solar_connector();
