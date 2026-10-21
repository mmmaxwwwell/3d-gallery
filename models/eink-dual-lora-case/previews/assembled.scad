include <../lib/eink-dual-lora-case-lib.scad>;
$fn = 40;
// Standing up, front toward the viewer (-Y), front cover pulled forward 30 mm
// so the inside shows.
color("#3d4a3a") upright() translate([0, 0, -30]) front_cover();
color("#3d4a3a") upright() tub();
color("#c08a3e") upright() midframe();
color("#8a6a3a") upright() for (y = btn_y) cradle_in_place(y);
color("#e07b39") upright() for (y = btn_y) button_in_place(y, "tpu");
color("#d9d9d9") upright() for (y = btn_y) button_in_place(y, "stem");
color("#141414") upright() ref_display_board();
color("#e6e4dc") upright() ref_display_panel();
color("#7a3fb0") upright() ref_boards();
color("#2a6fdb") upright() ref_speaker();
color("#b03a6f") upright() ref_sensor();
color("#bfe6ff") upright() ref_disc();
color("#1e8f5a") upright() ref_amp();
color("#e8c547") upright() ref_battery();
color("#555555") upright() ref_switches();
color("#c9a227") upright() ref_smas();
