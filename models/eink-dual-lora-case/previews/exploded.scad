include <../lib/eink-dual-lora-case-lib.scad>;
$fn = 40;
// Standing up, every layer pulled apart along the depth, front toward the
// viewer: cover; display, GPS antenna and front buttons; speaker and sensor;
// midframe with the XIAO; the side switch cradles (slid inward) and buttons
// (slid outward); battery; radio 1 and the GNSS board; radio 2, motor and
// amp; tub.
color("#3d4a3a") upright() translate([0, 0, -150]) front_cover();
color("#bfe6ff") upright() translate([0, 0, -150]) ref_disc();
color("#e07b39") upright() translate([0, 0, -125]) for (y = fb_y) fbutton_in_place(y, "tpu");
color("#d9d9d9") upright() translate([0, 0, -125]) for (y = fb_y) fbutton_in_place(y, "stem");
color("#141414") upright() translate([0, 0, -105]) ref_display_board();
color("#e6e4dc") upright() translate([0, 0, -105]) ref_display_panel();
color("#a0522d") upright() translate([0, 0, -105]) ref_gps();
color("#8a6a3a") upright() translate([0, 0, -105]) for (y = fb_y) fcradle_in_place(y);
color("#555555") upright() translate([0, 0, -105]) ref_front_switches();
color("#2a6fdb") upright() translate([0, 0, -80]) ref_speaker();
color("#b03a6f") upright() translate([0, 0, -80]) ref_sensor();
color("#c08a3e") upright() translate([0, 0, -50]) midframe();
color("#7a3fb0") upright() translate([0, 0, -50]) ref_xiao();
color("#8a6a3a") upright() translate([18, 0, -15]) for (y = btn_y) cradle_in_place(y);
color("#555555") upright() translate([18, 0, -15]) ref_switches();
color("#e07b39") upright() translate([-24, 0, -15]) for (y = btn_y) button_in_place(y, "tpu");
color("#d9d9d9") upright() translate([-24, 0, -15]) for (y = btn_y) button_in_place(y, "stem");
color("#e8c547") upright() translate([0, 0, -15]) ref_battery();
color("#7a3fb0") upright() translate([0, 0, 15]) { ref_radio1(); ref_gnss(); }
color("#7a3fb0") upright() translate([0, 0, 35]) ref_radio2();
color("#708090") upright() translate([0, 0, 35]) ref_motor();
color("#1e8f5a") upright() translate([0, 0, 55]) ref_amp();
color("#3d4a3a") upright() translate([0, 0, 85]) tub();
color("#c9a227") upright() translate([0, 0, 85]) ref_smas();
