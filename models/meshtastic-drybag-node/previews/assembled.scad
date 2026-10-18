include <../lib/meshtastic-drybag-node-lib.scad>;
$fn = 40;
color("#2f3542") frame();
color("#747d8c") cover();
color("#ffa502") { spool(); spool_left(); }
color("#a4b0be") { front_plate(); rear_plate(); }
color("#ced6e0") { for (b = xbars()) xbar(b); panel_plate(1); panel_plate(-1); }
color("#3742fa") panel();
color("#57606f") antenna();
color("#f1f2f6") solar_connector();
color("#eccc68") battery_cup();
color("#a4b0be") mast();
