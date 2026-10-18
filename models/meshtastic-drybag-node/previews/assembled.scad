include <../lib/meshtastic-drybag-node-lib.scad>;
$fn = 40;
color("#2f3542") frame();
color("#747d8c") doors();
color("#a29bfe") stem();
color("#ffa502") reels();
color("#e1b12c") drive();
color("#a4b0be") cradles();
color("#ced6e0") { fairlead_sets(); panel_plate(1); panel_plate(-1); }
color("#f1f2f6") all_rollers();
color("#3742fa") panel();
color("#57606f") antenna();
color("#dfe4ea") solar_connector();
